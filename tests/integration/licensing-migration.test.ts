// @vitest-environment node
// Integration test migration-on-existing-data — epicRider Phase 5-B (REQ-029).
//
// Membuktikan, terhadap file migration ASLI repo (byte-copy ke staging tmpdir):
// 1. Database dimulai sebagai representasi data Phase 4 (migrate deploy tahap
//    Phase 4 + data representatif: user, workspace, membership termasuk
//    histori REMOVED, role, assignment, undangan, audit).
// 2. Migration Phase 5-B diterapkan DI ATAS data tersebut — TANPA reset,
//    TANPA db:push --accept-data-loss (semua via `prisma migrate deploy`).
// 3. Seluruh data Phase 4 tetap utuh (nilai per baris identik).
// 4. Deployment ketiga idempoten — migration baru dapat diterapkan normal.
// 5. Constraint Phase 5-B aktif setelah migration (partial unique ACTIVE,
//    CHECK closed-set tier) + seed/reference tersedia.
// 6. Migration Phase 5-B aditif (hanya CREATE TABLE/INDEX + INSERT katalog),
//    tidak destruktif; file migration Phase 4 tidak diubah vs HEAD.
//
// Database = SQLite disposable di tmpdir; DB dev/produksi TIDAK disentuh.
// Prisma CLI dipanggil dari node_modules project lokal (bukan global cache).

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  CAPABILITY_CODES,
  EXTENSION_TYPE_CODES,
  LICENSE_TIER_CODES,
  TIER_CAPABILITY_MATRIX,
} from "@/lib/licensing/vocabulary";

const ROOT = path.resolve(__dirname, "../..");
const PRISMA_BIN = path.join(ROOT, "node_modules", ".bin", "prisma");
const MIGRATIONS_DIR = path.join(ROOT, "prisma", "migrations");
const PHASE4 = "20261028183022_phase4_identity_workspace_foundation";
const PHASE5B = "20261030124013_phase5b_licensing_domain_foundation";
// Phase 5-D: direktori migration lifecycle invariants (satu-satunya tambahan
// lain yang sah di samping 5-B; preseden penyesuaian asumsi state pasca-commit
// dari Phase 5-C).
const PHASE5D = "20261031090000_phase5d_lifecycle_invariants";

interface Phase4Snapshot {
  usersJson: string;
  workspacesJson: string;
  membershipStatuses: string[];
  rolesJson: string;
  assignments: number;
  invitationsJson: string;
  auditsJson: string;
}

/** Normalisasi deterministik untuk pembandingan snapshot (urutan independen). */
function sortedJson<T>(rows: T[]): string {
  return JSON.stringify(rows.map((r) => JSON.stringify(r)).sort());
}

let dir: string;
let dbPath: string;
let db: PrismaClient;
let snapshot: Phase4Snapshot;

function runPrismaDeploy(stage: string, url: string) {
  return spawnSync(
    PRISMA_BIN,
    ["migrate", "deploy", "--schema", path.join(stage, "schema.prisma")],
    {
      cwd: ROOT,
      env: { ...process.env, DATABASE_URL: url },
      encoding: "utf8",
      timeout: 120_000,
    }
  );
}

/** Helper asersi penolakan constraint DB (P2002/CHECK). */
function expectDbRejection(error: unknown, match: RegExp): void {
  expect(error).toBeInstanceOf(Error);
  const message = error instanceof Error ? error.message : String(error);
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  expect(`${code}\n${message}`).toMatch(match);
}

