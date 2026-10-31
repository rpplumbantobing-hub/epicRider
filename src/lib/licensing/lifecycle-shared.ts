// Shared lifecycle infrastructure — epicRider Phase 5-D (ADR-025).
//
// Dipakai bersama oleh `license-lifecycle.ts` dan `extension-lifecycle.ts`:
// model aktor, otorisasi aksi lifecycle, audit, dan reason code.
//
// Sumber kontrak (tidak ada nilai yang dikarang):
// - Mesin status lisensi: DMC §6.2 (REQ-098) — 8 transisi kanonik eksekusi 5-D;
//   aturan/durasi = OD-108 OPEN (layanan TIDAK menghitung term/window/grace —
//   verify-only terhadap data tersimpan; TIDAK ada scheduler).
// - Lifecycle extension: LICENSE_MATRIX §5 — kanonik.
// - Permission vocabulary: AUTHORIZATION_MODEL §4.5/§4.6 (`license.renew.
//   initiate`, `extension.assign`, `extension.remove`, `extension.renew.
//   initiate`). Aksi transisi TANPA key kanonik pada model (mis. ACTIVATE,
//   TERM_END, GRACE_*, DOWNGRADE, REACTIVATE, extension activate/suspend/
//   expire) TIDAK dikarang permission barunya.
// - Remediasi PR #4 — EXPLICIT PERMISSION ONLY, TANPA fallback: jalur
//   OWNER_FALLBACK_PROPOSED (policy PROPOSED → ALLOW) DIHAPUS dan tidak
//   dikembalikan dalam bentuk apa pun. Tidak ada actor USER yang diizinkan
//   hanya karena role `owner`, kepemilikan workspace, permission tidak
//   ditemukan, transition tanpa mapping, atau otoritas aktor tak dapat
//   ditentukan. Kebijakan ber-status PROPOSED TIDAK PERNAH mengizinkan:
//   tanpa permission eksplisit terdokumentasi (dan grant role/preset yang
//   disahkan AUTHORIZATION_MODEL §4/§5 — katalog role = OD-122 OPEN) →
//   DEFAULT DENY `DENY_PERMISSION_MISSING` (deny-by-default MC §2/§4;
//   REQ-024). Kebutuhan keputusan owner dicatat sebagai PROPOSED/OPEN
//   (ADR-025 §6), bukan kebijakan aktif.
// - Deny-by-default: Phase 4 policy (ADR-010) tetap berlaku; non-member,
//   INVITED, SUSPENDED, REMOVED, LEFT, role tak dikenal, sesi tidak sah,
//   dan owner tanpa permission eksplisit SELALU ditolak.
// - Aktor sistem: `actorType=SYSTEM` hanya dapat dibentuk oleh pemanggil
//   internal tepercaya di server. TIDAK ADA route/API HTTP pada Phase 5-D;
//   aktor USER selalu dibentuk dari sesi server-side (bukan input client),
//   sehingga client TIDAK dapat menyuplai `SYSTEM` untuk eskalasi hak
//   (ADR-025 §7; diuji test).
// - Audit: denial = first-class (REQ-010/REQ-024); kategori LICENSE (5-C);
//   audit transisi sukses ditulis DALAM transisi yang sama dengan perubahan
//   status (atomik); audit denial ditulis via `logAudit` (best-effort, pola
//   Phase 4) SETELAH keputusan — kegagalan tulis audit tidak membatalkan
//   keputusan deny dan tidak diam-diam menghapus bukti denial dari keputusan
//   yang dikembalikan ke pemanggil.

import type { PrismaClient, Prisma } from "@prisma/client";

import { logAudit, AuditCategory, AuditOutcome } from "@/lib/audit/audit-service";
import { MembershipStatus, ReasonCode } from "@/lib/authz/reason-codes";
import { evaluatePolicy, type SessionValidity } from "@/lib/authz/policy";
import { Permission } from "@/lib/authz/permissions";

