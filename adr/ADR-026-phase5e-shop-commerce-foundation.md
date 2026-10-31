# ADR-026 — Phase 5-E: Commerce Foundation (License & Extension Shop)

## Status

**PROPOSED** — dirumuskan pada implementasi Phase 5-E (2026-10-31); menunggu ratifikasi owner.
Mengikuti pola ADR-023/024/025: implementasi ada pada working tree (belum commit — owner
satu-satunya pihak yang melakukan git write), keputusan owner atas dokumen ini menunggu.
Terhubung ke ADR-018 (three surfaces — ACCEPTED), ADR-011/ADR-014 (entitlement/extension),
ADR-017 (konkurensi/idempotensi), ADR-023/024/025 (5-B/5-C/5-D), REQ-030, REQ-098, ENTITLEMENT_MODEL §8,
DMC §3.12a (direkonsiliasi bersamaan dengan ADR ini).

## Context

- Baseline canonical `main = aafcbe3` (merge PR #4): 5-B (fondasi domain/database licensing),
  5-C (engine entitlement fail-closed), dan 5-D (lifecycle license/extension + remediasi
  default-deny) terintegrasi. `License`/`ExtensionInstance` menyediakan kolom
  `sourceType`/`sourceRef` yang disiapkan 5-B untuk "diisi alur 5-E" (ADR-025 §6).
- Owner mengotorisasi **Phase 5-E = COMMERCE FOUNDATION** (domain/backend foundation untuk
  License & Extension Shop) dengan boundary ketat: BUKAN production checkout, BUKAN payment,
  BUKAN UI commerce, BUKAN Phase 22.
- Open decisions tetap OPEN dan TIDAK diputuskan oleh implementasi ini: **OD-05** (owner/seat
  counting), **OD-06** (harga/billing/pajak/refund/gateway/charging produksi/commercial launch),
  **OD-108** (aturan & durasi expiry/grace/renewal), **OD-122** (preset role & binding
  permission), **OD-133** (otoritas harga/diskon), **OD-135** (state machine invoice/order),
  **OD-01** (database produksi).
- Dua divergensi dokumentasi ditemukan gate sebelumnya dan direkonsiliasi pada fase ini:
  (1) `DATA_MODEL_CONCEPT.md` merujuk `§3.12a` yang tidak pernah ada;
  (2) `DMC §3.5` mendefinisikan `EntitlementGrant` yang tidak pernah dimodelkan oleh
  implementasi 5-B/5-C/5-D.

## Decision

### 1. Entity family `Shop*` — satu surface saja (License & Extension Shop; ADR-018)

Tiga model aditif (migration `20261031120000_phase5e_shop_commerce_foundation` — CREATE
TABLE/INDEX saja; tidak menyentuh migration Phase 4/5-B/5-D):

| Model | Peran | Invariant kunci |
|---|---|---|
| `ShopProduct` | Katalog struktur: apa yang dapat dibeli + target issuance | kind closed set (`LICENSE`/`EXTENSION`, CHECK DB); default `INACTIVE`; `tierId` → `LicenseTier` / `definitionId` → `ExtensionDefinition` (TIDAK duplikasi katalog licensing); TANPA field komersial |
| `ShopOrderIntent` | Commercial intent — BUKAN paid order | state PROVISIONAL `OPEN → COMPLETED → ISSUED` (+`CANCELLED` dari OPEN) — final state machine = OD-135; `idempotencyKey` unique; `completionSource` hanya diisi boundary internal |
| `ShopOrderIntentLine` | Line intent | quantity ≥ 1 (CHECK DB); dibawa apa adanya ke issuance |

TIDAK dibuat: `StoreOrder` universal, `Product`/`CatalogListing` (Public Store),
`EquipmentListing` family (Equipment Store), `EntitlementGrant`. Isolasi tiga surface
ditegakkan structural dan diuji (test surface isolation: model inventory + tidak ada
kolom komersial + tidak ada shared table).

### 2. Rantai arsitektur — entitlement boundary dipertahankan

```text
ShopProduct (katalog; tanpa nilai komersial)
  → ShopOrderIntent (INTENT ≠ PAID ≠ COMPLETED PAYMENT ≠ ACTIVE ENTITLEMENT)
  → verified completion boundary (sumber internal tepercaya; union tertutup)
  → issuance: License(status=PURCHASED) / ExtensionInstance(status=PURCHASED)
     + sourceType="SHOP_ORDER_INTENT" + sourceRef=intent id + term caller-supplied
  → aktivasi HANYA via layanan lifecycle 5-D (bukan dari kode commerce)
  → engine entitlement 5-C (PURCHASED tidak pernah meng-grant)
```

- **Verified completion**: union sumber TERTUTUP — satu-satunya anggota Phase 5-E adalah
  `NON_PRODUCTION_TEST_SIMULATION` (test-only, eksplisit bukan jalur charging produksi).
  Anggota produksi (payment gateway attestation) = OD-06 OPEN — menambahkannya menuntut
  keputusan owner. Ini adalah payment-adapter boundary minimal, bukan implementasi gateway.
  `client says paid=true` / `checkout submitted = paid` / `order created = paid` tidak pernah
  dipercaya (union tidak dapat dibentuk dari input client; tidak ada route HTTP Phase 5-E).
- **Issuance**: hanya intent COMPLETED; re-validasi produk ACTIVE + eligibility pada waktu
  issuance (fail-closed terhadap perubahan state); rollback transaksi penuh pada pelanggaran
  invariant (P2002 satu-LIVE-extension dipetakan denial teraudit); idempotensi
  state-convergence (replay intent ISSUED = no-op sukses). TIDAK ada durasi default — semua
  term data caller-supplied (OD-108); `purchasedAt` diisi dari fakta `completedAt` intent
  (catatan peristiwa, bukan perhitungan kebijakan) kecuali disuplai eksplisit.
- **Eligibility**: evaluator murni deterministik + resolver DB (pola 5-C).
  Klasifikasi dari governance, bukan aturan baru: FIRST_LICENSE (tanpa baris lisensi —
  ADR-018 wajib melayani calon tanpa lisensi), RENEWAL (memegang lisensi; aturan final =
  OD-108), EXTENSION_PURCHASE (slot (workspace,type) LIVE kosong — invariant 5-D). Parameter
  availability extension lain = OD-06 sub-scope — tidak dikarang.

### 3. Otorisasi — explicit permission only, default deny (pola remediasi PR #4)

- Key kanonik satu-satunya yang dipakai: `store.order.create` (AUTHORIZATION_MODEL §4.12;
  REQ-098; OD-06; OD-135) — dideklarasikan di `permissions.ts` TANPA binding preset
  (OD-122 OPEN). Sampai owner meratifikasi katalog: seluruh aksi commerce USER =
  `DENY_PERMISSION_MISSING` — termasuk role `owner`. TIDAK ada owner fallback / implicit
  allow / PROPOSED → ALLOW.
- Aksi tanpa key kanonik pada model (cancel, completion, issuance) = permission `null` →
  default deny USER; operasi internal tepercaya memakai aktor SYSTEM (trust boundary sama
  dengan 5-D: tidak dapat disuplai client; tidak ada route HTTP Phase 5-E).
- Rantai sesi→tenant→membership→permission DIEGAKSkan dengan KODE YANG SAMA dengan 5-D
  (`authorizeLifecycleAction` dipakai-ulang; `denyByLifecycleChain` diekspor tanpa perubahan
  perilaku) — bukan framework otorisasi kedua.

### 4. Audit — kerangka Phase 4, kategori aditif

Kategori `COMMERCE` ditambahkan ke `AuditCategory` (pola penambahan `LICENSE` oleh 5-C).
Denial first-class; sukses atomik dengan write terkait; metadata termasuk penanda surface
`LICENSE_EXTENSION_SHOP` + actorType + flag idempotent. Redaksi defensif REQ-054 tetap aktif.

### 5. Rekonsiliasi dokumentasi (bersamaan dengan implementasi)

- **DMC §3.12a DIBUAT** (referensi menggantung di DMC §3.12/§4.6 + PHASE_2_TRACEABILITY
  REQ-030 kini valid): mendokumentasikan entity family yang benar-benar diimplementasi.
- **DMC §3.5 `EntitlementGrant` DIREKONSILIASI**: baris konseptual dipertahankan sebagai
  riwayat, dianotasi jelas bahwa implementasi (5-B/5-C/5-D, ditegakkan kembali 5-E)
  menetapkan License/ExtensionInstance sebagai satu-satunya sumber entitlement —
  TIDAK ada tabel `EntitlementGrant`, TIDAK ada second source of truth.
- Status order intent di dokumen ini dan DMC = PROVISIONAL (OD-135 OPEN).

### 6. Tidak diambil keputusannya (tetap OPEN)

- **OD-05** — kuota/seat: `TierQuota` tidak dikonsumsi; quantity dibawa apa adanya.
- **OD-06** — harga/currency/pajak/refund/gateway/charging produksi/commercial launch:
  tidak ada field komersial, tidak ada gateway, tidak ada jalur charging.
- **OD-108** — durasi renewal/expiry/grace/scheduler: semua term caller-supplied; tanpa
  default; tanpa scheduler.
- **OD-122** — binding permission→role: tidak ada preset yang memegang key commerce.
- **OD-133** — otoritas harga/diskon: tidak relevan (tidak ada harga).
- **OD-135** — state machine final: state intent PROVISIONAL.
- **OD-01** — database produksi: SQLite lokal; replay-cache fisik tetap menunggu (ADR-017).
- **FIRST_LICENSE semantics (catatan F-05 — ambiguitas dibawa terbuka, BUKAN keputusan):**
  implementasi eligibility mengklasifikasikan FIRST_LICENSE saat workspace memiliki
  **nol baris lisensi historis** (`licenseRowCount === 0`), sedangkan wording ADR-018
  ("without LIVE license") dapat dibaca sebagai dasar **LIVE-status**. Kedua pembacaan
  berbeda untuk workspace yang hanya memegang lisensi non-LIVE. Semantik final
  (historis vs LIVE) menuntut ratifikasi keputusan bisnis owner — implementasi saat ini
  TIDAK memilih aturan baru dan hanya mencatat klasifikasi apa adanya (lihat catatan
  F-05 pada `src/lib/shop/eligibility.ts`).

## Consequences

**Positif:** fondasi commerce aman yang tidak menduplikasi 5-B/5-C/5-D (reuse penuh rantai
otorisasi, lifecycle, engine, audit); jalur first-license yang tidak ter-gate lisensi kini
punya domain tempat ia bisa hidup (ADR-018); tidak ada klaim komersial palsu (completion
hanya simulasi non-produksi); anti-duplication realistis (unique key + state-convergence +
optimistic guard + invariant DB); semua mutasi/denial teraudit.

**Risiko/keterbatasan (jujur):** tanpa route HTTP dan UI — integrasi endpoint/experience
adalah pekerjaan fase berikutnya/Phase 22 dan memerlukan otorisasi owner; idempotensi
state-convergence bukan replay-cache penuh (OD-01); seluruh operasi commerce praktis hanya
dapat dijalankan aktor SYSTEM internal sampai OD-122 diratifikasi; konkurensi teruji pada
SQLite lokal saja; migrasi belum diuji pada database produksi (tidak tersedia).

## Evidence

- `src/lib/shop/` (vocabulary, reason-codes, authorization, catalog, eligibility,
  order-intent, completion, issuance); `src/lib/authz/permissions.ts` (1 key aditif §4.12);
  `src/lib/audit/audit-service.ts` (kategori aditif); `src/lib/licensing/lifecycle-shared.ts`
  (export helper — tanpa perubahan perilaku).
- `prisma/schema.prisma` (3 model Shop* + relasi balik); `prisma/migrations/
  20261031120000_phase5e_shop_commerce_foundation/migration.sql` (aditif-only).
- Test: unit `shop-domain.test.ts` (20) + integration `shop-catalog` (7), `shop-order-intent`
  (7), `shop-issuance` (11), `shop-security` (8), `shop-surface-isolation` (4),
  `shop-migration` (6) = **63 test baru; full regression 354/354 PASS (2×)**; lint/typecheck/
  build exit 0; `prisma migrate diff` = "No difference detected"; deploy kosong + legacy PASS.
- Divergensi direkonsiliasi: DMC §3.12a + §3.5 (dokumen ini §5).

## Dependencies

- **Open:** OD-01, OD-05, OD-06, OD-108, OD-122, OD-133, OD-135.
- **Related ADRs:** ADR-010 (policy), ADR-011 (entitlement), ADR-014 (extension), ADR-017
  (konkurensi/idempotensi), ADR-018 (three surfaces — ACCEPTED), ADR-023/024/025 (5-B/C/D).
- **Phases:** Phase 5-E (fase ini); Phase 22 (Public landing, Developer Portal, shop
  experience/UI, notification governance — ROADMAP); Phase 11 (Equipment Store); Phase 14
  (finance/commercial maxRider).
