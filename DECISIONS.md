# DECISIONS / ADR — epicRider

Format: ADR ringkas. Status: `PROPOSED` (usulan menunggu owner) / `ACCEPTED` (disetujui) / `SUPERSEDED`.
Aturan (Master Control §5, §14): pemilihan/penggantian framework, database, arsitektur, auth provider, build system, routing, design system wajib lewat ADR. Keputusan bisnis penting tidak boleh diambil diam-diam atas nama owner.

---

## ADR-000 — Adopsi control baseline Phase 0
- **Tanggal:** 2026-05-22 · **Status:** ACCEPTED (pelaksanaan prompt Phase 0 oleh owner via lampiran)
- **Konteks:** Master Control, prompt Phase 0 diberikan sebagai lampiran; repository belum memiliki control files.
- **Keputusan:** Membuat 12 control files kanonik di root (`MASTER_CONTROL.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `LICENSE_MATRIX.md`, `DECISIONS.md`, `SECURITY.md`, `TESTING.md`, `OPERATIONS.md`, `UX_UI_STANDARD.md`, `ISO_IMS_BLUEPRINT.md`, `PHASE_STATUS.md`) + 4 laporan Phase 0. Isi Master Control diadopsi tanpa perubahan substansi; laporan memisahkan CURRENT vs TARGET.
- **Dampak:** Semua fase berikutnya wajib membaca control files sebelum coding (Master Control §3).

## ADR-001 — Tidak ada perubahan stack pada Phase 0
- **Tanggal:** 2026-05-22 · **Status:** ACCEPTED (sesuai batasan keras prompt Phase 0)
- **Konteks:** Repository adalah scaffold Next.js 16 + Prisma + SQLite + Tailwind 4 + shadcn/ui (bukti di ARCHITECTURE.md §1). Batasan keras Phase 0 melarang penggantian stack.
- **Keputusan:** Stack tetap apa adanya. Evaluasi kesesuaian stack terhadap target (MC §5) dilakukan sebagai input Phase 2, bukan penggantian sekarang.
- **Dampak:** Tidak ada perubahan dependency/arsitektur pada Phase 0.

## ADR-002 — Verifikasi standar ISO ditangguhkan (BLOCKED dari sandbox)
- **Tanggal:** 2026-05-22 · **Status:** ACCEPTED (kondisi lingkungan), verifikasi tetap wajib
- **Konteks:** Akses ke `www.iso.org` dan `catalog.iso.org` dari lingkungan audit mengembalikan HTTP 403/000 (diblokir). Prompt Phase 0 Checkpoint D melarang klaim status standar tanpa sumber resmi.
- **Keputusan:** Seluruh status standar dicatat `NOT VERIFIED`; daftar verifikasi disiapkan di `ISO_IMS_BLUEPRINT.md` untuk dieksekusi dari lingkungan dengan akses katalog resmi.
- **Dampak:** ISOrider design (Phase 17+) tidak boleh mengunci edisi/amendment sebelum verifikasi.

## ADR-003 — Seed requirement dari Master Control tanpa discovery
- **Tanggal:** 2026-05-22 · **Status:** ACCEPTED
- **Konteks:** REQUIREMENTS.md wajib ada (MC §13), tetapi Phase 0 bukan fase discovery.
- **Keputusan:** Register berisi 46 seed requirement ber-status `PROPOSED`, diturunkan per bagian MC. Refinement, personas, use case, acceptance criteria final = Phase 1.
- **Dampak:** Jangan menganggap REQ-xxx final sampai Phase 1 menyetujui.

## ADR-004 — Exit gate Phase 0 disetujui; baseline git ter-commit
- **Tanggal:** 2026-10-27 · **Status:** ACCEPTED
- **Konteks:** PHASE_0_ACCEPTANCE.md mencatat 9/9 exit criteria terpenuhi pada working tree dengan 2 keterbukaan (commit baseline, review open decisions). Owner kemudian memberikan instruksi eksplisit melanjutkan ke Phase 1, dan baseline repository ter-commit sebagai `03293b6` (terverifikasi `git log`).
- **Keputusan:** Phase 0 ditandai **DONE** — bukti: commit `03293b6` + instruksi owner. Keterbukaan residual (verifikasi ISO BLOCKED; keputusan bisnis OD) dibawa ke register `OPEN_DECISIONS.md` dan STANDARD_REGISTER, bukan diabaikan.
- **Dampak:** Phase 1 sah dimulai; residuals terlacak via OD-160 (ISO) dan tabel open decisions.

## ADR-005 — Baseline Phase 1 dihasilkan (desk analysis); semua requirement PROPOSED menunggu approval
- **Tanggal:** 2026-10-27 · **Status:** ACCEPTED (pelaksanaan prompt Phase 1; substansi menunggu owner)
- **Konteks:** Prompt Phase 1 mewajibkan 15 artefak discovery tanpa coding. Gate: `DATA_MODEL_CONCEPT.md` NOT FOUND (dicatat OD-116); Phase 0 evidence lengkap.
- **Keputusan:** Menghasilkan baseline Phase 1 lengkap (lihat PHASE_1_REPORT.md): REQ-001..100, 55 UC, 12 persona/journey, process map, document/evidence model, standard register, license matrix revisi, UXR-01..20, NFR-01..16, RSK-101..125, OPEN_DECISIONS terkonsolidasi, TRACEABILITY_MATRIX. Seluruh requirement/UXR/NFR berstatus **PROPOSED** — approval owner wajib sebelum Phase 2. Keputusan bisnis tidak diambil atas nama owner (semua berlabel OPEN / OWNER APPROVAL REQUIRED).
- **Dampak:** Phase 2 memakai baseline ini sebagai input; perubahan requirement lewat revisi REQUIREMENTS.md dengan ID baru (>REQ-100), tanpa daur ulang ID.

## Keputusan terbuka (menunggu owner) — ringkas

| ID | Keputusan | Menghalangi | Detail |
|---|---|---|---|
| OD-01..OD-12, OD-101..116, + 36 kandidat workstream (OD-12x/13x/14x/16x/18x) | Register aktif | Lihat tabel per fase | **`OPEN_DECISIONS.md` (register aktif terkonsolidasi)** — `PHASE_0_OPEN_DECISIONS.md` adalah riwayat Phase 0 |

Detail opsi/trade-off/pemilik keputusan: lihat `OPEN_DECISIONS.md` (register aktif). Tidak ada item di atas yang diputuskan engineer/agent atas nama owner.
