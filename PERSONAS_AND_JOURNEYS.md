# PERSONAS AND JOURNEYS — epicRider

> **Referensi MC §N:** rujukan Master Control pada dokumen ini memakai penomoran era Phase 0/1 (MC-V1, §1–§15 — arsip: `audit/superseded/phase1-era-control/`). Interpretasi ke anchor kanonik aktif: `CONTROL_REFERENCE_CROSSWALK.md` (contoh: "MC §2" di sini = Produk & batas lisensi era MC-V1, BUKAN Entitlement taxonomy MC aktif; "MC §14" = anti-halusinasi → MC aktif §7). Substansi dokumen tidak diubah (aturan F-06).

**Task ID:** 1-a (WS-A) · **Fase:** Phase 1 — discovery (documentation-only) · **Status dokumen:** `PROPOSED` (menunggu persetujuan owner)
**Sumber:** `MASTER_CONTROL.md` §1–§11, `REQUIREMENTS.md` (REQ-001..100), `OPEN_DECISIONS.md` (OD-01..OD-116), `ROADMAP.md` (Phase 0–26), `LICENSE_MATRIX.md`, `UX_UI_STANDARD.md`.
**Persona ID:** FIXED (P-01..P-12) — jangan didaur ulang/diubah. **Journey ID:** J-01..J-12 (satu journey kritis per persona).

> ⚠️ **KEJUJURAN METODOLOGI — DESK ANALYSIS**
> Seluruh persona, pain points, dan journey di dokumen ini adalah **desk analysis — belum divalidasi dengan partisipan pengguna nyata**. Tidak ada wawancara, survei, observasi lapangan, maupun data pengguna. Pain points diturunkan dari sifat domain pekerjaan (desk analysis) dan dari aturan Master Control — bukan dari riset pengguna. Validasi partisipan nyata diusulkan sebagai kandidat keputusan **OD-124**.

---

## 0. Ringkasan matrix persona

| Persona | Ringkas | Tier/kanal | Journey kritis | Fase implementasi utama |
|---|---|---|---|---|
| P-01 Solo Owner-Operator | 1 orang kerja serbaguna, perorangan | miniRider (web + mobile browser) | J-01 | 4, 6–11 |
| P-02 Workspace Owner UKM | Kelola tim & lisensi, tumbuh mini→max | miniRider → maxRider | J-02 | 4, 5, 12–15, 23 |
| P-03 Crew Member | Kru multi-workspace, mobile-first, konteks event | hiRider + membership workspace | J-03 | 4, 6, 10, 16, 23–24 |
| P-04 Event Manager | Rundown, koordinasi, chat, laporan | miniRider/maxRider (event module) | J-04 | 6–10, 12–15 |
| P-05 Rental/Asset Manager | Aset, QR, maintenance, readiness | maxRider (diwarisi ISOrider) | J-05 | 8, 13, 15, 24 |
| P-06 Finance/CRM Officer | Quotation, invoice, pelanggan | maxRider (diwarisi ISOrider) | J-06 | 12, 14, 24 |
| P-07 Developer/Store Manager | Equipment Store in-app & Developer Portal, notifikasi | Developer Portal (role khusus) | J-07 | 11, 22 |
| P-08 Platform Administrator/Support | Operasi platform, akun, health | Peran platform (bukan tier workspace) | J-08 | 3–5, 25 |
| P-09 Auditor internal/eksternal | Read-only scoped time-bound | ISOrider (auditor access) | J-09 | 17–18 |
| P-10 IMS/Sustainability Manager | Proses, dokumen terkendali, NCR/CAPA, review | ISOrider | J-10 | 17–21 |
| P-11 Supplier/Contractor | Akses terbatas, bila relevan | ISOrider context (model akses = OD-120) | J-11 | 19 |
| P-12 Customer | Pelanggan layanan, feedback, bila relevan | Eksternal (kanal = OD-121) | J-12 | 12, 20, 22 |

---

## 1. Persona (detail)

### P-01 Solo Owner-Operator
- **Konteks:** Perorangan; satu orang mengerjakan semua peran (owner, operator, kasir informal, kru utama). Tier: **miniRider**.
- **Tujuan:** Menjalankan event dari awal ke akhir dalam satu tempat — rider, media kit, aset dasar, dan koordinasi ≤5 kru tanpa Tools yang tersebar.
- **Pain points (desk analysis):** (1) dokumen rider/media kit tercecer di chat/file pribadi; (2) kru tidak tahu konteks event mana yang aktif; (3) tidak ada riwayat aset dasar yang dipakai; (4) takut fitur kompleks — butuh default sederhana (progressive disclosure, UX_UI_STANDARD §2.6); (5) kebingungan batas kuota kru (OD-05 belum memutuskan owner dihitung atau tidak).
- **Kebutuhan fitur (REQ):** REQ-003 (5 halaman), REQ-004 (rider draft↔event), REQ-005 (media kit template↔event), REQ-006 (aset dasar + template set), REQ-007 (konteks event kru — untuk krunya), REQ-008 (chat/rundown/media kit/laporan), REQ-009 (kuota 5 kru + pesan jelas), REQ-010 (Equipment Store in-app), REQ-021/REQ-022 (login WhatsApp/Google), REQ-032..REQ-035 (UX states), REQ-028 (i18n ID default).
- **Batas tanggung jawab vs persona lain:** Merupakan owner workspace-nya sendiri; TIDAK mengelola platform (P-08), TIDAK punya hak Developer Portal (P-07), TIDAK menyentuh finance/CRM (domain P-06, tier maxRider). Bila bertumbuh → berperan sebagai P-02.