beforeAll(async () => {
  // Dependency Prisma WAJIB dari node_modules project lokal (bukan global cache).
  expect(existsSync(PRISMA_BIN)).toBe(true);

  dir = mkdtempSync(path.join(tmpdir(), "epicrider-mig-5b-"));
  dbPath = path.join(dir, "phase4-then-5b.db");
  const url = `file:${dbPath}`;
  mkdirSync(path.join(dir, "migrations"));
  cpSync(
    path.join(MIGRATIONS_DIR, "migration_lock.toml"),
    path.join(dir, "migrations", "migration_lock.toml")
  );
  cpSync(path.join(MIGRATIONS_DIR, PHASE4), path.join(dir, "migrations", PHASE4), {
    recursive: true,
  });
  cpSync(path.join(ROOT, "prisma", "schema.prisma"), path.join(dir, "schema.prisma"));

  // ===== Tahap 1: database merepresentasikan data Phase 4 =====
  const r1 = runPrismaDeploy(dir, url);
  if (r1.status !== 0) {
    throw new Error(`migrate deploy (Phase 4) gagal:\n${r1.stdout}\n${r1.stderr}`);
  }
  const out1 = `${r1.stdout}\n${r1.stderr}`;
  expect(out1).toContain(PHASE4);
  expect(out1).not.toContain(PHASE5B);

  db = new PrismaClient({ datasources: { db: { url } }, log: ["error"] });

  // Data representatif Phase 4 — identitas, workspace, membership (termasuk
  // histori), role, assignment, undangan, audit.
  const owner = await db.user.create({
    data: { name: "Owner Migration", email: "owner@migration.test", emailVerified: new Date() },
  });
  const member = await db.user.create({
    data: { name: "Member Migration", email: "member@migration.test" },
  });
  const w1 = await db.workspace.create({
    data: { name: "Studio Migration 1", createdByUserId: owner.id },
  });
  const w2 = await db.workspace.create({ data: { name: "Studio Migration 2" } });
  const roleOwnerW1 = await db.role.create({ data: { workspaceId: w1.id, key: "owner" } });
  await db.role.create({ data: { workspaceId: w1.id, key: "member" } });
  await db.role.create({ data: { workspaceId: w2.id, key: "owner" } });
  await db.role.create({ data: { workspaceId: w2.id, key: "member" } });
  const mOwner = await db.membership.create({
    data: { workspaceId: w1.id, userId: owner.id, status: "ACTIVE" },
  });
  await db.membership.create({
    data: { workspaceId: w1.id, userId: member.id, status: "REMOVED" }, // histori
  });
  await db.membership.create({
    data: { workspaceId: w2.id, userId: member.id, status: "ACTIVE" },
  });
  await db.membershipRoleAssignment.create({
    data: { membershipId: mOwner.id, roleId: roleOwnerW1.id, grantedBy: owner.id },
  });
  await db.invitation.create({
    data: {
      workspaceId: w1.id,
      roleId: roleOwnerW1.id,
      contactTarget: "newcomer@migration.test",
      tokenHash: "a".repeat(64),
      expiresAt: new Date(Date.now() + 86_400_000),
    },
  });
  await db.auditEvent.create({
    data: {
      category: "WORKSPACE",
      action: "workspace.created",
      outcome: "SUCCESS",
      actorUserId: owner.id,
      tenantWorkspaceId: w1.id,
    },
  });

  snapshot = {
    usersJson: sortedJson(
      await db.user.findMany({ select: { email: true, name: true, status: true } })
    ),
    workspacesJson: sortedJson(
      await db.workspace.findMany({ select: { name: true, status: true } })
    ),
    membershipStatuses: (await db.membership.findMany({ select: { status: true } }))
      .map((m) => m.status)
      .sort(),
    rolesJson: sortedJson(await db.role.findMany({ select: { key: true, isSystem: true } })),
    assignments: await db.membershipRoleAssignment.count(),
    invitationsJson: sortedJson(
      await db.invitation.findMany({
        select: { contactTarget: true, status: true, tokenHash: true },
      })
    ),
    auditsJson: sortedJson(
      await db.auditEvent.findMany({ select: { category: true, action: true, outcome: true } })
    ),
  };
  expect(snapshot.usersJson).toContain("owner@migration.test");
  expect(snapshot.membershipStatuses).toEqual(["ACTIVE", "ACTIVE", "REMOVED"]);

  // ===== Tahap 2: migration Phase 5-B di atas data existing — TANPA reset =====
  cpSync(path.join(MIGRATIONS_DIR, PHASE5B), path.join(dir, "migrations", PHASE5B), {
    recursive: true,
  });
  const r2 = runPrismaDeploy(dir, url);
  if (r2.status !== 0) {
    throw new Error(`migrate deploy (Phase 5-B) gagal:\n${r2.stdout}\n${r2.stderr}`);
  }
  const out2 = `${r2.stdout}\n${r2.stderr}`;
  expect(out2).toContain(PHASE5B);
  // Phase 4 TIDAK diterapkan ulang.
  expect(out2).not.toContain(`Applying migration \`${PHASE4}\``);
}, 240_000);

