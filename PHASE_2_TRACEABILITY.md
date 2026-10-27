# PHASE 2 TRACEABILITY

Phase 2 must preserve Phase 1 traceability.

## Inputs
- MASTER_CONTROL.md
- ARCHITECTURE.md
- DECISIONS.md
- ROADMAP.md
- REQUIREMENTS.md
- LICENSE_MATRIX.md
- SECURITY.md
- TESTING.md
- UX_REQUIREMENTS.md
- UX_UI_STANDARD.md
- PERSONAS_AND_JOURNEYS.md
- USE_CASES.md
- PROCESS_MAP.md
- DOCUMENT_EVIDENCE_MODEL.md
- NON_FUNCTIONAL_REQUIREMENTS.md
- RISK_REGISTER.md
- OPEN_DECISIONS.md
- TRACEABILITY_MATRIX.md
- PHASE_1_REPORT.md

## Requirement rule

Phase 1 currently contains REQ-001..REQ-100 according to ROADMAP evidence.
Phase 2 MUST NOT revert the requirement register to the old 46-item seed set.

If IDs changed during Phase 1, use the existing Phase 1 canonical register and trace old IDs through its mapping rather than inventing a new numbering system.

## Traceability chain

`Requirement → Use Case/Persona → Domain Capability → Bounded Context → Data Concept → API Boundary → Security Control → Test/Evidence`

Phase 2 does not need every requirement fully implemented. It must identify the architecture impact and unresolved questions.

---

**Addendum status:** `PROPOSED` (Phase 2, Task 2-g — Requirements/Traceability Engineer). Everything below this line is appended content; the owner-provided skeleton above ("Inputs", "Requirement rule", "Traceability chain") is preserved verbatim.

## A. Requirement → architecture mapping (REQ-001..REQ-100)

**Method:** persona/UC mappings are reused exactly from Phase 1 `TRACEABILITY_MATRIX.md` (no UC IDs invented; Phase 1 coverage status is noted where it was PARTIAL or NOT TRACED). Architecture anchors cite the finalized Phase 2 deliverables: `DATA_MODEL_CONCEPT.md` (DMC), `AUTHORIZATION_MODEL.md` (AUTHZ), `ENTITLEMENT_MODEL.md` (ENT), `THREAT_MODEL.md` (TC-xx / TB-x), `API_ARCHITECTURE.md` (API), `ADR_REGISTER.md` (ADR-006..017), `LEGAL_REGULATORY_REGISTER.md` (LR-xx). REQ IDs REQ-001..REQ-100 are preserved unrenumbered (see Section D).

**Conventions:** "enforcement #n" = AUTHZ §11 enforcement-point inventory row n. API scope classes per API §3.2: platform-scoped / workspace-scoped / user-scoped / developer-portal-scoped; resource areas per API §18. All test/evidence ideas are `PROPOSED — NOT TESTED`.

### REQ-001..REQ-010

| REQ | Phase 1 trace (persona / UC) | Bounded context(s) | Data concept anchor | API boundary (area + scope class) | Security control anchor | Test/evidence idea |
|---|---|---|---|---|---|---|
| REQ-001 | P-01..P-12; UC-2001, UC-3001; PARTIAL (cross-cutting) | cross-cutting — all 17 (single platform foundation) | single domain model, no per-tier parallel DB (DMC §2.8; Workspace as tenant root) | one API surface for all tiers, all resource areas (API §3.1) | AUTHZ §7 tenant isolation; ENT §11 cross-tier continuity; TC-06 | Schema audit: one domain model, zero per-tier tables; login-able desktop/tablet/mobile — PROPOSED, NOT TESTED |
| REQ-002 | P-01, P-02; UC-2001, UC-5006 | Entitlement & License | License state machine (DMC §6.2); forward compatibility (§10.4) | platform-scoped license state/issuance records | ENT §11 cross-tier data continuity (REQ-002 cited); TC-08 | mini→max upgrade: 100% old data accessible, no manual migration — PROPOSED, NOT TESTED |
| REQ-003 | P-02; UC-2002, UC-2007 | Workspace/Tenant + Event, Asset, Membership (5 nav areas) | Workspace + Event + Asset + Membership + User entities | workspace-scoped workspace/events/assets/memberships/profile | AUTHZ §4.2 workspace.read/update; TC-06 (supporting) | Home/Event/Asset/Team/Profile navigation end-to-end in one workspace — PROPOSED, NOT TESTED |
| REQ-004 | P-02, P-07; UC-2003 | Technical Rider | TechnicalRider + RiderItem; published requires event (DMC §3.9) | workspace-scoped riders (event-linked) | AUTHZ §4.9 rider.publish (event required); enforcement #20; TC-24 | Publish rider without event → server-side rejection; draft without event persists — PROPOSED, NOT TESTED |
| REQ-005 | P-02, P-04; UC-2004 | Media Kit | MediaKitTemplate + MediaKit (event mandatory, DMC §3.10) | workspace-scoped media kits (event-linked) | AUTHZ §4.10 mediakit.create (event required); enforcement #21; TC-21 | Kit created from template; save without event rejected — PROPOSED, NOT TESTED |
| REQ-006 | P-05, P-07; UC-2005 | Asset | Asset, AssetCategory, AssetSet/AssetSetItem (miniRider register subset, DMC §3.8) | workspace-scoped assets and set templates | AUTHZ §4.8 asset.create/read/update + asset.template.manage; TC-24 | Asset CRUD + set template with ≥2 assets; set↔asset relations consistent — PROPOSED, NOT TESTED |
| REQ-007 | P-03; UC-1006 | Event & Assignment | EventAssignment + "my assignments" access pattern (DMC §3.4) | workspace-scoped assignments; inner event-assignment boundary | AUTHZ §4.4 event.context.switch + event.read; enforcement #10; TC-12 | Crew with ≥2 assignments switches context; other events' data denied (isolation test) — PROPOSED, NOT TESTED |
| REQ-008 | P-03, P-04; UC-2006 | Event & Assignment | RundownItem + EventChatMessage + EventReport (DMC §3.4) | workspace-scoped events: rundown/chat/reports (realtime channel = future work, API §18 note) | AUTHZ §4.4 event.chat/rundown/report permissions; enforcement #10; TC-12 | 4 event-page functions work in-context; non-member 403 — PROPOSED, NOT TESTED |
| REQ-009 | P-02; UC-1005, UC-2007 | Membership & Roles + Entitlement & License | Seat + TierQuota + quota concept (DMC §8; owner-counting OD-05 OPEN) | workspace-scoped memberships/invitations; quota check on create/invite | ENT §6 seat/quota enforcement; enforcement #8; TC-19 | 6th invite on full 5-kru miniRider workspace → server-side denial with clear message — PROPOSED, NOT TESTED |
| REQ-010 | P-07, P-08; UC-5001 | Developer Commerce/Store | EquipmentListing family, isolated from Public Store (DMC §4.6) | platform-scoped equipment store API (miniRider-only) | AUTHZ §4.12 store.equipment.access; enforcement #13; TC-08 | Non-miniRider session (maxRider/ISOrider; hiRider portal user) calls store API → audited denial, not hidden menu — PROPOSED, NOT TESTED |

### REQ-011..REQ-020

