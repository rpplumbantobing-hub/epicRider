# HANDOFF — epicRider

**Diperbarui:** 2026-10-28 (rekonsiliasi pra-Phase 4 Stage A — MC-V4 + `OBSOLETE_AND_SUPERSEDED_REGISTER.md` dipasang; REQ-101 ditambahkan; status Phase 2/3/4 disinkronkan; `PRE_PHASE_4_GATE.md` dibuat & dijalankan) · **Tujuan:** konteks minimum agar fase berikutnya bisa berjalan tanpa kehilangan informasi. File ini wajib diperbarui di akhir setiap fase.

---

## 1. Status fase (berbasis bukti — sumber tunggal: `ROADMAP.md`)

| Fase | Status | Bukti primer |
|---|---|---|
| 0 | DONE | `PHASE_0_ACCEPTANCE.md` (9/9), commit `03293b6` |
| 1 | DONE — BASELINE | `PHASE_1_REPORT.md`, commit `938932f`; REQ-001..REQ-100 (+REQ-101, 2026-10-28) |
| 2 | **PARTIAL — arsitektur lengkap & direkonsiliasi; klaim "DONE" lama = klaim historis** (Obsolete Register 2026-10-28; bukti build/CI runner sah + ratifikasi ADR PROPOSED belum tersedia) | `PHASE_2_ACCEPTANCE.md` (A–G + blok re-assessment + nota koreksi status 2026-10-28); `PHASE_2_CONSISTENCY_REMEDIATION_REPORT.md`; commit `70005a7` |
| 3 | **PARTIAL — kontrol diremediasi 2026-10-28; evidence build/CI belum terpenuhi** (remediasi audit Phase 3 F-01..F-08 dieksekusi — `PHASE_3_REMEDIATION_REPORT.md`; lint/typecheck/test exit 0, build NOT RUN di working copy utama, CI runner NOT TESTED) | `PHASE_3_ACCEPTANCE.md` (re-assessed); `PHASE_3_REPORT.md`; `audit/phase3-remediation/`; commit `dca3630` |
| 4 | **BLOCKED / NOT STARTED — menunggu `PRE_PHASE_4_GATE.md` lulus** | `PRE_PHASE_4_GATE.md` + `PRE_PHASE_4_GATE_REPORT.md` + `PHASE_4_ENTRY_AUDIT.md` (2026-10-28) |

## 2. Control baseline kanonik & urutan otoritas

1. Keputusan owner dalam prompt fase aktif (`upload/epicRider_Phase_4_Gated_Prompt_zai.md`) + lampiran kontrol terbaru: **`MASTER_CONTROL.md` (MC-V4, 2026-10-28)** dan **`OBSOLETE_AND_SUPERSEDED_REGISTER.md`**.
2. Keputusan ACCEPTED (`DECISIONS.md`, `ADR_REGISTER.md`, `adr/`).
3. Kontrol kanonik root — daftar & versi: `CONTROL_BASELINE_REGISTER.md`.
4. REQ-001..REQ-100 + REQ-101 (`REQUIREMENTS.md`) — jangan reset/renumber.
5. Dokumen arsitektur Phase 2 (`DATA_MODEL_CONCEPT.md`, `AUTHORIZATION_MODEL.md`, `ENTITLEMENT_MODEL.md`, `THREAT_MODEL.md`, `API_ARCHITECTURE.md`).
6. Temuan audit (`epicRider_phase2_consistency_audit.md`, `epicRider_phase3_consistency_audit.md`, `epicRider_Phase_4_Entry_Audit.md`) — daftar verifikasi.
7. Kode = bukti current state.
8. Arsip historis (`audit/superseded/…`, `upload/`) — jejak saja.

Referensi `MC §N` lama ditafsirkan lewat `CONTROL_REFERENCE_CROSSWALK.md` (§2a MC-V3→MC-V4; §2b MC-V0/V1→MC-V4). `MASTER_CONTROL.md` tidak menyimpan status fase dinamis.

## 3. Keputusan yang berlaku (ringkas)

