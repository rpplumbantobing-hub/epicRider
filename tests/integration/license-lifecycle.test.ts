// @vitest-environment node
// Integration test license lifecycle — epicRider Phase 5-D (ADR-025;
// remediasi PR #4).
// DB hasil migration terversionisasi (disposable; bukan dev/produksi).
// Membuktikan:
// - 8 transisi kanonik bekerja end-to-end dengan otorisasi + audit;
// - REMEDIASI PR #4: OWNER_FALLBACK_PROPOSED DIHAPUS — tanpa permission
//   eksplisit terdokumentasi, SIAPA PUN (termasuk role `owner`) ditolak
//   DENY_PERMISSION_MISSING; penolakan member/non-member/owner/sesi tidak
//   sah teraudit; success-path memakai aktor SYSTEM (pemanggil internal
//   tepercaya — jalur internal yang sah);
// - verify-only term/grace (tanpa perhitungan durasi; tanpa scheduler);
// - idempotensi state-convergence (retry identik = no-op, bukan efek ganda);
// - tepat satu ACTIVE per workspace (service + partial unique index DB);
// - optimistic concurrency (konflik = denial eksplisit teraudit);
// - REQ-099: DOWNGRADE tidak menghapus data; REACTIVATE memulihkan;
// - akses mengikuti status (integrasi engine 5-C);
// - aktor SYSTEM hanya dari pemanggil internal (tidak ada route HTTP 5-D).

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";

import { AuditCategory } from "@/lib/audit/audit-service";
import {
  LicenseLifecycleAction,
  LicenseLifecycleReasonCode,
} from "@/lib/licensing/lifecycle-shared";
import {
  applyLicenseLifecycleTransition,
  resolveWorkspaceLicenseState,
} from "@/lib/licensing/license-lifecycle";
import { resolveWorkspaceCapabilityEntitlement } from "@/lib/licensing/entitlement-service";
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
const PAST = new Date("2026-10-01T00:00:00.000Z");
const FUTURE = new Date("2026-12-01T00:00:00.000Z");

interface Seed {
  workspaceId: string;
  ownerId: string;
  tierId: string;
}