// ---------------------------------------------------------------------------
// Aktor lifecycle
// ---------------------------------------------------------------------------

/**
 * Aktor transisi lifecycle.
 *
 * - SYSTEM: pemanggil internal tepercaya (server-side; TIDAK pernah berasal
 *   dari input client — tidak ada surface 5-D yang menerimanya).
 * - USER: aktor manusia; `session` adalah fakta validitas sesi yang
 *   diselesaikan dari penyimpanan tepercaya (bukan claim client).
 */
export type LifecycleActor =
  | { type: "SYSTEM"; note?: string }
  | {
      type: "USER";
      userId: string;
      session: SessionValidity;
      userAgent?: string | null;
    };

// ---------------------------------------------------------------------------
// Reason code lifecycle (baru, terdokumentasi ADR-025; tidak mengubah
// vocabulary kanonik AUTHORIZATION_MODEL §3 — kode Phase 4 tetap utuh)
// ---------------------------------------------------------------------------

export const LicenseLifecycleReasonCode = {
  /** Pasangan (status, action) tidak ada di matriks — fail closed. */
  DENY_LIFECYCLE_INVALID_TRANSITION: "DENY_LIFECYCLE_INVALID_TRANSITION",
  /** Lisensi tidak ditemukan / bukan milik konteks tenant. */
  DENY_LICENSE_NOT_FOUND: "DENY_LICENSE_NOT_FOUND",
  /** Verifikasi term tersimpan: term belum berakhir (verify-only, OD-108). */
  DENY_TERM_NOT_ENDED: "DENY_TERM_NOT_ENDED",
  /** Verifikasi grace tersimpan: grace belum berakhir (verify-only, OD-108). */
  DENY_GRACE_NOT_ENDED: "DENY_GRACE_NOT_ENDED",
  /** Tier license dinonaktifkan — tidak boleh menjadi/mengembalikan ACTIVE. */
  DENY_TIER_INACTIVE: "DENY_TIER_INACTIVE",
  /** Workspace sudah memegang lisensi ACTIVE lain (invariant tepat satu). */
  DENY_LICENSE_ACTIVE_EXISTS: "DENY_LICENSE_ACTIVE_EXISTS",
  /** State berubah konkuren (optimistic guard; kembalikan konflik, bukan silent). */
  DENY_CONCURRENT_MODIFICATION: "DENY_CONCURRENT_MODIFICATION",
} as const;
export type LicenseLifecycleReasonCode =
  (typeof LicenseLifecycleReasonCode)[keyof typeof LicenseLifecycleReasonCode];

export const ExtensionLifecycleReasonCode = {
  DENY_LIFECYCLE_INVALID_TRANSITION: "DENY_LIFECYCLE_INVALID_TRANSITION",
  DENY_INSTANCE_NOT_FOUND: "DENY_INSTANCE_NOT_FOUND",
  /** Definisi katalog tidak aktif/withdrawn — tidak boleh memulai layanan. */
  DENY_DEFINITION_INACTIVE: "DENY_DEFINITION_INACTIVE",
  /** Type code di luar closed list owner (MC §2/§3) — fail closed. */
  DENY_INVALID_EXTENSION_TYPE: "DENY_INVALID_EXTENSION_TYPE",
  /** Sudah ada instance live lain untuk (workspace, type) — aturan satu live. */
  DENY_LIVE_INSTANCE_EXISTS: "DENY_LIVE_INSTANCE_EXISTS",
  /** Kolom denormalisasi typeId hilang/tidak cocok — invariant dilanggar. */
  DENY_UNEVALUABLE_INSTANCE: "DENY_UNEVALUABLE_INSTANCE",
  DENY_TERM_NOT_ENDED: "DENY_TERM_NOT_ENDED",
  DENY_CONCURRENT_MODIFICATION: "DENY_CONCURRENT_MODIFICATION",
} as const;
export type ExtensionLifecycleReasonCode =
  (typeof ExtensionLifecycleReasonCode)[keyof typeof ExtensionLifecycleReasonCode];

