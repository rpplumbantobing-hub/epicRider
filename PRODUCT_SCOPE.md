# PRODUCT SCOPE — epicRider

> **Referensi MC §N:** rujukan Master Control pada dokumen ini memakai penomoran era Phase 0/1 (MC-V1, §1–§15 — arsip: `audit/superseded/phase1-era-control/`). Interpretasi ke anchor kanonik aktif: `CONTROL_REFERENCE_CROSSWALK.md` (contoh: "MC §2" di sini = Produk & batas lisensi era MC-V1, BUKAN Entitlement taxonomy MC aktif; "MC §14" = anti-halusinasi → MC aktif §7). Substansi dokumen tidak diubah (aturan F-06).

**Task ID:** 1-a (WS-A) · **Fase:** Phase 1 — discovery (documentation-only) · **Status dokumen:** `PROPOSED` (menunggu persetujuan owner)
**Sumber:** `MASTER_CONTROL.md` (MC §1–§12), `REQUIREMENTS.md` (REQ-001..100), `OPEN_DECISIONS.md` (OD-01..OD-116), `ROADMAP.md`, `PHASE_0_AUDIT_REPORT.md`, `LICENSE_MATRIX.md`, `UX_UI_STANDARD.md`.
**Kejujuran metodologi:** Desk analysis — belum divalidasi dengan partisipan pengguna nyata. Tidak ada riset pasar, tidak ada data harga, tidak ada klaim legal. Semua klaim arah produk dapat ditunjuk ke MC § atau REQ-xxx.

---

## 1. Tujuan produk & visi (parafrasa MC §1 — makna tidak diubah)

epicRider adalah **satu platform berbasis web plus aplikasi pendamping** untuk mengelola operasi bisnis perusahaan **multimedia, event, production, broadcast, dan jasa rental** audio, kamera, visual/lighting, serta perlengkapan terkait.

Platform dirancang cocok untuk pelaku **rumahan/perorangan, startup, usaha yang bertumbuh, sampai organisasi dengan sistem manajemen terintegrasi (IMS)**.

**Prinsip inti visi (MC §1, REQ-002):** perusahaan bertumbuh melalui **satu fondasi data dan proses yang berkesinambungan** — bukan berpindah ke aplikasi terpisah atau membangun ulang database saat naik tingkat lisensi (miniRider → maxRider → ISOrider).

Implikasi arsitektur yang mengikat scope ini (MC §5): satu domain model inti, multi-tenant/multi-workspace dengan isolasi terbukti (REQ-023), entitlement server-side untuk semua perbedaan lisensi (REQ-024), dan core flow **Process → Control → Workflow → Transaction → Evidence → Report/Improvement** (REQ-027).

---

## 2. Batas produk

### 2.1 Yang TERMASUK dalam scope produk (semua TARGET STATE, status `PROPOSED`)

