# LICENSE MATRIX — epicRider

**Status dokumen:** TARGET STATE hasil revisi Phase 1 (workstream WS-D, 2026-10-27), dibangun di atas versi Phase 0. Tidak ada baris yang merupakan bukti implementasi — seluruh sel masih `PROPOSED` sampai fitur teruji per Master Control §15. Harga, billing, pajak, refund, payment gateway, durasi grace, dan kuota di luar MC **sengaja TIDAK dicantumkan** (MC §3 melarang mengarang nilai) — kolom terkait ditandai `TBD OWNER (OD-xx)`.
**Sumber:** `MASTER_CONTROL.md` §2/§3/§6, `REQUIREMENTS.md` (REQ-001..100), `OPEN_DECISIONS.md`, `ROADMAP.md`.

---

## 0. Perubahan dari versi Phase 0 (riwayat eksplisit — tidak ada penghapusan diam-diam)

| # | Perubahan | Dasar |
|---|---|---|
| 1 | Semua baris capability versi Phase 0 **dipertahankan**; nilai sel tidak diubah kecuali diberi catatan kaki penjelasan (lihat catatan hiRider di §2). | Konsistensi riwayat; MC §14 |
| 2 | Ditambah baris capability baru dari REQ-047..100: auth multi-metode (WhatsApp/Google, recovery, session), membership/event assignment, scanner UX, maintenance schedule, KPI aset, IMS modules terperinci, notifikasi developer, hiRider lifecycle, import/export, offline, i18n. | REQ-047..100 |
| 3 | Ditambah kolom **REQ-xxx** dan **Phase** pada setiap baris matrix. | Traceability ke REQUIREMENTS.md/ROADMAP.md |
| 4 | Ditambah §1 aturan pewarisan tier (eksplisit: max = core mini **MINUS** Equipment Store; ISO = max + IMS). | MC §2, REQ-010/011/012 |
| 5 | Ditambah §5 siklus lisensi sebagai state machine (REQ-098) dengan semua durasi `TBD OWNER (OD-108)`. | REQ-098 |
| 6 | Ditambah §6 perilaku data saat tier turun — opsi restrict/archive/delete, `OWNER APPROVAL REQUIRED (OD-108)`, rekomendasi berlabel PROPOSED. | REQ-099, OD-108 |
| 7 | Ditambah §7 pemisahan tiga hal yang berbeda: public License & Extension shop vs in-app Developer Equipment Store vs Developer Portal. | MC §6, REQ-010/030/031/058 |
| 8 | Ditambah §9 tabel open decisions lisensi (OD-05, OD-06, OD-101, OD-102, OD-108). | OPEN_DECISIONS.md |
| 9 | Kolom harga/duration extension diubah formatnya menjadi `TBD OWNER (OD-06)` (sebelumnya `UNKNOWN / NEEDS DECISION`) — makna sama, label diseragamkan. | Konsistensi label OD |

## 1. Definisi tier & aturan pewarisan (eksplisit)

