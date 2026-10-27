# REQUIREMENTS — epicRider

**Status dokumen:** Seed register Phase 0. Semua ID di bawah diturunkan langsung dari pernyataan `MASTER_CONTROL.md` (asal = MC §). Enumerasi requirement final, personas, use case, dan acceptance criteria detail adalah tugas **Phase 1** — register ini adalah fondasi, bukan hasil discovery.

**Status requirement:** `PROPOSED` (diturunkan dari Master Control, belum di-refine Phase 1). Tidak ada requirement berstatus `IMPLEMENTED` — audit Phase 0 membuktikan tidak ada implementasi domain.

| ID | Domain | Requirement (ringkas) | Asal | Prioritas | Acceptance criteria (arah) | Status |
|---|---|---|---|---|---|---|
| REQ-001 | Platform | Satu platform web + app pendamping untuk operasi multimedia/event/production/broadcast/rental | MC §1 | Must | Platform berjalan di desktop/tablet/mobile browser; satu domain model | PROPOSED |
| REQ-002 | Platform | Pertumbuhan lisensi tanpa migrasi/pindah aplikasi (satu fondasi data) | MC §1 | Must | Upgrade tier tidak memerlukan rebuild data | PROPOSED |
| REQ-003 | miniRider | Workspace berbasis event dengan halaman Home, Event, Asset, Team, Profile | MC §2 | Must | Navigasi 5 halaman berfungsi end-to-end | PROPOSED |
| REQ-004 | miniRider | Technical rider (draft) terhubung ke event pengguna | MC §2 | Must | Relasi rider→event ditegakkan server-side | PROPOSED |
| REQ-005 | miniRider | Media kit dari template, terkait event | MC §2 | Must | Relasi media-kit→event ditegakkan server-side | PROPOSED |
| REQ-006 | miniRider | Pengelolaan aset dasar + asset/set template | MC §2 | Must | CRUD aset + template berfungsi | PROPOSED |
| REQ-007 | miniRider | Konteks event aktif kru ditampilkan jelas; berpindah konteks aman | MC §2 | Must | Kru dengan multi-assignment bisa lihat & pindah konteks tanpa kehilangan isolasi | PROPOSED |
| REQ-008 | miniRider | Halaman event: Chat, Rundown, Media Kit, update info/laporan tim | MC §2 | Must | 4 fungsi beroperasi dalam konteks event | PROPOSED |
| REQ-009 | miniRider | Batas maksimal 5 kru per workspace (kuota; definisi owner=seat terbuka) | MC §2 | Must | Seat enforcement server-side; definisi owner sesuai keputusan OD-05 | PROPOSED |
| REQ-010 | miniRider | Developer Equipment Store hanya di miniRider, diblokir di API untuk tier lain | MC §2, §6 | Must | Entitlement API memblokir akses tier lain (bukan hanya UI) | PROPOSED |
| REQ-011 | maxRider | Mewarisi core miniRider; tambah CRM, finance, rental lifecycle penuh, maintenance, pemeriksaan, readiness, role/permission dinamis, workflow, dashboard, risk/HSE | MC §2 | Must | Fitur maxRider beroperasi di atas domain yang sama | PROPOSED |
| REQ-012 | ISOrider | Mewarisi maxRider; IMS digital end-to-end | MC §2 | Must | Alur Process→Control→Workflow→Transaction→Evidence→Report terhubung | PROPOSED |
| REQ-013 | hiRider | Marketplace kru: profil, skill, portofolio, rekrutmen; lamaran ≠ akses workspace | MC §2 | Should | Status lamaran tidak memberi akses otomatis (diverifikasi server) | PROPOSED |
| REQ-014 | hiRider | Kru kelola beberapa workspace mandiri sesuai lisensi; owner dapat menutup rekrutmen | MC §2 | Should | Multi-workspace + kontrol tutup rekrutmen berfungsi | PROPOSED |
| REQ-015 | Public | Landing page: produk, lisensi, extensions, tester, download link, login | MC §2 | Should | Konten landing terhubung sumber data nyata | PROPOSED |
| REQ-016 | Public | Developer Portal: kelola katalog/listing, stok, harga, diskon, media, publikasi | MC §2 | Should | Hak akses terverifikasi; semua perubahan teraudit | PROPOSED |
| REQ-017 | Public | Notifikasi terarah (global/terpilih/user): hak akses, pratinjau penerima, rate limit, audit log, dedup/idempotency, status pengiriman, anti-abuse | MC §2 | Should | Governance notifikasi lengkap sebelum produksi | PROPOSED |
| REQ-018 | Extensions | Katalog extension (workspace tambahan, +10 seat, mobile app, landing workspace) | MC §3 | Could | Detail harga/billing TIDAK dikarang; menunggu keputusan bisnis | PROPOSED |
| REQ-019 | Access | Web berfungsi penuh di desktop, tablet, browser mobile | MC §3 | Must | Test responsive terdokumentasi per layar kunci | PROPOSED |
| REQ-020 | Access | Backend/API reusable oleh Android/iOS tanpa duplikasi logika | MC §3 | Must | Kontrak API dipakai klien pertama & kedua tanpa copy logic | PROPOSED |
| REQ-021 | Auth | WhatsApp login request dengan bukti kontrol nomor: token sekali pakai, expiry, anti-replay, rate limit, anti-abuse, audit, recovery | MC §4 | Must | Alur terverifikasi end-to-end + vendor review (OD-03) | PROPOSED |
| REQ-022 | Auth | Google Sign-In via OAuth 2.0/OIDC: state/nonce, issuer, audience, signature, expiry, redirect URI, account-linking aman | MC §4 | Must | Validasi penuh + test account-linking | PROPOSED |
| REQ-023 | Architecture | Multi-tenant/multi-workspace dengan isolasi terbukti | MC §5 | Must | Test isolasi lintas tenant lulus | PROPOSED |
| REQ-024 | Architecture | Entitlement server-side untuk semua beda lisensi | MC §5 | Must | Bypass UI tidak memberi kemampuan tier lain | PROPOSED |
| REQ-025 | Architecture | Identitas user global terpisah dari membership/role/assignment | MC §5 | Must | Model identitas terpisah teruji | PROPOSED |
| REQ-026 | Architecture | Permission memeriksa aktor, tenant, objek, aksi, konteks event, lisensi, status objek | MC §5 | Must | Matrix permission test lulus | PROPOSED |
| REQ-027 | Architecture | Core flow Process→Control→Workflow→Transaction→Evidence→Report; approved records immutable, koreksi via amendment | MC §5 | Must | Audit trail & version history teruji | PROPOSED |
| REQ-028 | i18n | i18n sejak awal; Indonesia default, siap Inggris; tanpa hard-coded string | MC §5 | Must | Tidak ada string UI hard-coded di layar baru | PROPOSED |
| REQ-029 | Schema | Semua perubahan schema via migration terkontrol, reversible bila layak | MC §5 | Must | Migrations ter-review & teruji up/down bila layak | PROPOSED |
| REQ-030 | Store | Store publik lisensi/extension terpisah dari Developer Equipment Store (miniRider only) | MC §6 | Must | Dua store terisolasi; akses tier lain diblokir server-side | PROPOSED |
| REQ-031 | Store | Developer Portal ≠ hak ubah lisensi/billing/notifikasi; least privilege; semua teraudit | MC §6 | Must | Role terpisah teruji | PROPOSED |
| REQ-032 | UX/UI | Visual premium, konsisten, hierarchy kuat; interaksi intuitif; konfirmasi aksi berisiko | MC §7 | Must | Heuristic review + design review per fase | PROPOSED |
| REQ-033 | UX/UI | WCAG 2.2 AA sejauh praktis & teruji | MC §7 | Must | Audit aksesibilitas terdokumentasi | PROPOSED |
| REQ-034 | UX/UI | State lengkap: loading, empty, error, success, permission denied, offline/sync, stale | MC §7 | Must | Setiap layar penting punya semua state relevan | PROPOSED |
| REQ-035 | UX/UI | Tanpa tombol palsu/placeholder tersamar/data demo tanpa label | MC §7 | Must | Review anti-mockup per fase | PROPOSED |
| REQ-036 | Mobile | QR/barcode generate, print label, scan via web & mobile (maxRider) | MC §8 | Must | Alur scan→lookup→check-in/out teruji | PROPOSED |
| REQ-037 | Mobile | Evaluasi mobile untuk fitur lapangan (event, rundown, checklist, bukti, inspeksi, laporan) | MC §8 | Should | Evaluasi jaringan buruk terdokumentasi | PROPOSED |
| REQ-038 | Mobile | Offline-first diputuskan via risiko; bila didukung: antrean aman, sync indicator, konflik, idempotency, audit; permission ditegakkan saat sync | MC §8 | Could | Tidak ada klaim offline sebelum dites | PROPOSED |
| REQ-039 | IMS | Platform pendukung IMS (bukan jaminan sertifikasi) dengan verifikasi standar dari katalog resmi | MC §9 | Should | Setiap standar punya record verifikasi (edisi/status/URL/tanggal) | PROPOSED |
| REQ-040 | IMS | Tanpa menyalin teks standar berhak cipta; mapping/metadata + bukti orisinal | MC §9 | Must | Tidak ada teks ISO dicopy ke aplikasi | PROPOSED |
| REQ-041 | IMS | Sustainability via workflow event: target, energi, transport, air, limbah, material, emisi (metodologi tersedia), aksesibilitas, inklusi, pengadaan, bukti | MC §9 | Should | Metrik menyimpan sumber/satuan/metode/periode/kualitas data; tanpa angka karbon karangan | PROPOSED |
| REQ-042 | Documents | Controlled Document Library: hirarki, metadata lengkap (ID..audit trail), fungsi library lengkap | MC §10 | Should | Fitur library teruji end-to-end | PROPOSED |
| REQ-043 | Documents | Evidence workflow: form→hasil→upload→metadata→submit→review→sign-off→locked record | MC §10 | Should | Sign-off mengikat aktor/role/waktu/konteks/versi | PROPOSED |
| REQ-044 | Documents | Auditor akses read-only, scoped, time-bound | MC §10 | Should | Akses auditor teruji & terbatas waktu | PROPOSED |
| REQ-045 | Asset | Asset lifecycle penuh (procurement→disposal) + register, maintenance, KPI, audit trail | MC §11 | Should | Lifecycle teruji dengan bukti | PROPOSED |
| REQ-046 | Ops | Operasi: CRM, quotations/orders/contracts, finance, payment states, competency, risk assessment, HSE, incident, readiness gates, complaints, NCR/CAPA, dossier | MC §11 | Should | Sesuai scope maxRider | PROPOSED |

**Catatan Phase 0:**
- Acceptance criteria di atas adalah arah, bukan kriteria final; Phase 1 wajib merinci (Master Control: Phase 1 = discovery, personas, use cases, requirements, acceptance criteria).
- Tidak ada requirement `IMPLEMENTED`. Bukti gap per requirement: `PHASE_0_GAP_REGISTER.md`.
- Harga/billing/pajak/payment gateway sengaja TIDAK didokumentasikan di sini (menunggu keputusan bisnis; Master Control §3 melarang mengarang nilai).
