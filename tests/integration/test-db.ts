// Helper database test terisolasi — epicRider Phase 4.
//
// Setiap FILE test integration mendapat database SQLite sendiri di tmpdir,
// dibuat dari MIGRASI TERVERSIONISASI (prisma migrate deploy) — bukan db
// dev/produksi, bukan db:push (gated prompt §7.5: migrasi terkontrol pada
// database terisolasi/disposable).

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const WORKTREE_ROOT = path.resolve(__dirname, "../..");

export interface TestDatabase {
  db: PrismaClient;
  /** Hapus file db + disconnect (panggil di afterAll). */
  destroy: () => Promise<void>;
}

export async function createTestDatabase(): Promise<TestDatabase> {
  const dir = mkdtempSync(path.join(tmpdir(), `epicrider-test-${randomBytes(4).toString("hex")}-`));
  const dbPath = path.join(dir, "test.db");
  const url = `file:${dbPath}`;

  // Terapkan migrasi terversionisasi ke db kosong (subprocess; env eksplisit).
  const result = spawnSync(
    "bunx",
    ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"],
    {
      cwd: WORKTREE_ROOT,
      env: { ...process.env, DATABASE_URL: url },
      encoding: "utf8",
      timeout: 120_000,
    }
  );
  if (result.status !== 0) {
    throw new Error(
      `prisma migrate deploy gagal (status ${result.status}):\n${result.stdout}\n${result.stderr}`
    );
  }

  const db = new PrismaClient({
    datasources: { db: { url } },
    log: ["error"],
  });

  return {
    db,
    async destroy() {
      await db.$disconnect();
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // best-effort (tmpdir dibersihkan OS)
      }
    },
  };
}

/** Bersihkan seluruh baris (dependency order) — db disposable, aman. */
export async function resetDb(db: PrismaClient): Promise<void> {
  // Phase 5-B: licensing child-first (FK Restrict — harus sebelum workspace/
  // licenseTier/capability/extensionType/extensionDefinition dihapus).
  await db.extensionInstance.deleteMany();
  await db.tierQuota.deleteMany();
  await db.capabilityRule.deleteMany();
  await db.extensionDefinition.deleteMany();
  await db.extensionType.deleteMany();
  await db.capability.deleteMany();
  await db.license.deleteMany();
  await db.licenseTier.deleteMany();
  await db.membershipRoleAssignment.deleteMany();
  await db.invitation.deleteMany();
  await db.membership.deleteMany();
  await db.role.deleteMany();
  await db.workspace.deleteMany();
  await db.verificationRequest.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.developerRoleAssignment.deleteMany();
  await db.auditEvent.deleteMany();
  await db.user.deleteMany();
}

/** User + membership owner + workspace standar untuk test. */
export async function seedWorkspaceWithOwner(
  db: PrismaClient,
  params: { userName: string; email: string; workspaceName: string }
): Promise<{ userId: string; workspaceId: string; membershipId: string; roleId: string }> {
  const user = await db.user.create({
    data: { name: params.userName, email: params.email, emailVerified: new Date() },
  });
  const workspace = await db.workspace.create({
    data: { name: params.workspaceName, createdByUserId: user.id },
  });
  const ownerRole = await db.role.create({
    data: { workspaceId: workspace.id, key: "owner", isSystem: true },
  });
  await db.role.create({ data: { workspaceId: workspace.id, key: "member", isSystem: true } });
  const membership = await db.membership.create({
    data: { workspaceId: workspace.id, userId: user.id, status: "ACTIVE" },
  });
  await db.membershipRoleAssignment.create({
    data: { membershipId: membership.id, roleId: ownerRole.id, grantedBy: user.id },
  });
  return {
    userId: user.id,
    workspaceId: workspace.id,
    membershipId: membership.id,
    roleId: ownerRole.id,
  };
}

/** Tambah member biasa ke workspace. */
export async function seedMember(
  db: PrismaClient,
  params: { email: string; name: string; workspaceId: string; roleKey?: "owner" | "member" }
): Promise<{ userId: string; membershipId: string }> {
  const user = await db.user.create({
    data: { name: params.name, email: params.email, emailVerified: new Date() },
  });
  const role = await db.role.findUniqueOrThrow({
    where: { workspaceId_key: { workspaceId: params.workspaceId, key: params.roleKey ?? "member" } },
  });
  const membership = await db.membership.create({
    data: { workspaceId: params.workspaceId, userId: user.id, status: "ACTIVE" },
  });
  await db.membershipRoleAssignment.create({
    data: { membershipId: membership.id, roleId: role.id },
  });
  return { userId: user.id, membershipId: membership.id };
}
