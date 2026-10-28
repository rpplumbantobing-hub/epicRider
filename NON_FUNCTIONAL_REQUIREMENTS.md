# NON-FUNCTIONAL REQUIREMENTS — epicRider

> **Referensi MC §N:** rujukan Master Control pada dokumen ini memakai penomoran era Phase 0/1 (MC-V1, §1–§15 — arsip: `audit/superseded/phase1-era-control/`). Interpretasi ke anchor kanonik aktif: `CONTROL_REFERENCE_CROSSWALK.md`. Substansi dokumen tidak diubah (aturan F-06).

**Status dokumen:** Baseline NFR hasil Phase 1 (workstream WS-D, 2026-10-27), kategori mengikuti prompt Phase 1 workstream L. Semua requirement berstatus `PROPOSED` menunggu persetujuan owner.
**Aturan keras:** **Semua angka target di dokumen ini berlabel `PROPOSED`** + trade-off singkat + menunggu approval **OD-112** (kinerja/ketersediaan) atau **OD-114** (backup/DR) — TIDAK ADA angka final. Dilarang menyajikan angka sebagai keputusan. WCAG 2.2 AA adalah **requirement** (REQ-033), bukan target bikinan. Dilarang mengarang SLA final, kuota di luar MC, atau klaim tanpa bukti (MC §14).
**Rujukan utama:** `REQUIREMENTS.md` REQ-092..097, `SECURITY.md`, `OPERATIONS.md`, `UX_UI_STANDARD.md`, `TESTING.md`, MC §3–§11.

---

## 1. Register NFR

### NFR-01 — Security & Privacy
- **Definisi:** Kerahasiaan, integritas, dan privasi data platform: autentikasi aman, otorisasi per konteks, isolasi tenant, secrets management, minimisasi data, proteksi metadata sensitif/lokasi.
- **Kenapa penting:** Multi-tenant lintas perusahaan (REQ-023); entitlement = inti model bisnis tier (REQ-024); auth WhatsApp/Google wajib tahan abuse (REQ-021/022/047/048/054); baseline keamanan & privasi = REQ-092 (SECURITY.md); metadata sensitif hanya bila perlu & transparan (MC §10); hukum lokal menunggu ahli (OD-09).
- **Measurement approach:** threat-model-driven negative test (Phase 2 threat model → test jalur kritis); matrix test isolasi lintas-tenant; dependency scanning di CI; pentest sebelum launch; checklist SECURITY.md per fase.
- **Target usulan:** 0 temuan critical/high terbuka pada release gate jalur kritis (`PROPOSED` — trade-off: bisa menunda rilis; alternatif: rilis dengan mitigasi kompensasi terdokumentasi; menunggu approval OD-112). 100% endpoint tier-sensitive punya test denial teraudit (`PROPOSED` — trade-off: effort test lebih besar; alternatif: sampling per modul; menunggu approval OD-112).

### NFR-02 — Performance
- **Definisi:** Kecepatan respons API dan waktu muat layar kunci pada kondisi penggunaan normal.
- **Kenapa penting:** Kru lapangan memakai aplikasi di jaringan bergerak (MC §8; REQ-019); performa buruk menghambat adopsi; REQ-093 mensyaratkan target disetujui sebelum uji beban (target diusulkan Phase 2, uji Phase 25).
- **Measurement approach:** uji beban pada environment terpisah dengan data sintetis berlabel demo (konsisten larangan data demo tanpa label, MC §7); metrik p50/p95/p99 per endpoint kelas CRUD vs laporan/agregasi; timing layar kunci via browser automation di 3 breakpoint (REQ-019).
- **Target usulan:** p95 API < 500 ms untuk operasi CRUD (`PROPOSED` — trade-off: infrastruktur lebih mahal; alternatif: terima latensi lebih tinggi; menunggu approval OD-112). p95 muat layar kunci < 2,5 detik pada koneksi referensi 4G (`PROPOSED` — trade-off: butuh budget optimasi asset/query; alternatif: target 4 detik untuk jaringan buruk dengan state loading yang informatif (REQ-034); menunggu approval OD-112). Laporan/agregasi (mis. KPI aset REQ-069) diberi budget terpisah, lebih longgar dari CRUD (`PROPOSED`).