| Aturan | Pernyataan | Sumber |
|---|---|---|
| W-1 | **miniRider** = fondasi core: workspace berbasis event, 5 halaman utama, technical rider, media kit, aset dasar + template, konteks event kru, halaman event (Chat/Rundown/Media Kit/laporan), **dan satu-satunya tier dengan Developer Equipment Store in-app**. Batas awal maks. 5 kru/workspace. | MC §2; REQ-003..010 |
| W-2 | **maxRider = core miniRider MINUS Developer Equipment Store in-app** (visibilitas UI dan akses API sama-sama diblokir untuk tier non-mini) **PLUS** CRM/pelanggan, keuangan/komersial, operasi rental & siklus hidup aset penuh, maintenance, pemeriksaan, readiness, role/permission dinamis, workflow, dashboard, risk/HSE, kontrol operasi. | MC §2, §6; REQ-010, REQ-011 |
| W-3 | **ISOrider = maxRider PLUS IMS digital terintegrasi** (mutu, sustainability, K3/HSE, lingkungan, keamanan informasi, business continuity, risiko, audit, controlled documented information, bukti, kompetensi, vendor/kontraktor, keluhan, ketidaksesuaian, corrective action, management review, continual improvement). | MC §2; REQ-012 |
| W-4 | **hiRider** = lapisan marketplace layanan kru yang berdiri **di atas** workspace berlisensi (profil, skill, portofolio, rekrutmen, lamaran). Kru dapat mengelola beberapa workspace mandiri **sesuai lisensi** — artinya kemampuan di dalam sebuah workspace ditentukan tier lisensi workspace tersebut (mini/max/ISO), bukan oleh hiRider. Status lamaran **tidak** otomatis memberi akses workspace/event. | MC §2; REQ-013, REQ-014 |
| W-5 | Pengembangan tier lebih tinggi **memperkaya domain yang sama** — dilarang membuat database paralel mini/max/ISO. | MC §5 |
| W-6 | Perbedaan lisensi ditegakkan melalui **entitlement server-side**; menyembunyikan menu di UI bukan kontrol keamanan. | MC §5; REQ-024 |
| W-7 | Upgrade tier **tanpa** pindah aplikasi/migrasi data manual — satu fondasi data kontinu. | MC §1; REQ-002 |
| W-8 | Downgrade mengikuti §6 (REQ-099) — tidak ada penghapusan data diam-diam. | REQ-099, OD-108 |

## 2. Capability matrix 4 tier

Legenda: ✅ = tersedia; ❌ = tidak tersedia (untuk Equipment Store: **diblokir juga di API**); `—` = tidak relevan untuk lapisan tsb.; **kolom Phase merujuk ROADMAP.md** (semua masih NOT STARTED).
**Catatan kolom hiRider (dipertahankan dari Phase 0):** hiRider bukan tier lisensi workspace (W-4). Nilai "— (via workspace)" berarti kemampuan dipakai kru di dalam workspace sesuai lisensi workspace tsb., bukan bagian dari lapisan marketplace hiRider.

### 2.1 Fondasi workspace (core miniRider)

| Capability | mini | max | ISO | hiRider | REQ | Phase |
|---|---|---|---|---|---|---|
| Workspace berbasis event + Home/Event/Asset/Team/Profile | ✅ | ✅ (core) | ✅ (core) | ✅ (via workspace) | REQ-003 | 6 |
| Konteks event aktif kru + safe switch multi-penugasan | ✅ | ✅ | ✅ | ✅ (via workspace) | REQ-007 | 6,10 |
| Technical rider (boleh draft) wajib terhubung event | ✅ | ✅ | ✅ | — (via workspace) | REQ-004 | 7 |
| Media kit dari template terkait event | ✅ | ✅ | ✅ | — | REQ-005 | 9 |
| Aset dasar + asset/set template | ✅ | ✅ (diperkaya) | ✅ | — | REQ-006 | 8 |
| Halaman event: Chat, Rundown, Media Kit, update laporan tim | ✅ | ✅ | ✅ | — | REQ-008 | 10 |
| Batas maks. 5 kru per workspace (baseline; owner dihitung?) | ✅ ditegakkan | — | — | — | REQ-009 | 5 |
| Membership lifecycle: invite→accept→suspend→remove→leave | ✅ | ✅ | ✅ | ✅ (via workspace) | REQ-049 | 4 |
| Event assignment terpisah dari workspace membership | ✅ | ✅ | ✅ | ✅ (via workspace) | REQ-050 | 4,6 |
| Undangan aman (token signed, sekali pakai, expiry, terikat role) | ✅ | ✅ | ✅ | ✅ (via workspace) | REQ-051 | 4 |

### 2.2 Autentikasi & sesi (semua tier — platform)

