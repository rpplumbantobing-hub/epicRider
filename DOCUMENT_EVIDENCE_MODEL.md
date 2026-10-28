# DOCUMENT & EVIDENCE MODEL — epicRider

> **Referensi MC §N:** rujukan Master Control pada dokumen ini memakai penomoran era Phase 0/1 (MC-V1, §1–§15 — arsip: `audit/superseded/phase1-era-control/`). Interpretasi ke anchor kanonik aktif: `CONTROL_REFERENCE_CROSSWALK.md` (contoh: "MC §2" di sini = Produk & batas lisensi era MC-V1, BUKAN Entitlement taxonomy MC aktif; "MC §14" = anti-halusinasi → MC aktif §7). Substansi dokumen tidak diubah (aturan F-06).

**Status dokumen:** DESAIN/PROPOSED (Phase 1, artefak workstream C). Semua struktur di sini adalah **target state** (implementasi Phase 17–18, sebagian 20–21) — bukan kondisi repository saat ini (audit Phase 0: `NOT FOUND`).
**Sumber:** `MASTER_CONTROL.md` §10 (controlled document & evidence library, audit traceability), §5 (immutability core flow); prompt Phase 1 workstream I; `REQUIREMENTS.md` (REQ-027, REQ-042..044, REQ-053, REQ-078..084); `OPEN_DECISIONS.md` (OD-09, OD-103, OD-104, OD-110, OD-111); `ISO_IMS_BLUEPRINT.md` §3 (hirarki & chain); `PROCESS_MAP.md` (PROC-xxx, KPI-xx); persona P-01..P-12 = register canonical `PERSONAS_AND_JOURNEYS.md` (workstream A).
**Batas klaim:** Tidak ada klaim kekuatan hukum tanda tangan (OD-103). Periode retensi TIDAK didefinisikan angkanya (OD-104). Klasifikasi & ACL di dokumen ini = **usulan PROPOSED**; final = keputusan owner.

---

## 1. Hirarki dokumen configurable (MC §10, REQ-078)

Hirarki default (dapat disesuaikan per organisasi — "configurable"):

**Policy → Manual → Process Map/Process → Procedure/SOP → Work Instruction → Form/Checklist → Record/Evidence → Report/Review Output**

Relasi parent→child selalu menurun dalam hirarki; dokumen anak menunjuk dokumen induk via `parent_doc_id`; kustomisasi organisasi TIDAK boleh memutus rantai traceability (lihat §1.9).

### 1.1 Definisi per level

| Level | Definisi | Contoh konten epicRider | Dibuat oleh (usulan, PROPOSED) | Parent | Child |
|---|---|---|---|---|---|
| D1 **Policy** | Pernyataan arah & komitmen pimpinan tertinggi; "apa & mengapa", tanpa detail langkah | Kebijakan mutu layanan event; kebijakan K3 lapangan; kebijakan keamanan informasi workspace | Owner workspace (P-01/P-02), didukung IMS/Sustainability manager (P-10) | — (root) | Manual |
| D2 **Manual** | Dokumen penghubung policy→proses; menjelaskan sistem manajemen, ruang lingkup, interaksi proses | Manual operasi rental & event; manual IMS organisasi | IMS lead / domain architect dengan owner | Policy | Process Map/Process |
| D3 **Process Map / Process** | Representasi proses, pemicu, input/output, aktor, transisi | Peta PROC-01..13 & PROC-201..216 (konten sumber: `PROCESS_MAP.md`); proses spesifik satu organisasi | Domain architect / event manager (P-04) | Manual | Procedure/SOP |
| D4 **Procedure / SOP** | Cara pelaksanaan proses: siapa, kapan, apa standarnya | SOP inspeksi & readiness aset (PROC-07); SOP dispatch & check-out (PROC-08); SOP penanganan komplain (PROC-210) | Pemilik proses (P-04 event / P-05 asset / P-06 finance, sesuai proses) | Process | Work Instruction, Form/Checklist |
| D5 **Work Instruction** | Instruksi teknis rinci langkah demi langkah untuk satu tugas | WI scan QR check-out; WI upload foto kondisi aset; WI pengisian checklist HSE briefing | Operator ahli / asset manager (P-05) | Procedure | Form/Checklist |
| D6 **Form / Checklist** | Template terstruktur untuk pengumpulan data saat eksekusi | Checklist readiness aset; form HSE briefing; checklist kondisi check-in/out; checklist aksesibilitas event | Pemilik proses | Procedure / WI | Record/Evidence (instansinya) |
| D7 **Record / Evidence** | Instansi terisi dari form/checklist + bukti pendukung, terikat transaksi nyata, terkunci setelah sign-off | Hasil checklist readiness event X + foto; bukti check-out aset A-123 (CONTOH ID) | Aktor pelaksana via workflow (kru P-03, dsb.) | Form/Checklist | Report (agregat) |
| D8 **Report / Review Output** | Output analisis/review atas records & evidence | Laporan management review (PROC-215); laporan audit (PROC-213); rekap KPI sustainability (Bagian C `PROCESS_MAP.md`) | Pemilik proses / auditor (P-09) / IMS/Sustainability manager (P-10) | Manual/Process (konteks) | Action items → NCR/CAPA (PROC-214) |

