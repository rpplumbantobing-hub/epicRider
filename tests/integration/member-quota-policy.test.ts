// @vitest-environment node
// ADR-027 regression: numeric base member quotas remain deferred until owner
// determination; the historical Phase 5-B miniRider=5 seed is removed by a
// forward migration, while the generic TierQuota table remains available.

import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { afterEach, describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../..");
const PRISMA_BIN = path.join(ROOT, "node_modules", ".bin", "prisma");
const MIGRATIONS_DIR = path.join(ROOT, "prisma", "migrations");
const PHASE4 = "20261028183022_phase4_identity_workspace_foundation";
const PHASE5B = "20261030124013_phase5b_licensing_domain_foundation";
const POLICY = "20261101220000_reconcile_deferred_member_quota";

function deploy(stage: string, url: string) {
  const { spawnSync } = require("node:child_process") as typeof import("node:child_process");
  return spawnSync(
    PRISMA_BIN,
    ["migrate", "deploy", "--schema", path.join(stage, "schema.prisma")],
    { cwd: ROOT, env: { ...process.env, DATABASE_URL: url }, encoding: "utf8", timeout: 120_000 }
  );
}

describe("ADR-027 deferred member quota policy", () => {
  let stage = "";
  let db: PrismaClient | undefined;

  afterEach(async () => {
    await db?.$disconnect();
    if (stage) rmSync(stage, { recursive: true, force: true });
  });

  it("removes only the historical miniRider=5 seed and keeps generic quota infrastructure", async () => {
    expect(existsSync(PRISMA_BIN)).toBe(true);

    stage = mkdtempSync(path.join(tmpdir(), "epicrider-quota-policy-"));
    const dbPath = path.join(stage, "quota-policy.db");
    const url = `file:${dbPath}`;
    mkdirSync(path.join(stage, "migrations"));
    cpSync(path.join(MIGRATIONS_DIR, "migration_lock.toml"), path.join(stage, "migrations", "migration_lock.toml"));
    cpSync(path.join(MIGRATIONS_DIR, PHASE4), path.join(stage, "migrations", PHASE4), { recursive: true });
    cpSync(path.join(MIGRATIONS_DIR, PHASE5B), path.join(stage, "migrations", PHASE5B), { recursive: true });
    cpSync(path.join(MIGRATIONS_DIR, POLICY), path.join(stage, "migrations", POLICY), { recursive: true });
    cpSync(path.join(ROOT, "prisma", "schema.prisma"), path.join(stage, "schema.prisma"));

    const result = deploy(stage, url);
    expect(result.status).toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toContain(POLICY);

    db = new PrismaClient({ datasources: { db: { url } }, log: ["error"] });

    // The three official tiers remain intact.
    expect((await db.licenseTier.findMany({ orderBy: { code: "asc" } })).map((x) => x.code)).toEqual([
      "ISO_RIDER",
      "MAX_RIDER",
      "MINI_RIDER",
    ]);

    // The generic quota structure remains available, but no numeric base quota
    // is invented for any tier until an owner-approved value exists.
    expect(await db.tierQuota.count()).toBe(0);

    // The purchased-capacity extension type remains available.
    const seatType = await db.extensionType.findUnique({ where: { code: "seat_package" } });
    expect(seatType).not.toBeNull();

    // Historical seed migration remains recorded; the correction is a forward
    // migration and does not rewrite Phase 5-B history.
    const migrations = await db.$queryRaw<{ migration_name: string }[]>`
      SELECT "migration_name" FROM "_prisma_migrations" ORDER BY "started_at"
    `;
    expect(migrations.map((x) => x.migration_name)).toEqual([PHASE4, PHASE5B, POLICY]);
  }, 180_000);
});
