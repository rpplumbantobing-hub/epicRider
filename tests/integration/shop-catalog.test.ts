// @vitest-environment node
// Integration test catalog/product foundation — epicRider Phase 5-E
// (ADR-026; prompt owner 5-E §10). DB disposable hasil migration
// terversionisasi. Membuktikan:
// - katalog = information architecture SAJA (apa yang dapat dibeli; target
//   LicenseTier/ExtensionDefinition TIDAK diduplikasi; surface ownership);
// - produk default INACTIVE (tidak dapat dibeli sampai diaktifkan eksplisit);
// - fail-closed: struktur kind↔target invalid tidak pernah dapat diaktifkan;
// - WITHDRAWN terminal;
// - USER = default deny untuk mutasi katalog (platform-global; tidak ada key
//   kanonik; OD-122 OPEN);
// - eligibility resolusi server-side end-to-end (valid/inactive/withdrawn/
//   invalid/wrong-target).

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  activateShopProduct,
  createShopProduct,
  getShopProductRow,
  withdrawShopProduct,
} from "@/lib/shop/catalog";
import { resolveShopProductEligibility } from "@/lib/shop/eligibility";
import { ShopReasonCode } from "@/lib/shop/reason-codes";
import type { LifecycleActor } from "@/lib/licensing/lifecycle-shared";
import { createTestDatabase, seedWorkspaceWithOwner, type TestDatabase } from "./test-db";

let testDb: TestDatabase;

beforeAll(async () => {
  testDb = await createTestDatabase();
}, 120_000);

afterAll(async () => {
  await testDb.destroy();
});

const NOW = new Date("2026-11-01T00:00:00.000Z");
const SYSTEM: LifecycleActor = { type: "SYSTEM", note: "internal trusted caller (test harness)" };

/** Aktor USER owner — session VALID (server-side); tanpa permission ratified. */
function ownerActor(userId: string): LifecycleActor {
  return { type: "USER", userId, session: "VALID" };
}

