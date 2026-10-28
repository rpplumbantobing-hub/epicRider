// Unit test i18n — epicRider (Phase 3).
// Cakupan: parity key id/en, fallback t(), formatter Intl, guard locale + getLocale (cookie).

import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultLocale, isLocale, LOCALE_COOKIE, locales } from "@/i18n/config";
import { formatCurrency, formatDate, formatNumber } from "@/i18n/format";
import { getLocale } from "@/i18n/server";
import { createTranslator, resolveDictionaryValue } from "@/i18n/translate";
import { dictionary as idDictionary } from "@/i18n/dictionaries/id";
import { en as enDictionary } from "@/i18n/dictionaries/en";
import { dictionaries } from "@/i18n/dictionaries";
import type { Dictionary } from "@/i18n/dictionaries/id";

// Kumpulkan seluruh path key daun (semua nilai dictionary adalah string).
function collectLeafKeys(node: unknown, prefix = ""): string[] {
  if (node === null || typeof node !== "object") {
    return [prefix];
  }
  return Object.entries(node).flatMap(([key, value]) =>
    collectLeafKeys(value, prefix === "" ? key : `${prefix}.${key}`)
  );
}

describe("i18n dictionaries — parity id vs en", () => {
  it("en memiliki set key yang persis sama dengan id (default source of shape)", () => {
    const idKeys = collectLeafKeys(idDictionary).sort();
    const enKeys = collectLeafKeys(enDictionary).sort();

    const missingInEn = idKeys.filter((key) => !enKeys.includes(key));
    const extraInEn = enKeys.filter((key) => !idKeys.includes(key));

    const diff = [
      missingInEn.length > 0 ? `Missing in en: ${missingInEn.join(", ")}` : null,
      extraInEn.length > 0 ? `Extra in en: ${extraInEn.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    expect(`${idKeys.length} vs ${enKeys.length} keys; ${diff || "key sets identical"}`).toBe(
      `${idKeys.length} vs ${idKeys.length} keys; key sets identical`
    );
    expect(missingInEn).toEqual([]);
    expect(extraInEn).toEqual([]);
  });

  it("registry `dictionaries` memuat semua locale terdaftar", () => {
    for (const locale of locales) {
      expect(dictionaries[locale]).toBeDefined();
    }
    expect(Object.keys(dictionaries).sort()).toEqual([...locales].sort());
  });

  it("jumlah key per locale identik (angka parity sebagai bukti)", () => {
    expect(collectLeafKeys(enDictionary).length).toBe(collectLeafKeys(idDictionary).length);
  });
});

describe("createTranslator — fallback chain (ADR-020)", () => {
  // Salinan en yang SENGJAHA hilang satu key, untuk menguji fallback ke id.
  function enWithout(keyPath: string): Dictionary {
    const clone: unknown = structuredClone(enDictionary);
    const segments = keyPath.split(".");
    let node = clone as Record<string, unknown>;
    for (const segment of segments.slice(0, -1)) {
      node = node[segment] as Record<string, unknown>;
    }
    delete node[segments[segments.length - 1]];
    return clone as Dictionary;
  }

  it("key ada di locale aktif → nilai locale aktif", () => {
    const t = createTranslator(enDictionary, idDictionary, "en");
    expect(t("common.retry")).toBe("Retry");
  });

  it("key hilang di en → fallback ke nilai id", () => {
    const pruned = enWithout("common.retry");
    const t = createTranslator(pruned, idDictionary, "en");
    expect(t("common.retry")).toBe(idDictionary.common.retry);
  });

  it("key hilang di mana pun → mengembalikan key itu sendiri (tanpa error)", () => {
    const pruned = enWithout("common.retry");
    const t = createTranslator(pruned, pruned, "en");
    expect(t("common.retry")).toBe("common.retry");
  });

  it("key non-string / path tidak valid → dianggap hilang", () => {
    const t = createTranslator(idDictionary, idDictionary, "id");
    expect(t("common")).toBe("common");
    expect(t("common.nope.really")).toBe("common.nope.really");
  });

  it("resolveDictionaryValue menelusuri dot-path dengan benar", () => {
    expect(resolveDictionaryValue(idDictionary, "footer.phaseLabel")).toBe("Phase 3");
    expect(resolveDictionaryValue(idDictionary, "tidak.ada")).toBeUndefined();
  });

  it("key hilang → console.warn HANYA di development", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      vi.stubEnv("NODE_ENV", "development");
      const t = createTranslator(idDictionary, idDictionary, "id");
      t("gaada.key.ini");
      expect(warnSpy).toHaveBeenCalledTimes(1);

      warnSpy.mockClear();
      vi.stubEnv("NODE_ENV", "test");
      t("gaada.key.ini");
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllEnvs();
      warnSpy.mockRestore();
    }
  });
});

describe("format functions — Intl per locale", () => {
  // Tanggal tetap UTC agar hasil deterministik di mesin mana pun.
  const fixedDate = new Date(Date.UTC(2026, 9, 28));

  it("formatDate: id-ID memakai nama bulan Indonesia, en-US memakai English", () => {
    const idDate = formatDate(fixedDate, "id", { timeZone: "UTC" });
    const enDate = formatDate(fixedDate, "en", { timeZone: "UTC" });

    expect(idDate).toContain("Oktober");
    expect(idDate).toContain("2026");
    expect(enDate).toContain("October");
    expect(enDate).toContain("2026");
  });

  it("formatNumber: pemisah ribuan/desimal sesuai locale", () => {
    const idNumber = formatNumber(1234567.89, "id");
    const enNumber = formatNumber(1234567.89, "en");

    expect(idNumber).toContain("1.234.567");
    expect(idNumber).toContain(",89");
    expect(enNumber).toContain("1,234,567");
    expect(enNumber).toContain(".89");
  });

  it("formatCurrency: demo format saja — IDR untuk id, USD untuk en (OD-06)", () => {
    const idCurrency = formatCurrency(1500000, "id");
    const enCurrency = formatCurrency(1500000, "en");

    expect(idCurrency).toContain("Rp");
    expect(idCurrency).toContain("1.500.000");
    expect(enCurrency).toContain("$");
    expect(enCurrency).toContain("1,500,000");
  });
});

describe("locale guard & getLocale (server, cookie)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unmock("next/headers");
  });

  it("isLocale menerima hanya locale terdaftar", () => {
    expect(isLocale("id")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(42)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(defaultLocale).toBe("id");
  });

  it("getLocale membaca cookie yang valid", async () => {
    vi.doMock("next/headers", () => ({
      cookies: async () => ({
        get: (name: string) =>
          name === LOCALE_COOKIE ? { name, value: "en" } : undefined,
      }),
    }));
    vi.resetModules();
    const { getLocale: freshGetLocale } = await import("@/i18n/server");
    await expect(freshGetLocale()).resolves.toBe("en");
  });

  it("getLocale fallback ke defaultLocale untuk cookie tidak valid / tidak ada", async () => {
    vi.doMock("next/headers", () => ({
      cookies: async () => ({
        get: (name: string) =>
          name === LOCALE_COOKIE ? { name, value: "fr" } : undefined,
      }),
    }));
    vi.resetModules();
    const { getLocale: freshGetLocale } = await import("@/i18n/server");
    await expect(freshGetLocale()).resolves.toBe("id");

    vi.doMock("next/headers", () => ({
      cookies: async () => ({
        get: () => undefined,
      }),
    }));
    vi.resetModules();
    const { getLocale: fallbackGetLocale } = await import("@/i18n/server");
    await expect(fallbackGetLocale()).resolves.toBe("id");
  });
});
