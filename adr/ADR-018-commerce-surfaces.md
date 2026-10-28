# ADR-018 — Commerce surfaces: License & Extension Shop vs Public Store vs Developer Equipment Store

## Status

**ACCEPTED** (owner decision via Phase 3 prompt §2.1 F-03, 2026-10-28) — **supersedes ADR-013 in part** (the Public Store product-scope definition only; all other ADR-013 content stands). ADR-013 remains in place as history with an amendment note.

## Context

- ADR-013 (ACCEPTED via owner baseline 2026-10-27) defined **Public Store** as the developer commerce storefront selling **license products, extensions, and approved developer products**, with access = **user holding a basic miniRider license**.
- The consistency audit (F-03) showed this mixes two different commerce needs with different access:
  - prospective customers **without any license** must be able to buy their **first license** (a public License & Extension purchase path);
  - the developer products storefront requires an existing basic miniRider license.
  - Putting license sales inside a store whose access requires a license makes first-time purchase logically impossible through that surface.
- Owner decision (Phase 3 prompt, hierarchy #1): model **three separate surfaces** — do not merge them by relabeling.

## Problem

Define the three commerce surfaces, their product scopes, and their access rules so that the first-license purchase path exists, developer commerce keeps its license precondition, and the equipment store stays miniRider-only — with each surface having its own catalog, order, access, API, entitlement-issuance, and audit model.

## Options

1. **Keep ADR-013 as-is** (one Public Store selling licenses + extensions + developer products behind the miniRider gate).
   - Cons: first-time license purchase impossible through the modeled surface; conflates two access needs; contradicted by owner Phase 3 instruction. **REJECTED.**
2. **One unified commerce domain with per-surface filtering.**
   - Cons: violates REQ-030 isolation; relabeling is not separation (owner: "Jangan sekadar menyamakan label"). **REJECTED.**
3. **Three separate surface domains** (License & Extension Shop / Public Store / Developer Equipment Store), each with its own entities, access rules, and audit. **ACCEPTED (owner).**

## Decision

1. **License & Extension Shop** — public landing-page surface for license purchase/renewal and extension purchase. Must serve prospective customers **without any prior license** (first license purchase) and agreed renewal flows. No invented prices/tax/gateway/refund (OD-06).
2. **Public Store** — developer products storefront for epicRider users; access requires a **basic miniRider license** (server-side entitlement check). Not a license tier; not a higher-tier feature; **not** the first-license purchase path.
3. **Developer Equipment Store** — in-app equipment store; **miniRider only** (maxRider/ISOrider denied at the API boundary, denial audited — REQ-010).
4. The three surfaces are structurally disjoint (entity families, APIs, catalogs, order/issuance flows, audit streams). Shared infrastructure (e.g. platform order abstraction patterns) must not merge the domains into one store model.
5. Entitlement issuance: license/extension purchases from the **License & Extension Shop** issue License/Extension grants (ADR-011/ADR-014 mechanics); Public Store purchases issue only developer-product entitlements/fulfillment; Equipment Store orders follow the (still open) physical-goods fulfillment model.

## Consequences

**Positive**
- First-license purchase path exists for unlicensed prospective customers (the missing case flagged in ADR-013 Consequences).
- REQ-030 isolation and REQ-010 audited denial remain satisfiable and unambiguous.
- `store.public.access` permission and ADR-013's structural isolation carry over unchanged for the Public Store.

**Negative / risks**
- Phase 2 documents describing the Public Store as selling "license products, extensions" need targeted correction (`MASTER_CONTROL.md` §1, `LICENSE_MATRIX.md` §4, `DATA_MODEL_CONCEPT.md` §3.12/§4.6, `AUTHORIZATION_MODEL.md` §9, `API_ARCHITECTURE.md` §3 platform-scoped row, `ENTITLEMENT_MODEL.md` §3) — executed in Phase 3 Gate A, itemized in `PHASE_2_CONSISTENCY_REMEDIATION_REPORT.md`.
- License & Extension Shop commerce is a new named surface in the control docs; no requirement was invented for it in Phase 3 (commerce UI/build remains Phase 22+; OD-06 gates commercial values).
- **Sinkronisasi F-02 (remediasi audit konsistensi Phase 3, 2026-10-28):** keputusan tiga surface kini tersinkron penuh ke requirement & kontrol — `REQUIREMENTS.md` REQ-030 direvisi (ID dipertahankan, tanpa renumber), `PRODUCT_SCOPE.md` diamendemi terkendali (§2.1/§3/§5/§6, rujukan ADR-018), `CONTROL_CONSISTENCY_MATRIX.md` menambah rule kanonik "License & Extension Shop"/"Commerce surfaces" + pencarian kontradiksi "dua store". Bukti scan: `audit/phase3-remediation/`.

## Evidence

- Owner instruction: `upload/epicRider_Phase_3_Prompt_zai.md` §2.1 F-03 (three surfaces, mandatory model, no production commerce build in Phase 3).
- `epicRider_phase2_consistency_audit.md` F-03.
- ADR-013 (superseded in part); REQ-030, REQ-010, REQ-016, REQ-055..057; OD-06/OD-101/OD-133/OD-135.

## Dependencies

- Open: OD-06 (commercial values), OD-101 (developer role model), OD-133 (price/discount authority), OD-135 (order/invoice state machine). OD-185 (hiRider scope) tidak terkait commerce — **CLOSED 2026-10-28 via ADR-021**.
- Related ADRs: ADR-011 (entitlement), ADR-013 (superseded in part), ADR-014 (extension products).
- Phases: foundation only in Phase 3 (documentation); License & Extension Shop UI/commerce later (landing/commerce roadmap phases); Public Store per ADR-013 phasing; Equipment Store Phase 11.
