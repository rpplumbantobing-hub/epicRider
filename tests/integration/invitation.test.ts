// @vitest-environment node
// Integration test undangan — epicRider Phase 4 (REQ-051; gated prompt §6.2).
// Token hash-only, sekali pakai, expiry, revocation, wrong-recipient, role
// terikat server-side, accept butuh identitas cocok.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createTestDatabase,
  resetDb,
  seedWorkspaceWithOwner,
  type TestDatabase,
} from "./test-db";
import {
  acceptInvitation,
  acceptInvitationById,
  createInvitation,
  listMyPendingInvitations,
  revokeInvitation,
} from "@/lib/invitations/service";
import { ApiError, ApiErrorCode } from "@/lib/api/problems";
import { createHash } from "node:crypto";

let testDb: TestDatabase;
let seed: { userId: string; workspaceId: string; membershipId: string };

beforeAll(async () => {
  testDb = await createTestDatabase();
}, 120_000);

afterAll(async () => {
  await testDb.destroy();
});

async function freshSeed() {
  await resetDb(testDb.db);
  seed = await seedWorkspaceWithOwner(testDb.db, {
    userName: "Owner",
    email: "owner@test.local",
    workspaceName: "WS Undang",
  });
}

describe("pembuatan undangan (REQ-051)", () => {
  it("token acak kriptografis; DB hanya menyimpan hash", async () => {
    await freshSeed();
    const { invitation, token } = await createInvitation(testDb.db, {
      actorUserId: seed.userId,
      workspaceId: seed.workspaceId,
      actorMembershipId: seed.membershipId,
      contactTarget: "kru@Example.com",
      roleKey: "member",
    });
    expect(token.length).toBeGreaterThanOrEqual(40); // 32 byte base64url ≈ 43 char
    const stored = await testDb.db.invitation.findUniqueOrThrow({
      where: { id: invitation.id },
    });
    expect(stored.tokenHash).toBe(createHash("sha256").update(token).digest("hex"));
    expect(stored.tokenHash).not.toContain(token);
    expect(stored.status).toBe("PENDING");
    expect(stored.contactTarget).toBe("kru@example.com"); // ternormalisasi
  });

  it("role yang ditawarkan terikat server-side; menawarkan owner ditolak Phase 4", async () => {
    await freshSeed();
    await expect(
      createInvitation(testDb.db, {
        actorUserId: seed.userId,
        workspaceId: seed.workspaceId,
        actorMembershipId: seed.membershipId,
        contactTarget: "x@test.local",
        roleKey: "owner",
      })
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      createInvitation(testDb.db, {
        actorUserId: seed.userId,
        workspaceId: seed.workspaceId,
        actorMembershipId: seed.membershipId,
        contactTarget: "x@test.local",
        roleKey: "superadmin",
      })
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("email tidak valid ditolak", async () => {
    await freshSeed();
    await expect(
      createInvitation(testDb.db, {
        actorUserId: seed.userId,
        workspaceId: seed.workspaceId,
        actorMembershipId: seed.membershipId,
        contactTarget: "bukan-email",
        roleKey: "member",
      })
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe("penerimaan undangan (REQ-051)", () => {
  it("happy path: identitas cocok → membership ACTIVE + role terikat + status ACCEPTED", async () => {
    await freshSeed();
    const { token } = await createInvitation(testDb.db, {
      actorUserId: seed.userId,
      workspaceId: seed.workspaceId,
      actorMembershipId: seed.membershipId,
      contactTarget: "kru@test.local",
      roleKey: "member",
    });
    const recipient = await testDb.db.user.create({
      data: { name: "Kru Baru", email: "kru@test.local", emailVerified: new Date() },
    });

    const result = await acceptInvitation(testDb.db, {
      actorUserId: recipient.id,
      actorEmail: "kru@test.local",
      token,
    });
    expect(result.workspaceId).toBe(seed.workspaceId);

    const membership = await testDb.db.membership.findFirstOrThrow({
      where: { workspaceId: seed.workspaceId, userId: recipient.id },
      include: { roles: { include: { role: true } } },
    });
    expect(membership.status).toBe("ACTIVE");
    expect(membership.roles[0].role.key).toBe("member");

    const invitation = await testDb.db.invitation.findFirstOrThrow({
      where: { contactTarget: "kru@test.local" },
    });
    expect(invitation.status).toBe("ACCEPTED");
    expect(invitation.usedAt).not.toBeNull();
  });

  it("REPLAY: token yang sama tidak bisa dipakai dua kali (konsumsi atomik)", async () => {
    await freshSeed();
    const { token } = await createInvitation(testDb.db, {
      actorUserId: seed.userId,
      workspaceId: seed.workspaceId,
      actorMembershipId: seed.membershipId,
      contactTarget: "kru@test.local",
      roleKey: "member",
    });
    const recipient = await testDb.db.user.create({
      data: { email: "kru@test.local", emailVerified: new Date() },
    });
    await acceptInvitation(testDb.db, {
      actorUserId: recipient.id,
      actorEmail: "kru@test.local",
      token,
    });
    // Hapus membership agar tidak kena ALREADY_MEMBER → buktikan replay ditolak.
    await testDb.db.membershipRoleAssignment.deleteMany({});
    await testDb.db.membership.deleteMany({});
    await expect(
      acceptInvitation(testDb.db, {
        actorUserId: recipient.id,
        actorEmail: "kru@test.local",
        token,
      })
    ).rejects.toMatchObject({ code: "DENY_INVALID_INVITE" });
  });

  it("EXPIRED: undangan kedaluwarsa ditolak + status di-update", async () => {
    await freshSeed();
    const { invitation, token } = await createInvitation(testDb.db, {
      actorUserId: seed.userId,
      workspaceId: seed.workspaceId,
      actorMembershipId: seed.membershipId,
      contactTarget: "kru@test.local",
      roleKey: "member",
    });
    // Paksa kedaluwarsa (pemegang token sah mencoba setelah lewat masa berlaku).
    await testDb.db.invitation.update({
      where: { id: invitation.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const recipient = await testDb.db.user.create({
      data: { email: "kru@test.local", emailVerified: new Date() },
    });
    await expect(
      acceptInvitation(testDb.db, {
        actorUserId: recipient.id,
        actorEmail: "kru@test.local",
        token,
      })
    ).rejects.toMatchObject({ code: "DENY_INVALID_INVITE" });
    const stored = await testDb.db.invitation.findUniqueOrThrow({
      where: { id: invitation.id },
    });
    expect(stored.status).toBe("EXPIRED");
  });

  it("REVOKED: undangan dicabut ditolak", async () => {
    await freshSeed();
    const created = await createInvitation(testDb.db, {
      actorUserId: seed.userId,
      workspaceId: seed.workspaceId,
      actorMembershipId: seed.membershipId,
      contactTarget: "kru@test.local",
      roleKey: "member",
    });
    await revokeInvitation(testDb.db, {
      actorUserId: seed.userId,
      workspaceId: seed.workspaceId,
      invitationId: created.invitation.id,
    });
    const recipient = await testDb.db.user.create({
      data: { email: "kru@test.local", emailVerified: new Date() },
    });
    await expect(
      acceptInvitation(testDb.db, {
        actorUserId: recipient.id,
        actorEmail: "kru@test.local",
        token: created.token,
      })
    ).rejects.toMatchObject({ code: "DENY_INVALID_INVITE" });
  });

  it("WRONG RECIPIENT: identitas tidak cocok ditolak (kepemilikan URL tidak cukup)", async () => {
    await freshSeed();
    const { token } = await createInvitation(testDb.db, {
      actorUserId: seed.userId,
      workspaceId: seed.workspaceId,
      actorMembershipId: seed.membershipId,
      contactTarget: "kru@test.local",
      roleKey: "member",
    });
    const attacker = await testDb.db.user.create({
      data: { name: "Bukan Penerima", email: "attacker@test.local", emailVerified: new Date() },
    });
    await expect(
      acceptInvitation(testDb.db, {
        actorUserId: attacker.id,
        actorEmail: "attacker@test.local",
        token,
      })
    ).rejects.toMatchObject({ code: "DENY_NOT_MEMBER" });
    // Undangan TIDAK terkonsumsi.
    const invitation = await testDb.db.invitation.findFirstOrThrow({
      where: { contactTarget: "kru@test.local" },
    });
    expect(invitation.status).toBe("PENDING");
  });

  it("ALREADY MEMBER: penerima yang sudah member ditolak tanpa mengonsumsi", async () => {
    await freshSeed();
    const { token } = await createInvitation(testDb.db, {
      actorUserId: seed.userId,
      workspaceId: seed.workspaceId,
      actorMembershipId: seed.membershipId,
      contactTarget: "owner@test.local", // owner sendiri = sudah member
      roleKey: "member",
    });
    await expect(
      acceptInvitation(testDb.db, {
        actorUserId: seed.userId,
        actorEmail: "owner@test.local",
        token,
      })
    ).rejects.toMatchObject({ code: ApiErrorCode.ALREADY_MEMBER });
    const invitation = await testDb.db.invitation.findFirstOrThrow({
      where: { contactTarget: "owner@test.local" },
    });
    expect(invitation.status).toBe("PENDING"); // rollback — tidak terkonsumsi
  });

  it("accept-by-id dari daftar 'undangan saya' (identitas dicocokkan server-side)", async () => {
    await freshSeed();
    const { invitation } = await createInvitation(testDb.db, {
      actorUserId: seed.userId,
      workspaceId: seed.workspaceId,
      actorMembershipId: seed.membershipId,
      contactTarget: "kru@test.local",
      roleKey: "member",
    });
    const recipient = await testDb.db.user.create({
      data: { email: "kru@test.local", emailVerified: new Date() },
    });
    // Daftar undangan milik penerima memuat undangan ini.
    const mine = await listMyPendingInvitations(testDb.db, {
      userId: recipient.id,
      email: "kru@test.local",
    });
    expect(mine.map((i) => i.id)).toContain(invitation.id);
    // Terima by id.
    const result = await acceptInvitationById(testDb.db, {
      actorUserId: recipient.id,
      actorEmail: "kru@test.local",
      invitationId: invitation.id,
    });
    expect(result.workspaceId).toBe(seed.workspaceId);
  });

  it("listMyPendingInvitations TIDAK membocorkan undangan orang lain", async () => {
    await freshSeed();
    await createInvitation(testDb.db, {
      actorUserId: seed.userId,
      workspaceId: seed.workspaceId,
      actorMembershipId: seed.membershipId,
      contactTarget: "kru@test.local",
      roleKey: "member",
    });
    const someoneElse = await testDb.db.user.create({
      data: { email: "lain@test.local", emailVerified: new Date() },
    });
    const mine = await listMyPendingInvitations(testDb.db, {
      userId: someoneElse.id,
      email: "lain@test.local",
    });
    expect(mine).toHaveLength(0);
  });
});
