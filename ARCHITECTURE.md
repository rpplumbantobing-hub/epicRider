# ARCHITECTURE — epicRider

## 1. State discipline

`CURRENT STATE` = repository evidence.
`TARGET STATE` = architecture intended by the project.

Do not present TARGET STATE as implemented.

## 2. Product boundaries

### License tiers
- miniRider
- maxRider
- ISOrider

### hiRider
Portal/capability for recruitment between users/candidates and workspaces.
Not a license.

Core relationship:
`User Profile → Recruitment Opening → Application → Recruitment Decision → Membership/Assignment`

Do not collapse Application into Membership.

### Commerce surfaces — three separate domains *(corrected 2026-10-28, pre-Phase 4 reconciliation — ADR-018; formerly described here as two stores)*

1. **License & Extension Shop** — public landing surface for first-license purchase and license/extension renewal or purchase; must not require the buyer to already own miniRider; not the Public Store and not the Developer Equipment Store (commercial values OD-06).
2. **Public Store**
Developer commerce storefront accessible to users with basic miniRider license.
Not a tier.

3. **Developer Equipment Store**
miniRider-only application store (maxRider/ISOrider denied server-side).

## 3. Domain architecture

At minimum Phase 2 must model these bounded areas:

1. Identity
2. Workspace/Tenant
3. Membership & Roles
4. Event & Assignment
5. Entitlement & License
6. Extension
7. hiRider Recruitment
8. Asset
9. Technical Rider
10. Media Kit
11. Communication/Notification
12. Developer Commerce/Store
13. Document/Evidence
14. Audit
15. Finance/Commercial
16. IMS
17. Integration/Sync

Exact boundaries may be refined by ADR.

## 4. Identity and access model

Conceptual chain:

`User`
→ `Workspace Membership`
→ `Role`
→ `Event Assignment`
→ `Permission Context`

Separate:
- developer role;
- auditor access;
- recruitment application;
- event assignment;
- license entitlement.

## 5. Entitlement architecture

Use separate concepts:

`LicenseTier`
`License`
`Entitlement`
`Capability`
`Extension`
`Assignment`
`Permission`

Do not encode hiRider as a LicenseTier.

Effective authorization must evaluate:
actor + workspace/tenant + object + action + context + entitlement + role + object state.

## 6. hiRider architecture

Minimum conceptual objects:
- Candidate/User Profile
- Skill
- Portfolio
- Service Offer *(planned — remediasi F-01 audit Phase 3, 2026-10-28: penawaran jasa in-scope per baseline Master Control "Marketplace layanan kru"; lihat adr/ADR-021; lifecycle PROPOSED, desain final Phase 16)*
- Recruitment Opening
- Application
- Application Status History
- Shortlist
- Recruitment Decision
- Workspace Membership
- Event Assignment

Rules:
- application is not membership;
- acceptance does not automatically grant access;
- membership must follow explicit workspace authorization;
- event assignment is separate;
- profile visibility/privacy must be explicit.

## 7. Commerce surfaces architecture

*(Amended 2026-10-28, pre-Phase 4 reconciliation — ADR-018 three-surface model; this section formerly listed License/Extension products under the Public Store.)*

**License & Extension Shop** (public first-license/renewal surface) needs its own:
- License Product / Extension Product catalog (separate from Public Store catalog);
- Order/Purchase abstraction;
- entitlement issuance;
- audit trail.

**Public Store** (developer products; basic miniRider access) needs:
- Product;
- Product Type;
- Catalog Listing;
- Availability;
- Order/Purchase abstraction;
- entitlement issuance;
- audit trail.

Commercial values remain governed by OD-06. Catalogs, order types, access rules, APIs, entitlement issuance and audit are separate per surface (REQ-030; `DATA_MODEL_CONCEPT.md` §4.6).

## 8. Client-neutral architecture

API/domain layer must support:
- desktop browser;
- tablet browser;
- mobile browser;
- Android;
- iOS;
- Windows delivery if later approved.

OD-02 must not force Phase 2 to choose a client technology before architecture contracts are established.

## 9. Data architecture principles

- UUID/strong identifiers as decided in Phase 2 ADR;
- timestamps and actor attribution;
- soft deletion only where semantically appropriate;
- optimistic concurrency/versioning for mutable critical records;
- immutable approved records;
- explicit tenant/workspace ownership;
- foreign-key/integrity rules;
- controlled migration;
- indexes based on access patterns;
- audit events for sensitive transitions.

Production database choice remains OD-01 unless resolved during Phase 2.

## 10. Security architecture

Target controls:
- authentication abstraction;
- authorization policy layer;
- tenant isolation;
- entitlement enforcement;
- secure sessions;
- secrets server-side;
- audit;
- rate limiting;
- anti-replay;
- secure OAuth/OIDC;
- secure provider abstraction.

WhatsApp provider is not an architectural prerequisite.

## 11. Phase 2 architecture outputs

- `ARCHITECTURE.md`
- `DATA_MODEL_CONCEPT.md`
- `THREAT_MODEL.md`
- `AUTHORIZATION_MODEL.md`
- `ENTITLEMENT_MODEL.md`
- `API_ARCHITECTURE.md`
- `ADR_REGISTER.md`
- individual ADR files as needed
- `PHASE_2_DEPENDENCY_MATRIX.md`
- `PHASE_2_TRACEABILITY.md`
- `PHASE_2_REPORT.md`
