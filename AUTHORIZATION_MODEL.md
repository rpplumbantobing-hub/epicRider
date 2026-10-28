# AUTHORIZATION MODEL — epicRider

**Task ID:** 2-b (Phase 2 — architecture) · **Status:** PROPOSED (architecture proposal; not implemented)
**Sources:** `MASTER_CONTROL.md` (§2, §4), `ARCHITECTURE.md` (§4, §5, §6, §7), `SECURITY.md`, `TESTING.md`, `LICENSE_MATRIX.md`, `REQUIREMENTS.md` (REQ-001..REQ-100), `OPEN_DECISIONS.md` (OD-01..OD-184), Phase 2 prompt §9, Phase 1 artifacts (`USE_CASES.md`, `PERSONAS_AND_JOURNEYS.md`, `PROCESS_MAP.md`, `DOCUMENT_EVIDENCE_MODEL.md`, `RISK_REGISTER.md`).

---

## 1. Purpose & status

This document defines the **target-state authorization model** for epicRider: the evaluation model, policy layer, permission vocabulary, role model, resource ownership, tenant isolation, and enforcement points.

Status rules applied throughout:

- **PROPOSED** — this model is an architecture proposal for owner review. Nothing here is implemented.
- **NOT FOUND** — per Phase 0 evidence (`SECURITY.md`, current state): no implemented authentication, authorization, tenant isolation, or entitlement exists in the repository. Server-side enforcement is an **invariant and a design obligation**, not an implementation claim.
- **OPEN** — wherever an owner decision is required, the existing OD ID is cited. No owner decision is invented, and no new OD ID is created in this document.
- Related risks already registered: RSK-102 (tenant isolation failure), RSK-103 (entitlement leaked via API), RSK-107 (tier/store mismatch) — see `RISK_REGISTER.md`.
- Phase 2 does not build production endpoints; this vocabulary and inventory are conceptual and must be refined through ADRs (Task 2-f, `ADR_REGISTER.md`) and per-phase implementation.

## 2. Authorization evaluation model

Canonical input chain (from `MASTER_CONTROL.md` §2, `SECURITY.md` "Authorization", Phase 2 prompt §9):

```
Actor
+ Tenant/Workspace
+ Object
+ Action
+ Event Context
+ Tier Entitlement
+ Extension
+ Role/Permission
+ Object State
→ Decision: ALLOW | DENY (+ reason code)
```

Input definitions (each is a required, typed input to every authorization decision):

| Input | Definition | Notes / references |
|---|---|---|
| **Actor** | The authenticated global user (identity), plus the access path being used: workspace membership, developer role, auditor access, or bare user identity. One human may hold several access paths; they are never merged. | REQ-025; ARCHITECTURE §4 |
| **Tenant/Workspace** | The workspace (tenant) in whose context the request is executed. Every workspace-scoped request carries exactly one tenant context; requests without one cannot touch tenant-owned data. | REQ-023, REQ-007 |
| **Object** | The target resource: its type, identifier, and owner (platform / workspace / user — see §6). | REQ-026 |
| **Action** | The verb being attempted, expressed in the permission vocabulary (§4) — e.g. `event.rundown.edit`, `document.approve`. | REQ-026 |
| **Event Context** | The active event context of the actor, where the object is event-scoped. Crew see only events they are assigned to; switching context must not leak other events' data. | REQ-007, REQ-050 |
| **Tier Entitlement** | Rights derived from the workspace's active license tier (miniRider / maxRider / ISOrider — the only tiers; hiRider is a portal/capability, never a tier value). | MC §2; LICENSE_MATRIX §1 |
| **Extension** | Active additive entitlement units bound to the workspace (additional workspace, additional seat package, workspace landing, mobile/client extension, future approved). | MC §2; LICENSE_MATRIX §5 |
| **Role/Permission** | The effective permissions of the actor in this tenant context, derived from workspace role, platform role (developer role, auditor access), or explicit grant. License ≠ role. | REQ-025, REQ-026; prompt §8 |
| **Object State** | Lifecycle state of the target object (e.g. event closed, document superseded, evidence locked, membership suspended, license in grace). State can make an otherwise-allowed action denied. | REQ-026, REQ-080, REQ-083, REQ-098 |

**Evaluation order (PROPOSED).** Authentication and session validity are prerequisites evaluated before the chain (a request without a valid session never reaches object-level checks). The chain then evaluates: tenant scope → membership/access path → role/permission → tier entitlement + extension → capability rules → object state → ownership/ACL → quota → abuse controls. The exact order is PROPOSED; the canonical formula (`MASTER_CONTROL.md` §2, `ENTITLEMENT_MODEL.md` §3) is authoritative and any order must be a faithful evaluation of it.

**Decision output.** Every evaluation produces `ALLOW` or `DENY` **plus a reason code** (§3). Deny-by-default: the absence of an explicit allow is a deny.

## 3. Policy layer architecture

- **Where policy is evaluated:** a **server-side policy layer** between the API surface and the domain/data layer (conceptual). All authorization and entitlement checks happen server-side (MC §4 invariants: server-side authorization, server-side entitlement). The policy layer is the single place where the §2 input chain is evaluated; the data access layer additionally enforces tenant scoping on every query (§7) as defense in depth.
- **Deny-by-default:** no capability is reachable unless a policy explicitly allows it for the given input combination. Rationale: MC §2 ("UI hiding tidak pernah menjadi security control"), REQ-024, TESTING.md invariant ("No capability is protected only by frontend/UI visibility").
- **UI hiding is NEVER a security control.** Hiding menus/buttons may improve UX; it never constitutes enforcement. Bypassing the UI (direct API call) must still result in an audited denial (REQ-010, REQ-024; RSK-103).
- **Decision reason codes (vocabulary, English; PROPOSED):**

