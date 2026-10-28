# API ARCHITECTURE — epicRider

**Task ID:** 2-e (Phase 2 — architecture) · **Status:** `PROPOSED` — client-neutral API boundary/contract architecture for owner review / ADR acceptance.
**Implementation status:** `NOT FOUND` — the repository contains no epicRider API (current surface = one placeholder `GET /api` route returning a static message, `src/app/api/route.ts`; `SECURITY.md` current state: no implemented authentication/authorization/tenant isolation/entitlement). Everything in this document is target-state contract architecture, not an implementation claim.
**Sources:** `MASTER_CONTROL.md` (§1, §2, §4), `ARCHITECTURE.md` (§3 bounded contexts, §4, §5, §7, §8 client-neutral architecture, §9, §10), `DECISIONS.md`, `LICENSE_MATRIX.md`, `SECURITY.md`, `TESTING.md`, `CONTROL_CONSISTENCY_MATRIX.md`, `PHASE_2_DEPENDENCY_MATRIX.md`, Phase 2 prompt §12/§15/§16 (`upload/phase2_extract/epicRider_Phase_2_Prompt_zai.md`), `REQUIREMENTS.md` (REQ-001..100, `PROPOSED`), `OPEN_DECISIONS.md` (OD-01..OD-184 index), and the finalized Wave 1 sibling deliverables `DATA_MODEL_CONCEPT.md`, `AUTHORIZATION_MODEL.md`, `ENTITLEMENT_MODEL.md`, `THREAT_MODEL.md` (referenced by section; they are final for Phase 2 purposes).
**Evidence discipline:** every status label used below is one of `VERIFIED / PARTIAL / NOT FOUND / NOT TESTED / BLOCKED / PROPOSED / UNKNOWN-NEEDS DECISION`. No vendor, price, tax, payment gateway, duration, quota number, legal conclusion, or owner decision is invented; parameter-level gaps are mapped to existing OD IDs (§19).

---

## 1. Purpose & scope

### 1.1 What this document is

This is the **client-neutral API boundary/contract architecture** for epicRider, produced in Phase 2 as required by prompt §12 and `ARCHITECTURE.md` §11. It defines how any client (web today; future Android/iOS/Windows companions) talks to the platform: resource boundaries, authorization at the boundary, idempotency, pagination, filtering, concurrency, error model, validation, versioning, audit, tenant context, offline/sync considerations, and rate limiting.

### 1.2 What this document is NOT

- **NOT a production endpoint catalog.** Per prompt §12: Phase 2 must not produce the complete endpoint list for the whole application; what is required is contract/boundary architecture. All concrete resource paths in §17 are **ILLUSTRATIVE** — examples of how the boundary rules apply, not an implementation commitment and not a complete list.
- **NOT an implementation.** No epicRider endpoint exists today (`NOT FOUND`). Binding contracts per bounded context are produced phase-by-phase (ROADMAP), each validated against this architecture and via ADR (`ADR_REGISTER.md`, Task 2-f).
- **NOT a client technology choice.** OD-02 (mobile/client delivery strategy) remains `OPEN`; per `ARCHITECTURE.md` §8, OD-02 must not force Phase 2 to choose a client technology before contracts are established. This document deliberately constrains only the server contract.

### 1.3 Canonical directions fixed for this architecture (status `PROPOSED`)

The following directions are fixed for Phase 2 (the ADR register, Task 2-f, records them with full context/options):

| # | Direction | Where specified |
|---|---|---|
| D-1 | URL-path major versioning (`/api/v1/...`) | §12 |
| D-2 | `Idempotency-Key` header required on side-effecting mutations | §6 |
| D-3 | Optimistic concurrency via resource version token + `If-Match` | §9 |
| D-4 | Cursor-based pagination as the default for list endpoints | §7 |
| D-5 | RFC 9457 (Problem Details for HTTP APIs) style error model | §10 |
| D-6 | Path-scoped workspace tenant context (tenant resolved from the URL path, never from client-controlled headers alone) | §3, §14 |

### 1.4 Threat-model responsibilities owned by this document

`THREAT_MODEL.md` §7 assigns `API_ARCHITECTURE.md` as the **primary owning document** for the following categories; each is covered by a section below:

| TC | Category (THREAT_MODEL §6) | Covered in |
|---|---|---|
| TC-01 | Authentication abuse (rate limit / anti-abuse boundary) | §16 |
| TC-02 | Session theft (session boundary at TB-2) | §2.4, §5, §16 |
| TC-16 | Notification abuse (preview + idempotent send + limits) | §6, §16, §17 (EX-8) |
| TC-18 | Replay (idempotency, single-use tokens) | §6, §17 |
| TC-19 | Race conditions (optimistic concurrency) | §9 |
| TC-20 | Offline/sync authorization (future, OD-07) | §15 |
| TC-21 | Malicious file upload (boundary validation) | §11 |

This document is a **supporting** doc for TC-03, TC-04, TC-05, TC-06, TC-07, TC-08, TC-09, TC-22, TC-23, TC-24 (see the boundary ownership map, §18).

---

## 2. Client-neutrality principles

**One API, many clients (canonical — `ARCHITECTURE.md` §8, MC §4 "web adalah first-class channel").** The API/domain layer must serve desktop browser, tablet browser, mobile browser (REQ-019), and future Android/iOS/Windows clients (OD-02 `OPEN` — this document does not choose client technology; final delivery strategy belongs to an ADR, and Phase 23 delivery depends on it). The web client is the first-class channel but holds no architectural privilege: every capability reachable by the web UI is reachable through the same contract by any future client.

Principles:

1. **Business logic lives server-side once (REQ-020).** Authorization, entitlement, billing logic, validation, and state-machine rules are implemented exactly once, server-side. A second client must reuse the API contract **without copying authorization/billing logic** (REQ-020 acceptance criteria). Tier differences surface as entitlement-gated capability availability (REQ-024), never as a per-client or per-tier API surface — one continuous platform, one domain model, no parallel structures per tier (REQ-001).
2. **No web-only assumptions.**
   - Authentication/session credential transport must work for non-browser clients: secure cookies are acceptable for browsers, and a header-based session token path must exist for non-browser clients (`PROPOSED`; session policy parameters = OD-115 `OPEN`; client-neutral authentication abstraction per `THREAT_MODEL.md` TB-2).
   - No assumption that the client can execute particular JavaScript, hold DOM state, or follow redirects in a browser-specific way for API flows.
   - **Input-modality neutrality:** the same endpoint serves equivalent inputs from any modality. Example: asset lookup works identically for a scanned QR/barcode value and a manually keyed code (REQ-067 — camera permission granted/denied and the manual fallback are client concerns; the API never trusts or requires a particular capture mode).
   - Timeouts, retry and offline behavior (§15) are contract-level concerns, not browser features.
3. **i18n via content negotiation (REQ-028; OD-12 `OPEN` for default-language policy).** Clients send `Accept-Language`; the server returns localized human-readable text. Every machine-readable value that clients branch on (statuses, types, roles, reason codes, error codes) is a **language-neutral stable code** (REQ-028: no hard-coded UI strings; enum-like values stored as codes per `DATA_MODEL_CONCEPT.md` §2.9). Error responses carry both: stable `code` (§10) + localized `title`/`detail` per negotiation. Translation of *user-authored* content is out of scope.
4. **State completeness for clients (REQ-034).** Loading/empty/error/success/permission-denied/offline-pending/stale states are client UI concerns, but the API must convey enough state metadata to render them truthfully:
   - empty collections are `200` with an empty `items` array (an empty state is data, not an error);
   - permission denials are explicit `403` problem details with a machine-readable reason code (§5, §10) so clients can render a denied state rather than guess;
   - mutation responses return the resulting resource representation (including its current state and `version`), so a client can update its state without an extra fetch;
   - every mutable resource exposes `version` and server timestamps, enabling clients to detect staleness and (future) offline-pending vs synced status (§15; REQ-038 sync indicator, conditional on OD-07).
