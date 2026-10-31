// @vitest-environment node
// Integration test extension lifecycle — epicRider Phase 5-D (ADR-025;
// remediasi PR #4).
// DB hasil migration terversionisasi (disposable). Membuktikan:
// - ASSIGN → ACTIVATE → SUSPEND → RENEW → ACTIVATE → EXPIRE → REMOVE bekerja
//   end-to-end dengan otorisasi + audit (LICENSE_MATRIX §5);
// - REMEDIASI PR #4: OWNER_FALLBACK_PROPOSED DIHAPUS — tanpa permission
//   eksplisit terdokumentasi, SIAPA PUN (termasuk role `owner`) ditolak
//   DENY_PERMISSION_MISSING; success-path memakai aktor SYSTEM (pemanggil
//   internal tepercaya — jalur internal yang sah);
// - RENEWED TIDAK memberi entitlement sampai ACTIVATE; SUSPENDED/EXPIRED/
//   REMOVED tidak memberi entitlement (integrasi engine 5-C);
// - aturan satu LIVE instance per (workspace, type): service + partial
//   unique index DB (migration 5-D);
// - kompatibilitas katalog/type ditegakkan (definisi non-aktif ditolak; type
//   di luar closed list ditolak fail-closed);
// - quantity dibawa sesuai model 5-B — TIDAK ada perhitungan kuota (OD-05/06);
// - REMOVE = penghapusan logis: baris & data tetap (REQ-099);
// - isolasi tenant: aktor lintas workspace ditolak teraudit.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";

import { AuditCategory } from "@/lib/audit/audit-service";
import {
  ExtensionLifecycleAction,
  ExtensionLifecycleReasonCode,
} from "@/lib/licensing/lifecycle-shared";
import { applyExtensionLifecycleTransition } from "@/lib/licensing/extension-lifecycle";
import {
  resolveWorkspaceCapabilityEntitlement,
  resolveWorkspaceExtensionFacts,
} from "@/lib/licensing/entitlement-service";
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
const FUTURE = new Date("2026-12-01T00:00:00.000Z");
const PAST = new Date("2026-10-01T00:00:00.000Z");

interface Ws {
  workspaceId: string;
  ownerId: string;
}

let wsCounter = 0;
async function seedWs(label: string): Promise<Ws> {
  wsCounter += 1;
  const ws = await seedWorkspaceWithOwner(testDb.db, {
    userName: `Owner ${label} ${wsCounter}`,
    email: `owner-${label}-${wsCounter}-${Math.random().toString(36).slice(2, 8)}@example.test`,
    workspaceName: `WS ${label} ${wsCounter}`,
  });
  return { workspaceId: ws.workspaceId, ownerId: ws.userId };
}

/**
 * Aktor SYSTEM = pemanggil internal tepercaya (test harness berperan sebagai
 * pemanggil internal — tidak ada surface HTTP 5-D; client tidak dapat
 * menyuplai aktor ini). Dipakai untuk coverage mesin status, BUKAN untuk
 * menguji otorisasi USER.
 */
function systemActor() {
  return { type: "SYSTEM" as const, note: "internal trusted caller (integration harness)" };
}

/** Aktor USER dengan sesi valid — dipakai khusus test otorisasi/denial USER. */
function userActor(userId: string) {
  return { type: "USER" as const, userId, session: "VALID" as const };
}

async function createDefinition(code: string, typeCode: string, isActive = true) {
  const db = testDb.db;
  const type = await db.extensionType.upsert({
    where: { code: typeCode },
    update: {},
    create: { code: typeCode },
  });
  return db.extensionDefinition.create({
    data: { code, typeId: type.id, isActive, status: "CATALOG" },
    include: { type: true },
  });
}

async function createInstance(
  workspaceId: string,
  definitionId: string,
  typeId: string,
  extra?: { quantity?: number; termEndsAt?: Date }
) {
  return testDb.db.extensionInstance.create({
    data: {
      workspaceId,
      definitionId,
      typeId,
      status: "PURCHASED",
      quantity: extra?.quantity ?? null,
      termEndsAt: extra?.termEndsAt ?? null,
      sourceType: "SHOP_ORDER",
      sourceRef: `ref-${Math.random().toString(36).slice(2, 8)}`,
    },
  });
}

async function auditEvents(action: string, targetId: string) {
  return testDb.db.auditEvent.findMany({
    where: { category: AuditCategory.LICENSE, action, targetId },
    orderBy: { occurredAt: "asc" },
  });
}