### P-02 Workspace Owner UKM
- **Konteks:** Pemilik usaha kecil menengah event/rental; kelola tim dan lisensi; naik tier mini→max. Tier: **miniRider → maxRider**.
- **Tujuan:** Mengatur akses tim dengan aman (invite/suspend/remove), memantau kuota seat, membeli extension/upgrade saat bertumbuh **tanpa kehilangan data atau pindah aplikasi** (REQ-002).
- **Pain points (desk analysis):** (1) undangan manual via chat rawan salah/kedaluwarsa; (2) mantan kru bisa masih punya akses bila lifecycle membership lemah; (3) ketakutan upgrade menyeret migrasi data; (4) tidak jelas apa yang terjadi pada data saat downgrade (OD-108); (5) nilai komersial (harga/billing) belum bisa dilihat — keputusan OD-06.
- **Kebutuhan fitur (REQ):** REQ-049 (membership lifecycle), REQ-051 (undangan token aman), REQ-009 (kuota + extension +10 seat, REQ-018), REQ-002 (upgrade tanpa migrasi manual), REQ-098/REQ-099 (siklus lisensi & perilaku data downgrade), REQ-024 (entitlement server-side), REQ-026 (permission berlapis), REQ-030 (store publik).
- **Batas tanggung jawab vs persona lain:** Owner memutuskan membership & assignment dalam workspace-nya; TIDAK mengatur role developer (P-07), akses auditor (P-09 — provisioning via REQ-053 bersama P-10), atau operasi platform (P-08). Kru (P-03) menerima/menolak penugasan — owner tidak dapat memaksa lamaran hiRider (REQ-013).

### P-03 Crew Member
- **Konteks:** Kru lapangan (audio, kamera, lighting, operator); bekerja lintas workspace via **hiRider**; mobile-first; konteks event yang berubah-ubah. Tier: **hiRider** + membership di workspace mini/max.
- **Tujuan:** Tahu di event apa dia ditugaskan, lihat rundown/info terbaru di ponsel, lapor progres dari lapangan — dan membangun karier lewat profil/rekrutmen.
- **Pain points (desk analysis):** (1) jaringan buruk di lokasi event (REQ-037; offline = OD-07); (2) lamaran diterima ≠ langsung punya akses — butuh penjelasan UI yang jelas (REQ-013); (3) salah konteks event saat multi-penugasan (REQ-007 harus safe switch); (4) visibilitas profil/privasi (OD-109); (5) notifikasi kejadian penting belum didefinisikan (kandidat OD-125).
- **Kebutuhan fitur (REQ):** REQ-062 (profil skill/portofolio + visibilitas), REQ-063 (rekrutmen terbuka), REQ-064 (application lifecycle + notifikasi status), REQ-013 (lamaran ≠ akses), REQ-049 (membership), REQ-050 (event assignment), REQ-007 (konteks aktif + switch), REQ-008 (halaman event), REQ-019 (mobile browser fungsional), REQ-034 (state lengkap), REQ-037 (evaluasi jaringan buruk).
- **Batas tanggung jawab vs persona lain:** Hanya melihat event yang ditugaskan (REQ-050); tidak bisa mengubah rundown/struktur workspace (P-04/owner); tidak bisa menyetujui lamaran orang lain; data profil diatur visibilitasnya sendiri (REQ-062, OD-109).

### P-04 Event Manager
- **Konteks:** Pengelola event/proyek di workspace UKM/bertumbuh; menjalankan event dari brief sampai laporan. Tier: **miniRider/maxRider** (modul event sama, diperkaya di max).
- **Tujuan:** Event berjalan sesuai rider & rundown; semua kru terkoordinasi; laporan event tersusun tanpa kejar-kejaran manual.
- **Pain points (desk analysis):** (1) rundown berubah mendadak — versi & distribusi info; (2) kru tidak melihat update terbaru (data stale); (3) laporan tersebar di chat pribadi; (4) rider dibuat tapi tidak terhubung event yang benar (dicegah REQ-004); (5) koordinasi lintas kru multi-workspace (P-03) butuh assignment rapi (REQ-050).
- **Kebutuhan fitur (REQ):** REQ-004 (rider), REQ-005 (media kit), REQ-008 (Chat, Rundown, Media Kit, update info/laporan), REQ-050 (assignment kru per event), REQ-007 (switch konteks), REQ-003 (navigasi), REQ-046 (bila maxRider: dossier/event ops), REQ-034 (state UI).
- **Batas tanggung jawab vs persona lain:** Mengelola isi event & penugasan yang dititipkan owner (P-02); tidak mengubah membership workspace; tidak menyentuh lisensi (P-02), aset lifecycle penuh (P-05), keuangan (P-06).

### P-05 Rental/Asset Manager
- **Konteks:** Pengelola aset/rental di maxRider: register aset, QR/label, reservasi, check-in/out, maintenance, readiness. Tier: **maxRider** (diwarisi ISOrider).
- **Tujuan:** Aset siap pakai tepat waktu, tidak double-booked, kondisi tercatat, maintenance tidak terlewat, KPI dari data nyata.
- **Pain points (desk analysis):** (1) double-booking aset/set (REQ-065; kebijakan OD-107); (2) label QR rusak/tidak terbaca → butuh fallback manual (REQ-067, REQ-090); (3) izin kamera ditolak di mobile; (4) maintenance overdue tak terlihat (REQ-068); (5) kondisi barang saat return sering tidak terdokumentasi (REQ-066 evidence); (6) pekerjaan lapangan offline (OD-07).
- **Kebutuhan fitur (REQ):** REQ-045 (lifecycle penuh + register + audit trail), REQ-036 (QR/barcode, print, scan), REQ-065 (reservation conflict), REQ-066 (check-in/out + capture kondisi), REQ-067 (scanner + fallback), REQ-068 (maintenance/calibration due), REQ-069 (KPI dari data nyata), REQ-090 (scanner UX states), REQ-083 (evidence kondisi terkunci), REQ-006 (aset dasar mini, fondasi Phase 8).
- **Batas tanggung jawab vs persona lain:** Mengelola aset & readiness; TIDAK memutuskan harga sewa/komersial (P-06), TIDAK menugaskan kru (P-04), gate readiness dapat menjadi prasyarat bagi P-04 (kandidat OD-126).

