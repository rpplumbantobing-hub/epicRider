# TRACEABILITY MATRIX — epicRider

> **Referensi MC §N:** rujukan Master Control pada dokumen ini memakai penomoran era Phase 0/1 (MC-V1, §1–§15 — arsip: `audit/superseded/phase1-era-control/`). Interpretasi ke anchor kanonik aktif: `CONTROL_REFERENCE_CROSSWALK.md`. Substansi dokumen tidak diubah (aturan F-06).

**Status dokumen:** TRACED baseline hasil Task 1-b (Phase 1, WS-B). Dokumentasi saja; tidak ada kode/schema/config yang diubah.
**Sumber ID:** `REQUIREMENTS.md` (REQ-001..REQ-100; tidak ada REQ baru dibuat). Persona P-01..P-12 sesuai daftar tetap. Use case: `USE_CASES.md` (UC-1001..UC-9003, 55 UC). Phase mengikuti kolom Phase `REQUIREMENTS.md` / `ROADMAP.md`.
**Hitung awal dari REQUIREMENTS.md (terverifikasi via grep):** Must = **70**, Should = **26**, Could = **4** (total 100).
**Definisi coverage status:**
- `TRACED` — ada use case utama yang mewakili flow requirement secara utuh.
- `PARTIAL` — requirement tersentuh use case tetapi bersifat cross-cutting/quality gate, atau terhalang keputusan terbuka (OD) sehingga flow penuh belum bisa didefinisikan.
- `NOT TRACED` — belum ada use case; alasan dicantumkan.

