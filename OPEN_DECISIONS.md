# OPEN DECISIONS — epicRider

**Status dokumen:** Register keputusan terbuka hasil Phase 0 + Phase 1 (konsolidasi). Keputusan lama tidak dihapus — riwayat tetap di `PHASE_0_OPEN_DECISIONS.md`; register ini adalah sumber aktif.
**Aturan:** Item berlabel **OPEN / OWNER APPROVAL REQUIRED** tidak boleh diputuskan oleh engineer/agent. Keputusan yang disetujui owner pindah ke `DECISIONS.md` (ADR) dengan tanggal & dasar.

---

## 1. Carry-over dari Phase 0 (status tetap, kecuali dicatat)

| ID | Keputusan | Status | Catatan Phase 1 |
|---|---|---|---|
| OD-01 | Database produksi (SQLite vs PostgreSQL/MySQL lain) | OPEN | Masih relevan untuk Phase 2; seed requirement REQ-029/097. |
| OD-02 | Strategi mobile/tablet/Windows (PWA vs native vs cross-platform vs wrapper) | OPEN | Mempengaruhi UX requirements (REQ-019/020) & kontrak API Phase 2. |
| OD-03 | Mekanisme/vendor verifikasi WhatsApp login | OPEN | REQ-021 dibuat agnostik-vendor; Phase 4 membutuhkan keputusan ini. |
| OD-04 | Kebijakan `ignoreBuildErrors` / `reactStrictMode` | OPEN | Quality gate Phase 3. |
| OD-05 | Definisi kuota 5 kru: owner dihitung atau tidak | OPEN | REQ-009 menunggu; wajib sebelum Phase 5. |
| OD-06 | Harga, billing, pajak, refund, payment gateway | OPEN | Phase 1 tidak mengarang nilai; REQ-056/098/100 menunggu. |
| OD-07 | Strategi offline-first workflow lapangan | OPEN | REQ-038/037 menunggu; mempengaruhi Phase 13/24. |
| OD-08 | Scope standar ISO per segmen pelanggan | OPEN | Ditambah blocker teknis: verifikasi edisi masih `BLOCKED` (lihat STANDARD_REGISTER). |
| OD-09 | Kewajiban hukum/privasi lokal (UU PDP dll.) — butuh ahli | OPEN | Relevan sebelum fitur evidence/metadata sensitif (Phase 18). |
| OD-10 | Target hosting/deployment & strategi rilis | OPEN | OPERATIONS.md target; wajib sebelum Phase 25/26. |
| ~~OD-11~~ | Commit baseline git | **CLOSED — TEREKSEKUSI** | Baseline ter-commit `03293b6` (terverifikasi `git log`). |
| OD-12 | Bahasa konten produk (ID default + EN siap) | OPEN (asumsi MC §5 berlaku bila tidak dijawab) | REQ-028 mengasumsikan Indonesia default. |

## 2. Keputusan baru hasil Phase 1 (OWNER APPROVAL REQUIRED)

