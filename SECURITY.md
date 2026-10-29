# SECURITY — epicRider

## Current state (re-verified 2026-10-28, pre-Phase 4 reconciliation)

Phase 0 evidence (2026-10-27, historical — see `PHASE_0_AUDIT_REPORT.md`) showed: no implemented authentication; no authorization/tenant isolation/entitlement; `next-auth` dependency without implementation; `ignoreBuildErrors: true` as a tracked quality risk; no application security test suite; no CI/dependency scanning/SAST evidence.

Re-verified current state as of 2026-10-28 (per `PHASE_3_CURRENT_STATE_AUDIT.md`, `PHASE_3_REMEDIATION_REPORT.md`, ADR-019, `HANDOFF.md` §7):

- **Authentication:** still NOT implemented (`next-auth` v4 present, no auth route/runtime). Target design: MC-V4 §5 (WhatsApp proof-of-control + Google OIDC), ADR-008/ADR-009.
- **Authorization / tenant isolation / entitlement runtime:** still NOT implemented (documentation/model only — `AUTHORIZATION_MODEL.md`, `ENTITLEMENT_MODEL.md`, `THREAT_MODEL.md` all PROPOSED).
- **`ignoreBuildErrors`:** **REMOVED from `next.config.ts` (ADR-019, ACCEPTED 2026-10-28)**; `reactStrictMode: true`; `typecheck` (tsc --noEmit) gate added — do not restate the Phase 0 configuration as current.
- **Quality gates:** `lint`, `typecheck`, `test` scripts exist and exit 0 on the Phase 3 baseline (25/25 tests). Production build NOT RUN in the sandbox (platform policy); CI workflow (`.github/workflows/ci.yml`) exists but has never executed on a remote runner (no git remote) — NOT TESTED.
- **Secrets hygiene:** `.env` is NOT tracked by Git (removed from index 2026-10-28, remediation F-05; local file preserved; contents = local SQLite path, no service credentials, no rotation required); `.env.example` (placeholders only) IS tracked; working-tree secret scan executed with no findings on tracked files (evidence: `audit/phase3-remediation/`). `db/custom.db` remains tracked (scaffold legacy — hygiene risk recorded; no real data to be stored there).
- **Application security test suite:** still no dedicated security test suite (negative authz/tenant-isolation tests are Phase 4+ scope); no dependency scanning/SAST executed.

These are CURRENT STATE findings, not target-state claims.

**Update current state (2026-10-28, Phase 4 — implementasi worktree `b5defc22`):** authentication/session kini TERIMPLEMENTASI (next-auth v4 database strategy + adapter Prisma custom; ADR-022; no-auto-link; provider Google kondisional env-only — tanpa kredensial = status aman, round-trip real-provider NOT TESTED); WhatsApp proof-of-control = abstraksi vendor-netral + test double (OD-03 tetap OPEN; produksi 503 gagal-aman); authorization/tenant isolation runtime TERIMPLEMENTASI (policy layer deny-by-default + reason codes + guards; matriks negative test otomatis 113/113 (koreksi R2) termasuk cross-tenant/privilege-escalation + 12 test HTTP routing end-to-end — `PHASE_4_SECURITY_REVIEW.md`); audit/security events + redaksi defensif aktif; application security test suite Phase 4 tersedia (`tests/unit/*`, `tests/integration/*`); dependency scanning/SAST formal tetap BELUM dijalankan. Detail + residual risks: `PHASE_4_SECURITY_REVIEW.md` (F-4.1..F-4.7).


## Phase 2 target security architecture

Phase 2 must define:
1. authentication abstraction;
2. session/security boundary;
3. authorization policy model;
4. tenant/workspace isolation model;
5. entitlement enforcement;
6. role/permission model;
7. audit/security event model;
8. threat model;
9. secrets boundary;
10. abuse/rate-limit boundary.

### WhatsApp
Provider-specific implementation remains OD-03.
Do not block identity architecture because vendor is unresolved.

### OAuth/OIDC
Define secure validation requirements:
- state;
- nonce;
- issuer;
- audience;
- signature;
- expiry;
- redirect URI;
- account linking.

## Authorization

Policy inputs:
`actor + tenant/workspace + object + action + event context + tier entitlement + extension + role + object state`

UI hiding is never sufficient.

## hiRider security

Separate:
- profile visibility;
- recruitment opening visibility;
- application privacy;
- shortlist;
- decision;
- membership;
- event assignment.

Critical invariant:
`application acceptance != automatic workspace access`

## Store security

Public Store:
- basic miniRider license required;
- server-side entitlement check;
- purchase/license/extension issuance auditable.

Developer Equipment Store:
- miniRider-only server-side enforcement.

## Legal/regulatory

OD-09 governs legal/regulatory validation.
Engineering must record candidate obligations and evidence without declaring legal applicability.
