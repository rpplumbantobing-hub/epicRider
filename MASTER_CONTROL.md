# MASTER_CONTROL.md — epicRider

**Revision:** 2026-10-28  
**Status:** GOVERNING — stable product and engineering rules  
**Dynamic phase status:** never maintained here; see `ROADMAP.md` only.

## 1. Product vision and scope

epicRider is a web-first platform for multimedia, event production, equipment rental and related operations. The architecture must support solo/home businesses, startups, mature organizations and organizations operating an Integrated Management System (IMS) without rebuilding the operational data core when moving between license tiers.

This document defines target-state constraints. It is not proof that the corresponding runtime feature exists. Current implementation and test status must come from repository evidence and `ROADMAP.md`.

## 2. Product taxonomy

### 2.1 License tiers — exactly three

- **miniRider** — event and basic operational workflows, technical rider, media kit/templates, basic asset catalog, team and simple event operations. Baseline crew limit is five per workspace; whether the owner consumes a seat remains an open commercial/quota decision (OD-05).
- **maxRider** — adds CRM, finance/commercial workflows, rental and asset lifecycle, QR/barcode, scan workflows, maintenance/readiness, advanced workflow/roles, basic HSE/risk and operational dashboards.
- **ISOrider** — adds configurable IMS capabilities: processes and controls, controlled documents, execution records/evidence, approvals/sign-off, audit, findings/NCR/CAPA, management review, sustainability/environment, OH&S, information security, continuity and continual improvement.

No other product, portal, store or capability may be represented as a fourth license tier. Tier inheritance is defined in `LICENSE_MATRIX.md`.

### 2.2 hiRider — portal/capability, not a license

hiRider is in scope as a crew/service marketplace and recruitment/team-matching portal. Its scope includes:

- user/provider profile, skills, experience and portfolio;
- **service offerings** published by a user/provider;
- workspace recruitment openings, applications, shortlist and recruitment decisions;
- links from accepted recruitment to a separately granted workspace membership and, where authorized, later event assignment.

Service offering and recruitment are distinct domain objects and workflows. Publishing or responding to a service offer must not be conflated with applying for a team position.

Non-negotiable invariants:

- `hiRider != LicenseTier`
- `Application != Workspace Membership`
- `Application != Event Assignment`
- `Acceptance != Automatic Workspace Access`
- `ServiceOffer != RecruitmentOpening`

A recruitment acceptance does not automatically grant tenant access. Access is granted through a separate authorized membership workflow; event assignment is another separate workflow.

### 2.3 Three commerce surfaces — separate domains

1. **License & Extension Shop** — public landing/commerce surface for initial license purchase and license/extension renewal or purchase. It must not require the buyer to already own miniRider merely to purchase a first license. Actual payment, final prices, taxes, fees and refund terms remain governed by commercial decisions (OD-06).
2. **Public Store** — developer-product store for epicRider users. Access requires a valid basic `miniRider` license as specified by the owner. It is not a license tier and it is not the first-license checkout.
3. **Developer Equipment Store** — in-app equipment/equipment-related store. `miniRider` is allowed; `maxRider` and `ISOrider` are denied at the server/API boundary, not merely hidden in UI.

The three surfaces must be separate in access rules and domain/API policies, including catalogs, order types, purchase flows, entitlement issuance, audit events and tests. Different labels on a single undifferentiated store are not sufficient.

## 3. Entitlement and access model

Distinguish:

- **LicenseTier** — miniRider, maxRider or ISOrider;
- **License** — an issued license instance and lifecycle;
- **Capability** — a domain/product ability;
- **Extension** — an approved additive package/feature;
- **Workspace Membership** — user-to-workspace relationship;
- **Role/Permission** — authorized actions within a context;
- **Event Assignment** — assignment to a particular event/work operation.

Effective access is determined by:

`Tier Entitlement + Active Extensions + Capability Rules + Role/Permission + Resource Context + Object State`

Enforce authorization and entitlement server-side. UI hiding is never an authorization control. A tier upgrade activates authorized capabilities in the same domain data model; do not create isolated operational databases by tier or silently delete data on downgrade.

Extensions may include additional workspace, seat package, workspace landing, mobile/client options and other approved packages. Do not invent prices, commercial mechanics or exact seat counting rules.

## 4. User experience, language and channels

`UX_UI_STANDARD.md` is a binding cross-phase quality standard. UI/UX is not cosmetic and cannot be deferred to final polish. The product target is premium, clear, consistent, intuitive, accessible, responsive and task-efficient, with complete loading/empty/error/success/permission-denied/offline-or-sync-pending states as relevant.

- Bahasa Indonesia is the default UI locale; English is supported, and locale switching is system-controlled rather than hard-coded in business logic.
- Web is a first-class channel for desktop and mobile browsers.
- Domain/API boundaries remain client-neutral and capable of serving Android and iOS apps; Windows distribution is a planned channel, with technology selected via an evidence-backed ADR.
- Do not infer that responsive web automatically fulfills native/mobile distribution requirements.
- A screenshot proves appearance only, not authorization, business logic, workflow, or data correctness.
- Do not claim usability/accessibility without recorded task-based and relevant manual/automated evidence.

## 5. Identity, workspace and authorization

The required conceptual chain is:

