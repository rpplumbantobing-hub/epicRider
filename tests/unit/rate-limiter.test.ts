// Unit test rate limiter — epicRider Phase 4 (REQ-054 anti-abuse).

import { afterEach, describe, expect, it } from "vitest";
import {
  __resetRateLimiterForTests,
  consumeRateLimit,
} from "@/lib/auth/rate-limiter";

afterEach(() => {
  __resetRateLimiterForTests();
});

describe("consumeRateLimit (sliding window)", () => {
  it("mengizinkan hingga batas, lalu menolak dengan retryAfter", () => {
    const windowSeconds = 60;
    for (let i = 0; i < 3; i++) {
      const r = consumeRateLimit("otp:target:+62812", 3, windowSeconds);
      expect(r.allowed).toBe(true);
    }
    const blocked = consumeRateLimit("otp:target:+62812", 3, windowSeconds);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(windowSeconds);
  });

  it("kunci berbeda tidak saling memengaruhi (per-target isolation)", () => {
    consumeRateLimit("otp:target:+62812", 1, 60);
    const other = consumeRateLimit("otp:target:+62813", 1, 60);
    expect(other.allowed).toBe(true);
    const same = consumeRateLimit("otp:target:+62812", 1, 60);
    expect(same.allowed).toBe(false);
  });

  it("remaining berkurang monotonic", () => {
    const first = consumeRateLimit("ip:1.2.3.4", 5, 60);
    expect(first.remaining).toBe(4);
    const second = consumeRateLimit("ip:1.2.3.4", 5, 60);
    expect(second.remaining).toBe(3);
  });
});