| Capability | mini | max | ISO | hiRider | REQ | Phase |
|---|---|---|---|---|---|---|
| Login WhatsApp: bukti kontrol nomor; token sekali pakai, expiry, anti-replay, rate limit, anti-abuse, audit, recovery | ✅ | ✅ | ✅ | ✅ | REQ-021 | 4 |
| Login Google Sign-In (OAuth 2.0/OIDC: state/nonce/issuer/audience/signature/expiry/redirect, account-linking aman) | ✅ | ✅ | ✅ | ✅ | REQ-022 | 4 |
| Account recovery & fallback lintas metode | ✅ | ✅ | ✅ | ✅ | REQ-047 | 4 |
| Session lifecycle + daftar device aktif + revoke per/all device | ✅ | ✅ | ✅ | ✅ | REQ-048 | 4 |
| Anti-abuse auth: rate limiting, lockout, monitoring anomali, audit event | ✅ | ✅ | ✅ | ✅ | REQ-054 | 4 |

### 2.3 Developer Equipment Store in-app (khusus miniRider)

| Capability | mini | max | ISO | hiRider | REQ | Phase |
|---|---|---|---|---|---|---|
| Developer Equipment Store in-app (visibilitas di aplikasi) | ✅ **hanya ini** | ❌ | ❌ | ❌ | REQ-010 | 11 |
| Blokir akses API store untuk tier non-mini (denial teraudit, bukan sekadar UI hidden) | ✅ | ❌ diblokir API | ❌ diblokir API | ❌ diblokir API | REQ-010 | 11 |
| Listing katalog: CRUD + status draft/published/archived; publikasi terkendali | ✅ | ❌ | ❌ | ❌ | REQ-055 | 11 |
| Kelola stok/harga/diskon dengan audit trail penuh (nilai komersial `TBD OWNER (OD-06)`) | ✅ | ❌ | ❌ | ❌ | REQ-056 | 11 |
| Media listing (foto/video/dokumen; limit tipe/ukuran sesuai kebijakan) | ✅ | ❌ | ❌ | ❌ | REQ-057 | 11 |

### 2.4 Store publik, Developer Portal & notifikasi (platform — bukan fitur tier workspace)

| Capability | mini | max | ISO | hiRider | REQ | Phase |
|---|---|---|---|---|---|---|
| Public License & Extension Shop (beli lisensi/extension; semua tier + prospektif) | ✅ | ✅ | ✅ | ✅ | REQ-030 | 22 |
| Developer Portal (konsol pengelolaan; auth khusus; role terpisah; TIDAK memberi hak ubah lisensi/billing/broadcast) | akses via role | akses via role | akses via role | akses via role | REQ-058, REQ-031, REQ-052 | 22 |
| Notifikasi developer terarah: pratinjau penerima wajib, dedup/idempotency, status pengiriman, audit, anti-abuse | penerima | penerima | penerima | penerima | REQ-017, REQ-059, REQ-060 | 22 |
| Preferensi notifikasi user & opt-out jenis opsional (jenis wajib = OD-102) | ✅ | ✅ | ✅ | ✅ | REQ-061 | 22 |
| Landing page publik: promosi, lisensi, extensions, akses tester, link download, login | ✅ | ✅ | ✅ | ✅ | REQ-015 | 22 |
| Akses tester/demo berlabel dari landing (scope = keputusan owner) | ✅ | ✅ | ✅ | ✅ | REQ-100 | 22 |

### 2.5 maxRider (warisi core mini minus Equipment Store — W-2)

