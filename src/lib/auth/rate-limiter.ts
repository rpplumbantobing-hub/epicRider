// Rate limiter in-memory (sliding window) — epicRider Phase 4 (REQ-054).
//
// DESAIN + KETERBATASAN (jujur):
// - In-memory per-proses: cukup untuk sandbox/pengembangan dan single-instance
//   awal; penyebaran multi-instance membutuhkan penyimpanan bersama (keputusan
//   deployment — BUKAN keputusan Phase 4; dicatat sebagai residual risk).
// - Kunci disusun dari identitas stabil (mis. "otp:<target>" / "ip:<ip>").
// - Tidak menyimpan payload — hanya timestamp (tanpa data sensitif).

interface WindowState {
  hits: number[];
}

const globalForLimiter = globalThis as unknown as {
  __epicRiderRateLimiter?: Map<string, WindowState>;
};

const store: Map<string, WindowState> =
  globalForLimiter.__epicRiderRateLimiter ?? new Map();
globalForLimiter.__epicRiderRateLimiter = store;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/** Cek + catat satu percobaan pada kunci. */
export function consumeRateLimit(
  key: string,
  max: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const state = store.get(key) ?? { hits: [] };
  // Buang hit di luar jendela.
  state.hits = state.hits.filter((t) => now - t < windowMs);

  if (state.hits.length >= max) {
    const oldestInWindow = state.hits[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldestInWindow + windowMs - now) / 1000)
    );
    store.set(key, state);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  state.hits.push(now);
  store.set(key, state);
  // Pembersihan berkala ringan: buang state kosong yang stale (> 1 jam).
  if (store.size > 1000) {
    for (const [k, v] of store) {
      if (v.hits.length === 0 || now - v.hits[v.hits.length - 1] > 3_600_000) {
        store.delete(k);
      }
    }
  }
  return { allowed: true, remaining: max - state.hits.length, retryAfterSeconds: 0 };
}

/** Reset state kunci (untuk test). */
export function __resetRateLimiterForTests(): void {
  store.clear();
}
