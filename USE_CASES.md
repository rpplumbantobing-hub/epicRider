# USE CASES — epicRider

**Status dokumen:** PROPOSED — hasil Task 1-b (Phase 1, WS-B). Dokumentasi saja; tidak ada kode/schema/config yang diubah.
**Sumber:** `MASTER_CONTROL.md`, `REQUIREMENTS.md` (REQ-001..REQ-100), `OPEN_DECISIONS.md` (OD-01..OD-116), `ROADMAP.md` (Phase 0..26), `UX_UI_STANDARD.md`.
**Persona:** P-01 Solo Owner-Operator · P-02 Workspace Owner UKM · P-03 Crew Member · P-04 Event Manager · P-05 Rental/Asset Manager · P-06 Finance/CRM Officer · P-07 Developer/Store Manager · P-08 Platform Admin/Support · P-09 Auditor · P-10 IMS/Sustainability Manager · P-11 Supplier/Contractor · P-12 Customer. (ID tetap; rinci di dokumen persona — tidak diubah di sini.)
**Konvensi:** `F#` = failure flow. Setiap UC punya ≥1 failure flow (kategori yang dicakup lintas dokumen: tidak berhak/kurang lisensi/entitlement, offline/error jaringan, data tidak valid, abuse). Semua UC berstatus PROPOSED menunggu review owner. Phase mengikuti kolom Phase di `REQUIREMENTS.md`/urutan `ROADMAP.md`.
**Total: 55 use case** — 10xx:7 · 20xx:7 · 30xx:8 · 40xx:5 · 50xx:6 · 60xx:5 · 70xx:11 · 80xx:3 · 90xx:3.

---

## 1. UC-1001..10xx — Auth & Workspace

**UC-1001 "Login via WhatsApp request"**
- Aktor: Semua persona (contoh utama P-01) — calon/pendaftar atau user kembali.
- Preconditions: Layar login tersedia; mekanisme verifikasi WhatsApp menunggu keputusan vendor (OD-03).
- Main flow: 1) User memasukkan nomor WhatsApp. 2) Sistem membuat request login sekali pakai (token + expiry) dan mengirim verifikasi via mekanisme terpilih. 3) User memasukkan/mengonfirmasi kode. 4) Sistem membuktikan kontrol atas nomor, membuat sesi, mencatat audit event. 5) User diarahkan ke pemilih/buat workspace.
- Alternate flows: a1) Nomor belum terdaftar → alur onboarding buat akun. a2) Nomor terikat akun dengan Google → tawarkan account-linking aman (UC-1002).
- Failure flows: F1) Kode salah/kedaluwarsa/dipakai ulang (replay) → ditolak; wajib request baru. F2) Percobaan berulang melebihi batas → rate limit/lockout + audit (abuse). F3) Vendor/jaringan gagal → error state + retry terkendali; fallback ke recovery (UC-1003). F4) Permintaan massal ke banyak nomor (abuse) → throttle + monitoring.
- Postconditions: Sesi terautentikasi aktif; token verifikasi invalid; audit event tercatat.
- REQ: REQ-021, REQ-054, REQ-092, REQ-028. **Phase: 4** (OD-03).

**UC-1002 "Login via Google OAuth 2.0/OIDC"**
- Aktor: Semua persona (contoh P-02).
- Preconditions: Klien OAuth terkonfigurasi server-side; tanpa secrets di frontend.
- Main flow: 1) User memilih "Masuk dengan Google". 2) Redirect ke Google dengan `state`. 3) Consent. 4) Callback → validasi state/nonce/issuer/audience/signature/expiry/redirect URI. 5) Sesi dibuat; account-linking aman bila email terverifikasi sama.
- Alternate flows: a1) Link akun WhatsApp + Google → merge aman dengan konfirmasi eksplisit.
- Failure flows: F1) Token/signature/audience invalid → login ditolak + audit. F2) State/nonce mismatch (upaya CSRF) → tolak + audit. F3) IdP/jaringan error → error state + retry aman. F4) Upaya linking ke akun orang lain → ditolak; verifikasi tambahan diminta.
- Postconditions: Identitas global user terhubung tanpa menduplikasi membership/role.
- REQ: REQ-022, REQ-092. **Phase: 4**.

**UC-1003 "Pemulihan akun (recovery & fallback)"**
- Aktor: Semua persona.
- Preconditions: User kehilangan akses metode login utama (WhatsApp/Google).
- Main flow: 1) Pilih "Lupa akses". 2) Sistem menawarkan fallback terverifikasi (metode kedua yang ter-link). 3) Verifikasi ulang identitas (bukan sekadar kepemilikan nomor/email). 4) Sesi baru dibuat; reset metode lama opsional.
- Alternate flows: a1) Tidak ada fallback ter-link → jalur support terverifikasi (proses manual, tanpa klaim otomatis).
- Failure flows: F1) Verifikasi gagal → tolak + batasi percobaan. F2) Percobaan takeover akun (abuse) → lockout + alert + audit. F3) Jaringan error → token recovery sekali pakai, retry aman.
- Postconditions: Akun kembali dikontrol pemilik sah; tidak ada jalur bypass verifikasi.
- REQ: REQ-047, REQ-054. **Phase: 4**.

**UC-1004 "Kelola sesi & perangkat (lihat, revoke)"**
- Aktor: Semua persona.
- Preconditions: Login aktif.
- Main flow: 1) Buka Pengaturan → Sesi & Perangkat. 2) Lihat daftar sesi aktif (device, waktu). 3) Revoke satu device atau semua. 4) Sistem mengakhiri sesi; request berikutnya ditolak.
- Alternate flows: a1) Logout manual biasa.
- Failure flows: F1) Offline saat revoke → aksi ditunda/antrean dengan indikator; permission tetap dicek server saat sinkron. F2) Revoke gagal diproses → status diperbarui saat online; tidak ada klaim "revoke sukses" tanpa konfirmasi. F3) Akses endpoint sesi milik user lain → 403 teraudit.
- Postconditions: Sesi dicabut efektif pada request berikutnya; sesi kedaluwarsa ditolak.
- REQ: REQ-048, REQ-092. **Phase: 4**. Parameter sesi (idle timeout, maks sesi aktif) = PROPOSED menunggu **OD-115** (rekomendasi awal: konservatif/timeout pendek; angka final OWNER APPROVAL REQUIRED).

**UC-1005 "Kelola membership: invite → accept → suspend → remove → leave"**
- Aktor: P-02 Workspace Owner (invite/suspend/remove), P-03 Crew (accept/leave).
- Preconditions: Workspace aktif; kuota kru mengikuti OD-05 (batas MC: maks 5 kru/workspace).
- Main flow: 1) Owner mengundang email/nomor + role yang ditawarkan. 2) Sistem membuat token undangan signed, sekali pakai, kedaluwarsa, terikat workspace+role. 3) Invitee membuka link dan accept. 4) Membership aktif; akses mengikuti role. 5) Kapan pun: owner suspend/remove; member leave.
- Alternate flows: a1) Kuota penuh → undangan ditolak dengan pesan jelas (tautan upgrade/extension bila ada). a2) Re-invite member suspended.
- Failure flows: F1) Link undangan bekas/kedaluwarsa → ditolak. F2) Manipulasi link untuk mengubah role → ditolak (token binding). F3) Penambahan kru melebihi kuota → ditolak server-side (REQ-009). F4) Entitlement tier tidak mencukupi seat → denial teraudit. F5) Data undangan tidak valid (format email/nomor) → validasi gagal jelas.
- Postconditions: Setiap transisi status mengubah akses efektif seketika (removed → akses hilang pada request berikutnya).
- REQ: REQ-049, REQ-051, REQ-009, REQ-025, REQ-024. **Phase: 4** (OD-05).

