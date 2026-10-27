# ADR-016 — API versioning strategy

**Scope:** versioning strategy for the client-neutral API surface. `API_ARCHITECTURE.md` (Task 2-e, written in parallel) is referenced by name only.

## Status

**PROPOSED** — awaiting owner ratification (deprecation/sunset policy remains TBD owner) · **Date:** 2026-10-27

## Context

- REQ-097 (Must, status PROPOSED): API versioning & backward-compatibility policy for web + mobile clients — "breaking API changes require a new version; old clients keep functioning during a transition period".
- Architecture invariants: "API/domain layer client-neutral" (MC §4); the API must serve desktop/tablet/mobile browsers today and Android/iOS (and possibly Windows) later (`ARCHITECTURE.md` §8) — all against the still-open client delivery strategy (OD-02, see ADR-007).
- The Phase 2 prompt (§12) lists versioning as a required API-architecture topic; contract/boundary architecture (not production endpoints) is the Phase 2 deliverable.
- Multiple client types with independent release cadences are the core driver: a web client ships continuously, while any future store-distributed client (per OD-02) updates on the user's schedule.

## Problem

Fix one predictable versioning strategy for the API surface so that (a) clients can pin a stable contract, (b) breaking changes never ambush existing clients, and (c) the strategy does not depend on the unresolved client delivery strategy (OD-02).

## Options

1. **URL-path major versioning (`/api/v1`).**
   - Pros: explicit and visible; trivially cache-friendly and routable; easy to document and debug; old and new majors coexist cleanly during transition.
   - Cons/trade-offs: URLs change on major bumps; two surfaces must be maintained during overlap windows.
2. **Header-based versioning (Accept / custom header).**
   - Pros: cleaner URLs; version invisible to casual users.
   - Cons/trade-offs: hidden version (easy to omit/miss), harder debugging and caching, ambiguous default behavior — riskier for third-party developer products (Public Store ecosystem, ADR-013).
3. **No explicit versioning (or date-based implicit versioning).**
   - Pros: zero versioning ceremony.
   - Cons/trade-offs: implicit breakage; no clear client contract; violates REQ-097. **REJECTED.**

## Decision (PROPOSED — canonical Phase 2 proposal, fixed by the Phase 2 orchestrator; recorded here for owner ratification)

- **URL-path major versioning:** the API surface is versioned in the path — `/api/v1/...`.
- **Additive-only within a major:** new fields/endpoints may be added; no breaking change (removal, semantic change, type change of an exposed contract element) inside a major version.
- **Breaking changes require a new major path** (`/api/v2`), with the previous major supported during a transition window so old clients keep functioning (REQ-097).
- **Deprecation/sunset policy** (notice period, sunset headers, communication cadence): **TBD owner** — no OD ID is registered for this parameter today; it should be registered as an open decision if the owner wants a formal decision record.

## Consequences

**Positive**

- Predictable contract for every client type (web today; Android/iOS/Windows later — independent of OD-02).
- Old clients keep functioning within a major and during transition windows (REQ-097 acceptance idea).
- Coexists with the store/developer ecosystem: third-party developer products (ADR-013) can pin a major safely.

**Negative / risks**

- Major bumps duplicate the surface during overlap windows (maintenance cost) — mitigated by keeping breaking changes rare via the additive-only rule.
- The additive-only rule is a process control: it must be enforced by API review discipline (no automated guarantee in Phase 2).
- Deprecation/sunset parameters are unset until the owner decides; until then, transition-window lengths are undefined.

## Evidence

- REQ-097 (`REQUIREMENTS.md`, status PROPOSED) — the requirement this ADR implements.
- `MASTER_CONTROL.md` §4 (client-neutral API invariant); `ARCHITECTURE.md` §8 (client support matrix; OD-02 must not force a client choice).
- Phase 2 prompt §12 (versioning as required API topic) and §13 (API versioning as mandatory ADR topic).
- `API_ARCHITECTURE.md` (by name only — parallel Task 2-e deliverable; no internal section is cited).
- Decision content fixed as canonical for Phase 2 by the orchestrator's task instruction to Task 2-f (this ADR); **no owner approval is claimed** — hence status PROPOSED.
- No API exists; no compatibility tests have been run (`NOT TESTED`).

## Dependencies

- **Open items:** deprecation/sunset policy parameters (owner TBD; no OD ID registered yet).
- **Related ODs:** OD-02 (client strategy — does not block this ADR; future clients are its consumers).
- **Related ADRs:** ADR-007 (client delivery strategy), ADR-017 (concurrency/idempotency semantics are defined per versioned surface).
- **Related docs:** `API_ARCHITECTURE.md` (by name — parallel Task 2-e), `REQUIREMENTS.md` (REQ-020/REQ-097).
- **Phases:** Phase 2 (this ADR; API boundary architecture); binding from the first production API (Phase 4 onward per REQ-020 planned phases 2,6).