### 1.2 Aturan configurability
1. Organisasi dapat menambah/menyederhanakan level tanpa mengubah kode (REQ-078) — mis. organisasi kecil menggabungkan Manual ke Policy, atau WI ke SOP.
2. Batas minimum (PROPOSED): tetap harus ada level proses, form, record, report agar rantai Process→…→Report terbentuk; detail batas = kandidat **OD-144**.
3. Level default D1..D8 tersedia sebagai struktur awal platform.
4. Perubahan struktur hirarki teraudit; dokumen yang sudah effective tidak ikut tergeser makna levelnya (tipe disimpan per versi).

---

## 2. Metadata model (MC §10, REQ-079)

Setiap dokumen/record **sekurangnya** memiliki field berikut. Semua field wajib tervalidasi; histori perubahan lengkap (REQ-079 acceptance).

| Field | Definisi | Validasi / aturan |
|---|---|---|
| **ID (doc_id)** | Identitas stabil dokumen; versi berbeda dari dokumen yang sama berbagi ID | Unik per workspace/organisasi; tidak didaur ulang; tidak boleh kosong |
| **Judul** | Nama dokumen | Wajib; unik dalam level+tipe disarankan (bukan dipaksakan) |
| **Tipe** | Level hirarki: D1..D8 atau level kustom organisasi | Enum dari konfigurasi hirarki (§1.2); tidak boleh tipe yang tak terdaftar |
| **Pemilik (owner)** | Peran/user yang bertanggung jawab atas isi & pemeliharaan | Wajib terisi sebelum status `in-review`; harus member aktif workspace |
| **Approver** | Pihak yang berwenang menyetujui | Wajib ≥1 sebelum `in-review`; otoritas approve mengikuti matriks (kandidat **OD-141**: apakah kelas tertentu butuh dual-approval) |
| **Versi / revisi** | Nomor versi monoton per perubahan konten | Naik otomatis pada setiap perubahan approved; versi lama tidak bisa ditimpa |
| **Status** | draft / in-review / approved / effective / superseded / obsolete / archived / disposed | Hanya transisi §4 yang sah; transisi lain ditolak server-side |
| **Effective date** | Tanggal dokumen mulai berlaku | Wajib sebelum `effective`; tidak boleh lebih awal dari tanggal approval |
| **Review date** | Tanggal review berkala berikutnya | Wajib sebelum `effective`; tidak boleh ≤ effective date (usulan); memicu reminder (REQ-080) |
| **Klasifikasi** | Label kebutuhan proteksi | Salah satu skema §3 (PROPOSED); wajib sebelum `effective` |
| **ACL** | Daftar principal (user/role) × permission (view/download/edit/approve/manage-ACL) | Ditegakkan server-side (REQ-082); perubahan ACL teraudit |
| **Retensi** | Kelas retensi untuk disposition | Wajib terisi sebelum `effective`; **angka periode = OD-104 (TBD)** — dokumen ini hanya menyiapkan kelas (§6) |
| **Relasi proses** | Tautan ke PROC-xxx, kontrol, workspace/event terkait | Minimal 1 proses untuk dokumen D3..D8 (usulan); menjadikan dokumen terhubung ke transaksi nyata (MC §5) |
| **Histori (version history)** | Riwayat versi: siapa mengubah apa, kapan, alasannya | Append-only; menampilkan diff bila praktis (REQ-042 "version comparison bila praktis") |
| **Audit trail** | Log semua aksi metadata & akses | Append-only; aktor+aksi+waktu+konteks+hasil; tidak bisa diedit/dihapus via API |

**Aturan validasi lintas-field (PROPOSED):** transisi status menuntut kelengkapan berbeda — mis. `draft→in-review` butuh pemilik+approver+tipe; `approved→effective` butuh effective date+review date+klasifikasi+retensi+relasi proses. Validasi gagal = transisi ditolak dengan pesan jelas.