### NFR-03 — Availability
- **Definisi:** Platform dapat diakses dan berfungsi sesuai ekspektasi dalam periode waktu tertentu, termasuk penanganan maintenance window.
- **Kenapa penting:** Event berjalan live — downtime saat event berdampak langsung ke operasi kru (MC §1); REQ-094 mengikat availability pada keputusan owner; terkait keputusan hosting (OD-10).
- **Measurement approach:** uptime monitoring (health check endpoint + external probe); laporan ketersediaan bulanan = (total menit − downtime tak terjadwal)/total menit; downtime terjadwal dicatat terpisah.
- **Target usulan:** ketersediaan bulanan web app ≥ 99,5% (`PROPOSED` — trade-off: arsitektur HA menaikkan biaya hosting; alternatif: 99,0% untuk rilis awal dengan ekspektasi disampaikan ke pengguna; menunggu approval OD-112/OD-114). Maintenance window terjadwal di luar jam sibuk (`PROPOSED`; jadwal & kebijakan komunikasi = kandidat keputusan OD-163).

### NFR-04 — Scale
- **Definisi:** Kemampuan menampung pertumbuhan jumlah tenant/workspace, pengguna, dan volume transaksi tanpa re-architecture dan tanpa degradasi melewati target NFR-02.
- **Kenapa penting:** Visi MC §1: dari perorangan sampai enterprise; satu domain model multi-tenant (REQ-023) harus tetap sehat saat jumlah workspace bertambah; prinsip "tier lebih tinggi memperkaya domain yang sama" (MC §5) mencegah sharding per tier.
- **Measurement approach:** load test dengan dataset multi-tenant sintetis berlabel (ukuran workspace, jumlah event/aset per workspace diambil dari profil penggunaan yang disetujui — belum ada data nyata); profiling query pada tabel bersama; uji growth data (partisi/index) saat Phase 2 data model.
- **Target usulan:** deployment awal menangani beban bersamaan setara ratusan pengguna aktif tanpa melanggar NFR-02 (`PROPOSED` — angka pasti ditetapkan bersama keputusan hosting OD-10; trade-off: over-provisioning vs autoscaling; menunggu approval OD-112). Perilaku degradasi terukur (bukan kolaps) saat melebihi beban target (`PROPOSED`).

### NFR-05 — Observability
- **Definisi:** Kemampuan mendiagnosa kondisi sistem: log terstruktur, error tracking, metrik dasar, correlation ID, tanpa secret/data sensitif di log.
- **Kenapa penting:** REQ-095; OPERATIONS.md target §2.3; tanpa observability, klaim "aman/berfungsi" tidak bisa dibuktikan saat incident; audit log (NFR-06) berbeda tujuan dari log teknis.
- **Measurement approach:** semua request penting punya request ID yang bisa dilacak lintas log; error 5xx masuk error tracking; metrik minimum: latency, error rate, throughput per endpoint kelas utama; audit manual "apakah secret bisa muncul di log" (checklist sanitasi).
- **Target usulan:** 100% error 5xx pada endpoint utama terlog terstruktur dengan correlation ID (`PROPOSED` — trade-off: volume log; alternatif: sampling; menunggu approval OD-112). Retensi log teknis 30–90 hari (`PROPOSED` — trade-off: biaya storage vs kebutuhan forensik; angka final = kandidat keputusan OD-164).

