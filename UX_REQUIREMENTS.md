# UX REQUIREMENTS — epicRider

> **Referensi MC §N:** rujukan Master Control pada dokumen ini memakai penomoran era Phase 0/1 (MC-V1, §1–§15 — arsip: `audit/superseded/phase1-era-control/`). Interpretasi ke anchor kanonik aktif: `CONTROL_REFERENCE_CROSSWALK.md` (contoh: "MC §2" di sini = Produk & batas lisensi era MC-V1, BUKAN Entitlement taxonomy MC aktif; "MC §14" = anti-halusinasi → MC aktif §7). Substansi dokumen tidak diubah (aturan F-06).

**Task:** WS-E (Task ID 1-e) · Phase 1 · **DOCUMENTATION-ONLY** — dokumen ini tidak mengubah kode/schema/config dan tidak membangun UI produksi (keputusan prototype terpisah = **OD-113**, milik owner).
**Status dokumen:** `PROPOSED` seluruhnya — hasil desk analysis berbasis dokumen kontrol, BUKAN hasil riset pengguna partisipan (lihat §8 Catatan Kejujuran).
**Sumber:** `MASTER_CONTROL.md` §2/§3/§5/§7/§8, `REQUIREMENTS.md` (REQ-xxx dirujuk apa adanya — dokumen ini TIDAK membuat REQ baru), `UX_UI_STANDARD.md`, `PHASE_0_AUDIT_REPORT.md` (R-01..R-10), `PHASE_0_GAP_REGISTER.md` (G-001..G-016), `OPEN_DECISIONS.md` (OD-xxx), `ROADMAP.md`.
**Persona:** ID tetap P-01..P-12; definisi lengkap di `PERSONAS_AND_JOURNEYS.md` (WS-A, Task 1-a, status PROPOSED) — ID & nama persona telah diverifikasi cocok dengan yang dipakai dokumen ini (lihat §8).

## 0. Cara baca

| Kolom | Isi |
|---|---|
| ID | UXR-01..UXR-20 (ID stabil, tidak didaur ulang) |
| Requirement | Perilaku UX yang dituntut (target state) |
| Rationale | Alasan + sumber (MC § / gap / risiko) |
| REQ terkait | Rujukan `REQUIREMENTS.md` (tanpa REQ baru) |
| Acceptance criteria | Kriteria terukur untuk gate per fase (basis uji, bukan klaim) |
| Phase | Fase ROADMAP tempat requirement ditegakkan |
| Status | `PROPOSED` (semua menunggu persetujuan owner) |

## 1. Tabel requirement UX

