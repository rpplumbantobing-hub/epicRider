# HANDOFF — epicRider

**Diperbarui:** 2026-10-28 (Phase 3, Gate A + implementasi) · **Tujuan:** konteks minimum agar fase berikutnya bisa berjalan tanpa kehilangan informasi. File ini wajib diperbarui di akhir setiap fase.

---

## 1. Status fase (berbasis bukti — sumber tunggal: `ROADMAP.md`)

| Fase | Status | Bukti primer |
|---|---|---|
| 0 | DONE | `PHASE_0_ACCEPTANCE.md` (9/9), commit `03293b6` |
| 1 | DONE — BASELINE | `PHASE_1_REPORT.md`, commit `938932f` |
| 2 | DONE — architecture baseline (re-verified 2026-10-28 pasca-remediasi konsistensi F-01..F-08) | `PHASE_2_ACCEPTANCE.md` + blok re-assessment; `PHASE_2_CONSISTENCY_REMEDIATION_REPORT.md`; commit `70005a7` |
| 3 | **DONE — repository foundation baseline (2026-10-28)** dengan kualifikasi tercatat | `PHASE_3_ACCEPTANCE.md` (16/16 PASS + kualifikasi); `PHASE_3_REPORT.md`; `PHASE_3_TRACEABILITY.md` |

## 2. Control baseline kanonik & urutan otoritas

1. Keputusan owner dalam prompt fase aktif (`upload/epicRider_Phase_3_Prompt_zai.md`).
2. Keputusan ACCEPTED (`DECISIONS.md`, `ADR_REGISTER.md`, `adr/`).
3. Kontrol kanonik root — daftar & versi: `CONTROL_BASELINE_REGISTER.md`.
4. REQ-001..100 (`REQUIREMENTS.md`) — jangan reset/renumber.
5. Dokumen arsitektur Phase 2 (`DATA_MODEL_CONCEPT.md`, `AUTHORIZATION_MODEL.md`, `ENTITLEMENT_MODEL.md`, `THREAT_MODEL.md`, `API_ARCHITECTURE.md`).
6. Temuan audit (`epicRider_phase2_consistency_audit.md`) — daftar verifikasi.
7. Kode = bukti current state.
8. Arsip historis (`audit/superseded/…`) — jejak saja.

Referensi `MC §N` lama ditafsirkan lewat `CONTROL_REFERENCE_CROSSWALK.md`. `MASTER_CONTROL.md` tidak lagi menyimpan status fase dinamis.

## 3. Keputusan yang berlaku (ringkas)

- **ACCEPTED (owner-baseline):** ADR-012 (hiRider boundary), ADR-013 (store boundary — **amended in part oleh ADR-018**), ADR-014 (extension model).
- **ACCEPTED (owner prompt Phase 3):** ADR-018 — tiga commerce surface: **License & Extension Shop** (publik, first-license) / **Public Store** (developer products, gate basic miniRider) / **Developer Equipment Store** (miniRider-only, denial audited).
- **PROPOSED (menunggu ratifikasi owner):** ADR-008..011, ADR-015..017, ADR-018 (formal ratification).
- **OPEN — OWNER DECISION:** OD-01 (DB produksi), OD-02 (mobile strategy), **OD-185 (apakah penawaran jasa tetap scope hiRider — baru, audit F-04)**; daftar lengkap `OPEN_DECISIONS.md`.
- **Resolved via Phase 3:** OD-04 sisi `ignoreBuildErrors` — dihapus dari `next.config.ts` berdasarkan instruksi owner prompt Phase 3 §5.1 (lihat `adr/ADR-019-*.md`); sisa aspek OD-04 (reactStrictMode) diputuskan senada.

## 4. Artefak kontrak teknis untuk fase berikutnya