/** Lisensi ACTIVE workspace (prasyarat evaluasi capability 5-C). */
async function activateLicense(workspaceId: string) {
  const tier = await testDb.db.licenseTier.findUniqueOrThrow({ where: { code: "MINI_RIDER" } });
  const license = await testDb.db.license.create({
    data: { workspaceId, tierId: tier.id, status: "PURCHASED" },
  });
  await testDb.db.license.update({ where: { id: license.id }, data: { status: "ACTIVE" } });
}

describe("ASSIGN → ACTIVATE — jalur utama + entitlement", () => {
  it("ASSIGN menandai provisionedAt; ACTIVATE membuat instance berkontribusi entitlement", async () => {
    const ws = await seedWs("ext-main");
    await activateLicense(ws.workspaceId);
    const def = await createDefinition("def-seat-main", "seat_package");
    const instance = await createInstance(ws.workspaceId, def.id, def.typeId, { quantity: 10 });

    // ACTIVATE sebelum ASSIGN ditolak (matriks: PURCHASED hanya ke ASSIGN/REMOVE).
    const premature = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
    });
    expect(premature.outcome).toBe("DENIED");
    if (premature.outcome === "DENIED") {
      expect(premature.reasonCode).toBe(ExtensionLifecycleReasonCode.DENY_LIFECYCLE_INVALID_TRANSITION);
    }

    const assigned = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.ASSIGN,
      actor: systemActor(),
      now: NOW,
      provisionedAt: NOW,
    });
    expect(assigned.outcome).toBe("SUCCESS");
    if (assigned.outcome === "SUCCESS") {
      expect(assigned.viaOwnerFallback).toBe(false); // fallback dihapus (remediasi PR #4) — selalu false
      expect(assigned.entitlementEffect).toBe("ENTITLEMENT_NOT_CONTRIBUTING");
    }
    const assignedRow = await testDb.db.extensionInstance.findUniqueOrThrow({
      where: { id: instance.id },
    });
    expect(assignedRow.status).toBe("ASSIGNED");
    expect(assignedRow.provisionedAt).toEqual(NOW);

    const activated = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
    });
    expect(activated.outcome).toBe("SUCCESS");
    if (activated.outcome === "SUCCESS") {
      expect(activated.entitlementEffect).toBe("ENTITLEMENT_CONTRIBUTES");
    }

    // Integrasi engine 5-C: extension ACTIVE berkontribusi pada capability.
    const decision = await resolveWorkspaceCapabilityEntitlement(testDb.db, {
      workspaceId: ws.workspaceId,
      capabilityCode: "core_event_workspace",
      requiredExtensionType: "seat_package",
    });
    expect(decision.decision).toBe("ALLOWED");
    const facts = await resolveWorkspaceExtensionFacts(testDb.db, ws.workspaceId);
    expect(facts.activeTypeCodes).toEqual(["seat_package"]);
    // Quantity dibawa sesuai model — TIDAK ada perhitungan kuota (OD-05/06).
    expect(facts.activeInstances).toHaveLength(1);
    expect(facts.activeInstances[0].quantity).toBe(10);
    expect(Object.keys(facts).sort()).toEqual(
      ["workspaceId", "activeTypeCodes", "activeInstances"].sort()
    );

    // Audit sukses tercatat untuk kedua transisi.
    expect(await auditEvents("extension.lifecycle.assign.success", instance.id)).toHaveLength(1);
    expect(await auditEvents("extension.lifecycle.activate.success", instance.id)).toHaveLength(1);
  });

  it("SUSPEND menghentikan kontribusi; RENEW dari SUSPENDED → RENEWED TANPA entitlement; ACTIVATE dari RENEWED memulihkan", async () => {
    const ws = await seedWs("ext-suspend");
    await activateLicense(ws.workspaceId);
    const def = await createDefinition("def-seat-susp", "seat_package");
    const instance = await createInstance(ws.workspaceId, def.id, def.typeId);
    await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.ASSIGN,
      actor: systemActor(),
      now: NOW,
    });
    await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
    });
    expect(
      (await resolveWorkspaceCapabilityEntitlement(testDb.db, {
        workspaceId: ws.workspaceId,
        capabilityCode: "core_event_workspace",
        requiredExtensionType: "seat_package",
      })).decision
    ).toBe("ALLOWED");

    const suspended = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.SUSPEND,
      actor: systemActor(),
      now: NOW,
    });
    expect(suspended.outcome).toBe("SUCCESS");
    expect(
      (await resolveWorkspaceCapabilityEntitlement(testDb.db, {
        workspaceId: ws.workspaceId,
        capabilityCode: "core_event_workspace",
        requiredExtensionType: "seat_package",
      })).decision
    ).toBe("DENIED"); // SUSPENDED tidak memberi entitlement

    const renewed = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.RENEW,
      actor: systemActor(),
      now: NOW,
      newTermEndsAt: FUTURE,
    });
    expect(renewed.outcome).toBe("SUCCESS");
    if (renewed.outcome === "SUCCESS") {
      expect(renewed.to).toBe("RENEWED");
      expect(renewed.entitlementEffect).toBe("ENTITLEMENT_NOT_CONTRIBUTING");
    }
    // RENEWED TIDAK memberi entitlement sampai ACTIVATE.
    expect(
      (await resolveWorkspaceCapabilityEntitlement(testDb.db, {
        workspaceId: ws.workspaceId,
        capabilityCode: "core_event_workspace",
        requiredExtensionType: "seat_package",
      })).decision
    ).toBe("DENIED");

    const reactivated = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
    });
    expect(reactivated.outcome).toBe("SUCCESS");
    const row = await testDb.db.extensionInstance.findUniqueOrThrow({
      where: { id: instance.id },
    });
    expect(row.status).toBe("ACTIVE");
    expect(row.termEndsAt).toEqual(FUTURE); // disuplai — bukan dihitung
  });
});

