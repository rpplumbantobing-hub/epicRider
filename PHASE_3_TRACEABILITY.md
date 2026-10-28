# PHASE 3 TRACEABILITY — epicRider

**Tanggal:** 2026-10-28 · Rantai: Control/Requirement → deliverable Phase 3 → path → evidence → status.

## A. Pemetaan kontrol/requirement → deliverable Phase 3

| Sumber | Deliverable Phase 3 | Path | Evidence | Status |
|---|---|---|---|---|
| Audit F-01 (`epicRider_phase2_consistency_audit.md`) | Control baseline register | `CONTROL_BASELINE_REGISTER.md` | diff evidence §4; worklog 3-a | RESOLVED |
| Audit F-02 | MC tanpa status dinamis; ROADMAP sumber tunggal | `MASTER_CONTROL.md` §0/§8; `ROADMAP.md` | scan S1 (`audit/phase3-scan/`) | RESOLVED |
| Audit F-03 + owner prompt §2.1 | ADR-018 tiga surface + sinkronisasi 6 dokumen | `adr/ADR-018-commerce-surfaces.md`, MC §1, `LICENSE_MATRIX.md` §4, `DATA_MODEL_CONCEPT.md` §3.12/§4.6, `AUTHORIZATION_MODEL.md`, `API_ARCHITECTURE.md`, `ENTITLEMENT_MODEL.md` | scan S2; ADR-013 amended nota | RESOLVED (dokumenter) |
| Audit F-04 | ~~OD-185 OPEN — OWNER DECISION~~ **CLOSED — DECIDED BY BASELINE** (remediasi F-01 audit Phase 3) | `OPEN_DECISIONS.md` §3; `adr/ADR-021-hirider-service-offer-scope.md`; `adr/ADR-012` (nota amendemen); `DATA_MODEL_CONCEPT.md` §3.7/§5; `ARCHITECTURE.md` §6; `LICENSE_MATRIX.md` §3; `REQUIREMENTS.md` REQ-013 (amended) | ADR-021 + presence scan (penawaran jasa di 6 dokumen kunci) | CLOSED (2026-10-28) |
| Audit F-05 | Re-assessment acceptance + scan ulang | `PHASE_2_ACCEPTANCE.md` (blok re-assessment); `PHASE_2_REPORT.md` §15; `audit/phase3-scan/contradiction-scan-2026-10-28.txt` | scan S1–S9 | RESOLVED |
| Audit F-06 | Crosswalk + perbaikan 9 titik referensi + nota 14 file | `CONTROL_REFERENCE_CROSSWALK.md`; header-nota Phase 0/1 artifacts | grep inventory; scan S5 | RESOLVED |
| Audit F-07 | HANDOFF.md | `HANDOFF.md` | file + isi §1–§9 | RESOLVED |
| Audit F-08 | Label edisi ISO dipertahankan NOT VERIFIED | `STANDARD_REGISTER.md`, `ISO_IMS_BLUEPRINT.md` (sudah benar; nota crosswalk ditambah) | file §1–§2 | RESOLVED (repo aktif) |
| OD-04 (sisi konfigurasi) + prompt §5.1 | Hapus ignoreBuildErrors, strict mode, typecheck | `next.config.ts`; `package.json` (typecheck) | `bun run typecheck` exit 0 | RESOLVED (ADR-019) |
| REQ-028 + OD-12 + MC §4 (i18n) | Mekanisme i18n id/en + switcher + formatting | `src/i18n/*` (ADR-020); showcase switcher | 15 unit tests; browser ID↔EN | DONE |
| REQ-019 (responsive) + UX_UI_STANDARD | Token + komponen foundation + showcase responsif | `src/app/globals.css`; `src/components/foundation/*` | screenshots 3 viewport; computed-style checks | DONE |
| REQ-024/002 (pola, bukan implementasi) | Pola state UI (PermissionDenied dll.) — tanpa klaim enforcement | `src/components/foundation/permission-denied.tsx` | component tests | DONE (pola UI saja) |
| REQ-095 (log hygiene) | Tanpa secret di log/report; .env.example placeholder | `.env.example`; report §security | file inspect | DONE |
| NFR-01..16 (yang relevan fondasi) | Quality gates lint/typecheck/test + CI | `package.json`; `.github/workflows/ci.yml` | exit codes 0; CI remote NOT TESTED | DONE (config) / NOT TESTED (remote) |

## B. Engineering requirements Phase 3 (tanpa menimpa namespace REQ)

| ID | Requirement | Deliverable | Evidence | Status |
|---|---|---|---|---|
| P3-ENG-01 | Script lint/typecheck/test/format nyata tanpa penyamaran error | `package.json` | exit 0 (lint/typecheck/test); format:check exit 1 (baseline belum rapi — jujur tercatat) | DONE |
| P3-ENG-02 | Token semantik success/warning/info + reduced-motion + focus-visible | `src/app/globals.css` | computed style lab() hijau/amber/biru; browser check | DONE |
| P3-ENG-03 | i18n id/en: parity, fallback, persistence, tanpa hydration mismatch | `src/i18n/*` | parity test + fallback test + browser (lang id↔en, cookie) | DONE |
| P3-ENG-04 | Foundation state components (Empty/Error/Permission/StatusBadge) | `src/components/foundation/*` | 7 component tests + browser | DONE |
| P3-ENG-05 | Showcase route `/` menampilkan token, komponen, states, i18n | `src/app/page.tsx`, `showcase.tsx` | browser verification + screenshots | DONE |
| P3-ENG-06 | Test conventions: unit + component (vitest), layout tests/ | `vitest.config.ts`, `tests/` | 25/25 pass, exit 0 | DONE |
| P3-ENG-07 | CI workflow minimal-permission, deterministic, failure gates | `.github/workflows/ci.yml` | file review; **remote NOT TESTED** | DONE (config) |
| P3-ENG-08 | Developer docs + config hygiene | `README.md`, `.editorconfig`, `.prettierrc`, `.env.example` | files exist; contents reviewed | DONE |
| P3-ENG-09 | E2E smoke route `/` | agent-browser session (ini dokumen) | HTTP 200; interactions verified; 5 screenshots | DONE (manual; framework e2e belum dipasang) |

