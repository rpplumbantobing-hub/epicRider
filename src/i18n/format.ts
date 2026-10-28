// Utilitas format per locale — epicRider (ADR-020).
// Semua fungsi murni memakai `Intl.*` agar hasilnya konsisten antara server dan klien.
//
// CATATAN OD-06: pemilihan mata uang (IDR untuk locale "id", USD untuk "en") adalah
// DEMO FORMAT SAJA — bukan keputusan komersial, bukan klaim harga, dan bukan data nyata.

import type { Locale } from "./config";

/** Locale BCP-47 untuk Intl berdasarkan Locale aplikasi. */
export function intlLocale(locale: Locale): string {
  return locale === "id" ? "id-ID" : "en-US";
}

/**
 * Format tanggal per locale.
 * `options` opsional untuk kasus khusus (mis. demo memakai `timeZone: "UTC"` agar
 * render server dan klien identik).
 */
export function formatDate(
  date: Date,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "long", ...options }).format(
    date
  );
}

/** Format angka per locale (pemisah ribuan/desimal mengikuti locale). */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 2 }).format(value);
}

/** Format mata uang per locale — DEMO FORMAT SAJA (lihat catatan OD-06 di atas). */
export function formatCurrency(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: locale === "id" ? "IDR" : "USD",
  }).format(value);
}
