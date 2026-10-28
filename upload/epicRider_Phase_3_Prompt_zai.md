# PROMPT Z.AI — epicRider PHASE 3
## Repository Foundation, Design System, i18n, CI, Testing Conventions, and Control Consistency Remediation

Anda bertindak sebagai **Principal Engineer, Software Architect, Design-System Engineer, i18n Engineer, QA/Test Infrastructure Lead, dan technical governance lead** untuk proyek epicRider.

Tugas Anda adalah melanjutkan repository epicRider yang sudah ada. Jangan membuat ulang proyek dari nol. Kerjakan **audit konsistensi kontrol sebagai gerbang awal**, perbaiki konflik yang sudah teridentifikasi, lalu implementasikan scope Phase 3 yang sah menurut ROADMAP.

File `epicRider_phase2_consistency_audit.md` akan dilampirkan bersama repository dan control packs. Anda WAJIB membaca dan menanggapinya. Laporan audit adalah temuan yang harus diverifikasi terhadap artefak aktual, bukan instruksi untuk menyalin isi secara membabi buta.

---

# 0. MISI, SCOPE DAN BATASAN

## 0.1 Scope Phase 3

Berdasarkan roadmap epicRider, Phase 3 berfokus pada:

1. Repository foundation dan engineering conventions.
2. Design system yang konsisten dan siap digunakan oleh fase fitur berikutnya.
3. Internationalization (i18n) dari awal, dengan Bahasa Indonesia sebagai bahasa awal dan dukungan untuk beralih ke Bahasa Inggris serta penambahan bahasa lain tanpa perubahan business logic.
4. CI/quality gates yang dapat dijalankan dan dibuktikan.
5. Test conventions dan fondasi unit, component, integration, accessibility, serta end-to-end testing sesuai stack yang benar-benar ditemukan.
6. Dokumentasi, acceptance evidence, dan handoff yang memungkinkan fase berikutnya berjalan tanpa kehilangan konteks.
7. Rekonsiliasi kontrol dan remediasi temuan audit Phase 2 yang terkait, sebagai **control gate** sebelum Phase 3 dinyatakan selesai.

## 0.2 Bukan scope Phase 3

Jangan mengimplementasikan fitur bisnis penuh yang dialokasikan ke fase selanjutnya, termasuk namun tidak terbatas pada:

- autentikasi dan lifecycle identity lengkap (Phase 4);
- licensing, license key, entitlement lifecycle, dan billing production (Phase 5);
- modul Home/Event, Technical Rider, asset lifecycle, CRM, finance, recruitment UI/backend, IMS workflows, dan production store;
- integrasi provider eksternal produksi yang belum disetujui;
- klaim bahwa produk sudah production-ready, aman secara menyeluruh, lulus pentest, aksesibel sepenuhnya, atau memenuhi sertifikasi ISO.

Implementasikan fondasi UI minimal yang diperlukan untuk menguji design system dan i18n—misalnya halaman/route showcase internal atau development-only—bukan berpura-pura membangun modul bisnis fase berikutnya.

---

# 1. INPUT WAJIB DAN HIERARCHY OF TRUTH

Baca file aktual dari repository dan semua lampiran yang tersedia. Input yang diharapkan:

- TAR/repository epicRider terkini;
- `epicRider_Control_Pack_Complete(1).zip` atau nama versi control pack lengkap yang dilampirkan;
- `epicRider_phase2_control_replacement.zip` atau replacement pack yang tersedia di repository/arsip;
- `epicRider_phase2_consistency_audit.md`;
- seluruh artefak Phase 1 dan Phase 2 yang ada di repository.

Jika nama berkas berbeda, cari berdasarkan isi dan catat path aktualnya. Jangan menganggap file ada hanya dari nama yang disebut di prompt.

Gunakan urutan otoritas berikut:

1. **Keputusan owner eksplisit dalam prompt ini.**
2. Keputusan `ACCEPTED` di `DECISIONS.md` yang tidak digantikan oleh instruksi owner yang lebih baru. Jika terjadi konflik, jangan menghapus sejarah: catat keputusan pengganti dengan alasan, dampak, tanggal/status, dan referensi keputusan sebelumnya.
3. Satu set control documents kanonik yang Anda tetapkan melalui rekonsiliasi dan catat dalam `CONTROL_BASELINE_REGISTER.md`.
4. Requirement Phase 1 yang aktual—termasuk semua ID `REQ-001` sampai `REQ-100` yang sudah ada. Jangan reset atau renumber.
5. Dokumen arsitektur Phase 2 yang sudah diverifikasi konsisten dengan control baseline.
6. `epicRider_phase2_consistency_audit.md` sebagai daftar temuan untuk diverifikasi.
7. Repository/kode sebagai **bukti current state**, bukan penentu diam-diam atas aturan produk.
8. Dokumen historis/superseded sebagai jejak historis saja, kecuali secara eksplisit direaktivasi oleh owner.

