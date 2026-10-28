# CONTROL BASELINE REGISTER — epicRider

**Dibuat:** 2026-10-28 (Phase 3, Gate A — remediasi temuan audit F-01)
**Tujuan:** menetapkan **satu** set control documents kanonik, membedakan paket input/arsip/superseded, dan merekam hierarki otoritas. Menjawab temuan **F-01** (`epicRider_phase2_consistency_audit.md`): "Dua versi control baseline tidak sama".

---

## 1. Hierarki otoritas (kanonik, diperbarui 2026-10-28 — rekonsiliasi pra-Phase 4)

1. **Keputusan owner eksplisit dalam prompt aktor** (`upload/epicRider_Phase_4_Gated_Prompt_zai.md` saat ini) + **lampiran kontrol owner terbaru**: `MASTER_CONTROL_epicRider_2026-10-28.md` (dipasang sebagai root `MASTER_CONTROL.md` = **MC-V4**) dan `OBSOLETE_AND_SUPERSEDED_REGISTER.md` (dipasang di root).
2. Keputusan `ACCEPTED` di `DECISIONS.md` / `adr/` yang tidak digantikan instruksi owner lebih baru (konflik → catat keputusan pengganti dengan alasan/dampak/tanggal; jangan hapus sejarah).
3. Set control documents kanonik aktif di root repository (daftar §3 di bawah), sebagaimana direkonsiliasi; status obsolete/superseded digariskan oleh `OBSOLETE_AND_SUPERSEDED_REGISTER.md`.
4. Requirement Phase 1 `REQ-001..REQ-100` + `REQ-101` (`REQUIREMENTS.md`; REQ-101 ditambahkan 2026-10-28 atas persetujuan owner via Obsolete Register — tanpa renumber, tanpa duplikasi) — tidak di-reset/renumber.
5. Dokumen arsitektur Phase 2 (`DATA_MODEL_CONCEPT.md`, `AUTHORIZATION_MODEL.md`, `ENTITLEMENT_MODEL.md`, `THREAT_MODEL.md`, `API_ARCHITECTURE.md`, `adr/ADR-006..021`).
6. Laporan audit sebagai daftar temuan untuk diverifikasi (bukan bukti otomatis bahwa temuan selesai): `epicRider_phase2_consistency_audit.md`, `epicRider_phase3_consistency_audit.md`, `epicRider_Phase_4_Entry_Audit.md`.
7. Repository/kode — bukti current state, bukan penentu aturan produk.
8. Dokumen historis/superseded (`audit/superseded/…`, `upload/`) — jejak historis/input; tidak boleh mengalahkan kontrol terbaru (Obsolete Register §1).

**Aturan status fase:** `ROADMAP.md` adalah **satu-satunya sumber kebenaran status fase berjalan**. `PHASE_STATUS.md` hanyalah ringkasan/rekaman eksekusi yang harus konsisten dengan ROADMAP. `MASTER_CONTROL.md` memuat aturan stabil saja — tanpa status fase dinamis (remediasi F-02).

## 2. Inventaris paket & salinan kontrol

