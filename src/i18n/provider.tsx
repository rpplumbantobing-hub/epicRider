"use client";

// I18nProvider — epicRider (ADR-020).
// Context client-side: locale aktif (state, diinisialisasi dari prop hasil render server),
// fungsi `t` dengan fallback chain, formatter Intl per locale, dan `setLocale`
// (tulis cookie + state lokal + `router.refresh()` agar server-rendered parts ikut sinkron).

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { dictionaries } from "./dictionaries";
import type { Dictionary } from "./dictionaries/id";
import { formatCurrency, formatDate, formatNumber } from "./format";
import { createTranslator, type TFunction } from "./translate";

export type I18nContextValue = {
  /** Locale aktif saat ini (bisa berubah via setLocale sebelum refresh server selesai). */
  locale: Locale;
  /** Terjemahkan dot-path dengan fallback: locale aktif → defaultLocale → key itu sendiri. */
  t: TFunction;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number) => string;
  formatCurrency: (value: number) => string;
  /** Simpan preferensi ke cookie (1 tahun, SameSite=Lax) lalu refresh render server. */
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale: initialLocale,
  dictionary: initialDictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback(
    (next: Locale) => {
      if (!isLocale(next)) {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[i18n] Locale "${String(next)}" tidak dikenal — diabaikan.`);
        }
        return;
      }
      // Cookie dibaca server saat render berikutnya (path=/, max-age 1 tahun, SameSite=Lax).
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
      // State lokal membuat UI langsung merespons; router.refresh() menyinkronkan server.
      setLocaleState(next);
      router.refresh();
    },
    [router]
  );

  const value = useMemo<I18nContextValue>(() => {
    const activeDictionary = dictionaries[locale] ?? initialDictionary;
    const t = createTranslator(activeDictionary, dictionaries[defaultLocale], locale);
    return {
      locale,
      t,
      formatDate: (date, options) => formatDate(date, locale, options),
      formatNumber: (num) => formatNumber(num, locale),
      formatCurrency: (num) => formatCurrency(num, locale),
      setLocale,
    };
  }, [locale, initialDictionary, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Hook akses i18n. Wajib dipakai di dalam I18nProvider. */
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n harus dipakai di dalam I18nProvider.");
  }
  return context;
}
