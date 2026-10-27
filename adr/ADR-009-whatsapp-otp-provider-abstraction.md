# ADR-009 — WhatsApp OTP provider abstraction

**Scope:** vendor-neutral OTP provider interface for the WhatsApp login channel. No provider/vendor is named or implied.

## Status

**PROPOSED (abstraction)** — vendor-specific part OPEN (OD-03) · **Date:** 2026-10-27

## Context

- REQ-021 defines WhatsApp login as: proof of phone-number control via a verified mechanism; **single-use token, expiry, anti-replay, rate limit, anti-abuse, audit, recovery** — the requirement text is deliberately vendor-agnostic, and its acceptance notes the vendor is decision OD-03.
- The owner baseline scopes OD-03 precisely: only provider-specific integration, credentials, configuration and provider-specific production tests are blocked; the identity domain, session architecture, auth abstraction, recovery and authorization remain unblocked (`DECISIONS.md` OD-03; `MASTER_CONTROL.md` §5; `PHASE_2_DEPENDENCY_MATRIX.md`).
- `SECURITY.md` (WhatsApp section): provider-specific implementation remains OD-03; do not block identity architecture because the vendor is unresolved.
- `THREAT_MODEL.md` TC-05 models the OTP abuse surface vendor-neutrally (flooding, interception/replay, predictable values, enumeration, provider credential leakage, forged callbacks) and marks the provider-specific portion `UNKNOWN / NEEDS DECISION` until OD-03.

## Problem

Define the OTP provider abstraction so the WhatsApp channel named in REQ-021 can be implemented later without re-architecting identity, while no vendor is chosen and no provider-specific claim is made.

## Options

1. **Hard-code a single provider now.**
   - Pros: none that are legitimate at this stage.
   - Cons/trade-offs: would fabricate a vendor decision that belongs to the owner (OD-03); blocks on unresolved commercial/feasibility questions (RSK-116). Rejected.
2. **Provider abstraction with pluggable providers (interface-first).**
   - Pros: identity architecture proceeds; provider selected later behind the same contract; abuse controls modeled once, vendor-neutrally.
   - Cons/trade-offs: interface design effort up front; a conformance test suite is needed per future provider.
3. **Defer all OTP design until the vendor decision.**
   - Pros: no abstraction cost now.
   - Cons/trade-offs: contradicts the baseline (OD-03 does not block Phase 2/Phase 4 architecture); REQ-021 semantics would be unowned. Rejected.

## Decision (PROPOSED)

Adopt an **OTP provider interface** (vendor-neutral) with:

- **Operations:** send (issue code to a phone number) and verify (check a submitted code).
- **Token semantics per REQ-021:** one-time use, expiry, anti-replay (replayed or reused codes rejected — see `AUTHORIZATION_MODEL.md` §3 `DENY_REPLAY`).
- **Rate-limit boundary:** per-number, per-session/IP, and platform-budget limits to bound flooding cost and harassment; numeric parameters remain open anti-abuse parameters (REQ-054 governs the anti-abuse class).
- **Recovery/fallback path per REQ-047:** cross-method fallback (WhatsApp ↔ Google) without opening an account-takeover route; OTP failures must not lock users out of the recovery path.
- **Provider pluggability:** the interface must be implementable by any future provider; provider selection, credentials, configuration, callbacks, and provider-side anti-spoofing remain **OPEN — OD-03**. No vendors named.

## Consequences

**Positive**

- Phase 2 and Phase 4 identity work are unblocked (per the baseline dependency rule); REQ-021 semantics have an owner architectural home.
- OTP flooding/replay controls are designed once and inherited by whichever provider is later selected (THREAT_MODEL TC-05 control set).
- RSK-116 (vendor/mechanism problems) is contained: the abstraction plus REQ-047 fallback keeps the login path viable even if provider selection slips.

**Negative / risks**

- Provider-specific threats (callback authentication, credential handling, provider-side anti-spoofing) cannot be specified or tested until OD-03 is resolved — recorded as `UNKNOWN / NEEDS DECISION` in TC-05.
- Every future provider must pass the same conformance requirements (single-use, expiry, anti-replay, rate limits, audit) before production use.
- Messaging cost abuse (flooding) has a provider-cost component that can only be bounded, not eliminated, by platform-side rate limits.

## Evidence

- REQ-021 (single-use, expiry, anti-replay, rate limit, anti-abuse, audit, recovery; vendor = OD-03) and REQ-047/REQ-054 — `REQUIREMENTS.md` (status PROPOSED).
- `SECURITY.md` — WhatsApp section (provider not an architectural prerequisite) and Phase 2 target security architecture (secure provider abstraction, anti-replay, rate limiting).
- `DECISIONS.md` OD-03 (owner baseline 2026-10-27) + `PHASE_2_DEPENDENCY_MATRIX.md` OD-03 row.
- `THREAT_MODEL.md` TC-05 (vendor-neutral model; provider-specific portion open; tests `PROPOSED — NOT TESTED`).
- `DATA_MODEL_CONCEPT.md` §3.1 (Identity context: AuthenticationMethod / provider-integration configuration entity) and §11 row 6.
- `RISK_REGISTER.md` RSK-116 (vendor/mechanism risk, mitigation = vendor-agnostic design + fallback).
- No provider has been evaluated, contacted, or tested; no such claim is made.

## Dependencies

- **Open decision:** OD-03 (vendor selection — decides the provider-specific part of this ADR).
- **Related ODs:** OD-115 (session parameters, adjacent).
- **Related ADRs:** ADR-008 (identity & authentication abstraction — this interface is its OTP leg); ADR-017 (anti-replay/idempotency strategy shares the replay threat space).
- **Related docs:** `THREAT_MODEL.md`, `AUTHORIZATION_MODEL.md`, `DATA_MODEL_CONCEPT.md`, `API_ARCHITECTURE.md` (by name — parallel Task 2-e).
- **Phases:** Phase 2 (this ADR); Phase 4 (WhatsApp login implementation per REQ-021 planned phase 4).
