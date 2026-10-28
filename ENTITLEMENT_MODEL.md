# ENTITLEMENT MODEL — epicRider

**Task ID:** 2-b (Phase 2 — architecture) · **Status:** PROPOSED (target-state entitlement architecture; not implemented)
**Sources:** `MASTER_CONTROL.md` (§1, §2, §4), `ARCHITECTURE.md` (§2, §5, §7), `LICENSE_MATRIX.md`, `SECURITY.md`, `CONTROL_CONSISTENCY_MATRIX.md`, `PHASE_2_DEPENDENCY_MATRIX.md`, `REQUIREMENTS.md` (REQ-001..REQ-100), `OPEN_DECISIONS.md` (OD-01..OD-184), Phase 2 prompt §3/§5, `AUTHORIZATION_MODEL.md` (companion deliverable).

---

## 1. Purpose & status

This document defines the **target-state entitlement architecture** for epicRider: the concept taxonomy, the effective-access formula, license lifecycle, seat/quota model, extension lifecycle, issuance architecture, downgrade behavior, and enforcement/audit rules.

Status rules applied throughout:

- **PROPOSED** — target-state architecture for owner review. No implementation exists.
- **NOT FOUND** — per `SECURITY.md` current state: no implemented entitlement enforcement exists in the repository. Server-side entitlement is an **architecture invariant** (MC §4), not an implementation claim.
- **OPEN** — commercial values (prices, tax, payment gateway, refund policy, durations) are never invented; they remain governed by OD-06 and related decisions.
- Related registered risks: RSK-103 (entitlement leaked via API), RSK-107 (tier/store mismatch), RSK-110 (delayed commercial decisions), RSK-111 (wrong downgrade behavior) — `RISK_REGISTER.md`.
- Companion document: `AUTHORIZATION_MODEL.md` defines how entitlements feed authorization decisions; this document defines what the entitlements are.

## 2. Concept taxonomy (canonical — MC §2, ARCHITECTURE §5)

| Concept | Definition | Rules / separation |
|---|---|---|
| **LicenseTier** | The tier value of a license. **Only three exist: miniRider, maxRider, ISOrider.** | hiRider is **never** a value of `license_tier` — it is a portal/capability, not a license (MC §1). |
| **License** | The purchased/active right held by a workspace, carrying one tier value and lifecycle state (§4). | A license is not a role and not a user identity (prompt §8). |
| **Tier Entitlement** | The set of rights **derived from** the license tier (MC §2). | Determined solely by tier (LICENSE_MATRIX §2). |
| **Entitlement** | The general concept: an evaluable granted right contributing to effective access — tier entitlement, capability grant, or extension-derived right. | Evaluated at decision time; never stored as static truth (only snapshots for audit — §10). |
| **Capability** | A domain/product capability: recruitment, candidate discovery, CRM, asset scanning, audit mode, notification broadcast, IMS, etc. (MC §2). | **Capability ≠ license**: a capability may be tier-included, extension-provided, or role-gated; the capability concept itself is domain vocabulary, not a tier. |
| **Extension** | An additive unit purchased/activated **above** a tier: additional workspace, additional seat package, workspace landing, mobile/client extension, future approved extensions (MC §2, LICENSE_MATRIX §5). | **Extension ≠ tier**: extensions never change the tier value and never act as a fourth tier. |
| **Assignment / Permission** | Adjacent authorization-side concepts (ARCHITECTURE §5): event assignment and permissions are separate from entitlements; entitlements gate, roles grant (see `AUTHORIZATION_MODEL.md` §5.4). | Entitlement check passing does not itself authorize a user action; role/permission and object state still apply. |

Relationships (PROPOSED):

```
Product (catalog) ──purchase──> Order/Purchase abstraction ──issuance──> License (tier + lifecycle)
                                                    └──────────────────> Extension instance (type + lifecycle)
License ──derives──> Tier Entitlement ─┐
Extension instance ──adds──> Extension Entitlement ─┤
Capability Rules ──────────────────────┼──> Effective Access (evaluated per action; MC §2 formula)
Role/Permission ───────────────────────┤        (see AUTHORIZATION_MODEL.md §2)
Resource Context + Object State ───────┘
```

