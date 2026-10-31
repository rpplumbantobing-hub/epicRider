# DATA MODEL CONCEPT — epicRider

**Document status:** `PROPOSED` — architectural proposal awaiting owner review / ADR acceptance (Phase 2, Task 2-a).
**Scope:** LOGICAL / CONCEPTUAL data model. Vendor-neutral. No physical database is selected, implied, or required by this document.
**Physical database selection is OPEN — OD-01** (per `DECISIONS.md` and `PHASE_2_DEPENDENCY_MATRIX.md`: OD-01 may block only final production DB selection and final physical migration implementation; it does not block this logical model).
**Author:** Data Architect agent (Task 2-a). **Control baseline:** the owner-installed reconciled control files (worklog Task 2-0, 2026-10-27) — `MASTER_CONTROL.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `LICENSE_MATRIX.md`, `SECURITY.md`, `TESTING.md`, `CONTROL_CONSISTENCY_MATRIX.md`, `PHASE_2_DEPENDENCY_MATRIX.md`.
**Evidence discipline:** every status label in this document is one of `VERIFIED / PARTIAL / NOT FOUND / NOT TESTED / BLOCKED / PROPOSED / UNKNOWN-NEEDS DECISION`. Nothing here claims implementation; the repository CURRENT STATE contains no epicRider data model (Phase 0 audit: schema = demo `User`/`Post` only — `NOT FOUND`). All entity definitions below are `PROPOSED` unless a requirement or control file states the rule explicitly (cited as REQ-xxx / MC §n).

---

## 1. Purpose, inputs, and OD-116 resolution

### 1.1 Purpose

Provide the Phase 2 logical/conceptual data model that:

- documents entities, purpose, ownership (bounded context), conceptual attributes, cardinality, lifecycle states, invariants, auditability, versioning, tenant boundaries, logical indexes/access patterns, and migration implications (required by Phase 2 prompt §10);
- preserves the mandatory conceptual separations of `MASTER_CONTROL.md` / `ARCHITECTURE.md` / `TESTING.md` (identity, hiRider, licensing, stores — see §4);
- stays client-neutral and database-vendor-neutral so that Phase 3+ implementation and OD-01 resolution are not constrained.

### 1.2 Status and acceptance path

This whole document is **PROPOSED**. It is not an owner decision and not an ADR. Where a lifecycle or parameter requires an owner decision or ADR, it is marked `PROPOSED — needs ADR` or mapped to an existing OD ID in §11. No OD ID is invented in this document (per `CONTROL_CONSISTENCY_MATRIX.md`); genuinely new decisions are listed in §11 as **"candidate — requires registration"** without an ID.

### 1.3 Inputs reviewed (sources of truth)

| # | Input | Use in this document |
|---|---|---|
| 1 | `MASTER_CONTROL.md` (reconciled baseline) | Taxonomy (3 license tiers; hiRider portal; stores), architecture invariants (§4), decision dependency policy |
| 2 | `ARCHITECTURE.md` | 17 bounded contexts (§3), identity chain (§4), entitlement concepts (§5), hiRider objects (§6), Public Store objects (§7), data architecture principles (§9) |
| 3 | `DECISIONS.md` | Canonical OD-01/02/03/05/06/09/116/160 scoping |
| 4 | `LICENSE_MATRIX.md` | Tier inheritance, extension lifecycle, store access rules, effective-access formula |
| 5 | `SECURITY.md` | Authorization policy inputs, hiRider/store security separations |
| 6 | `TESTING.md` | Domain invariants that the data model must be able to express and test |
| 7 | `CONTROL_CONSISTENCY_MATRIX.md` | Canonical rules + contradiction-search terms (self-check in worklog) |
| 8 | `PHASE_2_DEPENDENCY_MATRIX.md` | What OD-01/02/03/05/06/09/116/160 block and do not block |
| 9 | Phase 2 prompt `upload/phase2_extract/epicRider_Phase_2_Prompt_zai.md` | §6 domain model requirements, §7 hiRider domain model, §8 identity/tenancy, §10 data model deliverable spec |
| 10 | `REQUIREMENTS.md` (REQ-001..REQ-100, all `PROPOSED`) | Requirement traceability — REQ IDs cited next to entities/invariants; IDs preserved verbatim, never renumbered |
| 11 | `PROCESS_MAP.md` | 13 core processes (PROC-01..13), asset state machine (ASM-S01..S11, ASM-D01/D02, ASM-T01..T16), 16 IMS processes (PROC-201..216) — lifecycle evidence |
| 12 | `DOCUMENT_EVIDENCE_MODEL.md` | Document hierarchy D1..D8, 15-field metadata model, classification/ACL model, document lifecycle, evidence workflow, retention classes |
| 13 | `USE_CASES.md` (55 UC, `PROPOSED`) | Access patterns, entity behavior evidence (read via targeted search, not fully) |
| 14 | `PRODUCT_SCOPE.md` | Domain boundaries and non-goals (X-1..X-10) |
| 15 | `OPEN_DECISIONS.md` | Registered OD IDs used in §11 (only existing IDs) |
| 16 | `PERSONAS_AND_JOURNEYS.md` (via worklog/UX summary) | Actor roles referenced (P-01..P-12) for auditability/ownership notes |

Historical note: the Phase-1-era `LICENSE_MATRIX.md` (now superseded, archived at `audit/superseded/phase1-era-control/`) rule **W-5** ("higher tiers enrich the same domain — parallel mini/max/ISO databases are forbidden") is consistent with the current baseline and is retained here as a principle (§2.8), cited via REQ-001/REQ-002.

### 1.4 OD-116 resolution

- OD-116 recorded that `DATA_MODEL_CONCEPT.md` was **NOT FOUND** at the Phase 1 gate.
- Per `DECISIONS.md` (canonical, 2026-10-27): OD-116 is **a Phase 2 workstream/output, not a Phase 2 prerequisite**, and must be resolved through evidence and ADRs.
- **This document is that output.** It closes the OD-116 gap by building the concept from the Phase 1 artifacts (REQ-001..100, PROCESS_MAP, DOCUMENT_EVIDENCE_MODEL, USE_CASES) under the reconciled control baseline installed by the owner (worklog Task 2-0). Remaining owner choices are consolidated in §11; the OD-116 register entry itself can only be status-updated by the owner/ADR process — not by this document.

---

## 2. Cross-context data principles

All principles below apply to every bounded context in §3. Each is `PROPOSED` architecture unless it restates a control-file invariant (cited).

### 2.1 Strong identifiers — `PROPOSED`

- Primary key: **UUIDv7 or equivalent time-ordered 128-bit identifier** (`PROPOSED` — final standard via Phase 2 ADR, per `ARCHITECTURE.md` §9 "UUID/strong identifiers as decided in Phase 2 ADR"; physical encoding depends on OD-01).
- Business identifiers (human-readable, context-scoped unique): e.g. document `doc_id` (REQ-079), asset tag/QR code (REQ-036), opening code, invoice number. Business identifiers are separate columns with per-tenant uniqueness — never the primary key.
- Rationale: time-ordered IDs support logical index locality and pagination without leaking counts; business IDs remain stable across merges/imports.

### 2.2 Timestamp + actor attribution — control invariant (`ARCHITECTURE.md` §9; REQ-079, REQ-083)

- Every mutable record carries `created_at`, `created_by`, `updated_at`, `updated_by` (server time, authenticated actor).
- Records that participate in compliance/evidence flows additionally carry transition timestamps and the acting role in their history tables (e.g. `ApplicationStatusHistory`, `SignOff`, `DocumentVersion`).
- Evidence metadata timestamps are server-side, not client-supplied (REQ-083; `DOCUMENT_EVIDENCE_MODEL.md` §5).

### 2.3 Soft deletion only where semantically appropriate — control invariant (`ARCHITECTURE.md` §9)

Explicit soft-deletion policy (`PROPOSED` mapping):

| Category | Treatment |
|---|---|
| Approved/effective documents & versions, locked evidence, sign-offs, audit events, status histories, amendment chains, issued invoices/contracts, license & entitlement history | **Never deleted** — immutability + supersession/amendment (REQ-027, REQ-080, REQ-083, REQ-099) |
| Assets, events, memberships, applications, recruitment openings | **Status-based lifecycle end-states** (retired/archived/removed/closed) — history preserved (REQ-045, REQ-049, REQ-063: closing recruitment must not delete application history) |
| Drafts (technical rider, media kit, document draft, store listing draft), portfolio items, notification drafts | **Soft delete allowed** (`PROPOSED`) — `deleted_at`/`deleted_by` marker; restore possible |
| User accounts | **Deactivation / anonymization**, not hard delete — attribution must survive; exact mechanics depend on privacy review (OD-09) |
| Store listings | `archived` status per REQ-055 |

Hard physical deletion occurs only via audited disposition (retention end-of-life, REQ-081, periods = OD-104) with tombstone records.

### 2.4 Optimistic concurrency / versioning for mutable critical records — control invariant (`ARCHITECTURE.md` §9)

- Mutable records that support concurrent editing carry a monotonic `version`/row-version attribute; conflicting writes are rejected and surfaced (never silently last-write-wins).
- Applies at minimum to: document drafts (REQ-079 full change history), rundown items and chat editing (concurrency policy = OD-131), reservations (plus transactional overlap checks, REQ-065), store stock/price records (REQ-056 records old/new value per change), membership role changes, quota counters (transactional enforcement, §8).
- Append-only histories (status histories, audit events) are the concurrency mechanism for lifecycle records: one transition per event, invalid transitions rejected server-side (REQ-064, REQ-080).

### 2.5 Immutable approved records + amendment/version history — control invariant (MC §4; REQ-027)

- Once a record reaches an approved/locked/effective state, its content is immutable via API (REQ-027 acceptance: approved record cannot be edited/deleted via API).
- Corrections create a **new version** linked to the prior one, with mandatory reason and audit trail (amendment pattern; `DOCUMENT_EVIDENCE_MODEL.md` §6). Applies to: documents (REQ-080), evidence (REQ-083), quotations/contracts (commercial document principle, UC-4002), NCR/CAPA records after closure (UC-7008).

### 2.6 Explicit tenant/workspace ownership — control invariant (MC §4; REQ-023)

- Every tenant-scoped entity carries exactly one `workspace_id` (tenant owner). Cross-tenant CRUD must be rejected server-side (REQ-023 acceptance; `TESTING.md` typo correction: "CRUD lintas-tenant ditolak" — cross-tenant CRUD rejected).
- Globally-scoped entities (User, AuthenticationMethod, Session, DeveloperRoleAssignment, AuditorAccessGrant, Platform catalog/products, CandidateProfile) are explicitly marked global in §3 and never carry `workspace_id`; their tenant visibility is derived through explicit relations (membership, application, grant scope).
- Every query path is expressed tenant-first (see §9 access patterns); tenant context is a mandatory input to authorization (MC §2 effective access; `SECURITY.md`).

### 2.7 Controlled migrations — REQ-029 (requirement, `PROPOSED`)

- All schema changes via reviewed, versioned migrations; reversible where feasible; data-preserving by default; `db:push --accept-data-loss` style operations forbidden on environments with real data (REQ-029 acceptance). Details in §10.

### 2.8 One platform, no parallel databases per tier — REQ-001 / REQ-002

- A single continuous data foundation serves all tiers; tier growth enriches the same domain; parallel per-tier databases are forbidden (REQ-001 acceptance "no parallel DB per tier"; REQ-002 upgrade without data migration; historical W-5 rule of the superseded Phase-1 LICENSE_MATRIX, consistent with current baseline).
- Tier differences are expressed through entitlement data (§3.5) and feature availability, **not** through separate stores or schemas per tier.

### 2.9 i18n-ready text handling — REQ-028 (requirement; language default = OD-12)

- Enum-like values (statuses, types, roles, tier names) are stored as **language-neutral codes**; display strings live in locale resource files, never in the data layer (REQ-028: no hard-coded UI strings; Indonesia default, EN-ready — OD-12).
- User-authored content (rider text, chat, document content, profile text) is stored as entered, with optional `locale` metadata; translation of user content is out of scope (`PROPOSED`).
- System-controlled nameable objects (role names, category names) carry a translation table or i18n key reference (`PROPOSED`).

### 2.10 Auditability of sensitive transitions — control invariant (MC §4, `ARCHITECTURE.md` §9)

- Every sensitive transition (auth events REQ-054, membership changes REQ-049, entitlement changes REQ-098/REQ-024 denials, document/evidence transitions REQ-080/REQ-083, store price/stock changes REQ-056, auditor access REQ-053, application decisions REQ-064) emits an append-only `AuditEvent` owned by the Audit context (§3.14).
- Audit events are never editable/deletable via API; access to audit data is itself restricted and audited (OD-138, OD-164 govern retention/access parameters).

---

## 3. Bounded context catalog (17 contexts, per `ARCHITECTURE.md` §3)

Conventions for this section:

- Entities are `PascalCase`; each is **owned by the context under which it is listed** (ownership = system of record). Entities referenced across contexts are noted as `(ref)` and never duplicated.
- "States" are logical lifecycle states. `PROPOSED` unless a REQ cites the lifecycle verbatim.
- Cardinality notation: `1—N`, `1—1`, `N—M`.
- Tenant boundary: **Tenant-scoped** (carries `workspace_id`) or **Global**.
- Access patterns listed per context feed the consolidated index strategy (§9).

### 3.1 Identity

**Purpose:** global user identity, authentication methods, sessions, recovery, and the two special global access grants (developer role, auditor access) that are deliberately NOT workspace memberships.

| Entity | Purpose | Key attributes (conceptual) | Main relationships / cardinality | States | Key invariants (REQ) |
|---|---|---|---|---|---|
| `User` | Global identity of any human actor; NOT a workspace member by itself (REQ-025) | id, display name, primary contact, status, locale pref | 1—N `AuthenticationMethod`; N—M `Workspace` via `Membership`; 1—N `Session` | ACTIVE, DEACTIVATED, ANONYMIZED (`PROPOSED`; deactivation/anonymization mechanics = OD-09) | User != Membership != Role != Event Assignment (MC §4, TESTING.md); one user may hold different roles in different workspaces (REQ-025) |
| `AuthenticationMethod` | A verified login channel: WhatsApp number or Google OIDC subject | id, user_id, method type, verified identifier, linked_at | N—1 `User` | LINKED, UNLINKED | Account linking must be safe/non-hijackable (REQ-022, REQ-047) |
| `VerificationRequest` | One-time login/OTP challenge: single-use token, expiry, anti-replay | id, method, target, token hash, expires_at, used_at, attempt count | stands alone (produces `Session`) | PENDING, CONSUMED, EXPIRED, BLOCKED | Single-use, expiry, replay rejected, rate-limited, audited (REQ-021, REQ-054); vendor-agnostic (OD-03) |
| `Session` | Active authenticated session/device | id, user_id, device label, created_at, expires_at, revoked_at | N—1 `User` | ACTIVE, EXPIRED, REVOKED | Revocation effective on next request (REQ-048); session policy params = OD-115 |
| `AccountRecoveryFlow` | Controlled recovery across login methods without takeover paths | id, user_id, method used, verification evidence, outcome | N—1 `User` | OPEN, VERIFIED, FAILED, EXPIRED | No bypass of verification; audited (REQ-047, REQ-054) |
| `DeveloperRoleAssignment` | Platform-level developer/portal role — separate from all workspace roles (REQ-052, REQ-031) | id, user_id, developer role, scope (which store functions), granted_by/at | N—1 `User`; no FK to `Workspace`/`Membership` | ACTIVE, REVOKED | Developer role cannot alter licenses/billing/broadcast (REQ-031); role model detail = OD-101 |
| `AuditorAccessGrant` | Scoped, time-bound, read-only auditor access (REQ-053) | id, user_id, scope (workspaces/documents/evidence), granted_at, expires_at, read_only=true | N—1 `User`; scope refs to Workspace/Document | ACTIVE, EXPIRED, REVOKED | Auto-expiry; write denied; scope expansion = new grant with separate approval (REQ-053, REQ-044, REQ-084); parameters = OD-110 |

- **Tenant boundary:** Global (no `workspace_id` on any Identity entity; `AuditorAccessGrant` reaches tenants only through its scope reference, which is enforced read-only).
- **Auditability:** every auth attempt, recovery, session revoke, developer-role and auditor-grant change → `AuditEvent` (REQ-054, REQ-053).
- **Access patterns & logical indexes:** `AuthenticationMethod` by (method, identifier) unique — login lookup; `Session` by (user_id, status), (session token); `AuditorAccessGrant` by (user_id, expires_at) for expiry sweeps; `User` by contact for invite/recovery resolution.

### 3.2 Workspace/Tenant

**Purpose:** the tenant root — the workspace/event organization that owns licenses, memberships, events, assets, documents.

| Entity | Purpose | Key attributes | Relationships / cardinality | States | Key invariants (REQ) |
|---|---|---|---|---|---|
| `Workspace` | Tenant root (miniRider event workspace and above) | id, name, status, created_at/by, settings | 1—N `Membership`; 1—N `Event`; 1—1..N `License` (§3.5); 1—N `Asset` | ACTIVE, SUSPENDED, ARCHIVED (`PROPOSED`; suspension may follow license expiry per REQ-098/OD-108) | Tenant isolation root (REQ-023); max crew quota enforced at membership creation (REQ-009, OD-05) |
| `WorkspaceProfile` | Presentation/branding of the workspace (target of the "workspace landing" extension) | id, workspace_id, branding, public visibility | 1—1 `Workspace` | DRAFT, PUBLISHED (`PROPOSED`) | Visibility/entitlement follows extension state (REQ-018) |

- **Tenant boundary:** `Workspace` IS the tenant anchor; `WorkspaceProfile` tenant-scoped.
- **Auditability:** workspace create/suspend/archive → `AuditEvent`.
- **Access patterns & logical indexes:** `Workspace` by (owner user) via Membership; listing workspaces for a user = membership join (see §3.3); `WorkspaceProfile` by (workspace_id, published).

### 3.3 Membership & Roles

**Purpose:** the workspace membership lifecycle (kru/crew and owners), roles, invitations, and seats — strictly separate from identity (§4.1) and from event assignment (§3.4).

| Entity | Purpose | Key attributes | Relationships / cardinality | States | Key invariants (REQ) |
|---|---|---|---|---|---|
| `Membership` | A user's membership of one workspace — NOT the user, NOT a role, NOT an assignment (REQ-025, REQ-049) | id, workspace_id, user_id, status, created/updated by/at, version | N—M `User`↔`Workspace` (materialized); 1—N `MembershipRoleAssignment` | INVITED, ACTIVE, SUSPENDED, REMOVED, LEFT (REQ-049: invite→accept→suspend→remove→leave) | Every status transition changes effective access immediately; removed member loses access on next request (REQ-049 acceptance) |
| `Role` | Workspace-scoped role (owner, event manager, asset manager, finance, crew, …; dynamic roles on maxRider+ REQ-011) | id, workspace_id, name/i18n key, is_system | 1—N `MembershipRoleAssignment`; N—M `Permission` | ACTIVE, RETIRED (`PROPOSED`) | License ≠ role (prompt §8); role changes audited |
| `Permission` | Permission vocabulary entry (e.g. event.edit, asset.dispatch) | id, code, description i18n key | N—M `Role` | ACTIVE, DEPRECATED | Deny-by-default; server-side enforcement (MC §4, REQ-024, REQ-026); full policy model = AUTHORIZATION_MODEL (Task 2-b) |
| `MembershipRoleAssignment` | Which member holds which role | id, membership_id, role_id, granted_by/at | N—1 `Membership`; N—1 `Role` | ACTIVE, REVOKED | One user can hold different roles in different workspaces without conflict (REQ-025) |
| `Invitation` | Secure workspace invite: signed, single-use, expiring token bound to workspace + offered role (REQ-051) | id, workspace_id, role_id, contact target, token hash, expires_at, used_at | N—1 `Workspace`; produces `Membership` on accept | PENDING, ACCEPTED, EXPIRED, REVOKED | Reused/expired links rejected; token cannot alter role (REQ-051); quota check at invite AND accept (REQ-009) |
| `Seat` | Quota accounting unit linking memberships to entitlement (REQ-009; OD-05) | id, workspace_id, membership_id (nullable), state, allocated_at/released_at | N—1 `Workspace`; 0..1—1 `Membership` | AVAILABLE, ALLOCATED, RELEASED (`PROPOSED`) | Seat count ≤ tier quota + extension seats; enforcement server-side (§8; OD-05 owner-counting OPEN) |

- **Tenant boundary:** all entities tenant-scoped.
- **Auditability:** all membership/role/invitation/seat transitions → `AuditEvent` (REQ-049, REQ-051, REQ-009 denials audited).
- **Access patterns & logical indexes:** `Membership` by (workspace_id, status) — team page; by (user_id, status) — workspace switcher; unique (workspace_id, user_id) active-membership constraint (re-invite of removed member = new row, history preserved); `Invitation` by (token hash) unique and (workspace_id, status); `Seat` by (workspace_id, state) for quota computation.

### 3.4 Event & Assignment

**Purpose:** the event (the unit of work for miniRider+ workspaces) and crew assignment to events — assignment is separate from membership (REQ-050).

| Entity | Purpose | Key attributes | Relationships / cardinality | States | Key invariants (REQ) |
|---|---|---|---|---|---|
| `Event` | An event/production engagement owned by a workspace | id, workspace_id, name, schedule (start/end), location, status, version | 1—N `EventAssignment`; 1—N `TechnicalRider`; 1—N `MediaKit`; 1—N `RundownItem`; 1—1..N dossier (Finance ctx) | DRAFT, SCHEDULED, ACTIVE, COMPLETED, CLOSED, CANCELLED, ARCHIVED (`PROPOSED` — no owner-approved event lifecycle exists; needs ADR, §11) | Event data visible only to assigned members (REQ-050); event page functions in-context (REQ-008) |
| `EventAssignment` | Assignment of a member (kru) to an event — separate from Membership (REQ-050, REQ-007) | id, event_id, membership_id, role in event, schedule window, status | N—1 `Event`; N—1 `Membership` | OFFERED, ASSIGNED, DECLINED, COMPLETED, REVOKED (`PROPOSED`) | Crew sees only assigned events; context switch must not leak other events (REQ-007); double-assignment policy = OD-130; competency gate when required (REQ-074) |
| `RundownItem` | Ordered timeline item of the event rundown (REQ-008) | id, event_id, sequence, time, title/notes, version | N—1 `Event` | PLANNED, LIVE/DONE, SKIPPED (`PROPOSED`) | Concurrent-edit policy = OD-131; optimistic versioning (§2.4) |
| `EventChatMessage` | Team chat message within the event context (REQ-008) | id, event_id, author membership, body, attachments, sent_at | N—1 `Event` | SENT, EDITED, REMOVED (`PROPOSED`) | Only event-assigned members can read/write; attachments follow media policy (OD-137) |
| `EventReport` | Field report/status update shared across the team (REQ-008 "update info/laporan antar tim") | id, event_id, author, content, timestamp | N—1 `Event` | DRAFT, SUBMITTED (`PROPOSED`) | Feeds event dossier (REQ-046) and evidence flows on ISOrider |

- **Tenant boundary:** all tenant-scoped.
- **Auditability:** assignment create/change/revoke, event state transitions → `AuditEvent`; unauthorized event access attempts denied + audited (REQ-050).
- **Access patterns & logical indexes:** `Event` by (workspace_id, status, schedule) — event lists; `EventAssignment` by (membership_id, status) — "my assignments"; by (event_id) — crew list; reservation overlap queries join asset reservations to event schedule (§3.8); rundown by (event_id, sequence).

### 3.5 Entitlement & License

**Purpose:** the server-side entitlement engine inputs: which tier license a workspace holds, which capabilities exist, and derived effective access. License ≠ Capability ≠ Extension (§4.5).

| Entity | Purpose | Key attributes | Relationships / cardinality | States | Key invariants (REQ) |
|---|---|---|---|---|---|
| `LicenseTier` | Reference enumeration of the ONLY three tiers: `miniRider`, `maxRider`, `ISOrider` | code | — | — | Closed enum; **hiRider is NOT a value of LicenseTier** (MC §1, TESTING.md); never extended without owner ADR |
| `License` | A tier license held by a workspace (tenant) | id, workspace_id, tier, status, purchased_at, term start/end, renewal window, grace end | N—1 `Workspace`; 1—N `EntitlementGrant` | PURCHASED, ACTIVE, RENEWAL_DUE, EXPIRED, GRACE, DOWNGRADED (REQ-098: purchase→active→renewal→expiry→grace→downgrade) | Durations/gates = OD-108 OPEN; tier transitions audited (REQ-098); no data deletion on downgrade (REQ-099) |
| `Capability` | Domain capability definition (recruitment, candidate discovery, CRM, asset scanning, audit mode, notification broadcast — MC §2) | id, code, description i18n key | 1—N `CapabilityRule` | ACTIVE, DEPRECATED | Capability is not a license (MC §2) |
| `CapabilityRule` | Rule binding capability availability to tier/extension/role/context/object-state inputs | id, capability_id, condition set (tier set, extension set, role set, context, object states) | N—1 `Capability` | ACTIVE, SUPERSEDED | Evaluated server-side as part of effective access (MC §2 effective access formula; REQ-024) |
| `EntitlementGrant` | Issued, versioned effective-right record (from a license and/or extension purchase; issued by commerce orders, §3.12) | id, workspace_id, source (license/extension/order), rights payload, valid_from/until, version | N—1 `Workspace`; refs `License`, `ExtensionInstance` | ACTIVE, SUSPENDED, EXPIRED, REVOKED | Issuance auditable (store issuance architecture: `ARCHITECTURE.md` §7 + ADR-018; auditability invariant MC §4); grants drive `Seat`/quota (§8) |
| `TierQuota` | Numeric limits per tier (crew count, storage, workspaces…) with parameter values | id, tier, quota code, limit value, unit | N—1 `LicenseTier` | ACTIVE | 5-crew base for miniRider (REQ-009); owner-counting = OD-05; commercial quotas = OD-06; values never invented (anti-hallucination) |

- **Tenant boundary:** `License`, `EntitlementGrant`, `TierQuota` effects are tenant-scoped; `LicenseTier`, `Capability`, `CapabilityRule` are global reference data.
- **Auditability:** every license transition and entitlement issuance/suspension → `AuditEvent` (REQ-098; store issuance auditable per SECURITY.md).
- **Access patterns & logical indexes:** `License` by (workspace_id, status) — effective tier resolution; `EntitlementGrant` by (workspace_id, valid window); `CapabilityRule` by (capability_id) loaded into policy evaluation cache (`PROPOSED`).
- **Rekonsiliasi implementasi (Phase 5-E, 2026-10-31 — ADR-026):** `EntitlementGrant` (baris konseptual di atas) **TIDAK dimodelkan sebagai tabel** dan TIDAK dibuat sebagai source of truth kedua. Arsitektur yang terimplementasi (Phase 5-B/5-C/5-D, ADR-023/024/025; ditegakkan kembali pada 5-E) menetapkan `License` (status `ACTIVE`) dan `ExtensionInstance` (status `ACTIVE`) sebagai SATU-SATUNYA sumber entitlement — dibaca langsung oleh evaluator deterministik 5-C (`src/lib/licensing/entitlement.ts`); lifecycle 5-D mengelola statusnya. Rantai yang berlaku: `Commerce → License / ExtensionInstance → lifecycle 5-D → engine 5-C`. Baris `EntitlementGrant` di atas dipertahankan sebagai **konseptual/obsolete** (riwayat desain Phase 2 — tidak dihapus); relasi konseptual `License 1—N EntitlementGrant` dan `StoreOrder 0..N—1 EntitlementGrant` (§3.12) TIDAK lagi menggambarkan implementasi. Seat/quota counting (§8) tetap OD-05 OPEN — tidak ada mekanika enforcement yang dikarang. Perubahan arah ini hanya dapat dilakukan lewat keputusan owner (ADR baru).

### 3.6 Extension

**Purpose:** additive purchasable units above a tier (additional workspace, additional seat package, workspace landing, mobile/client extension, future approved — MC §2). Extension is not a tier and not a capability.

| Entity | Purpose | Key attributes | Relationships / cardinality | States | Key invariants (REQ) |
|---|---|---|---|---|---|
| `ExtensionDefinition` | Catalog definition of an extension type/product | id, code, type, description, active | 1—N `ExtensionInstance` | CATALOG (published), WITHDRAWN (`PROPOSED`) | Definition lives in catalog; commercial values = OD-06 |
| `ExtensionType` | Reference list of extension kinds (additional_workspace, seat_package, workspace_landing, mobile_client, future approved) | code | N—1 used by `ExtensionDefinition` | — | Closed-by-owner list (MC §2/§3; REQ-018) |
| `ExtensionInstance` | A provisioned extension on a workspace, following the canonical lifecycle | id, workspace_id, definition ref, status, term, quantity (e.g. +10 seats), provisioned_at | N—1 `Workspace`; contributes to `TierQuota`/`Seat` (§8) | CATALOG → PURCHASED/ASSIGNED → ACTIVE → SUSPENDED/EXPIRED → RENEWED/REMOVED (`LICENSE_MATRIX.md` §5 — canonical) | Extension lifecycle states are canonical; renewal/removal audited; seat-package instances adjust quota atomically |

- **Tenant boundary:** `ExtensionInstance` tenant-scoped; definitions global.
- **Auditability:** all extension transitions → `AuditEvent`.
- **Access patterns & logical indexes:** `ExtensionInstance` by (workspace_id, status, type) — effective entitlement aggregation; renewal sweeps by (status=ACTIVE, term end).

### 3.7 hiRider Recruitment

**Purpose:** the crew services marketplace connecting candidate users and workspaces — profile, skills, portfolio, **service offers (penawaran jasa)**, open recruitment, applications, selection, and assignment. **hiRider is a portal/capability — it is NOT a license and NOT a tier value** (MC §1; §4.4 of this document). Core chain (ARCHITECTURE.md §2): `User Profile → Recruitment Opening → Application → Recruitment Decision → Membership/Assignment` — with Application never collapsed into Membership.

> **Remediasi F-01 (audit konsistensi Phase 3, 2026-10-28; `adr/ADR-021-hirider-service-offer-scope.md`):** scope hiRider **termasuk penawaran jasa** per baseline Master Control ("Marketplace layanan kru"). `ServiceOffer` ditambahkan di bawah sebagai objek yang **direncanakan** — lifecycle/ownership/visibility/permission/API/audit detail berstatus `PROPOSED` (desain final Phase 16). Keberadaan ServiceOffer di scope BUKAN keputusan terbuka (OD-185 CLOSED — DECIDED BY BASELINE).

Detailed domain model in §5. Entities (owner: this context):

| Entity | Purpose | Key attributes | Relationships / cardinality | States | Key invariants (REQ) |
|---|---|---|---|---|---|
| `CandidateProfile` | Recruitment-facing profile of a user (skills, experience, portfolio) with explicit visibility control (REQ-062) | id, user_id (ref Identity), headline, experience, visibility setting, version | 1—1 `User` (ref); 1—N `Skill`, `PortfolioItem`; 1—N `Application` | DRAFT, PUBLISHED, HIDDEN (`PROPOSED`) | Profile visible only per visibility setting (REQ-062); default visibility = OD-109; privacy is server-side enforced |
| `Skill` | A skill tag/entry on a candidate profile | id, profile_id, skill name/level | N—1 `CandidateProfile` | — | — |
| `PortfolioItem` | Portfolio artifact (work sample/reference) | id, profile_id, media ref, title, period | N—1 `CandidateProfile` | ACTIVE, REMOVED (`PROPOSED`) | Media limits per policy (OD-137); moderation flaggable (UC-6005) |
| `RecruitmentOpening` | A recruitment posting opened by a workspace (REQ-063) | id, workspace_id, title, criteria, access criteria, period, status, version | N—1 `Workspace`; 1—N `Application`; 1—N `Shortlist` | DRAFT → OPEN → PAUSED → CLOSED (`PROPOSED` domain states — prompt §7 example, NOT owner-approved; ADR needed) | Only OPEN openings accept applications; closing never deletes application history (REQ-063) |
| `Application` | A candidate's application to an opening (REQ-064) | id, opening_id, candidate user_id, submitted_at, status, version | N—1 `RecruitmentOpening`; N—1 `User` (ref); 1—N `ApplicationStatusHistory`; 0..1—1 `Shortlist` entry; 0..1—1 `RecruitmentDecision` | SUBMITTED → REVIEWING → SHORTLISTED → ACCEPTED / REJECTED / WITHDRAWN (`PROPOSED` domain states — prompt §7; needs ADR) | Application != Membership; application status never grants workspace/event access (REQ-013, REQ-064); invalid transitions rejected; owner sees status history |
| `ApplicationStatusHistory` | Append-only history of every application transition + actor + reason | id, application_id, from/to status, actor, timestamp, note | N—1 `Application` | — (append-only) | Immutable; every decision auditable (REQ-064) |
| `Shortlist` | Shortlist entry (opening × application) | id, opening_id, application_id, added_by/at, note | N—1 `RecruitmentOpening`; N—1 `Application` | ACTIVE, REMOVED (`PROPOSED`) | Shortlist is a selection state, not a decision (ARCHITECTURE.md §6) |
| `RecruitmentDecision` | Final accept/reject decision with actor + reason | id, application_id, decision, decided_by/at, reason | 1—1 `Application` | ACCEPTED, REJECTED (`PROPOSED`) | Decision does NOT create membership (§4.3); accept may be followed by a separate `Invitation` (UC-6004 a1) |
| `ServiceOffer` *(planned — ADR-021)* | A crew service offering (penawaran jasa) published by a candidate/kru within hiRider scope (MC baseline "Marketplace layanan kru"; REQ-013 amended) | id, provider user_id, title, description, service category, terms, visibility setting, status, version — **detail atribut `PROPOSED`** | N—1 `User` (ref, provider); relasi ke `CandidateProfile`/`RecruitmentOpening` = desain Phase 16 | Lifecycle **`PROPOSED`** — belum ada status final yang disetujui (ADR/desain Phase 16) | Bukan license/tier; bukan `Application` dan tidak menciptakan membership/assignment; visibility/privacy server-side (OD-109 analog); audit trail per transisi (MC auditability); detail permission + API boundary direncanakan di AUTHORIZATION_MODEL/API_ARCHITECTURE saat desain Phase 16 |
| `AbuseReport` | Marketplace abuse report (profile/listing/message) and moderation outcome (UC-6005) | id, reporter user_id, target ref, context, status, action, moderator | N—1 `User` (reporter) | OPEN, REVIEWING, ACTIONED, DISMISSED (`PROPOSED`) | Note: no dedicated REQ exists yet (USE_CASES §gap); privacy of reporter protected (OD-09, OD-109) |

- **Tenant boundary:** `RecruitmentOpening` is tenant-owned (workspace_id) but portal-visible per status; `CandidateProfile`, `Skill`, `PortfolioItem` are user-global; `Application` bridges both (opening→tenant, candidate→user) and must enforce visibility rules of both sides (application privacy = SECURITY.md hiRider section; contact-data policy = OD-134). `ServiceOffer` (planned, ADR-021) adalah objek user-global (provider-side) dengan visibility eksplisit — tenant-relasi final ditetapkan saat desain Phase 16.
- **Auditability:** all transitions + decisions + moderation actions → `AuditEvent` (REQ-064; "mass decisions without trace" is an abuse case — audited).
- **Access patterns & logical indexes:** openings visible to candidates by (status=OPEN) filtered by access criteria; "my applications" by (candidate user_id, status); applications for an opening by (opening_id, status); unique (opening_id, candidate user_id) active-application constraint (duplicate policy, UC-6003 F2); shortlist by (opening_id).

### 3.8 Asset

**Purpose:** the asset register and full physical lifecycle (maxRider/ISOrider; miniRider = basic register + set templates only — REQ-006 vs REQ-045). State machine per `PROCESS_MAP.md` (ASM-S01..S11 + degraded ASM-D01/D02; transitions ASM-T01..T16) — see §6.4.

| Entity | Purpose | Key attributes | Relationships / cardinality | States | Key invariants (REQ) |
|---|---|---|---|---|---|
| `Asset` | Physical inventory item | id, workspace_id, category ref, model, serial, ownership, status, version | 1—1 `AssetIdentification`; 1—N `Reservation`, `AssetMovement`, `InspectionRecord`, `MaintenanceTicket`; N—M `AssetSet` via `AssetSetItem` | ASM states: registered, identified, inspected, reserved, dispatched, in-use, returned, condition-assessed, maintenance, ready, retired + degraded: damaged, lost (see §6.4) | History never deleted — only status changes (UC-3008 F4); retirement blocked while active reservations exist (UC-3008 F1); audit trail at every stage (REQ-045) |
| `AssetCategory` | Category/type taxonomy for assets | id, workspace_id (or global library `PROPOSED`), name/i18n, attributes schema | 1—N `Asset` | ACTIVE, RETIRED | Conflict policy may be per class (OD-107) |
| `AssetSet` | Set/template grouping of assets (REQ-006) | id, workspace_id, name, version | N—M `Asset` via `AssetSetItem` | DRAFT, PUBLISHED, ARCHIVED (`PROPOSED`) | Set reservations treat members as a unit (`PROPOSED`) |
| `AssetSetItem` | Membership of an asset in a set (with quantity) | id, set_id, asset_id, quantity | N—1 `AssetSet`; N—1 `Asset` | — | Consistency check when asset retires (UC-2003 F2 analog) |
| `AssetIdentification` | Unique QR/barcode identity + printed-label record (REQ-036) | id, asset_id, code (unique), issued_at, label printed | 1—1 `Asset` | ISSUED, REPRINTED, RETIRED (`PROPOSED`) | Code unique platform-wide (scan must resolve across tenants but data access stays tenant-isolated — UC-3004 F4) |
| `Reservation` | Time-window booking of an asset/set for an event (REQ-065) | id, workspace_id, asset ref/set ref, event ref, window, status, version, conflict flag | N—1 `Event`; N—1 `Asset`/`AssetSet` | REQUESTED, CONFIRMED, CONFLICT-FLAGGED, CANCELLED, COMPLETED (`PROPOSED`) | Overlap detection server-side; resolution policy (hard-block vs warning vs per-class) = OD-107; conflicts recorded (REQ-065) |
| `AssetMovement` | Check-out/check-in transaction with condition capture (REQ-066) | id, asset_id, event ref, type (dispatch/return), condition notes, media refs, actor, timestamp | N—1 `Asset`; N—1 `Event` | CHECKED_OUT, IN_USE, RETURNED (`PROPOSED`) | Condition capture mandatory at check-out and check-in as evidence (REQ-066) |
| `InspectionRecord` | Scheduled inspection/readiness result (REQ-068, PROC-07) | id, asset_id, checklist ref (Document ctx), result, evidence refs, due/overdue | N—1 `Asset` | DUE, OVERDUE, PASSED, FAILED (`PROPOSED`) | Inspection result stored as evidence (ASM-T02); drives readiness |
| `MaintenanceTicket` | Repair/maintenance/calibration job with due/overdue tracking (REQ-068) | id, asset_id, type, schedule, due_at, completed evidence | N—1 `Asset` | OPEN, IN_PROGRESS, DONE, OVERDUE, VERIFIED (`PROPOSED`) | Due/overdue derived from data; completion recorded as evidence (ASM-T10) |
| `AssetIncident` | Damage/loss report (ASM-D01/D02) | id, asset_id, type (damage/lost), report refs, photos, investigation outcome | N—1 `Asset` | REPORTED, UNDER_INVESTIGATION, RECOVERED, RESOLVED (`PROPOSED`) | Photo + notes mandatory (ASM-T12/T13); may auto-open incident→NCR (policy = OD-132) |
| `RetirementRecord` | End-of-life decision + reason (ASM-T16) | id, asset_id, reason, decided_by/at, disposal evidence | 1—1 `Asset` (terminal) | EXECUTED | Audited; considers age/condition/cost (REQ-045) |

- **Tenant boundary:** all tenant-scoped; QR code lookup is global-resolve but tenant-enforced.
- **Auditability:** every lifecycle stage has status + audit trail (REQ-045 acceptance); movements/condition captures are evidence-linked (REQ-066).
- **Access patterns & logical indexes:** availability window query = `Reservation` by (asset_id, window overlap, status) — the double-booking check (REQ-065); asset lookup by QR code (unique); maintenance due-list by (workspace_id, due_at, status); utilization/downtime KPIs computed from movement/reservation data (REQ-069 — derived, not fabricated).

### 3.9 Technical Rider

**Purpose:** technical requirement documents per event (miniRider+; REQ-004).

| Entity | Purpose | Key attributes | Relationships / cardinality | States | Key invariants (REQ) |
|---|---|---|---|---|---|
| `TechnicalRider` | Technical rider document for an event | id, workspace_id, event_id (nullable while draft), status, version | N—1 `Event` (mandatory when published); 1—N `RiderItem` | DRAFT, PUBLISHED, SUPERSEDED, ARCHIVED (`PROPOSED`) | Draft allowed without event; **published rider MUST link to an event — enforced server-side** (REQ-004) |
| `RiderItem` | Line item of technical needs (sound/lighting/etc.; may reference assets/sets) | id, rider_id, category, requirement text, asset ref (optional), quantity | N—1 `TechnicalRider` | ACTIVE, REMOVED (`PROPOSED`) | Referenced-asset deletion must not silently break items (consistency warning, UC-2003 F2) |

- **Tenant boundary:** tenant-scoped.
- **Auditability:** publish transition + event binding audited.
- **Access patterns & logical indexes:** riders by (workspace_id, status); by (event_id); draft-without-event listing by (workspace_id, status=DRAFT).

### 3.10 Media Kit

**Purpose:** media kits generated from templates and bound to events (REQ-005).

| Entity | Purpose | Key attributes | Relationships / cardinality | States | Key invariants (REQ) |
|---|---|---|---|---|---|
| `MediaKitTemplate` | Reusable media kit template | id, workspace_id (or platform library `PROPOSED`), structure, version | 1—N `MediaKit` | DRAFT, PUBLISHED, ARCHIVED (`PROPOSED`) | Template versioning; kits capture template version used |
| `MediaKit` | A media kit instance for one event | id, workspace_id, event_id, template ref + template version, status | N—1 `Event` (mandatory); N—1 `MediaKitTemplate`; 1—N `MediaKitItem` | DRAFT, PUBLISHED, ARCHIVED (`PROPOSED`) | Media kit always has a related event (REQ-005); created from template (REQ-005) |
| `MediaKitItem` | Content item (photo/video/text block) of a kit | id, kit_id, media ref, caption | N—1 `MediaKit` | ACTIVE, REMOVED (`PROPOSED`) | Media limits per platform policy (OD-137) |

- **Tenant boundary:** tenant-scoped.
- **Auditability:** creation/publish audited.
- **Access patterns & logical indexes:** kits by (event_id); templates by (workspace_id, status).

### 3.11 Communication/Notification

**Purpose:** targeted notifications to workspaces/users with mandatory recipient preview, idempotent delivery, and preferences (REQ-017, REQ-059..061).

| Entity | Purpose | Key attributes | Relationships / cardinality | States | Key invariants (REQ) |
|---|---|---|---|---|---|
| `NotificationMessage` | A notification/broadcast composed by an authorized sender | id, sender (user/developer role), type, title/body (i18n-ready), idempotency key, status | 1—N `NotificationDelivery`; 1—1 `NotificationAudience` | DRAFT, PENDING_PREVIEW, QUEUED, PARTIALLY_SENT, SENT, FAILED, CANCELLED (`PROPOSED`) | Send without recipient preview is impossible (REQ-059/REQ-017); duplicate key → no duplicate messages (REQ-060) |
| `NotificationAudience` | Audience selection (entire workspace / selected workspaces / selected users) + preview snapshot | id, message_id, selection type, target refs, previewed_at, recipient count | 1—1 `NotificationMessage` | PREVIEWED (`PROPOSED`) | Recipient count visible before send (REQ-059); selection audited |
| `NotificationDelivery` | Per-recipient delivery record | id, message_id, recipient ref, status, attempts, last error | N—1 `NotificationMessage` | QUEUED, SENT, FAILED, RETRYING (`PROPOSED` — REQ-060 cites queued/sent/failed) | Status visible to authorized sender; controlled retry (REQ-060) |
| `NotificationPreference` | Per-user preferences + opt-out for optional types | id, user_id, type, opt_in/out | N—1 `User` (ref) | — | Optional-type opt-out honored; mandatory types per owner decision (REQ-061, OD-102) |

- **Tenant boundary:** messages target workspaces/users but are platform-scoped records (sender side); deliveries are recipient-scoped. Model as platform-global with target refs (`PROPOSED`).
- **Auditability:** every send/delivery/failure + authorization denial audited (REQ-060; UC-5004 F5); anti-abuse limits (OD-139).
- **Access patterns & logical indexes:** deliveries by (message_id, status) for retry sweeps; by (recipient, status) for inbox; idempotency key unique per message; preferences by (user_id, type).

### 3.12 Developer Commerce/Store

**Purpose:** THREE separate commerce surface domains (koreksi owner 2026-10-28 — ADR-018; audit F-03; REQ-030 isolation where applicable): (a) **License & Extension Shop** — public landing-page surface for license purchase/renewal and extension purchase; must serve **prospective customers without any prior license** (first-license purchase); no invented commercial values (OD-06); (b) **Public Store** — developer products storefront; access = **user with a basic miniRider license** (MC §1; interpretation of derivation for higher-tier users = candidate decision, §11); (c) **Developer Equipment Store** — the in-app equipment store available **only to miniRider** (maxRider/ISOrider denied at API level, audited — REQ-010). The surfaces are separate domains — separate catalogs, access rules, APIs, and audit streams; license/extension commerce is NOT modeled inside the license-gated Public Store (a store requiring a license cannot serve first-license buyers). Historical note: the Phase 2 edition of this section modeled TWO storefronts (Public Store selling license products + extensions); superseded by ADR-018 — history preserved in git and in this note.

Public Store objects (per `ARCHITECTURE.md` §7; commercial values governed by OD-06):

| Entity | Purpose | Key attributes | Relationships / cardinality | States | Key invariants (REQ) |
|---|---|---|---|---|---|
| `Product` | A developer product offered in the Public Store | id, developer ref, product type ref, title/description, status | 1—N `CatalogListing`; 1—1 typed detail | DRAFT, PUBLISHED, WITHDRAWN, ARCHIVED (`PROPOSED`) | Product types: approved developer product kinds — license/extension commerce belongs to the License & Extension Shop surface, not here (ADR-018; MC §1) |
| `ProductType` | Reference: developer product kinds (closed-by-owner list) | code | N—1 from `Product` | — | Closed list per MC §1; license_product/extension_product values superseded here by ADR-018 (they live on the License & Extension Shop surface) |
| `CatalogListing` | Publishable listing of a product in the catalog (REQ-016) | id, product_id, availability, media refs, publication status, version | N—1 `Product` | DRAFT, PUBLISHED, ARCHIVED (`PROPOSED`) | Publication changes audited (REQ-016) |
| `StoreOrder` | Order/purchase abstraction (OD-06: no prices/taxes/gateway invented) | id, buyer (user/workspace), lines, status, idempotency key, created_by/at | 1—N `StoreOrderLine`; 0..N—1 `EntitlementGrant` (issuance §3.5) | CREATED, AWAITING_PAYMENT, FULFILLED, CANCELLED, REFUND_PENDING, REFUNDED (`PROPOSED` — final commercial state machine gated by OD-06) | Fulfillment = entitlement issuance, auditable (ARCHITECTURE.md §7); production charging blocked by OD-06 |
| `StoreOrderLine` | Line item of an order | id, order_id, product ref, quantity | N—1 `StoreOrder` | — | — |

Developer Equipment Store objects (in-app, miniRider-only):

| Entity | Purpose | Key attributes | Relationships / cardinality | States | Key invariants (REQ) |
|---|---|---|---|---|---|
| `EquipmentListing` | Equipment listing in the in-app store (REQ-055) | id, developer ref, name/description, category, status, version | 1—N `ListingMedia`; 1—N `StockItem`; 1—N `PriceRecord` | DRAFT, PUBLISHED, ARCHIVED (REQ-055 cites draft/published/archived) | Not visible before `published`; status changes audited (REQ-055); API access denied + audited for non-miniRider accounts (REQ-010) |
| `ListingMedia` | Media attachment of a listing (REQ-057) | id, listing_id, media ref, type | N—1 `EquipmentListing` | ACTIVE, REMOVED | Disallowed types rejected; media bound to its listing (REQ-057); limits = OD-137 |
| `StockItem` | Stock/inventory record of a listing (REQ-056) | id, listing_id, quantity, version | N—1 `EquipmentListing` | — | Every change records actor+time+old/new values (REQ-056); optimistic concurrency (§2.4) |
| `PriceRecord` | Price/discount value record with full change history (REQ-056) | id, listing_id, value ref, old/new values, actor, timestamp | N—1 `EquipmentListing` | ACTIVE, SUPERSEDED | No commercial values are invented in this document (OD-06); changes append-only |

- **Tenant boundary:** the three commerce surfaces are platform-global domains, mutually isolated and isolated from workspace data: License & Extension Shop catalog/orders (§3.12a), Public Store catalog/orders (with buyer refs), Equipment Store listings (developer-owned platform records) — per REQ-030 "data, access, API" isolation (ADR-018). *(Corrected 2026-10-28, pre-Phase 4 reconciliation: former text "both stores are isolated from each other" predated ADR-018's three-surface model.)*
- **Auditability:** publication, price/stock changes, purchases, entitlement issuance, cross-surface access denials → `AuditEvent` (REQ-016, REQ-056, REQ-010, REQ-030).
- **Access patterns & logical indexes:** published listings by (store, category, status); orders by (buyer, status); idempotency key unique; price/stock history by (listing_id, timestamp).

### 3.12a License & Extension Shop — entity family (Direkonsiliasi & DIIMPLEMENTASI Phase 5-E — ADR-026)

> **Rekonsiliasi referensi (Phase 5-E, 2026-10-31):** tiga rujukan §3.12a sebelumnya (di bawah, serta `PHASE_2_TRACEABILITY.md` baris REQ-030) menunjuk section ini yang BELUM pernah ditulis — referensi menggantung. Section ini kini dibuat secara minimal untuk mendokumentasikan entity family yang BENAR-BENAR diimplementasi pada Phase 5-E (dengan bukti file/migration), mengikuti kontrak ARCHITECTURE.md §7 + ADR-018 Decision 4/5 + ENTITLEMENT_MODEL.md §8. TIDAK ada entity baru yang dikarang di luar yang diimplementasi.

**Scope surface:** License & Extension Shop SAJA (ADR-018 surface 1) — jalur publik first-license purchase, renewal, dan extension purchase. BUKAN Public Store (§3.12 Public Store objects) dan BUKAN Developer Equipment Store (§3.12 Equipment objects). Isolasi structural: entity family `Shop*` terpisah penuh — tidak ada tabel bersama, tidak ada cross-link, tidak ada relabel (REQ-030).

| Entity (implemented — `prisma/schema.prisma` + migration `20261031120000_phase5e_shop_commerce_foundation`) | Purpose | Key attributes | Relationships / cardinality | States | Key invariants |
|---|---|---|---|---|---|
| `ShopProduct` | Katalog produk shop — information architecture: apa yang dapat dibeli + target issuance + surface ownership | id, code (unique), kind (`LICENSE`/`EXTENSION` — closed set, CHECK DB), displayName, status (`ACTIVE`/`INACTIVE`/`WITHDRAWN`; default `INACTIVE`), tierId?, definitionId? | N—1 `LicenseTier` (kind=LICENSE; TIDAK duplikasi tier); N—1 `ExtensionDefinition` (kind=EXTENSION; TIDAK duplikasi definisi); 1—N `ShopOrderIntentLine` | ACTIVE, INACTIVE, WITHDRAWN (WITHDRAWN terminal) | Tanpa harga/pajak/currency/diskon/gateway (OD-06/OD-133); default INACTIVE = tidak dapat dibeli sampai diaktifkan eksplisit; integritas kind↔target fail-closed di service |
| `ShopOrderIntent` | Commercial INTENT — BUKAN paid order (prompt 5-E §12: INTENT ≠ PAID ≠ COMPLETED PAYMENT ≠ ACTIVE ENTITLEMENT) | id, workspaceId, buyerUserId? (atribusi server-side), status, idempotencyKey (unique — anti-duplication), completionSource?, completedAt?, issuedAt?, cancelledAt? | N—1 `Workspace` (target issuance SELALU workspace — ENTITLEMENT_MODEL §8); N—1 `User` (buyer, SetNull); 1—N `ShopOrderIntentLine` | OPEN → COMPLETED → ISSUED; CANCELLED dari OPEN (**PROVISIONAL — OD-135 OPEN**; tanpa state payment/refund) | completionSource HANYA diisi verified completion boundary dari sumber internal tepercaya (union tertutup; satu-satunya anggota Phase 5-E = `NON_PRODUCTION_TEST_SIMULATION`); `client says paid` tidak pernah dipercaya; idempotencyKey unik (state-convergence; ADR-017) |
| `ShopOrderIntentLine` | Line item intent | id, orderIntentId, productId, quantity (≥1, CHECK DB) | N—1 `ShopOrderIntent` (Restrict); N—1 `ShopProduct` (Restrict) | — (tanpa lifecycle) | quantity dibawa apa adanya ke issuance (caller-supplied; tanpa perhitungan kuota — OD-05/OD-06); tanpa snapshot duplikat produk (re-validasi fail-closed saat issuance) |

**Order-intent boundary:** intent dibuat server-side dengan otorisasi deny-by-default (key kanonik satu-satunya: `store.order.create`, AUTHORIZATION_MODEL §4.12; TIDAK diikat preset — OD-122 OPEN; tanpa fallback owner). Eligibility server-side per line (first-license / renewal / extension; denial teraudit) SEBELUM intent dibuat. Intent TIDAK membuat License/ExtensionInstance dan TIDAK menyentuh entitlement engine.

**Issuance boundary:** HANYA intent COMPLETED (verified completion) dapat di-issue. Issuance membuat `License(status=PURCHASED)` atau `ExtensionInstance(status=PURCHASED)` dengan `sourceType="SHOP_ORDER_INTENT"` + `sourceRef=intent id` + term data **caller-supplied** (kolom 5-B dipakai apa adanya; TIDAK ada durasi/window/grace default — OD-108). **TIDAK ada transisi PURCHASED → ACTIVE dari kode commerce** — aktivasi HANYA via layanan lifecycle 5-D (ADR-025).

**Entitlement boundary:** `Commerce → License / ExtensionInstance → lifecycle 5-D → engine entitlement 5-C`. TIDAK ada `EntitlementGrant` (lihat catatan rekonsiliasi §3.5 — bukan second source of truth).

**Ownership & implementation mapping:** domain `src/lib/shop/` (vocabulary/authorization/catalog/eligibility/order-intent/completion/issuance); audit kategori `COMMERCE` pada `AuditEvent` Phase 4 (framework sama — bukan framework kedua). Keputusan desain lengkap: `adr/ADR-026-phase5e-shop-commerce-foundation.md` (PROPOSED). Laporan: `PHASE_5E_REPORT.md`.

**Tetap BLOCKED (tidak dimodelkan):** harga/currency/pajak/refund/gateway/charging produksi (OD-06), otoritas harga/diskon (OD-133), state machine invoice/order final (OD-135), durasi renewal/expiry/grace (OD-108), kuota/seat counting (OD-05), binding permission→role (OD-122), database produksi (OD-01). UI/commerce experience = Phase 22 (ROADMAP).

### 3.13 Document/Evidence

**Purpose:** the controlled document library (hierarchy D1..D8), versioned documents, evidence workflow, sign-off, retention — per `DOCUMENT_EVIDENCE_MODEL.md` (Phase 1 baseline artifact) and REQ-042/043, REQ-078..084. ISOrider capability; basic evidence exists on lower tiers (REQ-013 tier availability per LICENSE_MATRIX).

| Entity | Purpose | Key attributes | Relationships / cardinality | States | Key invariants (REQ) |
|---|---|---|---|---|---|
| `DocumentHierarchyLevel` | Configurable hierarchy level (default D1 Policy … D8 Report) (REQ-078) | id, workspace_id, level code, name, parent level | self-referencing parent/child | ACTIVE, RETIRED | Hierarchy configurable per organization without code change (REQ-078); minimum granularity = OD-144 |
| `Document` | Controlled document identity (stable `doc_id`; versions share it) | id, workspace_id, doc_id (business key), title, type/level, owner, approver(s), classification, ACL ref, retention class, process relations, status | 1—N `DocumentVersion` | aggregate status derived from versions | 15-field metadata model validated per transition (REQ-079; `DOCUMENT_EVIDENCE_MODEL.md` §2) |
| `DocumentVersion` | Immutable-on-approve version of a document | id, document_id, version no, content/file ref, status, effective date, review date, reason | N—1 `Document`; 0..1—1 superseded-by link | draft → in-review → approved → effective → superseded / obsolete → archived → disposed (REQ-080; full transition guards in §6.5) | Old version unusable after superseded (REQ-080); approvals immutable + amendment/version history (REQ-027) |
| `DocumentAclEntry` | ACL: principal (user/role) × permission (view/download/edit/approve/manage-ACL) (REQ-082) | id, document_id, principal, permission | N—1 `Document` | ACTIVE | Enforced server-side; every view/download logged (REQ-082); classification ≠ ACL (classification informs defaults) |
| `FormTemplate` | Structured form/checklist template (D6) | id, workspace_id, field schema, version | 1—N `EvidenceRecord` | draft/effective lifecycle mirrors document lifecycle | Evidence captures the form version used (REQ-083 metadata) |
| `EvidenceRecord` | Instance of executed form/checklist bound to a real transaction (D7) (REQ-083) | id, workspace_id, form template ref + version, context refs (event/asset/assignment), values, notes, actor, server timestamp | N—1 `FormTemplate`; 1—N `EvidenceAttachment`; 0..N—1 `SignOff` | DRAFT → SUBMITTED → IN_REVIEW → (REWORK → DRAFT) → SIGNED_OFF → LOCKED (REQ-083; §6.6) | Locked = immutable via API; corrections only via amendment (REQ-083, REQ-027); evidence without transaction context is invalid (DOCUMENT_EVIDENCE_MODEL.md; historical MC §10) |
| `EvidenceAttachment` | Uploaded proof file (photo/video/file) | id, evidence_id, media ref, hash | N—1 `EvidenceRecord` | ACTIVE | Type/size per policy; bound to its evidence (REQ-083; limits = OD-137) |
| `SignOff` | Sign-off binding: actor + role + server time + context + approved version (legal strength = OD-103, no claim made) | id, evidence/document version ref, actor, role, timestamp, context | 0..N—1 `EvidenceRecord`/`DocumentVersion` | EXECUTED | Binding is a technical fact; no legal-strength claim (OD-103) |
| `Amendment` | Correction record linking new version to prior with mandatory reason | id, target ref, prior version ref, reason, actor | chain | EXECUTED | Old values remain readable; audit trail links both (REQ-027, REQ-083) |
| `RetentionClass` | Retention class definition (periods = OD-104, no numbers here) | id, workspace_id, class code, disposition rule | N—1 from `Document` | ACTIVE | No retention numbers in this document (OD-104) |
| `DispositionTask` | End-of-retention disposition queue entry | id, document/evidence ref, due, action, executor, audit | N—1 target | QUEUED, EXECUTED, HELD | Execution audited with tombstone; legal hold defers (REQ-081; OD-09) |

- **Tenant boundary:** all tenant-scoped.
- **Auditability:** all metadata actions + every view/download → append-only logs (REQ-079, REQ-082); document transitions audited (REQ-080).
- **Access patterns & logical indexes:** documents by (workspace_id, level, status); by (doc_id) unique per workspace; effective-version lookup by (document_id, status=effective); evidence by (context ref, status); review-date reminder sweep by (status=effective, review_date).

### 3.14 Audit

**Purpose:** the platform-wide, append-only audit/event record — the system of record for "who did what, when, in which context, with what result" (MC §4 auditability; `SECURITY.md` audit/security event model).

| Entity | Purpose | Key attributes | Relationships / cardinality | States | Key invariants (REQ) |
|---|---|---|---|---|---|
| `AuditEvent` | Append-only audit record emitted by all contexts | id, actor, actor roles, action, object type/id, tenant context, result (success/denied), server timestamp, request context, correlation id | references any object | — (append-only) | Never editable/deletable via API; sensitive transitions mandatory (§2.10); no secrets in payloads (REQ-095 log hygiene); retention/access params = OD-138/OD-164 |
| `AuditExportBundle` | Controlled auditor export package (REQ-084) | id, auditor grant ref, scope snapshot, manifest, produced_at, checksum | N—1 `AuditorAccessGrant` (ref §3.1) | REQUESTED, PRODUCED, EXPIRED | Only in-scope content; every export recorded (REQ-084); format = OD-143/OD-111 |

- **Tenant boundary:** `AuditEvent` is platform-global with mandatory tenant-context attribute (tenant-scoped queries enforce isolation); export bundles scoped by grant.
- **Auditability:** access to audit data is itself restricted and audited (OD-138).
- **Access patterns & logical indexes:** by (actor, time); by (object type/id, time); by (tenant, action, time) for auditor review; append-only storage — updates forbidden at integrity level (`PROPOSED`, e.g. WORM-style semantics; mechanism depends on OD-01).

### 3.15 Finance/Commercial

**Purpose:** CRM, quotation/order/contract, invoicing/payment states, complaints, and the event dossier — maxRider+ (REQ-011, REQ-046; PROC-01/03/11/12/13). Commercial values/prices/taxes are NEVER invented (OD-06); accounting integration scope is per owner decision (PRODUCT_SCOPE non-goal #1).

| Entity | Purpose | Key attributes | Relationships / cardinality | States | Key invariants (REQ) |
|---|---|---|---|---|---|
| `CustomerAccount` | CRM customer record (maxRider; ✗ mini) | id, workspace_id, name, contacts, classification | 1—N `Inquiry`, `Quotation`, `SalesOrder`, `Contract`, `Invoice`, `Complaint` | ACTIVE, ARCHIVED (`PROPOSED`) | CRM data confidential-class (proposed classification, OD-140) |
| `Inquiry` | Incoming brief/inquiry (PROC-01) | id, workspace_id, customer ref, brief content, channel | N—1 `CustomerAccount` | NEW, QUALIFIED, CONVERTED, DROPPED (`PROPOSED`) | Feeds quotation; miniRider has no CRM (PROC-01 ✗ mini) |
| `Quotation` | Commercial offer document | id, workspace_id, customer ref, lines, validity, version | N—1 `CustomerAccount`; 0..1—1 `SalesOrder` (conversion) | DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, SUPERSEDED (`PROPOSED`) | Price change after accept = amendment/new version, never silent edit (UC-4002 F2) |
| `Contract` | Agreement record linked to documents | id, workspace_id, customer ref, terms ref, document ref (Document ctx) | N—1 `CustomerAccount` | DRAFT, ACTIVE, COMPLETED, TERMINATED (`PROPOSED`) | Signed-contract legal handling outside platform claims until OD-103/OD-09 resolved |
| `SalesOrder` | Confirmed order (converted from quotation) | id, workspace_id, customer ref, lines, status, version | 0..1—1 `Quotation`; 1—N `Invoice`; N—M `Event` (services rendered) | DRAFT, CONFIRMED, IN_PROGRESS, FULFILLED, CANCELLED (`PROPOSED`) | Conversion requires complete data (UC-4002 F1) |
| `Invoice` | Billing document with controlled states (PROC-11; REQ-046 "payment/invoice states per integration") | id, workspace_id, order ref, number (business key), lines, status, version | N—1 `SalesOrder`; 1—N `Payment` | DRAFT → SENT → PAID / VOID (+ credit note) (`PROPOSED` — final state machine = OD-135) | Invalid transitions rejected (paid→draft forbidden); sent invoices never deleted — void/credit only (UC-4003 F2); integration errors → controlled retry, no double-charge (UC-4003 F4) |
| `Payment` | Payment attempt/record (gateway = OD-06, vendor-agnostic abstraction) | id, invoice ref, amount ref, provider ref, status, idempotency key | N—1 `Invoice` | PENDING, SUCCEEDED, FAILED, REFUNDED (`PROPOSED`) | Idempotent; no fabricated commercial values (OD-06) |
| `Complaint` | Customer complaint/feedback record (PROC-12) | id, workspace_id, customer ref, event ref, content, status | N—1 `CustomerAccount`; 0..1—1 `Event` | NEW, IN_TRIAGE, IN_PROGRESS, RESOLVED, OVERDUE-FLAGGED (`PROPOSED`) | Overdue tracking from data (UC-4005 F3); may open NCR (IMS) |
| `EventDossier` | Project/event dossier aggregating transactions→evidence (REQ-046) | id, workspace_id, event ref, links | 1—1 `Event` (ref §3.4) | OPEN, CLOSED (`PROPOSED`) | Dossier links transactions to evidence (REQ-046 acceptance) |

- **Tenant boundary:** all tenant-scoped.
- **Auditability:** all commercial transitions audited; gateway/integration events audited (REQ-046; OD-06 scope).
- **Access patterns & logical indexes:** invoices by (workspace_id, status); by (order ref); payments by (invoice, status); complaint overdue sweep by (status, due); dossier by (event_id).

### 3.16 IMS

**Purpose:** the integrated management system objects for ISOrider (REQ-012, REQ-070..087; PROC-201..216): linked process/control/workflow architecture, standards register (metadata only), risk, incident→NCR→CAPA chain, review, improvement, supplier/competency, sustainability KPIs. This is a platform **supporting** IMS — no certification/compliance claim (MC §7; ISO_IMS_BLUEPRINT §1/§5; REQ-039); ISO catalog verification is `BLOCKED` (STD register, OD-160) and no standard text is ever stored (REQ-040, REQ-072).

| Entity | Purpose | Key attributes | Relationships / cardinality | States | Key invariants (REQ) |
|---|---|---|---|---|---|
| `ProcessDefinition` | A managed process object (linked, not a form pile — REQ-070) | id, workspace_id, code (maps PROC-xxx), name, owner | 1—N `ControlDefinition`; 1—N `WorkflowDefinition`; N—M documents | ACTIVE, RETIRED | Process must link to control→workflow→transaction (REQ-070 acceptance: ≥1 full chain) |
| `ControlDefinition` | A control object bound to a process | id, process ref, control type, criteria | N—1 `ProcessDefinition` | ACTIVE, RETIRED | Part of the chain Process→Control→Workflow→Transaction→Evidence→Report (ISO_IMS_BLUEPRINT §3; PROCESS_MAP) |
| `WorkflowDefinition` | Executable workflow bound to process/control | id, process ref, steps, form refs | N—1 `ProcessDefinition` | DRAFT, ACTIVE, SUPERSEDED | Workflow executions produce `EvidenceRecord`s |
| `StandardRegisterEntry` | Metadata record for a standard (source, edition/status, verified date, owner) (REQ-071) | id, workspace_id, STD code, source, edition, verified date, owner | N—M `ClauseMapping` | REGISTERED, VERIFIED, NOT-VERIFIED-BLOCKED | **Without verified date, cannot be used for mapping** (REQ-071 acceptance); verification currently `BLOCKED` (STD register, OD-160) |
| `ClauseMapping` | Clause/reference mapping via metadata ONLY (REQ-072) | id, standard ref, clause ref, internal control/process ref | N—1 `StandardRegisterEntry` | ACTIVE, RETIRED | Zero verbatim standard text (REQ-040, REQ-072); metadata references only |
| `RiskRegisterEntry` | Risk assessment record (PROC-207) | id, workspace_id, process/event ref, risk, mitigations, status | N—M processes/events | OPEN, MITIGATED, ACCEPTED, CLOSED (`PROPOSED`) | — |
| `IncidentRecord` | Operational/HSE/infosec incident (PROC-211; REQ-075) | id, workspace_id, type, context refs, evidence refs | 0..1—N `Ncr` | REPORTED, TRIAGED, HANDLED, CLOSED (`PROPOSED`) | Incident→NCR→CAPA chain linked to transactions/evidence (REQ-075) |
| `Ncr` | Nonconformity record (PROC-214) | id, workspace_id, source (incident/audit/complaint), description, status | N—1 source ref; 1—N `Capa` | OPEN, IN_PROGRESS, CLOSED (`PROPOSED`) | Closed NCR immutable — amendment only (UC-7008 F3) |
| `Capa` | Corrective/preventive action with owner + due (PROC-214; REQ-075) | id, ncr ref, action, owner, due, evidence refs | N—1 `Ncr`; 0..1—1 `EffectivenessCheck` | PLANNED, IN_PROGRESS, IMPLEMENTED, VERIFIED, CLOSED | Closure requires effectiveness check (UC-7008 F1); overdue flagged (UC-7008 F2) |
| `EffectivenessCheck` | Verification that the action worked (REQ-075) | id, capa ref, method, result, evidence | 1—1 `Capa` | PASSED, FAILED | Failed check reopens action loop |
| `ManagementReview` | Periodic management review with inputs/decisions (REQ-076) | id, workspace_id, period, inputs, decisions | 1—N `ReviewActionItem` | PLANNED, HELD, CLOSED (`PROPOSED`) | Inputs/outputs/actions documented and tracked (REQ-076) |
| `ReviewActionItem` | Action item with owner + status (REQ-076) | id, review ref, action, owner, due, status | N—1 `ManagementReview` | OPEN, IN_PROGRESS, DONE, OVERDUE | Owner + status mandatory (REQ-076) |
| `ImprovementAction` | Continual improvement action tracked to verified closure (REQ-077, REQ-087) | id, workspace_id, source (KPI/NCR/feedback/review), action, owner, metrics, result evidence | N—M sources | OPEN → IN_PROGRESS → VERIFIED → CLOSED (REQ-077 cites this cycle) | Results linked to evidence (REQ-087) |
| `SupplierRecord` | Supplier/contractor record + qualification (REQ-073) | id, workspace_id, identity, qualification docs, status | 1—N evaluations | QUALIFIED, CONDITIONAL, DISQUALIFIED, ARCHIVED (`PROPOSED`) | Usage controlled by status; evaluation recorded with evidence (REQ-073) |
| `CompetencyRecord` | Competency/training record linked to roles/assignments (REQ-074) | id, workspace_id, member ref, competency, evidence | N—M `Role`/`EventAssignment` | VALID, EXPIRED | Assignment requiring competency checks the record — blocked if absent (REQ-074 acceptance) |
| `SustainabilityMetric` | KPI data entry per REQ-085 dictionary: name, unit, method/source, target, owner, baseline, period, data quality + measured/estimated flag (REQ-086) | id, workspace_id, KPI ref, period, value, quality, measured/estimated, evidence ref | N—1 KPI definition; 0..N—1 `EvidenceRecord` | DRAFT, REPORTED | Input without source/unit rejected (REQ-085); GHG numbers without verified methodology rejected/labeled estimated+pending (REQ-086; OD-105); targets = OD-106 |

- **Tenant boundary:** all tenant-scoped.
- **Auditability:** all lifecycle transitions audited; evidence links mandatory at key steps.
- **Access patterns & logical indexes:** open NCR/CAPA lists by (workspace_id, status, due); competency gate check by (member, competency, validity); sustainability metrics by (KPI, period); standard entries by (STD code, verified date).

### 3.17 Integration/Sync

**Purpose:** client-neutral integration and synchronization support: provider abstraction (WhatsApp OTP — OD-03; payment — OD-06), offline/sync queueing (OD-07), idempotency, export/import (OD-111), API versioning support (REQ-097). OD-02 (client strategy) does NOT block this context — it only constrains final client delivery.

| Entity | Purpose | Key attributes | Relationships / cardinality | States | Key invariants (REQ) |
|---|---|---|---|---|---|
| `ProviderIntegrationConfig` | Vendor-neutral provider configuration (auth provider, payment provider) | id, provider type, capability flags, credential reference (secret never inline), status | — | ACTIVE, DISABLED | Secrets server-side only (SECURITY.md; REQ-092); vendor selection = OD-03/OD-06 |
| `OutboxEvent` | Reliable outbound integration event (outbox pattern, `PROPOSED`) | id, event type, payload, status, attempts | stands alone | PENDING, SENT, FAILED, DEAD | Enables retries without duplication |
| `IdempotencyRecord` | Idempotency key registry for mutations (API/sync/notifications) | id, key (unique), request hash, result ref | stands alone | ACTIVE, EXPIRED | Duplicate key → same result, no double effect (REQ-060, REQ-038) |
| `SyncQueueItem` | Offline-originated action awaiting sync (only if OD-07 approves offline-first) | id, user/device, action, payload, client timestamp, conflict state | — | QUEUED, SYNCING, CONFLICT, APPLIED, REJECTED | Permission re-checked at sync time — offline action without right is rejected (REQ-038 acceptance); conflict reconciliation policy = OD-07 |
| `ConflictResolutionRecord` | Outcome of a sync conflict | id, sync item ref, resolution, resolver | N—1 `SyncQueueItem` | RESOLVED | Audited |
| `DataExportJob` | Controlled data export/import job (REQ-096) | id, requester, scope, format, status, audit ref | — | REQUESTED, RUNNING, COMPLETED, FAILED | Scope/format = OD-111; security classification of exports = OD-166 |

- **Tenant boundary:** config/jobs platform-scoped with tenant references; sync items user-scoped.
- **Auditability:** all sync rejections, conflict resolutions, export jobs audited.
- **Access patterns & logical indexes:** outbox by (status, attempts); idempotency by key unique; sync queue by (user, status); export jobs by (requester, status).

---

## 4. Mandatory conceptual separations (invariants) and how the model enforces them

Source invariants: `MASTER_CONTROL.md` §1/§2/§4, `ARCHITECTURE.md` §4/§5/§6, `TESTING.md` "Mandatory domain invariants", `SECURITY.md`. Each item below states the invariant, its source, and the enforcement mechanism **in this data model**.

### 4.1 `User != Workspace Membership != Role != Event Assignment`

- Source: MC §4; ARCHITECTURE.md §4; TESTING.md Identity invariant; REQ-025, REQ-050.
- Enforcement: four distinct entities in three distinct contexts — `User` (Identity, global), `Membership` + `Role`/`MembershipRoleAssignment` (Membership & Roles, tenant-scoped), `EventAssignment` (Event & Assignment, links Membership→Event). No foreign key path exists from `User` directly to `Event` or to `Role`; event data access requires BOTH an active membership AND an assignment (REQ-050 test matrix). Permission context is resolved through the chain `User → Membership → Role → Event Assignment → Permission Context` (ARCHITECTURE.md §4), which is exactly the relation ownership in §7.

### 4.2 Developer Role separate from workspace roles; Auditor Access a separate scoped time-bound grant

- Source: ARCHITECTURE.md §4; REQ-052, REQ-031, REQ-053, REQ-044.
- Enforcement: `DeveloperRoleAssignment` and `AuditorAccessGrant` live in the **Identity** context as global grants with **no** `workspace_id` and **no** relation to `Membership`/`Role`. A developer role therefore cannot be expressed as a workspace role (structural separation), cannot alter licenses/billing/broadcast (permission vocabulary has no such grant path from developer roles — REQ-031), and auditor access carries `read_only`, `scope`, and `expires_at` with automatic expiry enforced at access-check time (REQ-053). Role-model detail for stores = OD-101; auditor parameters = OD-110.

### 4.3 `Application != Membership`; `Application != Event Assignment`; `Acceptance != Automatic Workspace Access`

- Source: MC §1 (hiRider invariants); ARCHITECTURE.md §2/§6; SECURITY.md hiRider; REQ-013, REQ-063, REQ-064.
- Enforcement: `Application` (hiRider context) references only `RecruitmentOpening` + candidate `User`. It has no foreign key to `Membership` or `EventAssignment`. `RecruitmentDecision` produces no membership-creating side effect; the only path from decision to membership is an explicit `Invitation` issued through the Membership context and accepted by the user (UC-6004 alternate flow a1: "accept followed by separate membership invitation — not automatic"). Server-side tests can therefore prove that application status never changes workspace permissions (REQ-013 acceptance).

### 4.4 hiRider is NOT a license — `LicenseTier` has ONLY `miniRider`, `maxRider`, `ISOrider`

- Source: MC §1 ("hiRider bukan license, bukan tier keempat, dan bukan nilai pada `license_tier`"); LICENSE_MATRIX.md §1; TESTING.md (`hiRider != LicenseTier`).
- Enforcement: the `LicenseTier` reference entity (§3.5) is a closed three-value enumeration. hiRider appears in the model only as the **hiRider Recruitment bounded context** (a portal/capability with its own entities) and optionally as a `Capability` ("recruitment", "candidate discovery" — MC §2), never as a license value, tier, or extension. Any schema-level enum check in implementation must reject a fourth value.

### 4.5 `License != Capability != Extension`

- Source: MC §2 (entitlement taxonomy); ARCHITECTURE.md §5; LICENSE_MATRIX.md §5.
- Enforcement: three separate entity families in two contexts — `License`/`LicenseTier` (tier grant), `Capability`/`CapabilityRule` (domain feature rules), `ExtensionDefinition`/`ExtensionInstance` (additive purchasable units with their own canonical lifecycle `CATALOG → PURCHASED/ASSIGNED → ACTIVE → SUSPENDED/EXPIRED → RENEWED/REMOVED` per LICENSE_MATRIX.md §5). Effective access is computed from all of them plus role/permission, resource context, and object state (MC §2 formula) — never from a single field. A license never "contains" capabilities directly; `CapabilityRule` binds them, so tier changes are data changes, not schema changes (supports REQ-002).

### 4.6 Commerce surfaces — three separate domains (License & Extension Shop / Public Store / Developer Equipment Store)

- Source: MC §1 (three commerce surfaces, corrected 2026-10-28); ADR-018 (supersedes ADR-013 in part); LICENSE_MATRIX.md §4; REQ-030, REQ-010, REQ-016, REQ-055.
- Enforcement: disjoint entity families per surface. Public Store (`Product`/`ProductType`/`CatalogListing`/`StoreOrder`…) vs Equipment Store (`EquipmentListing`/`ListingMedia`/`StockItem`/`PriceRecord`) vs License & Extension Shop (§3.12a) — **no shared tables, no shared listings, no cross-links**; isolation is structural (REQ-030: three commerce surfaces fully isolated — data, access, API, issuance, audit). *(Corrected 2026-10-28, pre-Phase 4 reconciliation: the former parenthetical quoted REQ-030's pre-ADR-018 wording "two stores fully isolated".)* The **License & Extension Shop** (first-license/renewal path, §3.12a) keeps its own catalog/order domain so that license-gated surfaces never gate the first purchase. Access rules differ and are enforced server-side: Public Store access = user with a basic miniRider license (MC §1); Equipment Store = miniRider only, with API denial **audited** for any non-miniRider account (REQ-010 acceptance: denial is audited, not merely a hidden menu); License & Extension Shop = public purchase path (commercial values OD-06). UI hiding is never the control (MC §2).

---

## 5. hiRider domain model (per Phase 2 prompt §7; ARCHITECTURE.md §6)

**Reminder:** hiRider is a portal/capability — NOT a license, NOT a tier value (see §4.4). The objects below are the minimum conceptual set from ARCHITECTURE.md §6, **plus `ServiceOffer` (planned — remediasi F-01/ADR-021, 2026-10-28: penawaran jasa in-scope per baseline Master Control)**. Entities marked *(ref)* are owned by other contexts and listed here only to show the chain.

```
User (ref: Identity)
 └─ CandidateProfile ──< Skill
                     ──< PortfolioItem
                     ──< ServiceOffer (planned — ADR-021; lifecycle PROPOSED)
