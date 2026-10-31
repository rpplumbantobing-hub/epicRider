// Extension lifecycle service — epicRider Phase 5-D (ADR-025; LICENSE_MATRIX §5).
//
// Lifecycle kanonik (LICENSE_MATRIX §5):
//   CATALOG → PURCHASED/ASSIGNED → ACTIVE → SUSPENDED/EXPIRED → RENEWED/REMOVED
//
// Aksi (enam) dan peta transisinya — semua pasangan lain DITOLAK fail-closed:
//   ASSIGN    : PURCHASED → ASSIGNED     (provisi dalam workspace)
//   ACTIVATE  : ASSIGNED → ACTIVE; RENEWED → ACTIVE   (satu-satunya status
//               yang memberi kontribusi entitlement)
//   SUSPEND   : ACTIVE → SUSPENDED       (kontribusi entitlement berhenti)
//   EXPIRE    : ACTIVE → EXPIRED; SUSPENDED → EXPIRED (verify-only termEndsAt)
//   RENEW     : SUSPENDED → RENEWED; EXPIRED → RENEWED (RENEWED TIDAK memberi
//               entitlement sampai ACTIVATE)
//   REMOVE    : {PURCHASED, ASSIGNED, ACTIVE, SUSPENDED, EXPIRED, RENEWED} →
//               REMOVED  (penghapusan LOGIS — baris dan data TIDAK dihapus;
//               REQ-099; REMOVED terminal)
//
// Aturan yang ditegakkan:
// - Satu instance LIVE per (workspace, type): live = status ∈ {PURCHASED,
//   ASSIGNED, ACTIVE, SUSPENDED, RENEWED}. Ditegakkan di service (pemeriksaan
//   dalam transaksi) DAN di database (partial unique index pada kolom
//   denormalisasi `typeId` — migration Phase 5-D; pola preseden 5-B).
// - Kompatibilitas katalog/type: ACTIVATE/ASSIGN/RENEW hanya bila definisi
//   isActive dan status CATALOG; type code WAJIB anggota closed list owner
//   (MC §2/§3) — di luar list = fail closed. Jalur pemadaman (SUSPEND/EXPIRE/
//   REMOVE) TIDAK pernah diblokir oleh state katalog.
// - Entitlement: hanya instance ACTIVE berkontribusi (engine 5-C membaca
//   status ACTIVE); SUSPENDED/EXPIRED/RENEWED/REMOVED/PURCHASED/ASSIGNED tidak
//   pernah meng-grant. `quantity` dibawa apa adanya sesuai model 5-B — modul
//   ini TIDAK menghitung kuota (OD-05/OD-06 OPEN).
// - Waktu: verify-only terhadap termEndsAt tersimpan; `now` disuplai pemanggil;
//   tanggal baru hanya yang disuplai; TANPA scheduler (OD-108 OPEN).
// - Konkurensi/idempotensi: update kondisional status terbaca (optimistic);
//   konflik = denial eksplisit; idempotensi state-convergence untuk aksi
//   state-arrival (RENEW: termEndsAt baru identik → no-op).
// - Audit: sukses atomik dengan perubahan status; denial first-class.

import type { PrismaClient, Prisma } from "@prisma/client";

import { AuditOutcome } from "@/lib/audit/audit-service";

import {
  EXTENSION_ACTION_AUTHORIZATION,
  ExtensionLifecycleAction,
  ExtensionLifecycleReasonCode,
  authorizeLifecycleAction,
  recordLifecycleAudit,
  type LifecycleActor,
} from "./lifecycle-shared";
import { EXTENSION_INSTANCE_STATUSES, EXTENSION_TYPE_CODES } from "./vocabulary";

// ---------------------------------------------------------------------------
// Matriks transisi (PURE)
// ---------------------------------------------------------------------------

export interface ExtensionTransitionRule {
  from: readonly string[];
  to: string;
}

export const EXTENSION_TRANSITIONS: Record<
  ExtensionLifecycleAction,
  ExtensionTransitionRule
