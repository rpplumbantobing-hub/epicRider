// Konfigurasi keamanan terpusat — epicRider Phase 4.
//
// SEMUA nilai di bawah berstatus PROPOSED (bukan keputusan owner):
// - Parameter sesi              → OD-115 OPEN (gated prompt §5.4: default untuk
//   dev/test harus PROPOSED, terpusat, dan configurable).
// - Parameter OTP/anti-abuse    → REQ-021/REQ-054 (nilai numerik = proposal
//   engineering, menunggu keputusan owner).
// - Durasi kedaluwarsa undangan → gated prompt §6.2 (centralized configurable
//   proposal; bukan business rule yang disahkan).
// Nilai dapat dioverride via environment variable tanpa mengubah kode.

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;

export const securityConfig = {
  /** Sesi (REQ-048). Default PROPOSED — OD-115 OPEN. */
  session: {
    /** Umur maksimum sesi (detik). Default 7 hari. */
    maxAgeSeconds: intFromEnv("SESSION_MAX_AGE_SECONDS", 7 * SECONDS_PER_DAY),
  },
  /** OTP WhatsApp proof-of-control (REQ-021; ADR-009; vendor = OD-03 OPEN). */
  otp: {
    codeLength: 6,
    /** Umur kode OTP. PROPOSED 5 menit. */
    expirySeconds: 5 * SECONDS_PER_MINUTE,
    /** Percobaan verifikasi maksimum per request. PROPOSED. */
    maxAttempts: intFromEnv("OTP_MAX_ATTEMPTS", 5),
    /** Rate limit pengiriman per nomor: maksimum permintaan per jendela. PROPOSED. */
    resendPerTargetMax: 3,
    resendPerTargetWindowSeconds: SECONDS_PER_HOUR,
    /** Rate limit pengiriman per IP. PROPOSED. */
    requestPerIpMax: 10,
    requestPerIpWindowSeconds: 15 * SECONDS_PER_MINUTE,
    /** Lockout setelah percobaan gagal melebihi batas. PROPOSED. */
    lockoutSeconds: 15 * SECONDS_PER_MINUTE,
  },
  /** Undangan workspace (REQ-051; durasi = PROPOSED, bukan business rule final). */
  invitation: {
    expiryDays: intFromEnv("INVITATION_EXPIRY_DAYS", 7),
    /** Entropi token undangan (byte acak sebelum dihash). */
    tokenBytes: 32,
  },
  /** Rate limit umum endpoint sensitif (REQ-054). */
  rateLimit: {
    /** Pembuatan undangan per aktor. PROPOSED. */
    invitationCreatePerActorMax: 20,
    invitationCreateWindowSeconds: 60 * 60,
  },
} as const;

export type SecurityConfig = typeof securityConfig;