Workspace (ref: Workspace/Tenant)
 └─ RecruitmentOpening ──< Application ──< ApplicationStatusHistory
                        │              └─ Shortlist (entry)
                        │              └─ RecruitmentDecision
Invitation (ref: Membership & Roles) ──> Membership (ref) ──> EventAssignment (ref: Event & Assignment)
```

Chain (canonical, ARCHITECTURE.md §2): `User Profile → Recruitment Opening → Application → Recruitment Decision → Membership/Assignment` — membership follows explicit workspace authorization, never the application.

### 5.1 Object notes

| Object | Owner context | Notes |
|---|---|---|
| `User` / `CandidateProfile` | Identity / hiRider | One recruitment profile per user; visibility/privacy explicit (REQ-062; default = OD-109) |
| `Skill` | hiRider | Free/tagged skills on profile |
| `PortfolioItem` | hiRider | Work samples; media policy limits (OD-137) |
| `RecruitmentOpening` | hiRider | Workspace-owned posting; open/close controls applications (REQ-063); criteria checked at apply time |
| `Application` | hiRider | Candidate→opening; status + history (REQ-064) |
| `ApplicationStatusHistory` | hiRider | Append-only transition log with actor+reason (REQ-064) |
| `Shortlist` | hiRider | Selection state within an opening |
| `RecruitmentDecision` | hiRider | Accept/reject with actor + reason; no membership side-effect (§4.3) |
| `ServiceOffer` *(planned — ADR-021)* | hiRider | Penawaran jasa oleh kru — in-scope per baseline Master Control ("Marketplace layanan kru"); lifecycle/visibility/permission/API detail `PROPOSED` (desain final Phase 16); bukan license, bukan Application, tidak menciptakan membership/assignment |
| `Membership` *(ref)* | Membership & Roles | Created only via Invitation (REQ-049, REQ-051) |
| `EventAssignment` *(ref)* | Event & Assignment | Separate step after membership (REQ-050) |

### 5.2 Explicit lifecycles — **PROPOSED domain states (NOT owner-approved)**

The following example lifecycles come from Phase 2 prompt §7 examples and are recorded here as **proposed domain states**. They are NOT owner-approved final; an ADR is required to finalize them (see §11, candidate item). Requirement-anchored behavior is cited where it exists.

**RecruitmentOpening:** `DRAFT → OPEN → PAUSED → CLOSED` — `PROPOSED`
- OPEN accepts applications; CLOSED stops new applications but never deletes history (REQ-063 acceptance); PAUSED temporarily hides/blocks application (prompt §7 example); re-open preserves history (UC-6002 a1).

**Application:** `SUBMITTED → REVIEWING → SHORTLISTED → ACCEPTED / REJECTED / WITHDRAWN` — `PROPOSED`
- REQ-064 cites the behavioral lifecycle "apply→shortlist→accept/reject→withdraw, with status notifications & history"; invalid transitions rejected server-side; withdraw allowed before final decision (UC-6004); duplicate active application per opening rejected (UC-6003 F2). The exact state names/order above are the prompt's example and remain PROPOSED.

Explicit statement: **these example lifecycles are proposed, not owner-approved** — finalization requires an ADR (candidate decision, §11 row "hiRider lifecycle finalization").

---

## 6. Key state machines (logical)

All machines below are logical; storage is append-only transition history + current state. Where a REQ defines the lifecycle, the REQ is cited; parameter durations/gates explicitly OPEN are marked.

### 6.1 Workspace Membership (REQ-049 — requirement-cited)

```
INVITED ──accept──> ACTIVE ──suspend──> SUSPENDED ──reinstate──> ACTIVE
   │                  │ │                  │
   │ expire/revoke    │ ├──remove──> REMOVED (terminal for that row)
   ▼                  │ └──leave───> LEFT   (terminal for that row)
