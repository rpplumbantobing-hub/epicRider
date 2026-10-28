# Audit Konsistensi epicRider — Hasil Z.ai Phase 2

**Tanggal pemeriksaan:** 28 Oktober 2026  
**Status rekomendasi:** **REWORK REQUIRED sebelum Phase 2 diterima sebagai baseline final**  
**Cakupan:** `workspace-bdf10873-7803-4338-b2cf-19eb3b2301a4.tar` dibandingkan dengan `epicRider_Control_Pack_Complete(1).zip`, termasuk kontrol Phase 2 pengganti yang ikut tertanam di dalam TAR.

## Ringkasan eksekutif

Hasil Z.ai **substantif dan berguna sebagai paket arsitektur**: dokumen bounded context, model data logis, threat model, authorization, entitlement, API boundaries, ADR dan traceability telah dibuat. Phase 2 juga benar-benar dijalankan sebagai fase dokumentasi/arsitektur; laporan tidak mengklaim bahwa fitur produk telah diimplementasikan atau diuji.

Namun, hasil **belum layak diberi PASS final**. Saya menemukan konflik status fase, konflik batas commerce/store, scope hiRider yang tidak ditelusuri sampai ke model domain, dan referensi section Master Control yang ambigu. Karena itu, klaim `0 active contradictions` dalam `PHASE_2_REPORT.md` §13 dan centang `no contradiction with Master Control` di `PHASE_2_ACCEPTANCE.md` belum didukung secara memadai.

## Temuan prioritas

### F-01 — Dua versi control baseline tidak sama
**Prioritas: P1 — perlu dibereskan sebelum kontrol berikutnya dijalankan.**

- ZIP yang dilampirkan pengguna, `epicRider_Control_Pack_Complete(1).zip`, berisi 18 dokumen kontrol; metadata arsipnya bertanggal 27 Oktober 2026 sekitar 16:57.
- Di dalam TAR ada `upload/epicRider_phase2_control_replacement.zip` dengan 13 file. `PHASE_2_REPORT.md` §1–2, terutama baris 4–6, menyebut **replacement ZIP inilah** yang digunakan Z.ai sebagai basis Phase 2.
- Artinya, hasil Z.ai dibuat terhadap baseline pengganti yang lebih baru, bukan terhadap file ZIP lengkap yang sekarang diminta sebagai pembanding. Keduanya tidak boleh diperlakukan sebagai byte-for-byte atau semantik identik.

**Dampak:** keputusan yang sudah diperbarui dalam replacement pack belum otomatis tercermin dalam seluruh isi control pack lengkap lama. Hal ini terlihat terutama pada commerce/store dan scope hiRider.

**Perbaikan:** tetapkan satu paket kanonik. Rekonsiliasikan keputusan terbaru ke dalam control pack lengkap; beri label versi input/arsip yang jelas pada salinan di `upload/` dan `audit/superseded/`; jangan membiarkan dua paket tampak sama-sama kanonik.

### F-02 — Status Phase 2 bertentangan di dalam kontrol aktif
**Prioritas: P1 — konflik status langsung.**

- `MASTER_CONTROL.md` §0, baris 9–13, menyatakan Phase 2 sebagai fase “berikutnya”.
- `MASTER_CONTROL.md` §8, baris 193, menyebut kriteria agar Phase 2 berstatus DONE.
- Sebaliknya, `ROADMAP.md` baris 15–18, `PHASE_STATUS.md` baris 8–10, `PHASE_2_ACCEPTANCE.md` baris 56–69, dan `PHASE_2_REPORT.md` §14 menyatakan Phase 2 sudah DONE sebagai architecture baseline.

**Dampak:** dokumen pengendali utama tidak menyatakan keadaan proyek yang sama dengan register status. Bagian `Current project state` membuat status dinamis terduplikasi di `MASTER_CONTROL.md`, padahal `ROADMAP.md`/`PHASE_STATUS.md` adalah tempat yang lebih tepat untuk status berjalan.

**Perbaikan:** hapus status fase dinamis dari `MASTER_CONTROL.md` atau perbarui secara eksplisit dan konsisten. Rekomendasi saya: Master Control memuat aturan stabil saja; `ROADMAP.md` dan `PHASE_STATUS.md` menjadi satu-satunya sumber status fase.