| Code | Meaning |
|---|---|
| `ALLOW` | All inputs satisfied; an explicit allow rule matched. |
| `DENY_NO_SESSION` | No valid authenticated session. |
| `DENY_SESSION_EXPIRED` / `DENY_SESSION_REVOKED` | Session expired or revoked (REQ-048). |
| `DENY_TENANT_MISMATCH` | Cross-tenant access attempt ("CRUD lintas-tenant ditolak" — REQ-023, TESTING.md). |
| `DENY_NOT_MEMBER` / `DENY_MEMBERSHIP_SUSPENDED` / `DENY_MEMBERSHIP_REMOVED` | No active membership, or membership state removes access (REQ-049). |
| `DENY_PERMISSION_MISSING` | Actor's role does not include the required permission (REQ-026). |
| `DENY_ASSIGNMENT_MISSING` | Event-scoped access without event assignment (REQ-050). |
| `DENY_TIER_ENTITLEMENT_MISSING` | Capability not included in the workspace tier (REQ-024). |
| `DENY_LICENSE_STATE` | License expired / in grace / downgraded restricts the action (REQ-098; scope = OD-108 OPEN). |
| `DENY_EXTENSION_MISSING` | Required extension not active on the workspace (MC §2). |
| `DENY_OBJECT_STATE` | Object state forbids the action (locked evidence, superseded document, closed opening — REQ-080, REQ-083, REQ-063). |
| `DENY_QUOTA_EXCEEDED` | Seat/workspace quota exhausted (REQ-009; counting rule = OD-05 OPEN). |
| `DENY_STORE_TIER` | Store access rule violated (Equipment Store is miniRider-only — REQ-010). |
| `DENY_SCOPE` | Access outside granted scope (auditor scope — REQ-053; profile/application visibility — REQ-062, OD-109). |
| `DENY_CROSS_CONTEXT_ROLE` | Platform role used outside its context (developer role touching billing/license — REQ-031, REQ-052). |
| `DENY_SELF_APPROVAL` | Submitter attempting to approve own submission (policy candidate — OD-136 OPEN). |
| `DENY_INVALID_INVITE` | Invitation token invalid, expired, or already used (REQ-051). |
| `DENY_RATE_LIMITED` | Abuse/rate-limit boundary tripped (REQ-054). |
| `DENY_REPLAY` | Replay of a one-time token/code (REQ-021). |

  Reason codes are a controlled vocabulary (PROPOSED); ownership and versioning of the registry — candidate, requires registration (no existing OD ID).

- **Decision audit trail.** Every authorization decision on a security-sensitive action is recorded with: **who** (actor identity + access path/role), **what** (object type + id, action), **when** (timestamp), **decision** (ALLOW/DENY), **reason code**, plus tenant/workspace id, event context (if any), and an effective-access snapshot (tier + active extensions at decision time — see `ENTITLEMENT_MODEL.md` §10). Denials are audited as first-class events, not only allows (REQ-010 audited denial; REQ-024). Audit log retention and access rights = OD-138 OPEN; legal constraints = OD-09.
- **Policy versioning:** the policy layer is versioned so audit records can state which policy version produced a decision — candidate, requires registration (no existing OD ID; also a candidate ADR for Task 2-f).

## 4. Permission vocabulary (PROPOSED, English)

Conceptual verb–noun vocabulary organized by the 17 bounded contexts of `ARCHITECTURE.md` §3. Naming convention: `context.resource.verb` (two segments where the context is unambiguous). This is a design vocabulary for Phase 2; Phase 2 does not build production endpoints (prompt §12), and the final binding to APIs is defined per-phase and via ADR.

### 4.1 Identity
| Permission | Grants | Ref |
|---|---|---|
| `identity.session.list` | View own active sessions/devices | REQ-048 |
| `identity.session.revoke` | Revoke one/all own sessions | REQ-048 |
| `identity.account.recover` | Execute verified account recovery | REQ-047 |
| `identity.account.link` | Link/unlink login methods (WhatsApp/Google) | REQ-022, REQ-047 |
| `identity.profile.read` | Read own global profile | REQ-025 |
| `identity.profile.update` | Update own global profile | REQ-025 |
| `identity.developerrole.assign` | Grant/revoke developer role (platform scope) | REQ-052, OD-101 |
| `identity.auditoraccess.grant` | Provision auditor access | REQ-053, OD-110 |
| `identity.auditoraccess.revoke` | Terminate auditor access | REQ-053 |

### 4.2 Workspace/Tenant
| Permission | Grants | Ref |
|---|---|---|
| `workspace.create` | Create a workspace within license limits | REQ-014, OD-123 |
| `workspace.read` | View workspace info | REQ-003 |
| `workspace.update` | Update workspace settings | REQ-003 |
| `workspace.close` | Close/archive a workspace | PROPOSED |
| `workspace.landing.manage` | Manage workspace landing page (extension-gated) | REQ-018 |
| `workspace.member.invite` | Invite a member with an offered role | REQ-049, REQ-051 |
| `workspace.member.suspend` | Suspend a membership | REQ-049 |
| `workspace.member.remove` | Remove a membership | REQ-049 |
| `workspace.member.leave` | Leave a workspace (self-action) | REQ-049 |
| `workspace.quota.read` | View seat/quota usage | REQ-009, OD-05 |

