# PROMPT Z.AI — epicRider PHASE 2
## Architecture, Domain Model, Threat Model, Data Model & ADR

Anda bertindak sebagai Principal Software Architect, Domain Architect, Security Architect, Data Architect, API Architect, dan technical governance lead.

Anda sedang melanjutkan epicRider setelah Phase 0 dan Phase 1.

### KONDISI PENTING

Phase 1 SUDAH DIKERJAKAN.

JANGAN:
- reset project;
- menghapus histori Phase 1;
- mengganti requirement ID;
- membuat ulang discovery;
- mengganti taxonomy tanpa ADR;
- menganggap semua open decision sebagai blocker seluruh Phase 2.

ROADMAP yang ada menyebut Phase 2 sebagai architecture/domain/data/threat/ADR. Beberapa dependency lama terlalu ketat. Control files yang dilampirkan pada prompt ini adalah baseline yang telah direkonsiliasi dan harus menjadi sumber kendali.

---

# 1. HIERARCHY OF TRUTH

Prioritas:

1. `MASTER_CONTROL.md`
2. `ARCHITECTURE.md`
3. `DECISIONS.md`
4. `REQUIREMENTS.md` Phase 1 yang aktual
5. `LICENSE_MATRIX.md`
6. `SECURITY.md`
7. `UX_REQUIREMENTS.md`
8. `UX_UI_STANDARD.md`
9. `TESTING.md`
10. artefak Phase 1 lainnya
11. kode/repository sebagai CURRENT STATE evidence

Jika terjadi konflik:
- jangan memilih diam-diam;
- catat konflik;
- tentukan apakah historical/superseded;
- gunakan canonical control;
- buat ADR bila diperlukan.

---

# 2. PRODUCT TAXONOMY — WAJIB

Hanya ada tiga license tiers:

- miniRider
- maxRider
- ISOrider

## hiRider

hiRider BUKAN LICENSE.

hiRider adalah portal/capability di epicRider untuk mempertemukan:
- workspace yang membuka recruitment;
- calon anggota tim;
- user dengan profile/skill/portfolio;
- application;
- shortlist;
- recruitment decision;
- assignment.

WAJIB menjaga:

`Application != Workspace Membership`

`Application != Event Assignment`

`Acceptance != Automatic Workspace Access`

Jangan membuat `hiRider` sebagai `license_tier`.

## Public Store

Public Store adalah toko developer.

Menjual:
- license products;
- extensions;
- approved developer products.

Akses Public Store:
**user dengan basic license miniRider.**

Jangan memodelkan Public Store sebagai entitlement khusus maxRider/ISOrider.

## Developer Equipment Store

Hanya miniRider.

---

# 3. ENTITLEMENT MODEL

Pisahkan secara eksplisit:

### Tier
miniRider / maxRider / ISOrider

### Capability
Kemampuan domain seperti recruitment, CRM, asset scanning, audit mode.

### Extension
Tambahan seperti additional workspace, additional seat, workspace landing, mobile/client extension.

Effective access:

`Tier + Active Extension + Capability Rules + Role/Permission + Resource Context + Object State`

Semua security-sensitive enforcement server-side.

---

# 4. PHASE 2 OBJECTIVES

Bangun/dokumentasikan:

1. System Architecture
2. Domain Architecture
3. Bounded Contexts
4. Domain Model
5. Logical Data Model
6. Threat Model
7. Authorization Model
8. Entitlement Model
9. API Architecture / Client-Neutral Contracts
10. ADR Register
11. Dependency Matrix
12. Traceability
13. Migration/data integrity principles
14. Phase 2 report and acceptance evidence

---

# 5. DO NOT OVER-BLOCK PHASE 2

## OD-01 database
Jika production database belum final:
- lanjutkan logical model;
- lanjutkan domain model;
- lanjutkan architecture;
- lanjutkan threat model;
- lanjutkan API boundaries.

Hanya physical database selection/migration final yang boleh tetap OPEN.

## OD-02 mobile
JANGAN memblokir Phase 2.

Phase 2 harus menghasilkan API/domain architecture yang client-neutral.

Boleh membuat ADR evaluasi:
- PWA;
- native;
- cross-platform;
- wrapper/hybrid.

Jangan memilih teknologi hanya karena prompt meminta pilihan. Jika belum ada owner decision/evidence cukup, status tetap OPEN/PROPOSED.

## OD-03 WhatsApp
JANGAN memblokir Phase 4 architecture dan JANGAN memblokir Phase 2.

Buat:
- provider abstraction;
- auth interface;
- token/security requirements;
- rate-limit boundary;
- recovery/fallback architecture.

Vendor-specific implementation tetap OPEN.

