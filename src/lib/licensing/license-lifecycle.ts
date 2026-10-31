// License lifecycle service — epicRider Phase 5-D (ADR-025; REQ-098).
//
// MESIN TRANSISI LISensi deterministik, fail-closed, tanpa scheduler.
//
// Sumber kontrak (tidak ada nilai yang dikarang):
// - DMC §6.2 (REQ-098): purchase→active→renewal→expiry→grace→downgrade dengan
//   RENEWAL_DUE (DMC/PHASE_2_TRACEABILITY). Delapan aksi kanonik eksekusi
//   5-D: ACTIVATE, RENEW, TERM_END, GRACE_ENTER, RENEW_IN_GRACE, GRACE_END,
//   DOWNGRADE, REACTIVATE. Semua pasangan (status, action) lain DITOLAK
//   fail-closed — termasuk `EXPIRED → ACTIVE` (tidak ditambahkan hanya karena
//   intuitif) dan `PURCHASED → DOWNGRADED` (ambiguitas owner belum
//   diselesaikan; DOWNGRADE hanya sah dari ACTIVE).
// - Durasi/aturan term/renewal window/grace = OD-108 OPEN. Modul ini TIDAK
//   MENGHITUNG term/window/grace dan TIDAK MENJADULKAN apa pun: `now`
//   disuplai pemanggil, verifikasi waktu bersifat VERIFY-ONLY terhadap data
//   tersimpan (bila batas tersimpan dan belum tercapai → tolak), dan semua
//   tanggal baru yang ditulis adalah DATA YANG DISUPLAI pemanggil (alur
//   issuance/renewal), bukan hasil perhitungan modul ini.
// - Entitlement: HANYA status ACTIVE yang menjadi sumber entitlement
//   (ENTITLEMENT_MODEL §4; engine 5-C membaca status — GRACE/RENEWAL_DUE/
//   EXPIRED/DOWNGRADED tidak pernah meng-grant; OD-108 OPEN, tanpa semantik
//   grace tambahan yang dikarang).
// - REQ-099: DOWNGRADE/REMOVAL tidak menghapus data. DOWNGRADE tidak mengubah
//   tierId dan tidak menyentuh data tenant lain; pemulihan via REACTIVATE.
// - Konkurensi/idempotensi (ADR-017): optimistic — update kondisional pada
//   status terbaca dalam satu transaksi; konflik = DENIAL eksplisit (bukan
//   silent last-write-wins). Invariant "tepat satu ACTIVE per workspace"
//   ditegakkan DB (partial unique index migration 5-B) + pemeriksaan service.
//   Idempotensi = state-convergence: retry identik pada aksi state-arrival
//   menghasilkan no-op SUKSES (bukan duplikasi efek); replay-cache fisik
//   menunggu OD-01 (ADR-017) — keterbatasan ini dinyatakan jujur di ADR-025.
// - Audit: transisi sukses + audit ditulis ATOMIK dalam satu transaksi;
//   denial diaudit (first-class). Audit tidak pernah mengubah keputusan.

import type { PrismaClient, Prisma } from "@prisma/client";

import { AuditOutcome } from "@/lib/audit/audit-service";

import {
  LICENSE_ACTION_AUTHORIZATION,
  LicenseLifecycleAction,
  LicenseLifecycleReasonCode,
  authorizeLifecycleAction,
  recordLifecycleAudit,
  type LifecycleActor,
} from "./lifecycle-shared";
import { LICENSE_STATUSES, type LicenseStatus } from "./vocabulary";

// ---------------------------------------------------------------------------
// Matriks transisi (PURE — sumber kebenaran mesin status 5-D)
// ---------------------------------------------------------------------------

export interface LicenseTransitionRule {
  from: readonly LicenseStatus[];
  to: LicenseStatus;
}

/** Delapan transisi kanonik (DMC §6.2; REQ-098). TIDAK ada transisi lain. */
export const LICENSE_TRANSITIONS: Record<
  LicenseLifecycleAction,
  LicenseTransitionRule
> = {
  ACTIVATE: { from: ["PURCHASED"], to: "ACTIVE" },
  RENEW: { from: ["RENEWAL_DUE"], to: "ACTIVE" },
  TERM_END: { from: ["ACTIVE"], to: "RENEWAL_DUE" },
  GRACE_ENTER: { from: ["RENEWAL_DUE"], to: "GRACE" },
  RENEW_IN_GRACE: { from: ["GRACE"], to: "ACTIVE" },
  GRACE_END: { from: ["GRACE"], to: "EXPIRED" },
  DOWNGRADE: { from: ["ACTIVE"], to: "DOWNGRADED" },
  REACTIVATE: { from: ["DOWNGRADED"], to: "ACTIVE" },
};

