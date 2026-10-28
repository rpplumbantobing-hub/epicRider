# PHASE 3 CURRENT STATE AUDIT — epicRider (Gate B)

**Tanggal:** 2026-10-28 · **Metode:** inspeksi read-only (file/config + command aman). Tidak ada secret dicetak. `.env` hanya dicek keberadaan & status tracking-nya — isinya TIDAK dibuka.

## 1. Stack & struktur yang terverifikasi

| Aspek | Temuan | Status | Bukti |
|---|---|---|---|
| Framework | Next.js `^16.1.1` App Router + React `^19` | VERIFIED | `package.json`; `src/app/` |
| Bahasa | TypeScript `^5` (strict: true, `noImplicitAny: false`) | VERIFIED | `tsconfig.json` |
| Package manager | bun 1.3.14 + `bun.lock` ada | VERIFIED | `bun --version`; root |
| Runtime node | v24.22.1 | VERIFIED | `node --version` |
| CSS | Tailwind CSS 4 (`@import "tailwindcss"`, `@theme inline`) + `tw-animate-css` | VERIFIED | `src/app/globals.css` |
| UI library | shadcn/ui — 52 komponen di `src/components/ui/` (terpasang, belum dipakai di page) + `components.json` (New York) | VERIFIED | LS `src/components/ui/` |
| Icons | lucide-react | VERIFIED | `package.json` |
| DB | Prisma 6.11.1 + SQLite (`db/custom.db`, schema demo User/Post) | VERIFIED | `prisma/schema.prisma`; Phase 0 |
| Routing | App Router; 1 halaman (`/`) + 1 API route hello-world (`src/app/api/route.ts`) | VERIFIED | `src/app/page.tsx` |
| State/data lib (terpasang, belum dipakai) | next-auth 4, next-intl 4.3.4, zustand, @tanstack/react-query, zod, framer-motion, sonner, dll. | VERIFIED | `package.json` |
| Lint | `eslint .` — ESLint 9 flat config (`eslint-config-next`), **tetapi ±30 rule dimatikan** (no-unused-vars, exhaustive-deps, dll.) | PARTIAL | `eslint.config.mjs` |
| Formatter | Tidak ada (tanpa prettier/pilihan lain) | NOT FOUND | `package.json` |
| Testing framework | Tidak ada (nol test unit/component/e2e produk; `tests/` hanya berisi script platform runtime, bukan test produk) | NOT FOUND | `package.json`; `ls tests/` |
| CI | Tidak ada (`.github/` NOT FOUND; git remote kosong → CI remote mustahil dipicu) | NOT FOUND | `ls .github`; `git remote -v` |
| i18n | Tidak ada implementasi; `layout.tsx` hard-code `lang="en"`; page tanpa i18n | NOT FOUND | `src/app/layout.tsx` |
| Design tokens | shadcn semantik dasar (background/card/primary/muted/destructive/ring/sidebar/chart) + radius; **tidak ada token success/warning/info; tidak ada reduced-motion handling** | PARTIAL | `globals.css` |
| `.env` | Ada (50 byte) | ~~VERIFIED: tidak ter-track~~ **KOREKSI F-05 (2026-10-28): ter-track sejak commit awal `483950c`** — keputusan `git ls-files .env` saat Gate B melewatkan status index; sejak remediasi F-05 file dihapus dari index (`git rm --cached`), lokal dipertahankan, kini tidak ter-track + di-ignore. Bukti: `audit/phase3-remediation/secret-scan-env-2026-10-28.txt` | KOREKSI | `git log --all -- .env`; `git ls-files` |
| `.env.example` | NOT FOUND saat Gate B | ~~NOT FOUND~~ **kini TER-TRACK** (dibuat saat implementasi 3-c, baru masuk index saat remediasi F-05 karena pola `.env*` tanpa pengecualian sebelumnya menelannya file ini) | KOREKSI | `git ls-files .env.example` |
| `.editorconfig` | NOT FOUND | NOT FOUND | root |
| README developer | NOT FOUND di root (hanya `download/README.md` platform) | NOT FOUND | root |
| Git | main; 4 commit (`483950c` initial → `03293b6` P0 → `938932f` P1 → `70005a7` P2); tanpa remote | VERIFIED | `git log --oneline` |

## 2. Command yang ada saat ini & statusnya

| Command | Tool yang dijalankan | Status |
|---|---|---|
| `bun run dev` | `next dev -p 3000` (tee dev.log) | VERIFIED — dev server berjalan di :3000 (platform) |
| `bun run lint` | `eslint .` | VERIFIED sebagai command; keluaran dievaluasi di Phase 3 |
| `bun run build` | `next build` + copy standalone | **NOT RUN di sandbox ini** — platform melarang build produksi (melindungi dev server); script ada & sah |
| `bun run start` | standalone server | NOT RUN (butuh build) |
| `bun run db:push/generate/migrate/reset` | prisma | NOT RUN di Phase 3 (tidak dibutuhkan; skema demo tidak diubah) |
| typecheck | **tidak ada script** → dibuat `tsc --noEmit` | NOT FOUND → PROPOSED/akan dibuat |
| test / format | tidak ada script | NOT FOUND → akan dibuat |

