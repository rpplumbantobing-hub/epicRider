# Arsip control files era Phase 0/1 — SUPERSEDED

**Status:** `SUPERSEDED` (2026-10-27)

File-file di folder ini adalah versi **lama** (era Phase 0/Phase 1) dari control files
epicRider yang digantikan oleh lampiran owner `upload/epicRider_phase2_control_replacement.zip`
sesuai instruksi eksplisit owner: *"kamu telah melakukan kesalahan tolong ganti dari file
yang saya lampirkan"* (pesan IM, 2026-10-27).

## Mengapa diganti

Baseline lama mengandung kesalahan yang direkonsiliasi owner:

1. **Taksonomi hiRider salah** — versi lama menyebut hiRider sebagai "lapisan keempat /
   4 tier" (mis. LICENSE_MATRIX lama §W-4). Baseline final: hanya **3 license tier**
   (miniRider, maxRider, ISOrider); hiRider adalah **portal/capability rekrutmen,
   bukan license**.
2. **Dependensi terlalu ketat** — ROADMAP/PHASE_1_REPORT/OPEN_DECISIONS lama menjadikan
   OD-01 (database), OD-02 (mobile), OD-116 (data model concept) sebagai prasyarat yang
   memblokir Phase 2. Baseline final: OD tersebut **non-blocking untuk Phase 2**
   (scope-nya dipisah, lihat `DECISIONS.md` dan `PHASE_2_DEPENDENCY_MATRIX.md` baru).
3. **Typo** `CRUP` → `CRUD` (TESTING.md lama baris 33).

## Isi arsip

| File | Keterangan |
|---|---|
| `MASTER_CONTROL.md` | Versi Phase 0 (19 KB) — digantikan versi rekonsiliasi Phase 2 |
| `ARCHITECTURE.md` | Versi Phase 0 — digantikan versi rekonsiliasi Phase 2 |
| `DECISIONS.md` | Versi Phase 0/1 berisi ADR-000..ADR-005 — ADR historis tersebut **dipertahankan** dan dipindahkan ke `ADR_REGISTER.md` baru |
| `ROADMAP.md` | Versi Phase 1 (27 fase, prasyarat ketat) — digantikan versi rekonsiliasi |
| `LICENSE_MATRIX.md` | Versi Phase 1 (25 KB, "4 tier") — digantikan versi 3-tier |
| `SECURITY.md` | Versi Phase 0 — digantikan versi rekonsiliasi Phase 2 |
| `TESTING.md` | Versi Phase 0 (typo CRUP) — digantikan versi rekonsiliasi |

## Aturan pemakaian

- Folder ini adalah **riwayat audit** — jangan dijadikan rujukan kendali aktif.
- Rujukan kendali aktif = versi di root repo (baseline rekonsiliasi 2026-10-27).
- Riwayat konten juga tersedia di git history (commit sebelum penggantian).
