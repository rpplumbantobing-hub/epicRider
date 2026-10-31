// @vitest-environment node
// Integration test verified completion + issuance — epicRider Phase 5-E
// (ADR-026; prompt owner 5-E §13/§14). Membuktikan:
// - completion = boundary internal tepercaya; USER tidak dapat menyuplai
//   bukti (client says paid = TIDAK PERNAH dipercaya); sumber union tertutup;
// - issuance hanya dari COMPLETED; hasil = License/ExtensionInstance
//   status PURCHASED + sourceType/sourceRef + term caller-supplied;
// - TIDAK ada PURCHASED → ACTIVE dari commerce: entitlement engine tetap
//   menolak setelah issuance; aktivasi HANYA via layanan lifecycle 5-D;
// - idempotensi issuance (replay = no-op sukses); rollback transaksi penuh
//   saat pelanggaran invariant (dua line same-type extension);
// - fail-closed: produk ditarik setelah intent → issuance menolak;
// - extension: quantity dibawa dari line; slot LIVE unik ditegakkan.

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { resolveWorkspaceCapabilityEntitlement } from "@/lib/licensing/entitlement-service";
import {
  applyLicenseLifecycleTransition,
} from "@/lib/licensing/license-lifecycle";
import {
  LicenseLifecycleAction,
  type LifecycleActor,
} from "@/lib/licensing/lifecycle-shared";
import { verifyShopOrderCompletion } from "@/lib/shop/completion";
import { issueFromCompletedShopOrderIntent } from "@/lib/shop/issuance";
import { cancelShopOrderIntent, createShopOrderIntent } from "@/lib/shop/order-intent";
import { activateShopProduct, createShopProduct, withdrawShopProduct } from "@/lib/shop/catalog";
import { ShopReasonCode } from "@/lib/shop/reason-codes";
import { SHOP_COMPLETION_SOURCES } from "@/lib/shop/vocabulary";
import {
  createTestDatabase,
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
const TERM_START = new Date("2026-11-02T00:00:00.000Z");
const TERM_END = new Date("2027-11-01T00:00:00.000Z");
const RENEWAL_WINDOW = new Date("2027-10-01T00:00:00.000Z");
const SYSTEM: LifecycleActor = { type: "SYSTEM" };

const COMPLETION = {
  source: SHOP_COMPLETION_SOURCES[0], // NON_PRODUCTION_TEST_SIMULATION
  evidenceRef: "sim-run-5e-001",
} as const;

async function setupActiveLicenseProduct(code: string, tierCode: "MINI_RIDER" | "MAX_RIDER" = "MINI_RIDER") {
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

async function setupActiveExtensionProduct(code: string, typeCode: "workspace_landing" | "seat_package") {
  const db = testDb.db;
  const type = await db.extensionType.findUniqueOrThrow({ where: { code: typeCode } });
  const definition = await db.extensionDefinition.create({
    data: { code: `ext.${code}`, typeId: type.id, isActive: true },
  });
  const created = await createShopProduct(db, {
    actor: SYSTEM,
    input: { code: `shop.test.${code}`, kind: "EXTENSION", displayName: typeCode, definitionId: definition.id },
    now: NOW,
  });
  await activateShopProduct(db, { actor: SYSTEM, productId: created.productId!, now: NOW });
  return created.productId!;
}

async function createCompletedIntent(workspaceId: string, key: string, productId: string, quantity = 1) {
  const db = testDb.db;
  const intent = await createShopOrderIntent(db, {
    actor: SYSTEM,
    workspaceId,
    idempotencyKey: key,
    lines: [{ productId, quantity }],
    now: NOW,
  });
  expect(intent.outcome).toBe("SUCCESS");
  const intentId = (intent as { intentId: string }).intentId;
  const completion = await verifyShopOrderCompletion(db, {
    actor: SYSTEM,
    orderIntentId: intentId,
    completion: COMPLETION,
    now: NOW,
  });
  expect(completion.outcome).toBe("SUCCESS");
  return intentId;
}

describe("verified completion (§13)", () => {
  it("OPEN → COMPLETED via sumber internal; completionSource tercatat; TIDAK ada efek entitlement", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.done.mini");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "Done Owner A",
      email: "done-owner-a@example.test",
      workspaceName: "WS Done A",
    });
    const intentId = await createCompletedIntent(ws.workspaceId, "done-1", productId);

    const row = await db.shopOrderIntent.findUniqueOrThrow({ where: { id: intentId } });
    expect(row.status).toBe("COMPLETED");
    expect(row.completionSource).toBe("NON_PRODUCTION_TEST_SIMULATION");
    expect(row.completedAt).toEqual(NOW);
    // Completion TIDAK meng-issue apa pun (issuance = langkah terpisah).
    expect(await db.license.count({ where: { workspaceId: ws.workspaceId } })).toBe(0);
    expect(await db.extensionInstance.count({ where: { workspaceId: ws.workspaceId } })).toBe(0);
  });

  it("USER TIDAK dapat menyuplai completion (owner pun ditolak; denial teraudit)", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.done.user");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "Done Owner B",
      email: "done-owner-b@example.test",
      workspaceName: "WS Done B",
    });
    const intent = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "done-user-1",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    });
    const intentId = (intent as { intentId: string }).intentId;

    const result = await verifyShopOrderCompletion(db, {
      actor: { type: "USER", userId: ws.userId, session: "VALID" },
      orderIntentId: intentId,
      completion: COMPLETION,
      now: NOW,
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") {
      // Bukti "paid" dari USER tidak pernah dipercaya — default deny.
      expect(result.reasonCode).toBe("DENY_PERMISSION_MISSING");
    }
    const row = await db.shopOrderIntent.findUniqueOrThrow({ where: { id: intentId } });
    expect(row.status).toBe("OPEN"); // tidak berubah
    expect(row.completionSource).toBeNull();

    const denial = await db.auditEvent.findFirstOrThrow({
      where: { category: "COMMERCE", action: "shop.completion.verify", outcome: "DENIED", targetId: intentId },
    });
    expect(denial.reasonCode).toBe("DENY_PERMISSION_MISSING");
  });

  it("replay completion = no-op idempotent; intent CANCELLED tidak dapat di-complete", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.done.replay");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "Done Owner C",
      email: "done-owner-c@example.test",
      workspaceName: "WS Done C",
    });
    const intentId = await createCompletedIntent(ws.workspaceId, "done-replay-1", productId);

    const replay = await verifyShopOrderCompletion(db, {
      actor: SYSTEM,
      orderIntentId: intentId,
      completion: COMPLETION,
      now: NOW,
    });
    expect(replay).toMatchObject({ outcome: "SUCCESS", status: "COMPLETED", idempotent: true });

    const cancelIntent = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "done-cancel-1",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    });
    const cancelId = (cancelIntent as { intentId: string }).intentId;
    await cancelShopOrderIntent(db, { actor: SYSTEM, orderIntentId: cancelId, now: NOW });
    const onCancelled = await verifyShopOrderCompletion(db, {
      actor: SYSTEM,
      orderIntentId: cancelId,
      completion: COMPLETION,
      now: NOW,
    });
    expect(onCancelled.outcome).toBe("DENIED");
    if (onCancelled.outcome === "DENIED") {
      expect(onCancelled.reasonCode).toBe(ShopReasonCode.SHOP_DENY_ORDER_NOT_OPEN);
    }
  });
});

