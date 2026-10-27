# ADR-010 — Authorization model

**Scope:** server-side authorization architecture: policy layer, evaluation chain, decision outputs, enforcement, and audit of decisions.

## Status

**PROPOSED** — awaiting owner review of Phase 2 output · **Date:** 2026-10-27

## Context

- Control invariants: server-side authorization (MC §4); policy inputs `actor + tenant/workspace + object + action + event context + tier entitlement + extension + role + object state` (`SECURITY.md` Authorization; MC §2); **UI hiding is never a security control** (MC §2; REQ-024; `TESTING.md` invariant "No capability is protected only by frontend/UI visibility").
- Requirements: REQ-023 (tenant isolation proven by test matrix), REQ-024 (server-side entitlement on every tier-gated capability; UI bypass produces an audited denial), REQ-025 (identity/membership/role/assignment separation), REQ-026 (permission checks actor × tenant × object × action × context × license × object state), REQ-050 (event data only for assigned crew).
- `AUTHORIZATION_MODEL.md` (Task 2-b, PROPOSED) elaborates the model: evaluation chain, 22-code decision vocabulary, permission vocabulary across all 17 bounded contexts, role model, resource ownership, tenant isolation, and a 34-point enforcement inventory.
- Threat coverage: `THREAT_MODEL.md` TC-06 (tenant isolation failure), TC-07 (authorization bypass), TC-08 (entitlement bypass), TC-24 (IDOR/enumeration, supplementary). Registered risks: RSK-102, RSK-103, RSK-107.

## Problem

How should authorization be structured so that every security-sensitive action is evaluated server-side against the full input chain, tenant isolation holds on every query, denials are auditable, and the UI is never relied upon as the control?

## Options

1. **Decentralized per-endpoint checks.**
   - Pros: locally simple to start.
   - Cons/trade-offs: inconsistent coverage; easy to miss checks on new endpoints; no central decision audit; tenant scoping relies on developer discipline. Rejected (fails REQ-023/024 systematically).
2. **Centralized server-side policy layer + defense-in-depth query scoping.**
   - Pros: single evaluation point for the canonical input chain; uniform reason codes and audit; testable once via the REQ-023/REQ-026 matrices.
   - Cons/trade-offs: the policy layer becomes a critical component (performance and availability); requires versioning discipline.
3. **Client-side / token-claims-only enforcement.**
   - Pros: fewer server round-trips.
   - Cons/trade-offs: cannot evaluate object state, event context, or entitlement transitions; UI hiding de facto becomes the control; violates MC §2/REQ-024. Rejected.

## Decision (PROPOSED)

Adopt a **centralized server-side policy layer** with:

- **Deny-by-default:** the absence of an explicit allow is a deny; unknown/unevaluable inputs deny (fail closed).
- **Canonical evaluation chain** per MC §2/`SECURITY.md`: Actor + Tenant/Workspace + Object + Action + Event Context + Tier Entitlement + Extension + Role/Permission + Object State → `ALLOW | DENY` (+ reason code). Authentication/session validity are prerequisites evaluated before the chain.
- **Decision reason codes** as a controlled vocabulary (`AUTHORIZATION_MODEL.md` §3: `ALLOW` + 21 `DENY_*` codes), so every denial is explainable and testable.
- **Decision audit trail:** every security-sensitive decision records who, what, when, decision, reason code, tenant, event context, and an effective-access snapshot (ENTITLEMENT_MODEL §10); denials are first-class audit events (REQ-010 pattern: audited denial, not hidden menu).
- **UI hiding never a control** (REQ-024/REQ-026): direct API calls to tier-gated or unauthorized capabilities must produce audited denials.
- **Defense in depth:** the data access layer additionally enforces tenant scoping on every query (REQ-023; cross-tenant CRUD rejected).

## Consequences

**Positive**

- One place to test the REQ-023 cross-tenant matrix and the REQ-026 permission matrix; reason codes make denials debuggable and auditable.
- Entitlement inputs (ADR-011) plug into a single evaluation point; state-dependent rules (locked evidence, closed openings, expired licenses) are first-class.
- Directly addresses TC-06/TC-07/TC-08/TC-24 and RSK-102/RSK-103.

**Negative / risks**

- The policy layer is a hot path: it must be efficient and highly available; its failure mode must be fail-closed.
- Policy versioning and reason-code registry ownership are **candidates requiring registration** (no existing OD IDs — see `ADR_REGISTER.md` §4).
- The exact workspace role catalog/defaults = OD-122; evaluation order is PROPOSED while the formula itself is canonical; various parameter decisions (OD-05, OD-109, OD-134, OD-136) still shape final rules.

## Evidence

- `AUTHORIZATION_MODEL.md` (Task 2-b — the full elaboration; status PROPOSED; implementation NOT FOUND).
- `MASTER_CONTROL.md` §2/§4; `SECURITY.md` (Authorization; Store security; hiRider security); `ARCHITECTURE.md` §4/§5; `TESTING.md` (mandatory invariants).
- REQ-010, REQ-023, REQ-024, REQ-025, REQ-026, REQ-050 (all in `REQUIREMENTS.md`, status PROPOSED).
- `THREAT_MODEL.md` TC-06/TC-07/TC-08/TC-24; `RISK_REGISTER.md` RSK-102/RSK-103/RSK-107.
- `DATA_MODEL_CONCEPT.md` §2.6 (tenant ownership), §3.14 (Audit context).
- No implementation exists; no authorization tests have been run (`NOT TESTED`).

## Dependencies

- **Open decisions shaping parameters:** OD-05 (seat/quota), OD-109 (profile/application visibility), OD-122 (role catalog), OD-134 (application contact data), OD-136 (self-approval ban), OD-138 (audit retention/access).
- **Related ADRs:** ADR-011 (entitlement inputs to this chain); ADR-012 (hiRider specifics); ADR-013 (store authorization); ADR-015 (decision audit records).
- **Candidate decisions (no IDs):** reason-code registry ownership/versioning; policy layer versioning; closed-event read-only rule; platform administrator role catalog.
- **Related docs:** `ENTITLEMENT_MODEL.md`, `THREAT_MODEL.md`, `API_ARCHITECTURE.md` (by name — parallel Task 2-e).
- **Phases:** Phase 2 (this ADR); Phase 4–5 enforcement build-out (REQ-026 planned 4,5; REQ-024 planned 5).
