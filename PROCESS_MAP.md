# PROCESS MAP — epicRider

**Status dokumen:** DESAIN/PROPOSED (Phase 1, artefak workstream C). Semua isi adalah **target state** untuk implementasi, bukan kondisi repository saat ini. Tidak ada proses di dokumen ini yang boleh dianggap "sudah berjalan" tanpa bukti (MC §14, §15).
**Sumber:** `MASTER_CONTROL.md` §5 (core flow), §9 (IMS/sustainability), §11 (asset lifecycle & operasi); prompt Phase 1 workstream C/G/H/J; `REQUIREMENTS.md` (REQ-xxx dirujuk apa adanya, TIDAK ada REQ baru dibuat di sini); `OPEN_DECISIONS.md` (OD-xxx); `ISO_IMS_BLUEPRINT.md` §3 (traceability chain); `ROADMAP.md` (phase).
**Batas klaim:** Dokumen ini BUKAN pernyataan kepatuhan/sertifikasi. Standar hanya dirujuk sebagai metadata (STD-01..STD-10 per `ISO_IMS_BLUEPRINT.md` §1, semuanya `NOT VERIFIED — BLOCKED`). Nol teks standar ISO dikutip (MC §9, REQ-040). Nol angka target/baseline/emisi dikarang.

---

## 0. Konvensi, legenda, dan register persona (rujukan silang)

### 0.1 Skema ID
- `PROC-01..PROC-13` — proses core (event-to-cash / asset lifecycle), Bagian A; proses baru menyusul dengan nomor berikutnya tanpa mendaur ulang ID.
- `ASM-Sxx` / `ASM-Dxx` / `ASM-Txx` — state / state degradasi / transisi pada state machine aset (sub-map Bagian A.3).
- `PROC-2xx` — proses IMS (ISOrider), Bagian B.
- `KPI-xx` — KPI kandidat sustainability, Bagian C.
- ID bersifat stabil: tidak didaur ulang, tidak diubah maknanya antar dokumen.

### 0.2 Legenda tier
| Tanda | Arti |
|---|---|
| mini | Tersedia di miniRider |
| max | Tersedia di maxRider (mewarisi mini kecuali Equipment Store) |
| ISO | Tersedia di ISOrider (mewarisi max) |
| **✗ mini** | **TIDAK tersedia di miniRider** — ditandai eksplisit pada tahap terkait |

Perbedaan lisensi ditegakkan server-side via entitlement (MC §5, REQ-024); penandaan di dokumen ini adalah desain capability, bukan kontrol keamanan.

### 0.3 Register persona (ter-cocokkan dengan register canonical)

> **Rekonsiliasi (run ini):** Definisi kanonik persona = `PERSONAS_AND_JOURNEYS.md` (workstream A, Phase 1). File tersebut kini tersedia di repository; pemetaan ID ↔ peran di bawah telah **dicocokkan dengan register canonical tersebut** (VERIFIED untuk pemetaan ID; isi/status register tetap otoritas workstream A). Sesuai arahan orkestrator, **P-05 (Rental/Asset Manager)** dan **P-06 (Finance/CRM Officer)** adalah persona utama peta event-to-cash/asset ini; **P-04 (Event Manager)** juga aktor sentral di hampir semua tahap.

| ID | Peran (register canonical WS-A) | Catatan keterlibatan |
|---|---|---|
| P-01 | Solo Owner-Operator | Owner workspace perorangan; top management utk organisasi kecil |
| P-02 | Workspace Owner UKM | Keputusan membership/assignment/approval komersial workspace |
| P-03 | Crew Member | Eksekusi lapangan, inspeksi, chat/report; hiRider (lamaran ≠ akses, REQ-013) |
| **P-04** | **Event Manager** | **Aktor sentral hampir semua tahap**: rundown, koordinasi, laporan |
| **P-05** | **Rental / Asset Manager** | **Aktor utama peta ini** (aset, QR, readiness, maintenance) |
| **P-06** | **Finance / CRM Officer** | **Aktor utama peta ini** (inquiry, quotation, invoice, feedback) |
| P-07 | Developer / store manager (platform) | Di luar core flow event; Equipment Store/Portal |
| P-08 | Administrator platform / support | Governance, konfigurasi workspace |
| P-09 | Auditor internal / eksternal | Read-only scoped (REQ-044, REQ-053, OD-110) |
| P-10 | IMS / Sustainability Manager | Pemilik proses IMS & dokumen terkendali (PROC-201..216) |
| P-11 | Supplier / Contractor | Objek evaluasi (PROC-208), pihak eksternal |
| P-12 | Customer / Pelanggan | Sumber inquiry & feedback; kanal eksternal |

Status mapping: **TERCOCOKKAN dengan `PERSONAS_AND_JOURNEYS.md`** (pemetaan ID ↔ peran); perubahan berikutnya di register WS-A wajib disinkronkan ke sini (lihat juga §5 Keterbukaan).

### 0.4 Prinsip core flow (MC §5, REQ-027, REQ-070)
Setiap proses di dokumen ini harus dapat dihubungkan ke rantai:
**Process → Control → Workflow → Transaction → Evidence → Report/Improvement.**
Dokumen, checklist, signature, audit finding, NCR/CAPA, asset, maintenance, dan sustainability harus terhubung ke transaksi/proses sebenarnya (MC §5). Model dokumen/evidence dirinci di `DOCUMENT_EVIDENCE_MODEL.md`.

---

# Bagian A — Event-to-cash / asset lifecycle map

## A.1 Ringkasan rantai (dari MC §11 + prompt Phase 1 workstream C)

