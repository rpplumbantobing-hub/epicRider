// Helper sisi server untuk locale — epicRider (ADR-020).
// Membaca cookie preferensi bahasa; fallback ke defaultLocale tanpa error bila cookie tidak ada.

import { cookies } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";

/** Baca locale aktif dari cookie (server component). Next 16: `cookies()` bersifat async. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}
