# PHASE 5E REPORT — epicRider — Commerce Foundation (License & Extension Shop)

> **Status jujur:** fondasi commerce domain/backend TERIMPLEMENTASI pada working tree
> (BELUM commit — owner satu-satunya pihak yang melakukan git write operation; pola
> 5-B/5-C/5-D). Seluruh gate lokal PASS. **Phase 5 secara keseluruhan TETAP IN PROGRESS**
> — tidak ada klaim "Phase 5 COMPLETE". Komersial produksi (harga/charging/gateway/UI)
> tetap BLOCKED oleh OD-06/OD-133/OD-135 dan pengalaman commerce = Phase 22.
> ADR-026 **PROPOSED** (menunggu ratifikasi owner).

---

## §A Canonical baseline

| Item | Nilai |
|---|---|
| Repository canonical | `https://github.com/rpplumbantobing-hub/epicRider.git` (clone lokal fresh) |
| HEAD awal pekerjaan | `aafcbe39e54a8f4078679e20f63696d103d7b34e` (`aafcbe3`) — diverifikasi `git rev-parse HEAD` |
| Branch | `main` (`git branch --show-current`) — `origin/main` identik setelah `git fetch` |
| Parent chain terverifikasi | `165b3ba` (5-B+5-C, merge PR #3) → `cb4fc97` (5-D recovery) → `6c2e0d1` (5-D remediation) → `aafcbe3` (merge PR #4) — `git log --oneline --decorate` |
| Working tree | MODIFIED by Phase 5-E (uncommitted; daftar lengkap §D dan §O) — TIDAK ada commit/push/PR/merge |
| Baseline regression awal | **291/291 PASS** (dijalankan ulang di environment ini sebelum perubahan apa pun; cocok dengan `PHASE_5D_REPORT.md` §G) |

## §B Phase reuse verification (TANPA duplikasi)

| Fase | Yang di-reuse (bukti file) | Bukti tidak duplikasi |
|---|---|---|
| 5-B | `License`/`ExtensionInstance` kolom `sourceType`/`sourceRef` dipakai issuance (`src/lib/shop/issuance.ts` — diisi, bukan dibuat ulang); `LicenseTier`/`ExtensionDefinition` jadi target katalog shop lewat FK (tanpa model duplikat); vocabulary `EXTENSION_TYPE_CODES` dipakai eligibility (`src/lib/shop/eligibility.ts`) | Model inventory test (`tests/integration/shop-surface-isolation.test.ts`): hanya 3 model Shop* baru; `LicenseTier`/`ExtensionDefinition` tetap satu-satunya definisi katalog licensing |
| 5-C | Engine entitlement (`src/lib/licensing/entitlement.ts` + `entitlement-service.ts`) dipakai langsung test boundary (issuance PURCHASED → engine MENOLAK; setelah ACTIVATE 5-D → engine ALLOW) | TIDAK ada evaluator/entitlement service baru di `src/lib/shop/` (grep: tidak ada evaluasi entitlement di modul shop) |
| 5-D | Rantai otorisasi `authorizeLifecycleAction` + `resolveLifecycleActorFacts` dipakai-ulang penuh oleh `src/lib/shop/authorization.ts` (satu ekspor helper + pelebaran tipe param tak-terpakai — perilaku identik, terbukti 291 regresi tetap hijau); `EXTENSION_LIVE_STATUSES` dipakai eligibility; invariant DB satu-LIVE dipakai issuance (P2002 → denial teraudit) | TIDAK ada mesin transisi lifecycle kedua; shop TIDAK mengekspor fungsi transisi ACTIVE (diuji structural `shop-surface-isolation.test.ts`) |

## §C Governance reconciliation

1. **DMC §3.12a** — terkonfirmasi MISSING sebelum pekerjaan: section tidak ada, sementara 3 rujukan menunjuknya (DMC §3.12 tenant boundary, DMC §4.6, `PHASE_2_TRACEABILITY.md` baris REQ-030). **Direkonsiliasi:** §3.12a DIBUAT minimal, mendokumentasikan entity family yang benar-benar diimplementasi (ShopProduct/ShopOrderIntent/ShopOrderIntentLine) sesuai kontrak ARCHITECTURE.md §7 + ADR-018 Decision 4/5 + ENTITLEMENT_MODEL §8 — tanpa mengarang entity tambahan.
2. **`EntitlementGrant` divergence** — terkonfirmasi: DMC §3.5 mendefinisikannya konseptual; implementasi 5-B/5-C/5-D tidak pernah membuat tabelnya dan engine 5-C membaca License/ExtensionInstance langsung. **Direkonsiliasi (keputusan default prompt §7: NO NEW ENTITLEMENTGRANT TABLE):** anotasi rekonsiliasi ditambahkan ke DMC §3.5 — baris konseptual dipertahankan sebagai riwayat, dinyatakan obsolete terhadap implementasi; relasi konseptual ke `StoreOrder` tidak lagi menggambarkan implementasi. TIDAK ada alasan arsitektural yang ditemukan untuk mempertahankannya sebagai tabel (akan menjadi second source of truth).
3. **Boundary Phase 5-E / Phase 22** — terkonfirmasi dari ROADMAP: Phase 22 = "Public landing, Developer Portal, license/extension shop, notification governance" (ADR-018; OD-06/OD-101/OD-102). Phase 5-E = domain/backend foundation SAJA: TANPA UI, TANPA route HTTP, TANPA checkout production, TANPA payment. Jalur publik first-license buyer (tanpa workspace/account) adalah pengalaman Phase 22; fondasi 5-E menyiapkan domain-nya (eligibility FIRST_LICENSE; buyer attribution nullable server-side) tanpa membuka permukaan publik.

## §D Implemented components (exact files)

**Baru (`src/lib/shop/`):**
- `vocabulary.ts` — closed set kind/status/intent/completion-source; `SHOP_SURFACE_CODE`; `SHOP_ISSUANCE_SOURCE_TYPE`; guards.
- `reason-codes.ts` — ShopReasonCode (domain codes baru, tidak mengubah vocabulary kanonik) + ShopEligibilityKind.
- `authorization.ts` — SHOP_ACTION_AUTHORIZATION (explicit permission only; pola remediasi PR #4) + recordCommerceAudit (kategori COMMERCE).
- `catalog.ts` — createShopProduct / activateShopProduct / withdrawShopProduct / getShopProductRow (fail-closed; default INACTIVE; WITHDRAWN terminal).
- `eligibility.ts` — evaluateShopEligibility (murni) + resolveShopProductEligibility (DB).
- `order-intent.ts` — createShopOrderIntent (idempotency state-convergence; eligibility per line; single-kind; lisensi tepat 1×qty1) + cancelShopOrderIntent.
- `completion.ts` — verifyShopOrderCompletion (union sumber tertutup; hanya OPEN→COMPLETED; SYSTEM-only).
- `issuance.ts` — issueFromCompletedShopOrderIntent (License/ExtensionInstance PURCHASED; sourceType/sourceRef; term caller-supplied; rollback penuh; idempotent).

**Modifikasi aditif:**
- `prisma/schema.prisma` — 3 model Shop* + relasi balik (LicenseTier/ExtensionDefinition/Workspace/User).
- `prisma/migrations/20261031120000_phase5e_shop_commerce_foundation/migration.sql` — CREATE TABLE ×3 + CREATE INDEX ×8 (6 CREATE INDEX + 2 CREATE UNIQUE INDEX) + CHECK kind + CHECK quantity (aditif-only).
- `src/lib/authz/permissions.ts` — +1 key `store.order.create` (AUTHORIZATION_MODEL §4.12; tanpa binding preset).
- `src/lib/audit/audit-service.ts` — +1 kategori `COMMERCE`.
- `src/lib/licensing/lifecycle-shared.ts` — export `denyByLifecycleChain` + pelebaran tipe param `action` (keduanya behavior-neutral; 291 regresi tetap hijau).
- `DATA_MODEL_CONCEPT.md` — §3.12a dibuat; §3.5 anotasi rekonsiliasi EntitlementGrant.
- `tests/integration/licensing-domain.test.ts`, `tests/integration/licensing-migration.test.ts` — pembaruan assertion inventory (preseden 5-B; 26/26 tetap PASS).

**Dokumen:** `adr/ADR-026-phase5e-shop-commerce-foundation.md` (PROPOSED); `PHASE_5E_REPORT.md` (ini); `PHASE_5E_ACCEPTANCE.md`; `PHASE_5E_TRACEABILITY.md`; pembaruan `ROADMAP.md` + `PHASE_STATUS.md`.

**TIDAK dibuat:** route HTTP apa pun (`src/app/api/` — diuji kosong dari shop), UI/checkout, payment gateway, EntitlementGrant, StoreOrder, product Public Store, Equipment Store, scheduler, license key.

## §E Commerce surface isolation

| Surface | Status implementasi | Bukti pemisahan |
|---|---|---|
| **A. License & Extension Shop** (first-license/renewal/extension; publik; dapat melayani calon tanpa lisensi) | **DIBANGUN (fondasi domain)** — family `Shop*` di `src/lib/shop/` + 3 tabel | `SHOP_SURFACE_CODE = "LICENSE_EXTENSION_SHOP"`; eligibility FIRST_LICENSE/RENEWAL/EXTENSION_PURCHASE; audit surface marker |
| **B. Public Store** (developer products; miniRider required) | TIDAK DIBANGUN (konseptual DMC §3.12; Phase 22) | Model inventory test: TIDAK ada `Product`/`ProductType`/`CatalogListing`/`StoreOrder`/`StoreOrderLine`; tidak ada kode yang menggabungkan |
| **C. Developer Equipment Store** (miniRider only) | TIDAK DIBANGUN (Phase 11) | Model inventory test: TIDAK ada `EquipmentListing`/`ListingMedia`/`StockItem`/`PriceRecord` |

Tidak ada `StoreOrder` universal — order adalah `ShopOrderIntent` milik satu surface. Cross-surface: tidak ada tabel bersama (diuji DMMF), tidak ada permission yang membuka surface lain.

## §F Entitlement boundary

```text
ShopProduct → ShopOrderIntent (OPEN) → verified completion (internal; COMPLETED)
  → issuance → License(status=PURCHASED) / ExtensionInstance(status=PURCHASED)
  → [ aktivasi HANYA via 5-D lifecycle services — SYSTEM internal ]
  → engine 5-C membaca status (PURCHASED TIDAK pernah meng-grant)
```
Dibuktikan test: setelah issuance, `resolveWorkspaceCapabilityEntitlement` = `DENIED` (`DENY_LICENSE_STATE`); setelah `applyLicenseLifecycleTransition(ACTIVATE)` (jalur 5-D) = `ALLOWED`. Modul shop tidak memiliki fungsi transisi ACTIVE (structural test).

## §G Issuance boundary

- `License(status=PURCHASED)` / `ExtensionInstance(status=PURCHASED)` — dibuktikan test (bukan ACTIVE).
- `sourceType="SHOP_ORDER_INTENT"`, `sourceRef=intent id` — dibuktikan test kedua kind.
- Term data caller-supplied (termStartsAt/termEndsAt/renewalWindowStartsAt persis nilai yang disuplai; kolom tak disuplai = null; `graceEndsAt` TIDAK PERNAH diisi commerce; `purchasedAt` = `completedAt` intent — fakta, bukan perhitungan) — dibuktikan test; OD-108 dihormati (tanpa default, tanpa scheduler).
- Duplicate issuance: idempotent no-op (intent ISSUED + target konsisten) — dibuktikan 3× replay; rollback penuh saat invariant dilanggar (dua line same-type → tanpa instance, intent tetap COMPLETED, denial teraudit).

## §H Authorization

- Permission: `store.order.create` (§4.12, key kanonik satu-satunya; dideklarasikan, TIDAK diikat preset — OD-122 OPEN). Cancel/completion/issuance = permission `null`.
- Default deny: seluruh aksi commerce oleh USER (owner, member, non-member, sesi ABSENT/EXPIRED/REVOKED) ditolak dengan reason code kanonik rantai (`DENY_PERMISSION_MISSING` / `DENY_NOT_MEMBER` / `DENY_NO_SESSION`/…) — dibuktikan matriks test; TIDAK ada owner fallback (pola remediasi PR #4).
- SYSTEM trust boundary: hanya pemanggil internal tepercaya; tidak ada route HTTP (diuji `src/app/api` bebas shop) sehingga client tidak dapat memilih `actorType=SYSTEM`.
- Audit: setiap keputusan (sukses & denial) → `AuditEvent` kategori COMMERCE; denial first-class (REQ-010/024).

## §I Security

- Tenant isolation: konteks workspace dari server (param internal terverifikasi + rantai membership DB); cross-tenant USER = `DENY_NOT_MEMBER` + audit + tanpa existence leak (tidak ada order dibuat); dibuktikan test.
- Anti-replay/anti-duplication: `idempotencyKey` unique DB + state-convergence (replay identik = no-op; divergent = `SHOP_DENY_IDEMPOTENCY_CONFLICT`) + optimistic guard; replay-cache fisik tetap menunggu OD-01 (jujur — ADR-017).
- Forged claims: forged tier (kind/target mismatch ditolak katalog), forged paid status (USER tidak dapat menyuplai completion; union tertutup), forged entitlement (PURCHASED tidak meng-grant), forged actorType (USER tidak pernah diizinkan jalur SYSTEM) — semuanya dibuktikan test.
- Tidak ada secret di audit (sanitasi REQ-054 tetap aktif).

## §J Tests (actual commands & results)

| Command | Hasil aktual |
|---|---|
| `bun run test` (baseline, sebelum perubahan) | **291/291 PASS** |
| `bun run test` (setelah 5-E, dijalankan 2×) | **354/354 PASS** (30 file; 2× stabil) |
| Test baru 5-E (pra-remediasi) = **63** | unit `shop-domain` 20; integration: `shop-catalog` 7, `shop-order-intent` 7, `shop-issuance` 11, `shop-security` 8, `shop-surface-isolation` 4, `shop-migration` 6 |
| `bun run test` (PASCA-REMEDIASI F-01–F-05 — final actual) | **361/361 PASS** (30 file) |
| Test remediasi = **+7** | F-03 regression ×6 (`shop-security` 8→14: TEST A–F otorisasi-mendahului-probe); F-04 regression ×1 (`shop-catalog` 7→8: reason code sesi kanonik) |
| `bun run lint` | exit 0 |
| `bun run typecheck` | exit 0 |
| `NEXTAUTH_SECRET=<placeholder CI> bun run build` | exit 0 (pola workflow CI owner) |
| `prisma validate` + `prisma generate` | valid / client ter-generate (pasca-remediasi F-02) |
| `prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma` | **"No difference detected"** (pasca-remediasi F-02 — perubahan komentar murni) |

Angka di atas adalah hasil eksekusi aktual (bukan hitungan statis). Cakupan mengikuti §19 prompt: katalog (valid/inactive/withdrawn/invalid/wrong-kind), eligibility (first license/existing/renewal/extension/invalid target/unauthorized), order intent (creation/duplicate-replay/divergent/cross-tenant/invalid product/invalid workspace/no automatic entitlement), issuance (valid completion/PURCHASED/sourceRef/dates caller-supplied/duplicate prevention/rollback/no direct ACTIVE), security (forged tier/workspace/paid/entitlement/actorType, unauthorized USER, owner tanpa permission, cross-tenant, replay), surface isolation (structural).

## §K Migration verification

| Item | Hasil |
|---|---|
| `prisma validate` | valid |
| `prisma generate` | client ter-generate |
| `prisma migrate diff --from-migrations --to-schema-datamodel` | **"No difference detected"** |
| `prisma migrate deploy` — DB disposable kosong | PASS (4 migration: Phase 4, 5-B, 5-D, 5-E) |
| Migration pada legacy 5-B/5-D nyata | `tests/integration/shop-migration.test.ts` — data legacy utuh per baris; CHECK kind/quantity aktif; unique idempotencyKey aktif; redeploy idempoten; aditif-only (tanpa DROP/DELETE/ALTER) |
| Migration historis tidak tersentuh | `git diff --quiet HEAD` per direktori Phase 4/5-B + lock (diuji `licensing-migration.test.ts` — diperbarui additive untuk mengizinkan dir 5-E; tetap PASS) |
| DB produksi | NOT TESTED (tidak tersedia; OD-01 OPEN — jujur) |

## §L Commercial blockers (tetap OPEN — tidak diputuskan oleh 5-E)

| OD | Area blocked | Status di 5-E |
|---|---|---|
| OD-05 | kuota/seat counting & billing seat | `TierQuota` tidak dikonsumsi; quantity dibawa apa adanya |
| OD-06 | harga/currency/pajak/refund/gateway/charging produksi/commercial launch/payment success semantics | tidak ada field/jalur; completion hanya simulasi non-produksi |
| OD-108 | durasi renewal/expiry/grace/scheduler/downgrade timing | semua term caller-supplied; tanpa default; tanpa scheduler |
| OD-122 | preset role & binding permission | tidak ada preset memegang key commerce → USER default deny |
| OD-133 | otoritas harga/diskon | tidak relevan (tidak ada harga) |
| OD-135 | state machine invoice/order final | state intent PROVISIONAL + terdokumentasi |
| OD-01 | database produksi | SQLite lokal; replay-cache fisik menunggu |

## §M Phase 22 boundary (sengaja TIDAK diimplementasi)

Public landing; Developer Portal; UI License & Extension Shop (landing shop, product pages, cart, checkout screens, payment form, payment success); Public Store UI; Equipment Store UI; notification governance; route HTTP commerce apa pun; integrasi payment gateway; jalur pembeli publik tanpa akun/workspace (provisioning journey). Semua milik Phase 22 (atau Phase 11 untuk Equipment Store) sesuai ROADMAP — dipertahankan, tidak diubah.

## §N Scope violations

**NONE** — audit kata kunci blocked (§25 prompt: payment/gateway/stripe/midtrans/xendit/billing/refund/tax/currency/price/discount/checkout/paid/quota/seat/grace/scheduler/EntitlementGrant/StoreOrder/Public Store/Equipment Store) atas seluruh kode implementasi menghasilkan: 0 kemunculan di kode eksekusi; kemunculan di komentar = larangan eksplisit; kemunculan `quota`/`seat`/`grace` = model/vocabulary pre-existing 5-B/5-D yang tidak dikonsumsi shop. Klasifikasi lengkap: semua `ALLOWED FOUNDATION` (atau dokumentasi larangan); tidak ada `BLOCKED IMPLEMENTATION`. Tidak ada commit/push/PR/merge; tidak mengulang 5-B/5-C/5-D; tidak ada second engine; `EntitlementGrant` tidak dibuat.

## §O Git state

- commit created? **NO** · push? **NO** · PR? **NO** · merge? **NO** (owner satu-satunya pelaku git write).
- Working tree (uncommitted, FINAL pasca-remediasi — hitungan ulang aktual): **9 file dimodifikasi** (tracked), **13 path baru** (untracked; **20 file** bila direktori `src/lib/shop/` dan dir migrasi dihitung per file) — rincian `git status --short` dan `git diff --stat` tersedia untuk review owner.
- Modified tracked (9): `DATA_MODEL_CONCEPT.md`, `PHASE_STATUS.md`, `ROADMAP.md`, `prisma/schema.prisma`, `src/lib/audit/audit-service.ts`, `src/lib/authz/permissions.ts`, `src/lib/licensing/lifecycle-shared.ts`, `tests/integration/licensing-domain.test.ts`, `tests/integration/licensing-migration.test.ts`.

## §P Final gate

```text
PHASE_5E_IMPLEMENTATION = PARTIAL
```

Dasar: **fondasi commerce 5-E yang diminta (domain/backend, §24 STEP 1–21) selesai dan seluruh gate lokal PASS** — tetapi dilaporkan PARTIAL, bukan COMPLETE, karena (a) acceptance criteria penuh Phase 5-E final adalah milik owner (ADR-026 PROPOSED menunggu ratifikasi; pola 5-B/5-C/5-D), (b) kapabilitas komersial (charging, harga, state machine final, UI) sengaja BLOCKED oleh OD-06/OD-133/OD-135 dan Phase 22 — bukan implemented foundation, dan (c) pekerjaan belum terintegrasi owner (belum commit/push/CI — pola MC-V4 §11). Tidak ada klaim terhadap area blocked.

## §Q Remediation addendum (F-01–F-05 — post-review fix, working tree only)

Remediasi atas review findings F-01–F-05 (TANPA git write apa pun; working tree adalah kandidat yang diremediasi):

| Finding | Remediasi aktual | Bukti |
|---|---|---|
| **F-03** (security; REQUIRED) | `createShopOrderIntent` (`src/lib/shop/order-intent.ts`): urutan eksekusi diganti — otorisasi `store.order.create` + validasi workspace KINI mendahului idempotency probe. Pemanggil tidak-authorized TIDAK PERNAH mencapai probe (tidak ada existence/intent ID/status/workspace/product/buyer leak). Key milik konteks authorized lain ditolak generik (`intentId: null`, tanpa perbandingan konten). Denial memakai reason code kanonik rantai; teraudit sebagai authorization denial. Infrastruktur otorisasi existing dipakai (TANPA model baru) | 6 test regression (`shop-security` TEST A–F) — cross-tenant existing-key PASS; unauthorized hanya menerima `{outcome, reasonCode, intentId: null}` |
| **F-04** | `src/lib/shop/catalog.ts`: denial USER sesi ABSENT/EXPIRED/REVOKED kini memakai reason code sesi kanonik (`DENY_NO_SESSION`/`DENY_SESSION_EXPIRED`/`DENY_SESSION_REVOKED`) via `denyByLifecycleChain` (reuse penuh; TANPA taxonomy baru); sesi VALID tetap `DENY_TENANT_MISMATCH` (domain platform-global). Duplicate `ShopProduct.code`: vocabulary kanonik TIDAK menyediakan kode duplicate-code/unique-constraint yang lebih tepat → pemetaan existing dipertahankan + dicatat sebagai **unresolved vocabulary limitation** (menunggu keputusan owner; TIDAK mengarang kode baru) | 1 test regression (`shop-catalog`) — tiga sesi invalid memakai kode kanonik |
| **F-02** | `prisma/schema.prisma`: komentar status diperbaiki — `ShopProduct.status` dan `ShopOrderIntent.status` TIDAK memiliki CHECK DB (migration hanya CHECK `kind` + `quantity`); komentar kini jujur ("TANPA CHECK DB — ditegakkan lapisan service, pola 5-B/5-D"). TIDAK ada DB CHECK ditambahkan; TIDAK ada migration baru; `prisma migrate diff` = "No difference detected" | `prisma validate` valid; diff kosong |
| **F-01** | Report ini dikoreksi berdasarkan working tree FINAL: modified tracked = **9** (bukan 7); untracked = **13 path / 20 file** (bukan 10); CREATE INDEX migration 5-E = **8** (6 + 2 unique; bukan 7); test final = **361/361** (+7 test remediasi) | §D/§J/§O diperbarui; hitungan dari `git status`/`grep` aktual |
| **F-05** | TIDAK ada keputusan bisnis diambil. Semantik FIRST_LICENSE (implementasi: nol baris lisensi historis vs wording ADR-018 "without LIVE license") didokumentasikan eksplisit sebagai ambiguitas yang MENUNGGU RATIFIKASI OWNER — catatan ditambahkan di `src/lib/shop/eligibility.ts` (comment-only; TIDAK ada perubahan logika) dan ADR-026 §6. **ADR-026 tetap PROPOSED** | §6 ADR-026 + header `eligibility.ts` |

Out-of-scope observation (HANYA dicatat, TIDAK diubah): `cancelShopOrderIntent` melakukan lookup by intent-ID sebelum otorisasi — pola record→authorize yang kanonik 5-D (konteks otorisasi berasal dari record); ID intent adalah cuid yang disuplai pemanggil (bukan probe key yang dipilih attacker pada unique index). TIDAK diubah dalam remediasi ini (di luar definisi F-03; perubahan menuntut keputusan desain owner).