async function seedWorkspaceWithLicense(
  label: string
): Promise<Seed & { licenseId: string }> {
  const db = testDb.db;
  const ws = await seedWorkspaceWithOwner(db, {
    userName: `Owner ${label}`,
    email: `owner-${label}@example.test`,
    workspaceName: `WS ${label}`,
  });
  const tier = await db.licenseTier.findUniqueOrThrow({ where: { code: "MINI_RIDER" } });
  const license = await db.license.create({
    data: { workspaceId: ws.workspaceId, tierId: tier.id, status: "PURCHASED" },
  });
  return { workspaceId: ws.workspaceId, ownerId: ws.userId, tierId: tier.id, licenseId: license.id };
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

async function auditEvents(action: string, targetId?: string) {
  return testDb.db.auditEvent.findMany({
    where: { category: AuditCategory.LICENSE, action, ...(targetId ? { targetId } : {}) },
    orderBy: { occurredAt: "asc" },
  });
}

describe("ACTIVATE — otorisasi, audit, invariant tepat satu ACTIVE", () => {
  it("owner USER tanpa permission eksplisit DITOLAK (fallback dihapus — remediasi PR #4); aktor internal SYSTEM mengaktifkan lisensi; audit sesuai aktor", async () => {
    const seed = await seedWorkspaceWithLicense("activate");

    // 1) REMEDIASI PR #4: owner (membership ACTIVE + role owner + sesi VALID)
    //    TIDAK lagi diizinkan oleh fallback — tidak ada preset yang memegang
    //    permission lifecycle (katalog = OD-122 OPEN) → default deny.
    const deniedOwner = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: userActor(seed.ownerId),
      now: NOW,
    });
    expect(deniedOwner.outcome).toBe("DENIED");
    if (deniedOwner.outcome === "DENIED") {
      expect(deniedOwner.reasonCode).toBe("DENY_PERMISSION_MISSING");
      expect(deniedOwner.viaOwnerFallback).toBe(false);
    }
    const ownerDenials = await auditEvents("license.lifecycle.activate.denied", seed.licenseId);
    expect(ownerDenials).toHaveLength(1);
    expect(ownerDenials[0].reasonCode).toBe("DENY_PERMISSION_MISSING");
    expect(ownerDenials[0].metadataJson).toContain('"actorType":"USER"');
    expect(JSON.parse(ownerDenials[0].metadataJson ?? "{}").viaOwnerFallback).toBeNull();

    // 2) Coverage mesin status lewat aktor SYSTEM (pemanggil internal
    //    tepercaya — jalur internal yang sah, bukan jalur USER).
    const result = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
    });
    expect(result.outcome).toBe("SUCCESS");
    if (result.outcome !== "SUCCESS") return;
    expect(result.from).toBe("PURCHASED");
    expect(result.to).toBe("ACTIVE");
    expect(result.idempotent).toBe(false);
    expect(result.viaOwnerFallback).toBe(false); // fallback dihapus — selalu false
    expect(result.entitlementEffect).toBe("ENTITLEMENT_GRANTED");

    const events = await auditEvents("license.lifecycle.activate.success", seed.licenseId);
    expect(events).toHaveLength(1);
    expect(events[0].outcome).toBe("SUCCESS");
    expect(events[0].actorUserId).toBeNull(); // SYSTEM: tanpa actorUserId
    expect(events[0].metadataJson).toContain('"actorType":"SYSTEM"');
    expect(events[0].metadataJson).not.toContain("PROPOSED");

    const state = await resolveWorkspaceLicenseState(testDb.db, seed.workspaceId);
    expect(state.activeLicenseCount).toBe(1);
    expect(state.entitlementSourceActive).toBe(true);
  });

  it("retry ACTIVATE identik = idempotent no-op (bukan error, bukan efek ganda)", async () => {
    const seed = await seedWorkspaceWithLicense("activate-retry");
    await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
    });
    const retry = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
    });
    expect(retry.outcome).toBe("SUCCESS");
    if (retry.outcome !== "SUCCESS") return;
    expect(retry.idempotent).toBe(true);
    const licenses = await testDb.db.license.findMany({ where: { workspaceId: seed.workspaceId } });
    expect(licenses).toHaveLength(1);
    const events = await auditEvents("license.lifecycle.activate.success", seed.licenseId);
    expect(events).toHaveLength(2); // asli + idempotent replay (keduanya teraudit)
    expect(events[1].metadataJson).toContain('"idempotent":"true"');
  });

  it("member tanpa permission DITOLAK dan denial teraudit (rantai lolos, permission tidak ada)", async () => {
    const seed = await seedWorkspaceWithLicense("activate-member");
    const member = await seedMember(testDb.db, {
      email: "member-activate-member@example.test",
      name: "Member",
      workspaceId: seed.workspaceId,
    });
    const result = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: userActor(member.userId),
      now: NOW,
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome !== "DENIED") return;
    expect(result.reasonCode).toBe("DENY_PERMISSION_MISSING");
    const status = await testDb.db.license.findUniqueOrThrow({ where: { id: seed.licenseId } });
    expect(status.status).toBe("PURCHASED");
    const denied = await auditEvents("license.lifecycle.activate.denied", seed.licenseId);
    expect(denied).toHaveLength(1);
    expect(denied[0].outcome).toBe("DENIED");
    expect(denied[0].reasonCode).toBe("DENY_PERMISSION_MISSING");
  });

  it("non-member DITOLAK (DENY_NOT_MEMBER) — isolasi tenant tidak dapat dilewati", async () => {
    const seed = await seedWorkspaceWithLicense("activate-outsider");
    const outsider = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Outsider",
      email: "outsider-activate@example.test",
      workspaceName: "WS lain",
    });
    const result = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: userActor(outsider.userId), // owner di workspace LAIN — bukan member sini
      now: NOW,
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome !== "DENIED") return;
    expect(result.reasonCode).toBe("DENY_NOT_MEMBER");
  });

  it("aktor USER tanpa identitas (userId kosong) DITOLAK — tidak pernah ter-resolve ke member mana pun", async () => {
    const seed = await seedWorkspaceWithLicense("activate-anon");
    const result = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: { type: "USER", userId: "", session: "VALID" } as never,
      now: NOW,
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") {
      expect(result.reasonCode).toBe("DENY_NOT_MEMBER");
    }
    const status = await testDb.db.license.findUniqueOrThrow({ where: { id: seed.licenseId } });
    expect(status.status).toBe("PURCHASED");
  });

  it("sesi tidak sah (REVOKED/EXPIRED/ABSENT) DITOLAK — tidak pernah diizinkan jalur mana pun", async () => {
    const seed = await seedWorkspaceWithLicense("activate-session");
    for (const session of ["REVOKED", "EXPIRED", "ABSENT"] as const) {
      const result = await applyLicenseLifecycleTransition(testDb.db, {
        licenseId: seed.licenseId,
        action: LicenseLifecycleAction.ACTIVATE,
        actor: { type: "USER", userId: seed.ownerId, session },
        now: NOW,
      });
      expect(result.outcome).toBe("DENIED");
      if (result.outcome === "DENIED") {
        expect(["DENY_SESSION_REVOKED", "DENY_SESSION_EXPIRED", "DENY_NO_SESSION"]).toContain(result.reasonCode);
      }
    }
    const status = await testDb.db.license.findUniqueOrThrow({ where: { id: seed.licenseId } });
    expect(status.status).toBe("PURCHASED");
  });

  it("membership SUSPENDED DITOLAK (DENY_MEMBERSHIP_SUSPENDED)", async () => {
    const seed = await seedWorkspaceWithLicense("activate-susp");
    const member = await seedMember(testDb.db, {
      email: "susp-owner@example.test",
      name: "Suspended Owner",
      workspaceId: seed.workspaceId,
      roleKey: "owner",
    });
    await testDb.db.membership.updateMany({
      where: { workspaceId: seed.workspaceId, userId: member.userId },
      data: { status: "SUSPENDED" },
    });
    const result = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: userActor(member.userId),
      now: NOW,
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") expect(result.reasonCode).toBe("DENY_MEMBERSHIP_SUSPENDED");
  });

  it("dua lisensi pada satu workspace: tepat satu ACTIVE (service) + partial unique index DB", async () => {
    const seed = await seedWorkspaceWithLicense("two-active");
    const second = await testDb.db.license.create({
      data: { workspaceId: seed.workspaceId, tierId: seed.tierId, status: "PURCHASED" },
    });
    const first = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
    });
    expect(first.outcome).toBe("SUCCESS");
    const secondResult = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: second.id,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
    });
    expect(secondResult.outcome).toBe("DENIED");
    if (secondResult.outcome === "DENIED") {
      expect(secondResult.reasonCode).toBe(LicenseLifecycleReasonCode.DENY_LICENSE_ACTIVE_EXISTS);
    }
    // Backstop DB: tulis langsung dua ACTIVE → partial unique index menolak (P2002).
    let dbError: unknown = null;
    try {
      await testDb.db.license.create({
        data: { workspaceId: seed.workspaceId, tierId: seed.tierId, status: "ACTIVE" },
      });
    } catch (error) {
      dbError = error;
    }
    expect(dbError).not.toBeNull();
    expect(String((dbError as { code?: string }).code)).toBe("P2002");
    // Slot ACTIVE bebas setelah lisensi pertama tidak lagi ACTIVE.
    await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.TERM_END,
      actor: systemActor(),
      now: NOW,
    });
    const reActivate = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: second.id,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
    });
    expect(reActivate.outcome).toBe("SUCCESS");
  });
});