| ID | Requirement | Rationale | REQ terkait | Acceptance criteria (terukur) | Phase | Status |
|---|---|---|---|---|---|---|
| UXR-01 | Information architecture (IA) & navigasi per tier: core navigasi **Home/Event/Asset/Team/Profile** (MC §2) dipertahankan identik di mini/max/ISOrider yang mewarisi; **ISOrider** menambah level navigasi IMS (kelompok proses/dokumen/evidence/audit/NCR-CAPA) sebagai cabang terpisah tanpa mengubah core; **hiRider** menambah area Marketplace/rekrutmen & profil kru; setiap layar punya **lokasi tunggal** dalam IA map | MC §2 menetapkan hierarki & pewarisan tier; G-001 (belum ada UI aplikasi sama sekali); tanpa IA map, fitur Phase 6+ akan menyebar tanpa pola | REQ-003, REQ-008, REQ-011, REQ-012, REQ-013, REQ-088 | (1) IA map per tier (mini/max/ISO/hiRider) disetujui owner sebelum Phase 6; (2) 100% layar baru terdaftar di IA map dengan parent tunggal; (3) audit navigasi per fase = 0 layar di luar IA map; (4) label 5 halaman core identik di semua tier yang mewarisi | 3 (fondasi), 6 (penerapan pertama) | PROPOSED |
| UXR-02 | Navigasi prediktif & istilah konsisten: semua label nav/tombol/pesan mengikuti **kamus istilah Phase 1** (deliverable `USE_CASES`/`PRODUCT_SCOPE` — kamus istilah adalah bagian naming di sana, bukan dokumen ini); pengguna dapat menebak lokasi fitur dari kategori; pola lokasi/breadcrumb konsisten | MC §7: "istilah konsisten, navigasi dapat diprediksi"; istilah ganda = error operasional kru lapangan | REQ-028, REQ-032, REQ-088 | (1) kamus istilah resmi tersedia dari deliverable Phase 1 dan dijadikan sumber tunggal label UI; (2) heuristic review "cari fitur" (daftar tugas di §4) mencatat 0 sinonim untuk objek yang sama di layar kunci; (3) setiap istilah baru di layar baru wajib masuk kamus sebelum merge fase | 1 (kamus), 6+ (penerapan) | PROPOSED |
| UXR-03 | First-run onboarding (P-01 Solo Owner-Operator, P-02 Workspace Owner UKM): alur login → verifikasi → buat/join workspace → orientasi 5 halaman; setiap langkah menampilkan status & next action; undangan kru memakai link aman kedaluwarsa; tidak ada titik di onboarding yang menampilkan data workspace lain | MC §2/§4; G-003 (auth tidak ada); kegagalan onboarding = churn tier kecil | REQ-047, REQ-049, REQ-051, REQ-007 | (1) skenario tugas "pendatang baru hingga workspace siap" terdokumentasi selesai tanpa bantuan eksternal (catatan evaluasi UXR-17); (2) semua state auth punya pesan + aksi lanjut (OTP kedaluwarsa, undangan kedaluwarsa, fallback recovery REQ-047); (3) test isolasi: selama onboarding 0 data workspace lain tampil | 4 (auth), 6 (workspace) | PROPOSED |
| UXR-04 | Konteks event aktif kru & safe switch (P-03 Crew Member, P-04 Event Manager): indikator konteks event aktif **selalu terlihat** di app shell; picker penugasan bila ≥2; pindah konteks ≤2 ketukan dari shell; konfirmasi bila ada isian belum tersimpan; pasca-switch, data event lama tidak dapat diakses | MC §2 (wajib jelas + aman); REQ-007 adalah Must; risiko kebocoran antar-event | REQ-007, REQ-050 | (1) kru dengan ≥2 penugasan melihat picker konteks di semua layar core; (2) switch konteks ≤2 ketukan dari posisi mana pun di shell; (3) test server-side: setelah switch, query data event sebelumnya ditolak untuk konteks baru; (4) isian belum tersinkron memunculkan peringatan sebelum pindah (terkait UXR-16) | 6, 10 | PROPOSED |
| UXR-05 | Scan aset end-to-end (P-03, P-05 Rental/Asset Manager): flow buka scanner → izin kamera (granted/denied/timeout) → scan → hasil eksplisit (aset ditemukan / tidak ditemukan / kode tidak dikenal) → aksi lanjut (lookup, check-in/out, inspeksi, damage report); **fallback entry kode manual selalu tersedia** dan berfungsi penuh | MC §8 scanner; REQ-067/REQ-090 menuntut semua state scanner; G-001 (belum ada UI) | REQ-036, REQ-067, REQ-090 | (1) 4 state scanner (granted/denied/timeout/unknown code) teruji terdokumentasi; (2) denied → fallback manual berfungsi end-to-end (hasil sama dengan scan); (3) 0 kondisi hasil scan tanpa feedback (tidak ada dead end); (4) keputusan perangkat/browser minimum scanner = kandidat OD-184 | 13 | PROPOSED |
| UXR-06 | Checklist & upload evidence (P-03, P-04, P-10 IMS/Sustainability Manager): alur form/checklist → hasil → catatan → upload (foto/video/file) → metadata (timestamp/aktor) → submit → review → sign-off → locked; progress langkah terlihat; gagal upload TIDAK menghapus isian; setelah locked hanya amendment dengan versi baru | MC §10 evidence workflow; REQ-043/REQ-083; G-005 (belum ada modul) | REQ-043, REQ-083, REQ-027 | (1) alur end-to-end teruji pada ≥1 checklist; (2) test kegagalan jaringan saat upload: isian bertahan, retry jelas; (3) locked evidence: 0 aksi edit/hapus tersedia di UI DAN ditolak API (test); (4) amendment wajib mencatat versi + alasan + aktor | 18 | PROPOSED |
| UXR-07 | Approve dokumen & sign-off (P-02, P-10, P-09 Auditor read-only): layar approval menampilkan **versi persis** yang disetujui (preview/diff), identitas approver otomatis dari sesi (bukan input bebas), konfirmasi eksplisit dengan konsekuensi status; UI **tidak boleh mengklaim kekuatan hukum** tanda tangan — label mengikuti keputusan OD-103 | MC §10 sign-off mengikat aktor+role+waktu+konteks+versi; REQ-027 approved immutable; overclaim legal = risiko RSK-114 | REQ-027, REQ-080, REQ-083 | (1) test: jika versi berubah saat sedang direview, approval lama batal / wajib re-review; (2) dialog konfirmasi menyebut konsekuensi (dokumen jadi effective/locked); (3) 0 copy UI yang mengklaim "tersertifikasi/berkekuatan hukum" sebelum OD-103 ditutup | 17, 18 | PROPOSED |
| UXR-08 | Broadcast notifikasi dengan pratinjau wajib (P-07 Developer/Store Manager, P-08 Platform Admin/Support): composer memilih audience (seluruh workspace / workspace terpilih / user terpilih multi-pilih) → **pratinjau penerima wajib** (jumlah + daftar) → pratinjau isi → konfirmasi kirim; status pengiriman (queued/sent/failed) terlihat pengirim berwenang; jenis wajib vs opsional menunggu OD-102 | MC §2 notifikasi developer; REQ-017/059/060; risiko salah kirim massal = RSK-121 | REQ-017, REQ-059, REQ-060, REQ-061 | (1) kirim tanpa pratinjau penerima mustahil (test); (2) jumlah penerima tampil sebelum kirim; (3) kirim ganda idempotent — tidak ada pesan ganda (test); (4) status per pengiriman terlihat; (5) preferensi opt-out (REQ-061) dihormati untuk jenis opsional | 22 | PROPOSED |
| UXR-09 | Responsive & touch target: layar kunci fungsional pada 3 breakpoint **≥1280 / 768–1024 / 360–430** tanpa kerusakan layout; touch target **≥44×44 px**; tabel/data padat punya pola mobile (kolom prioritas / scroll terkontrol) | MC §7 + UX_UI_STANDARD §2.2; REQ-019 Must; G-001 | REQ-019 | (1) responsive check 3 breakpoint lulus untuk layar kunci fase berjalan (bukti screenshot per UX_UI_STANDARD §3); (2) audit touch target layar kunci = 0 elemen interaktif <44px; (3) tabel laporan punya mode ringkas mobile yang teruji | 6+ (setiap fase UI) | PROPOSED |
| UXR-10 | Formulir layar kecil: pola form konsisten — satu kolom, label di atas input, tipe keyboard sesuai (numeric/email/tel), validasi inline per field, aksi utama selalu terlihat (sticky/akhir form), tanpa interaksi yang hanya bisa via hover | MC §7 "formulir mudah digunakan pada layar kecil"; kru lapangan = pengguna mobile dominan (P-03) | REQ-019, REQ-032, REQ-033 | (1) 100% form layar kunci memakai pola form design system (tanpa per-screen style menyimpang — UX_UI_STANDARD §2.3); (2) checklist form: 0 field tanpa label programatik; (3) error validasi ter-associasi ke field (lihat UXR-12 baris "error association") | 3 (pattern), 6+ | PROPOSED |
| UXR-11 | Evaluasi fitur lapangan jaringan buruk: setiap fitur lapangan (event, rundown, checklist, bukti, inspeksi aset, laporan) dievaluasi untuk penggunaan mobile & jaringan buruk; hasil evaluasi (mitigasi: cache/retry/penundaan fitur) terdokumentasi; **tanpa klaim offline sebelum dites** | MC §8 wajib evaluasi; REQ-037 Should; perilaku offline penuh menunggu OD-07 (lihat UXR-16) | REQ-037, REQ-038 | (1) dokumen evaluasi per fitur lapangan ada sebelum fase fitur terkait bisa DONE; (2) keputusan mitigasi per fitur tercatat (termasuk keputusan "tidak dimitigasi sekarang"); (3) simulasi jaringan buruk pada fitur ter-evaluasi tidak merusak isian (test bila mitigasi disetujui) | 13, 23 (evaluasi berulang) | PROPOSED |
| UXR-12 | Aksesibilitas WCAG 2.2 AA per aspek dengan cara pemeriksaan masing-masing (rincian tabel di §6): kontras, keyboard, focus, label, heading order, error association, semantik, reduced motion | MC §7 + UX_UI_STANDARD §2.3 (target "sejauh praktis & teruji"); REQ-033 Must | REQ-033, REQ-032 | (1) audit a11y layar kunci per fase = automated scan + manual keyboard check, hasil terdokumentasi (DIUJI vs TIDAK DIUJI); (2) 0 temuan kritis a11y pada layar kunci sebelum fase DONE; (3) 8 aspek §6 masing-masing punya hasil periksa (bukan di-skip diam-diam) | 6+ (per fase) | PROPOSED |
| UXR-13 | State completeness — matriks state × layar kunci (§5): setiap layar kunci mendefinisikan state loading, empty, error, success, permission denied, offline/sync pending (bila relevan), data stale (bila relevan) SEBELUM implementasi layar | MC §7 wajib state lengkap; REQ-034 Must; G-007 (tanpa pola state) | REQ-034, REQ-088 | (1) matriks §5 terisi 100% untuk layar kunci fase berjalan sebelum review; (2) layar tanpa desain state = blocker review fase; (3) test state permission denied: pesan jelas, tanpa kebocoran data, tanpa merusak layout | 6+ | PROPOSED |
| UXR-14 | Anti-mockup & kejujuran UI: tidak ada tombol/link tanpa aksi end-to-end; placeholder tidak menyamar sebagai fitur selesai; chart/data demo wajib berlabel demo (lebih baik tidak ditampilkan); status proses selalu jelas | MC §7 larangan keras; REQ-035; risiko integritas klaim (RSK-120) | REQ-035, REQ-069 | (1) review anti-mockup per fase = 0 temuan (REQ-035 AC); (2) setiap chart/KPI menunjukkan sumber data; data demo berlabel; (3) 0 aksi yang berhenti tanpa feedback (loading→hasil) | 6+ | PROPOSED |
| UXR-15 | i18n UI: Bahasa Indonesia default; **0 string UI hard-coded**; seluruh copy melalui locale files (ID lengkap sejak fitur pertama, EN siap); struktur locale files ditetapkan Phase 3 (mis. `messages/id.json` + `messages/en.json` — final di ADR/i18n setup Phase 3, bukan di dokumen ini); istilah mengikuti kamus UXR-02 | MC §5 i18n sejak awal; G-006 (i18n NOT FOUND, string scaffold hard-coded EN); R-07 (refactor mahal bila ditunda) | REQ-028, REQ-032 | (1) scan layar baru = 0 hard-coded string (bukti grep/checklist per fase); (2) locale ID lengkap untuk 100% layar fase berjalan; (3) spot-check EN tidak merusak layout (panjang string berbeda) | 3 (fondasi), 6+ (disiplin) | PROPOSED |
| UXR-16 | Mobile scanner & indikator offline/sync: app shell memiliki indikator status koneksi/sinkronisasi (online / syncing / offline / jumlah item pending) dan scanner mobile mengikuti flow UXR-05. **Perilaku offline penuh (antrean lokal, rekonsiliasi konflik, idempotency, penegakan permission saat sync) MENUNGGU OD-07 — status terbuka**; sebelum keputusan + implementasi teruji, UI dilarang menampilkan klaim "offline mode" | MC §8 "jangan klaim offline support sebelum dites"; REQ-038 terikat OD-07; RSK-105 (konflik sync) | REQ-037, REQ-038 | (1) indikator state koneksi teruji (deteksi online/offline + tampil benar); (2) 0 klaim offline di UI sebelum OD-07 dieksekusi + AC REQ-038 terpenuhi (test sync); (3) setelah OD-07: antrean aman, indikator sync, rekonsiliasi konflik, idempotency, permission ditegakkan saat sync — masing-masing punya test | 13, 24 (OPEN — menunggu OD-07) | PROPOSED |
| UXR-17 | Usability criteria & validation plan: setiap rilis fase utama dievaluasi via **skenario tugas** per persona (§4) + heuristic review sebelum ada klaim usability; metrik dicatat (completion, kesalahan, catatan kualitatif); klaim usability tanpa evaluasi terdokumentasi = dilarang | MC §7 + UX_UI_STANDARD §2.5(3); REQ-091; R-02 (halusinasi klaim); RSK-109 | REQ-091, REQ-032 | (1) setiap rilis fase utama punya catatan evaluasi (skenario + temuan + tindak lanjut) — AC REQ-091; (2) 0 klaim usability di dokumen/report tanpa evaluasi terlampir; (3) temuan usability kritis = blocker rilis fase; (4) mekanisme pelaksanaan (siapa/partisipan) = kandidat OD-182 | 6+ (per fase utama) | PROPOSED |
| UXR-18 | Strategi kanal: **web = kanal kelas utama** (desktop/tablet/mobile browser wajib fungsional); API berbagi dengan klien Android/iOS tanpa duplikasi logika; **Android/iOS menunggu OD-02**; **Windows dianalisis sebagai OPSI (§7) — dokumen ini TIDAK memilih**; landing page tidak menampilkan link download untuk kanal yang belum ada | MC §3 web kanal utama; OD-02 OPEN; R-09/RSK-119 (kontrak API dirancang ulang bila tertunda); anti-mockup REQ-015 | REQ-015, REQ-019, REQ-020, REQ-097 | (1) 100% UXR di dokumen ini form-agnostik terhadap pilihan kanal mobile (tidak mengasumsikan API native spesifik); (2) setelah OD-02: ADR dibuat + UXR terkait direvisi lewat perubahan dokumen (bukan diam-diam); (3) landing page 0 link download palsu (anti-mockup) | 2 (ADR), 22 (landing), 23 (delivery) | PROPOSED |
| UXR-19 | Progressive disclosure & dashboard: default UI sederhana untuk pemula; kedalaman untuk operator ahli (bulk action, advanced filter, keyboard shortcut) tidak mengganggu default; dashboard maxRider/ISOrider menyajikan ringkasan → detail bertahap; chart/KPI dihitung dari data operasi nyata (REQ-069) | MC §7 progressive disclosure; REQ-011/012 fitur kompleks maxRider/ISOrider; G-007 | REQ-011, REQ-012, REQ-069, REQ-089 | (1) setiap layar kompleks punya mode default ringkas + akses kedalaman yang terdokumentasi; (2) 0 chart tanpa sumber data (label demo bila demo); (3) heuristic review progressive disclosure tercatat per fase dashboard | 12–15 (maxRider), 17–21 (ISOrider) | PROPOSED |
| UXR-20 | Konfirmasi aksi berisiko & jejak: inventaris aksi berisiko per modul (hapus, tutup rekrutmen REQ-063, publish listing, kirim broadcast, approve/sign-off, downgrade lisensi, revoke sesi/akses) dengan pola konfirmasi seragam yang menyebut konsekuensi; hasil aksi selalu ber-feedback sukses/gagal; aksi penting teraudit dan jejaknya dapat dilihat bila relevan | MC §7 "tindakan berisiko memiliki konfirmasi"; REQ-032; keterkaitan audit trail REQ-027 | REQ-027, REQ-032, REQ-048, REQ-063 | (1) inventaris aksi berisiko per modul terdokumentasi sebelum fase modul DONE; (2) test: aksi berisiko tanpa konfirmasi = temuan blocker; (3) setelah aksi, status objek berubah & terlihat; (4) aksi tercatat audit log dengan aktor+waktu | 6+ | PROPOSED |

