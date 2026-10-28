# PHASE 2 REPORT — epicRider

**Tanggal:** 2026-10-27 · **Dibuat oleh:** Z.ai Code (orchestrator + 6 subagent workstream) ·
**Basis:** prompt owner `upload/epicRider_phase2_control_replacement.zip` (baseline kontrol
rekonsiliasi + `epicRider_Phase_2_Prompt_zai.md`) · **Sifat fase:** documentation/architecture-only —
tanpa kode produk, tanpa perubahan schema/dependency/config.

---

## 1. Executive summary

- **Scope:** System & domain architecture, bounded contexts, domain model, logical data model,
  threat model, authorization model, entitlement model, client-neutral API boundary architecture,
  ADR register (12 ADR baru + 6 historis dipertahankan), dependency matrix, traceability
  REQ-001..100, legal/regulatory uncertainty register (OD-09), acceptance evidence.
- **Status:** **DONE — sebagai baseline arsitektur** (lihat §14; kualifikasi jujur tercatat).
- **Evidence location:** deliverables di root + `adr/` (inventaris §4–§8 di bawah);
  catatan kerja per task di `worklog.md` (Task ID 2-0..2-h); validasi §11–§13;
  riwayat penggantian baseline di `audit/superseded/phase1-era-control/`.

## 2. Inputs reviewed

**Baseline kontrol rekonsiliasi (owner, 2026-10-27):** `MASTER_CONTROL.md`, `ARCHITECTURE.md`,
`DECISIONS.md`, `ROADMAP.md`, `LICENSE_MATRIX.md`, `SECURITY.md`, `TESTING.md`,
`CONTROL_CONSISTENCY_MATRIX.md`, `PHASE_2_DEPENDENCY_MATRIX.md`, `PHASE_2_ACCEPTANCE.md`,
`PHASE_2_TRACEABILITY.md`, `PHASE_2_REPORT_TEMPLATE.md` + prompt
`epicRider_Phase_2_Prompt_zai.md`.

**Artefak Phase 1 (dipertahankan, tidak diubah substansinya):** `REQUIREMENTS.md`
(REQ-001..100), `OPEN_DECISIONS.md`, `TRACEABILITY_MATRIX.md`, `USE_CASES.md` (55 UC),
`PERSONAS_AND_JOURNEYS.md`, `PROCESS_MAP.md`, `DOCUMENT_EVIDENCE_MODEL.md`,
`PRODUCT_SCOPE.md`, `STANDARD_REGISTER.md`, `NON_FUNCTIONAL_REQUIREMENTS.md`,
`RISK_REGISTER.md`, `UX_REQUIREMENTS.md`, `UX_UI_STANDARD.md`, `PHASE_1_REPORT.md`,
`ISO_IMS_BLUEPRINT.md`.

**Riwayat Phase 0 / repo:** `PHASE_0_*` reports, `audit/superseded/phase1-era-control/DECISIONS.md`
(ADR-000..005 historis), git history (`483950c` → `03293b6` → `938932f`).

**Koreksi baseline yang dijahit:** taksonomi final **3 license tier** (miniRider/maxRider/ISOrider);
hiRider = portal/capability rekrutmen, BUKAN license; Public Store = developer commerce dengan
akses **basic miniRider**; Developer Equipment Store = miniRider-only; dependensi OD-01/02/03/05/06/09/116/160
di-scope pada sub-level (non-blocking untuk arsitektur); typo CRUP→CRUD.

## 3. Architecture decisions

Register lengkap: `ADR_REGISTER.md` (125 baris) + 12 file individual `adr/ADR-006..017` (863 baris total).
Setiap ADR memuat 8 field wajib (Context/Problem/Options/Decision/Consequences/Status/Evidence/Dependencies).

