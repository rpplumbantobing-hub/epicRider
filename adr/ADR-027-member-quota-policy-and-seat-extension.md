# ADR-027 — Member Quota Policy and Additive Seat Extension

**Status:** ACCEPTED — owner directive, 2026-11-01  
**Decision scope:** workspace member quota semantics; numeric quota values remain open  
**Supersedes:** the fixed `miniRider = 5 crew` baseline asserted by ADR-023/Phase 5-B seed, only for the quota value/policy portion; ADR-023 remains historical evidence and is not deleted.  
**Related:** ADR-011, ADR-014, ADR-023, OD-05, `MASTER_CONTROL.md`, `LICENSE_MATRIX.md`, `DATA_MODEL_CONCEPT.md`

## 1. Context

Phase 5-B introduced the generic `TierQuota` structure but also seeded a concrete `miniRider` quota of five crew members per workspace. The owner has now clarified that the number of workspace users/members outside the owner should be determined later, independently for each license tier.

The product must nevertheless preserve a future commercial mechanism in which a workspace can purchase a defined quantity of additional member quota through the existing additive extension model (seat package).

## 2. Problem

A hard-coded base quota of five in the Phase 5-B seed prematurely converts an unresolved commercial/product parameter into an implementation invariant. It also creates a misleading implication that miniRider is permanently limited to five non-owner members, while no equivalent base number has been decided for maxRider or ISOrider.

At the same time, removing the quota concept entirely would make later quota configuration and purchased seat additions unnecessarily difficult.

## 3. Options

### Option A — Keep `miniRider = 5`

Rejected. It contradicts the owner's current decision to defer the numeric base quota.

### Option B — Remove the quota model entirely

Rejected. The platform needs a generic quota foundation for future per-tier limits and additive purchased capacity.

### Option C — Keep generic quota infrastructure, defer numeric base quotas, support additive seat extensions

**Selected.** `TierQuota` remains a generic configuration structure. No numeric base member quota is seeded for any tier until the owner later determines it. Additional member capacity remains representable through the existing `seat_package` extension and its quantity.

## 4. Decision

1. There are exactly three license tiers: `miniRider`, `maxRider`, and `ISOrider`.
2. A workspace owner is **not counted** as a member-seat quota consumer for this policy.
3. The number of non-owner workspace members permitted by the base license is **not fixed yet**. It may be determined later independently for each tier.
4. Until a numeric base quota is explicitly determined, the system must **not invent a default number** for any tier.
5. `TierQuota` remains part of the data model so future base quotas can be configured without redesigning the licensing foundation.
6. The existing `seat_package` extension remains the mechanism for **additive purchased member capacity**. A purchased seat package increases the workspace's available member capacity; it does not create a separate tier or membership type.
7. Package sizes, prices, stacking rules, renewal/expiry behavior, and the exact runtime enforcement algorithm remain separate commercial/implementation decisions and must not be invented by this ADR.
8. The historical Phase 5-B migration is not rewritten. Its fixed `miniRider = 5` seed is corrected by a forward migration that removes that undeclared baseline seed.
9. The entitlement evaluator does not need to enforce a numeric member quota as part of this ADR. Quota enforcement remains a separate runtime capability to be implemented only after the base quota and enforcement semantics are decided.

## 5. Consequences

### Positive

- No tier receives an invented member limit.
- miniRider, maxRider, and ISOrider can receive different base quotas later without schema redesign.
- Owner membership is clearly separated from non-owner member quota.
- Purchased additional member capacity remains compatible with the existing extension model.
- Historical migrations remain immutable and auditable.

### Negative / risks

- Until numeric base quotas and enforcement semantics are decided, the application cannot honestly claim a hard member-cap enforcement rule.
- `seat_package` stacking, renewal, expiry, and consumption semantics remain open.
- Existing Phase 5-B evidence that specifically proves a seed value of five becomes historical evidence, not a current product rule.

## 6. Status and acceptance evidence

Accepted by explicit owner direction in the 2026-11-01 conversation: the number of non-owner workspace users should be determined later, including independently for the other two tiers, while retaining the ability to add purchased member quota through defined seat quantities.

The implementation correction is limited to removing the undeclared Phase 5-B seed through a forward migration and adding regression coverage. The historical Phase 5-B migration remains unchanged.

## 7. Dependencies

- `OD-05` remains open for the eventual numeric base quota and detailed seat-counting/enforcement semantics.
- `ADR-014` remains authoritative for the extension model structure.
- `LICENSE_MATRIX.md` remains the tier/capability matrix and does not acquire invented numeric quota values.
- `DATA_MODEL_CONCEPT.md` retains the generic `TierQuota` concept.
- Phase 22 commerce work must not invent package prices or payment mechanics from this ADR.
