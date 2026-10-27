# THREAT MODEL — epicRider

**Task:** 2-c (Security Architect) · Phase 2 · 2026-10-27
**Document status:** `PROPOSED` — architectural threat model produced by structured desk analysis of Phase 0–1 artifacts and the reconciled Phase 2 control baseline.

**What this document is NOT:** This is NOT a security test report. **No security testing has been executed in Phase 2.** No penetration test, no scan, no SAST/DAST, no runtime probing has been run. Every test/evidence entry in this document is a **`PROPOSED`** test idea for later phases and is explicitly marked **`NOT TESTED`**.

**Current-state implementation of security controls:** `NOT FOUND` (per `SECURITY.md` "Current state": no implemented authentication, no authorization/tenant isolation/entitlement, `next-auth` dependency present without implementation, no application security test suite, no CI/dependency scanning/SAST evidence). All controls described below are therefore **planned/target-state** controls, not implemented controls.

**Owner approvals pending:** the qualitative scoring methodology (§2) and the residual-risk treatment proposals (§6) await owner approval. No owner decision is assumed or invented by this document.

---

## 1. Purpose, status and scope

### 1.1 Purpose
Identify the security and privacy threats that the epicRider target architecture must address, structure them by asset / actor / entry point / trust boundary, map each to planned/target controls (requirements, control files, sibling Phase 2 architecture documents), and propose verification ideas — so that:
- `AUTHORIZATION_MODEL.md`, `ENTITLEMENT_MODEL.md`, `API_ARCHITECTURE.md` and `DATA_MODEL_CONCEPT.md` (written in parallel in Phase 2) inherit a common threat baseline;
- later phases get threat-model-driven negative test ideas (per `NON_FUNCTIONAL_REQUIREMENTS.md` NFR-01 measurement approach);
- residual gaps that need owner decisions are surfaced instead of being silently absorbed.

### 1.2 Scope
In scope — the epicRider platform as one multi-tenant product:
- **Web as first-class channel** (desktop/tablet/mobile browser) plus **future companion clients** (Android/iOS/Windows per OD-02 `OPEN`) — the threat model stays client-neutral; OD-02 does not block it.
- **Three license tiers only:** miniRider, maxRider, ISOrider (`MASTER_CONTROL.md` §1, `LICENSE_MATRIX.md` §1).
- **hiRider** — the recruitment portal/capability (candidate profiles/skills/portfolio, openings, applications, shortlist, decisions, assignment workflow). **hiRider is NOT a license** and is never modeled as a `LicenseTier` (`ARCHITECTURE.md` §5).
- **Public Store** (developer commerce storefront; access requires a basic miniRider license) and the **miniRider-only Developer Equipment Store** — two separate stores (REQ-030).
- **Developer Portal** (separate console/role, REQ-016/REQ-058), **auditor access path** (REQ-044/REQ-053/REQ-084), **IMS/document/evidence capabilities** (ISOrider, REQ-070..086), **notification system** (REQ-017/059..061).
- Invariants carried from `MASTER_CONTROL.md` §1 and `TESTING.md`: `Application != Workspace Membership`, `Application != Event Assignment`, `Acceptance != Automatic Workspace Access`, `User != Membership != Role != Event Assignment`, `hiRider != LicenseTier`, `UI hiding is never a security control`.

Out of scope — see §8 (open items OD-02, OD-03, OD-07, OD-09, OD-110, OD-139, OD-142, OD-166, ISO verification OD-160, plus parameter-level ODs).

### 1.3 Relationship to other documents
- This document does **not** duplicate `RISK_REGISTER.md` (RSK-101..RSK-125). Delivery/execution risks stay there; threat categories here cross-reference existing RSK IDs where applicable.
- Sibling Phase 2 documents (`AUTHORIZATION_MODEL.md`, `ENTITLEMENT_MODEL.md`, `API_ARCHITECTURE.md`, `DATA_MODEL_CONCEPT.md`, `LEGAL_REGULATORY_REGISTER.md`) are referenced **by name only** — they are being written in parallel; no dependency on their internal section numbers is assumed.
- `SECURITY.md` (reconciled baseline) is the control-file anchor; it is cited by heading name (it has no section numbers).

---

## 2. Methodology (PROPOSED — awaits owner approval)

- **Approach:** qualitative, structured walk per threat category: identify assets → actors → entry points → trust boundaries → threat description, then judge impact and likelihood qualitatively, map planned/target controls, judge residual risk, and propose test ideas. This is a design-phase, documentation-only analysis: no code exists for the product features, so no dynamic analysis is possible.
- **STRIDE mapping:** each category carries an informal STRIDE mapping (Spoofing / Tampering / Repudiation / Information disclosure / Denial of service / Elevation of privilege). **STRIDE-inspired mapping is a PROPOSED methodology**, not an owner-approved framework.
- **Qualitative scales (PROPOSED):**
  - Likelihood: `Low` / `Medium` / `High` — desk judgment of the probability of successful execution against the *target* architecture (assuming planned controls are implemented as specified), based on entry-point exposure, attacker motivation/value of assets, and abuse-class prevalence.
  - Impact: `Low` / `Medium` / `High` — worst credible harm to assets, users, or the platform if the threat succeeds.
  - Residual risk: `Acceptable` / `Needs monitoring` / `Unacceptable — proposed for treatment` — expected residual **after** the planned/target controls are implemented as specified. "Needs monitoring" = controls sufficient in design but requiring verification and operational watch. "Unacceptable — proposed for treatment" = the baseline itself has a control gap or an exposure that needs an additional owner decision/treatment.
- **CRITICAL RULE — no quantitative scores:** this document deliberately contains **no numeric risk scores** of any kind (no decimal ratings, no Impact-times-Probability products). The Phase 1 risk register uses a numeric priority product for ranking; that convention is **not** repeated here. The qualitative scoring methodology **awaits owner approval**; an owner may later substitute another scale without invalidating the threat analysis itself.
- **Honesty rules:** residuals are conditional — nothing is implemented or verified today (`NOT FOUND` / `NOT TESTED`). Consequently **no category is currently rated `Acceptable`**: an Acceptable rating can only be assigned after controls are implemented and verified in later phases.
- All judgments are desk analysis by the Security Architect role; they are `PROPOSED`, not measured facts.

---

## 3. System trust boundaries

```text
┌──────────────────────────────────────────────────────────────┐
│ INTERNET — anonymous users · bots · attackers · candidates   │
│ · buyers                                                     │
└──────────────────────────────┬───────────────────────────────┘
                               │ TB-1
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ PUBLIC SURFACES (unauthenticated)                            │
│ landing page (REQ-015) · tester/demo access (REQ-100) ·      │
│ any pre-authentication store surface the owner may expose    │
│ (store access itself requires a basic miniRider license)     │
└──────────────────────────────┬───────────────────────────────┘
                               │ TB-2
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ CLIENT APPS                                                  │
│ web browser first-class (desktop/tablet/mobile, REQ-019) ·   │
│ future Android/iOS/Windows companion clients (OD-02 OPEN)    │
└──────────────────────────────┬───────────────────────────────┘
                               │ TB-2: authentication / session
                               ▼
┌──────────────────────────────┐    ┌─────────────────────────────────┐
│ API BOUNDARY LAYER           │    │ TB-5 EXTERNAL PROVIDERS         │
│ rate limiting · anti-abuse · │◀──▶│ · WhatsApp OTP provider         │
│ request validation · audit   │    │   (OD-03 OPEN — treat vendor-   │
└──────────────┬───────────────┘    │   neutral, abstraction only)    │
               │ TB-3                │ · OAuth/OIDC IdP — Google      │
               ▼                     │   Sign-In (named in REQ-022)   │
┌──────────────────────────────┐    │ · file/object storage           │
│ POLICY LAYER                 │    │ · notification delivery         │
│ authorization + entitlement: │    └─────────────────────────────────┘
│ actor + tenant + object +    │
│ action + event context +     │
│ tier + extension + role +    │
│ object state · deny-default  │
└──────┬───────────────┬───────┘
  TB-6 │               │ TB-7
       ▼               ▼
┌──────────────────────┐  ┌─────────────────────────────────────┐
│ TB-6 TENANT/WORKSPACE│  │ TB-7 PLATFORM-LEVEL DOMAINS         │
│ DATA (per workspace):│  │ licenses/entitlements/extensions ·  │
│ events · technical   │  │ store catalogs/prices/orders ·      │
│ riders · media kits ·│  │ audit trails · platform secrets ·   │
│ assets · chat/       │  │ developer portal (role) · platform  │
│ rundown · documents ·│  │ owner/staff · auditor read-only     │
│ evidence · hiRider   │  │ access path (TB-8: scoped,          │
│ applications         │  │ time-bound)                         │
└──────────┬───────────┘  └────────────────┬────────────────────┘
           │ TB-4                          │ TB-4
           ▼                               ▼
┌──────────────────────────────────────────────────────────────┐
│ DATABASE — physical engine selection = OD-01 OPEN            │
└──────────────────────────────────────────────────────────────┘
```