## 2. Rujukan silang topik wajib → UXR

| Topik wajib penugasan | Ditempatkan di |
|---|---|
| IA & navigasi per tier (Home/Event/Asset/Team/Profile + level ISOrider) | UXR-01, UXR-02 |
| First-run onboarding | UXR-03 |
| Kru buka app & lihat konteks event aktif (REQ-007) | UXR-04 |
| Pindah konteks | UXR-04 |
| Scan aset (REQ-067/090) | UXR-05 |
| Isi checklist & upload evidence | UXR-06 |
| Approve dokumen | UXR-07 |
| Broadcast notifikasi dengan pratinjau (REQ-059) | UXR-08 |
| Breakpoint, touch target ≥44px, formulir layar kecil, jaringan buruk (REQ-037) | UXR-09, UXR-10, UXR-11 |
| Aksesibilitas per aspek (REQ-033) | UXR-12 + §6 |
| State completeness (REQ-034) | UXR-13 + §5 |
| i18n (REQ-028) | UXR-15 |
| Scanner & offline indicator (menunggu OD-07) | UXR-16 |
| Usability criteria & validation plan (REQ-091) | UXR-17 + §4 |
| Strategi kanal web/Android/iOS/Windows (OD-02) | UXR-18 + §7 |

## 3. Critical user flows × persona (basis skenario tugas untuk UXR-17)

