// @vitest-environment node
// Integration test entitlement engine — epicRider Phase 5-C.
// Engine dievaluasi DI ATAS DB hasil migration terversionisasi (bukan db dev,
// bukan db:push). Katalog referensi tetap pristine hasil seed migration;
// setiap skenario memakai workspace sendiri (isolasi data antar-skenario).
// Membuktikan (prompt owner 5-C §14): evaluasi per-tier, state lisensi,
// isolasi workspace, pemisahan authorization, fail closed, audit evidence.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";

import {
  EntitlementDecisionValue,
  EntitlementKind,
  EntitlementReasonCode,
} from "@/lib/licensing/entitlement";
import {
  authorizeWorkspaceCapability,
  resolveWorkspaceCapabilityEntitlement,
} from "@/lib/licensing/entitlement-service";
import { Permission } from "@/lib/authz/permissions";
import {
  createTestDatabase,
  seedMember,
  seedWorkspaceWithOwner,
  type TestDatabase,
} from "./test-db";

let testDb: TestDatabase;

beforeAll(async () => {
  testDb = await createTestDatabase();
}, 120_000);

afterAll(async () => {
  await testDb.destroy();
});

/** Workspace + lisensi ACTIVE pada tier tertentu; mengembalikan id terkait. */
async function seedLicensedWorkspace(
  db: PrismaClient,
  params: {
    suffix: string;
    tierCode: "MINI_RIDER" | "MAX_RIDER" | "ISO_RIDER";
    licenseStatus?: string;
  }
): Promise<{ workspaceId: string; ownerId: string; licenseId: string }> {
  const seeded = await seedWorkspaceWithOwner(db, {
    userName: `Owner ${params.suffix}`,
    email: `owner-${params.suffix}@entitlement.test`,
    workspaceName: `WS ${params.suffix}`,
  });
  const tier = await db.licenseTier.findUniqueOrThrow({ where: { code: params.tierCode } });
  const license = await db.license.create({
    data: {
      workspaceId: seeded.workspaceId,
      tierId: tier.id,
      status: params.licenseStatus ?? "ACTIVE",
    },
  });
  return { workspaceId: seeded.workspaceId, ownerId: seeded.userId, licenseId: license.id };
}

describe("evaluasi per-tier di atas seed migration (LICENSE_MATRIX §2)", () => {
  it("MINI_RIDER: core_event_workspace ALLOWED dengan evidence lengkap", async () => {
    const ws = await seedLicensedWorkspace(testDb.db, { suffix: "mini-core", tierCode: "MINI_RIDER" });
    const decision = await resolveWorkspaceCapabilityEntitlement(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "core_event_workspace",
    });
    expect(decision.decision).toBe(EntitlementDecisionValue.ALLOWED);
    expect(decision.kind).toBe(EntitlementKind.GRANTED);
    expect(decision.evidence.tierCode).toBe("MINI_RIDER");
    expect(decision.evidence.licenseId).toBe(ws.licenseId);
    expect(decision.evidence.ruleId).toBeTruthy();
  });

  it("MINI_RIDER: crm DENIED (DENY_TIER_ENTITLEMENT_MISSING) — bukan SYSTEM_ERROR", async () => {
    const ws = await seedLicensedWorkspace(testDb.db, { suffix: "mini-crm", tierCode: "MINI_RIDER" });
    const decision = await resolveWorkspaceCapabilityEntitlement(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "crm",
    });
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.kind).toBe(EntitlementKind.POLICY_DENIAL);
    expect(decision.reasonCode).toBe(EntitlementReasonCode.DENY_TIER_ENTITLEMENT_MISSING);
    expect(decision.evidence.tierCode).toBe("MINI_RIDER");
  });

  it("MAX_RIDER: crm ALLOWED; ims_capability DENIED (inheritance tanpa IMS)", async () => {
    const ws = await seedLicensedWorkspace(testDb.db, { suffix: "max-crm", tierCode: "MAX_RIDER" });
    const crm = await resolveWorkspaceCapabilityEntitlement(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "crm",
    });
    expect(crm.decision).toBe(EntitlementDecisionValue.ALLOWED);
    expect(crm.evidence.tierCode).toBe("MAX_RIDER");

    const ims = await resolveWorkspaceCapabilityEntitlement(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "ims_capability",
    });
    expect(ims.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(ims.reasonCode).toBe(EntitlementReasonCode.DENY_TIER_ENTITLEMENT_MISSING);
  });

  it("ISO_RIDER: ims_capability ALLOWED (puncak inheritance)", async () => {
    const ws = await seedLicensedWorkspace(testDb.db, { suffix: "iso-ims", tierCode: "ISO_RIDER" });
    const decision = await resolveWorkspaceCapabilityEntitlement(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "ims_capability",
    });
    expect(decision.decision).toBe(EntitlementDecisionValue.ALLOWED);
    expect(decision.evidence.tierCode).toBe("ISO_RIDER");
  });
});

