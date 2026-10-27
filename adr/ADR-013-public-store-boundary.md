# ADR-013 — Public Store boundary

## Status

**ACCEPTED** (owner-reconciled baseline, 2026-10-27) · **Date:** 2026-10-27

**Scope note:** the *boundary decision* below is accepted via the owner baseline. Commercial values, order/invoice finalization, and one access-derivation question remain OPEN (OD-06 / OD-135; one candidate — see Consequences).

## Context

- Owner-reconciled baseline (attachment `upload/epicRider_phase2_control_replacement.zip`, installed 2026-10-27 — worklog Task 2-0): `MASTER_CONTROL.md` §1 defines **Public Store** as the developer commerce storefront selling license products, extensions, and other approved developer products; access is granted to **users holding a basic miniRider license**; the Public Store is not a license tier and not a special feature of maxRider/ISOrider.
- The same baseline separates the **Developer Equipment Store**: the in-app developer equipment store, accessible to miniRider only (maxRider denied; ISOrider denied) — a different store from the Public Store.
- `ARCHITECTURE.md` §7 (owner baseline) fixes the Public Store architecture objects: Product, Product Type, License Product, Extension Product, Catalog Listing, Availability, Order/Purchase abstraction, entitlement issuance, audit trail — with commercial values governed by OD-06.
- Requirements: REQ-030 (the two stores fully isolated — data, access, API), REQ-010 (Equipment Store API denial for other tiers is **audited**, not merely hidden), REQ-016 (Developer Portal special-role management), REQ-055..REQ-057 (equipment listing lifecycle, price/stock audit, media limits).

## Problem

Fix the boundary between the Public Store, the Developer Equipment Store, and the Developer Portal so that access rules, entitlement issuance, and isolation are unambiguous and testable — and so the Public Store is never modeled as an entitlement of higher tiers.

## Options

1. **One unified store with per-tier filtering.**
   - Pros: single storefront implementation.
   - Cons/trade-offs: violates REQ-030 (full isolation); tier filtering behaves like UI hiding (never a control, MC §2); conflates license/extension commerce with equipment commerce. **REJECTED.**
2. **Public Store as an entitlement of maxRider/ISOrider.**
   - Pros: none consistent with the baseline.
   - Cons/trade-offs: directly contradicts the owner baseline (access rule = basic miniRider license; not a feature of higher tiers). **REJECTED by the owner baseline.**
3. **Two separate storefront domains with distinct access rules.**
   - Pros: matches REQ-030 isolation; each store keeps its own entities, APIs, and audit; access rules are simple and server-side enforceable.
   - Cons/trade-offs: two commerce surfaces to build and govern; developer role model must span both (OD-101). **ACCEPTED (owner baseline).**

## Decision (ACCEPTED via owner baseline)

- **Public Store = developer commerce storefront.** Product types may include: license products, extensions, and approved developer products (`MASTER_CONTROL.md` §1).
- **Access rule: users with a basic miniRider license** (server-side entitlement check; `SECURITY.md` Store security: purchase/license/extension issuance auditable).
- **The Public Store is NOT an entitlement of maxRider/ISOrider** and is not a license tier.
- **Separate from the Developer Equipment Store**, which is miniRider-only with **audited** API denial for any other account (REQ-010 acceptance: denial is audited, not a hidden menu).
- **Structural isolation:** two disjoint entity families with no shared tables, listings, or cross-links (`DATA_MODEL_CONCEPT.md` §4.6); the Developer Portal (REQ-016) is the management console, a separate concern from both storefronts.

## Consequences

**Positive**

- REQ-030's isolation tests (cross-access rejected) are structurally satisfiable; REQ-010's audited-denial behavior has a clear enforcement point.
- Licensing/extension commerce (issuance → License/Extension per ADR-011/ADR-014) is cleanly separated from equipment commerce (REQ-055..057 listing lifecycle).
- Store security controls map to `THREAT_MODEL.md` TC-13/TC-14/TC-15.

**Negative / risks**

- **Open derivation question (candidate — requires registration):** how a user whose only workspace is on a higher tier derives Public Store access ("basic miniRider license" holder scope is not defined for that case in the control files; `DATA_MODEL_CONCEPT.md` §11 candidate — must not be silently interpreted).
- Commercial values (prices, tax, gateway, refund) = OD-06 OPEN; order/invoice state machine = OD-135 OPEN; price/discount authority = OD-133 OPEN.
- Equipment Store order/fulfillment model (physical goods) is unspecified by requirements — candidate decision (REQ-055..057 cover listings/stock/media only).

## Evidence

- **Owner attachment `upload/epicRider_phase2_control_replacement.zip`** (reconciled control baseline installed 2026-10-27 — worklog Task 2-0).
- `MASTER_CONTROL.md` §1 (Public Store / Developer Equipment Store definitions + access rules); `ARCHITECTURE.md` §2/§7; `LICENSE_MATRIX.md` §4; `SECURITY.md` Store security — all owner-baseline files dated 2026-10-27.
- REQ-010, REQ-016, REQ-030, REQ-055, REQ-056, REQ-057 (`REQUIREMENTS.md`, status PROPOSED).
- `DATA_MODEL_CONCEPT.md` §4.6/§3.12 (structural separation); `ENTITLEMENT_MODEL.md` §8 (issuance architecture); `AUTHORIZATION_MODEL.md` §9 (store authorization); `THREAT_MODEL.md` TC-13/TC-14/TC-15.
- No store implementation exists; no commercial values are asserted anywhere.

## Dependencies

- **Open decisions:** OD-06 (commercial values — excluded), OD-101 (developer role model), OD-133 (price/discount authority), OD-135 (order/invoice machine).
- **Related ADRs:** ADR-011 (entitlement model — store access as entitlement input); ADR-014 (extension products in the catalog).
- **Candidate decisions (no IDs):** license-holding scope for Public Store access derivation; Equipment Store order/fulfillment model.
- **Related docs:** `ENTITLEMENT_MODEL.md`, `DATA_MODEL_CONCEPT.md`, `THREAT_MODEL.md`.
- **Phases:** Phase 2 (this ADR); Phase 11 (store per REQ-030/055 planned phase 11); Phase 22 (commerce/portal per REQ-016).
