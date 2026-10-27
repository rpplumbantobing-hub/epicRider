# ADR-007 — Mobile/client delivery strategy

**Scope:** final delivery strategy for mobile/tablet (and possible Windows) clients. This is an **evaluation ADR**: it records the option space and explicitly makes NO selection.

## Status

**OPEN** — owner decision required (OD-02) · **Date:** 2026-10-27

## Context

- OD-02 ("Strategi mobile/tablet/Windows — PWA vs native vs cross-platform vs wrapper") has been OPEN since Phase 0; no owner decision exists.
- The owner-reconciled baseline fixes the dependency rule: OD-02 does **not** block Phase 2; Phase 2 must produce **client-neutral** API/domain contracts; the final delivery strategy is to be settled through an ADR; Phase 23 (client delivery) remains dependent on the final decision (`DECISIONS.md` OD-02; `MASTER_CONTROL.md` §5; `PHASE_2_DEPENDENCY_MATRIX.md`).
- `ARCHITECTURE.md` §8 requires the API/domain layer to support desktop browser, tablet browser, mobile browser, Android, iOS, and Windows delivery if later approved — and forbids OD-02 from forcing a client-technology choice before architecture contracts are established.
- `MASTER_CONTROL.md` §4 lists "web adalah first-class channel" and "API/domain layer client-neutral" as architecture invariants.
- Related requirements: REQ-019 (full web function on desktop/tablet/mobile browser), REQ-020 (backend/API reusable by Android/iOS without duplicating business logic).

## Problem

Which client delivery strategy should epicRider use beyond the first-class web channel? There is currently **insufficient evidence** (no usability validation, no device-matrix evidence, no owner decision) to select one. The Phase 2 prompt explicitly forbids picking a technology merely to make the architecture look complete; an honest evaluation ADR with status OPEN is required instead.

## Options

1. **PWA (Progressive Web App).**
   - Pros: one web codebase; installable; partial offline capability; no app-store gatekeeping.
   - Cons/trade-offs: restricted access to some platform APIs; iOS browser capabilities vary; no store presence/distribution channel.
2. **Native Android + native iOS.**
   - Pros: best platform integration and performance.
   - Cons/trade-offs: two codebases; highest build/maintenance cost; risk of duplicated domain logic (violates REQ-020 if unmanaged).
3. **Cross-platform framework (single codebase to both stores).**
   - Pros: one codebase with near-native distribution.
   - Cons/trade-offs: abstraction-layer risk; native escape hatches still needed for some capabilities; tooling dependency.
4. **Wrapper/hybrid (web core in a thin native shell).**
   - Pros: fastest path to store presence; reuses the web client.
   - Cons/trade-offs: quality/performance ceiling; store-policy constraints; still two platform shells to maintain.

Cross-cutting interaction: the extension catalog includes a "mobile/client extension" type (`MASTER_CONTROL.md` §2; REQ-018 lists "mobile app" as a catalog example), so the delivery strategy also interacts with how a mobile client might be packaged as a purchasable extension (see ADR-014). No such packaging is decided here.

## Decision

**NOT DECIDED — owner decision required (OD-02).** No selection is made.

Meanwhile:

- Phase 2 stays **client-neutral**: domain and API contracts are defined without assuming any client technology (`ARCHITECTURE.md` §8; `API_ARCHITECTURE.md` — by name, parallel Task 2-e).
- The final choice will be recorded in this ADR (status change OPEN → ACCEPTED with owner evidence) when the owner decides.
- **Phase 23 delivery remains dependent on the final decision** (`DECISIONS.md` OD-02).

## Consequences

**Positive**

- Phase 2 is fully unblocked; no premature technology lock-in; all four options remain open at their true cost.
- The web channel (first-class per MC §4) plus client-neutral APIs keep every option technically reachable.

**Negative / risks**

- Phase 23 planning carries uncertainty until the decision lands.
- Offline/sync scope (OD-07) is partly coupled: the offline threat category TC-20 in `THREAT_MODEL.md` is explicitly conditional on OD-07 and interacts with client capabilities.
- Client-specific UX requirements (beyond REQ-019/REQ-020 web scope) cannot be finalized; device/browser matrix for the web scanner remains its own open decision (OD-184).

## Evidence

- `DECISIONS.md` (owner baseline 2026-10-27) — OD-02 rule ("final delivery strategy belongs in ADR; Phase 23 delivery remains dependent").
- `MASTER_CONTROL.md` §5 (OD-02 dependency policy) and §4 (web first-class, client-neutral).
- `ARCHITECTURE.md` §8 (client-neutral architecture; do not choose before contracts exist).
- `PHASE_2_DEPENDENCY_MATRIX.md` — OD-02 row.
- `OPEN_DECISIONS.md` §1 — OD-02 (influences REQ-019/REQ-020 and Phase 2 API contracts).
- `THREAT_MODEL.md` §8 — OD-02 out-of-scope row (final strategy belongs to an ADR; Phase 23 depends on it).
- Phase 2 prompt §5/§15 — do not lock mobile client technology merely to complete the architecture.
- No test, benchmark, or usability evidence exists or is claimed for any option.

## Dependencies

- **Open decision:** OD-02 (the deciding input).
- **Related ODs:** OD-07 (offline strategy — coupled to client capabilities), OD-10 (hosting/release strategy), OD-184 (scanner device/browser matrix — web-client scoping).
- **Related ADRs:** ADR-016 (API versioning — old clients must keep functioning during transitions, REQ-097); ADR-014 (mobile/client extension type exists in the catalog).
- **Related docs:** `API_ARCHITECTURE.md` (by name — parallel Task 2-e), `UX_REQUIREMENTS.md`, `THREAT_MODEL.md` (TC-20).
- **Phases:** Phase 2 (this evaluation ADR); Phase 23 (delivery — dependent on the final decision).