| ID | Keputusan | Opsi | Dampak bila tertunda | Rekomendasi (bukan keputusan) | Pemutus |
|---|---|---|---|---|---|
| OD-101 | Model role Equipment Store & Developer Portal: siapa boleh kelola listing vs katalog publik vs broadcast | (a) satu role developer dengan sub-permission; (b) role terpisah store-manager & portal-admin | Desain role Phase 4/11/22 tertunda | (b) — sesuai MC §6 least privilege & REQ-031 | Owner |
| OD-102 | Jenis notifikasi wajib vs opsional, kebijakan opt-out, otoritas pemberi approval broadcast | (a) owner platform approve semua broadcast; (b) delegasi ke role terbatas dengan limit | REQ-061 & governance Phase 22 tertunda | (a) untuk rilis awal | Owner |
| OD-103 | Kekuatan hukum sign-off digital: click-to-sign vs e-signature tersertifikasi; kebutuhan vendor & review hukum | (a) click-to-sign dengan binding audit; (b) e-sign vendor tersertifikasi untuk dokumen legal | REQ-083 detail legal tertunda; jangan klaim legal strength | (a) rilis awal + review hukum (OD-09) sebelum klaim | Owner + ahli hukum |
| OD-104 | Periode retensi & disposisi per kelas dokumen/record | Tunggu kelas dokumen dari DOCUMENT_EVIDENCE_MODEL | REQ-081 tidak bisa dikunci | Tetapkan bersama IMS lead setelah hirarki disetujui | Owner + IMS lead |
| OD-105 | Metodologi GHG/karbon (jika dipakai) & sumber faktor emisi | (a) tanpa kalkulasi karbon rilis awal; (b) adopsi metodologi publik terverifikasi | REQ-086; larangan mengarang angka | (a) rilis awal; (b) hanya dengan metodologi terverifikasi | Owner + ahli sustainability |
| OD-106 | Set KPI sustainability & target angka awal | Tunggu dictionary (PROCESS_MAP) | REQ-085 targets kosong sementara | Approve dictionary dulu, target menyusul | Owner |
| OD-107 | Kebijakan konflik reservation aset: hard-block vs allow-with-warning, aturan prioritas | (a) hard-block; (b) peringatan dengan override terotorisasi; (c) hybrid per kelas aset | REQ-065 perilaku final | (c) hybrid; detail menunggu kategori aset | Owner + ops |
| OD-108 | Aturan expiry/grace & perilaku data saat downgrade (durasi grace, restrict vs archive vs delete) | Rentang opsi di LICENSE_MATRIX §4 | REQ-098/099 final tertunda | Tidak hapus data; restrict akses fitur; archive bila diminta | Owner |
| OD-109 | hiRider: default visibilitas profil/lamaran & kebijakan blocking/report abuse | (a) privat by default; (b) publik by default dengan opt-out | REQ-062/REQ-064 detail Phase 16 | (a) privat by default (privacy-safe) | Owner |
| OD-110 | Ketentuan akses auditor eksternal (scope default, durasi maksimum, proses NDA) | Tunggu kebijakan | REQ-053 default param belum ada | Scoped per-workspace + expiry ≤ periode audit yang disetujui | Owner + IMS lead |
| OD-111 | Scope & format import/export data (CSV/JSON/lain; objek yang diizinkan) | (a) export-only dulu; (b) import+export terbatas objek utama | REQ-096 Phase 24 | (a) export-only rilis awal | Owner + eng lead |
| OD-112 | Target NFR kinerja/ketersediaan (set PROPOSED di NON_FUNCTIONAL_REQUIREMENTS) | Approve / ubah / tunda angka | REQ-093/094 tak bisa diuji terhadap target | Approve minimal set dasar sebelum Phase 25 | Owner + eng lead |
| OD-113 | Izin pembuatan UX prototype terpisah (Phase 1 tidak membangun UI produksi) | (a) lanjut langsung design system Phase 3; (b) buat prototype klik-klik terpisah dulu | Cepat validasi arah visual vs biaya | (b) prototype ringan sebelum Phase 3 finalisasi token — hanya dengan persetujuan | Owner |
| OD-114 | Strategi backup/DR & target RPO/RTO | Proposals di NON_FUNCTIONAL_REQUIREMENTS | REQ-094 | RPO/RTO diputuskan bersama hosting decision (OD-10) | Owner + eng lead |
| OD-115 | Kebijakan sesi & perangkat (maks sesi aktif, idle timeout, force-logout semua device) | Proposals di USE_CASES (UC-10xx failure flows) | REQ-048 default param | Mulai konservatif (timeout pendek), evaluasi feedback kru lapangan | Owner + eng lead |
| OD-116 | Input `DATA_MODEL_CONCEPT.md` tidak ditemukan di gate Phase 1 | (a) owner menyediakan dokumen konsep; (b) Phase 2 membangun konsep data model dari nol berbasis artefak Phase 1 | Risiko gap pemahaman domain sebelum Phase 2 | (a) bila dokumen ada; (b) bila tidak, Phase 2 wajib membuka dengan review artefak Phase 1 | Owner |

## 3. Index kandidat keputusan dari artefak Phase 1 (WORKSTREAM CANDIDATES — status OPEN / OWNER APPROVAL REQUIRED)

Kandidat berikut dibuat oleh workstream Phase 1 di masing-masing artefak (definisi lengkap ada di file sumber). Register ini adalah index tunggal; setelah owner memutuskan, catat ADR di `DECISIONS.md` dan ubah status di file sumber.

