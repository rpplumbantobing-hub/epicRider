# PHASE 5 TRACEABILITY — epicRider

**Scope dokumen:** Phase 5-B (fondasi domain/database licensing, 2026-10-30).
**Sumber kebutuhan:** `REQUIREMENTS.md` (teks kebutuhan owner — tidak diubah), `MASTER_CONTROL.md`,
`DATA_MODEL_CONCEPT.md`, `LICENSE_MATRIX.md`, `ENTITLEMENT_MODEL.md`, `TESTING.md`.
**Bukti:** `PHASE_5_REPORT.md` §E/§G/§I; test `tests/unit/licensing-vocabulary.test.ts` (V),
`tests/integration/licensing-domain.test.ts` (D), `tests/integration/licensing-migration.test.ts` (M).

| REQ | Kebutuhan (ringkas — sumber) | Kontribusi Phase 5-B | Bukti | Cakupan 5-B |
|---|---|---|---|---|
| REQ-002 | Pertumbuhan lisensi tanpa pindah aplikasi/rebuild data; satu fondasi data kontinu (Platform; MC §1; Must) | `License` per-workspace dengan histori append-only + tier sebagai referensi data — upgrade tier = perubahan DATA (lisensi baru/transisi), bukan migrasi schema | D (relasi + rotasi slot ACTIVE); M (data Phase 4 utuh setelah migration) | PARTIAL — jalur upgrade fungsional = 5-D |
| REQ-018 | Katalog extension: workspace tambahan, +10 seat/workspace, mobile app, landing page; detail komersial menunggu keputusan (Extensions; MC §3; Could; OD-06) | `ExtensionType` closed list 4 jenis (MC §2/§3); `ExtensionDefinition` katalog (`isActive=false` default — tidak aktif sebelum disetujui owner); `ExtensionInstance` tenant-scoped dengan `quantity` (unit +10 = data, bukan schema) | V (closed list); D (seed 4 type; definisi default non-aktif; unique katalog); M (seed tersedia) | PARTIAL — katalog aktif/harga = OD-06 |
| REQ-024 | Entitlement server-side untuk semua beda lisensi; UI-hiding bukan kontrol (Architecture; MC §5/§6; Must) | Fondasi data evaluasi: `License`(tier/status), `Capability`/`CapabilityRule`, `TierQuota`, `ExtensionInstance` + index resolusi (`License(workspaceId,status)` dll.) | D (katalog = LICENSE_MATRIX §2); V (matriks) | PARTIAL — engine evaluasi = Phase 5-C (eksplisit tidak di 5-B) |
| REQ-026 | Permission memeriksa aktor, tenant, objek, aksi, konteks event, **lisensi**, status objek (Architecture; MC §5; Must) | Input "lisensi" kini tersedia sebagai data terstruktur yang dapat di-query per tenant (`Workspace→License(tier,status)`; `Workspace→ExtensionInstance`) — tanpa mengubah model otorisasi Phase 4 | D (DMMF 11+8 tanpa duplikasi; relasi lisensi↔workspace; co-exist membership/role) | PARTIAL — konsumsi oleh policy layer = 5-C |
| REQ-029 | Semua perubahan schema via migration terkontrol, reversible bila layak; `db:push --accept-data-loss` tidak dipakai pada env ber-data (Schema; MC §5; Must; OD-01) | Migration aditif tunggal (`20261030124013…`): hanya CREATE TABLE/INDEX + INSERT katalog; diterapkan pada data Phase 4 existing TANPA reset; migration Phase 4 tidak berubah | M (semua 8 test: deploy berjenjang, data utuh, SQL aditif-only, git diff --quiet Phase 4, `_prisma_migrations`=2); G (validate/diff/status exit 0) | **PENUH untuk sub-scope 5-B** |
| REQ-098 | Siklus lisensi purchase→active→renewal→expiry→grace→downgrade; aturan & durasi = keputusan owner (License; MC §2/§3; Must; OD-06/OD-108) | Vocabulary status DMC §6.2 (`PURCHASED/ACTIVE/RENEWAL_DUE/EXPIRED/GRACE/DOWNGRADED`) + kolom term/window sebagai struktur (semua NULL); tanpa mekanika transisi | V (status set + guard); D/M (status sebagai data; single-ACTIVE invariant) | PARTIAL — mesin transisi = 5-D; durasi = OD-108 OPEN |
| REQ-099 | Saat tier turun: restrict/archive/delete sesuai keputusan (OD-108); tidak ada kehilangan data diam-diam (License; MC §2; Must; OD-108) | `onDelete: Restrict` pada License/ExtensionInstance→Workspace; histori append-only; partial unique (bukan unique penuh) sehingga histori tidak terpaksa dihapus saat rotasi ACTIVE | D (Restrict P2003; histori tersimpan; slot ACTIVE bebas setelah status turun); M (data utuh) | PARTIAL — kebijakan akhir downgrade = OD-108 |