Jika dua dokumen kontrol tidak sama, jangan memperlakukan keduanya sebagai sama-sama kanonik. Rekonsiliasikan keduanya, jelaskan dokumen/keputusan mana yang masih berlaku, dan catat versi yang disupersede. Jangan menghapus artefak historis.

`MASTER_CONTROL.md` berisi aturan produk/arsitektur yang relatif stabil. `ROADMAP.md` adalah **satu-satunya sumber kebenaran status fase berjalan**. Jika `PHASE_STATUS.md` ada, dokumen itu merupakan catatan/ringkasan eksekusi yang harus konsisten dengan ROADMAP, bukan sumber status tandingan.

---

# 2. GATE A — AUDIT KONSISTENSI DAN REMEDIASI PHASE 2

Sebelum mengubah kode Phase 3:

1. Inventarisasi kontrol dan artefak aktual.
2. Baca `epicRider_phase2_consistency_audit.md` sampai selesai.
3. Periksa setiap temuan F-01 sampai F-08 terhadap file dan isi aktual. Untuk tiap temuan, pilih status: `CONFIRMED`, `PARTIALLY CONFIRMED`, `NOT CONFIRMED`, `RESOLVED`, `OPEN — OWNER DECISION`, atau `BLOCKED`; sertakan path, bagian/baris yang relevan, bukti, tindakan, dan status setelah tindakan.
4. Buat `PHASE_2_CONSISTENCY_REMEDIATION_REPORT.md` yang merekam hasil tersebut. Jangan hanya menyalin audit.
5. Perbaiki kontrol dan artefak yang berkontradiksi. Pertahankan sejarah, IDs, dan bukti sebelumnya.
6. Jalankan contradiction scan yang mencakup istilah dan **makna semantik**, bukan sekadar pencarian string.
7. Setelah perbaikan, ulangi acceptance Phase 2. Jangan mempertahankan centang PASS yang tidak didukung bukti.

## 2.1 Tindakan wajib atas temuan audit

### F-01 — Dua versi control baseline

- Tetapkan satu control baseline aktif melalui `CONTROL_BASELINE_REGISTER.md`.
- Bedakan dengan jelas control pack lengkap yang dilampirkan, replacement pack yang digunakan sebagai input Phase 2, kontrol aktif di root repository, serta dokumen historis/superseded.
- Rekonsiliasikan keputusan terbaru yang ditegaskan di prompt ini dengan dokumen lainnya.
- Catat nama/versi/path, tanggal yang dapat dibuktikan, file yang menjadi kanonik, file yang diarsipkan sebagai superseded, dan alasan setiap pilihan.
- Jangan menyatakan kedua paket identik kecuali perbandingan substansi mendukungnya.

### F-02 — Status fase bertentangan

- Hapus status fase dinamis dari `MASTER_CONTROL.md`; pertahankan aturan arsitektur stabil saja.
- Tetapkan `ROADMAP.md` sebagai satu-satunya sumber status fase berjalan.
- Sinkronkan `PHASE_STATUS.md`, `PHASE_2_ACCEPTANCE.md`, `PHASE_2_REPORT.md`, dan referensi terkait.
- Jangan secara otomatis menganggap Phase 2 `DONE` karena file tersedia atau laporan sebelumnya menyatakan demikian.
- Status Phase 2 hanya boleh `DONE — architecture baseline` bila konflik wajib telah diperbaiki dan acceptance benar-benar diulang dengan evidence. Jika belum, gunakan status seperti `PARTIAL`, `IN PROGRESS`, atau `BLOCKED` sesuai bukti dan taxonomy status yang aktif.

### F-03 — Batas commerce/store

Wajib modelkan dan dokumentasikan tiga surface/domain yang berbeda. Jangan menggabungkannya hanya dengan mengubah label.

1. **License & Extension Shop**: surface penjualan lisensi dan extension yang terpisah dari Public Store developer. Harus mendukung calon pelanggan yang belum memiliki lisensi untuk membeli lisensi pertama, serta alur perpanjangan/pembelian yang telah disepakati. Tampilkan opsi dan harga hanya jika datanya memang ada; jangan mengarang harga, pajak, payment gateway, atau refund policy.
2. **Public Store**: toko produk developer untuk pengguna epicRider; akses mensyaratkan basic `miniRider`. Bukan license tier dan bukan toko untuk menggantikan jalur pembelian lisensi pertama.
3. **Developer Equipment Store**: toko perlengkapan/peralatan dalam aplikasi yang hanya tersedia bagi `miniRider`; akses `maxRider` dan `ISOrider` harus ditolak pada boundary server/API bila/ketika diimplementasikan nanti.