```
PROC-01 Inquiry/brief
   → PROC-02 Technical rider
   → PROC-03 Quotation/contract (jika scope tier) ─┐
   → PROC-04 Planning/rundown ────────────────────┤
   → PROC-05 Crew assignment                      │
   → PROC-06 Media kit                            │
   → PROC-07 Asset reservation/inspection/readiness
   → PROC-08 Dispatch
   → PROC-09 Event execution (chat/report)  ← data sustainability (PROC-202) & incident (PROC-211) bila ISO/max
   → PROC-10 Return/condition/maintenance
   → PROC-11 Finance (invoice/payment)        [event-to-cash closing]
   → PROC-12 Customer feedback
   → PROC-13 Evidence / lessons learned / CAPA
   → (loop perbaikan → PROC-215/216 IMS untuk ISOrider; → planning event berikutnya)
```

## A.2 Ketersediaan tier per tahap (ringkasan eksplisit)

| Proses | mini | max | ISO | Catatan |
|---|---|---|---|---|
| PROC-01 Inquiry/brief | **✗ mini** | ✓ | ✓ | miniRider tidak punya CRM; inquiry di luar platform |
| PROC-02 Technical rider | ✓ | ✓ | ✓ | draft boleh, wajib terhubung event |
| PROC-03 Quotation/contract | **✗ mini** | ✓ | ✓ | komersial = maxRider |
| PROC-04 Planning/rundown | ✓ | ✓ | ✓ | +risk/HSE planning di Phase 15 (max) |
| PROC-05 Crew assignment | ✓ (dasar) | ✓ | ✓ (+gate kompetensi) | kuota 5 kru mini (OD-05) |
| PROC-06 Media kit | ✓ | ✓ | ✓ | dari template, wajib terkait event |
| PROC-07 Reservation/inspection/readiness | **✗ mini** | ✓ | ✓ | mini hanya register aset dasar + set template |
| PROC-08 Dispatch | **✗ mini** | ✓ | ✓ | QR/barcode, check-out berbukti |
| PROC-09 Event execution | ✓ | ✓ (+HSE/incident) | ✓ (+sustainability data) | inti miniRider |
| PROC-10 Return/condition/maintenance | **✗ mini** | ✓ | ✓ | siklus aset penuh |
| PROC-11 Finance | **✗ mini** | ✓ | ✓ | invoice/payment states |
| PROC-12 Customer feedback | **✗ mini** | ✓ (komplain) | ✓ (proses feedback IMS) | |
| PROC-13 Evidence/lessons/CAPA | **✗ mini** (bukti dasar saja) | ✓ (dossier) | ✓ (evidence workflow + CAPA) | |

## A.3 Definisi proses core (PROC-01..PROC-13)

Semua proses berstatus **PROPOSED/TARGET**. Phase merujuk `ROADMAP.md`.

---

### PROC-01 — Inquiry & brief
- **Input:** permintaan/kontak pelanggan (P-12), data historis event (bila ada).
- **Output:** lead/brief tercatat di CRM; keputusan lanjut (ke PROC-02) atau berhenti (lead ditolak, alasan tercatat).
- **Aktor:** Finance/CRM (P-06), Event manager (P-04); sumber: pelanggan (P-12).
- **Tier:** max/ISO. **✗ mini — TIDAK tersedia di miniRider** (tidak ada modul CRM; inquiry ditangani di luar platform).
- **Requirement:** REQ-046, REQ-011 (operasi maxRider: CRM, quotations/orders/contracts).
- **Phase:** 12 (maxRider CRM).
- **Transisi:** → PROC-02 (brief diterima) / berhenti (tidak lanjut).

### PROC-02 — Technical rider
- **Input:** brief (PROC-01) atau kebutuhan langsung pemilik workspace; template rider; katalog aset/set.
- **Output:** technical rider dengan status draft/published, **wajib terhubung ke event** yang menggunakannya (MC §2).
- **Aktor:** Event manager (P-04); Rental/asset manager (P-05) untuk validasi ketersediaan aset.
- **Tier:** mini ✓ / max ✓ / ISO ✓. Draft diperbolehkan; rider tanpa event tidak bisa menjadi published (server-side).
- **Requirement:** REQ-004.
- **Phase:** 7.
- **Transisi:** → PROC-03 (bila scope komersial, tier max) dan/atau → PROC-04.

### PROC-03 — Quotation & contract (jika scope tier)
- **Input:** technical rider (PROC-02), price list, data CRM. **Nilai harga/pajak/refund = keputusan owner (OD-06) — tidak didefinisikan di dokumen ini.**
- **Output:** quotation; order/contract yang terikat ke event.
- **Aktor:** Finance/CRM (P-06); approval Owner workspace (P-02; P-01 bila solo operator).
- **Tier:** max/ISO. **✗ mini — TIDAK tersedia di miniRider** (tidak ada keuangan/komersial; MC §2).
- **Requirement:** REQ-046, REQ-011.
- **Phase:** 12–14.
- **Transisi:** → PROC-04 (kontrak/perintah kerja sah) ; perubahan scope → revisi rider (PROC-02) lalu revisi quotation.

### PROC-04 — Planning & rundown
- **Input:** rider (PROC-02), kontrak (PROC-03 bila ada), jadwal, kebutuhan tim/aset.
- **Output:** rundown event; rencana kebutuhan aset (masukan PROC-07) dan kru (masukan PROC-05); (max/ISO) risk assessment awal.
- **Aktor:** Event manager (P-04).
- **Tier:** mini ✓ / max ✓ / ISO ✓. Risk assessment terstruktur = max (Phase 15) → PROC-207 (ISO).
- **Requirement:** REQ-008, REQ-046.
- **Phase:** 6, 10; risk: 15.
- **Transisi:** → PROC-05, → PROC-06, → PROC-07.

