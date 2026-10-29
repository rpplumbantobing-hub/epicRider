# ROADMAP — epicRider

## Status rule

`NOT STARTED` = no evidence of work.
`IN PROGRESS` = partial evidence.
`PARTIAL` = work/evidence incomplete.
`BLOCKED` = specific scope cannot proceed because a dependency is required.
`DONE` = all phase acceptance criteria are evidenced.

## Phase state

**Sumber nama/outcome fase 0–26:** Master Control §12 (roadmap kendali). Kolom Status/Bukti = kondisi aktual berbasis bukti — dipisahkan eksplisit dari outcome yang direncanakan. Fase 4–26 **tidak dimulai otomatis** (MC §12: "Roadmap ini adalah urutan target, bukan bukti bahwa fase sudah dikerjakan").

*Catatan remediasi (F-07, audit konsistensi Phase 3, 2026-10-28): tabel fase 4–26 yang sebelumnya diringkas menjadi satu baris generik dipulihkan menjadi satu baris per fase agar outcome tiap fase terlihat di sumber tunggal status. Semua fase 4–26 tetap `NOT STARTED`.*

*Catatan rekonsiliasi pra-Phase 4 (2026-10-28, Stage A — `OBSOLETE_AND_SUPERSEDED_REGISTER.md` + MC-V4):* status Phase 2 diturunkan dari `DONE` (klaim historis 2026-10-27/28) menjadi **`PARTIAL`**, dan Phase 4 ditetapkan **`BLOCKED / NOT STARTED`**, sampai `PRE_PHASE_4_GATE.md` lulus dengan bukti. Dasar: (1) Obsolete Register menetapkan klaim DONE/pass lama tanpa bukti reproduktif = "historical claim only"; (2) bukti build produksi & eksekusi workflow CI belum pernah tersedia pada runner sah (sandbox tidak memiliki remote/runner); (3) rekonsiliasi kontrol MC-V4 baru dipasang. Rujukan "MC §12" pada kolom nama fase = MC-V1 §12 historis (`CONTROL_REFERENCE_CROSSWALK.md` §2b).

*Catatan governance closure Phase 4 (2026-10-30):* Phase 4 ditutup sebagai **`DONE`** setelah owner mempromosikan kandidat R2 via **PR #1 (Merged)** — merge commit **`a1af59d8e00d3a0d8e28b25f1a7f05961182a6a0`** pada `main` — dan **CI post-merge lulus** (GitHub Actions run #5 / 40928261468, `Success`, job `lint, typecheck, test, build`, commit `a1af59d`). Kondisi penahan terakhir `PHASE_4_ACCEPTANCE.md` §D ("remote CI pasca-integrasi owner") terpenuhi dan diverifikasi live. Audit closure 16/16 kriteria mandatory PASS; limitations tetap tercatat jujur (Google OIDC real round-trip `NOT TESTED`; OD-03 hanya memblokir integrasi vendor WhatsApp; REQ-047 runtime `NOT ASSESSED`; OD-115/OD-122 `PROPOSED`). Catatan lengkap: `PHASE_4_GOVERNANCE_CLOSURE.md`. **Phase 5 TIDAK dimulai** (MC-V4 §11 — tanpa otorisasi owner terpisah).