EXPIRED/REVOKED        └─ re-invite of removed/left member = NEW Membership row (history preserved)
```
- Guard: every transition is audited and **changes effective access immediately**; removed member loses access on next request (REQ-049 acceptance).
- Quota: seat allocated at INVITED/ACTIVE, released at REMOVED/LEFT (OD-05 owner-counting OPEN — see §8).

### 6.2 License (REQ-098 — requirement-cited; durations/gates = OD-108 OPEN)

```
PURCHASED → ACTIVE → (renewal window) RENEWAL_DUE → renewed → ACTIVE
                        │ (not renewed)
                        ▼
                     EXPIRED → GRACE → DOWNGRADED (to lower tier or suspended capabilities)
```
- REQ-098 cites: purchase→active→renewal→expiry→grace→downgrade; **rules & durations = owner decision (OD-108)** — no grace length, renewal window, or downgrade target is specified in this document.
- REQ-099 (requirement): on tier downgrade, data behavior is restrict/archive/delete per owner decision (OD-108) — **no silent data loss**; out-of-tier features locked server-side; data remains intact for upgrade back (forward-compatibility, §10).
- Every transition audited (REQ-098 acceptance).

### 6.3 Event lifecycle — `PROPOSED` (no owner-approved lifecycle exists)

```
DRAFT → SCHEDULED → ACTIVE → COMPLETED → CLOSED
          │           │
          │           └──> CANCELLED ──> ARCHIVED
          └───────────────────────────────┘
