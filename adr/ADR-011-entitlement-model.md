# ADR-011 — Entitlement model

## Status

**PROPOSED** — awaiting owner review of the full model · **Date:** 2026-10-27

**Taxonomy note:** the underlying **taxonomy is ACCEPTED via the owner baseline** (only three license tiers — miniRider, maxRider, ISOrider; hiRider is not a tier value; Tier / Capability / Extension are separated concepts). The model as a whole (formula semantics, lifecycles, enforcement) remains PROPOSED.

## Context

- Owner-reconciled baseline (2026-10-27): `MASTER_CONTROL.md` §1 fixes exactly three license tiers; §2 defines the entitlement taxonomy (Tier Entitlement / Capability / Extension) and the canonical effective-access formula; hiRider is a portal/capability and is never a value of `license_tier`.
- `LICENSE_MATRIX.md` (owner baseline) carries the tier inheritance matrix, store access rules, and the canonical extension lifecycle; `ARCHITECTURE.md` §5 requires the separate concepts `LicenseTier`, `License`, `Entitlement`, `Capability`, `Extension`, `Assignment`, `Permission` — and forbids encoding hiRider as a LicenseTier.
- Requirements: REQ-001/REQ-002 (one platform, one domain model, no parallel DB per tier; upgrades without data migration), REQ-009 (5-kru quota, server-side rejection; counting = OD-05), REQ-018 (extension catalog incl. additional workspace, +10 seat/workspace, mobile app, landing page; commercial detail excluded without OD-06), REQ-024 (server-side entitlement), REQ-098 (license lifecycle; rules & durations = owner), REQ-099 (downgrade behavior: restrict/archive/delete per OD-108; no silent data loss).
- `ENTITLEMENT_MODEL.md` (Task 2-b, PROPOSED) elaborates the full model; registered risks: RSK-103, RSK-107, RSK-110, RSK-111.

## Problem

How are entitlements derived, evaluated, enforced, and audited so that tiers, extensions, capabilities, roles, resource context, and object state combine into effective access — without per-tier data forks and without inventing any commercial value?

## Options

1. **Static per-tier permission flags stored on the user/session.**
   - Pros: cheap to evaluate.
   - Cons/trade-offs: goes stale on tier/extension change; cannot include object state; leaks via API (RSK-103 pattern). Rejected.
2. **Evaluated-at-decision-time entitlement model (canonical formula) with audit snapshots.**
   - Pros: always current; state-aware; auditable ("what was this workspace entitled to at decision time?"); supports REQ-002 upgrades without migration.
   - Cons/trade-offs: evaluation on every tier-gated request; requires disciplined snapshot retention.
3. **Per-tier schemas / parallel stores.**
   - Pros: hard isolation per tier.
   - Cons/trade-offs: explicitly forbidden by REQ-001/REQ-002 (no parallel DB per tier; upgrade without data migration). Rejected.

## Decision (PROPOSED)

Adopt the **effective access formula** per `MASTER_CONTROL.md` §2 (canonical):

```
Effective Access = Tier Entitlement + Active Extensions + Capability Rules
                 + Role/Permission + Resource Context + Object State
```

with the semantics elaborated in `ENTITLEMENT_MODEL.md` §3 (PROPOSED): short-circuit deny with reason codes; extensions are **additive only** (never remove tier rights, never emulate another tier); entitlement inputs **gate** while roles **grant**; evaluation is server-side on every tier-gated capability (REQ-024); deny on unknown. Further:

- **License lifecycle** per REQ-098 (`PURCHASED → ACTIVE → RENEWAL_DUE → EXPIRED → GRACE → DOWNGRADED`, with renewal/re-upgrade loops); durations/grace/downgrade-target parameters = OD-108 OPEN; every transition audited.
- **Extension lifecycle** per the owner baseline `LICENSE_MATRIX.md` §5 (see ADR-014); instances bind to (workspace, type).
- **Seat/quota enforcement** server-side at membership create/invite (REQ-009; counting rule = OD-05 OPEN); additional seats via seat-package extensions (REQ-018).
- **Downgrade** follows REQ-099: restrict-not-delete recommended (PROPOSED), data intact for re-upgrade; final = OD-108.
- **One domain model across tiers** (REQ-001/REQ-002): tier differences are entitlement data, never schema forks.
- **Commercial values excluded:** prices, tax, payment gateway, refund policy are not modeled (OD-06 OPEN).

## Consequences

**Positive**

- Upgrades enrich the same domain (REQ-002); no migration risk between tiers; re-upgrade restores access.
- Effective-access snapshots make historical decisions answerable (feeds ADR-015 audit records).
- Taxonomy is already owner-accepted, so downstream artifacts (ADR-012/013/014) build on a stable base.

**Negative / risks**

- Per-request evaluation cost at the policy layer (shared with ADR-010).
- Extension stacking semantics and availability-rule parameters are candidates requiring registration; snapshot retention is OD-138 sub-scope (candidate).
- Until OD-05/OD-108 land, quota-counting and restriction-scope rules remain parameterized and cannot be finalized.

## Evidence

- Owner baseline attachment `upload/epicRider_phase2_control_replacement.zip` (installed as control files by worklog Task 2-0, 2026-10-27) — taxonomy acceptance: `MASTER_CONTROL.md` §1/§2, `LICENSE_MATRIX.md` §1/§2/§5/§6, `ARCHITECTURE.md` §5.
- `ENTITLEMENT_MODEL.md` (Task 2-b) — full elaboration (status PROPOSED).
- REQ-001, REQ-002, REQ-009, REQ-011, REQ-012, REQ-018, REQ-024, REQ-098, REQ-099 (`REQUIREMENTS.md`, status PROPOSED).
- `THREAT_MODEL.md` TC-08 (entitlement bypass); `RISK_REGISTER.md` RSK-103/RSK-107/RSK-111.
- No implementation exists; no entitlement tests have been run (`NOT TESTED`); no commercial values are asserted anywhere.

## Dependencies

- **Open decisions:** OD-05 (seat counting), OD-06 (commercial values — excluded from this ADR), OD-108 (expiry/grace/downgrade), OD-123 (multi-workspace limits), OD-135 (order/invoice machine), OD-137 (storage quotas), OD-138 (audit/snapshot retention).
- **Related ADRs:** ADR-010 (consumer of entitlement inputs); ADR-013 (store access rule); ADR-014 (extension lifecycle); ADR-015 (snapshots as audit records).
- **Candidate decisions (no IDs):** extension instance stacking; availability-rule parameters; effective-access snapshot retention/format.
- **Related docs:** `LICENSE_MATRIX.md`, `AUTHORIZATION_MODEL.md`, `DATA_MODEL_CONCEPT.md` (§3.5/§3.6).
- **Phases:** Phase 2 (this ADR); Phase 5 (entitlement/license enforcement per REQ-024/098/099 planned phase 5).