### 4.3 Membership & Roles
| Permission | Grants | Ref |
|---|---|---|
| `role.preset.apply` | Apply preset role set to a workspace | OD-122 |
| `role.custom.define` | Define a custom workspace role | REQ-011, REQ-026 |
| `role.custom.update` | Change a custom role's permission set | REQ-026 |
| `role.custom.archive` | Archive a custom role | REQ-026 |
| `membership.read` | List members and their roles | REQ-049 |
| `membership.role.assign` | Change a member's role | REQ-026, REQ-049 |

### 4.4 Event & Assignment
| Permission | Grants | Ref |
|---|---|---|
| `event.create` | Create an event in a workspace | REQ-003 |
| `event.read` | View an event (assignment required for non-managers) | REQ-003, REQ-050 |
| `event.update` | Edit event data | REQ-003 |
| `event.close` | Transition an event to closed | PROPOSED |
| `event.assignment.create` | Assign a crew member to an event | REQ-050 |
| `event.assignment.remove` | Remove an event assignment | REQ-050 |
| `event.rundown.read` | View the event rundown | REQ-008 |
| `event.rundown.edit` | Edit the event rundown | REQ-008, OD-131 |
| `event.chat.read` | Read event chat | REQ-008 |
| `event.chat.post` | Post in event chat | REQ-008 |
| `event.report.read` | Read team reports/updates | REQ-008 |
| `event.report.submit` | Submit team reports/updates | REQ-008 |
| `event.context.switch` | Switch active event context (multi-assignment) | REQ-007 |

### 4.5 Entitlement & License
| Permission | Grants | Ref |
|---|---|---|
| `license.read` | View workspace license status/history | REQ-098 |
| `license.renew.initiate` | Initiate a license renewal | REQ-098, OD-06 |
| `entitlement.read` | View effective entitlements of the workspace | REQ-024 |
| `entitlement.snapshot.read` | Read effective-access snapshots (audit use) | REQ-024, OD-138 |

### 4.6 Extension
| Permission | Grants | Ref |
|---|---|---|
| `extension.catalog.read` | Browse the extension catalog | REQ-018 |
| `extension.read` | View active extensions of a workspace | REQ-018 |
| `extension.assign` | Bind a purchased extension instance to a workspace | REQ-018 |
| `extension.remove` | Remove an extension instance | REQ-018 |
| `extension.renew.initiate` | Renew an extension | REQ-018 |