5. **Authorization is never client-side (REQ-024; MC §2).** UI hiding is never a security control; the contract assumes hostile clients can call any endpoint directly (deny-by-default, §5).

---

## 3. Resource boundary model

### 3.1 Organization by bounded context

The API surface is organized by the **17 bounded contexts** of `ARCHITECTURE.md` §3 (canonical context list; boundaries may be refined by ADR). Resource naming follows context names, not UI screens and not license tiers — the information architecture may differ per tier for navigation purposes (REQ-088) while the API stays a single surface. Entities and their ownership per context are defined in `DATA_MODEL_CONCEPT.md` §3; the permission vocabulary per context in `AUTHORIZATION_MODEL.md` §4.

### 3.2 Resource scope classes

Every API resource belongs to exactly one **scope class**. The scope class determines URL shape, tenant-context resolution (§14), and default authorization prerequisites (§5):

| Scope class | URL shape (illustrative) | Meaning | Examples |
|---|---|---|---|
| **Platform-scoped** | `/api/v1/{area}/...` | Platform-governed resources; no workspace path segment. Tenant context, where relevant, is derived from the object, never asserted by the client. | authentication/OTP and session endpoints; global user identity and profile; Public Store catalog and orders (Public Store = developer products commerce, access requires a basic miniRider license — MC §1; scope amended by ADR-018); License & Extension Shop catalog/orders (public license/extension purchase path incl. first license — ADR-018; commercial values OD-06); landing content (REQ-015); hiRider openings discovery and applications (platform portal resources — see §3.4); licenses/entitlement issuance records; audit records (platform-governed, tenant-attributed) |
| **Workspace-scoped** | `/api/v1/workspaces/{workspaceId}/...` | Tenant-owned resources. **Always** nested under the workspace path segment. | events, event assignments, assets and reservations, technical riders, media kits, memberships and roles, documents, evidence, CRM/finance records, IMS records, workspace-scoped notifications |
| **User-scoped** | `/api/v1/me/...` | Resources owned by the authenticated global user identity, spanning workspaces. | my global profile and identity settings; my active sessions/devices (REQ-048); my hiRider candidate profile, skills, portfolio, and my applications (REQ-062, REQ-064); my notification preferences (REQ-061); my export jobs |
| **Developer-portal-scoped** | `/api/v1/developer/...` (`PROPOSED` prefix) | Developer Portal console resources (REQ-016, REQ-058) — a separate console with its own authentication and the developer role (REQ-052), which can never touch billing/license/broadcast rights (REQ-031). | public catalog listing management (REQ-055), stock/price/discount management (REQ-056, OD-133), listing media (REQ-057), developer notifications (REQ-017) |

Special access paths that are **not** scope classes but cross-cut them: the auditor read-only path (TB-8: scoped, time-bound, read-only — REQ-044, REQ-053, REQ-084; terms OD-110 `OPEN`) and the sync path (§15, conditional on OD-07).

### 3.3 Canonical tenant-context rule (D-6)

**Workspace-scoped access always resolves tenant context from the URL path — never from client-controlled headers alone.** A header such as `X-Workspace-Id` may never substitute for the path segment; the `{workspaceId}` in the path is the single source of tenant context for the request, verified server-side against the actor's membership/access path at the policy layer (§14). Rationale: `THREAT_MODEL.md` TC-06 (tenant isolation failure, RSK-102) — header-supplied tenant identity is a spoofable input, while path-scoped context is part of the addressable resource identity and is checked by object-level authorization.

### 3.4 hiRider resources are platform portal resources (taxonomy guard)

hiRider is the recruitment portal/capability — **not a license** and never a value of `LicenseTier` (MC §1, `ARCHITECTURE.md` §2). hiRider openings and applications are **platform-scoped resources** in the API: openings are published by workspaces and browsable through the portal (REQ-063); applications are submitted against openings by users (REQ-064). Workspace management of one's own openings and review of received applications is exposed as workspace-scoped views. The invariants `Application != Workspace Membership`, `Application != Event Assignment`, `Acceptance != Automatic Workspace Access` (MC §1) are enforced server-side at this boundary (`AUTHORIZATION_MODEL.md` §8) — an accepted application returns a recruitment decision, never an implicit membership or assignment.

> **Service-offer boundary note (added 2026-10-28, pre-Phase 4 reconciliation — REQ-101, ADR-021, MC-V4 §2.2):** hiRider also includes **service offerings** (`ServiceOffer`) — a domain object **distinct from `RecruitmentOpening`** with its own ownership (provider = the user/crew publishing the offer), authorizable lifecycle/visibility, and inquiry/interest path. Target-state (all `PROPOSED`, not implemented): service offers are platform-scoped portal resources with user-scoped "my offers" management; inquiries create **no** workspace membership and **no** event assignment (server-side enforced, same invariant pattern as applications above); no prices/payment mechanics are invented (OD-06). Detailed resource/endpoint design belongs to Phase 16 (REQ-101 planned phase; `DATA_MODEL_CONCEPT.md` §3.7/§5; `THREAT_MODEL.md` TC-09/TC-24).

### 3.5 Context-to-scope classification (all 17 contexts)

| # | Bounded context (`ARCHITECTURE.md` §3) | Scope class(es) | Notes |
|---|---|---|---|
| 1 | Identity | Platform-scoped (+ user-scoped views via `/me`) | Global user identity separate from membership (REQ-025); sessions (REQ-048); developer role and auditor access are global grants, not workspace roles |
| 2 | Workspace/Tenant | Workspace-scoped (+ platform/user-scoped creation & listing) | Creation within license limits (REQ-014, OD-123 `OPEN`) |
| 3 | Membership & Roles | Workspace-scoped | Seat quota enforced server-side on create/invite (REQ-009, OD-05 `OPEN`) |
| 4 | Event & Assignment | Workspace-scoped, with an inner event-assignment boundary | Crew see only events they are assigned to (REQ-007, REQ-050) |
| 5 | Entitlement & License | Platform-scoped (orders, issuance) + workspace-scoped read views | Platform-level domain (TB-7); issuance targets a workspace |
| 6 | Extension | Platform-scoped (catalog/order) + workspace-scoped state views | Extension binds to (workspace, type) — `ENTITLEMENT_MODEL.md` §7 |
| 7 | hiRider Recruitment | Platform-scoped portal + user-scoped (my profile/applications) + workspace-scoped (my openings, received applications) | Visibility defaults OD-109 `OPEN`; contact data OD-134 `OPEN`; service offers (REQ-101, added 2026-10-28) = platform-scoped + user-scoped "my offers", `ServiceOffer != RecruitmentOpening` — detail Phase 16 |
| 8 | Asset | Workspace-scoped | Reservation conflict prevention (REQ-065, OD-107 `OPEN`) |
| 9 | Technical Rider | Workspace-scoped (event-linked) | Published rider requires a linked event, enforced server-side (REQ-004) |
| 10 | Media Kit | Workspace-scoped (event-linked) | Media kit always linked to an event (REQ-005) |
| 11 | Communication/Notification | Workspace-scoped sends + user-scoped preferences | Audience model with mandatory preview (REQ-059); idempotent delivery (REQ-060) |
| 12 | Developer Commerce/Store | Platform-scoped stores + developer-portal-scoped management | Public Store (basic miniRider license required) and the in-app Developer Equipment Store (miniRider-only, REQ-010) are fully isolated surfaces (REQ-030) |
| 13 | Document/Evidence | Workspace-scoped | Controlled view/download with access log (REQ-082); locked evidence immutable (REQ-083) |
| 14 | Audit | Platform-governed records with mandatory tenant attribution | Append-only; access itself restricted and audited (OD-138 `OPEN`) |
| 15 | Finance/Commercial | Workspace-scoped (maxRider-gated capabilities) | Commercial values never invented (OD-06 `OPEN`); order/invoice states OD-135 `OPEN` |
| 16 | IMS | Workspace-scoped (ISOrider-gated capabilities) | Standards referenced as metadata only (REQ-040, REQ-072) |
| 17 | Integration/Sync | Platform-scoped configs + user-scoped sync queues and export jobs | Provider abstractions (OD-03/OD-06), offline sync (OD-07), export scope (OD-111) |