describe("state lisensi sebagai sumber entitlement", () => {
  it("tanpa license → DENY_NO_ACTIVE_LICENSE", async () => {
    const seeded = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Owner nolicense",
      email: "owner-nolicense@entitlement.test",
      workspaceName: "WS nolicense",
    });
    const decision = await resolveWorkspaceCapabilityEntitlement(testDb.db, {
      workspaceId: seeded.workspaceId,
      capabilityCode: "core_event_workspace",
    });
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.reasonCode).toBe(EntitlementReasonCode.DENY_NO_ACTIVE_LICENSE);
  });

  it("license PURCHASED saja → DENY_LICENSE_STATE (belum sumber entitlement)", async () => {
    const ws = await seedLicensedWorkspace(testDb.db, {
      suffix: "purchased",
      tierCode: "MINI_RIDER",
      licenseStatus: "PURCHASED",
    });
    const decision = await resolveWorkspaceCapabilityEntitlement(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "core_event_workspace",
    });
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.reasonCode).toBe(EntitlementReasonCode.DENY_LICENSE_STATE);
    expect(decision.kind).toBe(EntitlementKind.POLICY_DENIAL);
  });

  it("histori EXPIRED + license ACTIVE → tetap ALLOWED (histori tidak menghalangi)", async () => {
    const ws = await seedLicensedWorkspace(testDb.db, { suffix: "history", tierCode: "MINI_RIDER" });
    const tier = await testDb.db.licenseTier.findUniqueOrThrow({ where: { code: "MINI_RIDER" } });
    await testDb.db.license.create({
      data: { workspaceId: ws.workspaceId, tierId: tier.id, status: "EXPIRED" },
    });
    const decision = await resolveWorkspaceCapabilityEntitlement(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "core_event_workspace",
    });
    expect(decision.decision).toBe(EntitlementDecisionValue.ALLOWED);
  });

  it("state turun (DOWNGRADED) → DENY; lisensi ACTIVE baru tier sama → ALLOWED lagi (data tetap)", async () => {
    const ws = await seedLicensedWorkspace(testDb.db, { suffix: "rotate", tierCode: "MINI_RIDER" });
    const tier = await testDb.db.licenseTier.findUniqueOrThrow({ where: { code: "MINI_RIDER" } });

    // State turun via data (engine TIDAK membangun lifecycle — OD-108 OPEN).
    await testDb.db.license.update({
      where: { id: ws.licenseId },
      data: { status: "DOWNGRADED" },
    });
    const denied = await resolveWorkspaceCapabilityEntitlement(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "core_event_workspace",
    });
    expect(denied.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(denied.reasonCode).toBe(EntitlementReasonCode.DENY_LICENSE_STATE);

    // Rotasi slot ACTIVE via data (pola histori append-only Phase 5-B) — engine
    // TIDAK membangun lifecycle; ia mengikuti status data (OD-108 tetap OPEN).
    const renewed = await testDb.db.license.create({
      data: { workspaceId: ws.workspaceId, tierId: tier.id, status: "ACTIVE" },
    });
    const allowed = await resolveWorkspaceCapabilityEntitlement(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "core_event_workspace",
    });
    expect(allowed.decision).toBe(EntitlementDecisionValue.ALLOWED);
    expect(allowed.evidence.licenseId).toBe(renewed.id);
  });

  it("status license tak dikenal (korup via SQL) → DENY deterministik, tanpa crash", async () => {
    const ws = await seedLicensedWorkspace(testDb.db, { suffix: "corrupt", tierCode: "MINI_RIDER" });
    await testDb.db.$executeRawUnsafe(
      `UPDATE "License" SET status = 'WEIRD_STATE' WHERE id = '${ws.licenseId}'`
    );
    const decision = await resolveWorkspaceCapabilityEntitlement(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "core_event_workspace",
    });
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.reasonCode).toBe(EntitlementReasonCode.DENY_LICENSE_STATE);
  });
});