describe("alur penuh TERM_END → RENEW → GRACE → EXPIRED (verify-only; OD-108 OPEN)", () => {
  it("TERM_END: termEndsAt tersimpan di masa depan DITOLAK; lewat → RENEWAL_DUE; tanpa termEndsAt → aksi eksplisit sah", async () => {
    const seeded = await seedWorkspaceWithLicense("term-end");
    await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seeded.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
      term: { termStartsAt: PAST, termEndsAt: FUTURE, renewalWindowStartsAt: FUTURE },
    });
    const tooEarly = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seeded.licenseId,
      action: LicenseLifecycleAction.TERM_END,
      actor: systemActor(),
      now: NOW, // termEndsAt = FUTURE > now → verify-only menolak
    });
    expect(tooEarly.outcome).toBe("DENIED");
    if (tooEarly.outcome === "DENIED") {
      expect(tooEarly.reasonCode).toBe(LicenseLifecycleReasonCode.DENY_TERM_NOT_ENDED);
    }
    const ended = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seeded.licenseId,
      action: LicenseLifecycleAction.TERM_END,
      actor: systemActor(),
      now: new Date("2026-12-02T00:00:00.000Z"), // >= termEndsAt tersimpan
      term: { renewalWindowStartsAt: FUTURE },
    });
    expect(ended.outcome).toBe("SUCCESS");
    if (ended.outcome === "SUCCESS") expect(ended.to).toBe("RENEWAL_DUE");
    const row = await testDb.db.license.findUniqueOrThrow({ where: { id: seeded.licenseId } });
    expect(row.renewalWindowStartsAt).toEqual(FUTURE); // data disuplai — bukan dihitung

    // Lisensi TANPA termEndsAt: tidak ada batas tersimpan → aksi eksplisit
    // administrator sah (verify-only; modul tidak pernah menghitung durasi).
    const noTerm = await seedWorkspaceWithLicense("term-end-noterm");
    await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: noTerm.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
    });
    const explicitEnd = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: noTerm.licenseId,
      action: LicenseLifecycleAction.TERM_END,
      actor: systemActor(),
      now: NOW,
    });
    expect(explicitEnd.outcome).toBe("SUCCESS");
  });

  it("RENEW dari RENEWAL_DUE memakai termEndsAt yang DISUPLAI; replay identik no-op; data berbeda ditolak", async () => {
    const seed = await seedWorkspaceWithLicense("renew");
    await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
    });
    await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.TERM_END,
      actor: systemActor(),
      now: NOW,
    });
    const newTermEnd = new Date("2027-11-01T00:00:00.000Z");
    const renewed = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.RENEW,
      actor: systemActor(),
      now: NOW,
      term: { termEndsAt: newTermEnd },
    });
    expect(renewed.outcome).toBe("SUCCESS");
    expect(renewed.outcome === "SUCCESS" && renewed.entitlementEffect).toBe("ENTITLEMENT_GRANTED");
    const row = await testDb.db.license.findUniqueOrThrow({ where: { id: seed.licenseId } });
    expect(row.status).toBe("ACTIVE");
    expect(row.termEndsAt).toEqual(newTermEnd); // disuplai, bukan dihitung

    const replay = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.RENEW,
      actor: systemActor(),
      now: NOW,
      term: { termEndsAt: newTermEnd },
    });
    expect(replay.outcome).toBe("SUCCESS");
    expect(replay.outcome === "SUCCESS" && replay.idempotent).toBe(true);

    const conflicting = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.RENEW,
      actor: systemActor(),
      now: NOW,
      term: { termEndsAt: new Date("2028-01-01T00:00:00.000Z") },
    });
    expect(conflicting.outcome).toBe("DENIED");
    if (conflicting.outcome === "DENIED") {
      expect(conflicting.reasonCode).toBe(LicenseLifecycleReasonCode.DENY_LIFECYCLE_INVALID_TRANSITION);
    }
  });

  it("GRACE_ENTER → RENEW_IN_GRACE memulihkan ACTIVE; GRACE_END → EXPIRED terminal (EXPIRED → ACTIVE ditolak)", async () => {
    const seed = await seedWorkspaceWithLicense("grace");
    await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
    });
    await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.TERM_END,
      actor: systemActor(),
      now: NOW,
    });
    const grace = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.GRACE_ENTER,
      actor: systemActor(),
      now: NOW,
      graceEndsAt: FUTURE, // disimpan apa adanya — durasi = OD-108 OPEN
    });
    expect(grace.outcome).toBe("SUCCESS");
    if (grace.outcome === "SUCCESS") expect(grace.entitlementEffect).toBe("ENTITLEMENT_NOT_GRANTED");

    const row = await testDb.db.license.findUniqueOrThrow({ where: { id: seed.licenseId } });
    expect(row.status).toBe("GRACE");
    expect(row.graceEndsAt).toEqual(FUTURE);

    // GRACE_END sebelum batas tersimpan → ditolak (verify-only).
    const earlyEnd = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.GRACE_END,
      actor: systemActor(),
      now: NOW,
    });
    expect(earlyEnd.outcome).toBe("DENIED");

    // Pemulihan dari grace.
    const recovered = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.RENEW_IN_GRACE,
      actor: systemActor(),
      now: NOW,
      term: { termEndsAt: new Date("2027-06-01T00:00:00.000Z") },
    });
    expect(recovered.outcome).toBe("SUCCESS");
    const recoveredRow = await testDb.db.license.findUniqueOrThrow({
      where: { id: seed.licenseId },
    });
    expect(recoveredRow.status).toBe("ACTIVE");
    expect(recoveredRow.graceEndsAt).toBeNull(); // penanda grace tertutup renewal

    // Jalur expiry penuh pada lisensi kedua.
    const seed2 = await seedWorkspaceWithLicense("grace-expire");
    await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed2.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
    });
    await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed2.licenseId,
      action: LicenseLifecycleAction.TERM_END,
      actor: systemActor(),
      now: NOW,
    });
    await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed2.licenseId,
      action: LicenseLifecycleAction.GRACE_ENTER,
      actor: systemActor(),
      now: NOW,
    });
    const expired = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed2.licenseId,
      action: LicenseLifecycleAction.GRACE_END,
      actor: systemActor(),
      now: NOW,
    });
    expect(expired.outcome).toBe("SUCCESS");
    for (const action of [
      LicenseLifecycleAction.ACTIVATE,
      LicenseLifecycleAction.RENEW,
      LicenseLifecycleAction.REACTIVATE,
      LicenseLifecycleAction.RENEW_IN_GRACE,
    ] as const) {
      const denied = await applyLicenseLifecycleTransition(testDb.db, {
        licenseId: seed2.licenseId,
        action,
        actor: systemActor(),
        now: NOW,
      });
      expect(denied.outcome).toBe("DENIED"); // EXPIRED terminal — tidak ada jalur langsung ke ACTIVE
    }
  });
});