**UC-1006 "Assign kru ke event & switch konteks event"**
- Aktor: P-02/P-04 (assign), P-03 Crew (switch).
- Preconditions: Membership aktif; event ada.
- Main flow: 1) Owner/EM menugaskan kru ke event (boleh >1). 2) Kru membuka app → konteks event aktif tampil jelas. 3) Kru multi-penugasan membuka switcher dan memilih event. 4) Konteks berpindah aman; data event lain tidak tampil.
- Alternate flows: a1) Kru tanpa penugasan → empty state + penjelasan (bukan error).
- Failure flows: F1) Akses data event yang tidak ditugaskan → ditolak server-side (isolasi). F2) Penugasan ganda pada jadwal yang tumpang-tindih → flag konflik untuk review (kandidat **OD-130**). F3) Offline → konteks terakhir tampil berlabel stale/sync pending bila didukung (OD-07); else pesan offline. F4) Switch konteks di tengah draft → konfirmasi agar data tidak terkirim ke event yang salah.
- Postconditions: Kru bekerja dalam konteks yang tepat; akses teraudit.
- REQ: REQ-050, REQ-007, REQ-026. **Phase: 4, 6**.

**UC-1007 "Provisioning akses auditor"**
- Aktor: P-08 Platform Admin (provision), P-09 Auditor (pakai).
- Preconditions: Permintaan audit sah; parameter scope/durasi mengikuti OD-110.
- Main flow: 1) Admin membuat akses auditor: read-only, scope workspace/dokumen tertentu, masa berlaku terbatas. 2) Auditor login → hanya melihat scope tersebut. 3) Setiap akses tercatat. 4) Expiry otomatis mengakhiri akses.
- Alternate flows: a1) Perluasan scope → jalur persetujuan terpisah (akses baru, bukan edit diam-diam).
- Failure flows: F1) Auditor mencoba tulis/export di luar scope → ditolak + audit. F2) Akses dipakai setelah expiry → ditolak otomatis. F3) Provisioning oleh non-admin → 403 teraudit. F4) Scraping massal oleh akun auditor (abuse) → rate limit + alert.
- Postconditions: Akses auditor tercatat, terbatas, dan berakhir otomatis.
- REQ: REQ-053, REQ-044, REQ-084. **Phase: 18** (OD-110).

## 2. UC-2001..20xx — miniRider

**UC-2001 "Buat workspace baru"**
- Aktor: P-01 Solo Owner-Operator, P-02.
- Preconditions: Akun terautentikasi (UC-1001/1002).
- Main flow: 1) Pilih "Buat workspace". 2) Isi nama + jenis usaha. 3) Sistem provisioning workspace + membership owner + navigasi 5 halaman (Home, Event, Asset, Team, Profile). 4) Owner masuk workspace. 5) Upgrade tier berikutnya memperkaya domain yang sama tanpa migrasi data (REQ-002).
- Alternate flows: a1) User punya banyak workspace → pemilih workspace.
- Failure flows: F1) Data tidak valid → validasi field. F2) Batas jumlah workspace per lisensi tercapai (aturan menunggu OD-06) → denial teraudit. F3) Provisioning gagal di tengah → rollback bersih; tidak ada workspace setengah jadi. F4) Pembuatan workspace massal (abuse) → rate limit per user.
- Postconditions: Workspace terisolasi terbentuk; role owner aktif.
- REQ: REQ-023, REQ-025, REQ-002, REQ-024. **Phase: 4, 6**.

**UC-2002 "Buat event dalam workspace"**
- Aktor: P-02, P-04.
- Preconditions: Workspace aktif.
- Main flow: 1) Buka Event → Buat. 2) Isi nama, tanggal, lokasi. 3) Simpan → event masuk daftar; dapat menugaskan kru (UC-1006).
- Alternate flows: a1) Duplikasi event sebagai template event baru.
- Failure flows: F1) Data tidak valid (tanggal mundur, nama kosong) → validasi. F2) Member tanpa hak membuat event → 403 teraudit. F3) Offline → tidak tersimpan; pesan offline jelas (draft lokal hanya bila OD-07 mengaktifkan offline). F4) Pembuatan event massal (abuse) → rate limit.
- Postconditions: Event tersimpan di workspace; hanya anggota bertugasan yang mengakses.
- REQ: REQ-003, REQ-050. **Phase: 6**.

**UC-2003 "Susun technical rider (draft → attach event)"**
- Aktor: P-02, P-07, P-05.
- Preconditions: Workspace ada; event tersedia (draft event diperbolehkan).
- Main flow: 1) Buat rider sebagai draft. 2) Isi kebutuhan teknis (sound, lighting, dsb. — dapat merujuk aset/set). 3) Attach ke event tertentu. 4) Publish → relasi rider↔event ditegakkan server-side.
- Alternate flows: a1) Duplikasi rider dari event sebelumnya.
- Failure flows: F1) Publish rider tanpa event → ditolak server-side (tanpa event hanya boleh draft). F2) Item merujuk aset yang dihapus → warning + pengecekan konsistensi. F3) Offline → draft lokal bila didukung (OD-07); default error state. F4) Akses rider workspace lain → 403.
- Postconditions: Rider terhubung event; draft tetap sah tanpa event.
- REQ: REQ-004, REQ-006. **Phase: 7**.

**UC-2004 "Buat media kit dari template & kaitkan event"**
- Aktor: P-02, P-04.
- Preconditions: Template media kit tersedia.
- Main flow: 1) Pilih template. 2) Isi konten (foto/video/deskripsi). 3) Kaitkan event. 4) Simpan/bagikan ke anggota tim.
- Alternate flows: a1) Duplikasi media kit dari event lain dalam workspace yang sama.
- Failure flows: F1) Simpan tanpa event terkait → ditolak. F2) Media melampaui tipe/ukuran kebijakan → ditolak dengan pesan (limit = PROPOSED, kandidat **OD-137**). F3) Offline → upload gagal + retry; tidak ada data hilang diam-diam. F4) Konten melanggar ketentuan/hak cipta (abuse) → flag/moderasi sesuai kebijakan platform.
- Postconditions: Media kit terkait event dan dapat dibuka anggota.
- REQ: REQ-005, REQ-034. **Phase: 9** (kandidat OD-137).

**UC-2005 "Kelola aset dasar & asset/set template"**
- Aktor: P-01/P-02 (skala kecil), P-05/P-07.
- Preconditions: Workspace aktif.
- Main flow: 1) Buka Asset. 2) Tambah aset (nama, kategori, catatan). 3) Buat set template berisi kumpulan aset. 4) Gunakan set pada event/rider.
- Alternate flows: a1) Impor daftar aset (hanya bila OD-111 mengaktifkan import).
- Failure flows: F1) Data aset tidak valid → validasi. F2) Hapus aset yang dipakai set/event → konfirmasi + pengecekan relasi. F3) Akses aset workspace lain → 403. F4) Duplikasi massal (abuse) → rate limit.
- Postconditions: Aset & set tersimpan; relasi aset↔set terjaga.
- REQ: REQ-006, REQ-023. **Phase: 8**.

**UC-2006 "Kolaborasi event: chat, rundown, update laporan/info"**
- Aktor: P-03 Crew, P-04 Event Manager.
- Preconditions: Kru ditugaskan ke event (UC-1006).
- Main flow: 1) Buka event → tab Chat: kirim pesan/lampiran. 2) Buka tab Rundown: lihat item & waktu. 3) Update laporan/informasi (status, catatan lapangan). 4) Anggota lain melihat pembaruan.
- Alternate flows: a1) Lampirkan foto progress (batas kebijakan). a2) Edit/hapus pesan bila kebijakan mengizinkan (kandidat **OD-131**).
- Failure flows: F1) Non-anggota event membuka tab → 403 teraudit. F2) Jaringan buruk → pesan/aksi masuk indikator pending atau error jelas; tidak ada data tertelan diam-diam (bila OD-07 aktif: antrean lokal aman). F3) Konten abuse di chat → report/block + moderasi (pola UC-6005). F4) Edit rundown bersamaan → konflik diselesaikan last-write + history (kebijakan final kandidat OD-131).
- Postconditions: Komunikasi & laporan tercatat dalam konteks event.
- REQ: REQ-008, REQ-007, REQ-034. **Phase: 10** (kandidat OD-131).

