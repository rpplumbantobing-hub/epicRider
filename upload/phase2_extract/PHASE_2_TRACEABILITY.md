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