| ADR | Topik | Status | Dasar |
|---|---|---|---|
| ADR-000..005 | Historis Phase 0/1 (dipertahankan, tidak dibuat ulang file-nya) | ACCEPTED (historis) | `audit/superseded/phase1-era-control/DECISIONS.md` + git |
| ADR-006 | Production database | **OPEN** (OD-01) | NOT DECIDED — model logis vendor-neutral berjalan |
| ADR-007 | Mobile/client strategy | **OPEN** (OD-02) | Evaluasi PWA/native/cross-platform/wrapper, tanpa pemaksaan pilihan |
| ADR-008 | Identity & auth abstraction | PROPOSED | REQ-021/022/047/048; SECURITY.md OAuth/OIDC validation |
| ADR-009 | WhatsApp OTP provider abstraction | PROPOSED (vendor OPEN, OD-03) | REQ-021; interface pluggable, tanpa nama vendor |
| ADR-010 | Authorization model | PROPOSED | `AUTHORIZATION_MODEL.md`; REQ-023..026 |
| ADR-011 | Entitlement model | PROPOSED (taksonomi owner-baseline) | `ENTITLEMENT_MODEL.md`; 3 tier; OD-05/06 sub-scope |
| ADR-012 | hiRider domain boundary | **ACCEPTED** | Lampiran baseline owner 2026-10-27 (Master Control §1/§2) |
| ADR-013 | Public Store boundary | **ACCEPTED** | Lampiran baseline owner (akses basic miniRider) |
| ADR-014 | Extension model (struktur) | **ACCEPTED** | Lampiran baseline owner (LICENSE_MATRIX §5); komersial = OD-06 |
| ADR-015 | Audit & record versioning | PROPOSED | REQ-027/080/083; retensi = OD-138/164 |
| ADR-016 | API versioning (/api/v1, additive) | PROPOSED | REQ-097; arah kanonik konsisten `API_ARCHITECTURE.md` D-1 |
| ADR-017 | Concurrency & idempotency | PROPOSED | If-Match/expectedVersion→409 + Idempotency-Key; REQ-060; D-2/D-3 |

13 kandidat ADR tambahan tercatat di register §4 **tanpa ID rekaan** (menunggu registrasi).
ID berikutnya yang bebas: **ADR-018**.

## 4. Domain model

- **Bounded contexts: 17/17** terdokumentasi (Identity, Workspace/Tenant, Membership & Roles,
  Event & Assignment, Entitlement & License, Extension, hiRider Recruitment, Asset, Technical Rider,
  Media Kit, Communication/Notification, Developer Commerce/Store, Document/Evidence, Audit,
  Finance/Commercial, IMS, Integration/Sync) — `DATA_MODEL_CONCEPT.md` §3 (111 entity catalog),
  `ARCHITECTURE.md` §3 (owner baseline).
- **Invariant wajib ditegakkan model** (§4): User != Membership != Role != Event Assignment;
  Developer Role & Auditor Access terpisah; Application != Membership; Application != Event
  Assignment; Acceptance != Automatic Workspace Access; hiRider bukan nilai `license_tier`;
  License != Capability != Extension; Public Store vs Developer Equipment Store = dua domain toko terpisah.
- **hiRider domain** (§5): User/Profile, Skill, Portfolio, Recruitment Opening, Application,
  Application Status History, Shortlist, Recruitment Decision, Workspace Membership, Event Assignment;
  lifecycle PROPOSED (Opening DRAFT→OPEN→PAUSED→CLOSED; Application
  SUBMITTED→REVIEWING→SHORTLISTED→ACCEPTED/REJECTED/WITHDRAWN) — menunggu ratifikasi owner (ADR-012 scope note).
- **State machine: 13** (Membership REQ-049, License REQ-098 [param OD-108 OPEN], Event PROPOSED,
  Asset REQ-045, Document REQ-080, Evidence lock REQ-083, Extension, Opening, Application,
  Invitation, Equipment listing REQ-055, Invoice PROPOSED/OD-135, Improvement action REQ-077).

## 5. Data model

- `DATA_MODEL_CONCEPT.md` — 828 baris, **logis/vendor-neutral** (OD-01 OPEN; tidak ada vendor dikunci).
- Prinsip lintas-konteks (§2): identifier kuat (UUIDv7 PROPOSED), atribusi aktor+waktu,
  soft-delete terbatas, optimistic concurrency, record approved immutable + amendment/version,
  tenant ownership eksplisit, migrasi terkontrol (REQ-029), i18n-ready, tanpa DB paralel per tier (REQ-002).