---

## 3. Klasifikasi & ACL — **usulan PROPOSED, final = keputusan owner (kandidat OD-140)**

### 3.1 Skema klasifikasi (PROPOSED)
| Label | Usulan makna | Contoh epicRider |
|---|---|---|
| `public` | Boleh dipublikasikan ke luar organisasi | Brochure/media kit yang diperuntukkan publik |
| `internal` | Default untuk seluruh member workspace | SOP, checklist, rundown template |
| `confidential` | Terbatas role tertentu; dampak bisnis bila bocor | Data harga/kontrak, daftar supplier, data pelanggan CRM |
| `restricted` | Perlu akun persetujuan khusus & akses minimal | Data audit, temuan NCR, dokumen dengan metadata sensitif |

Klasifikasi tidak menggantikan permission: klasifikasi = label kebutuhan proteksi (menentukan default ACL & retensi); ACL = enforcement nyata per dokumen.

### 3.2 Model permission (PROPOSED)
| Permission | Arti | Catatan |
|---|---|---|
| `view` | Lihat metadata + preview isi | Setiap view tercatat di access log (REQ-082) |
| `download` | Unduh salinan | Terkontrol & terlog (MC §10 "download terkontrol") |
| `edit` | Buat/mutakan draft versi baru | Tidak berlaku pada record `effective`/locked (hanya amendment, §6) |
| `approve` | Menyetujui/menolak versi | Harus sesuai matriks otoritas (kandidat OD-141) |
| `manage-ACL` | Ubah permission/klasifikasi | Aksi berisiko: konfirmasi + audit; tidak boleh dipegang bersama `edit` oleh orang yang sama pada dokumen yang sama (segregation, usulan) |

Aturan lintas-cut (PROPOSED):
1. ACL ditegakkan **server-side** pada API, bukan hanya disembunyikan di UI (MC §5, REQ-024/REQ-082).
2. Auditor (P-09) hanya `view` (+`download` bila diizinkan) — scoped & time-bound (§7).
3. Dokumen berklasifikasi `restricted` tidak boleh muncul di hasil pencarian bagi yang tak berhak (metadata ikut dilindungi).
4. Konflik klasifikasi vs lisensi tier: fitur library penuh = ISOrider; entitlemen tetap diperiksa (REQ-024).

---

## 4. Lifecycle state dokumen & aturan transisi (REQ-080)

```
draft → in-review → approved → effective → superseded → archived → disposed
                        ↑           └──────→ obsolete ──↗
                        └── (reject/rework: kembali ke draft, dengan catatan)
```

| Transisi | Pemicu | Aturan & guard |
|---|---|---|
| `draft → in-review` | Pemilik mengajukan | Metadata minimum lengkap (pemilik, approver, tipe); ajukan teraudit |
| `in-review → approved` | Keputusan approver | Approver ≠ penulis terakhir versi (segregation, usulan); penolakan kembali ke `draft` **dengan catatan wajib** |
| `approved → effective` | Tiba effective date (otomatis) | Field wajib lengkap (klasifikasi, retensi, review date, relasi proses); bila ada versi effective lain dari ID sama → versi lama menjadi `superseded` |
| `effective → superseded` | Versi baru effective | **Versi lama tidak bisa dipakai lagi** (REQ-080 test); tetap terbaca untuk histori/audit |
| `effective → obsolete` | Penarikan (withdraw) | Alasan wajib; dokumen berhenti berlaku tanpa pengganti |
| `superseded/obsolete → archived` | Otomatis/oleh pemilik | Masuk antrian retensi (§6) |
| `archived → disposed` | Akhir masa retensi | Eksekusi teraudit; **periode = OD-104**; bila ada kewajiban hukum (hold) → tahan (detail legal = OD-09) |

**Reminder (REQ-080):** reminder terjadwal untuk (a) mendekati review date, (b) effective date yang dijadwalkan, (c) dokumen melewati review date tanpa review (escalate ke pemilik, lalu owner). Reminder hanya notifikasi — perubahan status tetap butuh aksi berwenang.

Semua transisi: ditolak bila tidak sah; setiap transisi teraudit (aktor, waktu, alasan).

---

## 5. Evidence workflow detail (MC §10, REQ-043, REQ-083)

Alur eksekusi evidence end-to-end:

