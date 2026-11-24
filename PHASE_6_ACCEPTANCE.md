# PHASE 6 ACCEPTANCE — epicRider

**Phase:** 6 — Home/dashboard & event foundation  
**Acceptance status:** NOT ASSESSED (criteria prepared before implementation)  
**Entry gate:** `PHASE_6_ENTRY_GATE.md` — PASS WITH LIMITATIONS  
**Baseline:** `main` @ `bec9911862470796354e3175486b36d1b9d4a75e`  
**Owner authorization:** 2026-11-24, conditional on verified Entry Gate and Acceptance Pack.

> This is an acceptance specification, not evidence of implementation. Each criterion must be marked PASS / FAIL / BLOCKED / NOT TESTED with exact test/evidence paths. No checkmark is evidence by itself.

## A. Scope and requirement coverage

| # | Criterion | Required evidence | Status |
|---|---|---|---|
| A1 | Workspace Home/dashboard exists on a workspace-scoped route; public root Showcase remains unchanged | route test + screenshot + regression of `/` | NOT ASSESSED |
| A2 | Event list/create/detail foundation works for the authorized scope | HTTP/integration tests + UI task evidence | NOT ASSESSED |
| A3 | Event Assignment is a separate relation from User, Membership and Role | Prisma schema + FK/unique constraints + tests | NOT ASSESSED |
| A4 | Owner can manage events and assignments; non-owner member sees only assigned events | policy/guard + HTTP integration matrix | NOT ASSESSED |
| A5 | Member with multiple assignments can switch event context; every target is re-authorized server-side | UI test + negative API tests | NOT ASSESSED |
| A6 | Five core navigation labels/locations are represented consistently: Home/Event/Asset/Team/Profile | IA map + navigation test + desktop/mobile screenshots | NOT ASSESSED |
| A7 | Asset navigation is an honest Phase 8 unavailable state; no fake asset CRUD/data | UI test + manual anti-mock review | NOT ASSESSED |
| A8 | Existing Team/membership and Profile/account routes remain reachable and regressions pass | route/component/integration tests | NOT ASSESSED |
| A9 | REQ-003 is not marked fully VERIFIED while Asset functionality remains deferred | traceability + roadmap review | NOT ASSESSED |

## B. Data model and migration integrity

| # | Criterion | Required evidence | Status |
|---|---|---|---|
| B1 | Event is workspace-owned; fields cover name, schedule start/end, location, current version and audit attribution as justified by DMC | schema review + migration diff | NOT ASSESSED |
| B2 | EventAssignment links Event to Membership, never directly User; workspace consistency is enforced at DB/service boundary | schema constraints + cross-workspace negative tests | NOT ASSESSED |
| B3 | Duplicate active assignment for the same event/member is prevented deterministically | unique constraint + concurrency/integration test | NOT ASSESSED |
| B4 | Only provisional Event state `DRAFT` is used; no unapproved lifecycle transitions are implemented | schema/service/API/UI review | NOT ASSESSED |
| B5 | Assignment state is limited to the minimal assigned/revoked relation; no offer/decline/completion or overlap policy | schema/service review | NOT ASSESSED |
| B6 | Migration is additive, versioned and tested from the current Phase 4/5 baseline; no reset, db push, data-loss flag or edit to historical migrations | migration SQL review + isolated migrate deploy + git diff | NOT ASSESSED |
| B7 | No production DB choice or production-readiness claim is made; OD-01 remains OPEN | docs/status scan | NOT ASSESSED |

## C. Authorization, tenant isolation and audit

| # | Criterion | Required evidence | Status |
|---|---|---|---|
| C1 | No session → 401; non-member/foreign tenant → uniform 404; member without required permission → 403 with safe reason code | HTTP integration tests | NOT ASSESSED |
| C2 | Owner read exception is explicit; non-owner member requires active EventAssignment for every event-scoped read | policy + route tests | NOT ASSESSED |
| C3 | Suspended/removed/left membership cannot read or manage event resources | integration matrix | NOT ASSESSED |
| C4 | Assignment requires an ACTIVE membership in the same workspace as the Event | transaction/constraint tests | NOT ASSESSED |
| C5 | Cross-tenant Event ID, Membership ID, Assignment ID and workspace path substitution are denied; no existence/data leakage | negative IDOR matrix | NOT ASSESSED |
| C6 | Context switching rechecks assignment on the server; client state/header cannot authorize access | API tests after switching/revocation | NOT ASSESSED |
| C7 | Event creation, assignment and revocation are audited; denied access is audited; sensitive values are redacted | audit integration tests + payload scan | NOT ASSESSED |
| C8 | No new workspace role, no role escalation and no entitlement bypass | role/entitlement regression tests | NOT ASSESSED |

## D. API contract and reliability