| Capability | mini | max | ISO | hiRider | REQ | Phase |
|---|---|---|---|---|---|---|
| CRM/pelanggan | ❌ | ✅ | ✅ | — | REQ-011, REQ-046 | 12 |
| Keuangan/komersial (quotations/orders/contracts, finance workflow, payment/invoice states per integrasi) | ❌ | ✅ | ✅ | — | REQ-011, REQ-046 | 14 |
| Rental lifecycle penuh + asset register + KPI utilization/downtime/cost | ❌ | ✅ | ✅ | — | REQ-045, REQ-069 | 13 |
| QR/barcode unik + cetak label + scan via web & mobile | ❌ | ✅ | ✅ | — | REQ-036 | 13 |
| Scanner UX: izin kamera + fallback manual + feedback state | ❌ | ✅ | ✅ | — | REQ-067, REQ-090 | 13 |
| Reservation conflict prevention (kebijakan = OD-107) | ❌ | ✅ | ✅ | — | REQ-065 | 13 |
| Check-in/check-out dengan capture kondisi sebagai evidence | ❌ | ✅ | ✅ | — | REQ-066 | 13 |
| Maintenance & calibration schedule dengan tracking due/overdue | ❌ | ✅ | ✅ | — | REQ-068 | 13 |
| Role/permission dinamis (matrix aktor×objek×aksi×konteks×lisensi×status) | ❌ | ✅ | ✅ | — | REQ-011, REQ-026 | 15 |
| Workflow, dashboard, risk/HSE, readiness gates, incident reporting | ❌ | ✅ | ✅ | — | REQ-011, REQ-046 | 15 |
| Operasi lanjutan: competency, HSE briefing/permit/checklist, complaints, NCR/CAPA operasional, project/event dossier | ❌ | ✅ | ✅ | — | REQ-046 | 12–15 |

### 2.6 ISOrider — IMS (warisi max — W-3)

| Capability | mini | max | ISO | hiRider | REQ | Phase |
|---|---|---|---|---|---|---|
| IMS digital end-to-end (core flow Process→Control→Workflow→Transaction→Evidence→Report) | ❌ | ❌ | ✅ | — | REQ-012 | 17–21 |
| Process architecture: process/control/workflow sebagai objek terhubung | ❌ | ❌ | ✅ | — | REQ-070 | 17 |
| Controlled Document Library (hirarki configurable, metadata lengkap, versioning & approval, retention & disposition, viewing/download terkontrol + access log) | ❌ | ❌ | ✅ | — | REQ-042, REQ-078..082 | 17–18 |
| Evidence workflow: form→upload→review→sign-off→locked record; koreksi hanya amendment | ❌ | ❌ | ✅ | — | REQ-043, REQ-083 | 18 |
| Auditor access: read-only, scoped, time-bound, expiry otomatis + auditor view/export terkendali | ❌ | ❌ | ✅ | — | REQ-044, REQ-053, REQ-084 | 18 |
| Sustainability workflow + KPI/data dictionary + flag measured/estimated | ❌ | ❌ | ✅ | — | REQ-041, REQ-085..087 | 19 |
| Supplier/contractor qualification terdokumentasi | ❌ | ❌ | ✅ | — | REQ-073 | 19 |
| Kompetensi/training record terhubung role & penugasan | ❌ | ❌ | ✅ | — | REQ-074 | 19 |
| Rantai IMS penuh: incident→NCR→CAPA→effectiveness check→closure | ❌ | ❌ | ✅ | — | REQ-075 | 20 |
| Management review (input/keputusan/action items ter-track) | ❌ | ❌ | ✅ | — | REQ-076 | 20 |
| Continual improvement (siklus aksi perbaikan ter-track) | ❌ | ❌ | ✅ | — | REQ-077 | 20 |
| Standard register + clause/reference mapping via metadata (nol teks verbatim; hanya standar dengan VERIFIED date — lihat STANDARD_REGISTER.md) | ❌ | ❌ | ✅ | — | REQ-039, REQ-040, REQ-071, REQ-072 | 17 |

### 2.7 hiRider — marketplace (lapisan di atas workspace berlisensi — W-4)