## 3. Konfigurasi berisiko yang ditemukan

| # | Risiko | Bukti | Tindakan Phase 3 |
|---|---|---|---|
| 1 | `ignoreBuildErrors: true` — error TS sengaja diabaikan saat build (OD-04) | `next.config.ts:6-9` | **DIHAPUS** (owner prompt Phase 3 §5.1 melarang) + `reactStrictMode` kembali `true`; dicatat ADR-019 |
| 2 | Lint dibuat longgar (±30 rule off) — quality gate lemah | `eslint.config.mjs` | Dipertahankan sebagai baseline (perubahan besar di luar scope; dicatat sebagai risiko + rekomendasi mengetatkan bertahap); lint tetap gate CI |
| 3 | `noImplicitAny: false` melemahkan strict mode | `tsconfig.json` | Dipertahankan (baseline); typecheck tetap gate; pengetatan bertahap dicatat sebagai rekomendasi |
| 4 | Token semantic success/warning/info tidak ada → UI status hanya `destructive` | `globals.css` | Ditambahkan (foundation tokens) |
| 5 | Metadata scaffold Z.ai + `lang="en"` (harusnya default `id` per REQ-028/kontrol) | `layout.tsx` | Diganti ke branding epicRider + `lang` dinamis dari locale |
| 6 | `db/custom.db` ter-commit; `tests/` berisi script platform (potensi disangka test suite) | root | Dicatat; tidak dihapus (historis); test produk ditempatkan di `tests/unit|component` dengan penamaan jelas |
| 7 | Tanpa `.env.example` | root | Dibuat (placeholder saja — DATABASE_URL="file:./dev.db" contoh) |

## 4. Baseline error build/lint/type

- `bun run lint` dieksekusi 2026-10-28: **exit 0, tanpa error** (output di `PHASE_3_REPORT.md` §quality gates).
- Typecheck sebelumnya tidak pernah dijalankan (tidak ada script) — hasil pertama terekam di report Phase 3.
- Build tidak dieksekusi di sandbox (larangan platform, lihat §2) — dilarang menyamarkan ini sebagai lulus.

## 5. Keputusan teknis yang harus dipertahankan

- Stack tidak diganti: Next 16 App Router + React 19 + TS 5 + Tailwind 4 + shadcn/ui + Prisma/SQLite + bun (aturan prompt §4.3 — tanpa blocker teknis terverifikasi).
- Satu route yang terlihat user = `/` (platform constraint sandbox) → showcase foundation ditempatkan di `/`.
- i18n: dictionary typed id/en + provider context + cookie persistence (lihat `adr/ADR-020-i18n-mechanism.md`); `next-intl` tetap terpasang untuk opsi routing-based di masa depan (tidak dipakai di Phase 3 — dicatat di ADR).
- Authorization/entitlement TIDAK diimplementasikan di Phase 3 (Phase 4/5) — hanya pola state UI (PermissionDenied dll.).
- Tanpa dark mode switch baru (belum ada keputusan; token `.dark` bawaan shadcn dipertahankan apa adanya).

## 6. Status taxonomy ringkas (wajib per prompt §4.7)

> **Koreksi F-05 (remediasi audit Phase 3, 2026-10-28):** item ".env hygiene" di bawah (klaim VERIFIED "tidak ter-track") **SALAH saat direkam** — `.env` ternyata ter-track sejak commit awal; `.env.example` saat Gate B memang NOT FOUND. Kedua baris tabel §1 di atas diberi status KOREKSI dengan fakta terkini. Klaim keamanan/handoff lain sudah diselaraskan (`HANDOFF.md` §7, `PHASE_3_REPORT.md` §8).

- VERIFIED: stack, struktur, command tersedia, git state, risiko #1/#3/#5/#6/#7.
- PARTIAL: lint (ada tapi longgar), design tokens (dasar ada, kurang success/warning/info + motion), tsconfig strictness.
- NOT FOUND (saat Gate B): CI, test framework, formatter, .env.example, .editorconfig, README, i18n, remote git — sebagian kini sudah ada (implementasi 3-c + remediasi).
- NOT TESTED / NOT RUN: build (larangan platform), CI remote (tanpa remote).
- UNKNOWN / NEEDS DECISION: OD-01/OD-02 (tidak memblokir fondasi Phase 3). ~~OD-185~~ CLOSED — DECIDED BY BASELINE (ADR-021, remediasi F-01).