### NFR-06 — Auditability
- **Definisi:** Jejak terverifikasi untuk aksi yang berdampak komersial, akses data, perubahan record: siapa, kapan, apa, nilai lama→baru, konteks.
- **Kenapa penting:** MC §6 (semua perubahan harga/stok/diskon/publikasi/notifikasi teraudit); REQ-027/083 (approved records immutable, koreksi via amendment); REQ-031/056; rantai traceability IMS (MC §10) untuk ISOrider; sign-off mengikat aktor+role+waktu+konteks+versi (MC §10).
- **Measurement approach:** sampling audit trail per fase terhadap daftar kategori aksi wajib-audit; test API: aksi tanpa audit trail = fail; verifikasi immutability approved record (edit/delete ditolak).
- **Target usulan:** 0 aksi pada kategori wajib-audit (komersial, lisensi, permission, evidence sign-off) tanpa audit trail saat audit fase (`PROPOSED` — trade-off: overhead tulis & storage; alternatif: audit hanya aksi komersial — menurunkan kesiapan IMS; menunggu approval OD-112). Retensi audit trail platform diusulkan lebih panjang dari log teknis (`PROPOSED`; angka = kandidat OD-164; retensi dokumen/record IMS organisasi pelanggan = OD-104).

### NFR-07 — Backup & Restore
- **Definisi:** Salinan data yang dapat dipulihkan secara teruji, dengan target RPO (kehilangan data maksimum) dan RTO (durasi pemulihan).
- **Kenapa penting:** REQ-094; OPERATIONS.md §2.2 (backup otomatis + uji restore berkala); saat ini backup = `NOT FOUND` (OPERATIONS §1) — wajib hadir sebelum data pelanggan nyata (paling lambat menjelang Phase 5+ berjalan di produksi).
- **Measurement approach:** uji restore terjadwal ke environment terisolasi dengan checklist verifikasi integritas; catat durasi aktual vs RTO; verifikasi cadangan terakhir usianya ≤ RPO.
- **Target usulan:** backup harian otomatis; RPO ≤ 24 jam; RTO ≤ 4 jam (`PROPOSED` — trade-off: biaya storage & infrastruktur restore; alternatif: RPO ≤ 7 hari lebih murah tapi risiko kehilangan data event terbaru lebih besar; menunggu approval OD-114, diputuskan bersama OD-10).

### NFR-08 — Retention
- **Definisi:** Kebijakan berapa lama data disimpan dan bagaimana disposisinya: dokumen/record, log teknis, audit trail, data akun.
- **Kenapa penting:** REQ-081 (retention & disposition sesuai kebijakan — periode = OD-104); MC §10 (setiap dokumen/record punya retensi); privasi (simpan tidak lebih lama dari perlu — terkait OD-09).
- **Measurement approach:** antrian disposition teruji (REQ-081 acceptance); laporan item melewati retensi; eksekusi disposition teraudit; kelas retensi mengikuti kelas dokumen dari DOCUMENT_EVIDENCE_MODEL (menunggu artefak tersebut).
- **Target usulan:** struktur kelas retensi default untuk log teknis & audit platform (`PROPOSED` — angka hari = kandidat OD-164; trade-off: kepatuhan privasi vs kebutuhan investigasi). Retensi dokumen/record IMS pelanggan = dikonfigurasi per organisasi (REQ-078/081), periode = **OD-104 (belum diputuskan — bukan angka kami)**.

### NFR-09 — Localization
- **Definisi:** i18n sejak awal: Bahasa Indonesia default, siap untuk Inggris dan bahasa lain; tanpa hard-coded UI strings; format tanggal/angka/zona waktu sensitif locale.
- **Kenapa penting:** MC §5 & REQ-028 (wajib, bukan pilihan); kualitas bahasa bagian dari UX gate (UX_UI_STANDARD §2.7).
- **Measurement approach:** scan string hard-coded pada layar baru (target 0 — acceptance REQ-028); kelengkapan locale file ID per fitur; pseudo-localization test bila tersedia untuk mendeteksi truncation/layout.
- **Target usulan:** setiap fitur baru rilis dengan locale ID lengkap + struktur EN siap diisi (`PROPOSED` — ini penurunan langsung REQ-028, bukan angka kinerja; tanpa konsekuensi biaya berarti bila disiplin sejak Phase 3).