### P-06 Finance/CRM Officer
- **Konteks:** Staf keuangan/komersial maxRider: pelanggan, quotation, order/contract, invoice & payment states. Tier: **maxRider** (diwarisi ISOrider).
- **Tujuan:** Alur inquiry → quotation → order → invoice → pembayaran yang rapi dan teraudit; keluhan pelanggan ter-track.
- **Pain points (desk analysis):** (1) payment/invoice states bergantung integrasi yang belum diputuskan (OD-06); (2) pajak/harga tidak boleh dikarang — sistem tidak boleh menampilkan angka fiktif (MC §14; UX anti-mockup); (3) data pelanggan duplikat; (4) kebutuhan export (OD-111 — opsi export-only); (5) invoice/approved record harus immutable (REQ-027).
- **Kebutuhan fitur (REQ):** REQ-046 (CRM, quotations/orders/contracts, finance workflow, payment/invoice states, customer complaints), REQ-011 (core maxRider), REQ-096 (import/export, OD-111), REQ-027 (approved records immutable), REQ-034/REQ-035 (state & anti-mockup).
- **Batas tanggung jawab vs persona lain:** Hanya domain komersial; TIDAK mengelola aset (P-05), TIDAK mengubah lisensi/billing platform (itu owner platform via OD-06, bukan workspace), keluhan pelanggan bisa jadi input NCR di ISOrider (P-10, REQ-075).

### P-07 Developer/Store Manager
- **Konteks:** Pengelola katalog Equipment Store in-app (miniRider) dan Developer Portal (katalog/listing publik, stok, harga, diskon, media, publikasi) + notifikasi terarah. Tier: **peran platform khusus** (REQ-052 — role terpisah dari workspace roles).
- **Tujuan:** Katalog akurat & terpublish terkendali; notifikasi sampai ke audience tepat tanpa spam/duplikat; semua aksi teraudit.
- **Pain points (desk analysis):** (1) salah kirim broadcast tanpa pratinjau (dicegah REQ-059); (2) duplikat kirim (dicegah REQ-060); (3) godaan/kekeliruan menyentuh billing/lisensi (dicegah REQ-031 — least privilege); (4) model role (satu role + sub-permission vs role terpisah) belum diputuskan (OD-101); (5) jenis notifikasi wajib/opsional & otoritas approval (OD-102); (6) nilai harga/diskon menunggu OD-06.
- **Kebutuhan fitur (REQ):** REQ-010 (store in-app miniRider-only + blokir API tier lain), REQ-016/REQ-058 (Developer Portal), REQ-055 (listing lifecycle draft→published→archived), REQ-056 (stok/harga/diskon + audit trail), REQ-057 (media + limit), REQ-059 (audience + pratinjau wajib), REQ-060 (dedup/idempotency + status), REQ-061 (preferensi & opt-out), REQ-017 (governance notifikasi), REQ-031 (pemisahan hak).
- **Batas tanggung jawab vs persona lain:** TIDAK memutuskan harga final (owner, OD-06); TIDAK punya hak ubah lisensi/billing (REQ-031); TIDAK mengelola akun pengguna (P-08); pengguna workspace (P-01..P-06) hanya penerima notifikasi dengan preferensi (REQ-061).

### P-08 Platform Administrator/Support
- **Konteks:** Operasi platform epicRider: kesehatan sistem, bantuan akun, investigasi insiden. Tier: **peran platform** (bukan tier workspace), least privilege.
- **Tujuan:** Pengguna terbantu cepat; insiden dapat ditrace dari log tanpa membuka secret; akses admin tidak melewati tenant isolation.
- **Pain points (desk analysis):** (1) user ter-lockout akibat rate limit (REQ-054) — butuh alur verifikasi identitas aman; (2) sesi bocor/perangkat hilang (REQ-048 revoke); (3) log tanpa struktur menyulitkan trace (REQ-095); (4) admin over-privileged adalah risiko keamanan (REQ-092); (5) target NFR belum disetujui (OD-112/OD-114).
- **Kebutuhan fitur (REQ):** REQ-095 (observability: log terstruktur, error tracking, tanpa secret di log), REQ-092 (baseline keamanan/privasi), REQ-048 (session lifecycle & revoke), REQ-054 (anti-abuse), REQ-049 (suspend/remove membership saat penanganan), REQ-098 (status lisensi saat diagnosis), REQ-024 (entitlement saat diagnosis), REQ-023 (isolasi tenant juga untuk admin).
- **Batas tanggung jawab vs persona lain:** TIDAK mengubah data bisnis pengguna tanpa jejak; TIDAK memutuskan kebijakan (owner); memberikan provisioning auditor (P-09) hanya sesuai permintaan berwenang (REQ-053, OD-110); role developer (P-07) terpisah darinya (REQ-052).

### P-09 Auditor internal/eksternal
- **Konteks:** Auditor mutu/IMS internal atau eksternal (mis. persiapan sertifikasi organisasi). Tier: **ISOrider** — akses auditor read-only, scoped, time-bound.
- **Tujuan:** Memeriksa dokumen terkendali & bukti yang relevan dalam lingkup dan periode yang diberikan, lalu aksesnya berhenti otomatis.
- **Pain points (desk analysis):** (1) akses berlebihan berisiko — butuh scope minimum (REQ-053, OD-110: scope default/durasi maksimum/NDA); (2) butuh jejak bahwa organisasi tahu apa yang dilihat auditor (access log REQ-082); (3) butuh export terkendali (REQ-084); (4) evidence harus terkunci — tidak bisa dimodifikasi diam-diam (REQ-083).
- **Kebutuhan fitur (REQ):** REQ-044 (read-only scoped time-bound), REQ-053 (provisioning + expiry otomatis + ekspansi scope butuh persetujuan), REQ-084 (auditor view + export terkendali), REQ-082 (viewing/download terkontrol + access log), REQ-083 (locked evidence), REQ-042 (library search/preview), REQ-081 (retensi/disposisi — OD-104).
- **Batas tanggung jawab vs persona lain:** TIDAK menulis/mengubah apa pun; scope ditetapkan P-10/owner; akses berakhir tanpa tindakan auditor; tidak melihat workspace/dokumen di luar scope.