### PROC-05 — Crew assignment
- **Input:** rundown (PROC-04), daftar kru & status membership, (max/ISO) record kompetensi.
- **Output:** event assignment per kru (terpisah dari workspace membership); (ISO) verifikasi kompetensi sebelum penugasan kritis.
- **Aktor:** Event manager (P-04); kru (P-03) menerima penugasan.
- **Tier:** mini ✓ (dasar; konteks event aktif jelas, pindah konteks aman — MC §2; kuota maks 5 kru/workspace, definisi kuota = OD-05). Gate kompetensi = ISO (PROC-209).
- **Requirement:** REQ-007, REQ-050, REQ-009, REQ-074.
- **Phase:** 4, 6, 10; kompetensi: 19.
- **Transisi:** → PROC-07/PROC-08 (kru siap eksekusi); penugasan batal → catat & bebankan ulang.

### PROC-06 — Media kit
- **Input:** template media kit; data event.
- **Output:** media kit yang **terkait dengan event** penggunanya, dibuat dari template (MC §2).
- **Aktor:** Event manager (P-04).
- **Tier:** mini ✓ / max ✓ / ISO ✓.
- **Requirement:** REQ-005.
- **Phase:** 9.
- **Transisi:** → PROC-07 (persiapan operasional berjalan paralel); media kit dipakai saat PROC-09.

### PROC-07 — Asset reservation, inspection & readiness
- **Input:** kebutuhan aset dari rider/rundown; asset register; jadwal inspeksi/maintenance.
- **Output:** reservasi terkonfirmasi (konflik ditangani sesuai **OD-107** — hard-block / warning-override / hybrid, belum diputuskan); hasil inspeksi; keputusan readiness gate.
- **Aktor:** Rental/asset manager (P-05); Kru (P-03) untuk inspeksi lapangan.
- **Tier:** max/ISO. **✗ mini — TIDAK tersedia di miniRider**: mini hanya punya pengelolaan aset dasar + asset/set template (MC §2); reservation/inspection/readiness tidak ada.
- **Requirement:** REQ-045, REQ-065, REQ-068; readiness gates: REQ-046 (Phase 15).
- **Phase:** 13; readiness gates: 15.
- **Transisi:** → PROC-08 (aset ready); gagal readiness → maintenance (ASM state machine A.3) dan cari substitusi.

### PROC-08 — Dispatch
- **Input:** aset berstatus ready (A.3), jadwal, penugasan kru.
- **Output:** bukti check-out dengan capture kondisi (foto/catatan) sebagai evidence; pergerakan aset tercatat; QR/barcode ter-scan.
- **Aktor:** Rental/asset manager (P-05), Kru (P-03).
- **Tier:** max/ISO. **✗ mini — TIDAK tersedia di miniRider** (QR/barcode/scan = maxRider, MC §8).
- **Requirement:** REQ-036, REQ-066, REQ-067 (izin kamera + fallback manual), REQ-045.
- **Phase:** 13.
- **Transisi:** → PROC-09 (aset in-use di event).

### PROC-09 — Event execution (chat, rundown live, report)
- **Input:** penugasan (PROC-05), rundown (PROC-04), aset ter-dispatch (PROC-08), media kit (PROC-06).
- **Output:** laporan/updates antar tim di konteks event; riwayat chat; catatan lapangan; (max/ISO) HSE briefing/permit/checklist, incident report bila terjadi; (ISO) data sustainability (energi, limbah, dll. — Bagian C) dan bukti terkait.
- **Aktor:** Kru (P-03) sebagai pelaksana; Event manager (P-04) memantau; konteks event aktif ditampilkan jelas (REQ-007).
- **Tier:** mini ✓ (Chat, Rundown, Media Kit, update info/laporan — MC §2); max ✓ (+HSE/incident, Phase 15); ISO ✓ (+data sustainability, incident→NCR).
- **Requirement:** REQ-008, REQ-007, REQ-046; incident chain: REQ-075.
- **Phase:** 10; HSE/incident: 15, 19–20; sustainability data: 19.
- **Transisi:** → PROC-10 (aset kembali); → PROC-11 (finansial); → PROC-12 (feedback); insiden → PROC-211.

### PROC-10 — Return, condition & maintenance
- **Input:** aset kembali dari event; hasil check-in.
- **Output:** status kondisi aset (OK / damaged / lost) dari condition assessment; tiket maintenance/calibration; aset kembali ready.
- **Aktor:** Rental/asset manager (P-05), Kru (P-03) saat serah terima.
- **Tier:** max/ISO. **✗ mini — TIDAK tersedia di miniRider.**
- **Requirement:** REQ-045, REQ-066, REQ-068.
- **Phase:** 13.
- **Transisi:** mengikuti **state machine aset (A.3)**; loop ke PROC-07 untuk event berikutnya.

### PROC-11 — Finance (invoicing & payment states)
- **Input:** kontrak/order (PROC-03), laporan pemakaian (PROC-09/10).
- **Output:** invoice; status pembayaran sesuai integrasi (MC §11: payment/invoice states sesuai scope finance; integrasi = keputusan, tidak dikarang).
- **Aktor:** Finance/CRM (P-06).
- **Tier:** max/ISO. **✗ mini — TIDAK tersedia di miniRider.**
- **Requirement:** REQ-046, REQ-011.
- **Phase:** 14.
- **Transisi:** → PROC-12; memfinalisasi siklus event-to-cash.