**UC-2007 "Dashboard home & status kuota"**
- Aktor: P-01, P-02.
- Preconditions: Login; workspace terpilih.
- Main flow: 1) Buka Home. 2) Lihat ringkasan event aktif, tugas, aset. 3) Lihat status kuota kru & lisensi. 4) Navigasi ke 5 halaman utama.
- Alternate flows: a1) Workspace baru kosong → empty state + panduan memulai.
- Failure flows: F1) Data gagal dimuat → error state + retry; tanpa chart/data palsu (REQ-035). F2) Akses halaman di luar lisensi → entitlement denial teraudit (bukan sekadar menu tersembunyi). F3) Data stale → label stale + refresh.
- Postconditions: Owner memahami status workspace & batas lisensinya.
- REQ: REQ-003, REQ-009, REQ-088, REQ-035. **Phase: 6**.

## 3. UC-3001..30xx — maxRider: asset & rental lifecycle

**UC-3001 "Registrasi aset ke asset register"**
- Aktor: P-05 Rental/Asset Manager.
- Preconditions: Entitlement maxRider aktif.
- Main flow: 1) Buka Asset Register. 2) Tambah aset: nama, serial/model, ownership, kategori, lokasi, kondisi awal. 3) Simpan → ID unik + audit trail. 4) Lanjut generate QR (UC-3002).
- Alternate flows: a1) Registrasi massal via import (bila OD-111 mengizinkan). a2) Duplikasi dari aset existing.
- Failure flows: F1) Serial duplikat → peringatan/blok sesuai kebijakan. F2) Field wajib kosong → validasi. F3) Akses tanpa entitlement maxRider → denial teraudit. F4) Input massal tidak wajar (abuse) → rate limit.
- Postconditions: Aset masuk register dengan status lifecycle awal.
- REQ: REQ-045, REQ-011, REQ-024. **Phase: 13**.

**UC-3002 "Generate QR/label & cetak"**
- Aktor: P-05.
- Preconditions: Aset terdaftar.
- Main flow: 1) Pilih aset → generate QR/barcode unik. 2) Preview label. 3) Cetak (print browser/label printer yang didukung). 4) Tempel pada aset.
- Alternate flows: a1) Cetak batch untuk banyak aset.
- Failure flows: F1) Print gagal (printer offline) → pesan error + retry; QR tetap tersimpan. F2) Deteksi kode duplikat → blok + regenerasi. F3) User tanpa hak kelola aset → 403.
- Postconditions: Aset punya identitas QR unik yang siap discan.
- REQ: REQ-036, REQ-045. **Phase: 13**.

**UC-3003 "Scan aset via web/mobile (izin kamera + fallback manual)"**
- Aktor: P-03, P-05.
- Preconditions: Label QR terpasang; browser mendukung kamera (web) atau app mobile; API sama untuk kedua kanal (REQ-020).
- Main flow: 1) Buka Scanner. 2) Browser meminta izin kamera. 3) User grant → scan QR. 4) Lookup aset → tampil detail + aksi (inspeksi, check-out, damage). 5) Aksi dieksekusi via API yang sama web & mobile.
- Alternate flows: a1) Izin denied / kamera tidak tersedia → fallback entry kode manual yang berfungsi penuh. a2) Scan gagal/timeout → ulangi atau manual.
- Failure flows: F1) Kamera denied → fallback manual berfungsi (REQ-067); feedback status jelas (REQ-090). F2) Kode tidak dikenal → error state + saran. F3) Offline → lookup gagal; cache terakhir berlabel stale bila didukung (OD-07); else pesan offline. F4) Scan QR milik workspace lain → ditolak (isolasi).
- Postconditions: Aset teridentifikasi; aksi lanjutan dalam hak akses kru.
- REQ: REQ-036, REQ-067, REQ-090, REQ-020. **Phase: 13** (OD-07).

**UC-3004 "Inspeksi & readiness gate"**
- Aktor: P-05, P-03.
- Preconditions: Aset terdaftar; jadwal inspeksi atau permintaan readiness ada.
- Main flow: 1) Mulai inspeksi (dari scan atau daftar). 2) Isi checklist pemeriksaan + hasil + catatan. 3) Upload foto bila perlu. 4) Submit → status readiness aset diperbarui. 5) Bukti tersimpan (di ISOrider mengikuti workflow evidence UC-7005).
- Alternate flows: a1) Inspeksi gagal → aset ditandai not-ready + alasan; memicu maintenance (UC-3007).
- Failure flows: F1) Checklist belum lengkap → submit ditolak dengan daftar item kurang. F2) Upload media gagal → retry; data checklist tidak hilang. F3) Inspeksi aset di luar scope user → 403. F4) Manipulasi hasil inspeksi (abuse) → audit trail + review.
- Postconditions: Status readiness aktual; bukti terhubung transaksi.
- REQ: REQ-045, REQ-046, REQ-083. **Phase: 13**.

**UC-3005 "Reservation aset/set & deteksi konflik"**
- Aktor: P-05, P-02.
- Preconditions: Aset/set tersedia.
- Main flow: 1) Buat reservation (periode + event). 2) Sistem mengecek ketersediaan & double-booking. 3) Tanpa konflik → tersimpan. 4) Dengan konflik → perlakuan sesuai kebijakan OD-107 (hard-block / warning+override terotorisasi / hybrid).
- Alternate flows: a1) Reservation untuk set utuh dari set template.
- Failure flows: F1) Booking tumpang-tindih saat kebijakan hard-block → ditolak + saran slot; konflik tercatat. F2) Override tanpa otorisasi → 403 teraudit. F3) Periode tidak valid (end < start) → validasi. F4) Spam reservation (abuse) → rate limit.
- Postconditions: Reservation tercatat; konflik terdeteksi & terdokumentasi.
- REQ: REQ-065, REQ-045. **Phase: 13** (OD-107).

**UC-3006 "Check-out / check-in dengan capture kondisi & damage"**
- Aktor: P-03 (lapangan), P-05 (gudang).
- Preconditions: Reservation disetujui; aset ready.
- Main flow: 1) Check-out: scan aset → capture kondisi awal (foto/catatan) → status checked-out. 2) Pemakaian event. 3) Check-in: scan → capture kondisi akhir → status returned. 4) Ada kerusakan → buat damage record + foto; dapat memicu maintenance (UC-3007); di ISOrider dapat membuka incident→NCR (UC-7008) bila kebijakan mengiyakan (kandidat **OD-132**).
- Alternate flows: a1) Check-out atas nama kru lain dengan otorisasi eksplisit.
- Failure flows: F1) Aset belum returned → reminder/flag overdue. F2) Capture kondisi wajib dilewati → check-in tidak selesai (kebijakan). F3) Offline lapangan → antrean lokal aman + re-check permission saat sinkron bila OD-07 aktif; else pesan offline. F4) Check-out tanpa reservation → ditolak/dengan otorisasi (abuse dicegah).
- Postconditions: Pergerakan & kondisi aset tercatat sebagai evidence.
- REQ: REQ-066, REQ-036, REQ-083. **Phase: 13** (OD-07; kandidat OD-132).

