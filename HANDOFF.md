# HANDOFF — epicRider

**Diperbarui:** 2026-11-24 — R1E governance snapshot imported and post-merge status reconciled.

## 1. Status fase

| Fase | Status | Bukti primer |
|---|---|---|
| 0 | DONE | `PHASE_0_ACCEPTANCE.md`, `03293b6` |
| 1 | DONE — BASELINE | `PHASE_1_REPORT.md`, `938932f` |
| 2 | PARTIAL | `PHASE_2_ACCEPTANCE.md`; CI/build evidence now verified; owner ratification and OD-01/OD-02 remain outstanding |
| 3 | DONE — 2026-11-24 | `PHASE_3_ACCEPTANCE.md` reassessment; CI #66; 354/354 tests; build passed |
| 4 | DONE | PR #1 merge `a1af59d8e00d3a0d8e28b25f1a7f05961182a6a0`; CI `40928261468` |
| 5 | DONE | `PHASE_5_CLOSURE_REPORT.md`; 5-E `897c7a9`; CI `41193444454`; 361/361 re-run |
| 6 | NOT STARTED | Await explicit owner authorization |

## 2. Governing decisions

- Exactly three license tiers: miniRider, maxRider, ISOrider.
- hiRider is a capability/marketplace boundary, not a license tier. taskRider/siteRider are extensions/capabilities, not tiers.
- `totalRider` is retired and must not be reintroduced as a product/tier/enum/seed/behavior. Narrow historical/negative-guard references may remain.
- **ADR-027 (2026-11-01):** owner is not counted as a non-owner member seat; numeric base quotas are deferred independently per tier; no numeric default may be invented; `TierQuota` remains; `seat_package` remains additive.
- ADR-023 is superseded only for its historical fixed member-quota value/policy portion; its broader Phase 5-B licensing foundation remains historical/implemented.

## 3. Open / non-blocking decisions

OD-01, OD-02, OD-03, OD-05, OD-06, OD-108, OD-115, OD-122 and other registered ODs remain governed by `OPEN_DECISIONS.md`. ADR-024/025/026 remain PROPOSED. ADR-027 does not choose quota numbers, pricing, stacking, renewal/expiry or runtime enforcement semantics.

## 4. Next actions

1. Do not start Phase 6 automatically; obtain explicit owner authorization.
2. When quota numbers are later decided, record them as an explicit owner decision and update the relevant tier configuration without rewriting historical migrations.
3. Keep `ADR_REGISTER.md`, `ROADMAP.md`, `PHASE_STATUS.md`, `MASTER_CONTROL.md` and `LICENSE_MATRIX.md` synchronized at each governance gate.
4. Treat `PHASE_5_CLOSURE_REPORT.md` as closure evidence; its 2026-11-01 addendum records ADR-027.


## 5. 2026-11-24 — R1E transfer and canonical repository sync

- R1E final transfer snapshot was merged into canonical `main` through [PR #8](https://github.com/rpplumbantobing-hub/epicRider/pull/8).
- Merge commit: `f8395ed90484cd318f87aef2e0d13fd66c71a9df`. The import contains 18 governance documents plus `SNAPSHOT_REPORT.md`, `MANIFEST.txt` and `SHA256SUMS.txt` (21 files total).
- PR #8 was documentation-only; no application source/runtime files were changed. PR CI run #62 completed successfully (lint, typecheck, test and build checks).
- The R1E archive integrity was independently checked before import: ZIP SHA-256 matched the sidecar, ZIP CRC was clean, and all 20 internal checksums matched.
- This synchronization records the import; it does not change any product decision, ADR status, open-decision status or phase acceptance.
- Phase 4 and Phase 5 remain DONE/CLOSED. Phase 6 remains NOT STARTED and must not begin without explicit owner authorization.
- PR #7 (`governance/zai-handoff-20261101`) remains OPEN and separate; this synchronization does not merge, close or modify it.

The imported R1E snapshot is a governance evidence package. It is not a new implementation report and does not itself authorize Phase 6.


## 6. Operational boundaries and contracts

- License tiers are exactly `miniRider`, `maxRider` and `ISOrider`; `totalRider` is retired.
- `hiRider` is a marketplace/recruitment capability, not a license tier. `taskRider` and `siteRider` are capabilities/extensions, not tiers.
- The workspace owner is excluded from the non-owner member-seat quota. Numeric base quotas remain TBD independently per tier; TBD does not mean unlimited. `TierQuota` remains generic; `seat_package` remains additive. No package size, price or stacking rule is invented.
- Authorization and entitlement are enforced server-side. Identity, workspace membership, role/permission, event assignment and resource authorization remain distinct.
- License & Extension Shop, Public Store and Developer Equipment Store are separate commerce surfaces with separate access policies.
- Target-state rules are in `MASTER_CONTROL.md`; product capability and tier boundaries are in `LICENSE_MATRIX.md`; detailed contracts are in `ARCHITECTURE.md`, `API_ARCHITECTURE.md`, `AUTHORIZATION_MODEL.md` and `ENTITLEMENT_MODEL.md`.

## 7. Current gaps and owner decisions

- Phase 2 remains PARTIAL: owner ratification/amendment of proposed Phase 2 ADRs and owner decisions OD-01/OD-02 remain outstanding. The CI/build evidence gap is now resolved.
- OD-05 remains partially decided under ADR-027: owner exclusion is decided; numeric base quota per tier and remaining seat-counting/enforcement semantics remain open. OD-06 (commercial values), OD-108 (expiry/grace/renewal), OD-123 (workspace count), OD-137 (storage) remain scoped open decisions.
- ISO catalogue verification remains BLOCKED under F0-012/OD-160; this does not imply ISO conformity or certification.
- Phase 3 is DONE/CLOSED; Phase 4 and Phase 5 are DONE/CLOSED; Phase 6 is NOT STARTED. No later phase starts automatically.

## 8. Reproducible verification

The canonical workflow is `.github/workflows/ci.yml` and runs:

```bash
bun install --frozen-lockfile
bun run lint
bun run typecheck
bun run test
bun run build
```

Latest verified full workflow evidence for the current source/runtime tree:
- [CI run #65 — push](https://github.com/rpplumbantobing-hub/epicRider/actions/runs/45323584581) — success.
- [CI run #66 — pull request](https://github.com/rpplumbantobing-hub/epicRider/actions/runs/45323612054) — success.
- Tested commit: `fa144a0a5bbfe8275f0eb00cc8329217a0d2c354`; test suite: 30 files / 354 tests passed; production build compiled and generated 15/15 static pages.
- Current `main` has no file-content delta from that tested head. These checks validate the current repository quality baseline; they do not prove future Phase 6 behavior, production database readiness or production deployment.

## 9. Security, secrets and safe execution

- Never commit or paste `.env`, credentials, access tokens, private keys, production data or secret-bearing logs. Keep real values local; `.env.example` contains placeholders only.
- Keep least-privilege access, tenant isolation, server-side authorization, auditability and controlled migrations as mandatory controls.
- Do not use force-push, history rewrite, destructive branch/tag deletion or data-loss commands as routine repair methods.
- Preserve append-only historical evidence. A newer status note supersedes a historical snapshot; it does not erase that snapshot.
- Before starting Phase 6, complete a Phase 6 entry/readiness review and obtain explicit owner authorization. No implementation work is authorized by this handoff update.