### NFR-10 — Data Import/Export
- **Definisi:** Kemampuan pengguna mengekspor (dan bila disetujui, mengimpor) data mereka dalam format yang disepakati, dengan kontrol keamanan.
- **Kenapa penting:** REQ-096 (scope/format = OD-111; rekomendasi OD-111: export-only rilis awal); kepemilikan data pelanggan = prasyarat kepercayaan; kaitan ke portabilitas saat berhenti berlangganan (siklus lisensi — LICENSE_MATRIX §4).
- **Measurement approach:** round-trip test sesuai scope disetujui (acceptance REQ-096); verifikasi ACL dihormati dalam export (user tidak mengekspor data di luar haknya); scan export terhadap data sensitif.
- **Target usulan:** export-only untuk objek utama pada rilis awal (`PROPOSED` — mengikuti rekomendasi OD-111, menunggu approval). Batas ukuran/frekuensi export & penanganan data sensitif dalam file export (`PROPOSED` — detail = kandidat keputusan OD-166, terkait OD-111 & OD-09).

### NFR-11 — Accessibility
- **Definisi:** Penggunaan oleh penyandang disabilitas: kontras, keyboard-operable, focus state, label, heading, error association, semantik, reduced motion.
- **Kenapa penting:** **WCAG 2.2 AA "sejauh praktis & teruji" adalah requirement (REQ-033, MC §7, UX_UI_STANDARD §2.3) — bukan target yang kita karang.** Acceptance-nya: audit a11y layar kunci lulus (automated + manual keyboard), terdokumentasi per fase.
- **Measurement approach:** automated scan (axe/serupa) + manual keyboard check per layar kunci; bukti dilampirkan di gate fase (UX_UI_STANDARD §3); pengecualian "sejauh praktis" wajib didokumentasikan dengan justifikasi, bukan diam-diam.
- **Target usulan:** bukan angka — requirement REQ-033 berlaku. Satu-satunya "target" yang sah: 0 temuan blokir a11y yang tidak terdokumentasi pada layar kunci sebelum fase dinyatakan DONE (mengikuti gate UX_UI_STANDARD; bukan angka kinerja).

### NFR-12 — Mobile & Offline
- **Definisi:** Pengalaman fungsional di tablet/mobile browser dan aplikasi pendamping; perilaku terdefinisi saat jaringan buruk/tidak ada (bila offline disetujui).
- **Kenapa penting:** Web 3 breakpoint wajib (REQ-019; UX_UI_STANDARD §2.2); API sama untuk web+mobile tanpa duplikasi logika (REQ-020, MC §3); fitur lapangan dievaluasi untuk jaringan buruk (REQ-037); offline-first hanya bila disetujui dan wajib punya antrean aman, sync indicator, rekonsiliasi konflik, idempotency, permission ditegakkan saat sync (MC §8, REQ-038); scanner mobile dengan fallback manual (REQ-036/067/090); strategi distribusi menunggu OD-02.
- **Measurement approach:** responsive check 3 breakpoint per layar kunci (bukti di gate fase); test alur scan granted/denied/fallback; bila offline disetujui (OD-07): test sinkronisasi lintas device, konflik rekonsiliasi, penolakan aksi tanpa hak saat sync; **jangan klaim offline support sebelum dites** (MC §8).
- **Target usulan:** keputusan offline-first = **OD-07 (bukan keputusan dokumen ini)**. Bila disetujui: 0 aksi offline yang lolos sync tanpa pemeriksaan permission (`PROPOSED` — turunan langsung MC §8/REQ-038).

