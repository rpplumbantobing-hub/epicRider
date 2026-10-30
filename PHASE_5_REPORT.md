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

---

## Phase 5-C — Entitlement Engine & Enforcement (FINAL EVIDENCE REPORT)

**Tanggal:** 2026-10-30 · **Task ID:** Phase-5-C · **Otorisasi:** prompt owner Phase 5-C (2026-10-30)

> **VERDICT Phase 5-C: PASS — implementation complete, seluruh evidence gate lokal PASS.**
> Status: `PHASE_5C_STATUS = IMPLEMENTATION PASS — LOCAL CANDIDATE — NOT INTEGRATED`.
> **TIDAK** `PHASE_5C_DONE_CLOSED` — belum melalui integration/CI gate (pola Phase 4; MC-V4 §11).
> `PHASE_5B_STATUS = IMPLEMENTATION PASS — COMMITTED LOCALLY — NOT INTEGRATED` (tidak berubah).
> Canonical `origin/main = 8cbc4ef` (tidak diubah). Phase 4 tetap **DONE — CLOSED**; Phase 2 tetap **PARTIAL**.

### §5C-A Baseline

| Item | Nilai |
|---|---|
| Baseline implementasi lokal | `20a0169f1c6ce69013a2d1334c7324dd24edef4f` — `feat(licensing): add phase 5b domain and database foundation` (parent `8cbc4ef`) |
| Branch | `integration/phase5-b-licensing-domain-db` (lanjutan di atas commit 5-B — 5-B TIDAK di-reset/rebase) |
| Canonical `origin/main` | `8cbc4ef` (diverifikasi ulang via ls-remote; tidak diubah oleh 5-C) |
| Working tree awal 5-C | Clean di `20a0169` (verifikasi sebelum coding) |

### §5C-B Scope yang diimplementasikan (engine + enforcement SAJA)

| Komponen | Peran | Sumber kontrak |
|---|---|---|
| `src/lib/licensing/entitlement.ts` | **Evaluator MURNI** (tanpa I/O/timestamp/random) — deterministic, fail-closed; objek keputusan `EntitlementDecision` (`ALLOWED/DENIED`, `kind` = `GRANTED/POLICY_DENIAL/UNKNOWN/SYSTEM_ERROR`, reason code, evidence) | MC §2 formula + ENTITLEMENT_MODEL §3 (short-circuit deny, additive, gating vs granting, never UI-derived, deny-by-default); prompt owner §6/§9 |
| `src/lib/licensing/entitlement-service.ts` | Resolusi fakta dari DB (pola Phase 4: guards + evaluator murni); audit keputusan; **titik integrasi Entitlement × Authorization** (`authorizeWorkspaceCapability` — entitlement meng-gate, policy Phase 4 menilai aktor; keduanya terpisah dalam hasil) | AUTHORIZATION_MODEL §2/§3; ENTITLEMENT_MODEL §3.4/§10; prompt owner §7/§12 |
| Wiring `src/lib/authz/policy.ts` | **Aditif-minimal**: input entitlement yang sejak Phase 4 DIDEKLARASI kini DIEVALUASI (`tierActive=false` → `DENY_TIER_ENTITLEMENT_MISSING`; extension disyaratkan tidak aktif → `DENY_EXTENSION_MISSING`; input absen = perilaku Phase 4 tidak berubah) | Komentar file policy Phase 4 ("evaluasi = Phase 5"); ADR-010; ADR-024 |
| Audit `LICENSE` category | Kategori audit baru (aditif) + penulisan `entitlement.denied`/`entitlement.granted` via `logAudit` Phase 4 (sanitizer dihormati; denial = first-class) | ENTITLEMENT_MODEL §10; REQ-024; DMC §3.14 |
| Test 5-C | 76 test baru (unit 52 + integration 24) | Prompt owner §14 |

**TIDAK diimplementasikan (sesuai batas):** billing/checkout/payment/pricing; UI licensing; lifecycle
renewal/expiry/grace/downgrade (5-D; OD-108); extension lifecycle (5-D); enforcement kuota seat
(OD-05 — `DENY_QUOTA_EXCEEDED` tetap tidak dievaluasi; `TierQuota` tidak dikonsumsi engine);
issuance (5-E; OD-06); API HTTP baru / route baru (eksposur API = 5-E); Phase 6+.

### §5C-C File yang berubah (5-C saja, di atas `20a0169`)

New (5): `src/lib/licensing/entitlement.ts` (374), `src/lib/licensing/entitlement-service.ts` (283),
`tests/unit/entitlement-engine.test.ts`, `tests/integration/entitlement-domain.test.ts`,
`adr/ADR-024-phase5c-entitlement-engine.md`.
Modified (3): `src/lib/authz/policy.ts` (evaluasi input entitlement — aditif), `src/lib/audit/audit-service.ts`
(+kategori `LICENSE` — aditif), `tests/integration/licensing-migration.test.ts` (perbaikan asumsi state
pasca-commit — lihat §5C-N).
Dokumen: PHASE_5_REPORT/TRACEABILITY/ACCEPTANCE, PHASE_STATUS, ROADMAP, TESTING, worklog.

