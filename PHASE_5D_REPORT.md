# PHASE 5-D REPORT — License & Extension Lifecycle (RECOVERY)

> **VERDICT Phase 5-D (recovery): PASS WITH LIMITATIONS — implementation complete, semua
> evidence gate lokal PASS.** Ini adalah RE-EXECUTION TERKENDALI: candidate pertama
> (`b687ace`, branch `integration/phase5-d-license-extension-lifecycle` lama) hilang dari
> environment (sandbox ephemeral; tidak pernah dipush ke GitHub / tidak ada transfer
> package yang bertahan) dan TIDAK dapat dipulihkan dari lokasi manapun. Implementasi
> dibangun ulang di atas baseline canonical `165b3ba` dengan scope dan kontrak yang sama;
> hash commit baru adalah NORMAL (bukan byte-for-byte candidate lama).
> **Phase 5 secara keseluruhan TIDAK DONE** — 5-E (checkout/shop) NOT STARTED; closure
> menunggu integrasi owner (pola Phase 4; MC-V4 §11). OD-05/OD-06/OD-108 tetap OPEN.

---

## §A Recovery evidence & baseline

| Item | Nilai |
|---|---|
| Repository canonical | `rpplumbantobing-hub/epicRider.git` (GitHub; diverifikasi `git ls-remote`) |
| Baseline recovery | `165b3ba545d61bb3b39c691436456b7c4bbf076d` — `origin/main` (merge PR #3: 5-B + 5-C) |
| Ancestry terverifikasi | `8cbc4ef → 20a0169 → afcdf41 → 165b3ba` (`git merge-base --is-ancestor` PASS) |
| Candidate lama | `b687ace9…` **TIDAK DITEMUKAN** — bukan di GitHub (ls-remote: hanya main + 3 branch lama + PR #1..3), bukan di disk, bukan di transfer package manapun. Tidak dipalsukan, tidak direkonstruksi dari ingatan. |
| Branch recovery | `integration/phase5-d-license-extension-lifecycle` (baru dari `165b3ba`; branch lama tidak ada di remote) |
| Status Git | Perubahan pada working tree branch, di-commit LOKAL sebagai satu candidate commit; **TANPA push/PR/merge** (integrasi = owner) |

## §B Hasil implementasi (scope 5-D)

### B.1 License lifecycle — `src/lib/licensing/license-lifecycle.ts`
- Matriks 8 aksi kanonik (DMC §6.2; REQ-098): ACTIVATE, RENEW, TERM_END, GRACE_ENTER,
  RENEW_IN_GRACE, GRACE_END, DOWNGRADE, REACTIVATE — evaluator murni fail-closed; seluruh
  48 pasangan (6 status × 8 aksi) ter-cover test; EXPIRED terminal; PURCHASED → DOWNGRADED
  ditolak (ambiguitas owner); semua status reachable; RENEWAL_DUE terpetakan jelas.
- Verify-only waktu (OD-108): tanpa perhitungan durasi, tanpa scheduler; `now` disuplai;
  tanggal baru hanya yang disuplai pemanggil.
- Prasyarat bertiba-ACTIVE: tier aktif + tepat satu ACTIVE per workspace (service + partial
  unique index 5-B; P2002 → denial teraudit).
- DOWNGRADE: tidak mengubah tierId, tidak menyentuh data tenant (REQ-099); REACTIVATE
  memulihkan; `resolveWorkspaceLicenseState` = resolver data (pola 5-C).

### B.2 Extension lifecycle — `src/lib/licensing/extension-lifecycle.ts`
- Matriks 6 aksi (LICENSE_MATRIX §5): ASSIGN, ACTIVATE (ASSIGNED/RENEWED → ACTIVE),
  SUSPEND, EXPIRE, RENEW (SUSPENDED/EXPIRED → RENEWED), REMOVE (semua non-REMOVED →
  REMOVED, logis). RENEWED tidak memberi entitlement sampai ACTIVATE; SUSPENDED/EXPIRED/
  REMOVED/PURCHASED/ASSIGNED tidak memberi entitlement.
- Satu instance LIVE per (workspace, type): LIVE = {PURCHASED, ASSIGNED, ACTIVE, SUSPENDED,
  RENEWED}; ditegakkan DB (partial unique index pada `typeId` denormalisasi — migration
  5-D aditif-only) + service. Type di luar closed list / definisi non-aktif ditolak
  fail-closed; jalur pemadaman (SUSPEND/EXPIRE/REMOVE) tidak pernah diblokir katalog.
- `quantity` dibawa apa adanya; tanpa perhitungan kuota (OD-05/06).

### B.3 Shared — `src/lib/licensing/lifecycle-shared.ts` + authz aditif
- Aktor: SYSTEM (internal tepercaya) | USER (sesi dari sumber tepercaya). Tidak ada
  route/API 5-D → client tidak dapat menyuplai SYSTEM; identitas USER kosong ditolak
  fail-closed.
- Otorisasi: permission kanonik AUTHORIZATION_MODEL §4.5/§4.6 (`license.renew.initiate`,
  `extension.assign`, `extension.remove`, `extension.renew.initiate` — ditambahkan ke
  `permissions.ts`, key lama tidak berubah, tidak diikat preset Phase 4); aksi tanpa key
  kanonik → fallback owner ber-status **PROPOSED** (flag `viaOwnerFallback` teraudit;
  BUKAN kebijakan final). Denial tanpa fallback: non-member/INVITED/SUSPENDED/REMOVED/
  LEFT/role tak dikenal/sesi tidak sah.
- Audit: sukses ATOMIK dengan transisi; denial first-class dengan reason code lifecycle
  baru (vocabulary §3 tidak diubah).

### B.4 Konkurensi & idempotensi (ADR-017; keterbatasan jujur)
- Optimistic guard `updateMany` kondisional → `DENY_CONCURRENT_MODIFICATION`; tidak pernah
  silent last-write-wins.
- Idempotensi state-convergence: replay aksi yang sudah teraplikasi = no-op sukses
  teraudit; RENEW replay dengan data berbeda = konflik eksplisit; replay tidak menimpa data.
- **Keterbatasan:** diuji pada SQLite lokal (OD-01 OPEN); database produksi tidak diuji;
  replay-cache fisik menunggu OD-01.

## §C Test baru Phase 5-D — 54 test

| # | File | Test | Membuktikan |
|---|---|---|---|
| 1 | `tests/unit/license-lifecycle.test.ts` | 10 | Matriks 8 aksi tepat; 48 pasangan fail-closed; EXPIRED→ACTIVE & PURCHASED→DOWNGRADED ditolak; semua status reachable; RENEWAL_DUE terpetakan; efek entitlement hanya-to-ACTIVE; tabel otorisasi PROPOSED |
| 2 | `tests/unit/extension-lifecycle.test.ts` | 8 | Matriks 6 aksi; 49 slot ter-cover; RENEWED tanpa entitlement; REMOVED terminal/logis; LIVE set; kanonik vs PROPOSED |
| 3 | `tests/unit/lifecycle-authorization.test.ts` | 4 | Tabel otorisasi lengkap 14 aksi; key kanonik persis §4.5/§4.6 (nilai tidak berubah); PROPOSED eksplisit |
| 4 | `tests/integration/license-lifecycle.test.ts` | 18 | End-to-end ACTIVATE→…→EXPIRED; otorisasi+audit (owner fallback/member/non-member/sesi/suspended/anon); idempotensi; tepat-satu-ACTIVE (service + P2002); verify-only TERM/GRACE; DOWNGRADE data-preservation + engine 5-C mengikuti status; konkurensi (1 pemenang, denial teraudit); SYSTEM internal; TIDAK ada route HTTP |
| 5 | `tests/integration/extension-lifecycle.test.ts` | 14 | ASSIGN→ACTIVATE→SUSPEND→RENEW→ACTIVATE→EXPIRE→REMOVE; entitlement naik/turun mengikuti status; satu-live-instance (P2002 DB sejak PURCHASED; slot bebas pasca-EXPIRED; type terpisah); definisi non-aktif/rogue-type/typeId-null fail-closed; index 5-D terpasang; REMOVE logis; isolasi tenant teraudit; retry identik no-op tanpa menimpa data |

## §D Regression & gate

| Gate | Command | Hasil |
|---|---|---|
| Full test suite (regression 4/5-B/5-C + 5-D) | `bun run test` | **275/275 PASS** (23 file; 221 regresi + 54 baru) — dijalankan 2× (stabil) |
| Lint | `bun run lint` | exit 0 (0 error, 0 warning) |
| Typecheck | `bun run typecheck` | exit 0 |
| Prisma validate / generate | `prisma validate`, `prisma generate` | valid; client ter-generate |
| Migration konsisten dengan schema | `prisma migrate diff --from-migrations --to-schema-datamodel` | "No difference detected" |
| Migration pada DB disposable | `prisma migrate deploy` (setiap integration test) | PASS |
| Migration lama tidak tersentuh | test 5-B `licensing-migration.test.ts` (diperluas 5-D mengikuti preseden 5-C: daftar migration untracked kini 5-B atau 5-D) | PASS |
| Production build | `bun run build` dengan placeholder `NEXTAUTH_SECRET` **pola CI owner** (workflow `.github/workflows`: `phase4-ci-build-only-placeholder-not-a-secret`) | exit 0 |

## §E Perbedaan terhadap implementasi lama (287/287; 24/26 acceptance; 2 PARTIAL)

Angka lama adalah **reference evidence**, bukan target yang dipaksakan. Perbedaan aktual:

1. **Jumlah test:** recovery menghasilkan 275 total (54 baru 5-D) vs 287 lama (66 baru).
   Suite recovery sedikit lebih kecil karena tidak menduplikasi kasus yang kini ditolak
   langsung oleh invariant DB (dua instance live same-type tidak dapat konstruktur), dan
   test konkurensi ditulis deterministik (SQLite serialisasi) — bukan simulasi race yang
   flaky. Cakupan kontrak (matriks, otorisasi, audit, idempotensi, isolasi, REQ-099)
   setara; tidak ada area kontrak yang hilang.
2. **Idempotensi diperjelas:** recovery menyatakan eksplisit idempotensi state-convergence
   + keterbatasan replay-cache (OD-01) — area yang pada review lama ditandai nuansa.
3. **Hardening tambahan:** identitas aktor USER kosong/undefined kini ditolak fail-closed
   (teruji) — ditemukan saat recovery test.
4. **Acceptance:** lihat `PHASE_5D_ACCEPTANCE.md` — hasil aktual dilaporkan apa adanya
   (PASS / PARTIAL dengan alasan), tidak dipaksakan identik dengan 24/26 lama.

## §F Yang TIDAK dilakukan (batas scope)

Tanpa harga/billing/checkout/issuance (OD-06; 5-E); tanpa scheduler/automation (OD-108);
tanpa kuota seat enforcement (OD-05); tanpa UI/API HTTP baru; tanpa license key; tanpa
mengubah implementation/migration 5-B/5-C; tanpa menutup OD manapun; tanpa push/PR/merge.
