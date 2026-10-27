# PHASE 2 DEPENDENCY MATRIX

| ID | Dependency | Blocks | Does not block |
|---|---|---|---|
| OD-01 | Production DB | final physical DB/migrations | logical architecture/data model |
| OD-02 | Mobile/client strategy | final client delivery strategy | Phase 2 domain/API architecture |
| OD-03 | WhatsApp provider | provider-specific integration | Phase 4 architecture/auth abstraction |
| OD-05 | Owner seat | final quota/billing enforcement | Phase 5 entitlement/membership modeling |
| OD-06 | Billing | production charging/commercial launch | catalog/entitlement/extension architecture |
| OD-09 | Legal/regulatory | legal claims/compliance sign-off | generic architecture |
| OD-116 | Data model concept | nothing before Phase 2 | is a Phase 2 workstream/output |
| OD-160 | ISO verification | final ISO-specific claims/mapping | generic architecture |

A dependency may be `BLOCKED` at a sub-scope without blocking the entire phase.