| ID | Keputusan (ringkas) | File sumber | Status |
|---|---|---|---|
| OD-120 | Model akses eksternal supplier/contractor (P-11) | PERSONAS_AND_JOURNEYS.md | OPEN |
| OD-121 | Kanal feedback/keluhan & model akses pelanggan (P-12) | PERSONAS_AND_JOURNEYS.md | OPEN |
| OD-122 | Preset role default per tier | PERSONAS_AND_JOURNEYS.md | OPEN |
| OD-123 | Batas multi-workspace untuk non-kru | PERSONAS_AND_JOURNEYS.md | OPEN |
| OD-124 | Rencana validasi persona/journey dengan partisipan nyata | PERSONAS_AND_JOURNEYS.md | OPEN |
| OD-125 | Scope notifikasi in-app workspace/event baseline Phase 10 | PERSONAS_AND_JOURNEYS.md | OPEN |
| OD-126 | Definisi minimum readiness gate sebelum dispatch aset | PERSONAS_AND_JOURNEYS.md | OPEN |
| OD-130 | Kebijakan penugasan ganda kru | USE_CASES.md | OPEN |
| OD-131 | Kebijakan chat/rundown concurrent edit | USE_CASES.md | OPEN |
| OD-132 | Damage aset → incident/NCR otomatis | USE_CASES.md | OPEN |
| OD-133 | Otoritas harga/diskon store | USE_CASES.md | OPEN |
| OD-134 | Data kontak lamaran hiRider | USE_CASES.md | OPEN |
| OD-135 | State machine invoice/order | USE_CASES.md | OPEN |
| OD-136 | Larangan self-approval dokumen/evidence | USE_CASES.md | OPEN |
| OD-137 | Kuota storage media per tier | USE_CASES.md | OPEN |
| OD-138 | Retensi & akses audit log | USE_CASES.md | OPEN |
| OD-139 | Limit anti-abuse broadcast | USE_CASES.md | OPEN |
| OD-140 | Skema klasifikasi dokumen final & default per tipe | DOCUMENT_EVIDENCE_MODEL.md | OPEN |
| OD-141 | Matriks otoritas approval & dual-control (approver ≠ penulis) | DOCUMENT_EVIDENCE_MODEL.md | OPEN |
| OD-142 | Kebijakan capture metadata lokasi/sensitif pada evidence (+OD-09) | DOCUMENT_EVIDENCE_MODEL.md | OPEN |
| OD-143 | Format & kontrol paket export auditor (+OD-110/OD-111) | DOCUMENT_EVIDENCE_MODEL.md | OPEN |
| OD-144 | Granularitas minimum hirarki configurable | DOCUMENT_EVIDENCE_MODEL.md | OPEN |
| OD-160 | Verifier & lingkungan akses katalog ISO (menutup blocker F0-012) | NON_FUNCTIONAL_REQUIREMENTS.md | OPEN |
| OD-161 | Kebijakan standar kandidat "2026" bila masih in-process | NON_FUNCTIONAL_REQUIREMENTS.md | OPEN |
| OD-162 | Lingkungan & metode pengukuran NFR | NON_FUNCTIONAL_REQUIREMENTS.md | OPEN |
| OD-163 | Target availability final, maintenance window, komunikasi downtime | NON_FUNCTIONAL_REQUIREMENTS.md | OPEN |
| OD-164 | Retensi default log teknis & audit trail platform | NON_FUNCTIONAL_REQUIREMENTS.md | OPEN |
| OD-165 | Approval dataset sintetis berlabel untuk uji beban/NFR | NON_FUNCTIONAL_REQUIREMENTS.md | OPEN |
| OD-166 | Klasifikasi keamanan & batas file export | NON_FUNCTIONAL_REQUIREMENTS.md | OPEN |
| OD-168 | Kanal support & jam operasional rilis awal | NON_FUNCTIONAL_REQUIREMENTS.md | OPEN |
| OD-180 | Penempatan kamus istilah resmi | RISK_REGISTER.md | OPEN |
| OD-181 | Daftar resmi "layar kunci" per fase | RISK_REGISTER.md | OPEN |
| OD-182 | Kebijakan usability validation minimum (sumber partisipan) | RISK_REGISTER.md | OPEN |
| OD-183 | Perilaku UI interim offline pra-OD-07 | RISK_REGISTER.md | OPEN |
| OD-184 | Matrix minimum perangkat/browser scanner web | RISK_REGISTER.md | OPEN |
| ~~OD-185~~ | ~~**Apakah "penawaran jasa" (service offering) tetap menjadi scope hiRider?**~~ **CLOSED 2026-10-28 — DECIDED BY BASELINE: penawaran jasa IN-SCOPE** (sumber keputusan = baseline Master Control "Marketplace layanan kru" §2 hiRider + roadmap Phase 16 — bukan preferensi engineer; dieksekusi sebagai remediasi F-01 audit konsistensi Phase 3; lihat `adr/ADR-021-hirider-service-offer-scope.md`) | ~~(a)/(b)~~ moot — opsi tidak berlaku karena scope sudah dijawab baseline | `ServiceOffer` direncanakan di `DATA_MODEL_CONCEPT.md` §3.7/§5 + `ARCHITECTURE.md` §6 + `LICENSE_MATRIX.md` §3 (lifecycle/visibility/permission/API/audit detail = `PROPOSED`, desain final Phase 16 — keberadaannya BUKAN `OPEN`); REQ-013 diamendemi terkendali (ID tetap, tanpa REQ baru); invariant tetap: `Application != Workspace Membership`, `Application != Event Assignment`, `Acceptance != Automatic Workspace Access`, `hiRider != License/Tier`. Pembukaan kembali hanya via keputusan owner eksplisit yang mengubah baseline (ADR pengganti wajib). | CLOSED — lihat ADR-021 |

