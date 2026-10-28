# ADR-021 — hiRider scope: penawaran jasa (Service Offer) termasuk dalam scope

## Status

**ACCEPTED** (keputusan scope yang **bersumber dari baseline Master Control**, dieksekusi sebagai remediasi F-01 audit konsistensi Phase 3, 2026-10-28). Menutup **OD-185**. Mengamendemi `adr/ADR-012-hirider-domain-boundary.md` secara terkendali (nota amendemen di file tersebut; substansi boundary/invariant ADR-012 tidak berubah).

## Context

- Baseline Master Control mendefinisikan hiRider sebagai **"Marketplace layanan kru"** yang mencakup profil, skill, portofolio, **penawaran jasa**, open recruitment, lamaran, seleksi, dan assignment (Master Control §2 hiRider; roadmap Phase 16 "hiRider marketplace/recruitment").
- Model domain Phase 2 (`DATA_MODEL_CONCEPT.md` §3.7/§5) tidak memuat `ServiceOffer` — ini adalah **ketidaklengkapan desain domain**, bukan ketidakjelasan scope produk.
- Phase 3 Gate A (remediasi audit Phase 2 F-04) membuka **OD-185** ("apakah penawaran jasa tetap scope hiRider?") — mengubah pertanyaan scope yang sudah dijawab baseline menjadi keputusan terbuka. Audit konsistensi Phase 3 (F-01) menegaskan ini keliru: "Ketidaklengkapan desain domain tidak sama dengan ketidakjelasan scope produk."
- Instruksi remediasi (owner, `upload/epicRider_phase3_consistency_audit.md` F-01): selaraskan `MASTER_CONTROL.md` dengan baseline; tutup OD-185 sebagai keputusan scope yang bersumber dari Master Control; pertahankan invariant; rencanakan ServiceOffer di model domain; jangan mengarang ID requirement baru.

## Decision

1. **Penawaran jasa (service offer) TERMASUK dalam scope hiRider.** Sumber keputusan = baseline Master Control ("Marketplace layanan kru"), bukan preferensi engineer.
2. `MASTER_CONTROL.md` §1 hiRider diselaraskan: menyebut penawaran jasa secara eksplisit beserta aturan akses rekrutmen (hanya rekrutmen terbuka; owner dapat menutup) dan multi-workspace kru.
3. Model domain direncanakan: **`ServiceOffer`** ditambahkan ke `DATA_MODEL_CONCEPT.md` §3.7 (hiRider Recruitment context) dan §5 sebagai **konsep yang direncanakan** — status detail lifecycle/pemilik/visibility/permission/API/audit = `PROPOSED` (final design di Phase 16). **Keberadaan ServiceOffer di scope tidak lagi berstatus `OPEN`.**
4. `ARCHITECTURE.md` §6 (minimum conceptual objects) ditambah `Service Offer (planned)`; `LICENSE_MATRIX.md` §3 ditambah service offers pada daftar kemampuan hiRider.
5. **REQ-013 diamendemi secara terkendali** (ID tetap, tanpa renumber, tanpa REQ baru): teks requirement dan acceptance criteria-nya diperluas mencakup penawaran jasa, dengan nota amendemen di `REQUIREMENTS.md`. Requirement turunan baru (ID > REQ-100) hanya bila owner menyetujuinya kemudian.
6. **Invariant tetap mengikat dan tidak berubah:**
   - `Application != Workspace Membership`
   - `Application != Event Assignment`
   - `Acceptance != Automatic Workspace Access`
   - `hiRider != License/Tier` (bukan nilai `LicenseTier`)
7. `OD-185` ditutup: `CLOSED — DECIDED BY BASELINE` (rujuk ADR-021). Pembukaan kembali hanya melalui keputusan owner eksplisit yang bermaksud mengubah baseline (dengan ADR pengganti).

## Consequences

**Positive**
- Tidak ada lagi kontradiksi antara kontrol aktif dan baseline Master Control pada scope hiRider.
- Desain detail hiRider (Phase 16) punya arah scope yang jelas; lifecycle ServiceOffer didesain dengan privacy/permission/audit sejak awal.
- Traceability REQ-013 tetap utuh (ID stabil).

**Negative / risks**
- ServiceOffer belum punya lifecycle final — semua detail berstatus `PROPOSED` dan wajib melalui desain Phase 16 + ADR bila mengubah risiko/arsitektur.
- Dokumen Phase 1/2 lain yang pernah menyebut hiRider hanya sebagai "recruitment portal" tetap bersejarah; koreksi dilakukan terhadap dokumen kanonik aktif saja (`CONTROL_CONSISTENCY_MATRIX.md` memuat rule kanonik baru + daftar pencarian).

## Evidence

- Baseline: `upload/epicRider_Master_Control.md` §2 hiRider ("Marketplace layanan kru…") + §12 Phase 16.
- Audit: `upload/epicRider_phase3_consistency_audit.md` F-01 (termasuk invariant yang wajib dipertahankan).
- Diff/scan remediasi: `audit/phase3-remediation/` (2026-10-28).

## Dependencies

- Related: ADR-012 (hiRider boundary — amended note), ADR-018 (commerce surfaces — tidak terkait langsung).
- REQ: REQ-013 (amended), REQ-062..064, REQ-014 (multi-workspace kru).
- Phases: desain detail = Phase 16; tidak memblokir Phase 4/5; OD-109 (visibilitas) dan OD-134 (kontak lamaran) tetap relevan untuk privacy ServiceOffer.