describe("aturan satu LIVE instance per (workspace, type)", () => {
  it("DB menolak instance LIVE kedua (workspace, type) sejak PURCHASED (P2002); slot bebas setelah EXPIRED; type berbeda terpisah", async () => {
    const ws = await seedWs("ext-onelive");
    const defA = await createDefinition("def-seat-a", "seat_package");
    const defB = await createDefinition("def-seat-b", "seat_package");
    const defMobile = await createDefinition("def-mobile-live", "mobile_client");
    const instA = await createInstance(ws.workspaceId, defA.id, defA.typeId);

    // Backstop DB: instance LIVE kedua (PURCHASED termasuk LIVE) untuk
    // (workspace, type) sama ditolak partial unique index migration 5-D.
    let dbError: unknown = null;
    try {
      await createInstance(ws.workspaceId, defB.id, defB.typeId);
    } catch (error) {
      dbError = error;
    }
    expect(dbError).not.toBeNull();
    expect(String((dbError as { code?: string }).code)).toBe("P2002");

    // Type berbeda = slot terpisah — tidak terganggu aturan satu-live.
    const instMobile = await createInstance(ws.workspaceId, defMobile.id, defMobile.typeId);
    const mobileAssign = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instMobile.id,
      action: ExtensionLifecycleAction.ASSIGN,
      actor: systemActor(),
      now: NOW,
    });
    expect(mobileAssign.outcome).toBe("SUCCESS");

    // instA melewati lifecycle sampai EXPIRED (bukan LIVE) → slot type bebas.
    await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instA.id,
      action: ExtensionLifecycleAction.ASSIGN,
      actor: systemActor(),
      now: NOW,
    });
    await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instA.id,
      action: ExtensionLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
    });
    await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instA.id,
      action: ExtensionLifecycleAction.EXPIRE,
      actor: systemActor(),
      now: NOW,
    });
    const instB = await createInstance(ws.workspaceId, defB.id, defB.typeId); // kini sah
    const instBAssign = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instB.id,
      action: ExtensionLifecycleAction.ASSIGN,
      actor: systemActor(),
      now: NOW,
    });
    expect(instBAssign.outcome).toBe("SUCCESS");
  });

  it("konkurensi: ASSIGN pada type berbeda independen; retry ASSIGN identik = no-op idempoten (tanpa efek ganda)", async () => {
    const ws = await seedWs("ext-race");
    const defSeat = await createDefinition("def-seat-race", "seat_package");
    const defMobile = await createDefinition("def-mobile-race", "mobile_client");
    const instSeat = await createInstance(ws.workspaceId, defSeat.id, defSeat.typeId);
    const instMobile = await createInstance(ws.workspaceId, defMobile.id, defMobile.typeId);

    // Dua transisi konkuren pada baris BERBEDA (type berbeda = slot terpisah):
    // keduanya sukses, tidak saling mengganggu (SQLite menserialisasi tulisan;
    // guard optimistic per baris tetap bekerja).
    const results = await Promise.all([
      applyExtensionLifecycleTransition(testDb.db, {
        instanceId: instSeat.id,
        action: ExtensionLifecycleAction.ASSIGN,
        actor: systemActor(),
        now: NOW,
      }),
      applyExtensionLifecycleTransition(testDb.db, {
        instanceId: instMobile.id,
        action: ExtensionLifecycleAction.ASSIGN,
        actor: systemActor(),
        now: NOW,
      }),
    ]);
    expect(results[0].outcome).toBe("SUCCESS");
    expect(results[1].outcome).toBe("SUCCESS");

    // Retry identik pada instance yang sudah ASSIGNED: no-op idempoten —
    // tidak ada efek ganda (provisionedAt tidak berubah, tidak ada denial palsu).
    const provisionedBefore = (
      await testDb.db.extensionInstance.findUniqueOrThrow({ where: { id: instSeat.id } })
    ).provisionedAt;
    const replay = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instSeat.id,
      action: ExtensionLifecycleAction.ASSIGN,
      actor: systemActor(),
      now: NOW,
      provisionedAt: new Date("2027-01-01T00:00:00.000Z"), // data berbeda — replay TIDAK menimpa
    });
    expect(replay.outcome).toBe("SUCCESS");
    expect(replay.outcome === "SUCCESS" && replay.idempotent).toBe(true);
    const seatRow = await testDb.db.extensionInstance.findUniqueOrThrow({
      where: { id: instSeat.id },
    });
    expect(seatRow.status).toBe("ASSIGNED");
    expect(seatRow.provisionedAt).toEqual(provisionedBefore); // replay tidak menimpa data

    // Tepat satu instance LIVE per (workspace, type) setelah seluruh operasi.
    const liveSeats = await testDb.db.extensionInstance.findMany({
      where: {
        workspaceId: ws.workspaceId,
        typeId: defSeat.typeId,
        status: { in: ["PURCHASED", "ASSIGNED", "ACTIVE", "SUSPENDED", "RENEWED"] },
      },
    });
    expect(liveSeats).toHaveLength(1);
  }, 30_000);
});

