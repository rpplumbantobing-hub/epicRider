# ADR-012 — hiRider domain boundary

## Status

**ACCEPTED** (owner-reconciled baseline, 2026-10-27) · **Date:** 2026-10-27

> **AMENDED (terkendali) 2026-10-28 — remediasi F-01 audit konsistensi Phase 3:** scope hiRider **termasuk penawaran jasa (Service Offer)** per baseline Master Control ("Marketplace layanan kru"); lihat `adr/ADR-021-hirider-service-offer-scope.md`. Boundary decision dan seluruh invariant ADR-012 **tidak berubah**; `ServiceOffer` ditambahkan sebagai objek yang direncanakan di context hiRider (lifecycle detail tetap `PROPOSED`).

**Scope note:** the *boundary decision* below is accepted via the owner baseline. Detailed lifecycle states for RecruitmentOpening and Application remain **PROPOSED** pending owner review of `DATA_MODEL_CONCEPT.md` §5/§6 (see candidate decision in `ADR_REGISTER.md` §4).

## Context

- The owner replaced the control files on 2026-10-27 with a reconciled baseline (attachment `upload/epicRider_phase2_control_replacement.zip`, installed by worklog Task 2-0). Among the corrections: the earlier draft taxonomy that treated hiRider as a fourth licensing layer was replaced by the final taxonomy — only three license tiers exist, and hiRider is a portal/capability.
- `MASTER_CONTROL.md` §1 (owner baseline): hiRider is **not** a license, **not** a fourth tier, and **not** a value of `license_tier`; it is the portal/capability where workspaces open recruitment, users/candidates build profiles/skills/portfolios and apply, workspaces screen and accept/reject candidates, and assignment can follow the recruitment process.
- `ARCHITECTURE.md` §2/§6 (owner baseline): core chain `User Profile → Recruitment Opening → Application → Recruitment Decision → Membership/Assignment`; rules: application is not membership; acceptance does not automatically grant access; membership follows explicit workspace authorization; event assignment is separate; profile visibility/privacy must be explicit.
- `TESTING.md` mandatory invariants: `Application != Membership`, `Application != Event Assignment`, `Acceptance != Automatic Workspace Access`, `hiRider != LicenseTier`.

## Problem

Fix the domain boundary of hiRider so that the data model, authorization model, and entitlement model cannot accidentally encode hiRider as a licensing concept, while the recruitment workflow (opening → application → decision → membership/assignment) remains first-class.

## Options

1. **hiRider as a fourth licensing layer above workspaces.**
   - Pros: none that survive the baseline correction; simple marketing story for a "premium layer".
   - Cons/trade-offs: contradicts the owner baseline taxonomy (only three tiers); collapses application/membership/entitlement concepts. **REJECTED by the owner baseline.**
2. **hiRider as a feature exclusive to higher license tiers.**
   - Pros: trivial entitlement wiring.
   - Cons/trade-offs: contradicts the baseline framing of hiRider as an ecosystem-wide portal/capability operating above licensed workspaces (`ENTITLEMENT_MODEL.md` §2: participation requires no license of its own). **REJECTED.**
3. **hiRider as a recruitment portal/capability with its own bounded context, fully separated from licensing.**
   - Pros: preserves the recruitment workflow and all three invariants; keeps candidate privacy handling explicit; leaves tier economics untouched.
   - Cons/trade-offs: requires its own authorization specifics (visibility, application privacy) and abuse/moderation handling. **ACCEPTED (owner baseline).**

## Decision (ACCEPTED via owner baseline)

**hiRider = recruitment portal/capability — NOT a license, NOT a tier, NOT a value of `license_tier`.**

