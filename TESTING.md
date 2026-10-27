# TESTING — epicRider

## Canonical statuses

Evidence:
`VERIFIED`, `PARTIAL`, `NOT FOUND`, `NOT TESTED`, `BLOCKED`, `PROPOSED`, `UNKNOWN / NEEDS DECISION`.

## Current Phase 0 evidence

- no application test framework;
- no application test suite;
- lint verified;
- dev smoke verified;
- production build not run;
- security scan not run;
- accessibility not tested.

## Phase 2 testing purpose

Phase 2 is primarily architecture/documentation/evidence work.

Required checks:
1. terminology consistency;
2. requirement traceability;
3. architecture consistency;
4. domain invariants;
5. threat-model coverage;
6. authorization matrix completeness;
7. entitlement matrix completeness;
8. API boundary consistency;
9. dependency/ADR consistency;
10. contradiction search across control files.

## Mandatory domain invariants to test/review

### Identity
`User != Membership != Role != Event Assignment`

### hiRider
`Application != Membership`
`Application != Event Assignment`
`Acceptance != Automatic Workspace Access`

### License
`hiRider != LicenseTier`

### Store
`Public Store access requires basic miniRider license`
`Developer Equipment Store = miniRider only`

### Authorization
No capability is protected only by frontend/UI visibility.

## Typo correction

Previous `CRUP lintas-tenant ditolak` is corrected to:
`CRUD lintas-tenant ditolak`.

## Phase 2 evidence

Each check records:
- ID;
- source;
- expected;
- actual;
- result;
- evidence path;
- limitations.

No test may be claimed as executed unless it actually was.
