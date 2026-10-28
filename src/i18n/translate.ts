// Resolusi key dictionary — epicRider (ADR-020).
// Fungsi murni (tanpa React / next) agar fallback `t()` mudah di-unit-test.

import { defaultLocale, type Locale } from "./config";
import type { Dictionary } from "./dictionaries/id";

export type TFunction = (path: string) => string;

/**
 * Telusuri dot-path (mis. "common.retry") di dalam dictionary.
 * Mengembalikan undefined bila path tidak menunjuk ke sebuah string.
 */
export function resolveDictionaryValue(dictionary: Dictionary, path: string): string | undefined {
  let current: unknown = dictionary;
  for (const segment of path.split(".")) {
    if (current === null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === "string" ? current : undefined;
}

/**
 * Buat fungsi `t` dengan rantai fallback (ADR-020):
 * 1. dictionary locale aktif;
 * 2. dictionary defaultLocale (id);
 * 3. kembalikan key itu sendiri (tanpa unhandled error).
 * Key yang hilang hanya diberi `console.warn` di development.
 */
export function createTranslator(
  dictionary: Dictionary,
  fallbackDictionary: Dictionary = dictionary,
  locale?: Locale
): TFunction {
  return (path: string): string => {
    const value = resolveDictionaryValue(dictionary, path);
    if (value !== undefined) {
      return value;
    }
    const fallbackValue =
      fallbackDictionary === dictionary
        ? undefined
        : resolveDictionaryValue(fallbackDictionary, path);
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[i18n] Key "${path}" tidak ditemukan pada locale "${locale ?? "tidak diketahui"}" maupun fallback "${defaultLocale}".`
      );
    }
    return path;
  };
}