Catatan penomoran: OD-129/OD-149/OD-169 hanya penanda batas range workstream (bukan keputusan). ID OD-167/OD-170-179 tidak dipakai — jangan gunakan tanpa dicatat di sini.

## 4. Ringkasan untuk owner (baca sebelum Phase 2)

> **KOREKSI BASELINE 2026-10-27 (owner, lampiran `epicRider_phase2_control_replacement.zip`):**
> Poin 1 di bawah **SUPERSEDED**. OD-01/OD-02/OD-116 **bukan** blocker penuh Phase 2 —
> lihat `DECISIONS.md` (rekonsiliasi) dan `PHASE_2_DEPENDENCY_MATRIX.md`:
> OD-01 hanya memblokir finalisasi database fisik/migrasi produksi; OD-02 tidak memblokir
> Phase 2 (arsitektur wajib client-neutral); OD-116 adalah **workstream/output Phase 2**,
> bukan prasyarat. Register OD (§1–§3) tetap valid; hanya penilaian dampak per-fase dikoreksi.
>
> Poin 2–4 berlaku **pada level sub-scope, bukan fase penuh**: OD-03 hanya memblokir
> integrasi/konfigurasi/production test spesifik vendor (bukan Phase 4 keseluruhan);
> OD-05 hanya memblokir final counting kuota seat/billing (bukan Phase 5 keseluruhan);
> OD-06 hanya memblokir production charging/harga final/gateway/commercial launch
> (bukan arsitektur katalog/entitlement). Definisi kanonik: `DECISIONS.md` versi 2026-10-27.

1. ~~**Menghalangi Phase 2 jika tak dijawab:** OD-01 (database), OD-02 (strategi mobile → kontrak API), OD-116 (konsep data model).~~ **[SUPERSEDED — lihat koreksi di atas]**
2. **Menghalangi Phase 4:** OD-03 (WhatsApp vendor), OD-115 (param sesi bisa PROPOSED dulu).
3. **Menghalangi Phase 5:** OD-05, OD-06, OD-108.
4. **Menghalangi Phase 11/22:** OD-06, OD-101, OD-102.
5. **Menghalangi Phase 17–20:** OD-08 (+ verifikasi standar masih BLOCKED), OD-103, OD-104, OD-105, OD-106, OD-110.
6. **Menghalangi Phase 13/16/24/25:** OD-07, OD-09, OD-109, OD-111, OD-112, OD-114.
7. **Opsional kualitas:** OD-04, OD-113, OD-12.

Keputusan ini adalah daftar tunggal; jika owner menjawab, catat hasilnya di `DECISIONS.md` sebagai ADR dan ubah status baris terkait di sini menjadi `CLOSED — lihat ADR-xxx`.