Perbaiki batas domain, istilah, permission/access notes, model konseptual terkait, `LICENSE_MATRIX.md`, ADR, dan cross-reference. Pada Phase 3, jangan membangun checkout atau commerce production; pastikan kontrol dan arsitektur dokumenter konsisten untuk fase masa depan.

### F-04 — Scope penawaran jasa hiRider tidak konsisten

- Jangan membuat keputusan produk atas nama owner.
- Kontrol lama menyebut profil, skill, portofolio, penawaran jasa, recruitment, lamaran, seleksi dan assignment. Model Phase 2 saat ini mungkin hanya mencakup profile/skill/portfolio/recruitment.
- Rekam pertanyaan `apakah penawaran jasa tetap menjadi scope hiRider?` sebagai `OPEN — OWNER DECISION` di `DECISIONS.md` atau `OPEN_DECISIONS.md` sesuai konvensi ID yang sudah ada.
- Jangan membuat/mendaur ulang ID keputusan atau requirement jika penomoran tidak dapat dibuktikan. Jangan menambahkan requirement baru untuk penawaran jasa sebelum scope disetujui.
- Pertahankan invariant:
  - `Application != Workspace Membership`
  - `Application != Event Assignment`
  - `Acceptance != Automatic Workspace Access`
  - `hiRider != License/Tier`
- Karena Phase 3 berfokus pada fondasi repository/design system/i18n/CI/testing, keputusan penawaran jasa yang terbuka **tidak otomatis memblokir pekerjaan Phase 3 yang tidak bergantung padanya**. Jangan implementasikan fitur hiRider sebagai bagian Phase 3.

### F-05 — Klaim “0 active contradictions” tidak dibuktikan

- Audit ulang setiap checkbox acceptance dan klaim contradiction-free.
- Gunakan hasil scan setelah perbaikan, bukan hasil pencarian lama.
- `PHASE_2_ACCEPTANCE.md` harus menunjukkan status tiap kriteria dengan evidence/link ke file/hasil pemeriksaan.
- Jangan menyatakan `PASS` jika hanya keberadaan file yang dibuktikan.

### F-06 — Referensi section Master Control salah/ambigu

- Buat/update `CONTROL_REFERENCE_CROSSWALK.md` untuk referensi `MC §N`, nomor section lama, anchor, dan file historis.
- Untuk rujukan aktif yang menunjuk ke section tidak ada/salah, ubah ke anchor bernama/section kanonik yang benar atau tandai jelas sebagai referensi historis ke file superseded beserta path/version.
- Jangan melakukan perubahan substansi requirement Phase 1 secara diam-diam.
- Periksa setidaknya `REQUIREMENTS.md`, `DOCUMENT_EVIDENCE_MODEL.md`, `PERSONAS_AND_JOURNEYS.md`, `PHASE_STATUS.md`, ROADMAP, ADR, dan seluruh `MC §N` reference yang ditemukan.

### F-07 — HANDOFF.md belum ada

Buat/update `HANDOFF.md` yang wajib mencatat:
- status fase berdasar evidence;
- control baseline kanonik dan urutan otoritas;
- keputusan diterima, superseded, serta open decisions;
- artefak Phase 2 yang menjadi kontrak teknis;
- gap, risiko, blocker dan dependency;
- command test yang benar-benar dijalankan dan hasilnya;
- rahasia/konfigurasi yang tidak boleh dimasukkan ke repo atau report;
- next actions yang relevan tanpa otomatis memulai fase berikutnya.

### F-08 — Label edisi ISO

- Pertahankan `NOT VERIFIED` sampai status resmi edisi/amendment benar-benar diverifikasi pada sumber otoritatif.
- Jika tidak dapat diverifikasi, tandai sebagai kandidat/`NOT VERIFIED`, jangan tampilkan sebagai edisi yang sudah terkonfirmasi.
- Ini bukan blocker untuk repository foundation, design system, i18n, CI dan testing generik.
- Jangan membuat klaim kesesuaian atau sertifikasi ISO.

## 2.2 Contradiction scan minimum

Lakukan pemeriksaan pencarian dan pemeriksaan semantik atas seluruh repository aktif, minimal pada:

- status Phase 2/3 di `MASTER_CONTROL.md`, `ROADMAP.md`, `PHASE_STATUS.md`, report dan acceptance;
- `License & Extension Shop` vs `Public Store` vs `Developer Equipment Store`;
- kategori barang yang dijual pada tiap store vs persyaratan aksesnya;
- `hiRider license`, `hiRider tier`, `hiRider fourth`;
- `Application != Workspace Membership`;
- `Application != Event Assignment`;
- `Acceptance != Automatic Workspace Access`;
- penawaran jasa hiRider vs model domain/requirements/decisions;
- `OD-02 blocks Phase 2`, `OD-03 blocks Phase 4`, `OD-05 blocks Phase 5`, `OD-06 blocks Phase 14`;
- `OD-116 prerequisite Phase 2`;
- OD-160 atau ISO verification yang secara keliru memblokir arsitektur generik;
- semua referensi `MC §N`/Master Control section/anchor;
- `CRUP` dan typo terdokumentasi lain;
- requirement IDs, duplicate IDs, requirement hilang/baru tanpa traceability;
- klaim `VERIFIED`, `PASS`, `DONE`, `0 contradictions` tanpa evidence pendukung.

