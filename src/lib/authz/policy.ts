// Policy layer — epicRider Phase 4 (ADR-010; AUTHORIZATION_MODEL §2–§3).
//
// evaluator MURNI (tanpa I/O) — semua fakta diselesaikan pemanggil (guards)
// dari sumber tepercaya (DB), lalu policy mengevaluasi rantai input kanonik:
//
//   Actor + Tenant/Workspace + Object + Action + Event Context
//         + Role/Permission + Object State → ALLOW | DENY (+ reason code)
//
// (Input Tier Entitlement + Extension = bagian rantai kanonik, namun BELUM
// dievaluasi di Phase 4 — runtime lisensi dimiliki Phase 5; gated prompt §6.3
// melarang mengarang license state. Kedua input tetap dideklarasikan di tipe
// agar kontrak rantai stabil.)
//
// Prinsip: DENY-BY-DEFAULT — tanpa allow eksplisit = deny (MC §2/§4; REQ-024).
// Urutan evaluasi (AUTHORIZATION_MODEL §2, PROPOSED): sesi → tenant →
// membership → role/permission → object state → (entitlement — Phase 5).

import { MembershipStatus, ReasonCode } from "./reason-codes";
import { Permission } from "./permissions";
import { permissionsForRoles } from "./roles";

/** Status sesi yang sudah diselesaikan dari penyimpanan tepercaya. */
export type SessionValidity =
  | "VALID"
  | "ABSENT"
  | "EXPIRED"
  | "REVOKED";

export interface PolicyRequest {
  /** Validitas sesi (prasyarat; dievaluasi SEBELUM rantai objek). */
  session: SessionValidity;
  /** Id user aktor (dari sesi). */
  actorUserId: string | null;
  /** Id workspace yang jadi konteks tenant request (dari path — D-6). */
  workspaceId: string | null;
  /** Status membership aktor di workspace tersebut (fakta dari DB). */
  membershipStatus: MembershipStatus | null;
  /** Kunci role aktor di workspace tersebut (fakta dari DB). */
  roleKeys: readonly string[];
  /** Permission yang diminta (aksi). */
  permission: Permission;
  /** Id objek target (untuk pemeriksaan tingkat objek). */
  objectId?: string | null;
  /** Konteks event — reference-only Phase 4 (REQ-050; runtime event = Phase 6). */
  eventContext?: {
    assignmentRequired: boolean;
    hasAssignment: boolean;
  } | null;
  /** Status objek target bila relevan (mis. status membership target). */
  objectState?: string | null;
  /**
   * Input entitlement — dideklarasikan Phase 4, DIEVALUASI mulai Phase 5-C
   * (ADR-024). `null`/undefined = TIDAK dievaluasi (perilaku pemanggil lama
   * Phase 4 tidak berubah). Bila disediakan: tierActive=false → deny kanonik;
   * requiredExtensionType disyaratkan tapi tidak ACTIVE → DENY_EXTENSION_MISSING.
   */
  entitlement?: {
    tierActive: boolean;
    extensionsActive: readonly string[];
    requiredExtensionType?: string | null;
  } | null;
}

export interface PolicyDecision {
  decision: "ALLOW" | "DENY";
  reasonCode: ReasonCode;
}

export function evaluatePolicy(request: PolicyRequest): PolicyDecision {
  // 1) Prasyarat: autentikasi/validitas sesi (API_ARCHITECTURE §5.5).
  if (request.session === "ABSENT") {
    return { decision: "DENY", reasonCode: ReasonCode.DENY_NO_SESSION };
  }
  if (request.session === "EXPIRED") {
    return { decision: "DENY", reasonCode: ReasonCode.DENY_SESSION_EXPIRED };
  }
  if (request.session === "REVOKED") {
    return { decision: "DENY", reasonCode: ReasonCode.DENY_SESSION_REVOKED };
  }

  // 2) Lingkup tenant: request ber-scope workspace wajib punya konteks tenant.
  if (request.workspaceId === null) {
    return { decision: "DENY", reasonCode: ReasonCode.DENY_TENANT_MISMATCH };
  }

  // 3) Membership / access path (REQ-049: status mengubah akses seketika).
  switch (request.membershipStatus) {
    case null:
      return { decision: "DENY", reasonCode: ReasonCode.DENY_NOT_MEMBER };
    case MembershipStatus.INVITED:
      // Membership INVITED = undangan belum diterima — belum ada akses.
      return { decision: "DENY", reasonCode: ReasonCode.DENY_NOT_MEMBER };
    case MembershipStatus.SUSPENDED:
      return { decision: "DENY", reasonCode: ReasonCode.DENY_MEMBERSHIP_SUSPENDED };
    case MembershipStatus.REMOVED:
      return { decision: "DENY", reasonCode: ReasonCode.DENY_MEMBERSHIP_REMOVED };
    case MembershipStatus.LEFT:
      return { decision: "DENY", reasonCode: ReasonCode.DENY_NOT_MEMBER };
    case MembershipStatus.ACTIVE:
      break; // lanjut ke pemeriksaan permission
  }

  // 4) Role/permission (deny-by-default; REQ-026).
  const effectivePermissions = permissionsForRoles(request.roleKeys);
  if (!effectivePermissions.has(request.permission)) {
    return { decision: "DENY", reasonCode: ReasonCode.DENY_PERMISSION_MISSING };
  }

  // 5) Konteks event (REQ-050; inner boundary) — bila objek berscope event
  //    mensyaratkan assignment dan aktor tidak punya, tolak.
  if (
    request.eventContext?.assignmentRequired &&
    !request.eventContext.hasAssignment
  ) {
    return { decision: "DENY", reasonCode: ReasonCode.DENY_ASSIGNMENT_MISSING };
  }

  // 6) Object state — status objek target dapat melarang aksi
  //    (contoh Phase 4: operasi pada membership yang sudah terminal).
  if (request.objectState === MembershipStatus.REMOVED || request.objectState === MembershipStatus.LEFT) {
    // Transisi lebih lanjut atas membership terminal tidak diizinkan
    // (kecuali operasi yang secara eksplisit mengizinkan — ditangani service
    // layer dengan pra-kondisi sendiri sebelum memanggil policy).
    return { decision: "DENY", reasonCode: ReasonCode.DENY_OBJECT_STATE };
  }

  // 7) Tier entitlement + extension — rantai kanonik; evaluasi aktif mulai
  //    Phase 5-C (ADR-024) BILA pemanggil menyediakan input entitlement.
  //    Entitlement hanya MEMBATASI (tidak pernah meng-allow sendiri): tanpa
  //    input, perilaku identik Phase 4; deny kanonik memakai vocabulary §3.
  if (request.entitlement) {
    if (!request.entitlement.tierActive) {
      return { decision: "DENY", reasonCode: ReasonCode.DENY_TIER_ENTITLEMENT_MISSING };
    }
    const requiredExtension = request.entitlement.requiredExtensionType;
    if (
      requiredExtension &&
      !request.entitlement.extensionsActive.includes(requiredExtension)
    ) {
      return { decision: "DENY", reasonCode: ReasonCode.DENY_EXTENSION_MISSING };
    }
  }

  return { decision: "ALLOW", reasonCode: ReasonCode.ALLOW };
}