- **111 entity** dalam 17 konteks; peta relasi lintas-konteks (ASCII) §7; seat/quota (§8) dengan
  parameter owner-counting **OPEN (OD-05)**; access pattern & strategi index logis (§9);
  prinsip migrasi & integritas (§10) termasuk perilaku downgrade (OD-108 OPEN — tanpa kehilangan data diam-diam).
- Open questions §11: 35 baris → 39 OD unik (semua terverifikasi ada di `OPEN_DECISIONS.md`) + 6 kandidat tanpa ID.

## 6. Security/threat model

- `THREAT_MODEL.md` — 654 baris, **PROPOSED**, kualitatif saja (tanpa skor kuantitatif; metodologi menunggu approval owner).
- Trust boundary **TB-1..TB-8** (+diagram), aset **A-01..A-11**, aktor **AC-01..AC-12**.
- **TC-01..TC-24** (24 kategori wajib prompt §11, lengkap 10 field per threat; TC-24 IDOR/enumeration
  sebagai supplementary) + matriks kontrol §7; seluruh kolom test/evidence = **PROPOSED — NOT TESTED**.
- Residual menonjol: **TC-10** (fake/abusive recruitment) & **TC-23** (dependency/supply-chain)
  = *Unacceptable-proposed-for-treatment* — TC-10 butuh REQ khusus (kandidat; tidak ada REQ dikarang),
  TC-23 butuh dependency scanning/SAST sebelum deployment produksi pertama (RSK-115/118);
  22 kategori *Needs monitoring* (termasuk TC-06 tenant isolation, TC-08 entitlement bypass).
- Cross-reference: 56 REQ + 34 OD + 16 RSK diverifikasi ada (skrip).

## 7. Authorization/entitlement

- `AUTHORIZATION_MODEL.md` (502 baris): rantai evaluasi kanonik
  Actor+Tenant+Object+Action+Event Context+Tier Entitlement+Extension+Role/Permission+Object State;
  policy layer server-side; **deny-by-default**; **144 permission vocabulary** (verb-noun, 17 konteks);
  **22 reason codes** (1 ALLOW + 21 DENY_*); model role (workspace + platform developer + auditor
  read-only/scoped/time-bound); tenant isolation (CRUD lintas-tenant ditolak); aturan state-dependent
  (lisensi kadaluarsa/downgrade, evidence locked, dokumen superseded); **34 enforcement point**
  (capability → titik enforcement → audit event → REQ).
- `ENTITLEMENT_MODEL.md` (221 baris): taksonomi LicenseTier (3 nilai SAJA) / License / Entitlement /
  Capability / Extension; formula Effective Access kanonik; lifecycle lisensi (REQ-098, durasi = OD-108)
  & extension (LICENSE_MATRIX §5); seat & kuota (REQ-009, owner-counting = OD-05 OPEN);
  arsitektur issuance (Product/Catalog/Order abstraction — tanpa harga/pajak/gateway, OD-06);
  downgrade restrict-vs-archive-vs-delete (rekomendasi PROPOSED: restrict + data utuh, OD-108);
  snapshot effective-access untuk auditabilitas.
- `SECURITY.md` (owner baseline) target controls seluruhnya ter-cover oleh ketiga model + threat model.

## 8. API/client architecture

- `API_ARCHITECTURE.md` — 453 baris, **PROPOSED**, client-neutral; BUKAN katalog endpoint produksi
  (aturan prompt §12 dihormati; 9 contoh EX-1..EX-9 ditandai ILLUSTRATIVE).
- **17 resource area** diklasifikasi 4 scope (platform / workspace / user / developer-portal);
  tenant context selalu dari path, bukan header yang dikendalikan klien.
- Arah kanonik D-1..D-6 (konsisten dengan ADR-016/017 — diverifikasi §11): URL-path major versioning
  `/api/v1`; `Idempotency-Key` untuk mutasi berefek; optimistic concurrency version-token + If-Match → 409;
  cursor pagination; error model RFC 9457 + `code`/`traceId`; path-scoped workspace.