```
- Anchored on: event scheduling/execution flow (REQ-003, REQ-008, PROC-09); COMPLETED→CLOSED corresponds to dossier/evidence completion (PROC-13, REQ-046). **States are PROPOSED — need ADR** (§11 candidate).

### 6.4 Asset lifecycle (REQ-045 — requirement-cited; states per PROCESS_MAP ASM)

Requirement REQ-045 cites: procurement→identification→QR→inspection→reservation→picking→testing→dispatch→event→return→condition→repair/maintenance/calibration→retirement. Logical mapping to PROCESS_MAP states (ASM-S01..S11, ASM-D01/D02, transitions ASM-T01..T16 — maxRider/ISOrider full machine; miniRider = register subset only):

```
registered ─T01→ identified ─T02→ inspected ─T03→ reserved ─T04→ dispatched ─T05→ in-use
   (S01)        (S02)            (S03)         (S04)         (S05)          (S06)
                                                                         │
       ready (S10) ◄─T09/T10─ condition-assessed (S08) ◄─T07─ returned (S07) ◄─T06┘
         │                  │        │
         │ T11 (next reservation;   └─T08→ maintenance (S09) ─T10→ ready
         │     re-inspect if expired)        ▲
         ▼                                   │ T15
      retired (S11) ◄─T16──────── S08/S09 ───┘
