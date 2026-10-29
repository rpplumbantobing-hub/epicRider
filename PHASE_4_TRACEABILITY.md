# PHASE 4 TRACEABILITY — epicRider

> Rantai wajib (gated prompt §11): `REQ → use case → model → API/service → authorization control → test evidence`.
> Baseline `b5defc22`. Use case rujukan: `USE_CASES.md` (UC-10xx auth flows; UC-20xx workspace;
> UC-30xx membership/invitation — sesuai PHASE_2_TRACEABILITY grouping).

| REQ | Use case terkait | Model (DMC §) | Implementasi (API/service) | Kontrol otorisasi | Test evidence | Status |
|---|---|---|---|---|---|---|
| REQ-021 | UC-10xx login WhatsApp (failure flows) | §3.1 VerificationRequest | `POST /api/v1/auth/otp/request` · `POST /api/v1/auth/otp/verify`; `src/lib/auth/otp/*` | Rate limit target+IP; lockout; hash-only; audit per percobaan | `tests/integration/otp-whatsapp.test.ts`; `tests/unit/otp-domain.test.ts` | PASS (domain); vendor OD-03 BLOCKED |
| REQ-022 | UC-10xx login Google | §3.1 Account/AuthenticationMethod | `/api/auth/[...nextauth]`; `src/lib/auth/nextauth-options.ts` (GoogleProvider kondisional) | next-auth state/nonce/PKCE/issuer/audience/signature/expiry/redirect; no-auto-link | `tests/unit/auth-config.test.ts`; runtime 401/503/redirect | PASS (config); real e2e NOT TESTED |
| REQ-023 | UC-20xx workspace isolation | §2.6 tenant ownership; §3.2 | Semua service workspace-scoped; `src/lib/authz/guards.ts` | Policy tenant scope dari DB; 404 non-member; denial audited | `tests/integration/tenant-isolation.test.ts` (matriks penuh) | PASS |
| REQ-025 | UC-20xx/30xx identity separation | §3.1 User; §3.3 Membership | Model terpisah; `src/lib/workspaces/service.ts` (list via membership) | Identitas ≠ membership ≠ role; role per workspace dari DB | `tests/integration/workspace-membership.test.ts` (role beda per workspace) | PASS |
| REQ-026 | UC-30xx permission matrix | §3.3 Role/Permission; AUTHZ_MODEL §2–4 | `src/lib/authz/policy.ts`; vocabulary §4.1–4.3 | Rantai sesi→tenant→membership→permission→context→object state; reason codes | `tests/unit/authz-policy.test.ts` (matriks) | PASS (entitlement input = Phase 5) |
| REQ-047 | UC-10xx recovery/fallback | §3.1 AccountRecoveryFlow (konsep) | Kebijakan no-auto-link (ADR-022 §4); runtime menunggu kanal kedua | Unsafe linking ditolak; fallback tidak bypass verifikasi | `tests/unit/auth-config.test.ts` (tanpa allowDangerousEmailAccountLinking) | PARTIAL (kebijakan PASS; flow runtime NOT ASSESSED — OD-03) |
| REQ-048 | UC-10xx session lifecycle | §3.1 Session | `/api/v1/me/sessions[/:id]`; `src/lib/auth/session-service.ts`; UI `/account` | Sesi milik sendiri (object-level); revoke → adapter null | `tests/integration/session-lifecycle.test.ts`; runtime UI revoke | PASS |
| REQ-049 | UC-30xx membership lifecycle | §3.3 Membership | `/api/v1/workspaces/:id/members[/:id|/leave]`; `src/lib/memberships/service.ts` | Permission per aksi (suspend/remove/leave); self-admin ditolak; status efektif seketika | `tests/integration/workspace-membership.test.ts`; `tenant-isolation.test.ts` | PASS |
| REQ-050 | UC-30xx/40xx assignment boundary | §3.4 EventAssignment (reference) | Policy `DENY_ASSIGNMENT_MISSING`; permission `event.read` (deklarasi) | Assignment gate di rantai policy | `tests/unit/authz-policy.test.ts` (assignment gate) | PASS (policy-level; runtime event = Phase 6) |
| REQ-051 | UC-30xx invitation | §3.3 Invitation | `/api/v1/workspaces/:id/invitations[/:id]`; `/api/v1/me/invitations[/accept|/:id/accept]`; `src/lib/invitations/service.ts` | `workspace.member.invite`; role terikat server; konsumsi atomik; identitas penerima cocok | `tests/integration/invitation.test.ts` (12 kasus) | PASS |
| REQ-052 | UC-90xx developer role | §3.1 DeveloperRoleAssignment | Model global tanpa FK workspace; `workspacePermissionsForDeveloperRole()` = ∅ | `DENY_CROSS_CONTEXT_ROLE`; role tak dikenal → tanpa permission | `tests/unit/authz-policy.test.ts`; `auth-config.test.ts` (preset) | PASS (runtime portal = Phase 22) |
| REQ-054 | UC-10xx anti-abuse | §3.1 VerificationRequest; SECURITY | `src/lib/auth/rate-limiter.ts`; attempt/lockout di otp-service; audit ABUSE | Rate limit + lockout + audit per percobaan (tanpa secret di log) | `tests/unit/rate-limiter.test.ts`; `otp-whatsapp.test.ts` | PASS (single-instance — F-4.1) |
| REQ-092 | Lintas UC | SECURITY.md; API_ARCH §10 | Redaksi audit; problem-details; log error-only; secret hygiene | Fail-safe tanpa secret; tanpa bocor internal | `tenant-isolation.test.ts` (redaksi); scan; runtime 401/404/503 | PASS (pentest formal = NOT ASSESSED) |

## Pemetaan file → kontrol (ringkas)

- **Policy/otorisasi:** `src/lib/authz/{reason-codes,permissions,roles,policy,guards}.ts`
- **Auth/session:** `src/lib/auth/{nextauth-options,adapter,session-cookie,session-service,rate-limiter,user-agent}.ts` + `src/lib/auth/otp/*`
- **Domain:** `src/lib/{workspaces,memberships,invitations}/service.ts`
- **Audit:** `src/lib/audit/audit-service.ts` + events next-auth
- **API:** `src/app/api/auth/[...nextauth]/route.ts` + 14 route `/api/v1/*` (koreksi R2 dari "12" — hitung ulang filesystem; total 15 route handler)
- **UI/i18n:** `src/app/{login,workspaces,invitations,account}/page.tsx` + `src/components/{auth,workspaces,invitations,account,layout}/*` + dictionary id/en + `src/proxy.ts`
- **Data:** `prisma/schema.prisma` + `prisma/migrations/20261028183022_phase4_identity_workspace_foundation/`
- **Test:** 10 file baru (`tests/unit/*` ×4, `tests/integration/*` ×6 + helper) — 88 test (koreksi R2: + `tests/integration/http-routing.test.ts` 12 test HTTP routing); regresi Phase 3 25/25 tetap lulus.

## Integritas requirement (invariant)

- REQ-001..REQ-100 utuh + REQ-101 tepat satu baris tabel — diverifikasi preflight & tidak diubah.
- REQ-030 tiga commerce surfaces utuh. ServiceOffer ≠ RecruitmentOpening (tidak diimplementasikan — Phase 16).
- Tidak ada requirement/acceptance criteria yang diubah agar cocok dengan kode.
