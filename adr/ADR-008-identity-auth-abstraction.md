# ADR-008 — Identity & authentication abstraction

**Scope:** provider-agnostic identity/authentication architecture. Vendor-specific provider selection is a **separate future decision** (OD-03 for the WhatsApp channel).

## Status

**PROPOSED** — awaiting owner review of Phase 2 output · **Date:** 2026-10-27

## Context

- epicRider has two login methods in the requirements baseline: WhatsApp OTP login (REQ-021) and Google Sign-In via OAuth 2.0/OIDC (REQ-022), plus account recovery & cross-method fallback (REQ-047), session lifecycle management (REQ-048), and anti-abuse controls (REQ-054). Global user identity is separate from workspace membership (REQ-025; MC §4 invariant).
- `SECURITY.md` (Phase 2 target security architecture) mandates an **authentication abstraction**, secure sessions, secure OAuth/OIDC, and a secure provider abstraction; its WhatsApp section states that the provider is not an architectural prerequisite and identity architecture must not be blocked by the unresolved vendor (OD-03).
- Repository CURRENT STATE: no implemented authentication (`next-auth` dependency exists without implementation — `SECURITY.md` Current state). Everything here is TARGET STATE / PROPOSED.
- `THREAT_MODEL.md` models the authentication abuse surface vendor-neutrally: TC-01 (authentication abuse), TC-02 (session theft), TC-03 (account takeover), TC-04 (OAuth account linking abuse), TC-05 (WhatsApp OTP abuse).

## Problem

How should identity and authentication be structured so that (a) two login methods plus recovery coexist safely, (b) account linking and fallback cannot be abused as takeover routes, (c) sessions are managed per REQ-048, and (d) the unresolved WhatsApp vendor (OD-03) does not block the identity architecture or Phase 4?

## Options

1. **Direct per-provider integration in each client/API path.**
   - Pros: fastest initial wiring.
   - Cons/trade-offs: provider lock-in; duplicated validation logic; OD-03 would then block all identity work; inconsistent session semantics. Rejected by the baseline dependency rule.
2. **Provider-agnostic authentication abstraction with per-provider adapters.**
   - Pros: identity/session architecture proceeds vendor-neutrally; uniform validation and session semantics; providers added later behind conformance tests.
   - Cons/trade-offs: more up-front interface design; an adapter conformance-test burden per future provider.
3. **Delegate all authentication to an external identity platform (class only — no vendor named).**
   - Pros: least custom auth code.
   - Cons/trade-offs: external dependency for a core capability; account-data considerations; the WhatsApp OTP channel (REQ-021) would still need integration; no project evidence supports this choice today.

## Decision (PROPOSED)

Adopt a **provider-agnostic authentication abstraction**:

- **Session issuance & lifecycle interfaces** implementing REQ-048 (login/logout, expiry, active session/device list, revoke per-device and all-devices; a revoked session is rejected on the next request).
- **Credential verification interfaces** for OTP verification (see ADR-009) and OAuth/OIDC token verification.
- **Account linking rules** per REQ-022/REQ-047: linking cannot be hijacked; cross-method fallback (WhatsApp ↔ Google) must not bypass verification or open a takeover route.
- **Recovery flows** per REQ-047 with audit events for recovery attempts (REQ-054).
- **Google OAuth/OIDC validation requirements** per `SECURITY.md`: state, nonce, issuer, audience, signature, expiry, redirect URI — all validated; invalid tokens rejected (REQ-022 acceptance idea).
- **Abuse boundary**: rate limiting, temporary lockout, anomaly monitoring, audit event per attempt (REQ-054).
- **Vendor-specific selection** (which WhatsApp provider, which concrete libraries) = separate future decision (OD-03); no vendor is named here.

## Consequences

**Positive**

- OD-03 no longer shapes the identity architecture: Phase 4 identity/session work can proceed while the vendor stays open.
- One place to enforce validation requirements and one session model for all methods; negative-path testing is uniform (THREAT_MODEL TC-01..TC-05 test/evidence ideas).
- Account linking rules are explicit, addressing the known abuse classes (login CSRF, wrong-account linking — TC-04).

**Negative / risks**

- The abstraction must be kept honest: every future provider adapter needs conformance tests against the same validation requirements.
- Account linking/recovery is a high-risk state machine (TC-03/TC-04); implementation bugs there are account-takeover class.
- Session policy parameters (max active sessions, idle timeout, force-logout) remain OD-115 OPEN — defaults cannot be finalized yet.

## Evidence

- `SECURITY.md` — Phase 2 target security architecture (authentication abstraction; OAuth/OIDC validation list incl. account linking; WhatsApp provider not an architectural prerequisite); Current state (no implemented authentication).
- Requirements: REQ-021, REQ-022, REQ-025, REQ-047, REQ-048, REQ-054 (all in `REQUIREMENTS.md`, status PROPOSED).
- `THREAT_MODEL.md` TC-01..TC-05 (all controls vendor-neutral; all tests `PROPOSED — NOT TESTED`).
- `DATA_MODEL_CONCEPT.md` §3.1 (Identity context: User, AuthenticationMethod, Session, recovery entities).
- `AUTHORIZATION_MODEL.md` §2 (authentication/session validity as prerequisites of the authorization chain) and §3 (`DENY_NO_SESSION`, `DENY_SESSION_EXPIRED`, `DENY_SESSION_REVOKED` reason codes).
- Owner baseline: `DECISIONS.md` OD-03 (identity/session/auth abstraction remains unblocked).

## Dependencies

- **Open decisions:** OD-03 (vendor-specific part), OD-115 (session parameters).
- **Related ADRs:** ADR-009 (WhatsApp OTP provider abstraction — the OTP leg of this abstraction).
- **Related docs:** `API_ARCHITECTURE.md` (by name — parallel Task 2-e), `THREAT_MODEL.md`, `DATA_MODEL_CONCEPT.md`.
- **Phases:** Phase 2 (this ADR); Phase 4 (authentication implementation per REQ-021/022/047/048/054 planned phase 4).