| Komponen | Isi ringkas | Rujukan |
|---|---|---|
| **miniRider** | Workspace berbasis event (Home, Event, Asset, Team, Profile); technical rider draft terhubung event; media kit dari template terkait event; aset dasar + asset/set template; konteks event aktif kru + safe switch; halaman event (Chat, Rundown, Media Kit, update info/laporan); batas awal maks 5 kru/workspace (kuota = OD-05); Developer Equipment Store **in-app** hanya di tier ini | MC §2; REQ-003..REQ-010 |
| **maxRider** | Mewarisi core miniRider (kecuali visibilitas Equipment Store in-app) + CRM/pelanggan, keuangan/komersial, operasi rental & siklus hidup aset penuh (QR/barcode, print, scan), maintenance, pemeriksaan, readiness, role/permission dinamis, workflow, dashboard, risk/HSE, kontrol operasi | MC §2, §11; REQ-011, REQ-036, REQ-045, REQ-046 |
| **ISOrider** | Mewarisi core maxRider + IMS digital: mutu, sustainability, K3/HSE, lingkungan, keamanan informasi, business continuity, risiko, audit, controlled documented information, bukti, kompetensi, vendor/kontraktor, keluhan, NCR/CAPA, management review, continual improvement | MC §2, §9, §10; REQ-012, REQ-039..REQ-044, REQ-070..REQ-087 |
| **hiRider** | Marketplace layanan kru: profil, skill, portofolio, rekrutmen (buka/tutup), application lifecycle (apply→shortlist→accept/reject→withdraw); status lamaran ≠ akses workspace/event; kru kelola beberapa workspace mandiri sesuai lisensi | MC §2; REQ-013, REQ-014, REQ-062..REQ-064 |
| **Website publik** | Landing page: promosi produk, lisensi, extensions, akses tester, tautan download Android/iOS/Windows, login; **store publik** lisensi/extension (terpisah dari Equipment Store in-app) | MC §2, §6; REQ-015, REQ-030, REQ-100 |
| **Developer Portal** | Konsol login berhak khusus: kelola katalog/listing toko, stok, harga, diskon, media produk, status publikasi; notifikasi terarah (seluruh workspace / terpilih / user tertentu) dengan pratinjau wajib, dedup/idempotency, status kirim, anti-abuse, audit log; **tidak** otomatis memberi hak lisensi/billing/broadcast | MC §2, §6; REQ-016, REQ-017, REQ-031, REQ-052, REQ-055..REQ-061 |
| **Extensions** | Kandidat: workspace tambahan, paket +10 seat kru per workspace, aplikasi mobile/tablet, landing page workspace, lainnya yang disetujui | MC §3; REQ-018 |
| **Lintas komponen** | Auth WhatsApp + Google OAuth/OIDC (MC §4; REQ-021/022); multi-tenancy & permission (REQ-023..026); i18n ID default + siap EN (REQ-028); UX/UI quality gate & state lengkap (REQ-032..035; `UX_UI_STANDARD.md`); responsive web 3 breakpoint (REQ-019); API reusable web+mobile (REQ-020); migrasi schema terkontrol (REQ-029) | MC §3–§8 |

### 2.2 Yang EKSKLUSIF di luar scope rilis awal (eksplisit)

| # | Item di luar scope rilis awal | Alasan & rujukan |
|---|---|---|
| X-1 | **Detail harga, billing, pajak, refund, payment gateway** — struktur store/lisensi ada, nilai komersial tidak ditetapkan/didokumentasikan | Keputusan bisnis terbuka; MC §3 melarang mengarang nilai; OD-06; REQ-056, REQ-098, REQ-100 |
| X-2 | **Integrasi vendor spesifik** (vendor WhatsApp OTP, payment provider, vendor e-signature, dsb.) — desain wajib agnostik-vendor sampai keputusan | MC §4, §3; OD-03, OD-06, OD-103 |
| X-3 | **Kalkulasi karbon/GHG tanpa metodologi terverifikasi** — data sustainability dapat dicatat dengan sumber/satuan/metode + flag measured/estimated; input emisi tanpa metodologi ditolak atau berlabel estimated & pending review | MC §9; REQ-086; OD-105, OD-106 |
| X-4 | **Klaim sertifikasi/komplian ISO** — ISOrider adalah platform pendukung IMS, bukan jaminan sertifikasi; status edisi standar `NOT VERIFIED` (katalog ISO `BLOCKED` dari sandbox) | MC §9; ADR-002; REQ-039; ISO_IMS_BLUEPRINT §2 |
| X-5 | **Offline-first penuh sebelum OD-07 diputuskan** — evaluasi mobile/jaringan buruk tetap wajib (REQ-037), tapi antrean lokal/sync/conflict hanya bila keputusan mendukung | MC §8; OD-07; REQ-038 |
| X-6 | **Delivery aplikasi native (Android/iOS/Windows) sebelum ADR OD-02** — web adalah kanal kelas utama; download link di landing tidak berarti app sudah dibangun | MC §3, §8; OD-02 |
| X-7 | **Penyalinan teks standar ISO berhak cipta** ke aplikasi | MC §9; REQ-040, REQ-072 |
| X-8 | **Kesimpulan hukum/kewajiban lokal** (mis. UU PDP) tanpa validasi ahli | MC §9, §14; OD-09 |
| X-9 | **Target angka SLA/performance/backup yang final** — hanya PROPOSED sampai owner menyetujui | OD-112, OD-114; REQ-093, REQ-094 |
| X-10 | **Klaim usability/tampilan "sudah bagus" tanpa evaluasi terdokumentasi** | MC §7; REQ-091; UX_UI_STANDARD §2.5 |

