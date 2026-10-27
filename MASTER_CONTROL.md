# MASTER CONTROL — epicRider

## 0. Canonical status

Dokumen ini adalah control baseline untuk kelanjutan Phase 2 setelah Phase 1 sudah dikerjakan.

**Penting:** Phase 1 tidak dihapus atau di-reset. Artefak Phase 1 yang sudah ada tetap menjadi baseline/evidence dan harus dipertahankan traceability-nya.

### Current project state
- Phase 0: audit/control baseline tersedia.
- Phase 1: baseline discovery/requirements tersedia.
- Phase 2: architecture/domain/data/threat model & ADR adalah fase berikutnya.
- Phase 2 boleh berjalan dengan beberapa open decisions, selama keputusan tersebut tidak benar-benar diperlukan untuk menentukan invariant arsitektur yang sedang dikerjakan.

## 1. Product taxonomy

### License tiers
Hanya tiga license tier:
1. miniRider
2. maxRider
3. ISOrider

### hiRider
**hiRider bukan license, bukan tier keempat, dan bukan nilai pada `license_tier`.**

hiRider adalah portal/capability di ekosistem epicRider untuk:
- workspace membuka recruitment;
- user melihat calon kesempatan;
- user/calon anggota tim membuat profil, skill dan portfolio;
- user melamar ke recruitment opening;
- workspace melihat, menyaring, menerima/menolak kandidat;
- assignment dapat dilakukan setelah proses recruitment.

Invariant:
`Application != Workspace Membership`
`Application != Event Assignment`
`Acceptance != Automatic Workspace Access`

### Public Store
Public Store adalah toko developer untuk menjual produk developer kepada pengguna epicRider.

Produk dapat mencakup:
- license products;
- extensions;
- produk digital/developer lain yang disetujui.

**Akses Public Store diberikan kepada user yang memiliki basic license miniRider.**

Public Store bukan license tier dan bukan fitur khusus maxRider/ISOrider.

### Developer Equipment Store
Developer Equipment Store adalah toko perlengkapan developer di dalam aplikasi.

Akses:
- miniRider: allowed;
- maxRider: denied;
- ISOrider: denied.

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

Phase 2 hanya DONE jika output architecture/data/threat/ADR dan evidence review memenuhi acceptance criteria Phase 2.
