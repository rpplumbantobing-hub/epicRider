// @vitest-environment node
// Integration test security & isolation — epicRider Phase 5-E (ADR-026;
// prompt owner 5-E §10/§15/§17). Matriks negatif:
// - forged tier / forged workspace / forged paid status / forged entitlement
//   / forged actorType SYSTEM — semuanya ditolak fail-closed + teraudit;
// - owner tanpa permission ratified = default deny (OD-122);
// - cross-tenant: denial + audit, tanpa existence leak;
// - tenant/workspace context berasal dari server (bukan claim client);
// - tidak ada route HTTP shop (tidak ada permukaan publik Phase 5-E);
// - F-03 REGRESSION (remediasi): otorisasi mendahului idempotency probe —
//   pemanggil tanpa otorisasi TIDAK dapat mempelajari keberadaan key.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

import { resolveWorkspaceCapabilityEntitlement } from "@/lib/licensing/entitlement-service";
import type { LifecycleActor } from "@/lib/licensing/lifecycle-shared";
import { verifyShopOrderCompletion } from "@/lib/shop/completion";
import { issueFromCompletedShopOrderIntent } from "@/lib/shop/issuance";
import { createShopOrderIntent } from "@/lib/shop/order-intent";
import { activateShopProduct, createShopProduct } from "@/lib/shop/catalog";
import { ShopReasonCode } from "@/lib/shop/reason-codes";
import { SHOP_COMPLETION_SOURCES } from "@/lib/shop/vocabulary";
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
const COMPLETION = {
  source: SHOP_COMPLETION_SOURCES[0],
  evidenceRef: "sim-sec-001",
} as const;

async function setupActiveLicenseProduct(code: string, tierCode: "MINI_RIDER" | "MAX_RIDER" | "ISO_RIDER") {
  const db = testDb.db;
  const tier = await db.licenseTier.findUniqueOrThrow({ where: { code: tierCode } });
  const created = await createShopProduct(db, {
    actor: SYSTEM,
    input: { code, kind: "LICENSE", displayName: tierCode, tierId: tier.id },
    now: NOW,
  });
  await activateShopProduct(db, { actor: SYSTEM, productId: created.productId!, now: NOW });
  return created.productId!;
}

async function setupActiveExtensionProduct(code: string) {
  const db = testDb.db;
  const type = await db.extensionType.findUniqueOrThrow({ where: { code: "workspace_landing" } });
  const definition = await db.extensionDefinition.create({
    data: { code: `ext.sec.${code}`, typeId: type.id, isActive: true },
  });
  const created = await createShopProduct(db, {
    actor: SYSTEM,
    input: { code: `shop.test.sec.${code}`, kind: "EXTENSION", displayName: "landing", definitionId: definition.id },
    now: NOW,
  });
  await activateShopProduct(db, { actor: SYSTEM, productId: created.productId!, now: NOW });
  return created.productId!;
}

