# ADR-006 — Production database selection

**Scope:** final physical production database for epicRider. This ADR does NOT lock any vendor; the Phase 2 logical data model is vendor-neutral by design.

## Status

**OPEN** — owner decision required (OD-01) · **Date:** 2026-10-27

## Context

- The repository CURRENT STATE (Phase 0 audit, recorded in `SECURITY.md` and `PHASE_0_AUDIT_REPORT.md`) is a scaffold: Next.js 16 + Prisma 6.11 + SQLite with only a demo `User`/`Post` schema. No epicRider data model exists (`NOT FOUND`).
- OD-01 ("Database produksi — SQLite vs PostgreSQL/MySQL lain") has been OPEN since Phase 0 and remains OPEN (no owner decision exists).
- The owner-reconciled control baseline (2026-10-27) explicitly scopes OD-01: it may block **only** the final production database selection and the final physical migration implementation. It does **not** block the domain model, logical data model, bounded contexts, threat model, API architecture, or authorization model (`DECISIONS.md` OD-01; `MASTER_CONTROL.md` §5; `PHASE_2_DEPENDENCY_MATRIX.md`).
- Phase 2 produced `DATA_MODEL_CONCEPT.md` (Task 2-a) as a vendor-neutral logical/conceptual model; its §11 row 1 keeps the physical database OPEN.

## Problem

Which physical database engine should serve epicRider in production? The choice determines physical identifier encoding, physical index types, transactional concurrency behavior, audit-storage mechanics, and migration tooling — but it is not required for any Phase 2 architecture artifact. Deciding it now, without deployment/hosting evidence or an owner decision, would violate the anti-hallucination rules (`MASTER_CONTROL.md` §7).

## Options

1. **SQLite (current repo state).**
   - Pros: zero-operations, embedded, already wired via Prisma in the scaffold.
   - Cons/trade-offs: single-writer concurrency model; limited managed backup / point-in-time-recovery story for a multi-tenant SaaS; physical WORM-style audit storage mechanics (ADR-015 interaction) are harder to guarantee.
2. **PostgreSQL.**
   - Pros: mature relational engine, strong concurrent-write behavior, rich index types, broad managed-hosting availability.
   - Cons/trade-offs: introduces operational dependency; interacts with the still-OPEN hosting decision (OD-10); requires physical migration work from the current scaffold.
3. **Other relational engine (e.g. the MySQL family, per the OD-01 option text "PostgreSQL/MySQL lain").**
   - Pros: viable class of alternatives with similar characteristics to option 2.
   - Cons/trade-offs: same operational considerations; no project evidence currently favors a specific engine.

No option is selected. The option space above is exactly the one recorded in `OPEN_DECISIONS.md` OD-01; no new vendor is introduced.

## Decision

**NOT DECIDED — owner decision required (OD-01).**

Meanwhile, and until OD-01 is resolved:

- the logical/conceptual data model proceeds **vendor-neutral** (`DATA_MODEL_CONCEPT.md`, status PROPOSED);
- no physical migration, physical index DDL, or audit-storage physical design is finalized;
- the blocked sub-scope is exactly: final production database selection + final physical migration implementation (`PHASE_2_DEPENDENCY_MATRIX.md`).

## Consequences

**Positive**

- Phase 2 architecture work is fully unblocked (per the baseline dependency rules — OD-01 is not a Phase 2 blocker at architecture level).
- The logical model stays portable; the decision can later be made with real deployment evidence (hosting, OD-10) instead of assumptions.

**Negative / risks**

- Physical design decisions remain deferred: physical audit storage mechanics (see ADR-015) and physical concurrency characteristics (see `THREAT_MODEL.md` TC-17/TC-19 residual notes) depend on the engine.
- Risk of rework if any later artifact unknowingly assumes a vendor-specific feature; mitigation: `DATA_MODEL_CONCEPT.md` §2 keeps principles logical, and its identifier proposal (UUIDv7-class) is engine-agnostic pending its own candidate decision.
- REQ-029 (controlled, reviewed migrations) cannot be exercised end-to-end until a target engine exists.

## Evidence

- `DECISIONS.md` (owner baseline 2026-10-27) — OD-01 effect/does-not-block list.
- `MASTER_CONTROL.md` §5 (decision dependency policy).
- `PHASE_2_DEPENDENCY_MATRIX.md` — OD-01 row.
- `DATA_MODEL_CONCEPT.md` §11 (row 1) and §12 (physical database `OPEN — OD-01`).
- `ARCHITECTURE.md` §9 ("Production database choice remains OD-01 unless resolved during Phase 2").
- Repository CURRENT STATE: Phase 0 audit findings (Prisma + SQLite demo schema) — `SECURITY.md` Current state.
- No test results exist or are claimed; no vendor evaluation has been performed in Phase 2.

## Dependencies

- **Open decision:** OD-01 (production database) — the deciding input for this ADR.
- **Related ODs:** OD-10 (hosting/deployment — interacts with the engine choice).
- **Related ADRs:** ADR-015 (audit & record versioning — physical storage mechanics); candidate decision "identifier standard" (see `ADR_REGISTER.md` §4) interacts with physical encoding.
- **Related docs:** `DATA_MODEL_CONCEPT.md`, `THREAT_MODEL.md`, `API_ARCHITECTURE.md` (by name — parallel Task 2-e).
- **Phases:** Phase 2 (this ADR); physical migrations become concrete from Phase 3 onward (REQ-029 planned phase 2+).