- One workspace has exactly one active license (its tier); extensions bind to a workspace and are additive.
- hiRider participation (profiles, applications) requires no license of its own; it operates across the ecosystem above licensed workspaces (MC §1 — recruitment openings belong to workspaces; the portal is a capability).
- The **Public Store** is accessible to any user holding a basic miniRider license; it is developer commerce, not a tier feature (MC §1, LICENSE_MATRIX §4). The **Developer Equipment Store** is available on miniRider only (REQ-010). License/extension purchase (including the **first license**) runs through the separate public **License & Extension Shop** surface — corrected 2026-10-28 per ADR-018 (owner, audit F-03); the license-gated Public Store is not the first-purchase path.

## 3. Effective access formula (canonical)

From `MASTER_CONTROL.md` §2 (canonical; also LICENSE_MATRIX §6):

```
Effective Access = Tier Entitlement + Active Extensions + Capability Rules
                 + Role/Permission + Resource Context + Object State
```

**Evaluation semantics (PROPOSED):**

1. **Order.** Prerequisites first (valid session; tenant scope — `AUTHORIZATION_MODEL.md` §2). Then: tier entitlement → active extensions → capability rules → role/permission → resource context (incl. ownership/ACL) → object state → quota/abuse controls. The evaluation order is PROPOSED; the formula itself is canonical and any implementation order must evaluate all six inputs.
2. **Short-circuit deny.** The first failing input denies immediately, with the matching reason code (`DENY_TIER_ENTITLEMENT_MISSING`, `DENY_EXTENSION_MISSING`, `DENY_LICENSE_STATE`, `DENY_PERMISSION_MISSING`, `DENY_OBJECT_STATE`, … — full vocabulary in `AUTHORIZATION_MODEL.md` §3). No later input can revive a denied action.
3. **Additive within tier.** Extensions only **add** rights above the tier baseline; they never remove tier rights and never emulate another tier.
4. **Gating vs granting.** Entitlement inputs **gate** (make a capability reachable); role/permission **grants** (who may use it). A capability reachable for the workspace is still denied to a member without the role; a role held by a member is ineffective for a capability the workspace is not entitled to.
5. **Never UI-derived.** Effective access is computed server-side only; UI hiding is never a security control (MC §2, REQ-024).
6. **Deny-by-default.** If any input is unknown/unevaluable (e.g. license state unreadable), the result is deny, not allow.

## 4. License lifecycle (REQ-098)

REQ-098 (owner-approved requirement text): "purchase→active→renewal→expiry→grace→downgrade; aturan & durasi = keputusan owner". Modeled state machine (**PROPOSED**; durations and grace rules = **OD-108 OPEN**; commercial values = **OD-06 OPEN** — no prices, durations, or renewal windows are invented here):

```
PURCHASED ──(issuance)──> ACTIVE ──(renewal window: renew)──> ACTIVE (term extended)
   │                        │
   │                        ├──(term ends, no renewal)──> EXPIRED
   │                        │                                │
   │                        │                                └──(grace policy)──> GRACE
   │                        │                                        │
   │                        │                                        ├──(renew in grace)──> ACTIVE
   │                        │                                        └──(grace ends)──> DOWNGRADED
   │                        └────────(explicit downgrade, e.g. plan change)────────> DOWNGRADED
   └── DOWNGRADED ──(re-upgrade)──> ACTIVE (tier restored; data intact — REQ-099)
```

| State | Access effect (PROPOSED) |
|---|---|
| `PURCHASED` | Order placed; entitlements not yet active. |
| `ACTIVE` | Full tier entitlements + active extensions apply. |
| `EXPIRED` | Tier-gated capabilities restricted (not deleted); data retained. Exact restriction set = OD-108 OPEN. |
| `GRACE` | Continuation of restricted access for a grace period; renewal path open. Duration = OD-108 OPEN. |
| `DOWNGRADED` | Tier-gated capabilities outside the new tier locked server-side; data intact (REQ-099); re-upgrade restores access. |

Rules:

- Every state transition is audited (actor, timestamp, old/new state, triggering order reference where applicable).
- All transitions are tested per REQ-098 acceptance criteria ("setiap transisi status lisensi teruji") — currently **NOT TESTED** (no implementation).
- Access follows license status per OD-108's final decision; the model above is the PROPOSED fallback consistent with REQ-099 (restrict, not delete).
- The license lifecycle is orthogonal to workspace data lifecycle: no license state deletes workspace data (REQ-099, OD-108).

## 5. Tier capability matrix — reference

The full capability matrix is **not duplicated here**; `LICENSE_MATRIX.md` §2 is the canonical tier inheritance table (target entitlements, not implementation evidence).