**Boundary register:**

| ID | Trust boundary | Notes |
|---|---|---|
| TB-1 | Internet → public landing/store surfaces | Unauthenticated exposure: landing page (REQ-015), tester access (REQ-100). Store purchase paths sit behind authentication and a basic miniRider license check (`MASTER_CONTROL.md` §1). Anti-mockup rule applies (REQ-035, UXR-14): no fake download links/buttons — fake elements would be a phishing-adjacent deception vector. |
| TB-2 | Client apps → API boundary (authentication/session) | All clients (web first-class; future companion clients per OD-02 `OPEN`) cross this boundary with credentials/session tokens. Authentication abstraction must be client-neutral. |
| TB-3 | API layer → policy layer (authorization/entitlement) | Every security-sensitive request is evaluated by the policy layer with the full input set (actor, tenant, object, action, event context, tier entitlement, extension, role, object state — REQ-026); deny-by-default. |
| TB-4 | Application → database | Physical engine = OD-01 `OPEN` (only final physical selection/migration is blocked; logical model and this threat model are not blocked). Immutability of approved records must survive at this layer, not only in application code. |
| TB-5 | Application → external providers | WhatsApp OTP provider (**OD-03 OPEN** — modeled vendor-neutrally: abstraction, token/security requirements, rate-limit boundary, recovery/fallback per prompt §5); OAuth/OIDC provider (Google Sign-In, named in REQ-022); file/object storage; notification delivery channels. |
| TB-6 | Workspace tenant boundary (inside application data) | Per-workspace isolation of tenant data (REQ-023). **Inner boundary:** event assignment — kru may only access events they are assigned to, even inside their own workspace (REQ-050, REQ-007). |
| TB-7 | Platform-level actors/domains vs tenant actors/domains | Licenses/entitlements, store catalogs/orders, audit trails, platform secrets, developer portal role, platform owner/staff operate at platform level — a different authority plane from workspace roles (REQ-025, REQ-031, REQ-052, REQ-058). |
| TB-8 | Auditor read-only access path | External auditor: read-only, scoped, time-bound, auto-expiring (REQ-044, REQ-053, REQ-084; terms OD-110 `OPEN`). Writes denied across the boundary. |

---

## 4. Asset inventory (grouped)

| ID | Asset group | Content | Sensitivity/value notes |
|---|---|---|---|
| A-01 | User identity & credentials | Global user identity (separate from membership — REQ-025), phone-number control proof (OTP), OAuth identity links, recovery data | High — gateway to all memberships; privacy-sensitive |
| A-02 | Sessions & tokens | Session tokens, OTP tokens, invite tokens (REQ-051), OAuth state/nonce artifacts | High — bearer-style value |
| A-03 | Workspace data | Events, technical riders, media kits, assets/sets, chat, rundown, CRM/finance (maxRider+), reports | High — client-confidential business data |
| A-04 | hiRider candidate data | Candidate profiles, skills, portfolio, experience, applications, application status history, shortlists, decisions (contact data policy OD-134 `OPEN`) | High — privacy-sensitive personal data |
| A-05 | Licenses, entitlements & extensions | License tier state machine (REQ-098), capabilities, active extensions, downgrade behavior (REQ-099, OD-108 `OPEN`) | High — direct commercial value |
| A-06 | Store catalogs, prices & orders | Listings (REQ-055), prices/stock/discounts (REQ-056), orders/purchase abstractions, issuance records | High — commercial integrity; final commercial values OD-06 `OPEN` |
| A-07 | Documents & evidence | Controlled document library (REQ-042/078..082), evidence records, locked/approved records, sign-off attribution (REQ-083) | High — IMS integrity, organizational records |
| A-08 | Audit trails | Security and business audit events (who/when/what/old→new), access logs (REQ-082) | High — tamper target and accountability basis; retention OD-138/OD-164 `OPEN` |
| A-09 | Platform secrets | OAuth client secrets, OTP provider credentials, storage credentials, signing keys, database credentials | Critical — compromise is platform-wide |
| A-10 | Notification channels | Audience model (REQ-059), delivery queues/status (REQ-060), user preferences (REQ-061) | Medium — trust/attention/cost abuse vector |
| A-11 | Offline sync queues (future) | Local action queues on clients, sync endpoints — exist only if OD-07 approves offline support | Conditional — scope OD-07 `OPEN` |

---

## 5. Actor inventory

| ID | Actor | Description / reach |
|---|---|---|
| AC-01 | Anonymous internet user | Landing page, tester access; unauthenticated probes, scraping, enumeration |
| AC-02 | Authenticated user without workspace | Global identity only; no tenant data reach (REQ-025) |
| AC-03 | Workspace member | Role-scoped reach inside one workspace |
| AC-04 | Workspace owner / admin | Highest tenant-side authority (invites, roles, recruitment opening, store of workspace settings) |
| AC-05 | Kru (crew) with multi-workspace membership | Member of several workspaces; switches event context (REQ-007, REQ-014) — cross-tenant trust consideration |
| AC-06 | Candidate (hiRider applicant) | May hold no license at all; reaches only recruitment surfaces per visibility settings (REQ-062) |
| AC-07 | Developer (portal/store operator role) | Platform-level role for Developer Portal / stores (REQ-016, REQ-052, REQ-058) — must NOT reach licenses/billing/broadcast |
| AC-08 | Auditor (external, time-bound, read-only) | Scoped read-only window (REQ-044/053/084); terms OD-110 `OPEN` |
| AC-09 | Platform owner / staff | Platform-level administration and operation |
| AC-10 | External provider systems | WhatsApp OTP provider (OD-03 `OPEN`), OAuth/OIDC IdP (Google per REQ-022), file/object storage, notification delivery |
| AC-11 | Malicious insider | Threat overlay: any of the above acting against interests (data exfiltration, policy misuse) |
| AC-12 | Automated abuse (bots) | Scripts: credential stuffing, OTP flooding, scraping, spam applications |

---

## 6. Threat categories

The 23 categories below (TC-01..TC-23) are the **mandatory minimum set from Phase 2 prompt §11**, in the prompt's order. TC-24 is an **additional supplementary cross-cutting category** (insecure direct object reference / enumeration), included by design decision of this task and marked as supplementary.

Every category carries the 10 required fields: asset, actor, entry point, trust boundary, threat description, impact, likelihood, control, residual risk, test/evidence. Impact/Likelihood/Residual are `PROPOSED` qualitative judgments (§2); all test/evidence entries are `PROPOSED` — `NOT TESTED`.

---

### TC-01 — Authentication abuse
**STRIDE mapping (PROPOSED):** Spoofing; secondary Denial of Service (lockout, OTP flooding).

| Field | Value |
|---|---|
| Asset | A-01 (identity/credentials), A-02 (OTP tokens); platform messaging budget |
| Actor | AC-01 anonymous user, AC-12 bots, AC-11 malicious insider |
| Entry point | Public authentication endpoints: WhatsApp OTP request/verify (REQ-021), Google Sign-In callback (REQ-022), recovery/fallback flows (REQ-047) |
| Trust boundary | TB-2 (client → API authentication), TB-5 (providers) |
| Threat | Brute-force/credential-stuffing-style attempts; OTP request flooding (provider cost + user harassment); abusing recovery to seize accounts; probing responses to enumerate registered users |
| Impact (`PROPOSED`) | High — compromise of one member account cascades into workspace data; OTP flooding has direct provider cost |
| Likelihood (`PROPOSED`) | High — internet-facing authentication surfaces are continuously probed as a baseline condition (desk judgment) |
| Control (planned/target) | REQ-054 (rate limiting, temporary lockout, anomaly monitoring, audit event per attempt); REQ-021 (single-use OTP, expiry, anti-replay); REQ-047 (recovery must not open a takeover path); `SECURITY.md` "Phase 2 target security architecture" (authentication abstraction; abuse/rate-limit boundary); `API_ARCHITECTURE.md` (rate limiting/validation at the API boundary); `AUTHORIZATION_MODEL.md` (deny-by-default) |
| Residual risk (`PROPOSED`) | Needs monitoring — rate-limit/lockout parameters are not yet owner-approved (session parameters OD-115 `OPEN`; abuse thresholds TBD); no implementation or verification exists yet (`NOT TESTED`) |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | Negative tests per REQ-054 AC: repeated failed attempts trigger temporary lockout; every attempt produces an audit event; OTP request rate limiting active; enumeration-safe error responses |
| Cross-reference | RSK-116 (OTP mechanism/provider problems); OD-03 |

### TC-02 — Session theft
**STRIDE mapping (PROPOSED):** Spoofing.