| Capability | mini | max | ISO | hiRider | REQ | Phase |
|---|---|---|---|---|---|---|
| Profil kru: skill, portofolio, pengalaman, kontrol visibilitas | — | — | — | ✅ | REQ-062 | 16 |
| Recruitment posting: owner buka/tutup; hanya rekrutmen terbuka + kriteria akses bisa dilamar | — | — | — | ✅ | REQ-063 | 16 |
| Application lifecycle: apply→shortlist→accept/reject→withdraw + notifikasi status | — | — | — | ✅ | REQ-064 | 16 |
| Lamaran ≠ akses: status lamaran tidak mengubah permission workspace/event (dites server-side) | berlaku | berlaku | berlaku | ✅ ditegakkan | REQ-013 | 16 |
| Kru kelola beberapa workspace mandiri sesuai lisensi masing-masing workspace | n/a | n/a | n/a | ✅ | REQ-014 | 16 |

### 2.8 Lintas tier — extensions, akses & platform

| Capability | mini | max | ISO | hiRider | REQ | Phase |
|---|---|---|---|---|---|---|
| Extension: paket tambahan +10 seat kru per workspace (harga/duration `TBD OWNER (OD-06)`) | ✅ dapat dibeli | ✅ | ✅ | ✅ | REQ-018 | 5,23 |
| Extension: workspace tambahan (`TBD OWNER (OD-06)`) | ✅ dapat dibeli | ✅ | ✅ | ✅ | REQ-018 | 5,23 |
| Extension: aplikasi mobile/tablet (strategi teknis menunggu OD-02; `TBD OWNER (OD-06)`) | ✅ dapat dibeli | ✅ | ✅ | ✅ | REQ-018 | 23 |
| Extension: landing page workspace (`TBD OWNER (OD-06)`) | ✅ dapat dibeli | ✅ | ✅ | ✅ | REQ-018 | 23 |
| Web berfungsi penuh desktop/tablet/mobile browser (3 breakpoint) | ✅ | ✅ | ✅ | ✅ | REQ-019 | 6+ |
| API/backend tunggal untuk web + Android/iOS tanpa duplikasi logika bisnis | ✅ | ✅ | ✅ | ✅ | REQ-020, REQ-097 | 2,6 |
| Multi-tenant/multi-workspace dengan isolasi terbukti | ✅ | ✅ | ✅ | ✅ | REQ-023 | 2,4 |
| i18n sejak awal — Bahasa Indonesia default, siap EN & lainnya | ✅ | ✅ | ✅ | ✅ | REQ-028 | 3+ |
| Import/export data (scope & format = OD-111; usulan rilis awal export-only) | sesuai OD-111 | sesuai OD-111 | sesuai OD-111 | sesuai OD-111 | REQ-096 | 24 |
| Offline-first workflow lapangan — **hanya bila disetujui** (OD-07); bila ya: antrean aman, sync indicator, rekonsiliasi konflik, idempotency, permission ditegakkan saat sync | evaluasi | evaluasi | evaluasi | evaluasi | REQ-037, REQ-038 | 13,24 |
| Siklus lisensi (purchase→active→renewal→expiry→grace→downgrade) — §5 | ✅ | ✅ | ✅ | ✅ | REQ-098 | 5 |
| Perilaku data saat tier turun — §6 | ✅ | ✅ | ✅ | ✅ | REQ-099 | 5 |

## 3. Batas kuantitatif & extensions

| Item | Nilai | Status keputusan |
|---|---|---|
| Maks kru per workspace (baseline miniRider) | **5** | Angka dari MC §2. **Definisi kuota terbuka:** apakah owner dihitung dalam 5 — **OD-05, OPEN**; wajib diputuskan sebelum billing/seat enforcement dikunci (REQ-009). |
| Paket seat tambahan | +10 kru per workspace | Extension potensial MC §3. Harga/duration/billing: `TBD OWNER (OD-06)`. |
| Workspace tambahan | Extension potensial MC §3 | Harga/duration: `TBD OWNER (OD-06)`. Batas jumlah maksimum per lisensi: belum didefinisikan — `UNKNOWN / NEEDS DECISION`. |
| Aplikasi mobile/tablet | Extension potensial MC §3 | Strategi teknis menunggu OD-02; komersial `TBD OWNER (OD-06)`. |
| Landing page workspace | Extension potensial MC §3 | Harga/duration: `TBD OWNER (OD-06)`. |
| Extension lain | "dan extension lain yang disetujui" (MC §3) | Hanya dengan persetujuan owner; tidak ada daftar implisit. |
| Durasi grace period | **`TBD OWNER (OD-108)`** | Jangan mengarang angka hari. |
| Masa renew window (sebelum expiry) | **`TBD OWNER (OD-108)`** | Jangan mengarang angka hari. |
| Harga lisensi / pajak / refund / payment gateway | **`TBD OWNER (OD-06)`** | MC §3: jangan mengarang nilai. |