Persona dirujuk dengan ID tetap P-01..P-12 (definisi: `PERSONAS_AND_JOURNEYS.md` WS-A — diverifikasi cocok). Baris "layar target" adalah TARGET STATE — belum ada implementasi (G-001).

| Flow | Persona utama | Langkah kunci (TARGET) | UXR & REQ terkait | Layar target |
|---|---|---|---|---|
| F1. First-run onboarding owner | P-01, P-02 | Login/verifikasi → buat workspace → orientasi 5 halaman → undang kru | UXR-03; REQ-047, REQ-049, REQ-051 | Login, OTP, Buat workspace, Home |
| F2. Kru buka app & lihat konteks event aktif | P-03 | Login → shell menampilkan event aktif yang ditugaskan → masuk konteks event | UXR-04; REQ-007, REQ-050 | Shell + indikator konteks, Event detail |
| F3. Pindah konteks (multi-penugasan) | P-03, P-04 | Buka picker → pilih event lain → konfirmasi isian belum tersimpan → shell update | UXR-04; REQ-007 | Picker konteks |
| F4. Scan aset | P-03, P-05 | Buka scanner → izin kamera → scan → hasil → aksi (check-in/out/inspeksi/damage) | UXR-05; REQ-036, REQ-067, REQ-090 | Scanner, fallback manual, detail aset |
| F5. Isi checklist & upload evidence | P-03, P-04, P-10 | Buka form → isi hasil → catatan → upload → submit → tunggu review | UXR-06, UXR-10, UXR-11; REQ-043, REQ-083 | Checklist form, upload, status evidence |
| F6. Approve dokumen / sign-off | P-02, P-10 | Buka dokumen → cek versi → approve/reject dengan konfirmasi → terkunci | UXR-07, UXR-20; REQ-080, REQ-083 | Document detail, dialog approval |
| F7. Broadcast notifikasi dengan pratinjau | P-07, P-08 | Pilih audience → pratinjau penerima (jumlah+daftar) → tulis → preview → kirim → lihat status | UXR-08, UXR-20; REQ-059, REQ-060, REQ-017 | Composer notifikasi, status pengiriman |
| F8. Kelola listing Equipment Store (miniRider only) | P-07 | Buat listing → draft → isi stok/harga (menunggu OD-06) → publish terkendali | UXR-20; REQ-010, REQ-055, REQ-056 | Listing editor, catalog |
| F9. CRM/order & keuangan (maxRider) | P-06 Finance/CRM Officer, P-02 | Lihat pelanggan → quotation/order → status payment (sesuai integrasi) | UXR-19, UXR-13; REQ-011, REQ-046 | CRM list, order detail, dashboard |
| F10. Audit view read-only | P-09 | Login scoped time-bound → telusuri dokumen/evidence → export terkendali | UXR-07, UXR-13; REQ-044, REQ-053, REQ-084 | Audit view (read-only) |
| F11. Lamar rekrutmen hiRider | P-03, P-12 Customer (sebagai pihak eksternal bila relevan) | Lihat rekrutmen terbuka → lamar → pantau status; lamaran ≠ akses workspace | UXR-01, UXR-20; REQ-013, REQ-062, REQ-063, REQ-064 | Marketplace, profil kru, status lamaran |
| F12. Recovery akun | P-01..P-03 | Recovery/fallback lintas metode tanpa membuka jalur takeover | UXR-03; REQ-047, REQ-048 | Recovery flow, daftar sesi/device |

