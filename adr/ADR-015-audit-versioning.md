# ADR-015 — Audit & record versioning approach

## Status

**PROPOSED** — awaiting owner review of Phase 2 output (retention parameters remain OPEN: OD-138 / OD-164) · **Date:** 2026-10-27

## Context

- Architecture invariants (owner baseline): "immutable approved records + amendment/version history" and "auditability" (MC §4); "immutable approved records" and "audit events for sensitive transitions" (`ARCHITECTURE.md` §9).
- Requirements: REQ-027 (approved records immutable via API; corrections via amendment/version history), REQ-080 (document versioning: draft→review→approve→effective→superseded/obsolete with dates & reminders), REQ-083 (evidence chain ends in sign-off → LOCKED; corrections only via amendment adding an audited version; sign-off binds actor+role+time+context+version), REQ-081 (retention & disposition per policy — periods = OD-104), REQ-082 (controlled view/download with access logs).
- `THREAT_MODEL.md` TC-17 (audit/evidence tampering): immutability must survive application-layer bugs (physical layer depends on OD-01); audit-trail gaps and forged sign-off attribution are modeled threats.
- `ENTITLEMENT_MODEL.md` §10 proposes an **effective-access snapshot** on ALLOW (tier, license state, active extensions, policy version at decision time) so "what was this workspace entitled to when this record was created/signed?" is answerable without reconstructing history.
- `DOCUMENT_EVIDENCE_MODEL.md` (Phase 1) defines the document lifecycle and evidence workflow this ADR operates beneath.

## Problem

Choose the approach for audit events and record versioning so that: tampering is prevented or detectable, corrections never destroy history, decisions are reconstructable, and retention parameters stay open (owner decision) — while physical storage mechanics remain vendor-neutral (OD-01).

## Options

1. **Mutable records with an edit log.**
   - Pros: simple data handling.
   - Cons/trade-offs: the log can be edited along with the record; fails REQ-027/REQ-083 acceptance ideas; TC-17 unmitigated. **REJECTED.**
2. **Append-only audit events + immutable approved records with amendment/version chains.**
   - Pros: satisfies REQ-027/080/083 structurally; corrections always traceable; audit trail survives record-level mistakes.
   - Cons/trade-offs: storage growth (retention policy needed); amendment UX is more complex than in-place editing.
3. **Cryptographic / legal-grade WORM archival (class only — no vendor named).**
   - Pros: strongest tamper evidence.
   - Cons/trade-offs: physical mechanics depend on OD-01; legal strength of sign-off is a separate question (OD-103) and no legal claim may be made; over-engineering for Phase 2 scope. **Not proposed now**; can be revisited as a physical-design option when OD-01 lands.

## Decision (PROPOSED)

Adopt **append-only audit events + immutable approved records with amendment/version history**:

- **Audit events:** append-only, never editable or deletable via API; emitted for every sensitive transition (auth events, membership changes, entitlement/license/extension transitions, document/evidence transitions, store price/stock changes, application decisions — `DATA_MODEL_CONCEPT.md` §2.10); access to audit data is itself restricted and audited.
- **Approved records:** once approved/locked/effective, content is immutable via API; corrections create a **new version** linked to the prior one with mandatory reason and audit trail (amendment pattern per REQ-027/REQ-080/REQ-083).
- **Effective-access snapshot:** on ALLOW of a security-sensitive action, the decision record stores the entitlements active at that moment (tier, license state, active extensions, policy version) — `ENTITLEMENT_MODEL.md` §10 (PROPOSED).
- **Retention & access:** retention periods, disposition, and audit-log access rights remain **OPEN — OD-138 / OD-164** (document retention classes = OD-104). `LEGAL_REGULATORY_REGISTER.md` LR-013 records the possibility of regulated retention (UNKNOWN — no legal conclusion); LR-003 records the tension between deletion rights and immutable records (reconciliation pattern needs validation).

## Consequences

**Positive**

- REQ-027/REQ-080/REQ-083 acceptance ideas become testable (edit/delete of approved/locked records rejected via API; amendment adds audited version).
- TC-17 controls (tampering, forged sign-off, audit gaps) have a structural answer; sign-off attribution (actor+role+time+context+version) is binding.
- Snapshots make historical authorization/entitlement questions answerable for audits and disputes.

**Negative / risks**

- Storage growth and snapshot retention are unresolved (OD-138 sub-scope — candidate decision: snapshot retention period & format).
- Physical immutability reinforcement (database-layer WORM-style mechanics) depends on OD-01 (TC-17 residual note).
- Potential conflict between deletion duties (if any, post OD-09 validation) and immutable records: the reconciliation pattern (e.g. anonymization vs deletion) is not yet validated (LR-003).
- No legal strength of sign-off is claimed anywhere (OD-103; UXR-07 honest UI labeling).

## Evidence

- `MASTER_CONTROL.md` §4 (immutability + auditability invariants); `ARCHITECTURE.md` §9 — owner baseline 2026-10-27.
- REQ-027, REQ-080, REQ-081, REQ-082, REQ-083 (`REQUIREMENTS.md`, status PROPOSED).
- `THREAT_MODEL.md` TC-17 (residual: physical layer OD-01; retention OD-138/OD-164).
- `ENTITLEMENT_MODEL.md` §10 (snapshot proposal); `AUTHORIZATION_MODEL.md` §3 (decision audit trail contents).
- `DATA_MODEL_CONCEPT.md` §2.5 (immutability+amendment), §2.10 (audit events), §3.14 (Audit context), §6.5/§6.6 (document versioning & evidence lock machines).
- `DOCUMENT_EVIDENCE_MODEL.md` (lifecycle & evidence workflow); `LEGAL_REGULATORY_REGISTER.md` LR-003/LR-013 (uncertainty register — not legal advice).
- No implementation exists; no audit/versioning tests have been run (`NOT TESTED`).

## Dependencies

- **Open decisions:** OD-138 (audit log retention & access), OD-164 (platform technical/audit log retention defaults), OD-104 (document retention classes), OD-103 (sign-off legal strength), OD-136 (self-approval prohibition), OD-09 (legal validation umbrella), OD-01 (physical storage mechanics).
- **Related ADRs:** ADR-010 (decision audit trail), ADR-011 (effective-access snapshot source), ADR-006 (physical storage dependency).
- **Candidate decisions (no IDs):** effective-access snapshot retention period & storage format.
- **Related docs:** `DOCUMENT_EVIDENCE_MODEL.md`, `THREAT_MODEL.md`, `LEGAL_REGULATORY_REGISTER.md`.
- **Phases:** Phase 2 (this ADR); Phase 17–18 (documents/evidence per REQ-080/083 planned phases 17–18); audit events accompany every sensitive transition from Phase 4 onward (NFR-06 auditability prioritization).