### PROC-12 — Customer feedback & complaints
- **Input:** event selesai; kontak pelanggan (P-12).
- **Output:** record feedback/komplain terhubung event; komplain serius → NCR path.
- **Aktor:** Finance/CRM (P-06), Event manager (P-04).
- **Tier:** max ✓ (customer complaints = bagian operasi maxRider, MC §11); ISO ✓ (proses feedback IMS penuh, PROC-210). **✗ mini.**
- **Requirement:** REQ-046, REQ-075..077.
- **Phase:** 15 (komplain dasar), 20 (integrasi IMS).
- **Transisi:** → PROC-13; komplain → ketidaksesuaian → PROC-214 (NCR/CAPA).

### PROC-13 — Evidence, lessons learned & CAPA
- **Input:** seluruh transaksi dan bukti event (dossier), temuan review/audit, feedback (PROC-12).
- **Output:** project/event dossier yang menghubungkan transaksi→bukti (MC §11); dokumentasi lessons learned; aksi perbaikan/CAPA bila ada NCR.
- **Aktor:** Event manager (P-04); Auditor (P-09) untuk review read-only; top management/Owner (P-02, P-01 bila solo; didukung P-10 IMS/Sustainability manager) untuk keputusan perbaikan.
- **Tier:** max ✓ (dossier, Phase 21; bukti check-in/out dasar sudah sejak Phase 13); ISO ✓ penuh (evidence workflow Phase 18, NCR/CAPA Phase 20). **✗ mini — evidence workflow terstruktur & CAPA TIDAK tersedia** (mini hanya punya bukti dasar chat/laporan).
- **Requirement:** REQ-046, REQ-083, REQ-075, REQ-077, REQ-087, REQ-027.
- **Phase:** 18, 20, 21.
- **Transisi:** → PROC-215 (management review) / PROC-216 (continual improvement); pelajaran masuk perencanaan event berikutnya (PROC-04).

---

## A.4 Sub-map: lifecycle aset lengkap (MC §11) — state machine

**Sumber:** MC §11 (procurement/registration → identification → QR/barcode generation/printing → inspection/readiness → reservation → picking → testing → dispatch → event use → return → condition/damage → repair/maintenance/calibration → retirement/disposal). Semua state/transisi **PROPOSED/TARGET**, implementasi Phase 13 (REQ-045).

**Cakupan tier:** state machine penuh = **maxRider/ISOrider (Phase 13)**. Di **miniRider hanya subset register dasar**: `ASM-S01 registered` + `ASM-S02 identified` via CRUD aset & set template (Phase 8) — **tanpa reservasi/inspeksi/dispatch/maintenance** (✗ mini). Mini tidak mengenal state di bawahnya.

### A.4.1 State aset

| ID | State | Definisi | Bukti/evidence wajib | Aktor utama |
|---|---|---|---|---|
| ASM-S01 | `registered` | Aset terdaftar di asset register (procurement/registration): kategori, model, serial, ownership | record registrasi | P-05 |
| ASM-S02 | `identified` | Identitas unik terpasang: QR/barcode dibuat & label tercetak | QR/label ID, record identifikasi | P-05 |
| ASM-S03 | `inspected` | Lolos inspeksi/readiness (inspeksi terjadwal & hasil tercatat) | hasil inspeksi (evidence) | P-03/P-05 |
| ASM-S04 | `reserved` | Direservasi untuk event/periode tertentu; konflik dicegah | record reservasi | P-05 |
| ASM-S05 | `dispatched` | Check-out: picking, testing, keluar gudang dengan capture kondisi | bukti check-out (foto/catatan) | P-03/P-05 |
| ASM-S06 | `in-use` | Dipakai di event (event use) | konteks event aktif; laporan lapangan | P-03 |
| ASM-S07 | `returned` | Check-in kembali ke gudang | bukti check-in (foto/catatan) | P-03/P-05 |
| ASM-S08 | `condition-assessed` | Kondisi dinilai (OK/needs repair) | hasil assessment | P-05 |
| ASM-S09 | `maintenance` | Reparasi/maintenance/calibration berjalan (due/overdue ter-track) | tiket maintenance, hasil servis | P-05/P-11 |
| ASM-S10 | `ready` | Siap dipakai untuk reservasi berikutnya (readiness valid) | status readiness | P-05 |
| ASM-S11 | `retired` | Dipensiunkan/disposal (end-of-life decision) | record retirement/disposal + alasan | P-05/P-02 |
| ASM-D01 | `damaged` (degradasi) | Rusak terdeteksi saat in-use/returned/dispatched | damage report + foto | P-03/P-05 |
| ASM-D02 | `lost` (degradasi) | Hilang/tidak ditemukan (lost/missing) | lost report + investigasi | P-03/P-05 |

### A.4.2 Transisi state

