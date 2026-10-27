# MASTER CONTROL — epicRider

**Status dokumen:** Baseline arahan produk yang disepakati; diadopsi ke repository pada Phase 0 (2026-05-22) dari lampiran `epicRider_Master_Control.md`. Isi substansi tidak diubah selama adopsi.
**Status implementasi:** Belum ada fase yang boleh dianggap selesai sebelum audit repository dan bukti penerimaan tersedia. Lihat `PHASE_STATUS.md` untuk status per fase berbasis bukti.
**Bahasa dokumen:** Indonesia. Nama API, kode, identifier, dan istilah teknis dapat menggunakan bahasa Inggris secara konsisten.

> **Catatan Phase 0 (audit):** Audit repository (lihat `PHASE_0_AUDIT_REPORT.md`) menunjukkan bahwa repository saat ini masih scaffold Next.js tanpa implementasi epicRider. Semua aturan di dokumen ini adalah TARGET STATE kecuali dinyatakan lain. Status standar ISO di §9 masih memerlukan verifikasi ke katalog resmi (lihat `ISO_IMS_BLUEPRINT.md`).

## 1. Misi dan visi

epicRider adalah satu platform berbasis web dan aplikasi pendamping untuk mengelola operasi bisnis perusahaan multimedia, event, production, broadcast, dan jasa rental audio, kamera, visual/lighting serta perlengkapan terkait. Platform harus cocok untuk pelaku rumahan/perorangan, startup, usaha yang bertumbuh, sampai organisasi dengan sistem manajemen terintegrasi.

Prinsip utamanya: perusahaan bertumbuh melalui satu fondasi data dan proses yang berkesinambungan, bukan berpindah ke aplikasi terpisah atau membangun ulang database saat naik tingkat lisensi.

## 2. Produk dan batas lisensi

### miniRider
- Workspace berbasis event.
- Halaman utama: Home, Event, Asset, Team, Profile.
- Technical rider dapat berupa draft dan harus terhubung ke event yang akan menggunakannya.
- Media kit dapat dibuat dari template dan harus terkait dengan event yang menggunakannya.
- Pengelolaan aset dasar dan asset/set template.
- Saat kru membuka aplikasi, konteks event aktif yang ditugaskan kepadanya ditampilkan secara jelas; sediakan cara aman untuk berpindah konteks jika memiliki beberapa penugasan.
- Halaman event: Chat, Rundown, Media Kit, update informasi/laporan antar anggota tim.
- Batas awal maksimal 5 kru per workspace. Definisi apakah owner ikut dihitung dalam kuota adalah keputusan bisnis terbuka yang harus diputuskan sebelum billing/seat enforcement dikunci.
- Developer Equipment Store di dalam aplikasi hanya tersedia pada miniRider.

### maxRider
Mewarisi core miniRider (kecuali visibilitas Developer Equipment Store di dalam aplikasi) dan menambahkan CRM/pelanggan, keuangan/komersial, operasi rental dan siklus hidup aset penuh, maintenance, pemeriksaan, readiness, role/permission dinamis, workflow, dashboard, risk/HSE dan kontrol operasi.

### ISOrider
Mewarisi core maxRider dan mengintegrasikan Integrated Management System (IMS) digital: mutu, sustainability, K3/HSE, lingkungan, keamanan informasi, business continuity, risiko, audit, controlled documented information, bukti, kompetensi, vendor/kontraktor, keluhan, ketidaksesuaian, corrective action, management review dan continual improvement.

### hiRider
Marketplace layanan kru yang terhubung dengan profil, skill, portofolio, workspace, event, dan rekrutmen. Kru dapat mengelola beberapa workspace mandiri sesuai lisensi. Kru bisa melamar hanya pada rekrutmen yang terbuka dan memenuhi akses/kriteria; owner dapat menutup rekrutmen. Status lamaran tidak otomatis memberikan akses workspace/event.

### Website publik dan Developer Portal
Landing page epicRider mempromosikan produk, lisensi, extensions, akses tester, tautan download Android/iOS/Windows, dan login. Dari landing page, developer dengan hak khusus dapat login ke Developer Portal untuk mengelola katalog/listing toko, stok, harga, diskon, media produk, status publikasi, dan fungsi toko lain yang disetujui.