Summary of inheritance rules (per MC §1/§2 and REQ-011/REQ-012):

- **miniRider**: core event workspace — Home/Event/Asset/Team/Profile, technical rider, media kit, basic asset management; max 5 kru per workspace (§6); includes Developer Equipment Store access (REQ-010).
- **maxRider** = miniRider core **MINUS** Equipment Store **PLUS** advanced capabilities: CRM, finance/commercial, full asset/rental lifecycle, advanced operational controls (dynamic roles, workflow, dashboard, risk/HSE).
- **ISOrider** = maxRider **PLUS** IMS capability (digital end-to-end IMS: quality, sustainability, HSE, infosec, continuity, risk, audit, NCR/CAPA, review, improvement).
- hiRider sits above licensed workspaces as the recruitment portal/capability — it is not created by, and does not create, any tier value.

For capability-by-capability detail, see `LICENSE_MATRIX.md` §2.

## 6. Seat & quota model (REQ-009, OD-05 OPEN)

- **Seat concept:** a seat is the capacity for one active workspace membership (kru) within a workspace's quota. Seats are a workspace-scoped countable resource; the seat model exists independent of billing (billing based on seats is blocked pending OD-05 final counting semantics).
- **Member/quota relationship:** active memberships consume seats. The miniRider baseline is a **maximum of 5 kru per workspace** (requirement source: REQ-009; historical MC §2 — crosswalk `CONTROL_REFERENCE_CROSSWALK.md`). Membership states that do not consume a seat (e.g. suspended) are **not defined here — the owner-counting parameter is explicitly OPEN (OD-05: "owner dihitung atau tidak")**; suspended-member counting is likewise part of OD-05's final semantics.
- **Enforcement point (PROPOSED):** server-side on **membership create and on invite** — the 6th kru invite/create on a full-quota miniRider workspace is rejected with `DENY_QUOTA_EXCEEDED` and a clear message (REQ-009 acceptance criteria: "penambahan kru melebihi kuota ditolak server-side dengan pesan jelas"). This is an entitlement check at the membership API/policy layer, never a UI-only limit (UC-1005 F3/F4).
- **Quota tiers above miniRider:** numeric quotas for tiers other than miniRider are not fixed in the control baseline (OD-05/OD-06 OPEN; noted in `PERSONAS_AND_JOURNEYS.md` §4 reconciliation note). No numbers are invented here.
- **Additional seat packages as Extension:** the extension catalog includes additional seat packages (REQ-018 catalog example: "+10 seat/workspace") as the sanctioned way to raise a workspace's seat quota above the tier baseline; activation follows the extension lifecycle (§7) and raises the quota enforced at the same server-side point.
- Multi-workspace limits for non-crew users = OD-123 OPEN (additional workspaces are acquired via the "additional workspace" extension per MC §2/MC §3; final numbers = OD-06).

## 7. Extension lifecycle (LICENSE_MATRIX §5)

Canonical lifecycle (LICENSE_MATRIX §5):

```
CATALOG → PURCHASED/ASSIGNED → ACTIVE → SUSPENDED/EXPIRED → RENEWED/REMOVED
```

Model rules (PROPOSED):

- **Extension instance** binds to a **(workspace, type)** pair: one instance per type per workspace; an instance is never tenant-ambiguous and never global-floating.
- **CATALOG:** an extension product is listed in the Public Store catalog (availability rules §8); catalog presence grants nothing.
- **PURCHASED/ASSIGNED:** an order/purchase abstraction (OD-06 non-blocking scope) results in an extension instance being purchased and/or assigned to a target workspace.
- **ACTIVE:** the instance contributes to effective access (additive rights — §3).
- **SUSPENDED/EXPIRED:** the instance stops contributing to effective access; workspace data created using the extension is retained (restrict-not-delete principle, by analogy with REQ-099; final rule = OD-108 scope where applicable).
- **RENEWED:** the instance returns to ACTIVE (term extension).
- **REMOVED:** the instance is detached from the workspace (audited); removal never silently deletes workspace data.
- **Audit on every transition:** actor (or system process), timestamp, workspace, extension type, old/new state, triggering order reference. Extension transitions are auditable sensitive transitions (ARCHITECTURE §9).
- Extension types (MC §2): additional workspace, additional seat package, workspace landing, mobile/client extension, future approved extensions. "Future approved" means new types require owner approval/ADR — no new type is invented here.