---

## 4. Command/query separation (CQRS-lite)

**PROPOSED — CQRS-lite, applied at the boundary:**

- **Queries (reads)** are `GET` requests: side-effect-free and cacheable by design. A query never mutates domain state, never consumes quota, and does not itself require an audit event — with the explicit exception of **sensitive reads**, which are audited (document/evidence view and download per REQ-082; audit-log reads per OD-138; auditor exports per REQ-084). Queries may be served from read-optimized access paths (logical indexes per `DATA_MODEL_CONCEPT.md` §9) without duplicating the domain model.
- **Commands (mutations)** are `POST`/`PUT`/`PATCH`/`DELETE` requests: every command is audited (§13), carries idempotency semantics where required (§6), and passes the full policy chain (§5). State-changing operations that are not natural CRUD use **action sub-resources** (e.g., an approval action on a document, a decision action on an application) so that the operation vocabulary maps 1:1 onto the permission vocabulary of `AUTHORIZATION_MODEL.md` §4 (e.g., `document.approve` → an approval action resource).
- **Explicitly NOT full CQRS and NOT event sourcing.** epicRider does not commit to separate read/write stores or to event-sourced state. State is stored as current-state records with append-only history where the domain requires it (status histories, version histories, audit events — `DATA_MODEL_CONCEPT.md` §2.4, §2.5, §6). This statement is deliberate: Phase 2 makes no event-sourcing commitment; introducing one later would require an ADR.

---

## 5. Authorization at the boundary

**Every request passes the policy evaluation chain** (`AUTHORIZATION_MODEL.md` §2; MC §2; `SECURITY.md` Authorization):

```
Actor + Tenant/Workspace + Object + Action + Event Context
      + Tier Entitlement + Extension + Role/Permission + Object State
      → ALLOW | DENY (+ reason code)
```

Boundary rules:

1. **Deny-by-default.** The absence of an explicit allow is a deny. No capability is reachable unless the policy layer explicitly allows it for the full input combination (`AUTHORIZATION_MODEL.md` §3; REQ-024, REQ-026).
2. **Entitlement checks are server-side, on every tier-gated endpoint** (REQ-024). A UI-hidden capability called directly through the API returns an **audited denial** — for the in-app Developer Equipment Store this is requirement text (REQ-010: API access by non-qualifying accounts returns an audited denial, not a hidden menu). UI hiding is never a security control (MC §2, `TESTING.md`).
3. **Reason codes are returned to authorized callers — without leaking sensitive denial detail to unauthorized callers.**
   - For requesters with a legitimate relationship to the object class (e.g., an authenticated workspace member lacking a specific permission), `403` problem details include the machine-readable decision reason code from the `AUTHORIZATION_MODEL.md` §3 vocabulary (e.g., `DENY_PERMISSION_MISSING`, `DENY_TIER_ENTITLEMENT_MISSING`, `DENY_QUOTA_EXCEEDED`, `DENY_OBJECT_STATE`) so clients can render truthful denied states (REQ-034).
   - For objects whose **existence itself is sensitive** (workspace-scoped resources, applications, orders, documents), a requester with no right to know the object exists receives `404` instead of `403` — enumeration-resistance per `THREAT_MODEL.md` TC-24 (IDOR/enumeration, supplementary cross-cutting category). The 404-vs-403 policy per resource class is a **candidate matrix — requires registration** (no existing OD ID; defaults `PROPOSED` here).
   - Enumeration probes must receive uniform responses (same status/problem shape regardless of object existence) — test idea `PROPOSED — NOT TESTED` (TC-24 test matrix).
4. **Denials are audited as first-class events** (who/what/when/decision/reason + effective-access snapshot) — `AUTHORIZATION_MODEL.md` §3, `ENTITLEMENT_MODEL.md` §10.
5. **Authentication precedes authorization:** a request without a valid session never reaches object-level checks (`DENY_NO_SESSION` / `DENY_SESSION_EXPIRED` / `DENY_SESSION_REVOKED`, REQ-048). Session revocation takes effect on the next request (REQ-048 acceptance).
6. **Object-level checks on every addressable object** (REQ-026): identifier guessing fails with `DENY_TENANT_MISMATCH` and no data exposure (`AUTHORIZATION_MODEL.md` §7.2).

---

## 6. Idempotency (canonical strategy — `PROPOSED`, direction D-2)

**Rule:** side-effecting mutations that **create resources or trigger external effects** MUST carry a client-generated `Idempotency-Key` header. This applies at minimum to: store orders (issuance), hiRider applications, membership invitations, notification sends, and any endpoint triggering delivery to an external provider (OTP dispatch, notification delivery). Retrying clients (flaky networks, future offline sync — §15) replay safely.

Mechanics (all `PROPOSED`):

1. **Key:** client-generated unique value per logical operation (e.g., a UUID generated at intent time, persisted by the client across retries).
2. **Server storage:** the server stores key + **request fingerprint** (hash of route + authenticated principal + request payload) + the **stored response** (status + body) for a TTL. Backing entity: `IdempotencyRecord` (`DATA_MODEL_CONCEPT.md` §3.17 — idempotency key registry for API/sync/notifications; duplicate key → same result, no double effect).
3. **Replay:** a retry with the same key and the same fingerprint returns the **original stored result** with the marker header `Idempotent-Replay: true`, without re-executing side effects.
4. **Key reuse conflict:** the same key with a **different** fingerprint is rejected with `409 Conflict` and a stable problem code (candidate: `IDEMPOTENCY_KEY_REUSED`) — never silently re-executed.
5. **Key scoping:** keys are scoped to (authenticated principal/session + route). The same key value used by another actor or on another route never collides.
6. **TTL:** the retention window for stored results is a parameter — `PROPOSED` to be fixed by ADR with the owner (no number invented here).
7. **Coverage list:** which endpoints require the key is part of each context's binding contract; §17 marks the illustrative examples. Idempotency coverage per endpoint is the open residual noted by `THREAT_MODEL.md` TC-18 and is closed by this rule + the per-context contracts.

Relationship to existing requirements and threats: REQ-060 (notification delivery dedup/idempotency key — duplicate send must not produce duplicate messages), REQ-038 (idempotency for offline queues, conditional on OD-07), REQ-021 (OTP single-use + anti-replay — the OTP itself is a single-use token, a different but complementary mechanism), and `THREAT_MODEL.md` **TC-18 (Replay)** — purchase replay is commercial fraud; invite reuse and duplicate sends are integrity violations. Tests: duplicate order does not double-issue entitlement; duplicate send idempotent; invite reuse rejected — all `PROPOSED — NOT TESTED`.