| REQ ID | Persona(s) | Use case(s) (UC-xxxx) | Acceptance test idea (terukur) | Planned phase | Coverage status |
|---|---|---|---|---|---|
| REQ-001 | P-01..P-12 (semua) | UC-2001, UC-3001 | Login dari desktop/tablet/mobile pada 1 domain model; upgrade tier tanpa DB paralel (cek schema tunggal) | 3–26 | PARTIAL — cross-cutting platform; UC hanya menyentuh bagian |
| REQ-002 | P-01, P-02 | UC-2001, UC-5006 | Workspace mini berisi data di-upgrade ke max; 100% data lama terakses tanpa migrasi manual | 5 | TRACED |
| REQ-003 | P-02 | UC-2002, UC-2007 | Owner baru menavigasi 5 halaman (Home/Event/Asset/Team/Profile) end-to-end dalam 1 workspace | 6 | TRACED |
| REQ-004 | P-02, P-07 | UC-2003 | Publish rider tanpa event ditolak server-side; draft tanpa event tersimpan | 7 | TRACED |
| REQ-005 | P-02, P-04 | UC-2004 | Media kit dibuat dari template & wajib terkait event; simpan tanpa event ditolak | 9 | TRACED |
| REQ-006 | P-05, P-07 | UC-2005 | CRUD aset + buat set template berisi ≥2 aset; relasi set↔aset tampil konsisten | 8 | TRACED |
| REQ-007 | P-03 | UC-1006 | Kru dengan ≥2 penugasan melihat indikator konteks; setelah switch, akses data event lain ditolak (test isolasi) | 6, 10 | TRACED |
| REQ-008 | P-03, P-04 | UC-2006 | Non-anggota event ditolak 403 pada chat/rundown/media kit/laporan; anggota menjalankan 4 fungsi | 10 | TRACED |
| REQ-009 | P-02 | UC-1005, UC-2007 | Tambah kru melebihi kuota (per OD-05, batas MC 5 kru) ditolak server-side dengan pesan jelas | 5 | TRACED |
| REQ-010 | P-07, P-08 | UC-5001 | Call API Equipment Store dengan sesi maxRider/ISOrider/hiRider → denial teraudit (bukan menu tersembunyi) | 11 | TRACED |
| REQ-011 | P-02 (maxRider) | UC-3001..3008, UC-4001..4005 | Suite regresi miniRider lulus pada build maxRider; Equipment Store absent & API blocked | 12–15 | TRACED — diwakili kumpulan UC maxRider |
| REQ-012 | P-10 | UC-7005, UC-7008, UC-7009 | 1 siklus Process→Control→Workflow→Transaction→Evidence→Report dijalankan end-to-end di ISOrider | 17–21 | TRACED |
| REQ-013 | P-03, P-02 | UC-6003, UC-6004 | Setelah lamaran accepted, permission workspace pelamar tetap tanpa akses sampai di-invite (test server-side) | 16 | TRACED |
| REQ-014 | P-03, P-02 | UC-6002 | Rekrutmen ditutup → lamaran baru ditolak; data lamaran lama tetap terbaca | 16 | TRACED |
| REQ-015 | P-12 (pengunjung) | UC-5003 (parsial) | Semua CTA landing mengarah ke aksi nyata; review anti-tombol-palsu = 0 temuan | 22 | PARTIAL — hanya sisi login Developer Portal tercakup; flow konten/download landing belum ada UC |
| REQ-016 | P-07 | UC-5003 | Non-developer login portal ditolak; setiap perubahan katalog menghasilkan entri audit (aktor+timestamp) | 22 | TRACED |
| REQ-017 | P-08 | UC-5004 | Kirim tanpa pratinjau penerima mustahil; kirim ganda id sama → 1 pesan; audit lengkap | 22 | TRACED |
| REQ-018 | P-02 | UC-5006 | Extension seat +10 di-apply → kuota naik sesuai lisensi (setelah OD-06 diputuskan) | 5, 23 | PARTIAL — katalog extension ada di UC, detail komersial menunggu OD-06 |
| REQ-019 | P-01..P-12 | UC-2007, UC-3003 | 3 layar kunci lulus responsive check pada ≥1280 / 768–1024 / 360–430 tanpa kerusakan layout | 6+ | PARTIAL — quality gate lintas layar; UC hanya sampel |
| REQ-020 | P-07 (eng) | UC-3003 | Klien mobile memanggil API sama tanpa logika otorisasi lokal (code review + contract test lulus) | 2, 6 | PARTIAL — constraint arsitektur; tereksekusi lewat UC-3003 & contract test |
| REQ-021 | P-01..P-12 | UC-1001 | OTP replay ditolak; token expired ditolak; rate limit aktif; audit event per percobaan tercatat | 4 | TRACED |
| REQ-022 | P-01..P-12 | UC-1002 | Token Google dengan signature/audience invalid ditolak; account-linking tidak bisa dibajak (test) | 4 | TRACED |
| REQ-023 | P-08 | UC-2001, UC-9001 | User workspace A mencoba akses resource workspace B → 403 pada 100% endpoint CRUD (test matrix) | 2, 4 | TRACED |
| REQ-024 | P-08 | UC-5001, UC-5006, UC-3001 | Endpoint tier-fitur diakses akun tier lebih rendah → denial teraudit; sembunyikan menu tidak mengubah hasil | 5 | TRACED |
| REQ-025 | P-08 | UC-1005, UC-1007 | 1 user = owner WS-A + kru WS-B + auditor temporer WS-C tanpa konflik role | 2, 4 | TRACED |
| REQ-026 | P-08 | UC-1005, UC-1006, UC-2002, UC-3008 | Matriks aktor×objek×aksi×konteks×status: 100% kasus uji sesuai kebijakan; perubahan lisensi mengubah akses | 4, 5 | TRACED |
| REQ-027 | P-10, P-06 | UC-7005, UC-7006, UC-4002 | PUT/DELETE pada record approved → 403; amendment menambah versi + entri audit | 17, 18 | TRACED |
| REQ-028 | P-01..P-12 | UC-1001 (representatif) | Scan i18n layar baru = 0 string hard-coded; locale ID lengkap sejak fitur pertama | 3+ | PARTIAL — quality gate global, tidak diwakili satu UC |
| REQ-029 | P-08 (eng) | — | Setiap schema change punya migration ter-review; `db push --accept-data-loss` tidak dipakai di env ber-data | 2+ | NOT TRACED — constraint rekayasa/proses, bukan flow pengguna; dikontrol gate ADR/review migration |
| REQ-030 | P-01, P-07, P-08 | UC-5001, UC-5006 | Akses silang antar dua store (data/API/role) ditolak pada 100% kasus uji | 11, 22 | TRACED |
| REQ-031 | P-07, P-08 | UC-5003, UC-5002 | Role developer mencoba ubah billing/broadcast global → 403 teraudit | 22 | TRACED |
| REQ-032 | P-01..P-12 | UC-3008, UC-1005 (representatif) | Semua aksi berisiko menampilkan konfirmasi (test UI); design review per fase tercatat | 6+ | PARTIAL — gate lintas layar per UX_UI_STANDARD |
| REQ-033 | P-01..P-12 | UC-2006 (representatif) | Audit a11y layar kunci: 0 pelanggaran automated + keyboard manual lulus | 6+ | PARTIAL — gate lintas layar |
| REQ-034 | P-01..P-12 | UC-2006, UC-3003 | Checklist state (loading/empty/error/success/permission/offline/stale) per layar penting = 100% terimplementasi & teruji | 6+ | PARTIAL — gate lintas layar; failure flows UC memuat state ini |
| REQ-035 | P-01..P-12 | UC-2007 (representatif) | Review anti-mockup per fase = 0 temuan; data demo selalu berlabel | 6+ | PARTIAL — gate lintas layar |
| REQ-036 | P-05, P-03 | UC-3002, UC-3003 | Alur generate→print→scan→lookup→check-out/in lulus end-to-end di web & mobile | 13 | TRACED |
| REQ-037 | P-03 | UC-3003, UC-2006 | Dokumen evaluasi per fitur lapangan ada; keputusan mitigasi (cache/retry) tercatat | 13, 23 | PARTIAL — evaluasi menunggu OD-07; UC menampung conditional behavior |
| REQ-038 | P-03 | — | Aksi offline disinkronkan; permission dicek ulang server; konflik tampil ke user | 13, 24 | NOT TRACED — menunggu keputusan strategi offline (OD-07); desain belum ada |
| REQ-039 | P-10 | UC-7011 | STANDARD_REGISTER berisi ≥1 standar dengan verified date; 0 teks verbatim | 17 | TRACED |
| REQ-040 | P-10 | UC-7011 | Scan konten aplikasi = 0 teks standar verbatim; referensi hanya metadata | 17 | TRACED |
| REQ-041 | P-04, P-10 | UC-8001, UC-8002 | Setiap metrik sustainability punya sumber/satuan/metode/periode; input tanpa itu ditolak | 19 | TRACED |
| REQ-042 | P-10 | UC-7001, UC-7004 | ≥1 dokumen per tingkat hirarki lulus alur library end-to-end (search→preview→approval→tautan proses) | 17, 18 | TRACED |
| REQ-043 | P-03, P-10 | UC-7005 | Alur evidence penuh teruji; locked record menolak edit; amendment menambah versi | 18 | TRACED |
| REQ-044 | P-09 | UC-1007, UC-7007 | Akses auditor kedaluwarsa otomatis; percobaan tulis ditolak; scope terbatas yang ditetapkan | 18 | TRACED |
| REQ-045 | P-05 | UC-3001, UC-3004, UC-3008 | Setiap tahap lifecycle punya status + audit trail; KPI utilization/downtime dihitung dari data transaksi nyata | 13 | TRACED |
| REQ-046 | P-06, P-02 | UC-4001..4005, UC-3004 | Modul operasi sesuai scope teruji; dossier menghubungkan transaksi→bukti | 12–15 | TRACED |
| REQ-047 | P-01..P-12 | UC-1003 | Recovery via fallback tidak bisa dipakai melewati verifikasi; akun tetap terkontrol pemilik sah | 4 | TRACED |
| REQ-048 | P-01..P-12 | UC-1004 | Revoke device → request berikutnya 401; sesi kedaluwarsa ditolak | 4 | TRACED |
| REQ-049 | P-02, P-03 | UC-1005 | Setiap transisi membership (invite/accept/suspend/remove/leave) mengubah akses efektif pada request berikutnya | 4 | TRACED |
| REQ-050 | P-04, P-03 | UC-1006, UC-2002 | Member tanpa event assignment → akses data event ditolak (test matrix) | 4, 6 | TRACED |
| REQ-051 | P-02, P-03 | UC-1005 | Link undangan bekas/kedaluwarsa ditolak; undangan tidak bisa mengubah role tanpa otorisasi | 4 | TRACED |
| REQ-052 | P-07, P-08 | UC-5003 | Cross-role akses (developer↔workspace role↔broadcast) ditolak pada matriks role | 4, 22 | TRACED |
| REQ-053 | P-08, P-09 | UC-1007 | Akses auditor berakhir tepat waktu; perluasan scope butuh persetujuan terpisah (test) | 18 | TRACED |
| REQ-054 | P-01..P-12 | UC-1001 | Percobaan berulang melebihi batas → lockout sementara; semua percobaan teraudit | 4 | TRACED |
| REQ-055 | P-07 | UC-5001 | Listing draft tidak muncul di app; setiap transisi draft→published→archived teraudit | 11 | TRACED |
| REQ-056 | P-07 | UC-5002 | Perubahan harga/stok/diskon tercatat old→new + aktor + waktu; tidak ada nilai default dikarang | 11 | TRACED |
| REQ-057 | P-07 | UC-5001 | Upload media tipe terlarang ditolak; media terikat listingnya | 11 | TRACED — media listing dicakup dalam flow UC-5001 |
| REQ-058 | P-07 | UC-5003 | Login portal hanya role developer; portal tidak memberi hak billing/lisensi (test) | 22 | TRACED |
| REQ-059 | P-08 | UC-5004 | Jumlah penerima tampil sebelum kirim; kirim tanpa pratinjau mustahil (UI + server) | 22 | TRACED |
| REQ-060 | P-08 | UC-5004 | Kirim ganda dengan idempotency key sama → 0 pesan ganda; status queued/sent/failed terlihat | 22 | TRACED |
| REQ-061 | P-03 | UC-5005 | Opt-out jenis opsional dihormati; jenis wajib (per OD-102) tetap terkirim | 22 | TRACED |
| REQ-062 | P-03 | UC-6001, UC-6005 | Profil privat tidak muncul ke non-berhak (privacy test server-side) | 16 | TRACED |
| REQ-063 | P-02, P-03 | UC-6002, UC-6003 | Lamar pada rekrutmen tertutup ditolak; menutup tidak menghapus riwayat lamaran | 16 | TRACED |
| REQ-064 | P-02, P-03 | UC-6004 | Transisi invalid (reject setelah accept) ditolak; pemilik lamaran melihat status + notifikasi | 16 | TRACED |
| REQ-065 | P-05 | UC-3005 | Booking tumpang-tindih ditolak/warning sesuai OD-107; setiap konflik tercatat | 13 | TRACED |
| REQ-066 | P-03, P-05 | UC-3006 | Transisi check-out→returned teruji; foto/catatan kondisi tersimpan & terhubung evidence | 13 | TRACED |
| REQ-067 | P-03 | UC-3003 | Kamera denied → fallback manual berfungsi penuh; granted → scan berhasil | 13 | TRACED |
| REQ-068 | P-05 | UC-3007 | Item due/overdue teridentifikasi dari data; penyelesaian tercatat | 13 | TRACED |
| REQ-069 | P-05 | UC-3007, UC-3001 | KPI cocok dengan data transaksi dataset uji; dataset demo berlabel demo | 13 | TRACED |
| REQ-070 | P-10 | UC-7005, UC-7011, UC-7008 | Relasi process→control→workflow→transaction terbentuk pada ≥1 rantai penuh (test relasi) | 17 | TRACED |
| REQ-071 | P-10 | UC-7011 | Standar tanpa verified date tidak bisa dipakai untuk mapping | 17 | TRACED |
| REQ-072 | P-10 | UC-7011 | Scan konten = 0 teks standar verbatim; mapping tersimpan sebagai metadata referensi | 17 | TRACED |
| REQ-073 | P-11, P-10 | UC-7010 | Evaluasi supplier tersimpan dengan status + bukti; kedaluwarsa ter-flag | 19 | TRACED |
| REQ-074 | P-10, P-04 | UC-7010 | Penugasan yang butuh kompetensi diblok bila record tidak ada (test blok) | 19 | TRACED |
| REQ-075 | P-10, P-04 | UC-7008, UC-4005 | 1 kasus end-to-end: incident tercatat→NCR→CAPA→effectiveness check→close | 20 | TRACED |
| REQ-076 | P-10 | UC-7009 | Review menyimpan input/output/action; setiap action punya owner + status | 20 | TRACED |
| REQ-077 | P-10 | UC-7009 | Aksi perbaikan ter-track open→progress→verified→closed | 20 | TRACED |
| REQ-078 | P-10 | UC-7001 | Kustomisasi hirarki tanpa ubah kode; struktur default tersedia | 17 | TRACED |
| REQ-079 | P-10 | UC-7002 | Semua field metadata wajib tervalidasi; histori perubahan lengkap | 17 | TRACED |
| REQ-080 | P-10, P-02 | UC-7003, UC-7004 | Versi lama tidak bisa dipakai setelah superseded (test); reminder review muncul terjadwal | 17 | TRACED |
| REQ-081 | P-10 | UC-7004 | Dokumen melewati retensi masuk antrian disposition; eksekusi teraudit (periode per OD-104) | 18 | TRACED |
| REQ-082 | P-10, P-09 | UC-7007, UC-7002 | Akses di luar ACL ditolak; setiap view/download tercatat (aktor, waktu, objek) | 17 | TRACED |
| REQ-083 | P-03, P-10 | UC-7005, UC-7006 | Locked evidence menolak edit/delete (test API); sign-off mengikat aktor+role+waktu+konteks+versi | 18 | TRACED |
| REQ-084 | P-09 | UC-7007 | Export dalam scope berhasil; di luar scope ditolak + audit | 18 | TRACED |
| REQ-085 | P-10 | UC-8001, UC-8002 | Input tanpa sumber/satuan ditolak; setiap KPI punya definisi lengkap | 19 | TRACED |
| REQ-086 | P-04, P-10 | UC-8002 | Input emisi tanpa metodologi terverifikasi → ditolak/berlabel estimated + pending review | 19 | TRACED |
| REQ-087 | P-10 | UC-8003 | Aksi perbaikan ter-track siklus; hasil terhubung evidence | 19 | TRACED |
| REQ-088 | P-08 (design) | UC-2007, UC-1006 | Setiap layar punya lokasi tunggal dalam IA; struktur navigasi per tier disetujui | 3, 6 | PARTIAL — gate desain; diverifikasi via review IA, bukan satu UC |
| REQ-089 | P-08 (design) | UC-2001 (representatif) | Token dipakai semua komponen baru; deviasi per-screen ditolak di review | 3 | PARTIAL — gate desain lintas layar |
| REQ-090 | P-03 | UC-3003 | Semua state scanner teruji (granted/denied/timeout/unknown code) | 13 | TRACED |
| REQ-091 | P-02 | UC-2007 (representatif) | Setiap rilis fase utama punya catatan evaluasi usability (skenario + temuan) | 6+ | PARTIAL — proses evaluasi lintas fase, bukan flow pengguna |
| REQ-092 | P-08 | UC-1001, UC-6005, UC-9001 | Checklist SECURITY terpenuhi per fase; negative test jalur kritis (auth/otorisasi) lulus | 4+ | PARTIAL — cross-cutting; sebagian flow terwakili di UC auth/admin |
| REQ-093 | P-08 | UC-9001 | Uji beban dasar dijalankan vs target yang disetujui (OD-112); hasil tercatat | 2 (target), 25 (uji) | PARTIAL — UC ada; angka target menunggu OD-112 |
| REQ-094 | P-08 | UC-9002 | Restore test terjadwal berhasil; target mengikuti keputusan OD-114 | 25 | TRACED — test idea merujuk target OD-114 |
| REQ-095 | P-08 | UC-9001 | Incident dapat ditrace dari log tanpa secret terekspos; scan log = 0 secret | 3, 25 | TRACED |
| REQ-096 | P-08, P-02 | UC-9003 | Export/import sesuai scope disetujui (OD-111) lulus round-trip test | 24 | TRACED |
| REQ-097 | P-07 (eng) | UC-3003 | Perubahan breaking API → versi baru; klien lama lulus contract test masa transisi | 2 | PARTIAL — constraint arsitektur; diverifikasi via contract test |
| REQ-098 | P-01, P-02 | UC-5006 | Setiap transisi lisensi (purchase→active→renewal→expiry→grace→downgrade) teruji; akses mengikuti OD-108 | 5 | TRACED |
| REQ-099 | P-02, P-08 | UC-5006 | Downgrade tidak menghapus data; fitur non-tier terkunci server-side; data utuh untuk upgrade kembali | 5 | TRACED |
| REQ-100 | P-12 | — | Tester environment terpisah/berlabel; tanpa data pelanggan nyata | 22 | NOT TRACED — scope tester menunggu keputusan owner (terkait OD-06/REQ-015); Could |

