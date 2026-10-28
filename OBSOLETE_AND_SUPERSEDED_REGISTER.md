# OBSOLETE AND SUPERSEDED REGISTER — epicRider

**Revision:** 2026-10-28  
**Purpose:** prevent old prompts, duplicate controls, stale scope statements and unsupported PASS/DONE claims from remaining active authority.

## 1. Control rule

This register classifies obsolete content. It does **not** authorize deletion of historical evidence, Git history, previous prompts or original requirement/decision IDs. Where an item is historical, retain it and label/reference the canonical replacement. Where a file is duplicated, only one current file may govern.

## 2. Obsolete or superseded control content

| Item/content | Disposition | Canonical replacement / action |
|---|---|---|
| Duplicate root controls such as `MASTER_CONTROL(1).md`, `ARCHITECTURE(1).md`, `DECISIONS(1).md`, `SECURITY(1).md`, `TESTING(1).md` | **Superseded as active authority**; preserve historical copies if needed | Use only the active files listed in `CONTROL_BASELINE_REGISTER.md`. Add a historical header or move to the repository's archive location; do not silently delete history. |
| Old Phase 0–3 Z.ai prompts | **Historical instructions** | Use `ZAI_CONTROL_UPDATE_PROMPT.md` for this controlled reconciliation. Older prompts must not override current controls. |
| Old Master Control numeric references such as `MC §N` | **Potentially stale references** | Resolve through `CONTROL_REFERENCE_CROSSWALK.md`; active documents should reference file names and named headings. Preserve immutable reports and append a cross-reference rather than rewriting historical evidence. |
| A fourth license tier or any rule describing `hiRider` as a license/tier | **Prohibited / obsolete model** | Exactly three tiers: `miniRider`, `maxRider`, `ISOrider`. hiRider is a portal/capability. |
| Treating hiRider service offerings as an unresolved scope question (`OD-185` OPEN) | **Superseded** by owner-supplied Complete baseline and ADR-021 | Service offerings are in hiRider scope. Detailed lifecycle, visibility, inquiry/contact, commercial terms and tests remain to be designed/approved where applicable. |
| Treating `ServiceOffer` and `RecruitmentOpening` as the same object | **Prohibited model** | Preserve distinct data objects, permissions, lifecycle, API boundaries and tests. |
| A two-store/two-commerce-surface model | **Superseded** | Use three distinct surfaces: License & Extension Shop, Public Store, Developer Equipment Store. Active `REQ-030` has been amended without renumbering. |
| Requiring a pre-existing miniRider license to buy a user's first license | **Prohibited checkout rule** | Initial license purchase belongs to License & Extension Shop and must not require existing miniRider entitlement. Public Store and Developer Equipment Store retain their own access policies. |
| Claiming Public Store or Developer Equipment Store are the same domain as License & Extension Shop | **Prohibited conflation** | Keep catalogs/order flows, entitlement issuance, authorization policies, audit records and tests separate. See `LICENSE_MATRIX.md`. |
| Treating OD-02, OD-03, OD-05 or OD-06 as whole-phase blockers | **Superseded dependency interpretation** | Apply the scoped impact in `DECISIONS.md` and `PHASE_2_DEPENDENCY_MATRIX.md` where that file exists in the repository. Only dependent sub-scopes are blocked. |
| Treating OD-116 as a prerequisite before Phase 2 | **Superseded** | `DATA_MODEL_CONCEPT.md` is a Phase 2 workstream/output, not an entry prerequisite. Preserve OD-116 as history. |
| Treating ISO 9001:2026, ISO 14001:2026 or ISO 19011:2026 as unknown/unpublished based on old snapshots | **Obsolete as of catalogue check 2026-10-28** | Use `STANDARD_REGISTER.md` for the latest recorded check. Recheck the official catalogue before any future mapping; publication metadata alone does not approve applicability, mapping or conformity claims. |
| Phase status stated as `DONE` in an old report while current evidence gates are incomplete | **Historical claim only; not current status authority** | `ROADMAP.md` is the sole source of current status. Current control revision sets Phase 2 and Phase 3 to `PARTIAL`, and Phase 4 to `BLOCKED / NOT STARTED`. |
| `PHASE_STATUS.md` used as an independent or competing status source | **Superseded authority** | Maintain it only as a summary that mirrors `ROADMAP.md`. |
| `build PASS`, `CI PASS`, `0 active contradictions`, or complete requirement counts without reproducible commands, scope and output | **Unverified claim until evidence is regenerated** | Record exact commit/snapshot, command/script, exit code, output path, exclusions and manual semantic review. Do not inherit old results. |
| `.env` tracked or copied into archives; `.env.example` claimed to exist without verifying the working tree | **Security defect / stale assertion** | Recheck the actual repository, untrack secret files without deleting local files, add placeholder-only `.env.example`, run working-tree/history secret scan, and rotate exposed real credentials as needed. Never copy secret values to evidence. |
| Requirement baseline reset to an older 46-item seed set or requirement IDs renumbered | **Prohibited regression** | Preserve REQ-001..REQ-100. The current active revision appends REQ-101 for hiRider service offerings; do not duplicate or recycle IDs. |

## 3. Evidence files that remain historical

The Phase 2 and Phase 3 consistency audit reports bundled in `audit/` are retained as evidence of why this revision exists. Their findings should be dispositioned against the final target repository; they are not proof that a remediation has already been executed. Older phase reports, screenshots, logs and prompts remain historical unless their source commit and scope are explicitly revalidated.

## 4. Retirement procedure

Before retiring a control file:

1. Identify its current dependents and references.
2. Map it to a canonical source in `CONTROL_BASELINE_REGISTER.md` or `CONTROL_REFERENCE_CROSSWALK.md`.
3. Mark it `SUPERSEDED / HISTORICAL` with date and replacement path, or move it to the agreed archive location while retaining history.
4. Rerun link/reference, requirement-ID and semantic contradiction scans.
5. Record disposition in the change log / handoff. Never delete or recycle REQ/OD/ADR IDs.
