# ROADMAP — epicRider

**Sumber urutan:** `MASTER_CONTROL.md` §12 (urutan target, tidak diubah pada Phase 0).
**Aturan status:** Hanya status berbasis bukti. `NOT STARTED` = tidak ada bukti pekerjaan; `IN PROGRESS` = pekerjaan berjalan dengan bukti parsial; `DONE` = seluruh acceptance criteria terbukti (Master Control §15). Fase lain `NOT STARTED` kecuali terbukti sebaliknya.

| Phase | Nama | Status | Bukti / Keterangan |
|---|---|---|---|
| 0 | Audit repository & lock control baseline | **DONE** (owner-approved; ADR-004) | Output: `PHASE_0_AUDIT_REPORT.md`, `PHASE_0_GAP_REGISTER.md`, `PHASE_0_OPEN_DECISIONS.md`, `PHASE_0_ACCEPTANCE.md`, 12 control files. Baseline ter-commit `03293b6`. Verifikasi standar ISO `BLOCKED` (kelanjutan: STANDARD_REGISTER + OD-160). |
| 1 | Discovery, personas, use cases, requirements & acceptance criteria | **DONE — baseline tersedia; efektif setelah owner approval requirement & OD-01/02/116** | 15 artefak Phase 1 (lihat `PHASE_1_REPORT.md`): REQ-001..100, USE_CASES (55 UC), PERSONAS_AND_JOURNEYS (P-01..12), PROCESS_MAP, DOCUMENT_EVIDENCE_MODEL, STANDARD_REGISTER, LICENSE_MATRIX revisi, UX_REQUIREMENTS, NON_FUNCTIONAL_REQUIREMENTS, RISK_REGISTER, OPEN_DECISIONS, TRACEABILITY_MATRIX. |
| 2 | Architecture/domain model, threat model, data model & ADR | NOT STARTED | Prasyarat: approval baseline Phase 1; jawaban OD-01 (database), OD-02 (mobile strategy), OD-116 (DATA_MODEL_CONCEPT). |
| 3 | Repository foundations, design system, i18n & CI/testing foundation | NOT STARTED | — |
| 4 | Identity, authentication, workspace/tenant, memberships & permissions | NOT STARTED | next-auth terpasang tapi tanpa implementasi (`NOT FOUND`); WhatsApp vendor review belum ada. |
| 5 | Licensing, entitlements, renewal/expiry & extensions model | NOT STARTED | — |
| 6 | Home/dashboard & event foundation | NOT STARTED | — |
| 7 | Technical rider & templates | NOT STARTED | — |
| 8 | Asset foundation & asset/set templates | NOT STARTED | — |
| 9 | Media kit/templates | NOT STARTED | — |
| 10 | Team/event workspace, chat, rundown, reports, notifications baseline | NOT STARTED | — |
| 11 | Developer Equipment Store (miniRider only) | NOT STARTED | — |
| 12 | maxRider CRM | NOT STARTED | — |
| 13 | maxRider asset/rental lifecycle, QR/barcode, printing, scanning, maintenance | NOT STARTED | — |
| 14 | maxRider finance/commercial | NOT STARTED | — |
| 15 | Advanced roles/workflow, HSE/risk/readiness/operational controls | NOT STARTED | — |
| 16 | hiRider marketplace/recruitment | NOT STARTED | — |
| 17 | IMS foundation, process architecture, controlled document library | NOT STARTED | — |
| 18 | Forms/checklists, evidence, sign-off/signatures, Audit Mode | NOT STARTED | — |
| 19 | Sustainability, environmental, HSE, infosec, continuity, risk workflows | NOT STARTED | — |
| 20 | Audit programmes, NCR/CAPA, management review, continual improvement | NOT STARTED | — |
| 21 | End-to-end IMS integration, compliance mapping, project/event dossier | NOT STARTED | — |
| 22 | Public landing, Developer Portal, license/extension shop, notification governance | NOT STARTED | — |
| 23 | Extensions, workspace landing pages, mobile/tablet/Windows delivery | NOT STARTED | — |
| 24 | Integrations, import/export, offline & sync hardening | NOT STARTED | — |
| 25 | Security/performance/reliability/backup-restore/DR/accessibility/UAT | NOT STARTED | — |
| 26 | Pilot, production launch, support, measurement, continuous improvement | NOT STARTED | — |

## Dependency usulan hasil audit (tidak mengubah urutan; menunggu keputusan owner)

1. **Verifikasi status/edisi ISO** (baseline ISOrider, Phase 17–21) saat ini `BLOCKED` karena katalog resmi ISO tidak dapat diakses dari lingkungan pengembangan; harus dijalankan dari lingkungan dengan akses `www.iso.org` sebelum desain IMS.
2. **Keputusan database produksi** (OD-01) sebaiknya diputuskan paling lambat awal Phase 2 agar data model tidak dirancang dua kali.
3. **Strategi mobile/delivery** (OD-02) sebaiknya diputuskan pada Phase 2 (ADR) karena mempengaruhi kontrak API.
4. **Vendor WhatsApp OTP** (OD-03) sebaiknya berjalan paralel dengan Phase 1–3 agar Phase 4 tidak tertahan.
5. **Kuota seat (owner dihitung atau tidak, OD-05)** wajib diputuskan sebelum Phase 5 (billing/enforcement) sesuai Master Control §2.