// ---------------------------------------------------------------------------
// Otorisasi aksi lifecycle (tabel eksplisit — IMPLEMENTED vs PROPOSED jujur)
// ---------------------------------------------------------------------------

export interface LifecycleActionAuthorization {
  /**
   * Permission kanonik AUTHORIZATION_MODEL §4.5/§4.6 bila ADA (vocabulary
   * dipertahankan persis, tidak dikarang). `null` = model belum mendefinisikan
   * key untuk aksi ini — aksi DEFAULT DENY untuk seluruh USER actor
   * (remediasi PR #4; ratifikasi katalog menunggu keputusan owner).
   */
  permission: Permission | null;
  /**
   * Status RATIFIKASI kebijakan owner atas katalog permission lifecycle:
   * selalu "PROPOSED" — menunggu keputusan owner (ADR-025 §6; OD-122 OPEN).
   * Ini BUKAN jalur otorisasi: field ini TIDAK PERNAH dibaca oleh
   * `authorizeLifecycleAction` dan tidak pernah menghasilkan ALLOW
   * (fallback owner ALLOW dihapus pada remediasi PR #4).
   */
  ownerRatificationStatus: "PROPOSED";
  /** Bukti sumber vocabulary (AUTHORIZATION_MODEL §4.5/§4.6). */
  source: string;
}

/**
 * License lifecycle — 8 transisi kanonik eksekusi 5-D (DMC §6.2; REQ-098).
 * Pasangan lain ditolak fail-closed (termasuk `EXPIRED → ACTIVE` dan
 * `PURCHASED → DOWNGRADED` — ambiguitas owner belum diselesaikan).
 * Remediasi PR #4: `ownerRatificationStatus` = label ratifikasi menunggu —
 * bukan mekanisme otorisasi; authorization = permission eksplisit saja.
 */
export const LicenseLifecycleAction = {
  ACTIVATE: "ACTIVATE",
  RENEW: "RENEW",
  TERM_END: "TERM_END",
  GRACE_ENTER: "GRACE_ENTER",
  RENEW_IN_GRACE: "RENEW_IN_GRACE",
  GRACE_END: "GRACE_END",
  DOWNGRADE: "DOWNGRADE",
  REACTIVATE: "REACTIVATE",
} as const;
export type LicenseLifecycleAction =
  (typeof LicenseLifecycleAction)[keyof typeof LicenseLifecycleAction];

export const LICENSE_ACTION_AUTHORIZATION: Record<
  LicenseLifecycleAction,
  LifecycleActionAuthorization
> = {
  ACTIVATE: { permission: null, ownerRatificationStatus: "PROPOSED", source: "no canonical key — AUTHORIZATION_MODEL §4.5" },
  RENEW: {
    permission: Permission.LICENSE_RENEW_INITIATE,
    ownerRatificationStatus: "PROPOSED",
    source: "AUTHORIZATION_MODEL §4.5 license.renew.initiate",
  },
  TERM_END: { permission: null, ownerRatificationStatus: "PROPOSED", source: "no canonical key — AUTHORIZATION_MODEL §4.5" },
  GRACE_ENTER: { permission: null, ownerRatificationStatus: "PROPOSED", source: "no canonical key — AUTHORIZATION_MODEL §4.5" },
  RENEW_IN_GRACE: {
    permission: Permission.LICENSE_RENEW_INITIATE,
    ownerRatificationStatus: "PROPOSED",
    source: "AUTHORIZATION_MODEL §4.5 license.renew.initiate (renewal)",
  },
  GRACE_END: { permission: null, ownerRatificationStatus: "PROPOSED", source: "no canonical key — AUTHORIZATION_MODEL §4.5" },
  DOWNGRADE: { permission: null, ownerRatificationStatus: "PROPOSED", source: "no canonical key — AUTHORIZATION_MODEL §4.5" },
  REACTIVATE: { permission: null, ownerRatificationStatus: "PROPOSED", source: "no canonical key — AUTHORIZATION_MODEL §4.5" },
};

