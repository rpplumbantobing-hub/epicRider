# PHASE 5-D REPORT — License & Extension Lifecycle (RECOVERY)

> **VERDICT Phase 5-D (recovery + remediasi PR #4): PASS WITH LIMITATIONS — implementation
> complete, semua evidence gate lokal PASS.** Ini adalah RE-EXECUTION TERKENDALI: candidate
> pertama (`b687ace`, branch `integration/phase5-d-license-extension-lifecycle` lama) PERNAH
> DIBUAT dan DIPAKETKAN pada sesinya (Git bundle + ZIP transfer package dihasilkan, dengan
> ukuran dan SHA-256 yang tercatat pada laporan historis), namun branch/artifact tersebut
> TIDAK lagi tersedia pada environment saat recovery dilakukan dan TIDAK ditemukan pada
> GitHub (tidak ada bukti push). Implementasi dibangun ulang di atas baseline canonical
> `165b3ba` dengan scope dan kontrak yang sama; hash commit baru adalah NORMAL (bukan
> byte-for-byte candidate lama).
> **Remediasi PR #4 (2026-10-31):** tiga temuan review ditangani dalam satu commit
> remediasi di atas `cb4fc97` — (A) backfill existing-data pada migration `typeId`,
> (B) penghapusan jalur ALLOW `OWNER_FALLBACK_PROPOSED` (explicit permission only,
> default deny), (C) koreksi dokumentasi historis seperti catatan ini. Lihat §G.
> **Phase 5 secara keseluruhan TIDAK DONE** — 5-E (checkout/shop) NOT STARTED; closure
> menunggu integrasi owner (pola Phase 4; MC-V4 §11). OD-05/OD-06/OD-108 tetap OPEN.

---

## §A Recovery evidence & baseline

| Item | Nilai |
|---|---|
| Repository canonical | `rpplumbantobing-hub/epicRider.git` (GitHub; diverifikasi `git ls-remote`) |
| Baseline recovery | `165b3ba545d61bb3b39c691436456b7c4bbf076d` — `origin/main` (merge PR #3: 5-B + 5-C) |
| Ancestry terverifikasi | `8cbc4ef → 20a0169 → afcdf41 → 165b3ba` (`git merge-base --is-ancestor` PASS) |
| Candidate lama | `b687ace9…` **TIDAK DAPAT DIGUNAKAN SAAT RECOVERY** — candidate pernah dibuat dan dipaketkan (Git bundle + ZIP dengan ukuran/SHA-256 tercatat historis), namun saat recovery dilakukan branch/artifact tersebut tidak lagi tersedia pada environment dan tidak ditemukan di GitHub (`ls-remote`: hanya main + 3 branch lama + PR #1..3; tidak ada bukti pernah dipush). Tidak dipalsukan, tidak direkonstruksi dari ingatan. |
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
- **Remediasi PR #4 (Temuan A) — migration backfill existing data:** migration 5-D kini
  mem-backfill `typeId` baris legacy dari relasi `definitionId → ExtensionDefinition.typeId`
  SEBELUM partial unique index dibuat, dengan preflight (instance tanpa definisi valid;
  definition.typeId NULL/tidak resolve ke ExtensionType) dan postflight (backfill lengkap;
  satu-LIVE-instance per workspace/type) yang GAGAL EKSPLISIT dengan pesan
  `PHASE5D_BACKFILL_FAILED: …` — tanpa delete, tanpa auto-pick, tanpa perubahan status
  diam-diam. Terbukti test: legacy 5-B nyata (positif) + 3 skenario negatif.
- `quantity` dibawa apa adanya; tanpa perhitungan kuota (OD-05/06).

### B.3 Shared — `src/lib/licensing/lifecycle-shared.ts` + authz aditif
- Aktor: SYSTEM (internal tepercaya) | USER (sesi dari sumber tepercaya). Tidak ada
  route/API 5-D → client tidak dapat menyuplai SYSTEM; identitas USER kosong ditolak
  fail-closed.
- Otorisasi: permission kanonik AUTHORIZATION_MODEL §4.5/§4.6 (`license.renew.initiate`,
  `extension.assign`, `extension.remove`, `extension.renew.initiate` — ditambahkan ke
  `permissions.ts`, key lama tidak berubah, tidak diikat preset Phase 4). **Remediasi
  PR #4 (Temuan B): jalur `OWNER_FALLBACK_PROPOSED` → ALLOW DIHAPUS dan tidak
  dikembalikan dalam bentuk apa pun — explicit permission only.** Tanpa permission
  eksplisit terdokumentasi (dan grant role/preset yang disahkan — katalog role = OD-122
  OPEN), SEMUA USER actor — TERMASUK role `owner` — ditolak `DENY_PERMISSION_MISSING`
  (default deny; MC §2/§4; REQ-024); kebutuhan keputusan owner dicatat sebagai
  PROPOSED/OPEN (`ownerRatificationStatus`, ADR-025 §6), bukan kebijakan aktif.
  Denial tanpa fallback: non-member/INVITED/SUSPENDED/REMOVED/LEFT/role tak dikenal/
  sesi tidak sah/owner tanpa permission — semuanya teruji.
- Audit: sukses ATOMIK dengan transisi; denial first-class dengan reason code lifecycle
  baru (vocabulary §3 tidak diubah).

### B.4 Konkurensi & idempotensi (ADR-017; keterbatasan jujur)
- Optimistic guard `updateMany` kondisional → `DENY_CONCURRENT_MODIFICATION`; tidak pernah
  silent last-write-wins.
- Idempotensi state-convergence: replay aksi yang sudah teraplikasi = no-op sukses
  teraudit; RENEW replay dengan data berbeda = konflik eksplisit; replay tidak menimpa data.
- **Keterbatasan:** diuji pada SQLite lokal (OD-01 OPEN); database produksi tidak diuji;
  replay-cache fisik menunggu OD-01.

## §C Test baru Phase 5-D — 70 test (54 recovery + 16 remediasi PR #4)

| # | File | Test | Membuktikan |
|---|---|---|---|
| 1 | `tests/unit/license-lifecycle.test.ts` | 12 | Matriks 8 aksi tepat; 48 pasangan fail-closed; EXPIRED→ACTIVE & PURCHASED→DOWNGRADED ditolak; semua status reachable; RENEWAL_DUE terpetakan; efek entitlement hanya-to-ACTIVE; tabel otorisasi: ratifikasi owner = PROPOSED (label keputusan menunggu, bukan jalur otorisasi) |
| 2 | `tests/unit/extension-lifecycle.test.ts` | 8 | Matriks 6 aksi; 49 slot ter-cover; RENEWED tanpa entitlement; REMOVED terminal/logis; LIVE set; tanpa key kanonik = tanpa jalur otorisasi lain |
| 3 | `tests/unit/lifecycle-authorization.test.ts` | 5 | Tabel otorisasi lengkap 14 aksi; key kanonik persis §4.5/§4.6 (nilai tidak berubah); struktur entri terbatas (permission + label ratifikasi PROPOSED + source) — TIDAK ada mekanisme allow lain |
| 4 | `tests/integration/license-lifecycle.test.ts` | 24 | End-to-end ACTIVATE→…→EXPIRED (aktor SYSTEM internal); **remediasi PR #4: owner USER tanpa permission → DENY_PERMISSION_MISSING (keyless + keyed), member/non-member/non-member-keyed/EXPIRED-session ditolak; SYSTEM-allow vs USER-deny membuktikan aktor bukan claim client**; idempotensi; tepat-satu-ACTIVE (service + P2002); verify-only TERM/GRACE; DOWNGRADE data-preservation + engine 5-C mengikuti status; konkurensi; TIDAK ada route HTTP |
| 5 | `tests/integration/extension-lifecycle.test.ts` | 16 | ASSIGN→ACTIVATE→SUSPEND→RENEW→ACTIVATE→EXPIRE→REMOVE (aktor SYSTEM); **remediasi PR #4: owner/member/non-member ditolak tanpa permission; SYSTEM-allow vs USER-deny**; entitlement naik/turun mengikuti status; satu-live-instance (P2002 DB sejak PURCHASED; slot bebas pasca-EXPIRED; type terpisah); definisi non-aktif/rogue-type/typeId-null fail-closed; index 5-D terpasang; REMOVE logis; isolasi tenant teraudit; retry identik no-op tanpa menimpa data |
| 6 | `tests/integration/licensing-migration.test.ts` (5-B era, +5 remediasi) | 13 | **Remediasi PR #4 (Temuan A): POSITIVE — legacy 5-B nyata (instance TANPA kolom typeId) di-backfill dari definition; data utuh; lifecycle mengevaluasi hasil migration; invariant live aktif. NEGATIVE ×3 — orphan instance / definition.typeId tidak resolve / duplikat LIVE per (workspace,type): migration GAGAL EKSPLISIT (`PHASE5D_BACKFILL_FAILED: …`), tanpa delete, tanpa auto-pick, tanpa status change. Struktur migration: ALTER aditif, UPDATE backfill tunggal, tanpa DELETE, DROP hanya helper, backfill SEBELUM unique index, predicate LIVE = persis `EXTENSION_LIVE_STATUSES` |

## §D Regression & gate

| Gate | Command | Hasil |
|---|---|---|
| Full test suite (regression 4/5-B/5-C + 5-D + remediasi) | `bun run test` | **291/291 PASS** (23 file; 221 regresi + 70 baru 5-D) — dijalankan 2× (stabil) |
| Lint | `bun run lint` | exit 0 (0 error, 0 warning) |
| Typecheck | `bun run typecheck` | exit 0 |
| Prisma validate / generate | `prisma validate`, `prisma generate` | valid; client ter-generate |
| Migration konsisten dengan schema | `prisma migrate diff --from-migrations --to-schema-datamodel` | "No difference detected" |
| Migration pada DB disposable (kosong) | `prisma migrate deploy` (DB disposable terpisah) | PASS (3 migration) |
| Migration pada data legacy 5-B nyata | test backfill `licensing-migration.test.ts` §remediasi (POSITIVE + 3 NEGATIVE) | PASS — backfill benar; gagal eksplisit pada data invalid |
| Migration lama tidak tersentuh | test 5-B `licensing-migration.test.ts` (Phase 4, 5-B & lock `git diff --quiet HEAD` = tidak berubah; satu-satunya modifikasi yang sah = migration.sql 5-D oleh remediasi) | PASS |
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

## §G REMEDIASI PR #4 (2026-10-31) — satu commit di atas `cb4fc97`

Tiga temuan review PR #4, diperbaiki minimal dan teruji:

**Temuan A — migration backfill existing data (`ExtensionInstance.typeId`):**
- SEBELUM: migration menambah kolom lalu langsung membuat partial unique index — record
  legacy `ExtensionInstance` berisiko `typeId` NULL (fail-closed lifecycle benar, tetapi
  data valid harus dipertahankan migrasi terlebih dahulu).
- SESUDAH: preflight (instance tanpa definisi; definition.typeId NULL/tidak resolve) →
  backfill aditif dari `definitionId → ExtensionDefinition.typeId` → postflight (backfill
  lengkap; satu-LIVE-instance per (workspace,type)) → index. Kegagalan validasi =
  `RAISE(ABORT, 'PHASE5D_BACKFILL_FAILED: …')` dengan nama check yang teridentifikasi;
  TIDAK ada delete/auto-pick/status change. Migration 4/5-B historis TIDAK disentuh
  (`git diff --quiet HEAD` terhadap kedua direktori diuji test).

**Temuan B — authorization owner fallback:**
- SEBELUM: `OWNER_FALLBACK_PROPOSED` mengizinkan role `owner` (membership ACTIVE) pada
  seluruh aksi lifecycle — policy PROPOSED menghasilkan ALLOW.
- SESUDAH: fallback DIHAPUS dari `authorizeLifecycleAction`; explicit permission only.
  Aksi berkunci kanonik → keputusan policy penuh (saat ini tidak ada preset yang memegang
  key → `DENY_PERMISSION_MISSING`); aksi tanpa key → rantai sesi→tenant→membership tetap
  ditegakkan, lalu `DENY_PERMISSION_MISSING` untuk siapa pun. `ownerRatificationStatus:
  "PROPOSED"` = label kebutuhan keputusan owner (OD-122 OPEN; ADR-025 §6), tidak pernah
  dibaca oleh fungsi otorisasi. `viaOwnerFallback` kini selalu `false` (dipertahankan
  untuk stabilitas skema audit). ADR-025 tetap PROPOSED (tidak di-ACCEPTED-kan).

**Temuan C — koreksi dokumentasi historis:**
- Formulasi "tidak pernah dipush/dipack" pada 6 dokumen dikoreksi: candidate `b687ace`
  PERNAH dibuat dan dipaketkan (bundle + ZIP dengan ukuran/SHA-256 tercatat historis);
  yang akurat adalah branch/artifact tersebut tidak lagi tersedia pada environment saat
  recovery dan tidak ditemukan di GitHub (tanpa bukti push). Nilai hash/ukuran historis
  tidak ditimpa; sejarah recovery dipertahankan.