Degraded states: damaged (D01) ◄─T12─ dispatched/in-use/returned ; lost (D02) ◄─T13─ dispatched/in-use
                 D02 ─T14→ returned (recovery) ; D01 ─T15→ maintenance
```
- Guards (from PROCESS_MAP): unique QR identity (T01); inspection evidence stored (T02); double-booking conflict detection with policy OD-107 (T03); condition capture mandatory at check-out/check-in (T04/T06, REQ-066); damage/lost reports require photo+notes (T12/T13); retirement decision audited with reason (T16, REQ-045).
- KPI utilization/downtime computed from these transitions' real data (REQ-069).

### 6.5 Document versioning (REQ-080 — requirement-cited)

```
draft → in-review → approved → effective → superseded → archived → disposed
                        │          └──────→ obsolete ──↗
                        └─ reject/rework → draft (with mandatory note)
```
- REQ-080 cites draft→review→approve→effective→superseded/obsolete with effective/review dates + reminders; superseded versions unusable (REQ-080 acceptance). Transition field-completeness guards per `DOCUMENT_EVIDENCE_MODEL.md` §4 (e.g. effective requires classification + retention + review date). Retention periods = OD-104; disposition audited (REQ-081); approval matrix/dual-control = OD-141; classification scheme = OD-140.

### 6.6 Evidence lock (REQ-083 — requirement-cited)

```
form(selected) → result(filled) → notes → upload(attachments) → metadata(server ts/actor/context/form version)
   → submit → review ─reject→ rework → draft(v2) → … → sign-off → LOCKED
                                                              └─ correction ONLY via amendment → new version → locked(v2)
