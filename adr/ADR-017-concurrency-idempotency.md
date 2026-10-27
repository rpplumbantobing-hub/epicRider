# ADR-017 — Concurrency & idempotency strategy

**Scope:** concurrency control and idempotency semantics for API mutations. `API_ARCHITECTURE.md` (Task 2-e, written in parallel) is referenced by name only.

## Status

**PROPOSED** — awaiting owner ratification (conflict-resolution policies remain OPEN: OD-107 / OD-130 / OD-131) · **Date:** 2026-10-27

## Context

- Architecture invariant (owner baseline): "optimistic concurrency/versioning for mutable critical records" (`ARCHITECTURE.md` §9); `DATA_MODEL_CONCEPT.md` §2.4 elaborates: monotonic version attribute on mutable records; conflicting writes rejected and surfaced — never silently last-write-wins; append-only histories are the concurrency mechanism for lifecycle records (one transition per event, invalid transitions rejected server-side).
- Requirements: REQ-060 (notification delivery: dedup/idempotency key, delivery status queued/sent/failed, controlled retry — duplicate send must be idempotent), REQ-065 (asset reservation double-booking prevention with a resolution policy — OD-107), REQ-021 (OTP one-time-use + anti-replay), REQ-051 (single-use invite tokens), REQ-009 (seat quota enforced server-side at membership create/invite).
- `THREAT_MODEL.md`: TC-18 (replay — replayed purchases/notifications/invites duplicate effects) and TC-19 (race conditions — double-booking, duplicate applications/memberships, quota bypass via concurrent invites, lost updates).
- Phase 2 prompt §12 lists idempotency and concurrency as required API-architecture topics.

## Problem

Define one coherent strategy for concurrent mutations and duplicate/replayed requests so that lost updates, double-booking, duplicate sends, and double-issuance cannot occur — vendor-neutral (physical DB concurrency characteristics depend on OD-01).

## Options

1. **Last-write-wins (no concurrency control).**
   - Pros: zero ceremony.
   - Cons/trade-offs: silent data loss; violates the §2.4 invariant; TC-19 unmitigated. **REJECTED.**
2. **Pessimistic locking on every mutation.**
   - Pros: strong consistency for hot spots.
   - Cons/trade-offs: lock contention and deadlock risk; poor fit for a stateless API surface; most epicRider mutations are not hot-spot contended. **Not adopted as the default** (transactional locks remain the tool for specific invariants — see Decision).
3. **Optimistic concurrency via resource version tokens + idempotency keys on side-effecting mutations.**
   - Pros: no lock management in the common path; conflicts surfaced explicitly (409); retries made safe by idempotency keys; matches the §2.4 invariant.
   - Cons/trade-offs: clients must handle 409 conflicts and retry; server-side replay cache requires storage and TTL policy.

## Decision (PROPOSED — canonical Phase 2 proposal, fixed by the Phase 2 orchestrator; recorded here for owner ratification)

- **Optimistic concurrency:** every mutable resource carries a monotonic **version token**; mutating requests must present it (`If-Match` header / `expectedVersion` field); on mismatch the server rejects with **409 Conflict** — never a silent overwrite.
- **Idempotency:** side-effecting mutations carry an **`Idempotency-Key` header**; the server keeps a replay cache keyed by (client, key) so retries with the same key return the recorded outcome instead of duplicating effects.
- **Minimum application scope:**
  - notification sends (REQ-060 — duplicate send idempotent, no double messages);
  - store orders / entitlement issuance (replayed purchase must not double-issue — TC-18; commercial mechanics remain OD-06);
  - recruitment applications (duplicate application to the same opening rejected/detected — UC-6003 F2);
  - invitation acceptance (single-use tokens — REQ-051).
- **Preserved specialized semantics:** OTP single-use/anti-replay (REQ-021; ADR-009); reservation overlap checks are **transactional in addition to** versioning (REQ-065; resolution policy = OD-107); seat-quota enforcement is transactional at membership create/invite (REQ-009; counting = OD-05).
- **Physical characteristics** (isolation levels, lock behavior, storage of the replay cache) depend on the production database — OD-01 OPEN (ADR-006).

## Consequences

**Positive**

- Lost updates become visible 409s instead of silent corruption; duplicate sends/orders/applications are structurally prevented.
- Directly implements the TC-18/TC-19 control set and the `ARCHITECTURE.md` §9 invariant; composes with ADR-016 (semantics defined per versioned surface).
- Quota and reservation integrity are protected against concurrent-invite races (TC-19 scenario).

**Negative / risks**

- Client complexity: every mutating client must implement version presentation and 409-conflict handling/retry.
- Replay cache operations (TTL, storage, eviction) add server-side state; their physical design waits on OD-01.
- Conflict-resolution policies remain open: OD-107 (reservation conflicts), OD-130 (double crew-assignment), OD-131 (chat/rundown concurrent-edit granularity).

## Evidence

- `ARCHITECTURE.md` §9 (optimistic concurrency invariant) and §9 data principles — owner baseline 2026-10-27.
- `DATA_MODEL_CONCEPT.md` §2.4 (version attribute; append-only histories as lifecycle concurrency) and §11 rows on OD-107/OD-130/OD-131.
- REQ-009, REQ-021, REQ-051, REQ-060, REQ-065 (`REQUIREMENTS.md`, status PROPOSED).
- `THREAT_MODEL.md` TC-18/TC-19 (controls & residual notes: physical layer OD-01; per-endpoint coverage finalized in `API_ARCHITECTURE.md`).
- `USE_CASES.md` UC-6003 F2 (duplicate application to the same opening rejected/detected).
- `API_ARCHITECTURE.md` (by name only — parallel Task 2-e deliverable).
- Decision content fixed as canonical for Phase 2 by the orchestrator's task instruction to Task 2-f (this ADR); **no owner approval is claimed** — hence status PROPOSED. No implementation exists; no concurrency tests have been run (`NOT TESTED`).

## Dependencies

- **Open decisions:** OD-107 (reservation conflict policy), OD-130 (double-assignment policy), OD-131 (concurrent-edit granularity), OD-01 (physical DB concurrency), OD-05 (quota counting semantics), OD-06 (order mechanics).
- **Related ADRs:** ADR-009 (OTP anti-replay), ADR-016 (versioned API surface), ADR-006 (physical layer).
- **Related docs:** `DATA_MODEL_CONCEPT.md`, `THREAT_MODEL.md`, `API_ARCHITECTURE.md` (by name).
- **Phases:** Phase 2 (this ADR; contract-level); enforced from the first production mutations (Phase 4+); notifications per REQ-060 planned phase 22.