| REQ | Phase 1 trace (persona / UC) | Bounded context(s) | Data concept anchor | API boundary (area + scope class) | Security control anchor | Test/evidence idea |
|---|---|---|---|---|---|---|
| REQ-011 | P-02; UC-3001..3008, UC-4001..4005; TRACED (represented by maxRider UC set) | Finance/Commercial + Asset (+ Membership: dynamic roles) | CRM entity set + full Asset lifecycle (DMC §6.4) vs mini register subset | workspace-scoped finance and asset areas (maxRider-gated) | ENT §5 maxRider = mini core − Equipment Store + advanced; enforcement #12; TC-08 | maxRider suite on same domain; miniRider regression passes; Equipment Store denied — PROPOSED, NOT TESTED |
| REQ-012 | P-10; UC-7005, UC-7008, UC-7009 | IMS | Process→Control→Workflow chain + full §3.16 entity set | workspace-scoped IMS area (ISOrider-gated) | ENT §5 ISOrider = max + IMS; AUTHZ §4.16; TC-17 | ≥1 full Process→Control→Workflow→Transaction→Evidence→Report cycle end-to-end — PROPOSED, NOT TESTED |
| REQ-013 | P-03, P-02; UC-6003, UC-6004 | hiRider Recruitment | Application — no FK to Membership/EventAssignment (DMC §4.3) | platform-scoped applications + workspace-scoped received-applications views | AUTHZ §8 hiRider invariants; enforcement #29; TC-09 | Accepted application leaves applicant's workspace permissions unchanged (server-side test) — PROPOSED, NOT TESTED |
| REQ-014 | P-03, P-02; UC-6002 | Workspace/Tenant + Membership & Roles + hiRider | workspace.create within license limits (OD-123); RecruitmentOpening close keeps history (DMC §3.7) | workspace-scoped workspace creation + openings management | AUTHZ §4.2 workspace.create (REQ-014) + §4.7 opening.close; TC-11 (supporting) | Close recruitment stops new applications without deleting data; multi-workspace per license — PROPOSED, NOT TESTED |
| REQ-015 | P-12; UC-5003; PARTIAL (no full landing UC) | Developer Commerce/Store (public surfaces) | UX-driven — Phase 3+/22; nearest: platform-scoped landing content (API §3.2 cites REQ-015) | platform-scoped landing content | UX-driven; nearest anchor: TC-24 enumeration-safe public surface | All landing CTAs resolve to real data/actions; anti-fake-button review = 0 findings — PROPOSED, NOT TESTED |
| REQ-016 | P-07; UC-5003 | Developer Commerce/Store | Product + CatalogListing (publication audited, DMC §3.12) | developer-portal-scoped catalog management | AUTHZ §4.12 store.catalog.manage; DeveloperRoleAssignment; enforcement #17; TC-14 | Non-developer portal login denied; every catalog change → audit entry (actor+timestamp) — PROPOSED, NOT TESTED |
| REQ-017 | P-08; UC-5004 | Communication/Notification | NotificationMessage + NotificationAudience (preview mandatory, DMC §3.11) | developer-portal + workspace-scoped notification sends | AUTHZ §4.11 notification.broadcast.preview/send; enforcement #19; TC-16, TC-18 | Send without recipient preview impossible; duplicate send → 1 message; audit complete — PROPOSED, NOT TESTED |
| REQ-018 | P-02; UC-5006; PARTIAL (OD-06 commercial) | Extension (+ Developer Commerce/Store catalog) | ExtensionDefinition/ExtensionInstance canonical lifecycle (DMC §6.7); seat-package quota contribution (§8) | platform-scoped extension catalog/orders + workspace-scoped state views | ENT §7 extension lifecycle (additive, never a tier); AUTHZ §4.6; TC-13 | +10-seat extension activation raises quota atomically; commercial values left empty (OD-06) — PROPOSED, NOT TESTED |
| REQ-019 | P-01..P-12; UC-2007, UC-3003; PARTIAL (quality gate) | UX-driven — Phase 3+ design system; nearest: client-neutral API (web first-class) | UX-driven — Phase 3+; nearest: no client-specific fields in contracts (DMC §3.17) | client-neutral single API surface (API §2) | UX-driven — Phase 3+; nearest: API §2 web-first-class principle | 3-breakpoint responsive check (≥1280 / 768–1024 / 360–430), no layout breakage — PROPOSED, NOT TESTED |
| REQ-020 | P-07; UC-3003; PARTIAL (architecture constraint) | Integration/Sync (client-neutrality) + all resource areas | client-neutral contracts; no duplicated business logic (DMC §3.17 purpose) | single versioned API surface (D-1, D-6) | API §2 client-neutrality (REQ-020 cited: server-side-once); TC-24 | Second client consumes same contracts without copied authorization/billing logic (contract test) — PROPOSED, NOT TESTED |

### REQ-021..REQ-030

| REQ | Phase 1 trace (persona / UC) | Bounded context(s) | Data concept anchor | API boundary (area + scope class) | Security control anchor | Test/evidence idea |
|---|---|---|---|---|---|---|
| REQ-021 | P-01..P-12; UC-1001 | Identity | VerificationRequest (single-use, expiry, anti-replay, DMC §3.1) | platform-scoped auth/OTP endpoints (EX-1) | ADR-009 OTP abstraction; enforcement #1; TC-01, TC-05, TC-18 | OTP replay and expired token rejected; rate limit active; audit per attempt; vendor part OD-03 — PROPOSED, NOT TESTED |
| REQ-022 | P-01..P-12; UC-1002 | Identity | AuthenticationMethod (safe linking, DMC §3.1) | platform-scoped OAuth account-linking endpoints | ADR-008 identity/auth abstraction; TC-04 | Token with invalid signature/audience rejected; account linking not hijackable — PROPOSED, NOT TESTED |
| REQ-023 | P-08; UC-2001, UC-9001 | cross-cutting — all tenant-scoped contexts | tenant ownership principle (DMC §2.6); workspace_id anchoring | D-6 path-scoped tenant context + API §14 isolation | AUTHZ §7 tenant isolation (query scoping); TC-06 | Cross-tenant CRUD test matrix = 100% denied; no leakage in queries/logs — PROPOSED, NOT TESTED |
| REQ-024 | P-08; UC-5001, UC-5006, UC-3001 | Entitlement & License | CapabilityRule + EntitlementGrant; effective-access inputs (DMC §3.5) | policy chain on every request (API §5) | ENT §3 formula + §10 enforcement; enforcement #12; TC-07, TC-08 | Every tier-gated endpoint checks entitlement; UI bypass → audited denial — PROPOSED, NOT TESTED |
| REQ-025 | P-08; UC-1005, UC-1007 | Identity + Membership & Roles | User (global) vs Membership/Role/EventAssignment separation (DMC §4.1) | platform-scoped identity + workspace-scoped memberships | AUTHZ §5.1 separation invariants; TC-06 | One user = owner WS-A + kru WS-B + auditor WS-C, no role conflict — PROPOSED, NOT TESTED |
| REQ-026 | P-08; UC-1005, UC-1006, UC-2002, UC-3008 | cross-cutting — policy layer (all contexts) | Permission vocabulary + evaluation chain (AUTHZ §2; DMC §3.3) | policy chain at every boundary (API §5) | AUTHZ §2 evaluation model + §3 deny-by-default; TC-07 | actor×object×action×context×status matrix 100% pass; license change alters access — PROPOSED, NOT TESTED |
| REQ-027 | P-10, P-06; UC-7005, UC-7006, UC-4002 | Document/Evidence + Audit | immutable approved records + Amendment (DMC §2.5, §3.13) | workspace-scoped documents/evidence (locked-state rules) | ADR-015 audit/versioning; enforcement #24; TC-17 | PUT/DELETE on approved record → 403; amendment adds version + audit trail — PROPOSED, NOT TESTED |
| REQ-028 | P-01..P-12; UC-1001; PARTIAL (quality gate) | UX-driven (i18n) — nearest: cross-context text handling | UX-driven — Phase 3+; nearest: i18n-ready text handling (DMC §2.9; OD-12 default) | Accept-Language content negotiation (API §2 cites REQ-028) | UX-driven — Phase 3+; nearest: string-externalization principle (DMC §2.9) | Scan new screens = 0 hard-coded strings; ID locale complete from first feature — PROPOSED, NOT TESTED |
| REQ-029 | P-08 (eng); no UC — Phase 1 NOT TRACED (engineering constraint) | cross-cutting — migration governance (all contexts) | migration & data integrity principles (DMC §2.7, §10) | n/a — engineering process gate; schema evolves via reviewed versioned migrations only | ADR-006 / OD-01 scoping (only final physical migrations blocked) | Every schema change ships a reviewed, versioned migration; destructive push prohibited on data-bearing environments — PROPOSED, NOT TESTED |
| REQ-030 | P-01, P-07, P-08; UC-5001, UC-5006 | Developer Commerce/Store | two disjoint store entity families (DMC §4.6) | platform-scoped stores + developer-portal management — isolated surfaces | AUTHZ §9 store authorization; DMC §4.6 structural isolation; TC-13 | Cross-store access (data/API/role) 100% denied — PROPOSED, NOT TESTED |