- CQRS-lite (tanpa komitmen event-sourcing); audit di setiap mutasi (append-only); validasi server-side;
  offline/sync non-precluded (idempotency + version + permission re-check saat sync; TC-20; OD-07 OPEN);
  rate limiting PROPOSED (REQ-054; OD-139). Open questions: 36 OD + 10 kandidat tanpa ID.

## 9. Dependencies

`PHASE_2_DEPENDENCY_MATRIX.md` (owner-provided) adalah kanonik; implementasinya terverifikasi:

| ID | Blokir (sub-scope saja) | Tidak memblokir | Realisasi Phase 2 |
|---|---|---|---|
| OD-01 | finalisasi DB fisik/migrasi produksi | model logis/arsitektur | `DATA_MODEL_CONCEPT` vendor-neutral; `ADR-006` OPEN |
| OD-02 | strategi client final (Phase 23) | arsitektur domain/API | `ADR-007` OPEN; API client-neutral |
| OD-03 | integrasi spesifik vendor | abstraksi auth/architecture | `ADR-009` PROPOSED, vendor-agnostic |
| OD-05 | final seat counting/quota/billing | pemodelan seat/member/entitlement | `ENTITLEMENT_MODEL` §6, param OPEN |
| OD-06 | charging/harga final/gateway/launch | katalog/entitlement/lifecycle komersial | `ENTITLEMENT_MODEL` §8 tanpa nilai rekaan |
| OD-09 | klaim legal/compliance sign-off | arsitektur generik | `LEGAL_REGULATORY_REGISTER.md` (LR-001..018, uncertainty-only) |
| OD-116 | — (bukan prasyarat) | seluruh Phase 2 | **tertutup**: `DATA_MODEL_CONCEPT.md` adalah output Phase 2 |
| OD-160 | klaim spesifik ISO/mapping final | arsitektur non-IMS | IMS provisional; STANDARD_REGISTER tetap NOT VERIFIED |

Tidak ada bagian Phase 2 yang BLOCKED oleh OD. Item butuh-perhatian owner: ratifikasi 7 ADR PROPOSED,
keputusan OD-01/OD-02 (menutup ADR-006/007), treatment TC-10 (butuh REQ khusus — kandidat).

## 10. Traceability

`PHASE_2_TRACEABILITY.md` (334 baris; skeleton owner dipertahankan verbatim — diverifikasi byte-identik):

- **§A: 100/100 REQ terpetakan** (verifikasi skrip: 100 baris `^| REQ-nnn |`, tanpa duplikat, tanpa hilang).
  Rantai per REQ: Phase 1 persona/UC → bounded context → data concept → API boundary → security control → test/evidence (PROPOSED — NOT TESTED).
- **§B coverage:** 81 fully traced; 6 partially (REQ-001 cross-cutting; REQ-029 kini ber-anchor arsitektur —
  gap Phase 1 tertutup di level arsitektur; REQ-037/038 → OD-07; REQ-061 → OD-102; REQ-100 → OD-06);
  13 UX/NFR-driven dengan anchor terdekat. 17/17 konteks punya ≥1 REQ (Integration/Sync paling tipis, kondisional OD).
- **§C gaps:** gap Phase 1 dikonfirmasi (report/block abuse hiRider tanpa REQ; landing REQ-015 belum UC penuh) — dicatat, tidak dipatch diam-diam.
- **§D:** rantai utuh; tidak ada REQ dinomori ulang; sejarah 46-seed → 100 dipertahankan.
- OD IDs pada seluruh dokumen Phase 2 diverifikasi terdefinisi (comm = kosong); ADR-006..017 semuanya tertelusur ke klaster REQ.

## 11. Validation (commands/checks actually run)

Dijalankan nyata oleh orchestrator & subagent (output lengkap di `worklog.md` Task 2-0..2-h):

