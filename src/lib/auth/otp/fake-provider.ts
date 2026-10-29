// Test double OTP — epicRider Phase 4 (ADR-009; gated prompt §5.3).
//
// HANYA untuk environment test. Menangkap kode agar test dapat memverifikasi
// alur domain penuh (request → kirim → verifikasi) tanpa vendor nyata.
// TIDAK AKAN pernah terpasang di produksi (resolveOtpDeliveryProvider tidak
// merujuk file ini; test yang menginjeksi langsung).

import type { OtpDeliveryProvider } from "./provider";

export class FakeOtpDeliveryProvider implements OtpDeliveryProvider {
  readonly name = "fake-test-provider";
  /** Kode terakhir per target (untuk asersi test — bukan produksi). */
  readonly sentCodes = new Map<string, string>();
  sendHistory: Array<{ target: string; code: string }> = [];

  async send(target: string, code: string): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FakeOtpDeliveryProvider dilarang di produksi (OD-03).");
    }
    this.sentCodes.set(target, code);
    this.sendHistory.push({ target, code });
  }
}
