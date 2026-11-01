# ROADMAP — epicRider

## Status rule

`NOT STARTED` = no evidence of work.
`IN PROGRESS` = partial evidence.
`PARTIAL` = work/evidence incomplete.
`BLOCKED` = specific scope cannot proceed because a dependency is required.
`DONE` = all phase acceptance criteria are evidenced.

## Phase state

Status is evidence-based and is the single dynamic phase-status source referenced by `MASTER_CONTROL.md`. Phases do not start automatically; each phase requires explicit owner authorization where required by the control baseline.

**2026-10-31 Phase 5 closure:** Phase 5 is `DONE` after 5-B/C/D were integrated through PR #3/#4 and 5-E was integrated into `main` at `897c7a981b86644008fd5c14bf464935ac7814c8`; owner-verified CI run `#41193444454` passed. Closure evidence is `PHASE_5_CLOSURE_REPORT.md`; canonical re-run was 361/361 tests with lint/typecheck/build/Prisma validation/migrate-diff passing.

**2026-11-01 quota-policy reconciliation:** ADR-027 is accepted by explicit owner directive. It does not choose a numeric base member quota. The workspace owner is not counted as a non-owner member seat; base quota may later be set independently for miniRider, maxRider and ISOrider; `TierQuota` remains the generic configuration mechanism; purchased `seat_package` capacity remains additive. ADR-023 is superseded only for its fixed member-quota value/policy portion.

## Phase table

| Phase | Nama | Status | Bukti / Blocker / Dependency |
|---|---|---|---|
| 0 | Audit repository, verifikasi bukti & penguncian control baseline | **DONE** | `PHASE_0_ACCEPTANCE.md` 9/9; commit `03293b6`; ISO verification remains BLOCKED (F0-012/OD-160) |
| 1 | Discovery, personas, use cases, requirements & acceptance criteria | **DONE — BASELINE** | `PHASE_1_REPORT.md`; REQ-001..100; commit `938932f` |
| 2 | Architecture/domain model, threat model, data model & ADR | **PARTIAL** | Architecture reconciled 2026-10-28; evidence gate/ratification and OD-01/OD-02 remain outstanding |
| 3 | Repository foundations, design system, i18n & CI/testing foundation | **PARTIAL** | Remediation completed; current status remains PARTIAL pending its recorded governance reassessment |
| 4 | Identity, authentication, workspace/tenant, memberships & permissions | **DONE — closed 2026-10-30** | PR #1 merge `a1af59d8e00d3a0d8e28b25f1a7f05961182a6a0`; post-merge CI run #5 / `40928261468` Success; closure 16/16 mandatory criteria PASS with limitations |
| 5 | Licensing, entitlements, renewal/expiry & extensions model | **DONE — closed 2026-10-31** | 5-B/C PR #3 `165b3ba`; 5-D PR #4 `aafcbe3`; 5-E `897c7a9`; CI `41193444454` Success owner-verified; closure report; 361/361 final re-run; ADR-023/024/025/026 remain PROPOSED, ADR-027 ACCEPTED; OD-05/06/108/122/133/135 remain OPEN and non-blocking to Phase 5 closure |
| 6 | Home/dashboard & event foundation | NOT STARTED | Requires explicit owner authorization; no Phase 5 blocker remains |
| 7 | Technical rider & templates | NOT STARTED | — |
| 8 | Asset foundation & asset/set templates | NOT STARTED | — |
| 9 | Media kit/templates | NOT STARTED | — |
| 10 | Team/event workspace, chat, rundown, reports & notifications | NOT STARTED | OD-125 candidate |
| 11 | Developer Equipment Store (miniRider) | NOT STARTED | ADR-018; commercial values remain OD-133/OD-135 |
| 12 | maxRider CRM | NOT STARTED | — |
| 13 | maxRider asset/rental lifecycle, QR/barcode, printing/scanning, maintenance/readiness | NOT STARTED | OD-07/OD-107/OD-184 as applicable |
| 14 | maxRider finance/commercial | NOT STARTED | OD-06 commercial decision |
| 15 | Advanced roles/workflow, HSE/risk/readiness/operational controls | NOT STARTED | — |
| 16 | hiRider marketplace/recruitment | NOT STARTED | ADR-021; ServiceOffer in scope; lifecycle work remains here |
| 17 | IMS foundation, process architecture & controlled document library | NOT STARTED | ISO verification remains BLOCKED (F0-012/OD-160) |
| 18 | Forms/checklists, evidence, sign-off/signatures & Audit Mode | NOT STARTED | OD-103/OD-104 |
| 19 | Sustainability, environmental, HSE, information security, continuity & risk workflows | NOT STARTED | OD-105/OD-106 |
| 20 | Audit programmes, NCR/CAPA, management review & continual improvement | NOT STARTED | — |
| 21 | End-to-end IMS integration, compliance mapping & project/event dossier | NOT STARTED | — |
| 22 | Public landing, Developer Portal, license/extension shop, notification governance | NOT STARTED | ADR-018; commercial ODs remain open |
| 23 | Extensions, workspace landing pages, mobile/tablet/Windows delivery | NOT STARTED | ADR-007/OD-02 |
| 24 | Integrations, import/export, offline & sync hardening | NOT STARTED | OD-07/OD-111 |
| 25 | Security/performance/reliability/backup-restore/DR/accessibility/UAT | NOT STARTED | OD-112/OD-114 |
| 26 | Pilot, production launch, support, measurement & continuous improvement | NOT STARTED | OD-10 |

## Phase 5 closure boundary

Phase 5 DONE does **not** mean production commerce is complete. The integrated 5-E foundation intentionally excludes payment gateway, charging, final pricing, tax/refund/settlement, HTTP/UI commerce experience, and production database selection; those remain governed by the cited ODs and later phases.

## Current next-phase rule

Phase 6 is `NOT STARTED` even though Phase 5 closure establishes readiness. Start only after explicit owner authorization.