### 4.7 hiRider Recruitment
| Permission | Grants | Ref |
|---|---|---|
| `candidate.profile.read` | View a candidate profile per its visibility setting | REQ-062, OD-109 |
| `candidate.profile.update` | Update own candidate profile | REQ-062 |
| `candidate.profile.visibility.set` | Set own profile visibility | REQ-062, OD-109 |
| `candidate.portfolio.manage` | Manage own skills/portfolio | REQ-062 |
| `opening.create` | Create a recruitment opening | REQ-063 |
| `opening.update` | Edit a recruitment opening | REQ-063 |
| `opening.publish` | Open a recruitment for applications | REQ-063 |
| `opening.close` | Close a recruitment (owner-controlled) | REQ-063, REQ-014 |
| `opening.read` | Browse open recruitments | REQ-063 |
| `application.submit` | Apply to an open recruitment | REQ-064 |
| `application.withdraw` | Withdraw own application | REQ-064 |
| `application.read` | Read own applications / applicants (recruitment roles only for others') | REQ-064 |
| `application.shortlist` | Shortlist an application | REQ-064 |
| `application.decide.accept` | Accept an application (recruitment decision) | REQ-064 |
| `application.decide.reject` | Reject an application (recruitment decision) | REQ-064 |
| `marketplace.abuse.report` | Report/block abusive content or actors | UC-6005 (no dedicated REQ — known Phase 1 gap) |

Note: accepting an application grants **no** workspace permission — see §8.

### 4.8 Asset
| Permission | Grants | Ref |
|---|---|---|
| `asset.create` | Register an asset | REQ-006, REQ-045 |
| `asset.read` | View assets and history | REQ-006 |
| `asset.update` | Edit asset data | REQ-006 |
| `asset.retire` | Retire/dispose an asset (approval-controlled) | REQ-045 |
| `asset.template.manage` | Manage asset/set templates | REQ-006 |
| `asset.scan.execute` | Execute asset scanning (maxRider capability) | REQ-036, REQ-067 |
| `asset.lookup.execute` | Scanner lookup of an asset | REQ-036 |
| `asset.reservation.create` | Create a reservation | REQ-065 |
| `asset.reservation.cancel` | Cancel a reservation | REQ-065 |
| `asset.checkout.execute` | Check out an asset (condition capture) | REQ-066 |
| `asset.checkin.execute` | Check in an asset (condition capture) | REQ-066 |
| `asset.maintenance.manage` | Manage maintenance/calibration schedules | REQ-068 |
| `asset.incident.report` | Report damage/incident on an asset | REQ-066, OD-132 |
| `asset.kpi.read` | View utilization/downtime/cost KPIs | REQ-069 |

### 4.9 Technical Rider
| Permission | Grants | Ref |
|---|---|---|
| `rider.create` | Create a rider draft | REQ-004 |
| `rider.read` | View a rider | REQ-004 |
| `rider.edit` | Edit a rider | REQ-004 |
| `rider.publish` | Publish a rider (server-side: requires linked event) | REQ-004 |

### 4.10 Media Kit
| Permission | Grants | Ref |
|---|---|---|
| `mediakit.create` | Create a media kit from template (requires linked event) | REQ-005 |
| `mediakit.read` | View a media kit | REQ-005 |
| `mediakit.edit` | Edit a media kit | REQ-005 |

### 4.11 Communication/Notification
| Permission | Grants | Ref |
|---|---|---|
| `notification.read` | Read own in-app notifications | REQ-061 |
| `notification.preference.update` | Set preferences/opt-out for optional types | REQ-061, OD-102 |
| `notification.broadcast.preview` | Produce a recipient preview (mandatory pre-send) | REQ-059 |
| `notification.broadcast.send` | Send a targeted/broadcast notification | REQ-017, OD-102, OD-139 |
| `notification.status.read` | View delivery status of own sends | REQ-060 |

### 4.12 Developer Commerce/Store
| Permission | Grants | Ref |
|---|---|---|
| `store.public.access` | Enter/use the Public Store (requires basic miniRider license) | MC §1, REQ-030; surface scope amended by ADR-018 (developer products only — license/extension purchase lives on the separate public License & Extension Shop) |
| `store.equipment.access` | Enter the in-app Developer Equipment Store (miniRider-only) | REQ-010 |
| `store.listing.create` | Create a store listing (draft) | REQ-055 |
| `store.listing.update` | Edit a listing | REQ-055 |
| `store.listing.publish` | Publish a listing (controlled publication) | REQ-055 |
| `store.listing.archive` | Archive a listing | REQ-055 |
| `store.listing.stock.manage` | Manage listing stock | REQ-056 |
| `store.listing.price.manage` | Manage price/discount (within approval authority) | REQ-056, OD-133 |
| `store.listing.media.manage` | Manage listing media (type/size policy) | REQ-057 |
| `store.catalog.manage` | Manage the public catalog (Developer Portal) | REQ-016 |
| `store.order.create` | Place an order/purchase abstraction | REQ-098, OD-06, OD-135 |
| `portal.access` | Log into the Developer Portal console | REQ-058, OD-101 |

### 4.13 Document/Evidence
| Permission | Grants | Ref |
|---|---|---|
| `document.create` | Create a controlled document | REQ-042 |
| `document.read` | Read a document (per ACL) | REQ-082 |
| `document.update` | Edit a draft document | REQ-080 |
| `document.submit` | Submit for review | REQ-080 |
| `document.approve` | Approve/reject a version (per approval authority matrix) | REQ-080, OD-136, OD-141 |
| `document.supersede` | Mark a version superseded/obsolete | REQ-080 |
| `document.version.read` | View version history | REQ-080 |
| `document.download` | Download a document (ACL + access log) | REQ-082 |
| `document.classification.set` | Set document classification | OD-140 |
| `document.retention.manage` | Manage retention/disposition | REQ-081, OD-104 |
| `evidence.capture` | Capture form/checklist results | REQ-083 |
| `evidence.read` | Read evidence records | REQ-083 |
| `evidence.submit` | Submit evidence for review | REQ-083 |
| `evidence.review` | Review submitted evidence | REQ-083 |
| `evidence.sign` | Sign off evidence (binding actor+role+time+context+version) | REQ-083, OD-103 |
| `evidence.amend` | Amend a locked/approved record (new version only) | REQ-083, REQ-027 |
| `evidence.export` | Export evidence (auditor, controlled) | REQ-084, OD-143 |

### 4.14 Audit
| Permission | Grants | Ref |
|---|---|---|
| `audit.read` | Query the audit trail | REQ-092, OD-138 |
| `audit.export` | Export audit records | OD-138, OD-143 |

### 4.15 Finance/Commercial (maxRider capabilities)
| Permission | Grants | Ref |
|---|---|---|
| `customer.manage` | Create/read/update/archive CRM customers | REQ-046 |
| `quotation.manage` | Manage quotations | REQ-046 |
| `order.manage` | Manage orders/contracts | REQ-046 |
| `invoice.manage` | Manage invoice lifecycle (void/credit, not silent edit) | REQ-046, OD-135 |
| `payment.record` | Record payments | REQ-046 |
| `dossier.read` | Read project/event dossier | REQ-046 |
| `complaint.manage` | Handle customer complaints | REQ-046 |

### 4.16 IMS (ISOrider capabilities)
| Permission | Grants | Ref |
|---|---|---|
| `ims.process.manage` | Manage process/control/workflow objects | REQ-070 |
| `ims.control.manage` | Manage controls | REQ-070 |
| `ims.standard.read` | Read the standard register | REQ-071 |
| `ims.mapping.manage` | Manage clause/reference mapping (metadata only) | REQ-072 |
| `ims.supplier.qualify` | Qualify suppliers/contractors | REQ-073, OD-120 |
| `ims.competency.manage` | Manage competency/training records | REQ-074 |
| `ims.ncr.manage` | Manage NCRs | REQ-075 |
| `ims.capa.manage` | Manage CAPAs and effectiveness checks | REQ-075 |
| `ims.review.manage` | Manage management reviews | REQ-076 |
| `ims.improvement.manage` | Manage continual improvement actions | REQ-077 |
| `ims.kpi.define` | Define sustainability KPIs (data dictionary) | REQ-085 |
| `ims.kpi.record` | Record KPI data (source/unit/method mandatory) | REQ-086 |
| `ims.auditmode.use` | Use audit mode (internal audit capability) | MC §2 |

### 4.17 Integration/Sync
| Permission | Grants | Ref |
|---|---|---|
| `sync.queue.use` | Use offline action queue (conditional on OD-07) | REQ-038 |
| `sync.reconcile` | Reconcile sync conflicts | REQ-038 |
| `data.export` | Export data (scope per decision) | REQ-096, OD-111 |
| `data.import` | Import data (scope per decision) | REQ-096, OD-111 |

**Vocabulary size: 144 permissions across 17 contexts (PROPOSED).**

## 5. Role model

### 5.1 Separation invariants (canonical)

- `User != Membership != Role != Event Assignment` (TESTING.md, ARCHITECTURE §4). A global user identity is not a membership; a membership is not a role; an assignment is none of these.
- `Developer Role != workspace role` — the developer role never carries workspace permissions and vice versa (REQ-052).
- `Auditor Access != membership` — auditor access is a time-bound, scoped, read-only access path, never a membership (REQ-053).
- License entitlement != role (prompt §8: "Jangan membuat license = role"). A tier never implies a role; a role never implies a tier.
- `Application != Workspace Membership`, `Application != Event Assignment`, `Acceptance != Automatic Workspace Access` (MC §1 — see §8).

### 5.2 Workspace roles (PROPOSED — exact catalog and defaults = OD-122 OPEN)

Derived from persona responsibilities (`PERSONAS_AND_JOURNEYS.md` P-01..P-06, P-10) and REQ-011 (dynamic roles on maxRider):

| Role (PROPOSED) | Scope | Ref |
|---|---|---|
| `owner` | Full workspace administration: membership lifecycle, role assignment, event assignment, recruitment decisions, license/extension purchase initiation for the workspace | P-01/P-02, REQ-049, REQ-063 |
| `workspace admin` (optional) | Administrative operations delegated by owner; whether this role exists is part of the OD-122 preset catalog | OD-122 |
| `member` (kru baseline) | See only assigned events; contribute chat/reports in assigned event context | P-03, REQ-007, REQ-050 |
| `event manager` | Manage event content (rundown, coordination, reports) for delegated events; does not change membership | P-04, REQ-008 |
| `asset manager` | Asset lifecycle operations, scanning, maintenance, readiness (maxRider capability) | P-05, REQ-045 |
| `finance/crm officer` | CRM, quotations, orders, invoices (maxRider capability) | P-06, REQ-046 |
| `ims/sustainability manager` | IMS objects, documents, NCR/CAPA, reviews (ISOrider capability) | P-10, REQ-070..077 |

Preset role defaults per tier = OD-122 OPEN (options: custom-only; preset read-only + customizable; fixed presets — recommendation recorded there is preset + full customization on maxRider). miniRider baseline is expected to need only `owner` + `member` (kru) — PROPOSED, pending OD-122.

### 5.3 Platform roles

- **Developer role** (REQ-052, REQ-016, REQ-058): access to the Developer Portal console and Equipment Store management. Model choice (single role with sub-permissions vs separate store-manager/portal-admin roles) = **OD-101 OPEN**. Constraints regardless of option: developer role cannot touch billing/license rights (REQ-031); broadcast authority is a separate grant (REQ-017, OD-102); least privilege (MC §4 invariants; historical MC §5/§6 — crosswalk `CONTROL_REFERENCE_CROSSWALK.md`).
- **Auditor access** (REQ-053, REQ-044, REQ-084): **read-only, scoped (workspace/documents), time-bound with automatic expiry**. Writes denied; expansion of scope requires a separate approval (UC-1007, UC-7007); export controlled (OD-143). Terms (default scope, max duration, NDA process) = **OD-110 OPEN**.
- **Platform administrator/support** (P-08, UC-9001): operational platform role for support/monitoring. Tenant isolation still applies to admin access (REQ-023; J-08 "akses diagnosis tidak boleh melewati tenant isolation"); all admin actions audited (REQ-092, REQ-095). The platform-admin permission catalog and its governance — candidate, requires registration (no existing OD ID).

### 5.4 Role inheritance rules (PROPOSED)

1. **Explicit inheritance only, within the same context.** A workspace role may inherit another workspace role's permission set only by explicit definition (e.g. `owner` inherits the `member` baseline within the Workspace/Event contexts).
2. **No cross-context implicit escalation.** A workspace role never implies developer role, auditor access, or any platform capability; membership in workspace A grants nothing in workspace B.
3. **Tier capabilities gate, roles grant.** A role can only grant permissions whose underlying capability is entitlement-enabled for the workspace (e.g. `finance/crm officer` is ineffective on a workspace without the CRM capability) — see `ENTITLEMENT_MODEL.md` §3.
4. **State transitions are immediate.** Role/membership changes take effect on the next request (REQ-049).
5. **No role self-elevation.** An actor cannot assign to themselves a role they do not already hold authority over (invite tokens bind the offered role — REQ-051).

## 6. Resource ownership model

### 6.1 Owner types (PROPOSED taxonomy)

| Owner type | Examples | Notes |
|---|---|---|
| **Platform-owned** | User identities, sessions, licenses, extension instances, store catalogs/listings/orders, Developer Portal objects, platform audit log, landing page content (REQ-015), standard register reference data | Access via platform roles or explicit user-self rights; not tenant-scoped |
| **Workspace-owned** | Workspace settings, events, assignments, custom roles, assets, riders, media kits, documents, evidence, CRM/finance records, IMS objects | Access requires membership (+ role) in that workspace; tenant-scoped |
| **User-owned** | Global profile, skills, portfolio (recruitment portal), notification preferences, own sessions/devices | Governed by the user plus explicit visibility settings (OD-109) |
| **Co-managed (user ↔ workspace)** | Applications: created by a candidate against a workspace's opening | Content visible only to the candidate and the workspace's recruitment roles (see §8) |

### 6.2 Ownership inheritance (event-scoped resources)

Event-scoped resources — rider versions, media kits, rundown entries, event reports, event-scoped evidence, reservations for the event — inherit ownership from **event → workspace**. Consequences:

- crew access to event-scoped resources additionally requires **event assignment** (REQ-050), not just membership;
- scanning/lookup of an asset belonging to another workspace is denied (tenant isolation — UC-3003 F4);
- deletion flows never cascade silently across the ownership chain; archival rules respect the chain.

### 6.3 How ownership affects authorization

Ownership is part of the **Resource Context** input (§2). Policy checks, in order: (1) is the object within the actor's tenant scope (or platform-owned with a platform access path)? (2) does the actor's access path (membership/role, developer role, auditor access, user-self) reach the object's ownership chain? (3) do state and ACL rules (REQ-082) permit the action? Ownership alone is never sufficient — a workspace owner still cannot bypass tier entitlement (owner of a miniRider workspace cannot use CRM) or object state (owner cannot edit locked evidence — REQ-083).

## 7. Tenant isolation model

- **Tenant boundary:** the workspace is the tenant boundary for all workspace-owned data. Platform-owned data is not tenant-scoped but is reachable only through role-gated platform access paths.
- **Enforcement points (conceptual):**
  1. **Query scoping** — every read/write query for tenant-owned objects carries a tenant context at the data access layer; queries without tenant scope are impossible by construction for tenant-owned objects.
  2. **Object-level checks** — identifier guessing (e.g. forged UUID) fails with `DENY_TENANT_MISMATCH`, not with data exposure.
  3. **Cross-tenant CRUD rejected** — canonical rule: "CRUD lintas-tenant ditolak" (REQ-023; TESTING.md records that a historical misspelling of this word was corrected to "CRUD" — always write "CRUD"). Never bypassed by admin access.
  4. **Log/query hygiene** — no tenant data leaks via queries, logs, or error messages (REQ-023: "tidak ada data bocor di query/log"; REQ-095: no secrets in logs).
  5. **Export/sync scoping** — exports and offline sync respect tenant scope; out-of-scope export denied (REQ-096, UC-9003).
  6. **Platform admin containment** — support/diagnostic access does not cross tenant isolation (J-08, REQ-023); any cross-tenant operational access, if ever approved, must be scoped, justified, and audited — candidate policy, requires registration.
- **Isolation testing principles (REQ-023 test matrix idea — PROPOSED):** build a matrix of actor × workspace × object-type × action (create/read/update/delete/list/export); every cross-tenant cell must be denied **and audited**; assignment-less event access must be denied (REQ-050 test matrix); scanner cross-workspace lookups denied (UC-3003); regression per release (RSK-102, RSK-107 mitigations). Test results are NOT TESTED today (no implementation exists).

## 8. hiRider authorization specifics

- **Profile visibility:** default visibility of candidate profiles/applications = **OD-109 OPEN**; this model adopts **default private (PROPOSED)**, matching the privacy-safe recommendation recorded with OD-109. Profile data visible only per explicit visibility settings (REQ-062); server-side enforced (privacy test — UC-6001 F1).
- **Opening visibility vs application privacy:** open recruitment openings are browsable by users meeting access criteria (REQ-063); closed openings reject new applications but retain history (REQ-063 — closing never deletes application history). **Application content is visible only to the candidate and the workspace's recruitment roles** (PROPOSED); premature exposure of candidate contact data is governed by OD-134 (linked to OD-109 and OD-09).
- **Invariant chain (canonical — MC §1, ARCHITECTURE §6, SECURITY.md):**
  1. `Application != Workspace Membership` — submitting or holding an application grants no workspace permission (REQ-013: application status must not change workspace permissions — server-side tested).
  2. `Acceptance != Automatic Workspace Access` — an accepted recruitment decision does **not** create a membership.
  3. **Membership grant is a separate authorized action** — only an explicit `workspace.member.invite`/accept flow (by owner or a role holding `workspace.member.invite`, within seat quota REQ-009) creates membership (REQ-049, REQ-051).
  4. **Event assignment is separate again** — membership does not imply event visibility; assignment is an additional authorized action (`event.assignment.create`, REQ-050).
- Recruitment decisions (`application.decide.accept/reject`) are audited and restricted to authorized workspace roles (UC-6004 F2: decision by non-owner → denied).

## 9. Store authorization

- **Public Store:** access requires a **basic miniRider license** — server-side check at store entry and at every purchase/issuance step (MC §1, LICENSE_MATRIX §4, SECURITY.md). The Public Store is a developer commerce storefront for **approved developer products** (product scope amended 2026-10-28 by ADR-018: license/extension purchase moved to the separate public **License & Extension Shop**, which must serve unlicensed first-time buyers); it is **not** a license tier and **not** an upper-tier-exclusive feature — it must not be modeled as such (MC §1). Purchases/issuance are auditable (SECURITY.md store security).
- **Developer Equipment Store:** **miniRider-only** (REQ-010, MC §1). API access by maxRider or ISOrider accounts — and by any user without a qualifying miniRider workspace — returns an **audited denial** (`DENY_STORE_TIER`), never a merely hidden menu (REQ-010, REQ-024; RSK-103). The two stores are fully isolated in data, access, and API; cross-access is denied (REQ-030).
- **Developer Portal role separation (REQ-031, REQ-058):** the portal is a separate console with its own authentication; only the developer role reaches it. **Portal roles cannot touch billing/license rights** (REQ-031 — testable denial, audited) and broadcast authority is a separate, explicitly granted permission (REQ-017, OD-102). Role model choice (sub-permissions vs separate roles) = **OD-101 OPEN**. Listing publication is a controlled transition (draft→published→archived, REQ-055); commercial value changes are fully audited with actor + old/new values (REQ-056); price/discount authority limits = OD-133 OPEN.

## 10. Contextual/state-dependent rules (examples)

| Rule | Behavior | Status / Ref |
|---|---|---|
| License expired / in grace / downgraded | Access to tier-gated capabilities restricted, **not deleted**; data retained for re-upgrade | REQ-098, REQ-099; exact grace duration & restriction scope = OD-108 OPEN |
| Downgrade data behavior | Restrict (recommended) / archive / delete are the recorded options; silent data loss forbidden | REQ-099, OD-108 OPEN; recommendation PROPOSED (see `ENTITLEMENT_MODEL.md` §9) |
| Closed event | Event becomes read-only for non-administrative actions | PROPOSED — candidate rule, requires registration (no REQ yet) |
| Closed recruitment opening | New applications rejected; history preserved | REQ-063 (owner-approved behavior) |
| Locked evidence | Immutable: edit/delete denied; corrections only via amendment (new version + audit) | REQ-083, REQ-027 |
| Approved records | Immutable; changes via amendment/version history | REQ-027 |
| Superseded document | Old version not usable after supersede | REQ-080 |
| Suspended/removed membership | Access lost on next request | REQ-049 |
| Expired auditor access | Automatic deny | REQ-053, REQ-044 |
| Expired/used invitation token | Reject; role manipulation via token rejected (binding) | REQ-051 |
| Accepted quotation/commercial record | Price changes require new version, not silent edit | REQ-046 with REQ-027 principle; UC-4002 |
| Offline queued action | Permission re-checked at sync time (only if OD-07 enables offline) | REQ-038, OD-07 OPEN |

## 11. Enforcement point inventory (conceptual)

Conceptual inventory: capability → where enforced → audit event → REQ reference. "Where enforced" refers to the target architecture (policy layer / API boundary); **NOT FOUND** as implementation today.

| # | Capability / decision | Where enforced (conceptual) | Audit event (conceptual) | REQ |
|---|---|---|---|---|
| 1 | WhatsApp login OTP (one-time, expiry, anti-replay) | Auth boundary | auth.login.succeeded / denied | REQ-021 |
| 2 | Google OAuth/OIDC validation (state/nonce/issuer/audience/signature/expiry/redirect) | Auth boundary | auth.oauth.denied | REQ-022 |
| 3 | Account recovery / fallback (no takeover path) | Auth boundary | auth.recovery.denied | REQ-047 |
| 4 | Session lifecycle (list, revoke, expiry) | Session service, per-request check | session.revoked | REQ-048 |
| 5 | Anti-abuse rate limiting / lockout | API boundary | abuse.ratelimit.triggered | REQ-054 |
| 6 | Workspace creation within license limits | Workspace API + policy layer | workspace.create.denied | REQ-014, OD-123 |
| 7 | Invitation token validity/binding | Membership API | membership.invite.denied | REQ-051 |
| 8 | Seat quota on invite/membership create | Policy layer (server-side on create + invite) | membership.create.denied (quota) | REQ-009, OD-05 |
| 9 | Membership state changes effective immediately | Per-request membership check | membership.suspended / removed | REQ-049 |
| 10 | Event access requires assignment | Event API + policy layer | event.access.denied | REQ-007, REQ-008, REQ-050 |
| 11 | Tenant isolation (query scoping; cross-tenant CRUD denied) | Data access layer (all queries) | tenant.violation / cross-tenant denied | REQ-023 |
| 12 | Tier-gated capabilities (CRM, finance, asset lifecycle, scanning, IMS) | Policy layer on every endpoint | entitlement.denied (tier) | REQ-011, REQ-012, REQ-024, REQ-036 |
| 13 | Equipment Store access (miniRider-only, API-level) | Store API + policy layer | store.equipment.denied (audited) | REQ-010, REQ-030 |
| 14 | Public Store access (basic miniRider license required) | Store API + policy layer | store.public.denied (no license) | MC §1, REQ-030 |
| 15 | Store listing publication control | Store API | listing.published / state.changed | REQ-055 |
| 16 | Stock/price/discount changes with full audit | Store API (+ approval authority OD-133) | listing.commercial.changed (actor, old/new) | REQ-056 |
| 17 | Developer Portal access (role check, separate console) | Portal auth + policy layer | portal.access.denied | REQ-052, REQ-058 |
| 18 | Developer role cannot touch billing/license/broadcast | Policy layer (cross-context denial) | permission.denied (cross-context) | REQ-031, REQ-052 |
| 19 | Broadcast: mandatory recipient preview, dedup/idempotency | Notification API | broadcast.sent (dedup key) / preview.required | REQ-017, REQ-059, REQ-060 |
| 20 | Rider publish requires linked event | Rider API | rider.publish.denied | REQ-004 |
| 21 | Media kit requires linked event | Media kit API | mediakit.create.denied | REQ-005 |
| 22 | Document ACL view/download + access log | Document API | document.viewed / downloaded / access.denied | REQ-082 |
| 23 | Document approval authority + self-approval ban | Document workflow + policy layer | document.approved / approval.denied | REQ-080, OD-136, OD-141 |
| 24 | Locked/approved record immutability | Evidence/document API | record.edit.denied (locked) | REQ-027, REQ-083 |
| 25 | Superseded document not usable | Policy layer (object state) | document.use.denied | REQ-080 |
| 26 | Auditor access read-only/scope/expiry | Auditor access layer | auditor.write.denied / auditor.expired / scope.denied | REQ-044, REQ-053, REQ-084 |
| 27 | License state restricts access (grace/expired/downgrade) | Entitlement service + policy layer | license.state.changed / access.restricted | REQ-098, OD-108 |
| 28 | Downgrade restrict-not-delete | Entitlement service | downgrade.applied | REQ-099, OD-108 |
| 29 | Application acceptance grants no workspace access | hiRider API + policy layer | application.accepted (no membership granted) | REQ-013 |
| 30 | Closed opening rejects new applications | Opening API | application.submit.denied | REQ-063 |
| 31 | Profile visibility enforcement | hiRider profile API | profile.access.denied | REQ-062, OD-109 |
| 32 | Offline sync permission re-check (conditional) | Sync service (only if OD-07 approves offline) | sync.action.denied | REQ-038, OD-07 |
| 33 | Import/export scope control | Data portability API | export/import.denied (scope) | REQ-096, OD-111 |
| 34 | Audit trail access | Audit API | audit.read / audit.export | OD-138 |

**Inventory size: 34 enforcement points (PROPOSED).**

## 12. Open questions

Only existing OD IDs are cited (never invented here); items without an ID are explicitly labeled candidates.

| Topic | OD ID | Status |
|---|---|---|
| Developer role model (sub-permissions vs separate roles) | OD-101 | OPEN |
| Broadcast authority, mandatory/optional notification types | OD-102 | OPEN |
| Legal strength of sign-off (affects `evidence.sign` semantics) | OD-103 | OPEN |
| Seat counting rule (owner counted?) — quota denial semantics | OD-05 | OPEN |
| Offline strategy & sync-time permission re-check | OD-07 | OPEN |
| License expiry/grace/downgrade restriction scope | OD-108 | OPEN |
| Default profile/application visibility | OD-109 | OPEN |
| Auditor access terms (default scope, max duration, NDA) | OD-110 | OPEN |
| Import/export scope & format | OD-111 | OPEN |
| Session policy parameters (timeout, max sessions) | OD-115 | OPEN |
| Supplier/contractor access model | OD-120 | OPEN |
| Preset role default per tier (workspace role catalog) | OD-122 | OPEN |
| Multi-workspace limits for non-crew users | OD-123 | OPEN |
| Double-assignment policy (assignment conflict) | OD-130 | OPEN |
| Chat/rundown concurrent edit policy | OD-131 | OPEN |
| Asset damage → incident/NCR automation | OD-132 | OPEN |
| Price/discount approval authority in store | OD-133 | OPEN |
| Application contact-data visibility & retention | OD-134 | OPEN |
| Order/invoice state machine (commercial document states) | OD-135 | OPEN |
| Self-approval ban & minimum approver rules | OD-136 | OPEN |
| Media storage quotas (upload denial thresholds) | OD-137 | OPEN |
| Audit log retention & access rights | OD-138 | OPEN |
| Broadcast anti-abuse limits | OD-139 | OPEN |
| Document classification scheme (ACL defaults) | OD-140 | OPEN |
| Approval authority & dual-control matrix | OD-141 | OPEN |
| Sensitive evidence metadata capture | OD-142 | OPEN |
| Auditor export package format & controls | OD-143 | OPEN |
| Commercial values (prices/tax/gateway) — no values modeled | OD-06 | OPEN |
| Closed event read-only rule | — | candidate — requires registration |
| Platform administrator role catalog & governance | — | candidate — requires registration |
| Reason-code registry ownership/versioning | — | candidate — requires registration |
| Policy layer versioning approach | — | candidate — requires registration (also candidate ADR, Task 2-f) |

---

**Consistency statement:** this model is consistent with `MASTER_CONTROL.md` §2/§4, `ARCHITECTURE.md` §4/§5, `SECURITY.md`, and `TESTING.md` invariants; hiRider is treated strictly as a portal/capability and never as a tier value. Implementation status: **NOT FOUND** (no code exists); all content is **PROPOSED** unless marked otherwise.
