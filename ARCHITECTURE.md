# ARCHITECTURE — epicRider

**Aturan label:** Setiap bagian wajib diberi label `CURRENT STATE` (fakta repository, berbasis bukti Phase 0) atau `TARGET STATE` (arahan Master Control / ADR yang belum terbukti terimplementasi). Dilarang mencampur status tanpa label.

Tanggal audit terakhir: 2026-05-22 (Phase 0). Bukti lengkap: `PHASE_0_AUDIT_REPORT.md`.

---

## 1. CURRENT STATE — fakta repository (teraudit Phase 0)

Status keseluruhan: **scaffold platform Next.js tanpa implementasi domain epicRider.**

| Aspek | Fakta | Bukti |
|---|---|---|
| Framework | Next.js 16.1.1 (App Router), output standalone | `package.json` baris 60, `next.config.ts` baris 7 |
| Bahasa | TypeScript 5, React 19 | `package.json` baris 65–66, 92 |
| Package manager | bun (`bun.lock` ada; script dev/lint dijalankan via bun) | `bun.lock`, `package.json` baris 5–13 |
| Styling | Tailwind CSS 4 + komponen shadcn/ui (~52 komponen di `src/components/ui/`) | `package.json` baris 83–93; `src/components/ui/` |
| Database/ORM | Prisma 6.11.1 dengan provider SQLite; file DB di `db/custom.db` | `prisma/schema.prisma` baris 11–14; `db/custom.db` |
| Schema database | Hanya model demo `User` dan `Post` — tidak ada model domain epicRider | `prisma/schema.prisma` baris 16–32 |
| API | Satu route demo `GET /api` mengembalikan "Hello, world!" | `src/app/api/route.ts` |
| UI entry | Halaman `/` berisi logo placeholder (render terverifikasi via browser; screenshot `audit/evidence/current-home-*.png`) | `src/app/page.tsx`; dev.log `GET / 200` |
| Auth | `next-auth` ^4.24.11 terpasang sebagai dependency, TIDAK ada implementasi (tanpa route `/api/auth`, tanpa konfigurasi provider) | grep `next-auth|useSession` di `src/**` = 0 hasil |
| i18n | `next-intl` ^4.3.4 terpasang, TIDAK ada konfigurasi i18n, tidak ada file locale | grep `next-intl` di `src/**` = 0 hasil; tidak ada folder `messages/` |
| State management | `zustand`, `@tanstack/react-query`, `@tanstack/react-table` terpasang, TIDAK ada penggunaan di `src/` | grep = 0 hasil |
| AI SDK | `z-ai-web-dev-sdk` ^0.0.18 terpasang, TIDAK ada penggunaan | grep = 0 hasil |
| Realtime | Tidak ada; contoh socket.io hanya referensi di `examples/websocket/` | `examples/websocket/` |
| CI/CD | Tidak ada (tanpa `.github/`, tanpa pipeline config) | `ls .github` = tidak ada |
| Tests | Tidak ada test suite aplikasi; `tests/` berisi 3 script runtime sandbox yang bukan test aplikasi | `ls tests/` |
| Migrations | Tidak ada folder `prisma/migrations/`; schema didorong via `db:push` | `ls prisma/` |
| Environment | `.env` hanya berisi 1 key: `DATABASE_URL` (nilai tidak ditampilkan; file di-gitignore) | `.env` (key list), `.gitignore` baris 30 |
| Git | Branch `main`, 1 commit `483950c "Initial commit"`; hampir seluruh file untracked/uncommitted | `git log`, `git status --porcelain` |
| Gateway | `Caddyfile` (untracked) sebagai gateway satu-port sandbox | root `Caddyfile` |
| Mini services | Folder `mini-services/` kosong | `ls mini-services/` |
| Dokumentasi root | Sebelum Phase 0 tidak ada; Phase 0 menambahkan control files (lihat daftar di `MASTER_CONTROL.md` §13) | root `*.md` |

### Temuan arsitektur penting (risiko)
1. **Tidak ada multi-tenancy, auth, entitlement, maupun domain model** — semua prinsip Master Control §5 belum punya fondasi kode. Status: `NOT FOUND`.
2. **SQLite + Prisma** adalah pilihan sandbox, bukan keputusan arsitektur yang terdokumentasi untuk produksi. Pemilihan database produksi adalah keputusan terbuka untuk Phase 2 (lihat `PHASE_0_OPEN_DECISIONS.md`).
3. `next.config.ts` memakai `ignoreBuildErrors: true` dan `reactStrictMode: false` (baris 7–9) — menurunkan jaminan kualitas; perlu keputusan dipertahankan/diubah sebelum Phase 3.
4. Seluruh kode uncommitted — tidak ada baseline git yang aman untuk recovery riwayat.

## 2. TARGET STATE — arsitektur target (Master Control, belum terimplementasi)

Status: `PROPOSED/TARGET` kecuali dipindahkan ke CURRENT STATE lewat bukti.

1. **Satu platform, satu domain model inti**, multi-tenant/multi-workspace dengan isolasi terbukti (Master Control §5).
2. **Entitlement server-side** untuk perbedaan lisensi tier miniRider/maxRider/ISOrider/hiRider; UI menu-hiding bukan kontrol keamanan (§5, §6).
3. **Identitas global user terpisah** dari workspace membership, role, event assignment, developer role, auditor access (§5).
4. **Permission engine** yang memeriksa aktor, tenant/workspace, objek, aksi, konteks event, lisensi, status objek (§5).
5. **Core flow:** Process → Control → Workflow → Transaction → Evidence → Report/Improvement (§5).
6. **API bersama web + mobile** (Android/iOS) tanpa duplikasi logika bisnis; strategi PWA vs native diputuskan setelah audit via ADR (§3, §8).
7. **i18n sejak awal**: Bahasa Indonesia default, siap Inggris (§5).
8. **Controlled Document & Evidence Library** dengan hirarki Policy → … → Report dan audit trail penuh (§10).
9. **Asset lifecycle penuh** untuk maxRider termasuk QR/barcode, print, scan, maintenance, readiness (§11).
10. **IMS digital** untuk ISOrider: mutu, sustainability, HSE, keamanan informasi, continuity, risk, audit, NCR/CAPA, management review (§9).

## 3. Keputusan arsitektur terbuka yang menghalangi fase berikut

- Database produksi (tetap SQLite vs PostgreSQL/ MySQL lain) — menghalangi Phase 2/3. → `PHASE_0_OPEN_DECISIONS.md` OD-01
- Strategi mobile (PWA vs native/cross-platform) dan Windows — menghalangi Phase 23, desain API Phase 2. → OD-02
- Provider verifikasi WhatsApp OTP (vendor review) — menghalangi Phase 4. → OD-03
- Mempertahankan `ignoreBuildErrors: true` — menghalangi Phase 3 quality gate. → OD-04

Setiap keputusan di atas wajib dicatat sebagai ADR di `DECISIONS.md` saat diputuskan.
