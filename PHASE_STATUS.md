# PHASE STATUS — epicRider

**Sumber kebenaran:** bukti di repository. Tanggal update terakhir: 2026-10-27 (Phase 1).
**Aturan:** status hanya diubah dengan bukti baru (Master Control §3.6, §15).

| Phase | Nama | Status | Bukti / Blocker |
|---|---|---|---|
| 0 | Audit repository & lock control baseline | **DONE** (disetujui owner: baseline ter-commit `03293b6` + instruksi owner melanjutkan Phase 1; lihat ADR-004) | Laporan: `PHASE_0_AUDIT_REPORT.md`, `PHASE_0_GAP_REGISTER.md`, `PHASE_0_OPEN_DECISIONS.md`, `PHASE_0_ACCEPTANCE.md` (9/9 exit criteria); 12 control files kanonik; verifikasi ISO `BLOCKED` (kelanjutan: STANDARD_REGISTER + OD-160). |
| 1 | Discovery, personas, use cases, requirements & acceptance criteria | **DONE — baseline tersedia & konsisten; efektif penuh setelah owner menyetujui requirement (PROPOSED→APPROVED) dan menjawab OD-01/02/116** | 15 artefak: `PHASE_1_REPORT.md` + 13 artefak discovery + update kontrol; REQ-001..100, 55 UC, P-01..12/J-01..12, PROC/KPI, STD register (BLOCKED jujur), UXR-01..20, NFR-01..16, RSK-101..125, OPEN_DECISIONS terkonsolidasi; consistency check grep lolos (2 defect diperbaiki: OD-168, typo OD-109). |
| 2 | Architecture/domain model, threat model, data model & ADR | NOT STARTED | — |
| 3 | Repository foundations, design system, i18n & CI/testing foundation | NOT STARTED | — |
| 4 | Identity, authentication, workspace/tenant, memberships & permissions | NOT STARTED | — |
| 5 | Licensing, entitlements, renewal/expiry & extensions | NOT STARTED | — |
| 6 | Home/dashboard & event foundation | NOT STARTED | — |
| 7 | Technical rider & templates | NOT STARTED | — |
| 8 | Asset foundation & asset/set templates | NOT STARTED | — |
| 9 | Media kit/templates | NOT STARTED | — |
| 10 | Team/event workspace, chat, rundown, reports, notifications | NOT STARTED | — |
| 11 | Developer Equipment Store (miniRider) | NOT STARTED | — |
| 12 | maxRider CRM | NOT STARTED | — |
| 13 | maxRider asset/rental lifecycle, QR/print/scan, maintenance | NOT STARTED | — |
| 14 | maxRider finance/commercial | NOT STARTED | — |
| 15 | Advanced roles/workflow, HSE/risk/readiness | NOT STARTED | — |
| 16 | hiRider marketplace/recruitment | NOT STARTED | — |
| 17 | IMS foundation, process architecture, document library | NOT STARTED | Prasyarat data: verifikasi standar ISO (ISO_IMS_BLUEPRINT §2) |
| 18 | Forms/checklists, evidence, sign-off, Audit Mode | NOT STARTED | — |
| 19 | Sustainability, environmental, HSE, infosec, continuity, risk | NOT STARTED | — |
| 20 | Audit programmes, NCR/CAPA, management review | NOT STARTED | — |
| 21 | E2E IMS integration, compliance mapping, dossier | NOT STARTED | — |
| 22 | Public landing, Developer Portal, shop, notification governance | NOT STARTED | — |
| 23 | Extensions, workspace landing pages, mobile/tablet/Windows | NOT STARTED | — |
| 24 | Integrations, import/export, offline & sync hardening | NOT STARTED | — |
| 25 | Security/perf/reliability/backup/DR/a11y/UAT | NOT STARTED | — |
| 26 | Pilot, production launch, support, measurement | NOT STARTED | — |

**Catatan integritas:**
- Fase hanya ditandai DONE dengan bukti (Master Control §15). Status standar ISO tetap NOT VERIFIED — BLOCKED (kelanjutan terlacak via STANDARD_REGISTER + OD-160).
- Perubahan status berikutnya wajib menyertakan: command/test dijalankan, hasil aktual, dan referensi acceptance criteria.