afterAll(async () => {
  if (db) await db.$disconnect();
  try {
    if (dir) rmSync(dir, { recursive: true, force: true });
  } catch {
    // best-effort (tmpdir dibersihkan OS)
  }
});

describe("migration diterapkan pada data Phase 4 existing (tanpa reset)", () => {
  it("_prisma_migrations mencatat tepat 2 migration berurutan: Phase 4 → Phase 5-B", async () => {
    const rows = await db.$queryRaw<{
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
    }[]>`SELECT "migration_name", "finished_at", "rolled_back_at" FROM "_prisma_migrations" ORDER BY "started_at"`;
    expect(rows.map((r) => r.migration_name)).toEqual([PHASE4, PHASE5B]);
    expect(rows.every((r) => r.finished_at !== null && r.rolled_back_at === null)).toBe(true);
    // Catatan mekanisme migration ini juga membuktikan alur BUKAN
    // db:push --accept-data-loss (db push tidak mencatat _prisma_migrations).
  });

  it("deployment ketiga idempoten — migration diterapkan secara normal tanpa efek ulang", async () => {
    const r3 = runPrismaDeploy(dir, `file:${dbPath}`);
    expect(r3.status).toBe(0);
    const out3 = `${r3.stdout}\n${r3.stderr}`;
    expect(out3).not.toContain("Applying migration");
    expect(await db.licenseTier.count()).toBe(3); // seed tidak terduplikasi
  });

  it("seluruh data Phase 4 tetap utuh — nilai per baris identik", async () => {
    expect(
      sortedJson(await db.user.findMany({ select: { email: true, name: true, status: true } }))
    ).toBe(snapshot.usersJson);
    expect(
      sortedJson(await db.workspace.findMany({ select: { name: true, status: true } }))
    ).toBe(snapshot.workspacesJson);
    const membershipStatuses = (await db.membership.findMany({ select: { status: true } }))
      .map((m) => m.status)
      .sort();
    expect(membershipStatuses).toEqual(snapshot.membershipStatuses);
    expect(
      sortedJson(await db.role.findMany({ select: { key: true, isSystem: true } }))
    ).toBe(snapshot.rolesJson);
    expect(await db.membershipRoleAssignment.count()).toBe(snapshot.assignments);
    expect(
      sortedJson(
        await db.invitation.findMany({
          select: { contactTarget: true, status: true, tokenHash: true },
        })
      )
    ).toBe(snapshot.invitationsJson);
    expect(
      sortedJson(
        await db.auditEvent.findMany({ select: { category: true, action: true, outcome: true } })
      )
    ).toBe(snapshot.auditsJson);

    // Hitungan tabel Phase 4 tidak berubah oleh migration licensing.
    expect(await db.user.count()).toBe(2);
    expect(await db.workspace.count()).toBe(2);
    expect(await db.membership.count()).toBe(3);
    expect(await db.role.count()).toBe(4);
    expect(await db.invitation.count()).toBe(1);
    expect(await db.auditEvent.count()).toBe(1);
  });

  it("seed/reference Phase 5-B tersedia setelah migration (LICENSE_MATRIX §1/§2; MC §2.1)", async () => {
    const tiers = await db.licenseTier.findMany({ orderBy: { code: "asc" } });
    expect(tiers.map((t) => t.code)).toEqual([...LICENSE_TIER_CODES].sort());

    const types = await db.extensionType.findMany({ orderBy: { code: "asc" } });
    expect(types.map((t) => t.code)).toEqual([...EXTENSION_TYPE_CODES].sort());

    const capabilities = await db.capability.findMany({ orderBy: { code: "asc" } });
    expect(capabilities.map((c) => c.code)).toEqual([...CAPABILITY_CODES].sort());

    const rules = await db.capabilityRule.findMany({
      include: { capability: true, tier: true },
    });
    expect(rules).toHaveLength(24); // 5 mini + 9 max + 10 iso
    for (const tierCode of LICENSE_TIER_CODES) {
      expect(
        rules.filter((r) => r.tier?.code === tierCode).map((r) => r.capability.code).sort()
      ).toEqual([...TIER_CAPABILITY_MATRIX[tierCode]].sort());
    }

    const quotas = await db.tierQuota.findMany({ include: { tier: true } });
    expect(quotas).toHaveLength(1);
    expect(quotas[0].tier.code).toBe("MINI_RIDER");
    expect(quotas[0].quotaCode).toBe("crew_seats_per_workspace");
    expect(quotas[0].limitValue).toBe(5);
    expect(quotas[0].unit).toBe("CREW_SEAT");
    expect(quotas[0].ownerCountedInQuota).toBeNull(); // OD-05 OPEN

    expect(await db.extensionDefinition.findMany()).toHaveLength(0); // tidak dikarang
  });

  it("constraint Phase 5-B aktif setelah migration — pada data Phase 4 yang sama", async () => {
    const w1 = await db.workspace.findFirstOrThrow({ where: { name: "Studio Migration 1" } });
    const tier = await db.licenseTier.findUniqueOrThrow({ where: { code: "MINI_RIDER" } });

    const active = await db.license.create({
      data: { workspaceId: w1.id, tierId: tier.id, status: "ACTIVE" },
    });
    expect(active.status).toBe("ACTIVE");

    // Tepat satu ACTIVE per workspace (ENTITLEMENT_MODEL §2).
    try {
      await db.license.create({
        data: { workspaceId: w1.id, tierId: tier.id, status: "ACTIVE" },
      });
      throw new Error("diharapkan ditolak: ACTIVE kedua");
    } catch (error) {
      if (error instanceof Error && error.message.includes("diharapkan ditolak")) throw error;
      expectDbRejection(error, /P2002|License_workspaceId_active_key|UNIQUE constraint/i);
    }

    // Histori non-ACTIVE tetap diizinkan di atas data Phase 4.
    await db.license.create({
      data: { workspaceId: w1.id, tierId: tier.id, status: "EXPIRED" },
    });

    // CHECK closed-set tier: HI_RIDER ditolak DB-level (MC §2.1/§2.2).
    try {
      await db.licenseTier.create({ data: { code: "HI_RIDER" } });
      throw new Error("diharapkan ditolak oleh CHECK: HI_RIDER");
    } catch (error) {
      if (error instanceof Error && error.message.includes("diharapkan ditolak oleh CHECK")) {
        throw error;
      }
      expectDbRejection(error, /CHECK constraint failed/i);
    }

    // Migration licensing tidak mengubah data Phase 4.
    expect(await db.membership.count({ where: { workspaceId: w1.id } })).toBe(2);
    expect(await db.workspace.count()).toBe(2);
    expect(await db.license.count({ where: { workspaceId: w1.id } })).toBe(2); // ACTIVE + EXPIRED
  });
});