### REQ-031..REQ-040

| REQ | Phase 1 trace (persona / UC) | Bounded context(s) | Data concept anchor | API boundary (area + scope class) | Security control anchor | Test/evidence idea |
|---|---|---|---|---|---|---|
| REQ-031 | P-07, P-08; UC-5003, UC-5002 | Identity + Developer Commerce/Store | DeveloperRoleAssignment (global grant; no billing path, DMC §3.1/§4.2) | developer-portal-scoped console | AUTHZ §5.3 platform roles + enforcement #18; TC-14 | Developer role attempts billing/broadcast change → 403 audited — PROPOSED, NOT TESTED |
| REQ-032 | P-01..P-12; UC-3008, UC-1005; PARTIAL (quality gate) | UX-driven — Phase 3+ design system | UX-driven — Phase 3+; nearest: risky actions as action sub-resources (API §4) | UX-driven; nearest: action sub-resource pattern for confirmable mutations | UX-driven — Phase 3+ (UX_UI_STANDARD) | All risky actions show confirmation (UI test); per-phase design review recorded — PROPOSED, NOT TESTED |
| REQ-033 | P-01..P-12; UC-2006; PARTIAL (quality gate) | UX-driven (a11y) — Phase 3+; WCAG 2.2 AA per REQ-033 | UX-driven — Phase 3+; nearest: state completeness + machine-readable errors | UX-driven; nearest: RFC 9457 error model (API §10) supports accessible messaging | UX-driven — Phase 3+ (LR-016 accessibility uncertainty) | Key-screen a11y audit: 0 automated violations + manual keyboard pass — PROPOSED, NOT TESTED |
| REQ-034 | P-01..P-12; UC-2006, UC-3003; PARTIAL (quality gate) | UX-driven (UI states) — Phase 3+ | UX-driven — Phase 3+; nearest: full-state representations + sync-pending states (API §15) | UX-driven; nearest: API §2 state completeness (REQ-034 cited) | UX-driven — Phase 3+; offline/sync state conditional on OD-07 | Per-screen state checklist (loading/empty/error/success/permission denied/offline/stale) 100% implemented and tested — PROPOSED, NOT TESTED |
| REQ-035 | P-01..P-12; UC-2007; PARTIAL (quality gate) | UX-driven (anti-mockup) — Phase 3+ | UX-driven — Phase 3+; nearest: KPIs derived from real data only (DMC §3.8) | UX-driven; nearest: resources bound to real domain data | UX-driven — Phase 3+ (UX_UI_STANDARD) | Anti-mockup review = 0 findings; demo data always labeled — PROPOSED, NOT TESTED |
| REQ-036 | P-05, P-03; UC-3002, UC-3003 | Asset | AssetIdentification (platform-unique QR; DMC §3.8, §6.4 T01) | workspace-scoped assets; scan/lookup endpoints (maxRider capability) | AUTHZ §4.8 asset.scan.execute / asset.lookup.execute; enforcement #12; TC-21 | generate→print→scan→lookup→check-in/out end-to-end on web and mobile — PROPOSED, NOT TESTED |
| REQ-037 | P-03; UC-3003, UC-2006; PARTIAL (OD-07) | Integration/Sync (+ UX field features) | SyncQueueItem (conditional, OD-07; DMC §3.17) | workspace-scoped areas + conditional sync path (API §15) | API §15 offline/sync considerations; TC-20 | Per-feature field evaluation document with mitigation decisions (cache/retry) recorded — PROPOSED, NOT TESTED |
| REQ-038 | P-03; no UC — Phase 1 NOT TRACED (OD-07) | Integration/Sync | SyncQueueItem + ConflictResolutionRecord; permission re-checked at sync (DMC §3.17) | user-scoped sync queues (conditional on OD-07) | AUTHZ §4.17 sync.queue.use / sync.reconcile + enforcement #32; TC-20 (hard-gate proposal) | Offline action without right rejected at sync; conflicts surfaced; cross-device sync tested — PROPOSED, NOT TESTED (OD-07 OPEN) |
| REQ-039 | P-10; UC-7011 | IMS | StandardRegisterEntry (verified-date gate; DMC §3.16) | workspace-scoped standards register (metadata only) | AUTHZ §4.16 ims.standard.read; OD-160 verification BLOCKED; LR-009 | Register entries carry source/edition/status/verified date; 0 verbatim text — PROPOSED, NOT TESTED (verification BLOCKED, OD-160) |
| REQ-040 | P-10; UC-7011 | IMS | ClauseMapping — metadata references only (DMC §3.16) | workspace-scoped clause-mapping endpoints | REQ-040 hard rule (zero verbatim standard text); LR-009 | Content scan = 0 verbatim standard text; references are metadata only — PROPOSED, NOT TESTED |

### REQ-041..REQ-050

| REQ | Phase 1 trace (persona / UC) | Bounded context(s) | Data concept anchor | API boundary (area + scope class) | Security control anchor | Test/evidence idea |
|---|---|---|---|---|---|---|
| REQ-041 | P-04, P-10; UC-8001, UC-8002 | IMS | SustainabilityMetric fields: source/unit/method/period/quality (DMC §3.16) | workspace-scoped sustainability metrics | AUTHZ §4.16 ims.kpi.record (source/unit/method mandatory); OD-105/OD-106 | Every metric stores source/unit/method/period; no carbon numbers without valid methodology — PROPOSED, NOT TESTED |
| REQ-042 | P-10; UC-7001, UC-7004 | Document/Evidence | DocumentHierarchyLevel + Document + library functions (DMC §3.13) | workspace-scoped document library | AUTHZ §4.13 document.*; TC-17 | ≥1 document per hierarchy level passes library flow end-to-end (search→preview→approval→process links) — PROPOSED, NOT TESTED |
| REQ-043 | P-03, P-10; UC-7005 | Document/Evidence | EvidenceRecord lifecycle (DMC §6.6) | workspace-scoped evidence records | AUTHZ §4.13 evidence.*; TC-17 | Full evidence flow tested; locked record rejects edit; amendment adds version — PROPOSED, NOT TESTED |
| REQ-044 | P-09; UC-1007, UC-7007 | Identity (AuditorAccessGrant) + Audit | AuditorAccessGrant (read-only, scoped, expiry; DMC §3.1) + AuditExportBundle (§3.14) | auditor read-only path (cross-cutting, TB-8) | AUTHZ §4.1 identity.auditoraccess.* + enforcement #26; TC-17 | Auditor access auto-expires; writes denied; scope limited to designated workspaces/documents — PROPOSED, NOT TESTED |
| REQ-045 | P-05; UC-3001, UC-3004, UC-3008 | Asset | full Asset lifecycle ASM mapping + RetirementRecord (DMC §6.4) | workspace-scoped assets/reservations/movements/maintenance | AUTHZ §4.8 asset.* incl. asset.retire; TC-19, TC-21 | Every lifecycle stage has status + audit trail; utilization/downtime KPIs from real data — PROPOSED, NOT TESTED |
| REQ-046 | P-06, P-02; UC-4001..4005, UC-3004 | Finance/Commercial | CustomerAccount/Inquiry/Quotation/Contract/SalesOrder/Invoice/Payment/Complaint/EventDossier (DMC §3.15) | workspace-scoped finance area (maxRider-gated) | AUTHZ §4.15 finance permissions; ENT maxRider gate; TC-13, TC-18, TC-19 | Operations modules tested per scope; dossier links transactions→evidence — PROPOSED, NOT TESTED |
| REQ-047 | P-01..P-12; UC-1003 | Identity | AccountRecoveryFlow (no takeover path; DMC §3.1) | platform-scoped recovery endpoints | ADR-008; enforcement #3; TC-03 | Recovery fallback cannot bypass verification; account stays with rightful owner — PROPOSED, NOT TESTED |
| REQ-048 | P-01..P-12; UC-1004 | Identity | Session (revocation effective next request; DMC §3.1) | user-scoped /me sessions (EX-9) | AUTHZ §4.1 identity.session.list/revoke + enforcement #4; TC-02 | Revoke → next request 401; expired session rejected — PROPOSED, NOT TESTED |
| REQ-049 | P-02, P-03; UC-1005 | Membership & Roles | Membership state machine INVITED→ACTIVE→SUSPENDED→REMOVED/LEFT (DMC §6.1) | workspace-scoped memberships/invitations | AUTHZ §4.2 workspace.member.* + enforcement #9; TC-11 | Every transition changes effective access immediately; removed member loses access on next request — PROPOSED, NOT TESTED |
| REQ-050 | P-04, P-03; UC-1006, UC-2002 | Event & Assignment | EventAssignment separate from Membership (DMC §4.1) | workspace-scoped assignments; inner event-assignment boundary | AUTHZ §4.4 event.read (assignment required) + enforcement #10; TC-12 | Member without assignment denied event data (test matrix) — PROPOSED, NOT TESTED |