- Data/arsitektur: `DATA_MODEL_CONCEPT.md` (17 konteks, 111 entitas — entity families store sudah diperbarui ADR-018), `AUTHORIZATION_MODEL.md` (144 permission, deny-by-default), `ENTITLEMENT_MODEL.md`, `API_ARCHITECTURE.md` (client-neutral, scope classes, contoh endpoint), `THREAT_MODEL.md` (TC-01..24, TB-1..8).
- Fondasi Phase 3: design tokens (`src/app/globals.css` + `tailwind.config.ts`), komponen foundation (`src/components/foundation/`), i18n (`src/i18n/`, locale `id` default + `en`, cookie persistence), showcase di route `/`, test conventions (`tests/` + `vitest`), CI (`.github/workflows/ci.yml`), konvensi developer (`README.md`).
- Phase 4 (identity/auth) harus: memakai stack yang sama, i18n untuk semua string UI baru, authorization/entitlement server-side (bukan UI hiding), dan tidak menganggap apapun dari `upload/` sebagai kanonik.

## 5. Gap, risiko, blocker, dependency

- **OD-185** (hiRider service offering) — owner decision; memblokir desain detail hiRider Phase 16; TIDAK memblokir Phase 4/5.
- OD-01/OD-02 — menutup ADR-006/ADR-007; non-blocking untuk fasa dokumentasi berikutnya.
- Verifikasi edisi ISO tetap `NOT VERIFIED — BLOCKED` (katalog iso.org tidak dapat diakses dari sandbox; F0-012; OD-160).
- TC-10 (recruitment abuse) butuh requirement baru — menunggu approval owner (jangan mengarang REQ ID).
- CI remote: workflow dibuat tetapi **belum pernah berjalan di remote** (repo tidak punya git remote di sandbox) — status `NOT TESTED`, bukan `VERIFIED`.
- Build produksi: script tersedia; eksekusi build di sandbox ini dilarang oleh platform (melindungi dev server) — status build di lingkungan ini `NOT RUN` (bukan gagal); typecheck `tsc --noEmit` dipakai sebagai evidence kompilasi.

## 6. Command yang benar-benar dijalankan (ringkas; detail + exit code di `PHASE_3_REPORT.md`)

- `diff -q` root vs `upload/phase2_extract/` (F-01) — 9 identik / 4 differs tercatat.
- Contradiction scan (S1–S9) → `audit/phase3-scan/contradiction-scan-2026-10-28.txt`.
- `bun run lint`, `bun run typecheck`, `bun test`-equivalent (`vitest run`) — lihat report untuk hasil aktual.
- agent-browser smoke `/` (showcase) — screenshot `audit/evidence/phase3-*.png`.

## 7. Kebersihan rahasia/konfigurasi

- `.env` ada di workspace, **tidak di-commit**, isinya tidak pernah dicetak ke laporan (Phase 0 F0-007). `.env.example` disediakan berisi placeholder saja.
- `db/custom.db` ter-commit di repo (warisan scaffold) — risiko kebersihan tercatat; jangan menaruh data nyata di sana.
- Jangan memasukkan `.env`, `db/custom.db`, atau `upload/` ke dalam arsip/zip/tar yang dikirim ke pihak luar tanpa review.

## 8. Yang TIDAK boleh dianggap sudah diimplementasikan

- Tidak ada fitur bisnis (auth, licensing, event, asset, store, recruitment, IMS) — Phase 3 hanya fondasi + showcase.
- Tidak ada authorization/entitlement enforcement runtime — hanya pola dokumentasi/konsep.
- Tidak ada klaim ISO/compliance/legal apa pun.
- Tidak ada performance/accessibility audit formal — hanya pemeriksaan manual + test dasar yang tercatat.
- Screenshot showcase = bukti visual, BUKAN bukti logika bisnis.

## 9. Next actions (tanpa otomatis memulai fase berikutnya)

1. Owner: jawab OD-185 (penawaran jasa hiRider) + ratifikasi ADR PROPOSED + OD-01/OD-02.
2. Owner: review `PHASE_3_ACCEPTANCE.md` untuk menutup Phase 3.
3. Phase 4 hanya dimulai setelah instruksi owner eksplisit.