Skenario tugas UXR-17 diambil dari tabel ini (F1–F12); metrik evaluasi dicatat saat evaluasi dijalankan — dokumen ini tidak memuat hasil evaluasi karena belum ada yang dijalankan.

## 4. Matriks state × layar kunci (pendukung UXR-13, REQ-034)

Daftar layar kunci = PROPOSED (target state; finalisasi daftar resmi = kandidat **OD-181**). ✔ = wajib ada & teruji; "—" = tidak relevan; (OD-07) = relevansi menunggu keputusan offline-first.

| Layar target (TARGET STATE) | Loading | Empty | Error | Success | Permission denied | Offline/sync pending | Data stale |
|---|---|---|---|---|---|---|---|
| Login / OTP / recovery | ✔ | — | ✔ | ✔ | ✔ (rate limit/lockout REQ-054) | — | — |
| Home / dashboard per tier | ✔ | ✔ | ✔ | — | ✔ | (OD-07) | ✔ |
| Event list & detail (rundown/chat/media kit) | ✔ | ✔ | ✔ | ✔ | ✔ | (OD-07) | ✔ |
| Konteks event aktif & picker switch | ✔ | ✔ (0 penugasan) | ✔ | ✔ | ✔ | (OD-07) | — |
| Technical rider editor | ✔ | ✔ | ✔ | ✔ (draft tersimpan) | ✔ | (OD-07) | ✔ |
| Media kit | ✔ | ✔ | ✔ | ✔ | ✔ | — | ✔ |
| Asset list & detail | ✔ | ✔ | ✔ | ✔ | ✔ | (OD-07) | ✔ |
| Scanner aset | ✔ | — (state kosong n/a) | ✔ (timeout/unknown) | ✔ (hasil ditemukan) | ✔ (izin kamera denied) | (OD-07) | — |
| Checklist / form evidence | ✔ | ✔ | ✔ | ✔ | ✔ | (OD-07) | — |
| Upload evidence | ✔ | ✔ (belum ada file) | ✔ (gagal upload) | ✔ | ✔ | (OD-07) | — |
| Document library & approval | ✔ | ✔ | ✔ | ✔ | ✔ (ACL REQ-082) | — | ✔ |
| Broadcast composer + status | ✔ | ✔ | ✔ | ✔ | ✔ (hak broadcast) | — | ✔ |
| Equipment Store listing (mini) | ✔ | ✔ | ✔ | ✔ | ✔ (tier lain diblokir REQ-010) | — | — |
| CRM / order (maxRider) | ✔ | ✔ | ✔ | ✔ | ✔ | — | ✔ |
| Team & invitation | ✔ | ✔ | ✔ | ✔ | ✔ | — | — |
| Profil kru hiRider (visibilitas) | ✔ | ✔ | ✔ | ✔ | ✔ (privacy REQ-062) | — | — |
| Audit view (read-only, scoped) | ✔ | ✔ | ✔ | ✔ | ✔ (scope/expiry REQ-053) | — | ✔ |