**Tanpa perubahan schema/migration:** `prisma/schema.prisma` dan `prisma/migrations/**` **identik vs
`20a0169`** (`git diff --quiet HEAD` exit 0 pada kedua path) — engine murni kode di atas fondasi 5-B;
tidak ada migration baru, tidak ada `db:push`, tidak ada `migrate reset`.

### §5C-D Keputusan implementasi (bukan keputusan bisnis baru) — ringkasan ADR-024

1. **Pola evaluator murni + service guards** (identik pola authz Phase 4) — keputusan DETERMINISTIK:
   fakta sama → keputusan sama (tanpa timestamp di objek keputusan; audit menambahkan `occurredAt`).
2. **Reason code**: 3 kode kanonik AUTHORIZATION_MODEL §3 kini DIEVALUASI (`DENY_TIER_ENTITLEMENT_MISSING`,
   `DENY_LICENSE_STATE`, `DENY_EXTENSION_MISSING`) + 6 kode tambahan 5-C terdokumentasi
   (`DENY_NO_ACTIVE_LICENSE`, `DENY_CAPABILITY_DISABLED`, `DENY_UNKNOWN_CAPABILITY`, `DENY_INVALID_TIER`,
   `DENY_WORKSPACE_CONTEXT_INVALID`, `ENTITLEMENT_UNEVALUABLE_INPUT`). Vocabulary kanonik Phase 4
   **tidak diubah**; kode `DENY_QUOTA_EXCEEDED` (OD-05) dan `DENY_STORE_TIER` (Phase 11) tetap deklarasi.
3. **Tiga bentuk deny terbedakan** — `POLICY_DENIAL` (jawaban policy atas fakta valid) vs `UNKNOWN`
   (capability tidak dikenal) vs `SYSTEM_ERROR` (drift katalog/vocabulary, invariant breach, input
   invalid) — semuanya DENIED (fail closed), tidak ada fallback "unknown → allow" (prompt owner §9).
4. **Sumber entitlement = license status `ACTIVE` saja** (`ACTIVE_LICENSE_STATUS` vocabulary 5-B) —
   state lain (PURCHASED/RENEWAL_DUE/EXPIRED/GRACE/DOWNGRADED/status tak dikenal) → `DENY_LICENSE_STATE`
   deterministik. **Tidak ada** semantik expiry/grace/downgrade baru (OD-108 OPEN); engine mengikuti
   STATUS DATA, bukan membangun transisi.
5. **Konsistensi matriks DB↔vocabulary divalidasi runtime** — rule DB yang melebihi matriks
   LICENSE_MATRIX §2, atau matriks yang mengharuskan grant tanpa rule DB, = `SYSTEM_ERROR` fail closed
   (invariant "seed = vocabulary" kini dijaga di runtime, bukan hanya test).
6. **Extension-aware tanpa lifecycle**: parameter opsional `requiredExtensionType` (closed list owner
   MC §2/§3); instance status ACTIVE yang berkontribusi (LICENSE_MATRIX §5); condition-per-rule di
   schema = 5-D (tidak dikarang).
7. **Integrasi authorization dua arah yang terpisah**: (a) policy Phase 4 mengevaluasi input entitlement
   bila disediakan (entitlement hanya MEMBATASI); (b) `authorizeWorkspaceCapability` menyelesaikan
   entitlement → bila DENIED, short-circuit SEBELUM policy aktor (owner pun tidak lolos) → bila ALLOWED,
   membership/role/permission tetap dinilai policy (deny-by-default tetap berlaku). Hasil memuat KEDUA
   lapisan terpisah (`entitlement`, `authorization`, `final`) — entitlement ≠ authorization.
8. **Membership/role/fakta sesi dari sumber tepercaya server** — status membership di luar vocabulary
   diperlakukan fail-closed (bukan "lanjutkan"); client tidak pernah menjadi sumber keputusan.

### §5C-E Hasil test baru Phase 5-C — 76/76 PASS