/** Aksi yang bertiba di status ACTIVE (butuh invariant tepat-satu-ACTIVE). */
const ARRIVES_ACTIVE: readonly LicenseLifecycleAction[] = [
  LicenseLifecycleAction.ACTIVATE,
  LicenseLifecycleAction.RENEW,
  LicenseLifecycleAction.RENEW_IN_GRACE,
  LicenseLifecycleAction.REACTIVATE,
];

/**
 * Efek entitlement transisi — deterministik: hanya status tujuan ACTIVE yang
 * mengaktifkan entitlement (engine 5-C membaca status LICENSE ACTIVE).
 */
export function licenseTransitionEntitlementEffect(
  action: LicenseLifecycleAction
): "ENTITLEMENT_GRANTED" | "ENTITLEMENT_NOT_GRANTED" {
  return LICENSE_TRANSITIONS[action].to === "ACTIVE"
    ? "ENTITLEMENT_GRANTED"
    : "ENTITLEMENT_NOT_GRANTED";
}

export interface LicenseTransitionEvaluation {
  ok: boolean;
  to: LicenseStatus | null;
  reasonCode: LicenseLifecycleReasonCode | null;
}

/** Evaluasi murni pasangan (status, action) — fail-closed, tanpa I/O. */
export function evaluateLicenseTransition(
  action: LicenseLifecycleAction,
  currentStatus: string
): LicenseTransitionEvaluation {
  if (!(LICENSE_STATUSES as readonly string[]).includes(currentStatus)) {
    // Status di luar vocabulary — tidak pernah dilayani (fail closed).
    return { ok: false, to: null, reasonCode: LicenseLifecycleReasonCode.DENY_LIFECYCLE_INVALID_TRANSITION };
  }
  const rule = LICENSE_TRANSITIONS[action];
  if (!(rule.from as readonly string[]).includes(currentStatus)) {
    return { ok: false, to: null, reasonCode: LicenseLifecycleReasonCode.DENY_LIFECYCLE_INVALID_TRANSITION };
  }
  return { ok: true, to: rule.to, reasonCode: null };
}

// ---------------------------------------------------------------------------
// Service transaksional
// ---------------------------------------------------------------------------

/** Data term/window yang DISUPLAI pemanggil — modul tidak pernah menghitung. */
export interface LicenseSuppliedTermData {
  purchasedAt?: Date | null;
  termStartsAt?: Date | null;
  termEndsAt?: Date | null;
  renewalWindowStartsAt?: Date | null;
}

export interface LicenseLifecycleRequest {
  licenseId: string;
  action: LicenseLifecycleAction;
  actor: LifecycleActor;
  /** Jam keputusan — disuplai pemanggil/server; modul tidak membaca jam dinding. */
  now: Date;
  /** Data term/window baru (alur issuance/renewal) — opsional, disuplai. */
  term?: LicenseSuppliedTermData;
  /** Batas grace — hanya disimpan bila disuplai (GRACE_ENTER); OD-108 OPEN. */
  graceEndsAt?: Date | null;
}

export type LicenseLifecycleResult =
  | {
      outcome: "SUCCESS";
      licenseId: string;
      action: LicenseLifecycleAction;
      from: LicenseStatus;
      to: LicenseStatus;
      idempotent: boolean;
      viaOwnerFallback: boolean;
      entitlementEffect: "ENTITLEMENT_GRANTED" | "ENTITLEMENT_NOT_GRANTED";
    }
  | {
      outcome: "DENIED";
      licenseId: string | null;
      action: LicenseLifecycleAction;
      reasonCode: string;
      viaOwnerFallback: false;
    };