## OD-05 owner seat
JANGAN memblokir Phase 5 architecture.

Modelkan:
- Seat/Member concept;
- quota concept;
- entitlement relationship;
- enforcement point.

Jika owner-counting belum diputuskan, tandai parameter sebagai OPEN.

## OD-06 billing
JANGAN memblokir architecture.

Modelkan:
- Product;
- Catalog;
- License;
- Entitlement;
- Extension;
- Order/Purchase abstraction;
- lifecycle states;
- audit.

Jangan mengarang:
- harga;
- pajak;
- payment gateway;
- refund policy.

## OD-09
Catat legal/regulatory obligations sebagai uncertainty/register.

Jangan membuat legal conclusion.

---

# 6. DOMAIN MODEL REQUIREMENTS

At minimum analisis bounded contexts:

- Identity
- Workspace/Tenant
- Membership & Roles
- Event & Assignment
- License/Entitlement
- Extensions
- hiRider Recruitment
- Asset
- Technical Rider
- Media Kit
- Communication/Notification
- Developer Commerce/Store
- Document/Evidence
- Audit
- Finance/Commercial
- IMS
- Integration/Sync

Anda boleh mengusulkan perubahan boundary jika ada alasan arsitektural yang kuat.

Jangan memecah domain hanya demi jumlah modul.

---

# 7. HI RIDER DOMAIN MODEL

Minimal:

`User/Profile`

`Skill`

`Portfolio`

`Recruitment Opening`

`Application`

`Application Status History`

`Shortlist`

`Recruitment Decision`

`Workspace Membership`

`Event Assignment`

Model lifecycle yang eksplisit.

Contoh:

`DRAFT → OPEN → PAUSED → CLOSED`

Application:

`SUBMITTED → REVIEWING → SHORTLISTED → ACCEPTED / REJECTED / WITHDRAWN`

Tetapi jangan menganggap lifecycle contoh sebagai owner-approved final. Catat sebagai proposed domain state dan buat ADR bila diperlukan.

---

# 8. IDENTITY / TENANCY

Wajib memisahkan:

`User`

`Workspace`

`Workspace Membership`

`Role`

`Event`

`Event Assignment`

`Developer Role`

`Auditor Access`

Jangan membuat user = workspace member.

Jangan membuat license = role.

Jangan membuat application = membership.

---

# 9. AUTHORIZATION MODEL

Authorization harus dapat mengevaluasi:

`Actor`

+

`Tenant/Workspace`

+

`Object`

+

`Action`

+

`Event Context`

+

`Tier Entitlement`

+

`Extension`

+

`Role/Permission`

+

`Object State`

Definisikan:
- policy layer;
- permission vocabulary;
- resource ownership;
- tenant isolation;
- role inheritance;
- deny-by-default;
- server-side enforcement.

---

# 10. DATA MODEL

Buat `DATA_MODEL_CONCEPT.md`.

Dokumentasikan:
- entity;
- purpose;
- ownership;
- cardinality;
- lifecycle;
- state;
- invariant;
- auditability;
- versioning;
- tenant boundary;
- indexes/access patterns;
- migration implications.

Jangan mengunci vendor database jika OD-01 belum final.

---

# 11. THREAT MODEL

Buat `THREAT_MODEL.md`.

Minimal threat categories:

- authentication abuse;
- session theft;
- account takeover;
- OAuth account linking abuse;
- WhatsApp OTP abuse;
- tenant isolation failure;
- authorization bypass;
- entitlement bypass;
- hiRider privacy leakage;
- fake/abusive recruitment;
- workspace membership escalation;
- event assignment escalation;
- store purchase/entitlement fraud;
- developer role abuse;
- price/catalog manipulation;
- notification abuse;
- audit/evidence tampering;
- replay;
- race conditions;
- offline/sync authorization;
- malicious file upload;
- secrets exposure;
- dependency/supply-chain risk.

Untuk tiap threat:
- asset;
- actor;
- entry point;
- trust boundary;
- threat;
- impact;
- likelihood;
- control;
- residual risk;
- test/evidence.

Jangan mengarang quantitative risk scores jika methodology belum disetujui. Gunakan qualitative/proposed scoring bila perlu.

---

# 12. API ARCHITECTURE

Buat `API_ARCHITECTURE.md`.

API harus client-neutral.

Dokumentasikan:
- resource boundaries;
- command/query separation bila relevan;
- authorization;
- idempotency;
- pagination;
- filtering;
- concurrency;
- error model;
- validation;
- versioning;
- audit;
- tenant context;
- offline/sync considerations.

Jangan membuat endpoint production lengkap untuk seluruh aplikasi pada Phase 2.