`Global User Identity → Workspace Membership → Role/Permission Context → Event Assignment → Resource/Action Authorization`

Identity does not imply membership; membership does not imply assignment. Every sensitive read/write must check the authenticated actor, tenant/workspace scope, role/permission, entitlement/capability, object state and operation-specific rules. Tenant isolation and negative cross-tenant tests are mandatory when these features are implemented.

Authentication targets include secure WhatsApp-controlled-account verification and Google OAuth 2.0/OpenID Connect. A typed WhatsApp number alone does not prove identity. Provider-specific decisions and integration credentials are not to be invented.

## 6. Architecture and data invariants

- One coherent platform/domain foundation, supporting multiple workspaces/tenants.
- Global identity is separate from membership, role, entitlement, service offer, recruitment application and event assignment.
- Client-neutral domain/API contracts; web-first, with mobile and Windows choices documented in ADRs.
- Modular/bounded contexts with explicit ownership and contracts; avoid duplicated sources of truth.
- Controlled schema migrations, rollback strategy and documented data ownership.
- Approved/final records and evidence cannot be silently edited or deleted; corrections use amendment/revision with history.
- Important changes and decisions record actor, timestamp, source/object and audit context appropriate to risk.
- Use the operating sequence where relevant: `Process → Control → Workflow → Transaction → Evidence → Report`.
- Distinguish current state, target state, proposed requirement, implementation evidence and verified behavior.

## 7. IMS and standards

ISOrider is a configurable system-management support platform, not a certification body and not a guarantee of conformity or certification.

`STANDARD_REGISTER.md` is the authoritative source for edition/publication metadata and verification evidence. As of the catalogue check dated 2026-10-28, the official register records published editions including ISO 9001:2026, ISO 14001:2026 and ISO 19011:2026. Do not retain obsolete “edition 2026 unknown” statements. Some other standards have published editions plus amendments, and some are under revision; the register must state this explicitly.

Catalogue metadata confirmation is not the same as:
- deciding applicability to a customer or Indonesian legal obligation;
- approving a clause/control mapping;
- proving a customer conforms to a standard;
- proving certification.

No clause mapping may rely on unverified editions, and no copyrighted standard text may be copied into the product without rights. Legal/regulatory conclusions require competent validation (OD-09). Risk guidance such as ISO 31000 must not be described as a certifiable requirements standard.

## 8. Controlled documents, evidence and audit

The target platform supports configurable documentation hierarchies such as Policy → Manual → Process → Procedure/SOP → Work Instruction → Form/Checklist → Record/Evidence → Report.

Controlled documents should support document ID, title/type, owner/approver, version/revision, status, effective/review dates, classification, access policy, retention, process/control links, supersedes relation and audit history.

Evidence workflows should support structured results, notes, permitted attachments, actor/time/source metadata, submit/review/reject/rework, appropriate approval/sign-off, version binding and controlled finalization. Amendments must preserve history. Electronic-signature legal status is not assumed.

Auditor access is read-only and limited by workspace/scope/time, with access logged and no default cross-tenant access.

## 9. Security and privacy

- Never include `.env`, credentials, tokens, private keys, production data or secrets in a control pack or diagnostic log.
- `.env` must not be tracked by Git; provide `.env.example` using placeholders only and allowlist it in `.gitignore`.
- Verify secret scanning against the working tree and, where applicable, Git history; if actual credentials were exposed, rotate/revoke them according to incident procedure.
- Apply least privilege, input/output validation, rate limiting/anti-abuse, secure session management, audit logging, privacy-minimizing defaults and tenant-isolation checks appropriate to the feature.
- Do not claim security approval or pentest completion without evidence.

## 10. Decision and status taxonomy

Use separate status categories:

- **Evidence:** `VERIFIED`, `PARTIAL`, `NOT FOUND`, `NOT TESTED`, `BLOCKED`, `PROPOSED`, `UNKNOWN / NEEDS DECISION`.
- **Decision/ADR:** `OPEN`, `PROPOSED`, `ACCEPTED`, `REJECTED`, `SUPERSEDED`.
- **Requirement:** `PROPOSED`, `APPROVED`, `IMPLEMENTED`, `VERIFIED`, `SUPERSEDED`.
- **Phase:** `NOT STARTED`, `IN PROGRESS`, `BLOCKED`, `PARTIAL`, `DONE`.

Never interchange these status categories. A decision may be accepted while its implementation remains unverified.

## 11. Phase execution and acceptance

- `ROADMAP.md` is the single source of current phase status; `PHASE_STATUS.md` is a consistent summary only.
- A phase is `DONE` only when its mandatory acceptance gates pass with command/evidence paths, exit codes and known limitations recorded.
- Build success is not full acceptance. A screenshot is not proof of business logic. File existence and checkboxes are not evidence by themselves.
- Preserve all historic Phase 0/1 artefacts, requirements `REQ-001..REQ-100`, ADR/OD IDs and prior evidence. Never renumber or silently erase them.
- Changes to scope or sequence require a dated decision/ADR with rationale, impacted requirements, dependencies, risk, tests and roadmap update.
- End each phase with a `HANDOFF.md`; do not start the next phase automatically.
- If controls conflict, stop the affected work, log the contradiction and reconcile all affected files before asserting acceptance.
