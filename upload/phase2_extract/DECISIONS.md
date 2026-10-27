# DECISIONS — epicRider

## Status taxonomy

ADR/decision status:
`OPEN` / `PROPOSED` / `ACCEPTED` / `REJECTED` / `SUPERSEDED`

Evidence status:
`VERIFIED` / `PARTIAL` / `NOT FOUND` / `NOT TESTED` / `BLOCKED` / `PROPOSED` / `UNKNOWN / NEEDS DECISION`

Requirement status:
`PROPOSED` / `APPROVED` / `IMPLEMENTED` / `VERIFIED` / `SUPERSEDED`

Phase status:
`NOT STARTED` / `IN PROGRESS` / `BLOCKED` / `PARTIAL` / `DONE`

## Critical correction

The Phase 1 repository uses a larger decision namespace (including OD-116, OD-160, etc.). Do NOT renumber those decisions to fit an older OD-01..OD-09-only model.

Existing Phase 1 decision IDs are preserved.

The decisions below define the canonical meaning of the key decisions relevant to Phase 2. If the repository contains a more detailed existing OD entry, retain its ID and merge this dependency rule into it rather than creating a duplicate.

## OD-01 — Production database
Status: OPEN unless repository evidence shows otherwise.

Effect:
- may block final production database selection;
- may block final physical migration implementation.

Does not block:
- logical domain model;
- logical data model;
- bounded contexts;
- threat model;
- API architecture;
- authorization model.

## OD-02 — Mobile/client delivery strategy
Status: OPEN unless owner-approved decision exists.

Effect:
- does NOT block Phase 2;
- Phase 2 must remain client-neutral;
- final delivery strategy belongs in ADR;
- Phase 23 delivery remains dependent on final decision.

## OD-03 — WhatsApp provider
Status: OPEN unless owner-approved decision exists.

Effect:
- only provider-specific integration/configuration/production tests are blocked;
- identity domain, session architecture, auth abstraction, recovery and authorization remain unblocked.

## OD-05 — Owner seat semantics
Status: OPEN unless owner-approved decision exists.

Effect:
- only final seat counting/quota/billing semantics are blocked;
- membership, role, entitlement and seat-domain modeling can proceed.

## OD-06 — Billing/commercial
Status: OPEN unless owner-approved decision exists.

Effect:
- catalog, license, entitlement, extension lifecycle and abstract pricing can proceed;
- production payment/charging/final commercial values remain blocked.

## OD-09 — Indonesian legal/regulatory obligations
Status: OPEN.

Effect:
- legal applicability/compliance assertions blocked until validated;
- generic architecture is not blocked.

Required artifact:
`LEGAL_REGULATORY_REGISTER.md`

## OD-116 — DATA_MODEL_CONCEPT
If this ID exists in the Phase 1 repository, it must NOT be treated as a prerequisite that blocks Phase 2. It is a Phase 2 architecture/data-model workstream/output.

Phase 2 must resolve it through evidence and ADRs.

## OD-160 — ISO verification
ISO verification remains independent from generic Phase 2 architecture.
It must not be used as a blocker for non-IMS domain architecture.
