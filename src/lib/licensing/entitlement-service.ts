// Entitlement service (server-side enforcement layer) — epicRider Phase 5-C.
//
// Melengkapi evaluator murni (`entitlement.ts`) dengan resolusi fakta dari
// sumber tepercaya (DB hasil migration; pola Phase 4: guards I/O + policy
// murni). SEMUA enforcement entitlement berjalan di server — client hanya
// menerima hasil evaluasi (REQ-024; MC §2; ENTITLEMENT_MODEL §3.5/§10).
//
// Isi modul:
// 1. resolveWorkspaceCapabilityEntitlement — resolusi DB → EntitlementDecision.
// 2. resolveWorkspaceExtensionFacts — input extension efektif (data saja).
// 3. recordEntitlementAudit — audit keputusan (denial = first-class, REQ-024).
// 4. authorizeWorkspaceCapability — TITIK INTEGRASI Entitlement × Authorization:
//    entitlement meng-gate capability workspace; policy Phase 4 tetap
//    mengevaluasi aktor (session/membership/role/permission). Keduanya TETAP
//    TERPISAH dalam hasil (prompt owner 5-C §6/§12; ENTITLEMENT_MODEL §3.4).
//
// TIDAK ada di modul ini (scope 5-D/E atau OD terbuka): lifecycle lisensi,
// expiry/grace/downgrade (OD-108), kuota seat enforcement (OD-05),
// issuance/purchase (OD-06), UI/API licensing, extension lifecycle (5-D).

import type { PrismaClient } from "@prisma/client";

import { logAudit, AuditCategory, AuditOutcome } from "@/lib/audit/audit-service";
import { MembershipStatus, ReasonCode } from "@/lib/authz/reason-codes";
import { evaluatePolicy, type PolicyDecision, type SessionValidity } from "@/lib/authz/policy";
import type { Permission } from "@/lib/authz/permissions";

import {
  EntitlementDecision,
  EntitlementFacts,
  evaluateEntitlement,
} from "./entitlement";

/** Request evaluasi entitlement capability untuk satu workspace. */
export interface WorkspaceCapabilityEntitlementRequest {
  workspaceId: string;
  capabilityCode: string;
  /** Extension type yang disyaratkan capability (opsional; closed list owner). */
  requiredExtensionType?: string | null;
}

/** Fakta extension efektif sebuah workspace (data; tanpa keputusan). */
export interface WorkspaceExtensionFacts {
  workspaceId: string;
  /** Type code instance ACTIVE — sorted, unique. */
  activeTypeCodes: readonly string[];
  /** Detail instance ACTIVE — sorted deterministic (typeCode lalu id). */
  activeInstances: readonly {
    instanceId: string;
    definitionCode: string;
    typeCode: string;
    quantity: number | null;
  }[];
}

