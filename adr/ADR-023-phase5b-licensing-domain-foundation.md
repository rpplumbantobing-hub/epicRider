# ADR-023 — Phase 5-B: Licensing Domain & Database Foundation

**Status:** PROPOSED (menunggu ratifikasi owner — pola ADR-022) · **Tanggal:** 2026-10-30 · **Scope:** Phase 5-B

## Konteks

Phase 4 menutup identitas/workspace/membership/authorization (DONE, merge `a1af59d8`). Owner
mengotorisasi Phase 5-B: fondasi domain/database licensing SAJA (DMC §3.5/§3.6/§6.2/§8;
ENTITLEMENT_MODEL §2/§4/§7; LICENSE_MATRIX §1/§2/§5; MC §2.1/§2.2/§3). Red line: OD-05 (seat
counting), OD-06 (komersial), OD-108 (durasi/grace/downgrade) tidak boleh diputuskan; tanpa
engine/checkout/UI; `hiRider`/`totalRider` tidak boleh menjadi tier.

## Keputusan

1. **Delapan model fondasi** (`LicenseTier`, `License`, `Capability`, `CapabilityRule`,
   `ExtensionType`, `ExtensionDefinition`, `ExtensionInstance`, `TierQuota`) memakai pola Phase 4:
   SQLite + String kode language-neutral (DMC §2.9) + vocabulary TypeScript dengan guard
   (`src/lib/licensing/vocabulary.ts`) — bukan enum Prisma (tidak didukung provider SQLite).
2. **DB-level enforcement minimal & berdasar:** CHECK `LicenseTier.code IN (3 tier)` — closed set
   tier adalah keputusan owner yang SUDAH ditetapkan (MC §2.1); partial unique index
   `License(workspaceId) WHERE status='ACTIVE'` — aturan kanonik ENTITLEMENT_MODEL §2 (preseden
   live-membership Phase 4). Status lain (PROPOSED) tidak dikunci DB.
3. **Seed referensi di dalam migration** (3 tier, 4 extension type, 10 capability, 24 rule, 1 kuota
   miniRider=5 kru, `ownerCountedInQuota` NULL) — atomik, aditif, hanya nilai bersumber dokumen owner.
4. **Tidak dimodelkan di 5-B:** license key (tanpa dasar kontrak di ENTITLEMENT_MODEL — item
   ratifikasi owner bila dikehendaki), EntitlementGrant/Seat (runtime 5-C), mekanika
   transisi/issuance (5-D; OD-108), harga (OD-06).

## Alternatif yang ditolak

- **Enum Prisma untuk kode** — tidak didukung SQLite; melanggar pola vocabulary Phase 4.
- **CHECK DB untuk seluruh status lisensi/instance** — status masih PROPOSED; mengunci data pada
  keputusan yang belum diratifikasi owner (melanggar red line).
- **Unique(workspaceId) penuh pada License** — memaksa penghapusan histori; melanggar append-only
  (REQ-099; DMC §2.3).
- **Model/grant seat + owner-count default** — mengarang jawaban OD-05.
- **`db:push`** — melanggar REQ-029/OD-01; migration terversionisasi wajib.

## Konsekuensi

- Positif: fondasi data licensing siap untuk engine 5-C tanpa rebuild; invariant kanonik dijamin
  DB dan teruji dari domain layer (32 test baru); migration aman di atas data Phase 4 (terbukti).
- Negatif/risiko: status vocabulary menunggu ratifikasi; partial index/CHECK per direview ulang
  untuk engine produksi (ADR-006); tanpa enforcement runtime sampai 5-C.

## Bukti

`PHASE_5_REPORT.md` (semua gate exit 0; test 145/145); `PHASE_5_TRACEABILITY.md`;
`PHASE_5_ACCEPTANCE.md` (18/18).