**UC-3007 "Jadwal maintenance & calibration"**
- Aktor: P-05.
- Preconditions: Aset punya rencana/jadwal maintenance/kalibrasi.
- Main flow: 1) Sistem menampilkan item due/overdue. 2) Teknisi mengeksekusi → catat hasil, suku cadang, biaya (scope accounting = sesuai keputusan finance; tanpa angka dikarang). 3) Selesai → status aset diperbarui; KPI downtime dihitung dari data nyata.
- Alternate flows: a1) Maintenance eksternal → record service vendor.
- Failure flows: F1) Overdue tidak diproses → flag terus tampil; dapat memblokir readiness (kebijakan). F2) Data hasil tidak valid → validasi. F3) Penyelesaian oleh user tanpa hak → 403. F4) Biaya dikarang tanpa dokumen → ditolak (larangan data demo, REQ-069).
- Postconditions: Tracking due/overdue akurat; penyelesaian tercatat.
- REQ: REQ-068, REQ-069, REQ-045. **Phase: 13**.

**UC-3008 "Retirement / disposal aset"**
- Aktor: P-05, P-02 (approve).
- Preconditions: Aset aktif; alasan retirement terdokumentasi.
- Main flow: 1) Ajukan retirement + alasan (rusak berat, end-of-life). 2) Approval (aksi berisiko → konfirmasi eksplisit). 3) Status retired → keluar dari availability; histori & audit trail tetap tersimpan.
- Alternate flows: a1) Batal retirement sebelum approval.
- Failure flows: F1) Retirement aset dengan reservation aktif → ditolak sampai diselesaikan. F2) Approval oleh user tanpa hak → 403. F3) Offline → aksi ditunda. F4) Upaya menghapus histori aset (abuse) → dilarang; hanya status berubah.
- Postconditions: Aset retired; data tetap utuh untuk audit/KPI.
- REQ: REQ-045, REQ-032, REQ-026. **Phase: 13**.

## 4. UC-4001..40xx — CRM & finance (maxRider)

**UC-4001 "Kelola customer CRM"**
- Aktor: P-06 Finance/CRM Officer.
- Preconditions: Entitlement maxRider aktif.
- Main flow: 1) Tambah/kelola customer (profil, kontak, catatan). 2) Lihat riwayat interaksi/order. 3) Catatan follow-up/segmentasi.
- Alternate flows: a1) Merge duplikat customer (dengan konfirmasi).
- Failure flows: F1) Data tidak valid → validasi. F2) Akses CRM tanpa role → 403 teraudit. F3) Hapus customer dengan order aktif → ditolak/arsip. F4) Export data massal (abuse) → rate limit + audit.
- Postconditions: Data customer terpusat untuk quotation/order.
- REQ: REQ-046, REQ-011, REQ-092. **Phase: 12**.

**UC-4002 "Quotation → order/contract"**
- Aktor: P-06, P-02.
- Preconditions: Customer ada.
- Main flow: 1) Buat quotation dari item/aset/paket. 2) Kirim ke customer. 3) Revisi bila perlu (versi tersimpan). 4) Accept → konversi ke order/contract. 5) Order terhubung event/rental (project/event dossier).
- Alternate flows: a1) Quotation ditolak customer → arsip + alasan.
- Failure flows: F1) Konversi dengan data tidak lengkap → ditolak. F2) Perubahan harga setelah accept → wajib amendment/versi baru, bukan edit diam-diam (prinsip REQ-027 pada dokumen komersial; state machine final kandidat **OD-135**). F3) Akses tanpa role finance → 403. F4) Nilai komersial dikarang tanpa sumber → dilarang (OD-06).
- Postconditions: Quotation berversi; order/contract terhubung customer & event.
- REQ: REQ-046, REQ-027. **Phase: 14** (OD-06; kandidat OD-135).

**UC-4003 "Kelola invoice state"**
- Aktor: P-06.
- Preconditions: Order/contract ada.
- Main flow: 1) Buat invoice dari order. 2) State berubah sesuai alur (draft → sent → paid/void — state machine final kandidat **OD-135**; tanpa nilai komersial dikarang). 3) Setiap transisi teraudit.
- Alternate flows: a1) Invoice bertahap/milestone bila kebijakan mengizinkan.
- Failure flows: F1) Transisi invalid (mis. paid → draft) → ditolak. F2) Hapus invoice terkirim → dilarang; gunakan void/credit (kandidat OD-135). F3) Akses tanpa hak → 403. F4) Integrasi/gateway gagal → status error + retry terkendali; tanpa double-charge.
- Postconditions: Invoice state konsisten & teraudit; terhubung payment record.
- REQ: REQ-046, REQ-027. **Phase: 14** (OD-06; kandidat OD-135).

**UC-4004 "Rekam payment (sesuai integrasi)"**
- Aktor: P-06.
- Preconditions: Invoice ada; keputusan payment gateway menunggu OD-06.
- Main flow: 1) Rekam pembayaran manual, atau terima notifikasi dari gateway (bila nanti diaktifkan — OD-06). 2) Sistem mencocokkan ke invoice → state paid/partial. 3) Bukti pembayaran tersimpan.
- Alternate flows: a1) Refund/gagal bayar → record sesuai kebijakan OD-06.
- Failure flows: F1) Notifikasi duplikat → idempotency; tidak double-count. F2) Jumlah tidak cocok → flag mismatch untuk review. F3) Rekam payment tanpa hak → 403 teraudit. F4) Gateway belum diputuskan (OD-06) → hanya mode manual; tanpa klaim otomatis.
- Postconditions: Payment tercatat konsisten dengan state invoice.
- REQ: REQ-046, REQ-092. **Phase: 14** (OD-06).

**UC-4005 "Tangani complaint pelanggan"**
- Aktor: P-06, P-08 Support; P-12 Customer sebagai pelapor (via kanal yang disediakan).
- Preconditions: Complaint masuk (kanal penerimaan = keputusan produk menyusul).
- Main flow: 1) Catat complaint + kategori + order/event terkait. 2) Tindak lanjut ditugaskan. 3) Resolusi dicatat. 4) Di ISOrider: complaint sebagai ketidaksesuaian → lanjut rantai NCR/CAPA (UC-7008).
- Alternate flows: a1) Eskalasi ke management.
- Failure flows: F1) Complaint tanpa data minimal → validasi. F2) Akses oleh pihak tanpa hak → 403. F3) Complaint tidak ditindaklanjuti → status tracking + flag overdue. F4) Complaint palsu massal (abuse) → rate limit + identitas pelapor.
- Postconditions: Complaint ter-track sampai resolusi; terhubung order/event.
- REQ: REQ-046, REQ-075. **Phase: 14–15** (rantai NCR penuh Phase 20).

## 5. UC-5001..50xx — Store, Developer Portal & notifikasi

**UC-5001 "Kelola listing Equipment Store (draft → published, termasuk media)"**
- Aktor: P-07 Developer/Store Manager.
- Preconditions: Role store manager sesuai model OD-101; akses panel store/Portal.
- Main flow: 1) Buat listing draft (nama, deskripsi, kategori). 2) Unggah media (foto/video/dokumen) sesuai kebijakan. 3) Submit publish. 4) Status published → listing tampil di app miniRider. 5) Arsip bila ditarik.
- Alternate flows: a1) Edit listing published → perubahan teraudit.
- Failure flows: F1) Publish tanpa field wajib/media sah → ditolak. F2) Media melanggar tipe/ukuran kebijakan → ditolak (limit = PROPOSED, kandidat **OD-137**). F3) Kelola listing tanpa role → 403 teraudit. F4) Listing terlihat/diakses tier non-miniRider (bypass) → API diblokir + audit (REQ-010, REQ-030).
- Postconditions: Hanya listing published yang tampil; semua transisi teraudit.
- REQ: REQ-055, REQ-057, REQ-010, REQ-030. **Phase: 11** (OD-101; kandidat OD-137).