1. **Inisiasi** — checklist/form (D6) dipilih dan dijalankan **dalam konteks transaksi nyata**: event, aset, penugasan, workspace. Evidence tanpa konteks transaksi tidak sah (MC §5: terhubung ke transaksi/proses sebenarnya).
2. **Pengisian hasil** — field terstruktur diisi (nilai, pilihan, hasil ukur). Validasi tipe field server-side.
3. **Catatan** — teks bebas opsional untuk konteks tambahan.
4. **Upload bukti** — foto/video/file; tipe & ukuran sesuai kebijakan platform; setiap berkas terikat evidence-nya.
5. **Metadata otomatis** — timestamp **server**, aktor **terautentikasi**, konteks (workspace/event/objek/transaksi), **versi form** yang dipakai. Metadata sensitif & lokasi HANYA dikumpulkan bila perlu, transparan, sesuai kebijakan privasi (MC §10; kewajiban hukum = OD-09; keputusan cakupan capture lokasi = kandidat **OD-142**).
6. **Submit** — evidence masuk status menunggu review; pengirim tidak bisa mengubah substansi tanpa rework (riwayat terjaga).
7. **Review** — reviewer berwenang memeriksa kelengkapan & keabsahan: setuju → lanjut sign-off; tolak → **rework loop** (kembali ke draft dengan catatan wajib; versi baru dibuat; riwayat submit-reject tetap terbaca).
8. **Sign-off** — mengikat minimal: **aktor terautentikasi + role + waktu (server) + konteks (workspace/event/objek) + versi dokumen/evidence yang disetujui** (MC §10). Bentuk teknis sign-off (click-to-sign vs e-signature tersertifikasi) = **OD-103**; sampai diputuskan & divalidasi ahli, platform tidak mengklaim kekuatan hukum apa pun.
9. **Locked** — setelah sign-off, record/evidence **immutable**: tidak bisa diedit/dihapus via API (REQ-027, REQ-083 acceptance test). Koreksi hanya via **amendment** (§6).
10. **Terhubung** — evidence terkunci tampil di report/dossier event (PROC-13), dapat dirujuk KPI (Bagian C `PROCESS_MAP.md`), audit (PROC-213), dan NCR/CAPA (PROC-214).

**State evidence (usulan, PROPOSED):** `draft → submitted → in-review → (rework → draft) → signed-off → locked → (amendment → locked v2)`.

---

## 6. Immutability, amendment, retention, access logs

### 6.1 Immutability & amendment
1. Record/evidence/effective document yang sudah approved **tidak boleh dihapus atau diubah diam-diam** (MC §5, REQ-027).
2. Koreksi = **amendment**: membuat versi baru yang menunjuk versi lama; nilai lama tetap terbaca; alasan koreksi wajib; audit trail menautkan keduanya.
3. Penghapusan fisik hanya via disposition (§6.2) dan tetap teraudit (tombstone record).
4. Audit trail & access log bersifat append-only.

### 6.2 Retention & disposition — **periode menunggu OD-104**
1. Setiap dokumen/record membawa **kelas retensi** (field metadata §2); kelas diusulkan terikat tipe dokumen & klasifikasi (tabel kelas = PROPOSED di dokumen ini, tanpa angka).
2. **Angka periode retensi & aturan disposisi = keputusan owner + IMS lead (OD-104)** — dokumen ini sengaja tidak memuat satu angka pun.
3. Mekanisme: dokumen melewati masa retensi → antrian disposition → eksekusi (hapus/anonimkan/arsip permanen sesuai keputusan) → eksekusi teraudit dengan tombstone.
4. Legal hold: bila ada kewajiban hukum/kasus berjalan, disposisi ditahan — identifikasi kewajiban = OD-09 (ahli), jangan menyimpulkan sendiri.

### 6.3 Access logs
- Setiap `view`, `download`, `edit`, `approve`, perubahan ACL/klasifikasi tercatat: aktor, waktu (server), objek, aksi, hasil (sukses/ditolak), konteks.
- Log dilindungi dari modifikasi; akses ke log itu sendiri terbatas (SECURITY.md, REQ-092).
- Log tidak memuat secret; metadata sensitif dilindungi sesuai klasifikasi.

---

## 7. Auditor view & export (REQ-044, REQ-084, REQ-053, OD-110, OD-111)