### REQ-051..REQ-060

| REQ | Phase 1 trace (persona / UC) | Bounded context(s) | Data concept anchor | API boundary (area + scope class) | Security control anchor | Test/evidence idea |
|---|---|---|---|---|---|---|
| REQ-051 | P-02, P-03; UC-1005 | Membership & Roles | Invitation (signed, single-use, expiring, role-bound; DMC §3.3) | workspace-scoped invitations | AUTHZ enforcement #7; TC-18, TC-11 | Used/expired invite links rejected; token cannot alter role — PROPOSED, NOT TESTED |
| REQ-052 | P-07, P-08; UC-5003 | Identity + Developer Commerce/Store | DeveloperRoleAssignment (global, no workspace FK; DMC §4.2) | developer-portal-scoped console (portal.access) | AUTHZ §5.3 platform roles + §4.12 portal.access; TC-14 | Role matrix shows developer/workspace/broadcast separation; cross-role access denied — PROPOSED, NOT TESTED |
| REQ-053 | P-08, P-09; UC-1007 | Identity | AuditorAccessGrant (expiry sweep; DMC §3.1; parameters OD-110) | platform-scoped auditor grants | AUTHZ §4.1 identity.auditoraccess.grant/revoke + enforcement #26 | Access ends on time; scope expansion requires separate approval — PROPOSED, NOT TESTED |
| REQ-054 | P-01..P-12; UC-1001 | Identity + API boundary | VerificationRequest attempt counting + lockout (DMC §3.1) | platform-scoped auth endpoints + API §16 rate limiting (429 + Retry-After) | API §16 rate limiting (REQ-054 cited); enforcement #5; TC-01 | Repeated attempts beyond limit → temporary lockout; all attempts audited — PROPOSED, NOT TESTED |
| REQ-055 | P-07; UC-5001 | Developer Commerce/Store | EquipmentListing draft/published/archived (REQ-055-cited; DMC §3.12) | developer-portal-scoped listing management | AUTHZ §4.12 store.listing.* + enforcement #15; TC-15 | Draft listing invisible in app; every status transition audited — PROPOSED, NOT TESTED |
| REQ-056 | P-07; UC-5002 | Developer Commerce/Store | StockItem + PriceRecord (append-only change history; DMC §3.12) | developer-portal-scoped stock/price management | AUTHZ §4.12 stock/price manage + enforcement #16; OD-133; TC-15 | Every price/stock/discount change records actor+time+old/new; no invented defaults (OD-06) — PROPOSED, NOT TESTED |
| REQ-057 | P-07; UC-5001 | Developer Commerce/Store | ListingMedia (type/size policy, OD-137; DMC §3.12) | developer-portal-scoped listing media | API §11 upload validation; TC-21 | Disallowed media type rejected; media bound to its listing — PROPOSED, NOT TESTED |
| REQ-058 | P-07; UC-5003 | Identity + Developer Commerce/Store | DeveloperRoleAssignment + portal as separate console (DMC §4.2) | developer-portal-scoped console (separate authentication) | AUTHZ enforcement #17 (portal access role check); TC-14 | Portal login restricted to developer role; portal grants no billing/license rights — PROPOSED, NOT TESTED |
| REQ-059 | P-08; UC-5004 | Communication/Notification | NotificationAudience (preview snapshot + recipient count; DMC §3.11) | workspace-scoped broadcast sends | AUTHZ §4.11 notification.broadcast.preview + enforcement #19; TC-16 | Send without preview impossible; recipient count shown before send — PROPOSED, NOT TESTED |
| REQ-060 | P-08; UC-5004 | Communication/Notification + Integration/Sync | NotificationDelivery (queued/sent/failed) + IdempotencyRecord (DMC §3.11, §3.17) | workspace-scoped sends; Idempotency-Key (D-2, API §6) | API §6 idempotency (REQ-060 cited); TC-18, TC-16 | Duplicate send with same key → 0 double messages; status visible to authorized sender — PROPOSED, NOT TESTED |

### REQ-061..REQ-070

