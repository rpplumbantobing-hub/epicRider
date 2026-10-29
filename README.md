# epicRider — Phase 4 IN PROGRESS (identity, auth, workspace/tenant, membership)

epicRider adalah platform untuk kru produksi multimedia/event. **Status fase: Phase 4 `IN PROGRESS`** — implementasi identity/authentication/session/workspace/membership/invitation/roles selesai pada worktree terisolasi dari canonical `b5defc22` (baseline gate PASS 2026-10-28); menunggu integrasi owner + remote CI — lihat `ROADMAP.md`, `PHASE_4_REPORT.md`, `HANDOFF.md`. **Ini BUKAN fitur produksi**; login Google aktif hanya dengan kredensial env (tanpa kredensial: status aman "belum dikonfigurasi"); kanal WhatsApp menunggu vendor (OD-03). Route demo: showcase fondasi `/` + halaman Phase 4 (`/login`, `/workspaces`, `/invitations`, `/account` — konten demo/dev, tanpa data nyata).

Dokumen kontrol proyek (status fase, baseline, keputusan): lihat `CONTROL_BASELINE_REGISTER.md` dan `HANDOFF.md`.

## Prasyarat

- [bun](https://bun.sh) 1.3.14 (package manager + runtime; dicatat di `PHASE_3_CURRENT_STATE_AUDIT.md`).
- Tidak perlu database terpisah — SQLite via Prisma untuk pengembangan lokal.

## Perintah

| Perintah | Yang dijalankan | Status |
| --- | --- | --- |
| `bun run dev` | `next dev -p 3000` | Server dev (platform sandbox menjalankannya otomatis). |
| `bun run lint` | `eslint .` | Gate. Exit 0 pada baseline Phase 3. Catatan: ±30 rule eslint dimatikan sejak scaffold (baseline dipertahankan, pengetatan bertahap = rekomendasi). |
| `bun run typecheck` | `tsc --noEmit` | Gate (baru di Phase 3, ADR-019). Exit 0 pada baseline Phase 3. `examples/` dan `skills/` (folder platform) di-exclude dari tsc. |
| `bun run test` | `vitest run` | Gate. Unit + component test (lihat §Testing). |
| `bun run test:watch` | `vitest` | Mode watch. |
| `bun run format` / `format:check` | `prettier --write .` / `--check .` | Skrip tersedia sejak Phase 3. **Belum diterapkan repo-wide** (menyentuh banyak file scaffold; keputusan penerapan menyusul) — `format:check` saat ini masih melaporkan file yang belum rapi. Bukan gate CI. |
| `bun run db:push` | `prisma db push` | Push schema Prisma ke SQLite (`db/custom.db`). Schema saat ini masih demo User/Post — tidak diubah di Phase 3. |
| `bun run build` | `next build` + copy standalone | **Tidak dieksekusi di working copy utama sandbox** (larangan platform — melindungi dev server). Bukti build produksi yang sah: CI remote, atau working copy terisolasi (lihat `PRE_PHASE_4_GATE_REPORT.md`). Status lokal = NOT RUN. |

## Struktur proyek

```
src/
  app/            # App Router: layout.tsx (locale via cookie), page.tsx (showcase, server component)
    api/          # API route contoh (hello world)
  components/
    foundation/   # Komponen fondasi Phase 3 (presentational): EmptyState, ErrorState, PermissionDenied, StatusBadge, Showcase
    ui/           # shadcn/ui (New York) — sumber komponen UI
  hooks/          # Hook klien (use-toast, use-mobile)
  i18n/           # Mekanisme i18n (ADR-020): config, dictionaries/, format, provider, server, translate
  lib/            # Utilitas (cn, db client Prisma)
tests/
  unit/           # Unit test (murni, tanpa render): parity dictionary, fallback t(), formatter Intl, getLocale
  components/     # Component test (jsdom + Testing Library): komponen fondasi, language switcher
prisma/           # Schema Prisma (SQLite)
.github/workflows # CI (quality gates)
adr/              # Architecture Decision Records (ADR-001..020)
```

## Konvensi

- **Folder & naming**: komponen React = `PascalCase.tsx` di `src/components/`; modul non-komponen = `camelCase.ts`/`kebab-case.ts`; test = `*.test.ts(x)` di `tests/unit|components`.
- **Import boundaries** (arah): `src/app` → `src/components` → `src/lib` / `src/i18n`. Komponen fondasi (`components/foundation`) presentational — tidak memanggil API/database.
- **Error handling**: try/catch eksplisit di boundary; hasil operasi yang bisa gagal dikembalikan sebagai typed result (bukan throw mentah lintas lapisan). Error UI memakai komponen status (ErrorState/PermissionDenied), otorisasi tetap server-side.
- **Config environment**: nilai nyata di `.env` (**tidak di-track Git** — dihapus dari index pada remediasi F-05 2026-10-28; file tetap ada secara lokal); placeholder + penjelasan di `.env.example` (**ter-track**, pengecualian `!.env.example` di `.gitignore`) — jangan pernah menyalin nilai rahasia ke `.env.example`.
- **Editor**: `.editorconfig` (UTF-8, LF, indent 2 spasi, newline akhir); formatting Prettier (`.prettierrc`, printWidth 100, double quote).
- **Kontrol dokumen**: file kontrol root (MASTER_CONTROL, ROADMAP, dll.) tidak diedit oleh alur kerja fitur biasa; status fase hanya di `ROADMAP.md`.

## i18n (ADR-020)

Mekanisme: typed dictionary + React context + cookie persistence (`epicrider_locale`, 1 tahun, SameSite=Lax). Locale default `id`, `en` siap. Fallback `t()`: locale aktif → `defaultLocale` → key itu sendiri (warning dev-only). Formatter (`formatDate/formatNumber/formatCurrency`) memakai `Intl` per locale; mata uang = **demo format saja** (OD-06 — bukan klaim komersial).

Menambah bahasa baru (3 langkah):

1. Buat `src/i18n/dictionaries/<locale>.ts` dengan `const xx: Dictionary = {...}` (type memaksa key parity dengan `id.ts`).
2. Daftarkan di `src/i18n/dictionaries/index.ts` (`dictionaries: Record<Locale, Dictionary>`) dan tambahkan kode locale ke `locales` di `src/i18n/config.ts`.
3. Jalankan `bun run test` — test parity key otomatis memvalidasi dictionary baru jika didaftarkan.

Audit string hard-coded: cari literal di JSX — `rg -n '>[^<{]*[A-Za-z]{3}' src/` dan `rg -n '"[^"]*[A-Za-z]{3}[^"]*"' src/components src/app` lalu pastikan setiap copy UI melewati `t()`. (Pengecualian: metadata statis di `layout.tsx` dan nama token/kelas teknis.)

## Testing

- **Layout**: unit test (tanpa DOM) di `tests/unit/`, component test (jsdom + Testing Library) di `tests/components/`. Setup global: `tests/setup.ts` (jest-dom matchers + cleanup). Jalankan `bun run test` / `bun run test:watch`.
- **Cakupan saat ini (Phase 3)**: 25 test — parity key id/en, fallback `t()`, formatter Intl, guard locale + `getLocale` (cookie), komponen fondasi (role/nama aksesibel, ikon non-warna-saja), language switcher (cookie + perubahan string, `router.refresh` di-mock).
- **E2E**: TIDAK ada framework e2e (Playwright/dll.) yang terpasang. Smoke route `/` saat ini dilakukan manual via agent-browser oleh orkestrator. Status jujur: e2e otomatis = NOT FOUND (kandidat fase berikutnya).
- Prinsip: test deterministik (tanpa timer nyata >100ms), komponen diuji lewat role/nama aksesibel (bukan detail styling).

## CI

`.github/workflows/ci.yml` — nama workflow **"CI"**, trigger `push` + `pull_request`, `permissions: contents: read`. Satu job `ubuntu-latest`: setup-bun (pin `1.3.14`) → `bun install --frozen-lockfile` → `bun run lint` → `bun run typecheck` → `bun run test` → `bun run build`.

Status jujur: **workflow belum pernah dijalankan pada runner** — repo tidak punya git remote, dan sandbox tidak memiliki runner CI (docker/act tidak tersedia) → CI remote = NOT TESTED (termasuk step build). Eksekusi gate secara manual di lokal TIDAK setara dengan eksekusi workflow CI (OBSOLETE_AND_SUPERSEDED_REGISTER §2; `PRE_PHASE_4_GATE.md` item 9).

## Dokumen kontrol

- `CONTROL_BASELINE_REGISTER.md` — register baseline kontrol kanonik aktif.
- `HANDOFF.md` — ringkasan status, keputusan, dan next actions.
- `PHASE_3_CURRENT_STATE_AUDIT.md` — audit kondisi repo sebelum implementasi Phase 3.
- `adr/` — keputusan arsitektur (ADR-019 quality gates, ADR-020 i18n, dst.).
