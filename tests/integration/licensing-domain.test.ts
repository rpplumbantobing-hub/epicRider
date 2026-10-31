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

  it("satu-satunya kuota owner: miniRider 5 kru/workspace; ownerCountedInQuota NULL (OD-05)", async () => {
    const quotas = await refDb.db.tierQuota.findMany({ include: { tier: true } });
    expect(quotas).toHaveLength(1);
    expect(quotas[0].tier.code).toBe("MINI_RIDER");
    expect(quotas[0].quotaCode).toBe("crew_seats_per_workspace");
    expect(quotas[0].limitValue).toBe(5);
    expect(quotas[0].unit).toBe("CREW_SEAT");
    expect(quotas[0].ownerCountedInQuota).toBeNull(); // OD-05 OPEN — bukan keputusan
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

  it("FK ditolak untuk workspace/tier yang tidak ada (P2003)", async () => {
    await resetDb(testDb.db);
    const tier = await testDb.db.licenseTier.create({ data: { code: "MAX_RIDER" } });
    await expect(
      testDb.db.license.create({ data: { workspaceId: "ws-tidak-ada", tierId: tier.id } })
    ).rejects.toMatchObject({ code: "P2003" });
    const seed = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Owner FK",
      email: "fk-owner@test.local",
      workspaceName: "Studio FK",
    });
    await expect(
      testDb.db.license.create({ data: { workspaceId: seed.workspaceId, tierId: "tier-tidak-ada" } })
    ).rejects.toMatchObject({ code: "P2003" });
  });

  it("tepat satu lisensi ACTIVE per workspace; histori non-ACTIVE tetap tersimpan (ENTITLEMENT_MODEL §2; REQ-099)", async () => {
    await resetDb(testDb.db);
    const seed = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Owner Unique",
      email: "unique-owner@test.local",
      workspaceName: "Studio Unique",
    });
    const tier = await testDb.db.licenseTier.create({ data: { code: "MINI_RIDER" } });

    const active = await testDb.db.license.create({
      data: { workspaceId: seed.workspaceId, tierId: tier.id, status: "ACTIVE" },
    });
    // Histori diizinkan (bukan ACTIVE): default PURCHASED + EXPIRED.
    await testDb.db.license.create({ data: { workspaceId: seed.workspaceId, tierId: tier.id } });
    await testDb.db.license.create({
      data: { workspaceId: seed.workspaceId, tierId: tier.id, status: "EXPIRED" },
    });

    const all = await testDb.db.license.findMany({ where: { workspaceId: seed.workspaceId } });
    expect(all).toHaveLength(3);
    expect(all.filter((l) => l.status === "ACTIVE").map((l) => l.id)).toEqual([active.id]);

    // ACTIVE kedua untuk workspace sama → ditolak constraint DB (partial unique
    // index dibaca ulang dari domain layer — bukan hanya asersi SQL statis).
    try {
      await testDb.db.license.create({
        data: { workspaceId: seed.workspaceId, tierId: tier.id, status: "ACTIVE" },
      });
      throw new Error("diharapkan ditolak: ACTIVE kedua untuk workspace sama");
    } catch (error) {
      if (error instanceof Error && error.message.includes("diharapkan ditolak")) throw error;
      expectDbRejection(error, /P2002|License_workspaceId_active_key|UNIQUE constraint/i);
    }

    // Workspace berbeda boleh memiliki ACTIVE sendiri (constraint per-workspace).
    const otherWs = await testDb.db.workspace.create({ data: { name: "Studio Kedua" } });
    const second = await testDb.db.license.create({
      data: { workspaceId: otherWs.id, tierId: tier.id, status: "ACTIVE" },
    });
    expect(second.status).toBe("ACTIVE");

    // Semantik partial index (bukan unique penuh): ketika ACTIVE lama turun ke
    // status histori (data-level, bukan mekanika transisi 5-D), slot ACTIVE
    // workspace tersebut bebas kembali.
    await testDb.db.license.update({ where: { id: active.id }, data: { status: "EXPIRED" } });
    const replacement = await testDb.db.license.create({
      data: { workspaceId: seed.workspaceId, tierId: tier.id, status: "ACTIVE" },
    });
    expect(replacement.status).toBe("ACTIVE");
    expect(await testDb.db.license.count({ where: { workspaceId: seed.workspaceId } })).toBe(4);
  });

  it("onDelete Restrict: workspace/tier dengan lisensi tidak terhapus cascade (REQ-099; DMC §2.3)", async () => {
    await resetDb(testDb.db);
    const seed = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Owner Restrict",
      email: "restrict-owner@test.local",
      workspaceName: "Studio Restrict",
    });
    const tier = await testDb.db.licenseTier.create({ data: { code: "ISO_RIDER" } });
    await testDb.db.license.create({
      data: { workspaceId: seed.workspaceId, tierId: tier.id, status: "ACTIVE" },
    });

    await expect(
      testDb.db.workspace.delete({ where: { id: seed.workspaceId } })
    ).rejects.toMatchObject({ code: "P2003" });
    await expect(
      testDb.db.licenseTier.delete({ where: { id: tier.id } })
    ).rejects.toMatchObject({ code: "P2003" });
    // Histori tetap utuh setelah kedua percobaan hapus ditolak.
    expect(await testDb.db.license.count({ where: { workspaceId: seed.workspaceId } })).toBe(1);
  });

  it("CHECK DB-level: tier di luar closed set ditolak — HI_RIDER/TOTAL_RIDER (MC §2.1/§2.2)", async () => {
    await resetDb(testDb.db);
    for (const code of ["HI_RIDER", "TOTAL_RIDER"]) {
      try {
        await testDb.db.licenseTier.create({ data: { code } });
        throw new Error(`diharapkan ditolak oleh CHECK: ${code}`);
      } catch (error) {
        if (error instanceof Error && error.message.includes("diharapkan ditolak oleh CHECK")) {
          throw error;
        }
        expectDbRejection(error, /CHECK constraint failed/i);
      }
    }
    // Tidak ada baris fallback yang tercipta.
    expect(
      await testDb.db.licenseTier.findMany({ where: { code: { in: ["HI_RIDER", "TOTAL_RIDER"] } } })
    ).toHaveLength(0);
  });

  it("unique katalog: CapabilityRule (capability,tier) & TierQuota (tier,quotaCode)", async () => {
    await resetDb(testDb.db);
    const tier = await testDb.db.licenseTier.create({ data: { code: "MINI_RIDER" } });
    const capability = await testDb.db.capability.create({ data: { code: "probe_cap" } });

    await testDb.db.capabilityRule.create({
      data: { capabilityId: capability.id, tierId: tier.id },
    });
    await expect(
      testDb.db.capabilityRule.create({ data: { capabilityId: capability.id, tierId: tier.id } })
    ).rejects.toMatchObject({ code: "P2002" });

    await testDb.db.tierQuota.create({
      data: { tierId: tier.id, quotaCode: "probe_quota", limitValue: 1, unit: "UNIT" },
    });
    await expect(
      testDb.db.tierQuota.create({
        data: { tierId: tier.id, quotaCode: "probe_quota", limitValue: 2, unit: "UNIT" },
      })
    ).rejects.toMatchObject({ code: "P2002" });
  });
});