| REQ | Phase 1 trace (persona / UC) | Bounded context(s) | Data concept anchor | API boundary (area + scope class) | Security control anchor | Test/evidence idea |
|---|---|---|---|---|---|---|
| REQ-061 | P-03; UC-5005 | Communication/Notification | NotificationPreference (per-type opt-out; DMC §3.11; mandatory types = OD-102) | user-scoped notification preferences | AUTHZ §4.11 notification.preference.update; TC-16; LR-015 | Opt-out honored for optional types; mandatory types (per OD-102) still delivered — PROPOSED, NOT TESTED |
| REQ-062 | P-03; UC-6001, UC-6005 | hiRider Recruitment | CandidateProfile (visibility setting; default = OD-109; DMC §3.7) | user-scoped my-profile + platform-scoped visibility-filtered reads | AUTHZ §4.7 candidate.profile.* + enforcement #31; TC-09 | Private profile invisible to non-authorized users (server-side privacy test) — PROPOSED, NOT TESTED |
| REQ-063 | P-02, P-03; UC-6002, UC-6003 | hiRider Recruitment | RecruitmentOpening DRAFT→OPEN→PAUSED→CLOSED (PROPOSED states; DMC §5.2) | platform-scoped openings + workspace-scoped management | AUTHZ §4.7 opening.publish/close + enforcement #30; TC-10 | Application to closed opening rejected; closing preserves application history — PROPOSED, NOT TESTED |
| REQ-064 | P-02, P-03; UC-6004 | hiRider Recruitment | Application lifecycle (PROPOSED states) + ApplicationStatusHistory (DMC §5.2, §3.7) | platform-scoped applications; user-scoped my-applications | AUTHZ §4.7 application.* + enforcement #29; TC-10 | Invalid transitions rejected; applicant sees status + notifications; full history — PROPOSED, NOT TESTED |
| REQ-065 | P-05; UC-3005 | Asset | Reservation overlap detection (policy = OD-107; DMC §3.8) | workspace-scoped reservations; 409 on conflict (EX-5) | API §9 optimistic concurrency; TC-19 | Overlapping booking rejected/warned per OD-107; conflicts recorded — PROPOSED, NOT TESTED |
| REQ-066 | P-03, P-05; UC-3006 | Asset + Document/Evidence | AssetMovement (condition capture as evidence; DMC §3.8) | workspace-scoped check-in/out | AUTHZ §4.8 asset.checkout/checkin.execute; TC-21 | Check-out→returned transition tested; condition photo/notes linked to evidence — PROPOSED, NOT TESTED |
| REQ-067 | P-03; UC-3003 | Asset (+ UX scanner states) | scanner lookup flows; input-modality neutrality (API §2 cites REQ-067) | workspace-scoped scan endpoints + manual fallback path | API §2 input-modality neutrality; TC-21 | Camera denied → manual code entry fully functional; granted → scan works — PROPOSED, NOT TESTED |
| REQ-068 | P-05; UC-3007 | Asset | MaintenanceTicket + InspectionRecord (due/overdue derived; DMC §3.8) | workspace-scoped maintenance/calibration | AUTHZ §4.8 asset.maintenance.manage; TC-19 | Due/overdue items identified from data; completion recorded — PROPOSED, NOT TESTED |
| REQ-069 | P-05; UC-3007, UC-3001 | Asset | KPIs computed from movement/reservation time series (DMC §3.8 access patterns) | workspace-scoped KPI views | AUTHZ §4.8 asset.kpi.read; no unlabeled demo data (REQ-069) | KPIs match transaction data on test dataset; demo dataset labeled — PROPOSED, NOT TESTED |
| REQ-070 | P-10; UC-7005, UC-7011, UC-7008 | IMS | ProcessDefinition/ControlDefinition/WorkflowDefinition linked chain (DMC §3.16) | workspace-scoped IMS process objects | AUTHZ §4.16 ims.process/control.manage; TC-17 | ≥1 full chain process→control→workflow→transaction relation test — PROPOSED, NOT TESTED |

### REQ-071..REQ-080

| REQ | Phase 1 trace (persona / UC) | Bounded context(s) | Data concept anchor | API boundary (area + scope class) | Security control anchor | Test/evidence idea |
|---|---|---|---|---|---|---|
| REQ-071 | P-10; UC-7011 | IMS | StandardRegisterEntry (verified-date gate; DMC §3.16) | workspace-scoped standards register | AUTHZ §4.16 ims.standard.read; OD-160 verification BLOCKED | Standard without verified date cannot be used for mapping — PROPOSED, NOT TESTED |
| REQ-072 | P-10; UC-7011 | IMS | ClauseMapping (metadata-only; DMC §3.16) | workspace-scoped mapping endpoints | AUTHZ §4.16 ims.mapping.manage; LR-009 | Content scan = 0 verbatim text; mapping stored as metadata references — PROPOSED, NOT TESTED |
| REQ-073 | P-11, P-10; UC-7010 | IMS | SupplierRecord (qualification status + evidence; DMC §3.16) | workspace-scoped supplier records | AUTHZ §4.16 ims.supplier.qualify (OD-120); TC-24 | Supplier evaluation recorded with status + evidence; expiry flagged — PROPOSED, NOT TESTED |
| REQ-074 | P-10, P-04; UC-7010 | IMS + Membership & Roles / Event & Assignment | CompetencyRecord linked to Role/EventAssignment (gate check; DMC §3.16) | workspace-scoped competency records | AUTHZ §4.16 ims.competency.manage; assignment competency gate (DMC §3.16) | Assignment requiring competency blocked when record absent — PROPOSED, NOT TESTED |
| REQ-075 | P-10, P-04; UC-7008, UC-4005 | IMS | IncidentRecord→Ncr→Capa→EffectivenessCheck chain (DMC §3.16) | workspace-scoped incident/NCR/CAPA | AUTHZ §4.16 ims.ncr/capa.manage; TC-17 | One end-to-end case: incident→NCR→CAPA→effectiveness check→closure — PROPOSED, NOT TESTED |
| REQ-076 | P-10; UC-7009 | IMS | ManagementReview + ReviewActionItem (owner + status; DMC §3.16) | workspace-scoped management reviews | AUTHZ §4.16 ims.review.manage | Review stores inputs/outputs/actions; each action has owner + status — PROPOSED, NOT TESTED |
| REQ-077 | P-10; UC-7009 | IMS | ImprovementAction open→progress→verified→closed (REQ-077-cited; DMC §3.16) | workspace-scoped improvement actions | AUTHZ §4.16 ims.improvement.manage | Improvement actions tracked through full cycle; results evidence-linked — PROPOSED, NOT TESTED |
| REQ-078 | P-10; UC-7001 | Document/Evidence | DocumentHierarchyLevel (configurable, default D1..D8; DMC §3.13) | workspace-scoped document library configuration | AUTHZ §4.13 document.create; OD-144 granularity | Hierarchy customized per organization without code change; default structure exists — PROPOSED, NOT TESTED |
| REQ-079 | P-10; UC-7002 | Document/Evidence | Document 15-field metadata model + change history (DMC §3.13) | workspace-scoped document metadata | AUTHZ §4.13 document.*; TC-17 | All required fields validated per transition; complete change history — PROPOSED, NOT TESTED |
| REQ-080 | P-10, P-02; UC-7003, UC-7004 | Document/Evidence | DocumentVersion state machine (DMC §6.5) | workspace-scoped document versions + approval action sub-resources | AUTHZ §4.13 document.approve/supersede + enforcement #25; OD-136/OD-141; TC-17 | Superseded version unusable; scheduled review reminder appears — PROPOSED, NOT TESTED |

### REQ-081..REQ-090

