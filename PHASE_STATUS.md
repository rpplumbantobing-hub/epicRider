# PHASE STATUS — epicRider

**Sumber kebenaran:** bukti di repository. Tanggal update terakhir: 2026-10-28 (remediasi audit konsistensi Phase 3 — F-01..F-08 dieksekusi; status Phase 3 dikoreksi menjadi **PARTIAL** sesuai aturan DoD; lihat `PHASE_3_REMEDIATION_REPORT.md`). Dokumen ini adalah **ringkasan** — sumber tunggal status fase = `ROADMAP.md` (MC §0).
**Aturan:** status hanya diubah dengan bukti baru (MC §3 Status taxonomy; MC §8 Evidence gate; aturan status fase di `ROADMAP.md`). Rujukan lama "Master Control §3.6, §15" adalah penomoran MC-V1 — lihat `CONTROL_REFERENCE_CROSSWALK.md`.

| Phase | Nama | Status | Bukti / Blocker |
|---|---|---|---|
| 0 | Audit repository & lock control baseline | **DONE** (disetujui owner: baseline ter-commit `03293b6` + instruksi owner melanjutkan Phase 1; lihat ADR-004) | Laporan: `PHASE_0_AUDIT_REPORT.md`, `PHASE_0_GAP_REGISTER.md`, `PHASE_0_OPEN_DECISIONS.md`, `PHASE_0_ACCEPTANCE.md` (9/9 exit criteria); 12 control files kanonik; verifikasi ISO `BLOCKED` (kelanjutan: STANDARD_REGISTER + OD-160). |
| 1 | Discovery, personas, use cases, requirements & acceptance criteria | **DONE — BASELINE** (rekonsiliasi owner 2026-10-27; koreksi taksonomi & dependensi, lihat addendum `PHASE_1_REPORT.md`) | 15 artefak: `PHASE_1_REPORT.md` + 13 artefak discovery + update kontrol; REQ-001..100, 55 UC, P-01..12/J-01..12, PROC/KPI, STD register (BLOCKED jujur), UXR-01..20, NFR-01..16, RSK-101..125, OPEN_DECISIONS terkonsolidasi; consistency check grep lolos (2 defect diperbaiki: OD-168, typo OD-109). ~~Syarat "jawab OD-01/02/116"~~ **SUPERSEDED** — kini non-blocking (lihat `DECISIONS.md` 2026-10-27). |
| 2 | Architecture/domain model, threat model, data model & ADR | **DONE — architecture baseline 2026-10-27, re-verified 2026-10-28** (`PHASE_2_ACCEPTANCE.md` A–G evidenced + blok re-assessment 2026-10-28; remediasi F-01..F-08 = `PHASE_2_CONSISTENCY_REMEDIATION_REPORT.md`; kualifikasi: 7 ADR PROPOSED + ADR-018 menunggu ratifikasi owner; OD-01/OD-02 OPEN non-blocking; ~~OD-185~~ CLOSED — DECIDED BY BASELINE via ADR-021, remediasi audit Phase 3) | 8 deliverable arsitektur (DATA_MODEL_CONCEPT, AUTHORIZATION_MODEL, ENTITLEMENT_MODEL, THREAT_MODEL, API_ARCHITECTURE, ADR_REGISTER + adr/ADR-006..017, LEGAL_REGULATORY_REGISTER, PHASE_2_TRACEABILITY 100/100). Scan ulang 2026-10-28 = 0 kontradiksi aktif (`audit/phase3-scan/`; bukti tambahan `audit/phase3-remediation/`). Laporan: `PHASE_2_REPORT.md` (+§15 addendum). |
| 3 | Repository foundations, design system, i18n & CI/testing foundation | **PARTIAL — kontrol diremediasi 2026-10-28, evidence build/CI belum terpenuhi** (remediasi F-01..F-08 audit Phase 3 dieksekusi: scope hiRider diselaraskan ADR-021/OD-185 CLOSED, tiga commerce surface tersinkron REQ-030+PRODUCT_SCOPE+matrix, `.env` dilepas dari Git index + `.env.example` ter-track, ROADMAP 0–26 dipulihkan, bukti audit diregenerasi `audit/phase3-remediation/`; lint/typecheck/test exit 0 — **build NOT RUN: dilarang platform sandbox; CI remote NOT TESTED: tanpa git remote** → per aturan DoD Phase 3 §10.12, status fase = `PARTIAL`, bukan `DONE`, sampai build+CI terbukti di runner owner) | Fondasi: scripts lint/typecheck/test nyata (exit 0; 25/25 tests); tokens + 4 foundation components + showcase `/` (i18n id/en 85/85 keys, 5 screenshot); CI workflow config (belum pernah berjalan); `CONTROL_BASELINE_REGISTER.md`, ADR-018..021, `HANDOFF.md`; remediasi Phase 2 F-01..F-08 + remediasi Phase 3 F-01..F-08 (`PHASE_3_REMEDIATION_REPORT.md`). Laporan: `PHASE_3_REPORT.md` + acceptance `PHASE_3_ACCEPTANCE.md` (re-assessed). |
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
- Fase hanya ditandai DONE dengan bukti (MC §8 Evidence gate; rujukan historis MC-V1 §15 — lihat `CONTROL_REFERENCE_CROSSWALK.md`). Status standar ISO tetap NOT VERIFIED — BLOCKED (kelanjutan terlacak via STANDARD_REGISTER + OD-160).
- Perubahan status berikutnya wajib menyertakan: command/test dijalankan, hasil aktual, dan referensi acceptance criteria.