describe("DOWNGRADE / REACTIVATE — REQ-099 data preservation", () => {
  it("DOWNGRADE dari ACTIVE: status berubah, tierId & data tetap; akses mengikuti status (engine 5-C)", async () => {
    const seed = await seedWorkspaceWithLicense("downgrade");
    await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
      term: { termStartsAt: PAST, termEndsAt: FUTURE }, // data term disuplai
    });

    const before = {
      memberships: await testDb.db.membership.count({ where: { workspaceId: seed.workspaceId } }),
      audit: await testDb.db.auditEvent.count(),
    };

    const downgraded = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.DOWNGRADE,
      actor: systemActor(),
      now: NOW,
    });
    expect(downgraded.outcome).toBe("SUCCESS");
    if (downgraded.outcome === "SUCCESS") {
      expect(downgraded.entitlementEffect).toBe("ENTITLEMENT_NOT_GRANTED");
    }

    const row = await testDb.db.license.findUniqueOrThrow({ where: { id: seed.licenseId } });
    expect(row.status).toBe("DOWNGRADED");
    expect(row.tierId).toBe(seed.tierId); // tier TIDAK diubah (keputusan tier = owner)
    expect(row.termEndsAt).not.toBeNull();

    // Tidak ada data yang hilang (REQ-099: tidak ada kehilangan data diam-diam).
    expect(await testDb.db.membership.count({ where: { workspaceId: seed.workspaceId } })).toBe(
      before.memberships
    );
    expect(await testDb.db.license.count({ where: { workspaceId: seed.workspaceId } })).toBe(1);

    // Akses mengikuti status: capability core kini ditolak oleh state lisensi.
    const decision = await resolveWorkspaceCapabilityEntitlement(testDb.db, {
      workspaceId: seed.workspaceId,
      capabilityCode: "core_event_workspace",
    });
    expect(decision.decision).toBe("DENIED");
    expect(decision.reasonCode).toBe("DENY_LICENSE_STATE");

    // REACTIVATE memulihkan entitlement — data tetap utuh untuk upgrade kembali.
    const reactivated = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.REACTIVATE,
      actor: systemActor(),
      now: NOW,
    });
    expect(reactivated.outcome).toBe("SUCCESS");
    const restored = await resolveWorkspaceCapabilityEntitlement(testDb.db, {
      workspaceId: seed.workspaceId,
      capabilityCode: "core_event_workspace",
    });
    expect(restored.decision).toBe("ALLOWED");
  });

  it("PURCHASED → DOWNGRADED DITOLAK (ambiguitas owner belum diselesaikan)", async () => {
    const seed = await seedWorkspaceWithLicense("downgrade-purchased");
    const result = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.DOWNGRADE,
      actor: systemActor(),
      now: NOW,
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") {
      expect(result.reasonCode).toBe(LicenseLifecycleReasonCode.DENY_LIFECYCLE_INVALID_TRANSITION);
    }
    const row = await testDb.db.license.findUniqueOrThrow({ where: { id: seed.licenseId } });
    expect(row.status).toBe("PURCHASED");
  });
});