### NFR-13 — Resilience
- **Definisi:** Platform berperilaku terkendali saat kondisi tidak normal: dependency lambat/gagal, trafik puncak, aksi duplikat, input buruk — degradasi halus, bukan kolaps atau data korup.
- **Kenapa penting:** State lengkap termasuk error/offline/stale adalah requirement UI (REQ-034, MC §7); anti-abuse & rate limiting (REQ-021/054); idempotency notifikasi (REQ-060); rekonsiliasi konflik sync (MC §8); approved record tidak boleh korup saat failure (REQ-027).
- **Measurement approach:** fault-injection dasar pada dependency utama (bila tersedia di environment Phase 25); test timeout/retry semua outbound call; test idempotency (kirim ganda notifikasi, aksi duplikat); verifikasi tidak ada partial-write pada transisi status penting.
- **Target usulan:** semua outbound call punya timeout + retry terkendali (tidak ada hang tanpa batas); aksi idempotent untuk operasi pembayaran/notifikasi/submit evidence (`PROPOSED` — trade-off: kompleksitas desain; alternatif: at-least-once dengan dedup di consumer; menunggu approval OD-112).

### NFR-14 — API Compatibility
- **Definisi:** Kontrak API stabil untuk klien web & mobile: perubahan breaking memerlukan versi baru; klien lama tetap berfungsi dalam masa transisi.
- **Kenapa penting:** REQ-097 (Must) + REQ-020 (API tunggal tanpa duplikasi logika bisnis); mobile app = extension yang dirilis lebih lambat dari web (REQ-018, Phase 23) — tanpa kebijakan kompatibilitas, klien lama pecah.
- **Measurement approach:** contract test endpoint (TESTING.md §2.1); checklist review perubahan API (breaking vs non-breaking) di CI/PR; changelog API per rilis.
- **Target usulan:** perubahan breaking = versi API baru; klien lama didukung minimal 1 siklus rilis penuh + notifikasi deprecation (`PROPOSED` — trade-off: beban memelihara versi lama; alternatif: masa transisi lebih pendek dengan risiko kru lapangan terputus; menunggu approval OD-112; kebijakan final bisa dikunci lewat ADR Phase 2 tanpa melanggar REQ-097).

### NFR-15 — Disaster Recovery
- **Definisi:** Kemampuan pulih dari kegagalan skala besar (kehilangan deployment/host/region, korupsi data masif) — melampaui backup rutin (NFR-07).
- **Kenapa penting:** REQ-094; OPERATIONS.md §2.7 (DR sejalan dengan business continuity ISOrider, Phase 19/25); keputusan hosting = prasyarat (OD-10).
- **Measurement approach:** dokumen runbook DR + drill restore penuh ke infrastruktur alternatif; catat waktu aktual vs RTO; verifikasi keutuhan data pasca-drill.
- **Target usulan:** RPO ≤ 24 jam; RTO ≤ 8 jam untuk skenario kehilangan deployment utama (`PROPOSED` — trade-off: arsitektur multi-zone menaikkan biaya signifikan; alternatif: RTO lebih panjang diterima untuk rilis awal dengan komunikasi ekspektasi; menunggu approval OD-114, diputuskan bersama OD-10). Angka ini konsisten dengan NFR-07 (RTO DR lebih longgar dari restore backup rutin karena mencakup provisioning ulang).

### NFR-16 — Support & Operability
- **Definisi:** Kemampuan tim mengoperasikan platform: runbook, health check, proses incident, kanal support, penanganan permintaan pengguna.
- **Kenapa penting:** OPERATIONS.md §2.6 (kanal support, SLA internal, proses incident — menyatu dengan incident reporting maxRider); Phase 26 menuntut support berjalan (ROADMAP); saat ini support/on-call = `NOT FOUND` (OPERATIONS §1).
- **Measurement approach:** catatan incident (waktu deteksi→respons→resolusi) per severity; evaluasi runbook dengan simulasi; kepuasan/antrean support dipantau mulai pilot (Phase 26).
- **Target usulan:** struktur SLA internal per severity (mis. respons pertama Sev1 ≤ 4 jam kerja; Sev2 ≤ 1 hari kerja) (`PROPOSED` — trade-off: menuntut staffing/on-call; alternatif: best-effort untuk rilis awal dengan ekspektasi jelas ke pengguna; **SLA komersial ke pelanggan berbeda hal ini dan menunggu OD-06**; angka internal menunggu approval OD-112). Kanal support & jam operasional rilis awal = kandidat keputusan OD-168-lihat §3.