---

## 3. Non-goals rilis awal (jelas & eksplisit)

1. **Bukan pengganti ERP/akuntansi penuh.** Finance scope mengikuti MC §11 (quotation/order/contract, finance workflow, payment/invoice states *sesuai integrasi*); accounting/depreciation integration hanya sejauh scope finance yang disetujui owner.
2. **Bukan jaminan kepatuhan/sertifikasi.** Platform menyediakan alat IMS (dokumen, bukti, NCR/CAPA, review); keputusan sertifikasi tetap di tangan organisasi pengguna dan badan sertifikasi (MC §9).
3. **Tidak ada marketplace pihak ketiga umum.** MC hanya mendefinisikan: Developer Equipment Store in-app (miniRider saja, REQ-010), store publik lisensi/extension (REQ-030), dan marketplace kru hiRider (REQ-013). Apa pun di luar itu dianggap di luar scope sampai owner menetapkan.
4. **Tidak ada broadcast notifikasi tanpa pratinjau penerima + otorisasi + audit** (REQ-059, REQ-060, REQ-031; OD-101, OD-102).
5. **Tidak ada aksi "senyap" pada approved records/evidence** — koreksi hanya via amendment/version history (REQ-027, REQ-083).
6. **Tidak ada tombol/link palsu, placeholder tersamar, chart/data demo tanpa label** (UX_UI_STANDARD §2.5; REQ-035).
7. **Tidak ada menu-hiding sebagai kontrol keamanan** — semua beda lisensi ditegakkan server-side (REQ-024, REQ-010).
8. **Tidak ada kredensial/secret di frontend atau repo** (MC §4; REQ-092).
9. **Tidak ada penguncian stack/framework/database baru tanpa audit + ADR** (MC §5; OD-01, OD-02).
10. **Tidak ada definisi lisensi baru yang mendefinisikan ulang matrix** — `LICENSE_MATRIX.md` (WS-B) adalah satu-satunya sumber matrix capability/limits; dokumen ini hanya merujuk.

---

## 4. Segmentasi pengguna (desk analysis — belum divalidasi dengan partisipan nyata)

Segmentasi mengikuti MC §1; detail persona di `PERSONAS_AND_JOURNEYS.md`.

| Segmen | Karakteristik operasi (desk) | Tier yang relevan | Persona contoh |
|---|---|---|---|
| **Rumahan/perorangan** | Satu orang kerja serbaguna; event skala kecil; butuh kesederhanaan | miniRider | P-01 Solo Owner-Operator |
| **Startup** | Tim kecil (≤5 kru awal); kelola beberapa event; mulai butuh CRM/aset | miniRider → maxRider | P-02 Workspace Owner UKM, P-04 Event Manager |
| **Usaha bertumbuh** | Operasi rental/asset serius, keuangan, tim lebih besar, role dinamis | maxRider (+ extension seat/workspace) | P-05 Rental/Asset Manager, P-06 Finance/CRM Officer |
| **Organisasi IMS** | Butuh dokumen terkendali, bukti, audit, NCR/CAPA, sustainability, review | ISOrider | P-09 Auditor, P-10 IMS/Sustainability Manager, P-11 Supplier (bila relevan) |
| **Lintas segmen** | Kru multi-workspace mobile-first | hiRider (+ membership di workspace tier lain) | P-03 Crew Member |
| **Platform** | Operasi & pengembangan platform | Developer Portal / peran platform | P-07 Developer/Store Manager, P-08 Platform Administrator/Support |
| **Eksternal** | Pelanggan layanan (feedback/keluhan; akses model = OD-121) | Interaksi dengan maxRider/ISOrider | P-12 Customer |