**Invarian lintas-dokumen yang diuji (TESTING.md "mandatory domain invariants"; MC §2.1/§2.2):**
`hiRider != LicenseTier` (V-2; D-CHECK; M-CHECK) · tepat tiga tier (V-1; M-seed) · tepat satu lisensi
ACTIVE per workspace (ENTITLEMENT_MODEL §2 — D; M) · matriks capability = LICENSE_MATRIX §2
(V-7/8; D; M) · lifecycle extension = LICENSE_MATRIX §5 (V-6) · kuota miniRider 5 kru = MC §2.1/REQ-009
(V-9; D; M) · kode language-neutral DMC §2.9 (V-11) · histori append-only DMC §2.3/REQ-099 (D; M).

**Tidak diklaim oleh 5-B:** engine entitlement (5-C), transisi/renewal/expiry/grace/downgrade (5-D),
checkout/payment/pricing/shop (5-E/OD-06), seat counting final (OD-05), UI/API licensing.

---

## Phase 5-C — Entitlement Engine & Enforcement (2026-10-30)

**Scope dokumen bagian ini:** engine entitlement + enforcement server-side + integrasi authorization,
di atas commit 5-B `20a0169` (branch sama). **Bukti:** `PHASE_5_REPORT.md` §5C-E/§5C-G;
test `tests/unit/entitlement-engine.test.ts` (52), `tests/integration/entitlement-domain.test.ts` (24).

| REQ | Kebutuhan (ringkas — sumber) | Kontribusi Phase 5-C | Bukti | Cakupan 5-C |
|---|---|---|---|---|
| REQ-024 | Entitlement server-side untuk semua beda lisensi; UI-hiding bukan kontrol (Architecture; MC §5/§6; Must) | **Engine entitlement runtime**: evaluator deterministic fail-closed (`ALLOWED/DENIED` + `kind` + reason code + evidence), resolusi DB (workspace → license ACTIVE → tier → rule → extension), deny direkam audit (denial first-class) | U (matriks 3×10; fail-closed; determinisme); D (per-tier, state, isolasi, audit) | **PENUH untuk sub-scope engine 5-C** — eksposur endpoint HTTP = 5-E |
| REQ-026 | Permission memeriksa aktor, tenant, objek, aksi, konteks event, **lisensi**, status objek (Architecture; MC §5; Must) | Input entitlement pada policy Phase 4 kini DIEVALUASI (aditif; `null` = perilaku Phase 4 utuh); `authorizeWorkspaceCapability` merangkai entitlement (gate) → role/permission (grant) dengan kedua lapis terpisah | U (wiring policy); D (separasi: ALLOWED+member-tanpa-permission → DENY_PERMISSION_MISSING; short-circuit owner; DENY_NOT_MEMBER; DENY_NO_SESSION) | **PENUH untuk sub-scope 5-C** — konteks event/object-state runtime = Phase 6 |
| REQ-002 | Pertumbuhan lisensi tanpa pindah aplikasi/rebuild data (Platform; MC §1; Must) | Rotasi status lisensi (ACTIVE → DOWNGRADED → lisensi ACTIVE baru) dievaluasi engine **tanpa kehilangan data/akses ulang** — upgrade/downgrade = perubahan DATA | D (skenario rotasi ALLOWED→DENY→ALLOWED) | PARTIAL — jalur issuance/upgrade fungsional = 5-D |
| REQ-098 | Siklus lisensi purchase→active→renewal→expiry→grace→downgrade; aturan = keputusan owner (OD-06/OD-108) | Status = sumber entitlement: hanya ACTIVE; state lain deny deterministik (engine MENGIKUTI status data, tidak membangun transisi) | U (5 state non-ACTIVE → DENY_LICENSE_STATE); D (PURCHASED; korup → deny tanpa crash) | PARTIAL — mesin transisi = 5-D; durasi = OD-108 OPEN |
| REQ-099 | Saat tier turun: restrict/archive/delete sesuai OD-108; tidak ada kehilangan data diam-diam | Deny entitlement = **restrict akses** (data tidak disentuh); histori license tetap dihormati (EXPIRED + ACTIVE → ALLOWED); rotasi tidak menghapus apa pun | D (state turun → deny; lisensi baru → allow lagi; data utuh) | PARTIAL — kebijakan akhir = OD-108 |
| REQ-023 | Isolasi tenant — CRUD lintas-tenant ditolak (TESTING.md; MC §5) | Resolusi entitlement/extension strictly per workspace: license & extension instance workspace lain tidak pernah memengaruhi keputusan | D (license ISO milik B tidak meng-grant A; extension B ≠ A) | PENUH untuk permukaan entitlement 5-C |

**Invarian yang kini dijaga RUNTIME (bukan hanya test):** matriks DB ⇔ vocabulary LICENSE_MATRIX §2
(drift → fail closed); closed set tier (guard engine lapis kedua di atas CHECK DB); hanya ACTIVE sebagai
sumber entitlement; fail-closed untuk input unknown/unevaluable (tanpa fallback allow).

**Tidak diklaim oleh 5-C:** eksposur HTTP/UI (5-E), lifecycle/transisi lisensi (5-D), enforcement kuota
seat (OD-05), issuance/purchase (5-E; OD-06), extension lifecycle (5-D), DENY_STORE_TIER (Phase 11).