/** Selesaikan fakta entitlement dari DB, lalu evaluasi secara murni. */
export async function resolveWorkspaceCapabilityEntitlement(
  db: PrismaClient,
  request: WorkspaceCapabilityEntitlementRequest
): Promise<EntitlementDecision> {
  const workspaceId = request.workspaceId;

  // 1) Konteks workspace (prasyarat tenant scope).
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true },
  });

  // 2) Katalog capability (referensi GLOBAL; seed migration = vocabulary).
  const capability = await db.capability.findUnique({
    where: { code: request.capabilityCode },
    select: { id: true, status: true },
  });

  // 3) License workspace — histori penuh + kandidat ACTIVE (invariant <= 1).
  const licenses = await db.license.findMany({
    where: { workspaceId },
    select: { id: true, status: true, tierId: true },
  });
  const activeRows = licenses.filter((l) => l.status === "ACTIVE");

  let activeTierRow: { code: string; isActive: boolean } | null = null;
  let activeTierRuleId: string | null = null;
  if (activeRows.length === 1) {
    const tier = await db.licenseTier.findUnique({
      where: { id: activeRows[0].tierId },
      select: { code: true, isActive: true },
    });
    activeTierRow = tier;
    if (tier !== null && capability !== null) {
      const rule = await db.capabilityRule.findFirst({
        where: {
          capabilityId: capability.id,
          tierId: activeRows[0].tierId,
          status: "ACTIVE",
        },
        select: { id: true },
      });
      activeTierRuleId = rule?.id ?? null;
    }
  }

  // 4) Extension instance ACTIVE milik workspace (input additive; MC §2).
  const instances = await db.extensionInstance.findMany({
    where: { workspaceId, status: "ACTIVE" },
    include: { definition: { include: { type: true } } },
  });
  const extensionsActive = [...new Set(instances.map((i) => i.definition.type.code))].sort();

  const facts: EntitlementFacts = {
    workspaceId,
    workspaceExists: workspace !== null,
    capabilityCode: request.capabilityCode,
    capabilityCatalogRow: capability ? { status: capability.status } : null,
    licenseRowCount: licenses.length,
    activeLicenseCount: activeRows.length,
    activeLicenseId: activeRows.length === 1 ? activeRows[0].id : null,
    activeTierRow,
    activeTierRuleId,
    requiredExtensionType: request.requiredExtensionType ?? null,
    extensionsActive,
  };
  return evaluateEntitlement(facts);
}

/** Fakta extension efektif workspace — DATA saja, tanpa keputusan/kuota. */
export async function resolveWorkspaceExtensionFacts(
  db: PrismaClient,
  workspaceId: string
): Promise<WorkspaceExtensionFacts> {
  const instances = await db.extensionInstance.findMany({
    where: { workspaceId, status: "ACTIVE" },
    include: { definition: { include: { type: true } } },
    orderBy: { id: "asc" },
  });
  return {
    workspaceId,
    activeTypeCodes: [...new Set(instances.map((i) => i.definition.type.code))].sort(),
    activeInstances: instances
      .map((i) => ({
        instanceId: i.id,
        definitionCode: i.definition.code,
        typeCode: i.definition.type.code,
        quantity: i.quantity,
      }))
      .sort((a, b) => a.typeCode.localeCompare(b.typeCode) || a.instanceId.localeCompare(b.instanceId)),
  };
}

/**
 * Audit keputusan entitlement (ENTITLEMENT_MODEL §10): setiap denial
 * direkam dengan reason code; grant direkam sebagai snapshot evidence.
 * Memakai logAudit Phase 4 (tidak pernah melempar; metadata di-sanitasi).
 */
export async function recordEntitlementAudit(
  db: PrismaClient,
  decision: EntitlementDecision,
  opts?: { actorUserId?: string | null; userAgent?: string | null }
): Promise<void> {
  await logAudit(db, {
    category: AuditCategory.LICENSE,
    action: decision.decision === "ALLOWED" ? "entitlement.granted" : "entitlement.denied",
    outcome: decision.decision === "ALLOWED" ? AuditOutcome.SUCCESS : AuditOutcome.DENIED,
    actorUserId: opts?.actorUserId ?? null,
    tenantWorkspaceId: decision.evidence.workspaceId,
    targetType: "capability",
    targetId: decision.capabilityCode,
    reasonCode: decision.reasonCode,
    // Catatan: sanitizer audit Phase 4 me-redaksi key yang mengandung "code"
    // dsb. — gunakan key aman ("tier", bukan "tierCode").
    metadata: {
      kind: decision.kind,
      licenseId: decision.evidence.licenseId,
      tier: decision.evidence.tierCode,
      ruleId: decision.evidence.ruleId,
      extensionsActive: decision.evidence.extensionsActive.join(",") || null,
    },
    userAgent: opts?.userAgent ?? null,
  });
}