| Phase | Nama (outcome yang direncanakan — MC §12) | Status | Bukti / Blocker / Dependency |
|---|---|---|---|
| 0 | Audit repository, verifikasi bukti & penguncian control baseline | **DONE — existing evidence** | `PHASE_0_ACCEPTANCE.md` (9/9); commit `03293b6`; verifikasi ISO `BLOCKED` (F0-012, OD-160) |
| 1 | Discovery, personas, use cases, requirements & acceptance criteria | **DONE — BASELINE** | `PHASE_1_REPORT.md` + 13 artefak; REQ-001..100; commit `938932f` |
| 2 | Architecture/domain model, threat model, data model & ADR | **PARTIAL — arsitektur lengkap & direkonsiliasi (2026-10-28), namun evidence gate belum terpenuhi ulang di bawah kontrol terbaru** | `PHASE_2_ACCEPTANCE.md` A–G (assessment 2026-10-27 + re-assessment 2026-10-28 — klaim "DONE as architecture baseline" lama = klaim historis, bukan otoritas status); `PHASE_2_CONSISTENCY_REMEDIATION_REPORT.md`; seluruh 8 deliverable ada & konsisten; yang belum: build/CI bukti reproduktif pada runner sah + ratifikasi owner ADR PROPOSED (+ADR-018) + keputusan OD-01/OD-02 — non-blocking untuk arsitektur, blocking untuk kelulusan penuh di bawah kebijakan kontrol 2026-10-28 (Obsolete Register §2) |
| 3 | Repository foundations, design system, i18n & CI/testing foundation (+ Gate A remediasi konsistensi Phase 2; + remediasi audit Phase 3 F-01..F-08) | **PARTIAL — kontrol diremediasi 2026-10-28; evidence build/CI belum terpenuhi** | `PHASE_3_ACCEPTANCE.md` (re-assessed: kriteria 12 = PARTIAL — build NOT RUN karena dilarang platform sandbox; CI remote NOT TESTED); `PHASE_3_REPORT.md`; `PHASE_3_REMEDIATION_REPORT.md`; lint/typecheck/test exit 0 (25/25); screenshot showcase. Status naik ke DONE hanya setelah `bun run build` + CI remote terbukti di runner owner |
| 4 | Identity, authentication, workspace/tenant, memberships & permissions | **DONE — closed 2026-10-30** (implementasi R2 dipromosikan via PR #1 Merged; CI post-merge `main` lulus; audit closure 16/16 kriteria PASS dengan limitations tercatat — `PHASE_4_GOVERNANCE_CLOSURE.md`; status sebelumnya: `IN PROGRESS` mulai 2026-10-28 setelah `PRE_PHASE_4_GATE = PASS` 2026-10-28) | Merge commit `a1af59d8e00d3a0d8e28b25f1a7f05961182a6a0` (PR #1 "Phase 4 R2 — Controlled Promotion", parents `b5defc22` + `f29f152`; commit promosi `80f5329`/`5e002db`/`f29f152` — semua ancestor `main`, diverifikasi Git 2026-10-30); CI post-merge run #5 <https://github.com/rpplumbantobing-hub/epicRider/actions/runs/40928261468> `Success` (job `lint, typecheck, test, build`; ≈1m 4s; diverifikasi live + badge `CI - passing`); bukti lokal R2: 113/113 test (25 regresi Phase 3 + 88 Phase 4 termasuk 12 HTTP routing), lint/typecheck exit 0, build exit 0 (review 3 + CI); provenance R2 `e12b9dbc…cf97fe` (637.394 byte; 80/17/0; 97/97 hash manifest). Limitations: Google OIDC real round-trip `NOT TESTED`; vendor WhatsApp = OD-03 (OPEN — hanya sub-scope itu); REQ-047 runtime `NOT ASSESSED`; OD-115/OD-122 `PROPOSED` — daftar lengkap `PHASE_4_GOVERNANCE_CLOSURE.md` §8 |
| 5 | Licensing, entitlements, renewal/expiry & extensions model | NOT STARTED | Sub-scope tertahan: OD-05 (final seat counting), OD-06 (charging/harga final), OD-108 (expiry/grace/downgrade) — arsitektur katalog/entitlement tidak tertahan |
| 6 | Home/dashboard & event foundation | NOT STARTED | — |
| 7 | Technical rider & templates | NOT STARTED | — |
| 8 | Asset foundation & asset/set templates | NOT STARTED | — |
| 9 | Media kit/templates | NOT STARTED | — |
| 10 | Team/event workspace, chat, rundown, reports & notifications baseline | NOT STARTED | OD-125 (scope notifikasi baseline, kandidat) |
| 11 | Developer Equipment Store khusus miniRider | NOT STARTED | ADR-018 (surface model); OD-133/OD-135 (harga/order) menahan nilai komersial, bukan struktur |
| 12 | maxRider CRM | NOT STARTED | — |
| 13 | maxRider asset/rental lifecycle, QR/barcode, printing, scanning, maintenance/readiness | NOT STARTED | OD-07 (offline-first), OD-107 (konflik reservasi), OD-184 (matrix scanner) |
| 14 | maxRider finance/commercial | NOT STARTED | OD-06 (charging/harga/gateway) — state model tidak tertahan |
| 15 | Advanced roles/workflow, HSE/risk/readiness/operational controls | NOT STARTED | — |
| 16 | hiRider marketplace/recruitment | NOT STARTED | Scope terkunci: termasuk penawaran jasa/ServiceOffer (ADR-021; OD-185 CLOSED); desain lifecycle = pekerjaan fase ini; OD-109 (visibilitas), OD-134 (kontak lamaran) |
| 17 | IMS foundation, process architecture & controlled document library | NOT STARTED | Prasyarat data: verifikasi standar ISO (`BLOCKED` — F0-012, OD-160); OD-140..OD-144 |
| 18 | Forms/checklists, evidence, sign-off/signatures & Audit Mode | NOT STARTED | OD-103 (kekuatan hukum sign-off), OD-104 (retensi) |
| 19 | Sustainability, environmental, HSE, information security, continuity & risk workflows | NOT STARTED | OD-105 (metodologi GHG), OD-106 (KPI target) |
| 20 | Audit programmes, NCR/CAPA, management review & continual improvement | NOT STARTED | — |
| 21 | End-to-end IMS integration, compliance mapping & project/event dossier | NOT STARTED | — |
| 22 | Public landing, Developer Portal, license/extension shop, notification governance | NOT STARTED | ADR-018 (tiga surface: License & Extension Shop = jalur first-license); OD-06, OD-101, OD-102, OD-111 |
| 23 | Extensions, workspace landing pages, mobile/tablet/Windows delivery | NOT STARTED | ADR-007/OD-02 (strategi client final) — menahan delivery, bukan kontrak API |
| 24 | Integrations, import/export, offline & sync hardening | NOT STARTED | OD-07, OD-111 |
| 25 | Security/performance/reliability/backup-restore/DR/accessibility/UAT | NOT STARTED | OD-112 (target NFR), OD-114 (RPO/RTO) |
| 26 | Pilot, production launch, support, measurement & continuous improvement | NOT STARTED | OD-10 (hosting/rilis) |

## Phase 2 entry correction

The following are NOT full Phase 2 blockers:
- OD-02 mobile strategy;
- OD-03 WhatsApp vendor;
- OD-05 owner seat semantics;
- OD-06 billing;
- OD-09 legal validation;
- OD-116 DATA_MODEL_CONCEPT.

OD-01 production database may constrain the final physical database decision, but it does not block logical architecture/data modeling.

## Phase 2 dependencies

| Dependency | Phase 2 impact | Rule |
|---|---|---|
| OD-01 database | PARTIAL | logical model proceeds; final physical DB may remain open |
| OD-02 mobile | NON-BLOCKING | client-neutral API/domain contracts required |
| OD-03 WhatsApp | NON-BLOCKING | provider abstraction required |
| OD-05 owner seat | NON-BLOCKING | model seat concept; defer final counting rule |
| OD-06 billing | NON-BLOCKING | model commercial states/catalog abstractions; defer charging |
| OD-09 legal | NON-BLOCKING | record obligations/uncertainty; no legal claims |
| OD-116 data model concept | PHASE 2 WORK | must be produced/refined in Phase 2 |
| OD-160 ISO verification | NON-BLOCKING for generic architecture | IMS mapping may remain provisional |

## Phase 2 completion

Phase 2 completion is determined by `PHASE_2_ACCEPTANCE.md`, not by the existence of files alone.

## Phase 3 completion

Phase 3 completion is determined by `PHASE_3_ACCEPTANCE.md` (re-assessed 2026-10-28 setelah remediasi audit Phase 3) — bukan oleh keberadaan file. Status saat ini: **PARTIAL** (kontrol diremediasi; build & CI remote belum terbukti). Fase 4 tidak dimulai otomatis.

## Phase 4 entry gate

Phase 4 hanya boleh dimulai setelah `PRE_PHASE_4_GATE.md` lulus dengan bukti tercatat di `PRE_PHASE_4_GATE_REPORT.md` (prompt Phase 4 gated §1.3). Sampai gate lulus: status Phase 4 = `BLOCKED / NOT STARTED`. Build produksi harus dibuktikan pada runner/working copy terisolasi; workflow CI harus benar-benar dieksekusi pada runner yang sah (remote CI atau runner setara) — menjalankan lint/typecheck/test/build manual di sandbox TIDAK setara dengan eksekusi workflow CI (Obsolete Register §2).

*Pembaruan 2026-10-28: gate **LULUS** — `PRE_PHASE_4_GATE = PASS`. Eksekusi workflow CI pada runner sah terbukti: GitHub Actions run `#1` `Success` pada commit `2b2141c`, branch `main` (run URL tercatat di `PRE_PHASE_4_GATE_REPORT.md` §Re-execution 2026-10-28; item 1–11 di-re-evaluasi, semua PASS). Status Phase 4 = `AUTHORIZED / READY TO START` — **belum STARTED**: belum ada pekerjaan Phase 4 yang dilakukan; pelaksanaan tetap mengikuti prompt Phase 4 gated (Stages B/C) pada baseline kontrol yang sama (MC-V4). Warning CI (deprecasi action Node.js 20; migrasi image runner Ubuntu) dicatat sebagai NON-BLOCKING OBSERVATIONS — tanpa perubahan workflow/dependency.*

*Pembaruan 2026-10-30 (governance closure):* syarat kelulusan penuh terpenuhi — implementasi terverifikasi dipromosikan owner ke `main` (PR #1 Merged, merge commit `a1af59d8e00d3a0d8e28b25f1a7f05961182a6a0`) dan **CI post-merge pada `main` lulus** (run #5 / 40928261468, `Success`). Seluruh kriteria acceptance wajib `PHASE_4_ACCEPTANCE.md` terpenuhi dengan bukti; Phase 4 = **`DONE`** (batasan tetap tercatat — lihat `PHASE_4_GOVERNANCE_CLOSURE.md`). Merge commit ini sekaligus menyediakan bukti build+CI pada runner sah yang sebelumnya menjadi syarat kenaikan status Phase 3 — penilaian ulang status Phase 3 (`PHASE_3_ACCEPTANCE.md` kriteria 12) = tindakan governance terpisah atas keputusan owner, TIDAK diubah oleh closure ini (batasi scope; Phase 3 tetap `PARTIAL` sampai dinilai ulang secara tercatat).