Note: some mutations are naturally idempotent by contract (e.g., setting a preference); the `Idempotency-Key` requirement targets the create/external-effect class above.

---

## 7. Pagination (canonical — cursor-based, direction D-4)

**Default for all list endpoints: cursor-based pagination.**

- **Cursor:** opaque, server-generated, and stable — the client treats it as a token; the server encodes the keyset position (e.g., last-seen sort key) in it. Cursors are never positional offsets and never leak row counts.
- **Stable ordering:** every list endpoint defines a deterministic total order (a sort key with a unique tiebreaker, e.g. `(createdAt, id)`), so paging is reproducible under stable data.
- **`limit` parameter:** client-requested page size, capped server-side by a maximum (default and maximum values = parameters `PROPOSED`, owner/ADR; no number invented).
- **Response envelope:** list responses return an envelope containing at minimum `items[]`, `nextCursor` (omitted or `null` when exhausted), and `hasMore` (`PROPOSED` shape).

```
GET /api/v1/workspaces/{workspaceId}/assets?cursor=<opaque>&limit=50   (ILLUSTRATIVE)
→ 200 { "items": [ ... ], "nextCursor": "<opaque>", "hasMore": true }
```

**Offset pagination is discouraged** (`PROPOSED`: not used for new endpoints) because page offsets **drift under concurrent writes**: rows inserted or deleted between page fetches cause skipped or duplicated items, and `LIMIT/OFFSET`-style access degrades on large keysets. Cursor (keyset) pagination is immune to drift for append-style changes and matches the time-ordered strong identifiers proposed by `DATA_MODEL_CONCEPT.md` §2.1 (UUIDv7 or equivalent — final standard via Phase 2 ADR).

Small, bounded reference lists (e.g., enum-like catalogs) may be returned unpaginated — explicitly marked as such in the binding contract (`PROPOSED`).

---

## 8. Filtering & sorting

- **Field-based query parameters only, with server-side allowlists.** Each endpoint publishes the set of filterable/sortable fields; anything outside the allowlist is rejected with a validation problem (strict mode, `PROPOSED`) — never interpreted, never used to build queries dynamically. This prevents arbitrary field injection into queries (defense related to TC-24/TC-06) and keeps filter semantics part of the versioned contract (§12).
- **Range filters for time windows:** endpoints expose paired bounds (e.g., `availableFrom`/`availableTo` for asset availability windows; `scheduledFrom`/`scheduledTo` for event schedules; `createdAfter`/`createdBefore` on audit-style listings). Range semantics (inclusive/exclusive bounds) are specified per field in the binding contract (`PROPOSED`).
- **Sorting:** `sort` parameter with allowlisted fields and direction (e.g., `sort=-createdAt`); default sort is the stable ordering of §7.
- **Filter + pagination compose:** filters are encoded in the cursor token so that a paged traversal retains its filter context.
- **Full-text search:** boundaries marked **future / `PROPOSED`** — no full-text search contract is committed in Phase 2. When introduced (e.g., document library search — REQ-042 library functions), it will define its own allowlisted scope, ranking constraints, and abuse limits (search endpoints are scraping/enumeration surfaces per TC-24/AC-12) via ADR — candidate, requires registration.

---

## 9. Concurrency (canonical — optimistic, direction D-3)

**Optimistic concurrency for mutable critical resources** (control invariant — `ARCHITECTURE.md` §9; `DATA_MODEL_CONCEPT.md` §2.4):

1. **Version token:** every mutable critical resource carries a monotonic `version` (integer row-version) — at minimum: document drafts (REQ-079 full change history), rundown items and chat edits (concurrency policy = OD-131 `OPEN`), reservations (plus transactional overlap checks, REQ-065), store stock/price records (REQ-056 old/new value audit), membership role changes, and quota counters (transactional enforcement — `DATA_MODEL_CONCEPT.md` §8). Read representations expose the current version (also emitted as a strong `ETag`).
2. **Mutations must send the expected version:** via the `If-Match` header (preferred; carries the version ETag) or an `expectedVersion` field in the body (equivalent semantic, for clients with header limitations). A mutation without an expected version on a versioned resource is rejected with a validation problem (`PROPOSED` strict default).
3. **Mismatch → `409 Conflict`:** if the current version differs from the expected version, the mutation is rejected with a problem-details response whose `code` identifies the version conflict (candidate: `VERSION_CONFLICT`) and whose payload references the **current state** (current version, and where cheap, a pointer to retrieve it), so the client can refresh and re-apply. `409` is the canonical epicRider conflict signal; a transport-level `412` is not used for this purpose (`PROPOSED`).
4. **Never last-write-wins:** conflicting writes are rejected and surfaced — never silently overwritten (`DATA_MODEL_CONCEPT.md` §2.4).
5. **Transactional complements:** quota consumption and reservation overlap detection additionally use transactional checks (server-side, at the policy/data layer) because optimistic versions alone do not close quota races (`THREAT_MODEL.md` TC-19: seat-quota bypass via concurrent invites; double-booking of assets).
6. **Lifecycle records:** append-only histories are the concurrency mechanism for lifecycle records — one transition per event, invalid transitions rejected server-side (`DATA_MODEL_CONCEPT.md` §2.4; REQ-064, REQ-080).

Threat linkage: `THREAT_MODEL.md` **TC-19 (Race conditions)** — double-booking, duplicate applications, seat-quota bypass, lost updates. Conflict-resolution *policies* beyond the 409 signal (e.g., reservation hard-block vs allow-with-warning = OD-107 `OPEN`; chat/rundown concurrent editing = OD-131 `OPEN`; double-assignment = OD-130 `OPEN`). Tests: concurrent reservation, concurrent invite-to-quota, duplicate application — `PROPOSED — NOT TESTED`.

---

## 10. Error model (canonical — RFC 9457 style, direction D-5)

**`PROPOSED`:** error responses use an RFC 9457 (Problem Details for HTTP APIs) style object with the standard members plus epicRider extension members:

| Member | Source | Rules |
|---|---|---|
| `type` | RFC 9457 | A URI reference identifying the problem class (namespace `PROPOSED`; illustrative form `https://api.epicrider.example/problems/...`) |
| `title` | RFC 9457 | Short human-readable summary, localized via `Accept-Language` (§2) |
| `status` | RFC 9457 | The HTTP status code |
| `detail` | RFC 9457 | Human-readable explanation, localized; safe for display |
| `instance` | RFC 9457 | URI reference of this occurrence (the request path) |
| `code` | **extension** | Machine-readable, **stable** error code: drawn from (a) the authorization decision reason codes of `AUTHORIZATION_MODEL.md` §3 (e.g., `DENY_PERMISSION_MISSING`) and (b) the validation/error catalog (candidate registry — see §19; ownership/versioning already flagged as a candidate in `AUTHORIZATION_MODEL.md` §12). `code` is the contract; `title`/`detail` are presentation |
| `traceId` | **extension** | Correlation identifier that links the response to server logs and audit events (REQ-095 observability: incidents traceable **without exposing secrets**; no secrets in logs). `traceId` is opaque and contains no sensitive data |
| `errors[]` | **extension** | Field-level validation details: `field`, `code`, `detail` — used on validation failures (§11) |