1. `unzip -l` + `unzip` lampiran owner; pembacaan penuh 13 file sebelum bertindak.
2. Pre-scan kontradiksi `rg` per-file root `*.md` (sebelum penggantian) → 1 temuan aktif (CRUP di TESTING lama).
3. `git log` / `git status` → baseline Phase 1 ter-commit `938932f`; working tree bersih sebelum Phase 2.
4. Pengarsipan 7 file lama → `audit/superseded/phase1-era-control/` + README SUPERSEDED; instalasi 12 file baseline.
5. Subagent self-checks (per worklog): grep istilah terlarang per deliverable = 0 hit; verifikasi skrip jumlah
   REQ/OD/TC/ADR/LR refs terhadap register sumber = semua ada; row-count PHASE_2_TRACEABILITY = 100/100;
   diff skeleton owner vs file terisi = konten owner byte-identik.
6. Orchestrator final validation (Task 2-h):
   - Contradiction scan `rg` (pola prompt §18 + CONTROL_CONSISTENCY_MATRIX) pada 29 root `*.md` + 12 `adr/*.md`
     → **0 kontradiksi aktif** (semua hit = negasi kanonik / daftar pola itu sendiri / riwayat bertanda superseded).
   - Cross-reference existence: 24 file `.md` dirujuk + 12 file `adr/` → **semua ada**.
   - Konsistensi ADR-016/017 ↔ `API_ARCHITECTURE.md` D-1/D-2/D-3 → **cocok** (verifikasi teks Decision vs tabel D).
   - `rg -c '^\| REQ-[0-9]{3} ' REQUIREMENTS.md` = **100** (ID utuh, tidak ada renumber).
   - `comm -23` OD-used (56 unik di dokumen Phase 2) vs OD-defined (`OPEN_DECISIONS.md`) = **kosong** (tidak ada OD rekaan).
7. Bahasa deliverables baru: Inggris (mengikuti konvensi file baseline owner); worklog & laporan pengguna: Indonesia.

## 12. Not run / blocked

- **NOT RUN (by design — Phase 2 documentation-only):** semua pengujian kode; `bun run lint`/build
  (repo tidak berubah — CURRENT STATE identik dengan baseline `938932f`); security testing/pentest;
  pengujian aksesibilitas/usability; uji beban NFR; validasi persona partisipan nyata.
- **NOT TESTED:** seluruh ide test/evidence di THREAT_MODEL & TRACEABILITY (PROPOSED).
- **BLOCKED (bukan oleh Phase 2):** verifikasi status/edisi standar ISO tetap `BLOCKED` akses katalog
  resmi (OD-160; STANDARD_REGISTER) — hanya membatasi klaim ISO-specific, bukan arsitektur generik.
- **OPEN:** OD-01 (DB fisik), OD-02 (strategi client) → ADR-006/007 tetap OPEN; 7 ADR PROPOSED menunggu
  ratifikasi owner; parameter komersial (OD-06), seat counting (OD-05), grace/downgrade (OD-108),
  retensi (OD-104/138/164), visibilitas hiRider (OD-109) — semua dibiarkan tanpa nilai rekaan.

## 13. Contradiction scan

Hasil (pola wajib: `hiRider license`, `hiRider tier`, `hiRider fourth`, `Public Store maxRider`,
`Public Store ISOrider`, `OD-02 blocks Phase 2`, `OD-03 blocks Phase 4`, `OD-05 blocks Phase 5`,
`OD-06 blocks entire Phase`, `OD-116 prerequisite Phase 2`, `CRUP` — ditambah varian Indonesia):

- **0 kontradiksi aktif** pada 41 file yang discan (29 root `*.md` + 12 `adr/*.md`).
- Hit yang ada (semuanya benign): (a) daftar pola pencarian itu sendiri di
  `CONTROL_CONSISTENCY_MATRIX.md`/`PHASE_2_REPORT_TEMPLATE.md`; (b) **negasi** aturan kanonik
  ("hiRider bukan license/bukan tier keempat" — MASTER_CONTROL, DATA_MODEL, ADR-012, dst.);
  (c) riwayat bertanda — koreksi typo CRUP di `TESTING.md` ("Previous … is corrected to"),
  addendum SUPERSEDED di `PHASE_1_REPORT.md`/`OPEN_DECISIONS.md` §4, arsip `audit/superseded/`.
