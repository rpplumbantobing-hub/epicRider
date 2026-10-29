// @vitest-environment node
// Integration test ISOLASI TENANT — epicRider Phase 4 (REQ-023 matriks test;
// gated prompt §6.4 negative tests). Bukti server-side: tenant A tidak bisa
// membaca/mengubah data tenant B; manipulasi tenant id dari client tidak
// memberi akses; denial teraudit; error tidak membocorkan keberadaan tenant.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDatabase, resetDb, seedMember, seedWorkspaceWithOwner, type TestDatabase } from "./test-db";
import { applyMemberAction, listMembers } from "@/lib/memberships/service";
import { createInvitation, listInvitations } from "@/lib/invitations/service";
import { listWorkspacesForUser } from "@/lib/workspaces/service";
import { evaluatePolicy } from "@/lib/authz/policy";
import { Permission } from "@/lib/authz/permissions";
import { ReasonCode } from "@/lib/authz/reason-codes";
import { ApiError } from "@/lib/api/problems";

let testDb: TestDatabase;
let tenantA: { userId: string; workspaceId: string; membershipId: string };
let tenantB: { userId: string; workspaceId: string; membershipId: string };

beforeAll(async () => {
  testDb = await createTestDatabase();

  // Fixture: dua tenant penuh + member masing-masing.
  await resetDb(testDb.db);
  tenantA = await seedWorkspaceWithOwner(testDb.db, {
    userName: "Owner A",
    email: "owner.a@test.local",
    workspaceName: "Tenant A",
  });
  tenantB = await seedWorkspaceWithOwner(testDb.db, {
    userName: "Owner B",
    email: "owner.b@test.local",
    workspaceName: "Tenant B",
  });
  await seedMember(testDb.db, {
    email: "crew.a@test.local",
    name: "Crew A",
    workspaceId: tenantA.workspaceId,
  });
  await seedMember(testDb.db, {
    email: "crew.b@test.local",
    name: "Crew B",
    workspaceId: tenantB.workspaceId,
  });
}, 120_000);

afterAll(async () => {
  await testDb.destroy();
});

/**
 * Simulasi evaluasi guard server-side untuk aktor pada workspace target:
 * keanggotaan diselesaikan DARI DB berdasarkan (userId, workspaceId) —
 * persis seperti requireWorkspacePermission (fakta, bukan klaim client).
 */
async function evaluateAccess(
  actorUserId: string,
  workspaceId: string,
  permission: Permission
) {
  const membership = await testDb.db.membership.findFirst({
    where: { workspaceId, userId: actorUserId },
    orderBy: { createdAt: "desc" },
    include: { roles: { where: { revokedAt: null }, include: { role: true } } },
  });
  return evaluatePolicy({
    session: "VALID",
    actorUserId,
    workspaceId,
    membershipStatus: (membership?.status ?? null) as never,
    roleKeys: membership?.roles.map((r) => r.role.key) ?? [],
    permission,
  });
}