## 4. Siklus lisensi — state machine (REQ-098)

**Status:** desain TARGET; semua parameter durasi `TBD OWNER (OD-108)`; semua aspek pembayaran `TBD OWNER (OD-06)`. Semua transisi wajib server-side, teraudit, dan dites (acceptance REQ-098).

```
                 purchase (billing valid)
  [PURCHASE_PENDING] ───────────────────────► [ACTIVE]
                                                    │  t-<renew window*>
                                                    ▼
  [ACTIVE] ◄──────── renewal sukses ──────── [RENEWAL_WINDOW]
                                                    │ lewat tanggal expiry
                                                    ▼
                                                [EXPIRED]
                                                    │ masuk grace (durasi*)
                                                    ▼
   [ACTIVE] ◄── renewal/perpanjangan ──┐        [GRACE]
                                            │      │ grace berakhir tanpa renewal
                                            │      ▼
                                            └── [DOWNGRADED] ── upgrade lagi ──► [ACTIVE]
   [PURCHASE_PENDING] ── gagal/batal ──► [CANCELLED]   (semua state ── kebijakan OD-06 ──► [CANCELLED])
```

| Transisi | Trigger | Efek akses | Parameter | Status keputusan |
|---|---|---|---|---|
| PURCHASE_PENDING → ACTIVE | Pembayaran/billing valid (mekanisme = OD-06) | Fitur tier penuh | — | OD-06 |
| ACTIVE → RENEWAL_WINDOW | Mendekati tanggal expiry | Tetap penuh; reminder mulai | Panjang window = `TBD OWNER (OD-108)` | OD-108 |
| RENEWAL_WINDOW → ACTIVE | Renewal sukses | Tetap penuh; expiry date baru | — | OD-06 |
| RENEWAL_WINDOW → EXPIRED | Lewat tanggal expiry tanpa renewal | Akses menyesuaikan status EXPIRED | — | OD-108 |
| EXPIRED → GRACE | Masuk periode grace | **Akses terbatas sesuai keputusan** (opsi: baca-saja / fitur core saja / tetap penuh) | Durasi grace = `TBD OWNER (OD-108)`; scope akses grace = bagian dari OD-108 | OD-108 |
| GRACE → ACTIVE | Renewal/perpanjangan sukses | Fitur tier penuh; data utuh | — | OD-06 |
| GRACE → DOWNGRADED | Grace berakhir tanpa renewal | Tier turun; perilaku data = §5 | Target tier downgrade (turun satu tingkat / ke miniRider / lainnya) = `TBD OWNER (OD-108)` | OD-108 |
| EXPIRED/GRACE/DOWNGRADED → ACTIVE | Pembelian/renewal baru | Fitur tier baru; data sebelumnya tetap dapat diakses (W-7, REQ-002) | — | OD-06 |
| Semua state → CANCELLED | Pembatalan/refund sesuai kebijakan | Akses diakhiri; data mengikuti kebijakan retensi & hukum (OD-09) | Kebijakan refund = `TBD OWNER (OD-06)` | OD-06 |

Aturan lintas state: (a) entitlement diperiksa server-side di setiap request (REQ-024); (b) setiap transisi menghasilkan audit event (aktor, waktu, state lama→baru); (c) transisi tidak boleh dieksekusi dari client.

## 5. Perilaku data saat tier turun (REQ-099)