| # | Artefak | Path | Peran | Status |
|---|---|---|---|---|
| P-1 | Replacement control pack (owner) | `upload/epicRider_phase2_control_replacement.zip` (13 file; ekstrak verifikasi: `upload/phase2_extract/`) | **Input baseline Phase 2** dari owner (2026-10-27). Dipasang ke root saat mulai Phase 2 (worklog Task 2-0). | INPUT — tidak lagi kanonik sebagai salinan; isinya telah dieksekusi & diperbarui ke root |
| P-2 | Control pack lengkap (referensi audit) | `epicRider_Control_Pack_Complete(1).zip` (18 file, metadata arsip 2026-10-27 ~16:57) | Pembanding dalam audit eksternal. **NOT FOUND di repository ini** — audit dilakukan pada snapshot TAR workspace lain; zip lengkap tidak ikut ter-upload ke workspace aktif. | NOT FOUND di sini — tidak dapat dibandingkan byte-for-byte; tidak diperlakukan kanonik |
| P-3 | Kontrol aktif di root | File §3 di bawah (commit `70005a7` + koreksi Phase 3) | **KANONIK AKTIF** | AKTIF |
| P-4 | Kontrol era Phase 0/1 (superseded) | `audit/superseded/phase1-era-control/` (8 file, MC 15 section) | Jejak historis; sumber referensi `MC §N` lama (lihat `CONTROL_REFERENCE_CROSSWALK.md`) | SUPERSEDED — historis |
| P-5 | Master Control lampiran Phase 0 | `upload/epicRider_Master_Control.md` | Lampiran prompt owner asli (penomoran §1–§15). | SUPERSEDED oleh P-1/P-3; tetap sebagai bukti lampiran owner |
| P-6 | Prompt owner per fase | `upload/epicRider_Phase_{0,1,2,3}_Prompt_zai.md` | Instruksi owner per fase (otoritas #1 saat fase itu berjalan) | AKTIF per fase |
| P-7 | Temuan audit Phase 2 | `upload/epicRider_phase2_consistency_audit.md` | Input Gate A Phase 3 | AKTIF (daftar temuan) |
| P-8 | Temuan audit Phase 3 | `upload/epicRider_phase3_consistency_audit.md` | Input remediasi Phase 3 (putusan: REWORK REQUIRED — kontrol, bukan rebuild); dieksekusi 2026-10-28 — `PHASE_3_REMEDIATION_REPORT.md` | AKTIF (daftar temuan — semua dieksekusi/ditutup) |
| P-9 | Paket rekonsiliasi pra-Phase 4 (owner, 2026-10-28) | `upload/epicRider_Phase_4_Entry_Audit.md`, `upload/epicRider_Phase_4_Gated_Prompt_zai.md`, `upload/MASTER_CONTROL_epicRider_2026-10-28.md`, `upload/OBSOLETE_AND_SUPERSEDED_REGISTER.md`, `upload/workspace-bdf10873-7803-4338-b2cf-19eb3b2301a4.tar` (snapshot workspace; working tree terbukti identik dengan repo aktif — diff 2026-10-28) | Input Stage A rekonsiliasi Phase 4. MC-V4 + Obsolete Register **telah dipasang ke root** (menjadi kanonik aktif); TAR/prompt/audit = input/history, tidak kanonik sebagai salinan | INPUT — sebagian telah dieksekusi ke root (MC-V4, Obsolete Register) |

**Putusan F-01:** P-3 (root, pasca-commit `70005a7`, dikoreksi oleh prompt Phase 3) adalah **satu-satunya baseline kanonik**. P-1 adalah input owner yang isinya sudah dieksekusi; P-4/P-5 historis. Tidak ada dua paket yang diperlakukan sama-sama kanonik. Paket lengkap P-2 **tidak ada** di workspace ini dan tidak boleh dianggap identik dengan P-1/P-3 tanpa perbandingan substansi (yang tidak mungkin dilakukan di sini).

## 3. Daftar file kanonik aktif (root)

| File | Asal | Catatan versi |
|---|---|---|
| `MASTER_CONTROL.md` | **MC-V4 — lampiran owner `MASTER_CONTROL_epicRider_2026-10-28.md`** (dipasang 2026-10-28, rekonsiliasi pra-Phase 4; diff identik dengan lampiran) | Versi kanonik aktif §1–§11; memuat invariant `ServiceOffer != RecruitmentOpening` (§2.2), tiga commerce surfaces (§2.3), metadata katalog ISO 2026-10-28 (§7), aturan `.env`/secret (§9). Versi sebelumnya (MC-V3) diarsipkan utuh: `audit/superseded/MASTER_CONTROL-MC-V3-2026-10-28.md`; interpretasi `MC §N` lintas versi: `CONTROL_REFERENCE_CROSSWALK.md` §2a/§2b |
| `OBSOLETE_AND_SUPERSEDED_REGISTER.md` | Lampiran owner 2026-10-28 (dipasang 2026-10-28, rekonsiliasi pra-Phase 4; diff identik) | **KANONIK** — otoritas klasifikasi obsolete/superseded; menetapkan Phase 2 & 3 = `PARTIAL`, Phase 4 = `BLOCKED / NOT STARTED` sampai gate; REQ-101 disetujui |
| `PRE_PHASE_4_GATE.md` + `PRE_PHASE_4_GATE_REPORT.md` + `PHASE_4_ENTRY_AUDIT.md` | Rekonsiliasi pra-Phase 4 (2026-10-28, prompt Phase 4 Stage A) | Gate masuk Phase 4 + laporan eksekusi gate + audit masuk; wajib sebelum implementasi Phase 4 |
| `ROADMAP.md` | P-1 + eksekusi Phase 2/3 + rekonsiliasi pra-Phase 4 | **DIFFERS dari P-1** (legitim: status diisi dari bukti). Status saat ini: Phase 2 `PARTIAL`, Phase 3 `PARTIAL`, Phase 4 `BLOCKED / NOT STARTED` (per Obsolete Register 2026-10-28) |
| `LICENSE_MATRIX.md` | P-1 | Identik dengan P-1; §4 dikoreksi Phase 3 (tiga surface — F-03) |
| `DECISIONS.md` | P-1 + eksekusi Phase 2 | **DIFFERS dari P-1**: ditambah header "ADR register" (penunjuk ke `ADR_REGISTER.md` + `adr/`). DIFFERS tercatat, bukan konflik |
| `ARCHITECTURE.md` | P-1 | Identik dengan P-1 |
| `SECURITY.md` | P-1 | Identik dengan P-1 |
| `TESTING.md` | P-1 | Identik dengan P-1 |
| `CONTROL_CONSISTENCY_MATRIX.md` | P-1 | Identik dengan P-1 |
| `PHASE_2_DEPENDENCY_MATRIX.md` | P-1 | Identik dengan P-1 |
| `PHASE_2_REPORT_TEMPLATE.md` | P-1 | Identik dengan P-1 |
| `PHASE_2_ACCEPTANCE.md` | P-1 + eksekusi Phase 2 | **DIFFERS dari P-1**: versi root = hasil assessment 2026-10-27; **kini dihitung ulang** (remediasi F-05) |
| `PHASE_2_TRACEABILITY.md` | P-1 + eksekusi Phase 2 | **DIFFERS dari P-1**: hasil eksekusi (100/100 REQ terpetakan). Tercatat |
| `PHASE_STATUS.md` | Eksekusi Phase 1/2 | Ringkasan status — harus konsisten dengan ROADMAP; dikoreksi Phase 3 (rujukan §3.6/§15, F-06) + rekonsiliasi pra-Phase 4 (Phase 2/4 disinkronkan ke PARTIAL/BLOCKED) |
| `OPEN_DECISIONS.md` | Phase 1 + koreksi P-1 | Register keputusan terbuka; ditambah OD-185 (F-04; kini CLOSED — ADR-021); rekonsiliasi pra-Phase 4: OD-116 SUPERSEDED, OD-04/OD-12 diperbarui sesuai ADR-019/ADR-020/MC-V4 §4 |
| `DECISIONS.md` + `ADR_REGISTER.md` + `adr/ADR-006..021` | Phase 2 (+ADR-018/019/020 Phase 3; ADR-021 remediasi audit Phase 3) | Next free ID: ADR-022 |
| Dokumen arsitektur Phase 2 lain | Eksekusi Phase 2 | `DATA_MODEL_CONCEPT.md`, `AUTHORIZATION_MODEL.md`, `ENTITLEMENT_MODEL.md`, `THREAT_MODEL.md`, `API_ARCHITECTURE.md`, `LEGAL_REGULATORY_REGISTER.md` |

## 4. Bukti perbandingan (F-01, dijalankan 2026-10-28)

Command: `diff -q <root-file> upload/phase2_extract/<file>` untuk 12 file yang ada di P-1.

> **KOREKSI F-06 (remediasi audit Phase 3, 2026-10-28):** daftar di bawah (versi awal) memuat dua kesalahan bukti: (1) hitungan "9 identical / 4 differs" menjumlah 13 file untuk 12 file yang dibandingkan; (2) `PHASE_2_ACCEPTANCE.md` tercantum sekaligus di daftar identical dan differs. Hasil eksekusi ulang pada snapshot saat ini: **4 identical / 8 differs** — bukti lengkap dengan command + timestamp: `audit/phase3-remediation/diff-baseline-2026-10-28.txt`. Daftar lama dipertahankan di bawah sebagai sejarah (bergaris miring pada bagian yang salah).

*Hasil (versi awal — SEBAGIAN SALAH, dikoreksi di atas):*
- *IDENTICAL (9): MASTER_CONTROL.md*, LICENSE_MATRIX.md*, ARCHITECTURE.md, SECURITY.md, TESTING.md, CONTROL_CONSISTENCY_MATRIX.md, PHASE_2_DEPENDENCY_MATRIX.md, PHASE_2_REPORT_TEMPLATE.md, PHASE_2_ACCEPTANCE.md* — *klaim ini salah hitung dan PHASE_2_ACCEPTANCE.md tidak mungkin berada di dua daftar sekaligus.*
- *DIFFERS (4): ROADMAP.md, DECISIONS.md, PHASE_2_ACCEPTANCE.md, PHASE_2_TRACEABILITY.md — jumlah 4 + 9 = 13 ≠ 12 file yang dibandingkan.*

Hasil terkoreksi (2026-10-28): identical = PHASE_2_DEPENDENCY_MATRIX.md, PHASE_2_REPORT_TEMPLATE.md, SECURITY.md, TESTING.md; differs = ARCHITECTURE.md, CONTROL_CONSISTENCY_MATRIX.md, DECISIONS.md, LICENSE_MATRIX.md, MASTER_CONTROL.md, PHASE_2_ACCEPTANCE.md, PHASE_2_TRACEABILITY.md, ROADMAP.md — **semuanya update eksekusi/koreksi ter-recorded** (detail klasifikasi per-file di file bukti), bukan konflik substansi aturan. Tidak ada file root yang berubah mengalahkan aturan owner tanpa catatan.

## 5. Aturan ke depan

1. Perubahan kontrol kanonik hanya via koreksi tercatat (prompt owner / ADR / remediasi ber-bukti), dengan referensi versi lama di `audit/superseded/` bila diganti.
2. `MC §N` dalam dokumen aktif ditafsirkan lewat `CONTROL_REFERENCE_CROSSWALK.md` (§2a MC-V3→MC-V4; §2b MC-V0/V1→MC-V4).
3. Status fase hanya ditulis di `ROADMAP.md` (sumber); `PHASE_STATUS.md` sinkron; dokumen lain dilarang menyimpan status fase dinamis.
4. Paket input (P-1, P-2, P-9) tidak boleh dipasang ulang menimpa root tanpa rekonsiliasi tercatat; klasifikasi obsolete/superseded mengikuti `OBSOLETE_AND_SUPERSEDED_REGISTER.md`.
5. **Rekonsilusi 2026-10-28 (Stage A pra-Phase 4):** MC-V4 dipasang menggantikan MC-V3 (arsip utuh); Obsolete Register dipasang & didaftarkan; REQ-101 ditambahkan atas persetujuan owner (Obsolete Register §2); status Phase 2/3/4 disinkronkan (PARTIAL/PARTIAL/BLOCKED-NOT STARTED). Bukti: `PHASE_4_ENTRY_AUDIT.md` + `PRE_PHASE_4_GATE_REPORT.md`.