/** Extension lifecycle — aksi atas instance (LICENSE_MATRIX §5). */
export const ExtensionLifecycleAction = {
  ASSIGN: "ASSIGN",
  ACTIVATE: "ACTIVATE",
  SUSPEND: "SUSPEND",
  EXPIRE: "EXPIRE",
  RENEW: "RENEW",
  REMOVE: "REMOVE",
} as const;
export type ExtensionLifecycleAction =
  (typeof ExtensionLifecycleAction)[keyof typeof ExtensionLifecycleAction];

export const EXTENSION_ACTION_AUTHORIZATION: Record<
  ExtensionLifecycleAction,
  LifecycleActionAuthorization
> = {
  ASSIGN: {
    permission: Permission.EXTENSION_ASSIGN,
    ownerRatificationStatus: "PROPOSED",
    source: "AUTHORIZATION_MODEL §4.6 extension.assign",
  },
  ACTIVATE: { permission: null, ownerRatificationStatus: "PROPOSED", source: "no canonical key — AUTHORIZATION_MODEL §4.6" },
  SUSPEND: { permission: null, ownerRatificationStatus: "PROPOSED", source: "no canonical key — AUTHORIZATION_MODEL §4.6" },
  EXPIRE: { permission: null, ownerRatificationStatus: "PROPOSED", source: "no canonical key — AUTHORIZATION_MODEL §4.6" },
  RENEW: {
    permission: Permission.EXTENSION_RENEW_INITIATE,
    ownerRatificationStatus: "PROPOSED",
    source: "AUTHORIZATION_MODEL §4.6 extension.renew.initiate",
  },
  REMOVE: {
    permission: Permission.EXTENSION_REMOVE,
    ownerRatificationStatus: "PROPOSED",
    source: "AUTHORIZATION_MODEL §4.6 extension.remove",
  },
};

// ---------------------------------------------------------------------------
// Resolusi fakta aktor + keputusan otorisasi lifecycle
// ---------------------------------------------------------------------------

export interface LifecycleActorFacts {
  membershipStatus: MembershipStatus | null;
  roleKeys: readonly string[];
}

/**
 * Selesaikan fakta aktor dari DB (sumber tepercaya) — TIDAK pernah dari input
 * client. Status membership di luar vocabulary diperlakukan null (fail closed,
 * pola 5-C).
 */
export async function resolveLifecycleActorFacts(
  db: PrismaClient,
  workspaceId: string,
  actor: LifecycleActor
): Promise<LifecycleActorFacts> {
  if (actor.type === "SYSTEM") {
    return { membershipStatus: null, roleKeys: [] };
  }
  // Identitas aktor WAJIB eksplisit — userId kosong/undefined TIDAK PERNAH
  // di-resolve ke membership siapa pun (fail closed; mencegah query tanpa
  // filter userId yang akan mencocokkan membership pertama workspace).
  if (!actor.userId || actor.userId.length === 0) {
    return { membershipStatus: null, roleKeys: [] };
  }
  const membership = await db.membership.findFirst({
    where: { workspaceId, userId: actor.userId },
    include: { roles: { include: { role: true } } },
  });
  const rawStatus = membership?.status ?? null;
  const membershipStatus = (Object.values(MembershipStatus) as string[]).includes(rawStatus ?? "")
    ? (rawStatus as MembershipStatus)
    : null;
  return { membershipStatus, roleKeys: membership?.roles.map((r) => r.role.key) ?? [] };
}