### F-03 — Public Store mencampur dua kebutuhan commerce yang aksesnya berbeda
**Prioritas: P1 — batas domain dan akses perlu dikoreksi.**

- Master Control dari ZIP lengkap membedakan toko pembelian lisensi/extension di landing page yang harus melayani semua tier dari in-app **Developer Equipment Store** yang hanya untuk miniRider (`MASTER_CONTROL.md` §3 baris 26; `LICENSE_MATRIX.md` baris 22–23).
- Baseline Phase 2 baru mendefinisikan `Public Store` sebagai developer commerce yang boleh menjual **license products, extensions, dan developer products**, tetapi aksesnya hanya untuk user dengan basic miniRider license (`MASTER_CONTROL.md` §1 baris 39–49; `LICENSE_MATRIX.md` §4 baris 48–57; `DATA_MODEL_CONCEPT.md` §3.12 baris 318–325; `ADR-013` baris 11 dan 32–38).
- Dengan demikian, penjualan produk lisensi/extension dimasukkan ke store yang aksesnya mensyaratkan lisensi miniRider. Ini tidak sama dengan kebutuhan public License & Extension shop yang juga harus memungkinkan pembelian lisensi pertama atau pembelian lintas tier.
- `DATA_MODEL_CONCEPT.md` §11 item C-2 hanya menandai ketidakjelasan derivasi lisensi user untuk anggota workspace bertier lebih tinggi; ia belum memisahkan kebutuhan pembelian awal oleh calon pelanggan yang belum memiliki lisensi.

**Perbaikan yang disarankan, mengikuti keputusan terbaru bahwa Public Store developer hanya untuk pemilik basic miniRider:** definisikan tiga surface/domain yang eksplisit dan terpisah:

1. **License & Extension Shop** di landing page publik: jalur pembelian/renewal lisensi dan extension, sesuai kebijakan akses komersial yang disahkan owner.
2. **Public Store**: toko produk developer; akses membutuhkan basic miniRider.
3. **Developer Equipment Store**: toko perlengkapan dalam aplikasi; miniRider-only, maxRider/ISOrider ditolak di API.

Model katalog, order, akses, API, entitlement issuance, dan audit harus menunjukkan perbedaan ini. Jangan sekadar menyamakan label `Public Store` dengan semua penjualan publik.

### F-04 — Fitur penawaran jasa hiRider dari kontrol lama tidak muncul dalam model Phase 2
**Prioritas: P1 untuk boundary hiRider; butuh keputusan owner.**

- Master Control ZIP lengkap §2 baris 16 dan Roadmap baris 23 menyebut hiRider mencakup **penawaran jasa** serta profil, skill, portofolio, rekrutmen, lamaran, seleksi, dan assignment.
- Master Control Phase 2 baru memusatkan hiRider sebagai portal/capability recruitment (`MASTER_CONTROL.md` baris 23–37). `ARCHITECTURE.md` §6 dan `DATA_MODEL_CONCEPT.md` §5 memodelkan `CandidateProfile`, `Skill`, `Portfolio`, `RecruitmentOpening`, `Application`, `Shortlist`, `RecruitmentDecision`, membership dan assignment, tetapi tidak menemukan model `ServiceOffer`/penawaran jasa.
- `REQUIREMENTS.md` mempertahankan REQ-001..REQ-100, tetapi REQ-013 dan REQ-062..064 yang terkait hiRider hanya menjamin profil/skill/portofolio/rekrutmen; tidak ada acceptance criterion spesifik untuk penawaran jasa.

**Dampak:** sebagian scope yang dinyatakan di control pack lengkap berpotensi hilang tanpa keputusan eksplisit. Ini bukan berarti marketplace layanan harus otomatis dibangun; artinya keputusan tentang apakah fitur tersebut tetap in-scope belum tercatat dan ditelusuri.

**Perbaikan:** owner perlu memilih satu: (a) hiRider memang recruitment/team-matching saja, lalu nyatakan `penawaran jasa` sebagai scope yang disupersede/deferred; atau (b) penawaran jasa tetap in-scope, lalu tambahkan konsep domain, lifecycle, permission/privacy, API boundary, dan requirement baru dengan ID > REQ-100 setelah disetujui. Jangan mendaur ulang atau mengarang ID requirement.

