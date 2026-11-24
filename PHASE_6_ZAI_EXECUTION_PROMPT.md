# Z.AI EXECUTION PROMPT — PHASE 6
## Home/dashboard & event foundation — epicRider

You are implementing Phase 6 of epicRider in the existing z.ai workspace. The owner has explicitly authorized Phase 6 after the Entry Gate and Acceptance Pack were prepared and verified.

### Canonical baseline — mandatory

- Repository: `rpplumbantobing-hub/epicRider`
- Canonical branch: `main`
- Required baseline commit: `bec9911862470796354e3175486b36d1b9d4a75e`
- Entry gate: `PHASE_6_ENTRY_GATE.md`
- Acceptance: `PHASE_6_ACCEPTANCE.md`
- Plan: `PHASE_6_IMPLEMENTATION_PLAN.md`
- Traceability: `PHASE_6_TRACEABILITY.md`
- Governing rules: `MASTER_CONTROL.md`, `ROADMAP.md`, `PHASE_STATUS.md`, `HANDOFF.md`

First verify the workspace HEAD and working tree. If the source baseline is not exactly the required commit or contains unreviewed changes, STOP and report the actual state. Do not silently rebase, reset, clean or overwrite the workspace.

### Absolute operating rules

1. Work only in an isolated workspace/worktree. **Do not write to GitHub**: no commit, push, branch creation, PR, merge, tag or release. ChatGPT handles GitHub operations after independent audit.
2. Do not force-push, rewrite history, delete branches/tags, reset shared work, or use destructive migration commands.
3. Never run `prisma db push`, `prisma migrate reset`, `--accept-data-loss`, or modify historical migration files. Review new additive SQL and apply only to isolated test databases using `prisma migrate deploy`.
4. Do not edit/ratify ADRs or ODs; do not invent REQ/ADR/OD IDs. Phase 2 remains PARTIAL.
5. Do not modify product taxonomy: only miniRider, maxRider, ISOrider are license tiers; totalRider remains retired; hiRider is not a tier; taskRider/siteRider are not tiers.
6. Preserve all Phase 4 identity/session/workspace/membership/invitation/security behavior and all Phase 5 licensing/entitlement/lifecycle/shop behavior. Extend additively and prove regression.
7. No secrets, real credentials, production data or private user data in code, logs, screenshots, archives or reports.

### Phase 6 scope

Implement only:
- Workspace-scoped Home/dashboard.
- Basic Event foundation: create, list and read event detail.
- EventAssignment foundation: owner assigns an existing ACTIVE workspace Membership; owner revokes assignment.
- Event context indicator and safe switcher for members with multiple assignments.
- Core navigation Home/Event/Asset/Team/Profile. Reuse current Team/membership and Profile/account functionality. Asset page is an honest unavailable state until Phase 8.
- Real-data dashboard summaries only.

Do NOT implement:
- Technical rider/templates (Phase 7).
- Asset CRUD/sets/lifecycle (Phase 8).
- Media kit (Phase 9).
- Chat/rundown/reports/notifications (Phase 10).
- CRM/finance, recruitment, store, IMS, mobile delivery or offline sync.

### Protected unresolved decisions — do not decide these

- OD-01 / ADR-006: production database remains OPEN. Current SQLite is local/test only.
- OD-02 / ADR-007: mobile/Windows delivery remains OPEN. Keep web/API client-neutral.
- OD-05: owner is excluded from non-owner seats under ADR-027; numeric base quota and remaining semantics remain OPEN. Never invent a quota.
- OD-07: offline-first remains OPEN. Do not claim offline support.
- OD-122: only current owner/member roles; no new event-manager/custom role.
- OD-130: overlapping crew assignment policy remains OPEN. Do not block, auto-resolve or label a conflict as decided.
- Event lifecycle: DMC §6.3 is PROPOSED; candidate C-3 has no registered ADR ID. Use only initial `DRAFT` state if required; no schedule/activate/complete/close/cancel/archive transitions.
- ADR-017 / API D-2 idempotency remains PROPOSED. Inspect existing runtime support. For resource-create endpoints, do not falsely claim replay safety. If safe idempotency needs an unapproved TTL/retention/global mechanism, stop that mutation and report exact blocker rather than inventing a decision.

### Domain and authorization invariants

- `User != Membership != Role != EventAssignment`.
- Event is owned by one Workspace.
- EventAssignment links Event ↔ ACTIVE Membership, never User ↔ Event.
- Owner is the only manager role in this bounded scope: owner may create/read workspace events and manage assignments.
- Non-owner member may read an event only while an ACTIVE assignment exists. Membership alone is insufficient.
- Event reads and context switches must re-resolve actor, workspace, membership and assignment from trusted DB state on every request.
- Tenant scope comes from `/api/v1/workspaces/{workspaceId}/...` path and is checked server-side. Never trust client-supplied workspace/event IDs without relationship checks.
- Cross-tenant and unassigned access must fail closed with the repository's safe 401/403/404 policy; audit denials.
- Reuse existing `requireSession`, `requireWorkspacePermission` patterns, pure policy, reason-code vocabulary, `toProblemResponse` and `logAudit`.
- Use only exact permission strings already present in `AUTHORIZATION_MODEL.md` §4.4. Do not create new permission codes.
- Do not create new roles. Mark any minimal owner/member binding PROPOSED and retain OD-122 OPEN.