**Catatan kejujuran:** pembagian ini adalah parafrasa MC §1 + desk analysis. Tidak ada data pasar atau sizing segmen — angka apa pun dianggap `UNKNOWN / NEEDS DECISION`.

---

## 5. Pemetaan capability → tier (ringkas)

**Sumber tunggal matrix:** `LICENSE_MATRIX.md` (WS-B) — dokumen ini TIDAK mendefinisikan ulang; hanya peta arah.

| Capability (ringkas) | miniRider | maxRider | ISOrider | hiRider |
|---|---|---|---|---|
| Workspace event + rider + media kit + aset dasar | ✅ | ✅ (core) | ✅ (core) | ✅ (via workspace) |
| Equipment Store **in-app** | ✅ hanya ini | ❌ blokir API | ❌ blokir API | ❌ blokir API |
| CRM, finance/komersial, role dinamis, workflow, dashboard, risk/HSE | ❌ | ✅ | ✅ | — |
| Rental lifecycle penuh, QR/barcode, print/scan, maintenance, readiness | ❌ | ✅ | ✅ | — |
| IMS digital (dokumen terkendali, evidence, NCR/CAPA, review, sustainability) | ❌ | ❌ | ✅ | — |
| Marketplace kru/rekrutmen | ❌ | ❌ | ❌ | ✅ |
| Store publik lisensi/extension | ✅ | ✅ | ✅ | ✅ |
| Maks kru per workspace | 5 (OD-05: owner dihitung?) | sesuai lisensi/extension | sesuai lisensi/extension | sesuai lisensi |

Batas kuantitatif, harga, extension, dan perilaku downgrade: lihat `LICENSE_MATRIX.md` §2–§4 (semua nilai komersial `UNKNOWN / NEEDS DECISION` — OD-06, OD-108).

---

## 6. Dependencies eksternal (semua `OPEN` kecuali dicatat)

| Dependency | Dipakai untuk | Rujukan | Status |
|---|---|---|---|
| Vendor/mekanisme verifikasi WhatsApp login | Auth alur nomor WhatsApp (bukti kontrol nomor, OTP sekali pakai, anti-replay, rate limit) | OD-03; REQ-021, REQ-047, REQ-054 | `OPEN` — Phase 4 tertahan |
| Google OAuth/OIDC (provisioning project, client credential, redirect URI) | Login Google Sign-In/SSO dengan validasi state/nonce/issuer/audience/signature/expiry | MC §4; REQ-022 | `OPEN` — provisioning eksternal belum dilakukan (NOT DONE); desain agnostik sampai konsol tersedia |
| Payment gateway + kebijakan harga/pajak/refund | Store publik lisensi/extension, siklus lisensi, akses tester | OD-06; REQ-056, REQ-098, REQ-100 | `OPEN` — Phase 5/14/22 tertahan |
| Target hosting/deployment & strategi rilis | Operasi, backup/DR, RPO/RTO | OD-10, OD-114; REQ-094, OPERATIONS.md | `OPEN` — wajib sebelum Phase 25/26 |
| Katalog resmi ISO (www.iso.org / catalog.iso.org) | Verifikasi edisi/amendment standar sebelum mapping klausul ISOrider | ADR-002; REQ-039, REQ-071; ISO_IMS_BLUEPRINT §2 | `BLOCKED` dari sandbox (HTTP 403/000) — wajib dijalankan dari lingkungan berakses |
| Ahli hukum/privasi lokal | Kewajiban hukum & privasi (evidence, metadata sensitif, sign-off legal) | OD-09, OD-103 | `OPEN` |
| Ahli sustainability / sumber metodologi GHG | Definisi metrik & kalkulasi emisi (bila dipakai) | OD-105, OD-106 | `OPEN` |
| Kanal distribusi Android/iOS/Windows | Delivery aplikasi pendamping & tautan download landing | OD-02; REQ-015 | `OPEN` — strategi menunggu ADR |