---

## Ringkasan coverage

| Kelompok | Total | TRACED | PARTIAL | NOT TRACED |
|---|---|---|---|---|
| Must | 70 | 57 | 12 | 1 |
| Should | 26 | 22 | 4 | 0 |
| Could | 4 | 1 | 1 | 2 |
| **Total** | **100** | **80** | **17** | **3** |

- **Must traced (TRACED + PARTIAL): 69/70.** TRACED penuh 57/70; PARTIAL 12/70 (REQ-001, REQ-019, REQ-020, REQ-028, REQ-032, REQ-033, REQ-034, REQ-035, REQ-088, REQ-089, REQ-092, REQ-097 — semuanya requirement cross-cutting/quality gate yang tidak diwakili satu flow pengguna tunggal, tetapi tersentuh UC dan punya test idea terukur).
- **Should traced: 26/26 tercapak dalam matriks (22 TRACED + 4 PARTIAL).** PARTIAL: REQ-015 (flow landing page belum ada UC), REQ-037 (menunggu OD-07), REQ-091 (proses evaluasi), REQ-093 (target menunggu OD-112).
- **Could:** REQ-018 PARTIAL (menunggu OD-06), REQ-096 TRACED; REQ-038 & REQ-100 NOT TRACED.

### Gap list — REQ NOT TRACED + alasan

| REQ | Priority | Alasan NOT TRACED |
|---|---|---|
| REQ-029 | Must | Constraint rekayasa (migration terkontrol, reversible, data lama) — bukan flow pengguna; kontrol via gate ADR/review migration pada Phase 2+ (OD-01). Saran: petakan ke kriteria exit fase, bukan use case. |
| REQ-038 | Could | Strategi offline-first belum diputuskan (OD-07); UC-3003/UC-2006 hanya menampung perilaku kondisional bila nanti diaktifkan. |
| REQ-100 | Could | Scope akses tester dari landing page menunggu keputusan owner (terkait OD-06 & REQ-015); belum ada flow yang didefinisikan. |

### Catatan gap non-REQ (dari USE_CASES §11)

- Report/block abuse hiRider (UC-6005) belum punya REQ dedikasi — hanya dirujuk REQ-092. Bila dianggap perlu, owner menambahkan REQ baru (ID > REQ-100).
- Landing page publik (REQ-015) belum diwakili UC penuh; kandidat UC baru pada range 50xx saat Phase 22.
