// Unit test utilitas OTP + UA — epicRider Phase 4 (REQ-021 domain murni).

import { describe, expect, it } from "vitest";
import {
  generateOtpCode,
  hashOtpCode,
  normalizePhone,
} from "@/lib/auth/otp/otp-service";
import { describeUserAgent } from "@/lib/auth/user-agent";

describe("OTP domain utilities (ADR-009)", () => {
  it("generateOtpCode: panjang sesuai konfigurasi, numerik", () => {
    const code = generateOtpCode(6);
    expect(code).toMatch(/^\d{6}$/);
    expect(generateOtpCode(4)).toMatch(/^\d{4}$/);
  });

  it("hashOtpCode: SHA-256 hex deterministik; berbeda antar kode", () => {
    const a = hashOtpCode("123456");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(hashOtpCode("123456")).toBe(a);
    expect(hashOtpCode("123457")).not.toBe(a);
  });

  it("hash TIDAK mengandung kode asli (one-way)", () => {
    const hash = hashOtpCode("999111");
    expect(hash.includes("999111")).toBe(false);
  });

  it("normalizePhone: menerima E.164; menolak format tidak valid", () => {
    expect(normalizePhone("+628123456789")).toBe("+628123456789");
    expect(normalizePhone("628123456789")).toBe("+628123456789");
    expect(normalizePhone("0812-3456-789")).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
    expect(normalizePhone("+6281234567890123456")).toBeNull(); // terlalu panjang
  });
});

describe("describeUserAgent (label perangkat REQ-048)", () => {
  it("mengenali Chrome/Android dan Safari/iOS", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36"
      )
    ).toBe("Chrome · Android");
    expect(
      describeUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      )
    ).toBe("Safari · iOS");
  });

  it("fallback Unknown untuk UA tak dikenal", () => {
    expect(describeUserAgent("bukan-user-agent")).toBe("Unknown browser · Unknown OS");
  });
});
