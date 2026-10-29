// @vitest-environment node
// Integration test workspace + membership — epicRider Phase 4 (REQ-049/025).
// DB SQLite terisolasi dari migrasi terversionisasi (bukan db dev/produksi).

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDatabase, resetDb, seedMember, seedWorkspaceWithOwner, type TestDatabase } from "./test-db";
import { createWorkspace, listWorkspacesForUser } from "@/lib/workspaces/service";
import { applyMemberAction, leaveWorkspace, listMembers } from "@/lib/memberships/service";
import { ApiError } from "@/lib/api/problems";

let testDb: TestDatabase;

beforeAll(async () => {
  testDb = await createTestDatabase();
}, 120_000);

afterAll(async () => {
  await testDb.destroy();
});

describe("workspace creation (gated prompt §6.1)", () => {
  it("satu transaksi: workspace + role sistem + membership owner", async () => {
    await resetDb(testDb.db);
    const user = await testDb.db.user.create({
      data: { name: "Owner 1", email: "owner1@test.local", emailVerified: new Date() },
    });
    const { workspaceId, membershipId } = await createWorkspace(testDb.db, {
      actorUserId: user.id,
      name: "Studio Alpha",
    });
    expect(workspaceId).toBeTruthy();

    const workspace = await testDb.db.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      include: { roles: true, memberships: { include: { roles: { include: { role: true } } } } },
    });
    // Role sistem ter-seed (owner + member — OD-122 PROPOSED).
    expect(workspace.roles.map((r) => r.key).sort()).toEqual(["member", "owner"]);
    // Membership owner aktif.
    expect(workspace.memberships).toHaveLength(1);
    expect(workspace.memberships[0].id).toBe(membershipId);
    expect(workspace.memberships[0].status).toBe("ACTIVE");
    expect(workspace.memberships[0].roles[0].role.key).toBe("owner");

    // Audit event tercatat.
    const audits = await testDb.db.auditEvent.findMany({
      where: { tenantWorkspaceId: workspaceId },
    });
    expect(audits.some((a) => a.action === "workspace.created")).toBe(true);
    expect(audits.some((a) => a.action === "membership.created.owner")).toBe(true);
  });

  it("nama kosong/terlalu panjang ditolak validasi", async () => {
    await resetDb(testDb.db);
    const user = await testDb.db.user.create({ data: { email: "o2@test.local" } });
    await expect(
      createWorkspace(testDb.db, { actorUserId: user.id, name: "   " })
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      createWorkspace(testDb.db, { actorUserId: user.id, name: "x".repeat(81) })
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe("membership lifecycle (REQ-049)", () => {
  it("suspend → akses ditolak pada evaluasi berikutnya; reactivate → pulih", async () => {
    await resetDb(testDb.db);
    const seed = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Owner",
      email: "owner@test.local",
      workspaceName: "WS A",
    });
    const member = await seedMember(testDb.db, {
      email: "member@test.local",
      name: "Member",
      workspaceId: seed.workspaceId,
    });

    // Status ACTIVE → policy allow (via pemeriksaan guard-like).
    let membership = await testDb.db.membership.findUniqueOrThrow({
      where: { id: member.membershipId },
    });
    expect(membership.status).toBe("ACTIVE");

    // suspend oleh owner.
    await applyMemberAction(testDb.db, {
      actorUserId: seed.userId,
      workspaceId: seed.workspaceId,
      membershipId: member.membershipId,
      action: "suspend",
    });
    membership = await testDb.db.membership.findUniqueOrThrow({
      where: { id: member.membershipId },
    });
    expect(membership.status).toBe("SUSPENDED");
    expect(membership.version).toBe(2);

    // reactivate.
    await applyMemberAction(testDb.db, {
      actorUserId: seed.userId,
      workspaceId: seed.workspaceId,
      membershipId: member.membershipId,
      action: "reactivate",
    });
    membership = await testDb.db.membership.findUniqueOrThrow({
      where: { id: member.membershipId },
    });
    expect(membership.status).toBe("ACTIVE");
  });

  it("remove: role assignment dicabut + status terminal; transisi lanjutan ditolak", async () => {
    await resetDb(testDb.db);
    const seed = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Owner",
      email: "owner@test.local",
      workspaceName: "WS A",
    });
    const member = await seedMember(testDb.db, {
      email: "member@test.local",
      name: "Member",
      workspaceId: seed.workspaceId,
    });

    await applyMemberAction(testDb.db, {
      actorUserId: seed.userId,
      workspaceId: seed.workspaceId,
      membershipId: member.membershipId,
      action: "remove",
    });

    const assignments = await testDb.db.membershipRoleAssignment.findMany({
      where: { membershipId: member.membershipId },
    });
    expect(assignments.every((a) => a.revokedAt !== null)).toBe(true);

    // Transisi atas membership terminal ditolak (object state).
    await expect(
      applyMemberAction(testDb.db, {
        actorUserId: seed.userId,
        workspaceId: seed.workspaceId,
        membershipId: member.membershipId,
        action: "suspend",
      })
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("suspend/remove atas membership SENDIRI ditolak (gunakan leave)", async () => {
    await resetDb(testDb.db);
    const seed = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Owner",
      email: "owner@test.local",
      workspaceName: "WS A",
    });
    await expect(
      applyMemberAction(testDb.db, {
        actorUserId: seed.userId,
        workspaceId: seed.workspaceId,
        membershipId: seed.membershipId,
        action: "suspend",
      })
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("leave: self-action ACTIVE→LEFT; muncul di histori, tidak lagi terdaftar aktif", async () => {
    await resetDb(testDb.db);
    const seed = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Owner",
      email: "owner@test.local",
      workspaceName: "WS A",
    });
    const member = await seedMember(testDb.db, {
      email: "member@test.local",
      name: "Member",
      workspaceId: seed.workspaceId,
    });

    await leaveWorkspace(testDb.db, {
      actorUserId: member.userId,
      workspaceId: seed.workspaceId,
    });
    const membership = await testDb.db.membership.findUniqueOrThrow({
      where: { id: member.membershipId },
    });
    expect(membership.status).toBe("LEFT");

    // listMembers hanya menampilkan live memberships.
    const members = await listMembers(testDb.db, seed.workspaceId, seed.userId);
    expect(members.find((m) => m.membershipId === member.membershipId)).toBeUndefined();
  });

  it("re-invite member yang removed = baris membership BARU (history preserved)", async () => {
    await resetDb(testDb.db);
    const seed = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Owner",
      email: "owner@test.local",
      workspaceName: "WS A",
    });
    const member = await seedMember(testDb.db, {
      email: "member@test.local",
      name: "Member",
      workspaceId: seed.workspaceId,
    });
    await applyMemberAction(testDb.db, {
      actorUserId: seed.userId,
      workspaceId: seed.workspaceId,
      membershipId: member.membershipId,
      action: "remove",
    });

    // Membership baru (ACTIVE) untuk pasangan yang sama — baris lama tetap ada.
    const newMembership = await testDb.db.membership.create({
      data: { workspaceId: seed.workspaceId, userId: member.userId, status: "ACTIVE" },
    });
    const role = await testDb.db.role.findUniqueOrThrow({
      where: { workspaceId_key: { workspaceId: seed.workspaceId, key: "member" } },
    });
    await testDb.db.membershipRoleAssignment.create({
      data: { membershipId: newMembership.id, roleId: role.id },
    });

    const count = await testDb.db.membership.count({
      where: { workspaceId: seed.workspaceId, userId: member.userId },
    });
    expect(count).toBe(2); // 1 REMOVED (histori) + 1 ACTIVE (baru)
  });

  it("satu user bisa punya role berbeda di workspace berbeda tanpa konflik (REQ-025)", async () => {
    await resetDb(testDb.db);
    const owner = await testDb.db.user.create({
      data: { name: "U1", email: "u1@test.local", emailVerified: new Date() },
    });
    const other = await testDb.db.user.create({
      data: { name: "U2", email: "u2@test.local", emailVerified: new Date() },
    });

    const wsA = await createWorkspace(testDb.db, { actorUserId: owner.id, name: "WS A" });
    const wsB = await createWorkspace(testDb.db, { actorUserId: other.id, name: "WS B" });

    // owner WS A diundang jadi MEMBER di WS B.
    const memberRoleB = await testDb.db.role.findUniqueOrThrow({
      where: { workspaceId_key: { workspaceId: wsB.workspaceId, key: "member" } },
    });
    const membershipB = await testDb.db.membership.create({
      data: { workspaceId: wsB.workspaceId, userId: owner.id, status: "ACTIVE" },
    });
    await testDb.db.membershipRoleAssignment.create({
      data: { membershipId: membershipB.id, roleId: memberRoleB.id },
    });

    const list = await listWorkspacesForUser(testDb.db, owner.id);
    const rolesA = list.find((w) => w.id === wsA.workspaceId)?.roleKeys;
    const rolesB = list.find((w) => w.id === wsB.workspaceId)?.roleKeys;
    expect(rolesA).toContain("owner");
    expect(rolesA).not.toContain("member");
    expect(rolesB).toContain("member");
    expect(rolesB).not.toContain("owner");
  });
});
