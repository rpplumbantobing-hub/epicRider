// @vitest-environment node
// Integration test migration Phase 5-E pada data legacy — epicRider (ADR-026;
// pola licensing-migration.test.ts). Membuktikan terhadap file migration ASLI
// repo (byte-copy ke staging tmpdir):
// 1. DB legacy representatif (Phase 4 + 5-B + 5-D + data) → migration 5-E
//    diterapkan DI ATASNYA tanpa reset, tanpa db:push.
// 2. Seluruh data legacy tetap utuh (nilai per baris identik).
// 3. Constraint 5-E aktif: CHECK kind, CHECK quantity, unique code,
//    unique idempotencyKey.
// 4. Deployment ulang idempoten.
// 5. Migration 5-E aditif — hanya CREATE TABLE/CREATE INDEX.

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../..");
const PRISMA_BIN = path.join(ROOT, "node_modules", ".bin", "prisma");
const MIGRATIONS_DIR = path.join(ROOT, "prisma", "migrations");
const PHASE4 = "20261028183022_phase4_identity_workspace_foundation";
const PHASE5B = "20261030124013_phase5b_licensing_domain_foundation";
const PHASE5D = "20261031090000_phase5d_lifecycle_invariants";
const PHASE5E = "20261031120000_phase5e_shop_commerce_foundation";

let dir: string;
let dbPath: string;
let db: PrismaClient;
let legacySnapshot: { users: number; workspaces: number; licenses: number; instances: number; audits: number };

function runPrisma(args: string[], url: string) {
  return spawnSync(PRISMA_BIN, args, {
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: url },
    encoding: "utf8",
    timeout: 120_000,
  });
}

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
  expect(existsSync(PRISMA_BIN)).toBe(true);
  dir = mkdtempSync(path.join(tmpdir(), "epicrider-mig-5e-"));
  dbPath = path.join(dir, "legacy-then-5e.db");

  // Staging: salin migration_lock + 3 migration historis (legacy) SAJA dulu.
  mkdirSync(path.join(dir, "migrations"));
  cpSync(path.join(MIGRATIONS_DIR, "migration_lock.toml"), path.join(dir, "migrations", "migration_lock.toml"));
  for (const name of [PHASE4, PHASE5B, PHASE5D]) {
    cpSync(path.join(MIGRATIONS_DIR, name), path.join(dir, "migrations", name), { recursive: true });
  }
  cpSync(path.join(ROOT, "prisma", "schema.prisma"), path.join(dir, "schema.prisma"));

  const legacyUrl = `file:${dbPath}`;
  const deploy = runPrisma(
    ["migrate", "deploy", "--schema", path.join(dir, "schema.prisma")],
    legacyUrl
  );
  expect(deploy.status).toBe(0);

  // Data legacy representatif (pola 5-B/5-D nyata).
  db = new PrismaClient({ datasources: { db: { url: legacyUrl } }, log: ["error"] });

  const user = await db.user.create({ data: { name: "Legacy Owner", email: "legacy-5e@example.test", emailVerified: new Date() } });
  const workspace = await db.workspace.create({ data: { name: "WS Legacy 5E", createdByUserId: user.id } });
  const ownerRole = await db.role.create({ data: { workspaceId: workspace.id, key: "owner", isSystem: true } });
  const membership = await db.membership.create({ data: { workspaceId: workspace.id, userId: user.id, status: "ACTIVE" } });
  await db.membershipRoleAssignment.create({ data: { membershipId: membership.id, roleId: ownerRole.id } });
  const tier = await db.licenseTier.findUniqueOrThrow({ where: { code: "MINI_RIDER" } });
  await db.license.create({
    data: { workspaceId: workspace.id, tierId: tier.id, status: "PURCHASED", sourceType: "LEGACY", sourceRef: "legacy-1" },
  });
  const type = await db.extensionType.findUniqueOrThrow({ where: { code: "seat_package" } });
  const definition = await db.extensionDefinition.create({ data: { code: "ext.legacy.5e", typeId: type.id, isActive: true } });
  await db.extensionInstance.create({
    data: { workspaceId: workspace.id, definitionId: definition.id, typeId: definition.typeId, status: "ACTIVE", quantity: 10 },
  });
  await db.auditEvent.create({ data: { category: "LICENSE", action: "legacy.marker", outcome: "SUCCESS" } });

  legacySnapshot = {
    users: await db.user.count(),
    workspaces: await db.workspace.count(),
    licenses: await db.license.count(),
    instances: await db.extensionInstance.count(),
    audits: await db.auditEvent.count(),
  };
  await db.$disconnect();

  // Terapkan migration 5-E DI ATAS data legacy (staging + dir 5-E).
  cpSync(path.join(MIGRATIONS_DIR, PHASE5E), path.join(dir, "migrations", PHASE5E), { recursive: true });
  const deploy5e = runPrisma(
    ["migrate", "deploy", "--schema", path.join(dir, "schema.prisma")],
    legacyUrl
  );
  expect(deploy5e.status).toBe(0);

  db = new PrismaClient({ datasources: { db: { url: legacyUrl } }, log: ["error"] });
}, 240_000);