## 8. Entitlement issuance architecture (OD-06 non-blocking scope)

Per `ARCHITECTURE.md` §7 (Public Store architecture) and prompt §5 (OD-06): the catalog/license/entitlement/order model **can proceed**; production payment charging, final prices, final tax calculation, production payment gateway, refund policy, and commercial launch remain **BLOCKED (OD-06 OPEN)**. Order/invoice commercial state machine = **OD-135 OPEN** (state machine proposal lives in `USE_CASES.md` UC-4003; final = owner).

Conceptual objects (PROPOSED, from ARCHITECTURE §7):

| Object | Purpose |
|---|---|
| **Product** | Anything sellable/listable in the Public Store. |
| **Product Type** | Discriminator: license product, extension product, approved developer product (MC §1). |
| **License Product** | A product that, when ordered, issues a License (tier + term) for a workspace. |
| **Extension Product** | A product that, when ordered, issues an Extension instance bound to (workspace, type). |
| **Catalog Listing** | The published, visible entry of a product (listing lifecycle: draft/published/archived — mirrors REQ-055 pattern for Equipment Store listings; publication is controlled and audited). |
| **Availability** | Rules constraining who can order/see a listing (e.g. tier preconditions, region, license state) — conceptual; concrete availability rules = OD-06 sub-scope, no values invented. |
| **Order/Purchase abstraction** | The transactional abstraction that results in entitlement issuance (license issuance, extension issuance). Payment mechanics, prices, tax, refund = BLOCKED (OD-06); order/invoice states = OD-135 OPEN. |
| **Entitlement issuance** | The server-side act that creates/extends a License or activates an Extension instance as a consequence of a fulfilled order; issuance is auditable (SECURITY.md store security: "purchase/license/extension issuance auditable"). |
| **Audit trail** | Every catalog change, order, and issuance is audited (actor, timestamp, old/new values). |

Rules:

- **No prices, no tax, no payment gateway, no refund policy** are modeled or implied in this document (OD-06/OD-135 OPEN; MC §7 anti-hallucination).
- Store access rules that interact with issuance: Public Store entry requires a basic miniRider license (server-side check — MC §1, SECURITY.md); issuance target is always a workspace (licenses and extensions are workspace-scoped, not user-scoped).
- The Developer Equipment Store (miniRider-only, REQ-010) is a **separate** store from the Public Store (REQ-030) and is **not** the issuance channel for licenses/extensions; equipment listings follow REQ-055..057.

## 9. Downgrade behavior (REQ-099, OD-108 OPEN)

REQ-099: "Perilaku data saat tier turun: restrict/archive/delete sesuai keputusan (OD-108); tidak ada kehilangan data diam-diam."

Recorded options (OD-108 option space):

| Option | Behavior | Risk |
|---|---|---|
| **Restrict** | Features outside the new tier are locked server-side; all data retained and intact | Lowest data-loss risk; workspace sees locked features |
| **Archive** | Data moved out of active use into archived state (retrievable) | Retrieval path must be explicit; risk of "effectively lost" if archive is weak |
| **Delete** | Data removal | Highest risk; forbidden as a default (REQ-099: no silent loss; `RISK_REGISTER.md` RSK-111 mitigation records delete-as-default as disallowed) |

**Recommendation (PROPOSED — OWNER APPROVAL REQUIRED via OD-108):** restrict access to out-of-tier features, keep all data, no silent loss. Rationale: REQ-099 acceptance criteria ("data tetap utuh untuk upgrade kembali"), RSK-111 mitigation ("default aman: tidak ada hapus data, restrict fitur server-side, archive bila diminta"), and cross-tier data continuity (§11).

**Re-upgrade restores access:** because data is never deleted on downgrade, moving back up (mini→max→ISO or after expiry/grace) re-enables the same data in the same domain model — no migration, no rebuild (REQ-002: "Upgrade tier tidak memerlukan migrasi data manual; data lama tetap terakses").

Downgrade and expiry apply the same restrict-first principle (§4); the exact restriction set (what remains accessible in EXPIRED/GRACE/DOWNGRADED states) = OD-108 OPEN.

## 10. Enforcement & audit