- Konsistensi silang tambahan: ADR↔API (D-1..D-3) cocok; semua file rujukan ada; tidak ada definisi
  kanonik ganda (definisi taksonomi tetap tunggal di MASTER_CONTROL/LICENSE_MATRIX owner).

## 14. Exit assessment

**`DONE` — sebagai baseline arsitektur Phase 2**, memenuhi `PHASE_2_ACCEPTANCE.md` A–G (7/7 kelompok
kriteria, bukti per item di file tersebut). Kualifikasi jujur:

1. Seluruh output = **PROPOSED/target-state** kecuali yang berbukti ACCEPTED dari baseline owner
   (ADR-012/013/014 + taksonomi). Tidak ada keputusan owner yang dikarang; OD-01/OD-02 jujur OPEN.
2. Ketiga hal berikut adalah tindak lanjut owner (non-blocking untuk status DONE, membatasi sub-scope miliknya):
   ratifikasi 7 ADR PROPOSED; keputusan OD-01/OD-02; treatment TC-10 (kandidat REQ baru — approval required).
3. Tidak ada kode/schema/config diubah — repository CURRENT STATE identik dengan commit `938932f`
   (hanya dokumentasi/arsitektur + `audit/superseded/` + `adr/` yang ditambahkan).

Phase 3 (repository foundations, design system, i18n & CI/testing foundation) dapat dimulai;
arsitektur ini adalah kontrak rujukannya.

---

## 15. ADDENDUM — Konsistensi remediasi (Phase 3 Gate A, 2026-10-28)

Audit eksternal `epicRider_phase2_consistency_audit.md` (REWORK REQUIRED) menemukan bahwa §13 di atas
("0 active contradictions") **tidak cukup didukung**: konflik status fase (F-02), batas commerce
(F-03), scope penawaran jasa hiRider (F-04), dan referensi `MC §N` ambigu (F-06) lolos dari scan §13.
Full disposition per temuan: `PHASE_2_CONSISTENCY_REMEDIATION_REPORT.md`. Ringkasan:

- **F-01** → `CONTROL_BASELINE_REGISTER.md` (satu baseline kanonik; paket lengkap NOT FOUND di workspace ini).
- **F-02** → `MASTER_CONTROL.md` §0 tidak lagi menyimpan status fase dinamis; `ROADMAP.md` = sumber tunggal status.
- **F-03** → **ADR-018**: tiga surface commerce terpisah (License & Extension Shop / Public Store / Developer Equipment Store); ADR-013 amended in part; 6 dokumen terkait disinkronkan.
- **F-04** → **OD-185** terdaftar `OPEN — OWNER DECISION` di `OPEN_DECISIONS.md`; ADR-012 menautkannya; invariant utuh.
- **F-05** → acceptance dihitung ulang (`PHASE_2_ACCEPTANCE.md`, blok re-assessment); scan ulang cakupan lebih luas: `audit/phase3-scan/contradiction-scan-2026-10-28.txt` → 0 kontradiksi aktif tersisa (sisa hits = negasi kanonik/daftar istilah/arsip/worklog).
- **F-06** → `CONTROL_REFERENCE_CROSSWALK.md` + nota header di 13 artefak Phase 0/1 + 9 titik referensi salah diperbaiki.
- **F-07** → `HANDOFF.md` dibuat.
- **F-08** → label edisi ISO di repo aktif sudah "kandidat — NOT VERIFIED — BLOCKED"; paket yang memuat label bermasalah tidak ada di workspace ini.

Status Phase 2 setelah remediasi: **DONE — architecture baseline (re-verified 2026-10-28)** — dengan
kualifikasi yang sama seperti di atas, plus OD-185 terbuka menunggu keputusan owner. §13 di atas adalah
rekaman historis scan 2026-10-27 dan **tidak lagi berdiri sendiri** sebagai bukti acceptance.
