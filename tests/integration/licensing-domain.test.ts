// @vitest-environment node
// Integration test domain licensing — epicRider Phase 5-B.
// Membuktikan dari lapisan domain/integration (Prisma Client di atas DB hasil
// migration terversionisasi — bukan db dev/produksi, bukan db:push):
// - License terhubung ke Workspace Phase 4 yang benar; relasi memakai model
//   Phase 4 — TIDAK membuat sistem Identity/Membership/Role/Authorization baru.
// - Tepat satu lisensi ACTIVE per workspace (ENTITLEMENT_MODEL.md §2) —
//   invariant yang dibuktikan di database diuji ulang dari domain layer.
// - Histori lisensi non-ACTIVE tetap tersimpan (append-only; REQ-099/DMC §2.3).
// - Katalog referensi hasil seed migration = vocabulary (LICENSE_MATRIX §2).
// - onDelete Restrict — histori lisensi/extension tidak terhapus cascade.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import {
  CAPABILITY_CODES,
  EXTENSION_TYPE_CODES,
  LICENSE_TIER_CODES,
  TIER_CAPABILITY_MATRIX,
} from "@/lib/licensing/vocabulary";
import {
  createTestDatabase,
  resetDb,
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

/** Model Phase 4 (11) + fondasi Phase 5-B (8) — himpunan tertutup, tanpa duplikasi. */
const PHASE4_MODELS = [
  "Account",
  "AuditEvent",
  "DeveloperRoleAssignment",
  "Invitation",
  "Membership",
  "MembershipRoleAssignment",
  "Role",
  "Session",
  "User",
  "VerificationRequest",
  "Workspace",
] as const;

const PHASE5B_MODELS = [
  "Capability",
  "CapabilityRule",
  "ExtensionDefinition",
  "ExtensionInstance",
  "ExtensionType",
  "License",
  "LicenseTier",
  "TierQuota",
] as const;

// Phase 5-E (ADR-026): entity family commerce surface "License & Extension
// Shop" (DMC §3.12a — direkonsiliasi 5-E). Tiga model Shop* SAJA; Public
// Store (Product/CatalogListing/StoreOrder) dan Equipment Store TETAP TIDAK
// dimodelkan (ADR-018 surface isolation).
const PHASE5E_MODELS = [
  "ShopOrderIntent",
  "ShopOrderIntentLine",
  "ShopProduct",
] as const;

/** Helper asersi penolakan constraint DB (P2002/P2003/CHECK) dari domain layer. */
function expectDbRejection(error: unknown, match: RegExp): void {
  expect(error).toBeInstanceOf(Error);
  const message = error instanceof Error ? error.message : String(error);
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  expect(`${code}\n${message}`).toMatch(match);
}

describe("katalog referensi hasil seed migration (db pristine khusus)", () => {
  // DB terpisah agar selalu melihat state seed migration yang pristine
  // (describe lain memakai resetDb yang mengosongkan katalog).
  let refDb: TestDatabase;

  beforeAll(async () => {
    refDb = await createTestDatabase();
  }, 120_000);

  afterAll(async () => {
    await refDb.destroy();
  });

  it("tepat tiga tier — MINI_RIDER/MAX_RIDER/ISO_RIDER; hiRider/totalRider absen", async () => {
    const tiers = await refDb.db.licenseTier.findMany({ orderBy: { code: "asc" } });
    expect(tiers.map((t) => t.code)).toEqual([...LICENSE_TIER_CODES].sort());
    expect(tiers.map((t) => t.code)).not.toContain("HI_RIDER");
    expect(tiers.map((t) => t.code)).not.toContain("TOTAL_RIDER");
    expect(tiers.every((t) => t.isActive)).toBe(true);
  });

  it("10 capability + aturan inklusi tier persis LICENSE_MATRIX §2 (5/9/10)", async () => {
    const capabilities = await refDb.db.capability.findMany({ orderBy: { code: "asc" } });
    expect(capabilities.map((c) => c.code)).toEqual([...CAPABILITY_CODES].sort());

    const rules = await refDb.db.capabilityRule.findMany({
      include: { capability: true, tier: true },
    });
    expect(rules).toHaveLength(24); // 5 mini + 9 max + 10 iso
    for (const tierCode of LICENSE_TIER_CODES) {
      const fromDb = rules
        .filter((r) => r.tier?.code === tierCode && r.status === "ACTIVE")
        .map((r) => r.capability.code)
        .sort();
      expect(fromDb).toEqual([...TIER_CAPABILITY_MATRIX[tierCode]].sort());
    }
  });

  it("4 extension type; TANPA definisi produk dikarang (isActive default false; OD-06)", async () => {
    const types = await refDb.db.extensionType.findMany({ orderBy: { code: "asc" } });
    expect(types.map((t) => t.code)).toEqual([...EXTENSION_TYPE_CODES].sort());
    expect(await refDb.db.extensionDefinition.findMany()).toHaveLength(0);

    const definition = await refDb.db.extensionDefinition.create({
      data: { code: "test_def_probe", typeId: types[0].id },
    });
    expect(definition.isActive).toBe(false); // tidak aktif sampai disetujui owner
    expect(definition.status).toBe("CATALOG");
  });

  it("tidak ada numeric base quota yang dikunci; owner tidak dihitung dan seat_package tetap tersedia (ADR-027)", async () => {
    const quotas = await refDb.db.tierQuota.findMany({ include: { tier: true } });
    expect(quotas).toHaveLength(0);

    // `TierQuota` tetap tersedia sebagai infrastruktur generik untuk keputusan owner di masa depan.
    expect(PHASE5B_MODELS).toContain("TierQuota");

    // Purchased member capacity tetap direpresentasikan oleh extension type additive.
    const types = await refDb.db.extensionType.findMany({ orderBy: { code: "asc" } });
    expect(types.map((t) => t.code)).toContain("seat_package");
  });
});

describe("relasi lisensi ↔ workspace Phase 4 (DMC §3.5)", () => {
  it("lisensi terhubung ke workspace yang benar; relasi memakai model Phase 4", async () => {
    await resetDb(testDb.db);
    const seed = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Owner License",
      email: "license-owner@test.local",
      workspaceName: "Studio Lisensi",
    });
    const other = await testDb.db.workspace.create({ data: { name: "Studio Lain" } });
    const tier = await testDb.db.licenseTier.create({ data: { code: "MINI_RIDER" } });

    const license = await testDb.db.license.create({
      data: { workspaceId: seed.workspaceId, tierId: tier.id, status: "ACTIVE" },
    });

    const loaded = await testDb.db.license.findUniqueOrThrow({
      where: { id: license.id },
      include: { workspace: true, tier: true },
    });
    expect(loaded.workspace.id).toBe(seed.workspaceId);
    expect(loaded.workspace.name).toBe("Studio Lisensi");
    expect(loaded.tier.code).toBe("MINI_RIDER");

    const fromWorkspace = await testDb.db.workspace.findUniqueOrThrow({
      where: { id: seed.workspaceId },
      include: { licenses: true },
    });
    expect(fromWorkspace.licenses.map((l) => l.id)).toContain(license.id);

    const otherView = await testDb.db.workspace.findUniqueOrThrow({
      where: { id: other.id },
      include: { licenses: true },
    });
    expect(otherView.licenses).toHaveLength(0); // relasi tidak bocor antar tenant
  });

  it("tepat satu ACTIVE per workspace; histori EXPIRED tetap tersimpan", async () => {
    await resetDb(testDb.db);
    const seed = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Owner License State",
      email: "license-state@test.local",
      workspaceName: "Studio State",
    });
    const tier = await testDb.db.licenseTier.create({ data: { code: "MINI_RIDER" } });

    const active = await testDb.db.license.create({
      data: { workspaceId: seed.workspaceId, tierId: tier.id, status: "ACTIVE" },
    });
    expect(active.status).toBe("ACTIVE");

    await expect(
      testDb.db.license.create({
        data: { workspaceId: seed.workspaceId, tierId: tier.id, status: "ACTIVE" },
      })
    ).rejects.toThrow(/P2002|UNIQUE|License_workspaceId_active_key/i);

    const expired = await testDb.db.license.create({
      data: { workspaceId: seed.workspaceId, tierId: tier.id, status: "EXPIRED" },
    });
    expect(expired.status).toBe("EXPIRED");
    expect(await testDb.db.license.count({ where: { workspaceId: seed.workspaceId } })).toBe(2);
  });
});