### P-10 IMS/Sustainability Manager
- **Konteks:** Pengelola sistem manajemen terintegrasi di organisasi ISOrider: proses, dokumen terkendali, bukti, NCR/CAPA, review, sustainability. Tier: **ISOrider**.
- **Tujuan:** Rantai Process → Control → Workflow → Transaction → Evidence → Report terhubung dan dapat diaudit; improvement berjalan.
- **Pain points (desk analysis):** (1) IMS gagal bila berbentuk kumpulan formulir lepas — butuh proses sebagai objek terhubung (REQ-070); (2) dokumen basi tanpa versioning/approval/reminder (REQ-078..080); (3) emisi/karbon tidak boleh dikarang — butuh metodologi (OD-105) & flag measured/estimated (REQ-086); (4) standar dipakai untuk mapping tanpa verified date tidak boleh (REQ-071; verifikasi ISO masih `BLOCKED` — ADR-002); (5) NCR harus terhubung transaksi/evidence nyata (REQ-075).
- **Kebutuhan fitur (REQ):** REQ-012 (IMS end-to-end), REQ-070 (process architecture), REQ-071/REQ-072 (standard register & mapping metadata), REQ-075 (incident→NCR→CAPA→effectiveness→closure), REQ-076 (management review), REQ-077 (continual improvement), REQ-078..REQ-082 (controlled documents), REQ-083 (evidence workflow), REQ-085..REQ-087 (sustainability KPI/dictionary/improvement), REQ-073 (supplier qualification), REQ-074 (kompetensi), REQ-027 (immutable approved records).
- **Batas tanggung jawab vs persona lain:** Menetapkan scope akses auditor (P-09) atas nama organisasi; mendefinisikan proses yang dijalankan P-04..P-06; TIDAK memutuskan retensi final (OD-104, owner + IMS lead); TIDAK mengklaim kepatuhan standar (owner + verifikasi eksternal).

### P-11 Supplier/Contractor
- **Konteks:** Vendor/penyedia jasa luar yang terlibat event/kontrak organisasi ISOrider (kualifikasi, pengadaan, kontrol vendor — MC §2 ISOrider & §9). Akses ke platform **sangat terbatas, bila relevan** — model akses = kandidat keputusan **OD-120**.
- **Tujuan:** Data kualifikasi & kinerjanya tercatat benar sehingga bisa dipakai untuk pekerjaan berikutnya.
- **Pain points (desk analysis):** (1) tidak jelas bagaimana cara menyerahkan dokumen kualifikasi (portal? akun terbatas? dikelola internal?); (2) data sensitif supplier tidak boleh bocor ke tenant lain; (3) status kualifikasi tidak terlihat bila tidak ada akses.
- **Kebutuhan fitur (REQ):** REQ-073 (supplier/contractor qualification & kontrol terdokumentasi — evaluasi tercatat dengan status & bukti); REQ-041 (pengadaan/vendor dalam workflow sustainability); REQ-085 (data metrik dari pengadaan bila relevan). Model akses eksternal menunggu OD-120.
- **Batas tanggung jawab vs persona lain:** TIDAK punya akses ke operasi internal kecuali model akses (OD-120) mengizinkan; dinilai/dikualifikasi oleh P-10 (ISOrider) / owner workspace; TIDAK termasuk hiRider marketplace kru (itu P-03).

### P-12 Customer
- **Konteks:** Pelanggan layanan (menyewa jasa/aset dari pengguna maxRider/ISOrider). Tidak selalu memiliki akun platform; kanal feedback & model akses = kandidat keputusan **OD-121**.
- **Tujuan:** Mendapat layanan sesuai quotation/contract; suaranya (feedback/keluhan) didengar dan ditindaklanjuti.
- **Pain points (desk analysis):** (1) keluhan masuk chat pribadi dan hilang tanpa tracking; (2) tidak ada visibilitas status penanganan keluhan; (3) risiko ekspektasi keliru bila landing page berisi klaim/tombol palsu (dicegah REQ-015 + UX anti-mockup).
- **Kebutuhan fitur (REQ):** REQ-046 (customer complaints ter-track di CRM maxRider), REQ-075 (keluhan → NCR/CAPA di ISOrider bila relevan), REQ-015 (landing page jujur: produk, lisensi, extensions, akses tester, download, login), REQ-100 (akses tester/demo — scope = keputusan owner), REQ-030 (store publik lisensi/extension bila menjadi pelanggan platform).
- **Batas tanggung jawab vs persona lain:** Berinteraksi dengan P-06 (finance/CRM) sebagai pihak eksternal; TIDAK melihat operasi internal workspace; akses apa pun yang diberikan harus scoped & terkendali (prinsip MC §10).

---

## 2. Journeys kritis (J-01..J-12)

Konvensi: state UI mengikuti `UX_UI_STANDARD.md` §2.4 — `loading`, `empty`, `error`, `success`, `permission denied`, `offline/sync pending`, `data stale` (bila relevan) — dan REQ-034. Semua journey = desk analysis, belum divalidasi partisipan nyata.

### J-01 — Solo operator: dari nol ke event pertama (P-01)
**Langkah utama:**
1. Registrasi/login via WhatsApp (REQ-021) atau Google (REQ-022), dengan recovery/fallback (REQ-047).
2. Buat workspace event-based; landing di Home (REQ-003).
3. Buat event pertama.
4. Buat technical rider draft dan hubungkan ke event (REQ-004 — rider tanpa event tidak bisa published).
5. Buat/unduh media kit dari template, terkait event (REQ-005).
6. Daftarkan aset dasar + template set (REQ-006).
7. Undang kru (≤5; REQ-051, kuota REQ-009/OD-05) dan assign ke event (REQ-050).
8. Jalankan event: chat, rundown, update laporan (REQ-008).
9. Opsional: jelajahi Equipment Store in-app (REQ-010, Phase 11).