export interface LifecycleAuthorizationDecision {
  allowed: boolean;
  /**
   * Selalu `false` sejak remediasi PR #4 — fallback owner ALLOW dihapus dan
   * tidak dikembalikan dalam bentuk apa pun. Field dipertahankan untuk
   * stabilitas skema audit/keputusan (tidak pernah `true`).
   */
  viaOwnerFallback: boolean;
  reasonCode: string;
  /** Fakta membership/role yang dipakai keputusan (untuk audit). */
  facts: LifecycleActorFacts;
}

/**
 * Otorisasi satu aksi lifecycle (deny-by-default; explicit permission only).
 *
 * 1. SYSTEM → diizinkan (pemanggil internal tepercaya; tidak dapat disuplai
 *    client — tidak ada surface HTTP 5-D; ADR-025 §7).
 * 2. USER → rantai policy Phase 4 penuh (sesi → tenant → membership →
 *    permission). Remediasi PR #4: TIDAK ada fallback owner — keputusan
 *    murni dari permission eksplisit yang terdokumentasi:
 *    - aksi DENGAN key kanonik: keputusan = policy (ALLOW hanya bila role/
 *      preset aktor benar-benar memegang key tersebut — saat ini belum ada
 *      preset yang memegangnya sampai owner meratifikasi katalog, OD-122);
 *    - aksi TANPA key kanonik: rantai sesi→tenant→membership tetap
 *      ditegakkan (reason code identik policy Phase 4), lalu
 *      `DENY_PERMISSION_MISSING` untuk SIAPA PUN — termasuk role `owner` —
 *      karena tidak ada dasar kebijakan yang mengizinkan.
 *    Status `ownerRatificationStatus: "PROPOSED"` pada tabel aksi hanyalah
 *    catatan kebutuhan keputusan owner (OPEN/PROPOSED), bukan kebijakan
 *    aktif, dan tidak pernah dibaca oleh fungsi ini.
 */
export async function authorizeLifecycleAction(
  db: PrismaClient,
  params: {
    workspaceId: string;
    /**
     * Label aksi untuk kejelasan panggilan — TIDAK dibaca oleh logika fungsi
     * ini (keputusan murni dari `authorization` + `actor`). Tipe dilebarkan
     * ke `string` pada Phase 5-E agar rantai yang sama dapat dipakai ulang
     * oleh aksi commerce (`src/lib/shop/authorization.ts`, ADR-026) TANPA
     * duplikasi dan TANPA perubahan perilaku untuk aksi lifecycle 5-D.
     */
    action: string;
    authorization: LifecycleActionAuthorization;
    actor: LifecycleActor;
  }
): Promise<LifecycleAuthorizationDecision> {
  if (params.actor.type === "SYSTEM") {
    return {
      allowed: true,
      viaOwnerFallback: false,
      reasonCode: ReasonCode.ALLOW,
      facts: { membershipStatus: null, roleKeys: [] },
    };
  }

  const facts = await resolveLifecycleActorFacts(db, params.workspaceId, params.actor);

  // Aksi TANPA key permission kanonik: TIDAK ada permission yang dapat
  // mengizinkan (menggunakan placeholder permission sembarang akan membuka
  // celah eskalasi di masa depan). Rantai sesi→tenant→membership tetap
  // ditegakkan eksplisit dengan reason code yang sama dengan policy Phase 4;
  // setelah rantai lolos → DEFAULT DENY `DENY_PERMISSION_MISSING` — TERMASUK
  // untuk role `owner` (fallback owner dihapus; remediasi PR #4).
  if (params.authorization.permission === null) {
    const chainDenial = denyByLifecycleChain(params.actor.session, facts);
    if (chainDenial !== null) {
      return { allowed: false, viaOwnerFallback: false, reasonCode: chainDenial, facts };
    }
    return {
      allowed: false,
      viaOwnerFallback: false,
      reasonCode: ReasonCode.DENY_PERMISSION_MISSING,
      facts,
    };
  }

  // Aksi DENGAN key kanonik: keputusan = policy Phase 4 penuh, TANPA
  // fallback. ALLOW hanya bila role/preset aktor memegang permission
  // tersebut (grant eksplisit terdokumentasi); tanpa itu → DENY sesuai
  // reason code policy (mis. DENY_PERMISSION_MISSING).
  const policy = evaluatePolicy({
    session: params.actor.session,
    actorUserId: params.actor.userId,
    workspaceId: params.workspaceId,
    membershipStatus: facts.membershipStatus,
    roleKeys: facts.roleKeys,
    permission: params.authorization.permission,
  });

  return {
    allowed: policy.decision === "ALLOW",
    viaOwnerFallback: false,
    reasonCode: policy.reasonCode,
    facts,
  };
}

