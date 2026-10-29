# HANDOFF — epicRider

**Diperbarui:** 2026-10-30 (governance closure — PR #1 Merged ke `main` (`a1af59d8e00d3a0d8e28b25f1a7f05961182a6a0`), CI post-merge `main` lulus (run #5 / 40928261468), audit closure 16/16 PASS; status Phase 4 → **DONE** — `PHASE_4_GOVERNANCE_CLOSURE.md`; update 2026-10-29: kandidat R2 siap; update 2026-10-28: implementasi selesai di worktree terisolasi) · **Tujuan:** konteks minimum agar fase berikutnya bisa berjalan tanpa kehilangan informasi. File ini wajib diperbarui di akhir setiap fase. · **Tujuan:** konteks minimum agar fase berikutnya bisa berjalan tanpa kehilangan informasi. File ini wajib diperbarui di akhir setiap fase.

---

## 1. Status fase (berbasis bukti — sumber tunggal: `ROADMAP.md`)

| Fase | Status | Bukti primer |
|---|---|---|
| 0 | DONE | `PHASE_0_ACCEPTANCE.md` (9/9), commit `03293b6` |
| 1 | DONE — BASELINE | `PHASE_1_REPORT.md`, commit `938932f`; REQ-001..REQ-100 (+REQ-101, 2026-10-28) |
| 2 | **PARTIAL — arsitektur lengkap & direkonsiliasi; klaim "DONE" lama = klaim historis** (Obsolete Register 2026-10-28; bukti build/CI runner sah + ratifikasi ADR PROPOSED belum tersedia) | `PHASE_2_ACCEPTANCE.md` (A–G + blok re-assessment + nota koreksi status 2026-10-28); `PHASE_2_CONSISTENCY_REMEDIATION_REPORT.md`; commit `70005a7` |
| 3 | **PARTIAL — kontrol diremediasi 2026-10-28; evidence build/CI belum terpenuhi** (remediasi audit Phase 3 F-01..F-08 dieksekusi — `PHASE_3_REMEDIATION_REPORT.md`; lint/typecheck/test exit 0, build NOT RUN di working copy utama, CI runner NOT TESTED) | `PHASE_3_ACCEPTANCE.md` (re-assessed); `PHASE_3_REPORT.md`; `audit/phase3-remediation/`; commit `dca3630` |
| 4 | **DONE — closed 2026-10-30** (implementasi R2 dipromosikan owner via **PR #1 Merged**; CI post-merge `main` lulus; audit closure 16/16 kriteria mandatory PASS dengan limitations tercatat; status sebelumnya: IN PROGRESS 2026-10-28/29) | Merge commit `a1af59d8e00d3a0d8e28b25f1a7f05961182a6a0` (PR #1 "Phase 4 R2 — Controlled Promotion"; parents `b5defc22` + `f29f152`; diverifikasi Git 2026-10-30); CI post-merge run #5 <https://github.com/rpplumbantobing-hub/epicRider/actions/runs/40928261468> `Success` (job `lint, typecheck, test, build`); bukti lokal R2: 113/113 test (25 regresi + 88 Phase 4 termasuk 12 HTTP routing), lint/typecheck/build exit 0; provenance R2 `e12b9dbc…cf97fe` (637.394 byte; 80/17/0; 97/97 hash manifest); `PHASE_4_REPORT.md` (+§10 closure addendum); `PHASE_4_ACCEPTANCE.md` (PASS WITH LIMITATIONS + §E closure); `PHASE_4_GOVERNANCE_CLOSURE.md`; 11 screenshot `audit/evidence/phase4/` |

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
- CI remote: ~~belum pernah berjalan di remote~~ **KOREKSI 2026-10-30:** kini `VERIFIED` — workflow CI tereksekusi pada runner sah berulang kali (run #1 gate `2b2141c`; run #5 post-merge `a1af59d` = `Success`, <https://github.com/rpplumbantobing-hub/epicRider/actions/runs/40928261468>; badge `main` = passing). Pernyataan lama (tidak dihapus, konteks 2026-10-28): workflow dibuat tetapi belum pernah berjalan di remote karena sandbox tanpa git remote.
- Build produksi: script tersedia; eksekusi build di sandbox ini dilarang oleh platform (melindungi dev server) — status build di lingkungan ini `NOT RUN` (bukan gagal); typecheck `tsc --noEmit` dipakai sebagai evidence kompilasi. **KOREKSI 2026-10-30: build+CI kini TERBUKTI pada runner sah** (CI run #5 pada merge `a1af59d`: install→lint→typecheck→test→build semua `Success`). **Konsekuensi status: bukti yang dulu menahan Phase 3 kini tersedia; penilaian ulang status Phase 3 = tindakan governance terpisah atas keputusan owner (Phase 3 tetap `PARTIAL` sampai dinilai ulang secara tercatat — tidak diubah oleh closure Phase 4).**
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

- Google OIDC round-trip real-provider = **NOT TESTED** (tanpa kredensial nyata; hanya konfigurasi/kebijakan + test terkontrol).
- Integrasi vendor WhatsApp = **BLOCKED (OD-03)** — hanya abstraksi + test double; produksi 503 gagal-aman.
- Runtime recovery lintas metode (REQ-047) = **NOT ASSESSED** (menunggu kanal kedua aktif).
- Entitlement/lisensi runtime (REQ-024 penuh), event runtime (REQ-050 penuh), ServiceOffer/RecruitmentOpening, commerce, IMS = fase berikutnya — TIDAK diimplementasikan Phase 4.
- Build produksi = **NOT RUN** di sandbox (larangan platform) ~~; remote CI Phase 4 = PENDING~~ — **KOREKSI 2026-10-30: remote CI post-merge = `VERIFIED SUCCESS`** (run #5 / 40928261468 pada `a1af59d`, termasuk `bun run build` pada runner sah).
- Rate limiter = in-memory single-instance (keterbatasan deployment tercatat F-4.1).
- Pentest formal, audit aksesibilitas formal, klaim ISO/compliance/legal apa pun = tidak ada.
- Screenshot = bukti visual, BUKAN bukti logika bisnis; logika dibuktikan test + verifikasi runtime tercatat.

## 9. Next actions (tanpa otomatis memulai fase berikutnya)

1. ~~**Owner: integrasi paket transfer Phase 4**~~ **CLOSED 2026-10-30** — kandidat R2 terintegrasi penuh: branch kandidat dipush, PR #1 "Phase 4 R2 — Controlled Promotion" di-merge (merge commit `a1af59d8e00d3a0d8e28b25f1a7f05961182a6a0`), CI post-merge `main` `Success` (run #5 / 40928261468). Status Phase 4 = **DONE** (audit closure 16/16 — `PHASE_4_GOVERNANCE_CLOSURE.md`).
2. **Owner: merge governance closure documentation** — branch kandidat `integration/phase4-governance-closure-20261030` (documentation-only: ROADMAP/PHASE_STATUS/PHASE_4_ACCEPTANCE/PHASE_4_REPORT/HANDOFF diperbarui + `PHASE_4_GOVERNANCE_CLOSURE.md` baru; parent = `main` @ `a1af59d`; tanpa perubahan source). Alur: import bundle → push → PR ke `main` → CI candidate `Success` → merge `Create a merge commit` → verifikasi CI `main` post-merge. Closure remote selesai HANYA setelah langkah ini terbukti.
3. Owner: kredensial Google OIDC (env `GOOGLE_CLIENT_ID/SECRET` + `NEXTAUTH_SECRET` produksi) untuk mengaktifkan + menguji round-trip nyata (saat ini NOT TESTED, jujur).
4. Owner: keputusan OD terbuka yang menutup sisa sub-scope — OD-03 (vendor WhatsApp), OD-115 (parameter sesi final), OD-122 (preset role final), OD-01 (DB produksi), OD-05/OD-06/OD-108 (Phase 5), ratifikasi ADR PROPOSED Phase 2 (+ADR-022 welcome); opsional: penilaian ulang status Phase 3 (bukti build+CI pada runner sah kini tersedia via merge `a1af59d`).
5. Otomatisasi lanjutan (opsional, fase sesuai scope): limiter terdistribusi (F-4.1), monitoring next-auth v4 vs Next 16 (F-4.2).