## 2. Prioritas NFR per fase

Kapan tiap NFR mulai **mengikat** (bukan kapan selesai — uji formal NFR terkonsentrasi di Phase 25 sesuai ROADMAP dan REQ-093/094):

| NFR | Mulai mengikat sejak | Catatan fase |
|---|---|---|
| NFR-01 Security & Privacy | Phase 2 (threat model), ditegakkan Phase 4+ | Pentest penuh Phase 25 (REQ-092). |
| NFR-02 Performance | Phase 3 (budget desain), target dikunci Phase 2 setelah OD-112 | Uji beban formal Phase 25 (REQ-093). |
| NFR-03 Availability | Phase 25 (setelah OD-10 hosting + OD-112/114) | Sebelum itu: catat keputusan arsitektur yang mempengaruhi availability. |
| NFR-04 Scale | Phase 2 (data model harus siap tumbuh), uji Phase 25 | Perhatian khusus tabel multi-tenant bersama. |
| NFR-05 Observability | Phase 3 (logging terstruktur sejak kode pertama), lengkap Phase 25 | REQ-095. |
| NFR-06 Auditability | Phase 4–5 (auth/entitlement/lisensi = aksi pertama yang wajib teraudit), penuh Phase 17–22 | Gate per fase (MC §15). |
| NFR-07 Backup & Restore | Wajib ada sebelum data pelanggan nyata (Phase 5+ produksi); uji restore formal Phase 25 | OPERATIONS.md §2.2. |
| NFR-08 Retention | Phase 17–18 (metadata retensi dokumen), enforcement menunggu OD-104 | Log teknis = kandidat OD-164. |
| NFR-09 Localization | Phase 3 (sejak kode pertama) — REQ-028 | Gate per fase. |
| NFR-10 Import/Export | Phase 24 (REQ-096) | Scope = OD-111. |
| NFR-11 Accessibility | Phase 3/6 (gate per layar), audit penuh Phase 25 | Requirement REQ-033; gate UX_UI_STANDARD §3. |
| NFR-12 Mobile & Offline | Evaluasi Phase 13; hardening Phase 23–24 | Keputusan OD-02 (distribusi), OD-07 (offline). |
| NFR-13 Resilience | Pola sejak Phase 6 (state lengkap, timeout); uji Phase 25 | REQ-034. |
| NFR-14 API Compatibility | Phase 2 (kebijakan/ADR), ditegakkan sejak API pertama (Phase 6) | REQ-097. |
| NFR-15 Disaster Recovery | Desain Phase 2/25, implementasi & drill Phase 25 | Menunggu OD-114 + OD-10. |
| NFR-16 Support & Operability | Persiapan runbook Phase 25; penuh Phase 26 | OPERATIONS.md §2.6. |

**Prinsip:** NFR yang murah sejak awal (NFR-05/06/09/14, bagian NFR-01) wajib dipenuhi sejak Phase 3–5 — menunda membuat utang teknis yang mahal. NFR yang butuh keputusan infrastruktur/komersial (NFR-03/07/15/16) dieksekusi serius di Phase 25–26 setelah OD-10/OD-112/OD-114 dijawab.

## 3. Kandidat keputusan baru hasil WS-D (range OD-160..OD-169)

Semua berstatus **OPEN / OWNER APPROVAL REQUIRED**. Bila disetujui, catat sebagai ADR di `DECISIONS.md` dan ubah status baris. ID mengikuti rentang WS-D sesuai instruksi task; tidak menimpa OD yang sudah ada.