/**
 * Rantai sesi→tenant→membership untuk aksi tanpa key kanonik — cermin
 * urutan evaluasi policy Phase 4 (AUTHORIZATION_MODEL §2), reason code
 * identik. Mengembalikan null bila rantai lolos sampai tahap permission.
 *
 * Phase 5-E (ADR-026): diekspor agar lapisan otorisasi commerce
 * (`src/lib/shop/authorization.ts`) MENGULANG-PAKAI rantai yang sama — bukan
 * menduplikasinya. Perilaku identik untuk seluruh aksi lifecycle 5-D.
 */
export function denyByLifecycleChain(
  session: SessionValidity,
  facts: LifecycleActorFacts
): string | null {
  if (session === "ABSENT") return ReasonCode.DENY_NO_SESSION;
  if (session === "EXPIRED") return ReasonCode.DENY_SESSION_EXPIRED;
  if (session === "REVOKED") return ReasonCode.DENY_SESSION_REVOKED;
  switch (facts.membershipStatus) {
    case null:
      return ReasonCode.DENY_NOT_MEMBER;
    case MembershipStatus.INVITED:
      return ReasonCode.DENY_NOT_MEMBER;
    case MembershipStatus.SUSPENDED:
      return ReasonCode.DENY_MEMBERSHIP_SUSPENDED;
    case MembershipStatus.REMOVED:
      return ReasonCode.DENY_MEMBERSHIP_REMOVED;
    case MembershipStatus.LEFT:
      return ReasonCode.DENY_NOT_MEMBER;
    case MembershipStatus.ACTIVE:
      return null; // lanjut ke tahap permission/fallback
  }
}

// ---------------------------------------------------------------------------
// Audit lifecycle
// ---------------------------------------------------------------------------

export interface LifecycleAuditInput {
  domain: "license" | "extension";
  action: string;
  outcome: AuditOutcome;
  actorUserId: string | null;
  isSystemActor: boolean;
  workspaceId: string | null;
  targetId: string | null;
  reasonCode: string | null;
  viaOwnerFallback?: boolean;
  idempotent?: boolean;
  metadata?: Record<string, unknown>;
}

/** Tulis audit lifecycle (kategori LICENSE; denial = first-class). */
export async function recordLifecycleAudit(
  db: PrismaClient | Prisma.TransactionClient,
  input: LifecycleAuditInput
): Promise<void> {
  await logAudit(db, {
    category: AuditCategory.LICENSE,
    action: `${input.domain}.lifecycle.${input.action.toLowerCase()}.${
      input.outcome === AuditOutcome.SUCCESS ? "success" : "denied"
    }`,
    outcome: input.outcome,
    actorUserId: input.actorUserId,
    tenantWorkspaceId: input.workspaceId,
    targetType: input.domain,
    targetId: input.targetId,
    reasonCode: input.reasonCode,
    metadata: {
      actorType: input.isSystemActor ? "SYSTEM" : "USER",
      viaOwnerFallback: input.viaOwnerFallback === true ? "PROPOSED" : null,
      idempotent: input.idempotent === true ? "true" : null,
      ...(input.metadata ?? {}),
    },
  });
}