### Event and assignment minimal behavior

- Event fields must follow DMC §3.4 and UC-2002: required name, schedule start/end and location as appropriate; reject a past start date and end-before-start range per UC-2002. Preserve explicit timezone information; do not invent a workspace timezone. Do not add commercial, rider, media-kit, asset or chat fields.
- New event starts in `DRAFT`; no lifecycle transitions are exposed.
- Assignment may be represented only as `ASSIGNED` or `REVOKED`; no OFFERED/DECLINED/COMPLETED state machine.
- Prevent duplicate active assignment for the same Event/Membership pair at the database boundary where supported.
- Do not implement overlap checks or conflict resolution under OD-130.
- Do not delete Events or erase assignment history. Revocation must be auditable.
- If a requirement conflicts with these constraints, stop the affected sub-scope and report; do not reinterpret the gate.

### Home/dashboard truthfulness

- Keep public root `/` Showcase intact; workspace Home must be a separate workspace-scoped route.
- Use only real server-side tenant-scoped data. No seeded/demo/mock events, tasks, assets or charts.
- Tasks are Phase 10; asset data is Phase 8. Do not show fake counts.
- Quota values remain TBD; show no invented numeric limit. If useful, show current active member count and clearly label quota as not yet determined.
- Show license/tier only if a safe authorized server-side read path exists. Otherwise omit or render an honest unavailable state.
- Preserve existing workspace list, membership/team and account/profile routes. Avoid breaking legacy URLs.

### UX and quality

- Indonesian default and English parity using existing i18n dictionaries; no hard-coded UI copy.
- Responsive browser UI at 360–430, 768–1024 and >=1280 widths; touch targets target >=44x44 px.
- Complete relevant loading, empty, error/retry, success, permission-denied and stale states.
- Keyboard/focus/labels/headings/error association must be checked. Do not claim full WCAG 2.2 AA unless a complete audit is performed.
- Do not claim offline mode or native mobile readiness.
- No dead buttons, fake charts or placeholders disguised as working features.

### Required work sequence

**Stage 1 — Preflight**
- Verify exact HEAD, clean status, tree and existing app routes.
- Inspect relevant docs and existing patterns again; report any drift from the baseline.
- Inventory all intended files and migration impacts before coding.
- If any conflict with the gate is found, stop and report before changing files.

**Stage 2 — Design and migration**
- Write a concise design note for Event/EventAssignment schema and API boundary.
- Add only additive schema/migration changes.
- Review migration SQL; test clean DB and representative existing Phase 4/5 data.
- Do not commit or push.

**Stage 3 — Services/API/security**
- Implement domain services and workspace-scoped API.
- Enforce assignment on every non-owner event read.
- Test tenant IDOR, membership state, assignment missing/revoked, duplicate assignment and audit.
- Address idempotency explicitly per the protected rule above.

**Stage 4 — UI**
- Implement workspace Home, Event list/create/detail, context switcher and five-item navigation shell.
- Reuse Team/Profile routes; Asset is an explicit Phase 8 unavailable page.
- Keep public landing unchanged.
- Verify ID/EN and all relevant UI states at target breakpoints.

**Stage 5 — Regression and quality**
Run exact commands and record exit codes:
```bash
bun install --frozen-lockfile
bun run lint
bun run typecheck
bun run test
bunx prisma validate
bunx prisma generate
# migrate deploy only against an isolated test DB after reviewing SQL
bunx prisma migrate deploy
bun run build
```
Run full Phase 4/5 regression and targeted Phase 6 tests. No skipped/focused tests, no unexplained warnings, no hidden failures.

**Stage 6 — Evidence and packaging**
- Update `PHASE_6_TRACEABILITY.md` with actual source/test paths.
- Update `PHASE_6_ACCEPTANCE.md` per criterion: PASS/FAIL/BLOCKED/NOT TESTED.
- Produce `PHASE_6_REPORT.md`, a complete `HANDOFF.md` update, and exact limitations.
- Update roadmap/status only to the evidence-supported state; do not mark Phase 6 DONE without all gates.
- Create a candidate ZIP, manifest and SHA-256 sidecar. Verify CRC and every checksum.
- Exclude secrets, .env, local databases, node_modules, .next, caches, logs and private data.

### Required final response from z.ai

Return:
1. exact baseline HEAD and final working HEAD;
2. list of changed/new files and concise diff summary;
3. schema/migration review and migration test evidence;
4. authorization matrix results including negative tests;
5. idempotency result or exact blocker;
6. UI screenshots and responsive/i18n/a11y checks;
7. exact lint/typecheck/test/Prisma/build commands and exit codes;
8. Phase 4/5 regression result;
9. acceptance table with PASS/FAIL/BLOCKED/NOT TESTED;
10. known limitations and open decisions preserved;
11. ZIP link/path, archive size, SHA-256, manifest and checksum verification;
12. confirmation that no GitHub write was performed.

**Do not claim Phase 6 DONE merely because the app builds.** Deliver a reviewable candidate for independent ChatGPT audit and GitHub integration.