| ID | Dari → Ke | Pemicu/aturan | Requirement | Guard/keterangan |
|---|---|---|---|---|
| ASM-T01 | S01 → S02 | Generate QR/barcode + cetak label | REQ-036 | ID unik; tidak boleh duplikat |
| ASM-T02 | S02 → S03 | Inspeksi terjadwal selesai & lolos | REQ-068, REQ-045 | hasil inspeksi tersimpan sebagai evidence |
| ASM-T03 | S03 → S04 | Booking reservasi | REQ-065 | deteksi konflik double-booking; perilaku = OD-107 |
| ASM-T04 | S04 → S05 | Picking + testing + check-out | REQ-036, REQ-066 | capture kondisi wajib saat check-out |
| ASM-T05 | S05 → S06 | Aset tiba/dipakai di event | REQ-045 | konteks event tercatat |
| ASM-T06 | S06 → S07 | Check-in kembali | REQ-066 | capture kondisi wajib saat check-in |
| ASM-T07 | S07 → S08 | Penilaian kondisi | REQ-045 | hasil: OK / perlu perbaikan |
| ASM-T08 | S08 → S09 | Kondisi butuh repair/maintenance/calibration | REQ-068 | tiket terbuka, due/overdue ter-track |
| ASM-T09 | S08 → S10 | Kondisi OK | REQ-045 | — |
| ASM-T10 | S09 → S10 | Servis/kalibrasi selesai & terverifikasi | REQ-068 | hasil servis sebagai evidence |
| ASM-T11 | S10 → S04 | Reservasi berikutnya (inspeksi masih valid) | REQ-065, REQ-068 | bila inspeksi kedaluwarsa → wajib ASM-T02 dulu |
| ASM-T12 | S05/S06/S07 → ASM-D01 | Damage report | REQ-036, REQ-066 | foto + catatan wajib |
| ASM-T13 | S05/S06 → ASM-D02 | Lost/missing report | REQ-045, REQ-046 | investigasi tercatat |
| ASM-T14 | ASM-D02 → S07 | Aset ditemukan kembali | — | jalur recovery, teraudit |
| ASM-T15 | ASM-D01 → S09 | Damage → maintenance | REQ-068 | — |
| ASM-T16 | S08/S09 → S11 | Keputusan retirement/disposal | REQ-045 | mempertimbangkan umur/kondisi/biaya; audit trail |

**Aturan umum state machine (PROPOSED):**
1. Transisi di luar tabel ditolak server-side; setiap transisi menghasilkan audit trail (aktor, waktu, konteks event, nilai lama→baru).
2. Movement history aset dapat direkonstruksi penuh dari transisi (MC §11: movement history, check-in/out, damage, lost/missing).
3. Status aset selalu diperiksa permission bersama konteks event & lisensi (MC §5, REQ-026).
4. KPI utilization/downtime/cost dihitung dari data transisi nyata, bukan data demo (REQ-069).
5. Offline/sync untuk transisi lapangan = keputusan OD-07; tanpa keputusan & pengujian, tidak ada klaim offline support (MC §8).

---

# Bagian B — IMS process map (ISOrider)

## B.1 Prinsip

- Proses IMS dimodelkan sebagai **objek terhubung** (process architecture), **bukan daftar formulir** (REQ-070, MC §5/§10). Setiap proses punya relasi ke kontrol, workflow, transaksi, evidence, dan report.
- Semua proses IMS = **tier ISOrider saja**, implementasi Phase 17–21. Semua **PROPOSED/TARGET**.
- Standar dirujuk hanya sebagai metadata STD-01..STD-10 (`ISO_IMS_BLUEPRINT.md` §1, semua `NOT VERIFIED — BLOCKED`). **Mapping klausul dilarang sebelum verifikasi katalog resmi** (REQ-039, OD-08).
- Setiap proses dinyatakan posisinya dalam core flow **Process → Control → Workflow → Transaction → Evidence → Report**.

## B.2 Definisi proses IMS (PROC-201..PROC-216)