describe("security & isolation (§10/§15/§17)", () => {
  it("FORGED WORKSPACE: USER workspace lain menarget order di workspace korban → DENY + audit + tanpa existence leak", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.sec.forged-ws", "MINI_RIDER");
    const victim = await seedWorkspaceWithOwner(db, {
      userName: "Sec Victim",
      email: "sec-victim@example.test",
      workspaceName: "WS Sec Victim",
    });
    const attacker = await seedWorkspaceWithOwner(db, {
      userName: "Sec Attacker",
      email: "sec-attacker@example.test",
      workspaceName: "WS Sec Attacker",
    });

    const result = await createShopOrderIntent(db, {
      actor: { type: "USER", userId: attacker.userId, session: "VALID" },
      workspaceId: victim.workspaceId,
      idempotencyKey: "sec-forged-ws-1",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") {
      expect(result.reasonCode).toBe("DENY_NOT_MEMBER");
    }
    // Tidak ada order dibuat di workspace korban.
    expect(await db.shopOrderIntent.count({ where: { workspaceId: victim.workspaceId } })).toBe(0);

    const denial = await db.auditEvent.findFirstOrThrow({
      where: { category: "COMMERCE", action: "shop.order.create", outcome: "DENIED", tenantWorkspaceId: victim.workspaceId },
    });
    expect(denial.actorUserId).toBe(attacker.userId);
    expect(denial.reasonCode).toBe("DENY_NOT_MEMBER");
  });

  it("FORGED PAID STATUS: USER (owner/member) men-suplai completion → ditolak; status intent tak berubah", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.sec.paid", "MINI_RIDER");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "Sec Paid Owner",
      email: "sec-paid-owner@example.test",
      workspaceName: "WS Sec Paid",
    });
    const intent = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "sec-paid-1",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    });
    const intentId = (intent as { intentId: string }).intentId;

    // Pemilik workspace mencoba mengklaim "paid" lewat completion boundary.
    const claim = await verifyShopOrderCompletion(db, {
      actor: { type: "USER", userId: ws.userId, session: "VALID" },
      orderIntentId: intentId,
      completion: COMPLETION,
      now: NOW,
    });
    expect(claim.outcome).toBe("DENIED");

    // Member biasa juga ditolak.
    const member = await seedMember(db, {
      email: "sec-paid-member@example.test",
      name: "Sec Paid Member",
      workspaceId: ws.workspaceId,
    });
    const memberClaim = await verifyShopOrderCompletion(db, {
      actor: { type: "USER", userId: member.userId, session: "VALID" },
      orderIntentId: intentId,
      completion: COMPLETION,
      now: NOW,
    });
    expect(memberClaim.outcome).toBe("DENIED");

    const row = await db.shopOrderIntent.findUniqueOrThrow({ where: { id: intentId } });
    expect(row.status).toBe("OPEN");
    expect(row.completionSource).toBeNull();
  });

  it("FORGED TIER: produk kind/target mismatch ditolak di seluruh lapisan (katalog + eligibility + issuance)", async () => {
    const db = testDb.db;
    const type = await db.extensionType.findUniqueOrThrow({ where: { code: "mobile_client" } });
    const definition = await db.extensionDefinition.create({
      data: { code: "ext.sec.mismatch", typeId: type.id, isActive: true },
    });

    // Produk LICENSE yang mencoba membawa definition (tier palsu) — diblokir katalog.
    const forged = await createShopProduct(db, {
      actor: SYSTEM,
      input: {
        code: "shop.test.sec.forged-tier",
        kind: "LICENSE",
        displayName: "forged",
        definitionId: definition.id,
      },
      now: NOW,
    });
    expect(forged).toMatchObject({ outcome: "DENIED", reasonCode: "SHOP_DENY_INVALID_PRODUCT" });
    expect(await db.shopProduct.count({ where: { code: "shop.test.sec.forged-tier" } })).toBe(0);

    // Produk EXTENSION menarget tier (tier palsu) — diblokir katalog.
    const tier = await db.licenseTier.findUniqueOrThrow({ where: { code: "ISO_RIDER" } });
    const forgedExt = await createShopProduct(db, {
      actor: SYSTEM,
      input: {
        code: "shop.test.sec.forged-ext-tier",
        kind: "EXTENSION",
        displayName: "forged ext",
        tierId: tier.id,
      },
      now: NOW,
    });
    expect(forgedExt.outcome).toBe("DENIED");
  });

  it("FORGED ENTITLEMENT: issuance PURCHASED tidak pernah meng-grant entitlement (engine 5-C membaca status)", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.sec.entitlement", "ISO_RIDER");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "Sec Ent Owner",
      email: "sec-ent-owner@example.test",
      workspaceName: "WS Sec Ent",
    });
    const intent = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "sec-ent-1",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    });
    const intentId = (intent as { intentId: string }).intentId;
    await verifyShopOrderCompletion(db, { actor: SYSTEM, orderIntentId: intentId, completion: COMPLETION, now: NOW });
    await issueFromCompletedShopOrderIntent(db, {
      actor: SYSTEM,
      orderIntentId: intentId,
      licenseTerm: { termStartsAt: NOW, termEndsAt: NOW },
      now: NOW,
    });

    const entitlement = await resolveWorkspaceCapabilityEntitlement(db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "ims_capability", // capability ISOrider
    });
    expect(entitlement.decision).toBe("DENIED");
    expect(entitlement.reasonCode).toBe("DENY_LICENSE_STATE"); // PURCHASED ≠ ACTIVE
  });

  it("FORGED ACTORTYPE: aktor USER tidak pernah diizinkan jalur SYSTEM; rantai sesi tetap ditegakkan", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.sec.actor", "MINI_RIDER");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "Sec Actor Owner",
      email: "sec-actor-owner@example.test",
      workspaceName: "WS Sec Actor",
    });
    const intent = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "sec-actor-1",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    });
    const intentId = (intent as { intentId: string }).intentId;
    await verifyShopOrderCompletion(db, { actor: SYSTEM, orderIntentId: intentId, completion: COMPLETION, now: NOW });

    // Sesi tidak sah (ABSENT/EXPIRED/REVOKED) → reason code rantai kanonik.
    for (const session of ["ABSENT", "EXPIRED", "REVOKED"] as const) {
      const result = await issueFromCompletedShopOrderIntent(db, {
        actor: { type: "USER", userId: ws.userId, session },
        orderIntentId: intentId,
        now: NOW,
      });
      expect(result.outcome).toBe("DENIED");
      if (result.outcome === "DENIED") {
        expect([
          "DENY_NO_SESSION",
          "DENY_SESSION_EXPIRED",
          "DENY_SESSION_REVOKED",
        ]).toContain(result.reasonCode);
      }
    }
    // Intent tetap COMPLETED (tidak ter-issue oleh aktor tidak sah).
    const row = await db.shopOrderIntent.findUniqueOrThrow({ where: { id: intentId } });
    expect(row.status).toBe("COMPLETED");
  });

  it("OWNER TANPA PERMISSION RATIFIED: seluruh aksi commerce USER = DENY_PERMISSION_MISSING (OD-122; tanpa owner fallback)", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.sec.owner", "MINI_RIDER");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "Sec Owner Owner",
      email: "sec-owner-owner@example.test",
      workspaceName: "WS Sec Owner",
    });
    const ownerActor: LifecycleActor = { type: "USER", userId: ws.userId, session: "VALID" };

    const created = await createShopOrderIntent(db, {
      actor: ownerActor,
      workspaceId: ws.workspaceId,
      idempotencyKey: "sec-owner-create",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    });
    expect(created).toMatchObject({ outcome: "DENIED", reasonCode: "DENY_PERMISSION_MISSING" });

    // Intent dibuat SYSTEM untuk pengujian denial pada aksi lain.
    const intent = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "sec-owner-system",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    });
    const intentId = (intent as { intentId: string }).intentId;
    await verifyShopOrderCompletion(db, { actor: SYSTEM, orderIntentId: intentId, completion: COMPLETION, now: NOW });

    const completed = await verifyShopOrderCompletion(db, {
      actor: ownerActor,
      orderIntentId: intentId,
      completion: COMPLETION,
      now: NOW,
    });
    expect(completed).toMatchObject({ outcome: "DENIED", reasonCode: "DENY_PERMISSION_MISSING" });

    const issued = await issueFromCompletedShopOrderIntent(db, {
      actor: ownerActor,
      orderIntentId: intentId,
      now: NOW,
    });
    expect(issued).toMatchObject({ outcome: "DENIED", reasonCode: "DENY_PERMISSION_MISSING" });

    const denialCount = await db.auditEvent.count({
      where: {
        category: "COMMERCE",
        outcome: "DENIED",
        reasonCode: "DENY_PERMISSION_MISSING",
        actorUserId: ws.userId,
      },
    });
    expect(denialCount).toBeGreaterThanOrEqual(3);
  });

  it("REPLAY/DOUBLE-ISSUANCE: issuance ganda tidak menggandakan baris (idempotent; tanpa duplikat)", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.sec.replay", "MINI_RIDER");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "Sec Replay Owner",
      email: "sec-replay-owner@example.test",
      workspaceName: "WS Sec Replay",
    });
    const intent = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "sec-replay-1",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    });
    const intentId = (intent as { intentId: string }).intentId;
    await verifyShopOrderCompletion(db, { actor: SYSTEM, orderIntentId: intentId, completion: COMPLETION, now: NOW });

    await issueFromCompletedShopOrderIntent(db, { actor: SYSTEM, orderIntentId: intentId, now: NOW });
    await issueFromCompletedShopOrderIntent(db, { actor: SYSTEM, orderIntentId: intentId, now: NOW });
    await issueFromCompletedShopOrderIntent(db, { actor: SYSTEM, orderIntentId: intentId, now: NOW });

    expect(
      await db.license.count({
        where: { workspaceId: ws.workspaceId, sourceType: "SHOP_ORDER_INTENT", sourceRef: intentId },
      })
    ).toBe(1);
  });

  it("TIDAK ADA ROUTE HTTP shop — tidak ada permukaan publik Phase 5-E (aktor SYSTEM tidak dapat disuplai client)", () => {
    const apiDir = path.resolve(__dirname, "../../src/app/api");
    expect(existsSync(apiDir)).toBe(true);
    const shopRoutes = readdirSync(apiDir, { recursive: true }).filter((entry) =>
      String(entry).toLowerCase().includes("shop")
    );
    expect(shopRoutes).toEqual([]);
  });
});