```
- REQ-083 cites the full chain form→result→notes→upload→metadata→submit→review→sign-off→locked; locked records immutable via API; sign-off binds actor+role+time+context+version; legal strength of sign-off is NOT claimed (OD-103); evidence must be bound to a real transaction context (DOCUMENT_EVIDENCE_MODEL.md; historical MC §10).

### 6.7 Additional canonical/PROPOSED lifecycles (summary)

| Object | Lifecycle | Status/Source |
|---|---|---|
| Extension instance | `CATALOG → PURCHASED/ASSIGNED → ACTIVE → SUSPENDED/EXPIRED → RENEWED/REMOVED` | Canonical (`LICENSE_MATRIX.md` §5) |
| RecruitmentOpening | `DRAFT → OPEN → PAUSED → CLOSED` | PROPOSED (§5.2) — needs ADR |
| Application | `SUBMITTED → REVIEWING → SHORTLISTED → ACCEPTED/REJECTED/WITHDRAWN` | PROPOSED (§5.2) — needs ADR |
| Invitation | `PENDING → ACCEPTED / EXPIRED / REVOKED` | PROPOSED (REQ-051 semantics) |
| Equipment listing | `draft / published / archived` | REQ-055 (cited) |
| Invoice | `DRAFT → SENT → PAID / VOID (+credit note)` | PROPOSED — final machine = OD-135 |
| Improvement action | `open → progress → verified → closed` | REQ-077 (cited) |
| Membership | see §6.1 | REQ-049 (cited) |
| License | see §6.2 | REQ-098 (cited; OD-108 params) |

---

## 7. Cross-context relationship map

Text/ASCII map of the main relations. Notation: `A ──own──> B` = relation owned by the context of A (A side holds/enforces the FK conceptually). Contexts numbered as in §3.

```
                        ┌──────────────────────────── PLATFORM (global) ─────────────────────────────┐
                        │  [1 Identity] User ──< AuthenticationMethod, Session, VerificationRequest │
                        │       │                  AccountRecoveryFlow                                │
                        │       ├──< DeveloperRoleAssignment (REQ-052)                                │
                        │       └──< AuditorAccessGrant (REQ-053) ──scope──> [2]/[13]                 │
                        │  [12 Commerce] Product ──< CatalogListing ; StoreOrder ──< StoreOrderLine   │
                        │  [14 Audit] AuditEvent (refs all) ; AuditExportBundle ──> AuditorAccessGrant│
                        └────────────────────────────────┬───────────────────────────────────────────┘
                                                         │ (memberships, grants, purchases)