**UC-5002 "Kelola stok, harga & diskon listing"**
- Aktor: P-07.
- Preconditions: Listing ada.
- Main flow: 1) Ubah stok/harga/diskon. 2) Sistem mencatat aktor + waktu + nilai lama/baru. 3) Nilai baru berlaku pada listing.
- Alternate flows: a1) Diskon terjadwal bila kebijakan mengizinkan.
- Failure flows: F1) Harga negatif/format salah → validasi. F2) Perubahan melampaui batas/otoritas (kebijakan approval harga — kandidat **OD-133**) → wajib approval. F3) Stok negatif → ditolak. F4) Nilai default dikarang tanpa keputusan → dilarang (OD-06).
- Postconditions: Semua perubahan komersial teraudit; tidak ada nilai tanpa dasar keputusan.
- REQ: REQ-056, REQ-031. **Phase: 11** (OD-06; kandidat OD-133).

**UC-5003 "Login Developer Portal & akses konsol"**
- Aktor: P-07, P-08.
- Preconditions: Role developer terpisah dari workspace role (OD-101); Portal sebagai konsol terpisah.
- Main flow: 1) Login khusus Developer Portal. 2) Sistem memverifikasi role developer. 3) Akses konsol sesuai least privilege (katalog/store ≠ billing ≠ broadcast). 4) Semua aksi teraudit.
- Alternate flows: a1) Hak tambahan (mis. broadcast) diberikan terpisah dengan approval (OD-102).
- Failure flows: F1) Non-developer login portal → ditolak. F2) Role developer mencoba aksi billing/lisensi/broadcast global → 403 teraudit (REQ-031). F3) Pembajakan sesi portal (abuse) → proteksi sesi (UC-1004) + audit. F4) Jaringan error → error state portal.
- Postconditions: Hanya berhak khusus mengelola store/katalog; least privilege ditegakkan.
- REQ: REQ-058, REQ-052, REQ-031, REQ-016. **Phase: 22** (OD-101).

**UC-5004 "Broadcast notifikasi: audience, pratinjau penerima, dedup/idempotency, delivery status"**
- Aktor: P-08 Platform Admin dengan otoritas broadcast (OD-102).
- Preconditions: Hak broadcast terpisah dari role developer (REQ-052).
- Main flow: 1) Pilih audience: seluruh workspace / workspace terpilih / user terpilih (multi-pilih). 2) Sistem menampilkan pratinjau penerima + jumlah. 3) Susun pesan (opsional: test-send ke diri sendiri). 4) Kirim → dedup/idempotency key dibuat. 5) Status pengiriman (queued/sent/failed) terlihat; retry terkendali. 6) Semua teraudit.
- Alternate flows: a1) Kirim ke daftar user yang dipilih satu per satu.
- Failure flows: F1) Kirim tanpa pratinjau → mustahil (UI + server enforce). F2) Kirim ganda dengan key sama → tidak ada pesan ganda. F3) Broadcast berlebihan/spam (abuse) → limit frekuensi + approval (kandidat **OD-139**). F4) Delivery gagal sebagian → status failed per penerima + retry terkendali. F5) Pengiriman oleh role tanpa otoritas → 403 teraudit.
- Postconditions: Notifikasi terkirim terukur, teraudit, tanpa duplikasi.
- REQ: REQ-059, REQ-060, REQ-017. **Phase: 22** (OD-102; kandidat OD-139).

**UC-5005 "Kelola preferensi notifikasi & opt-out"**
- Aktor: P-03 (semua user).
- Preconditions: Akun aktif.
- Main flow: 1) Buka preferensi notifikasi. 2) Lihat jenis notifikasi (wajib vs opsional — klasifikasi = OD-102). 3) Opt-out jenis opsional. 4) Pipeline pengiriman menghormati preferensi.
- Alternate flows: a1) Opt-in kembali kapan pun.
- Failure flows: F1) Opt-out jenis wajib → tidak tersedia (jenis wajib tetap terkirim, sesuai keputusan owner). F2) Preferensi gagal tersimpan → error + retry. F3) Mengubah preferensi akun orang lain (abuse) → 403.
- Postconditions: Preferensi tersimpan dan dihormati.
- REQ: REQ-061. **Phase: 22** (OD-102).

**UC-5006 "Beli/perpanjang lisensi & extension via Store publik; downgrade behavior"**
- Aktor: P-01, P-02 (pembeli); P-07/P-08 (kelola katalog lisensi).
- Preconditions: Store publik terpisah penuh dari Developer Equipment Store in-app (REQ-030).
- Main flow: 1) Pilih lisensi/extension di Store publik. 2) Checkout — harga/gateway/pajak menunggu OD-06; sebelum diputuskan alur berhenti pada intent/permintaan tanpa klaim pembayaran. 3) Lisensi active → entitlement server-side diperbarui. 4) Renewal → active kembali. 5) Expiry → grace → downgrade sesuai OD-108 (restrict; tanpa penghapusan data diam-diam).
- Alternate flows: a1) Upgrade mini→max→ISO di tengah pemakaian → data & fitur kontinu (REQ-002).
- Failure flows: F1) Pembayaran gagal → lisensi tidak berubah; error state jelas. F2) Akses fitur saat grace/expired → dibatasi sesuai OD-108 dengan pesan jelas. F3) Bypass entitlement via API → denial teraudit. F4) Downgrade memicu penghapusan data → dilarang tanpa keputusan owner (REQ-099).
- Postconditions: Status lisensi & entitlement konsisten; data pengguna dilindungi saat downgrade.
- REQ: REQ-098, REQ-099, REQ-030, REQ-002, REQ-024. **Phase: 5, 22** (OD-06, OD-108).

## 6. UC-6001..60xx — hiRider marketplace & rekrutmen

**UC-6001 "Kelola profil kru: skill, portofolio, visibilitas"**
- Aktor: P-03 Crew.
- Preconditions: Akun hiRider aktif.
- Main flow: 1) Edit profil: skill, pengalaman, portofolio. 2) Atur visibilitas (default privat — PROPOSED per OD-109). 3) Simpan → profil terlihat hanya sesuai setting.
- Alternate flows: a1) Tautkan profil ke workspace/event nyata tanpa membuka data privat.
- Failure flows: F1) Profil privat terlihat pihak lain → pelanggaran enforcement server-side (privacy test). F2) Upload portofolio melampaui kebijakan → ditolak (limit kandidat **OD-137**). F3) Konten melanggar/hak cipta → flag/moderasi. F4) Impersonasi kru lain (abuse) → verifikasi + report (UC-6005).
- Postconditions: Profil akurat; privat by default sampai diubah pemilik.
- REQ: REQ-062, REQ-013. **Phase: 16** (OD-109; kandidat OD-137).

**UC-6002 "Buka & tutup rekrutmen"**
- Aktor: P-02 (owner), P-04.
- Preconditions: Workspace hiRider aktif.
- Main flow: 1) Buat posting rekrutmen: kebutuhan, kriteria, periode. 2) Buka → dapat dilamar. 3) Tutup → lamaran baru berhenti; data lamaran lama tetap.
- Alternate flows: a1) Buka kembali rekrutmen (riwayat tetap utuh).
- Failure flows: F1) Lamar ke rekrutmen tertutup → ditolak. F2) Kriteria akses tidak dipenuhi → ditolak dengan alasan. F3) Menutup rekrutmen menghapus data → dilarang (hanya status berubah). F4) Posting menyesatkan (abuse) → report/moderasi (UC-6005).
- Postconditions: Status rekrutmen mengendalikan lamaran; riwayat utuh.
- REQ: REQ-063, REQ-014. **Phase: 16**.

**UC-6003 "Lamar rekrutmen yang terbuka"**
- Aktor: P-03.
- Preconditions: Rekrutmen terbuka; profil tersedia; kriteria akses dipenuhi.
- Main flow: 1) Buka rekrutmen. 2) Submit lamaran (dari profil + dokumen). 3) Status = applied; pemilik lamaran melihat statusnya. 4) Status lamaran TIDAK memberi akses workspace/event.
- Alternate flows: a1) Withdraw lamaran (UC-6004).
- Failure flows: F1) Lamar setelah ditutup → ditolak. F2) Lamar dua kali pada rekrutmen sama → ditolak/dideteksi (kebijakan). F3) Ekspektasi akses workspace via lamaran → tidak mungkin; permission tetap terpisah (server-side). F4) Data lamaran tidak valid → validasi. F5) Kontak/data pribadi pelamar terlihat prematur → kebijakan data lamaran kandidat **OD-134** (terkait OD-109).
- Postconditions: Lamaran tercatat; akses workspace tidak berubah.
- REQ: REQ-063, REQ-013, REQ-064. **Phase: 16** (kandidat OD-134).