export async function applyLicenseLifecycleTransition(
  db: PrismaClient,
  request: LicenseLifecycleRequest
): Promise<LicenseLifecycleResult> {
  const { action, actor, now } = request;

  // 1) Muat lisensi (fakta dari sumber tepercaya).
  const license = await db.license.findUnique({
    where: { id: request.licenseId },
    include: { tier: { select: { code: true, isActive: true } } },
  });
  if (!license) {
    await recordLifecycleAudit(db, {
      domain: "license",
      action,
      outcome: AuditOutcome.DENIED,
      actorUserId: actor.type === "USER" ? actor.userId : null,
      isSystemActor: actor.type === "SYSTEM",
      workspaceId: null,
      targetId: request.licenseId,
      reasonCode: LicenseLifecycleReasonCode.DENY_LICENSE_NOT_FOUND,
    });
    return {
      outcome: "DENIED",
      licenseId: null,
      action,
      reasonCode: LicenseLifecycleReasonCode.DENY_LICENSE_NOT_FOUND,
      viaOwnerFallback: false,
    };
  }

  const deny = async (reasonCode: string): Promise<LicenseLifecycleResult> => {
    await recordLifecycleAudit(db, {
      domain: "license",
      action,
      outcome: AuditOutcome.DENIED,
      actorUserId: actor.type === "USER" ? actor.userId : null,
      isSystemActor: actor.type === "SYSTEM",
      workspaceId: license.workspaceId,
      targetId: license.id,
      reasonCode,
      metadata: { from: license.status, action },
    });
    return {
      outcome: "DENIED",
      licenseId: license.id,
      action,
      reasonCode,
      viaOwnerFallback: false,
    };
  };

  // 2) Otorisasi aktor (deny-by-default; explicit permission only — fallback
  //    owner DIHAPUS remediasi PR #4; tanpa permission terdokumentasi → DENY).
  const authz = await authorizeLifecycleAction(db, {
    workspaceId: license.workspaceId,
    action,
    authorization: LICENSE_ACTION_AUTHORIZATION[action],
    actor,
  });
  if (!authz.allowed) {
    return deny(authz.reasonCode);
  }

  // 3) Idempotensi state-convergence (ADR-025 §8) — SEBELUM pemeriksaan
  //    matriks: replay aksi yang sudah teraplikasi adalah no-op sukses,
  //    bukan pelanggaran matriks.
  //    - aksi state-arrival: status sudah === tujuan → no-op sukses;
  //    - RENEW/RENEW_IN_GRACE: sudah ACTIVE dan termEndsAt baru sama persis
  //      dengan tersimpan → no-op sukses (replay tidak menggandakan efek);
  //      data berbeda → konflik eksplisit (bukan duplikasi efek).
  const rule = LICENSE_TRANSITIONS[action];
  const stateArrival =
    action !== LicenseLifecycleAction.RENEW && action !== LicenseLifecycleAction.RENEW_IN_GRACE;
  const idempotentSuccess = async (): Promise<LicenseLifecycleResult> => {
    await recordLifecycleAudit(db, {
      domain: "license",
      action,
      outcome: AuditOutcome.SUCCESS,
      actorUserId: actor.type === "USER" ? actor.userId : null,
      isSystemActor: actor.type === "SYSTEM",
      workspaceId: license.workspaceId,
      targetId: license.id,
      reasonCode: authz.reasonCode,
      viaOwnerFallback: authz.viaOwnerFallback,
      idempotent: true,
      metadata: { from: license.status, to: rule.to },
    });
    return {
      outcome: "SUCCESS",
      licenseId: license.id,
      action,
      from: license.status as LicenseStatus,
      to: rule.to,
      idempotent: true,
      viaOwnerFallback: authz.viaOwnerFallback,
      entitlementEffect: licenseTransitionEntitlementEffect(action),
    };
  };
  if (stateArrival && license.status === rule.to) {
    return idempotentSuccess();
  }
  if (
    !stateArrival &&
    license.status === "ACTIVE" &&
    request.term?.termEndsAt !== undefined &&
    request.term.termEndsAt !== null &&
    license.termEndsAt !== null &&
    license.termEndsAt.getTime() === request.term.termEndsAt.getTime()
  ) {
    return idempotentSuccess();
  }

  // 4) Matriks transisi — pasangan (status, action) tidak dikenal → tolak.
  const evaluation = evaluateLicenseTransition(action, license.status);
  if (!evaluation.ok || evaluation.to === null) {
    return deny(evaluation.reasonCode ?? LicenseLifecycleReasonCode.DENY_LIFECYCLE_INVALID_TRANSITION);
  }
  const to = evaluation.to;

  // 5) Verifikasi waktu VERIFY-ONLY terhadap data tersimpan (tanpa perhitungan).
  if (action === LicenseLifecycleAction.TERM_END && license.termEndsAt !== null && now < license.termEndsAt) {
    return deny(LicenseLifecycleReasonCode.DENY_TERM_NOT_ENDED);
  }
  if (action === LicenseLifecycleAction.GRACE_END && license.graceEndsAt !== null && now < license.graceEndsAt) {
    return deny(LicenseLifecycleReasonCode.DENY_GRACE_NOT_ENDED);
  }

  // 6) Prasyarat bertiba di ACTIVE: tier aktif + tepat satu ACTIVE per workspace.
  if ((ARRIVES_ACTIVE as readonly string[]).includes(action)) {
    if (!license.tier.isActive) {
      return deny(LicenseLifecycleReasonCode.DENY_TIER_INACTIVE);
    }
    const otherActive = await db.license.findFirst({
      where: { workspaceId: license.workspaceId, status: "ACTIVE", id: { not: license.id } },
      select: { id: true },
    });
    if (otherActive !== null) {
      return deny(LicenseLifecycleReasonCode.DENY_LICENSE_ACTIVE_EXISTS);
    }
  }

  // 7) Tulis perubahan status — update kondisional pada status terbaca
  //    (optimistic guard; konflik = denial eksplisit, bukan silent overwrite).
  const data: Prisma.LicenseUpdateManyMutationInput = { status: to };
  if (action === LicenseLifecycleAction.ACTIVATE) {
    if (request.term?.purchasedAt !== undefined) data.purchasedAt = request.term.purchasedAt;
    if (request.term?.termStartsAt !== undefined) data.termStartsAt = request.term.termStartsAt;
    if (request.term?.termEndsAt !== undefined) data.termEndsAt = request.term.termEndsAt;
    if (request.term?.renewalWindowStartsAt !== undefined)
      data.renewalWindowStartsAt = request.term.renewalWindowStartsAt;
  }
  if (action === LicenseLifecycleAction.TERM_END && request.term?.renewalWindowStartsAt !== undefined) {
    data.renewalWindowStartsAt = request.term.renewalWindowStartsAt;
  }
  if (action === LicenseLifecycleAction.GRACE_ENTER && request.graceEndsAt !== undefined) {
    data.graceEndsAt = request.graceEndsAt;
  }
  if (action === LicenseLifecycleAction.RENEW || action === LicenseLifecycleAction.RENEW_IN_GRACE) {
    if (request.term?.termEndsAt !== undefined) data.termEndsAt = request.term.termEndsAt;
    data.graceEndsAt = null; // penanda grace tertutup oleh renewal (diaudit)
  }

  try {
    const applied = await db.$transaction(async (tx) => {
      const updated = await tx.license.updateMany({
        where: { id: license.id, status: license.status },
        data,
      });
      if (updated.count !== 1) {
        return false;
      }
      // Audit sukses ATOMIK dengan perubahan status (satu transaksi).
      await recordLifecycleAudit(tx, {
        domain: "license",
        action,
        outcome: AuditOutcome.SUCCESS,
        actorUserId: actor.type === "USER" ? actor.userId : null,
        isSystemActor: actor.type === "SYSTEM",
        workspaceId: license.workspaceId,
        targetId: license.id,
        reasonCode: authz.reasonCode,
        viaOwnerFallback: authz.viaOwnerFallback,
        idempotent: false,
        metadata: { from: license.status, to },
      });
      return true;
    });

    if (!applied) {
      return deny(LicenseLifecycleReasonCode.DENY_CONCURRENT_MODIFICATION);
    }

    return {
      outcome: "SUCCESS",
      licenseId: license.id,
      action,
      from: license.status as LicenseStatus,
      to,
      idempotent: false,
      viaOwnerFallback: authz.viaOwnerFallback,
      entitlementEffect: licenseTransitionEntitlementEffect(action),
    };
  } catch (error) {
    // Pelanggaran invariant DB (mis. partial unique ACTIVE) → denial eksplisit.
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code: unknown }).code) : "";
    if (code === "P2002") {
      return deny(LicenseLifecycleReasonCode.DENY_LICENSE_ACTIVE_EXISTS);
    }
    throw error;
  }
}

/**
 * Resolver status lisensi efektif workspace (DATA — tanpa keputusan; pola
 * 5-C). Histori penuh + kandidat ACTIVE (invariant <= 1) + flag entitlement.
 */
export async function resolveWorkspaceLicenseState(db: PrismaClient, workspaceId: string) {
  const licenses = await db.license.findMany({
    where: { workspaceId },
    select: {
      id: true,
      status: true,
      tierId: true,
      purchasedAt: true,
      termStartsAt: true,
      termEndsAt: true,
      renewalWindowStartsAt: true,
      graceEndsAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  const activeRows = licenses.filter((l) => l.status === "ACTIVE");
  return {
    workspaceId,
    licenseRowCount: licenses.length,
    activeLicenseCount: activeRows.length,
    activeLicenseId: activeRows.length === 1 ? activeRows[0].id : null,
    entitlementSourceActive: activeRows.length === 1, // hanya ACTIVE meng-grant (5-C)
    licenses,
  };
}