┌────────────────────────────── TENANT (per Workspace [2]) ┴────────────────────────────────────────────┐
│                                                                                                       │
│  [3 Membership&Roles]  User* ───< Membership >─── Workspace [2 owns Workspace]                        │
│        Membership ──< MembershipRoleAssignment >── Role >── Permission                                │
│        Invitation ──produces──> Membership (REQ-051)   Seat ──0..1── Membership (REQ-009, OD-05)      │
│                                                                                                       │
│  [5 Entitlement&License] Workspace ──< License >── LicenseTier(miniRider|maxRider|ISOrider)           │
│        License/Extension ──< EntitlementGrant ──enforces──> Seat/TierQuota (§8)                       │
│        [6 Extension] ExtensionInstance ──contributes──> TierQuota ; ──< ExtensionDefinition           │
│                                                                                                       │
│  [4 Event&Assignment]  Event ──< EventAssignment >── Membership (REQ-050)                             │
│        Event ──< RundownItem, EventChatMessage, EventReport                                           │
│                                                                                                       │
│  [9 TechnicalRider] TechnicalRider ──> Event (mandatory when published, REQ-004)                      │
│  [10 MediaKit]       MediaKit ──> Event (mandatory, REQ-005) ; ──> MediaKitTemplate                   │
│                                                                                                       │
│  [8 Asset]  Asset ──< Reservation >── Event ; Asset ──< AssetMovement >── Event (REQ-065/066)         │
│             Asset ──< InspectionRecord/MaintenanceTicket/AssetIncident/RetirementRecord (REQ-045)     │
│                                                                                                       │
│  [15 Finance] CustomerAccount ──< Inquiry/Quotation ──> SalesOrder ──< Invoice ──< Payment             │
│             SalesOrder >── Event ; EventDossier ──> Event (REQ-046)                                   │
│                                                                                                       │
│  [13 Document/Evidence] Document ──< DocumentVersion ; FormTemplate ──< EvidenceRecord                │
│             EvidenceRecord ──context──> Event/Asset/Assignment ; SignOff ; Amendment (REQ-083)        │
│                                                                                                       │
│  [16 IMS] ProcessDefinition ──< ControlDefinition/WorkflowDefinition (REQ-070)                        │
│           IncidentRecord ──> Ncr ──> Capa ──> EffectivenessCheck (REQ-075)                             │
│           StandardRegisterEntry ──< ClauseMapping (metadata only, REQ-072)                            │
│           SupplierRecord, CompetencyRecord──>Role/Assignment (REQ-073/074)                            │
│           SustainabilityMetric ──evidence──> EvidenceRecord (REQ-085/086)                             │
│                                                                                                       │
│  [11 Notification] NotificationMessage ──< NotificationDelivery ──> User/Workspace targets (REQ-059)  │
│  [17 Integration/Sync] OutboxEvent, IdempotencyRecord, SyncQueueItem, DataExportJob (cross-cutting)   │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
                       ┌────────────────────────── hiRIDER PORTAL (cross-tenant capability) ─────────┐
                       │  [7 hiRider] CandidateProfile ──1:1──> User* (global)                       │
                       │     Workspace ──< RecruitmentOpening ──< Application ──> User*              │
                       │     Application ──< ApplicationStatusHistory ; Shortlist                    │
                       │     RecruitmentDecision ──NO FK──> Membership/EventAssignment (§4.3)        │
                       │     decision → Invitation (separate explicit step) → Membership → Assignment│
                       └──────────────────────────────────────────────────────────────────────────────┘
  * User is owned by [1 Identity]; all other contexts reference it. Audit [14] references everything.
```

Relation-ownership summary (who enforces integrity of the link):

| Relation | Owning context |
|---|---|
| User↔Workspace (via Membership), Invitation, Seat | Membership & Roles |
| Membership↔Event (EventAssignment) | Event & Assignment |
| Workspace↔License/Tier, EntitlementGrant, TierQuota | Entitlement & License |
| ExtensionInstance→Workspace/quota | Extension (issuance via Commerce order) |
| Opening↔Application↔Decision↔User | hiRider Recruitment |
| Asset↔Event (Reservation/Movement) | Asset |
| Rider/MediaKit→Event | Technical Rider / Media Kit respectively |
| Evidence↔(Event/Asset/Assignment) context binding | Document/Evidence |
| Order→EntitlementGrant issuance | Developer Commerce (grant owned by Entitlement) |
| AuditEvent→any object | Audit |
| Sync/Idempotency↔any mutation | Integration/Sync |

---

## 8. Seat / quota concept (REQ-009; OD-05 OPEN)

**Conceptual model (`PROPOSED` except where REQ-cited):**

```
TierQuota (tier: miniRider → base crew limit 5, REQ-009)
        + Σ ExtensionInstance contributions (e.g. "+10 seat package", REQ-018)
        = EffectiveSeatCapacity(workspace)
                │
                ▼
Seat (workspace_id, state: AVAILABLE|ALLOCATED|RELEASED) ──0..1──> Membership (INVITED/ACTIVE)
                │
                ▼ enforcement point: Membership creation/invitation + EventAssignment is NOT seat-gated
