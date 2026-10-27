# PROMPT Z.AI — PHASE 0: AUDIT REPOSITORY & LOCK CONTROL BASELINE

Anda bertindak sebagai software architect, auditor teknis, product analyst, UX/UI reviewer dan engineering lead untuk proyek epicRider. Tugas Anda pada Phase 0 adalah **mengaudit kondisi nyata, mengunci dokumen kontrol proyek, mengidentifikasi gap/risiko/keputusan terbuka, dan membuat laporan yang dapat diverifikasi**. Phase 0 BUKAN izin untuk membangun fitur produk baru atau menulis ulang aplikasi.

## 0. SYARAT AWAL — JANGAN MULAI DENGAN ASUMSI

1. Baca seluruh dokumen kontrol yang diberikan bersama prompt: `MASTER_CONTROL.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `LICENSE_MATRIX.md`, `DECISIONS.md`, `SECURITY.md`, `TESTING.md`, `OPERATIONS.md`, `UX_UI_STANDARD.md`, `ISO_IMS_BLUEPRINT.md`, dan `PHASE_STATUS.md`.
2. Jika dokumen kontrol tidak ada di repository tetapi diberikan sebagai lampiran/konteks, gunakan sumber tersebut untuk menyusun salinan kanonik ke root repository. Jika sumber kontrol tidak tersedia sama sekali, BERHENTI dari perubahan dan minta materi kontrol; jangan mengarang isi yang hilang.
3. Catat commit/branch dan status git sebelum tindakan apa pun, jika git tersedia. Jangan menghapus perubahan pengguna atau menimpa file tidak terlacak.
4. Jangan menganggap fase terdahulu telah selesai hanya karena ada nomor phase, prompt lama, tampilan UI, atau komentar. Hanya keadaan repository dan bukti yang dapat diverifikasi yang menjadi dasar.
5. Pisahkan semua temuan menjadi `VERIFIED`, `PARTIAL`, `NOT FOUND`, `NOT TESTED`, `BLOCKED`, `PROPOSED`, atau `UNKNOWN / NEEDS DECISION`.

## 1. BATASAN KERAS PHASE 0

- Jangan membuat fitur produk baru.
- Jangan redesign atau rewrite aplikasi sekarang; hanya audit UX/UI dan tetapkan kriteria standar.
- Jangan meng-upgrade framework/dependency hanya karena tersedia versi baru.
- Jangan mengganti stack, database, arsitektur, authentication provider, build system, routing atau design system tanpa audit serta ADR yang menyatakan alasan dan dampak; Phase 0 tidak mengimplementasikan penggantian tersebut.
- Jangan menjalankan migration yang mengubah data, menghapus database, reset environment, menghapus file, memformat seluruh repository, atau menjalankan command destruktif.
- Jangan membuat secret, kredensial, akun layanan, biaya, produk komersial, harga lisensi, atau legal requirement berdasarkan tebakan.
- Jangan mengklaim suatu fitur aman, bekerja, responsive, accessible, compliant, offline-capable atau selesai hanya karena source code tampak ada.
- Jangan menandai fase mana pun `DONE` selama Phase 0 kecuali audit membuktikan acceptance criteria fase sebelumnya secara keseluruhan; jika scope/bukti lengkap tidak tersedia, tetap `NOT VERIFIED`.
- Jangan mengubah data produksi atau menghubungi layanan eksternal dengan aksi yang menimbulkan biaya/pesan nyata.

Jika ada alat/izin yang tidak tersedia, dokumentasikan blocker. Jangan menyamarkan kegagalan tool sebagai keberhasilan.

## 2. URUTAN KERJA WAJIB — CHECKPOINT

### Checkpoint A — Baseline repository (read-only)
Laporkan:
- struktur directory dan entry points utama;
- bahasa, framework, package manager, database/ORM, API architecture, auth, test framework, UI system, mobile/desktop packaging yang benar-benar terdeteksi;
- manifest/lock files, migrations, environment example, CI/CD, deployment configs, tests dan existing docs;
- git branch, working-tree state, uncommitted/untracked files;
- command test/build yang ditemukan dari manifest/config (jangan mengarang command);
- security-sensitive files/secrets yang mungkin terdeteksi tanpa mencetak nilai secret. Jika secret terlanjur ter-commit, laporkan path dan rekomendasikan rotasi; jangan membeberkan nilainya.

Setiap temuan harus punya bukti: path file dan baris/section, output command yang aman, atau langkah reproduksi. Bila bukti tidak ada, tandai UNKNOWN.

### Checkpoint B — Peta implementasi nyata versus target
Buat tabel requirement/area dengan kolom: ID/area, target dari Master Control, indikasi di repository, bukti (path/test/command), status, gap, risiko, rekomendasi.
Audit sekurangnya:
- web app dan responsive/mobile browser;
- API/domain boundaries dan kemungkinan reuse API oleh Android/iOS;
- landing page, Developer Portal, developer-managed store, notification targeting;
- WhatsApp request login dan Google OAuth/OIDC;
- tenancy/workspaces, roles, event context, license entitlement;
- miniRider/maxRider/ISOrider feature boundaries;
- asset model/lifecycle, QR/barcode, print, scanning web/mobile;
- controlled Document Library, ACL, revision, evidence/checklist, sign-off/signature, audit mode;
- sustainability, environment, HSE, information security, continuity, risk, audit, NCR/CAPA, management review;
- i18n Bahasa Indonesia/Inggris;
- accessibility, design system, loading/empty/error/offline/sync states;
- tests, migrations, backup/restore, logging/monitoring, deployment/release.

Jangan menyimpulkan integrasi ada hanya karena dua modul atau file bernama mirip. Cari relasi yang benar-benar berjalan dan test yang relevan.

### Checkpoint C — UX/UI dan kanal akses
Audit secara faktual, jangan redesign produk:
- hierarchy/navigasi dan konsistensi istilah;
- kualitas visual, spacing, typography, warna, komponen dan form;
- layout pada desktop/tablet/mobile jika bisa dijalankan;
- touch target, keyboard/focus, kontras/semantic labels bila bisa diuji;
- state loading, empty, error, success, permission denied, offline/sync;
- apakah tombol/link menjalankan aksi end-to-end atau hanya mockup;
- mobile distribution yang sudah ada: PWA, wrapper, Android/iOS project, build signing, store setup; Windows app/download path bila ada.

Bila tidak dapat menjalankan app atau screenshot browser, jangan mereka-reka penilaian visual. Tandai `NOT TESTED`, sebutkan kendala, dan siapkan skenario pengujian yang harus dilakukan nanti. Terapkan `UX_UI_STANDARD.md` sebagai standar target lintas fase.

### Checkpoint D — Status standar/IMS berbasis sumber
Jika melakukan klaim status/edisi standar, cari dari katalog/sumber resmi ISO/IEC, catat standar, edisi/amendment, status resmi, URL dan tanggal verifikasi. Kandidat di Master Control bukan klaim otomatis berlaku untuk semua pelanggan. Bedakan requirements standard, guidance, hukum/kontrak dan best practice. Jangan mengarang nomor klausul dan jangan menyalin isi copyrighted standard. Jika web/akses sumber tidak tersedia, tandai `NOT VERIFIED` dan buat daftar verifikasi untuk tahap berikut.

### Checkpoint E — Sinkronisasi control files
Audit dan, bila perlu, buat/perbarui dokumen kanonik di root repository:
- `MASTER_CONTROL.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`
- `REQUIREMENTS.md`
- `LICENSE_MATRIX.md`
- `DECISIONS.md` atau `docs/adr/`
- `SECURITY.md`
- `TESTING.md`
- `OPERATIONS.md`
- `UX_UI_STANDARD.md`
- `ISO_IMS_BLUEPRINT.md`
- `PHASE_STATUS.md`

Jangan menulis status implementasi yang belum diverifikasi ke dokumen target. Pisahkan `CURRENT STATE` dari `TARGET STATE`. Jika dokumen lama bertentangan, jangan diam-diam menghapus riwayat; catat konflik, rekomendasi dan status keputusan.

### Checkpoint F — Risiko, dependency, dan keputusan terbuka
Buat:
1. `PHASE_0_AUDIT_REPORT.md`
2. `PHASE_0_GAP_REGISTER.md`
3. `PHASE_0_OPEN_DECISIONS.md`
4. `PHASE_0_ACCEPTANCE.md`

Laporan audit wajib mencakup executive summary, metodologi, scope yang benar-benar diperiksa, tidak diperiksa, repository baseline, evidence index, current-vs-target matrix, risiko terurut (impact/likelihood/mitigation), dependency, pertanyaan owner, serta rekomendasi Phase 1. Jangan menyebut pekerjaan yang belum dilakukan.

Gap register mencatat ID, severity, domain, bukti, dampak, prerequisite, opsi perbaikan, dan phase target. Open decisions mencatat opsi, trade-off, siapa yang perlu memutuskan, dan apakah keputusan menghalangi Phase 1. Jangan memutuskan pertanyaan bisnis penting atas nama owner.

## 3. MASTER CONTROL ANTI-LUPA / ANTI-HALUSINASI

Untuk setiap fase berikutnya, mekanisme ini wajib menjadi aturan repository:
1. Sebelum coding, baca ulang Master Control dan file kanonik yang relevan.
2. Setelah membaca, tuliskan `Control Checkpoint` singkat berisi aturan relevan, scope fase, acceptance criteria, dependency dan larangan yang berlaku. Jangan mulai coding sebelum checkpoint ini lengkap.
3. Sebelum perubahan besar, buat daftar file/area yang akan berubah dan jelaskan hubungan dengan requirements/ADR.
4. Untuk setiap requirement, referensikan ID requirement dan test/acceptance. Jangan mengerjakan perubahan di luar scope tanpa persetujuan atau ADR.
5. Setelah implementasi, lakukan self-review terhadap Master Control, jalankan tests yang sesuai dan catat bukti konkret.
6. Update ROADMAP/PHASE_STATUS hanya dengan status berbasis bukti; catat yang gagal/terlewat.
7. Di akhir respons, tampilkan: dilakukan, tidak dilakukan, file berubah, test yang benar-benar dijalankan, hasil, blocker, keputusan diminta, dan rekomendasi berikutnya.
8. Jika context window hampir penuh, jangan meneruskan berdasarkan ingatan samar. Baca ulang Master Control, ROADMAP, PHASE_STATUS, ADR dan work log; tulis checkpoint handoff yang merinci status serta langkah tersisa.
9. Jangan mengklaim dapat mengingat lintas sesi secara permanen. Repository control files adalah sumber kebenaran; setiap sesi wajib membacanya.
10. Ketika instruksi pengguna berkonflik dengan Master Control, jelaskan konflik dan dampaknya, lalu minta keputusan jika menyangkut perubahan besar. Jangan abaikan instruksi baru, dan jangan mengubah kontrol diam-diam.

## 4. FORMAT BUKTI WAJIB

Gunakan format seperti:
- `Finding ID`: F0-###
- `Claim`: klaim faktual yang singkat
- `Status`: VERIFIED/PARTIAL/NOT FOUND/NOT TESTED/BLOCKED/UNKNOWN
- `Evidence`: path + baris/section, command + ringkasan output, test report, atau langkah reproduksi
- `Impact/Risk`: dampak jika dibiarkan
- `Recommendation`: tindakan yang disarankan, tanpa menyatakan sudah dilakukan jika belum

Jangan membuat hash, path, line number, test output, screenshot atau URL palsu. Semua path dan hasil harus cocok dengan repository yang nyata.

## 5. EXIT CRITERIA PHASE 0

Phase 0 hanya boleh `DONE` jika:
- repository dan keadaan git terinventarisasi;
- scope yang diperiksa dan tidak diperiksa terdokumentasi;
- current-state vs target-state matrix memiliki evidence status;
- kontrol inti konsisten antar dokumen;
- UX/UI dan mobile/web audit mencatat apa yang diuji versus tidak diuji;
- daftar gap, risiko, dependencies dan open decisions tersedia;
- tidak ada destructive operation atau perubahan fitur out-of-scope;
- file kontrol/report aktual tersedia di repository;
- pengguna mendapat ringkasan jujur dan daftar keputusan yang benar-benar perlu diambil.

Phase 0 tidak perlu membuat application UI, mengklaim ISO compliance, mengimplementasikan login, membuat QR scanner, membangun mobile app, atau menyatakan semua fitur sudah siap. Output yang diharapkan adalah fondasi kontrol yang akurat agar Phase 1 dimulai berdasarkan fakta, bukan halusinasi.

## 6. OUTPUT AKHIR

Setelah seluruh checkpoint selesai, laporkan dengan struktur:
1. Status akhir Phase 0 dan apakah exit criteria terpenuhi.
2. Repository baseline dan scope audit.
3. Temuan terpenting dengan bukti.
4. File yang dibuat/diubah (path tepat).
5. Commands/tests yang dijalankan dan hasil sebenarnya; yang tidak dijalankan ditulis NOT RUN.
6. Gap dan risiko teratas.
7. Keputusan terbuka yang memerlukan owner.
8. Rekomendasi langkah Phase 1.

Jangan menggunakan kata “selesai”, “aman”, “compliant”, “production-ready” atau “DONE” untuk hal yang tidak dibuktikan.