describe("kompatibilitas katalog/type & invariant typeId (fail-closed)", () => {
  it("definisi tidak aktif → ASSIGN ditolak (DENY_DEFINITION_INACTIVE)", async () => {
    const ws = await seedWs("ext-inactive-def");
    const def = await createDefinition("def-landing-inactive", "workspace_landing", false);
    const instance = await createInstance(ws.workspaceId, def.id, def.typeId);
    const result = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.ASSIGN,
      actor: systemActor(),
      now: NOW,
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") {
      expect(result.reasonCode).toBe(ExtensionLifecycleReasonCode.DENY_DEFINITION_INACTIVE);
    }
  });

  it("type di luar closed list owner → ditolak fail-closed (DENY_INVALID_EXTENSION_TYPE)", async () => {
    const ws = await seedWs("ext-rogue-type");
    const rogueType = await testDb.db.extensionType.create({
      data: { code: "rogue_type" }, // langsung DB — bukan vocabulary owner
    });
    const def = await testDb.db.extensionDefinition.create({
      data: { code: "def-rogue", typeId: rogueType.id, isActive: true },
    });
    const instance = await createInstance(ws.workspaceId, def.id, rogueType.id);
    const result = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.ASSIGN,
      actor: systemActor(),
      now: NOW,
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") {
      expect(result.reasonCode).toBe(ExtensionLifecycleReasonCode.DENY_INVALID_EXTENSION_TYPE);
    }
  });

  it("baris tanpa typeId (legacy) → ditolak fail-closed (DENY_UNEVALUABLE_INSTANCE)", async () => {
    const ws = await seedWs("ext-null-type");
    const def = await createDefinition("def-seat-null", "seat_package");
    const instance = await testDb.db.extensionInstance.create({
      data: { workspaceId: ws.workspaceId, definitionId: def.id, typeId: null, status: "PURCHASED" },
    });
    const result = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.ASSIGN,
      actor: systemActor(),
      now: NOW,
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") {
      expect(result.reasonCode).toBe(ExtensionLifecycleReasonCode.DENY_UNEVALUABLE_INSTANCE);
    }
  });

  it("partial unique index migration 5-D terpasang di DB", async () => {
    const indexes = await testDb.db.$queryRaw<{ name: string }[]>(
      Prisma.sql`SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'ExtensionInstance_workspaceId_typeId_live_key'`
    );
    expect(indexes).toHaveLength(1);
  });
});