**Titik kegagalan/risiko:** OTP tidak tiba/kedaluwarsa/replay → alur harus aman namun tidak mengunci user tanpa fallback (REQ-021/047/054, OD-03); kru ke-6 ditolak server-side dengan pesan jelas (REQ-009); rider disimpan tanpa event → ditolak (REQ-004); kru lupa di-assign → tidak melihat event (REQ-050 — harus terlihat sebagai empty state yang menjelaskan, bukan error samar).
**State UI:** `loading` (login/kirim OTP), `empty` (belum ada event/aset/kru), `error` (OTP gagal, validasi rider), `success` (rider tersimpan), `permission denied` (kru buka event lain), `offline/sync pending` (laporan lapangan — tergantung OD-07).
**REQ:** 021, 022, 047, 003, 004, 005, 006, 009, 051, 050, 008, 010, 034.
**Fase:** 4 (auth), 5 (kuota/entitlement), 6 (home/event), 7 (rider), 8 (aset), 9 (media kit), 10 (chat/rundown/laporan), 11 (store in-app).

### J-02 — Owner UKM: kelola tim & naik tier mini→max (P-02)
**Langkah utama:**
1. Login (REQ-021/022).
2. Cek pemakaian seat terhadap kuota (REQ-009; OD-05 menentukan owner dihitung atau tidak).
3. Undang kru via token sekali pakai/kedaluwarsa (REQ-051).
4. Kelola membership: suspend/remove/leave mengubah akses seketika (REQ-049).
5. Butuh kapasitas lebih → beli extension +10 seat via store publik (REQ-018; nilai komersial = OD-06).
6. Upgrade tier mini→max (REQ-002, REQ-098).
7. Verifikasi: data lama tetap terakses; fitur max aktif via entitlement server-side (REQ-024, REQ-099).
8. Susun role/permission dinamis untuk tim (REQ-011, REQ-026).

**Titik kegagalan/risiko:** link undangan dipakai ulang/kedaluwarsa → ditolak (REQ-051); pembayaran/upgrade gagal → state error jelas tanpa angka fiktif (OD-06 open); downgrade mengunci fitur tapi data tidak hilang diam-diam (REQ-099, OD-108); ekspektasi Equipment Store in-app hilang di maxRider → perlu komunikasi UI (REQ-010).
**State UI:** `loading`, `empty` (belum ada anggota), `error` (pembayaran/undangan gagal), `permission denied` (anggota suspended mencoba akses), `success` (upgrade sukses), `data stale` (kuota setelah perubahan lisensi).
**REQ:** 009, 018, 049, 051, 002, 098, 099, 024, 026, 010, 030.
**Fase:** 4 (membership), 5 (lisensi/entitlement), 12–15 (fitur max), 23 (extension).

### J-03 — Kru hiRider: melamar sampai tugas event selesai (P-03)
**Langkah utama:**
1. Buat profil kru: skill, portofolio, visibilitas (REQ-062; OD-109).
2. Cari rekrutmen yang terbuka & memenuhi kriteria (REQ-063).
3. Lamar; pantau status apply→shortlist→accept/reject/withdraw (REQ-064).
4. Diterima ≠ akses: owner menambahkan membership & event assignment (REQ-013, REQ-049, REQ-050).
5. Buka app di mobile browser (REQ-019); login (REQ-021/022).
6. Lihat konteks event aktif yang ditugaskan; pindah konteks dengan aman bila multi-penugasan (REQ-007).
7. Baca rundown/media kit; kirim update/laporan dari lapangan (REQ-008).
8. Selesai tugas; status keluar dari event tanpa kehilangan riwayat (REQ-049/REQ-050).

**Titik kegagalan/risiko:** kru mengira lamaran diterima = langsung punya akses → UI harus menjelaskan status & langkah berikutnya (REQ-013); jaringan buruk saat submit laporan (REQ-037; mitigasi offline = OD-07); salah konteks event → risiko bocor data event lain (REQ-007, test isolasi); izin notifikasi/perangkat ditolak.
**State UI:** `empty` (belum ada rekrutmen/penugasan), `loading`, `permission denied` (event tidak di-assign), `error` (gagal submit), `offline/sync pending` (laporan lapangan, bila OD-07 mendukung), `data stale` (rundown berubah).
**REQ:** 062, 063, 064, 013, 049, 050, 007, 008, 019, 037, 034.
**Fase:** 4 (auth/membership), 6 & 10 (event), 16 (hiRider marketplace/rekrutmen), 23–24 (mobile delivery & offline bila diputuskan).

### J-04 — Event manager: menjalankan satu event end-to-end (P-04)
**Langkah utama:**
1. Buat event & detail (REQ-003, Phase 6).
2. Siapkan technical rider (REQ-004) dan media kit (REQ-005).
3. Susun rundown (REQ-008).
4. Assign kru per event (REQ-050).
5. Koordinasi via chat event (REQ-008).
6. Distribusikan update informasi/laporan antar anggota (REQ-008).
7. Tutup event: rangkum laporan (REQ-008, Phase 10).
8. Bila maxRider: kaitkan ke dossier/transaksi komersial (REQ-046; Phase 12–15; integrasi penuh Phase 21).

**Titik kegagalan/risiko:** kru tidak menerima pembaruan penting → kebutuhan notifikasi in-app baseline (kandidat OD-125); rundown berubah mendadak tanpa versioning jelas → komunikasi via chat + data stale; laporan duplikat/kotak kosong; kru non-anggota mencoba akses → ditolak (REQ-008).
**State UI:** `loading`, `empty` (rundown/laporan kosong), `error` (kirim chat gagal), `success`, `permission denied` (non-anggota), `data stale` (info lama saat offline).
**REQ:** 003, 004, 005, 008, 050, 007, 046, 034.
**Fase:** 6, 7, 9, 10 (mini); 12–15 & 21 (max/ISOrider enrichment).