Boleh gunakan script pencarian/validasi untuk memperluas scan. Simpan command, hasil, exit code dan keterbatasannya. Pencarian string tidak menggantikan review semantik.

### Gate A exit criteria

Phase 3 boleh dilanjutkan setelah:
- satu control baseline aktif sudah ditetapkan dan direkam;
- F-02, F-03, F-05 diperbaiki;
- F-06 dan F-07 diperbaiki atau setiap item tersisa memiliki alasan dan status yang jujur;
- status Phase 2 dan acceptance telah dihitung ulang berdasarkan evidence;
- tidak ada konflik kritis yang memengaruhi fondasi Phase 3.

F-04 boleh tetap `OPEN — OWNER DECISION` dengan impact tertulis karena tidak perlu diimplementasikan dalam Phase 3. Jangan menyembunyikan atau menyatakan keputusan tersebut sudah selesai. Jika sebuah konflik yang belum terselesaikan benar-benar memengaruhi keputusan teknis Phase 3, hentikan hanya pekerjaan terkait dan jelaskan blocker-nya; jangan membuat asumsi diam-diam.

---

# 3. INVARIANT PRODUK YANG TIDAK BOLEH BERUBAH DI PHASE 3

## 3.1 License dan entitlement

Hanya ada tiga license tiers:
- `miniRider`
- `maxRider`
- `ISOrider`

`hiRider` bukan license, bukan tier keempat, dan bukan nilai `license_tier`.

Model akses konseptual yang dipertahankan:

`License Tier + Active Extension + Capability Rules + Role/Permission + Resource Context + Object State → Effective Access`

Security-sensitive authorization, tenancy dan entitlement nantinya harus ditegakkan di server/domain/API; menyembunyikan elemen UI saja bukan security control. Phase 3 hanya membuat pola UX/design-system yang mendukungnya; jangan mengimplementasikan seluruh authorization pada fase ini.

## 3.2 Identitas, workspace dan recruitment

Pertahankan pemisahan konseptual:
- User identity != Workspace Membership
- Workspace Membership != Event Assignment
- Recruitment Application != Workspace Membership
- Recruitment Application != Event Assignment
- Acceptance != Automatic Workspace Access

## 3.3 Bahasa dan UI/UX

- Bahasa default awal: Bahasa Indonesia.
- Pengguna dapat mengganti bahasa secara sistemik tanpa mengubah business logic.
- Semua string UI baru harus menggunakan mekanisme i18n, bukan hard-coded pada komponen.
- UI/UX adalah quality gate lintas fase: premium dan modern, konsisten, jelas, intuitif, minim langkah, responsif, aksesibel, serta berorientasi tugas.
- Setiap komponen/state yang relevan harus dapat menampilkan loading, empty, validation error, service error/retry, success, permission denied, expired entitlement, offline/sync state jika relevan, destructive confirmation dan progress state.
- Jangan membuat data, chart, metrik, status atau hasil palsu untuk membuat UI terlihat lengkap.

---

# 4. GATE B — AUDIT CURRENT REPOSITORY DAN ENGINEERING BASELINE

Setelah Gate A, audit repository sebelum memilih perubahan:

1. Identifikasi framework, runtime, package manager, lockfile, build tool, lint/formatter, testing framework, routing, CSS strategy, existing CI provider dan directory conventions aktual.
2. Jalankan hanya perintah inspeksi yang aman terlebih dahulu. Jangan mencetak `.env`, secrets, token, private keys atau data pribadi ke output/report.
3. Jangan mengganti framework, package manager, router, CSS stack atau testing framework hanya berdasarkan preferensi pribadi. Pertahankan stack yang ada kecuali ada blocker teknis terverifikasi dan perubahan disertai ADR yang menjelaskan alternatif, migrasi dan rollback.
4. Jangan menghapus/mengganti data, migrasi, lockfile atau artefak historis tanpa alasan dan pencatatan.
5. Cari konfigurasi berisiko seperti build error yang diabaikan, lint/typecheck yang dimatikan, test command palsu, test suite kosong, coverage yang hanya diklaim, dependency tidak terpakai dan duplikasi toolchain.
6. Jika ditemukan `.env`, jangan buka/menyalin rahasianya ke laporan. Pastikan file secret tidak ter-commit; sediakan `.env.example` hanya dengan placeholder bernama jelas. Jangan menghapus konfigurasi lokal yang dibutuhkan tanpa prosedur aman. Jika secret mungkin pernah terpapar, tandai sebagai risiko dan rekomendasikan rotasi—jangan tampilkan nilainya.
7. Catat current baseline menggunakan status yang benar: `VERIFIED`, `PARTIAL`, `NOT FOUND`, `NOT TESTED`, `BLOCKED`, `PROPOSED`, atau `UNKNOWN / NEEDS DECISION` sesuai taksonomi kontrol yang aktif. Jangan menyebut kondisi current sebagai target state.

