# CONTROL CONSISTENCY MATRIX — Phase 2 baseline (+ remediasi audit Phase 3, 2026-10-28)

## Canonical rules

| Topic | Canonical definition |
|---|---|
| License tiers | miniRider, maxRider, ISOrider only |
| hiRider | crew services marketplace (marketplace layanan kru): profil, skill, portofolio, **penawaran jasa (ServiceOffer — in-scope per baseline Master Control; ADR-021)**, open recruitment, application, selection, assignment — not license, not tier |
| License & Extension Shop | public landing surface for first-license purchase/renewal + extensions; serves prospective customers WITHOUT a license (ADR-018) |
| Public Store | developer commerce, basic miniRider access; NOT the first-license purchase path (ADR-018) |
| Equipment Store | miniRider-only (ADR-018) |
| Commerce surfaces | TIGA domain terpisah (katalog/order/akses/API/issuance/audit masing-masing) — relabeling satu toko bukan pemisahan (ADR-018) |
| Tier entitlement | license-derived rights |
| Capability | domain/product capability |
| Extension | additive unit above tier |
| Phase 3 status | PARTIAL — control remediation complete; build NOT RUN (platform policy) + CI remote NOT TESTED (lihat ROADMAP) |
| `.env` hygiene | `.env` TIDAK ter-track (dihapus dari index, remediasi F-05 2026-10-28); `.env.example` WAJIB ter-track; klaim laporan wajib cocok `git ls-files` |
| Evidence status | VERIFIED/PARTIAL/NOT FOUND/NOT TESTED/BLOCKED/PROPOSED/UNKNOWN |
| Decision status | OPEN/PROPOSED/ACCEPTED/REJECTED/SUPERSEDED |
| Requirement status | PROPOSED/APPROVED/IMPLEMENTED/VERIFIED/SUPERSEDED |
| Phase status | NOT STARTED/IN PROGRESS/BLOCKED/PARTIAL/DONE |
| OD-02 | does not block Phase 2 |
| OD-03 | does not block Phase 4 as a whole |
| OD-05 | does not block Phase 5 as a whole |
| OD-06 | does not block entire phases |
| OD-09 | legal/regulatory validation |
| OD-116 | Phase 2 work/output, not a Phase 2 prerequisite |
| ~~OD-185~~ | CLOSED — DECIDED BY BASELINE: penawaran jasa in-scope hiRider (ADR-021) |

## Required contradiction searches

Search the repository for (negasi aturan kanonik, kecuali dicatat):
- `hiRider license`
- `hiRider tier`
- `hiRider fourth`
- `Public Store maxRider`
- `Public Store ISOrider`
- `dua store` / `two stores` / `Dua store` (boleh tersisa hanya di nota amendemen/riwayat bertanda)
- `penawaran jasa` (harus DITEMUKAN di MASTER_CONTROL/REQUIREMENTS/DATA_MODEL_CONCEPT/ARCHITECTURE/LICENSE_MATRIX — kehadiran, bukan absennya)
- `OD-185` (harus hanya berstatus CLOSED — DECIDED BY BASELINE / ADR-021 di dokumen aktif)
- `License & Extension Shop` (harus konsisten ADR-018: publik, first-license)
- `OD-02 blocks Phase 2`
- `OD-03 blocks Phase 4`
- `OD-05 blocks Phase 5`
- `OD-06 blocks Phase 14`
- `CRUP`
- `OD-116 prerequisite Phase 2`
- `Phase 3 DONE` (dokumen aktif harus PARTIAL, bukan DONE — kecuali riwayat bertanda)
- `.env` tracked/untracked claim (laporan harus cocok `git ls-files`)
- `REQ-013` (harus memuat penawaran jasa setelah amendemen)
- `REQ-030` (harus memuat tiga surface setelah revisi)

Historical references may remain only when clearly marked as superseded/audit history.

## Phase 1 preservation rule

Do not renumber or delete Phase 1 requirement IDs.
Current Phase 1 baseline reports REQ-001..REQ-100; Phase 2 must preserve that traceability. Controlled amendments (REQ-013 penawaran jasa; REQ-030 three surfaces, 2026-10-28) keep IDs stable.