1. Auditor (P-09) mendapat akses **read-only**, **scoped** (workspace/dokumen/evidence tertentu), **time-bound** dengan expiry otomatis (REQ-044, REQ-053).
2. Ekspansi scope saat akses berjalan membutuhkan persetujuan terpisah (REQ-053 acceptance).
3. Export terkendali (REQ-084): auditor dapat mengekspor **hanya** yang berada dalam scope; setiap export tercatat di audit trail (siapa, kapan, apa, format).
4. Parameter akses auditor (scope default, durasi maksimum, proses NDA) = **OD-110**; format & scope import/export umum = **OD-111**. Format paket export auditor (bundle, watermark/penanda, manifest isi) = kandidat **OD-143**.
5. Audit Mode (Phase 18) menyajikan rantai bukti sesuai traceability chain (`ISO_IMS_BLUEPRINT.md` §3) tanpa memberi hak tulis.

---

## 8. Signature & legal review — **BELUM DIPUTUSKAN (OD-103)**

1. Pilihan teknologi sign-off: (a) click-to-sign dengan binding audit (aktor+role+waktu+konteks+versi), atau (b) e-signature vendor tersertifikasi untuk dokumen legal — **OD-103, status OPEN**.
2. Sampai keputusan + review hukum selesai (terkait OD-09), **platform tidak boleh mengklaim** bahwa sign-off/evidence memiliki kekuatan hukum, keabsahan kontrak, atau padanan tanda tangan basah (MC §10: "jangan mengklaim semua klik adalah tanda tangan tersertifikasi").
3. Binding audit tetap direkam apa pun keputusannya — binding adalah fakta teknis; kekuatan hukum adalah klaim terpisah yang menunggu validasi.
4. Kebutuhan dokumen legal (mis. kontrak bertanda tangan) berada di PROC-03 — sampai OD-103/OD-09 selesai, dokumen semacam itu tetap dibawa jalur di luar klaim platform.

---

## 9. Cross-links & contoh rantai end-to-end

### 9.1 Graf cross-link (semua PROPOSED)
- **Dokumen ↔ Proses:** field `relasi proses` metadata menunjuk PROC-xxx (`PROCESS_MAP.md`); SOP muncul di kartu proses terkait.
- **Proses ↔ Transaksi:** setiap eksekusi proses menghasilkan transaksi (assignment, check-out, submit checklist) yang tersimpan sebagai record.
- **Transaksi ↔ Event/Workspace:** transaksi selalu bercabang konteks workspace + event (isolasi tenant, REQ-023; event assignment, REQ-050).
- **Record/Evidence ↔ Dokumen:** instansi evidence menyimpan `form_version` dari dokumen D6 yang dipakai — versi superseded terdeteksi otomatis.
- **Report ↔ Semua:** report (D8) merujuk records/evidence; temuan report → NCR/CAPA (PROC-214) → effectiveness → closure.

### 9.2 Contoh 1 rantai end-to-end (semua ID bawah = CONTOH, bukan register nyata)

Kasus: "Readiness aset sound system untuk event X".

1. **Policy (D1):** kebijakan "aset wajib siap & aman sebelum dipakai event" — owner P-02 (workspace owner; P-01 bila solo), klasifikasi internal (usulan).
2. **Manual (D2):** manual operasi rental — merujuk PROC-07/PROC-08 (`PROCESS_MAP.md`).
3. **Process (D3):** PROC-07 Asset reservation/inspection/readiness — kontrol = readiness gate (REQ-046, Phase 15).
4. **Procedure (D4):** SOP-CONTOH-01 inspeksi & readiness aset audio — dibuat P-05 (asset manager), approver P-02, status effective.
5. **Work Instruction (D5):** WI-CONTOH-11 langkah pemeriksaan kabel & rigging.
6. **Form (D6):** FRM-CONTOH-READINESS-01 checklist readiness (versi 3, effective).
7. **Transaction:** reservasi aset CONTOH-A-123 untuk event X (ASM-T03), lalu check-out (ASM-T04) — transaksi nyata di workspace tenant.
8. **Record/Evidence (D7):** EV-CONTOH-456 = checklist terisi oleh kru (P-03) + 4 foto kondisi + timestamp server + konteks event X + `form_version = FRM-...-01 v3`.
9. **Review & Sign-off:** reviewer menolak 1× (foto kurang jelas) → rework → versi 2 → sign-off P-05 dengan binding aktor+role+waktu+konteks+versi → **locked**.
10. **Report (D8):** laporan readiness event X merujuk EV-CONTOH-456; hasil masuk dossier event (PROC-13, Phase 21).
11. **Cabang bila gagal:** gate readiness gagal → aset ke ASM-S09 maintenance (ASM-T08) → bila terindikasi pelanggaran prosedur → finding → NCR/CAPA (PROC-214) → effectiveness check → closure → masuk PROC-215/216.
12. **Auditor:** P-09 dengan akses scoped time-bound (OD-110) melihat rantai 1–10 read-only; export tercatat (REQ-084).

