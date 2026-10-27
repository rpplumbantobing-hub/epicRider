# SECURITY — epicRider

## Current state

Phase 0 evidence showed:
- no implemented authentication;
- no implemented authorization/tenant isolation/entitlement;
- `next-auth` dependency exists without implementation;
- `ignoreBuildErrors: true` exists and is a tracked quality risk;
- no application security test suite;
- no CI/dependency scanning/SAST evidence.

These are CURRENT STATE findings, not target-state claims.

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