**Status: `OWNER APPROVAL REQUIRED` (OD-108).** Acceptance REQ-099: downgrade tidak menghapus data tanpa keputusan; fitur di luar tier terkunci server-side; data tetap utuh untuk upgrade kembali.

| Opsi | Deskripsi | Konsekuensi | Status |
|---|---|---|---|
| **Restrict** | Fitur di luar tier dikunci server-side; data modul tsb. tetap tersimpan; UI menandai konten "terkunci karena tier" (bukan dihapus) | Aman untuk data; perlu pola UI yang jelas (state permission denied — REQ-034) | PROPOSED sebagai **default** |
| **Archive** | Data modul non-tier diarsipkan (non-aktif, tidak dihitung dalam kuota/daftar aktif); dapat diaktifkan kembali saat upgrade | Bersih bagi pengguna; perlu mekanisme archive/restore teraudit | PROPOSED **atas permintaan** |
| **Delete** | Penghapusan data modul non-tier | Risiko kehilangan data; harus ada persetujuan eksplisit pengguna+owner, jeda penghapusan, audit; tidak pernah dilakukan diam-diam (REQ-099) | **DILARANG sebagai perilaku default**; hanya dengan approval eksplisit |

**Rekomendasi (label PROPOSED — bukan keputusan; konsisten dengan rekomendasi OD-108):** kombinasi restrict (default) + archive (atas permintaan) + delete hanya dengan approval eksplisit. Keputusan final + durasi grace + target tier downgrade: **OD-108 (Owner)**.

## 6. Pemisahan store: 3 hal yang BERBEDA

| Aspek | (A) Public License & Extension Shop | (B) Developer Equipment Store in-app | (C) Developer Portal |
|---|---|---|---|
| Apa | Toko publik untuk **membeli lisensi & extension** | Katalog equipment yang dikelola developer, tampil **di dalam aplikasi** | **Konsol manajemen** untuk mengelola katalog/listing toko, stok, harga, diskon, media, status publikasi, fungsi toko lain yang disetujui |
| Siapa | Semua tier (mini/max/ISO/hiRider) + calon pengguna dari landing page | Hanya **miniRider**; **diblokir juga di API** untuk max/ISO/hiRider (REQ-010) | Developer dengan **role khusus**; bukan fitur tier workspace |
| Kanal | Website publik / landing | Dalam aplikasi (halaman khusus miniRider) | Konsol terpisah dengan auth khusus |
| Kontrol akses | Terbuka untuk browsing; pembelian melalui billing (OD-06) | Entitlement tier diperiksa server-side per request (REQ-024) | Role terpisah & least privilege; portal **tidak** otomatis memberi hak ubah lisensi/billing/notifikasi global (REQ-031, REQ-052; model role = OD-101) |
| Audit | Transaksi pembelian teraudit | Semua perubahan harga/stok/diskon/publikasi teraudit (REQ-056) | Semua perubahan teraudit dengan aktor+timestamp (REQ-016, REQ-058) |
| REQ | REQ-030, REQ-015, REQ-018 | REQ-010, REQ-055, REQ-056, REQ-057 | REQ-016, REQ-031, REQ-052, REQ-058 |
| Phase | 22 | 11 | 22 |

**Tes pembeda wajib (acceptance REQ-030/REQ-031):** akses silang ditolak — akun max/ISO/hiRider memanggil API Equipment Store menghasilkan denial teraudit; role developer portal mencoba mengubah billing/notifikasi global ditolak; dua store terisolasi penuh (data, akses, API).

## 7. Kontrol entitlement (TARGET — server-side)

