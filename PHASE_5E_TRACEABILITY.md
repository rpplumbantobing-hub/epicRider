# PHASE 5E TRACEABILITY — epicRider — Commerce Foundation

Pemetaan sumber kontrak → keputusan → implementasi → bukti. Format mengikuti
`PHASE_5D_TRACEABILITY.md`. Semua bukti = hasil eksekusi aktual di environment ini.

| Sumber kontrak | Ketentuan | Keputusan ADR-026 / implementasi | Bukti |
|---|---|---|---|
| ADR-018 (ACCEPTED) §Decision 1/4/5 | Tiga surface terpisah; License & Extension Shop = jalur publik first-license/renewal/extension; issuance → License/Extension grants; tanpa harga (OD-06) | Entity family `Shop*` satu surface; eligibility FIRST_LICENSE/RENEWAL/EXTENSION_PURCHASE; issuance PURCHASED; tanpa field komersial | `shop-surface-isolation.test.ts` (4); `shop-issuance.test.ts`; scan kata kunci §N report |
| REQ-030 | Isolasi penuh tiga surface (data, access, API, issuance, audit) | Tidak ada shared table/permission/issuance lintas surface; kategori audit COMMERCE terpisah dari LICENSE | Model inventory test; `shop-security.test.ts` |
| LICENSE_MATRIX §4 | Shop melayani calon tanpa lisensi + alur renewal; Equipment Store miniRider-only (bukan scope 5-E) | FIRST_LICENSE tanpa baris lisensi; RENEWAL klasifikasi; Equipment Store tidak dibangun | `shop-issuance.test.ts` (RENEWAL order kedua); inventory test |
| ARCHITECTURE §7 | Shop needs own catalog/order abstraction/issuance/audit | ShopProduct/ShopOrderIntent(+Line); issuance; audit COMMERCE | Implementasi `src/lib/shop/`; audit test |
| ENTITLEMENT_MODEL §8 | Catalog/license/entitlement/order model CAN proceed; charging/prices/tax/gateway/refund BLOCKED (OD-06); issuance target SELALU workspace | Fondasi domain dibangun; tanpa field/jalur komersial; workspaceId wajib pada intent | Structural test banned columns; schema FK Workspace Restrict |
| Prompt 5-E §12 | INTENT ≠ PAID ≠ COMPLETED PAYMENT ≠ ACTIVE ENTITLEMENT; anti-duplication realistis; tanpa replay-cache besar | State PROVISIONAL OPEN→COMPLETED→ISSUED/CANCELLED; idempotencyKey unique + state-convergence + optimistic; tanpa replay-cache (jujur OD-01) | `shop-order-intent.test.ts` (7); `shop-issuance.test.ts` |
| Prompt 5-E §13 | Tidak ada `client says paid`; completion boundary non-produksi untuk testing | Union sumber tertutup `NON_PRODUCTION_TEST_SIMULATION`; SYSTEM-only; bukti client ditolak teraudit | `shop-issuance.test.ts` §13 (USER deny); `shop-security.test.ts` forged-paid |
| Prompt 5-E §14 | Issuance = PURCHASED + sourceType/sourceRef + term caller-supplied; JANGAN PURCHASED→ACTIVE dari commerce | Konstanta `SHOP_ISSUANCE_SOURCE_TYPE`; term caller-supplied; aktivasi hanya 5-D | `shop-issuance.test.ts`; structural no-transition-export test |
| Prompt 5-E §15 | Server-side authz; default deny; audited; owner tanpa ratifikasi = deny; SYSTEM internal-only | `SHOP_ACTION_AUTHORIZATION` (pola PR #4); reuse `authorizeLifecycleAction`; tanpa route HTTP | `shop-security.test.ts` (8); `shop-order-intent.test.ts` authz |
| Prompt 5-E §16 | Audit wajib (denial, order, issuance, replay, cross-tenant, invalid product, permission denial) | Kategori COMMERCE; denial first-class; sukses atomik | Audit assertions tersebar di semua test file |
| Prompt 5-E §17 | Tenant context dari server; cross-tenant = DENY+AUDIT+no leak | workspaceId param internal + rantai membership; denial teraudit tanpa efek | `shop-security.test.ts` forged-workspace |
| Prompt 5-E §18 | Migration aditif; aman data 5-B/C/D; test kosong+legacy+diff+validate+generate | CREATE TABLE/INDEX saja; legacy utuh per baris; semua gate dijalankan | `shop-migration.test.ts` (6); `licensing-migration.test.ts` tetap PASS |
| Prompt 5-E §19 | Matriks test katalog/eligibility/order/issuance/security/surface | 63 test baru mencakup seluruh kategori §19 | `bun run test` = 354/354 (2×) |
| Prompt 5-E §20 | TANPA UI commerce produksi | Tidak ada halaman/komponen commerce; tidak ada route | `src/app/api` bebas shop (test); git status tanpa file UI |
| Prompt 5-E §7 | NO NEW ENTITLEMENTGRANT TABLE | Tidak dibuat; DMC §3.5 direkonsiliasi | Inventory test; DMC §3.5 anotasi |
| Prompt 5-E §6 | Reconcile DMC §3.12a; jangan mengarang entity | §3.12a dibuat minimal dari entity yang benar-benar diimplementasi | DMC §3.12a; report §C |
| ADR-017 | Idempotensi purchase/issuance; replay tidak double-issue | idempotencyKey unique + state-convergence; keterbatasan replay-cache disatakan | `shop-order-intent.test.ts`; ADR-026 §2 |
| OD-05/OD-06/OD-108/OD-122/OD-133/OD-135/OD-01 | Tetap OPEN — tidak diputuskan | Semua area tertahan tidak dimodelkan/diaktifkan; terdokumentasi §L report | Scan kata kunci; ADR-026 §6 |

**Koverage**: setiap baris ketentuan prompt 5-E (§1–§26) terpetakan ke bukti; area
BLOCKED dilaporkan jujur sebagai NOT APPLICABLE (by design), bukan FAIL.