describe("migration Phase 5-B aditif — tidak destruktif (REQ-029; OD-01)", () => {
  const sql = readFileSync(path.join(MIGRATIONS_DIR, PHASE5B, "migration.sql"), "utf8");

  it("hanya CREATE TABLE/INDEX + INSERT INTO tabel fondasi licensing", () => {
    const statements = sql
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n")
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    expect(statements.length).toBeGreaterThanOrEqual(25);

    const insertTargets = new Set([
      "LicenseTier",
      "ExtensionType",
      "Capability",
      "CapabilityRule",
      "TierQuota",
    ]);

    let createTableCount = 0;
    let insertCount = 0;
    for (const statement of statements) {
      const isCreateTable = /^CREATE TABLE "/.test(statement);
      const isCreateIndex = /^CREATE (UNIQUE )?INDEX "/.test(statement);
      const insertMatch = /^INSERT INTO "([A-Za-z]+)"/.exec(statement);
      const isAllowedInsert = insertMatch !== null && insertTargets.has(insertMatch[1]);
      if (isCreateTable) createTableCount += 1;
      if (isAllowedInsert) insertCount += 1;
      if (!(isCreateTable || isCreateIndex || isAllowedInsert)) {
        throw new Error(
          `statement di luar kelaziman aditif: ${statement.slice(0, 80)}`
        );
      }
    }
    expect(createTableCount).toBe(8); // 8 tabel fondasi Phase 5-B
    expect(insertCount).toBe(5); // tier, extension type, capability, rule, quota
  });

  it("tidak ada DROP/DELETE/ALTER; UPDATE hanya dalam klausa FK ON UPDATE CASCADE", () => {
    expect(/DROP\s+(TABLE|INDEX|VIEW|TRIGGER)/i.test(sql)).toBe(false);
    expect(/DELETE\s+FROM/i.test(sql)).toBe(false);
    expect(/ALTER\s+TABLE/i.test(sql)).toBe(false);
    const updateHits = sql.match(/UPDATE/g) ?? [];
    const cascadeHits = sql.match(/ON UPDATE CASCADE/g) ?? [];
    expect(updateHits.length).toBe(cascadeHits.length); // setiap UPDATE bagian FK
    expect(updateHits.length).toBeGreaterThan(0);
  });

  it("file migration Phase 4 & lock tidak diubah vs HEAD; tambahan = direktori Phase 5-B/5-D saja", () => {
    const diffPhase4 = spawnSync(
      "git",
      ["diff", "--quiet", "HEAD", "--", `prisma/migrations/${PHASE4}`],
      { cwd: ROOT, encoding: "utf8" }
    );
    expect(diffPhase4.status).toBe(0);

    const diffLock = spawnSync(
      "git",
      ["diff", "--quiet", "HEAD", "--", "prisma/migrations/migration_lock.toml"],
      { cwd: ROOT, encoding: "utf8" }
    );
    expect(diffLock.status).toBe(0);
    const lock = readFileSync(path.join(MIGRATIONS_DIR, "migration_lock.toml"), "utf8");
    expect(lock).toMatch(/provider\s*=\s*"sqlite"/);

    const status = spawnSync("git", ["status", "--porcelain", "--", "prisma/migrations"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    expect(status.status).toBe(0);
    const lines = status.stdout.split("\n").filter((l) => l.trim().length > 0);
    // Tidak boleh ada modifikasi/penghapusan file lama — baris apa pun yang
    // muncul wajib tambahan (untracked) milik direktori Phase 5-B ATAU 5-D.
    // Tree bersih (0 baris) sah pada state pasca-commit.
    for (const line of lines) {
      expect(line.startsWith("?? ")).toBe(true);
      expect(line.includes(PHASE5B) || line.includes(PHASE5D)).toBe(true);
    }
    // Direktori migration Phase 5-B wajib ada dalam SATU dari dua state:
    // untracked (pra-commit) atau ter-track di HEAD (pasca-commit).
    const tracked = spawnSync(
      "git",
      ["ls-files", "--error-unmatch", `prisma/migrations/${PHASE5B}/migration.sql`],
      { cwd: ROOT, encoding: "utf8" }
    );
    const listedUntracked = lines.some((l) => l.includes(PHASE5B));
    expect(tracked.status === 0 || listedUntracked).toBe(true);
  });
});