**Prinsip:** tidak ada dependency yang dihubungi/dikonfigurasi pada Phase 1; semua provisioning adalah aksi pasca-keputusan owner.

---

## 7. Asumsi yang perlu validasi owner

Semua baris berstatus **`ASSUMPTION`** — tidak satupun divalidasi dengan data owner/pengguna.

| ID | Asumsi | Dasar | Risiko bila salah |
|---|---|---|---|
| A-01 | Bahasa konten produk: Indonesia default + siap EN; tidak ada bahasa ketiga pada rilis awal | MC §5; OD-12 (`OPEN`, asumsi berlaku bila tidak dijawab) | Refactor i18n bila bahasa lain jadi wajib awal |
| A-02 | Web browser (desktop/tablet/mobile) adalah kanal utama rilis awal; app pendamping menyusul sesuai OD-02 | MC §3 ("web adalah kanal kelas utama") | Ekspektasi pengguna mobile bila app ditunggu lebih cepat |
| A-03 | Satu workspace = satu unit bisnis/tenant; multi-workspace untuk pemilik usaha adalah extension ("workspace tambahan", MC §3), bukan default | MC §2–§3 | Desain tenancy Phase 2 salah arah bila owner berbeda pandangan |
| A-04 | Kuota 5 kru/workspace cukup untuk segmen rumahan/startup awal; kelebihan via extension +10 seat | MC §2, §3 | Frustrasi onboarding bila kuota terasa sempit; OD-05 juga belum memutuskan owner dihitung |
| A-05 | Kru memiliki smartphone dengan browser modern (dan kamera untuk alur scan) | MC §7–§8 (mobile, scanner) | Alur hiRider/scan terhambat di perangkat lama |
| A-06 | Owner akan menyediakan akses/akun untuk vendor WhatsApp & konsol Google ketika OD-03 diputuskan | MC §4 (provisioning eksternal) | Phase 4 tertahan lebih lama |
| A-07 | Pengguna organisasi IMS memahami bahwa platform mendukung — bukan menjamin — sertifikasi | MC §9 | Ekspektasi keliru / klaim berlebih oleh penjualan |
| A-08 | Laporan event & rundown pada rilis awal berbasis template dalam app (bukan ekspor dokumen kompleks) | MC §2 (update informasi/laporan antar tim); format detail belum ditetapkan | Ekspektasi format laporan (PDF/docx dsb.) belum dispesifikasikan — perlu keputusan (lihat OD-125/OD-126 di PERSONAS_AND_JOURNEYS.md) |
| A-09 | Data demo (bila ada) selalu berlabel demo dan tidak pernah dicampur data produksi | UX_UI_STANDARD §2.5; REQ-035 | Kehilangan kepercayaan data |
| A-10 | Tidak ada kebutuhan integrasi pihak ketiga lain (akuntansi, kalender, dsb.) pada rilis awal selain yang tercantum di §6 | Tidak ada di MC/REQ | Scope creep tak terencana |

---

## 8. Peta ke 15 artefak Phase 1 lainnya

Artefak wajib Phase 1 (per prompt Phase 1 §"Artefak yang wajib dihasilkan"). File 1–2 (PRODUCT_SCOPE, PERSONAS_AND_JOURNEYS) adalah output WS-A ini; 15 berikut ditangani workstream/agen lain. Status dicek saat penulisan dokumen ini.