Kolom offline/sync pending yang bertanda (OD-07) wajib ditinjau ulang begitu OD-07 diputuskan; kolom data stale hanya relevan untuk data yang di-cache/diringkas.

## 5. Aksesibilitas per aspek — cara pemeriksaan (pendukung UXR-12, REQ-033)

Target: WCAG 2.2 AA "sejauh praktis & teruji" (MC §7). Metode di bawah adalah PROPOSED; tool spesifik (runner automated) diputuskan saat fondasi testing Phase 3. Nilai rasio kontras adalah kriteria WCAG 2.2 AA (faktanya bagian dari standar yang ditargetkan), bukan temuan pengukuran.

| Aspek | Requirement | Cara pemeriksaan (PROPOSED) | Bukti per fase |
|---|---|---|---|
| Kontras | Teks memenuhi AA (teks normal & teks besar; komponen UI/elements penting) | Automated contrast check + sampling manual pada token warna design system | Hasil scan + daftar pasangan warna lolos/gagal |
| Keyboard | Seluruh fungsi operable tanpa mouse, urutan tab logis, no keyboard trap | Manual keyboard walk-through skenario F1–F12 pada breakpoint desktop & mobile | Checklist per layar (DIUJI/TIDAK DIUJI) |
| Focus state | Focus indicator terlihat jelas pada semua elemen interaktif | Tab visual check + periksa token focus design system | Screenshot focus state |
| Label | Semua input punya label programatik (ter-associate, bukan placeholder saja) | Automated scan + inspeksi DOM pada form layar kunci | Hasil scan + checklist form |
| Heading order | Heading berurutan tanpa lompatan level; satu h1 per layar | Inspeksi outline heading per layar | Outline per layar |
| Error association | Pesan error form ter-associasi ke field & terumumkan ke assistive tech | Inspeksi asosiasi (mis. aria-describedby) + uji dengan screen reader bila tersedia | Checklist form + catatan metode |
| Semantik | HTML semantic (landmark, button/link benar, list/list item) | Automated scan + review DOM; larang div-button | Hasil scan |
| Reduced motion | `prefers-reduced-motion` dihormati (animasi/transisi berkurang) | Emulasi media query + checklist animasi non-esensial | Hasil emulasi |

