# CONTROL REFERENCE CROSSWALK — epicRider

**Dibuat:** 2026-10-28 (Phase 3, Gate A — remediasi temuan audit F-06)
**Tujuan:** memetakan referensi `MC §N` / `Master Control §N` yang ditulis pada era kontrol lama ke section/anchor kanonik aktif, sehingga tidak ada lagi rujukan ambigu lintas versi Master Control.

---

## 1. Versi Master Control yang pernah berlaku

| Versi | Path | Penomoran | Dipakai oleh | Status |
|---|---|---|---|---|
| MC-V0 (lampiran owner Phase 0) | `upload/epicRider_Master_Control.md` | §1–§15 | Prompt Phase 0 | Historis — lampiran owner |
| MC-V1 (adopsi Phase 0, catatan audit ditambah; penomoran sama dengan MC-V0) | `audit/superseded/phase1-era-control/MASTER_CONTROL.md` | §1–§15 | Artefak Phase 0 & Phase 1 | SUPERSEDED — historis |
| MC-V2 (replacement pack owner Phase 2) | root `MASTER_CONTROL.md` sebelum koreksi Phase 3 | §0–§8 | Artefak Phase 2 | Digantikan oleh MC-V3 (koreksi F-02/F-03 Phase 3); isi aturan lain tetap |
| MC-V3 (aktif, koreksi Phase 3) | root `MASTER_CONTROL.md` | §0–§8 | **Kanonik aktif** | AKTIF |

Bukti: diff MC-V0 vs MC-V1 (2026-10-28) = hanya catatan status/penunjuk; **penomoran & nama section identik §1–§15**. Jadi referensi `MC §N` pada artefak Phase 0/1 valid dibaca terhadap MC-V0/MC-V1 secara bergantian.

## 2. Crosswalk penomoran lama (MC-V0/V1 §1–§15) → anchor kanonik aktif (MC-V3 + dokumen kanonik)

| MC lama | Isi | Anchor kanonik sekarang |
|---|---|---|
| §1 Misi dan visi | Misi produk | `PRODUCT_SCOPE.md` (Phase 1) + MC-V3 §1 (taxonomy) |
| §2 Produk dan batas lisensi | miniRider/maxRider/ISOrider/hiRider, aturan store era lama | MC-V3 §1 (Product taxonomy — incl. koreksi tiga commerce surface, ADR-018); batas 5 kru → REQ-009 |
| §3 Extensions dan kanal akses | Extension, web-first, API reusable | MC-V3 §2 (Extension, effective access); MC-V3 §4 ("web adalah first-class channel"); `API_ARCHITECTURE.md` |
| §4 Autentikasi | Auth/OTP/session | `ARCHITECTURE.md` (identity/auth), `SECURITY.md`, `adr/ADR-008`, `adr/ADR-009`; MC-V3 §4 (invariants) |
| §5 Prinsip arsitektur yang tidak boleh dilanggar | Server-side authz/entitlement, tenant isolation, controlled migrations, auditability, i18n sejak awal | MC-V3 §4 (Architecture invariants — semua prinsip ini ada di sini) |
| §6 Lisensi dan Store | Lisensi + store era lama (2 store) | MC-V3 §1 (tiga commerce surface, ADR-018); `LICENSE_MATRIX.md`; `ENTITLEMENT_MODEL.md`; `adr/ADR-018` |
| §7 UI/UX sebagai quality gate lintas fase | Standar UI/UX | `UX_UI_STANDARD.md` (kanonik) + MC-V3 §7 (Quality) |
| §8 Mobile, scanner dan offline | Perangkat & offline | `adr/ADR-007` + OD-02/OD-07; `UX_UI_STANDARD.md` §2.2 |
| §9 IMS, standar dan keberlanjutan | Daftar kandidat standar ISO | `STANDARD_REGISTER.md` + `ISO_IMS_BLUEPRINT.md` (kanonik; MC-V3 tidak memuat daftar standar). Aturan "jangan mengarang/klaim" → MC-V3 §7 |
| §10 Controlled Document & Evidence Library | Dokumen/evidence | `DOCUMENT_EVIDENCE_MODEL.md` (kanonik) |
| §11 maxRider operational maturity | Kematangan operasional | `PRODUCT_SCOPE.md`, `PROCESS_MAP.md` |
| §12 Roadmap kendali | Roadmap + aturan perubahan | `ROADMAP.md` (sumber tunggal status fase) |
| §13 Control files wajib | Daftar kontrol | `CONTROL_BASELINE_REGISTER.md` |
| §14 Anti-halusinasi dan integritas pelaporan | Larangan mengarang | MC-V3 §7 (Quality: "Tidak boleh mengarang vendor, price, tax, legal applicability, certification, test result, implementation status atau owner decision") |
| §15 Phase gate wajib | Gate per fase | MC-V3 §8 (Evidence gate) + status rule di MC-V3 §0 & `ROADMAP.md` |