```json
{
  "type": "https://api.epicrider.example/problems/validation",
  "title": "Permintaan tidak valid",
  "status": 422,
  "detail": "Satu atau lebih field tidak lolos validasi.",
  "instance": "/api/v1/workspaces/0192f8a7-…/assets",
  "code": "VALIDATION_FAILED",
  "traceId": "b7ad6c1e-…",
  "errors": [
    { "field": "name", "code": "REQUIRED" },
    { "field": "category", "code": "NOT_IN_ALLOWLIST" }
  ]
}
```
*(Example is ILLUSTRATIVE; localized strings depend on `Accept-Language`; field codes are candidates.)*

**Hard rules:**

- **Never expose** stack traces, internal file paths, SQL/ORM fragments, dependency names, configuration values, or secrets in any error response (REQ-095; `THREAT_MODEL.md` TC-22 secrets exposure; `AUTHORIZATION_MODEL.md` §7.4 log hygiene — no tenant data leaks via queries, logs, or error messages, REQ-023).
- Status usage (canonical set, `PROPOSED`): `400` malformed request; `401` unauthenticated/expired session (REQ-048); `403` policy denial with reason code (§5); `404` not found **or** existence-protecting denial (§5, TC-24); `409` version/idempotency-key conflict (§6, §9); `422` validation failure (aggregated, §11); `429` rate limited with retry guidance (§16); `5xx` server faults with `traceId` only.
- Problem `type`/`code` values are part of the versioned contract (§12): removing or changing the meaning of a code is a breaking change.

---

## 11. Validation