1. Entitlement diperiksa di server untuk setiap akses fitur/objek; UI-hiding bukan kontrol (MC §5; REQ-024).
2. Developer Equipment Store diblokir di API untuk semua tier non-mini (MC §6; REQ-010).
3. Developer Portal ≠ hak ubah lisensi/billing/broadcast; role terpisah, least privilege; semua perubahan harga/stok/diskon/publikasi/notifikasi teraudit (MC §6; REQ-031, REQ-052; OD-101).
4. Notifikasi developer: verifikasi hak, pratinjau penerima, pembatasan pengiriman, audit log, dedup/idempotency, status pengiriman, anti-abuse (MC §2; REQ-017, REQ-059, REQ-060; otoritas approval & jenis wajib = OD-102).
5. Permission memeriksa aktor, tenant/workspace, objek, aksi, konteks event, lisensi, dan status objek (REQ-026).
6. Status lisensi (§4) adalah salah satu input permission — akses berubah efektif pada request berikutnya setelah transisi status.

## 8. Kaitan ke standar & ISO

ISOrider mendukung IMS pelanggan tetapi **bukan jaminan sertifikasi** (MC §9). Metadata standar ISOrider dikelola di `STANDARD_REGISTER.md`; standar tanpa VERIFIED date tidak boleh dipakai untuk clause-mapping (REQ-071). Tidak ada baris lisensi di dokumen ini yang bergantung status sertifikasi apa pun.

## 9. Open decisions lisensi

| ID | Keputusan | Dampak ke matrix ini | Status |
|---|---|---|---|
| OD-05 | Definisi kuota 5 kru: owner dihitung atau tidak | Baris "Batas maks. 5 kru" (§2.1) & enforcement REQ-009 | **OPEN** |
| OD-06 | Harga, billing, pajak, refund, payment gateway | Semua kolom `TBD OWNER (OD-06)` (§3); transisi state machine §4 | **OPEN — OWNER APPROVAL REQUIRED** |
| OD-101 | Model role Equipment Store & Developer Portal (satu role + sub-permission vs role terpisah store-manager & portal-admin) | Baris Developer Portal (§2.4, §6); desain role Phase 4/11/22 | **OPEN — OWNER APPROVAL REQUIRED** (rekomendasi OD-101: role terpisah — bukan keputusan) |
| OD-102 | Jenis notifikasi wajib vs opsional, kebijakan opt-out, otoritas approval broadcast | Baris notifikasi (§2.4); REQ-061 | **OPEN — OWNER APPROVAL REQUIRED** |
| OD-108 | Aturan expiry/grace & perilaku data saat downgrade (durasi grace, scope akses grace, target tier downgrade, restrict vs archive vs delete) | §4 state machine & §5 perilaku data | **OPEN — OWNER APPROVAL REQUIRED** |

Kandidat keputusan baru hasil WS-D (OD-160..OD-166) terkait NFR/standar/verifikasi — lihat `NON_FUNCTIONAL_REQUIREMENTS.md` §OD-16x. Keputusan lain yang tersedia di `OPEN_DECISIONS.md` tidak diduplikasi di sini.

## 10. Status verifikasi implementasi

| Area | Status |
|---|---|
| Implementasi entitlement/entitlement enforcement | `NOT FOUND` (tidak ada kode domain di repository — audit Phase 0) |
| Test isolasi tier / blokir Equipment Store di API | `NOT FOUND` |
| Implementasi state machine lisensi | `NOT FOUND` |
| Keputusan kuota seat (owner dihitung?) | `UNKNOWN / NEEDS DECISION` (OD-05) |
| Keputusan harga/billing/payment/refund | `UNKNOWN / NEEDS DECISION` (OD-06) |
| Keputusan grace/downgrade/data behavior | `UNKNOWN / NEEDS DECISION` (OD-108) |
| Keputusan model role store/portal | `UNKNOWN / NEEDS DECISION` (OD-101) |

---

*Riwayat: versi Phase 0 (2026-05-22) = matrix capability dasar tanpa harga. Revisi Phase 1 (WS-D, 2026-10-27) menambah baris REQ-047..100, kolom REQ/Phase, aturan pewarisan, state machine, perilaku data, pemisahan store, dan tabel open decisions — lihat §0. Tidak ada angka komersial yang dikarang.*