**UC-6004 "Shortlist / accept / reject / withdraw lamaran"**
- Aktor: P-02 (keputusan), P-03 (withdraw).
- Preconditions: Lamaran ada.
- Main flow: 1) Owner meninjau lamaran. 2) Shortlist → accept/reject. 3) Setiap transisi mengirim notifikasi status & tersimpan di riwayat. 4) Pelamar dapat withdraw sebelum keputusan final.
- Alternate flows: a1) Accept diikuti undangan membership terpisah (UC-1005) — tidak otomatis.
- Failure flows: F1) Transisi invalid (reject setelah accept) → ditolak. F2) Keputusan oleh non-owner → 403. F3) Accept otomatis memberi akses workspace → dilarang (REQ-013, diuji server-side). F4) Keputusan massal tanpa jejak (abuse) → semua keputusan teraudit.
- Postconditions: Siklus lamaran selesai dengan notifikasi & riwayat.
- REQ: REQ-064, REQ-013. **Phase: 16**.

**UC-6005 "Report & block abuse di marketplace"**
- Aktor: P-03, P-02 (lapor), P-08 (tindak lanjut).
- Preconditions: Konten/interaksi marketplace ada.
- Main flow: 1) User melaporkan profil/lamaran/pesan yang melanggar. 2) Sistem menyimpan report + konteks. 3) Admin meninjau → tindakan (warning, block, suspend) teraudit. 4) Pelapor melihat status laporan.
- Alternate flows: a1) Block bilateral antar user (membatasi interaksi).
- Failure flows: F1) Report massal palsu (abuse kedua) → rate limit + penilaian kredibilitas pelapor. F2) Tindakan tanpa hak admin → 403. F3) Data report bocor ke terlapor → akses dikontrol (kebijakan privasi terkait OD-09). F4) Offline → laporan tersimpan lalu terkirim bila didukung.
- Postconditions: Abuse tertangani dengan audit; kebijakan visibilitas dihormati.
- REQ: REQ-092, REQ-062. **Phase: 16** (OD-109, OD-09). *Catatan: belum ada REQ khusus report/block abuse — lihat §Catatan gap.*

## 7. UC-7001..70xx — IMS & Document Library (ISOrider)

**UC-7001 "Kelola hirarki dokumen terkontrol per organisasi"**
- Aktor: P-10 IMS/Sustainability Manager.
- Preconditions: Entitlement ISOrider; organisasi terdaftar.
- Main flow: 1) Definisikan/ubah hirarki (Policy→Manual→Process→SOP→WI→Form/Checklist→Record→Report) tanpa mengubah kode. 2) Sistem menyediakan struktur default. 3) Simpan; dokumen dipetakan ke tingkat.
- Alternate flows: a1) Reorganisasi tingkat menengah → relasi parent/child dimigrasi terkontrol.
- Failure flows: F1) Struktur siklus/invalid → ditolak. F2) Perubahan berisiko merusak dokumen existing → validasi + konfirmasi (aksi berisiko). F3) Tanpa entitlement ISOrider → denial teraudit. F4) Akses oleh non-IMS role → 403.
- Postconditions: Hirarki configurable aktif; dokumentasi terstruktur.
- REQ: REQ-078, REQ-042, REQ-070. **Phase: 17**.

**UC-7002 "Upload dokumen & metadata lengkap"**
- Aktor: P-10.
- Preconditions: Hirarki ada.
- Main flow: 1) Upload file + metadata: ID, judul, tipe, owner, approver, versi, status, effective/review date, klasifikasi, ACL, retensi, relasi proses. 2) Validasi field wajib. 3) Histori perubahan dimulai; audit trail aktif.
- Alternate flows: a1) Upload versi baru dokumen existing → versi naik; lama tersimpan.
- Failure flows: F1) Field wajib kosong → ditolak dengan daftar field. F2) File tipe/ukuran di luar kebijakan → ditolak (limit kandidat **OD-137**). F3) Upload ke node tanpa hak ACL → 403. F4) Metadata tidak benar (abuse) → tidak bisa effective tanpa approver sah.
- Postconditions: Dokumen terdaftar dengan metadata & audit lengkap.
- REQ: REQ-079, REQ-082. **Phase: 17**.

**UC-7003 "Review → approve → effective dokumen"**
- Aktor: P-10 (submit), P-02/approver (approve).
- Preconditions: Dokumen draft dengan metadata lengkap.
- Main flow: 1) Submit untuk review. 2) Reviewer setujui/tolak dengan catatan. 3) Approved → effective date ditetapkan. 4) Reminder review terjadwal muncul.
- Alternate flows: a1) Reject → kembali ke draft dengan catatan.
- Failure flows: F1) Self-approval (submitter = approver) → dilarang sesuai kebijakan (kandidat **OD-136**). F2) Approve tanpa role approver → 403. F3) Effective date tidak valid → validasi. F4) Reminder gagal → status terlihat + retry.
- Postconditions: Dokumen effective; versi lama tidak dipakai setelah superseded.
- REQ: REQ-080, REQ-027. **Phase: 17** (kandidat OD-136).

**UC-7004 "Supersede / obsolete & retention-disposition"**
- Aktor: P-10.
- Preconditions: Dokumen effective ada.
- Main flow: 1) Terbitkan versi baru → versi lama superseded (bukan referensi aktif). 2) Atau tandai obsolete. 3) Retensi berjalan sesuai kebijakan (periode = OD-104). 4) Dokumen lewat retensi masuk antrian disposition; eksekusi teraudit.
- Alternate flows: a1) Tarik dari antrian disposition sebelum eksekusi final, bila kebijakan mengizinkan.
- Failure flows: F1) Proses masih merujuk dokumen obsolete → warning + pembaruan tautan. F2) Disposition tanpa otorisasi → 403 teraudit. F3) Retensi belum diputuskan (OD-104) → antrian menunggu; tanpa penghapusan diam-diam. F4) Penghapusan permanen tanpa audit → dilarang.
- Postconditions: Siklus hidup dokumen terkendali; histori utuh.
- REQ: REQ-080, REQ-081, REQ-042. **Phase: 17, 18** (OD-104).

**UC-7005 "Eksekusi checklist → evidence → sign-off → locked"**
- Aktor: P-03 Crew, P-04 EM, P-10.
- Preconditions: Form/checklist effective; penugasan event aktif.
- Main flow: 1) Isi checklist/form. 2) Tambah hasil + catatan + upload foto/video. 3) Metadata direkam (timestamp, aktor, konteks event, versi form). 4) Submit → review → sign-off approver terautentikasi (binding aktor+role+waktu+konteks+versi). 5) Record locked.
- Alternate flows: a1) Ditolak saat review → kembali ke pelengkap dengan catatan; semua versi tercatat.
- Failure flows: F1) Edit/delete record locked via API → 403; koreksi hanya amendment (UC-7006). F2) Kekuatan hukum sign-off mengikuti OD-103 (click-to-sign dulu; tanpa klaim tersertifikasi). F3) Offline lapangan → antrean lokal aman + re-check permission saat sinkron bila OD-07 aktif; else indikator offline. F4) Bukti palsu (abuse) → metadata + review + audit menutup klaim tanpa jejak.
- Postconditions: Evidence locked terhubung transaksi; siap ditinjau auditor.
- REQ: REQ-083, REQ-043, REQ-027, REQ-070. **Phase: 18** (OD-103, OD-07).