> = {
  ASSIGN: { from: ["PURCHASED"], to: "ASSIGNED" },
  ACTIVATE: { from: ["ASSIGNED", "RENEWED"], to: "ACTIVE" },
  SUSPEND: { from: ["ACTIVE"], to: "SUSPENDED" },
  EXPIRE: { from: ["ACTIVE", "SUSPENDED"], to: "EXPIRED" },
  RENEW: { from: ["SUSPENDED", "EXPIRED"], to: "RENEWED" },
  REMOVE: { from: ["PURCHASED", "ASSIGNED", "ACTIVE", "SUSPENDED", "EXPIRED", "RENEWED"], to: "REMOVED" },
};

/** Himpunan status LIVE (menempati slot (workspace, type); bukan terminal). */
export const EXTENSION_LIVE_STATUSES: readonly string[] = [
  "PURCHASED",
  "ASSIGNED",
  "ACTIVE",
  "SUSPENDED",
  "RENEWED",
];

/** Aksi yang bertiba pada status LIVE (butuh pemeriksaan satu-live-instance). */
const ARRIVES_LIVE: readonly ExtensionLifecycleAction[] = [
  ExtensionLifecycleAction.ASSIGN,
  ExtensionLifecycleAction.ACTIVATE,
  ExtensionLifecycleAction.RENEW,
];

/** Aksi yang mensyaratkan katalog aktif (memulai/memperpanjang layanan). */
const REQUIRES_ACTIVE_CATALOG: readonly ExtensionLifecycleAction[] = [
  ExtensionLifecycleAction.ASSIGN,
  ExtensionLifecycleAction.ACTIVATE,
  ExtensionLifecycleAction.RENEW,
];

export interface ExtensionTransitionEvaluation {
  ok: boolean;
  to: string | null;
  reasonCode: ExtensionLifecycleReasonCode | null;
}

/** Evaluasi murni (status, action) — fail-closed, tanpa I/O. */
export function evaluateExtensionTransition(
  action: ExtensionLifecycleAction,
  currentStatus: string
): ExtensionTransitionEvaluation {
  if (!(EXTENSION_INSTANCE_STATUSES as readonly string[]).includes(currentStatus)) {
    return {
      ok: false,
      to: null,
      reasonCode: ExtensionLifecycleReasonCode.DENY_LIFECYCLE_INVALID_TRANSITION,
    };
  }
  const rule = EXTENSION_TRANSITIONS[action];
  if (!rule.from.includes(currentStatus)) {
    return {
      ok: false,
      to: null,
      reasonCode: ExtensionLifecycleReasonCode.DENY_LIFECYCLE_INVALID_TRANSITION,
    };
  }
  return { ok: true, to: rule.to, reasonCode: null };
}

// ---------------------------------------------------------------------------
// Service transaksional
// ---------------------------------------------------------------------------

export interface ExtensionLifecycleRequest {
  instanceId: string;
  action: ExtensionLifecycleAction;
  actor: LifecycleActor;
  /** Jam keputusan — disuplai pemanggil/server (tanpa jam dinding di modul). */
  now: Date;
  /** Tanggal provisi — disuplai (ASSIGN); tidak dihitung modul. */
  provisionedAt?: Date | null;
  /** Batas term baru — disuplai (RENEW); verify-only pada EXPIRE. */
  newTermEndsAt?: Date | null;
}

export type ExtensionLifecycleResult =
  | {
      outcome: "SUCCESS";
      instanceId: string;
      action: ExtensionLifecycleAction;
      from: string;
      to: string;
      idempotent: boolean;
      viaOwnerFallback: boolean;
      entitlementEffect: "ENTITLEMENT_CONTRIBUTES" | "ENTITLEMENT_NOT_CONTRIBUTING";
    }
  | {
      outcome: "DENIED";
      instanceId: string | null;
      action: ExtensionLifecycleAction;
      reasonCode: string;
      viaOwnerFallback: false;
    };