Developer yang berwenang dapat mengirim notifikasi kepada seluruh workspace, workspace terpilih, user tertentu, atau daftar user yang dipilih. Harus ada verifikasi hak akses, pratinjau penerima, pembatasan pengiriman, audit log, deduplikasi/idempotency, status pengiriman, dan proteksi penyalahgunaan.

## 3. Extensions dan kanal akses

Extensions potensial meliputi workspace tambahan, paket penambahan 10 seat kru per workspace, aplikasi mobile/tablet, landing page workspace, dan extension lain yang disetujui. Detail harga, billing, pajak, refund dan payment gateway adalah keputusan bisnis/implementasi terbuka; jangan mengarang nilai.

Web adalah kanal kelas utama dan harus berfungsi pada desktop, tablet, dan browser mobile. Backend/API harus dirancang agar dapat digunakan oleh web dan aplikasi Android/iOS tanpa logika bisnis duplikat. Phase 0 mengevaluasi PWA vs native/cross-platform dan strategi Windows berdasarkan repository, target distribusi, kemampuan perangkat, offline needs, biaya pemeliharaan, dan skill tim; jangan mengunci pilihan stack sebelum audit.

## 4. Autentikasi

Wajib mendukung:
1. WhatsApp login request: nomor saja bukan bukti identitas. Alur harus membuktikan kontrol atas akun/nomor melalui mekanisme terverifikasi yang dipilih setelah feasibility/vendor review; token/request sekali pakai, waktu kedaluwarsa, anti-replay, rate limiting, anti-abuse monitoring, audit events, dan recovery/fallback.
2. Google Sign-In/SSO menggunakan OAuth 2.0 / OpenID Connect dengan validasi state/nonce, issuer, audience, signature, expiry, redirect URI, dan account-linking yang aman.

Jangan menaruh secrets di frontend atau repository. Jangan menyatakan WhatsApp authentication sudah terimplementasi tanpa bukti alur dan verifikasi.

## 5. Prinsip arsitektur yang tidak boleh dilanggar

- Satu platform, satu domain model inti, multi-tenant/multi-workspace dengan isolasi yang terbukti.
- Perbedaan lisensi dikendalikan melalui entitlement server-side; menyembunyikan menu di UI bukan kontrol keamanan.
- Identitas global user terpisah dari workspace membership, role, event assignment, developer role, dan auditor access.
- Permission memeriksa aktor, tenant/workspace, objek, aksi, konteks event, lisensi, serta status objek bila relevan.
- Pengembangan tier lebih tinggi memperkaya kemampuan domain yang sama; jangan membuat database paralel mini/max/ISO.
- Core flow: **Process → Control → Workflow → Transaction → Evidence → Report/Improvement**.
- Dokumen, checklist, signature, audit finding, NCR/CAPA, asset, maintenance dan sustainability harus terhubung ke transaksi/proses sebenarnya.
- Approved records/evidence tidak boleh dihapus atau diubah diam-diam; koreksi melalui amendment/version history.
- i18n sejak awal; Bahasa Indonesia default, siap untuk Inggris dan bahasa lain. Hindari hard-coded UI strings.
- Semua perubahan schema melalui migration terkontrol, reversible bila layak, serta mempertimbangkan data lama.
- API dan domain rules harus digunakan bersama oleh web dan mobile; jangan menyalin logic otorisasi/billing ke client.
- Jangan memilih atau mengganti framework/library/database tanpa audit, alasan terukur dan ADR.

## 6. Lisensi dan Store

Store publik untuk lisensi dan extension tetap dapat diakses pengguna miniRider, maxRider, dan ISOrider. Ini berbeda dari **Developer Equipment Store di dalam aplikasi**, yang hanya muncul pada miniRider dan harus diblokir pula di API untuk tier lainnya.

Developer Portal tidak otomatis sama dengan hak untuk mengubah lisensi, billing, atau mengirim notifikasi global. Gunakan role terpisah dan prinsip least privilege. Semua perubahan harga, stok, diskon, publikasi dan notifikasi harus dapat diaudit.

## 7. UI/UX sebagai quality gate lintas fase