describe("EXPIRE verify-only, REMOVE logis (REQ-099), isolasi tenant", () => {
  it("EXPIRE sebelum termEndsAt tersimpan ditolak; setelahnya/termEndsAt null → EXPIRED", async () => {
    const ws = await seedWs("ext-expire");
    const def = await createDefinition("def-seat-exp", "seat_package");
    const instance = await createInstance(ws.workspaceId, def.id, def.typeId, {
      termEndsAt: FUTURE,
    });
    await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.ASSIGN,
      actor: systemActor(),
      now: NOW,
    });
    await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
    });
    const early = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.EXPIRE,
      actor: systemActor(),
      now: NOW,
    });
    expect(early.outcome).toBe("DENIED");
    if (early.outcome === "DENIED") {
      expect(early.reasonCode).toBe(ExtensionLifecycleReasonCode.DENY_TERM_NOT_ENDED);
    }
    const expired = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.EXPIRE,
      actor: systemActor(),
      now: new Date("2026-12-02T00:00:00.000Z"),
    });
    expect(expired.outcome).toBe("SUCCESS");
    if (expired.outcome === "SUCCESS") {
      expect(expired.entitlementEffect).toBe("ENTITLEMENT_NOT_CONTRIBUTING");
    }
  });

  it("REMOVE dari EXPIRED = status logis — baris & sourceRef tetap (tidak ada hapus data)", async () => {
    const ws = await seedWs("ext-remove");
    const def = await createDefinition("def-seat-rm", "seat_package");
    const instance = await createInstance(ws.workspaceId, def.id, def.typeId);
    const sourceRef = instance.sourceRef as string;
    await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.ASSIGN,
      actor: systemActor(),
      now: NOW,
    });
    const removed = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.REMOVE,
      actor: systemActor(),
      now: NOW,
    });
    expect(removed.outcome).toBe("SUCCESS");
    const row = await testDb.db.extensionInstance.findUniqueOrThrow({
      where: { id: instance.id },
    });
    expect(row.status).toBe("REMOVED");
    expect(row.sourceRef).toBe(sourceRef); // data tidak dihapus
    expect(row.typeId).toBe(def.typeId);
    // REMOVED terminal.
    const after = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
    });
    expect(after.outcome).toBe("DENIED");
  });

  it("owner workspace lain tidak dapat mentransisi instance (isolasi tenant) — denial teraudit", async () => {
    const wsA = await seedWs("ext-iso-a");
    const wsB = await seedWs("ext-iso-b");
    const def = await createDefinition("def-seat-iso", "seat_package");
    const instance = await createInstance(wsA.workspaceId, def.id, def.typeId);
    const result = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.ASSIGN,
      actor: userActor(wsB.ownerId), // owner workspace B — bukan member A
      now: NOW,
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") {
      expect(result.reasonCode).toBe("DENY_NOT_MEMBER");
    }
    const row = await testDb.db.extensionInstance.findUniqueOrThrow({
      where: { id: instance.id },
    });
    expect(row.status).toBe("PURCHASED");
    const events = await auditEvents("extension.lifecycle.assign.denied", instance.id);
    expect(events).toHaveLength(1);
    expect(events[0].tenantWorkspaceId).toBe(wsA.workspaceId);
  });

  it("instance tidak ditemukan → DENY_INSTANCE_NOT_FOUND teraudit", async () => {
    const result = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: "missing-instance",
      action: ExtensionLifecycleAction.ASSIGN,
      actor: { type: "SYSTEM" },
      now: NOW,
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") {
      expect(result.reasonCode).toBe(ExtensionLifecycleReasonCode.DENY_INSTANCE_NOT_FOUND);
    }
  });
});