| Field | Value |
|---|---|
| Asset | A-02 (sessions/tokens) |
| Actor | AC-11 malicious insider; attacker with victim device/browser access; network-level attacker (if transport security fails) |
| Entry point | Authenticated API surface; session cookies/tokens in clients; session management endpoints (REQ-048) |
| Trust boundary | TB-2 |
| Threat | Stealing and replaying a session token from another device; session fixation; stale sessions surviving revocation; excessive session lifetime |
| Impact (`PROPOSED`) | High — full reach of the victim's current permissions until revocation |
| Likelihood (`PROPOSED`) | Medium |
| Control (planned/target) | REQ-048 (session lifecycle: login/logout, expiry, active session/device list, revoke per-device and all-devices — revoked session rejected on next request); `SECURITY.md` "Phase 2 target security architecture" (secure sessions); `API_ARCHITECTURE.md` (token handling and transport requirements) |
| Residual risk (`PROPOSED`) | Needs monitoring — session policy parameters (max active sessions, idle timeout, force-logout) await OD-115 `OPEN` |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | REQ-048 AC tests: revocation ends access on next request; expired sessions rejected; device list accurate; all-device logout effective |
| Cross-reference | OD-115 |

### TC-03 — Account takeover
**STRIDE mapping (PROPOSED):** Spoofing + Elevation of privilege.

| Field | Value |
|---|---|
| Asset | A-01, A-02, and all workspace data reachable by the victim account (A-03) |
| Actor | AC-11 attacker with partial victim knowledge (phone/email/social engineering); malicious insider |
| Entry point | Recovery flows; cross-method fallback between WhatsApp and Google login (REQ-047); account linking |
| Trust boundary | TB-2, TB-5 |
| Threat | Abusing the fallback path to bypass primary verification and seize the account; social-engineering recovery; blast radius: one account may hold memberships in many workspaces (kru multi-workspace, AC-05) |
| Impact (`PROPOSED`) | High — cross-workspace compromise |
| Likelihood (`PROPOSED`) | Medium |
| Control (planned/target) | REQ-047 (account recovery & fallback across login methods without opening a takeover route; AC: recovery tested, old account stays controlled, fallback cannot bypass verification); REQ-021/REQ-022 verification strength; `SECURITY.md` "Phase 2 target security architecture" |
| Residual risk (`PROPOSED`) | Needs monitoring — depends on correct implementation of the recovery state machine; no evidence yet |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | REQ-047 AC tests; multi-workspace blast-radius analysis; audit events for recovery attempts |
| Cross-reference | RSK-116 (adjacent) |

### TC-04 — OAuth account linking abuse
**STRIDE mapping (PROPOSED):** Spoofing + Tampering.