**UC-7006 "Amendment atas record locked / dokumen approved"**
- Aktor: P-10, P-02.
- Preconditions: Record locked/approved ada.
- Main flow: 1) Ajukan amendment dengan alasan. 2) Sistem membuat versi baru (bukan mengubah versi lama). 3) Alur approval berjalan ulang. 4) Histori/audit trail memperlihatkan versi lama→baru.
- Alternate flows: a1) Amendment ditolak → tidak ada perubahan.
- Failure flows: F1) Edit langsung record approved → 403 (immutable). F2) Amendment tanpa alasan → ditolak. F3) Self-approval amendment → kebijakan kandidat **OD-136**. F4) Versi lama hilang → dilarang (retensi menjaga).
- Postconditions: Koreksi terdokumentasi; versi lama utuh.
- REQ: REQ-027, REQ-083, REQ-080. **Phase: 18**.

**UC-7007 "Auditor view library & evidence (read-only, export terkendali)"**
- Aktor: P-09 Auditor.
- Preconditions: Akses diprovision (UC-1007); scope & expiry aktif.
- Main flow: 1) Login → melihat library/evidence dalam scope. 2) Search/filter/preview. 3) Export terkendali sesuai kebijakan. 4) Semua view/download tercatat.
- Alternate flows: a1) Minta perluasan scope → jalur approval terpisah (UC-1007).
- Failure flows: F1) Akses di luar scope → ditolak + audit. F2) Export tidak diizinkan → ditolak. F3) Akses setelah expiry → ditolak otomatis. F4) Scraping massal (abuse) → rate limit + alert.
- Postconditions: Auditor menyelesaikan pekerjaan dalam scope; jejak akses lengkap.
- REQ: REQ-084, REQ-053, REQ-082, REQ-044. **Phase: 18**.

**UC-7008 "Rantai incident → NCR → CAPA → effectiveness → closure"**
- Aktor: P-10, P-04; P-03 pelapor.
- Preconditions: ISOrider aktif; sumber incident tersedia (inspeksi UC-3004, complaint UC-4005, laporan lapangan).
- Main flow: 1) Catat incident terhubung transaksi/evidence. 2) Buka NCR. 3) Rancang CAPA dengan owner + due. 4) Implementasi → evidence. 5) Effectiveness check → closure. 6) Semua status ter-track & teraudit.
- Alternate flows: a1) NCR dijustifikasi/di-downgrade → alasan terdokumentasi.
- Failure flows: F1) Closure tanpa effectiveness check → ditolak. F2) CAPA overdue → flag terus tampil. F3) Mengubah record NCR closed → 403; hanya amendment. F4) Manipulasi status (abuse) → audit trail memperlihatkan riwayat.
- Postconditions: Satu kasus end-to-end teruji; pembelajaran tersimpan.
- REQ: REQ-075, REQ-070, REQ-083. **Phase: 20** (kandidat OD-132: trigger otomatis dari damage aset).

**UC-7009 "Management review & continual improvement"**
- Aktor: P-10, P-02.
- Preconditions: Data input review tersedia (KPI, NCR/CAPA, hasil audit).
- Main flow: 1) Susun sesi review: input (kinerja, kegagalan, risiko) & output (keputusan). 2) Simpan action items dengan owner + status. 3) Aksi perbaikan ter-track open→progress→verified→closed (REQ-077). 4) Review berikutnya mereferensi hasil sebelumnya.
- Alternate flows: a1) Review berkala terjadwal dengan reminder.
- Failure flows: F1) Action tanpa owner → tidak bisa disimpan. F2) Mengubah keputusan review → hanya amendment terdokumentasi. F3) Akses non-IMS tanpa hak → 403. F4) Klaim improvement tanpa data nyata → dilarang (metrik dari data nyata, REQ-069 pola yang sama).
- Postconditions: Review terdokumentasi; action items ter-track.
- REQ: REQ-076, REQ-077, REQ-087. **Phase: 20**.

**UC-7010 "Kelola kualifikasi supplier/kontraktor & record kompetensi kru"**
- Aktor: P-10, P-02; P-11 Supplier menyediakan dokumen.
- Preconditions: ISOrider aktif.
- Main flow: 1) Daftarkan supplier + dokumen kualifikasi. 2) Evaluasi → status + bukti tercatat. 3) Penggunaan supplier dikendalikan sesuai status. 4) Rekam kompetensi/training kru terhubung role. 5) Penugasan yang menuntut kompetensi mengecek record — diblok bila tidak ada.
- Alternate flows: a1) Re-evaluasi berkala supplier (kedaluwarsa otomatis ter-flag).
- Failure flows: F1) Penugasan tanpa record kompetensi → diblok dengan alasan jelas. F2) Dokumen supplier kedaluwarsa → flag. F3) Akses data supplier oleh pihak tak berhak → 403. F4) Sertifikasi palsu (abuse) → verifikasi + audit.
- Postconditions: Supplier & kompetensi terdokumentasi dan mengikat penugasan.
- REQ: REQ-073, REQ-074, REQ-050. **Phase: 19**.

**UC-7011 "Kelola standard register & clause mapping (metadata)"**
- Aktor: P-10.
- Preconditions: Status verifikasi standar dari katalog resmi tersedia — saat Phase 0 masih BLOCKED (lihat `ISO_IMS_BLUEPRINT.md`; OD-08).
- Main flow: 1) Tambah standar ke register: source, edition/status, verified date, owner. 2) Mapping clause → kontrol internal via metadata referensi (tanpa teks verbatim). 3) Entri tanpa verified date tidak dapat dipakai mapping.
- Alternate flows: a1) Perbarui entri saat edisi/amendment baru (verified date baru).
- Failure flows: F1) Mapping tanpa verified date → ditolak. F2) Menyalin teks standar verbatim (pelanggaran hak cipta) → dilarang; target scan = 0. F3) Verifikasi katalog gagal → status BLOCKED dicatat; mapping ditunda. F4) Entri duplikat → deteksi + merge terkontrol.
- Postconditions: Register akurat; mapping legal via metadata berizin.
- REQ: REQ-039, REQ-040, REQ-071, REQ-072. **Phase: 17** (OD-08).

## 8. UC-8001..80xx — Sustainability (ISOrider)

**UC-8001 "Definisikan KPI sustainability (data dictionary)"**
- Aktor: P-10.
- Preconditions: ISOrider; kebijakan set KPI/target = OD-106.
- Main flow: 1) Definisikan KPI: nama, unit, metode/sumber, target (menunggu OD-106), owner, baseline, periode, kualitas data. 2) Simpan → KPI dipakai input data (UC-8002).
- Alternate flows: a1) Ubah definisi → pembuatan versi agar data historis tetap dapat diinterpretasi.
- Failure flows: F1) Definisi tanpa satuan/metode → ditolak. F2) Angka target dikarang tanpa keputusan owner → dilarang (OD-106). F3) Duplikasi KPI → dideteksi. F4) Hapus KPI yang terpakai → arsip, bukan hapus.
- Postconditions: Dictionary KPI lengkap & konsisten.
- REQ: REQ-085, REQ-041. **Phase: 19** (OD-106).

**UC-8002 "Input data sustainability (sumber/satuan/metode; flag measured/estimated)"**
- Aktor: P-03, P-04, P-10.
- Preconditions: KPI terdefinisi; event/workflow aktif.
- Main flow: 1) Input data KPI dalam konteks event. 2) Wajib: sumber, satuan, metode, periode. 3) Flag measured vs estimated + tautan evidence. 4) Emisi/GHG hanya bila metodologi terverifikasi (OD-105); tanpa itu ditolak atau berlabel estimated + pending review.
- Alternate flows: a1) Input berkala (per event / periode).
- Failure flows: F1) Input tanpa sumber/satuan → ditolak. F2) Angka karbon tanpa metodologi → ditolak/berlabel + pending (REQ-086). F3) Bukti tidak tertaut → warning. F4) Manipulasi data (abuse) → audit trail + review.
- Postconditions: Data sustainability terlacak kualitasnya; siap jadi input review (UC-7009/UC-8003).
- REQ: REQ-085, REQ-086, REQ-041. **Phase: 19** (OD-105).