describe("konkurensi, audit, aktor sistem, surface", () => {
  it("dua transisi konkuren dari status sama: satu sukses, satu DENY_CONCURRENT_MODIFICATION", async () => {
    const seed = await seedWorkspaceWithLicense("race");
    await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
    });
    const results = await Promise.all([
      applyLicenseLifecycleTransition(testDb.db, {
        licenseId: seed.licenseId,
        action: LicenseLifecycleAction.TERM_END,
        actor: systemActor(),
        now: NOW,
      }),
      applyLicenseLifecycleTransition(testDb.db, {
        licenseId: seed.licenseId,
        action: LicenseLifecycleAction.DOWNGRADE,
        actor: systemActor(),
        now: NOW,
      }),
    ]);
    // Tepat satu pemenang; yang lain permukaan konflik/denial eksplisit —
    // TIDAK pernah silent last-write-wins (ADR-017).
    expect(results.filter((r) => r.outcome === "SUCCESS")).toHaveLength(1);
    expect(results.filter((r) => r.outcome === "DENIED")).toHaveLength(1);
    // Denial konkuren teraudit (tidak hilang diam-diam).
    const deniedCount =
      (await auditEvents("license.lifecycle.downgrade.denied", seed.licenseId)).length +
      (await auditEvents("license.lifecycle.term_end.denied", seed.licenseId)).length;
    expect(deniedCount).toBeGreaterThanOrEqual(1);
  }, 30_000);

  it("audit denial tetap tertulis ketika transisi ditolak — denial = first-class", async () => {
    const seed = await seedWorkspaceWithLicense("audit-denial");
    const member = await seedMember(testDb.db, {
      email: "audit-denial-member@example.test",
      name: "Member",
      workspaceId: seed.workspaceId,
    });
    await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: userActor(member.userId),
      now: NOW,
    });
    const events = await testDb.db.auditEvent.findMany({
      where: { category: AuditCategory.LICENSE, targetId: seed.licenseId },
    });
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events.every((e) => e.outcome === "DENIED")).toBe(true);
  });

  it("aktor SYSTEM (pemanggil internal tepercaya) diizinkan dan teraudit tanpa actorUserId", async () => {
    const seed = await seedWorkspaceWithLicense("system");
    const result = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: { type: "SYSTEM", note: "internal trusted caller" },
      now: NOW,
    });
    expect(result.outcome).toBe("SUCCESS");
    expect(result.outcome === "SUCCESS" && result.viaOwnerFallback).toBe(false);
    const events = await auditEvents("license.lifecycle.activate.success", seed.licenseId);
    expect(events).toHaveLength(1);
    expect(events[0].actorUserId).toBeNull();
    expect(events[0].metadataJson).toContain('"actorType":"SYSTEM"');
  });

  it("TIDAK ada surface HTTP untuk lifecycle 5-D — aktor SYSTEM tidak dapat disuplai client", () => {
    const apiRoot = path.join(__dirname, "../../src/app/api");
    expect(existsSync(path.join(apiRoot, "v1", "licensing"))).toBe(false);
    expect(existsSync(path.join(apiRoot, "v1", "licenses"))).toBe(false);
    expect(existsSync(path.join(apiRoot, "v1", "extensions"))).toBe(false);
  });

  it("lisensi tidak ditemukan → DENY_LICENSE_NOT_FOUND teraudit", async () => {
    const result = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: "does-not-exist",
      action: LicenseLifecycleAction.ACTIVATE,
      actor: { type: "SYSTEM" },
      now: NOW,
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") {
      expect(result.reasonCode).toBe(LicenseLifecycleReasonCode.DENY_LICENSE_NOT_FOUND);
    }
  });
});

