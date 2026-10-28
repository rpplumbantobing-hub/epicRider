# MASTER CONTROL — epicRider

## 0. Canonical status

Dokumen ini memuat **aturan produk/arsitektur yang stabil saja**. Dokumen ini **tidak menyimpan status fase dinamis** (remediasi F-02, audit konsistensi Phase 2, 2026-10-28).

**Aturan status (mengikat):**
- `ROADMAP.md` adalah **satu-satunya sumber kebenaran status fase berjalan**.
- `PHASE_STATUS.md` hanyalah ringkasan/rekaman eksekusi yang wajib konsisten dengan ROADMAP — bukan sumber status tandingan.
- Status fase hanya boleh diubah dengan bukti (lihat §8 Evidence gate). Taxonomy status: §3.

**Inheritance rule:** Phase tidak menghapus artefak fase sebelumnya. Baseline Phase 0/1 (audit, discovery/requirements `REQ-001..REQ-100`) tetap dipertahankan dan traceability-nya wajib terjaga. Set kontrol kanonik aktif terekam di `CONTROL_BASELINE_REGISTER.md`; referensi `MC §N` lama ditafsirkan lewat `CONTROL_REFERENCE_CROSSWALK.md`.

## 1. Product taxonomy

### License tiers
Hanya tiga license tier:
1. miniRider
2. maxRider
3. ISOrider

### hiRider
**hiRider bukan license, bukan tier keempat, dan bukan nilai pada `license_tier`.**

hiRider adalah **marketplace layanan/jasa kru** (crew services marketplace) yang terhubung dengan profil, skill, portofolio, workspace, event, dan rekrutmen. Scope hiRider mencakup:
- workspace membuka recruitment;
- user melihat calon kesempatan;
- user/calon anggota tim membuat profil, skill dan portfolio;
- **penawaran jasa (service offer)** oleh kru — bagian dari scope hiRider (baseline Master Control: "Marketplace layanan kru"; putusan scope = `adr/ADR-021-hirider-service-offer-scope.md`; detail lifecycle = desain Phase 16, status `PROPOSED`);
- user melamar ke recruitment opening;
- workspace melihat, menyaring, menerima/menolak kandidat;
- assignment dapat dilakukan setelah proses recruitment;
- kru dapat mengelola beberapa workspace mandiri sesuai lisensi.

Aturan akses rekrutmen: kru hanya dapat melamar pada rekrutmen yang **terbuka** dan memenuhi akses/kriteria; owner dapat menutup rekrutmen.

Invariant (tetap mengikat — tidak berubah oleh penyertaan penawaran jasa):
`Application != Workspace Membership`
`Application != Event Assignment`
`Acceptance != Automatic Workspace Access`

*(Remediasi F-01 audit konsistensi Phase 3, 2026-10-28: baris ini diselaraskan dengan baseline Master Control yang mendefinisikan hiRider sebagai marketplace layanan kru termasuk penawaran jasa; OD-185 ditutup sebagai keputusan scope yang bersumber dari baseline — bukan pertanyaan terbuka.)*

### Commerce/store surfaces — TIGA domain terpisah (koreksi owner, prompt Phase 3 §2.1 F-03)

**1. License & Extension Shop** — surface publik di landing page:
- Jalur pembelian/perpanjangan **lisensi** dan **extension** epicRider.
- Harus melayani **calon pelanggan yang belum memiliki lisensi** (pembelian lisensi pertama) serta alur renewal yang disepakati.
- Bukan bagian dari Public Store dan bukan Developer Equipment Store.
- Opsi/harga hanya ditampilkan bila datanya ada; dilarang mengarang harga, pajak, payment gateway, atau refund policy (OD-06).

**2. Public Store** — toko produk developer:
- Menjual produk developer kepada pengguna epicRider; produk dapat mencakup produk digital/developer yang disetujui.
- **Akses diberikan kepada user yang memiliki basic license miniRider.**
- Bukan license tier, bukan fitur khusus maxRider/ISOrider, dan **bukan** pengganti jalur pembelian lisensi pertama (jalur itu = License & Extension Shop).

**3. Developer Equipment Store** — toko perlengkapan developer di dalam aplikasi:
- Akses: miniRider allowed; maxRider **denied**; ISOrider **denied** (penolakan di boundary server/API dan diaudit bila/ketika diimplementasikan — REQ-010).

**Aturan pemisahan:** ketiga surface wajib dimodelkan sebagai domain terpisah (katalog, order, akses, API, issuance entitlement, audit masing-masing). Melabeli ulang satu toko yang sama bukanlah pemisahan. Detail: `adr/ADR-018-commerce-surfaces.md` (mengoreksi sebagian ADR-013), `LICENSE_MATRIX.md` §4, `DATA_MODEL_CONCEPT.md` §3.12.