| ID | Keputusan | Opsi | Dampak bila tertunda | Rekomendasi (bukan keputusan) | Pemutus |
|---|---|---|---|---|---|
| OD-160 | Penunjukan verifier standar ISO & penyediaan lingkungan dengan akses normal ke `www.iso.org`/`catalog.iso.org` (verifikasi dari luar sandbox — F0-012) | (a) owner verifikasi sendiri; (b) tunjuk IMS lead/ahli eksternal sebagai verifier dengan bukti tangkapan katalog; (c) gunakan langganan metadata standar resmi | STANDARD_REGISTER tetap BLOCKED → clause-mapping (REQ-071) & Phase 17–21 tidak bisa mulai | (b) + jadwal verifikasi sebelum akhir Phase 2 awal Phase 17 | Owner |
| OD-161 | Kebijakan terhadap standar kandidat MC berlabel "2026" (STD-01/04/08) bila terbukti masih in-process: menahan mapping sampai terbit vs mapping edisi terverifikasi yang sudah berjalan dengan flag revision-pending | (a) tahan sampai edisi baru terbit; (b) mapping terhadap edisi published terakhir + penanda re-check; (c) per standar berbeda | Desain modul mutu/lingkungan/audit ISOrider bisa salah edisi | (c) — diputuskan per standar setelah hasil verifikasi OD-160 | Owner + IMS lead |
| OD-162 | Lingkungan & metode pengukuran NFR (staging dengan data sintetis berlabel vs probe produksi read-only; tool uji beban) | (a) staging dedicated; (b) probe produksi; (c) kombinasi | REQ-093 uji Phase 25 tidak punya dasar lingkungan; angka NFR tidak bisa diverifikasi | (a) staging dedicated dengan data berlabel demo (konsisten MC §7) | Owner + eng lead |
| OD-163 | Target availability final, jadwal maintenance window, dan kebijakan komunikasi downtime ke pengguna | Terima/ubah/tunda angka PROPOSED di NFR-03 | Ekspektasi pengguna & desain HA tidak bisa dikunci; terkait OD-10/OD-112/OD-114 | Setelah OD-10 diputuskan; mulai dari 99,0% rilis awal bila biaya HA belum layak | Owner + eng lead |
| OD-164 | Retensi default log teknis & audit trail platform (berbeda dari OD-104 yang mengatur dokumen/record IMS organisasi pelanggan) | (a) log 30 hari + audit 1 tahun; (b) keduanya 90 hari; (c) ikuti keputusan legal (OD-09) | NFR-05/06/08 tidak bisa dikunci; storage & kepatuhan ambigu | (a) sebagai awal, review bersama OD-09 | Owner + eng lead + IMS lead |
| OD-165 | Persetujuan penggunaan dataset sintetis berlabel demo untuk uji beban/NFR (jumlah & profil beban uji) | (a) setuju dengan profil disepakati; (b) tolak — uji hanya unit/perf ringan | NFR-02/04 tidak teruji sebelum launch | (a) — profil beban disusun dari use case Phase 1, bukan angka karangan | Owner |
| OD-166 | Klasifikasi keamanan file export & batas ukuran/frekuensi (NFR-10): apakah export berisi data sensitif perlu approval/watermark/log akses tambahan | (a) export bebas dalam scope ACL; (b) export sensitif butuh approval + audit; (c) tunda sampai OD-111 | REQ-096 detail tidak bisa dibangun; risiko bocornya data via export | (b) untuk data terklasifikasi sensitif; selaras OD-09 sebelum keputusan final | Owner + eng lead (hukum via OD-09) |
| OD-168 | Kanal support & jam operasional rilis awal (dirujuk NFR-16) | (a) in-app form + email pada jam kerja; (b) email saja; (c) kanal komunitas | Ekspektasi pengguna & staffing support tidak bisa disiapkan sebelum Phase 26 | (a) minimal; detail jam operasional menyusul bersama OD-163 | Owner |

---

*Riwayat: dibuat Phase 1 (WS-D, 2026-10-27) sesuai prompt Phase 1 workstream L. Semua angka = PROPOSED; tidak ada angka SLA/kuota/harga final. NFR terkait dokumen: REQ-092..097 (REQUIREMENTS.md), SECURITY.md, OPERATIONS.md, TESTING.md, UX_UI_STANDARD.md, LICENSE_MATRIX.md, STANDARD_REGISTER.md.*