| # | Criterion | Required evidence | Status |
|---|---|---|---|
| D1 | All event endpoints are workspace-scoped under `/api/v1/workspaces/{workspaceId}/...`; tenant context comes from path and DB facts | route inventory + HTTP tests | NOT ASSESSED |
| D2 | RFC 9457-style problem response is used; no stack, SQL, internal path or secret leaks | API tests | NOT ASSESSED |
| D3 | Event/assignment lists have deterministic ordering and follow the documented pagination contract without inventing an unapproved page-size policy | API contract + tests | NOT ASSESSED |
| D4 | Resource-create replay behavior is explicitly addressed against API_ARCHITECTURE D-2; if safe idempotency cannot be implemented without an unapproved TTL/retention decision, the affected mutation is BLOCKED and not falsely accepted | replay tests or documented blocker | NOT ASSESSED |
| D5 | No silent last-write-wins or undocumented conflict resolution | concurrency review/tests | NOT ASSESSED |
| D6 | No offline queue or offline-mode claim while OD-07 remains OPEN | UI/content scan | NOT ASSESSED |

## E. Home/dashboard and UX quality

| # | Criterion | Required evidence | Status |
|---|---|---|---|
| E1 | Dashboard data is real, workspace-scoped and actor-authorized; no hard-coded/demo metrics | data provenance review + tests | NOT ASSESSED |
| E2 | Tasks/assets are not presented as implemented metrics; quota is not numeric while OD-05 remains open; license summary is shown only through an authorized read path | data source/permission review + screenshots | NOT ASSESSED |
| E3 | Empty workspace, zero assignments, loading, error/retry, permission-denied and stale states are complete and truthful | state matrix + component/route tests | NOT ASSESSED |
| E4 | Indonesian is default; English dictionary has parity; new UI copy has no hard-coded strings | i18n tests + string scan | NOT ASSESSED |
| E5 | Core screens work at 360–430 px, 768–1024 px and >=1280 px; touch targets meet UX_UI_STANDARD target | screenshots + responsive audit | NOT ASSESSED |
| E6 | Keyboard navigation, focus visibility, labels, headings and error association are checked; no claim of full WCAG 2.2 AA without a full audit | accessibility report | NOT ASSESSED |
| E7 | No dead buttons/links, fake charts, mock operational data or placeholder disguised as completed functionality | manual anti-mock review | NOT ASSESSED |
| E8 | Task-based usability evaluation is reported as performed or NOT TESTED; no usability claim without evidence | task protocol/results | NOT ASSESSED |

## F. Regression and delivery

| # | Criterion | Required evidence | Status |
|---|---|---|---|
| F1 | Existing Phase 4 identity/session/workspace/membership/invitation/security tests remain green | full test suite + CI | NOT ASSESSED |
| F2 | Existing Phase 5 licensing/entitlement/lifecycle/shop tests remain green | full test suite + CI | NOT ASSESSED |
| F3 | `bun run lint`, `bun run typecheck`, `bun run test`, Prisma validate/generate, migrations and `bun run build` pass | exact commands, exit codes, CI run | NOT ASSESSED |
| F4 | New unit/integration/HTTP/component tests cover happy path, invalid input, authorization, tenant isolation, assignment revocation, multi-assignment switch and audit | test inventory + logs | NOT ASSESSED |
| F5 | `PHASE_6_TRACEABILITY.md`, report, roadmap, phase status and handoff agree; open decisions remain open | consistency scan | NOT ASSESSED |
| F6 | Candidate ZIP, manifest and SHA-256 are reproducible; no secrets, local DB, logs with PII or build artifacts are packaged | archive scan + checksum verification | NOT ASSESSED |

## G. Requirement mapping and honest completion

- **REQ-003:** Phase 6 delivers the Home/Event slice and the five-item navigation shell. Asset functionality remains Phase 8; therefore REQ-003 is **PARTIAL**, not fully VERIFIED, until its complete acceptance criteria are met.
- **REQ-007:** Phase 6 delivers visible event context and safe multi-assignment switching. Any unsaved-draft warning is not applicable unless Phase 6 actually introduces unsaved event-scoped drafts; offline/sync behavior remains OD-07.
- **REQ-050:** Phase 6 delivers runtime separation of workspace membership from event assignment, with server-side enforcement.
- **UC-1006:** assignment and context-switch flow; overlapping-assignment policy is explicitly deferred under OD-130.
- **UC-2002:** create basic event; lifecycle remains DRAFT-only pending owner-approved lifecycle decision.
- **UC-2007:** dashboard uses actual event/membership/license data only. Tasks/assets are deferred; quota numbers are TBD.
- **REQ-008 / UC-2006:** chat/rundown/reports are Phase 10 and must not be implemented here.
- **REQ-006 / UC-2005:** asset CRUD and sets are Phase 8 and must not be implemented here.

## H. Phase 6 closure rule

Phase 6 may be marked DONE only when all mandatory in-scope criteria pass, all blocked/not-tested criteria are explicitly dispositioned, the full CI workflow passes on the exact candidate commit, the post-merge main tree is verified, and a complete report/handoff is published. A build pass or screenshot alone is insufficient.
