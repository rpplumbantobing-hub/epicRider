// Konfigurasi locale — epicRider (ADR-020).
// Bahasa Indonesia adalah locale default (MC §4 "i18n sejak awal", REQ-028).

export const locales = ["id", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "id";

/** Nama cookie yang menyimpan preferensi bahasa (path=/, max-age 1 tahun, SameSite=Lax). */
export const LOCALE_COOKIE = "epicrider_locale";

/** Type guard: true hanya bila `value` salah satu dari `locales`. */
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