| # | File | Isi (per prompt Phase 1) | Status saat dokumen ini ditulis |
|---|---|---|---|
| 1 | `REQUIREMENTS.md` | Revisi requirement REQ-001..REQ-100: ID stabil, priority, rationale, acceptance criteria terukur, source, planned phase | Sudah ada & dibaca (100 REQ, semua `PROPOSED`) — `VERIFIED` |
| 2 | `USE_CASES.md` | Main flows & failure/alternate flows (UC-xx) | Belum ada saat penulisan — dihasilkan workstream lain |
| 3 | `LICENSE_MATRIX.md` | Matrix tier/extension, batas 5 kru, siklus beli/renewal/expiry/grace/downgrade, perilaku data saat tier turun; pemisahan store publik vs Equipment Store in-app | Sudah ada (draft TARGET, tanpa harga) — `VERIFIED`; dirujuk, tidak didefinisikan ulang |
| 4 | `PROCESS_MAP.md` | Event-to-cash/asset lifecycle & IMS process map | Belum ada saat penulisan |
| 5 | `STANDARD_REGISTER.md` | Standar/edisi/amendment/status/source/verified date (tanpa teks berhak cipta) | Belum ada saat penulisan |
| 6 | `DOCUMENT_EVIDENCE_MODEL.md` | Hirarki dokumen, ACL, lifecycle, evidence, approval/signature, auditor traceability | Belum ada saat penulisan |
| 7 | `UX_REQUIREMENTS.md` | Information architecture, critical flows, responsive/mobile, aksesibilitas, UX acceptance | Belum ada saat penulisan |
| 8 | `NON_FUNCTIONAL_REQUIREMENTS.md` | NFR + pendekatan pengukuran; target angka ditandai PROPOSED | Belum ada saat penulisan |
| 9 | `RISK_REGISTER.md` | Risiko, probability/impact, mitigasi, owner, trigger, status | Belum ada saat penulisan |
| 10 | `OPEN_DECISIONS.md` | Register keputusan (OD-01..OD-12 carry-over + OD-101..OD-116) dengan opsi/dampak/rekomendasi | Sudah ada & dibaca — `VERIFIED`; kandidat WS-A (OD-120..OD-12x) ditulis di `PERSONAS_AND_JOURNEYS.md` |
| 11 | `TRACEABILITY_MATRIX.md` | requirement → persona/use case → acceptance test → planned phase | Belum ada saat penulisan |
| 12 | `PHASE_1_REPORT.md` | Summary, dokumen berubah, konflik, pertanyaan tak terjawab, limitasi, status test (documentation-only), exit assessment | Belum ada saat penulisan |
| 13 | `ROADMAP.md` (update) | Status fase + dependency — hanya bila didukung bukti/keputusan | Ada (status Phase 1 masih NOT STARTED — pembaruan bukan ranah WS-A) |
| 14 | `PHASE_STATUS.md` (update) | Status per fase berbasis bukti | Ada — idem |
| 15 | `DECISIONS.md` (update) | ADR baru bila ada keputusan disetujui owner | Ada (ADR-000..003) — idem |

**Aturan konsistensi:** dokumen ini tidak menetapkan isi artefak #1–#12 di atas; jika ditemukan konflik antara dokumen kontrol, konflik dilaporkan (lihat catatan akhir `PERSONAS_AND_JOURNEYS.md` dan laporan WS-A), bukan diselesaikan diam-diam (MC §14).

---

## 9. Catatan penutup

- Seluruh isi dokumen = TARGET STATE Phase 1; tidak ada pernyataan implementasi. Repository saat ini masih scaffold Next.js tanpa implementasi epicRider (`PHASE_0_AUDIT_REPORT.md` F0-001, `VERIFIED`).
- Keputusan kandidat baru hasil analisis WS-A (OD-120..OD-126) tercantum di akhir `PERSONAS_AND_JOURNEYS.md`, status `OPEN / OWNER APPROVAL REQUIRED`.