describe("isolasi workspace — license workspace lain tidak pernah bocor", () => {
  it("workspace A (MINI) tidak memperoleh entitlement dari license ISO workspace B", async () => {
    const a = await seedLicensedWorkspace(testDb.db, { suffix: "iso-a", tierCode: "MINI_RIDER" });
    await seedLicensedWorkspace(testDb.db, { suffix: "iso-b", tierCode: "ISO_RIDER" });

    const decisionA = await resolveWorkspaceCapabilityEntitlement(testDb.db, {
      workspaceId: a.workspaceId,
      capabilityCode: "ims_capability",
    });
    expect(decisionA.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decisionA.reasonCode).toBe(EntitlementReasonCode.DENY_TIER_ENTITLEMENT_MISSING);
    expect(decisionA.evidence.tierCode).toBe("MINI_RIDER"); // bukan tier B
  });

  it("extension instance milik workspace B tidak menghitung untuk workspace A", async () => {
    const a = await seedLicensedWorkspace(testDb.db, { suffix: "ext-a", tierCode: "MINI_RIDER" });
    const b = await seedLicensedWorkspace(testDb.db, { suffix: "ext-b", tierCode: "MINI_RIDER" });
    const seatType = await testDb.db.extensionType.findUniqueOrThrow({
      where: { code: "seat_package" },
    });
    const definition = await testDb.db.extensionDefinition.create({
      data: { code: "ent_test_seat_def", typeId: seatType.id, isActive: true },
    });
    await testDb.db.extensionInstance.create({
      data: {
        workspaceId: b.workspaceId,
        definitionId: definition.id,
        status: "ACTIVE",
        quantity: 10,
      },
    });

    const decision = await resolveWorkspaceCapabilityEntitlement(testDb.db, {
      workspaceId: a.workspaceId,
      capabilityCode: "core_event_workspace",
      requiredExtensionType: "seat_package",
    });
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.reasonCode).toBe(EntitlementReasonCode.DENY_EXTENSION_MISSING);
  });
});

describe("extension-aware entitlement (input model Phase 5-B, tanpa lifecycle 5-D)", () => {
  it("instance ACTIVE pada workspace → ALLOWED dengan extensionsActive di evidence", async () => {
    const ws = await seedLicensedWorkspace(testDb.db, { suffix: "ext-ok", tierCode: "MINI_RIDER" });
    const landingType = await testDb.db.extensionType.findUniqueOrThrow({
      where: { code: "workspace_landing" },
    });
    const definition = await testDb.db.extensionDefinition.create({
      data: { code: "ent_test_landing_def", typeId: landingType.id, isActive: true },
    });
    await testDb.db.extensionInstance.create({
      data: { workspaceId: ws.workspaceId, definitionId: definition.id, status: "ACTIVE" },
    });

    const decision = await resolveWorkspaceCapabilityEntitlement(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "core_event_workspace",
      requiredExtensionType: "workspace_landing",
    });
    expect(decision.decision).toBe(EntitlementDecisionValue.ALLOWED);
    expect(decision.evidence.extensionsActive).toEqual(["workspace_landing"]);
  });

  it("instance SUSPENDED berhenti berkontribusi → DENY_EXTENSION_MISSING", async () => {
    const ws = await seedLicensedWorkspace(testDb.db, { suffix: "ext-susp", tierCode: "MINI_RIDER" });
    const mobileType = await testDb.db.extensionType.findUniqueOrThrow({
      where: { code: "mobile_client" },
    });
    const definition = await testDb.db.extensionDefinition.create({
      data: { code: "ent_test_mobile_def", typeId: mobileType.id, isActive: true },
    });
    await testDb.db.extensionInstance.create({
      data: { workspaceId: ws.workspaceId, definitionId: definition.id, status: "SUSPENDED" },
    });

    const decision = await resolveWorkspaceCapabilityEntitlement(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "core_event_workspace",
      requiredExtensionType: "mobile_client",
    });
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.reasonCode).toBe(EntitlementReasonCode.DENY_EXTENSION_MISSING);
    expect(decision.evidence.extensionsActive).toEqual([]);
  });
});