- **Server-side on every tier-gated capability (REQ-024):** each API endpoint behind a tier-gated capability performs an entitlement check at the policy layer; bypassing the UI must produce an audited denial (REQ-024 acceptance criteria; RSK-103 mitigation). UI hiding is never sufficient (MC §2).
- **Denial audit events:** every entitlement denial is recorded (reason code such as `DENY_TIER_ENTITLEMENT_MISSING`, `DENY_LICENSE_STATE`, `DENY_EXTENSION_MISSING`, `DENY_QUOTA_EXCEEDED`, `DENY_STORE_TIER` — vocabulary in `AUTHORIZATION_MODEL.md` §3), including for store tier denials (REQ-010 audited denial) and quota denials (REQ-009).
- **Effective-access snapshot for auditability (PROPOSED):** when an action is **allowed**, the decision record stores which entitlements were active at that moment: tier, license state, active extension instances (types + states), and the policy version. This makes later questions answerable — "what was this workspace entitled to when this record was created/signed?" — without reconstructing history. Snapshot storage/retention = OD-138 scope (audit log retention & access rights OPEN).
- **Entitlement changes are sensitive transitions:** license state changes and extension transitions are audited events (§4, §7); audit events include actor/system attribution and timestamps (ARCHITECTURE §9).
- **Testing principles:** per-phase denial tests (each tier-gated endpoint denies wrong-tier access with audit evidence); REQ-023-style cross-tier test matrix (actor × tier × capability); license-state transition tests (REQ-098); downgrade/re-upgrade round-trip test (REQ-099). All currently **NOT TESTED** — no implementation exists.

## 11. Cross-tier data continuity (REQ-002)

- **One domain model:** a single platform/domain foundation with one domain model and one data model for all tiers (REQ-001: "satu domain model; tidak ada DB paralel per tier"). There are **no parallel per-tier databases** and no separate "miniRider schema" vs "ISOrider schema".
- **Upgrade enriches the same domain:** moving miniRider → maxRider → ISOrider activates additional capabilities over the same workspace data; it never migrates, copies, or rebuilds data (REQ-002 acceptance criteria).
- **Downgrade degrades access, not data:** out-of-tier data remains stored (restricted) so re-upgrade restores it (§9).
- **Entitlement flags, not table splits:** tier differences are expressed through entitlement checks on capabilities, not through per-tier storage divergence. Physical database choice remains OD-01 OPEN and does not affect this principle (PHASE_2_DEPENDENCY_MATRIX: OD-01 blocks only final physical DB/migrations).

## 12. Open questions

Only existing OD IDs are cited; items without an ID are explicitly labeled candidates.

| Topic | OD ID | Status |
|---|---|---|
| Owner seat counting (owner counted in the 5-kru quota?) & final seat/quota/billing semantics | OD-05 | OPEN |
| Commercial values: prices, tax, payment gateway, refund, commercial launch (nothing invented) | OD-06 | OPEN |
| License expiry/grace durations & downgrade data behavior (restrict/archive/delete) | OD-108 | OPEN |
| Order/invoice commercial state machine | OD-135 | OPEN |
| Multi-workspace limits for non-crew users (additional-workspace extension numbers) | OD-123 | OPEN |
| Price/discount approval authority (store commercial governance) | OD-133 | OPEN |
| Media storage quotas per tier (limits that produce upload denials) | OD-137 | OPEN |
| Broadcast authority & anti-abuse limits (notification broadcast capability governance) | OD-102, OD-139 | OPEN |
| Audit log retention & access rights (incl. effective-access snapshots) | OD-138 | OPEN |
| Import/export scope (entitlement-gated data portability) | OD-111 | OPEN |
| Auditor export package (scoped entitlement evidence export) | OD-143 | OPEN |
| Production database (does not block this model; affects physical implementation only) | OD-01 | OPEN |
| Whether extension instances may stack (multiple seat packages on one workspace) and their counting semantics | — | candidate — requires registration (no existing OD ID) |
| Availability rules concrete parameters (tier preconditions for catalog listings) | — | candidate — requires registration (sub-scope of OD-06) |
| Effective-access snapshot retention period & storage format | — | candidate — requires registration (sub-scope of OD-138) |

---

**Consistency statement:** this model is consistent with `MASTER_CONTROL.md` §2 (taxonomy + effective access formula), `ARCHITECTURE.md` §5/§7, `LICENSE_MATRIX.md`, and `CONTROL_CONSISTENCY_MATRIX.md` canonical rules. Only three tiers exist; hiRider is treated strictly as a portal/capability and never as a tier value or license. Implementation status: **NOT FOUND** (no code exists); all content is **PROPOSED** unless marked otherwise.
