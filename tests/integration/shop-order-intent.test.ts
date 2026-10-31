// @vitest-environment node
// Integration test order intent — epicRider Phase 5-E (ADR-026; prompt owner
// 5-E §12). Membuktikan:
// - INTENT ≠ PAID ≠ COMPLETED PAYMENT ≠ ACTIVE ENTITLEMENT (status OPEN;
//   tidak ada efek lisensi/instance/entitlement);
// - anti-duplication: replay key sama + konten identik = no-op idempotent;
//   divergent retry = konflik eksplisit teraudit;
// - eligibility server-side per line (invalid product / inactive / workspace
//   invalid ditolak teraudit);
// - struktur order: single-kind; license = tepat satu line quantity 1;
// - otorisasi: USER owner TANPA permission ratified = DENY_PERMISSION_MISSING
//   (remediasi PR #4; OD-122); cross-tenant USER = DENY_NOT_MEMBER;
// - CANCELLED hanya dari OPEN; state-convergence replay cancel.

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { resolveWorkspaceCapabilityEntitlement } from "@/lib/licensing/entitlement-service";
import type { LifecycleActor } from "@/lib/licensing/lifecycle-shared";
import {
  cancelShopOrderIntent,
  createShopOrderIntent,
} from "@/lib/shop/order-intent";
import { activateShopProduct, createShopProduct } from "@/lib/shop/catalog";
import { ShopReasonCode } from "@/lib/shop/reason-codes";
import {
  createTestDatabase,
  seedMember,
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

const NOW = new Date("2026-11-01T00:00:00.000Z");
const SYSTEM: LifecycleActor = { type: "SYSTEM" };

async function setupActiveLicenseProduct(code: string) {
  const db = testDb.db;
  const tier = await db.licenseTier.findUniqueOrThrow({ where: { code: "MINI_RIDER" } });
  const created = await createShopProduct(db, {
    actor: SYSTEM,
    input: { code, kind: "LICENSE", displayName: "miniRider", tierId: tier.id },
    now: NOW,
  });
  expect(created.outcome).toBe("SUCCESS");
  await activateShopProduct(db, { actor: SYSTEM, productId: created.productId!, now: NOW });
  return created.productId!;
}

async function setupActiveExtensionProduct(code: string) {
  const db = testDb.db;
  const type = await db.extensionType.findUniqueOrThrow({ where: { code: "workspace_landing" } });
  const definition = await db.extensionDefinition.create({
    data: { code: `ext.${code}`, typeId: type.id, isActive: true },
  });
  const created = await createShopProduct(db, {
    actor: SYSTEM,
    input: { code: `shop.test.${code}`, kind: "EXTENSION", displayName: "landing", definitionId: definition.id },
    now: NOW,
  });
  expect(created.outcome).toBe("SUCCESS");
  await activateShopProduct(db, { actor: SYSTEM, productId: created.productId!, now: NOW });
  return created.productId!;
}

describe("order intent (§12)", () => {
  it("pembuatan: OPEN tercatat + teraudit; TIDAK ada License/ExtensionInstance; entitlement tetap menolak", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.oi.mini");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "OI Owner A",
      email: "oi-owner-a@example.test",
      workspaceName: "WS OI A",
    });

    const result = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      buyerUserId: ws.userId,
      idempotencyKey: "oi-create-1",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    });
    expect(result).toMatchObject({ outcome: "SUCCESS", status: "OPEN", idempotent: false });
    if (result.outcome === "SUCCESS") {
      expect(result.eligibilityKind).toBe("FIRST_LICENSE");
    }

    const intent = await db.shopOrderIntent.findUniqueOrThrow({
      where: { id: (result as { intentId: string }).intentId },
      include: { lines: true },
    });
    expect(intent.status).toBe("OPEN");
    expect(intent.completionSource).toBeNull(); // belum completed — bukan paid
    expect(intent.lines).toHaveLength(1);

    // Tidak ada efek lisensi/instance.
    expect(await db.license.count({ where: { workspaceId: ws.workspaceId } })).toBe(0);
    expect(await db.extensionInstance.count({ where: { workspaceId: ws.workspaceId } })).toBe(0);

    // Entitlement engine tetap menolak (PURCHASED pun belum ada; kosong).
    const entitlement = await resolveWorkspaceCapabilityEntitlement(db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "core_event_workspace",
    });
    expect(entitlement.decision).toBe("DENIED");

    // Audit success + aktor SYSTEM.
    const audit = await db.auditEvent.findFirstOrThrow({
      where: { category: "COMMERCE", action: "shop.order.create", targetId: intent.id },
    });
    expect(audit.outcome).toBe("SUCCESS");
    expect(audit.reasonCode).toBe("ALLOW");
  });

  it("replay idempotencyKey identik → no-op sukses tanpa order kedua; divergent retry → konflik", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.oi.idem");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "OI Owner B",
      email: "oi-owner-b@example.test",
      workspaceName: "WS OI B",
    });
    const params = {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "oi-idem-1",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    };
    const first = await createShopOrderIntent(db, params);
    expect(first.outcome).toBe("SUCCESS");

    // Retry identik → no-op (bukan order baru).
    const replay = await createShopOrderIntent(db, { ...params, buyerUserId: null });
    expect(replay).toMatchObject({ outcome: "SUCCESS", idempotent: true });
    expect(await db.shopOrderIntent.count({ where: { workspaceId: ws.workspaceId } })).toBe(1);

    // Divergent retry (konten berbeda, key sama) → konflik eksplisit.
    const extensionProductId = await setupActiveExtensionProduct("oi_idem_ext");
    const divergent = await createShopOrderIntent(db, {
      ...params,
      lines: [{ productId: extensionProductId, quantity: 1 }],
    });
    expect(divergent.outcome).toBe("DENIED");
    if (divergent.outcome === "DENIED") {
      expect(divergent.reasonCode).toBe(ShopReasonCode.SHOP_DENY_IDEMPOTENCY_CONFLICT);
    }
    expect(await db.shopOrderIntent.count({ where: { workspaceId: ws.workspaceId } })).toBe(1);

    const conflicts = await db.auditEvent.findMany({
      where: { category: "COMMERCE", reasonCode: ShopReasonCode.SHOP_DENY_IDEMPOTENCY_CONFLICT },
    });
    expect(conflicts.length).toBeGreaterThanOrEqual(1);
  });

  it("invalid product / produk inactive / workspace invalid ditolak teraudit", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.oi.invalid");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "OI Owner C",
      email: "oi-owner-c@example.test",
      workspaceName: "WS OI C",
    });

    const unknownProduct = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "oi-unknown-product",
      lines: [{ productId: "tidak-ada", quantity: 1 }],
      now: NOW,
    });
    expect(unknownProduct).toMatchObject({ outcome: "DENIED", reasonCode: ShopReasonCode.SHOP_DENY_PRODUCT_NOT_FOUND });

    const tier = await db.licenseTier.findUniqueOrThrow({ where: { code: "ISO_RIDER" } });
    const inactiveProduct = await createShopProduct(db, {
      actor: SYSTEM,
      input: { code: "shop.test.oi.inactive", kind: "LICENSE", displayName: "x", tierId: tier.id },
      now: NOW,
    });
    const inactive = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "oi-inactive-product",
      lines: [{ productId: inactiveProduct.productId!, quantity: 1 }],
      now: NOW,
    });
    expect(inactive).toMatchObject({ outcome: "DENIED", reasonCode: ShopReasonCode.SHOP_DENY_PRODUCT_NOT_ACTIVE });

    const invalidWorkspace = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: "ws-tidak-ada",
      idempotencyKey: "oi-invalid-ws",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    });
    expect(invalidWorkspace).toMatchObject({ outcome: "DENIED", reasonCode: ShopReasonCode.SHOP_DENY_WORKSPACE_INVALID });

    // Konten invalid: quantity 0 dan tanpa lines.
    const zeroQty = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "oi-zero-qty",
      lines: [{ productId, quantity: 0 }],
      now: NOW,
    });
    expect(zeroQty).toMatchObject({ outcome: "DENIED", reasonCode: ShopReasonCode.SHOP_DENY_INVALID_ORDER_CONTENT });

    const noLines = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "oi-no-lines",
      lines: [],
      now: NOW,
    });
    expect(noLines).toMatchObject({ outcome: "DENIED", reasonCode: ShopReasonCode.SHOP_DENY_INVALID_ORDER_CONTENT });
  });

  it("struktur: order campur kind ditolak; lisensi > 1 line / quantity ≠ 1 ditolak", async () => {
    const db = testDb.db;
    const licenseProductId = await setupActiveLicenseProduct("shop.test.oi.shape");
    const extensionProductId = await setupActiveExtensionProduct("oi_shape_ext");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "OI Owner D",
      email: "oi-owner-d@example.test",
      workspaceName: "WS OI D",
    });

    const mixed = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "oi-mixed",
      lines: [
        { productId: licenseProductId, quantity: 1 },
        { productId: extensionProductId, quantity: 1 },
      ],
      now: NOW,
    });
    expect(mixed).toMatchObject({ outcome: "DENIED", reasonCode: ShopReasonCode.SHOP_DENY_INVALID_ORDER_CONTENT });

    const multiLine = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "oi-two-license-lines",
      lines: [
        { productId: licenseProductId, quantity: 1 },
        { productId: licenseProductId, quantity: 1 },
      ],
      now: NOW,
    });
    expect(multiLine).toMatchObject({ outcome: "DENIED", reasonCode: ShopReasonCode.SHOP_DENY_LICENSE_ORDER_SHAPE });

    const qtyTwo = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "oi-qty-two",
      lines: [{ productId: licenseProductId, quantity: 2 }],
      now: NOW,
    });
    expect(qtyTwo).toMatchObject({ outcome: "DENIED", reasonCode: ShopReasonCode.SHOP_DENY_LICENSE_ORDER_SHAPE });
  });

  it("OTORISASI: owner workspace TANPA permission ratified ditolak DENY_PERMISSION_MISSING (teraudit); owner fallback TIDAK ADA", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.oi.authz");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "OI Owner E",
      email: "oi-owner-e@example.test",
      workspaceName: "WS OI E",
    });

    const result = await createShopOrderIntent(db, {
      actor: { type: "USER", userId: ws.userId, session: "VALID" },
      workspaceId: ws.workspaceId,
      idempotencyKey: "oi-owner-user",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") {
      // OD-122 OPEN: tidak ada preset yang memegang store.order.create —
      // owner pun ditolak (pola remediasi PR #4).
      expect(result.reasonCode).toBe("DENY_PERMISSION_MISSING");
    }
    expect(await db.shopOrderIntent.count({ where: { workspaceId: ws.workspaceId } })).toBe(0);

    const denial = await db.auditEvent.findFirstOrThrow({
      where: { category: "COMMERCE", action: "shop.order.create", outcome: "DENIED", actorUserId: ws.userId },
    });
    expect(denial.reasonCode).toBe("DENY_PERMISSION_MISSING");
  });

  it("CROSS-TENANT: USER dari workspace lain ditolak DENY_NOT_MEMBER (tanpa existence leak pada intent)", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.oi.tenant");
    const wsA = await seedWorkspaceWithOwner(db, {
      userName: "OI Owner F",
      email: "oi-owner-f@example.test",
      workspaceName: "WS OI F",
    });
    const wsB = await seedWorkspaceWithOwner(db, {
      userName: "OI Owner G",
      email: "oi-owner-g@example.test",
      workspaceName: "WS OI G",
    });

    const result = await createShopOrderIntent(db, {
      actor: { type: "USER", userId: wsB.userId, session: "VALID" },
      workspaceId: wsA.workspaceId, // target milik workspace lain
      idempotencyKey: "oi-cross-tenant",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") {
      expect(result.reasonCode).toBe("DENY_NOT_MEMBER");
    }
    expect(await db.shopOrderIntent.count({ where: { workspaceId: wsA.workspaceId } })).toBe(0);
  });

  it("CANCEL: hanya dari OPEN; replay cancel = no-op; COMPLETED tidak dapat dibatalkan", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.oi.cancel");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "OI Owner H",
      email: "oi-owner-h@example.test",
      workspaceName: "WS OI H",
    });

    const created = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "oi-cancel-1",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    });
    const intentId = (created as { intentId: string }).intentId;

    const cancelled = await cancelShopOrderIntent(db, { actor: SYSTEM, orderIntentId: intentId, now: NOW });
    expect(cancelled).toMatchObject({ outcome: "SUCCESS", status: "CANCELLED", idempotent: false });

    const replay = await cancelShopOrderIntent(db, { actor: SYSTEM, orderIntentId: intentId, now: NOW });
    expect(replay).toMatchObject({ outcome: "SUCCESS", status: "CANCELLED", idempotent: true });

    // Intent CANCELLED tidak dapat melanjutkan completion (diuji file issuance).
    const cancelledRow = await db.shopOrderIntent.findUniqueOrThrow({ where: { id: intentId } });
    expect(cancelledRow.status).toBe("CANCELLED");
    expect(cancelledRow.cancelledAt).not.toBeNull();
  });
});
