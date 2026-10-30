# PHASE 5 ACCEPTANCE — epicRider

## Phase 5-B — Licensing Domain & Database Foundation (acceptance lokal, 2026-10-30)

**Verdict: PASS (18/18 kriteria 5-B)** — bukti per kriteria di bawah; gate lengkap =
`PHASE_5_REPORT.md` §G. **Catatan governance:** ini acceptance LOKAL pada branch terpisah;
closure status fase menunggu integrasi owner (commit/push/CI runner owner — pola Phase 4).
Phase 5 keseluruhan **bukan DONE** (5-C/D/E NOT STARTED).

| # | Kriteria (prompt owner 5-B) | Verdict | Bukti |
|---|---|---|---|
| 1 | Tier valid hanya MINI_RIDER/MAX_RIDER/ISO_RIDER | PASS | V-1; D (seed/katalog); M (seed) |
| 2 | HI_RIDER bukan license tier | PASS | V-2/V-10; D CHECK P2003-reject + zero fallback row; M CHECK |
| 3 | TOTAL_RIDER bukan license tier (tidak dihidupkan kembali) | PASS | V-2/V-10; D CHECK; M CHECK |
| 4 | Status/code vocabulary konsisten & i18n-neutral | PASS | V-11 (upper/lower-snake, ASCII, tanpa spasi; DMC §2.9) |
| 5 | Tidak ada silent fallback ke tier tak terdaftar | PASS | V-10 (11 input ditolak; tanpa kunci fallback); D/M CHECK tanpa baris fallback |
| 6 | License terhubung ke Workspace yang benar | PASS | D relasi dua arah + FK P2003 |
| 7 | Satu Workspace tak boleh punya >1 License ACTIVE | PASS | D P2002 (partial unique, domain layer); M constraint aktif pasca-migration |
| 8 | Histori/non-active license tetap tersimpan | PASS | D (3 baris status campuran; slot ACTIVE bebas setelah turun status); M (EXPIRED di atas data Phase 4) |
| 9 | Relasi ke entitas Phase 4 tidak diduplikasi | PASS | D DMMF himpunan model persis 11+8; relasi memakai Workspace/LicenseTier; tidak ada model tenant/identity baru |
| 10 | Tidak membuat sistem Identity/Membership/Role/Authorization baru | PASS | D DMMF (tidak ada model baru selain 8 fondasi); co-exist test |
| 11 | Constraint DB diuji juga dari domain/integration layer | PASS | D/M via Prisma Client pada DB hasil migration (P2002/P2003/CHECK) |
| 12 | Migration dimulai dari data Phase 4; tanpa reset | PASS | M (deploy Phase 4 → data representatif → deploy 5-B; `_prisma_migrations` = 2) |
| 13 | Data existing tetap utuh | PASS | M snapshot per baris identik (user/workspace/membership/role/assignment/invitation/audit) |
| 14 | Migration baru dapat diterapkan normal (+ idempoten) | PASS | M deploy ke-2 sukses; deploy ke-3 tanpa efek ulang |
| 15 | Constraint 5-B aktif setelah migration; seed/reference tersedia | PASS | M (single-ACTIVE + CHECK; 3 tier/4 type/10 cap/24 rule/1 kuota) |
| 16 | Tidak ada destructive migration; Phase 4 migration tidak berubah | PASS | M (SQL aditif-only; git diff --quiet Phase 4 + lock; status porcelain hanya untracked 5-B) |
| 17 | Tidak ada `db:push --accept-data-loss` | PASS | M/G (semua via `migrate deploy`; `_prisma_migrations` tercatat; gate tanpa db:push) |
| 18 | Gate kualitas semua lulus; lint/typecheck/test/build/validate/diff | PASS | G: test 145/145; validate/generate/deploy/diff/status/lint/typecheck/build = exit 0 |

**Garis merah dihormati:** OD-05 (`ownerCountedInQuota` NULL), OD-06 (tanpa harga/issuance; definisi
extension default non-aktif), OD-108 (term/window NULL; tanpa mekanika transisi); tanpa UI/checkout/
payment/engine; tanpa `hiRider`/`totalRider` sebagai tier; tanpa commit/push/PR atas nama owner.
**Limitations:** acceptance lokal (belum CI owner); SQLite dev; vocabulary status PROPOSED.
