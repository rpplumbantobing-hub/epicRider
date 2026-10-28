# ADR REGISTER — epicRider

**Task:** Phase 2, Task 2-f (Technical Governance Lead) · **Date:** 2026-10-27
**Control baseline:** the owner-installed reconciled control files (worklog Task 2-0, attachment `upload/epicRider_phase2_control_replacement.zip`) — `MASTER_CONTROL.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `LICENSE_MATRIX.md`, `SECURITY.md`, `TESTING.md`, `CONTROL_CONSISTENCY_MATRIX.md`, `PHASE_2_DEPENDENCY_MATRIX.md`, `ROADMAP.md`.
**Status of this register:** active register (PROPOSED content awaiting owner review, except where a row cites owner-baseline acceptance).

---

## 1. Purpose & conventions

### 1.1 Purpose

This is the single register of **Architecture Decision Records (ADRs)** for epicRider, required by Phase 2 prompt §13 and listed as a Phase 2 output in `ARCHITECTURE.md` §11. It records: historical decisions (Phase 0/1), the twelve mandatory Phase 2 ADR topics (ADR-006..ADR-017, individual files in `adr/`), and candidate decisions awaiting registration.

### 1.2 Status taxonomy

ADR status values (per `DECISIONS.md` / `MASTER_CONTROL.md` §3 decision status — never interchangeable with evidence/requirement/phase statuses):

| Status | Meaning |
|---|---|
| `OPEN` | The decision is not made; an owner decision (OD) or further evidence is required. No selection may be faked. |
| `PROPOSED` | A decision is proposed and reasoned, awaiting owner review/ratification. |
| `ACCEPTED` | The decision is approved with citable evidence (owner instruction, owner-installed baseline attachment, or recorded owner action). |
| `REJECTED` | The decision was considered and turned down (reasons retained). |
| `SUPERSEDED` | The decision was replaced by a later ADR; the record is retained for history. |

### 1.3 ADR ID format & rules

- IDs are `ADR-NNN` (three digits, zero-padded), assigned sequentially. **IDs are never reused, never renumbered, never deleted.**
- **One decision per ADR.** A compound topic is split into separate ADRs (e.g. identity abstraction vs OTP provider abstraction).
- **Supersede policy:** an ADR is never deleted or edited out of history. When a decision changes, the old ADR is marked `SUPERSEDED` with a pointer to its successor; the successor gets the next free ID.
- Phase 2 individual ADRs live in `adr/ADR-NNN-slug.md` and must carry all 8 required fields (Phase 2 prompt §13): **Context; Problem; Options (with trade-offs); Decision; Consequences (positive + negative + risks); Status (with date); Evidence; Dependencies.**

### 1.4 Relationship to OPEN_DECISIONS.md (OD register)

- An **OD (open decision)** is an *open question awaiting an owner decision*; an **ADR** is the *recorded decision and its reasoning*.
- The two registers are linked, not merged: an ADR may be `OPEN` or `PROPOSED` while its OD is still unanswered (the ADR records the current state of reasoning — e.g. ADR-006 is OPEN because OD-01 is OPEN).
- **When an OD is resolved by the owner:** the resolution is recorded as a new ADR (or as a status change of an existing ADR to `ACCEPTED`, with evidence and date), and the OD row in `OPEN_DECISIONS.md` is updated to `CLOSED — see ADR-xxx` (per the rule at the end of `OPEN_DECISIONS.md` §4). **OD IDs are referenced, never renumbered, never invented.**
- Candidate decisions discovered during architecture work are listed **without IDs** (this register §4 and the source documents' candidate sections) until the owner/orchestrator registers them in `OPEN_DECISIONS.md` and/or as ADRs.

### 1.5 Integrity rules

- `ACCEPTED` requires evidence (owner instruction, owner-installed baseline attachment, git-committed owner action). No owner decision, vendor, price, test result, or implementation status may be invented (MC §7; prompt §16).
- Historical references may survive only when clearly marked as superseded/audit history (`CONTROL_CONSISTENCY_MATRIX.md`).

---

## 2. Historical register (Phase 0/1) — ADR-000..ADR-005

These six decisions were made and recorded during Phase 0/Phase 1 in the then-canonical `DECISIONS.md`. That file was superseded as a *control file* on 2026-10-27 (archived to `audit/superseded/phase1-era-control/DECISIONS.md` by worklog Task 2-0), but the **decision records remain valid history with their IDs preserved**. No individual files are created for them; this section is their register summary.

| ID | Title | Date | Status | Summary | Evidence |
|---|---|---|---|---|---|
| ADR-000 | Adoption of the Phase 0 control baseline | 2026-05-22 | ACCEPTED | 12 canonical control files created at repo root + 4 Phase 0 reports; Master Control adopted without substantive change; CURRENT vs TARGET separated. | `audit/superseded/phase1-era-control/DECISIONS.md`; git history (commit `483950c`, initial repo state) |
| ADR-001 | No stack changes during Phase 0 | 2026-05-22 | ACCEPTED | Scaffold stack (Next.js 16 + Prisma + SQLite + Tailwind 4 + shadcn/ui) kept as-is; stack-vs-target evaluation deferred to Phase 2 as input, not a change. | archive DECISIONS.md; Phase 0 audit (`PHASE_0_AUDIT_REPORT.md`); git history |
| ADR-002 | ISO standards verification deferred (environment BLOCKED) | 2026-05-22 | ACCEPTED (environment condition; verification remains mandatory) | All standards statuses recorded `NOT VERIFIED` (iso.org access returned HTTP 403/000 — evidence F0-012); verification procedure prepared in `ISO_IMS_BLUEPRINT.md`. ISOrider design must not lock editions before verification. | archive DECISIONS.md; `STANDARD_REGISTER.md`; F0-012; OD-160 remains OPEN |
| ADR-003 | Seed requirements from Master Control without discovery | 2026-05-22 | ACCEPTED | 46 seed requirements (`PROPOSED`) derived from Master Control sections; refinement/personas/use cases/AC = Phase 1. | archive DECISIONS.md; superseded-era `REQUIREMENTS.md` (git history) |
| ADR-004 | Phase 0 exit gate approved; baseline committed | 2026-10-27 | ACCEPTED | Phase 0 marked DONE on evidence: owner instruction to proceed + baseline commit `03293b6`; residual openness (ISO verification, business ODs) tracked in OD registers, not ignored. | archive DECISIONS.md; git commit `03293b6`; `PHASE_0_ACCEPTANCE.md` |
| ADR-005 | Phase 1 baseline produced (desk analysis); all requirements PROPOSED pending approval | 2026-10-27 | ACCEPTED (execution of the Phase 1 prompt; substance awaits owner) | Full Phase 1 baseline (REQ-001..100, 55 UC, 12 personas/journeys, process map, document/evidence model, standard register, license matrix revision, UXR-01..20, NFR-01..16, RSK-101..125, consolidated OD register, traceability matrix); all artifacts PROPOSED; no business decision taken on the owner's behalf. | archive DECISIONS.md; `PHASE_1_REPORT.md`; git commit `938932f` |

**Note:** ADR-000..ADR-003 predate the 2026-10-27 baseline correction; where their content touches the old (superseded) taxonomy or blocking judgments, the owner-reconciled baseline (`DECISIONS.md` 2026-10-27, `PHASE_2_DEPENDENCY_MATRIX.md`) is canonical. The historical records themselves are preserved unchanged.

---

## 3. Phase 2 register (ADR-006..ADR-017 — the 12 mandatory topics of prompt §13)

Numbering fixed by the Phase 2 orchestrator. Individual files in `adr/`.

| ID | Title | Status | Owner decision needed? | Related ODs | Related docs | ADR file |
|---|---|---|---|---|---|---|
| ADR-006 | Production database selection | **OPEN** | **YES — OD-01** (engine selection; interacts with OD-10 hosting) | OD-01, OD-10 | `DATA_MODEL_CONCEPT.md`, `THREAT_MODEL.md`, `PHASE_2_DEPENDENCY_MATRIX.md` | `adr/ADR-006-production-database.md` |
| ADR-007 | Mobile/client delivery strategy (evaluation; NO selection) | **OPEN** | **YES — OD-02** (final PWA/native/cross-platform/wrapper choice) | OD-02, OD-07, OD-10, OD-184 | `API_ARCHITECTURE.md` (name only), `UX_REQUIREMENTS.md`, `THREAT_MODEL.md` | `adr/ADR-007-mobile-client-strategy.md` |
| ADR-008 | Identity & authentication abstraction | PROPOSED | Partially — vendor-specific part (OD-03); session parameters (OD-115) | OD-03, OD-115 | `SECURITY.md`, `THREAT_MODEL.md`, `DATA_MODEL_CONCEPT.md` §3.1 | `adr/ADR-008-identity-auth-abstraction.md` |
| ADR-009 | WhatsApp OTP provider abstraction | PROPOSED (abstraction); vendor-specific part OPEN | YES for the vendor-specific part — OD-03 | OD-03, OD-115 | `SECURITY.md`, `THREAT_MODEL.md` TC-05, `RISK_REGISTER.md` RSK-116 | `adr/ADR-009-whatsapp-otp-provider-abstraction.md` |
| ADR-010 | Authorization model | PROPOSED | Partially — role catalog (OD-122), visibility (OD-109/OD-134), self-approval (OD-136), audit access (OD-138) | OD-05, OD-109, OD-122, OD-134, OD-136, OD-138 | `AUTHORIZATION_MODEL.md`, `SECURITY.md`, `THREAT_MODEL.md` TC-06/07/08/24 | `adr/ADR-010-authorization-model.md` |
| ADR-011 | Entitlement model (taxonomy part owner-baseline-accepted) | PROPOSED (taxonomy ACCEPTED via owner baseline) | Partially — commercial values (OD-06), lifecycle parameters (OD-108), seat counting (OD-05) | OD-05, OD-06, OD-108, OD-123, OD-135, OD-137, OD-138 | `ENTITLEMENT_MODEL.md`, `LICENSE_MATRIX.md`, `MASTER_CONTROL.md` §2 | `adr/ADR-011-entitlement-model.md` |
| ADR-012 | hiRider domain boundary | **ACCEPTED** (owner baseline) | NO for the boundary; lifecycle detail remains PROPOSED (candidate) | OD-109, OD-123, OD-134 | `MASTER_CONTROL.md` §1, `ARCHITECTURE.md` §2/§6, `DATA_MODEL_CONCEPT.md` §4.3/§4.4/§5 | `adr/ADR-012-hirider-domain-boundary.md` |
| ADR-013 | Public Store boundary | **ACCEPTED** (owner baseline) | Partially — commercial values (OD-06), order machine (OD-135), price authority (OD-133); access-derivation candidate | OD-06, OD-101, OD-133, OD-135 | `MASTER_CONTROL.md` §1, `ARCHITECTURE.md` §7, `ENTITLEMENT_MODEL.md` §8, `DATA_MODEL_CONCEPT.md` §4.6 | `adr/ADR-013-public-store-boundary.md` |
| ADR-014 | Extension model (structure ACCEPTED; commercial aspects OPEN) | **ACCEPTED** (model structure, owner baseline) | Partially — commercial/pricing (OD-06); restriction scope (OD-108) | OD-06, OD-108, OD-123 | `LICENSE_MATRIX.md` §5, `MASTER_CONTROL.md` §2, `ENTITLEMENT_MODEL.md` §7 | `adr/ADR-014-extension-model.md` |
| ADR-015 | Audit & record versioning approach | PROPOSED | YES for retention parameters — OD-138 / OD-164 (also OD-104, OD-103, OD-136) | OD-01, OD-09, OD-103, OD-104, OD-136, OD-138, OD-164 | `THREAT_MODEL.md` TC-17, `DOCUMENT_EVIDENCE_MODEL.md`, `ENTITLEMENT_MODEL.md` §10, `LEGAL_REGULATORY_REGISTER.md` LR-003/LR-013 | `adr/ADR-015-audit-versioning.md` |
| ADR-016 | API versioning strategy | PROPOSED | YES for deprecation/sunset policy (no OD ID registered yet) | (OD-02 related — non-blocking) | `API_ARCHITECTURE.md` (name only), `REQUIREMENTS.md` REQ-097 | `adr/ADR-016-api-versioning.md` |
| ADR-017 | Concurrency & idempotency strategy | PROPOSED | Partially — conflict-resolution policies (OD-107/OD-130/OD-131); physical layer (OD-01) | OD-01, OD-05, OD-06, OD-107, OD-130, OD-131 | `DATA_MODEL_CONCEPT.md` §2.4, `THREAT_MODEL.md` TC-18/TC-19, `API_ARCHITECTURE.md` (name only) | `adr/ADR-017-concurrency-idempotency.md` |

## 3b. Phase 3 register (ADR-018..ADR-020)

| ID | Topic | Status | Depends on | Related OD | Referenced in | File |
|---|---|---|---|---|---|---|
| ADR-018 | Commerce surfaces: License & Extension Shop vs Public Store vs Developer Equipment Store | **ACCEPTED** (owner decision, Phase 3 prompt §2.1 F-03; supersedes ADR-013 in part — ADR-013 amended, history kept) | owner prompt + audit F-03 | OD-06, OD-101, OD-133, OD-135 | `MASTER_CONTROL.md` §1, `LICENSE_MATRIX.md` §4, `DATA_MODEL_CONCEPT.md` §3.12/§4.6, `AUTHORIZATION_MODEL.md` §9, `API_ARCHITECTURE.md` §3 | `adr/ADR-018-commerce-surfaces.md` |
| ADR-019 | Build/type quality gates (remove `ignoreBuildErrors`, `reactStrictMode: true`, add typecheck script) | **ACCEPTED** (owner decision, Phase 3 prompt §5.1) — resolves the config side of OD-04 | owner prompt | OD-04 | `next.config.ts`, `package.json` (typecheck), `.github/workflows/ci.yml` | `adr/ADR-019-build-type-quality-gates.md` |
| ADR-020 | i18n mechanism: typed dictionary + context provider + cookie persistence (id default, en; next-intl kept uninstalled-unused) | **ACCEPTED** (Phase 3 engineering decision per prompt §5.3; revisitable when routing-based locale is needed) | MC §4 i18n invariant; REQ-028 | OD-12 | `src/i18n/*`, README §i18n | `adr/ADR-020-i18n-mechanism.md` |

**Status distribution Phase 3:** ACCEPTED ×3 (ADR-018 owner instruction; ADR-019 owner instruction; ADR-020 engineering decision within prompt-granted authority). Formal owner ratification of ADR-018 welcome alongside the 7 PROPOSED Phase 2 ADRs.

**Status distribution (Phase 2 register above, historical):** ACCEPTED ×3 (ADR-012, ADR-013*, ADR-014 — evidenced by the owner's reconciled baseline attachment of 2026-10-27; *ADR-013 amended in part by ADR-018 on 2026-10-28, status line preserved); PROPOSED ×7 (ADR-008, ADR-009, ADR-010, ADR-011, ADR-015, ADR-016, ADR-017 — awaiting owner review of Phase 2 output); OPEN ×2 (ADR-006, ADR-007 — owner decisions OD-01/OD-02 required; no selection faked). Next free ADR ID after Phase 3: **ADR-021**.

---

## 4. Candidate ADRs — CANDIDATE — requires registration (no ID assigned)

The following decisions surfaced during Phase 2 architecture work but are **not yet registered**: they are listed **without ADR/OD IDs** and must not be cited with an invented ID. Registration is by the owner/orchestrator (into `OPEN_DECISIONS.md` if an owner decision is needed, and then as an ADR with the next free number once decided; some items are architecture decisions that can go straight to a PROPOSED ADR).

| # | Candidate decision | Source | Why needed | Related existing IDs |
|---|---|---|---|---|
| 1 | Identifier standard (UUIDv7-class vs alternative) | `DATA_MODEL_CONCEPT.md` §11 (C-1) | `ARCHITECTURE.md` §9 defers "UUID/strong identifiers" to a Phase 2 ADR; physical encoding interacts with OD-01 | OD-01; ADR-006 |
| 2 | License-holding scope for Public Store access derivation (whether/how users whose only workspace is on a higher tier derive "basic miniRider license" access) | `DATA_MODEL_CONCEPT.md` §11 (C-2) | MC §1 Public Store rule names "user with basic miniRider license"; derivation for higher-tier workspace members is undefined and must not be silently interpreted | ADR-013; OD-06 scope |
| 3 | Event lifecycle final states & transitions | `DATA_MODEL_CONCEPT.md` §11 (C-3), §6.3 | No owner-approved event lifecycle exists anywhere in the baseline | — |
| 4 | hiRider Opening/Application lifecycle finalization (`DRAFT→OPEN→PAUSED→CLOSED`; `SUBMITTED→REVIEWING→SHORTLISTED→ACCEPTED/REJECTED/WITHDRAWN`) | `DATA_MODEL_CONCEPT.md` §11 (C-4), §5.2 | Prompt §7 examples are explicitly NOT owner-approved; ADR required to finalize | ADR-012 scope note; REQ-063/REQ-064 |
| 5 | Equipment Store order/fulfillment model (physical goods vs digital) | `DATA_MODEL_CONCEPT.md` §11 (C-5) | REQ-055..057 cover listings/stock/media only; ordering semantics unspecified | ADR-013 |
| 6 | Abuse/moderation model finalization (AbuseReport; report/block in the marketplace) | `DATA_MODEL_CONCEPT.md` §11 (C-6); `USE_CASES.md` UC-6005 gap note | No dedicated REQ exists for report/block abuse; THREAT_MODEL TC-10 treatment proposal awaits owner | OD-109; ADR-012 |
| 7 | Policy layer versioning approach | `AUTHORIZATION_MODEL.md` §12 (flagged as candidate ADR for Task 2-f) | Audit records must state which policy version produced a decision | ADR-010, ADR-015 |
| 8 | Authorization reason-code registry ownership & versioning | `AUTHORIZATION_MODEL.md` §12 | Reason codes are a controlled vocabulary with no owning decision | ADR-010 |
| 9 | Closed-event read-only rule | `AUTHORIZATION_MODEL.md` §12 | Whether a closed event becomes read-only (and for whom) is undefined | ADR-010; candidate 3 |
| 10 | Platform administrator role catalog & governance | `AUTHORIZATION_MODEL.md` §12 | Platform-level admin role catalog is not defined in the baseline | OD-122 (workspace roles, different scope) |
| 11 | Extension instance stacking semantics (multiple seat packages on one workspace; counting) | `ENTITLEMENT_MODEL.md` §12 | Whether instances may stack, and how stacked quotas count, is undefined | ADR-014; OD-05 |
| 12 | Availability-rule parameters for catalog listings (tier preconditions) | `ENTITLEMENT_MODEL.md` §12 | Concrete availability rules are a OD-06 sub-scope with no values | ADR-013, ADR-014; OD-06 |
| 13 | Effective-access snapshot retention period & storage format | `ENTITLEMENT_MODEL.md` §12 | Snapshot retention is a OD-138 sub-scope with no parameters | ADR-015; OD-138 |

---

## 5. Maintenance rules

1. **ID assignment.** New ADRs take the **next free number** (next free ID after this register: **ADR-021**; historical ADR-000..005, Phase 2 ADR-006..017 and Phase 3 ADR-018..020 are permanently taken). Numbers are never reused, renumbered, or back-filled.
2. **Candidate → registered flow.** A §4 candidate is promoted by: (a) registering the open question in `OPEN_DECISIONS.md` if an owner decision is required (next free OD ID per that register's rules — never invent or reuse an OD ID), and/or (b) creating `adr/ADR-NNN-slug.md` with all 8 fields and adding the row to §3.
3. **OD closure → ADR mapping.** When the owner resolves an OD: record the decision in a new or existing ADR (status `ACCEPTED` + date + evidence), update the OD row in `OPEN_DECISIONS.md` to `CLOSED — see ADR-xxx`, and update this register's §3 row (Related ODs column reflects the closed state). OD IDs and REQ IDs are never renumbered (`CONTROL_CONSISTENCY_MATRIX.md` Phase 1 preservation rule).
4. **Status transitions.** `OPEN → PROPOSED → ACCEPTED | REJECTED`; `ACCEPTED → SUPERSEDED` only by a successor ADR. `ACCEPTED` requires citable owner evidence. Status changes are recorded in the ADR file itself (dated), never silently.
5. **Review cadence.**
   - Every phase gate (per `ROADMAP.md` status rules and `PHASE_2_ACCEPTANCE.md` pattern): re-check each ADR's status against its dependency (an ADR whose OD closed must be updated; an ADR blocking a phase must be escalated).
   - `OPEN` ADRs (currently ADR-006, ADR-007) are re-reviewed at minimum at their blocking phase: ADR-006 before final physical DB/migration work; ADR-007 before Phase 23 (client delivery).
   - `PROPOSED` ADRs are re-reviewed when the owner reviews Phase 2 output (ratification pass) and whenever a cited OD/REQ changes.
   - §4 candidates are re-screened at every phase gate so they do not silently rot.
6. **Change hygiene.** Every register/ADR change re-runs the contradiction searches required by `CONTROL_CONSISTENCY_MATRIX.md` (including the forbidden-phrase scans) and verifies all cited REQ/OD/RSK/UC/LR/NFR IDs against their source registers. Superseded content is marked, never deleted.

---

**Consistency statement:** this register is consistent with `MASTER_CONTROL.md`, `ARCHITECTURE.md`, `DECISIONS.md` (2026-10-27 owner baseline), `CONTROL_CONSISTENCY_MATRIX.md`, and `PHASE_2_DEPENDENCY_MATRIX.md`. Only three license tiers exist (miniRider/maxRider/ISOrider); hiRider is treated strictly as a recruitment portal/capability, never as a license or tier value. No OD/REQ ID is invented or renumbered; candidates carry no IDs. No owner decision beyond the installed baseline attachment is claimed.