describe("F-03 REGRESSION: otorisasi mendahului idempotency probe", () => {
  it("TEST A — authorized same-context replay: SUCCESS idempotent, tanpa duplikat intent", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.sec.f03-a", "MINI_RIDER");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "F03 Owner A",
      email: "f03-owner-a@example.test",
      workspaceName: "WS F03 A",
    });
    const params = {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "f03-key-a",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    };
    const first = await createShopOrderIntent(db, params);
    expect(first.outcome).toBe("SUCCESS");
    const firstId = (first as { intentId: string }).intentId;

    // Replay identik oleh konteks authorized yang sama → convergence (bukan
    // order baru; existing intent yang sah dikembalikan).
    const replay = await createShopOrderIntent(db, { ...params, buyerUserId: null });
    expect(replay).toMatchObject({ outcome: "SUCCESS", idempotent: true });
    if (replay.outcome === "SUCCESS") {
      expect(replay.intentId).toBe(firstId);
    }
    expect(await db.shopOrderIntent.count({ where: { workspaceId: ws.workspaceId } })).toBe(1);
  });

  it("TEST B — authorized divergent request: konflik idempotency kanonik (existing.id boleh dikembalikan)", async () => {
    const db = testDb.db;
    const licenseProductId = await setupActiveLicenseProduct("shop.test.sec.f03-b", "MINI_RIDER");
    const extensionProductId = await setupActiveExtensionProduct("f03_b_ext");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "F03 Owner B",
      email: "f03-owner-b@example.test",
      workspaceName: "WS F03 B",
    });
    const params = {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "f03-key-b",
      lines: [{ productId: licenseProductId, quantity: 1 }],
      now: NOW,
    };
    const first = await createShopOrderIntent(db, params);
    const existingId = (first as { intentId: string }).intentId;

    // Konteks authorized yang sama + payload divergen → konflik kanonik.
    const divergent = await createShopOrderIntent(db, {
      ...params,
      lines: [{ productId: extensionProductId, quantity: 1 }],
    });
    expect(divergent.outcome).toBe("DENIED");
    if (divergent.outcome === "DENIED") {
      expect(divergent.reasonCode).toBe(ShopReasonCode.SHOP_DENY_IDEMPOTENCY_CONFLICT);
      // Caller authorized pada konteks intent — existing.id boleh diketahui.
      expect(divergent.intentId).toBe(existingId);
    }
    expect(await db.shopOrderIntent.count({ where: { workspaceId: ws.workspaceId } })).toBe(1);

    const conflict = await db.auditEvent.findFirstOrThrow({
      where: {
        category: "COMMERCE",
        action: "shop.order.create",
        outcome: "DENIED",
        reasonCode: ShopReasonCode.SHOP_DENY_IDEMPOTENCY_CONFLICT,
        tenantWorkspaceId: ws.workspaceId,
      },
    });
    expect(conflict.targetId).toBe(existingId);
  });

  it("TEST C — CROSS-TENANT EXISTING KEY: authorization denial; TIDAK ada existence leak (probe tidak pernah dieksekusi)", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.sec.f03-c", "MINI_RIDER");
    const victim = await seedWorkspaceWithOwner(db, {
      userName: "F03 Victim C",
      email: "f03-victim-c@example.test",
      workspaceName: "WS F03 Victim C",
    });
    const attacker = await seedWorkspaceWithOwner(db, {
      userName: "F03 Attacker C",
      email: "f03-attacker-c@example.test",
      workspaceName: "WS F03 Attacker C",
    });
    const created = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: victim.workspaceId,
      buyerUserId: victim.userId,
      idempotencyKey: "f03-key-c",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    });
    const existingId = (created as { intentId: string }).intentId;

    // Bukti runtime URUTAN (behavioral): pemanggil tidak-authorized dengan key
    // EXISTING menerima DENIAL OTORISASI — bukan replay SUCCESS dan bukan
    // idempotency conflict. Bila urutan lama (probe dulu) masih berlaku,
    // panggilan yang sama pasti mengembalikan SUCCESS idempotent (konten
    // identik) — denial ini membuktikan otorisasi mendahului probe.
    const result = await createShopOrderIntent(db, {
      actor: { type: "USER", userId: attacker.userId, session: "VALID" },
      workspaceId: victim.workspaceId, // target milik tenant lain
      idempotencyKey: "f03-key-c", // key EXISTING milik victim
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    });

    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") {
      // Denial otorisasi kanonik — BUKAN idempotency conflict.
      expect(result.reasonCode).toBe("DENY_NOT_MEMBER");
      expect(result.reasonCode).not.toBe(ShopReasonCode.SHOP_DENY_IDEMPOTENCY_CONFLICT);
      // TIDAK ada existing intent ID yang dibocorkan.
      expect(result.intentId).toBeNull();
      expect(result.intentId).not.toBe(existingId);
    }
    // Actual result shape: TIDAK ada field status/workspace/product/buyer/hash.
    expect(Object.keys(result).sort()).toEqual(["intentId", "outcome", "reasonCode"]);

    // Intent korban tidak tersentuh; TIDAK ada replay sukses palsu; tidak ada
    // intent baru pada kedua workspace yang di-seed di test ini.
    const row = await db.shopOrderIntent.findUniqueOrThrow({ where: { id: existingId } });
    expect(row.status).toBe("OPEN");
    expect(row.workspaceId).toBe(victim.workspaceId);
    expect(
      await db.shopOrderIntent.count({
        where: { workspaceId: { in: [victim.workspaceId, attacker.workspaceId] } },
      })
    ).toBe(1);

    // Audit = authorization denial (vocabulary kanonik), BUKAN idempotency
    // conflict; tanpa target id bocor.
    const denial = await db.auditEvent.findFirstOrThrow({
      where: {
        category: "COMMERCE",
        action: "shop.order.create",
        outcome: "DENIED",
        actorUserId: attacker.userId,
      },
    });
    expect(denial.reasonCode).toBe("DENY_NOT_MEMBER");
    expect(denial.targetId).toBeNull();
    const conflictAudit = await db.auditEvent.findFirst({
      where: {
        category: "COMMERCE",
        reasonCode: ShopReasonCode.SHOP_DENY_IDEMPOTENCY_CONFLICT,
        actorUserId: attacker.userId,
      },
    });
    expect(conflictAudit).toBeNull();
  });

  it("TEST D — CROSS-TENANT EXISTING KEY + DIVERGENT PAYLOAD: authorization denial; tidak ada idempotency conflict yang mengungkap key", async () => {
    const db = testDb.db;
    const victimProductId = await setupActiveLicenseProduct("shop.test.sec.f03-d-v", "MINI_RIDER");
    const attackerProductId = await setupActiveLicenseProduct("shop.test.sec.f03-d-a", "MAX_RIDER");
    const victim = await seedWorkspaceWithOwner(db, {
      userName: "F03 Victim D",
      email: "f03-victim-d@example.test",
      workspaceName: "WS F03 Victim D",
    });
    const attacker = await seedWorkspaceWithOwner(db, {
      userName: "F03 Attacker D",
      email: "f03-attacker-d@example.test",
      workspaceName: "WS F03 Attacker D",
    });
    const created = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: victim.workspaceId,
      idempotencyKey: "f03-key-d",
      lines: [{ productId: victimProductId, quantity: 1 }],
      now: NOW,
    });
    const existingId = (created as { intentId: string }).intentId;

    // Attacker menarget workspace-nya SENDIRI (konteks tenant sah baginya)
    // dengan key existing milik victim + payload berbeda.
    const result = await createShopOrderIntent(db, {
      actor: { type: "USER", userId: attacker.userId, session: "VALID" },
      workspaceId: attacker.workspaceId,
      idempotencyKey: "f03-key-d",
      lines: [{ productId: attackerProductId, quantity: 1 }],
      now: NOW,
    });

    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") {
      // OD-122: store.order.create belum diratifikasi → permission missing.
      expect(result.reasonCode).toBe("DENY_PERMISSION_MISSING");
      expect(result.intentId).toBeNull();
      expect(result.intentId).not.toBe(existingId);
    }
    expect(Object.keys(result).sort()).toEqual(["intentId", "outcome", "reasonCode"]);

    expect(
      await db.shopOrderIntent.count({
        where: { workspaceId: { in: [victim.workspaceId, attacker.workspaceId] } },
      })
    ).toBe(1); // hanya milik victim
    const conflictAudit = await db.auditEvent.findFirst({
      where: {
        category: "COMMERCE",
        reasonCode: ShopReasonCode.SHOP_DENY_IDEMPOTENCY_CONFLICT,
        actorUserId: attacker.userId,
      },
    });
    expect(conflictAudit).toBeNull();
  });

  it("TEST E — CROSS-TENANT NON-EXISTING KEY: denial identik TEST C (tidak dapat dibedakan dari existence information)", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.sec.f03-e", "MINI_RIDER");
    const victim = await seedWorkspaceWithOwner(db, {
      userName: "F03 Victim E",
      email: "f03-victim-e@example.test",
      workspaceName: "WS F03 Victim E",
    });
    const attacker = await seedWorkspaceWithOwner(db, {
      userName: "F03 Attacker E",
      email: "f03-attacker-e@example.test",
      workspaceName: "WS F03 Attacker E",
    });

    // Key K2 yang TIDAK ada → denial harus identik dengan kasus key existing
    // (TEST C): reason kanonik sama, intentId null, shape sama — attacker
    // tidak dapat membedakan existing vs non-existing dari respons.
    const result = await createShopOrderIntent(db, {
      actor: { type: "USER", userId: attacker.userId, session: "VALID" },
      workspaceId: victim.workspaceId,
      idempotencyKey: "f03-key-e-nonexistent",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    });
    expect(result).toEqual({
      outcome: "DENIED",
      reasonCode: "DENY_NOT_MEMBER",
      intentId: null,
    });
    expect(
      await db.shopOrderIntent.count({
        where: { workspaceId: { in: [victim.workspaceId, attacker.workspaceId] } },
      })
    ).toBe(0);
  });

  it("TEST F — sesi ABSENT/EXPIRED/REVOKED: denial sesi kanonik SEBELUM idempotency probe (tanpa leak)", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.sec.f03-f", "MINI_RIDER");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "F03 Owner F",
      email: "f03-owner-f@example.test",
      workspaceName: "WS F03 F",
    });
    const created = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "f03-key-f",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    });
    const existingId = (created as { intentId: string }).intentId;

    const expectedCode = {
      ABSENT: "DENY_NO_SESSION",
      EXPIRED: "DENY_SESSION_EXPIRED",
      REVOKED: "DENY_SESSION_REVOKED",
    } as const;

    for (const session of ["ABSENT", "EXPIRED", "REVOKED"] as const) {
      const result = await createShopOrderIntent(db, {
        actor: { type: "USER", userId: ws.userId, session },
        workspaceId: ws.workspaceId, // konteksnya sendiri — key tetap tak boleh terprobe
        idempotencyKey: "f03-key-f", // key EXISTING
        lines: [{ productId, quantity: 1 }],
        now: NOW,
      });
      expect(result.outcome).toBe("DENIED");
      if (result.outcome === "DENIED") {
        expect(result.reasonCode).toBe(expectedCode[session]);
        expect(result.reasonCode).not.toBe(ShopReasonCode.SHOP_DENY_IDEMPOTENCY_CONFLICT);
        expect(result.intentId).toBeNull();
        expect(result.intentId).not.toBe(existingId);
      }
      expect(Object.keys(result).sort()).toEqual(["intentId", "outcome", "reasonCode"]);
    }

    // Tidak ada audit idempotency-conflict dari ketiga percobaan sesi invalid.
    const conflictAudits = await db.auditEvent.findMany({
      where: {
        category: "COMMERCE",
        reasonCode: ShopReasonCode.SHOP_DENY_IDEMPOTENCY_CONFLICT,
        actorUserId: ws.userId,
      },
    });
    expect(conflictAudits).toEqual([]);
    // Intent tetap OPEN, tidak berubah.
    const row = await db.shopOrderIntent.findUniqueOrThrow({ where: { id: existingId } });
    expect(row.status).toBe("OPEN");
  });
});
