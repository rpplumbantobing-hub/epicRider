# ZAI HANDOFF — epicRider

**Purpose:** canonical handoff for z.ai after the 2026-11-01 governance reconciliation.

## 1. Source of truth

Before making any change, z.ai MUST sync from the current `main` branch and treat these files as authoritative:

1. `MASTER_CONTROL.md` — stable product/architecture rules.
2. `ROADMAP.md` — single source of truth for dynamic phase status.
3. `ADR_REGISTER.md` — canonical ADR registry.
4. `PHASE_STATUS.md` — summary only; never overrides `ROADMAP.md`.
5. `LICENSE_MATRIX.md` — tier/capability target matrix.
6. `DATA_MODEL_CONCEPT.md` — conceptual data model.
7. `AGENTS.md` — repository/agent governance.
8. Relevant ADRs under `adr/` and current migrations/tests.

Do not rely on an older ZIP, local snapshot, previous chat output, or generated summary when the repository contains a newer canonical file.

## 2. Current baseline

- Phase 5 is **DONE**.
- Phase 6 is **NOT STARTED**.
- Do not start Phase 6 unless the owner explicitly authorizes it.
- Phase 2 and Phase 3 remain `PARTIAL` exactly as recorded in `ROADMAP.md`; do not silently relabel them.
- The repository baseline already contains the Phase 5 closure and the member-quota reconciliation.

## 3. License tiers

Exactly three license tiers exist:

- `miniRider` / `MINI_RIDER`
- `maxRider` / `MAX_RIDER`
- `ISOrider` / `ISO_RIDER`

`totalRider` is retired. Do not introduce it as a product, tier, entitlement, extension, schema, seed, enum, UI, API, roadmap item, or requirement. Narrow negative guards/historical audit references may remain.

`hiRider`, `taskRider`, and `siteRider` are not license tiers.

## 4. Member quota policy — ADR-027

This is the important new owner decision that must be preserved by all future z.ai work:

- The workspace owner is **not counted** as a non-owner member seat.
- The numeric base quota for non-owner workspace members is **intentionally undecided**.
- The base quota may later be set independently for each of the three tiers.
- z.ai MUST NOT invent a numeric default.
- `TierQuota` remains the generic quota configuration mechanism.
- Purchased `seat_package` capacity remains available as additive member capacity.
- Package sizes, prices, stacking rules, renewal/expiry semantics, and runtime enforcement are separate future decisions.
- Do not implement a quota enforcement engine merely because this policy exists.
- Do not infer that TBD means unlimited.

ADR-027 is accepted. ADR-023 is superseded only for the fixed member-quota value/policy portion. The historical Phase 5-B migration remains immutable; the forward reconciliation migration is canonical.

## 5. What z.ai must NOT do

- Do not reintroduce the old `miniRider = 5 crew/workspace` policy as a current decision.
- Do not choose example values such as 5, 10, 25, 50, or 100 as defaults.
- Do not redesign the schema merely to accommodate the deferred decision.
- Do not invent pricing, payment, seat-package stacking, renewal, or expiry semantics.
- Do not move Phase 22 commerce implementation into foundation phases.
- Do not treat target-state control documents as proof of implemented runtime features.
- Do not start Phase 6 without explicit owner authorization.

## 6. Required pre-coding procedure

When the owner authorizes the next implementation phase:

1. Sync/checkout current `main`.
2. Verify the current commit and working tree.
3. Read the control documents listed in §1.
4. Inspect the relevant ADRs, schema, migrations, seeds, and tests.
5. Produce a short consistency/audit report identifying any conflict before coding.
6. If no conflict exists, state the exact phase, scope, acceptance criteria, dependencies, and non-goals.
7. Work only on a dedicated branch.
8. Run the repository's required CI/test gates.
9. Report exact commits, files, tests, and unresolved decisions.

## 7. Immediate state

**Do not code yet.** The correct next action is to wait for explicit owner authorization of Phase 6 or another specifically named task.

When such authorization arrives, use this file together with the canonical control documents above; this handoff does not replace them.
