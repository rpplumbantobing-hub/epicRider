# AGENTS — epicRider

Aturan kerja wajib untuk seluruh agent yang bekerja di repository epicRider. Aturan ini project-specific dan melengkapi — bukan menggantikan — `MASTER_CONTROL.md`, `ROADMAP.md`, dan `ADR_REGISTER.md`.

## 1. License tiers — closed set (MC §2.1; ADR-023)

- epicRider license tiers are exactly **miniRider, maxRider, ISOrider** (codes `MINI_RIDER`, `MAX_RIDER`, `ISO_RIDER`). This is a closed set of exactly three tiers.
- `totalRider` is retired and is NOT an epicRider product, tier, license, extension, entitlement, schema, seed, enum, test subject, roadmap item, or requirement. Never introduce it as a product or functional concept in code, schema, migration, seed, tests, docs, roadmap, comments, UI, API, or data.
- Existing explicit negative-guards and historical audit statements whose sole purpose is to prove its absence may remain where needed for regression/governance integrity. Do not add ordinary product references or new mentions beyond such narrowly scoped guards.
- `hiRider`, `taskRider`, and `siteRider` are **NOT** license tiers. `hiRider` is the recruitment/candidate/workspace portal and crew capability; `taskRider` and `siteRider` are extensions/capabilities, not license tiers.

## 2. Terminology hygiene

- Do not import terminology from unrelated project planning into epicRider.
- When encountering unknown product terminology, **STOP** and verify against `MASTER_CONTROL.md`, `DATA_MODEL_CONCEPT.md`, and `ADR_REGISTER.md` before using or adding it anywhere.
- If authoritative controls conflict, do not silently choose one: record the conflict and reconcile the controlling documents before implementation.

## 3. Git authority and safe execution

- The owner explicitly authorizes ChatGPT agents working on epicRider to perform normal Git operations independently, including creating and switching branches, committing, pushing, opening/updating PRs, and merging PRs. The former OWNER-only restriction on these operations is revoked.
- Agents must use a dedicated task branch, preserve the canonical history, and never make unrelated changes. Before writing, verify repository identity, target branch, current base SHA, working-tree/change scope where available, and whether an equivalent PR or change already exists.
- Agents may merge their own PRs when the PR is mergeable, required CI/status checks have passed, there are no unresolved blocking review requests or conflicts, and the diff has been reviewed against the task scope. Use the repository's permitted merge method and verify the resulting base-branch commit and post-merge CI.
- **Explicit additional approval is still required** before force-pushing, rewriting published history, using destructive `reset --hard` or `clean -fd`, deleting remote branches/tags, deleting repository data, or bypassing branch protection / required checks. Never use these as a shortcut to resolve conflicts.
- If GitHub permissions, branch protection, required human review, or unavailable checks prevent a safe merge, stop at the PR and report the exact blocker; do not bypass controls.
- Report every Git write with repository, branch, commit/PR identifiers, changed-file scope, checks, and final outcome. Never claim a write, merge, or CI success until the host confirms it.

## 4. Governance invariants (quick reference)

- Status taxonomy and phase rules: `MASTER_CONTROL.md` §10–§11. `ROADMAP.md` is the single source of phase status; `PHASE_STATUS.md` is only a summary.
- Commerce experience (checkout UI, payment, pricing, gateways) belongs to **Phase 22** per ADR-018 — never pull it forward into foundation phases.
- Do not close open decisions (OD) or ratify ADRs without explicit owner authority.