export async function applyExtensionLifecycleTransition(
  db: PrismaClient,
  request: ExtensionLifecycleRequest
): Promise<ExtensionLifecycleResult> {
  const { action, actor, now } = request;

  // 1) Muat instance + definisi + type (fakta sumber tepercaya).
  const instance = await db.extensionInstance.findUnique({
    where: { id: request.instanceId },
    include: {
      definition: { include: { type: { select: { code: true } } } },
    },
  });
  if (!instance) {
    await recordLifecycleAudit(db, {
      domain: "extension",
      action,
      outcome: AuditOutcome.DENIED,
      actorUserId: actor.type === "USER" ? actor.userId : null,
      isSystemActor: actor.type === "SYSTEM",
      workspaceId: null,
      targetId: request.instanceId,
      reasonCode: ExtensionLifecycleReasonCode.DENY_INSTANCE_NOT_FOUND,
    });
    return {
      outcome: "DENIED",
      instanceId: null,
      action,
      reasonCode: ExtensionLifecycleReasonCode.DENY_INSTANCE_NOT_FOUND,
      viaOwnerFallback: false,
    };
  }

  const deny = async (reasonCode: string): Promise<ExtensionLifecycleResult> => {
    await recordLifecycleAudit(db, {
      domain: "extension",
      action,
      outcome: AuditOutcome.DENIED,
      actorUserId: actor.type === "USER" ? actor.userId : null,
      isSystemActor: actor.type === "SYSTEM",
      workspaceId: instance.workspaceId,
      targetId: instance.id,
      reasonCode,
      metadata: { from: instance.status, action, type: instance.definition.type.code },
    });
    return {
      outcome: "DENIED",
      instanceId: instance.id,
      action,
      reasonCode,
      viaOwnerFallback: false,
    };
  };

  // 2) Type code WAJIB anggota closed list owner — di luar list: fail closed.
  const typeCode = instance.definition.type.code;
  if (!(EXTENSION_TYPE_CODES as readonly string[]).includes(typeCode)) {
    return deny(ExtensionLifecycleReasonCode.DENY_INVALID_EXTENSION_TYPE);
  }

  // 3) Otorisasi aktor (deny-by-default; fallback owner PROPOSED).
  const authz = await authorizeLifecycleAction(db, {
    workspaceId: instance.workspaceId,
    action,
    authorization: EXTENSION_ACTION_AUTHORIZATION[action],
    actor,
  });
  if (!authz.allowed) {
    return deny(authz.reasonCode);
  }

  // 4) Invariant denormalisasi typeId (migration 5-D): baris tanpa typeId
  //    yang cocok = state tidak ter-evaluasi → fail closed (termasuk replay).
  if (
    instance.typeId === null ||
    (instance.typeId !== instance.definition.typeId && instance.status !== "REMOVED")
  ) {
    return deny(ExtensionLifecycleReasonCode.DENY_UNEVALUABLE_INSTANCE);
  }

  // 5) Idempotensi state-convergence (ADR-025 §8) — SEBELUM pemeriksaan
  //    matriks: replay aksi yang sudah teraplikasi adalah no-op sukses.
  const rule = EXTENSION_TRANSITIONS[action];
  const stateArrival = action !== ExtensionLifecycleAction.RENEW;
  const idempotentSuccess = async (): Promise<ExtensionLifecycleResult> => {
    await recordLifecycleAudit(db, {
      domain: "extension",
      action,
      outcome: AuditOutcome.SUCCESS,
      actorUserId: actor.type === "USER" ? actor.userId : null,
      isSystemActor: actor.type === "SYSTEM",
      workspaceId: instance.workspaceId,
      targetId: instance.id,
      reasonCode: authz.reasonCode,
      viaOwnerFallback: authz.viaOwnerFallback,
      idempotent: true,
      metadata: { from: instance.status, to: rule.to },
    });
    return {
      outcome: "SUCCESS",
      instanceId: instance.id,
      action,
      from: instance.status,
      to: rule.to,
      idempotent: true,
      viaOwnerFallback: authz.viaOwnerFallback,
      entitlementEffect: entitlementEffectOf(rule.to),
    };
  };
  if (stateArrival && instance.status === rule.to) {
    return idempotentSuccess();
  }
  if (
    !stateArrival &&
    instance.status === "RENEWED" &&
    request.newTermEndsAt !== undefined &&
    request.newTermEndsAt !== null &&
    instance.termEndsAt !== null &&
    instance.termEndsAt.getTime() === request.newTermEndsAt.getTime()
  ) {
    return idempotentSuccess();
  }

  // 6) Matriks transisi — fail closed.
  const evaluation = evaluateExtensionTransition(action, instance.status);
  if (!evaluation.ok || evaluation.to === null) {
    return deny(
      evaluation.reasonCode ?? ExtensionLifecycleReasonCode.DENY_LIFECYCLE_INVALID_TRANSITION
    );
  }
  const to = evaluation.to;

  // 7) Kompatibilitas katalog: memulai/memperpanjang layanan butuh definisi
  //    aktif + CATALOG; jalur pemadaman tidak pernah diblokir katalog.
  if ((REQUIRES_ACTIVE_CATALOG as readonly string[]).includes(action)) {
    if (!instance.definition.isActive || instance.definition.status !== "CATALOG") {
      return deny(ExtensionLifecycleReasonCode.DENY_DEFINITION_INACTIVE);
    }
  }

  // 8) Verify-only waktu untuk EXPIRE.
  if (
    action === ExtensionLifecycleAction.EXPIRE &&
    instance.termEndsAt !== null &&
    now < instance.termEndsAt
  ) {
    return deny(ExtensionLifecycleReasonCode.DENY_TERM_NOT_ENDED);
  }

  // 9) Aturan satu live instance per (workspace, type) — pemeriksaan service
  //    (backstop DB: partial unique index migration 5-D).
  if ((ARRIVES_LIVE as readonly string[]).includes(action)) {
    const otherLive = await db.extensionInstance.findFirst({
      where: {
        workspaceId: instance.workspaceId,
        typeId: instance.definition.typeId,
        status: { in: [...EXTENSION_LIVE_STATUSES] },
        id: { not: instance.id },
      },
      select: { id: true },
    });
    if (otherLive !== null) {
      return deny(ExtensionLifecycleReasonCode.DENY_LIVE_INSTANCE_EXISTS);
    }
  }

  // 10) Tulis perubahan — update kondisional (optimistic guard).
  const data: Prisma.ExtensionInstanceUpdateManyMutationInput = {
    status: to,
    // Penjaga denormalisasi: typeId selalu sinkron dengan definisi pada setiap
    // penulisan lifecycle (self-healing; invariant diuji test).
    typeId: instance.definition.typeId,
  };
  if (action === ExtensionLifecycleAction.ASSIGN && request.provisionedAt !== undefined) {
    data.provisionedAt = request.provisionedAt;
  }
  if (action === ExtensionLifecycleAction.RENEW && request.newTermEndsAt !== undefined) {
    data.termEndsAt = request.newTermEndsAt;
  }

  try {
    const applied = await db.$transaction(async (tx) => {
      const updated = await tx.extensionInstance.updateMany({
        where: { id: instance.id, status: instance.status },
        data,
      });
      if (updated.count !== 1) {
        return false;
      }
      // Audit sukses ATOMIK dengan perubahan status.
      await recordLifecycleAudit(tx, {
        domain: "extension",
        action,
        outcome: AuditOutcome.SUCCESS,
        actorUserId: actor.type === "USER" ? actor.userId : null,
        isSystemActor: actor.type === "SYSTEM",
        workspaceId: instance.workspaceId,
        targetId: instance.id,
        reasonCode: authz.reasonCode,
        viaOwnerFallback: authz.viaOwnerFallback,
        idempotent: false,
        metadata: { from: instance.status, to, type: typeCode },
      });
      return true;
    });

    if (!applied) {
      return deny(ExtensionLifecycleReasonCode.DENY_CONCURRENT_MODIFICATION);
    }

    return {
      outcome: "SUCCESS",
      instanceId: instance.id,
      action,
      from: instance.status,
      to,
      idempotent: false,
      viaOwnerFallback: authz.viaOwnerFallback,
      entitlementEffect: entitlementEffectOf(to),
    };
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    if (code === "P2002") {
      return deny(ExtensionLifecycleReasonCode.DENY_LIVE_INSTANCE_EXISTS);
    }
    throw error;
  }
}

/** Efek entitlement status tujuan — hanya ACTIVE yang berkontribusi (5-C). */
function entitlementEffectOf(
  to: string
): "ENTITLEMENT_CONTRIBUTES" | "ENTITLEMENT_NOT_CONTRIBUTING" {
  return to === "ACTIVE" ? "ENTITLEMENT_CONTRIBUTES" : "ENTITLEMENT_NOT_CONTRIBUTING";
}