| # | File | Test | Membuktikan (prompt owner §14) |
|---|---|---|---|
| 1 | `tests/unit/entitlement-engine.test.ts` | 52 | Matriks LICENSE_MATRIX §2 penuh (3 tier × 10 capability, 24 grant + 6 deny per kombinasi); `HI_RIDER`/`TOTAL_RIDER` → `DENY_INVALID_TIER` fail closed; tier non-aktif → `DENY_LICENSE_STATE`; capability allowed/denied/unknown/disabled terbedakan (`kind`); state lisensi no-license/non-ACTIVE/ACTIVE; fail closed (invariant breach >1 ACTIVE, drift seed, input extension invalid); konteks workspace invalid; extension missing/present; **determinisme** (deep-equal dua evaluasi); wiring policy (entitlement membatasi, input absen = perilaku Phase 4 utuh) |
| 2 | `tests/integration/entitlement-domain.test.ts` | 24 | Di atas DB hasil migration: evaluasi per-tier dari seed (`MINI_RIDER` core ALLOWED + evidence licenseId/tierCode/ruleId; crm DENIED; `MAX_RIDER` crm ALLOWED/ims DENIED; `ISO_RIDER` ims ALLOWED); state lisensi (no license; PURCHASED; histori EXPIRED + ACTIVE tetap ALLOWED; rotasi DOWNGRADED→DENY lalu lisensi ACTIVE baru→ALLOWED **tanpa kehilangan data** — semangat REQ-002/REQ-099); status korup via SQL → DENY deterministik tanpa crash; **isolasi workspace** (A tidak mewarisi license ISO milik B; extension instance B tidak menghitung untuk A); extension-aware (ACTIVE → ALLOWED + evidence; SUSPENDED → DENY); **pemisahan authorization** (entitlement ALLOWED + member tanpa permission → `DENY_PERMISSION_MISSING`; non-member → `DENY_NOT_MEMBER`; entitlement DENIED short-circuit bahkan untuk owner; sesi ABSENT → `DENY_NO_SESSION`); fail closed di DB nyata (unknown capability; extension type di luar closed list; CHECK HI_RIDER/TOTAL_RIDER tetap menolak); **audit evidence** (denial = category LICENSE/outcome DENIED/reasonCode; grant = snapshot evidence; `audit=false` opt-out) |

### §5C-F Hasil regression — 221/221 PASS (18 file)

`vitest run` exit 0. Komposisi: **145 baseline** (113 Phase 4 + 32 Phase 5-B) + **76 baru Phase 5-C**.
**Tidak ada regresi** — seluruh suite Phase 4 dan 5-B lulus; perilaku Phase 4 policy tidak berubah bila
input entitlement tidak disediakan (terbukti test unit + 113 regresi existing green).

### §5C-G Evidence gate lengkap (command aktual + exit code)

| # | Gate | Command | Exit | Hasil |
|---|---|---|---|---|
| 1 | Test 5-C | `vitest run tests/unit/entitlement-engine.test.ts tests/integration/entitlement-domain.test.ts` | 0 | 76/76 (2 file) |
| 2 | Full suite | `vitest run` | 0 | **221/221** (18 file; 145 + 76) |
| 3a | Schema validation | `prisma validate` (DATABASE_URL → tmp) | 0 | "schema is valid" |
| 3b | Client generate | `prisma generate` | 0 | Prisma Client v6.19.2 (node_modules lokal) |
| 4a | Migration deploy (DB kosong) | `prisma migrate deploy` | 0 | 2 migration ter-aplikasi |
| 4b | Drift migrations ⇔ schema | `prisma migrate diff --exit-code …` | 0 | "No difference detected." |
| 4c | Migration status | `prisma migrate status` | 0 | "Database schema is up to date!" |
| 5 | Lint | `eslint .` | 0 | tanpa error |
| 6 | Typecheck | `tsc --noEmit` | 0 | tanpa error |
| 7 | Production build | `NEXTAUTH_SECRET=… bun run build` (placeholder build-time — preseden Phase 4 R2) | 0 | sukses; `tsconfig.json` tidak berubah (diverifikasi) |
| 8 | Phase 4 & 5-B utuh | `git diff --quiet HEAD -- prisma/migrations/<phase4>` ; `-- prisma/schema.prisma` | 0 | Phase 4 migration & schema **tidak berubah** vs `20a0169` |

**Prinsip alat:** seluruh vitest/prisma/eslint/tsc/next dari node_modules project lokal; DB test =
SQLite disposable tmpdir; DB dev/produksi tidak disentuh; tanpa `migrate reset`; tanpa `db:push`.

### §5C-H git status (5-C)

```text
 M src/lib/audit/audit-service.ts        (+3 — kategori LICENSE)
 M src/lib/authz/policy.ts               (evaluasi input entitlement — aditif)
 M tests/integration/licensing-migration.test.ts (asumsi state pasca-commit — §5C-N)
 ?? src/lib/licensing/entitlement.ts
 ?? src/lib/licensing/entitlement-service.ts
 ?? tests/unit/entitlement-engine.test.ts
 ?? tests/integration/entitlement-domain.test.ts
 ?? adr/ADR-024-phase5c-entitlement-engine.md
 (+ dokumen: PHASE_5_*, PHASE_STATUS, ROADMAP, TESTING, worklog)
```

### §5C-I Enforcement points (server-side authoritative)