Kualitas visual dan kemudahan penggunaan adalah persyaratan produk, bukan pekerjaan kosmetik di akhir.
- Visual premium, modern, rapi, konsisten, memiliki hierarchy informasi yang kuat, layout bernapas, tipografi dan warna terkontrol, serta tidak bergantung pada ornamen berlebihan.
- Interaksi intuitif: istilah konsisten, navigasi dapat diprediksi, tugas utama menempuh langkah minimum yang wajar, tindakan berisiko memiliki konfirmasi, dan status proses selalu jelas.
- Responsive untuk desktop/tablet/mobile browser; touch target memadai dan formulir mudah digunakan pada layar kecil.
- Aksesibilitas ditargetkan sekurangnya WCAG 2.2 AA sejauh praktis dan teruji: kontras, keyboard, focus state, label, heading, error association, semantik, reduced motion.
- Setiap layar penting memiliki state loading, empty, error, success, permission denied, offline/sync pending bila relevan, dan data stale bila relevan.
- Tidak boleh ada tombol/link palsu, aksi tanpa respons, placeholder yang menyamar sebagai fitur selesai, chart atau data bisnis palsu tanpa label demo.
- Gunakan design tokens, komponen dan pola formulir konsisten; hindari per-screen style yang menyimpang.
- Gunakan progressive disclosure untuk fitur kompleks; default UI sederhana bagi pemula tetapi menyediakan kedalaman untuk operator ahli.
- Validasi melalui skenario tugas pengguna/heuristic review, keyboard/responsive checks dan visual regression bila tersedia. Klaim usability tidak boleh dibuat tanpa evaluasi yang dilakukan.
- Fase 0 menetapkan standar dan mengaudit kondisi nyata; fase implementasi selanjutnya wajib memenuhi standar tersebut.

Standar operasional lintas fase dirinci di `UX_UI_STANDARD.md`.

## 8. Mobile, scanner dan offline

- Arsitektur mendukung web + Android + iOS melalui API/kontrak yang sama. Strategi PWA/native/cross-platform harus dipilih setelah audit dan ADR.
- Fitur kritis lapangan seperti melihat event, rundown, checklist, bukti, inspeksi aset dan pelaporan harus dievaluasi untuk penggunaan mobile dan kondisi jaringan buruk.
- maxRider harus dapat menghasilkan QR/barcode unik, mencetak label, dan scan melalui browser/web yang mendukung serta mobile app untuk lookup aset, inspeksi, pergerakan, check-in/out, maintenance, damage/incident reports.
- Offline-first untuk workflow lapangan diputuskan berdasarkan risiko dan kebutuhan; bila didukung, harus memiliki antrean lokal yang aman, indikator sinkronisasi, konflik yang dapat direkonsiliasi, idempotency dan audit trail. Jangan mengklaim offline support sebelum dites.
- Hak akses tetap ditegakkan saat tindakan disinkronkan kembali ke server.

## 9. IMS, standar dan keberlanjutan

ISOrider adalah platform pendukung IMS, bukan jaminan sertifikasi. Scope awal untuk evaluasi relevansi meliputi:
- ISO 9001:2026 — quality management requirements.
- ISO 20121:2024 — event sustainability management.
- ISO 45001:2018 — occupational health and safety.
- ISO 14001:2026 — environmental management.
- ISO/IEC 27001:2022 beserta amendment yang relevan — information security management.
- ISO 22301:2019 beserta amendment yang relevan — business continuity.
- ISO 31000:2018 — risk management guidance; jangan diperlakukan sebagai standar sertifikasi.
- ISO 19011:2026 — auditing management systems guidance.
- ISO 10013:2021 — documented information guidance.
- ISO 10005:2018 — quality plans guidance.

Daftar tersebut adalah baseline kandidat, bukan klaim semua standar wajib untuk setiap pelanggan. Pada Phase 0/IMS design, verifikasi status/edisi/amendment melalui katalog resmi ISO dan sumber resmi lain; catat tanggal verifikasi, URL, status, applicable scope, dan confidence. Bedakan requirements standards, guidance standards, peraturan hukum/kontrak, serta best practice. Identifikasi hukum dan kewajiban lokal yang relevan berdasarkan yurisdiksi dan kegiatan; jangan membuat kesimpulan legal tanpa validasi ahli.

Jangan menyalin teks standar berhak cipta ke aplikasi. Bangun mapping, metadata referensi berlisensi/diizinkan, kontrol organisasi, dan bukti orisinal sesuai hak penggunaan.

