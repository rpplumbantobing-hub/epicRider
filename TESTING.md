# TESTING — epicRider

## Canonical statuses

Evidence:
`VERIFIED`, `PARTIAL`, `NOT FOUND`, `NOT TESTED`, `BLOCKED`, `PROPOSED`, `UNKNOWN / NEEDS DECISION`.

## Current Phase 0 evidence (historical, 2026-10-27)

- no application test framework;
- no application test suite;
- lint verified;
- dev smoke verified;
- production build not run;
- security scan not run;
- accessibility not tested.

## Current testing status (re-verified 2026-10-28, pre-Phase 4 reconciliation)

- Test framework: **vitest** (installed Phase 3, ADR-019/ADR-020 context) — unit + component suites exist.
- Gates: `bun run lint` (eslint) exit 0; `bun run typecheck` (tsc --noEmit) exit 0; `bun run test` (vitest run) exit 0 — 25/25 tests on the Phase 3 baseline (unit 15 + component 10).
- Production build: **NOT RUN** in the sandbox (platform policy protects the dev server); `bun run build` script exists and is wired into CI.
- CI workflow (`.github/workflows/ci.yml`): configured (install → lint → typecheck → test → build) but **never executed on a runner** (no git remote) — NOT TESTED.
- E2E framework: NOT FOUND (no Playwright etc.); route `/` smoke was performed manually via agent-browser (evidence in `audit/evidence/`).
- Security/tenant-isolation negative tests: Phase 4+ scope — NOT FOUND today.
- No test result may be claimed beyond these recorded commands.

**Update current status (2026-10-28, Phase 4 — implementasi worktree baseline `b5defc22`):**
suite bertambah menjadi **13 file / 113 test (semua PASS)** — 25 regresi Phase 3 + **88 test Phase 4**
(koreksi R2 2026-10-29: + 12 test HTTP routing `tests/integration/http-routing.test.ts`):
unit (policy matrix otorisasi, rate limiter, auth-config/no-auto-link, OTP domain, UA) dan integration
database SQLite terisolasi per-file (dibuat via `prisma migrate deploy` dari migrasi terversionisasi —
`tests/integration/test-db.ts`): workspace+owner transaksi, lifecycle membership, **matriks isolasi tenant
negatif** (lintas-tenant read/write/invite denied + audited; suspended/removed efektif seketika), **undangan**
(replay/expired/revoked/wrong-recipient/already-member/role-bound), **sesi** (revoke→ditolak berikutnya,
expired, perangkat, object-level), **OTP** (sekali-pakai, replay, lockout, rate-limit, audit tanpa kode),
**HTTP routing** (12 test real-HTTP pada server Next.js port terisolasi, DB SQLite disposable:
auth 401 problem-details, workspace/membership lifecycle, dynamic member route
`/api/v1/workspaces/[workspaceId]/members/[membershipId]` PATCH via HTTP, tenant isolation
404/403, invitation lifecycle + anti-replay, session revoke efektif; PASS mode dev + produksi).
Gates: lint 0 / typecheck 0 / test 113/113 (Bun 1.3.14, working copy terisolasi; koreksi R2). Build: era R0
NOT RUN (larangan platform); R2: production build exit 0 pada working copy terisolasi. Remote CI Phase 4 = PENDING (menunggu integrasi owner). Negative security tests
"Phase 4+ scope" di atas kini TERSEDIA. E2E browser manual tetap via agent-browser (11 screenshot
`audit/evidence/phase4/`). Bukti: `PHASE_4_REPORT.md` §4.

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