describe("shop catalog foundation (§10)", () => {
  it("produk baru default INACTIVE; aktivasi eksplisit membuat ACTIVE (teraudit)", async () => {
    const db = testDb.db;
    const tier = await db.licenseTier.findUniqueOrThrow({ where: { code: "MINI_RIDER" } });

    const created = await createShopProduct(db, {
      actor: SYSTEM,
      input: { code: "shop.test.license.mini", kind: "LICENSE", displayName: "miniRider (test)", tierId: tier.id },
      now: NOW,
    });
    expect(created).toMatchObject({ outcome: "SUCCESS", status: "INACTIVE" });
    const productId: string = created.outcome === "SUCCESS" ? created.productId : "";
    expect(productId).not.toBe("");

    // INACTIVE → tidak dapat dibeli.
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "Cat Owner A",
      email: "cat-owner-a@example.test",
      workspaceName: "WS Cat A",
    });
    const ineligible = await resolveShopProductEligibility(db, {
      workspaceId: ws.workspaceId,
      productId,
    });
    expect(ineligible.eligible).toBe(false);
    expect(ineligible.reasonCode).toBe(ShopReasonCode.SHOP_DENY_PRODUCT_NOT_ACTIVE);

    const activated = await activateShopProduct(db, { actor: SYSTEM, productId, now: NOW });
    expect(activated).toMatchObject({ outcome: "SUCCESS", status: "ACTIVE" });

    const eligible = await resolveShopProductEligibility(db, {
      workspaceId: ws.workspaceId,
      productId,
    });
    expect(eligible.eligible).toBe(true);

    const audits = await db.auditEvent.findMany({
      where: { category: "COMMERCE", action: "shop.catalog.activate", targetId: productId },
    });
    expect(audits.length).toBeGreaterThanOrEqual(1);
    expect(audits.every((a) => a.outcome === "SUCCESS")).toBe(true);
  });

  it("duplicate product code ditolak eksplisit (P2002 → denial teraudit)", async () => {
    const db = testDb.db;
    const tier = await db.licenseTier.findUniqueOrThrow({ where: { code: "MAX_RIDER" } });
    const input = { code: "shop.test.duplicate", kind: "LICENSE" as const, displayName: "dup", tierId: tier.id };
    const first = await createShopProduct(db, { actor: SYSTEM, input, now: NOW });
    expect(first.outcome).toBe("SUCCESS");
    const second = await createShopProduct(db, { actor: SYSTEM, input, now: NOW });
    expect(second.outcome).toBe("DENIED");
    if (second.outcome === "DENIED") {
      expect(second.reasonCode).toBe(ShopReasonCode.SHOP_DENY_IDEMPOTENCY_CONFLICT);
    }
  });

  it("struktur invalid fail-closed: LICENSE tanpa tier / EXTENSION tanpa definisi / kind campur", async () => {
    const db = testDb.db;
    const definition = await db.extensionDefinition.create({
      data: { code: "ext.cat.invalid", typeId: (await db.extensionType.findUniqueOrThrow({ where: { code: "workspace_landing" } })).id },
    });

    const noTier = await createShopProduct(db, {
      actor: SYSTEM,
      input: { code: "shop.test.no-tier", kind: "LICENSE", displayName: "x" },
      now: NOW,
    });
    expect(noTier).toMatchObject({ outcome: "DENIED", reasonCode: ShopReasonCode.SHOP_DENY_INVALID_PRODUCT });

    const noDefinition = await createShopProduct(db, {
      actor: SYSTEM,
      input: { code: "shop.test.no-def", kind: "EXTENSION", displayName: "x" },
      now: NOW,
    });
    expect(noDefinition).toMatchObject({ outcome: "DENIED", reasonCode: ShopReasonCode.SHOP_DENY_INVALID_PRODUCT });

    const licenseWithDefinition = await createShopProduct(db, {
      actor: SYSTEM,
      input: { code: "shop.test.mixed", kind: "LICENSE", displayName: "x", tierId: (await db.licenseTier.findUniqueOrThrow({ where: { code: "ISO_RIDER" } })).id, definitionId: definition.id },
      now: NOW,
    });
    expect(licenseWithDefinition).toMatchObject({ outcome: "DENIED", reasonCode: ShopReasonCode.SHOP_DENY_INVALID_PRODUCT });

    const unknownKind = await createShopProduct(db, {
      actor: SYSTEM,
      input: { code: "shop.test.kind-x", kind: "PHYSICAL" as never, displayName: "x" },
      now: NOW,
    });
    expect(unknownKind).toMatchObject({ outcome: "DENIED", reasonCode: ShopReasonCode.SHOP_DENY_INVALID_PRODUCT });
  });

  it("aktivasi produk rusak ditolak — target tier dihapus tidak mungkin, tapi tier mismatch terdeteksi (fail-closed)", async () => {
    const db = testDb.db;
    // Produk EXTENSION menunjuk definisi NON-aktif → eligibility menolak;
    // aktivasi produk sah secara struktur, tetapi eligibility tetap menolak
    // (definisi tidak tersedia) — fail-closed di lapisan eligibility.
    const type = await db.extensionType.findUniqueOrThrow({ where: { code: "seat_package" } });
    const definition = await db.extensionDefinition.create({
      data: { code: "ext.cat.inactive", typeId: type.id, isActive: false },
    });
    const product = await createShopProduct(db, {
      actor: SYSTEM,
      input: { code: "shop.test.ext.inactive-def", kind: "EXTENSION", displayName: "x", definitionId: definition.id },
      now: NOW,
    });
    expect(product.outcome).toBe("SUCCESS");
    const activated = await activateShopProduct(db, { actor: SYSTEM, productId: product.productId!, now: NOW });
    expect(activated.outcome).toBe("SUCCESS");

    const ws = await seedWorkspaceWithOwner(db, {
      userName: "Cat Owner B",
      email: "cat-owner-b@example.test",
      workspaceName: "WS Cat B",
    });
    const decision = await resolveShopProductEligibility(db, {
      workspaceId: ws.workspaceId,
      productId: product.productId!,
    });
    expect(decision.eligible).toBe(false);
    expect(decision.reasonCode).toBe(ShopReasonCode.SHOP_DENY_DEFINITION_NOT_AVAILABLE);
  });

  it("WITHDRAWN terminal: tidak dapat diaktifkan kembali; eligibility menolak", async () => {
    const db = testDb.db;
    const tier = await db.licenseTier.findUniqueOrThrow({ where: { code: "MINI_RIDER" } });
    const product = await createShopProduct(db, {
      actor: SYSTEM,
      input: { code: "shop.test.withdrawn", kind: "LICENSE", displayName: "x", tierId: tier.id },
      now: NOW,
    });
    await activateShopProduct(db, { actor: SYSTEM, productId: product.productId!, now: NOW });
    const withdrawn = await withdrawShopProduct(db, { actor: SYSTEM, productId: product.productId!, now: NOW });
    expect(withdrawn).toMatchObject({ outcome: "SUCCESS", status: "WITHDRAWN" });

    const reactivate = await activateShopProduct(db, { actor: SYSTEM, productId: product.productId!, now: NOW });
    expect(reactivate.outcome).toBe("DENIED");

    const ws = await seedWorkspaceWithOwner(db, {
      userName: "Cat Owner C",
      email: "cat-owner-c@example.test",
      workspaceName: "WS Cat C",
    });
    const decision = await resolveShopProductEligibility(db, {
      workspaceId: ws.workspaceId,
      productId: product.productId!,
    });
    expect(decision.reasonCode).toBe(ShopReasonCode.SHOP_DENY_PRODUCT_NOT_ACTIVE);
  });

  it("mutasi katalog oleh USER ditolak (platform-global; tanpa konteks tenant sah)", async () => {
    const db = testDb.db;
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "Cat Owner D",
      email: "cat-owner-d@example.test",
      workspaceName: "WS Cat D",
    });
    const tier = await db.licenseTier.findUniqueOrThrow({ where: { code: "MINI_RIDER" } });

    const created = await createShopProduct(db, {
      actor: ownerActor(ws.userId),
      input: { code: "shop.test.user-create", kind: "LICENSE", displayName: "x", tierId: tier.id },
      now: NOW,
    });
    expect(created.outcome).toBe("DENIED");

    const product = await createShopProduct(db, {
      actor: SYSTEM,
      input: { code: "shop.test.user-activate", kind: "LICENSE", displayName: "x", tierId: tier.id },
      now: NOW,
    });
    const activated = await activateShopProduct(db, {
      actor: ownerActor(ws.userId),
      productId: product.productId!,
      now: NOW,
    });
    expect(activated.outcome).toBe("DENIED");

    // Denial teraudit dengan aktor USER.
    const denials = await db.auditEvent.findMany({
      where: { category: "COMMERCE", outcome: "DENIED", actorUserId: ws.userId },
    });
    expect(denials.length).toBeGreaterThanOrEqual(2);
  });

  it("F-04 REGRESSION: sesi ABSENT/EXPIRED/REVOKED memakai reason code sesi kanonik (bukan DENY_TENANT_MISMATCH generik)", async () => {
    const db = testDb.db;
    const tier = await db.licenseTier.findUniqueOrThrow({ where: { code: "MINI_RIDER" } });
    // User NYATA (audit.actorUserId = FK ke User); validitas sesi disuplai
    // server-side sebagai fakta (ABSENT/EXPIRED/REVOKED).
    const actorUser = await seedWorkspaceWithOwner(db, {
      userName: "Cat F04 User",
      email: "cat-f04-user@example.test",
      workspaceName: "WS Cat F04",
    });

    const expectedCode = {
      ABSENT: "DENY_NO_SESSION",
      EXPIRED: "DENY_SESSION_EXPIRED",
      REVOKED: "DENY_SESSION_REVOKED",
    } as const;

    for (const session of ["ABSENT", "EXPIRED", "REVOKED"] as const) {
      const created = await createShopProduct(db, {
        actor: { type: "USER", userId: actorUser.userId, session },
        input: { code: `shop.test.f04.${session}`, kind: "LICENSE", displayName: "x", tierId: tier.id },
        now: NOW,
      });
      expect(created).toMatchObject({
        outcome: "DENIED",
        reasonCode: expectedCode[session],
      });
      // Produk TIDAK dibuat.
      expect(
        await db.shopProduct.count({ where: { code: `shop.test.f04.${session}` } })
      ).toBe(0);
      // Audit denial dengan reason code kanonik (kategori COMMERCE).
      const denial = await db.auditEvent.findFirstOrThrow({
        where: {
          category: "COMMERCE",
          action: "shop.catalog.create",
          outcome: "DENIED",
          reasonCode: expectedCode[session],
        },
      });
      expect(denial.actorUserId).toBe(actorUser.userId);
    }
  });

  it("resolver data produk: null untuk id tak dikenal; row utuh untuk id sah", async () => {
    const db = testDb.db;
    const tier = await db.licenseTier.findUniqueOrThrow({ where: { code: "MAX_RIDER" } });
    const product = await createShopProduct(db, {
      actor: SYSTEM,
      input: { code: "shop.test.resolve", kind: "LICENSE", displayName: "resolver", tierId: tier.id },
      now: NOW,
    });
    const row = await getShopProductRow(db, product.productId!);
    expect(row).toMatchObject({ code: "shop.test.resolve", kind: "LICENSE", status: "INACTIVE", tierId: tier.id });
    expect(await getShopProductRow(db, "tidak-ada")).toBeNull();
  });
});
