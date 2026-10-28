# ADR-020 — Mekanisme i18n Phase 3: typed dictionary + context provider + cookie persistence

## Status

**ACCEPTED** (2026-10-28, Phase 3) — keputusan teknis fondasi; dapat disupersede oleh ADR baru bila kebutuhan routing-locale muncul (mis. SEO landing multi-bahasa di Phase 22).

## Context

- Kontrol: "i18n sejak awal" (MC §4); Bahasa Indonesia default, EN siap, penambahan bahasa tanpa ubah business logic (REQ-028; prompt Phase 3 §5.3).
- Constraint sandbox: satu route yang terlihat user = `/` — routing berbasis segment locale (`/[locale]/…` ala next-intl) tidak cocok untuk fondasi ini.
- `next-intl` 4.3.4 terpasang tetapi belum dipakai; message-nya berbasis string keys (untyped by default).

## Options

1. **next-intl dengan routing `[locale]`** — menambah route segment (melanggar constraint sandbox saat ini) dan konfigurasi middleware/plugin. **REJECTED untuk Phase 3** (dicatat sebagai opsi masa depan).
2. **next-intl tanpa routing (cookie-based)** — solid tapi konfigurasinya (plugin + request config + provider) memberi sedikit nilai tambah untuk 2 locale dan mengabstraksi fallback logic yang justru wajib dites.
3. **Typed dictionary + React context + cookie persistence + Intl formatting** — nol dependency baru, key type-safe, fallback logic eksplisit & unit-testable, cocok single-route. **ACCEPTED.**

## Decision

1. Struktur `src/i18n/`:
   - `config.ts` — locales `['id','en']`, `defaultLocale: 'id'`, cookie name, helper tipe `Locale`.
   - `dictionaries/id.ts`, `dictionaries/en.ts` — objek nested bertipe; `en` wajib memenuhi shape `id` (type-level parity, `satisfies Dictionary`).
   - `server.ts` — `getLocale()` server (baca cookie via `next/headers`, fallback defaultLocale; tanpa error jika cookie tidak ada).
   - `provider.tsx` — `I18nProvider` (client) + `useI18n()` → `t(key)` dengan fallback: key hilang di locale aktif → fallback `defaultLocale` → terakhir key itu sendiri (tanpa unhandled error; warning dev-only).
   - `format.ts` — `formatDate/formatNumber/formatCurrency` via `Intl.DateTimeFormat/NumberFormat` per locale (mata uang contoh IDR untuk demo — bukan klaim komersial; OD-06).
2. Persistence: cookie `epicrider_locale` (path=/, max-age 1 tahun, SameSite=Lax) — dibaca server untuk render awal (bebas hydration mismatch); sebelum identity tersedia (Phase 4), preference lokal = cookie; setelahnya bisa dimigrasi ke user preference.
3. Language switcher (client) mengubah cookie + `router.refresh()`; tidak menyentuh business logic/permission.
4. Semua string UI baru lewat `t()`; audit string hard-coded via pencarian literal di `src/` (prosedur terdokumentasi di README §i18n).
5. Dokumentasi cara menambah bahasa: tambah file dictionary baru + daftar di `config.ts` + type parity otomatis.

## Consequences

- (+) Nol dependency baru; parity key terjamin saat compile; fallback/fallback-testing eksplisit; server/client konsisten (cookie).
- (−) Kontrol pluralisasi/ICU rich-text tidak tersedia otomatis (kebutuhan belum ada; bisa dievolutif).
- (−) `next-intl` tetap terpasang tanpa dipakai (dependency existing — tidak menambah beban baru; dibuang/dipakai di fase berikutnya sesuai kebutuhan).
- Migrasi ke next-intl nanti = konversi dictionary → messages (key→string map kompatibel).

## Evidence

- Implementasi `src/i18n/*`; test parity/fallback/switcher (`tests/unit`, `tests/component`) hasil aktual di `PHASE_3_REPORT.md`.
- Kontrol: MC §4; REQ-028; prompt Phase 3 §5.3; OD-12 (asumsi ID default + EN siap).