Catatan kejujuran: belum ada audit a11y yang dijalankan untuk UI produk (belum ada UI — G-001). Semua baris di atas adalah rencana pemeriksaan, bukan hasil.

## 6. Responsive — penerapan breakpoint (pendukung UXR-09)

| Breakpoint | Wajib fungsional | Catatan pola |
|---|---|---|
| Desktop ≥1280 | Semua layar kunci | Layout penuh; kedalaman operator ahli tersedia (UXR-19) |
| Tablet 768–1024 | Semua layar kunci | Navigasi menyesuaikan; tabel memakai pola kolom prioritas |
| Mobile 360–430 | Semua layar kunci + flow lapangan (F2–F5) diberi prioritas | Touch target ≥44px; form satu kolom (UXR-10); footer/kerangka sesuai UX_UI_STANDARD §2.8 |

## 7. Strategi kanal — analisis opsi (BUKAN keputusan)

- **Web** = kanal kelas utama, wajib fungsional di desktop/tablet/mobile browser (MC §3, REQ-019). Tidak terbuka untuk keputusan — ini baseline.
- **Android/iOS** = OPEN menunggu **OD-02** (PWA vs native vs cross-platform vs wrapper). Konsekuensi UX: kontrak API & pola navigasi mobile tidak boleh dikunci sebelum ADR Phase 2 (REQ-020, REQ-097).
- **Windows** = dianalisis sebagai opsi saja (status OPEN, milik OD-02), tanpa rekomendasi penguncian dari dokumen ini:
  1. *Web browser saja (termasuk PWA bila dipilih)* — biaya pemeliharaan terendah; bergantung kemampuan browser (kamera/scanner, offline).
  2. *Wrapper desktop (mis. teknologi wrapper berbasis web engine)* — distribusi desktop nyata; biaya build/signing tambahan; menambah permukaan pemeliharaan.
  3. *Aplikasi desktop native* — akses perangkat paling dalam; biaya & skill tim tertinggi; duplikasi logika harus tetap 0 (MC §3/§5).
  Semua opsi di atas hanya akan dipilih lewat OD-02 + ADR Phase 2; MC §3 melarang mengunci pilihan sebelum audit/analisis biaya-skill selesai.