describe("integritas Phase 4 — tidak ada duplikasi sistem identitas/membership/role/authorization", () => {
  it("DMMF: himpunan model persis Phase 4 (11) + fondasi licensing (8) + shop 5-E (3) — tanpa model baru lain", () => {
    const names = Prisma.dmmf.datamodel.models.map((m) => m.name).sort();
    expect(names).toEqual([...PHASE4_MODELS, ...PHASE5B_MODELS, ...PHASE5E_MODELS].sort());
  });

  it("License mereferensi Workspace/LicenseTier via relasi — bukan model tenant/identity baru", () => {
    const license = Prisma.dmmf.datamodel.models.find((m) => m.name === "License");
    expect(license).toBeDefined();
    const relationFields = license!.fields
      .filter((f) => f.kind === "object") // DMMF: relasi = kind "object"
      .map((f) => f.name)
      .sort();
    expect(relationFields).toEqual(["tier", "workspace"]);
    const scalarFk = license!.fields
      .filter((f) => f.name.endsWith("Id"))
      .map((f) => f.name)
      .sort();
    expect(scalarFk).toEqual(["tierId", "workspaceId"]);
    // Workspace tetap milik Phase 4 — tidak ada model workspace/tenant kedua.
    const workspaceModels = Prisma.dmmf.datamodel.models
      .filter((m) => m.name.includes("Workspace"))
      .map((m) => m.name);
    expect(workspaceModels).toEqual(["Workspace"]);
  });

  it("lifecycle Phase 4 tetap bekerja berdampingan dengan data licensing (tanpa interferensi)", async () => {
    await resetDb(testDb.db);
    const seed = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Owner Coexist",
      email: "coexist-owner@test.local",
      workspaceName: "Studio Coexist",
    });
    expect(seed.membershipId).toBeTruthy();
    const tier = await testDb.db.licenseTier.create({ data: { code: "MAX_RIDER" } });
    await testDb.db.license.create({
      data: { workspaceId: seed.workspaceId, tierId: tier.id, status: "ACTIVE" },
    });

    const membership = await testDb.db.membership.findUniqueOrThrow({
      where: { id: seed.membershipId },
    });
    expect(membership.status).toBe("ACTIVE"); // Membership Phase 4 tak berubah
    expect(await testDb.db.role.count({ where: { workspaceId: seed.workspaceId } })).toBe(2);
    expect(await testDb.db.license.count({ where: { workspaceId: seed.workspaceId } })).toBe(1);
  });
});