EntitlementGrant (license + extensions active) ──gates──> capacity is usable at all
```

- **Member ↔ Seat:** a Seat is allocated when a Membership enters INVITED/ACTIVE and released at REMOVED/LEFT. One active Membership occupies at most one Seat in its workspace (`PROPOSED`).
- **Quota ↔ Entitlement relationship:** capacity is the sum of the tier base quota (TierQuota) plus active extension seat contributions; if the underlying License is EXPIRED/DOWNGRADED beyond grace, capacity enforcement follows the license state machine (§6.2, OD-108) — e.g. features restricted, but no data loss (REQ-099).
- **Enforcement point (`PROPOSED`, server-side only):** (1) `Invitation` creation and acceptance — invite beyond capacity rejected with a clear message and an upgrade/extension path if available (REQ-009 acceptance; UC-1005 F3/F4); (2) membership re-activation; (3) any entitlement check that depends on seat count. All denials audited (REQ-024). UI hiding is never the enforcement (MC §2).
- **OPEN — OD-05:** whether the workspace owner counts toward the 5-crew quota is **OPEN (owner decision)**. The model keeps `owner_counted_in_quota` as an explicit parameter of `TierQuota`/enforcement so either decision is a data change, not a schema change. No seat/billing semantics beyond this are finalized (OD-05 also gates final quota/billing enforcement).

---

## 9. Access patterns & logical index strategy

Logical only — physical index types depend on OD-01. General rules (`PROPOSED`):

1. **Tenant-first:** every tenant-scoped access pattern begins with `workspace_id` as the leading key; composite keys of the form `(workspace_id, …)`.
2. **Status+time:** lifecycle list views filter by `(workspace_id, status)` ordered by time — time-ordered IDs (§2.1) support this.
3. **Uniqueness as integrity:** unique constraints double as business-rule enforcement (active membership per (workspace,user); active application per (opening,candidate); QR code; idempotency key; doc_id per workspace; session/verification tokens).
4. **Soft-state visibility:** portal/store visibility queries filter by publication status only (published/open/effective) — never by deletion flags.

Main query patterns per context and supporting keys:

| Context | Query pattern | Supporting logical keys |
|---|---|---|
| Identity | login by identifier; active sessions per user; auditor grant expiry sweep | unique (method, identifier); (user_id, status); (expires_at) |
| Workspace | workspaces for user; published workspace profile | membership join (user_id, status=ACTIVE); (workspace_id, published) |
| Membership & Roles | team list; my workspaces; invite validation; quota computation | (workspace_id, status); (user_id, status); unique token; (workspace_id, seat state) |
| Event & Assignment | events for member ("my assignments"); crew list for event; schedule overlap | (membership_id, status); (event_id); (workspace_id, schedule window) |
| Entitlement & License | effective tier for workspace; active grants; capability evaluation | (workspace_id, status, valid window); (capability_id) |
| Extension | active extensions per workspace; renewal sweep | (workspace_id, status, type); (status, term end) |
| hiRider | openings visible to candidate; my applications; applications per opening; shortlist | (status=OPEN + access criteria); (candidate, status); (opening_id, status); unique (opening_id, candidate) |
| Asset | availability window (double-booking check); QR lookup; due/overdue maintenance; KPI computation | (asset_id, window overlap, status); unique QR code; (workspace_id, due_at, status); movement/reservation time series |
| Technical Rider | riders per event; drafts without event | (event_id); (workspace_id, status=DRAFT) |
| Media Kit | kits per event; templates | (event_id); (workspace_id, status) |
| Notification | inbox per recipient; retry sweep; idempotency | (recipient, status); (message_id, status); unique idempotency key |
| Commerce | published listings by store/category; order history; price/stock history | (store, status, category); (buyer, status); (listing_id, timestamp) |
| Document/Evidence | library browse; effective version; evidence by context; review-date reminders | (workspace_id, level, status); (document_id, status=effective); (context ref, status); (status=effective, review_date) |
| Audit | actor timeline; object timeline; tenant review | (actor, time); (object type/id, time); (tenant, action, time) — append-only |
| Finance | invoice status board; order→invoice chain; complaint overdue | (workspace_id, status); (order_id); (status, due) |
| IMS | open NCR/CAPA; competency gate; KPI by period; standards usable for mapping | (workspace_id, status, due); (member, competency, validity); (KPI, period); (STD code, verified date) |
| Integration/Sync | outbox retry; sync queue per user; export jobs | (status, attempts); (user, status); (requester, status) |

---

## 10. Migration & data integrity principles (REQ-029, REQ-099, REQ-002)

1. **Controlled migrations (REQ-029):** every schema change ships as a reviewed, versioned migration; migrations are ordered, additive-by-default, and **reversible where feasible**; destructive or lossy operations require explicit review and are forbidden on data-bearing environments (`db:push --accept-data-loss` pattern prohibited — REQ-029 acceptance). Migration tooling choice follows OD-01.
2. **Referential integrity:** all cross-entity relations in §3 carry integrity rules (foreign-key semantics, composite uniqueness per §9); the model prefers explicit junction entities (Membership, EventAssignment, AssetSetItem, MembershipRoleAssignment) over implicit joins so lifecycle/audit attach to the relation itself.
3. **No silent data loss (REQ-099):** tier downgrade behavior (restrict / archive / delete) is an owner decision — **OD-108 OPEN**; delete is never a default; out-of-tier features are locked server-side while data remains intact and re-accessible on upgrade (REQ-099 acceptance).
4. **Forward compatibility for tier upgrade (REQ-002):** tier growth enriches the same domain — no application switch, no data rebuild, no parallel per-tier databases (REQ-001; historical W-5 rule of the superseded Phase-1 LICENSE_MATRIX is consistent). Schema is tier-agnostic: tier differences live in entitlement data (§3.5/§4.5), so mini→max→ISO upgrade changes license rows, not tables.
5. **Immutability migration rules:** approved/locked records are never rewritten by migrations; structural changes to immutable stores are additive (new versions, amendments), preserving REQ-027/REQ-083 guarantees across upgrades.
6. **Audit continuity:** audit/event stores are append-only across migrations; retention/disposition of audit data follows OD-138/OD-164 (parameters OPEN).
7. **Import/export (REQ-096):** round-trip export/import design is gated by OD-111 (scope/format) and OD-166 (export security classification); the model keeps stable business IDs to support round-tripping.
8. **Downgrade data states (`PROPOSED` mapping, final = OD-108):** RESTRICT (features locked, data read-only or hidden), ARCHIVE (data moved to archived state, still owned and restorable), DELETE (only with explicit owner decision + audit; tombstones retained).

---

## 11. Open questions table (existing OD IDs only — no invented IDs)

Only OD IDs registered in `OPEN_DECISIONS.md` are used below. New needs are listed as **"candidate — requires registration"** (no ID assigned; registration by owner/orchestrator into OPEN_DECISIONS.md, then ADR).

| # | Open question | Data-model impact | OD ID (existing) | Status |
|---|---|---|---|---|
| 1 | Production database (physical types, physical migration tooling, physical index types) | Physical encoding of §2.1 identifiers, §9 index strategy, audit WORM mechanics | OD-01 | OPEN — does not block this logical model |
| 2 | Owner seat semantics (owner counted in 5-crew quota?) | `owner_counted_in_quota` parameter of TierQuota/Seat enforcement (§8) | OD-05 | OPEN |
| 3 | Billing/commercial values, payment gateway, refund policy | StoreOrder/Invoice/Payment states finalized; commercial fields typed but valueless | OD-06 | OPEN |
| 4 | Offline-first strategy (local queue, sync, conflict) | SyncQueueItem/ConflictResolutionRecord activation; §3.17 | OD-07 | OPEN |
| 5 | Mobile/client delivery strategy | Client-neutral contracts only; no client-specific fields | OD-02 | OPEN — does not block Phase 2 |
| 6 | WhatsApp provider | ProviderIntegrationConfig for auth provider; vendor-agnostic abstraction | OD-03 | OPEN |
| 7 | Retention periods & disposition per class | RetentionClass values (no numbers in this doc) | OD-104 | OPEN |
| 8 | Reservation conflict policy (hard-block / warning / per-class hybrid) | Reservation states + overlap guard behavior (§3.8) | OD-107 | OPEN |
| 9 | License expiry/grace durations & downgrade data behavior | License machine parameters (§6.2); restrict/archive/delete (§10.8) | OD-108 | OPEN |
| 10 | hiRider default visibility & abuse policy | CandidateProfile visibility defaults; AbuseReport handling | OD-109 | OPEN |
| 11 | Auditor access parameters (default scope, max duration, NDA) | AuditorAccessGrant parameters (§3.1) | OD-110 | OPEN |
| 12 | Import/export scope & format | DataExportJob scope/format (§3.17) | OD-111 | OPEN |
| 13 | Session policy parameters | Session expiry/limits (§3.1) | OD-115 | OPEN |
| 14 | Legal/privacy obligations (incl. account anonymization, evidence metadata) | Soft-delete/anonymization mechanics (§2.3); sensitive metadata capture | OD-09 | OPEN |
| 15 | Sign-off legal strength (click-to-sign vs certified e-signature) | SignOff entity semantics; no legal claim | OD-103 | OPEN |
| 16 | Document classification scheme & defaults | Classification values (§3.13) | OD-140 | OPEN |
| 17 | Approval authority matrix & dual control | DocumentVersion approval guards (§6.5) | OD-141 | OPEN |
| 18 | Evidence location/sensitive metadata capture policy | EvidenceRecord metadata fields (§3.13) | OD-142 | OPEN |
| 19 | Document hierarchy minimum granularity | DocumentHierarchyLevel constraints (§3.13) | OD-144 | OPEN |
| 20 | Developer role model (store vs portal vs broadcast) | DeveloperRoleAssignment scopes (§3.1) | OD-101 | OPEN |
| 21 | Mandatory vs optional notification types; broadcast approval | NotificationPreference/mandatory types (§3.11) | OD-102 | OPEN |
| 22 | Double crew-assignment policy | EventAssignment overlap guard (§3.4) | OD-130 | OPEN |
| 23 | Chat/rundown concurrent-edit policy | Optimistic concurrency granularity (§2.4) | OD-131 | OPEN |
| 24 | Asset damage → incident/NCR automation | AssetIncident→IncidentRecord trigger (§3.8/§3.16) | OD-132 | OPEN |
| 25 | Store pricing/discount authority | PriceRecord change authorization (§3.12) | OD-133 | OPEN |
| 26 | hiRider application contact-data policy | Application privacy fields (§3.7) | OD-134 | OPEN |
| 27 | Invoice/order state machine finalization | Invoice states (§3.15, §6.7) | OD-135 | OPEN |
| 28 | Self-approval prohibition (documents/evidence) | Approval guards (approver ≠ last author) | OD-136 | OPEN |
| 29 | Media/storage quotas per tier | Media limits for listings/portfolio/attachments | OD-137 | OPEN |
| 30 | Audit log retention & access | AuditEvent retention (§3.14) | OD-138 (and OD-164) | OPEN |
| 31 | Broadcast anti-abuse limits | Notification rate limiting (§3.11) | OD-139 | OPEN |
| 32 | GHG methodology & KPI targets | SustainabilityMetric validation rules (§3.16) | OD-105 / OD-106 | OPEN |
| 33 | Product content language default | i18n handling defaults (§2.9) | OD-12 | OPEN (assumption: ID default) |
| 34 | Export security classification | DataExportJob security controls | OD-166 | OPEN |
| 35 | Tester/demo access scope (REQ-100) | Demo/tester data separation (labeled, no real customer data) | OD-06 (scope) | OPEN |

**Candidates — require registration (NO OD ID assigned yet; do not cite an ID until registered):**

| # | Candidate decision | Why needed |
|---|---|---|
| C-1 | Identifier standard (UUIDv7 vs alternative) | §2.1 is PROPOSED; `ARCHITECTURE.md` §9 defers to a Phase 2 ADR; interacts with OD-01 |
| C-2 | License holding scope: workspace-held license is modeled as primary; whether/how a *user-level* basic miniRider license exists for Public Store access derivation (e.g. users whose only workspace is on a higher tier) | MC §1 Public Store rule says "user with basic miniRider license"; derivation for higher-tier workspace members is not defined in control files — must not be silently interpreted |
| C-3 | Event lifecycle final states & transitions (§6.3) | No owner-approved event lifecycle exists anywhere in the baseline |
| C-4 | hiRider Opening/Application lifecycle finalization (§5.2) | Prompt §7 examples are explicitly NOT owner-approved; ADR required |
| C-5 | Equipment Store order/fulfillment model (physical goods vs digital) | REQ-055..057 cover listings/stock/media only; ordering semantics unspecified |
| C-6 | Abuse/moderation model finalization (AbuseReport; no dedicated REQ) | USE_CASES notes the missing dedicated requirement (UC-6005) |

---

## 12. Document status summary

| Item | Status |
|---|---|
| Whole document | `PROPOSED` — awaiting owner review / ADR acceptance |
| Bounded contexts documented | 17/17 (per `ARCHITECTURE.md` §3) — `PROPOSED` boundaries, refinable by ADR |
| Key state machines documented | Membership (REQ-049), License (REQ-098, OD-108 params), Event (PROPOSED), Asset (REQ-045/ASM), Document versioning (REQ-080), Evidence lock (REQ-083), Extension (canonical), plus Opening/Application (PROPOSED), Invitation, Listing (REQ-055), Invoice (PROPOSED/OD-135), Improvement action (REQ-077) |
| Physical database | `OPEN — OD-01`; this document is vendor-neutral |
| Forbidden-phrase self-check | Performed (see worklog Task 2-a): zero active contradictions **as of the Phase 2 scan 2026-10-27** — *superseded note 2026-10-28: the Phase 2 consistency audit (F-02/F-03/F-05) later found control-level conflicts outside this document; remediated in Phase 3 Gate A (see `PHASE_2_CONSISTENCY_REMEDIATION_REPORT.md` + scan `audit/phase3-scan/contradiction-scan-2026-10-28.txt`)* |
| Traceability | REQ-001..100 IDs cited as they exist in `REQUIREMENTS.md`; no REQ/OD ID invented or renumbered |
| Limitations | Desk-analysis basis (Phase 1 inputs are themselves PROPOSED); USE_CASES read via targeted search only; ISO standard verification remains `BLOCKED` (OD-160) and no standard text is referenced beyond metadata |