### J-05 — Rental/asset manager: siklus aset penuh (P-05)
**Langkah utama:**
1. Registrasi aset ke asset register (REQ-045; fondasi aset dasar REQ-006/Phase 8).
2. Generate QR/barcode unik + cetak label (REQ-036).
3. Buat reservation dengan deteksi konflik (REQ-065; kebijakan OD-107).
4. Inspection & readiness gate (REQ-045; definisi gate = kandidat OD-126).
5. Check-out dengan capture kondisi (foto/catatan) sebagai evidence (REQ-066, REQ-083).
6. Dispatch → event use → movement history (REQ-045).
7. Return + kondisi/damage (REQ-066).
8. Maintenance/calibration schedule dengan tracking due/overdue (REQ-068).
9. Pantau KPI utilization/downtime/cost dari data nyata (REQ-069).
10. Scan via web/mobile untuk semua alur di atas (REQ-036, REQ-067, REQ-090).

**Titik kegagalan/risiko:** double-booking (REQ-065/OD-107); QR rusak/kode tidak dikenal → fallback manual wajib berfungsi (REQ-067/090); izin kamera denied; aset overdue maintenance lolos (REQ-068); offline di gudang/lapangan (OD-07); edit evidence kondisi setelah sign-off → ditolak (REQ-083/REQ-027).
**State UI:** `loading` (scan), `empty` (kode tidak ditemukan), `error` (kode invalid, kamera gagal), `permission denied` (tanpa hak check-out), `offline/sync pending`, `success` (check-out tercatat).
**REQ:** 045, 036, 065, 066, 067, 068, 069, 090, 083, 006.
**Fase:** 8 (aset dasar), 13 (lifecycle/QR/maintenance), 15 (readiness/HSE gate), 24 (offline bila OD-07).

### J-06 — Finance/CRM officer: dari prospek ke invoice (P-06)
**Langkah utama:**
1. Kelola pelanggan di CRM (REQ-046, Phase 12).
2. Buat quotation dari kebutuhan event/rental.
3. Quotation → order/contract (REQ-046).
4. Buat invoice; kelola payment/invoice states sesuai integrasi yang disetujui (REQ-046; gateway = OD-06).
5. Catat pembayaran & status (state machine yang valid).
6. Tangani keluhan pelanggan → complaint record (REQ-046); di ISOrider bisa lanjut NCR (REQ-075).
7. Export data untuk pelaporan bila diizinkan (REQ-096; scope OD-111).

**Titik kegagalan/risiko:** transisi invoice state invalid → ditolak; quotation tanpa pelanggan/paket tidak valid; PAJAK/HARGA TIDAK BOLEH DIKARANG — sampai OD-06, sistem hanya menyediakan struktur, bukan angka; invoice approved tidak bisa diedit diam-diam (REQ-027).
**State UI:** `loading`, `empty` (belum ada pelanggan/quotation), `error` (validasi gagal), `permission denied` (non-finance), `success`; anti-mockup: tanpa data demo tanpa label (REQ-035).
**REQ:** 046, 011, 096, 027, 075, 035.
**Fase:** 12 (CRM), 14 (finance/commercial), 20 (NCR linkage — ISOrider), 24 (export).

### J-07 — Developer/store manager: listing & notifikasi terarah (P-07)
**Langkah utama:**
1. Login Developer Portal dengan role khusus (REQ-058, REQ-052).
2. Buat listing katalog Equipment Store (draft → published → archived; REQ-055).
3. Upload media produk dengan limit tipe/ukuran (REQ-057).
4. Atur stok, harga, diskon — setiap perubahan teraudit (REQ-056; nilai final = OD-06).
5. Publikasikan listing (terkendali; REQ-055).
6. Susun notifikasi: pilih audience (semua workspace / workspace terpilih / user terpilih; REQ-059).
7. Pratinjau penerima wajib — jumlah penerima tampil sebelum kirim (REQ-059).
8. Kirim dengan dedup/idempotency; pantau status queued/sent/failed (REQ-060).
9. Hormati preferensi & opt-out user (REQ-061; jenis wajib = OD-102).
10. Semua aksi tercatat audit log (REQ-031, REQ-058).

**Titik kegagalan/risiko:** kirim tanpa pratinjau → tidak mungkin (REQ-059); kirim ganda → tidak menghasilkan pesan ganda (REQ-060); mencoba akses billing/lisensi → denial teraudit (REQ-031); abuse broadcast → pembatasan + anti-abuse (MC §2, REQ-017); model role belum diputuskan (OD-101).
**State UI:** `loading`, `empty` (katalog/penerima kosong), `error` (upload/kirim gagal), `permission denied` (role tidak sesuai), `success` (published/terkirim), status pengiriman terlihat.
**REQ:** 010, 016, 017, 031, 052, 055, 056, 057, 058, 059, 060, 061.
**Fase:** 11 (Equipment Store in-app), 22 (Developer Portal + notifikasi governance).

### J-08 — Platform admin/support: menangani insiden akses (P-08)
**Langkah utama:**
1. Terima laporan: user tidak bisa login/akses hilang.
2. Trace dari log terstruktur & error tracking tanpa mengekspos secret (REQ-095, REQ-092).
3. Identifikasi akun, sesi & device aktif (REQ-048).
4. Tinjau audit event auth percobaan gagal/lockout (REQ-054, REQ-021).
5. Tindakan terukur: revoke sesi per/all device (REQ-048); suspend/remove membership bila perlu (REQ-049).
6. Verifikasi status lisensi/entitlement untuk diagnosis (REQ-098, REQ-024).
7. Tutup kasus dengan dokumentasi audit trail.

**Titik kegagalan/risiko:** admin tanpa batas → risiko keamanan; akses diagnosis tidak boleh melewati tenant isolation (REQ-023); lockout keliru karena rate limit (REQ-054) — butuh jalur recovery aman (REQ-047); tidak ada target NFR disetujui untuk "cepat" (OD-112).
**State UI:** `loading`, `empty` (log tidak ditemukan), `error`, `permission denied` (admin di luar scope), `success`; semua aksi admin teraudit.
**REQ:** 095, 092, 048, 047, 054, 049, 098, 024, 023.
**Fase:** 4 (identity/session), 5 (lisensi), 3 & 25 (observability/hardening).