describe("issuance (§14)", () => {
  it("LICENSE: COMPLETED → License(status=PURCHASED) + sourceType/sourceRef + term caller-supplied (tanpa nilai dikarang)", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.issue.lic");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "Issue Owner A",
      email: "issue-owner-a@example.test",
      workspaceName: "WS Issue A",
    });
    const intentId = await createCompletedIntent(ws.workspaceId, "issue-lic-1", productId);

    const result = await issueFromCompletedShopOrderIntent(db, {
      actor: SYSTEM,
      orderIntentId: intentId,
      licenseTerm: {
        termStartsAt: TERM_START,
        termEndsAt: TERM_END,
        renewalWindowStartsAt: RENEWAL_WINDOW,
      },
      now: NOW,
    });
    expect(result.outcome).toBe("SUCCESS");
    const licenseId = (result as { issuedLicenseId: string }).issuedLicenseId;

    const license = await db.license.findUniqueOrThrow({ where: { id: licenseId } });
    expect(license.status).toBe("PURCHASED"); // BUKAN ACTIVE
    expect(license.workspaceId).toBe(ws.workspaceId);
    expect(license.sourceType).toBe("SHOP_ORDER_INTENT");
    expect(license.sourceRef).toBe(intentId);
    // Term data caller-supplied — persis nilai yang disuplai (OD-108).
    expect(license.termStartsAt).toEqual(TERM_START);
    expect(license.termEndsAt).toEqual(TERM_END);
    expect(license.renewalWindowStartsAt).toEqual(RENEWAL_WINDOW);
    // purchasedAt = fakta completedAt intent (bukan perhitungan durasi).
    expect(license.purchasedAt).toEqual(NOW);
    expect(license.graceEndsAt).toBeNull(); // TIDAK ada grace dikarang

    const intent = await db.shopOrderIntent.findUniqueOrThrow({ where: { id: intentId } });
    expect(intent.status).toBe("ISSUED");

    // Audit issuance atomik.
    const audit = await db.auditEvent.findFirstOrThrow({
      where: { category: "COMMERCE", action: "shop.issuance.execute", outcome: "SUCCESS", targetId: intentId },
    });
    expect(audit.reasonCode).toBe("ALLOW");
  });

  it("ENTITLEMENT BOUNDARY: setelah issuance status PURCHASED — engine 5-C tetap MENOLAK; aktivasi HANYA via lifecycle 5-D", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.issue.boundary", "MAX_RIDER");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "Issue Owner B",
      email: "issue-owner-b@example.test",
      workspaceName: "WS Issue B",
    });
    const intentId = await createCompletedIntent(ws.workspaceId, "issue-boundary-1", productId);
    const result = await issueFromCompletedShopOrderIntent(db, {
      actor: SYSTEM,
      orderIntentId: intentId,
      licenseTerm: { termStartsAt: TERM_START, termEndsAt: TERM_END },
      now: NOW,
    });
    const licenseId = (result as { issuedLicenseId: string }).issuedLicenseId;

    // PURCHASED bukan sumber entitlement (engine 5-C).
    const denied = await resolveWorkspaceCapabilityEntitlement(db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "crm", // capability maxRider
    });
    expect(denied.decision).toBe("DENIED");
    expect(denied.reasonCode).toBe("DENY_LICENSE_STATE");

    // Aktivasi HANYA lewat layanan lifecycle 5-D (aktor SYSTEM internal).
    const activated = await applyLicenseLifecycleTransition(db, {
      licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: SYSTEM,
      now: NOW,
    });
    expect(activated.outcome).toBe("SUCCESS");
    const license = await db.license.findUniqueOrThrow({ where: { id: licenseId } });
    expect(license.status).toBe("ACTIVE");

    // Kini entitlement meng-grant (melalui jalur yang benar).
    const granted = await resolveWorkspaceCapabilityEntitlement(db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "crm",
    });
    expect(granted.decision).toBe("ALLOWED");

    // Commerce code TIDAK punya fungsi aktivasi — modul shop tidak mengekspor
    // transisi ACTIVE (structural: diuji di surface isolation).
  });

  it("EXTENSION: COMPLETED → ExtensionInstance(status=PURCHASED) + quantity dari line + typeId denormalisasi", async () => {
    const db = testDb.db;
    const productId = await setupActiveExtensionProduct("issue_ext_landing", "workspace_landing");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "Issue Owner C",
      email: "issue-owner-c@example.test",
      workspaceName: "WS Issue C",
    });
    const intentId = await createCompletedIntent(ws.workspaceId, "issue-ext-1", productId, 1);

    const result = await issueFromCompletedShopOrderIntent(db, {
      actor: SYSTEM,
      orderIntentId: intentId,
      extensionTerm: { termStartsAt: TERM_START, termEndsAt: TERM_END },
      provisionedAt: NOW,
      now: NOW,
    });
    expect(result.outcome).toBe("SUCCESS");
    const instanceId = (result as { issuedExtensionInstanceIds: readonly string[] })
      .issuedExtensionInstanceIds[0];

    const instance = await db.extensionInstance.findUniqueOrThrow({ where: { id: instanceId } });
    expect(instance.status).toBe("PURCHASED"); // BUKAN ACTIVE
    expect(instance.sourceType).toBe("SHOP_ORDER_INTENT");
    expect(instance.sourceRef).toBe(intentId);
    expect(instance.quantity).toBe(1); // dibawa dari line (caller-supplied)
    expect(instance.typeId).not.toBeNull(); // denormalisasi 5-D tersinkron
    expect(instance.termStartsAt).toEqual(TERM_START);
    expect(instance.termEndsAt).toEqual(TERM_END);
    expect(instance.provisionedAt).toEqual(NOW);

    // Extension PURCHASED tidak berkontribusi entitlement (engine 5-C).
    const entitlement = await resolveWorkspaceCapabilityEntitlement(db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "core_event_workspace",
    });
    expect(entitlement.decision).toBe("DENIED"); // workspace tanpa lisensi ACTIVE
  });

  it("issuance atas intent OPEN/CANCELLED ditolak; replay intent ISSUED = no-op idempotent", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.issue.guard");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "Issue Owner D",
      email: "issue-owner-d@example.test",
      workspaceName: "WS Issue D",
    });

    // OPEN → ditolak (INTENT ≠ COMPLETED).
    const openIntent = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "issue-guard-open",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    });
    const openId = (openIntent as { intentId: string }).intentId;
    const fromOpen = await issueFromCompletedShopOrderIntent(db, {
      actor: SYSTEM,
      orderIntentId: openId,
      now: NOW,
    });
    expect(fromOpen).toMatchObject({ outcome: "DENIED", reasonCode: ShopReasonCode.SHOP_DENY_ORDER_NOT_COMPLETED });

    // CANCELLED → ditolak.
    const cancelIntent = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "issue-guard-cancel",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    });
    const cancelId = (cancelIntent as { intentId: string }).intentId;
    await cancelShopOrderIntent(db, { actor: SYSTEM, orderIntentId: cancelId, now: NOW });
    const fromCancelled = await issueFromCompletedShopOrderIntent(db, {
      actor: SYSTEM,
      orderIntentId: cancelId,
      now: NOW,
    });
    expect(fromCancelled).toMatchObject({ outcome: "DENIED", reasonCode: ShopReasonCode.SHOP_DENY_ORDER_CANCELLED });

    // ISSUED → replay no-op sukses (tanpa lisensi kedua).
    const completedId = await createCompletedIntent(ws.workspaceId, "issue-guard-issued", productId);
    const first = await issueFromCompletedShopOrderIntent(db, {
      actor: SYSTEM,
      orderIntentId: completedId,
      now: NOW,
    });
    expect(first.outcome).toBe("SUCCESS");
    const replay = await issueFromCompletedShopOrderIntent(db, {
      actor: SYSTEM,
      orderIntentId: completedId,
      now: NOW,
    });
    expect(replay).toMatchObject({ outcome: "SUCCESS", idempotent: true });
    expect(
      await db.license.count({
        where: { workspaceId: ws.workspaceId, sourceType: "SHOP_ORDER_INTENT", sourceRef: completedId },
      })
    ).toBe(1);
    expect(await db.license.count({ where: { workspaceId: ws.workspaceId } })).toBe(1);
  });

  it("ROLLBACK: dua line extension same-type melanggar invariant satu-LIVE → transaksi batal penuh (tanpa instance, tanpa ISSUED, denial teraudit)", async () => {
    const db = testDb.db;
    const productId = await setupActiveExtensionProduct("issue_ext_dup", "seat_package");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "Issue Owner E",
      email: "issue-owner-e@example.test",
      workspaceName: "WS Issue E",
    });

    // Buat intent dua line produk sama (bypass struktur single-line via DB
    // langsung TIDAK dilakukan — createShopOrderIntent mengizinkan multi-line
    // extension; dua line same-type sah di intent, gagal di issuance DB).
    const intent = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "issue-rollback-1",
      lines: [
        { productId, quantity: 5 },
        { productId, quantity: 3 },
      ],
      now: NOW,
    });
    // Dua line same-type sama saja = eligibility per productId tetap lolos
    // (slot belum terisi) — intent sah.
    expect(intent.outcome).toBe("SUCCESS");
    const intentId = (intent as { intentId: string }).intentId;
    await verifyShopOrderCompletion(db, {
      actor: SYSTEM,
      orderIntentId: intentId,
      completion: COMPLETION,
      now: NOW,
    });

    const result = await issueFromCompletedShopOrderIntent(db, {
      actor: SYSTEM,
      orderIntentId: intentId,
      now: NOW,
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") {
      expect(result.reasonCode).toBe(ShopReasonCode.SHOP_DENY_LIVE_INSTANCE_EXISTS);
    }

    // Rollback penuh: TIDAK ada instance, intent tetap COMPLETED, denial teraudit.
    expect(await db.extensionInstance.count({ where: { sourceRef: intentId } })).toBe(0);
    const row = await db.shopOrderIntent.findUniqueOrThrow({ where: { id: intentId } });
    expect(row.status).toBe("COMPLETED"); // TIDAK menjadi ISSUED
    const denial = await db.auditEvent.findFirstOrThrow({
      where: { category: "COMMERCE", action: "shop.issuance.execute", outcome: "DENIED", targetId: intentId },
    });
    expect(denial.reasonCode).toBe(ShopReasonCode.SHOP_DENY_LIVE_INSTANCE_EXISTS);
  });

  it("fail-closed waktu issuance: produk ditarik setelah intent → issuance menolak (tanpa efek)", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.issue.withdrawn");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "Issue Owner F",
      email: "issue-owner-f@example.test",
      workspaceName: "WS Issue F",
    });
    const intentId = await createCompletedIntent(ws.workspaceId, "issue-withdrawn-1", productId);
    await withdrawShopProduct(db, { actor: SYSTEM, productId, now: NOW });

    const result = await issueFromCompletedShopOrderIntent(db, {
      actor: SYSTEM,
      orderIntentId: intentId,
      now: NOW,
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") {
      expect(result.reasonCode).toBe(ShopReasonCode.SHOP_DENY_PRODUCT_NOT_ACTIVE);
    }
    expect(await db.license.count({ where: { workspaceId: ws.workspaceId } })).toBe(0);
    const row = await db.shopOrderIntent.findUniqueOrThrow({ where: { id: intentId } });
    expect(row.status).toBe("COMPLETED");
  });

  it("USER tanpa permission ratified tidak dapat meng-issue (denial teraudit; OD-122)", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.issue.user");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "Issue Owner G",
      email: "issue-owner-g@example.test",
      workspaceName: "WS Issue G",
    });
    const intentId = await createCompletedIntent(ws.workspaceId, "issue-user-1", productId);

    const result = await issueFromCompletedShopOrderIntent(db, {
      actor: { type: "USER", userId: ws.userId, session: "VALID" },
      orderIntentId: intentId,
      now: NOW,
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") {
      expect(result.reasonCode).toBe("DENY_PERMISSION_MISSING");
    }
    expect(await db.license.count({ where: { workspaceId: ws.workspaceId } })).toBe(0);
  });

  it("ORDER BARU pada workspace yang sudah ter-issue → RENEWAL eligibility; issuance kedua membuat baris PURCHASED kedua (tanpa ACTIVE kedua)", async () => {
    const db = testDb.db;
    const productId = await setupActiveLicenseProduct("shop.test.issue.renew");
    const ws = await seedWorkspaceWithOwner(db, {
      userName: "Issue Owner H",
      email: "issue-owner-h@example.test",
      workspaceName: "WS Issue H",
    });

    // Order pertama (FIRST_LICENSE) → issue.
    const firstIntentId = await createCompletedIntent(ws.workspaceId, "issue-renew-1", productId);
    await issueFromCompletedShopOrderIntent(db, { actor: SYSTEM, orderIntentId: firstIntentId, now: NOW });

    // Order kedua = RENEWAL (issue berikutnya; aktivasi tetap jalur lifecycle).
    const secondIntent = await createShopOrderIntent(db, {
      actor: SYSTEM,
      workspaceId: ws.workspaceId,
      idempotencyKey: "issue-renew-2",
      lines: [{ productId, quantity: 1 }],
      now: NOW,
    });
    expect(secondIntent.outcome).toBe("SUCCESS");
    if (secondIntent.outcome === "SUCCESS") {
      expect(secondIntent.eligibilityKind).toBe("RENEWAL");
    }
    const secondId = (secondIntent as { intentId: string }).intentId;
    await verifyShopOrderCompletion(db, {
      actor: SYSTEM,
      orderIntentId: secondId,
      completion: COMPLETION,
      now: NOW,
    });
    const second = await issueFromCompletedShopOrderIntent(db, {
      actor: SYSTEM,
      orderIntentId: secondId,
      licenseTerm: { termStartsAt: TERM_START, termEndsAt: TERM_END },
      now: NOW,
    });
    expect(second.outcome).toBe("SUCCESS");

    // Dua baris PURCHASED (histori) — tidak ada yang otomatis ACTIVE.
    const licenses = await db.license.findMany({ where: { workspaceId: ws.workspaceId } });
    expect(licenses).toHaveLength(2);
    expect(licenses.every((l) => l.status === "PURCHASED")).toBe(true);
  });
});