- The `LicenseTier` enumeration contains ONLY `miniRider`, `maxRider`, `ISOrider` (`DATA_MODEL_CONCEPT.md` §4.4; schema-level enum checks must reject any fourth value).
- Invariants (canonical, `MASTER_CONTROL.md` §1): `Application != Workspace Membership`; `Application != Event Assignment`; `Acceptance != Automatic Workspace Access`.
- Membership is created only through an explicit invitation/workspace authorization step (UC-6004 alternate flow: accept is followed by a separate membership invitation — never automatic); event assignment is a further separate step.
- hiRider owns its bounded context (Recruitment) with the minimum conceptual objects of `ARCHITECTURE.md` §6: Candidate/User Profile, Skill, Portfolio, Recruitment Opening, Application, Application Status History, Shortlist, Recruitment Decision, Workspace Membership (ref), Event Assignment (ref).
- **Scope note (PROPOSED part):** the example lifecycles `DRAFT → OPEN → PAUSED → CLOSED` (Opening) and `SUBMITTED → REVIEWING → SHORTLISTED → ACCEPTED / REJECTED / WITHDRAWN` (Application) are proposed domain states, not owner-approved finals (`DATA_MODEL_CONCEPT.md` §5.2; Phase 2 prompt §7) — finalization is a candidate ADR requiring registration.

## Consequences

**Positive**

- Licensing taxonomy stays clean (feeds ADR-011); REQ-013 acceptance ("application status never changes workspace permissions") is structurally enforceable.
- Candidate privacy can be handled explicitly per object (profile visibility, application privacy — OD-109/OD-134) rather than via licensing.
- The boundary survives as a testable invariant set (`TESTING.md`).

**Negative / risks**

- hiRider is a privacy-sensitive surface: TC-09 (privacy leakage) and TC-10 (fake/abusive recruitment) are rated high-attention in `THREAT_MODEL.md`; visibility defaults (OD-109) and the abuse/moderation model (candidate — no dedicated REQ exists yet, UC-6005 gap note) are still open.
- Labor-adjacent classification of marketplace crew is a recorded legal uncertainty (`LEGAL_REGULATORY_REGISTER.md` LR-011 — no legal conclusion made).

## Evidence

- **Owner attachment `upload/epicRider_phase2_control_replacement.zip`** (reconciled control baseline installed 2026-10-27 — worklog Task 2-0; taxonomy correction explicitly recorded there).
- `MASTER_CONTROL.md` §1 (hiRider definition + invariants); `ARCHITECTURE.md` §2/§6; `TESTING.md` (mandatory domain invariants); `LICENSE_MATRIX.md` §1/§3 — all owner-baseline files dated 2026-10-27.
- REQ-013, REQ-062, REQ-063, REQ-064 (`REQUIREMENTS.md`, status PROPOSED).
- `DATA_MODEL_CONCEPT.md` §4.3/§4.4/§5; `AUTHORIZATION_MODEL.md` §8; `ENTITLEMENT_MODEL.md` §2; `THREAT_MODEL.md` TC-09/TC-10.
- `USE_CASES.md` UC-6002..UC-6005 (application flows incl. "accept is not automatic access").

## Dependencies

- **Open decisions:** OD-109 (default visibility & abuse policy), OD-134 (application contact-data policy), OD-123 (multi-workspace crew limits). ~~OD-185~~ **CLOSED 2026-10-28 — DECIDED BY BASELINE** (penawaran jasa in-scope; lihat `adr/ADR-021-hirider-service-offer-scope.md`; `ServiceOffer` direncanakan di `DATA_MODEL_CONCEPT.md` §3.7, lifecycle `PROPOSED`; tanpa REQ baru — REQ-013 diamendemi terkendali).
- **Related ADRs:** ADR-011 (taxonomy), ADR-010 (§8 hiRider authorization specifics).
- **Candidate decisions (no IDs):** hiRider Opening/Application lifecycle finalization; abuse/moderation model.
- **Related docs:** `DATA_MODEL_CONCEPT.md`, `THREAT_MODEL.md`, `LEGAL_REGULATORY_REGISTER.md` (LR-002/LR-011).
- **Phases:** Phase 2 (this ADR); Phase 16 (hiRider features per REQ-013/062/063/064 planned phase 16).
