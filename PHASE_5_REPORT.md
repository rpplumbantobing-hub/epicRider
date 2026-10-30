# PHASE 5 REPORT — epicRider

## Phase 5-B — Licensing Domain & Database Foundation (FINAL EVIDENCE REPORT)

**Tanggal:** 2026-10-30 · **Task ID:** Phase-5-B · **Otorisasi:** prompt owner Phase 5-B (2026-10-30)

> **VERDICT Phase 5-B: PASS — implementation complete, semua evidence gate lokal PASS.**
> Closure governance menunggu integrasi owner (commit/push/CI pada runner owner — pola Phase 4).
> **Phase 5 secara keseluruhan TIDAK DONE** — 5-C (entitlement engine), 5-D (lifecycle), 5-E
> (checkout/shop) NOT STARTED dan menunggu otorisasi terpisah (MC-V4 §11).
> Status Phase 4 tetap **DONE — CLOSED** (tidak tersentuh). Status Phase 2 tetap **PARTIAL**.

---

### §A Canonical baseline & branch implementasi

| Item | Nilai |
|---|---|
| Canonical baseline commit (ancestor branch) | `8cbc4ef` — main / Phase 4 governance closure (merge PR #2) |
| Branch implementasi | `integration/phase5-b-licensing-domain-db` (base = `8cbc4ef`) |
| Status Git | Perubahan berada pada **working tree branch, BELUM di-commit** — tanpa commit/push/PR/force-push/merge/rebase/reset. Integrasi = keputusan owner. |
| Working tree lain | Bersih selain daftar §C/§H; file owner untracked tidak disentuh; `db dev/produksi` tidak disentuh (semua DB test = SQLite disposable di tmpdir) |
| Catatan provenance | Commit doc-consistency `08709be`/`1049fda` berada pada lini integrasi terpisah (corrective bundle `POST_08709BE`, head `1049fda`) — **tidak** menjadi base branch ini; tidak ada aksi atasnya di 5-B |

### §B Scope yang diimplementasikan (domain/database foundation SAJA)

**8 model fondasi licensing** (Prisma/SQLite, pola Phase 4: String + vocabulary language-neutral DMC §2.9):

| Model | Peran | Sumber kontrak |
|---|---|---|
| `LicenseTier` | Closed set TIGA tier (`MINI_RIDER`/`MAX_RIDER`/`ISO_RIDER`) — CHECK DB-level | MC §2.1/§2.2; DMC §4.4; TESTING.md |
| `License` | Lisensi tier yang dipegang Workspace; histori append-only; tepat satu ACTIVE per workspace (partial unique index) | DMC §3.5/§6.2; ENTITLEMENT_MODEL §2; REQ-098/099 |
| `Capability` | Katalog capability global (10, 1:1 LICENSE_MATRIX §2) | LICENSE_MATRIX §2; DMC §3.5 |
| `CapabilityRule` | Aturan inklusi tier (24 baris: 5/9/10) | LICENSE_MATRIX §2; DMC §3.5 |
| `ExtensionType` | Closed-by-owner list 4 jenis | MC §2/§3; REQ-018; DMC §3.6 |
| `ExtensionDefinition` | Katalog definisi (default `isActive=false` — tidak aktif sebelum disetujui owner) | DMC §3.6; OD-06 |
| `ExtensionInstance` | Extension terprovisi per workspace; lifecycle LICENSE_MATRIX §5 | LICENSE_MATRIX §5; DMC §3.6; REQ-018 |
| `TierQuota` | Definisi kuota per tier — satu-satunya nilai owner: miniRider 5 kru/workspace; `ownerCountedInQuota` NULL (OD-05) | MC §2.1; REQ-009; DMC §8 |

**Vocabulary domain** (`src/lib/licensing/vocabulary.ts`): `LICENSE_TIER_CODES`, `LICENSE_TIER_DISPLAY_NAMES`, `LICENSE_STATUSES` (PURCHASED/ACTIVE/RENEWAL_DUE/EXPIRED/GRACE/DOWNGRADED — DMC §6.2/REQ-098), `EXTENSION_TYPE_CODES`, `EXTENSION_INSTANCE_STATUSES` (LICENSE_MATRIX §5), `CAPABILITY_CODES`, `TIER_CAPABILITY_MATRIX`, konstanta kuota (5 kru; `crew_seats_per_workspace`; `CREW_SEAT`), guard `is*` tanpa normalisasi/fallback.

**Migration aditif** `20261030124013_phase5b_licensing_domain_foundation` (237 baris): 8 CREATE TABLE, indeks (termasuk partial unique `License_workspaceId_active_key … WHERE status='ACTIVE'` — preseden live-membership Phase 4), CHECK `LicenseTier.code IN ('MINI_RIDER','MAX_RIDER','ISO_RIDER')`, seed referensi: 3 tier + 4 extension type + 10 capability + 24 capability rule + 1 TierQuota. **Tanpa** DROP/DELETE/ALTER/UPDATE (UPDATE hanya klausa FK `ON UPDATE CASCADE`).

### §C File yang berubah

Modified (2): `prisma/schema.prisma` (+197/−15), `tests/integration/test-db.ts` (+10/0 — urutan deleteMany licensing child-first).
New (5): `prisma/migrations/20261030124013_phase5b_licensing_domain_foundation/migration.sql` (237), `src/lib/licensing/vocabulary.ts` (149), `tests/unit/licensing-vocabulary.test.ts` (168), `tests/integration/licensing-domain.test.ts` (350), `tests/integration/licensing-migration.test.ts` (418). Detail `git diff --stat` di §H.

### §D Keputusan implementasi (bukan keputusan bisnis baru)

1. **Kode status/tier sebagai String + vocabulary + guard** (bukan enum Prisma) — provider SQLite tidak mendukung enum; pola identik Phase 4 (Membership/Invitation). Status PROPOSED **tidak** dikunci DB; satu-satunya CHECK DB = closed set tier (keputusan owner yang SUDAH ditetapkan MC §2.1).
2. **Tepat satu ACTIVE per workspace** via partial unique index SQL (Prisma tidak deklaratif) — aturan kanonik ENTITLEMENT_MODEL §2; resolusi "current license" runtime = 5-C.
3. **License key TIDAK dimodelkan** — ENTITLEMENT_MODEL.md tidak mendefinisikan license key sehingga tidak ada dasar kontrak; kebutuhan hash-storage (jika owner menghendaki) = item keputusan/ratifikasi owner, bukan karangan 5-B.
4. **EntitlementGrant/Seat TIDAK dimodelkan** (runtime 5-C; DMC §3.5) — tidak mengarang mekanika enforcement/seat counting (OD-05).
5. **`purchasedAt`/term/window hanya struktur, tidak diisi** — issuance = 5-D; durasi = OD-108. **Tidak ada** harga/source issuance (OD-06). `sourceType/sourceRef` hanya referensi netral.
6. **Seed referensi di dalam migration** — satu unit atomik aditif; hanya nilai bersumber dokumen owner; tanpa definisi extension produk.

### §E Hasil 3 test baru — 32/32 PASS

| # | File (framework: vitest, env node; DB = hasil `prisma migrate deploy`, SQLite disposable) | Test | Membuktikan |
|---|---|---|---|
| 1 | `tests/unit/licensing-vocabulary.test.ts` | 11 | **(A)** Valid tier = persis `MINI_RIDER`,`MAX_RIDER`,`ISO_RIDER`; `HI_RIDER`/`TOTAL_RIDER`/varian casing ditolak — **tanpa silent fallback** (guard + tanpa kunci fallback di matriks/display); status/lifecycle/matriks persis DMC §6.2, LICENSE_MATRIX §2/§5, REQ-018; kuota miniRider = 5 (MC §2.1), OD-05 tidak dijawab; **kode language-neutral & konsisten** (upper/lower-snake, ASCII, tanpa spasi — DMC §2.9) |
| 2 | `tests/integration/licensing-domain.test.ts` | 13 | **(B)** License terhubung ke Workspace Phase 4 yang benar (relasi dua arah; FK P2003 untuk target tak ada); **tepat satu ACTIVE per workspace** (P2002 `License_workspaceId_active_key` dibaca dari domain layer); histori non-ACTIVE tetap tersimpan + slot ACTIVE bebas setelah status turun (semantik partial index — data-level); onDelete Restrict (REQ-099 — tidak terhapus cascade); CHECK menolak `HI_RIDER`/`TOTAL_RIDER` tanpa baris fallback; unique katalog CapabilityRule/TierQuota; seed referensi = vocabulary (3 tier, 10 capability, 24 rule 5/9/10, 4 type, kuota 5 + ownerCountedInQuota NULL, 0 ExtensionDefinition, `isActive=false`); **DMMF: himpunan model persis 11 Phase 4 + 8 fondasi — tidak ada sistem Identity/Membership/Role/Authorization baru, tidak ada duplikasi**; lifecycle Phase 4 co-exist dengan lisensi |
| 3 | `tests/integration/licensing-migration.test.ts` | 8 | **(C)** DB dimulai sebagai representasi Phase 4 (deploy migration Phase 4 + data representatif: user, 2 workspace, 3 membership termasuk histori REMOVED, role, assignment, undangan, audit) → **migration Phase 5-B diterapkan TANPA reset** → `_prisma_migrations` tepat 2 baris berurutan; **data Phase 4 tetap utuh** (snapshot per baris identik); **constraint 5-B aktif** (single-ACTIVE P2002 + CHECK HI_RIDER) di atas data itu; **seed/reference tersedia**; deploy ketiga **idempoten**; SQL migration **aditif-only** (hanya CREATE TABLE×8/INDEX/INSERT katalog×5; tanpa DROP/DELETE/ALTER; UPDATE = klausa FK saja); **file migration Phase 4 & lock tidak berubah vs HEAD** (git diff --quiet) dan `git status prisma/migrations` hanya menampilkan tambahan untracked 5-B; alur **tanpa `db:push --accept-data-loss`** (semua via `migrate deploy`; `_prisma_migrations` tercatat) |

### §F Hasil regression — 145/145 PASS (16 file)

`bun run test` (vitest run) exit 0. Komposisi: **113 existing Phase 4** (13 file: unit auth-config/otp-domain/rate-limiter/authz-policy/i18n; integration workspace-membership/tenant-isolation/invitation/session-lifecycle/otp-whatsapp/http-routing; components foundation/i18n-switcher) + **32 baru Phase 5-B** (3 file). **Tidak ada regresi** — seluruh suite existing lulus tanpa perubahan kode Phase 4 (kecuali +10 baris helper test-db untuk deleteMany licensing; perilaku Phase 4 tidak berubah).

### §G Evidence gate lengkap (command aktual + exit code)

| # | Gate | Command | Exit | Hasil |
|---|---|---|---|---|
| 1 | 3 test baru | `node_modules/.bin/vitest run tests/unit/licensing-vocabulary.test.ts tests/integration/licensing-domain.test.ts tests/integration/licensing-migration.test.ts` | 0 | 32/32 (3 file) |
| 2 | Full suite | `bun run test` | 0 | **145/145** (16 file; 113 + 32) |
| 3a | Schema validation | `node_modules/.bin/prisma validate` (DATABASE_URL → tmp) | 0 | "schema is valid" |
| 3b | Client generate | `node_modules/.bin/prisma generate` | 0 | Prisma Client v6.19.2 (node_modules lokal) |
| 4a | Migration deploy (DB kosong baru) | `node_modules/.bin/prisma migrate deploy` | 0 | 2 migration ter-aplikasi berurutan |
| 4b | Drift migrations ⇔ schema | `node_modules/.bin/prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url file:… --exit-code` | 0 | "No difference detected." |
| 4c | Migration status | `node_modules/.bin/prisma migrate status` | 0 | "Database schema is up to date!" |
| 5 | Lint | `bun run lint` (eslint .) | 0 | tanpa error |
| 6 | Typecheck | `bun run typecheck` (tsc --noEmit) | 0 | tanpa error |
| 7 | Production build | `NEXTAUTH_SECRET=phase5b-build-placeholder bun run build` (workspace produk terisolasi — preseden Phase 4 R2) | 0 | 23 route (tanpa route baru); placeholder build-time fail-safe by design |
| 8 | git diff | `git diff HEAD` / `git status --porcelain -b` | 0 | hanya §C (lihat §H) |
| 9 | git diff --stat | `git diff --stat HEAD` | 0 | 2 file, +207/−15 |
| 10 | Daftar file berubah | `git diff --name-only HEAD` + `git ls-files --others --exclude-standard` | 0 | §H |

**Prinsip alat:** seluruh Prisma/vitest/eslint/tsc/next dipanggil dari **node_modules project lokal** (tanpa global cache/package Prisma lain). Semua DB test = SQLite disposable tmpdir; DB dev/produksi tidak disentuh; tanpa `prisma migrate reset`; tanpa `db:push`.

### §H git diff --stat & daftar file berubah

```text
 prisma/schema.prisma         | 212 ++++++++++++++++++++++++++++++++++++++++---
 tests/integration/test-db.ts |  10 ++
 2 files changed, 207 insertions(+), 15 deletions(-)

Untracked (baru):
 prisma/migrations/20261030124013_phase5b_licensing_domain_foundation/migration.sql
 src/lib/licensing/vocabulary.ts
 tests/unit/licensing-vocabulary.test.ts
 tests/integration/licensing-domain.test.ts
 tests/integration/licensing-migration.test.ts

Dokumen (baru): PHASE_5_REPORT.md, PHASE_5_TRACEABILITY.md, PHASE_5_ACCEPTANCE.md,
adr/ADR-023-phase5b-licensing-domain-foundation.md
Dokumen (modified): PHASE_STATUS.md, ROADMAP.md, TESTING.md, worklog.md
```

**Catatan koreksi:** `next build` menambahkan `.next/dev/dev/types/**/*.ts` ke `include` `tsconfig.json` (efek samping tooling otomatis, bukan perubahan 5-B) — **dikembalikan ke HEAD** (`git restore tsconfig.json`) dan lint/typecheck diverifikasi ulang (exit 0).

### §I Database invariants (fase 5-B)

1. `LicenseTier.code ∈ {MINI_RIDER, MAX_RIDER, ISO_RIDER}` — CHECK DB-level; tier keempat (termasuk `HI_RIDER`/`TOTAL_RIDER`) **mustahil** di-insert (teruji).
2. Tepat satu `License` berstatus `ACTIVE` per workspace — partial unique index `License_workspaceId_active_key … WHERE status='ACTIVE'`; baris histori status lain tidak dibatasi (append-only).
3. FK Restrict: `License→Workspace`, `License→LicenseTier`, `ExtensionInstance→Workspace`, `ExtensionInstance→ExtensionDefinition`, `CapabilityRule→Capability`, `CapabilityRule→LicenseTier`, `TierQuota→LicenseTier`, `ExtensionDefinition→ExtensionType` — histori/operasional tidak ikut terhapus cascade (REQ-099; DMC §2.3).
4. Unique kode referensi: `LicenseTier.code`, `Capability.code`, `ExtensionType.code`, `ExtensionDefinition.code`.
5. Unique katalog: `CapabilityRule(capabilityId, tierId)`; `TierQuota(tierId, quotaCode)`.
6. Index akses: `License(workspaceId,status)`, `License(tierId)`, `License(status,termEndsAt)`, `ExtensionInstance(workspaceId,status)`, `ExtensionInstance(definitionId)`, `ExtensionInstance(status,termEndsAt)`, `TierQuota(tierId,status)`, `CapabilityRule(capabilityId,status)`, `ExtensionDefinition(typeId,isActive)` + index Phase 4 eksisting tidak berubah.
7. FK Phase 4 tidak berubah; tidak ada kolom/tabel Phase 4 yang dimodifikasi (migrate diff "No difference detected").

### §J Keputusan owner yang tetap OPEN (tidak dikunci oleh 5-B)

| OD | Isu | Cara 5-B menjaga keterbukaan |
|---|---|---|
| **OD-05** | Owner dihitung sebagai seat / final seat counting | `TierQuota.ownerCountedInQuota` **NULL** (bukan false/true); tidak ada konstanta jawaban di vocabulary; tidak ada model Seat |
| **OD-06** | Harga/gateway/checkout/invoice/charging | Tidak ada field harga; `ExtensionDefinition.isActive=false` default; 0 definisi produk; tidak ada kode issuance |
| **OD-108** | Expiry/grace/downgrade: durasi & kebijakan | Term/window hanya kolom struktur (semua NULL); tidak ada mekanika transisi/auto-convert/penghapusan; status vocabulary hanya struktur |

Item ratifikasi owner tambahan (konsekuensi terdokumentasi, bukan keputusan baru): (a) kebutuhan **license key** (jika dikehendaki — saat ini tidak dimodelkan, §D.3); (b) **ADR-023** berstatus PROPOSED menunggu ratifikasi (pola ADR-022).

### §K Residual risk & limitations

1. **Bukan runtime:** tidak ada entitlement engine, tidak ada evaluasi akses, tidak ada issuance/lifecycle/checkout — 5-B hanya fondasi data; REQ-024/026 belum terpenuhi fungsional (5-C).
2. **Belum ter-integrasi:** perubahan pada working tree branch (belum commit/push); CI owner belum berjalan atas 5-B — closure menunggu integrasi owner.
3. Vocabulary status (PURCHASED/…/DOWNGRADED) = PROPOSED (DMC §6.2) sampai ratifikasi owner; hanya closed set tier yang dikunci DB.
4. SQLite (dev) — produksi = ADR-006 (database lain; partial index/CHECK per re-review di engine produksi).
5. Test coverage 5-B = level domain/integration SQLite disposable; belum ada test UI/API HTTP untuk licensing (bukan scope 5-B).
6. Sesi ini berjalan pada workspace produk terisolasi; delivery-surface platform (repo `/home/z/my-project`) tidak diubah.

### §L Traceability (ringkas — lengkap di `PHASE_5_TRACEABILITY.md`)

REQ-002/018/024/026/029/098/099 → kontribusi 5-B + bukti test. Sumber owner: MC §2.1/§2.2/§12; DMC §2.3/§2.9/§3.5/§3.6/§4.4/§6.2/§8; LICENSE_MATRIX §1/§2/§5; ENTITLEMENT_MODEL §2/§4/§7; TESTING.md (invariants); ADR-011/ADR-014 (konteks); preseden teknis ADR-008..010/022.

### §M Status & langkah berikutnya

- **Phase 5-B: PASS (implementation complete)** — status fase Phase 5 = **IN PROGRESS** (5-B terimplementasi; closure menunggu integrasi owner; 5-C/D/E NOT STARTED).
- Next action owner: review bukti → integrasi branch (commit/push) → CI runner owner → penilaian status sesuai kontrol (pola Phase 4).
- **Dilarang oleh prompt ini (dihormati):** memulai 5-C/D/E; UI/checkout/payment; keputusan harga; OD-05/OD-06/OD-108.

### §N Koreksi selama eksekusi gate (semua defect test baru — bukan baseline)

1. DMMF relation field kind = `"object"` (bukan `"relation"`) — 1 asersi diperbaiki.
2. Akses `r.tier` nullable (`CapabilityRule.tier?`) → optional chaining — 2 file.
3. Efek samping `next build` pada `tsconfig.json` → dikembalikan ke HEAD (§H).
Suite existing (113) tidak pernah gagal selama eksekusi; tidak ada perubahan pada kode/migration Phase 4.