Sustainability dipelihara melalui workflow event/project: tujuan/target, energi, bahan bakar, transportasi/perjalanan, air, limbah, material, reuse/rental, emisi/GHG bila metodologi tersedia, aksesibilitas, inklusi, dampak komunitas/stakeholder, pengadaan/vendor, bukti, pemilik aksi, metrik, dan improvement. Definisi dan kalkulasi metrik harus menyimpan sumber, satuan, metode, periode dan kualitas data; jangan mengarang angka karbon.

**Status verifikasi Phase 0:** seluruh daftar di atas `NOT VERIFIED` — katalog resmi ISO tidak dapat diakses dari lingkungan audit (lihat `ISO_IMS_BLUEPRINT.md`).

## 10. Controlled Document & Evidence Library

Hirarki dokumentasi yang harus didukung dan dapat disesuaikan organisasi:
Policy → Manual → Process Map/Process → Procedure/SOP → Work Instruction → Form/Checklist → Record/Evidence → Report/Review Output.

Setiap dokumen/record sekurangnya memiliki ID, judul, tipe, pemilik, approver, versi/revisi, status, tanggal berlaku, tanggal review, klasifikasi, ACL, retensi, relasi parent/related process, histori perubahan dan audit trail.

Fungsi library: search/filter, preview/view, download terkontrol, version comparison bila praktis, review, approval/rejection, effective date, reminder, obsolete/superseded control, retention/disposition sesuai kebijakan, akses log, dan tautan ke proses/kontrol/workspace/event.

Evidence workflow: checklist/form → hasil → catatan → upload foto/video/file → timestamp/metadata yang relevan → submit → review → sign-off/approval → locked record/report. Metadata sensitif dan lokasi hanya dikumpulkan jika perlu, transparan dan sesuai kebijakan privasi.

Sign-off harus mengikat aktor terautentikasi, role, waktu, konteks dan versi yang disetujui. Tanda tangan digital/legal signature harus diperlakukan sesuai kekuatan hukum yang diverifikasi; jangan mengklaim semua klik adalah tanda tangan tersertifikasi. Auditor diberi akses read-only terkendali, scoped dan time-bound bila diperlukan.

Audit traceability: requirement/clause/reference → obligation/risk → control → process → procedure → workflow → transaction → record → evidence → approval/signature → finding → NCR/CAPA → effectiveness check/closure.

## 11. maxRider operational maturity

Asset lifecycle: procurement/registration → identification → QR/barcode generation/printing → inspection/readiness → reservation → picking → testing → dispatch → event use → return → condition/damage → repair/maintenance/calibration where applicable → retirement/disposal.

Harus mendukung asset register, serial/model, ownership, kategori, lokasi, kondisi, availability, kit/set, rental reservation, movement history, maintenance plan, inspection schedules, spare/consumable linkage bila relevan, depreciation/accounting integration hanya sesuai scope finance, check-in/out, damage, lost/missing, service vendor, calibration where needed, utilization/downtime/cost KPIs, and audit trail.

Operation juga mencakup CRM, quotations/orders/contracts, finance workflows, payment/invoice states (sesuai integrasi), crew competency and qualifications, risk assessment, HSE briefing/permit/checklist, incident reporting, readiness gates, customer complaints, nonconformity/CAPA dan project/event dossier.

## 12. Roadmap kendali

- Phase 0 — audit repository, verifikasi bukti, dan penguncian control baseline.
- Phase 1 — discovery, personas, use cases, requirements dan acceptance criteria.
- Phase 2 — architecture/domain model, threat model, data model dan ADR.
- Phase 3 — repository foundations, design system, i18n dan CI/testing foundation.
- Phase 4 — identity, authentication, workspace/tenant, memberships dan permissions.
- Phase 5 — licensing, entitlements, renewal/expiry dan extensions model.
- Phase 6 — home/dashboard dan event foundation.
- Phase 7 — technical rider dan templates.
- Phase 8 — asset foundation dan asset/set templates.
- Phase 9 — media kit/templates.
- Phase 10 — team/event workspace, chat, rundown, reports dan notifications baseline.
- Phase 11 — Developer Equipment Store khusus miniRider.
- Phase 12 — maxRider CRM.
- Phase 13 — maxRider asset/rental lifecycle, QR/barcode, printing, scanning, maintenance/readiness.
- Phase 14 — maxRider finance/commercial.
- Phase 15 — advanced roles/workflow, HSE/risk/readiness/operational controls.
- Phase 16 — hiRider marketplace/recruitment.
- Phase 17 — IMS foundation, process architecture dan controlled document library.
- Phase 18 — forms/checklists, evidence, sign-off/signatures dan Audit Mode.
- Phase 19 — sustainability, environmental, HSE, information security, continuity dan risk workflows.
- Phase 20 — audit programmes, NCR/CAPA, management review dan continual improvement.
- Phase 21 — end-to-end IMS integration, compliance mapping dan project/event dossier.
- Phase 22 — public landing, Developer Portal, license/extension shop, notification governance.
- Phase 23 — extensions, workspace landing pages, mobile/tablet/Windows delivery.
- Phase 24 — integrations, import/export, offline and sync hardening.
- Phase 25 — security/performance/reliability/backup-restore/DR/accessibility/UAT.
- Phase 26 — pilot, production launch, support, measurement and continuous improvement.