### J-09 — Auditor: audit terbatas organisasi ISOrider (P-09)
**Langkah utama:**
1. Owner/P-10 mengajukan provisioning akses auditor: read-only, scoped (workspace/dokumen tertentu), time-bound (REQ-053; parameter default = OD-110).
2. Auditor login dengan akses tersebut (REQ-053, REQ-025 — identitas terpisah dari membership).
3. Jelajah controlled document library dalam scope: search/filter/preview (REQ-042, REQ-082 — setiap view/download tercatat).
4. Periksa evidence locked: form→sign-off→locked record (REQ-083).
5. Export terkendali sesuai izin (REQ-084).
6. Periode berakhir → akses expired otomatis (REQ-044/053).
7. Organisasi meninjau access log auditor (REQ-082).

**Titik kegagalan/risiko:** auditor mencoba akses di luar scope → ditolak (test); mencoba menulis → ditolak (read-only); ekspansi scope tanpa persetujuan terpisah → ditolak (REQ-053); dokumen scope ternyata kosong → empty state jelas.
**State UI:** `permission denied` (dengan penjelasan scope), `empty`, `loading`, `error`, `success` (export), indikator read-only permanen.
**REQ:** 044, 053, 084, 082, 083, 042, 081.
**Fase:** 17 (document library), 18 (evidence + Audit Mode).

### J-10 — IMS manager: temuan sampai management review (P-10)
**Langkah utama:**
1. Definisikan proses → kontrol → workflow sebagai objek terhubung (REQ-070).
2. Buat dokumen terkendali: metadata lengkap → review → approval → effective date (REQ-078, REQ-079, REQ-080).
3. Jalankan evidence workflow: checklist → hasil → upload → submit → review → sign-off → locked (REQ-083).
4. Catat incident/temuan dari transaksi nyata (REQ-075).
5. Buka NCR → CAPA → effectiveness check → closure (REQ-075).
6. Jalankan management review: input, keputusan, action items ter-track (REQ-076).
7. Track continual improvement (REQ-077).
8. Kelola data sustainability: KPI dictionary (REQ-085), flag measured/estimated + larangan angka GHG tanpa metodologi (REQ-086, OD-105/106), improvement loop (REQ-087).
9. Terhubung standar via standard register dengan verified date (REQ-071, REQ-072 — verifikasi ISO `BLOCKED`/ADR-002).

**Titik kegagalan/risiko:** edit locked evidence → ditolak, koreksi hanya amendment (REQ-083/REQ-027); input emisi tanpa metodologi → ditolak/berlabel estimated (REQ-086); mapping klausul tanpa verified date → ditolak (REQ-071); NCR melayang tanpa relasi transaksi → tidak valid (REQ-070/075); retensi belum bisa dikunci (OD-104).
**State UI:** `loading`, `empty`, `error` (validasi), `permission denied` (approval hanya approver), `success`, `data stale` (review pakai data lama).
**REQ:** 070, 071, 072, 075, 076, 077, 078, 079, 080, 083, 085, 086, 087, 027.
**Fase:** 17 (IMS foundation + library), 18 (evidence/sign-off), 19 (sustainability/HSE), 20 (NCR/CAPA/review), 21 (integrasi E2E).

### J-11 — Supplier/contractor: kualifikasi & penggunaan (P-11)
**Langkah utama:**
1. Supplier dimasukkan/diajukan oleh organisasi (P-10/owner).
2. Data kualifikasi dikumpulkan — dokumen, sertifikat, evaluasi (REQ-073).
3. Evaluasi tercatat dengan status & bukti (REQ-073).
4. Supplier terkait workflow pengadaan/event yang relevan (MC §9 pengadaan/vendor; REQ-041).
5. Bila model akses memberi akses eksternal (OD-120): supplier melihat/mengirim hanya yang diizinkan; bila tidak: seluruh data dikelola internal oleh P-10.
6. Status kualifikasi dipakai dalam keputusan penggunaan (REQ-073; kompetensi terkait REQ-074 bila relevan).

**Titik kegagalan/risiko:** supplier tanpa kualifikasi dipakai di event → kontrol tidak menahan (REQ-073 harus mengecek status); data sensitif supplier bocor lintas tenant (REQ-023); model akses eksternal belum ada (OD-120) → jangan membangun portal supplier prematur.
**State UI:** `empty` (belum ada evaluasi), `loading`, `error` (dokumen tidak valid), `permission denied` (supplier melihat hanya miliknya — bila diberi akses), `success`.
**REQ:** 073, 074, 041, 023, 070.
**Fase:** 19 (IMS sustainability/vendor workflows — dengan catatan: detail akses menunggu OD-120).

### J-12 — Customer: feedback & penanganan keluhan (P-12)
**Langkah utama:**
1. Pelanggan menerima layanan (interaksi komersial dikelola P-06 via CRM, REQ-046).
2. Feedback/keluhan disampaikan — kanal tergantung OD-121 (dicatat officer internal / akun terbatas / formulir publik).
3. Keluhan tercatat sebagai complaint record ter-track (REQ-046) — bukan chat pribadi yang hilang.
4. Bila ISOrider: keluhan → dikaitkan NCR/CAPA (REQ-075).
5. Follow-up & closure ter-dokumentasi (REQ-076 bila masuk review).
6. Pelanggan potensial mengakses landing page publik: informasi produk/lisensi/extensions/tester/download (REQ-015, REQ-100; store publik REQ-030).

**Titik kegagalan/risiko:** keluhan tanpa tracking hilang (dicegah REQ-046); landing page berisi tombol/klaim palsu → pelanggan kecewa & melanggar UX_UI_STANDARD §2.5; akses tester bocor data nyata (REQ-100: environment terpisah/berlabel); model akses pelanggan prematur (OD-121).
**State UI:** `empty`, `loading`, `error`, `success` (feedback terkirim), `permission denied` (pelanggan hanya melihat miliknya, bila diberi akses).
**REQ:** 046, 075, 076, 015, 100, 030.
**Fase:** 12 (CRM), 20 (NCR linkage), 22 (landing/tester/store publik).

---

## 3. Kandidat keputusan baru WS-A (OD-120..OD-129)