## 3. Inventaris referensi per file & disposition (scan 2026-10-28)

Metode: `grep -rn "MC §[0-9]\|Master Control §[0-9]\|MASTER_CONTROL\.md §[0-9]"` atas semua `*.md` aktif (exclude `upload/`, `audit/`, `adr/`, `tool-results/`). Jumlah temuan per file tercatat di `worklog.md` Task 3-a. Disposisi:

| Kelompok file | Referensi mengacu ke | Disposisi |
|---|---|---|
| Artefak Phase 0: `PHASE_0_*.md`, `UX_UI_STANDARD.md`, `OPERATIONS.md`, `ISO_IMS_BLUEPRINT.md` | MC-V0/V1 | **HISTORIS-OK via crosswalk ini** — dokumen catatan eksekusi/standar era itu; tidak di-rewrite diam-diam. Setiap `MC §N` dibaca lewat tabel §2 |
| Artefak Phase 1: `REQUIREMENTS.md` (97 ref, termasuk contoh baris REQ-001 "MC §1", REQ-003..REQ-017 "MC §2"), `PRODUCT_SCOPE.md`, `USE_CASES.md`, `PROCESS_MAP.md`, `UX_REQUIREMENTS.md`, `NON_FUNCTIONAL_REQUIREMENTS.md`, `RISK_REGISTER.md`, `DOCUMENT_EVIDENCE_MODEL.md`, `STANDARD_REGISTER.md`, `TRACEABILITY_MATRIX.md`, `PERSONAS_AND_JOURNEYS.md` | MC-V1 | **HISTORIS-OK via crosswalk ini** — requirement/artefak Phase 1 tidak diubah substansinya (aturan prompt Phase 3 §2.1 F-06 & §8). Contoh: `REQUIREMENTS.md` REQ-010 "MC §2, §6" → baca: MC-V1 §2 (produk/store era lama) + §6 (Lisensi dan Store) → kini MC-V3 §1 + ADR-018; REQ-018 "MC §3" → MC-V3 §2 (Extension). **Catatan penting:** referensi "MC §2" di REQ-001..017 adalah *produk & batas lisensi* (MC-V1), BUKAN Entitlement taxonomy (MC-V3 §2) |
| `STANDARD_REGISTER.md`, `ISO_IMS_BLUEPRINT.md` — ref spesifik "MC §9" (daftar standar), "MC §14" (anti-halusinasi) | MC-V1 | **FIXED** — diubah ke anchor kanonik (`STANDARD_REGISTER.md` sendiri / MC-V3 §7) pada header/aturan pakai |
| `PHASE_STATUS.md` — "Master Control §3.6, §15" (2 ref) | campuran (tidak ada §3.6 di MC mana pun; §15 = MC-V1) | **FIXED** — diganti anchor kanonik (MC-V3 §3 taxonomy + §8 gate + `ROADMAP.md` status rule) |
| Artefak Phase 2: `DATA_MODEL_CONCEPT.md`, `ENTITLEMENT_MODEL.md`, `AUTHORIZATION_MODEL.md`, `API_ARCHITECTURE.md`, `ADR_REGISTER.md`, `adr/ADR-006..017`, `LEGAL_REGULATORY_REGISTER.md`, `THREAT_MODEL.md`, `PHASE_2_*.md` | MC-V2 (§0–§8) | Mayoritas **VALID** (ditulis terhadap MC-V2). **FIXED (6 titik):** DMC "(MC §5)" evidence-transaction-context ×2 → `DOCUMENT_EVIDENCE_MODEL.md` (historis MC §10); DMC "(MC §9)" no-certification → MC-V3 §7 + ISO_IMS_BLUEPRINT; DMC "(MC §5)" chain IMS → ISO_IMS_BLUEPRINT §3/PROCESS_MAP; DMC "(MC §6/§7 store issuance)" → ARCHITECTURE §7 + ADR-018; EM "MC §2 baseline 5 kru" → REQ-009 (historis MC §2); AUTHZ "least privilege (MC §6)" → MC-V3 §4 (historis MC §5/§6) |
| `worklog.md`, `PHASE_0_*` catatan log | MC-V0/V1 | **HISTORIS-OK** — log tidak di-rewrite |
| `upload/phase2_extract/*` | MC-V2 | **INPUT PACK** — bukan bagian aktif; tidak diedit |

## 4. Aturan ke depan

1. Dokumen **baru** (Phase 3+) wajib merujuk section MC-V3 dengan nama anchor bila mungkin (mis. "MC §1 Product taxonomy") — bukan angka telanjang.
2. Mengutip MC lama hanya boleh dengan penanda eksplisit "historical MC §N (MC-V1, `audit/superseded/…`)".
3. Jangan mengubah substansi artefak Phase 0/1 secara diam-diam; koreksi substansi hanya via keputusan owner/ADR tercatat.
4. Scan referensi diulang setiap kali MC berganti versi mayor; hasil dicatat di dokumen ini.
