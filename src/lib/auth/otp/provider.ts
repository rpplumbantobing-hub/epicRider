// Abstraksi provider pengiriman OTP WhatsApp — epicRider Phase 4 (ADR-009).
//
// Kontrak MINIMUM vendor-netral: kirim kode ke nomor target. SEMUA logika
// domain (sekali pakai, expiry, anti-replay, rate limit, lockout, audit)
// dimiliki `otp-service` di sisi platform — provider HANYA mengirim.
//
// OD-03 OPEN: vendor/provider produksi BELUM dipilih. Tidak ada vendor yang
// dinamai, tidak ada kredensial dibuat, tidak ada klaim provider teruji.
// Integrasi point: implementasikan `OtpDeliveryProvider`, registrasikan di
// `resolveOtpDeliveryProvider()` — seluruh kontrol domain mewarisi otomatis.

export interface OtpDeliveryProvider {
  /** Nama pendek provider (untuk log konfigurasi, bukan secret). */
  readonly name: string;
  /** Mengirim kode OTP ke nomor target (E.164). */
  send(target: string, code: string): Promise<void>;
}

/**
 * Resolusi provider OTP. Produksi saat ini: TIDAK ADA provider terkonfigurasi
 * (OD-03 OPEN) → throw agar endpoint menolak dengan status aman
 * PROVIDER_NOT_CONFIGURED (bukan fake success).
 */
export function resolveOtpDeliveryProvider(): OtpDeliveryProvider {
  throw new Error(
    "PROVIDER_NOT_CONFIGURED: vendor WhatsApp belum dipilih (OD-03 OPEN) — bukti kontrol nomor tidak dapat dikirim."
  );
}