describe("pemisahan Entitlement × Authorization (MC §2; prompt owner 5-C §6/§12)", () => {
  it("entitlement ALLOWED + owner + permission cocok → final ALLOW (dua lapis terpisah)", async () => {
    const ws = await seedLicensedWorkspace(testDb.db, { suffix: "sep-ok", tierCode: "ISO_RIDER" });
    const result = await authorizeWorkspaceCapability(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "ims_capability",
      session: "VALID",
      actorUserId: ws.ownerId,
      permission: Permission.WORKSPACE_UPDATE,
    });
    expect(result.entitlement.decision).toBe(EntitlementDecisionValue.ALLOWED);
    expect(result.authorization?.decision).toBe("ALLOW");
    expect(result.final.decision).toBe("ALLOW");
  });

  it("entitlement ALLOWED tapi member tanpa permission → DENY_PERMISSION_MISSING (license ≠ boleh semua)", async () => {
    const ws = await seedLicensedWorkspace(testDb.db, { suffix: "sep-perm", tierCode: "ISO_RIDER" });
    const member = await seedMember(testDb.db, {
      email: "member-sep-perm@entitlement.test",
      name: "Member sep-perm",
      workspaceId: ws.workspaceId,
    });
    const result = await authorizeWorkspaceCapability(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "ims_capability",
      session: "VALID",
      actorUserId: member.userId,
      permission: Permission.WORKSPACE_UPDATE,
    });
    expect(result.entitlement.decision).toBe(EntitlementDecisionValue.ALLOWED);
    expect(result.authorization?.decision).toBe("DENY");
    expect(result.authorization?.reasonCode).toBe("DENY_PERMISSION_MISSING");
    expect(result.final.decision).toBe("DENY");
    expect(result.final.reasonCode).toBe("DENY_PERMISSION_MISSING");
  });

  it("entitlement ALLOWED tapi bukan member → DENY_NOT_MEMBER", async () => {
    const ws = await seedLicensedWorkspace(testDb.db, { suffix: "sep-nonmember", tierCode: "MINI_RIDER" });
    const outsider = await testDb.db.user.create({
      data: { name: "Outsider", email: "outsider-sep@entitlement.test", emailVerified: new Date() },
    });
    const result = await authorizeWorkspaceCapability(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "core_event_workspace",
      session: "VALID",
      actorUserId: outsider.id,
      permission: Permission.WORKSPACE_READ,
    });
    expect(result.entitlement.decision).toBe(EntitlementDecisionValue.ALLOWED);
    expect(result.authorization?.reasonCode).toBe("DENY_NOT_MEMBER");
    expect(result.final.decision).toBe("DENY");
  });

  it("entitlement DENIED → short-circuit SEBELUM policy aktor (owner pun tidak lolos)", async () => {
    const ws = await seedLicensedWorkspace(testDb.db, { suffix: "sep-gate", tierCode: "MINI_RIDER" });
    const result = await authorizeWorkspaceCapability(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "crm",
      session: "VALID",
      actorUserId: ws.ownerId,
      permission: Permission.WORKSPACE_UPDATE,
    });
    expect(result.entitlement.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(result.entitlement.reasonCode).toBe(EntitlementReasonCode.DENY_TIER_ENTITLEMENT_MISSING);
    expect(result.authorization).toBeNull();
    expect(result.final.decision).toBe("DENY");
    expect(result.final.reasonCode).toBe(EntitlementReasonCode.DENY_TIER_ENTITLEMENT_MISSING);
  });

  it("sesi tidak valid → policy tetap deny meski entitlement ALLOWED", async () => {
    const ws = await seedLicensedWorkspace(testDb.db, { suffix: "sep-session", tierCode: "MINI_RIDER" });
    const result = await authorizeWorkspaceCapability(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "core_event_workspace",
      session: "ABSENT",
      actorUserId: ws.ownerId,
      permission: Permission.WORKSPACE_READ,
    });
    expect(result.entitlement.decision).toBe(EntitlementDecisionValue.ALLOWED);
    expect(result.authorization?.reasonCode).toBe("DENY_NO_SESSION");
    expect(result.final.decision).toBe("DENY");
  });
});

