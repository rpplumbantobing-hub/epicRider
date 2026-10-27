# ADR-014 — Extension model

## Status

**ACCEPTED for the model structure** (owner-reconciled baseline, 2026-10-27) — commercial/pricing aspects remain OPEN (OD-06) · **Date:** 2026-10-27

## Context

- Owner-reconciled baseline (attachment `upload/epicRider_phase2_control_replacement.zip`, installed 2026-10-27 — worklog Task 2-0): `MASTER_CONTROL.md` §2 defines **Extension** as a purchasable/activatable addition **on top of a tier** — additional workspace, additional seat package, workspace landing, mobile/client extension, future approved extensions — and states "Extension is not a tier".
- `LICENSE_MATRIX.md` §5 (owner baseline) fixes the canonical extension lifecycle:
  `CATALOG → PURCHASED/ASSIGNED → ACTIVE → SUSPENDED/EXPIRED → RENEWED/REMOVED`
- `ARCHITECTURE.md` §5 requires `Extension` as a concept separate from `LicenseTier`, `License`, `Capability`, `Assignment`, `Permission`.
- REQ-018 (extension catalog: additional workspace, +10 seat/workspace, mobile app, workspace landing, others approved) explicitly excludes commercial detail pending OD-06. REQ-024 requires server-side enforcement. MC §7 forbids inventing prices.
- `ENTITLEMENT_MODEL.md` §7 elaborates the model rules (Task 2-b, PROPOSED elaboration on the accepted structure).

## Problem

Define what an extension is and how it behaves, so that extensions add capacity or features above a tier — with auditable lifecycle, additive-only semantics, and no commercial values — without ever acting as a tier or license substitute.

## Options

1. **Extensions as tier substitutes/upgrades (buy your way into a higher tier).**
   - Pros: fewer concepts.
   - Cons/trade-offs: collapses the accepted taxonomy (extension is not a tier; only three tiers exist); breaks the effective-access formula's tier input. **REJECTED by the owner baseline.**
2. **Ad-hoc per-workspace flags without lifecycle.**
   - Pros: minimal modeling.
   - Cons/trade-offs: no renewal/expiry/suspension semantics; no auditable transitions; entitlement evaluation unreliable; RSK-103-class leakage risk. **REJECTED.**
3. **Extension as a first-class entitlement unit with its own canonical lifecycle, additive to a tier.**
   - Pros: auditable, renewable, suspendable; plugs into the effective-access formula as an additive input; supports quota raising via seat packages (REQ-018).
   - Cons/trade-offs: an additional entitlement family to govern; stacking semantics need a decision. **ACCEPTED (owner baseline structure).**

## Decision (ACCEPTED for model structure via owner baseline)

- **Extension = additive unit above a tier.** Extensions never change the tier value, never remove tier rights, and never act as a tier substitute (`MASTER_CONTROL.md` §2; `ENTITLEMENT_MODEL.md` §3 "additive within tier").
- **Canonical lifecycle** (owner baseline, `LICENSE_MATRIX.md` §5): `CATALOG → PURCHASED/ASSIGNED → ACTIVE → SUSPENDED/EXPIRED → RENEWED/REMOVED`. Model rules per `ENTITLEMENT_MODEL.md` §7: an instance binds to a **(workspace, type)** pair; every transition is audited (actor/system, timestamp, workspace, type, old/new state, triggering order reference); removal never silently deletes workspace data.
- **Catalog types:** additional workspace, additional seat package, workspace landing, mobile/client extension, and future approved extensions — new types require owner approval ("future approved" is the baseline's own gate; no new type is invented here).
- **Enforcement:** server-side — an inactive/suspended/expired instance simply stops contributing to effective access (REQ-024; `DENY_EXTENSION_MISSING` in `AUTHORIZATION_MODEL.md` §3).
- **Commercial/pricing aspects remain OPEN (OD-06):** no prices, tax, payment gateway, or refund policy are modeled or implied.

## Consequences

**Positive**

- Seat quotas can be raised sanctioned-ly via seat-package extensions (REQ-018; `ENTITLEMENT_MODEL.md` §6) without touching tier semantics.
- Lifecycle audit trail satisfies the sensitive-transition auditability invariant (MC §4) and feeds TC-08 controls.
- Cleanly composes with ADR-011 (effective access) and ADR-013 (extension products in the Public Store catalog).

**Negative / risks**

- **Stacking semantics** (may multiple seat-package instances attach to one workspace, and how are they counted?) is a candidate decision requiring registration — no existing OD ID.
- Availability-rule parameters (which tiers/preconditions may order which extension) are a candidate (OD-06 sub-scope).
- Data created via an extension that later expires/suspends follows the restrict-not-delete principle by analogy with REQ-099; the final restriction scope = OD-108 OPEN.
- Commercial governance (OD-06/OD-133) unresolved means catalog values stay abstract.

## Evidence

- **Owner attachment `upload/epicRider_phase2_control_replacement.zip`** (reconciled control baseline installed 2026-10-27 — worklog Task 2-0); the lifecycle chain is verbatim from the installed `LICENSE_MATRIX.md` §5.
- `MASTER_CONTROL.md` §2 (extension taxonomy + "not a tier"); `ARCHITECTURE.md` §5; `LICENSE_MATRIX.md` §5/§6 — all owner-baseline files dated 2026-10-27.
- REQ-018, REQ-024 (`REQUIREMENTS.md`, status PROPOSED).
- `ENTITLEMENT_MODEL.md` §7 (elaboration, PROPOSED); `DATA_MODEL_CONCEPT.md` §4.5/§3.6 (separate entity families; closed lifecycle).
- No extension implementation exists; no commercial values are asserted anywhere.

## Dependencies

- **Open decisions:** OD-06 (commercial values — excluded from the accepted structure), OD-108 (restriction scope on expiry/downgrade), OD-123 (multi-workspace limits via the additional-workspace extension).
- **Related ADRs:** ADR-011 (entitlement model — extensions as inputs); ADR-013 (extension products/catalog).
- **Candidate decisions (no IDs):** extension instance stacking semantics; availability-rule parameters.
- **Related docs:** `LICENSE_MATRIX.md`, `ENTITLEMENT_MODEL.md`, `DATA_MODEL_CONCEPT.md`.
- **Phases:** Phase 2 (this ADR); Phase 5 (extension catalog/entitlement per REQ-018 planned phase 5,23); Phase 22 (commerce).