- **ACCEPTED (owner-baseline):** ADR-012 (hiRider boundary — **amended nota 2026-10-28: scope termasuk penawaran jasa**), ADR-013 (store boundary — **amended in part oleh ADR-018**), ADR-014 (extension model).
- **ACCEPTED (owner prompt Phase 3):** ADR-018 — tiga commerce surface: **License & Extension Shop** (publik, first-license) / **Public Store** (developer products, gate basic miniRider) / **Developer Equipment Store** (miniRider-only, denial audited).
- **ACCEPTED (owner remediation directive, 2026-10-28):** ADR-021 — penawaran jasa (ServiceOffer) IN-SCOPE hiRider, menutup **OD-185 (CLOSED — DECIDED BY BASELINE)**; REQ-013 diamendemi terkendali; **REQ-101 ditambahkan 2026-10-28 atas persetujuan owner via Obsolete Register §2** (invariant `ServiceOffer != RecruitmentOpening`; inquiry ≠ membership/event assignment; komersial OD-06).
- **ACCEPTED (owner baseline 2026-10-28 / MC-V4):** OD-12 ditutup — Bahasa Indonesia default UI locale + English supported (MC-V4 §4; ADR-020 mekanisme).
- **PROPOSED (menunggu ratifikasi owner):** ADR-008..011, ADR-015..017, ADR-018 (formal ratification).
- **OPEN — OWNER DECISION:** OD-01 (DB produksi — SQLite kini hanya status lokal/sandbox, bukan keputusan produksi), OD-02 (mobile strategy), OD-05, OD-06, OD-09, OD-109, OD-122, OD-115 (param sesi — nilai dev boleh PROPOSED), OD-03 (hanya vendor WhatsApp); daftar lengkap `OPEN_DECISIONS.md`.
- **SUPERSEDED/CLOSED pada rekonsiliasi 2026-10-28:** OD-116 (data model = output Phase 2, dokumen ada), OD-185 (ADR-021), OD-12 (MC-V4 §4 + ADR-020); OD-04 sisi konfigurasi diputuskan ADR-019 (sisa pengetatan lint/TS tetap open spesifik).

## 4. Artefak kontrak teknis untuk fase berikutnya

- Data/arsitektur: `DATA_MODEL_CONCEPT.md` (17 konteks, 111 entitas — entity families store sudah diperbarui ADR-018), `AUTHORIZATION_MODEL.md` (144 permission, deny-by-default), `ENTITLEMENT_MODEL.md`, `API_ARCHITECTURE.md` (client-neutral, scope classes, contoh endpoint), `THREAT_MODEL.md` (TC-01..24, TB-1..8).
- Fondasi Phase 3: design tokens (`src/app/globals.css` + `tailwind.config.ts`), komponen foundation (`src/components/foundation/`), i18n (`src/i18n/`, locale `id` default + `en`, cookie persistence), showcase di route `/`, test conventions (`tests/` + `vitest`), CI (`.github/workflows/ci.yml`), konvensi developer (`README.md`).
- Phase 4 (identity/auth) harus: memakai stack yang sama, i18n untuk semua string UI baru, authorization/entitlement server-side (bukan UI hiding), dan tidak menganggap apapun dari `upload/` sebagai kanonik.

## 5. Gap, risiko, blocker, dependency

- ~~OD-185~~ **CLOSED — DECIDED BY BASELINE** (penawaran jasa in-scope hiRider, ADR-021; REQ-101); desain lifecycle ServiceOffer = pekerjaan Phase 16.
- ~~OD-116~~ **SUPERSEDED 2026-10-28** — `DATA_MODEL_CONCEPT.md` ada; data model = output Phase 2, bukan prasyarat (Obsolete Register §2).
- OD-01/OD-02 — menutup ADR-006/ADR-007 + kelulusan penuh Phase 2; non-blocking untuk fase dokumentasi berikutnya. SQLite = status lokal/sandbox saja (OD-01 tetap OPEN — tidak ada penetapan DB produksi diam-diam).
- Metadata katalog ISO (9001:2026/14001:2026/19011:2026 = published) tercatat per pemeriksaan owner 2026-10-28 (MC-V4 §7; `STANDARD_REGISTER.md` sinkron); verifikasi mandiri oleh verifier dari lingkungan berakses tetap `BLOCKED` (F0-012; OD-160) — tidak ada klaim applicability/conformity.
- TC-10 (recruitment abuse) butuh requirement baru — menunggu approval owner (jangan mengarang REQ ID).
- CI remote: workflow dibuat tetapi **belum pernah berjalan di remote** (repo tidak punya git remote di sandbox) — status `NOT TESTED`, bukan `VERIFIED`.
- Build produksi: script tersedia; eksekusi build di sandbox ini dilarang oleh platform (melindungi dev server) — status build di lingkungan ini `NOT RUN` (bukan gagal); typecheck `tsc --noEmit` dipakai sebagai evidence kompilasi. **Konsekuensi status: Phase 3 = PARTIAL sampai build+CI terbukti di runner owner.**
- Tech debt (F-08): `format:check` exit 1 pada file scaffold lama (bukan gate); eslint ±30 rule off; `tsconfig` `noImplicitAny: false` — rencana pengetatan bertahap tercatat di `PHASE_3_REMEDIATION_REPORT.md` §5.