Roadmap ini adalah urutan target, bukan bukti bahwa fase sudah dikerjakan. Dependency yang ditemukan saat audit harus dicatat sebagai usulan perubahan, jangan diam-diam menata ulang fase. Status per fase ada di `ROADMAP.md` dan `PHASE_STATUS.md`.

## 13. Control files wajib

Repository harus memelihara dokumen kanonik berikut:
- `MASTER_CONTROL.md` — aturan produk/arsitektur permanen.
- `ARCHITECTURE.md` — arsitektur aktual dan target yang diberi label jelas.
- `ROADMAP.md` — status fase beserta bukti, blocker, dan kriteria.
- `REQUIREMENTS.md` — requirement ID, prioritas, asal, acceptance criteria, status.
- `LICENSE_MATRIX.md` — permission/feature/limits tiap tier.
- `DECISIONS.md` atau `docs/adr/` — keputusan dan alasan.
- `SECURITY.md` — security model/threats.
- `TESTING.md` — test strategy dan bukti.
- `OPERATIONS.md` — deployment, backup, recovery, monitoring, support.
- `UX_UI_STANDARD.md` — design/UX/accessibility/responsive quality gates.
- `ISO_IMS_BLUEPRINT.md` — kandidat standar, mapping process/control/evidence dan status verifikasi.
- `PHASE_STATUS.md` — status terverifikasi per fase.

## 14. Anti-halusinasi dan integritas pelaporan

- Bedakan fakta repository, hasil pengujian, asumsi, usulan, dan pertanyaan terbuka.
- Jangan mengaku membaca file yang tidak benar-benar dibaca, menjalankan test yang tidak dijalankan, mengakses service yang tidak tersedia, atau memverifikasi standar tanpa sumber.
- Semua klaim "sudah ada", "sudah bekerja", "aman", "responsif", "aksesibel", "offline support", "sesuai ISO" atau "DONE" harus memiliki bukti yang bisa ditunjuk.
- Gunakan status `VERIFIED`, `PARTIAL`, `NOT FOUND`, `NOT TESTED`, `BLOCKED`, `PROPOSED` secara eksplisit.
- Bila informasi tidak tersedia, catat sebagai `UNKNOWN / NEEDS DECISION`; jangan melengkapi dengan tebakan.
- Bila sumber saling bertentangan, laporkan konflik dan jangan memilih diam-diam. Minta keputusan owner jika keputusan mengubah kebutuhan/risiko komersial atau arsitektur penting.
- Jangan mengarang harga, vendor, API, secrets, legal applicability, hasil tes, atau hasil ISO certification.
- Gunakan sumber resmi untuk status standar dan catat tanggal verifikasi.

## 15. Phase gate wajib

Fase hanya boleh ditandai `DONE` jika seluruh kriteria acceptance fase dipenuhi, pengujian relevan benar-benar dijalankan dan hasilnya dicatat, regresi diperiksa, keamanan/tenant isolation/entitlement diperiksa sesuai scope, migrasi aman, dokumentasi diperbarui, dan tidak ada blocker kritis tersembunyi. Screenshot/UI semata bukan bukti business logic. Build sukses bukan bukti penerimaan end-to-end.

Phase 0 secara khusus tidak boleh mengklaim fitur produk telah selesai. Outputnya adalah audit faktual, kontrol baseline yang sinkron, gap register, daftar risiko/dependency, daftar keputusan terbuka, serta rekomendasi masuk Phase 1.