| ID | Proses | Purpose (tujuan) | Input → Output | Posisi di core flow | Requirement | Phase | Dependency utama |
|---|---|---|---|---|---|---|---|
| PROC-201 | Quality management | Menjamin hasil layanan event/rental konsisten dengan persyaratan pelanggan & internal | Input: persyaratan pelanggan, SOP, hasil kontrol → Output: record mutu, hasil QC readiness, temuan | Process + Control; Transaction = QC event; Evidence = checklist mutu; Report = evaluasi mutu | REQ-070..072 | 17 | PROC-212, PROC-214, PROC-207 |
| PROC-202 | Event sustainability | Mengelola dampak & kinerja keberlanjutan per event (energi, limbah, transport, aksesibilitas, dll.) | Input: target sustainability, data lapangan → Output: data KPI (Bagian C), bukti, aksi perbaikan | Process; Workflow = capture data event; Transaction = pemakaian sumber daya; Evidence = foto/nota/meteran; Report = rekap KPI | REQ-041, REQ-085..087, REQ-070 | 19 | PROC-209/216, PROC-212; KPI dictionary Bagian C |
| PROC-203 | OH&S / HSE | Melindungi keselamatan & kesehatan kerja kru di lokasi event/warehouse | Input: risk assessment, checklist HSE → Output: briefing/permit/checklist terisi, incident report bila ada | Control = permit/briefing; Workflow = eksekusi checklist; Transaction = penugasan; Evidence = checklist+foto; Report = statistik K3 | REQ-070, REQ-075, REQ-046 | 15 (dasar max), 19 (ISO) | PROC-207, PROC-211, PROC-209 |
| PROC-204 | Environment | Mengelola aspek/aspek dampak lingkungan operasi (limbah, energi, emosi bahan—lihat KPI) | Input: aspek lingkungan, data pemakaian → Output: record lingkungan, KPI, kendali operasional | Process + Control; Transaction = pemakaian/limbah; Evidence = bukti vendor/timbangan; Report = kinerja lingkungan | REQ-041, REQ-085 | 19 | PROC-202, PROC-208 |
| PROC-205 | Information security | Melindungi kerahasiaan/integritas/ketersediaan data platform & pelanggan | Input: ancaman (threat model), klasifikasi info → Output: kontrol akses, log, incident keamanan | Control = ACL/entitlement; Workflow = provisioning akses; Transaction = semua aksi API; Evidence = audit log; Report = review keamanan | REQ-070, REQ-092, REQ-082 | 17 (kerangka), 19 (workflow) | PROC-212, PROC-211; SECURITY.md |
| PROC-206 | Business continuity | Menjaga layanan kritikal tetap berjalan/ pulih saat gangguan | Input: analisis dampak bisnis → Output: rencana continuity, prosedur pemulihan, uji | Process + Control; Workflow = respons gangguan; Transaction = failover/restore; Evidence = log pemulihan; Report = hasil uji | REQ-070, REQ-094 | 19, 25 (uji DR) | PROC-205; OPERATIONS.md; OD-114 |
| PROC-207 | Risk management | Mengelola risiko operasional, keselamatan, komersial, kepatuhan (guidance-based, bukan sertifikasi) | Input: identifikasi risiko per proses/event → Output: register risiko, mitigasi, status | Control = mitigasi; Workflow = assessment/approval; Transaction = keputusan mitigasi; Evidence = risk register entry; Report = profil risiko | REQ-070, REQ-046 | 15 (dasar), 19 (ISO) | semua PROC-2xx; ISO 31000 = guidance (STD-07), bukan sertifikasi |
| PROC-208 | Supplier & contractor management | Memastikan supplier/contractor memenuhi persyaratan mutu, HSE, sustainability | Input: daftar supplier, kriteria → Output: record evaluasi/qualifikasi, keputusan pemakaian | Process + Control; Workflow = evaluasi; Transaction = pengadaan/sewa; Evidence = dokumen supplier; Report = daftar supplier terevaluasi | REQ-073 | 19 | PROC-214 (bila supplier bermasalah), KPI-11 |
| PROC-209 | Competence & training | Memastikan kru/role punya kompetensi sebelum penugasan tertentu | Input: matriks kompetensi per role → Output: record kompetensi/training, gate penugasan | Control = gate kompetensi; Workflow = verifikasi penugasan; Transaction = assignment; Evidence = sertifikat/record; Report = gap kompetensi | REQ-074 | 19 | PROC-203 (kebutuhan HSE), PROC-205 (kompetensi infosec) |
| PROC-210 | Customer feedback | Mengelola umpan balik & kepuasan pelanggan secara sistematis | Input: feedback post-event, komplain → Output: record feedback, analisis, aksi | Process; Workflow = triase; Transaction = respons; Evidence = komunikasi tercatat; Report = tren kepuasan | REQ-046, REQ-075..077 | 15 (komplain max), 20 (IMS) | PROC-214 (komplain→NCR), PROC-216 |
| PROC-211 | Incident management | Menangkap dan menangani insiden (operasional, HSE, keamanan informasi) cepat & terdokumentasi | Input: laporan insiden kru/system → Output: incident record, triase, eskalasi | Workflow = pelaporan; Transaction = tindakan; Evidence = laporan+foto; Report = statistik insiden | REQ-075, REQ-046 | 15 (lapor dasar), 19–20 (rantai penuh) | PROC-214 (NCR), PROC-203/205 (klasifikasi) |
| PROC-212 | Controlled documentation | Mengelola dokumen terkendali & evidence library (hirarki, metadata, ACL, lifecycle) | Input: kebutuhan dokumen per proses → Output: dokumen approved/effective, evidence terkunci | Control = dokumen prosedur; Workflow = review/approval; Transaction = perubahan versi; Evidence = dokumen itu sendiri + log akses; Report = status dokumentasi | REQ-042, REQ-078..082, REQ-027 | 17–18 | semua proses (provider dokumen); detail: `DOCUMENT_EVIDENCE_MODEL.md` |
| PROC-213 | Audit programme | Merencanakan & menjalankan audit internal berbasis risiko | Input: rencana audit, kriteria → Output: jadwal audit, laporan audit, temuan | Process; Workflow = eksekusi audit; Transaction = penugasan auditor; Evidence = kertas kerja; Report = audit report | REQ-044, REQ-053, REQ-070 | 18 (Audit Mode), 20 | PROC-212 (bukti), PROC-214 (temuan→NCR); OD-110 |
| PROC-214 | NCR / CAPA | Menutup ketidaksesuaian dengan koreksi + tindakan korektif hingga efektif | Input: temuan audit/komplain/insiden → Output: NCR, CAPA, cek efektivitas, closure | Report (temuan) → Process (CAPA); Workflow = alur NCR; Transaction = tindakan; Evidence = bukti perbaikan; Report = status closure | REQ-075 | 20 | PROC-211 (sumber), PROC-213 (sumber), PROC-216 |
| PROC-215 | Management review | Review berkala kinerja IMS oleh pimpinan dengan input/keputusan ter-track | Input: data kinerja semua proses, KPI, NCR, audit → Output: keputusan review, action items ber-owner | Report → Process; Workflow = persiapan & rapat; Transaction = keputusan; Evidence = notulen/record review; Report = minutes + actions | REQ-076 | 20 | PROC-214, PROC-216, semua PROC-2xx sebagai sumber input |
| PROC-216 | Continual improvement | Melacak aksi perbaikan dari mana pun (KPI, NCR, feedback, review) hingga terverifikasi | Input: aksi perbaikan, metrik → Output: siklus aksi (open→progress→verified→closed), hasil terukur | Process + Report; Workflow = tracking aksi; Transaction = perubahan implementasi; Evidence = bukti hasil; Report = laporan improvement | REQ-077, REQ-087 | 20 | PROC-202 (KPI), PROC-214, PROC-215 |

**Catatan dependency:** semua proses IMS bergantung pada PROC-212 (dokumen/evidence terkendali) dan fondasi platform Phase 4–5 (identity, entitlement, audit log). Tanpa itu, rantai Process→…→Report tidak dapat dibuktikan (REQ-012 acceptance criteria: minimal 1 siklus lengkap teruji).

