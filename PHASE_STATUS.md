# PHASE STATUS — epicRider

**Sumber kebenaran:** bukti di repository. Tanggal update terakhir: 2026-05-22 (Phase 0).
**Aturan:** status hanya diubah dengan bukti baru (Master Control §3.6, §15).

| Phase | Nama | Status | Bukti / Blocker |
|---|---|---|---|
| 0 | Audit repository & lock control baseline | **SELESAI (audit run 2026-05-22) — `DONE` menunggu konfirmasi owner atas 2 exit criteria yang tersisa:** (1) commit baseline git oleh owner/agen berikutnya, (2) keputusan atas open decisions yang tidak menghalangi Phase 1. | Laporan: `PHASE_0_AUDIT_REPORT.md`, `PHASE_0_GAP_REGISTER.md`, `PHASE_0_OPEN_DECISIONS.md`, `PHASE_0_ACCEPTANCE.md`; 12 control files kanonik dibuat; audit UI: `audit/evidence/`; lint exit 0; verifikasi ISO `BLOCKED` (akses katalog ditolak — HTTP 403/000). |
| 1 | Discovery, personas, use cases, requirements & acceptance criteria | NOT STARTED | Menunggu jawaban owner atas OD (lihat open decisions); seed requirement tersedia. |
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
- Sebelum Phase 0, tidak ada bukti pekerjaan fase apa pun di repository (baseline = scaffold; bukti di `PHASE_0_AUDIT_REPORT.md` §3). Tidak ada fase yang ditandai DONE berdasarkan nomor phase/prompt lama.
- Perubahan status berikutnya wajib menyertakan: command/test dijalankan, hasil aktual, dan referensi acceptance criteria.