Aturan: item di bawah **bukan keputusan** — status `OPEN / OWNER APPROVAL REQUIRED`. Bila owner menyetujui, catat di `DECISIONS.md` sebagai ADR dan pindahkan status. Tidak ada item yang mendefinisikan ulang OD-01..OD-116.

| ID | Keputusan | Opsi | Dampak bila tertunda | Rekomendasi (bukan keputusan) | Pemutus |
|---|---|---|---|---|---|
| OD-120 | Model akses eksternal supplier/contractor (P-11) | (a) tanpa akun — semua data kualifikasi dikelola internal; (b) akun terbatas scoped per organisasi; (c) portal submission eksternal terpisah | Detail REQ-073 & desain Phase 19; risiko membangun portal supplier prematur | (a) untuk rilis awal; evaluasi (b) saat kebutuhan nyata terbukti | Owner + IMS lead |
| OD-121 | Kanal feedback/keluhan pelanggan & model akses pelanggan (P-12) | (a) dicatat internal oleh finance/CRM officer tanpa akun pelanggan; (b) akun pelanggan terbatas read-scoped; (c) formulir publik di landing | Desain CRM Phase 12 & complaint flow; REQ-046/015/100 | (a) untuk rilis awal; landing tetap tanpa akun pelanggan | Owner |
| OD-122 | Preset role default per tier (owner, event manager, crew, finance, asset manager, dst.) sebagai titik awal role dinamis | (a) hanya custom roles; (b) preset default read-only + dapat dikustom; (c) preset tanpa kustomisasi | Kecepatan onboarding & desain permission Phase 4/15 (REQ-011, REQ-026) | (b) preset default + kustomisasi penuh di maxRider | Owner + eng lead |
| OD-123 | Batas jumlah workspace per user & kebijakan multi-workspace untuk non-kru (owner/bisnis) | (a) 1 workspace per user tanpa extension; (b) workspace tambahan via extension (MC §3) tanpa angka final; (c) angka & harga final menunggu OD-06 | REQ-014 (hiRider multi-workspace), REQ-049, licensing Phase 5/23 | (b) — konsisten MC §3; angka tunggu OD-06 | Owner |
| OD-124 | Rencana validasi persona & journey dengan partisipan pengguna nyata (metode, jumlah minimal, waktu) | (a) sesi tugas berbasis skenario J-01..J-12 pada prototype/rilis awal; (b) heuristic review eksternal dulu; (c) tunda tanpa rencana | Semua klaim usability tetap terlarang tanpa evaluasi (REQ-091); risiko produk meleset dari kebutuhan nyata | (a) sebelum/mulai Phase 6, diprioritaskan pada journey miniRider | Owner |
| OD-125 | Scope notifikasi in-app workspace/event (baseline Phase 10): jenis kejadian yang men-trigger notifikasi untuk kru/event manager | (a) minimal inti: event assignment berubah, rundown berubah, laporan baru; (b) lengkap + preferensi granular sejak awal | Koordinasi P-03/P-04; keterkaitan REQ-008 & REQ-061 (terpisah dari broadcast developer OD-101/OD-102) | (a) untuk baseline Phase 10; perluas bertahap | Owner |
| OD-126 | Definisi minimum readiness gate sebelum dispatch aset (checklist wajib vs opsional per kelas aset) | (a) gate konfigurable per organisasi, tanpa default wajib; (b) default wajib minimum platform-wide + konfigurasi tambahan | REQ-045/REQ-066 di Phase 13/15; keterkaitan kebijakan konflik reservasi OD-107 | (a) konfigurable; default minimal ditetapkan owner + ops saat Phase 13 | Owner + ops |

Dampak penomoran: OD-120..OD-129 dicadangkan untuk WS-A. Tidak ada nomor lain yang dipakai dari range ini.

---

## 4. Konflik / ketidakjelasan yang ditemukan (dilaporkan, tidak diselesaikan diam-diam — MC §14)

1. **Status ROADMAP Phase 1:** `ROADMAP.md` masih mencantumkan Phase 1 "NOT STARTED", sementara artefak Phase 1 (termasuk `REQUIREMENTS.md` REQ-001..100 yang sudah direvisi, `LICENSE_MATRIX.md`, dan dokumen ini) sedang dihasilkan. Pembaruan status roadmap bukan ranah WS-A (artefak #13–#15) — ditunggu agen pelapor Phase 1.
2. **OD-109 merujuk "REQ-062/071-detail Phase 16"** — REQ-071 adalah standard register (IMS, Phase 17), kemungkinan maksudnya REQ-063/REQ-064 (recruitment/application). Perlu koreksi kecil oleh pemilik `OPEN_DECISIONS.md`; WS-A tidak mengubah file tersebut.
3. **`DATA_MODEL_CONCEPT.md` tidak ada** di repository (sudah tercatat sebagai OD-116) — WS-A tidak menemukan file tersebut; konfirmasi OD-116 tetap berlaku.
4. **MC §2 menyebut batas "maksimal 5 kru per workspace" pada miniRider**, sedangkan `LICENSE_MATRIX.md` §1 menuliskan baris multi-workspace "sesuai lisensi" untuk tier lain tanpa angka — tidak kontradiksi, tapi angka kuota tier non-mini memang belum ada (konsisten OD-05/OD-06/OD-123). Tidak ada tindakan selain pencatatan.
5. **Format laporan event / rundown** belum dispesifikasikan di MC/REQ (REQ-008 menyebut "update informasi/laporan") — dicatat sebagai asumsi A-08 (`PRODUCT_SCOPE.md` §7) dan kandidat OD-125 terkait notifikasi; detail format dianjurkan masuk `UX_REQUIREMENTS.md`.

---

## 5. Penutup

- Dokumen ini murni hasil desk analysis Phase 1; tidak ada kode/schema/config yang diubah; hanya 2 file dibuat oleh WS-A (`PRODUCT_SCOPE.md`, `PERSONAS_AND_JOURNEYS.md`) + append worklog.
- Semua persona/journey menunggu validasi partisipan nyata (kandidat OD-124) sebelum klaim usability apa pun (REQ-091, MC §7).
