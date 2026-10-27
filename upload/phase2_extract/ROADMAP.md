# ROADMAP — epicRider

## Status rule

`NOT STARTED` = no evidence of work.
`IN PROGRESS` = partial evidence.
`PARTIAL` = work/evidence incomplete.
`BLOCKED` = specific scope cannot proceed because a dependency is required.
`DONE` = all phase acceptance criteria are evidenced.

## Phase state

| Phase | Name | Status |
|---|---|---|
| 0 | Audit repository & control baseline | DONE — existing evidence |
| 1 | Discovery/personas/use cases/requirements/acceptance | DONE/BASELINE — existing Phase 1 artifacts; revalidated for Phase 2 |
| 2 | Architecture/domain model/threat model/data model/ADR | IN PROGRESS when Z.ai begins implementation |
| 3–26 | Subsequent roadmap | NOT STARTED unless evidence says otherwise |

## Phase 2 entry correction

The following are NOT full Phase 2 blockers:
- OD-02 mobile strategy;
- OD-03 WhatsApp vendor;
- OD-05 owner seat semantics;
- OD-06 billing;
- OD-09 legal validation;
- OD-116 DATA_MODEL_CONCEPT.

OD-01 production database may constrain the final physical database decision, but it does not block logical architecture/data modeling.

## Phase 2 dependencies

| Dependency | Phase 2 impact | Rule |
|---|---|---|
| OD-01 database | PARTIAL | logical model proceeds; final physical DB may remain open |
| OD-02 mobile | NON-BLOCKING | client-neutral API/domain contracts required |
| OD-03 WhatsApp | NON-BLOCKING | provider abstraction required |
| OD-05 owner seat | NON-BLOCKING | model seat concept; defer final counting rule |
| OD-06 billing | NON-BLOCKING | model commercial states/catalog abstractions; defer charging |
| OD-09 legal | NON-BLOCKING | record obligations/uncertainty; no legal claims |
| OD-116 data model concept | PHASE 2 WORK | must be produced/refined in Phase 2 |
| OD-160 ISO verification | NON-BLOCKING for generic architecture | IMS mapping may remain provisional |

## Phase 2 completion

Phase 2 completion is determined by `PHASE_2_ACCEPTANCE.md`, not by the existence of files alone.