describe("fail closed di atas DB nyata", () => {
  it("capability tidak dikenal → kind UNKNOWN, DENIED (bukan allow, bukan crash)", async () => {
    const ws = await seedLicensedWorkspace(testDb.db, { suffix: "fc-unknown", tierCode: "MINI_RIDER" });
    const decision = await resolveWorkspaceCapabilityEntitlement(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "totally_unknown_capability",
    });
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.kind).toBe(EntitlementKind.UNKNOWN);
    expect(decision.reasonCode).toBe(EntitlementReasonCode.DENY_UNKNOWN_CAPABILITY);
  });

  it("requiredExtensionType di luar closed list owner → SYSTEM_ERROR fail closed", async () => {
    const ws = await seedLicensedWorkspace(testDb.db, { suffix: "fc-exttype", tierCode: "MINI_RIDER" });
    const decision = await resolveWorkspaceCapabilityEntitlement(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "core_event_workspace",
      requiredExtensionType: "hi_rider_addon",
    });
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.kind).toBe(EntitlementKind.SYSTEM_ERROR);
  });

  it("CHECK DB tetap menolak tier HI_RIDER/TOTAL_RIDER (guard engine = lapisan kedua)", async () => {
    for (const code of ["HI_RIDER", "TOTAL_RIDER"]) {
      await expect(
        testDb.db.licenseTier.create({ data: { code } })
      ).rejects.toThrow(/CHECK constraint failed/i);
    }
    const count = await testDb.db.licenseTier.count({
      where: { code: { in: ["HI_RIDER", "TOTAL_RIDER"] } },
    });
    expect(count).toBe(0);
  });
});

describe("audit keputusan entitlement (ENTITLEMENT_MODEL §10)", () => {
  it("denial tercatat: category LICENSE, outcome DENIED, reasonCode kanonik", async () => {
    const ws = await seedLicensedWorkspace(testDb.db, { suffix: "audit-deny", tierCode: "MINI_RIDER" });
    await authorizeWorkspaceCapability(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "crm",
      session: "VALID",
      actorUserId: ws.ownerId,
      permission: Permission.WORKSPACE_UPDATE,
    });
    const events = await testDb.db.auditEvent.findMany({
      where: { tenantWorkspaceId: ws.workspaceId, category: "LICENSE" },
    });
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe("entitlement.denied");
    expect(events[0].outcome).toBe("DENIED");
    expect(events[0].reasonCode).toBe("DENY_TIER_ENTITLEMENT_MISSING");
    expect(events[0].targetId).toBe("crm");
  });

  it("grant tercatat sebagai snapshot evidence (metadata sanitized, key aman)", async () => {
    const ws = await seedLicensedWorkspace(testDb.db, { suffix: "audit-grant", tierCode: "MINI_RIDER" });
    await authorizeWorkspaceCapability(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "core_event_workspace",
      session: "VALID",
      actorUserId: ws.ownerId,
      permission: Permission.WORKSPACE_READ,
    });
    const events = await testDb.db.auditEvent.findMany({
      where: { tenantWorkspaceId: ws.workspaceId, category: "LICENSE" },
    });
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe("entitlement.granted");
    expect(events[0].outcome).toBe("SUCCESS");
    expect(events[0].metadataJson).toContain(ws.licenseId);
    expect(events[0].metadataJson).toContain("MINI_RIDER");
  });

  it("audit=false menonaktifkan penulisan (pemanggil mengontrol)", async () => {
    const ws = await seedLicensedWorkspace(testDb.db, { suffix: "audit-off", tierCode: "MINI_RIDER" });
    await authorizeWorkspaceCapability(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "core_event_workspace",
      session: "VALID",
      actorUserId: ws.ownerId,
      permission: Permission.WORKSPACE_READ,
      audit: false,
    });
    const events = await testDb.db.auditEvent.findMany({
      where: { tenantWorkspaceId: ws.workspaceId, category: "LICENSE" },
    });
    expect(events).toHaveLength(0);
  });
});