Buat `PHASE_3_CURRENT_STATE_AUDIT.md` yang mencantumkan bukti untuk:
- struktur repo dan stack yang ditemukan;
- existing commands dan statusnya;
- current CI status;
- current unit/component/e2e test coverage yang benar-benar tersedia;
- existing design tokens/components;
- existing i18n implementation;
- known build/lint/type errors;
- secret/configuration hygiene;
- keputusan teknis yang perlu dipertahankan.

---

# 5. PHASE 3 IMPLEMENTATION — REPOSITORY FOUNDATION

Perbaiki dan bentuk fondasi secara inkremental, sesuai stack yang terverifikasi.

## 5.1 Engineering conventions

- Pastikan package manager dan lockfile konsisten; gunakan mode install deterministik di CI.
- Sediakan script yang nyata dan bisa dijalankan untuk `lint`, `typecheck` (bila stack mendukung), `test`, `build`, dan format/check-format yang relevan.
- Tetapkan convention folder, penamaan, error handling, environment config, import boundaries dan public exports yang sesuai dengan pola repository.
- Tambahkan/perbaiki `.editorconfig`, `.gitignore`, formatting/lint rules, contoh environment configuration, dan dokumentasi developer seperlunya tanpa menambah duplikasi.
- Jangan menggunakan `ignoreBuildErrors: true`, disable lint/typecheck global, atau mock hasil test untuk menyamarkan kegagalan. Jika error lama menghalangi Phase 3, perbaiki bila masih dalam scope; jika tidak, catat baseline error, justifikasi, pemilik tindak lanjut dan gate yang harus dilewati. Jangan mengklaim quality gate lulus bila ia sengaja dilewati.
- Hindari instalasi dependency besar/duplikat; jelaskan alasan dependency baru.
- Jangan membuat abstraksi berlebihan atau arsitektur framework di atas kebutuhan yang belum ada.

## 5.2 Design system foundation

Buat/perbaiki design system yang terstruktur dan bisa dipakai konsisten pada fase berikutnya. Gunakan pendekatan yang sesuai dengan stack yang ditemukan, bukan asumsi framework baru.

Minimal cakupan:

### Design tokens
- warna semantic (foreground, background, surface, border, muted, primary, success, warning, danger, info);
- typography scale, font weights dan line heights;
- spacing scale;
- radius, elevation/shadow;
- responsive breakpoints;
- focus ring, transition/motion dan reduced-motion behavior.

Jangan mengandalkan warna saja untuk menyatakan status. Pastikan kontras memadai dan state tetap terbaca dalam tema yang didukung. Pilih palette yang premium dan profesional tanpa mengorbankan kejelasan. Jangan menambah dark mode sebagai scope wajib jika belum ada keputusan/struktur yang tepat; bila existing, pastikan token konsisten.

### Komponen dasar
Implementasikan hanya komponen umum yang benar-benar berguna, misalnya:
- Button: variants, sizes, disabled/loading;
- form controls: Label, Input, Select, Checkbox, Textarea dan validation help;
- Badge/Status indicator;
- Card/Surface;
- Alert/Inline message;
- Spinner/Skeleton/Progress;
- EmptyState;
- ErrorState dan retry pattern;
- PermissionDenied;
- dialog/modal atau confirmation pattern bila tersedia pada stack;
- Toast/notification pattern bila sudah sesuai arsitektur;
- layout/container/navigation primitives yang diperlukan untuk demo fondasi.

Jangan membuat puluhan komponen tanpa kebutuhan. Gunakan semantik HTML/native controls bila tepat. Tetapkan API props/types dan dokumentasikan pola pemakaian.

### Accessibility dan responsive behavior
- keyboard navigation dan focus terlihat;
- label dan accessible name yang benar;
- kontras yang memadai;
- semantic structure dan ARIA seperlunya, bukan menambahkan ARIA sembarangan;
- tombol/link/controls memiliki target interaksi yang wajar untuk touch;
- validasi/error tidak bergantung pada warna saja;
- hormati `prefers-reduced-motion` bila animasi ada;
- tes tampilan desktop, tablet, dan narrow mobile sesuai komponen/route yang dibuat.

Jika tooling accessibility tersedia, gunakan. Jika tidak, lakukan pemeriksaan manual yang dapat direproduksi dan tulis keterbatasannya.