describe("otorisasi eksplisit — fallback owner DIHAPUS (remediasi PR #4)", () => {
  it("owner USER (ACTIVE + sesi VALID) ditolak DENY_PERMISSION_MISSING pada aksi keyless DAN aksi berkunci kanonik", async () => {
    const seed = await seedWorkspaceWithLicense("remed-owner-deny");
    // Aksi TANPA key kanonik (ACTIVATE): rantai lolos → default deny.
    const keyless = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: userActor(seed.ownerId),
      now: NOW,
    });
    expect(keyless.outcome).toBe("DENIED");
    if (keyless.outcome === "DENIED") {
      expect(keyless.reasonCode).toBe("DENY_PERMISSION_MISSING");
      expect(keyless.viaOwnerFallback).toBe(false);
    }
    // Aksi DENGAN key kanonik (RENEW = license.renew.initiate): policy Phase 4
    // penuh — TIDAK ada preset role yang memegang key (grant menunggu
    // ratifikasi owner, OD-122 OPEN) → DENY_PERMISSION_MISSING tanpa fallback.
    // (Otorisasi dievaluasi SEBELUM matriks transisi, jadi status tidak perlu
    // disiapkan untuk membuktikan denial otorisasi.)
    const keyed = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.RENEW,
      actor: userActor(seed.ownerId),
      now: NOW,
      term: { termStartsAt: PAST, termEndsAt: FUTURE },
    });
    expect(keyed.outcome).toBe("DENIED");
    if (keyed.outcome === "DENIED") {
      expect(keyed.reasonCode).toBe("DENY_PERMISSION_MISSING");
      expect(keyed.viaOwnerFallback).toBe(false);
    }
    // Denial owner = first-class (teraudit, tanpa allow silent).
    const allEvents = await testDb.db.auditEvent.findMany({
      where: { category: AuditCategory.LICENSE, targetId: seed.licenseId },
    });
    expect(allEvents.length).toBe(2); // tepat dua denial — tidak ada allow silent
    expect(allEvents.every((e) => e.outcome === "DENIED")).toBe(true);
  });

  it("owner USER tidak dapat melakukan GRACE_ENTER/GRACE_END/DOWNGRADE/REACTIVATE tanpa permission (semua aksi tanpa mapping = default deny)", async () => {
    const seed = await seedWorkspaceWithLicense("remed-keyless-matrix");
    for (const action of [
      LicenseLifecycleAction.GRACE_ENTER,
      LicenseLifecycleAction.GRACE_END,
      LicenseLifecycleAction.DOWNGRADE,
      LicenseLifecycleAction.REACTIVATE,
    ] as const) {
      const result = await applyLicenseLifecycleTransition(testDb.db, {
        licenseId: seed.licenseId,
        action,
        actor: userActor(seed.ownerId),
        now: NOW,
      });
      expect(result.outcome).toBe("DENIED");
      if (result.outcome === "DENIED") {
        expect(result.reasonCode).toBe("DENY_PERMISSION_MISSING");
      }
    }
    const row = await testDb.db.license.findUniqueOrThrow({ where: { id: seed.licenseId } });
    expect(row.status).toBe("PURCHASED"); // tidak ada perubahan status diam-diam
  });

  it("member USER tetap ditolak pada aksi berkunci kanonik (RENEW) — deny-by-default REQ-026", async () => {
    const seed = await seedWorkspaceWithLicense("remed-member-renew");
    const member = await seedMember(testDb.db, {
      email: "member-renew@example.test",
      name: "Member Renew",
      workspaceId: seed.workspaceId,
    });
    await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
    });
    const result = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.RENEW,
      actor: userActor(member.userId),
      now: NOW,
      term: { termStartsAt: PAST, termEndsAt: FUTURE },
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") {
      expect(result.reasonCode).toBe("DENY_PERMISSION_MISSING");
    }
  });

  it("non-member USER ditolak pada aksi berkunci kanonik (tenant isolation tidak terlewati policy)", async () => {
    const seed = await seedWorkspaceWithLicense("remed-outsider-renew");
    const outsider = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Outsider Renew",
      email: "outsider-renew@example.test",
      workspaceName: "WS outsider renew",
    });
    const result = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.RENEW,
      actor: userActor(outsider.userId),
      now: NOW,
      term: { termStartsAt: PAST, termEndsAt: FUTURE },
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") {
      expect(result.reasonCode).toBe("DENY_NOT_MEMBER");
    }
  });

  it("sesi EXPIRED ditolak dengan reason code kanonik (actor USER owner, prasyarat sesi dievaluasi lebih dulu)", async () => {
    const seed = await seedWorkspaceWithLicense("remed-expired-session");
    const result = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.RENEW,
      actor: { type: "USER", userId: seed.ownerId, session: "EXPIRED" },
      now: NOW,
      term: { termStartsAt: PAST, termEndsAt: FUTURE },
    });
    expect(result.outcome).toBe("DENIED");
    if (result.outcome === "DENIED") {
      expect(result.reasonCode).toBe("DENY_SESSION_EXPIRED");
    }
  });

  it("SYSTEM hanya dari pemanggil internal: hasil USER identical-deny vs SYSTEM allow membuktikan aktor bukan claim client", async () => {
    const seed = await seedWorkspaceWithLicense("remed-system-boundary");
    // USER (owner, sesi VALID) → deny.
    const asUser = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: userActor(seed.ownerId),
      now: NOW,
    });
    expect(asUser.outcome).toBe("DENIED");
    // SYSTEM (internal) → allow; TIDAK ada input HTTP yang membentuk SYSTEM
    // (tidak ada route 5-D — diuji test "TIDAK ada surface HTTP").
    const asSystem = await applyLicenseLifecycleTransition(testDb.db, {
      licenseId: seed.licenseId,
      action: LicenseLifecycleAction.ACTIVATE,
      actor: systemActor(),
      now: NOW,
    });
    expect(asSystem.outcome).toBe("SUCCESS");
  });
});