### F-05 — Klaim “0 active contradictions” tidak cukup kuat untuk mendukung acceptance DONE
**Prioritas: P1 — acceptance harus diulang.**

- `PHASE_2_REPORT.md` §13 baris 203–217 mengklaim 0 kontradiksi aktif.
- `PHASE_2_ACCEPTANCE.md` baris 14 mencentang “no contradiction with Master Control”.
- Namun, F-02 dan F-03 adalah konflik yang masih ada. Daftar pencarian yang dilaporkan dalam `PHASE_2_REPORT.md` §13 berfokus pada kata kunci seperti `hiRider license`, `Public Store maxRider`, serta OD blockers; daftar tersebut tidak memeriksa konsistensi status fase atau apakah produk lisensi dijual melalui store yang wajib memiliki lisensi miniRider.

**Dampak:** acceptance criterion “tidak ada kontradiksi” saat ini salah ditandai lulus. Memiliki file dan centang checklist tidak membuktikan konsistensi jika pemeriksaan tidak mencakup aturan yang konflik.

**Perbaikan:** setelah F-02–F-04 diperbaiki, perluas contradiction scan untuk sekurang-kurangnya:
- fase aktif di `MASTER_CONTROL.md` vs `ROADMAP.md` vs `PHASE_STATUS.md`;
- License & Extension Shop vs Public Store vs Developer Equipment Store;
- jenis produk yang boleh dijual pada setiap store vs syarat aksesnya;
- penawaran jasa hiRider vs model/data/API/requirements;
- referensi section Master Control;
- semua dependency yang diklaim non-blocking.

Kemudian ulangi `PHASE_2_ACCEPTANCE.md` dan jangan mempertahankan status DONE bila kriteria belum lulus.

### F-06 — Referensi section `MC §N` dari dokumen lama menjadi ambigu setelah Master Control diganti
**Prioritas: P2 — risiko kesalahan interpretasi lintas fase.**

Master Control aktif di root hanya memiliki section 0–8. Akan tetapi banyak artefak Phase 1 masih merujuk section pada peta lama, misalnya:

- `REQUIREMENTS.md` baris 13–24 mengutip `MC §2` untuk fitur miniRider/maxRider/hiRider. Pada Master Control aktif, §2 adalah **Entitlement taxonomy**.
- `DOCUMENT_EVIDENCE_MODEL.md` baris 4 dan section berikutnya mengutip `MC §10` untuk library dokumen/evidence. Section 10 tidak ada di Master Control aktif.
- `PERSONAS_AND_JOURNEYS.md` baris 71 mengutip `MC §14` untuk larangan mengarang harga/pajak; Master Control aktif tidak memiliki §14.
- `PHASE_STATUS.md` baris 4 mengutip `Master Control §3.6, §15`, dan baris 37 mengutip §15, padahal section tersebut tidak ada pada Master Control aktif.

Sebagian referensi ini memang berasal dari Master Control Phase 1 yang sekarang disimpan di `audit/superseded/phase1-era-control/MASTER_CONTROL.md`. Masalahnya, banyak file aktif hanya menulis `MC §N` atau `MASTER_CONTROL.md` tanpa menyebut versi/arsipnya. Cross-reference check yang hanya mengecek keberadaan file tidak membuktikan bahwa section yang dirujuk benar.

**Perbaikan:** jangan mengubah substansi atau ID artefak Phase 1 secara diam-diam. Tambahkan crosswalk revisi Master Control, lalu pilih salah satu untuk setiap rujukan: (a) tandai sebagai rujukan historis ke file arsip dan revisinya, atau (b) perbarui ke section/anchor bernama pada Master Control kanonik terbaru. Perbaiki juga referensi `PHASE_STATUS.md`.

### F-07 — `HANDOFF.md` diwajibkan oleh Phase Execution Protocol tetapi tidak ada di TAR
**Prioritas: P2 — proses handoff belum lengkap.**

`PHASE_EXECUTION_PROTOCOL.md` dalam control pack lengkap, bagian End-of-phase baris 25, mewajibkan `HANDOFF.md`. Pencarian isi TAR tidak menemukan file `HANDOFF.md` atau handoff khusus Phase 2.