## 5.3 i18n dari awal

Implementasikan i18n yang cocok dengan router/framework yang benar-benar digunakan.

Wajib:
- locale default `id` (Bahasa Indonesia);
- locale minimal yang didukung: `id` dan `en`;
- sistem pemetaan key-string yang terstruktur;
- language switcher pada showcase/shell fondasi bila terdapat UI;
- semua string UI baru—label, button, validation, empty/error/success state, navigasi dan metadata yang terlihat—diambil melalui i18n;
- penanganan fallback bila key hilang tanpa memunculkan error tak tertangani;
- tidak ada pergantian bahasa yang mengubah business logic atau permission;
- locale-aware formatting tanggal/angka/mata uang melalui API standar/localization library yang dipilih;
- aturan persistence bahasa yang aman dan konsisten dengan aplikasi (misalnya preference user bila identity tersedia nanti, dan fallback local preference/browser locale sebelum itu);
- hindari hydration mismatch atau server/client locale mismatch sesuai framework;
- dokumentasikan cara menambahkan bahasa dan cara mengaudit string yang masih hard-coded.

Jangan mengarang copy bisnis yang membuat klaim produk/paket/standar. Gunakan teks placeholder yang netral pada showcase dan beri label yang jelas bila contoh bersifat demo.

## 5.4 UI showcase / foundation route

Sediakan satu halaman/route development showcase untuk menampilkan design tokens, base components, states, dan language switching. Jika sistem route tidak mendukung development-only route dengan baik, buat storybook-like page atau dokumentasi preview yang sesuai dengan stack.

Showcase bukan business feature dan tidak boleh mengekspos informasi sensitif. Jika dapat diakses pada production build, pastikan tidak menampilkan debug secrets, user data, fake business metrics atau tooling internal.

Tampilkan setidaknya contoh:
- typography, palette/token semantic dan spacing;
- button dan form control states;
- loading, empty, error/retry, success, permission denied;
- responsive behavior;
- Bahasa Indonesia ↔ English.

Jika screenshot diambil, gunakan hanya sebagai bukti visual tambahan; jangan menyebut screenshot sebagai bukti test bisnis.

---

# 6. CI, TEST CONVENTIONS DAN QUALITY GATES

## 6.1 CI pipeline

Gunakan CI provider yang sudah ada. Jika tidak ditemukan, tambahkan pipeline minimal pada provider yang paling sesuai dengan repository hosting yang dapat dibuktikan; jika hosting tidak jelas, dokumentasikan asumsi dan pilih solusi yang mudah dipindah.

CI sebaiknya menjalankan sesuai urutan:
1. install dependencies secara deterministik;
2. lint;
3. typecheck;
4. unit/component tests;
5. build;
6. accessibility/e2e smoke check bila tool dan test yang relevan tersedia.

Ketentuan:
- tidak ada secrets di workflow atau logs;
- gunakan permissions minimum;
- versi runtime/tooling dipatok secara konsisten sejauh diperlukan;
- cache aman dan tidak menggantikan install/test;
- kegagalan quality gate membuat job gagal, bukan diabaikan;
- tidak boleh mengklaim pipeline berjalan di remote jika hanya diperiksa lokal;
- tulis nama workflow, trigger dan command yang dijalankan.

Jika CI remote tidak bisa dipicu dari lingkungan ini, statusnya `NOT TESTED` atau `BLOCKED`, bukan `VERIFIED`.

## 6.2 Test architecture

Tetapkan konvensi yang sederhana, terpisah, dan terdokumentasi untuk:
- unit tests: fungsi/logic murni;
- component tests: states, interaction, accessible semantics dan i18n;
- integration tests: batas antar modul yang sudah ada;
- e2e/smoke: critical route/startup serta language switching bila dapat dijalankan;
- accessibility checks sesuai tooling/stack.

Jangan menambahkan test framework kedua untuk pekerjaan yang sudah ditangani framework existing kecuali ada alasan eksplisit.

Minimal tests wajib mencakup:
- semua locale memiliki key yang diperlukan oleh komponen showcase;
- fallback string/key yang hilang bekerja sesuai kebijakan;
- language switcher mengubah string yang terlihat tanpa mengubah route/logic yang tidak berkaitan;
- komponen Button, form control dan status memiliki disabled/loading/error states yang tepat;
- EmptyState/ErrorState/PermissionDenied menampilkan copy yang dilokalkan;
- interaksi dasar dapat dijalankan dengan keyboard untuk komponen yang relevan;
- main showcase route dapat dimuat;
- build/lint/typecheck commands benar-benar menjalankan tool yang dimaksud.

Jangan menambah coverage threshold arbitrer jika baseline existing belum diukur. Bila threshold ditetapkan, jelaskan rasionalnya dan pastikan ia benar-benar ditegakkan.

## 6.3 Testing evidence