1. `resolveWorkspaceCapabilityEntitlement` — resolusi entitlement capability per workspace (server-only).
2. `authorizeWorkspaceCapability` — enforcement gabungan entitlement → authorization (integrasion point
   untuk seluruh endpoint tier-gated; kontrak stabil untuk pemakaian 5-E tanpa mengubah semantik).
3. Policy Phase 4 (`evaluatePolicy`) — input entitlement kini menyokong deny kanonik di rantai aktor.
4. Audit — setiap keputusan entitlement (deny first-class + grant snapshot) via audit-service Phase 4.
Client/UI tidak pernah menjadi sumber kebenaran (tidak ada kode entitlement di sisi client).

### §5C-J Keputusan owner yang tetap OPEN (tidak dikunci oleh 5-C)

| OD | Isu | Cara 5-C menjaga keterbukaan |
|---|---|---|
| **OD-05** | Owner dihitung sebagai seat / final counting | Engine TIDAK mengonsumsi `TierQuota`; tidak ada perhitungan seat/owner; `DENY_QUOTA_EXCEEDED` tetap tidak dievaluasi |
| **OD-06** | Harga/billing/checkout/issuance | Tidak ada kode komersial; extension hanya input status instance; tidak ada issuance/purchase |
| **OD-108** | Expiry/grace/downgrade | Engine hanya membaca status data (ACTIVE vs bukan); tidak ada transisi/durasi/auto-downgrade; semua state non-ACTIVE → deny deterministik tanpa memilih kebijakan |

### §5C-K Residual risk & limitations

1. **Belum ter-integrasi**: kandidat lokal di atas commit 5-B yang juga belum ter-integrasi; CI owner
   belum berjalan atas 5-B/5-C. Closure = setelah push/PR/CI/merge oleh owner (pola Phase 4).
2. Tanpa eksposur HTTP/API/UI — pemakaian enforcement oleh endpoint nyata = 5-E (kontrak service sudah
   tersedia dan teruji).
3. Extension-aware evaluation hanya via parameter pemanggil (`requiredExtensionType`); kondisi
   extension di `CapabilityRule` (schema) = 5-D bila dikehendaki owner.
4. Snapshot evidence audit tersimpan di `metadataJson` (retensi/akses = OD-138 OPEN).
5. SQLite dev; produksi = ADR-006 (partial index/CHECK re-review engine produksi).
6. Vocabulary status PROPOSED (DMC §6.2) sampai ratifikasi owner; hanya closed set tier yang dikunci DB.

### §5C-L Traceability (ringkas — detail di `PHASE_5_TRACEABILITY.md`)

REQ-024 (entitlement server-side) → engine + enforcement + audit; REQ-026 (permission memeriksa
lisensi) → input entitlement pada policy + integrasi `authorizeWorkspaceCapability`; REQ-002 (kontinuitas
data lintas tier) → rotasi status diuji tanpa kehilangan akses data; REQ-098/099 → status sebagai sumber
entitlement tanpa memaksa kebijakan (OD-108); REQ-023 (isolasi tenant) → isolasi license/extension per
workspace diuji. Sumber: MC §2; ENTITLEMENT_MODEL §3/§4/§7/§10; AUTHORIZATION_MODEL §2/§3; LICENSE_MATRIX §2/§5; ADR-010/ADR-011/ADR-023.

### §5C-M Status

- **Phase 5-C: IMPLEMENTATION PASS — LOCAL CANDIDATE — NOT INTEGRATED.**
- Phase 5 keseluruhan tetap IN PROGRESS; 5-D/5-E NOT STARTED; tidak ada klaim DONE—CLOSED.
- Next action owner: review bukti → integrasi (push/PR/CI) untuk 5-B+5-C bersama → penilaian closure.

### §5C-N Koreksi selama eksekusi (transparan)

1. **Test baseline 5-B** `licensing-migration.test.ts` mengasumsikan changeset 5-B masih untracked
   (state pra-commit); setelah 5-B di-commit (`20a0169`) asersi "≥1 baris untracked" tidak berlaku lagi.
   **Perbaikan minimal** (intent anti-destruktif dipertahankan penuh): baris apa pun pada
   `git status prisma/migrations` wajib tambahan untracked milik 5-B; tree bersih sah pada state
   pasca-commit; migration 5-B wajib ter-track ATAU untracked. Kode/migration produksi tidak tersentuh.
2. Dua test 5-C diperbaiki selama penulisan (defect test, bukan engine): skenario rule-absen untuk
   `DENY_TIER_ENTITLEMENT_MISSING` memakai capability di luar matriks tier; skenario rotasi status
   lisensi melengkapi langkah penurunan status sebelum evaluasi.
3. Key metadata audit memakai nama aman-sanitizer (`tier`, bukan `tierCode`) — regex redaksi Phase 4.