## B.3 Traceability chain (dari `ISO_IMS_BLUEPRINT.md` §3 — TARGET)

Rantai lengkap, tiap mata-rantai dijelaskan:

1. **requirement / clause / reference** — sumber kewajiban: kebutuhan pelanggan, klausul standar (metadata berlisensi saja), hukum/kontrak, kebijakan internal. *Bukan teks standar — hanya referensi ID + judul (REQ-040).*
2. **obligation / risk** — apa yang "harus dipenuhi" atau "berisiko" jika tidak: kewajiban terjemahan dari requirement; risiko diidentifikasi via PROC-207.
3. **control** — mekanisme pencegahan/deteksi: kebijakan (level dokumen D1), gate entitlement, permit HSE, gate kompetensi. Control harus menunjuk requirement yang dilayaninya.
4. **process** — proses yang menjalankan control (PROC-xxx di dokumen ini). Proses = objek terhubung, bukan formulir.
5. **procedure** — cara pelaksanaan tertulis (SOP, level dokumen D4) yang disetujui & effective.
6. **workflow** — eksekusi terstruktur di platform: langkah, aktor, status, deadline (workflow engine Phase 15/18).
7. **transaction** — kejadian bisnis nyata yang direkam: penugasan, check-out aset, submit checklist, keputusan approval. Bukan buatan untuk audit.
8. **record** — data hasil transaksi yang tersimpan terstruktur (record/evidence library).
9. **evidence** — record + bukti pendukung (foto, file, metadata timestamp/aktor) yang lolos evidence workflow (REQ-083) — detail `DOCUMENT_EVIDENCE_MODEL.md` §5.
10. **approval / signature** — sign-off yang mengikat aktor terautentikasi, role, waktu, konteks, versi (MC §10). Kekuatan hukum = OD-103, tidak diklaim.
11. **finding** — hasil pemeriksaan: audit (PROC-213), insiden (PROC-211), komplain (PROC-210) menemukan kesenjangan vs requirement/control.
12. **NCR / CAPA** — ketidaksesuaian formal + tindakan korektif dengan owner & deadline (PROC-214, REQ-075).
13. **effectiveness check** — verifikasi bahwa CAPA benar-benar mencegah terulangan (bukan sekadar selesai dikerjakan).
14. **closure** — penutupan formal berbasis bukti; hasilnya jadi input PROC-215/216 dan pelajaran untuk proses terkait.

**Contoh rantai (PROPOSED, ID contoh — bukan register nyata):** klausul-k3-manual-01 (1) → "kru wajib briefing HSE sebelum rigging" (2) → permit HSE + checklist (3) → PROC-09/PROC-203 (4) → SOP briefing lapangan (5) → workflow briefing event (6) → assignment kru ke event X (7) → record checklist terisi (8) → evidence checklist + foto briefing dengan timestamp/aktor (9) → sign-off event manager (10) → audit menemukan 1 event tanpa briefing (11) → NCR + CAPA pelatihan ulang (12) → audit ulang 3 event berikutnya lolos (13) → NCR closed dengan bukti (14).

**Status rantai:** keseluruhan = TARGET `NOT FOUND` di repository (audit Phase 0); implementasi Phase 17–21; acceptance minimum = 1 rantai penuh teruji (REQ-012, REQ-070, REQ-075).

---

# Bagian C — Sustainability KPI / data dictionary

## C.1 Struktur definisi KPI (field WAJIB — REQ-085)

| Field | Definisi & validasi |
|---|---|
| **KPI-ID** | ID stabil (KPI-01..); tidak didaur ulang |
| **Nama** | Nama metrik yang jelas & tak ambigu |
| **Kategori** | Salah satu: energy / fuel / transport / water / waste / material / supplier / accessibility / inclusion / community (plus GHG bila metodologi tersedia) |
| **Unit** | Satuan terukur; input tanpa satuan DITOLAK (REQ-085) |
| **Method / source** | Cara pengukuran & sumber data nyata; wajib spesifik (meteran, tagihan, log, record transaksi). Input tanpa sumber DITOLAK (REQ-085) |
| **Target** | **TBD owner (OD-106)** — tidak ada angka di dokumen ini |
| **Baseline** | **TBD owner (OD-106)** — tidak ada angka di dokumen ini |
| **Owner** | Penanggung jawab data & aksi; **final = keputusan owner (OD-106)**; usulan peran ditandai PROPOSED |
| **Reporting period** | Usulan: per event + agregat periodik organisasi; final = OD-106 |
| **Evidence link** | Wajib menunjuk evidence/record terkait (REQ-085, REQ-086) |
| **Flag measured/estimated** | Wajib: `measured` (pengukuran langsung) vs `estimated` (estimasi berbasis data aktivitas); label salah = data bermasalah |
| **Data quality** | Skala usulan (PROPOSED): **A** = pengukuran langsung/meteran; **B** = dokumen sumber (tagihan/nota/log); **C** = estimasi berbasis data aktivitas. Input C tanpa justifikasi ditandai review |
| **Improvement action** | Link ke aksi perbaikan (REQ-087, PROC-216) bila KPI di bawah/menyimpang dari target |
| **Status** | Semua KPI di bawah: **PROPOSED** |

## C.2 KPI kandidat (KPI-01..KPI-16) — semua status PROPOSED

> **Aturan keras:** kolom target & baseline = **TBD owner (OD-106)**; kalkulasi GHG = **menunggu OD-105** (REQ-086 melarang angka emisi tanpa metodologi terverifikasi). Tidak ada faktor emisi/angka yang dikarang di dokumen ini.