**UC-8003 "Target → aksi perbaikan → evaluasi hasil"**
- Aktor: P-10, P-02.
- Preconditions: KPI + data tersedia.
- Main flow: 1) Tetapkan target (sesuai keputusan owner — OD-106). 2) Buat aksi perbaikan: owner, due, evidence. 3) Eksekusi → input hasil. 4) Evaluasi capaian vs target; hasil terhubung evidence. 5) Siklus berulang (continual improvement).
- Alternate flows: a1) Target tidak tercapai → analisis penyebab + aksi lanjutan.
- Failure flows: F1) Aksi tanpa owner → ditolak. F2) Evaluasi tanpa data nyata → dilarang (tanpa angka demo). F3) Ubah target setelah periode berjalan → versi + alasan tercatat. F4) Akses tanpa hak → 403.
- Postconditions: Loop perbaikan ter-track dengan bukti.
- REQ: REQ-087, REQ-085, REQ-077. **Phase: 19**.

## 9. UC-9001..90xx — Platform / admin

**UC-9001 "Monitoring & tenancy health"**
- Aktor: P-08 Platform Admin.
- Preconditions: Platform berjalan; baseline observability tersedia (REQ-095).
- Main flow: 1) Pantau metrik dasar (traffic, error, latency) & tenancy health (workspace abnormal, kuota, error entitlement). 2) Investigasi via log terstruktur tanpa secret. 3) Tindak lanjut insiden ter-track.
- Alternate flows: a1) Alert threshold → notifikasi admin.
- Failure flows: F1) Log berisi secret → pelanggaran; pencegahan via aturan logging (REQ-095). F2) Monitoring down → fallback + prosedur manual (OPERATIONS). F3) Akses monitoring tanpa hak → 403. F4) Target performa belum disetujui (OD-112) → laporan tanpa klaim vs target.
- Postconditions: Kesehatan platform & tenancy terpantau; insiden dapat ditrace.
- REQ: REQ-095, REQ-093, REQ-023. **Phase: 25** (baseline observability Phase 3) (OD-112).

**UC-9002 "Backup & restore (termasuk restore test)"**
- Aktor: P-08.
- Preconditions: Strategi backup/DR disetujui (OD-114; terkait OD-10).
- Main flow: 1) Backup terjadwal berjalan. 2) Restore test terjadwal dijalankan. 3) Hasil diverifikasi & dicatat. 4) Insiden nyata → restore sesuai prosedur.
- Alternate flows: a1) Restore parsial per workspace bila kebijakan mengizinkan.
- Failure flows: F1) Restore test gagal → flag kritikal + perbaikan ter-track. F2) Backup gagal → alert; tanpa klaim proteksi tanpa bukti. F3) RPO/RTO belum disetujui (OD-114) → target PROPOSED; tanpa klaim. F4) Restore oleh pihak tak berhak → 403 + audit.
- Postconditions: Kemampuan pulih terbukti lewat test, bukan asumsi.
- REQ: REQ-094. **Phase: 25** (OD-114, OD-10).

**UC-9003 "Import/export data sesuai scope keputusan"**
- Aktor: P-08; P-02 (export workspace sendiri).
- Preconditions: Scope & format disetujui (OD-111).
- Main flow: 1) Minta export (scope sesuai keputusan). 2) Sistem menghasilkan berkas + audit. 3) Import (bila diizinkan) → validasi + dry-run → commit.
- Alternate flows: a1) Export untuk keperluan auditor (terkendali — UC-7007).
- Failure flows: F1) Import file rusak/format salah → ditolak aman (tanpa merusak data). F2) Export di luar scope/hak → 403. F3) Export massal data personal (abuse) → rate limit + audit (kebijakan privasi OD-09). F4) Proses gagal di tengah → transaksi tidak setengah jadi.
- Postconditions: Data keluar/masuk sesuai keputusan; teraudit.
- REQ: REQ-096, REQ-092. **Phase: 24** (OD-111, OD-09).

---

## 10. Kandidat keputusan baru WS-B (OD-130..OD-139)

Semua berstatus **OPEN / OWNER APPROVAL REQUIRED** — tidak diputuskan oleh agent. Jika disetujui owner, catat sebagai ADR di `DECISIONS.md` dan ubah status baris terkait.

| ID | Kandidat keputusan | Dipicu oleh | Dampak bila tertunda |
|---|---|---|---|
| OD-130 | Kebijakan penugasan ganda kru pada event yang jadwalnya tumpang-tindih (blok vs peringatan vs prioritas) | UC-1006 F2 | Perilaku penjadwalan & switch konteks (Phase 6/10) belum final |
| OD-131 | Kebijakan kolaborasi event: edit/hapus pesan chat, resolusi konflik edit rundown bersamaan, retensi lampiran | UC-2006 F4/a2 | Desain chat/rundown Phase 10 |
| OD-132 | Apakah damage/kerusakan aset (maxRider) otomatis membuka incident/NCR di ISOrider, dan pada kondisi apa | UC-3006, UC-7008 | Integrasi operasi↔IMS Phase 13/20 |
| OD-133 | Otoritas & batas perubahan harga/diskon listing store (siapa yang approve, batas diskon) | UC-5002 F2 | Governance store Phase 11/22 |
| OD-134 | Kebijakan data kontak & pribadi pada lamaran hiRider (kapan kontak terlihat, retensi lamaran) | UC-6003 F5 | Desain rekrutmen Phase 16; terkait OD-109/OD-09 |
| OD-135 | State machine order/invoice (draft→sent→paid/void, credit note) sebelum integrasi gateway | UC-4002..4004 | Konsistensi finance Phase 14 |
| OD-136 | Aturan approval dokumen/evidence: larangan self-approval, minimum approver berbeda dari submitter | UC-7003 F1, UC-7005, UC-7006 F3 | Integritas kontrol IMS Phase 17/18 |
| OD-137 | Kuota & kebijakan storage media lintas modul (evidence, media kit, listing, portofolio) per tier | UC-2004 F2, UC-5001 F2, UC-6001 F2, UC-7002 F2 | Biaya & limit upload sejak Phase 8 |
| OD-138 | Retensi & hak akses audit log (siapa boleh melihat, berapa lama disimpan) | UC-9001, UC-5004 | Kepatuhan & kapasitas Phase 25 |
| OD-139 | Limit anti-abuse broadcast: frekuensi maksimum, window waktu kirim, kewajiban test-send | UC-5004 F3 | Governance notifikasi Phase 22 |

## 11. Catatan gap & konflik (laporan WS-B)

1. **Konflik dokumen:** tidak ditemukan konflik langsung antara use case ini dan `REQUIREMENTS.md`; semua ketergantungan dicatat sebagai rujukan OD (mis. OD-05 kuota kru, OD-06 komersial, OD-107 konflik reservation, OD-108 downgrade).
2. **Gap tanpa REQ khusus:** report/block abuse di hiRider (UC-6005) belum punya REQ dedikasi — saat ini hanya dirujuk ke REQ-092 (baseline keamanan). Bila owner menganggap perlu, tambahkan REQ baru dengan ID > REQ-100 (jangan daur ulang ID) sesuai aturan `REQUIREMENTS.md`.
3. **Landing page publik (REQ-015):** belum diwakili use case penuh (hanya sisi login Developer Portal via UC-5003). Bila dianggap flow kritis, tambahkan UC baru pada range 50xx saat Phase 22.
4. **Parameter sesi (UC-1004):** usulan parameter mengikuti rekomendasi OD-115 (konservatif, timeout pendek); angka final = OWNER APPROVAL REQUIRED, tidak ditetapkan di dokumen ini.