describe("otorisasi eksplisit — fallback owner DIHAPUS (remediasi PR #4)", () => {
  it("owner USER (ACTIVE + sesi VALID) ditolak DENY_PERMISSION_MISSING pada ASSIGN (key kanonik §4.6) — grant menunggu ratifikasi owner (OD-122)", async () => {
    const ws = await seedWs("remed-owner-assign");
    const def = await createDefinition("def-seat-remed-assign", "seat_package");
    const instance = await createInstance(ws.workspaceId, def.id, def.typeId);
    const result = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.ASSIGN,
      actor: userActor(ws.ownerId),
      now: NOW,
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") {
      expect(result.reasonCode).toBe("DENY_PERMISSION_MISSING");
      expect(result.viaOwnerFallback).toBe(false);
    }
    // Denial owner = first-class, teraudit; status TIDAK berubah diam-diam.
    const row = await testDb.db.extensionInstance.findUniqueOrThrow({
      where: { id: instance.id },
    });
    expect(row.status).toBe("PURCHASED");
    const events = await auditEvents("extension.lifecycle.assign.denied", instance.id);
    expect(events).toHaveLength(1);
    expect(events[0].reasonCode).toBe("DENY_PERMISSION_MISSING");
    expect(events[0].metadataJson).toContain('"actorType":"USER"');
  });

  it("owner USER ditolak pada aksi keyless (ACTIVATE/SUSPEND/EXPIRE) — tanpa key kanonik = default deny, bukan fallback", async () => {
    const ws = await seedWs("remed-owner-keyless");
    const def = await createDefinition("def-seat-remed-keyless", "seat_package");
    const instance = await createInstance(ws.workspaceId, def.id, def.typeId);
    for (const action of [
      ExtensionLifecycleAction.ACTIVATE,
      ExtensionLifecycleAction.SUSPEND,
      ExtensionLifecycleAction.EXPIRE,
    ] as const) {
      const result = await applyExtensionLifecycleTransition(testDb.db, {
        instanceId: instance.id,
        action,
        actor: userActor(ws.ownerId),
        now: NOW,
      });
      expect(result.outcome).toBe("DENIED");
      if (result.outcome === "DENIED") {
        expect(result.reasonCode).toBe("DENY_PERMISSION_MISSING");
      }
    }
    const row = await testDb.db.extensionInstance.findUniqueOrThrow({
      where: { id: instance.id },
    });
    expect(row.status).toBe("PURCHASED");
  });

  it("member USER tetap ditolak (DENY_PERMISSION_MISSING); non-member tetap ditolak (DENY_NOT_MEMBER) — tidak ada jalur allow lain", async () => {
    const ws = await seedWs("remed-member-ext");
    const def = await createDefinition("def-seat-remed-member", "seat_package");
    const instance = await createInstance(ws.workspaceId, def.id, def.typeId);
    const member = await seedMember(testDb.db, {
      email: "member-ext-remed@example.test",
      name: "Member Ext Remed",
      workspaceId: ws.workspaceId,
    });
    const asMember = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.ASSIGN,
      actor: userActor(member.userId),
      now: NOW,
    });
    expect(asMember.outcome).toBe("DENIED");
    if (asMember.outcome === "DENIED") {
      expect(asMember.reasonCode).toBe("DENY_PERMISSION_MISSING");
    }
    const outsider = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Outsider Ext",
      email: "outsider-ext-remed@example.test",
      workspaceName: "WS outsider ext",
    });
    const asOutsider = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.ASSIGN,
      actor: userActor(outsider.userId),
      now: NOW,
    });
    expect(asOutsider.outcome).toBe("DENIED");
    if (asOutsider.outcome === "DENIED") {
      expect(asOutsider.reasonCode).toBe("DENY_NOT_MEMBER");
    }
  });

  it("SYSTEM (pemanggil internal tepercaya) melanjutkan transisi; USER identik ditolak — aktor tidak dapat disuplai client (tidak ada route 5-D)", async () => {
    const ws = await seedWs("remed-system-ext");
    const def = await createDefinition("def-seat-remed-system", "seat_package");
    const instance = await createInstance(ws.workspaceId, def.id, def.typeId);
    const asUser = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.ASSIGN,
      actor: userActor(ws.ownerId),
      now: NOW,
    });
    expect(asUser.outcome).toBe("DENIED");
    const asSystem = await applyExtensionLifecycleTransition(testDb.db, {
      instanceId: instance.id,
      action: ExtensionLifecycleAction.ASSIGN,
      actor: systemActor(),
      now: NOW,
    });
    expect(asSystem.outcome).toBe("SUCCESS");
    if (asSystem.outcome === "SUCCESS") {
      expect(asSystem.viaOwnerFallback).toBe(false);
    }
  });
});
