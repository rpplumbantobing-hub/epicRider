# PHASE 0 GAP REGISTER — epicRider

Format kolom: ID · Severity · Domain · Deskripsi · Bukti · Dampak · Prerequisite · Opsi perbaikan · Phase target.
Severity: Critical (menghalangi fondasi/keamanan) · High · Medium · Low.
Status semua gap: `OPEN` pada 2026-05-22 (belum ada perbaikan yang dikerjakan — sesuai batasan Phase 0).

| ID | Severity | Domain | Gap | Bukti | Dampak | Prerequisite | Opsi perbaikan | Phase target |
|---|---|---|---|---|---|---|---|---|
| G-001 | High | Web/UX | Belum ada UI aplikasi epicRider (hanya placeholder logo scaffold) | `src/app/page.tsx`; screenshot `audit/evidence/` | Tidak ada nilai produk yang bisa dipakai/uji | Phase 1 requirements, Phase 3 design system | Bangun shell aplikasi + halaman Home sesuai standar UX_UI_STANDARD | 6+ |
| G-002 | High | API | Tidak ada API domain (hanya 1 route hello world); kontrak web+mobile belum ada | `src/app/api/route.ts` | Mobile tidak bisa reuse; fitur tidak bisa dibangun | Phase 2 domain model | Rancang kontrak API + route struktur per domain | 2–6 |
| G-003 | Critical | Auth | Tidak ada autentikasi & sesi (next-auth hanya dependency) | grep `next-auth` src=0; tanpa route auth | Semua endpoint akan terbuka; prasyarat tenancy | OD-03 (WhatsApp vendor); keputusan OD-02 untuk mobile auth | Implementasi auth WhatsApp+Google sesuai MC §4 dengan test alur | 4 |
| G-004 | Critical | Tenancy | Tidak ada model tenant/workspace/role/entitlement/permission | `prisma/schema.prisma` hanya User/Post | Isolasi data tidak ada; licensi tak bisa ditegakkan | Phase 2 data model | Schema tenancy + entitlement server-side + matrix permission test | 2,4,5 |
| G-005 | High | Domain | Tidak ada modul produk apa pun: event, rider, media kit, aset, CRM, finance, document library, evidence, IMS | grep domain=0 | Seluruh MC §2/§9–§11 belum ada | Phase 2–3 fondasi | Implementasi per ROADMAP phase 6–21 | 6–21 |
| G-006 | High | i18n | Tidak ada konfigurasi i18n; string UI (metadata) hard-coded EN | grep `next-intl` src=0 | Melanggar MC §5; refactor mahal kemudian | Keputusan struktur routing i18n | Wire next-intl (ID default, EN siap) di Phase 3 sebelum fitur | 3 |
| G-007 | Medium | Design system | Komponen shadcn/ui terpasang tapi tanpa design tokens/tipe/grafis epicRider; tanpa state pattern (loading/empty/error/permission/offline) | `src/components/ui/` tak terpakai | Inkonsistensi visual saat fitur berdatangan | Phase 1 persona/istilah | Bentukkan design system + pola state di Phase 3 | 3 |
| G-008 | High | Testing | Tidak ada test framework & suite aplikasi | `package.json` devDeps; `tests/` = script sandbox | Regresi tak terdeteksi; DoD fase tak bisa dibuktikan | Pilihan tooling (ADR Phase 3) | Tambah runner test + test domain pertama (permission/entitlement) | 3 |
| G-009 | Medium | Migrations | Tanpa folder migrations; workflow `db:push --accept-data-loss` berisiko untuk data nyata | `ls prisma/`; `package.json:10` | Kehilangan data saat schema berubah | OD-01 database | Mulai migrations dari schema pertama domain; larang db:push pada env ber-data | 2 |
| G-010 | Medium | Ops | Tanpa CI/CD, backup, monitoring, deployment config | `ls .github`=kosong; OPERATIONS.md §1 | Kualitas tak dijaga; tidak ada recovery | OD-10 hosting | CI lint+test+build; backup terjadwal; monitoring minimal | 3, 25 |
| G-011 | High | Git | Seluruh baseline (kode + control files + audit evidence) uncommitted | `git status --porcelain` | Kehilangan kerja; tanpa riwayat/review | Persetujuan owner commit | `git add -A && git commit` baseline (aksi owner/fase berikut) | Segera |
| G-012 | Medium | Quality config | `ignoreBuildErrors: true` + `reactStrictMode: false` di next.config | `next.config.ts:6-9` | Bug tipe lolos; dev mode tidak strict | OD-04 keputusan | Set `ignoreBuildErrors:false` setelah tipe dibersihkan; aktifkan strict mode | 3 |
| G-013 | Medium | Security ops | Tanpa dependency audit/SAST/secret scanning | Tanpa CI; SECURITY.md §1.4 | Vulnerabilitas tak terpantau | CI (G-010) | `audit` dependency + secret scan di CI | 3 |
| G-014 | High | IMS/ISO | Status edisi/amendment standar ISO belum terverifikasi (akses katalog diblokir) | curl → 403/000; `ISO_IMS_BLUEPRINT.md` §1 | Risiko basis standar salah untuk ISOrider | Akses jaringan ke iso.org | Jalankan checklist verifikasi `ISO_IMS_BLUEPRINT` §2 dari lingkungan lain | Sebelum 17 |
| G-015 | Low | Docs | Tidak ada README root yang menjelaskan cara menjalankan proyek (control files baru dibuat Phase 0) | `ls *.md` sebelum Phase 0 = 0 | Onboarding lambat | — | Tambahkan README teknis minimal saat Phase 3 (bukan scope Phase 0) | 3 |
| G-016 | Low | Examples | `examples/websocket` & `mini-services/` kosong sebagai pola realtime; belum ada keputusan arsitektur realtime (chat event MC §2) | `ls mini-services/` | Fitur chat/rundown realtime butuh keputusan | OD-02 & Phase 2 arsitektur | ADR realtime (socket.io mini service vs lain) saat phase terkait | 2,10 |

**Statistik:** 3 Critical · 7 High · 5 Medium · 1 Low — semua `OPEN`.
Gap ini adalah daftar pekerjaan fase berikutnya, BUKAN daftar yang sudah diperbaiki pada Phase 0.