/** Request enforcement gabungan entitlement → authorization. */
export interface WorkspaceCapabilityAuthorizationRequest
  extends WorkspaceCapabilityEntitlementRequest {
  /** Validitas sesi aktor — fakta dari penyimpanan sesi tepercaya (pola Phase 4). */
  session: SessionValidity;
  /** Id user aktor (dari sesi); null = anonim. */
  actorUserId: string | null;
  /** Permission yang diminta pada capability ini (vocabulary Phase 4). */
  permission: Permission;
  /** Audit keputusan entitlement (default true; ENTITLEMENT_MODEL §10). */
  audit?: boolean;
}

/**
 * Hasil enforcement gabungan — KEDUA lapisan TETAP terpisah dan keduanya
 * diekspos apa adanya (tidak dilebur menjadi satu "verdict" kabur).
 */
export interface WorkspaceCapabilityAuthorizationResult {
  entitlement: EntitlementDecision;
  /** Keputusan policy Phase 4 — null bila entitlement deny (short-circuit). */
  authorization: PolicyDecision | null;
  final: { decision: "ALLOW" | "DENY"; reasonCode: string };
}

/**
 * TITIK INTEGRASI Entitlement × Authorization (prompt owner 5-C §12):
 *
 *   License/Extension → Capability entitlement → Role/Permission →
 *   Resource/context authorization → Action allowed/denied
 *
 * - Entitlement DENIED → deny SEBELUM policy aktor dijalankan (short-circuit;
 *   audit denial direkam). Actor permission TIDAK menyelamatkan workspace
 *   yang tidak entitled.
 * - Entitlement ALLOWED → policy Phase 4 tetap mengevaluasi sesi/tenant/
 *   membership/role/permission (deny-by-default tetap berlaku). Entitlement
 *   TIDAK menggantikan RBAC — "punya license = boleh melakukan semuanya"
 *   TIDAK terjadi.
 * - Membership/role diselesaikan dari DB (sumber tepercaya); status di luar
 *   vocabulary diperlakukan sebagai tidak-ber-hak (fail closed, DENY_NOT_MEMBER).
 */
export async function authorizeWorkspaceCapability(
  db: PrismaClient,
  request: WorkspaceCapabilityAuthorizationRequest
): Promise<WorkspaceCapabilityAuthorizationResult> {
  const entitlement = await resolveWorkspaceCapabilityEntitlement(db, request);

  if (entitlement.decision === "DENIED") {
    if (request.audit !== false) {
      await recordEntitlementAudit(db, entitlement, { actorUserId: request.actorUserId });
    }
    return {
      entitlement,
      authorization: null,
      final: { decision: "DENY", reasonCode: entitlement.reasonCode },
    };
  }

  // Fakta aktor dari DB (sumber tepercaya) — bukan dari client.
  const membership = request.actorUserId
    ? await db.membership.findFirst({
        where: { workspaceId: request.workspaceId, userId: request.actorUserId },
        include: { roles: { include: { role: true } } },
      })
    : null;
  const rawMembershipStatus = membership?.status ?? null;
  const membershipStatus = (Object.values(MembershipStatus) as string[]).includes(
    rawMembershipStatus ?? ""
  )
    ? (rawMembershipStatus as MembershipStatus)
    : null; // status tak dikenal → fail closed (bukan "lanjutkan").
  const roleKeys = membership?.roles.map((r) => r.role.key) ?? [];

  const authorization = evaluatePolicy({
    session: request.session,
    actorUserId: request.actorUserId,
    workspaceId: request.workspaceId,
    membershipStatus,
    roleKeys,
    permission: request.permission,
    // Input entitlement kanonik rantai Phase 4 — kini DIEVALUASI (5-C).
    entitlement: {
      tierActive: true,
      extensionsActive: [...entitlement.evidence.extensionsActive],
      requiredExtensionType: request.requiredExtensionType ?? null,
    },
  });

  if (request.audit !== false) {
    await recordEntitlementAudit(db, entitlement, { actorUserId: request.actorUserId });
  }

  return {
    entitlement,
    authorization,
    final: {
      decision: authorization.decision,
      reasonCode: authorization.reasonCode === ReasonCode.ALLOW
        ? ReasonCode.ALLOW
        : authorization.reasonCode,
    },
  };
}