Rantai ini adalah penerapan literal traceability chain MC §10: *requirement/clause → obligation/risk → control → process → procedure → workflow → transaction → record → evidence → approval/signature → finding → NCR/CAPA → effectiveness → closure*.

---

## 10. Kandidat keputusan baru (range WS-C: OD-140..OD-149) — status OPEN / OWNER APPROVAL REQUIRED

| ID | Keputusan | Opsi | Dampak bila tertunda | Rekomendasi (bukan keputusan) | Pemutus |
|---|---|---|---|---|---|
| OD-140 | Skema klasifikasi dokumen final & default per tipe (usulan: public/internal/confidential/restricted, default `internal`) | (a) adopsi 4-label usulan; (b) skema lain/sederhana (mis. 2-label); (c) per-workspace configurable penuh | ACL & retensi default tidak bisa dikunci sebelum Phase 17 | (a) mulai 4-label, mapping default per level D1..D8 diterbitkan bersama keputusan | Owner |
| OD-141 | Matriks otoritas approval dokumen & kebutuhan dual-control (approver ≠ penulis; kelas Policy/Manual butuh >1 approver?) | (a) single-approver semua; (b) dual-approval untuk D1/D2, single lainnya; (c) matriks per organisasi | Transisi `in-review→approved` & segregation tidak bisa difinalisasi | (b) rilis awal | Owner |
| OD-142 | Kebijakan capture metadata sensitif/lokasi pada evidence lapangan (wajib / opsional default-off / dilarang) | (a) default-off, on per jenis checklist tertentu; (b) wajib untuk inspeksi aset; (c) dilarang sampai review hukum | Field metadata evidence & UX izin (Phase 18) tertunda; risiko kepatuhan privasi (OD-09) | (a) default-off + transparansi ke user; bila (b), wajib review hukum OD-09 dulu | Owner + ahli hukum |
| OD-143 | Format & kontrol paket export auditor (bundle ZIP/PDF, manifest, watermark, batas ukuran) | (a) ZIP+manifest CSV; (b) PDF ber-watermark per akses; (c) keduanya per pilihan | REQ-084 detail implementasi Phase 18 tertunda | (a) + log export lengkap; selaras OD-111 | Owner + eng lead |
| OD-144 | Granularitas minimum hirarki dokumen configurable (bolehkah level digabung/dilewati; level minimum agar traceability tetap terbentuk) | (a) bebas selama rantai process→form→record→report utuh; (b) D1..D8 wajib utuh untuk ISOrider, bebas untuk tier bawah | Template default organisasi (Phase 17) & validasi configurability (REQ-078) tertunda | (a) dengan validasi otomatis rantai minimum | Owner + IMS lead |

Aturan: keputusan ini TIDAK boleh diputuskan engineer/agent; setelah owner menjawab, catat ADR di `DECISIONS.md` dan ubah status baris menjadi `CLOSED — lihat ADR-xxx` (mengikuti mekanisme `OPEN_DECISIONS.md`).

---

## 11. Status & keterbukaan (ringkas)

| Item | Status |
|---|---|
| Hirarki D1..D8, metadata model, ACL, lifecycle, evidence workflow | PROPOSED/TARGET — implementasi Phase 17–18 |
| Skema klasifikasi & default | PROPOSED → kandidat OD-140 |
| Matriks otoritas approval | PROPOSED → kandidat OD-141 |
| Metadata lokasi/sensitif evidence | OPEN → kandidat OD-142 (+OD-09) |
| Format export auditor | OPEN → kandidat OD-143 (+OD-110/OD-111) |
| Granularitas hirarki minimum | OPEN → kandidat OD-144 |
| Periode retensi & disposisi | TBD owner (OD-104) — nol angka di dokumen ini |
| Kekuatan hukum sign-off | OPEN (OD-103) — tidak ada klaim legal |
| Kewajiban hukum/privasi lokal | OPEN (OD-09) — butuh ahli |
| Parameter akses auditor | OPEN (OD-110) |
| Teks standar ISO | Nol kutipan; hanya referensi metadata (REQ-040) |
| Konflik dengan dokumen kontrol | Tidak ditemukan; MC §10 dipetakan apa adanya; dokumen ini adalah masukan yang ditunggu oleh OD-104 (kelas dokumen) |