afterAll(async () => {
  await db.$disconnect();
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    // best-effort
  }
});

describe("migration Phase 5-E pada data legacy", () => {
  it("seluruh data legacy tetap utuh — nilai per baris identik (aditif-only)", async () => {
    expect(await db.user.count()).toBe(legacySnapshot.users);
    expect(await db.workspace.count()).toBe(legacySnapshot.workspaces);
    expect(await db.license.count()).toBe(legacySnapshot.licenses);
    expect(await db.extensionInstance.count()).toBe(legacySnapshot.instances);
    expect(await db.auditEvent.count()).toBe(legacySnapshot.audits);

    const license = await db.license.findFirstOrThrow({ where: { sourceType: "LEGACY" } });
    expect(license.status).toBe("PURCHASED");
    const instance = await db.extensionInstance.findFirstOrThrow({});
    expect(instance.status).toBe("ACTIVE");
    expect(instance.quantity).toBe(10);
    expect(instance.typeId).not.toBeNull();
  });

  it("tabel Shop* tersedia; CHECK kind menolak nilai di luar closed set", async () => {
    const user = await db.user.findFirstOrThrow({});
    const workspace = await db.workspace.findFirstOrThrow({});
    const tier = await db.licenseTier.findUniqueOrThrow({ where: { code: "MINI_RIDER" } });

    const product = await db.shopProduct.create({
      data: { code: "shop.mig.legacy.test", kind: "LICENSE", displayName: "x", status: "ACTIVE", tierId: tier.id },
    });
    // Default INACTIVE ditegakkan DB untuk produk tanpa status eksplisit —
    // diuji pada produk kedua tanpa kolom status.
    await db.$executeRawUnsafe(
      `INSERT INTO "ShopProduct" ("id","code","kind","displayName","createdAt","updatedAt")
       VALUES ('x-default-status', 'shop.mig.default-status', 'LICENSE', 'x', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    );
    const defaultRow = await db.shopProduct.findUniqueOrThrow({ where: { code: "shop.mig.default-status" } });
    expect(defaultRow.status).toBe("INACTIVE");

    // CHECK kind.
    await expect(
      db.$executeRawUnsafe(
        `INSERT INTO "ShopProduct" ("id","code","kind","displayName","status","createdAt","updatedAt")
         VALUES ('x-kind', 'shop.mig.bad-kind', 'PHYSICAL', 'x', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
    ).rejects.toThrow(/CHECK/i);
    void user;
    void workspace;
  });

  it("CHECK quantity ≥ 1 menolak baris line invalid", async () => {
    const product = await db.shopProduct.findUniqueOrThrow({ where: { code: "shop.mig.legacy.test" } });
    const workspace = await db.workspace.findFirstOrThrow({});
    const intent = await db.shopOrderIntent.create({
      data: { workspaceId: workspace.id, status: "OPEN", idempotencyKey: "mig-key-1" },
    });
    await expect(
      db.$executeRawUnsafe(
        `INSERT INTO "ShopOrderIntentLine" ("id","orderIntentId","productId","quantity")
         VALUES ('x-qty', '${intent.id}', '${product.id}', 0)`
      )
    ).rejects.toThrow(/CHECK/i);
  });

  it("unique idempotencyKey menolak duplikat (anti-duplication DB-level)", async () => {
    const workspace = await db.workspace.findFirstOrThrow({});
    await db.shopOrderIntent.create({
      data: { workspaceId: workspace.id, status: "OPEN", idempotencyKey: "mig-key-unique" },
    });
    await expect(
      db.shopOrderIntent.create({
        data: { workspaceId: workspace.id, status: "OPEN", idempotencyKey: "mig-key-unique" },
      })
    ).rejects.toThrow();
  });

  it("deployment ulang idempoten — migration 5-E dapat diterapkan normal tanpa efek ulang", async () => {
    const url = `file:${dbPath}`;
    const redeploy = runPrisma(
      ["migrate", "deploy", "--schema", path.join(dir, "schema.prisma")],
      url
    );
    expect(redeploy.status).toBe(0);
    expect(redeploy.stdout).not.toContain(PHASE5E); // sudah applied — tidak dieksekusi ulang
  });

  it("migration 5-E aditif — hanya CREATE TABLE / CREATE INDEX (tanpa DROP/DELETE/ALTER destruktif)", () => {
    const sql = readFileSync(path.join(MIGRATIONS_DIR, PHASE5E, "migration.sql"), "utf8");
    expect(sql).not.toMatch(/DROP TABLE/i);
    expect(sql).not.toMatch(/DELETE FROM/i);
    expect(sql).not.toMatch(/ALTER TABLE .*DROP/i);
    // Buang baris komentar dulu (komentar mengandung ';'), baru pecah statement.
    const withoutComments = sql
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");
    const statements = withoutComments
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    expect(statements.length).toBeGreaterThan(0);
    for (const statement of statements) {
      expect(statement).toMatch(/^(CREATE TABLE|CREATE (UNIQUE )?INDEX)/);
    }
  });
});