**Perbaikan:** buat handoff berisi keputusan arsitektur yang stabil, status ADR/OD, output yang menjadi kontrak Phase 3, risiko dan gap terbuka, perintah/hasil pemeriksaan yang benar-benar dijalankan, serta hal yang tidak boleh dianggap sudah diimplementasikan.

### F-08 — Label edisi ISO di Master Control perlu konsisten dengan status verifikasi
**Prioritas: P2 — bukan blocker arsitektur generik.**

Master Control ZIP lengkap menyebut ISO 9001:2026, ISO 14001:2026 dan ISO 19011:2026 sebagai daftar baseline (§7 baris 52–65). `STANDARD_REGISTER.md` justru menyatakan seluruh standar `NOT VERIFIED — BLOCKED` dan secara eksplisit menyebut tahun 2026 sebagai kandidat yang status penerbitannya belum diketahui (baris 3, 16, 24, 27, 31). `PHASE_2_REPORT.md` §12 juga benar-benar mempertahankan status ISO sebagai BLOCKED.

**Perbaikan:** pertahankan `NOT VERIFIED` sampai validasi katalog resmi, dan ubah label dalam Master Control lengkap menjadi `candidate edition — NOT VERIFIED` agar daftar baseline tidak terbaca sebagai konfirmasi edisi resmi. Ini tidak perlu memblokir arsitektur generik Phase 2.

## Pemeriksaan yang lulus

1. **Tier lisensi:** di baseline Phase 2 hanya ada `miniRider`, `maxRider`, dan `ISOrider`; hiRider tidak dimodelkan sebagai tier/license.
2. **Invariant hiRider:** `Application != Membership`, `Application != Event Assignment`, dan `Acceptance != Automatic Workspace Access` dijelaskan dalam model domain dan authorization.
3. **Dependency scoping:** OD-02, OD-03, OD-05, OD-06, OD-09, OD-116 dan OD-160 tidak digunakan sebagai blocker menyeluruh bagi arsitektur Phase 2. Secara umum ini sesuai keputusan koreksi yang ditetapkan.
4. **Traceability requirement:** `REQUIREMENTS.md` berisi 100 ID unik dari REQ-001 sampai REQ-100; `PHASE_2_TRACEABILITY.md` mencakup seluruh 100 ID unik dan tidak menunjukkan ID requirement hilang/ekstra pada perbandingan set.
5. **Pemisahan current vs target:** dokumen arsitektur menandai model sebagai proposed/target-state; `PHASE_2_REPORT.md` secara jujur menyebut build, test kode, pentest, accessibility dan usability tidak dijalankan karena Phase 2 bersifat documentation-only.
6. **Perubahan produk:** commit Phase 2 menambahkan/mengubah dokumen arsitektur dan governance; tidak tampak perubahan pada `src/`, `prisma/schema.prisma`, atau `package.json` di ringkasan commit. Jadi Phase 2 belum mengimplementasikan fitur produk, dan laporan tidak semestinya dipakai sebagai bukti implementasi.

## Putusan audit

**Rekomendasi: REWORK REQUIRED (targeted correction; tidak perlu membangun ulang Phase 2 dari nol).**

Pertahankan deliverable arsitektur yang sudah dibuat. Sebelum mengunci Phase 2 sebagai final dan menggunakannya sebagai kontrak Phase 3, perbaiki minimal F-02, F-03, F-04, F-05 dan F-06; buat `HANDOFF.md`; lalu jalankan kembali pemeriksaan yang hasilnya bisa diverifikasi. Untuk F-04, pilihan cakupan penawaran jasa hiRider membutuhkan keputusan owner bila tidak ada keputusan eksplisit terdahulu.

Phase 2 dapat kembali dinyatakan **DONE — architecture baseline** hanya setelah konflik kontrol tersebut diselesaikan, hasil scan diperbarui, dan kualifikasi yang tersisa dicatat jelas sebagai keputusan/sub-scope terbuka—bukan sekadar karena semua file deliverable tersedia.

## Catatan keamanan arsip

TAR juga berisi `.env` dan `db/custom.db`. Keduanya tidak dibuka sebagai bagian audit inkonsistensi ini. Sebelum mengirim arsip ke alat/pihak lain, periksa apakah `.env` berisi kredensial atau rahasia; keluarkan dari arsip dan rotasi kredensial bila pernah terekspos.
