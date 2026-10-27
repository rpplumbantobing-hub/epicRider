# PROMPT Z.AI — PHASE 1: DISCOVERY, REQUIREMENTS AND PRODUCT BASELINE

Peran Anda: lead product analyst, UX researcher, domain architect, security-aware systems analyst, dan QA strategist untuk epicRider.

**Phase 1 adalah fase penemuan dan spesifikasi. Jangan mulai coding fitur produksi, mengubah schema database, melakukan rewrite, atau menginstal framework baru.** Tujuannya memastikan kita memahami produk end-to-end dan memiliki baseline kebutuhan yang dapat diuji sebelum arsitektur rinci dan implementasi.

## Gate awal wajib
1. Baca `MASTER_CONTROL.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `PHASE_STATUS.md`, `REQUIREMENTS.md`, `LICENSE_MATRIX.md`, `SECURITY.md`, `TESTING.md`, `OPERATIONS.md`, `UX_UI_STANDARD.md`, `ISO_IMS_BLUEPRINT.md`, `DECISIONS.md`, `DATA_MODEL_CONCEPT.md`, dan laporan Phase 0.
2. Verifikasi bahwa Phase 0 punya evidence dan exit gate yang disetujui. Jika tidak, jangan menyatakan Phase 0 selesai atau melanjutkan secara diam-diam. Laporkan blocker dan pekerjaan yang masih diperlukan.
3. Cocokkan isi dokumen dengan repository aktual. Dokumen kontrol adalah arah target; kondisi kode harus dinyatakan secara terpisah sebagai actual state.
4. Tampilkan daftar dokumen yang berhasil dibaca dan file yang tidak ditemukan.

## Tujuan Phase 1
Menyusun baseline produk dan kebutuhan yang cukup jelas, konsisten, dapat diuji, dan bisa dipakai untuk Phase 2. Pisahkan:
- kebutuhan eksplisit pemilik;
- asumsi yang perlu validasi;
- usulan desain;
- keputusan yang belum disetujui;
- dependensi eksternal;
- risiko/blocker.

## Workstream wajib

### A. Product scope dan persona
Petakan persona dan tugas utama: pemilik workspace/solo operator, kru, event manager, rental/asset manager, finance/CRM, developer/store manager, administrator platform/support, auditor internal/eksternal, supplier/contractor, dan pelanggan bila relevan. Buat journey serta batas tanggung jawab antar persona.

### B. Tier/licensing
Susun matriks capability miniRider/maxRider/ISOrider; batas 5 kru miniRider; daftar extension; alur pembelian/perpanjangan/expiry/grace/downgrade; behavior data saat tier turun; pemisahan public License & Extension shop dengan in-app Equipment Store khusus miniRider. Tandai setiap aturan komersial yang membutuhkan keputusan pemilik. Jangan mengarang harga, pajak, renewal, quota, atau owner-seat semantics.

### C. Event lifecycle
Petakan inquiry/brief → technical rider → quotation/contract jika scope tier → planning/rundown → crew assignment → media kit → asset reservation/inspection/readiness → dispatch → event execution/chat/report → return/condition/maintenance → finance/customer feedback → evidence/lessons learned/CAPA. Jangan menganggap seluruh tahap tersedia di miniRider; tandai capability tier.

### D. Auth, workspace, authorization
Spesifikasikan WhatsApp request login dan Google OAuth/OIDC, account recovery, session lifecycle, workspace membership vs event assignment, role/permission, invitation, developer access dan auditor scope. Rancang failure/abuse cases, tetapi jangan memilih provider atau menyimpan credential tanpa keputusan.

### E. Developer Portal & notification
Tulis use cases developer untuk listing, media, stock, price, discount, publication, order/license integration, preview dan audit. Tentukan candidate roles serta audience model notifikasi (semua workspace, workspace pilihan, user pilihan/multi-user). Pisahkan hak mengelola toko dari hak broadcast global. Tandai siapa yang berwenang menyetujui broadcast, jenis notifikasi wajib/opsional, dan preference/opt-out sebagai keputusan yang harus divalidasi.

### F. hiRider
Modelkan profile/skill/portfolio, service offer, recruitment open/closed, application lifecycle, shortlist/accept/reject/withdraw, assignment ke event, visibility, privacy, abuse/reporting dan blocking. Jelaskan perbedaan lamaran, assignment, workspace membership dan hak akses.

### G. maxRider asset/rental
Definisikan lifecycle aset, QR/barcode identity, label printing, scanning web/mobile, inspection, check-in/out, dispatch/return, condition/damage, maintenance/calibration jika relevan, reservation conflict, readiness gates dan evidence. Tentukan kebutuhan mobile-camera permission, manual lookup fallback, audit trail, offline use/sync/conflict sebagai scope decision.

### H. ISOrider Integrated Management System
Bangun process map, bukan daftar formulir saja. Cakup quality; event sustainability; OH&S/HSE; environment; information security; business continuity; risk; supplier/contractor; competence/training; customer feedback; incident; controlled documentation; audit; NCR/CAPA; management review; continual improvement.
Verifikasi standar/edisi/amendment melalui sumber resmi sebelum mapping klausul. Pisahkan standard requirement, guidance, legal/regulatory obligations, dan praktik internal. Jangan menyalin teks berhak cipta. Buat standard register dengan source, edition/status, verified date dan owner.

### I. Controlled document library & evidence
Rinci hirarki configurable: policy/manual/process/SOP/work instruction/form/checklist/record/evidence/report. Tentukan metadata, ACL/classification, version, approval, effective/review date, retention, obsolete control, viewing/download, revision, access logs dan cross-links.
Petakan checklist execution, upload bukti, timestamps, actor, review/rework, sign-off pihak terkait, auditor view, immutability/amendment, retention dan export. Identifikasi kebutuhan signature dan legal review yang belum diputuskan.

### J. Sustainability
Definisikan KPI/data dictionary, unit, method/source, target, owner, baseline, reporting period, evidence, measured/estimated flag, data quality dan improvement action untuk energy, fuel, transport/travel, water, waste, material/reuse, supplier, GHG/carbon jika metode valid, accessibility, inclusion dan community/legacy. Jangan membuat klaim tanpa data.

### K. UI/UX dan channel strategy
Rancang information architecture, navigation, user flows dan design principles untuk desktop, tablet, mobile browser serta aplikasi Android/iOS. Windows delivery harus dianalisis. Tetapkan visual design system direction, typography/spacing/color/token/component principles, accessibility, loading/empty/error/success/offline/permission/expired states, usability criteria, mobile scanner flows dan i18n. Jangan membangun UI produksi pada Phase 1 kecuali pemilik secara eksplisit menyetujui prototype terpisah.

### L. Non-functional requirements
Kategorikan keamanan/privacy, performance, availability, scale, observability, auditability, backup/restore, retention, localization, data import/export, accessibility, mobile/offline, resilience, API compatibility, disaster recovery, support and operability. Jangan mengarang angka SLA/performance target; berikan rekomendasi bertanda PROPOSED dan jelaskan trade-off.

## Artefak yang wajib dihasilkan
1. `PRODUCT_SCOPE.md` — tujuan, batas produk, persona dan non-goals.
2. `PERSONAS_AND_JOURNEYS.md` — persona, journey, pain points, critical paths.
3. `REQUIREMENTS.md` — revisi requirement dengan ID unik, priority, rationale, acceptance criteria dan source.
4. `USE_CASES.md` — main flows dan failure/alternate flows.
5. `LICENSE_MATRIX.md` — tier/extension matrix dan open decisions.
6. `PROCESS_MAP.md` — event-to-cash/asset lifecycle dan IMS process map.
7. `STANDARD_REGISTER.md` — standards/editions/amendments/status/source/verified date; jangan memasukkan full copyrighted standard text.
8. `DOCUMENT_EVIDENCE_MODEL.md` — hirarki dokumen, ACL, lifecycle, evidence, approval/signature dan auditor traceability.
9. `UX_REQUIREMENTS.md` — information architecture, critical flows, responsive/mobile requirements, accessibility and UX acceptance.
10. `NON_FUNCTIONAL_REQUIREMENTS.md` — NFR, measurement approach, proposed targets marked as proposed.
11. `RISK_REGISTER.md` — risk, probability/impact, mitigation, owner, trigger, status.
12. `OPEN_DECISIONS.md` — decision, options, impact, recommendation, owner approval required.
13. `TRACEABILITY_MATRIX.md` — requirement → persona/use case → acceptance test → planned phase.
14. `PHASE_1_REPORT.md` — summary, changed docs, conflicts, unanswered questions, limitations, test status (normally no product code tests because phase is documentation-only), exit assessment.
15. Update `ROADMAP.md`, `PHASE_STATUS.md` dan `DECISIONS.md` hanya bila perubahan didukung bukti/keputusan; jangan mengubah keputusan APPROVED diam-diam.

## Aturan kualitas dan anti-halusinasi
- Tiap requirement memiliki ID stabil, source, priority, measurable acceptance criteria dan dependencies.
- Gunakan status `VERIFIED`, `PROPOSED`, `OPEN`, `BLOCKED`, `NOT TESTED` dengan arti jelas.
- Jangan menyatakan user research dilakukan bila tidak ada partisipan; gunakan desk analysis dan tandai keterbatasan.
- Jangan menyatakan standar terbaru tanpa official source dan tanggal verifikasi.
- Jangan mengklaim compliance, certification, security, performance atau usability tanpa bukti.
- Jangan mengarang provider integrations, prices, legal terms, thresholds, SLA atau business rules.
- Jika ada ambiguitas, tulis opsi, konsekuensi dan rekomendasi; jangan diam-diam memutuskan.
- Dokumen harus konsisten satu sama lain; jalankan automated link/consistency check bila alat tersedia, lalu laporkan apa yang benar-benar dijalankan.
- Jangan mengubah kode aplikasi atau database dalam fase ini.

## Exit criteria Phase 1
Phase 1 hanya layak direkomendasikan selesai jika:
1. Semua artefak wajib tersedia dan saling konsisten.
2. Critical user journeys tiap tier telah dipetakan.
3. Setiap requirement prioritas tinggi punya acceptance criteria dan planned phase.
4. Lisensi, tenancy, authentication, notifications, docs/evidence, asset scanning, IMS/sustainability, mobile/web dan UX telah tercakup.
5. Semua keputusan yang memerlukan pemilik diberi label OPEN/OWNER APPROVAL REQUIRED.
6. Standar yang akan dimapping memiliki register dan sumber resmi.
7. Tidak ada konflik besar yang tersembunyi.
8. Pemilik produk diberi ringkasan keputusan yang perlu disetujui sebelum Phase 2.

Akhiri dengan laporan yang jujur dan ringkas: apa yang dibuat, apa yang belum dapat dipastikan, keputusan apa yang diperlukan, serta apakah Phase 1 `DONE`, `PARTIAL`, atau `BLOCKED`. Jangan otomatis mulai Phase 2.