| REQ | Phase 1 trace (persona / UC) | Bounded context(s) | Data concept anchor | API boundary (area + scope class) | Security control anchor | Test/evidence idea |
|---|---|---|---|---|---|---|
| REQ-081 | P-10; UC-7004 | Document/Evidence | RetentionClass + DispositionTask (periods = OD-104; DMC §3.13) | workspace-scoped retention management | AUTHZ §4.13 document.retention.manage; OD-104; LR-013 | Documents past retention enter disposition queue; execution audited — PROPOSED, NOT TESTED |
| REQ-082 | P-10, P-09; UC-7007, UC-7002 | Document/Evidence | DocumentAclEntry + view/download access logging (DMC §3.13) | workspace-scoped view/download (sensitive reads audited, API §4) | AUTHZ §4.13 document.read/download + enforcement #22; TC-17, TC-24 | Out-of-ACL access denied; every view/download logged (actor, time, object) — PROPOSED, NOT TESTED |
| REQ-083 | P-03, P-10; UC-7005, UC-7006 | Document/Evidence | EvidenceRecord lifecycle + SignOff + Amendment (DMC §6.6, §3.13) | workspace-scoped evidence records + sign-off actions | AUTHZ §4.13 evidence.sign/amend + enforcement #24; TC-17 | Locked evidence rejects edit/delete via API; amendment adds audited version; sign-off binds actor+role+time+context+version — PROPOSED, NOT TESTED |
| REQ-084 | P-09; UC-7007 | Audit (+ Identity) | AuditExportBundle (scope snapshot, checksum; DMC §3.14) | auditor read-only path + controlled export (TB-8) | AUTHZ §4.13 evidence.export + enforcement #26; OD-143; TC-17 | In-scope export succeeds; out-of-scope denied + audited — PROPOSED, NOT TESTED |
| REQ-085 | P-10; UC-8001, UC-8002 | IMS | SustainabilityMetric KPI dictionary fields (DMC §3.16) | workspace-scoped KPI definitions | AUTHZ §4.16 ims.kpi.define; OD-106 targets | Every KPI has complete definition; input without source/unit rejected — PROPOSED, NOT TESTED |
| REQ-086 | P-04, P-10; UC-8002 | IMS | measured/estimated flag + methodology link (DMC §3.16) | workspace-scoped KPI data entry | AUTHZ §4.16 ims.kpi.record; OD-105; LR-018 | Emission input without verified methodology rejected/labeled estimated + pending review — PROPOSED, NOT TESTED |
| REQ-087 | P-10; UC-8003 | IMS | ImprovementAction (result→evidence link; DMC §3.16) | workspace-scoped improvement actions | AUTHZ §4.16 ims.improvement.manage | Improvement loop tracked; results linked to evidence — PROPOSED, NOT TESTED |
| REQ-088 | P-08 (design); UC-2007, UC-1006; PARTIAL (design gate) | UX-driven (IA) — Phase 3+; nearest: API organized by context, not screens (API §3.1) | UX-driven — Phase 3+ design system; nearest: single API surface under per-tier navigation | UX-driven; nearest: resource naming by context (API §3.1 cites REQ-088) | UX-driven — Phase 3+ (OD-181 key-screen list) | Every screen has a single IA location; per-tier navigation structure approved — PROPOSED, NOT TESTED |
| REQ-089 | P-08 (design); UC-2001; PARTIAL (design gate) | UX-driven (design tokens) — Phase 3+ | UX-driven — Phase 3+ design system | UX-driven | UX-driven — Phase 3+ (OD-113 prototype permission) | Tokens defined and used by new components; deviations rejected at review — PROPOSED, NOT TESTED |
| REQ-090 | P-03; UC-3003 | UX-driven (scanner UX) — Phase 13; nearest: input-modality neutrality | UX-driven — Phase 3+/13; nearest: scan + manual-fallback flows (shared with REQ-067) | UX-driven; nearest: scan endpoints with manual fallback (API §2) | UX-driven — Phase 13 (OD-184 device matrix) | All scanner states tested (granted/denied/timeout/unknown code) — PROPOSED, NOT TESTED |

### REQ-091..REQ-100

| REQ | Phase 1 trace (persona / UC) | Bounded context(s) | Data concept anchor | API boundary (area + scope class) | Security control anchor | Test/evidence idea |
|---|---|---|---|---|---|---|
| REQ-091 | P-02; UC-2007; PARTIAL (process gate) | UX-driven (usability validation) — Phase 6+ | UX-driven; nearest: state completeness + error model enable heuristic review | UX-driven; nearest: RFC 9457 errors + full state coverage | UX-driven — Phase 6+ (OD-182) | Each major phase release has usability evaluation record (scenarios + findings) — PROPOSED, NOT TESTED |
| REQ-092 | P-08; UC-1001, UC-6005, UC-9001; PARTIAL (cross-cutting) | cross-cutting — Audit + Identity + all boundaries | AuditEvent + ProviderIntegrationConfig (secrets server-side; DMC §3.14, §3.17) | all boundaries (policy chain + API §13 audit) | SECURITY.md target controls; THREAT_MODEL §7 matrix; TC-22 | SECURITY checklist met per phase; negative tests on critical auth/authz paths — PROPOSED, NOT TESTED |
| REQ-093 | P-08; UC-9001; PARTIAL (OD-112) | UX/NFR-driven (performance) — nearest: Integration/Sync + API boundary | UX/NFR-driven; nearest: access-pattern strategy (DMC §9) | API §7 cursor pagination (D-4) + §16 limits; targets = OD-112 | n/a — NFR; OD-112 targets UNKNOWN-NEEDS DECISION | Baseline load test vs approved targets; results recorded — PROPOSED, NOT TESTED (targets pending OD-112) |
| REQ-094 | P-08; UC-9002 | UX/NFR-driven (backup/DR) — nearest: Audit + migration continuity | UX/NFR-driven; nearest: audit continuity across migrations (DMC §10.6) | n/a — NFR (no distinct API boundary) | n/a — NFR; OD-114 RPO/RTO PROPOSED (+OD-10 hosting) | Scheduled restore test succeeds; targets per owner decision — PROPOSED, NOT TESTED |
| REQ-095 | P-08; UC-9001 | Audit (+ API boundary) | AuditEvent (no secrets in payloads; DMC §3.14) | API §10 error model (traceId, no internal paths; REQ-095 cited) | AUTHZ §3 audit-trail hygiene; TC-22 | Incident traceable from logs without secret exposure; log scan = 0 secrets — PROPOSED, NOT TESTED |
| REQ-096 | P-08, P-02; UC-9003 | Integration/Sync | DataExportJob (scope/format = OD-111; DMC §3.17) | user-scoped export jobs (context 17) | AUTHZ §4.17 data.export/import + enforcement #33; OD-111/OD-166; TC-22 | Export/import round-trip per approved scope — PROPOSED, NOT TESTED (scope pending OD-111) |
| REQ-097 | P-07; UC-3003; PARTIAL (architecture constraint) | Integration/Sync (+ API boundary) | API versioning support cited in context purpose (DMC §3.17) | /api/v1 URL-path major versioning (D-1; API §12; Deprecation/Sunset headers) | ADR-016 API versioning (governance) | Breaking change → new major; old clients pass contract tests during transition — PROPOSED, NOT TESTED |
| REQ-098 | P-01, P-02; UC-5006 | Entitlement & License | License state machine PURCHASED→ACTIVE→RENEWAL_DUE→EXPIRED→GRACE→DOWNGRADED (DMC §6.2; params OD-108) | platform-scoped license state/issuance records | ENT §4 lifecycle + enforcement #27; TC-08 | Every license transition tested; access follows status per OD-108 — PROPOSED, NOT TESTED |
| REQ-099 | P-02, P-08; UC-5006 | Entitlement & License | downgrade data principles: restrict/archive/delete, no silent loss (DMC §10.3/§10.8) | platform-scoped entitlement + workspace-scoped feature locks | ENT §9 downgrade behavior + enforcement #28; TC-08 | Downgrade deletes nothing without decision; out-of-tier features locked server-side; data intact for re-upgrade — PROPOSED, NOT TESTED |
| REQ-100 | P-12; no UC — Phase 1 NOT TRACED (OD-06 scope) | Developer Commerce/Store (public surfaces) | tester/demo data separation: labeled, no real customer data (DMC §11 row 35) | platform-scoped landing/tester access (thin — flow undefined) | ENT §8/OD-06 scope; TC-24 | Tester environment separate and labeled; no real customer data — PROPOSED, NOT TESTED (scope pending owner decision, OD-06) |

---

## B. Coverage summary

