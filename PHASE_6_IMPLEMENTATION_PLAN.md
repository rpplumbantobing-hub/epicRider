# PHASE 6 IMPLEMENTATION PLAN — epicRider

**Baseline:** `bec9911862470796354e3175486b36d1b9d4a75e`  
**Gate:** `PHASE_6_ENTRY_GATE.md` — PASS WITH LIMITATIONS  
**Acceptance:** `PHASE_6_ACCEPTANCE.md`  
**Status:** Authorized to start after gate-pack verification; implementation not yet evidenced.

## Workstream 6-A — Isolated preflight and current-state confirmation

1. Confirm the z.ai workspace is based on canonical main `bec9911862470796354e3175486b36d1b9d4a75e`; if it is not, stop and report actual HEAD and diff.
2. Inspect current route map, schema, migration lock/provider, authorization guards, role presets, audit service, i18n dictionaries, workspace membership services and tests.
3. Confirm no Event/EventAssignment implementation has appeared since the baseline. If code has changed, re-run the scope and dependency review before continuing.
4. Create an isolated working copy/branch in the z.ai workspace. Do not write to GitHub, push, create a PR or merge.

**Exit:** preflight inventory and exact baseline recorded; no unrelated changes.

## Workstream 6-B — Domain and persistence foundation

1. Implement workspace-owned Event and EventAssignment models from `DATA_MODEL_CONCEPT.md` §3.4 and UC-2002. Reject past start dates and end-before-start ranges; do not invent a workspace timezone.
2. Preserve `User != Membership != Role != Event Assignment`.
3. Enforce same-workspace relationships and duplicate assignment protection at the database layer where Prisma supports it, with service validation as a second layer.
4. Use only provisional Event `DRAFT` and assignment `ASSIGNED/REVOKED` subset. No other lifecycle transitions.
5. Create additive migration(s) only. Review generated SQL before applying. Use isolated test DB and `prisma migrate deploy`; never `db push`, `migrate reset`, `--accept-data-loss`, or edit historical migrations.
6. Do not choose production database (OD-01); current SQLite is development/test only.

**Exit:** schema validates/generates; migration applies to clean isolated DB and representative Phase 4/5 data; rollback/forward-recovery limitations documented.

## Workstream 6-C — Services, authorization and API

1. Add event/assignment domain services following existing workspace service conventions.
2. Add only exact permission strings already defined in `AUTHORIZATION_MODEL.md` §4.4; do not invent permission names.
3. Use existing owner/member roles only. Mark the minimum binding PROPOSED; no event-manager/custom roles.
4. Owner may create/read workspace events and manage assignments. Non-owner member may read only assigned events. Every event read re-checks active membership + assignment server-side.
5. Workspace context must come from route path and trusted DB lookups. Cross-workspace IDs fail closed.
6. Use RFC 9457-style `toProblemResponse`, safe 401/403/404 behavior, and `logAudit`. Audit create/assignment/revoke and denied attempts.
7. Address D-2 idempotency for resource creation explicitly. Do not invent TTL/retention or a new global framework. If no safe implementation can meet the proposed contract without a new owner decision, block only the affected mutation and record the exact reason.
8. Do not add event lifecycle transitions, schedule conflict rules, offline sync or commercial logic.

**Exit:** HTTP/integration tests prove access matrix, tenant isolation, replay behavior or a truthful blocker, and audit trail.

## Workstream 6-D — Workspace Home, Event UI and core navigation

1. Keep public root `/` Showcase intact. Build workspace Home under a workspace-scoped route.
2. Provide Home/Event/Asset/Team/Profile navigation with one canonical location per screen. Reuse existing Team/membership and Profile/account routes; keep legacy URLs working.
3. Asset page is an explicit Phase 8 unavailable state, not fake CRUD or sample data.
4. Event list/create/detail screens use server-authorized data. Member sees only assigned events; owner sees the workspace event list.
5. Show current event context and a safe switcher for multi-assigned members. Switching revalidates on the server.
6. Dashboard shows only actual event/membership data. Do not fabricate tasks/assets. Do not invent quota numbers. License summary only if a safe permissioned data path exists.
7. Complete loading/empty/error/retry/success/permission-denied/stale states as applicable. Do not claim offline support.
8. ID default + EN parity; responsive desktop/tablet/mobile web; accessibility checks and task-based usability evidence reported honestly.

**Exit:** UI tests and manual task walkthroughs; screenshots at target breakpoints; no dead controls or misleading metrics.

## Workstream 6-E — Regression and quality gates

Run and record exact exit codes for:

```bash
bun install --frozen-lockfile
bun run lint
bun run typecheck
bun run test
bunx prisma validate
bunx prisma generate
# Apply reviewed migrations only to isolated test DB:
bunx prisma migrate deploy
bun run build
```

Also run targeted integration tests for:
- owner creates and reads workspace events;
- member with assignment reads event;
- member without assignment is denied;
- cross-workspace event/assignment/member IDs are denied;
- suspended/removed/left member loses access immediately;
- owner assigns and revokes membership assignment;
- revoked assignment no longer grants access;
- multi-assignment context switch cannot expose previous/other event;
- duplicate assignment is prevented;
- audit records success and denial without secrets;
- Phase 4 and Phase 5 regression suite remains green.

**Exit:** all in-scope gates pass, or every failure is reported as BLOCKED/FAIL with exact logs; no green-by-assumption.

## Workstream 6-F — Candidate packaging and handoff

1. Update `PHASE_6_TRACEABILITY.md` with actual file/test/evidence references.
2. Produce `PHASE_6_REPORT.md` and update `PHASE_6_ACCEPTANCE.md` with PASS/FAIL/BLOCKED/NOT TESTED per criterion.
3. Update `ROADMAP.md`, `PHASE_STATUS.md`, and `HANDOFF.md` consistently; do not mark Phase 6 DONE prematurely.
4. Package only source, migrations, tests and required governance evidence. Exclude `.env`, local databases, secrets, personal data, node_modules, .next, logs and caches.
5. Produce ZIP + manifest + SHA-256 sidecar and verify archive CRC and all manifest checksums.
6. Return the candidate and evidence to ChatGPT for independent audit and GitHub PR workflow. z.ai must not commit/push/open PR/merge.

## Global stop rules

- No force push, history rewrite, branch/tag deletion, destructive reset or destructive migration.
- No changes to Phase 4/5 behavior except additive integration required by this phase and covered by regression tests.
- No edits to existing ADR/OD statuses without owner decision.
- No new ADR/OD/REQ ID invention.
- If a decision-dependent sub-scope is blocked, document it and continue only independent work.
