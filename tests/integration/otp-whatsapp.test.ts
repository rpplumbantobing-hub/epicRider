// @vitest-environment node
// Integration test OTP WhatsApp proof-of-control — epicRider Phase 4
// (REQ-021; ADR-009; vendor = OD-03 OPEN → test double).
// Membuktikan: hash-only storage, sekali pakai, expiry, attempt/lockout,
// rate limit, audit tanpa kode.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDatabase, resetDb, type TestDatabase } from "./test-db";
import { requestOtp, verifyOtp } from "@/lib/auth/otp/otp-service";
import { FakeOtpDeliveryProvider } from "@/lib/auth/otp/fake-provider";
import { __resetRateLimiterForTests } from "@/lib/auth/rate-limiter";

let testDb: TestDatabase;
const provider = new FakeOtpDeliveryProvider();

beforeAll(async () => {
  testDb = await createTestDatabase();
  await resetDb(testDb.db);
  __resetRateLimiterForTests();
}, 120_000);

afterAll(async () => {
  await testDb.destroy();
});

const TARGET = "+628123456789";

describe("requestOtp (REQ-021)", () => {
  it("membuat challenge PENDING dengan HASH kode (kode tidak pernah disimpan)", async () => {
    const result = await requestOtp(testDb.db, { target: TARGET, ip: "10.0.0.1" }, provider);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const row = await testDb.db.verificationRequest.findUniqueOrThrow({
      where: { id: result.requestId },
    });
    expect(row.status).toBe("PENDING");
    expect(row.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    // Kode dari provider TIDAK sama dengan hash, dan tidak tersimpan mentah.
    const code = provider.sentCodes.get(TARGET)!;
    expect(code).toMatch(/^\d{6}$/);
    expect(row.tokenHash).not.toBe(code);
    expect(JSON.stringify(row)).not.toContain(code);
  });

  it("nomor tidak valid ditolak", async () => {
    const result = await requestOtp(testDb.db, { target: "123" }, provider);
    expect(result.ok).toBe(false);
  });

  it("rate limit per target: melebihi jendela → DENY_RATE_LIMITED (anti-flooding)", async () => {
    __resetRateLimiterForTests();
    const otherTarget = "+628999000001";
    // Batas default: 3 per jam per target.
    for (let i = 0; i < 3; i++) {
      const r = await requestOtp(testDb.db, { target: otherTarget, ip: "10.0.0.2" }, provider);
      expect(r.ok).toBe(true);
    }
    const blocked = await requestOtp(testDb.db, { target: otherTarget, ip: "10.0.0.2" }, provider);
    expect(blocked).toMatchObject({ ok: false, reasonCode: "DENY_RATE_LIMITED" });
  });
});

describe("verifyOtp (REQ-021/REQ-054)", () => {
  it("kode benar → CONSUMED (sekali pakai)", async () => {
    __resetRateLimiterForTests();
    const t = "+628777000001";
    await requestOtp(testDb.db, { target: t }, provider);
    const code = provider.sentCodes.get(t)!;
    const ok = await verifyOtp(testDb.db, { target: t, code });
    expect(ok).toMatchObject({ ok: true, target: t });

    const row = await testDb.db.verificationRequest.findFirstOrThrow({
      where: { target: t },
      orderBy: { createdAt: "desc" },
    });
    expect(row.status).toBe("CONSUMED");
    expect(row.usedAt).not.toBeNull();
  });

  it("REPLAY: kode yang sama dipakai ulang → DENY_REPLAY / invalid", async () => {
    __resetRateLimiterForTests();
    const t = "+628777000002";
    await requestOtp(testDb.db, { target: t }, provider);
    const code = provider.sentCodes.get(t)!;
    await verifyOtp(testDb.db, { target: t, code });
    const replay = await verifyOtp(testDb.db, { target: t, code });
    // Challenge sudah CONSUMED → tidak ada PENDING → ditolak.
    expect(replay.ok).toBe(false);
  });

  it("kode salah 5× → BLOCKED + lockout (attempt abuse)", async () => {
    __resetRateLimiterForTests();
    const t = "+628777000003";
    await requestOtp(testDb.db, { target: t }, provider);
    const correct = provider.sentCodes.get(t)!;
    // Salah 4 kali masih PENDING (belum lockout).
    for (let i = 0; i < 4; i++) {
      const wrong = await verifyOtp(testDb.db, { target: t, code: "000000" === correct ? "111111" : "000000" });
      expect(wrong.ok).toBe(false);
    }
    // Percobaan ke-5 salah → BLOCKED.
    const fifth = await verifyOtp(testDb.db, { target: t, code: "000000" === correct ? "111111" : "000000" });
    expect(fifth).toMatchObject({ ok: false, reasonCode: "DENY_RATE_LIMITED" });

    const row = await testDb.db.verificationRequest.findFirstOrThrow({
      where: { target: t },
      orderBy: { createdAt: "desc" },
    });
    expect(row.status).toBe("BLOCKED");
    expect(row.blockedUntil).not.toBeNull();

    // Kode BENAR setelah lockout tetap ditolak.
    const locked = await verifyOtp(testDb.db, { target: t, code: correct });
    expect(locked.ok).toBe(false);
  });

  it("EXPIRED: challenge kedaluwarsa → status EXPIRED, verifikasi gagal", async () => {
    __resetRateLimiterForTests();
    const t = "+628777000004";
    const created = await requestOtp(testDb.db, { target: t }, provider);
    if (!created.ok) throw new Error("setup gagal");
    await testDb.db.verificationRequest.update({
      where: { id: created.requestId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const code = provider.sentCodes.get(t)!;
    const result = await verifyOtp(testDb.db, { target: t, code });
    expect(result).toMatchObject({ ok: false, reasonCode: "DENY_INVALID_INVITE" });
    const row = await testDb.db.verificationRequest.findUniqueOrThrow({
      where: { id: created.requestId },
    });
    expect(row.status).toBe("EXPIRED");
  });

  it("audit tercatat TANPA kode OTP di metadata/payload", async () => {
    __resetRateLimiterForTests();
    const t = "+628777000005";
    await requestOtp(testDb.db, { target: t }, provider);
    const code = provider.sentCodes.get(t)!;
    await verifyOtp(testDb.db, { target: t, code });

    const audits = await testDb.db.auditEvent.findMany({
      where: { targetType: "VerificationRequest" },
    });
    expect(audits.length).toBeGreaterThan(0);
    for (const event of audits) {
      expect(event.metadataJson ?? "").not.toContain(code);
      // Kunci metadata yang muncul tidak boleh menyimpan kode.
      const metadata = JSON.parse(event.metadataJson ?? "{}");
      for (const key of Object.keys(metadata)) {
        expect(/otp|code|token/i.test(key)).toBe(false);
      }
    }
  });
});