## 2. Entitlement taxonomy

### Tier entitlement
Hak yang berasal dari license tier:
- miniRider;
- maxRider;
- ISOrider.

### Capability
Kemampuan/domain feature, misalnya:
- recruitment;
- candidate discovery;
- CRM;
- asset scanning;
- audit mode;
- notification broadcast.

Capability bukan license.

### Extension
Tambahan yang dapat dibeli/diaktifkan di atas tier:
- additional workspace;
- additional seat package;
- workspace landing;
- mobile/client extension;
- future approved extensions.

Extension bukan tier.

### Effective access
`Effective Access = Tier Entitlement + Active Extensions + Capability Rules + Role/Permission + Resource Context + Object State`

UI hiding tidak pernah menjadi security control.

## 3. Status taxonomy

### Evidence status
`VERIFIED`, `PARTIAL`, `NOT FOUND`, `NOT TESTED`, `BLOCKED`, `PROPOSED`, `UNKNOWN / NEEDS DECISION`

### Decision status
`OPEN`, `PROPOSED`, `ACCEPTED`, `REJECTED`, `SUPERSEDED`

### Requirement status
`PROPOSED`, `APPROVED`, `IMPLEMENTED`, `VERIFIED`, `SUPERSEDED`

### Phase status
`NOT STARTED`, `IN PROGRESS`, `BLOCKED`, `PARTIAL`, `DONE`

Status antar kategori tidak boleh dipertukarkan.

## 4. Architecture invariants

- satu platform/domain foundation;
- global user identity terpisah dari workspace membership;
- membership terpisah dari event assignment;
- server-side authorization;
- server-side entitlement;
- tenant/workspace isolation;
- API/domain layer client-neutral;
- controlled migrations;
- auditability;
- immutable approved records + amendment/version history;
- i18n sejak awal;
- web adalah first-class channel.

## 5. Decision dependency policy

Open decision hanya boleh memblokir bagian yang memang membutuhkan keputusan tersebut.

### OD-01 — Production database
Boleh memblokir final production database selection/migration implementation.
Tidak memblokir domain model, logical data model, threat model, API boundary atau architecture analysis.

### OD-02 — Mobile/client delivery
Tidak memblokir Phase 2 secara keseluruhan.
Phase 2 harus menghasilkan client-neutral domain/API contracts.
Keputusan final PWA/native/cross-platform/wrapper dapat diselesaikan melalui ADR.
Phase 23 delivery tetap bergantung pada keputusan final.

### OD-03 — WhatsApp provider
Tidak memblokir Phase 4 secara keseluruhan.
Hanya provider-specific integration, credentials, configuration dan provider-specific production tests yang blocked.
Identity/session/auth abstraction tetap berjalan.

### OD-05 — Owner seat semantics
Tidak memblokir Phase 5 secara keseluruhan.
Hanya final seat counting, quota enforcement dan billing based on seats yang blocked.

### OD-06 — Billing/commercial
Tidak memblokir Phase 5/14/22 secara keseluruhan.
Dapat dikerjakan:
- product catalog;
- entitlement;
- extension lifecycle;
- abstract pricing;
- commercial state model.

Yang blocked:
- production payment charging;
- final price;
- final tax calculation;
- production payment gateway;
- commercial launch approval.

### OD-09 — Indonesian legal/regulatory obligations
Tidak memblokir generic architecture.
Memblokir legal applicability claim, compliance sign-off dan certification/legal assertions sampai divalidasi oleh pihak kompeten.

## 6. Phase 2 purpose

Phase 2 menghasilkan:
- system/domain architecture;
- bounded contexts;
- domain model;
- logical data model;
- threat model;
- authorization model;
- entitlement model;
- API/client-neutral boundaries;
- ADRs;
- dependency register;
- migration/architecture principles;
- traceability dari Phase 1.

Phase 2 tidak membangun feature UI produksi kecuali prototype arsitektural yang secara eksplisit disetujui.

## 7. Quality

Build success != acceptance.
Screenshot != business-logic proof.
Tidak boleh mengarang vendor, price, tax, legal applicability, certification, test result, implementation status atau owner decision.

## 8. Evidence gate

Setiap fase hanya `DONE` jika output fase tersebut dan evidence review memenuhi acceptance criteria fase tersebut — tidak pernah karena file deliverable tersedia saja. Status fase aktif hanya ada di `ROADMAP.md` (lihat §0).