| Field | Value |
|---|---|
| Asset | A-01 (identity), OAuth identity assertions |
| Actor | AC-01/AC-11 attacker controlling an OAuth session (login CSRF), phishing attacker |
| Entry point | OAuth callback/redirect endpoints; account linking flow (Google Sign-In per REQ-022) |
| Trust boundary | TB-2, TB-5 (OAuth/OIDC provider) |
| Threat | Login CSRF (victim ends up authenticated into attacker's account); forced or wrong-account linking; accepting tokens with wrong issuer/audience/expiry/signature; redirect-URI abuse |
| Impact (`PROPOSED`) | High — identity confusion can pivot into account takeover |
| Likelihood (`PROPOSED`) | Medium — well-documented abuse class wherever validation is incomplete (desk judgment) |
| Control (planned/target) | REQ-022 (validate state, nonce, issuer, audience, signature, expiry, redirect URI; safe account linking — AC: full validation tested, invalid tokens rejected, linking cannot be hijacked); `SECURITY.md` "OAuth/OIDC" validation requirements |
| Residual risk (`PROPOSED`) | Needs monitoring |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | REQ-022 AC; negative token-validation matrix (wrong issuer/audience/expiry/signature/state/nonce/redirect URI each rejected) |
| Cross-reference | — |

### TC-05 — WhatsApp OTP abuse (vendor-neutral; OD-03 OPEN)
**STRIDE mapping (PROPOSED):** Spoofing + DoS; enumeration → Information disclosure.

| Field | Value |
|---|---|
| Asset | A-01 (phone-number control proof), A-02 (OTP tokens), A-09 (provider credentials), platform messaging budget |
| Actor | AC-01 anonymous user, AC-12 bots, AC-11 malicious insider, compromised/abusive provider (TB-5 trust assumption) |
| Entry point | OTP request/verify endpoints; future provider callback/webhook surface |
| Trust boundary | TB-2, TB-5 (provider abstraction boundary — OD-03 `OPEN`) |
| Threat | OTP flooding (cost + harassment); OTP interception/replay; predictable OTP values; response-based phone enumeration; provider credential leakage; forged provider callbacks |
| Impact (`PROPOSED`) | High — direct authentication compromise plus provider cost abuse |
| Likelihood (`PROPOSED`) | Medium |
| Control (planned/target) | REQ-021 (single-use token, expiry, anti-replay, rate limit, anti-abuse, audit, recovery — deliberately vendor-agnostic); prompt §5 OD-03 architecture: provider abstraction, auth interface, token/security requirements, rate-limit boundary, recovery/fallback; `SECURITY.md` "WhatsApp" (provider-specific implementation stays OD-03; identity architecture not blocked) |
| Residual risk (`PROPOSED`) | Needs monitoring — the provider-specific portion is `UNKNOWN-NEEDS DECISION` (OD-03 `OPEN`): provider-side anti-spoofing, callback authentication, credential handling cannot be specified until a vendor is chosen |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | REQ-021 AC: OTP single-use and expiry proven; replay rejected; rate limit active; audit recorded; enumeration-safe responses; abstraction conformance tests for any future provider |
| Cross-reference | RSK-116, OD-03 |

### TC-06 — Tenant isolation failure
**STRIDE mapping (PROPOSED):** Information disclosure (primary); Tampering (cross-tenant writes).

| Field | Value |
|---|---|
| Asset | A-03 (all workspace data), A-07 (documents/evidence) |
| Actor | AC-02/AC-03/AC-05 authenticated user of another workspace (deliberate); any tenant user via defective query (accidental); AC-11 malicious insider |
| Entry point | Any API query/mutation accepting object identifiers; list/search/export endpoints; reports; technical logs |
| Trust boundary | TB-6 (workspace tenant boundary), TB-4 |
| Threat | Missing workspace scoping in a query → cross-tenant read/write (REQ-023 AC demands all cross-tenant CRUD denied); tenant identifiers leaking into logs; shared caches keyed without tenant context; migration bugs breaching TB-6 |
| Impact (`PROPOSED`) | High — single-boundary failure compromises every tenant |
| Likelihood (`PROPOSED`) | Medium — top-ranked product risk (RSK-102) |
| Control (planned/target) | REQ-023 (proven isolation: cross-tenant CRUD test matrix; no data leak in query/log); REQ-025 (global identity separate from membership); `ARCHITECTURE.md` §4 invariants (tenant/workspace isolation); `AUTHORIZATION_MODEL.md` (tenant context in every policy evaluation); `DATA_MODEL_CONCEPT.md` (explicit tenant/workspace ownership per entity) |
| Residual risk (`PROPOSED`) | Needs monitoring — **high-attention**: highest blast radius of all categories; only verifiable via the Phase 4+ cross-tenant test matrix (currently `NOT TESTED`) |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | Cross-tenant CRUD denial matrix per REQ-023 AC (deny + audit); log leak scan; per-endpoint tenant-context review; NFR-01 isolation matrix |
| Cross-reference | RSK-102 (rank 1), RSK-107 (adjacent tier/store leak) |

### TC-07 — Authorization bypass
**STRIDE mapping (PROPOSED):** Elevation of privilege.

| Field | Value |
|---|---|
| Asset | A-03, A-04, A-07, A-10 — any role-protected object |
| Actor | AC-03 workspace member attempting another role's actions; AC-05 kru with partial assignment; AC-06 candidate |
| Entry point | Any protected resource endpoint; role-check gaps; object-state-dependent rules |
| Trust boundary | TB-3 (API → policy layer), TB-6 |
| Threat | Performing actions reserved for other roles (e.g., member performing owner-only actions); policy ignoring object state or event context; relying on UI hiding as the only control (explicitly forbidden — `MASTER_CONTROL.md` §2) |
| Impact (`PROPOSED`) | High |
| Likelihood (`PROPOSED`) | Medium |
| Control (planned/target) | REQ-026 (permission evaluates actor, tenant, object, action, event context, license, object state; matrix must pass; license change changes access — tested); REQ-024 (server-side entitlement; UI hiding is not a control); `SECURITY.md` "Authorization" (policy inputs); `AUTHORIZATION_MODEL.md` (policy layer, permission vocabulary, resource ownership, role inheritance, deny-by-default, server-side enforcement) |
| Residual risk (`PROPOSED`) | Needs monitoring — matrix completeness must be proven per `TESTING.md` (authorization matrix completeness check) |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | Permission matrix test (actor × object × action × context × state) per REQ-026 AC; UI-bypass attempt → audited denial per REQ-024 AC |
| Cross-reference | RSK-102 (shared root cause: missing context) |

### TC-08 — Entitlement bypass
**STRIDE mapping (PROPOSED):** Elevation of privilege.

| Field | Value |
|---|---|
| Asset | A-05 (licenses/entitlements/extensions — commercial value); tier-gated capabilities (Equipment Store, CRM, finance, IMS) |
| Actor | AC-03/AC-05 user on a lower tier; user on expired/downgraded license; AC-11 malicious insider |
| Entry point | Tier-gated endpoints — Developer Equipment Store (REQ-010), CRM/finance (`LICENSE_MATRIX.md` §2), IMS; extension-gated features; license state transitions (REQ-098) |
| Trust boundary | TB-3, TB-7 (platform-level entitlement data vs tenant use) |
| Threat | Accessing tier-gated features via API despite UI hiding (RSK-103); Equipment Store access from accounts without a basic miniRider license (REQ-010 demands audited API denial); stale entitlement surviving expiry/downgrade; extensions activated without purchase |
| Impact (`PROPOSED`) | High — direct commercial value and product-trust damage |
| Likelihood (`PROPOSED`) | Medium — rank-2 product risk (RSK-103) |
| Control (planned/target) | REQ-024 (server-side entitlement on every tier difference); REQ-010 (Equipment Store blocked at API level for other tiers — audited denial, not hidden menus); REQ-030 (two stores fully isolated: data, access, API; cross-access denied); REQ-098 (license lifecycle state machine — parameters OD-108 `OPEN`); REQ-099 (downgrade: no silent data loss, features locked server-side); `ENTITLEMENT_MODEL.md` (tier/capability/extension separation, effective-access formula, enforcement point); `SECURITY.md` "Store security" |
| Residual risk (`PROPOSED`) | Needs monitoring — final downgrade/grace parameters await OD-108; enforcement is entirely unimplemented (`NOT TESTED`) |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | REQ-010 AC: Equipment Store API access by maxRider/ISOrider accounts and by hiRider portal users without a basic miniRider license → audited denial; REQ-024 AC: UI bypass → audited denial; license transition tests (REQ-098); downgrade data behavior tests (REQ-099) |
| Cross-reference | RSK-103 (rank 2), RSK-107, RSK-111, OD-108 |

### TC-09 — hiRider privacy leakage
**STRIDE mapping (PROPOSED):** Information disclosure.

| Field | Value |
|---|---|
| Asset | A-04 (candidate profiles, skills, portfolio, experience, applications, status history, shortlists, decisions) |
| Actor | AC-03/AC-04 workspace members (sift phase); AC-06 other candidates; AC-01 if visibility is misconfigured; AC-09 platform staff (insider misuse) |
| Entry point | Candidate discovery/search; profile views; application lists; shortlists; export paths (OD-143/OD-111/OD-166 `OPEN`) |
| Trust boundary | TB-3, TB-6, TB-7 (candidate data spans the platform-level portal and workspace-level recruitment) |
| Threat | Profile/application data visible beyond the visibility settings (REQ-062); application content exposed to other candidates; shortlist/decision leakage to wrong parties; large-scale contact-data harvesting (contact-data policy OD-134 `OPEN`); privacy obligations unvalidated (RSK-113/OD-09) |
| Impact (`PROPOSED`) | High — privacy-sensitive personal data of candidates |
| Likelihood (`PROPOSED`) | Medium |
| Control (planned/target) | REQ-062 (profile visibility control — visible only per settings, tested); REQ-013 (application status never changes workspace permissions); `ARCHITECTURE.md` §6 rules (profile visibility/privacy must be explicit); `SECURITY.md` "hiRider security" (separate profile visibility, opening visibility, application privacy, shortlist, decision); OD-109 (default visibility & abuse policy — `OPEN`; privacy-safe recommendation on record: private by default); `LEGAL_REGULATORY_REGISTER.md` (parallel Task 2-d) for privacy obligations (OD-09) |
| Residual risk (`PROPOSED`) | Needs monitoring — visibility defaults and abuse policy await OD-109; legal validation awaits OD-09 (RSK-113) |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | Privacy tests per REQ-062 AC; cross-candidate isolation tests; visibility matrix tests; export scope tests once OD-111/OD-143/OD-166 are decided |
| Cross-reference | RSK-113, OD-109, OD-134, OD-09 |

### TC-10 — Fake/abusive recruitment
**STRIDE mapping (PROPOSED):** Spoofing (fake openings/recruiters/candidates) + Repudiation + abuse.

| Field | Value |
|---|---|
| Asset | A-04 (candidate data, candidate time & trust); workspace reputation; platform trust |
| Actor | Fake recruiter/workspace harvesting candidate personal data (phishing); fake candidates (fabricated profiles/portfolios); AC-12 scraping bots |
| Entry point | Recruitment opening publication (REQ-063); application submission (REQ-064); candidate discovery |
| Trust boundary | TB-1/TB-2 (recruitment surfaces), TB-3, TB-6 |
| Threat | Fake openings used to phish candidate data (drawing contact off-platform); spam/fake applications flooding a workspace pipeline; abusive content; impersonation of legitimate workspaces |
| Impact (`PROPOSED`) | High — candidate privacy + platform trust (recruitment portals are a known phishing vector — desk judgment) |
| Likelihood (`PROPOSED`) | Medium |
| Control (planned/target) | REQ-063 (only open recruitment can receive applications; owner opens/closes; closing preserves history); REQ-064 (application lifecycle: valid transitions only, invalid denied, owner sees status); `SECURITY.md` "hiRider security" (separation of visibility/decision objects); OD-109 (blocking/report abuse policy — `OPEN`) |
| Residual risk (`PROPOSED`) | **Unacceptable — proposed for treatment:** the Phase 1 baseline has **no dedicated requirement** for reporting/blocking abusive recruitment actors (gap already recorded in `USE_CASES.md` notes). Proposed treatment: owner decision via OD-109 plus a candidate new requirement (owner approval required — not invented here) |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | REQ-063 AC: application on a closed opening denied; REQ-064 AC: invalid lifecycle transitions denied; abuse-report/block workflow tests (pending the proposed treatment) |
| Cross-reference | OD-109; `USE_CASES.md` gap note (report/block abuse hiRider without dedicated REQ) |

### TC-11 — Workspace membership escalation
**STRIDE mapping (PROPOSED):** Elevation of privilege.

| Field | Value |
|---|---|
| Asset | A-03 (workspace data), membership records and roles |
| Actor | AC-03 member attempting self-promotion; AC-05 multi-workspace kru; attacker with a leaked/stale invite |
| Entry point | Invite acceptance (REQ-051); membership lifecycle transitions (REQ-049); role assignment |
| Trust boundary | TB-3, TB-6 |
| Threat | Accepting an invite into a different role than offered; reusing expired/used invite tokens; membership surviving removal/suspension; recruitment acceptance auto-granting workspace access (forbidden invariant) |
| Impact (`PROPOSED`) | High |
| Likelihood (`PROPOSED`) | Medium |
| Control (planned/target) | REQ-051 (signed, single-use, expiring invite tokens bound to workspace + offered role); REQ-049 (membership lifecycle invite→accept→suspend→remove→leave with immediate access change; removed member loses access on next request); `MASTER_CONTROL.md` §1 / `ARCHITECTURE.md` §6 invariant: `Acceptance != Automatic Workspace Access`; membership follows explicit workspace authorization; `AUTHORIZATION_MODEL.md` (role change authority, role inheritance) |
| Residual risk (`PROPOSED`) | Needs monitoring |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | REQ-051 AC: used/expired invite links rejected; invites cannot change role without authorization. REQ-049 AC: each status transition changes effective access. Invariant test (mandatory per `TESTING.md`): recruitment acceptance does NOT create workspace membership |
| Cross-reference | — (carries `MASTER_CONTROL.md` §1 invariants) |

### TC-12 — Event assignment escalation
**STRIDE mapping (PROPOSED):** Elevation of privilege + Information disclosure.

| Field | Value |
|---|---|
| Asset | A-03 event-scoped data (chat, rundown, media kit, reports — REQ-008) |
| Actor | AC-03 member without assignment; AC-05 kru assigned to event A seeking event B; multi-assigned kru during context switch (REQ-007) |
| Entry point | Event-scoped endpoints (chat/rundown/media kit/report per REQ-008); event context switching (REQ-007) |
| Trust boundary | TB-6 (workspace boundary) with the **inner event-assignment boundary** (see §3, TB-6 notes) |
| Threat | Member without assignment reading event data (REQ-050: kru only see assigned events); context switch leaking other events' data; assignment creation by unauthorized roles |
| Impact (`PROPOSED`) | High — event data may contain client-confidential information |
| Likelihood (`PROPOSED`) | Medium |
| Control (planned/target) | REQ-050 (assignment separate from membership; access denied to unassigned members — test matrix); REQ-007 (context indicator; context switch must not leak other events — isolation test); REQ-008 (event page functions denied to non-members); `AUTHORIZATION_MODEL.md` (event context as policy input per REQ-026) |
| Residual risk (`PROPOSED`) | Needs monitoring |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | REQ-050 AC test matrix (event data access denied for unassigned member); REQ-007 AC (context-switch isolation test) |
| Cross-reference | RSK-102 (shared tenant-scope root cause), OD-130 (double-assignment policy — `OPEN`, operational) |

### TC-13 — Store purchase/entitlement fraud
**STRIDE mapping (PROPOSED):** Tampering + Repudiation.

| Field | Value |
|---|---|
| Asset | A-05 (licenses/entitlements/extensions), A-06 (orders, issuance records) |
| Actor | AC-01/AC-12 buyer attempting forged/replayed purchase; AC-07 malicious developer (collusion scenario); automated abuse |
| Entry point | Store order/purchase endpoints (Public Store + Developer Equipment Store); entitlement issuance; extension activation |
| Trust boundary | TB-2, TB-7 (platform-level commerce domains) |
| Threat | Obtaining an entitlement without a valid purchase (replay, forged confirmation, client-side price tampering); duplicate issuance via race; Equipment Store purchase from accounts without a basic miniRider license |
| Impact (`PROPOSED`) | High — direct commercial value |
| Likelihood (`PROPOSED`) | Medium — with an explicit limitation: production payment gateway is undecided (OD-06 `OPEN`), so payment-specific fraud (gateway abuse, chargebacks, refund abuse) is **out of scope** until OD-06; this category covers entitlement-issuance integrity only |
| Control (planned/target) | REQ-030 (two stores isolated — data/access/API; cross-access denied, tested); `ARCHITECTURE.md` §7 (product/catalog/order/purchase abstraction, entitlement issuance, audit trail); REQ-024/REQ-010 (server-side checks); `LICENSE_MATRIX.md` §6 (server-side enforcement); `ENTITLEMENT_MODEL.md` (issuance lifecycle, idempotency of issuance) |
| Residual risk (`PROPOSED`) | Needs monitoring — the payment-integration fraud surface cannot be modeled until OD-06 (gateway/pricing/refund all `OPEN`) |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | REQ-030 AC: cross-store access denied; issuance idempotency (duplicate purchase does not double-issue); entitlement issued only from a valid order state; audit trail completeness of issuance |
| Cross-reference | RSK-107, OD-06, OD-133 |

### TC-14 — Developer role abuse
**STRIDE mapping (PROPOSED):** Elevation of privilege.

| Field | Value |
|---|---|
| Asset | A-06 (catalogs/listings), A-10 (developer-targeted notifications — REQ-017), platform trust |
| Actor | AC-07 developer exceeding scope; compromised developer account; AC-11 malicious insider |
| Entry point | Developer Portal console (REQ-058); catalog management (REQ-016); developer notification targeting (REQ-017) |
| Trust boundary | TB-7 (platform-level actor boundary vs tenant data) |
| Threat | Developer role attempting to modify licenses/billing, broadcast globally, or read tenant workspace data (all explicitly forbidden by REQ-031); developer notification abuse; planting malicious content into listings/media |
| Impact (`PROPOSED`) | High — platform-level authority misused |
| Likelihood (`PROPOSED`) | Medium — privileged-role abuse includes the compromised-account vector (desk judgment) |
| Control (planned/target) | REQ-031 (Developer Portal ≠ license/billing/broadcast rights; separate role; least privilege; everything audited; denial tests); REQ-052 (developer role separate from workspace roles and broadcast rights; cross-role access denied); REQ-058 (portal is a separate console with its own auth; grants no billing/license rights — tested); REQ-017 (targeted notifications: access rights, mandatory recipient preview, restrictions, audit log, dedup/idempotency, delivery status, anti-abuse); `SECURITY.md` "Store security"; `AUTHORIZATION_MODEL.md` (role separation) |
| Residual risk (`PROPOSED`) | Needs monitoring — final role model (single developer role with sub-permissions vs separate store-manager/portal-admin roles) awaits OD-101 `OPEN` |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | REQ-031 AC: developer role cannot change billing/global notifications — audited denial; REQ-052 AC: role-matrix separation, cross-role denied; REQ-058 AC: portal grants no billing/license rights |
| Cross-reference | RSK-121 (broadcast abuse), OD-101, OD-102 |

### TC-15 — Price/catalog manipulation
**STRIDE mapping (PROPOSED):** Tampering.

| Field | Value |
|---|---|
| Asset | A-06 (catalogs, prices, orders); commercial integrity; buyer trust |
| Actor | AC-07 developer with listing rights; attacker via compromised developer account; AC-11 malicious insider |
| Entry point | Developer Portal catalog/price/discount management (REQ-016, REQ-056); listing publication workflow (REQ-055); public store surfaces |
| Trust boundary | TB-7, TB-1 (published catalog) |
| Threat | Unauthorized/unapproved price or discount changes; bypassing the draft→published control to push unreviewed listings (REQ-055); client-side price tampering at order time (order total not revalidated server-side); loss of historical price integrity (no old→new audit) |
| Impact (`PROPOSED`) | High — commercial integrity |
| Likelihood (`PROPOSED`) | Medium |
| Control (planned/target) | REQ-056 (stock/price/discount managed with full audit trail: actor + time + old/new values; no invented default values); REQ-055 (listing lifecycle draft/published/archived; controlled publication, audited); REQ-016 (portal changes fully audited with actor+timestamp); `ARCHITECTURE.md` §7 (catalog listing, availability, audit trail); OD-133 (price/discount approval authority — `OPEN`); OD-06 (final commercial values blocked — nothing invented here) |
| Residual risk (`PROPOSED`) | Needs monitoring — price/discount approval authority awaits OD-133 |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | REQ-056 AC: every price/stock/discount change recorded with actor+time+old/new; REQ-055 AC: unpublished listings not visible in-app; server-side order-total revalidation test |
| Cross-reference | OD-133, OD-06, RSK-110 (commercial decisions delay) |

### TC-16 — Notification abuse
**STRIDE mapping (PROPOSED):** Spoofing (impersonation via notifications) + DoS (spam) + Information disclosure.

| Field | Value |
|---|---|
| Asset | A-10 (notification channels, audience data, delivery queue), user trust/attention, platform messaging budget |
| Actor | AC-07 developer role (REQ-017 channel); workspace roles with broadcast capability; compromised accounts; AC-12 automated abuse |
| Entry point | Notification composition/send endpoints (audience model REQ-059); delivery mechanics (REQ-060); preferences (REQ-061) |
| Trust boundary | TB-3, TB-5 (external delivery providers), TB-7 (developer channel) |
| Threat | Sending to wrong or excessive audience (spam); duplicate sends; impersonating/phishing content delivered through the trusted platform channel; ignoring opt-out for optional types; cost abuse of external delivery |
| Impact (`PROPOSED`) | Medium — trust erosion, spam, provider cost; impersonation via official channel raises effective severity (phishing vector) |
| Likelihood (`PROPOSED`) | Low — consistent with RSK-121 desk rating |
| Control (planned/target) | REQ-059 (audience model: whole workspace / selected workspaces / selected users; mandatory recipient preview — sending without preview impossible); REQ-060 (dedup/idempotency key, delivery status queued/sent/failed, controlled retry); REQ-061 (preferences & opt-out for optional types; mandatory types per OD-102); REQ-017 (developer notifications: rights, preview, restrictions, audit, anti-abuse); OD-102 (mandatory vs optional types, broadcast approval authority — `OPEN`); OD-139 (broadcast anti-abuse limits — `OPEN`); RSK-121 mitigation set |
| Residual risk (`PROPOSED`) | Needs monitoring — approval authority and anti-abuse limits await OD-102/OD-139; escalate before any Phase 22 notification release if still undecided |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | REQ-059 AC: send without preview impossible; recipient count shown before send. REQ-060 AC: duplicate send idempotent (no double messages). REQ-061 AC: opt-out honored for optional types |
| Cross-reference | RSK-121, OD-102, OD-139 |

### TC-17 — Audit/evidence tampering
**STRIDE mapping (PROPOSED):** Tampering + Repudiation.

| Field | Value |
|---|---|
| Asset | A-07 (documents, IMS records, locked evidence, sign-off attribution), A-08 (audit trails) |
| Actor | Workspace roles attempting to edit approved/locked records; AC-11 malicious insider with DB access; auditor-boundary write attempts |
| Entry point | Document/evidence APIs (REQ-027, REQ-043, REQ-083); audit log storage; auditor access path |
| Trust boundary | TB-3, TB-4 (immutability must survive application-layer bugs), TB-8 |
| Threat | Editing/deleting approved records or locked evidence (must be impossible — amendments only); forging sign-off attribution (actor+role+time+context+version binding); audit-trail gaps (sensitive actions without audit events); auditor write attempts |
| Impact (`PROPOSED`) | High — IMS integrity and accountability (legal strength of sign-off is a separate legal question — OD-103/OD-09, not a security claim) |
| Likelihood (`PROPOSED`) | Medium |
| Control (planned/target) | REQ-027 (approved records immutable; corrections via amendment/version history; edit/delete via API denied — tested); REQ-083 (evidence locked after sign-off; amendment adds audited version; sign-off binds actor+role+time+context+version); REQ-082 (controlled view/download with access log; ACL enforced); REQ-081 (retention & disposition per policy — OD-104 `OPEN`); REQ-044/REQ-053/REQ-084 (auditor read-only, scoped, time-bound; write denied — tested); `ARCHITECTURE.md` §9 (immutable approved records; audit events for sensitive transitions); OD-136 (self-approval prohibition — `OPEN`); OD-138 (audit log retention/access — `OPEN`) |
| Residual risk (`PROPOSED`) | Needs monitoring — audit log retention/access policy awaits OD-138/OD-164; application-level immutability must be reinforced at the database layer, whose physical design depends on OD-01 `OPEN` |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | REQ-027 AC: approved record edit/delete via API rejected; REQ-083 AC: locked evidence immutable, amendment versioned, sign-off binding complete; REQ-044 AC: auditor access expires automatically, writes denied; audit-trail completeness sampling per NFR-06 |
| Cross-reference | RSK-114 (sign-off legal overclaim), OD-103, OD-136, OD-138, OD-164 |

### TC-18 — Replay
**STRIDE mapping (PROPOSED):** Spoofing + Tampering.

| Field | Value |
|---|---|
| Asset | A-01/A-02 (OTP, tokens), A-05 (entitlement issuance), A-10 (notification sends), invite tokens, non-idempotent API mutations |
| Actor | Eavesdropping/replaying attacker (AC-01/AC-11); AC-12 automated abuse |
| Entry point | OTP verify; OAuth callbacks; invite acceptance (REQ-051); order/purchase endpoints; notification send; any non-idempotent mutation |
| Trust boundary | TB-2, TB-5, TB-7 |
| Threat | Replaying captured OTP/token/invite/purchase/notification requests to duplicate effects (double issuance, double sends, invite reuse) |
| Impact (`PROPOSED`) | High — OTP replay is authentication compromise; purchase replay is commercial fraud |
| Likelihood (`PROPOSED`) | Medium |
| Control (planned/target) | REQ-021 (OTP single-use + anti-replay); REQ-051 (single-use invite tokens); REQ-060 (dedup/idempotency key for notifications); `ARCHITECTURE.md` §10 (anti-replay target control); `API_ARCHITECTURE.md` (idempotency and concurrency are required topics per prompt §12) |
| Residual risk (`PROPOSED`) | Needs monitoring — per-endpoint idempotency coverage must be fixed in `API_ARCHITECTURE.md` (parallel document) |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | OTP replay rejected (REQ-021 AC); invite reuse rejected (REQ-051 AC); duplicate notification send idempotent (REQ-060 AC); duplicate purchase does not double-issue entitlement |
| Cross-reference | — |

### TC-19 — Race conditions
**STRIDE mapping (PROPOSED):** Tampering (integrity violation).

| Field | Value |
|---|---|
| Asset | A-03 (event/rundown/chat concurrent edits), A-05 (issuance/extension activation), asset reservations (REQ-065), membership/seat transitions |
| Actor | Legitimate users racing each other; attacker deliberately timing concurrent requests |
| Entry point | Concurrent mutations: reservation endpoints, application submission, role/membership changes, license state transitions (REQ-098), chat/rundown editing (REQ-008), invite acceptance against seat quota (REQ-009) |
| Trust boundary | TB-3, TB-4, TB-6 |
| Threat | Double-booking of assets (REQ-065 requires conflict prevention); duplicate applications/memberships; inconsistent license/entitlement states; lost updates in concurrent editing; seat-quota bypass via concurrent invites |
| Impact (`PROPOSED`) | Medium — integrity/consistency; escalates toward High where quota or entitlement is bypassed |
| Likelihood (`PROPOSED`) | Medium |
| Control (planned/target) | REQ-065 (reservation conflict prevention with a documented resolution policy — OD-107 `OPEN`); `ARCHITECTURE.md` §9 (optimistic concurrency/versioning for mutable critical records); prompt §12 API topics (idempotency, concurrency — owned by `API_ARCHITECTURE.md`); REQ-098 (defined state machine reduces race-induced license-state corruption) |
| Residual risk (`PROPOSED`) | Needs monitoring — conflict-resolution policies await OD-107/OD-130/OD-131; physical database concurrency characteristics depend on OD-01 `OPEN` |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | Concurrent reservation test (overlapping booking rejected/warned per policy — REQ-065 AC); concurrent invite-to-quota test (REQ-009 enforcement); duplicate application submission test; concurrent license-transition test (REQ-098) |
| Cross-reference | RSK-105 (sync conflicts — related), RSK-122 (realtime chat architecture), OD-107, OD-130, OD-131 |

### TC-20 — Offline/sync authorization (future — OD-07 OPEN)
**STRIDE mapping (PROPOSED):** Elevation of privilege.

| Field | Value |
|---|---|
| Asset | A-11 (offline sync queues — future), A-03/A-07 (data written offline: evidence, checklists, asset scans) |
| Actor | Field kru with cached client data; attacker with a stolen device; attacker tampering the local queue |
| Entry point | Local action queue on the client; future sync endpoints |
| Trust boundary | TB-2 (client-local storage is outside the server trust boundary), TB-3 (sync-time re-evaluation) |
| Threat | Offline actions performed without rights being accepted at sync without re-authorization (REQ-038 AC explicitly requires rejection at sync); cached data readable on a stolen device; tampered queue injecting actions; conflict resolution accepting unauthorized actions |
| Impact (`PROPOSED`) | High |
| Likelihood (`PROPOSED`) | Medium — **conditional**: active only if OD-07 approves offline support; otherwise the category is void |
| Control (planned/target) | REQ-038 (if offline is supported: secure local queue, sync indicator, conflict reconciliation, idempotency, audit, **permission enforced at sync**); `MASTER_CONTROL.md` §8; NFR-12; OD-07 (`OPEN`); OD-02 (client delivery affects the local-storage model — `OPEN`); OD-183 (interim offline UI behavior — `OPEN`) |
| Residual risk (`PROPOSED`) | Needs monitoring — scope itself awaits OD-07 (`UNKNOWN-NEEDS DECISION` until then). Proposed hard gate: **no offline feature release without sync-time authorization tests** (REQ-038 AC) |
| Test/evidence (`PROPOSED` — `NOT TESTED`, conditional on OD-07) | Offline action without permission rejected at sync; cross-device sync tests; conflict reconciliation tests (REQ-038 AC) |
| Cross-reference | RSK-105, RSK-119, OD-07, OD-02, OD-183 |

### TC-21 — Malicious file upload
**STRIDE mapping (PROPOSED):** Tampering (+ persistent threat host; DoS via storage exhaustion).

| Field | Value |
|---|---|
| Asset | A-03 (media kits, asset condition photos REQ-066), A-06 (store listing media REQ-057), A-07 (evidence attachments REQ-083), platform infrastructure |
| Actor | AC-03/AC-04/AC-05/AC-06 any role with upload rights (incl. candidate portfolios); AC-07 developer (listing media) |
| Entry point | Media upload endpoints (REQ-057); evidence upload (REQ-083); asset condition capture (REQ-066); media kits/portfolios |
| Trust boundary | TB-2, TB-5 (file/object storage), TB-6 |
| Threat | Uploading malicious executables/scripts disguised as allowed types; content-type spoofing; oversized uploads (storage exhaustion — quota OD-137 `OPEN`); stored XSS via crafted filenames/metadata; archive bombs; malware hosting via store listings or portfolios |
| Impact (`PROPOSED`) | High — a stored payload can pivot to other users/platform |
| Likelihood (`PROPOSED`) | Medium |
| Control (planned/target) | REQ-057 (media limits by type/size per platform policy — disallowed types rejected; media bound to its listing); OD-137 (storage quota per tier — `OPEN`); `ARCHITECTURE.md` §10 (secure provider abstraction); `API_ARCHITECTURE.md` (validation); OD-142 (sensitive metadata capture policy — `OPEN`, linked to OD-09). **Candidate control gap (proposed, not yet a baseline requirement):** content inspection/malware scanning of uploads and serving user content from an isolated origin — flagged for owner consideration (a new requirement/OD would be needed; none invented here) |
| Residual risk (`PROPOSED`) | Needs monitoring — type/size policy parameters await OD-137; the scanning/isolated-origin control is only a candidate (unowned) today |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | REQ-057 AC: disallowed type rejected; oversized upload rejected; filename/metadata sanitization tests; stored-content delivery tests (no executable content-type served from app origin) |
| Cross-reference | OD-137, OD-142, RSK-113 (sensitive metadata legal view) |

### TC-22 — Secrets exposure
**STRIDE mapping (PROPOSED):** Information disclosure.

| Field | Value |
|---|---|
| Asset | A-09 (OAuth client secrets, OTP provider credentials, storage credentials, signing keys, DB credentials) |
| Actor | AC-11 malicious insider; attacker via code/config/log leak; CI/CD exposure |
| Entry point | Repository & configuration (Phase 0 evidence: `.env` exists with one key, redacted, untracked); logs (REQ-095 forbids secrets in logs); error output; client bundles (web is first-class — anything shipped to the browser is public) |
| Trust boundary | TB-4, TB-5, TB-7 |
| Threat | Secrets committed to the repository; secrets in logs/error output; secrets embedded in the client bundle; provider credential leakage |
| Impact (`PROPOSED`) | High — platform-wide compromise |
| Likelihood (`PROPOSED`) | Medium |
| Control (planned/target) | `ARCHITECTURE.md` §10 (secrets server-side); `SECURITY.md` "Phase 2 target security architecture" (secrets boundary); REQ-095 (observability without secrets in logs — incidents traceable without exposing secrets); REQ-092 (security baseline incl. secrets management); Phase 0 redaction discipline as current practice |
| Residual risk (`PROPOSED`) | Needs monitoring — secrets-management tooling/process not yet designed; hosting/deployment environment undecided (OD-10 `OPEN`) |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | Log sanitization audit (can secrets appear in logs? — NFR-05 checklist); client-bundle scan for embedded secrets; repository secret scanning in CI (once CI exists — currently `NOT FOUND`) |
| Cross-reference | RSK-115 (no CI), OD-10, OD-01 |

### TC-23 — Dependency/supply-chain risk
**STRIDE mapping (PROPOSED):** Tampering — a compromised dependency can enable any other category.

| Field | Value |
|---|---|
| Asset | Entire platform (code integrity); A-09 (secrets reachable from compromised code) |
| Actor | Upstream package maintainer (compromised/malicious); attacker via dependency confusion/typosquatting; build-pipeline attacker |
| Entry point | Package installation (bun/npm dependency tree); build process; future CI/CD |
| Trust boundary | TB-7 (platform build/deployment boundary) |
| Threat | Malicious or compromised dependency executing in application context (full data/secret access); known-vulnerable dependency exploited; dependency confusion; compromised build artifacts. Current-state evidence: dependency tree in place (Next.js 16.1.1, React 19, Prisma 6.11.1, `next-auth` present but unimplemented — `SECURITY.md` "Current state"); `ignoreBuildErrors: true` tracked as a quality risk; **no CI/dependency scanning/SAST evidence** |
| Impact (`PROPOSED`) | High — potential full platform compromise |
| Likelihood (`PROPOSED`) | Medium — typical for JavaScript ecosystems (desk judgment) |
| Control (planned/target) | NFR-01 (dependency scanning in CI as measurement approach); RSK-115 mitigation (CI lint+test+build in Phase 3); RSK-118 + OD-04 (disable `ignoreBuildErrors` after types are clean; testing foundation Phase 3); lockfile discipline (current state: `bun.lock` present — `VERIFIED` Phase 0). **Candidate control gap (proposed, not yet a baseline requirement):** automated dependency vulnerability scanning + SAST gate in CI, pinned versions policy, SBOM generation — owner consideration requested |
| Residual risk (`PROPOSED`) | **Unacceptable — proposed for treatment (current state):** no dependency scanning/SAST exists today (`SECURITY.md` "Current state": `NOT FOUND`). Proposed treatment: CI pipeline with automated dependency scanning and SAST **before first production deployment** (already tracked via RSK-115/RSK-118 and the Phase 0 gap register) |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | CI dependency vulnerability scan; SAST run; lockfile integrity check; SBOM generation (candidate control) |
| Cross-reference | RSK-115, RSK-118, OD-04 |

### TC-24 — Insecure direct object reference / enumeration (SUPPLEMENTARY — cross-cutting)
> Supplementary category — added beyond the prompt §11 mandatory list, as a cross-cutting concern that compounds TC-06/TC-07/TC-08.

**STRIDE mapping (PROPOSED):** Information disclosure + Elevation of privilege.

| Field | Value |
|---|---|
| Asset | All addressable objects: events, riders, media kits, assets, documents, evidence, applications, orders, entitlements |
| Actor | AC-01 (public-surface enumeration), AC-02..AC-06 (object-reference manipulation) |
| Entry point | Any endpoint accepting object identifiers; public store surfaces; recruitment opening listings |
| Trust boundary | TB-3, TB-6, TB-7 |
| Threat | Guessing/manipulating object references to reach another tenant's or another user's objects (IDOR); enumerating users/workspaces/openings/orders via sequential identifiers or differential responses |
| Impact (`PROPOSED`) | High — classic and high-prevalence web vulnerability class (desk judgment) |
| Likelihood (`PROPOSED`) | Medium |
| Control (planned/target) | Cross-cutting application of REQ-023 (isolation), REQ-026 (per-object authorization), REQ-050 (assignment scoping), REQ-082 (document ACLs); `ARCHITECTURE.md` §9 (UUID/strong identifiers — to be fixed in a Phase 2 ADR); `AUTHORIZATION_MODEL.md` (resource ownership, object-level checks); `API_ARCHITECTURE.md` (enumeration-safe error model) |
| Residual risk (`PROPOSED`) | Needs monitoring — object-level authorization must be verified endpoint by endpoint; identifier strategy is an open Phase 2 ADR topic |
| Test/evidence (`PROPOSED` — `NOT TESTED`) | IDOR matrix: for each object type, attempt access using other tenants'/users' identifiers → denied + audited; enumeration probes receive uniform responses |
| Cross-reference | RSK-102, RSK-103 (shared root causes) |

---

## 7. Control summary matrix

Owning documents in **bold** are sibling Phase 2 documents written in parallel — referenced by name only.

| TC | Category | Primary controls (planned/target) | Owning architecture doc | Supporting docs |
|---|---|---|---|---|
| TC-01 | Authentication abuse | REQ-054, REQ-021, REQ-047; rate-limit/anti-abuse boundary | **API_ARCHITECTURE.md** | SECURITY.md, AUTHORIZATION_MODEL.md |
| TC-02 | Session theft | REQ-048 (lifecycle, revoke); OD-115 parameters | **API_ARCHITECTURE.md** | SECURITY.md |
| TC-03 | Account takeover | REQ-047 (recovery/fallback without takeover path) | **AUTHORIZATION_MODEL.md** | SECURITY.md, API_ARCHITECTURE.md |
| TC-04 | OAuth account linking abuse | REQ-022 (state/nonce/issuer/audience/signature/expiry/redirect/linking) | SECURITY.md | API_ARCHITECTURE.md |
| TC-05 | WhatsApp OTP abuse (vendor-neutral) | REQ-021; provider abstraction + token/security requirements + rate-limit boundary + recovery/fallback (OD-03) | SECURITY.md | API_ARCHITECTURE.md, AUTHORIZATION_MODEL.md |
| TC-06 | Tenant isolation failure | REQ-023, REQ-025; tenant context in every evaluation; explicit tenant ownership per entity | **AUTHORIZATION_MODEL.md** | DATA_MODEL_CONCEPT.md, SECURITY.md, API_ARCHITECTURE.md |
| TC-07 | Authorization bypass | REQ-026, REQ-024; deny-by-default policy layer; permission vocabulary | **AUTHORIZATION_MODEL.md** | SECURITY.md |
| TC-08 | Entitlement bypass | REQ-024, REQ-010, REQ-030, REQ-098, REQ-099; effective-access formula; enforcement point | **ENTITLEMENT_MODEL.md** | SECURITY.md, LICENSE_MATRIX.md, API_ARCHITECTURE.md |
| TC-09 | hiRider privacy leakage | REQ-062, REQ-013; explicit visibility separation; OD-109 defaults | **AUTHORIZATION_MODEL.md** | SECURITY.md, LEGAL_REGULATORY_REGISTER.md (OD-09) |
| TC-10 | Fake/abusive recruitment | REQ-063, REQ-064; OD-109 blocking/report policy — **treatment proposed (gap)** | SECURITY.md | AUTHORIZATION_MODEL.md |
| TC-11 | Workspace membership escalation | REQ-051 (secure invites), REQ-049 (lifecycle); `Acceptance != Automatic Workspace Access` | **AUTHORIZATION_MODEL.md** | SECURITY.md |
| TC-12 | Event assignment escalation | REQ-050, REQ-007, REQ-008; event context as policy input | **AUTHORIZATION_MODEL.md** | SECURITY.md |
| TC-13 | Store purchase/entitlement fraud | REQ-030 (store isolation); order/issuance abstraction + audit; issuance idempotency | **ENTITLEMENT_MODEL.md** | ARCHITECTURE.md §7, SECURITY.md |
| TC-14 | Developer role abuse | REQ-031, REQ-052, REQ-058, REQ-017; role separation/least privilege; OD-101 | **AUTHORIZATION_MODEL.md** | SECURITY.md |
| TC-15 | Price/catalog manipulation | REQ-056, REQ-055, REQ-016; publication lifecycle; OD-133 approval authority | **ENTITLEMENT_MODEL.md** | SECURITY.md (Store security) |
| TC-16 | Notification abuse | REQ-059, REQ-060, REQ-061, REQ-017; OD-102/OD-139 limits | **API_ARCHITECTURE.md** | SECURITY.md |
| TC-17 | Audit/evidence tampering | REQ-027, REQ-083, REQ-082, REQ-081, REQ-044/053/084; immutability + amendment/versioning; OD-136/OD-138 | **DATA_MODEL_CONCEPT.md** | SECURITY.md, ARCHITECTURE.md §9 |
| TC-18 | Replay | REQ-021, REQ-051, REQ-060; anti-replay; idempotency | **API_ARCHITECTURE.md** | ARCHITECTURE.md §10 |
| TC-19 | Race conditions | REQ-065, REQ-098; optimistic concurrency/versioning; OD-107/OD-130/OD-131 policies | **API_ARCHITECTURE.md** | DATA_MODEL_CONCEPT.md |
| TC-20 | Offline/sync authorization (future) | REQ-038 (permission enforced at sync); OD-07 scope gate | **API_ARCHITECTURE.md** | AUTHORIZATION_MODEL.md |
| TC-21 | Malicious file upload | REQ-057 (type/size limits); OD-137 quota; validation; candidate scanning control (proposed) | **API_ARCHITECTURE.md** | SECURITY.md |
| TC-22 | Secrets exposure | Secrets server-side; secrets boundary; REQ-095 (no secrets in logs); REQ-092 | SECURITY.md | ARCHITECTURE.md §10, OPERATIONS.md |
| TC-23 | Dependency/supply-chain risk | NFR-01 dependency scanning in CI; RSK-115/RSK-118 CI foundation; OD-04 | SECURITY.md | TESTING.md, NON_FUNCTIONAL_REQUIREMENTS.md |
| TC-24 | IDOR / enumeration (supplementary) | REQ-023, REQ-026, REQ-050, REQ-082; UUID/strong identifiers (Phase 2 ADR); enumeration-safe errors | **AUTHORIZATION_MODEL.md** | API_ARCHITECTURE.md, DATA_MODEL_CONCEPT.md |

---

## 8. Out of scope / open items

Each item below is excluded from this threat model's assertions for the stated reason; the threat is either not assessable yet or is owned elsewhere.

| Item | Reason (one line) |
|---|---|
| OD-02 — client delivery strategy | Final client technology and client-hardening specifics are undecided; this model stays client-neutral (OD-02 does not block Phase 2); final strategy belongs to an ADR, Phase 23 depends on it. |
| OD-03 — vendor-specific WhatsApp integration | Provider selection, credentials, configuration and provider-specific production tests are blocked; TC-05 models only the vendor-neutral abstraction. |
| OD-07 — offline scope | Offline-first is undecided; TC-20 is explicitly conditional and void unless offline is approved. |
| OD-09 — legal/regulatory validation | Legal applicability and compliance conclusions are excluded; engineering-level privacy threats are captured (TC-09, TC-21) and full legal treatment belongs to `LEGAL_REGULATORY_REGISTER.md` (parallel Task 2-d). |
| OD-110 — auditor access terms | Default scope, maximum duration and NDA process are undecided; TB-8/TC-17 assume read-only + scoped + time-bound only. |
| OD-139 — broadcast anti-abuse limits | Numeric send limits and approval workflow are undecided; TC-16 defines the escalation path but not the limits. |
| OD-142 — sensitive metadata capture | Whether evidence captures location/sensitive metadata is undecided; TC-21 treats the metadata surface as worst case. |
| OD-166 — security classification / export limits | Export classification and size/frequency limits are undecided (linked OD-111); export abuse is only partially modeled (TC-09, TC-24). |
| ISO verification (OD-160) | Standards verification remains `BLOCKED` (Phase 0 evidence F0-012); no clause-level ISO compliance threat modeling is attempted; REQ-040 (no verbatim standards text) is respected as a content rule, not a threat category. |

**Parameter-level open decisions that shape control parameters but do not block this model:** OD-05 (seat counting → TC-19 quota race), OD-06 (payment specifics → TC-13), OD-10 (hosting → TC-22/TC-23), OD-101/OD-102 (developer role & broadcast authority → TC-14/TC-16), OD-103/OD-136/OD-138/OD-164 (sign-off & audit retention → TC-17), OD-107/OD-130/OD-131 (conflict policies → TC-19), OD-108 (downgrade behavior → TC-08), OD-109 (hiRider visibility & abuse defaults → TC-09/TC-10), OD-115 (session parameters → TC-02), OD-133 (price approval → TC-15), OD-134 (application contact data → TC-09), OD-137 (storage quota → TC-21), OD-183 (interim offline UI → TC-20).

---

## 9. Anti-hallucination statement

1. **No security testing has been executed in Phase 2.** No penetration test, no scan (SAST/DAST/dependency), no runtime probing, no code review of production security features (none exist). Every test/evidence entry in this document is a `PROPOSED` idea for later phases and is marked `NOT TESTED`. This document is an architectural threat model, not a security test report.
2. **No quantitative risk scores.** All impact/likelihood/residual ratings are qualitative and `PROPOSED`; the scoring methodology awaits owner approval (§2).
3. **No invented vendors.** No WhatsApp OTP provider is named or implied — "WhatsApp OTP" reflects the channel named in REQ-021, while the provider remains OD-03 `OPEN` and is modeled vendor-neutrally. Google Sign-In is named because REQ-022 already names it (an existing requirement, not an invention). No payment gateway, hosting provider, or security tooling vendor is named.
4. **No invented decisions or identifiers.** Every OD-xxx, RSK-xxx, REQ-xxx, STD, F0 and UC reference in this document already exists in `OPEN_DECISIONS.md`, `RISK_REGISTER.md`, `REQUIREMENTS.md`, `STANDARD_REGISTER.md`, `PHASE_0_AUDIT_REPORT.md` or `USE_CASES.md`. No new OD/RSK/REQ IDs are created here; treatment proposals are flagged as proposals requiring owner approval (TC-10, TC-21, TC-23).
5. **Current-state claims** are limited to Phase 0 evidence as recorded in `SECURITY.md` "Current state" and `PHASE_0_AUDIT_REPORT.md` (e.g., no implemented auth; `.env` present, redacted, untracked; `bun.lock` present; no CI/dependency scanning/SAST evidence).
6. **Sibling Phase 2 documents** (`AUTHORIZATION_MODEL.md`, `ENTITLEMENT_MODEL.md`, `API_ARCHITECTURE.md`, `DATA_MODEL_CONCEPT.md`, `LEGAL_REGULATORY_REGISTER.md`) are referenced by name only — they are being written in parallel; no dependency on their internal structure is assumed and no claim is made about their content.
7. **Taxonomy compliance:** hiRider is treated strictly as a recruitment portal/capability, never as a license or tier; only miniRider/maxRider/ISOrider are license tiers; Public Store requires a basic miniRider license; Developer Equipment Store is miniRider-only. UI hiding is never treated as a security control.

---

## 10. Sources

- Control baseline (owner-reconciled, source of truth): `MASTER_CONTROL.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `LICENSE_MATRIX.md`, `SECURITY.md`, `TESTING.md`, `CONTROL_CONSISTENCY_MATRIX.md`, `PHASE_2_DEPENDENCY_MATRIX.md`, `PHASE_2_ACCEPTANCE.md`.
- Phase 2 prompt: `upload/phase2_extract/epicRider_Phase_2_Prompt_zai.md` (§11 threat model — mandatory categories and per-threat fields; §5 do-not-over-block rules; §16 anti-hallucination; §18 validation searches).
- Phase 1 artifacts: `REQUIREMENTS.md` (REQ-001..100), `RISK_REGISTER.md` (RSK-101..125), `OPEN_DECISIONS.md` (OD-01..OD-184 index), `NON_FUNCTIONAL_REQUIREMENTS.md` (NFR-01..16), `UX_REQUIREMENTS.md` (UXR-14/18 anti-mockup), `UX_UI_STANDARD.md` (§2.5 anti-mockup), `USE_CASES.md` (gap note on recruitment abuse), `PROCESS_MAP.md` (PROC-205 information security), `DOCUMENT_EVIDENCE_MODEL.md`.
- Phase 0 evidence: `PHASE_0_AUDIT_REPORT.md`, `PHASE_0_GAP_REGISTER.md` (via RISK_REGISTER cross-references).