Yang dibutuhkan adalah contract/boundary architecture.

---

# 13. ADR

Buat `ADR_REGISTER.md`.

ADR minimal yang harus dipertimbangkan:
- production DB;
- mobile/client strategy;
- identity/auth abstraction;
- WhatsApp provider abstraction;
- authorization model;
- entitlement model;
- hiRider domain boundary;
- Public Store boundary;
- extension model;
- audit/versioning;
- API versioning;
- concurrency/idempotency.

Setiap ADR:
- context;
- problem;
- options;
- decision;
- consequences;
- status;
- evidence;
- dependencies.

Jika owner decision belum tersedia, jangan memalsukan ACCEPTED. Gunakan OPEN/PROPOSED.

---

# 14. TRACEABILITY

Buat `PHASE_2_TRACEABILITY.md`.

Phase 1 saat ini memiliki baseline REQ-001..REQ-100 menurut ROADMAP.

WAJIB:
- jangan mengganti 100 requirement tersebut dengan seed lama 46 requirement;
- jangan renumber;
- jika ada perubahan, gunakan mapping;
- trace requirement → use case → domain → data → API → security → test/evidence.

---

# 15. UX/UI BOUNDARY

Phase 2 tidak membangun production UI.

Namun architecture harus mengakomodasi:
- web first-class;
- desktop/tablet/mobile browser;
- responsive design;
- accessibility;
- i18n;
- state completeness;
- server-side authorization.

Do not lock mobile client technology merely to make architecture look complete.

---

# 16. QUALITY / ANTI-HALLUCINATION

DILARANG mengarang:
- vendor;
- price;
- tax;
- payment gateway;
- legal applicability;
- ISO certification;
- test result;
- security result;
- owner decision;
- production implementation status.

Pisahkan:
`CURRENT STATE`
`TARGET STATE`
`PROPOSED`
`ACCEPTED`
`VERIFIED`

---

# 17. REQUIRED FILES

Update/create:

1. `MASTER_CONTROL.md`
2. `ARCHITECTURE.md`
3. `DECISIONS.md`
4. `ROADMAP.md`
5. `LICENSE_MATRIX.md`
6. `SECURITY.md`
7. `TESTING.md`
8. `CONTROL_CONSISTENCY_MATRIX.md`
9. `PHASE_2_ACCEPTANCE.md`
10. `PHASE_2_DEPENDENCY_MATRIX.md`
11. `PHASE_2_TRACEABILITY.md`
12. `DATA_MODEL_CONCEPT.md`
13. `THREAT_MODEL.md`
14. `AUTHORIZATION_MODEL.md`
15. `ENTITLEMENT_MODEL.md`
16. `API_ARCHITECTURE.md`
17. `ADR_REGISTER.md`
18. individual ADR files where required
19. `PHASE_2_REPORT.md`

Jika file 1–7 sudah ada, update secara minimal dan preserve valid historical evidence.

---

# 18. VALIDATION BEFORE FINISH

Sebelum menyatakan Phase 2 selesai:

### Text consistency scan
Cari:
- `hiRider license`
- `hiRider tier`
- `hiRider fourth`
- `Public Store maxRider`
- `Public Store ISOrider`
- `OD-02 blocks Phase 2`
- `OD-03 blocks Phase 4`
- `OD-05 blocks Phase 5`
- `OD-06 blocks entire Phase`
- `OD-116 prerequisite Phase 2`
- `CRUP`

Tidak boleh ada kontradiksi aktif.

### Cross-reference
Pastikan:
- semua file referenced exist;
- no broken internal references;
- no duplicated canonical definitions;
- Phase 1 REQ IDs preserved;
- OD IDs preserved;
- no invented decision IDs.

### Evidence
Catat:
- commands;
- outputs;
- files changed;
- checks performed;
- NOT RUN;
- BLOCKED;
- limitations.

---

# 19. PHASE 2 EXIT

Jangan menyatakan `DONE` hanya karena semua markdown dibuat.

Phase 2 hanya DONE jika:
- architecture coherent;
- domain model coherent;
- data model coherent;
- threat model coherent;
- authorization coherent;
- entitlement coherent;
- API boundaries coherent;
- ADRs complete enough;
- dependencies scoped correctly;
- Phase 1 traceability preserved;
- contradiction scan clean;
- acceptance evidence recorded.

Jika ada owner decision yang masih OPEN:
- jangan invent;
- lanjutkan bagian yang tidak bergantung padanya;
- tandai bagian spesifik yang blocked;
- Phase 2 hanya BLOCKED bila acceptance criterion kritis memang tidak dapat diselesaikan tanpa decision tersebut.