- Landing page menampilkan link download hanya untuk kanal yang benar-benar ada (anti-mockup; REQ-015).

## 8. Catatan kejujuran & keterbatasan (WAJIB DIBACA)

1. **Belum ada riset pengguna partisipan.** Seluruh UXR-01..UXR-20 adalah desk analysis dari dokumen kontrol (MC, REQ, audit Phase 0) dan standar publik (WCAG 2.2). Tidak ada data pengguna, statistik adopsi, atau hasil usability di dokumen ini.
2. Semua acceptance criteria adalah **basis uji yang diusulkan** (PROPOSED), bukan hasil pengukuran; angka di dalamnya (mis. ≤2 ketukan, ≥44px, 3 breakpoint) berasal dari MC/UX_UI_STANDARD atau usulan gate, bukan temuan riset.
3. Persona mengikuti `PERSONAS_AND_JOURNEYS.md` (WS-A, Task 1-a, status PROPOSED). Verifikasi saat dokumen ini dibuat: ID P-01..P-12 dan nama persona cocok dengan yang dipakai di dokumen ini (termasuk P-08 "Platform Administrator/Support"). Bila dokumen persona berubah, dokumen ini menyesuaikan lewat revisi.
4. Kamus istilah = deliverable Phase 1 pada naming `USE_CASES`/`PRODUCT_SCOPE` (bukan dokumen ini). Kondisi terverifikasi saat penulisan: `PRODUCT_SCOPE.md` ada (WS-A) tetapi TIDAK memuat bagian kamus istilah/terminology (hasil grep); `USE_CASES.md` belum ada di repository. Karena itu gate UXR-02 kriteria (1) berstatus terbuka; penempatan kamus diusulkan sebagai kandidat **OD-180** di `RISK_REGISTER.md` §4.
5. Semua layar/state/matrix di §4–§6 adalah **TARGET STATE**; kondisi nyata repo: hanya 1 halaman placeholder (G-001), tanpa i18n (G-006), tanpa pola state (G-007).
6. Perilaku offline penuh (UXR-16) dan kanal mobile/Windows (UXR-18) sengaja TIDAK diputuskan di dokumen ini (OD-07, OD-02). Tidak ada klaim "offline support", "mobile-ready", atau "usability" di dokumen ini.
7. Dokumen ini tidak membuat REQ baru dan tidak mengubah REQUIREMENTS.md; UXR baru menyusul lewat revisi dokumen dengan ID berikutnya (UXR-21+), tidak mendaur ulang ID.