- **Server-side validation on every boundary.** Every request payload is validated against a published schema (schema-validated payloads, `PROPOSED` — schema artifacts are part of each context's binding contract). This is the boundary that hostile clients face (§2.5); it cannot be bypassed by any client.
- **Aggregated errors:** all field-level validation failures are collected and returned in a **single** response (`errors[]`, §10) — not fail-fast per field — so clients can render complete forms of feedback (REQ-034 state completeness).
- **Client-side validation is UX only, never trusted.** Clients may pre-validate for responsiveness; the server re-validates everything. A payload that passes client validation but fails server validation is rejected with `422` — this is the expected contract, not an error of the client.
- **Upload validation (TC-21 ownership):** media uploads are limited by type and size per platform policy — disallowed types rejected, oversized uploads rejected, media bound to its owning object (REQ-057); storage quotas per tier = OD-137 `OPEN`; filename/metadata sanitization (stored-XSS prevention) is part of the validation contract (`PROPOSED`). Content inspection/malware scanning and serving user content from an isolated origin are **candidate control gaps** flagged in `THREAT_MODEL.md` TC-21 for owner consideration — not asserted here as committed controls.
- **Validation of references:** object references (e.g., an event id inside a rider payload) are validated server-side for existence, tenant ownership (§14), and state compatibility (REQ-004, REQ-005 linkage rules).

---

## 12. Versioning (canonical — URL-path major, direction D-1)

**`PROPOSED` canonical strategy:**

1. **URL path major versioning:** `/api/v1/...`. The major version is part of the resource identity.
2. **Breaking change = new major version.** Within a major version, only **additive, non-breaking** changes are allowed: new optional request fields, new response fields (clients must ignore unknown fields), new endpoints, new optional query parameters with safe defaults, new problem `code` values.
3. **Breaking changes include** (`PROPOSED` definition): removing/renaming fields; changing types or semantics; making an optional input required; tightening validation so previously-valid input is rejected; changing the meaning or removal of a `code`; changing authorization semantics of an existing endpoint; changing pagination/filter contract semantics.
4. **Deprecation & sunset:** endpoints superseded within the deprecation policy announce themselves via response signaling headers (e.g., a `Deprecation` header and `Sunset` header per RFC 8594 — `PROPOSED` usage) plus documentation. The **sunset window duration is `TBD owner`** — no duration is invented (candidate parameter, §19).
5. **Version support overlap:** during a sunset window, the previous major version remains functional so old clients keep working through the transition (REQ-097 acceptance criteria: breaking changes require a new version; old clients keep functioning during the transition period).
6. **Uniform for all clients (REQ-020, REQ-097):** the same versioned contract serves web and future mobile clients; there are no client-specific API forks. API versioning is distinct from data schema migrations (REQ-029 controlled migrations; OD-01 `OPEN` for the physical engine) and from client app versions.
7. **Media-type/query-param versioning not adopted** (`PROPOSED` — rejected as primary mechanisms: less visible/auditable than path versioning; may be revisited by ADR).

Rationale anchor: REQ-097 (API versioning & backward-compatibility policy for web+mobile clients — Must) and REQ-020 (second client reuses the contract). The ADR register (Task 2-f) records this direction as "API versioning" ADR input; this document does not deviate from it.

---

## 13. Audit at the boundary

- **Every mutation produces an audit event** (MC §4 auditability; `AUTHORIZATION_MODEL.md` §3 decision audit trail). The audit event is written by the server as part of the command handling (conceptually, via the outbox pattern — `OutboxEvent`, `DATA_MODEL_CONCEPT.md` §3.17), and contains at minimum: **actor** (identity + access path/role), **action**, **object** (type + id), **tenant context** (workspace id where applicable), **result** (success/denied + reason code), **before/after summary where relevant** (e.g., commercial value changes carry actor + old/new values — REQ-056), **traceId** (correlating to the API response and logs, REQ-095), and **server timestamp**.
- **Append-only:** audit events are never editable or deletable via API (`DATA_MODEL_CONCEPT.md` §3.14 `AuditEvent` invariants; `THREAT_MODEL.md` TC-17 audit/evidence tampering). Access to audit data is itself restricted and audited (OD-138 `OPEN`; retention OD-138/OD-164 `OPEN`).
- **Sensitive reads are also audited:** document view/download with access log (REQ-082), evidence access, auditor exports (REQ-084), audit reads themselves (§4).
- **Effective-access snapshots on allow:** for security-sensitive allows, the decision record stores which entitlements were active (tier, license state, active extensions, policy version) — `ENTITLEMENT_MODEL.md` §10.
- **Denials are audited as first-class events** (§5.4) — including tier/store denials (REQ-010) and rate-limit triggers (§16).
- Tests (ideas, `PROPOSED — NOT TESTED`): every mutation emits exactly one audit event; audit records immutable via API; document view/download logged with actor/time/object (REQ-082 acceptance); no secrets in audit payloads (REQ-095).

---

## 14. Tenant context & isolation

1. **Workspace context is always explicit in the path** (§3.3, D-6): `/api/v1/workspaces/{workspaceId}/...`. The tenant context for a workspace-scoped request is the path workspace, verified against the actor's membership/access path server-side. No workspace-scoped endpoint exists without the workspace path segment, and **no endpoint trusts a client-controlled header as tenant context**.
2. **Every query is automatically tenant-scoped at the repository/policy layer** (`AUTHORIZATION_MODEL.md` §7.1 query scoping): read/write queries for tenant-owned objects carry the tenant context at the data access layer; queries without tenant scope are impossible by construction for tenant-owned objects. **Cross-tenant CRUD is rejected** (REQ-023 acceptance criteria; canonical rule recorded in `TESTING.md`), and is never bypassed by administrative access (`AUTHORIZATION_MODEL.md` §7.3).
3. **No endpoint accepts cross-tenant object references without ownership verification:** object-level checks run on every addressable object (REQ-026); a forged identifier fails with `DENY_TENANT_MISMATCH` and no data exposure (`AUTHORIZATION_MODEL.md` §7.2).
4. **Inner boundary:** event assignment — crew may access only events they are assigned to, even inside their own workspace (REQ-007, REQ-050; TB-6 inner boundary). Event-scoped sub-resources resolve the event context from the path and check assignment.
5. **Platform-scoped and user-scoped resources never take a workspace path segment**; their tenant visibility (where relevant) is derived from the object's own relations, never asserted by the client (§3.2).
6. **Exports and sync respect tenant scope** — out-of-scope export denied (REQ-096; scope/format = OD-111 `OPEN`; security classification of exports = OD-166 `OPEN`).
7. Threat linkage: `THREAT_MODEL.md` **TC-06 (tenant isolation failure)** — highest blast-radius category, RSK-102; also TC-24 (IDOR/enumeration) and TC-09 (hiRider privacy leakage — platform resources with per-object visibility rules, REQ-062, OD-109 `OPEN`).
8. Test ideas (`PROPOSED — NOT TESTED`): the REQ-023 test matrix (actor × workspace × object-type × action: every cross-tenant cell denied **and audited**); assignment-less event access denied (REQ-050); scanner cross-workspace lookup denied; no tenant data in query/log/error channels.

---

## 15. Offline/sync considerations (future — OD-07 `OPEN`)

Offline support is **not decided** (OD-07; REQ-038 is conditional: "offline-first diputuskan via risiko"). This document's obligation is narrower and immediate: **the contract design must not preclude offline clients.** Design consequences already locked into this architecture:

1. **Idempotent mutations** (§6): client-generated `Idempotency-Key`s allow a queued action to be retried/replayed at sync time without double effects (REQ-038 idempotency; REQ-060 dedup pattern; TC-18).
2. **Stable resource versions for conflict detection** (§9): offline edits carry the expected version; conflicts surface as `409` with current-state reference at sync time. Backing entities exist conceptually (`SyncQueueItem`, `ConflictResolutionRecord` — `DATA_MODEL_CONCEPT.md` §3.17).
3. **Server-authoritative conflict resolution at sync time:** when queued offline actions sync, the server re-evaluates each action through the full policy chain. **Permission is enforced at sync — an offline action performed without rights is rejected at sync** (REQ-038 acceptance criteria; `THREAT_MODEL.md` TC-20; audited as `sync.action.denied` per `AUTHORIZATION_MODEL.md` §11 #32). Conflict-resolution *policy* parameters = OD-07 `OPEN`.
4. **No offline authorization trust:** the client never grants itself anything — local data and local queue are outside the server trust boundary (TB-2 client-local storage); cached data on a stolen device and tampered local queues are modeled threats (TC-20).
5. **Sync contract shape (future, `PROPOSED`):** batched queued actions with per-item results (partial-success semantics), each item mapped to the same command contract as its online equivalent — offline is a transport mode, not a separate API.
6. **Interim behavior:** pre-decision UI behavior for offline indicators = OD-183 `OPEN`. The proposed hard gate from `THREAT_MODEL.md` TC-20 is reiterated here: **no offline feature release without sync-time authorization tests** — `PROPOSED — NOT TESTED`.

---

## 16. Rate limiting & abuse boundaries (`PROPOSED`)

- **Per-identity and per-IP limits on sensitive routes** (`ARCHITECTURE.md` §10 rate limiting + anti-replay as target controls). Sensitive routes at minimum:
  - **auth OTP request** (REQ-021: rate limit, anti-abuse; REQ-054: repeated attempts beyond limits temporarily blocked, every attempt audited) — also **temporary lockout** and **anomaly monitoring** per REQ-054;
  - **application submission** (spam applications — `THREAT_MODEL.md` AC-12 automated abuse; UC gap noted for recruitment abuse, TC-10);
  - **broadcast notifications** (cost/trust abuse — REQ-017 anti-abuse, REQ-059 audience preview mandatory; numeric limits = OD-139 `OPEN`);
  - invitation sends, account recovery attempts (REQ-047 — no takeover path), and export job requests (OD-166 `OPEN` for export limits).
- **`429` responses carry retry guidance:** `Retry-After` header plus problem details (`code` candidate: `RATE_LIMITED`; decision reason code `DENY_RATE_LIMITED` exists in `AUTHORIZATION_MODEL.md` §3). Structured rate-limit headers (remaining/quota signaling) = candidate, requires registration.
- **Abuse events are audited** (`abuse.ratelimit.triggered` — `AUTHORIZATION_MODEL.md` §11 #5) and feed anomaly monitoring (REQ-054).
- **Numeric limits are parameters, not inventions:** general limits and windows = `PROPOSED` via ADR (measurement environment and method = OD-162 `OPEN`); broadcast limits = OD-139 `OPEN`; performance targets for the API overall = REQ-093 with targets pending OD-112 `OPEN` (NFR approval).
- Tests (ideas, `PROPOSED — NOT TESTED`): repeated OTP requests beyond limit → temporary block + audit; broadcast beyond limit → 429 with retry guidance; lockout expires per policy.

---

## 17. Illustrative resource examples — **ILLUSTRATIVE — NOT AN IMPLEMENTATION COMMITMENT**

The examples below demonstrate how the boundary rules (§§3–16) compose. They are **not** a production endpoint catalog (§1.2); final binding contracts are defined per phase and via ADR. Paths use the illustrative base `/api/v1`.

| # | Example (ILLUSTRATIVE) | Scope | Authorization note | Idempotency / concurrency note |
|---|---|---|---|---|
| EX-1 | `POST /api/v1/auth/otp/request` | Platform (auth) | Unauthenticated entry at TB-2; creates a `VerificationRequest`; OTP itself single-use + expiry + anti-replay (REQ-021); vendor-neutral abstraction (OD-03 `OPEN`) | **Rate-limit governed** (per-identity + per-IP, temporary lockout, audited — REQ-054). `Idempotency-Key` is not the primary control here (legitimate re-request is a fresh operation); short-interval request dedup = candidate |
| EX-2 | `POST /api/v1/workspaces/{workspaceId}/memberships` | Workspace | Full policy chain; requires `workspace.member.invite` (REQ-049, REQ-051); **seat quota enforced server-side on create/invite** — the 6th kru on a full-quota workspace is rejected `DENY_QUOTA_EXCEEDED` (REQ-009; counting rule OD-05 `OPEN`) | `Idempotency-Key` **required** (creates membership + triggers external invite delivery); single-use signed invite token (REQ-051); quota check transactional (TC-19) |
| EX-3 | `POST /api/v1/openings/{openingId}/applications` | Platform (hiRider portal) | Opening must be `OPEN` and criteria checked (REQ-063); candidate visibility rules (REQ-062; defaults OD-109 `OPEN`); **application grants no membership/assignment — invariants enforced server-side** (REQ-013, MC §1) | `Idempotency-Key` **required** — duplicate submission prevented (duplicate-application race, TC-19); application lifecycle transitions validated one-per-event (REQ-064) |
| EX-4 | `GET /api/v1/workspaces/{workspaceId}/assets?cursor=…&limit=…` | Workspace | Membership + `asset.*` read permission; query is tenant-scoped by path (§14) | Query: side-effect-free, cacheable (§4); cursor pagination + allowlisted filters (availability windows — §7, §8) |
| EX-5 | `POST /api/v1/workspaces/{workspaceId}/assets/{assetId}/reservations` | Workspace | `asset.reservation.*` permission; asset state compatible; **overlap detection** (REQ-065; resolution policy OD-107 `OPEN`) | `If-Match`/**expectedVersion** on the asset + transactional overlap check (§9; TC-19 double-booking); conflict → `409` with current state reference; `Idempotency-Key` **required** |
| EX-6 | `POST /api/v1/store/orders` (Public Store) | Platform (store) | **Basic miniRider license required — server-side at store entry and at every purchase/issuance step** (MC §1; `store.public.access`); developer products only (scope amended by ADR-018); issuance targets a workspace and is auditable; payment mechanics/prices/tax/gateway/refund = BLOCKED (OD-06 `OPEN`); order/invoice states = OD-135 `OPEN` | `Idempotency-Key` **required** — purchase replay must not double-issue entitlement (TC-13, TC-18); issuance idempotent (`ENTITLEMENT_MODEL.md` §8) |
| EX-7 | `POST /api/v1/workspaces/{workspaceId}/documents/{documentId}/approval` with `If-Match: "17"` | Workspace | `document.approve` permission; state-dependent: only valid from reviewable states (REQ-080); **self-approval ban** = OD-136 `OPEN` (candidate `DENY_SELF_APPROVAL` code exists); approval authority matrix = OD-141 `OPEN`; approved record becomes immutable — corrections only via amendment/version (REQ-027) | **`If-Match` version mandatory** — stale approval on a concurrently edited draft → `409` (§9); audit event with before/after state (§13); view/download of the document itself is a sensitive read — logged (REQ-082) |
| EX-8 | `POST /api/v1/workspaces/{workspaceId}/notifications/broadcasts` | Workspace | `notification.broadcast.send`; **recipient preview is mandatory before send** (`notification.broadcast.preview` — REQ-059: sending without preview impossible); broadcast authority = OD-102 `OPEN`; limits = OD-139 `OPEN` | `Idempotency-Key` **required** (REQ-060: duplicate send idempotent — no double messages); delivery status queued/sent/failed with controlled retry (REQ-060); rate limited (§16) |
| EX-9 | `GET /api/v1/me/sessions` / `DELETE /api/v1/me/sessions/{sessionId}` | User | Self-service only (REQ-048: `identity.session.list` / `identity.session.revoke`); revocation effective on next request | Read = query; revoke = audited command; session policy parameters = OD-115 `OPEN` |

*(9 illustrative examples.)*

---

## 18. Boundary ownership map

Bounded context (`ARCHITECTURE.md` §3) → resource area → primary owning model document (Wave 1, final) → threat coverage (`THREAT_MODEL.md` §6). API resource areas are named by context, not by screen or tier (§3.1). TC-24 (IDOR/enumeration) and TC-06 (tenant isolation) are cross-cutting over all rows; TC-07 (authorization bypass) over all mutating rows.

| # | Bounded context | API resource area (illustrative) | Primary owning model doc (section) | Threat coverage |
|---|---|---|---|---|
| 1 | Identity | auth/OTP, sessions, recovery, account linking, global profile, developer-role & auditor-access grants | `DATA_MODEL_CONCEPT.md` §3.1; `AUTHORIZATION_MODEL.md` §4.1 | TC-01, TC-02, TC-03, TC-04, TC-05, TC-14, TC-22 |
| 2 | Workspace/Tenant | workspace lifecycle/settings/landing (extension-gated) | `DATA_MODEL_CONCEPT.md` §3.2; `AUTHORIZATION_MODEL.md` §4.2, §7 | TC-06, TC-24 |
| 3 | Membership & Roles | memberships, invitations, roles, seat/quota usage | `DATA_MODEL_CONCEPT.md` §3.3; `AUTHORIZATION_MODEL.md` §4.3, §5; `ENTITLEMENT_MODEL.md` §6 | TC-11, TC-19 |
| 4 | Event & Assignment | events, rundown, chat, reports, assignments | `DATA_MODEL_CONCEPT.md` §3.4; `AUTHORIZATION_MODEL.md` §4.4 | TC-12, TC-19 |
| 5 | Entitlement & License | license state/views, issuance records | `DATA_MODEL_CONCEPT.md` §3.5; `ENTITLEMENT_MODEL.md` §4, §8; `AUTHORIZATION_MODEL.md` §4.5 | TC-08, TC-13 |
| 6 | Extension | extension catalog/orders/state views | `DATA_MODEL_CONCEPT.md` §3.6; `ENTITLEMENT_MODEL.md` §7; `AUTHORIZATION_MODEL.md` §4.6 | TC-08, TC-13 |
| 7 | hiRider Recruitment | openings (platform discovery), applications, shortlists, decisions, candidate profiles/skills/portfolio | `DATA_MODEL_CONCEPT.md` §3.7, §5; `AUTHORIZATION_MODEL.md` §4.7, §8 | TC-09, TC-10, TC-24 |
| 8 | Asset | assets, sets, reservations, check-in/out, maintenance/calibration | `DATA_MODEL_CONCEPT.md` §3.8; `AUTHORIZATION_MODEL.md` §4.8 | TC-19, TC-21 |
| 9 | Technical Rider | riders (event-linked) | `DATA_MODEL_CONCEPT.md` §3.9; `AUTHORIZATION_MODEL.md` §4.9 | TC-24 |
| 10 | Media Kit | media kits (event-linked) | `DATA_MODEL_CONCEPT.md` §3.10; `AUTHORIZATION_MODEL.md` §4.10 | TC-21 |
| 11 | Communication/Notification | broadcasts (workspace), delivery status, user preferences | `DATA_MODEL_CONCEPT.md` §3.11; `AUTHORIZATION_MODEL.md` §4.11 | TC-16, TC-18 |
| 12 | Developer Commerce/Store | Public Store catalog/orders; Equipment Store; Developer Portal listing/stock/price management; developer notifications | `DATA_MODEL_CONCEPT.md` §3.12; `ENTITLEMENT_MODEL.md` §8; `AUTHORIZATION_MODEL.md` §4.12, §9 | TC-13, TC-14, TC-15 |
| 13 | Document/Evidence | document library, versions, evidence records, sign-off | `DATA_MODEL_CONCEPT.md` §3.13; `AUTHORIZATION_MODEL.md` §4.13 | TC-17, TC-21 |
| 14 | Audit | audit event reads, auditor export bundles | `DATA_MODEL_CONCEPT.md` §3.14; `AUTHORIZATION_MODEL.md` §4.14 | TC-17 |
| 15 | Finance/Commercial | CRM, inquiries, quotations, contracts, orders, invoices, payments, complaints, dossier (maxRider-gated) | `DATA_MODEL_CONCEPT.md` §3.15; `AUTHORIZATION_MODEL.md` §4.15 | TC-13, TC-18, TC-19 |
| 16 | IMS | process/control/workflow objects, standards register (metadata only), risk, incident/NCR/CAPA, review, improvement, supplier, competency, sustainability metrics (ISOrider-gated) | `DATA_MODEL_CONCEPT.md` §3.16; `AUTHORIZATION_MODEL.md` §4.16 | TC-17, TC-24 |
| 17 | Integration/Sync | provider configs (abstractions), sync queue, conflict records, idempotency registry, export/import jobs | `DATA_MODEL_CONCEPT.md` §3.17; `AUTHORIZATION_MODEL.md` §4.17 | TC-18, TC-20, TC-22 |

Realtime channels (event chat — REQ-008) are **not** a bounded context of `ARCHITECTURE.md` §3; a push/websocket channel contract is **future work** (`PROPOSED`; candidate — requires registration; realtime architecture already registered as a risk consideration via RSK-122). Whatever transport is later chosen, the boundary rules of this document (§5 authorization, §13 audit, §14 tenant scoping) apply to it unchanged.

---

## 19. Open questions

Only existing OD IDs are cited (all verified in `OPEN_DECISIONS.md`); items without an ID are labeled **candidate — requires registration** (no new OD ID is invented in this document).

| Topic | OD ID | Status | Boundary impact |
|---|---|---|---|
| Client delivery strategy (PWA/native/cross-platform/wrapper) — does NOT block these contracts | OD-02 | OPEN | Contracts must remain client-neutral (§2); credential transport finalized via ADR |
| WhatsApp OTP provider — vendor-neutral abstraction only | OD-03 | OPEN | `POST /auth/otp/request`-style contract stays provider-neutral (EX-1); provider-specific integration BLOCKED |
| Commercial values: prices/tax/gateway/refund — order/issuance abstraction can proceed | OD-06 | OPEN | Store order contract (EX-6) models the abstraction; payment mechanics BLOCKED |
| Offline-first scope — sync contracts conditional | OD-07 | OPEN | §15 applies only if approved; sync endpoints exist only then |
| Legal/regulatory validation — no legal conclusions here | OD-09 | OPEN | Evidence/document payloads and metadata fields may require adjustment after validation |
| Hosting/deployment target & release strategy | OD-10 | OPEN | Affects rate-limiting/caching infrastructure placement (§16) and `Sunset`/ops mechanics (§12) |
| Import/export scope & format | OD-111 | OPEN | Data-portability endpoints (context 17) cannot be bound until scope decided |
| NFR performance/availability targets (API targets included) | OD-112 | OPEN | REQ-093 targets pending; pagination caps and limits may be tuned to approved targets |
| Session policy parameters (max sessions, idle timeout, force-logout) | OD-115 | OPEN | Session contract (EX-9) semantics fixed; parameters pending |
| Chat/rundown concurrent-edit policy | OD-131 | OPEN | §9 provides the 409 signal; merge/edit policy beyond it is OD-131 |
| Order/invoice commercial state machine | OD-135 | OPEN | Store order states (EX-6) provisional until decided |
| Broadcast anti-abuse limits | OD-139 | OPEN | Numeric limits for §16 broadcast rules |
| NFR measurement environment & method | OD-162 | OPEN | How API performance/rate-limit behavior is measured (REQ-093) |
| Seat-counting rule (owner counted?) | OD-05 | OPEN | Quota denial semantics in membership endpoints (EX-2) |
| Developer role model (sub-permissions vs separate roles) | OD-101 | OPEN | Developer-portal-scoped surface shape (§3.2) |
| Mandatory vs optional notification types & broadcast authority | OD-102 | OPEN | Preference/opt-out contract (REQ-061) and send authority |
| Reservation conflict policy (hard-block / warning / hybrid) | OD-107 | OPEN | 409 semantics plus override behavior (EX-5) |
| License expiry/grace/downgrade restriction scope | OD-108 | OPEN | Entitlement denial behavior at the boundary over license states |
| hiRider default visibility & abuse policy | OD-109 | OPEN | Opening/application visibility defaults (EX-3; TC-09/TC-10) |
| Auditor access terms (scope default, max duration, NDA) | OD-110 | OPEN | Auditor read-only path parameters (TB-8) |
| Preset workspace role catalog | OD-122 | OPEN | Role-dependent permission defaults behind endpoints |
| Multi-workspace limits for non-crew users | OD-123 | OPEN | Workspace creation limits (context 2) |
| Double-assignment policy | OD-130 | OPEN | Assignment creation conflict semantics |
| Price/discount approval authority | OD-133 | OPEN | Store commercial mutation flow (context 12) |
| Application contact-data visibility & retention | OD-134 | OPEN | Application resource field exposure (EX-3) |
| Self-approval ban & approver rules | OD-136 | OPEN | Document/evidence approval contract (EX-7) |
| Media storage quotas per tier | OD-137 | OPEN | Upload validation thresholds (§11) |
| Audit log retention & access rights | OD-138 | OPEN | Audit read contract + retention (§13) |
| Approval authority & dual-control matrix | OD-141 | OPEN | Approval action semantics (EX-7) |
| Sensitive evidence metadata capture | OD-142 | OPEN | Evidence upload payload fields (§11) |
| Log/audit retention defaults (platform) | OD-164 | OPEN | traceId/audit retention coupling (§10, §13) |
| Export classification & size/frequency limits | OD-166 | OPEN | Export job contract guards (context 17) |
| Interim offline UI behavior (pre-OD-07) | OD-183 | OPEN | §15 interim semantics |
| Default language policy (ID default assumption) | OD-12 | OPEN | §2 content-negotiation defaults |
| Production database (does not block this architecture) | OD-01 | OPEN | Physical implementation of idempotency/quorum/transactional checks (§6, §9) |
| **Sunset/deprecation window duration (§12.4)** | — | candidate — requires registration | Owner parameter; no duration invented |
| **Default & maximum `limit` caps (§7)** | — | candidate — requires registration | Owner/ADR parameter |
| **404-vs-403 enumeration-resistance matrix per resource class (§5.3)** | — | candidate — requires registration | Policy matrix; defaults PROPOSED in §5 |
| **Error/validation `code` catalog registry & versioning (§10)** | — | candidate — requires registration | Same candidate already registered in `AUTHORIZATION_MODEL.md` §12 |
| **Full-text search contract scope (§8)** | — | candidate — requires registration | Future/proposed; needs abuse limits |
| **Realtime channel contract (chat push — §18 note)** | — | candidate — requires registration | Transport decision + this document's boundary rules apply |
| **Idempotency TTL & structured rate-limit headers (§6.6, §16)** | — | candidate — requires registration | Owner/ADR parameters |
| **`problem type` URI namespace (§10)** | — | candidate — requires registration | Depends on final public API domain (none invented) |

---

## 20. Consistency & anti-hallucination statement

1. **Nothing is implemented.** No epicRider endpoint exists (`NOT FOUND`; current surface = placeholder `GET /api`). Every contract in this document is `PROPOSED`, awaiting owner review and ADR acceptance; all test/evidence ideas are `PROPOSED — NOT TESTED`.
2. **No vendors, prices, durations, quotas, or owner decisions are invented.** RFC 9457 and RFC 8594 are cited as published standards for the error/sunset mechanics; no product/vendor choice is implied. All parameter-level gaps map to existing OD IDs or are labeled candidates (§19).
3. **Canonical directions (D-1..D-6, §1.3) are followed exactly** as fixed for Phase 2; the ADR register (Task 2-f) records the same directions — no deviation.
4. **Taxonomy compliance:** only miniRider/maxRider/ISOrider are license tiers; hiRider is treated strictly as a recruitment portal/capability whose openings/applications are platform-scoped resources — never a license concept; Public Store access requires a basic miniRider license; the Developer Equipment Store is miniRider-only (REQ-010). Cross-tenant CRUD is rejected (REQ-023). UI hiding is never a security control.
5. **Cross-references:** all REQ-xxx (REQ-001..100), OD-xxx (register of `OPEN_DECISIONS.md`), TC-xx/TB-x (`THREAT_MODEL.md`), UC-x (`USE_CASES.md`), and sibling-document section references used above exist in their sources; no ID is invented, and Phase 1 requirement IDs are preserved unrenumbered.
6. **This document does not produce the full production endpoint catalog** (prompt §12) — §17 examples are ILLUSTRATIVE and bounded to nine.

---

**End of API_ARCHITECTURE.md** — Task 2-e, Phase 2. Status: `PROPOSED`.
