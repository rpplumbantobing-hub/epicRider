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
