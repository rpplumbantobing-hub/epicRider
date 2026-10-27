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

## Keputusan terbuka (menunggu owner) — ringkas

| ID | Keputusan | Menghalangi | Detail |
|---|---|---|---|
| OD-01 | Database produksi (SQLite vs PostgreSQL/ lain) | Phase 2–3 | `PHASE_0_OPEN_DECISIONS.md` |
| OD-02 | Strategi mobile/tablet/Windows (PWA vs native/cross-platform) | Phase 2 (kontrak API), Phase 23 | idem |
| OD-03 | Vendor/mekanisme verifikasi WhatsApp OTP | Phase 4 | idem |
| OD-04 | Kebijakan `ignoreBuildErrors` / `reactStrictMode` | Phase 3 | idem |
| OD-05 | Definisi kuota seat (owner dihitung?) | Phase 5 (billing enforcement) | idem |
| OD-06 | Harga, billing, pajak, refund, payment gateway | Phase 5, 14, 22 | idem |
| OD-07 | Strategi offline-first untuk workflow lapangan | Phase 13, 24 | idem |
| OD-08 | Relevansi scope standar ISO per target pelanggan Indonesia | Phase 17–21 | idem |

Detail opsi/trade-off/pemilik keputusan: lihat `PHASE_0_OPEN_DECISIONS.md`. Phase 0 tidak memutuskan item di atas atas nama owner.