| ID | Nama | Kategori | Unit | Method / source (WAJIB sumber nyata) | Catatan flag & data quality |
|---|---|---|---|---|---|
| KPI-01 | Konsumsi listrik event | energy | kWh | Pembacaan meteran/tagihan listrik venue; bila tidak ada meteran terpisah: estimasi daya peralatan × jam operasi | Estimasi tanpa meteran wajib `estimated`, quality C |
| KPI-02 | Konsumsi listrik gudang/kantor operasional | energy | kWh | Tagihan listrik bulanan (dokumen sumber) | `measured` dari tagihan, quality B |
| KPI-03 | Konsumsi bahan bakar generator | fuel | liter | Log pengisian operator + bukti pembelian (nota) | `measured`, quality B |
| KPI-04 | Konsumsi bahan bakar kendaraan operasional | fuel | liter | Log BBM kendaraan + nota pengisian | `measured`, quality B |
| KPI-05 | Jarak tempuh perjalanan kru | transport | km | Log perjalanan/rute per penugasan | Bisa `measured` (odometer/app) atau `estimated` (rute peta); flag wajib |
| KPI-06 | Jarak tempuh kargo aset | transport | km | Log dispatch/pengiriman dari transaksi PROC-08 | Terhubung transaksi nyata; `measured`/`estimated` sesuai sumber |
| KPI-07 | Konsumsi air event | water | m³ | Meteran air venue / tagihan | Tanpa meteran = `estimated` quality C, wajib justifikasi |
| KPI-08 | Limbah terangkut per event | waste | kg | Dokumen timbangan / manifest vendor pengangkut | `measured`, quality B |
| KPI-09 | Rasio limbah terpilah/daur ulang | waste | % dari total limbah terangkut | Record pemilahan + bukti penyaluran pihak ketiga | Kualitas bergantung bukti vendor; flag per sumber |
| KPI-10 | Rasio pemakaian aset sewa/reuse vs pembelian baru | material | % | Data transaksi rental & procurement di platform (aset terpakai ulang ÷ total kebutuhan) | Otomatis dari data transaksi; `measured` quality A |
| KPI-11 | Penggunaan material single-use | material | unit | Record pembelian/pemakaian (inventory) | `measured`, quality B |
| KPI-12 | Cakupan evaluasi supplier | supplier | % supplier aktif terevaluasi | Record evaluasi supplier PROC-208 | Otomatis dari record; `measured` quality A |
| KPI-13 | Kepatuhan checklist aksesibilitas event | accessibility | % item checklist terpenuhi | Evidence checklist aksesibilitas per event (evidence workflow) | `measured` dari checklist terisi; quality B |
| KPI-14 | Akomodasi kebutuhan khusus tercatat & terpenuhi | inclusion | count | Form kebutuhan akomodasi + evidence pemenuhan | Definisi final "kebutuhan khusus" = keputusan owner (OD-106); sensitivitas privasi = OD-09 |
| KPI-15 | Jam kontribusi komunitas / aktivitas legacy | community | jam (dan/atau count aktivitas) | Record aktivitas komunitas + evidence dokumentasi | `measured`, quality B |
| KPI-16 | Emisi GHG tercatat | GHG | tCO₂e | **MENUNGGU OD-105** — hanya jika metodologi & faktor emisi terverifikasi diadopsi | Tanpa metodologi: input DITOLAK (REQ-086); sebelum keputusan = tidak ada data GHG sama sekali |

**Keterkaitan:** KPI-05/06 bersumber dari transaksi PROC-05/08; KPI-12 dari PROC-208; KPI-13 dari evidence workflow event; semua KPI di-report melalui PROC-202 dan di-review di PROC-215; aksi perbaikan lewat PROC-216 (REQ-087).

## C.3 Tata kelola data KPI

1. Input KPI tanpa satuan/sumber/metode ditolak server-side (REQ-085 acceptance).
2. Flag `measured` vs `estimated` wajib; data `estimated` tanpa justifikasi masuk antrian review (REQ-086).
3. Tidak ada angka target/baseline sampai owner menyetujui set KPI & angka (OD-106); dictionary ini adalah **masukan untuk OD-106**, bukan keputusannya.
4. Evidence link wajib; angka tanpa bukti tidak sah sebagai KPI terlaporkan.
5. Emisi GHG: sampai OD-105 diputuskan, platform tidak menampilkan/menyimpan angka tCO₂e apa pun.

---

# 5. Status & keterbukaan (ringkas)

| Item | Status |
|---|---|
| Seluruh PROC-01..13, ASM state machine, PROC-201..216, KPI-01..16 | PROPOSED/TARGET — belum ada implementasi (audit Phase 0: `NOT FOUND`) |
| Standar ISO (STD-01..STD-10) | NOT VERIFIED — BLOCKED; mapping klausul dilarang sebelum verifikasi (REQ-039, OD-08) |
| Mapping persona P-01..P-12 | Tercocokkan dengan register canonical `PERSONAS_AND_JOURNEYS.md` (workstream A) pada run ini; perubahan register berikutnya wajib disinkronkan ke sini |
| Target/baseline KPI | TBD owner (OD-106) |
| Metodologi GHG | Menunggu OD-105 |
| Konflik reservasi aset | Menunggu OD-107 |
| Kuota kru mini (ikut dihitung atau tidak) | Menunggu OD-05 |
| Offline workflow lapangan | Menunggu OD-07 |
| Keputusan baru dari dokumen ini | Tidak ada di file ini; kandidat milik `DOCUMENT_EVIDENCE_MODEL.md` (OD-140..OD-144) |
| Konflik dengan dokumen kontrol | Tidak ditemukan; MC §11 & ISO_IMS_BLUEPRINT §3 dipetakan apa adanya sebagai target |