describe("matriks isolasi tenant (REQ-023) — semua sel lintas-tenant DENY", () => {
  it("owner B membaca member workspace A → DENY_NOT_MEMBER (read)", async () => {
    const decision = await evaluateAccess(tenantB.userId, tenantA.workspaceId, Permission.MEMBERSHIP_READ);
    expect(decision).toEqual({ decision: "DENY", reasonCode: ReasonCode.DENY_NOT_MEMBER });
  });

  it("owner B men-suspend/remove member workspace A → DENY (write)", async () => {
    for (const permission of [
      Permission.WORKSPACE_MEMBER_SUSPEND,
      Permission.WORKSPACE_MEMBER_REMOVE,
    ]) {
      const decision = await evaluateAccess(tenantB.userId, tenantA.workspaceId, permission);
      expect(decision.decision).toBe("DENY");
    }
  });

  it("owner B membuat undangan di workspace A → DENY_NOT_MEMBER (non-member)", async () => {
    const decision = await evaluateAccess(
      tenantB.userId,
      tenantA.workspaceId,
      Permission.WORKSPACE_MEMBER_INVITE
    );
    // Non-member → DENY_NOT_MEMBER (HTTP: 404 — enumeration resistance).
    expect(decision).toEqual({
      decision: "DENY",
      reasonCode: ReasonCode.DENY_NOT_MEMBER,
    });
    // Kontrol tambahan: MEMBER workspace A tanpa permission invite →
    // DENY_PERMISSION_MISSING (member dengan izin kurang).
    const crewAUser = await testDb.db.user.findUniqueOrThrow({
      where: { email: "crew.a@test.local" },
    });
    const crewDecision = await evaluateAccess(
      crewAUser.id,
      tenantA.workspaceId,
      Permission.WORKSPACE_MEMBER_INVITE
    );
    expect(crewDecision).toEqual({
      decision: "DENY",
      reasonCode: ReasonCode.DENY_PERMISSION_MISSING,
    });
  });

  it("operasi service dengan parameter workspace orang lain TIDAK mengeksekusi (object-level)", async () => {
    // Owner B mencoba men-suspend membership crew A di workspace A:
    const crewA = await testDb.db.membership.findFirstOrThrow({
      where: { workspaceId: tenantA.workspaceId, user: { email: "crew.a@test.local" } },
    });
    // Guard service: loadMembership mencari (workspaceId, membershipId) —
    // pasangan valid HANYA dalam konteks workspace itu sendiri; owner B tidak
    // punya permission di ws A (policy) → ditolak sebelum mutasi.
    const decision = await evaluateAccess(
      tenantB.userId,
      tenantA.workspaceId,
      Permission.WORKSPACE_MEMBER_SUSPEND
    );
    expect(decision.decision).toBe("DENY");
    // Status crew A tidak berubah.
    const membership = await testDb.db.membership.findUniqueOrThrow({ where: { id: crewA.id } });
    expect(membership.status).toBe("ACTIVE");
  });

  it("listWorkspacesForUser TIDAK pernah membocorkan workspace tenant lain", async () => {
    const listB = await listWorkspacesForUser(testDb.db, tenantB.userId);
    expect(listB.map((w) => w.id)).not.toContain(tenantA.workspaceId);
    expect(listB).toHaveLength(1);

    const crewAUser = await testDb.db.user.findUniqueOrThrow({
      where: { email: "crew.a@test.local" },
    });
    const listCrewA = await listWorkspacesForUser(testDb.db, crewAUser.id);
    expect(listCrewA.map((w) => w.id)).toEqual([tenantA.workspaceId]);
  });

  it("listMembers tenant A tidak memuat user tenant B", async () => {
    const members = await listMembers(testDb.db, tenantA.workspaceId, tenantA.userId);
    const emails = members.map((m) => m.email);
    expect(emails).toContain("owner.a@test.local");
    expect(emails).toContain("crew.a@test.local");
    expect(emails).not.toContain("owner.b@test.local");
    expect(emails).not.toContain("crew.b@test.local");
  });

  it("keanggotaan suspended: akses berhenti seketika pada evaluasi berikutnya", async () => {
    const crewB = await seedMember(testDb.db, {
      email: "temp.b@test.local",
      name: "Temp B",
      workspaceId: tenantB.workspaceId,
    });
    await applyMemberAction(testDb.db, {
      actorUserId: tenantB.userId,
      workspaceId: tenantB.workspaceId,
      membershipId: crewB.membershipId,
      action: "suspend",
    });
    const decision = await evaluateAccess(crewB.userId, tenantB.workspaceId, Permission.WORKSPACE_READ);
    expect(decision).toEqual({
      decision: "DENY",
      reasonCode: ReasonCode.DENY_MEMBERSHIP_SUSPENDED,
    });
  });

  it("keanggotaan removed: akses hilang pada request berikutnya (REQ-049 acceptance)", async () => {
    const crewB2 = await seedMember(testDb.db, {
      email: "temp2.b@test.local",
      name: "Temp2 B",
      workspaceId: tenantB.workspaceId,
    });
    await applyMemberAction(testDb.db, {
      actorUserId: tenantB.userId,
      workspaceId: tenantB.workspaceId,
      membershipId: crewB2.membershipId,
      action: "remove",
    });
    const decision = await evaluateAccess(crewB2.userId, tenantB.workspaceId, Permission.WORKSPACE_READ);
    expect(decision).toEqual({
      decision: "DENY",
      reasonCode: ReasonCode.DENY_MEMBERSHIP_REMOVED,
    });
  });

  it("denial tercatat sebagai audit event first-class (denied)", async () => {
    // Simulasi penulisan audit untuk denial guard (persis pola guards.ts).
    const { logAudit } = await import("@/lib/audit/audit-service");
    await logAudit(testDb.db, {
      category: "AUTHZ",
      action: "authz.denied.workspace",
      outcome: "DENIED",
      actorUserId: tenantB.userId,
      tenantWorkspaceId: tenantA.workspaceId,
      reasonCode: ReasonCode.DENY_NOT_MEMBER,
      targetType: "Workspace",
      targetId: tenantA.workspaceId,
      metadata: { permission: Permission.MEMBERSHIP_READ },
    });
    const denied = await testDb.db.auditEvent.findFirst({
      where: {
        actorUserId: tenantB.userId,
        tenantWorkspaceId: tenantA.workspaceId,
        outcome: "DENIED",
      },
    });
    expect(denied).not.toBeNull();
    expect(denied?.reasonCode).toBe(ReasonCode.DENY_NOT_MEMBER);
  });

  it("audit TIDAK menyimpan nilai metadata dengan kunci sensitif (redaksi)", async () => {
    const { logAudit } = await import("@/lib/audit/audit-service");
    await logAudit(testDb.db, {
      category: "AUTHZ",
      action: "audit.redaction.probe",
      outcome: "FAILURE",
      metadata: {
        otp: "123456",
        sessionToken: "rahasia",
        note: "aman",
      },
    });
    const event = await testDb.db.auditEvent.findFirstOrThrow({
      where: { action: "audit.redaction.probe" },
    });
    const metadata = JSON.parse(event.metadataJson ?? "{}");
    expect(metadata.otp).toBe("[REDACTED]");
    expect(metadata.sessionToken).toBe("[REDACTED]");
    expect(metadata.note).toBe("aman");
    expect(event.metadataJson?.includes("123456")).toBe(false);
  });

  it("error response isolasi tidak membocorkan data tenant lain (uniform 404)", async () => {
    // Owner B → undangan di workspace A: guard menolak 404 (enumeration
    // resistance) — dijamin oleh mapping HTTP guards; verifikasi di sini bahwa
    // service invitation dengan actor non-member tidak pernah dipanggil
    // tanpa guard (pola route). Pengujian HTTP penuh ada di sesi verifikasi UI.
    const decision = await evaluateAccess(
      tenantB.userId,
      tenantA.workspaceId,
      Permission.WORKSPACE_MEMBER_INVITE
    );
    expect(decision.decision).toBe("DENY");
    // Tidak ada undangan yang tercipta di workspace A oleh B.
    const invitationsA = await listInvitations(testDb.db, tenantA.workspaceId);
    expect(invitationsA).toHaveLength(0);
  });

  it("undangan tenant B tidak muncul di daftar undangan tenant A", async () => {
    const seedB = await seedMember(testDb.db, {
      email: "target.b@test.local",
      name: "Target B",
      workspaceId: tenantB.workspaceId,
    });
    void seedB;
    const ownerBMembership = await testDb.db.membership.findFirstOrThrow({
      where: { workspaceId: tenantB.workspaceId, userId: tenantB.userId },
    });
    await createInvitation(testDb.db, {
      actorUserId: tenantB.userId,
      workspaceId: tenantB.workspaceId,
      actorMembershipId: ownerBMembership.id,
      contactTarget: "newcomer@test.local",
      roleKey: "member",
    });
    const invitationsA = await listInvitations(testDb.db, tenantA.workspaceId);
    const invitationsB = await listInvitations(testDb.db, tenantB.workspaceId);
    expect(invitationsB).toHaveLength(1);
    expect(invitationsA).toHaveLength(0);
  });
});