Untuk setiap command yang dijalankan, rekam:
- command lengkap;
- exit code;
- pass/fail dan ringkasan hasil;
- failure yang belum diselesaikan;
- batasan lingkungan dan test yang tidak dijalankan.

Jangan membuat output test buatan, jangan mengedit laporan agar terlihat lulus, dan jangan menyamakan `build passed` dengan acceptance keseluruhan.

---

# 7. FILE DAN DOKUMENTASI YANG HARUS DIUPDATE/DIBUAT

Sesuaikan dengan pola file yang ditemukan; jangan membuat duplikasi jika file yang setara sudah ada. Minimal pastikan deliverable berikut tersedia atau diperbarui:

## Control dan audit
- `MASTER_CONTROL.md` — aturan stabil, tidak menyimpan status fase dinamis;
- `ROADMAP.md` — satu-satunya source of truth untuk status fase;
- `PHASE_STATUS.md` — konsisten sebagai ringkasan/rekaman fase, bukan sumber status tandingan;
- `DECISIONS.md` dan/atau `OPEN_DECISIONS.md` — keputusan tetap terlacak;
- `CONTROL_BASELINE_REGISTER.md` — versi input, sumber kanonik, superseded packs dan hierarchy;
- `CONTROL_REFERENCE_CROSSWALK.md` — mapping referensi Master Control lama ke section/anchor kanonik;
- `PHASE_2_CONSISTENCY_REMEDIATION_REPORT.md` — disposition F-01..F-08 dan contradiction scan;
- `PHASE_2_ACCEPTANCE.md` dan `PHASE_2_REPORT.md` — status hanya berdasarkan evidence aktual;
- `PHASE_3_CURRENT_STATE_AUDIT.md`;
- `PHASE_3_ACCEPTANCE.md`;
- `PHASE_3_TRACEABILITY.md`;
- `PHASE_3_REPORT.md`;
- `HANDOFF.md` — wajib untuk handoff akhir.

## Engineering dan design system
- dokumentasi developer onboarding/conventions (`README.md`, `CONTRIBUTING.md` atau dokumen setara sesuai kondisi repo);
- scripts lint/typecheck/test/build/format yang nyata;
- config design tokens dan base components;
- struktur i18n dengan locale `id` dan `en`;
- showcase route/page atau bentuk preview setara;
- config test/unit/component/e2e yang sesuai kebutuhan dan stack;
- CI workflow;
- `.editorconfig`, `.gitignore`, `.env.example` atau equivalent jika relevan.

Jangan membuat file kosong demi memenuhi daftar. Setiap deliverable harus mempunyai isi yang berfungsi dan terhubung dengan bukti. Jika suatu artefak tidak relevan atau tidak dapat dibuat, jelaskan alasannya.

---

# 8. REQUIREMENT TRACEABILITY DAN CHANGE CONTROL

- Pertahankan semua requirement Phase 1 yang benar-benar ada: `REQ-001` sampai `REQ-100` bila set tersebut dikonfirmasi di repository.
- Jangan reset, renumber, menghapus atau mengubah makna requirement secara diam-diam.
- Requirement baru hanya ditambahkan bila benar-benar diperlukan, disetujui menurut control policy, memiliki ID berikutnya yang belum dipakai, sumber/rasional, acceptance criteria dan traceability. Jangan menciptakan requirement baru untuk menutup keputusan scope hiRider yang belum disetujui.
- Phase 3 requirements harus dihubungkan ke requirement atau control yang sudah ada bila sesuai; bila tidak ada, catat sebagai implementation/engineering requirement baru sesuai convention tanpa menimpa ID historis.
- Traceability minimum: Control/Requirement → Phase 3 deliverable → code/config/docs path → test/validation evidence → result/status.
- Setiap perubahan keputusan arsitektur yang substantif harus memiliki ADR atau update keputusan dengan alasan, alternatif, konsekuensi, migration/rollback dan status.

---

# 9. SECURITY DAN DATA HYGIENE

Walau Phase 3 bukan fase implementasi autentikasi, jangan merusak fondasi keamanan:

- tidak ada secrets dalam source, test fixture, screenshot, logs, documentation, zip/tar output atau CI config;
- `.env.example` berisi placeholder saja, bukan secret aktif;
- jangan mencetak isi `.env` atau membuka database yang mungkin berisi data sensitif tanpa kebutuhan jelas;
- jangan mengekspos showcase/debug routes atau internal test utilities tanpa kontrol yang sesuai;
- dependency baru harus wajar dan dijelaskan; jangan menggunakan dependency yang tidak dipelihara jika alternatif aman tersedia;
- permission CI minimum;
- hindari menambah data pribadi atau test fixture yang menyerupai data nyata;
- dokumentasikan risiko yang ditemukan dan tindakan mitigasi tanpa membeberkan nilai rahasia.

---

