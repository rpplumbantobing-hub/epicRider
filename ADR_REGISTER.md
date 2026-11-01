# ADR REGISTER — epicRider

**Status:** active canonical register. **Updated:** 2026-11-01.

## 1. Purpose & conventions

This is the single register of Architecture Decision Records for epicRider. IDs are sequential, never reused, renumbered, or deleted. Historical ADRs remain history; when a decision changes, the successor ADR is recorded and the superseded portion is explicitly marked.

### Status taxonomy

- `OPEN` — decision not made; owner decision/evidence required.
- `PROPOSED` — reasoned decision awaiting owner ratification.
- `ACCEPTED` — approved with citable owner/baseline evidence.
- `REJECTED` — considered and rejected; history retained.
- `SUPERSEDED` — replaced by a later ADR; history retained.

`OPEN_DECISIONS.md` remains the OD register. OD and ADR IDs are never invented or renumbered.

## 2. Historical register — ADR-000..ADR-005

| ID | Title | Status | Evidence / note |
|---|---|---|---|
| ADR-000 | Adoption of Phase 0 control baseline | ACCEPTED | Initial control baseline; commit `483950c` |
| ADR-001 | No stack changes during Phase 0 | ACCEPTED | Phase 0 baseline; stack evaluation deferred |
| ADR-002 | ISO standards verification deferred | ACCEPTED (environment condition) | F0-012; OD-160 remains open |
| ADR-003 | Seed requirements from Master Control without discovery | ACCEPTED | Phase 0/1 requirements seed |
| ADR-004 | Phase 0 exit gate approved; baseline committed | ACCEPTED | commit `03293b6`; `PHASE_0_ACCEPTANCE.md` |
| ADR-005 | Phase 1 baseline produced; requirements remain proposed | ACCEPTED (execution) | `PHASE_1_REPORT.md`; commit `938932f` |

## 3. Phase 2 register — ADR-006..ADR-017

| ID | Topic | Status | Main dependency / OD |
|---|---|---|---|
| ADR-006 | Production database selection | OPEN | OD-01 |
| ADR-007 | Mobile/client delivery strategy | OPEN | OD-02 |
| ADR-008 | Identity & authentication abstraction | PROPOSED | OD-03, OD-115 |
| ADR-009 | WhatsApp OTP provider abstraction | PROPOSED (vendor part OPEN) | OD-03, OD-115 |
| ADR-010 | Authorization model | PROPOSED | OD-05, OD-109, OD-122, OD-134, OD-136, OD-138 |
| ADR-011 | Entitlement model | PROPOSED (taxonomy accepted by baseline) | OD-05, OD-06, OD-108, related ODs |
| ADR-012 | hiRider domain boundary | ACCEPTED | Lifecycle detail remains candidate |
| ADR-013 | Public Store boundary | ACCEPTED (partly amended by ADR-018) | OD-06, OD-101, OD-133, OD-135 |
| ADR-014 | Extension model structure | ACCEPTED (commercial aspects open) | OD-06, OD-108 |
| ADR-015 | Audit & record versioning | PROPOSED | OD-138/OD-164 |
| ADR-016 | API versioning | PROPOSED | OD-02 related; no final deprecation policy |
| ADR-017 | Concurrency & idempotency | PROPOSED | OD-01, OD-05, OD-06, OD-107/130/131 |

## 3b. Phase 3/4 register — ADR-018..ADR-022

| ID | Topic | Status | Evidence / dependency |
|---|---|---|---|
| ADR-018 | Three commerce surfaces | ACCEPTED | Owner Phase 3 decision; Public Store / License & Extension Shop / Developer Equipment Store |
| ADR-019 | Build/type quality gates | ACCEPTED | Owner Phase 3 decision |
| ADR-020 | i18n mechanism | ACCEPTED | Phase 3 engineering decision; id default + en support |
| ADR-021 | hiRider Service Offer scope | ACCEPTED | Owner remediation directive; OD-185 closed |
| ADR-022 | Phase 4 auth implementation | ACCEPTED (engineering implementation) | Phase 4 gated prompt; PR #1 / merge `a1af59d8…` |

## 3c. Phase 5 register — ADR-023..ADR-027

| ID | Topic | Status | Evidence / dependencies |
|---|---|---|---|
| ADR-023 | Phase 5-B licensing domain/database foundation | **PROPOSED; SUPERSEDED by ADR-027 only for member-quota value/policy portion** | Integrated via PR #3 → `165b3ba`; broader licensing foundation remains valid |
| ADR-024 | Phase 5-C entitlement engine/enforcement | **PROPOSED** | Integrated via PR #3 → `165b3ba`; OD-05/06/108 remain open |
| ADR-025 | Phase 5-D license/extension lifecycle | **PROPOSED** | Integrated via PR #4 → `aafcbe3`; OD-108/122/01 remain open |
| ADR-026 | Phase 5-E License & Extension Shop commerce foundation | **PROPOSED** | Integrated at `897c7a9`; CI run `41193444454` owner-verified; FIRST_LICENSE semantics remain open |
| ADR-027 | Member quota policy and additive seat extension | **ACCEPTED — owner directive 2026-11-01** | Owner excluded from non-owner member-seat quota; numeric base quota deferred per tier; `TierQuota` retained; `seat_package` additive |

### ADR-027 scope

1. Exactly three license tiers: miniRider, maxRider, ISOrider.
2. Workspace owner is not counted as a non-owner member seat.
3. No numeric base member quota is currently selected; each tier may be decided independently later.
4. No numeric default may be invented.
5. `TierQuota` remains the generic future configuration mechanism.
6. Purchased `seat_package` capacity remains additive.
7. Package size, price, stacking, renewal/expiry and runtime enforcement are separate decisions.
8. Historical Phase 5-B migration remains immutable; the undeclared miniRider=5 seed is corrected only by forward migration `20261101220000_reconcile_deferred_member_quota`.
9. OD-05 remains open for eventual numeric quota and detailed enforcement semantics.

**Phase 5 status:** `DONE` (closed 2026-10-31). ADR-024/025/026 remain PROPOSED. ADR-027 is ACCEPTED only for the quota policy; it does not ratify the other Phase 5 ADRs.

## 4. Candidate ADRs — no IDs assigned

The following candidates remain unregistered and must not be given invented IDs: identifier standard; Public Store license-holding derivation; event lifecycle final states; hiRider opening/application lifecycle; Equipment Store order/fulfillment; abuse/moderation finalization; policy-layer versioning; authorization reason-code ownership/versioning; closed-event read-only rule; platform administrator governance; extension stacking semantics; catalog availability parameters; effective-access snapshot retention.

## 5. Maintenance rules

1. Next free ADR: **ADR-028**.
2. New ADRs must contain context/problem/options/decision/consequences/status/evidence/dependencies.
3. Owner-resolved ODs are closed in `OPEN_DECISIONS.md` and mapped to an ADR without renumbering IDs.
4. Status changes are dated and recorded in the ADR itself.
5. Every phase gate re-checks ADR status and cited ODs/requirements.
6. Superseded content is marked, never silently deleted.

## 6. Canonical invariants

- Exactly three license tiers: **miniRider / maxRider / ISOrider**.
- `hiRider`, `taskRider`, and `siteRider` are not license tiers.
- `totalRider` is retired; only narrow historical/negative-guard references may remain.
- No numeric member quota is current policy until explicitly decided by owner.
- No commercial price/payment/stacking semantics are implied by ADR-027.