## C. Tautan bukti eksekusi

- Quality gates: `PHASE_3_REPORT.md` §5 (command + exit code).
- Browser evidence: `audit/evidence/phase3-showcase-{id-desktop,en-desktop,en-tablet-768,en-mobile-390}.png` + catatan interaksi di `worklog.md` Task 3-d.
- Gate A scan: `audit/phase3-scan/contradiction-scan-2026-10-28.txt`.

## D. Remediasi audit konsistensi Phase 3 (F-01..F-08) — 2026-10-28

Input: `upload/epicRider_phase3_consistency_audit.md`. Peta lengkap: `PHASE_3_REMEDIATION_REPORT.md`; bukti mentah: `audit/phase3-remediation/`.

| Temuan (audit Phase 3) | Deliverable remediasi | Path | Evidence | Status |
|---|---|---|---|---|
| F-01 hiRider scope (penawaran jasa) | MC §1 diselaraskan; OD-185 CLOSED; ADR-021; ADR-012 nota; DMC §3.7/§5 ServiceOffer (planned); ARCH §6; LICENSE_MATRIX §3; REQ-013 amended (tanpa REQ baru) | `MASTER_CONTROL.md` §1; `OPEN_DECISIONS.md`; `adr/ADR-021`; `adr/ADR-012`; `DATA_MODEL_CONCEPT.md`; `ARCHITECTURE.md`; `LICENSE_MATRIX.md`; `REQUIREMENTS.md` | presence scan S-B (penawaran jasa di 6 dokumen kunci); invariant tetap | RESOLVED |
| F-02 tiga commerce surface | REQ-030 revised (ID tetap); PRODUCT_SCOPE amendemen (§2.1/§3/§5/§6 + nota ADR-018); matrix + rule/pencarian baru; sisa "two stores" di AUTHORIZATION_MODEL §9 diperbaiki; ADR-018 nota sinkron | `REQUIREMENTS.md`; `PRODUCT_SCOPE.md`; `CONTROL_CONSISTENCY_MATRIX.md`; `AUTHORIZATION_MODEL.md`; `adr/ADR-018` | scan S-A "two stores" = 0; presence "License & Extension Shop" di 6 dokumen | RESOLVED |
| F-03 status Phase 3 konflik | PHASE_STATUS pembuka vs tabel diselaras — keduanya PARTIAL | `PHASE_STATUS.md`; `ROADMAP.md` | scan S-C/S-D | RESOLVED |
| F-04 build/CI belum terbukti | Kriteria 12 → PARTIAL; status fase → PARTIAL; langkah pembuktian owner | `PHASE_3_ACCEPTANCE.md` (re-assessment); `ROADMAP.md`; `HANDOFF.md` §9 | `audit/phase3-remediation/quality-gates-2026-10-28.txt` | RESOLVED (status jujur; build/CI NOT RUN/NOT TESTED) |
| F-05 `.env` tracked + `.env.example` hilang | `.env` keluar index; `.gitignore` + `!.env.example`; `.env.example` ter-track; klaim di HANDOFF/README/REPORT/CURRENT_STATE_AUDIT dikoreksi | `.gitignore`; `.env.example`; `HANDOFF.md` §7; `README.md`; `PHASE_3_REPORT.md` §8; `PHASE_3_CURRENT_STATE_AUDIT.md` | `audit/phase3-remediation/secret-scan-env-2026-10-28.txt` (riwayat: hanya `DATABASE_URL=file:` — tanpa rotasi) | RESOLVED |
| F-06 bukti audit tidak konsisten | Diff 12-file regenerasi (4/8, klasifikasi per-file); REQ integrity metodologi terpisah (100 baris/0 duplikat vs 100 ID/3.452 referensi); contradiction scan baru dengan cakupan eksplisit (menangkap sisa "two stores"); klaim "0 contradictions" → klaim terukur | `audit/phase3-remediation/{diff-baseline,req-integrity,contradiction-scan}-2026-10-28*.txt`; `CONTROL_BASELINE_REGISTER.md` §4 | file bukti (command+timestamp+hasil) | RESOLVED |
| F-07 ROADMAP fase 4–26 tereduksi | Satu baris per fase 0–26 dipulihkan (outcome MC §12 vs status aktual dipisah) | `ROADMAP.md` | tabel 27 baris | RESOLVED |
| F-08 tech debt | 25 file Phase 3 diformat prettier (check exit 0); rencana pengetatan lint/TS bertahap | file src/tests/config; `PHASE_3_REMEDIATION_REPORT.md` §5 | `audit/phase3-remediation/quality-gates-2026-10-28.txt` | RESOLVED (format fase 3) / REGISTERED (rencana) |