# 10. DEFINITION OF DONE — PHASE 3

Phase 3 hanya dapat dinyatakan `DONE` jika seluruh kriteria relevan berikut memiliki evidence:

1. Satu control baseline yang kanonik dicatat; konflik antar control packs tidak lagi ambigu.
2. Remediasi F-01..F-08 ditriase dan statusnya didukung bukti; F-04 boleh tetap open hanya dengan impact dan owner decision yang jelas.
3. `MASTER_CONTROL.md`, `ROADMAP.md` dan `PHASE_STATUS.md` tidak saling bertentangan.
4. Commerce/store boundaries mengikuti tiga surface berbeda: License & Extension Shop, Public Store, Developer Equipment Store.
5. `PHASE_2_ACCEPTANCE.md` tidak memiliki centang PASS palsu; status Phase 2 mencerminkan hasil audit.
6. Referensi section Master Control yang aktif dapat ditelusuri ke section/anchor kanonik atau secara eksplisit menunjuk ke dokumen historis.
7. `HANDOFF.md` tersedia dan cukup untuk melanjutkan kerja.
8. Stack dan current-state baseline terdokumentasi, tanpa mengarang hasil.
9. Design tokens dan base components tersedia, konsisten, dapat digunakan ulang, responsif dan memperhatikan aksesibilitas.
10. Bahasa Indonesia menjadi locale default dan Bahasa Inggris bekerja melalui i18n; string UI baru tidak di-hard-code.
11. Test yang relevan untuk i18n, komponen dasar, keyboard/accessibility checks, dan showcase telah dijalankan atau statusnya jujur ditandai belum diuji/blocked.
12. Lint/typecheck/test/build scripts betul-betul menjalankan tool yang dimaksud dan tidak menyamarkan error.
13. CI dikonfigurasi dengan permission minimum, deterministic install, failure gates dan dokumentasi.
14. Tidak ada secret yang ditambahkan atau tercetak; perubahan konfigurasi aman dan terdokumentasi.
15. `PHASE_3_REPORT.md` mencantumkan files changed, commands, exit codes, evidence, limitations, blockers dan residual risks.
16. `ROADMAP.md` diubah ke status Phase 3 sesuai bukti saja; Phase 4 tidak dimulai otomatis.

Jika suatu kriteria tidak terpenuhi, gunakan `PARTIAL`, `BLOCKED`, atau status yang tepat. Jangan mengubahnya menjadi `DONE` agar roadmap terlihat maju.

---

# 11. OUTPUT AKHIR WAJIB DARI Z.AI

Pada akhir eksekusi, tampilkan ringkasan yang jujur dan terstruktur:

1. **Gate A — hasil audit konsistensi Phase 2:** status untuk F-01 sampai F-08, bukti utama, tindakan korektif, dan residual issue.
2. **Control baseline final:** file kanonik, versi yang dipertahankan, dokumen yang disupersede, dan alasan.
3. **Phase 3 implementation:** daftar perubahan kode/config/docs dengan ringkasan dampak.
4. **Quality gates:** tabel command, exit code, hasil dan batasan untuk lint/typecheck/tests/build/CI/accessibility.
5. **Acceptance checklist:** setiap kriteria `PASS`, `PARTIAL`, `BLOCKED`, `NOT TESTED`, atau `NOT APPLICABLE` disertai bukti.
6. **Open decisions:** terutama keputusan scope penawaran jasa hiRider dan keputusan teknis lain yang benar-benar masih terbuka.
7. **Security/configuration note:** hanya status dan path, jangan pernah mencetak secret.
8. **Phase status:** status Phase 2 dan Phase 3 yang konsisten dengan ROADMAP.
9. **Next phase recommendation:** apakah fondasi sudah siap untuk Phase 4, beserta syarat yang masih harus dipenuhi.
10. **HANDOFF.md:** pastikan dibuat/diupdate di repository.

Jangan membuat hasil fiktif. Jangan menyatakan remote CI sukses jika hanya konfigurasi file yang dibuat. Jangan mengklaim pentest, usability test, production readiness, certification atau full accessibility audit jika tidak benar-benar dijalankan.

---

# 12. INSTRUKSI PELAKSANAAN

Mulai dengan membaca semua input dan mengeluarkan ringkasan singkat current state serta rencana eksekusi. Kemudian kerjakan Gate A, Gate B, implementasi Phase 3, testing, contradiction scan akhir, dan report secara berurutan dalam sesi kerja yang sama sejauh lingkungan mengizinkan.

Jangan berhenti hanya dengan memberi rekomendasi. Lakukan perbaikan pada repository jika file dapat diedit dan perubahan dapat divalidasi. Bila ada hambatan teknis nyata, selesaikan bagian lain yang tidak bergantung pada hambatan itu dan tandai blocker dengan jelas. Jangan mulai Phase 4 secara otomatis.