**Bucket definitions** (this document's Phase 2 tracing view — distinct from the Phase 1 UC coverage status of `TRACEABILITY_MATRIX.md`):

- **Fully traced** — concrete named anchors exist for every chain link (persona/UC → bounded context → data concept → API boundary → security control). OD-governed parameters may remain (see Section C) but the architectural anchor for the REQ's scope is specified.
- **Partially traced** — at least one link is thin or conditional: no Phase 1 UC (Phase 1 coverage NOT TRACED), an architecture anchor conditional on an OPEN OD that blocks part of the acceptance criteria, or a cross-cutting constraint with no single domain anchor.
- **UX/NFR-driven** — primarily UX/visual or NFR requirement; Phase 2 supplies only the nearest architectural principle; main implementation belongs to the Phase 3+ design system / later phases.

### B.1 Bucket counts

| Bucket | Count | REQ IDs |
|---|---|---|
| Fully traced | 81 | REQ-002–REQ-014, REQ-016–REQ-018, REQ-020–REQ-027, REQ-030, REQ-031, REQ-036, REQ-039–REQ-048, REQ-049–REQ-060, REQ-062–REQ-069, REQ-070–REQ-087, REQ-092, REQ-095–REQ-099 |
| Partially traced | 6 | REQ-001 (cross-cutting platform constraint; Phase 1 PARTIAL), REQ-029 (Phase 1 NOT TRACED — engineering constraint; Phase 2 anchor = migration governance), REQ-037 (conditional on OD-07), REQ-038 (Phase 1 NOT TRACED; conditional on OD-07), REQ-061 (acceptance depends on OD-102 mandatory-type classification), REQ-100 (Phase 1 NOT TRACED; scope pending OD-06) |
| UX/NFR-driven | 13 | REQ-015, REQ-019, REQ-028, REQ-032, REQ-033, REQ-034, REQ-035, REQ-088, REQ-089, REQ-090, REQ-091, REQ-093, REQ-094 |

Total: 81 + 6 + 13 = **100/100 mapped** — no row left unmapped.

### B.2 Bounded-context coverage (all 17 contexts of ARCHITECTURE.md §3)

| # | Bounded context | Primary REQ anchors |
|---|---|---|
| 1 | Identity | REQ-021, REQ-022, REQ-025, REQ-047, REQ-048, REQ-052, REQ-053, REQ-054 |
| 2 | Workspace/Tenant | REQ-003, REQ-014, REQ-018 (landing extension), REQ-023 |
| 3 | Membership & Roles | REQ-009, REQ-049, REQ-051 (+REQ-050/REQ-074 cross-links) |
| 4 | Event & Assignment | REQ-007, REQ-008, REQ-050 |
| 5 | Entitlement & License | REQ-002, REQ-024, REQ-098, REQ-099 |
| 6 | Extension | REQ-018 (+REQ-009 seat packages, REQ-014 additional workspace) |
| 7 | hiRider Recruitment | REQ-013, REQ-014, REQ-062, REQ-063, REQ-064 |
| 8 | Asset | REQ-006, REQ-011, REQ-036, REQ-045, REQ-065–REQ-069 |
| 9 | Technical Rider | REQ-004 |
| 10 | Media Kit | REQ-005 |
| 11 | Communication/Notification | REQ-017, REQ-059, REQ-060, REQ-061 |
| 12 | Developer Commerce/Store | REQ-010, REQ-015, REQ-016, REQ-030, REQ-055–REQ-058, REQ-100 |
| 13 | Document/Evidence | REQ-027, REQ-042, REQ-043, REQ-078–REQ-084 (+REQ-066 evidence links) |
| 14 | Audit | REQ-084, REQ-092, REQ-095 (+REQ-027 immutability cross-cut) |
| 15 | Finance/Commercial | REQ-011, REQ-046 |
| 16 | IMS | REQ-012, REQ-039–REQ-041, REQ-070–REQ-077, REQ-085–REQ-087 |
| 17 | Integration/Sync | REQ-020, REQ-037, REQ-038, REQ-096, REQ-097 (+REQ-060 idempotency) |

**Observation:** no bounded context has zero REQ coverage. **Integration/Sync is the thinnest context** — its REQ set is dominated by conditional/NFR-adjacent requirements (REQ-038 conditional on OD-07; REQ-096 on OD-111; REQ-097 is the versioning constraint), consistent with the expectation that this context maps mostly to REQ-038/REQ-096 and activates primarily in later phases.

### B.3 Threat categories not referenced by any REQ (informational)

- **TC-23 (dependency/supply-chain risk)** is the only threat category with no direct REQ reference in THREAT_MODEL §7 — it is governed instead by NFR-01, RSK-115/RSK-118 and OD-04 (no dedicated REQ exists; adding one would need a new REQ ID > REQ-100).
- TC-20 (offline/sync authorization) is referenced only through REQ-038 and is conditional on OD-07.
- TC-24 (IDOR/enumeration) is supplementary/cross-cutting (referenced via REQ-023, REQ-026, REQ-050, REQ-082).
- All other TC-01..TC-22 map to at least one REQ (see Section A security-column citations).

### B.4 ADR coverage (ADR-006..ADR-017 ← REQ clusters)

| ADR | Topic | Traces back to REQ cluster |
|---|---|---|
| ADR-006 | Production database (OD-01; OPEN) | REQ-029 (+ physical layer of all REQs) |
| ADR-007 | Mobile/client strategy (OD-02; OPEN) | REQ-019, REQ-020, REQ-037, REQ-090 |
| ADR-008 | Identity/auth abstraction | REQ-021, REQ-022, REQ-047, REQ-048, REQ-054 |
| ADR-009 | WhatsApp OTP abstraction (OD-03) | REQ-021, REQ-054 |
| ADR-010 | Authorization model | REQ-023, REQ-024, REQ-025, REQ-026, REQ-031, REQ-052, REQ-053 (+ every permission-gated REQ via the 144-permission vocabulary) |
| ADR-011 | Entitlement model | REQ-002, REQ-009, REQ-010, REQ-011, REQ-012, REQ-018, REQ-024, REQ-098, REQ-099 |
| ADR-012 | hiRider domain boundary (ACCEPTED) | REQ-013, REQ-014, REQ-062, REQ-063, REQ-064 |
| ADR-013 | Public Store boundary (ACCEPTED) | REQ-010, REQ-015, REQ-016, REQ-030, REQ-055–REQ-058, REQ-098, REQ-100 |
| ADR-014 | Extension model (ACCEPTED structure) | REQ-018 (+REQ-009 seat packages, REQ-014 additional workspace) |
| ADR-015 | Audit & record versioning | REQ-027, REQ-079–REQ-084, REQ-092, REQ-095 |
| ADR-016 | API versioning | REQ-020, REQ-097 |
| ADR-017 | Concurrency & idempotency | REQ-009 (quota race), REQ-021 (anti-replay), REQ-051, REQ-060, REQ-065, REQ-098 (issuance) |

All 12 Phase 2 ADRs (ADR-006..ADR-017) trace back to at least one REQ cluster; no ADR is orphaned.

---

## C. Gaps and architectural questions surfaced by tracing

### C.1 REQs whose acceptance criteria imply architecture not yet fully specified (blocking ODs — existing IDs only)

| REQ | Not yet fully specified | Blocking OD / status |
|---|---|---|
| REQ-038 | offline-first sync (local queue, conflict reconciliation, sync-time authorization) — model + contracts exist but are conditional | OD-07 OPEN (TC-20 hard-gate proposal recorded) |
| REQ-037 | field-feature mitigation decisions (cache/retry) | OD-07 OPEN |
| REQ-061 | mandatory vs optional notification types (testable acceptance needs the classification) | OD-102 OPEN |
| REQ-100 | tester/demo access scope and data separation | OD-06 OPEN (scope sub-scope; DMC §11 row 35) |
| REQ-009 | owner seat-counting semantics | OD-05 OPEN |
| REQ-065 | reservation conflict resolution policy (hard-block / warning / hybrid) | OD-107 OPEN |
| REQ-098, REQ-099 | grace/renewal durations; downgrade data behavior (restrict/archive/delete) | OD-108 OPEN (+ commercial values OD-06) |
| REQ-021 | provider-specific OTP integration, credentials, provider-specific tests (abstraction itself is done) | OD-03 OPEN (blocked sub-scope only) |
| REQ-039, REQ-071 | standards verification (the verified-date gate cannot be satisfied yet) | OD-160 BLOCKED (environment) + OD-161 |
| REQ-081 | retention periods per class | OD-104 OPEN |
| REQ-014 | multi-workspace limits for non-crew users | OD-123 OPEN |
| REQ-093 | performance targets (and measurement method) | OD-112 OPEN (+ OD-162) |
| REQ-094 | backup/DR RPO/RTO | OD-114 OPEN (+ OD-10 hosting) |
| REQ-096 | import/export scope and format (+ export classification) | OD-111 OPEN (+ OD-166) |
| REQ-029 | final physical migration tooling | OD-01 OPEN (logical principles complete; ADR-006) |
| REQ-063, REQ-064 | Opening/Application lifecycle finalization (states are PROPOSED, not owner-approved) | no OD ID registered — candidate ADR (ADR_REGISTER §4 item 4; no ID invented) |
| REQ-055–REQ-057 | Equipment Store order/fulfillment model (listings/stock/media only are specified) | candidate (ADR_REGISTER §4 item 5; no OD ID) |
| REQ-062/REQ-064 (abuse handling) | report/block abuse has no dedicated REQ (UC-6005 gap); TC-10 treatment proposed | OD-109 governs defaults; candidate (ADR_REGISTER §4 item 6; no OD ID) |

### C.2 Phase 1 known gaps — status after Phase 2 tracing

- **REQ-029 — CLOSED at architecture level.** Phase 1 `TRACEABILITY_MATRIX.md` marked it NOT TRACED (engineering constraint, not a user flow; its own suggestion was to map it to phase exit criteria). Phase 2 now provides the anchor: DMC §2.7 (controlled-migrations principle) + §10 (migration & data integrity principles) + ADR-006/OD-01 scoping (only final physical DB selection/migrations blocked). It correctly remains without a UC; trace target = phase exit criteria and migration review gates.
- **REQ-038, REQ-100 — gap remains OPEN by design.** Still no UC (Phase 1 NOT TRACED). Phase 2 provides conditional architecture anchors only (SyncQueueItem/ConflictResolutionRecord; tester-data separation per DMC §11 row 35); flow design stays deferred pending OD-07 / OD-06.
- **Abuse report/block (hiRider marketplace) — gap confirmed still open.** Phase 1 `USE_CASES.md` §11 noted no dedicated REQ. Phase 2 confirms: AUTHORIZATION_MODEL §4.7 carries `marketplace.abuse.report` citing UC-6005 with "no dedicated REQ — known Phase 1 gap"; THREAT_MODEL TC-10 is rated Unacceptable-proposed-for-treatment; ADR_REGISTER §4 item 6 lists the moderation model as a candidate. Owner action requested: add a REQ (new ID > REQ-100) or accept the TC-10 treatment proposal.
- **REQ-015 (landing page) — flow gap remains.** Still no full UC (Phase 1 PARTIAL). Architecture anchor = platform-scoped landing-content boundary (API §3.2); flow design deferred to Phase 22.

### C.3 Requirements explicitly deferred to later phases by design (ROADMAP phases per REQUIREMENTS.md)

| Phase(s) | Deferred REQ clusters |
|---|---|
| 2 (this phase — architecture/contract portions only) | REQ-020, REQ-023, REQ-025, REQ-026, REQ-029, REQ-097 |
| 4 | REQ-021, REQ-022, REQ-047, REQ-048, REQ-049, REQ-050, REQ-051, REQ-052, REQ-054 |
| 5 | REQ-002, REQ-009, REQ-024, REQ-098, REQ-099 (+REQ-018 seat packages) |
| 6–10 | REQ-003, REQ-007, REQ-019, REQ-028, REQ-032–REQ-035, REQ-088, REQ-091 (6+); REQ-004 (7); REQ-006 (8); REQ-005 (9); REQ-008 (10) |
| 11 | REQ-010, REQ-030, REQ-055, REQ-056, REQ-057 |
| 12–15 | REQ-011, REQ-046 |
| 13 | REQ-036, REQ-045, REQ-065–REQ-069, REQ-090 (+REQ-037 evaluation portion) |
| 16 | REQ-013, REQ-014, REQ-062, REQ-063, REQ-064 |
| 17–21 | REQ-012, REQ-039, REQ-040, REQ-042, REQ-070–REQ-072, REQ-078–REQ-080, REQ-082 (17); REQ-043, REQ-044, REQ-053, REQ-081, REQ-083, REQ-084 (18); REQ-041, REQ-073, REQ-074, REQ-085–REQ-087 (19); REQ-075, REQ-076, REQ-077 (20) |
| 22 | REQ-015, REQ-016, REQ-017, REQ-058, REQ-059, REQ-060, REQ-061, REQ-100 |
| 23 | REQ-018 (mobile/client extension), REQ-037 (mobile portion) |
| 24 | REQ-038, REQ-096 |
| 25 | REQ-093, REQ-094, REQ-095 (formal testing) |

Multi-phase REQs (noted): REQ-092 spans 4+; REQ-020/REQ-097 implementation spans 2 and 6; REQ-023/REQ-025 span 2 and 4; REQ-026 spans 4 and 5; REQ-050 spans 4 and 6; REQ-007 spans 6 and 10; REQ-018 spans 5 and 23; REQ-093 spans 2 (targets) and 25 (testing).

---

## D. Chain integrity statement

1. **Chain completeness.** The chain `Requirement → Use Case/Persona → Domain Capability → Bounded Context → Data Concept → API Boundary → Security Control → Test/Evidence` is complete for all 100 requirements (REQ-001..REQ-100) in Section A: every REQ carries (a) a Phase 1 persona/UC trace reused verbatim from `TRACEABILITY_MATRIX.md` — or an explicit reason where none exists, (b) at least one of the 17 bounded contexts, (c) a named data concept (entity or state machine from `DATA_MODEL_CONCEPT.md`) or an explicit UX/NFR-driven marker with its nearest architectural anchor, (d) an API boundary (resource area + scope class from `API_ARCHITECTURE.md` §3/§18) or an explicit n/a reason, (e) a security control anchor (permission, enforcement point, entitlement rule, or TC), and (f) a PROPOSED test/evidence idea.
2. **Intentionally thin links (stated, not hidden):**
   - The 13 UX/NFR-driven REQs (Section B.1) have thin domain/data links by design — their home is the Phase 3+ design system and later implementation phases; each is mapped to its nearest architectural anchor (e.g. REQ-028 → API content negotiation + DMC §2.9 string externalization).
   - REQ-029, REQ-038 and REQ-100 have no Phase 1 use case (Phase 1 coverage NOT TRACED, by design: engineering constraint / OD-governed scope). They are anchored directly at architecture level (migration principles; sync model; tester-data separation) and their flow design remains deferred (Section C).
   - The "Domain Capability" link is expressed through the bounded-context column plus the Capability/CapabilityRule concepts (DMC §3.5) for entitlement-gated capabilities; the baseline defines no separate per-REQ capability catalog, and none was invented.
   - OD-governed parameters (Section C.1) leave specific acceptance criteria open but do not break chain links — the architectural anchor exists and the parameter is explicitly recorded as OPEN.
3. **No renumbering; 46→100 history preserved.** No REQ ID was renumbered, reused, or deleted. The 46 seed IDs were inherited unchanged as REQ-001..REQ-046 (per the `REQUIREMENTS.md` header note), REQ-047..REQ-100 were added during Phase 1, and Phase 1 `TRACEABILITY_MATRIX.md` maps all 100. This document maps all 100 to the Phase 2 architecture. The old 46-item seed set was never restored (per the "Requirement rule" above and the CONTROL_CONSISTENCY_MATRIX Phase 1 preservation rule).
4. **Evidence honesty.** All test/evidence ideas in Section A are `PROPOSED — NOT TESTED`. No epicRider implementation exists (current state NOT FOUND per Phase 0/Phase 2 audits); nothing in this document claims implementation, owner decision, vendor, price, or legal applicability. All architecture artifacts cited are themselves `PROPOSED` unless a control file or owner baseline states the rule explicitly.