## 6. Command yang benar-benar dijalankan (ringkas; detail + exit code di `PHASE_3_REPORT.md`)

- `diff -q` root vs `upload/phase2_extract/` (12 file kontrol) — hasil Gate A tercatat di `CONTROL_BASELINE_REGISTER.md` §4 (klaim "9/4" lama dikoreksi); hasil ulang remediasi: **4 identical / 8 differs** — `audit/phase3-remediation/diff-baseline-2026-10-28.txt`.
- Contradiction scan (S1–S9) → `audit/phase3-scan/contradiction-scan-2026-10-28.txt`; **scan ulang remediasi (cakupan diperluas: hiRider services, tiga surface, status fase, .env hygiene) → `audit/phase3-remediation/contradiction-scan-2026-10-28-remediation.txt`.**
- `bun run lint`, `bun run typecheck`, `bun run test` (`vitest run`) — lihat report untuk hasil aktual.
- agent-browser smoke `/` (showcase) — screenshot `audit/evidence/phase3-*.png`.

## 7. Kebersihan rahasia/konfigurasi *(dikoreksi remediasi F-05, 2026-10-28)*

- ~~"`.env` tidak di-commit"~~ **KLAIM LAMA SALAH.** Fakta terkoreksi: `.env` **ter-track sejak commit awal `483950c`**; pada remediasi F-05 (2026-10-28) `.env` dihapus dari Git index (`git rm --cached .env`, file lokal dipertahankan) dan kini **tidak ter-track** + di-ignore `.gitignore`. Isinya 1 baris `DATABASE_URL=file:…` (path SQLite lokal — bukan credential layanan; diverifikasi tanpa mencetak nilai, lihat `audit/phase3-remediation/secret-scan-env-2026-10-28.txt`), sehingga **tidak ada rotasi credential yang diperlukan**; riwayat Git memuat nilai tersebut sejak `483950c` (tercatat; nilai bukan rahasia).
- `.env.example` (placeholder non-rahasia) **ter-track** — pengecualian `!.env.example` ditambahkan ke `.gitignore` (sebelumnya pola `.env*` menelannya file ini sehingga tidak pernah masuk index).
- `db/custom.db` ter-commit di repo (warisan scaffold) — risiko kebersihan tercatat; jangan menaruh data nyata di sana.
- Jangan memasukkan `.env`, `db/custom.db`, atau `upload/` ke dalam arsip/zip/tar yang dikirim ke pihak luar tanpa review. Secret scan working tree dijalankan saat remediasi (tanpa mencetak nilai) — hasil: tidak ada pola secret pada file ter-track (bukti di `audit/phase3-remediation/`).

## 8. Yang TIDAK boleh dianggap sudah diimplementasikan

- Tidak ada fitur bisnis (auth, licensing, event, asset, store, recruitment, IMS) — Phase 3 hanya fondasi + showcase.
- Tidak ada authorization/entitlement enforcement runtime — hanya pola dokumentasi/konsep.
- Tidak ada klaim ISO/compliance/legal apa pun.
- Tidak ada performance/accessibility audit formal — hanya pemeriksaan manual + test dasar yang tercatat.
- Screenshot showcase = bukti visual, BUKAN bukti logika bisnis.

## 9. Next actions (tanpa otomatis memulai fase berikutnya)

1. **Owner/runner (bloker utama):** jalankan workflow CI pada runner sah — push repo ke remote Git (GitHub) dan biarkan `.github/workflows/ci.yml` berjalan (install→lint→typecheck→test→build), ATAU daftarkan runner setara yang mengeksekusi workflow aktual; catat log/exit code/link run. Tanpa ini, `PRE_PHASE_4_GATE.md` item 9 tetap BLOCKED dan Phase 4 tidak boleh dimulai (lihat `PRE_PHASE_4_GATE_REPORT.md`).
2. Owner: ratifikasi ADR PROPOSED (ADR-008..011, ADR-015..017, ADR-018) + putuskan OD-01/OD-02 (menutup kelulusan penuh Phase 2).
3. Owner: review `PHASE_4_ENTRY_AUDIT.md` + `PRE_PHASE_4_GATE_REPORT.md`; setelah CI runner terbukti, ulangi gate → bila PASS, Phase 4 boleh dimulai dengan prompt gated yang sama.
4. Phase 4 hanya dimulai setelah `PRE_PHASE_4_GATE.md` PASS tercatat + instruksi owner eksplisit.
