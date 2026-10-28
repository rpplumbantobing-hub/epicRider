# PROMPT Z.AI — epicRider PHASE 4 (GATED)
## Identity, Authentication, Workspace/Tenant, Membership, Roles & Permissions

Anda bertindak sebagai Principal Engineer, Identity/Security Architect, Backend Engineer, Data Engineer, QA Lead, dan technical governance lead untuk epicRider.

**Tujuan:** lanjutkan epicRider ke Phase 4 dengan arah yang konsisten terhadap Master Control terbaru. Sebelum implementasi Phase 4, Anda WAJIB menjalankan control reconciliation dan `PRE_PHASE_4_GATE`. Jika gate belum lulus, lakukan remediasi prasyarat yang aman dan dapat dibuktikan, lalu **BERHENTI tanpa mengimplementasikan fitur Phase 4** bila masih ada blocker wajib. Jangan melewati gate hanya agar fase terlihat maju.

Ini bukan izin untuk rewrite proyek dari nol.

---

# 0. BAHAN WAJIB DAN URUTAN OTORITAS

Baca dari lampiran dan repository aktual, bukan berdasarkan ingatan atau hanya nama file:

1. `MASTER_CONTROL_epicRider_2026-10-28.md` — Master Control terbaru yang dilampirkan owner.
2. `OBSOLETE_AND_SUPERSEDED_REGISTER.md` — daftar obsolete/superseded yang dilampirkan owner.
3. Repository/TAR terbaru yang dilampirkan.
4. `ROADMAP.md`, `PHASE_STATUS.md`, `CONTROL_BASELINE_REGISTER.md`, `CONTROL_REFERENCE_CROSSWALK.md`, `CONTROL_CONSISTENCY_MATRIX.md`.
5. `REQUIREMENTS.md`, `OPEN_DECISIONS.md`, `DECISIONS.md`, `ADR_REGISTER.md`, seluruh ADR yang relevan.
6. `ARCHITECTURE.md`, `DATA_MODEL_CONCEPT.md`, `AUTHORIZATION_MODEL.md`, `ENTITLEMENT_MODEL.md`, `API_ARCHITECTURE.md`, `THREAT_MODEL.md`, `SECURITY.md`, `TESTING.md`, `LICENSE_MATRIX.md`, `PRODUCT_SCOPE.md`.
7. `PHASE_2_ACCEPTANCE.md`, `PHASE_2_REPORT.md`, `PHASE_2_CONSISTENCY_REMEDIATION_REPORT.md`, `PHASE_2_TRACEABILITY.md`, `PHASE_3_ACCEPTANCE.md`, `PHASE_3_REPORT.md`, `PHASE_3_REMEDIATION_REPORT.md`, `PHASE_3_TRACEABILITY.md`, `HANDOFF.md`, serta bukti `audit/phase3-remediation/`.
8. Dokumen Phase 1: `PERSONAS_AND_JOURNEYS.md`, `USE_CASES.md`, `PROCESS_MAP.md`, `NON_FUNCTIONAL_REQUIREMENTS.md`, `RISK_REGISTER.md`, `TRACEABILITY_MATRIX.md`, `UX_REQUIREMENTS.md`, `UX_UI_STANDARD.md`.

Jika ada nama/path yang berbeda, temukan file ekuivalennya dan catat path aktual. Jangan menyatakan telah membaca file yang tidak tersedia.

## Otoritas kanonik

1. Instruksi owner eksplisit terbaru dan lampiran Master Control/Obsolete Register terbaru.
2. Keputusan owner yang `ACCEPTED` dan belum disupersede.
3. Dokumen kontrol kanonik aktif setelah direkonsiliasi dan tercatat di `CONTROL_BASELINE_REGISTER.md`.
4. Requirement Phase 1/2 dengan ID tetap.
5. Model arsitektur dan ADR yang tidak bertentangan dengan kontrol terbaru.
6. Laporan audit sebagai bukti temuan untuk diverifikasi, bukan bukti otomatis bahwa temuan sudah selesai.
7. Repository adalah bukti `CURRENT STATE`, bukan otoritas untuk mengubah scope produk secara diam-diam.
8. File dalam `upload/` dan `audit/superseded/` adalah input/history kecuali explicitly reinstated; tidak boleh mengalahkan kontrol terbaru.

`MASTER_CONTROL.md` mengatur aturan stabil; **`ROADMAP.md` adalah satu-satunya sumber status fase berjalan**. `PHASE_STATUS.md` dan `HANDOFF.md` wajib mencerminkan status yang sama.

---

# 1. STAGE A — FORENSIC PREFLIGHT DAN CONTROL RECONCILIATION

Sebelum mengubah kode, catat:

- commit HEAD, branch, `git status --short`, daftar remote (jangan menambahkan remote tanpa izin),
- file root yang modified/untracked/deleted,
- status Git `.env` dan `.env.example` tanpa mencetak nilai rahasia,
- file `PRE_PHASE_4_GATE.md` apakah ada,
- status artefak dan hasil test/build/CI yang benar-benar tersedia.

**JANGAN** menjalankan `git reset --hard`, `git clean`, menghapus file modified, menimpa perubahan pengguna, atau `git add -A`/commit massal. Snapshot yang diterima memiliki perubahan working tree pada sejumlah berkas infrastruktur, upload dan kontrol; klasifikasikan tiap kelompok dan pertahankan perubahan yang tidak secara eksplisit menjadi scope tugas. Jika perubahan pra-ada menghalangi pekerjaan, catat dan minta pemisahan yang aman; jangan buang perubahan untuk membuat working tree bersih.

Buat/update `PHASE_4_ENTRY_AUDIT.md` yang membedakan fakta, klaim laporan sebelumnya, dan hasil verifikasi terbaru.

## 1.1 Sinkronkan Master Control terbaru

- Bandingkan isi root `MASTER_CONTROL.md` dengan lampiran terbaru `MASTER_CONTROL_epicRider_2026-10-28.md`. Dalam snapshot yang diaudit, root Master Control masih lebih tua/berbeda; antara lain ia tidak konsisten menyatakan invariant `ServiceOffer != RecruitmentOpening`.
- Jadikan lampiran terbaru sebagai isi kanonik `MASTER_CONTROL.md`, sambil memindahkan aturan tambahan yang tidak bertentangan ke dokumen pendukung yang tepat sebelum menghapus/menyupersede teks lama.
- Tambahkan `OBSOLETE_AND_SUPERSEDED_REGISTER.md` ke root dari lampiran terbaru dan masukkan ke `CONTROL_BASELINE_REGISTER.md`.
- Perbarui `CONTROL_BASELINE_REGISTER.md` agar tidak lagi menganggap Master Control dan register obsolete terbaru sebagai file yang tidak ada atau hanya input lama. Tetapkan satu baseline aktif dan jelaskan status `upload/` sebagai history/input.
- Pastikan `MASTER_CONTROL.md` tidak memuat status fase dinamis.
- Buat `CONTROL_REFERENCE_CROSSWALK.md` atau perbarui yang ada agar referensi numerik lama `MC §N` tidak ditafsirkan menggunakan penomoran baru.
- Jangan menghapus laporan historis atau mengubah teks bukti lama seolah tidak pernah ada; tambahkan amendemen/cross-reference.

## 1.2 Konflik yang sudah diketahui — verifikasi dan perbaiki

### A. Phase 2/3/4 status

Lampiran `OBSOLETE_AND_SUPERSEDED_REGISTER.md` menyatakan status terbaru yang berlaku: Phase 2 `PARTIAL`, Phase 3 `PARTIAL`, Phase 4 `BLOCKED / NOT STARTED` sampai gate selesai. Akan tetapi `ROADMAP.md` dalam TAR masih menyebut Phase 2 `DONE`. Ini konflik nyata.

- Pertahankan Phase 2 = `PARTIAL` sampai butir Phase 2 gate di bawah ini terpenuhi dan evidence baru tersedia.
- Pertahankan Phase 3 = `PARTIAL` sampai build produksi dan workflow CI terbukti berjalan di runner yang sesuai. Jangan menaikkan ke `DONE` hanya karena lint/typecheck/test lulus.
- Phase 4 tetap `BLOCKED / NOT STARTED` selama `PRE_PHASE_4_GATE.md` belum lulus.
- Sinkronkan `ROADMAP.md`, `PHASE_STATUS.md`, `PHASE_2_ACCEPTANCE.md`, `PHASE_3_ACCEPTANCE.md`, laporan terkait dan `HANDOFF.md`. `ROADMAP.md` menentukan status aktual.

### B. Requirement ServiceOffer

Master Control terbaru menetapkan hiRider mencakup **penawaran jasa**. Jangan membuka kembali keputusan apakah service offering termasuk scope.

- Pertahankan `REQ-013` yang telah diamendemi sebagai requirement induk hiRider.
- Lampiran `OBSOLETE_AND_SUPERSEDED_REGISTER.md` menetapkan bahwa versi aktif **menambahkan `REQ-101`** untuk kriteria penerimaan penawaran jasa. Snapshot repository saat ini masih hanya memiliki `REQ-001..REQ-100` dan tidak mempunyai REQ-101. Tambahkan `REQ-101` dengan status `PROPOSED`, tanpa merubah/renumber REQ-001..REQ-100 dan tanpa menggandakan ID.
- `REQ-101` minimal mensyaratkan ServiceOffer berbeda dari RecruitmentOpening; ada ownership provider yang jelas, lifecycle/visibility yang dapat diotorisasi, inquiry/interest tidak menciptakan workspace membership atau event assignment, dan harga/pembayaran tidak dikarang.
- Perbarui `PHASE_2_TRACEABILITY.md`, `TRACEABILITY_MATRIX.md`, `CONTROL_CONSISTENCY_MATRIX.md` dan referensi terkait untuk mencakup REQ-101. Jangan mengklaim API/service-offer runtime sudah diimplementasikan; detail implementasi bisnis hiRider tetap sesuai Phase 16.
- Pastikan invariants: `hiRider != LicenseTier`; `ServiceOffer != RecruitmentOpening`; `Application != Workspace Membership`; `Application != Event Assignment`; `Acceptance != Automatic Workspace Access`.
- `OD-185` harus berstatus `SUPERSEDED/CLOSED BY BASELINE` sebagai pertanyaan scope, bukan `OPEN`. Pertahankan catatan historisnya.

### C. Tiga commerce surfaces

Snapshot telah memperbaiki `REQ-030`, tetapi traceability masih memiliki istilah **“two stores / two store entity families”** (antara lain di `PHASE_2_TRACEABILITY.md` dan `TRACEABILITY_MATRIX.md`). Perbaiki seluruh sisa referensi dua toko, lalu jalankan semantik scan.

Model wajib:
1. **License & Extension Shop** — jalur publik untuk pembelian lisensi pertama dan pembelian/perpanjangan lisensi/extension yang disetujui; tidak mensyaratkan pembeli sudah memiliki miniRider.
2. **Public Store** — produk developer, akses mensyaratkan lisensi basic miniRider.
3. **Developer Equipment Store** — store perlengkapan di dalam aplikasi; miniRider diizinkan, maxRider dan ISOrider ditolak server-side.

Jangan satukan domain, katalog, order intent, access rules, API, entitlement issuance, audit, atau acceptance tests ketiga surface ini. Fitur commerce produksi tidak termasuk Phase 4.

### D. Standard Register masih stale

Dalam snapshot `STANDARD_REGISTER.md` masih menyatakan bahwa status edisi ISO 9001:2026, ISO 14001:2026, dan ISO 19011:2026 tidak diketahui, sementara Master Control terbaru dan `OBSOLETE_AND_SUPERSEDED_REGISTER.md` secara eksplisit menyatakan pernyataan “unknown/unpublished” dari snapshot lama sudah obsolete berdasarkan pemeriksaan katalog tanggal 2026-10-28.

- Sinkronkan `STANDARD_REGISTER.md` dan `ISO_IMS_BLUEPRINT.md` dengan metadata bersumber dan tanggal yang ada di Master Control terbaru.
- Jika melakukan pemeriksaan baru, gunakan halaman katalog ISO resmi dan catat tanggal/URL. Jika akses baru tidak tersedia, jangan berpura-pura memverifikasi ulang; pertahankan tanggal sumber yang sudah ada dan tandai bahwa metadata tersebut berasal dari pemeriksaan 2026-10-28.
- Jangan mengklaim applicability, conformity, legal compliance atau certification. Isu ini bukan blocker khusus implementasi identity Phase 4 setelah metadata/control konsisten.

### E. Open decisions stale / tidak sinkron

Tinjau tanpa menghapus ID:
- `OD-116`: catatan lamanya menanyakan DATA_MODEL_CONCEPT yang belum ada. Dokumen itu sekarang ada, dan data model adalah output Phase 2, bukan prasyarat Phase 2. Tandai pertanyaan prasyarat lama `SUPERSEDED` atau tutup dengan bukti; jangan meninggalkan dua status yang kontradiktif.
- `OD-185`: scope penawaran jasa hiRider sudah ditetapkan oleh baseline/ADR-021; bukan pertanyaan owner aktif.
- `OD-04`: ADR-019 telah memutuskan penghapusan `ignoreBuildErrors` dan aktivasi strict mode; sisa pengetatan ESLint/TypeScript dapat tetap terbuka secara spesifik. Jangan tulis bahwa `ignoreBuildErrors: true` masih aktif tanpa bukti.
- `OD-12`: bandingkan dengan ADR-020 dan fondasi i18n yang sekarang ada; tutup/supersede hanya bagian yang benar-benar sudah diputuskan, tanpa mengarang bahasa tambahan.
- `OD-03`: WhatsApp provider tetap `OPEN`; ini hanya memblokir integrasi spesifik vendor, bukan seluruh Phase 4.
- `OD-115`: parameter sesi/perangkat tetap keputusan yang belum final. Nilai awal yang dibutuhkan untuk pengembangan harus dinyatakan `PROPOSED`, dilindungi konfigurasi dan tidak disebut keputusan owner.
- `OD-01`, `OD-02`, `OD-05`, `OD-06`, `OD-09`, `OD-109`, `OD-122` dan keputusan lain tetap open di ruang lingkupnya kecuali evidence/keputusan owner yang berlaku membuktikan sebaliknya.

### F. Current-state documents perlu diperbarui

`SECURITY.md` saat ini menyebut `ignoreBuildErrors: true` dan ketiadaan CI seolah current state, padahal ADR-019 mengubah konfigurasi dan CI workflow telah dibuat. Revisi audit `CURRENT STATE` berdasarkan file/config/evidence aktual:
- auth belum diimplementasikan;
- tenant authorization/entitlement runtime belum ada;
- CI workflow ada tetapi eksekusi remote belum terbukti;
- build produksi belum dijalankan menurut report Phase 3;
- `.env` sekarang tidak ter-track pada Git index; `.env.example` tersedia/ter-track dalam snapshot.

Perbarui bagian current-state di `ARCHITECTURE.md`, `SECURITY.md`, `TESTING.md`, `README.md`, `HANDOFF.md` dan laporan yang relevan, tanpa mengubah fakta historical Phase 0 di dalam laporan audit lama.

### G. Repository/archive safety dan perubahan pra-ada

- `.env` tidak ada di TAR yang diterima dan `git ls-files .env` tidak menemukannya; `.env.example` ada dan ter-track. Verifikasi ulang dengan command aktual sebelum menyatakan gate lulus.
- Snapshot masih memuat `db/custom.db` dan memiliki perubahan working tree pra-ada. Jangan menghapus atau reset database/file modified sebagai jalan pintas. Jangan masukkan `.env`, data database atau seluruh folder `upload/` dalam arsip keluaran baru tanpa review eksplisit.
- Jangan mencetak nilai environment, token, database records atau secrets ke terminal/report.

## 1.3 Buat dan jalankan PRE_PHASE_4_GATE

File `PRE_PHASE_4_GATE.md` tidak ada dalam TAR saat audit. Buat di root sebelum memulai Phase 4. Gate minimal harus memeriksa:

1. Canonical control terbaru terpasang dan terdaftar; Obsolete Register terpasang.
2. `ROADMAP`/`PHASE_STATUS` sinkron: Phase 2 dan 3 `PARTIAL`, Phase 4 `BLOCKED/NOT STARTED` sampai gate lulus.
3. REQ-001..REQ-100 tetap utuh, REQ-101 ada satu kali, REQ-030 mendeskripsikan tiga surface.
4. ServiceOffer berada dalam scope dan terpetakan ke requirement/model/domain/security/API/test sebagai target-state; tidak diklaim implemented.
5. Tidak ada active traceability statement yang masih mengatakan “two stores”.
6. `STANDARD_REGISTER`/`ISO_IMS_BLUEPRINT` tidak bertentangan dengan Master Control terbaru.
7. `.env` tidak ter-track, `.env.example` placeholder-only dan ter-track; secret scan aman.
8. Build produksi berjalan pada runner/working copy terisolasi dengan log dan exit code nyata.
9. Workflow CI benar-benar berjalan pada runner yang sesuai (remote CI atau runner setara yang menjalankan workflow aktual), dengan log/exit code. Menjalankan hanya lint/typecheck/test manual tidak sama dengan menjalankan workflow CI.
10. Hasil diff, requirement integrity dan semantic contradiction scan reproduktif di snapshot final.
11. Semua perubahan working tree pra-ada diklasifikasikan dan dipertahankan.

**Gate rule:** jika build atau workflow CI masih `NOT TESTED/BLOCKED`, atau ada konflik prioritas tinggi, Phase 4 tidak boleh dinyatakan mulai/diimplementasikan. Selesaikan pekerjaan remediasi yang aman; buat `PRE_PHASE_4_GATE_REPORT.md` berisi hasil PASS/FAIL/BLOCKED dan berhenti di situ. Jangan melompati gate karena tidak tersedia Git remote. Gunakan runner yang sah jika tersedia; jangan mengarang remote atau hasil CI.

---

# 2. STAGE B — PHASE 4 ENTRY DECISION

Setelah Stage A selesai, putuskan secara eksplisit:

- **Jika PRE_PHASE_4_GATE = PASS:** lanjutkan Stage C dan implementasi Phase 4 dalam sesi ini.
- **Jika PRE_PHASE_4_GATE = PASS WITH CONDITIONS:** lanjutkan hanya jika semua kondisi yang tersisa dinyatakan non-blocking oleh gate dan tidak melanggar aturan status/latest control. Catat kondisi dan owner action.
- **Jika BLOCKED/FAIL/NOT ASSESSED:** jangan implementasikan Phase 4. Selesaikan hanya remediasi prasyarat non-destruktif, laporkan tepat apa yang perlu dilakukan owner/runner, dan berhenti.

Phase 4 tidak boleh berstatus `DONE` jika integrasi provider produksi belum diuji, migrasi belum aman, atau acceptance mandatory belum terpenuhi. Provider-specific WhatsApp tidak harus membuat semua Phase 4 blocked setelah fase secara sah dimulai, tetapi bagian itu harus ditandai blocked terpisah.

---

# 3. PHASE 4 OBJECTIVE (HANYA SETELAH GATE PASS)

Bangun fondasi runtime yang aman untuk:

1. Global user identity dan authentication abstraction.
2. Session lifecycle: sign-in, sign-out, expiry, revocation sesuai keputusan yang tercatat.
3. Google OAuth 2.0 / OIDC integration path yang aman dan dapat diuji.
4. WhatsApp proof-of-control abstraction, tanpa vendor production sebelum OD-03 diputuskan.
5. Workspace/tenant create, list, membership, invitation, accepted/revoked/expired states.
6. Workspace role and permission enforcement server-side.
7. Secure workspace switching and tenant-scoped data access.
8. Minimal audit/security events for authentication, membership, invitations and permission-sensitive mutations.
9. UI flow yang terlokalisasi Bahasa Indonesia/Inggris dan mengikuti design system Phase 3.
10. Tests untuk positive paths, denial paths, tenancy isolation, account linking dan token/session abuse.

Phase 4 BUKAN fase untuk membangun semua modul bisnis. Tidak membangun fitur licensing/checkout (Phase 5/22), event UI (Phase 6), asset/rider (Phase 7+), hiRider ServiceOffer UI/workflow (Phase 16), IMS (Phase 17+) atau mobile native delivery (Phase 23).

---

# 4. CURRENT STACK AND CHANGE CONTROL

Current repository snapshot shows Next.js 16 App Router, React 19, TypeScript 5, Bun, Prisma 6 and SQLite as a local/sandbox datasource; `next-auth` v4 is present but no authentication route/runtime is implemented. Existing route `/api` is a demo route. Existing `src/lib/db.ts`, i18n files, design tokens, foundation components, tests and CI workflow must be reviewed and reused.

Before choosing auth implementation:

1. Verify the actual installed versions and compatibility of Next.js, `next-auth`, Prisma adapter and React from the lockfile/package metadata and official docs available to the environment.
2. Reuse existing dependencies if they are compatible. Do not silently replace NextAuth/Auth.js, router, database ORM, package manager or stack.
3. If existing auth library/version is incompatible or insecure for the target, prepare an ADR with options, risks, migrations and rollback; do not make an unrecorded replacement.
4. No production database has been selected (OD-01). The present SQLite configuration is a local/sandbox state, not a production decision.
5. If the current SQLite environment is usable and safe for development, migrations may be authored/tested against a disposable copy or backup. Do not run `db:push --accept-data-loss`, `db:reset`, destructive migration, or delete `db/custom.db`. Never change production database choice by implication.
6. Inspect the existing working tree before edits. Do not discard user changes, `upload/`, tool scripts or unstaged files.

---

# 5. IDENTITY AND AUTHENTICATION DESIGN

## 5.1 Domain separation

Keep separate concepts:

- `User` / global identity;
- external provider account (`Account` or equivalent);
- `Session` / session state;
- verification challenge/token;
- workspace;
- workspace membership;
- workspace role/permission assignment;
- invitation;
- event assignment (separate domain; Phase 4 may model reference only if necessary).

Do not use email as the sole primary key. Provider account linking must prevent account takeover. Do not automatically link accounts solely because an unverified provider returns the same email. Treat provider-verified email, explicit confirmation and current session as security signals and document the chosen policy.

Use the selected supported auth framework's secure OAuth/OIDC, state, nonce, PKCE where applicable, callback/redirect validation, signature/issuer/audience/expiry checks, session cookies and CSRF protections rather than reimplementing cryptographic protocol validation manually.

## 5.2 Google OAuth/OIDC

- Implement/configure the Google OIDC path if library/provider versions and available environment support it.
- Use environment variable names and placeholders only; never create or commit client secret values.
- Missing credentials must produce a clear safe configuration state, not a fake login or production bypass.
- Unit/integration tests may use controlled mocks/test providers only in test mode. Do not describe mock login as production Google sign-in.
- If real provider credentials are unavailable, mark the real round-trip `NOT TESTED`, while testing redirect/callback/session logic with controlled tests where possible.

## 5.3 WhatsApp authentication

- Implement a provider-neutral interface and workflow boundary for phone-number proof-of-control: one-time challenge, expiry, attempt limits/rate limits, replay prevention, anti-abuse, audit and recovery/fallback boundaries.
- OD-03 vendor/provider remains `OPEN`. Do not choose vendor, create credentials, simulate successful OTP in production or expose OTP in response/logs.
- Test-only fake delivery is allowed only in test environment and must not be enabled in production.
- Do not state WhatsApp login is production-ready until a provider is selected, credentials are configured safely and provider-specific tests are evidenced.

## 5.4 Session lifecycle and OD-115

Implement sign-in/sign-out and server-side session validity/revocation as supported by the chosen framework. Session policy parameters in OD-115 remain `OPEN`; defaults introduced for tests/development must be marked `PROPOSED`, centralized and configurable. Do not claim owner approval for maximum session count, idle timeout or device-wide logout behavior unless an accepted decision exists.

## 5.5 Recovery and anti-abuse

- Avoid account enumeration in public-facing responses.
- Rate-limit sensitive attempts and record audit/security events without logging tokens, OTP, passwords, cookies or secrets.
- Protect one-time token/challenge consumption against replay and concurrent double consumption.
- Recovery must not bypass proof of account ownership or account-linking checks.
- Document any provider-dependent behavior still blocked by OD-03.

---

# 6. WORKSPACE, TENANT, MEMBERSHIP, INVITATION AND PERMISSIONS

## 6.1 Workspace and membership

- A global user can belong to multiple workspaces and may have different permissions in each.
- Workspace membership is a distinct relationship with explicit status/lifecycle and audit history.
- Creating a workspace must create its initial owner/creator membership through one consistent transaction or equivalent safe flow.
- Do not equate a login session with workspace membership.
- Do not equate membership with event assignment.
- Do not enforce seat quota or decide whether the owner consumes a seat; OD-05 belongs to Phase 5 quota/billing. Phase 4 may create memberships without final paid-seat enforcement, while clearly marking that enforcement as not implemented.

## 6.2 Invitation

Implement a secure invite lifecycle suited to the approved model:
- token generated with cryptographically secure randomness;
- only a hash or non-recoverable verifier stored where feasible;
- workspace and offered role bound server-side;
- expiry and revocation;
- one-time atomic consumption;
- invitation actor/recipient/created/accepted/revoked/expired timestamps audited;
- only a suitably authorized member can create/revoke invites or assign a role;
- accepting an invitation requires an authenticated identity consistent with invite policy; do not let URL possession alone override identity checks.

Use statuses/lifecycle as `PROPOSED` if not yet owner-approved. Do not invent invitation expiry duration as an accepted business rule; use a centralized configurable proposal.

## 6.3 Roles and permissions

- Follow `AUTHORIZATION_MODEL.md` and ADR-010 as the target policy baseline, but preserve their recorded `PROPOSED` status pending owner ratification.
- Build a central server-side authorization service/policy layer. Deny by default; return a controlled reason code without exposing sensitive details.
- Every protected page, server action, route handler, and database mutation must enforce authorization at the relevant server/domain boundary. Middleware/UI visibility alone is insufficient.
- Role assignments must be workspace-scoped where applicable. Platform/developer roles and future auditor grants must remain separate from workspace roles.
- OD-122 (default role presets) remains open: implement the smallest role/permission model needed for this phase and mark defaults `PROPOSED`; do not silently establish a final role catalog for every tier.
- Do not implement dynamic role editor/advanced workflow UI allocated to later phases.
- Keep capability/entitlement checks behind a clean interface, but do not invent runtime license states. Phase 5 owns license lifecycle; until implemented, protected tier features must not be treated as authorized merely because a user is authenticated.

## 6.4 Tenant isolation

For each workspace-scoped read/write:
- derive authorized workspace scope from the authenticated principal and membership—not blindly trust a request body/query parameter;
- validate workspace/resource ownership before lookup or mutation;
- ensure list/search/export/count/error paths cannot leak cross-tenant existence/data;
- ensure IDs guessed from another tenant do not authorize access;
- keep object-level checks and transactional changes consistent under concurrent membership revocation.

Required negative tests: no session, wrong workspace, no membership, removed/suspended membership, insufficient permission, wrong resource owner, revoked/expired invitation, replayed invitation, user trying to escalate own role, and user with no event assignment attempting any future event-scoped resource access.

---

# 7. DATA, MIGRATIONS AND AUDIT

1. Review current `prisma/schema.prisma`, existing demo `User`/`Post` models, current datasource and `src/lib/db.ts` before changing schema.
2. Propose a logical schema for identity/accounts/sessions/workspaces/memberships/invitations/role assignments/audit records as required by the selected adapter.
3. Keep production database choice OPEN under OD-01. Do not claim SQLite is the production database.
4. Avoid dropping demo models/data simply to clean the schema. If removing or changing `Post`/old `User` is justified, use a safe migration with clear reason, backup/rollback and a decision record.
5. Never use `db:push --accept-data-loss` or `db:reset` against the current database. Use controlled Prisma migration procedures on an isolated/disposable database, verify the generated SQL/steps, and preserve backup/recovery steps.
6. All important auth, membership, role and invite mutations must generate auditable events appropriate to risk. Never put tokens, passwords, OTPs or session cookies in audit payloads.
7. Sensitive data, provider tokens and auth secrets must not be logged or exposed in client bundles.

---

# 8. PHASE 4 UI/UX AND I18N

Reuse Phase 3 design tokens/components and existing `src/i18n/` infrastructure. Do not create a second design system or i18n mechanism.

Build only the screens needed for this phase, such as:
- sign-in/continue screen with available provider states;
- safe error / configuration-not-ready state;
- workspace list and workspace switcher;
- workspace create flow;
- member list and invitation form/status;
- access-denied and session-expired states;
- minimal profile/session management required by Phase 4.

Every new visible string, error, validation state, status and button label must use locales `id` and `en`. Keep dictionary parity. UI states must cover loading, empty, validation error, authentication error, success, permission denied, expired/revoked invite, provider-not-configured and session-expired where relevant. No fake controls, fake active members, fabricated login success or unconnected buttons.

Responsive desktop/tablet/mobile browser behavior, keyboard/focus and accessible names are mandatory. Document the checks actually performed. Screenshots are visual evidence only, not proof of auth or tenant isolation.

---

# 9. PHASE 4 TESTS AND SECURITY ACCEPTANCE

Create meaningful tests at unit/integration/API/component level as supported by the repository. A mock-only suite does not prove production provider integration.

Mandatory cases include:

### Authentication/session
- unauthenticated request to protected page/API is denied or redirected safely;
- logout invalidates/revokes server-side access according to the chosen session model;
- expired/invalid session is denied;
- OAuth state/nonce/redirect/callback errors are handled safely using the selected library's verified mechanisms;
- unsafe account linking is rejected;
- unknown/missing provider credentials do not silently enable fake authentication;
- OTP expiry/replay/rate limit/attempt abuse tests run against provider abstraction; provider-specific behavior remains blocked until OD-03 closes.

### Workspace/permission/tenant
- authorized creator creates workspace and receives the correct initial membership;
- user sees only their own workspaces;
- cross-tenant read/write is denied server-side;
- membership revocation takes effect on the next protected request;
- role escalation is denied;
- invitation can be accepted once, and expired/revoked/replayed/wrong-recipient invitation is denied;
- user without membership cannot access workspace data;
- member without a separate event assignment cannot access event-scoped data when a test fixture/route exists;
- platform/developer roles cannot be mistaken for workspace roles.

### Integrity and regressions
- migrations run on an isolated test database and preserve pre-existing schema/data assumptions;
- `REQ-001..REQ-100` remain present; `REQ-101` is present once; requirement traceability remains consistent;
- all current Phase 3 i18n/design-system tests continue passing;
- no secrets appear in test outputs or report;
- lint, typecheck, tests and build/CI gates are recorded with exact command, environment and exit code.

No test result may be fabricated. Record `NOT TESTED` or `BLOCKED` for unavailable provider credentials, inaccessible remote CI or unsupported sandbox operations.

---

# 10. SCOPE AND DECISION BOUNDARIES

Do not decide silently:
- WhatsApp vendor/provider (OD-03);
- production DB (OD-01);
- final mobile/native/Windows strategy (OD-02);
- owner seat counting/quota/billing (OD-05);
- production payment values/gateway/tax/refunds (OD-06);
- session maximum/idle timeout/force logout policy (OD-115);
- final default workspace role presets (OD-122);
- legal applicability or electronic signature validity (OD-09/OD-103);
- hiRider service-offer commercial terms (Phase 16 and applicable owner decisions).

These decisions may block only the specific dependent sub-scope. Do not use OD-03 to block all identity architecture, and do not invent a provider to make a demo pass.

Do not implement licensing lifecycle (Phase 5), event/product modules (Phase 6+), hiRider service/recruitment runtime (Phase 16), commerce production (Phase 11/22), IMS (Phase 17+) or mobile client delivery (Phase 23) in Phase 4.

---

# 11. REQUIRED FILES AND TRACEABILITY

Create/update as needed without duplicating files:

### Mandatory entry/control files
- `MASTER_CONTROL.md` — synchronized with the latest attached Master Control.
- `OBSOLETE_AND_SUPERSEDED_REGISTER.md` — copied/synchronized from latest attached file.
- `CONTROL_BASELINE_REGISTER.md` — updated authority and active/superseded file paths.
- `CONTROL_REFERENCE_CROSSWALK.md` — updated legacy references.
- `PRE_PHASE_4_GATE.md` and `PRE_PHASE_4_GATE_REPORT.md`.
- `PHASE_4_ENTRY_AUDIT.md`.
- `ROADMAP.md`, `PHASE_STATUS.md`, `HANDOFF.md`.
- `REQUIREMENTS.md` (REQ-101 added without ID reuse), `REQUIREMENTS_CHANGELOG.md` if present, `PHASE_2_TRACEABILITY.md`, `TRACEABILITY_MATRIX.md`, `CONTROL_CONSISTENCY_MATRIX.md`.
- `STANDARD_REGISTER.md`, `ISO_IMS_BLUEPRINT.md` if outdated relative to the latest Master Control.
- Current-state sections in `ARCHITECTURE.md`, `SECURITY.md`, `TESTING.md`, `README.md`.

### Phase 4 implementation artifacts (only after gate passes)
- identity/auth architecture or updated ADR for the exact auth implementation;
- schema/migration and documented rollback if needed;
- auth provider config using environment variable names only;
- session, workspace, membership, invitation and authorization services;
- protected route/API/server actions;
- localized UI for the actual Phase 4 flows;
- relevant unit/integration/API/component tests;
- `PHASE_4_ACCEPTANCE.md`, `PHASE_4_TRACEABILITY.md`, `PHASE_4_REPORT.md`, updated `HANDOFF.md`.

Traceability must include at least:
`REQ-021/022/025/026/047/048/049/050/051/052/054 → use cases → identity/workspace model → API/service → authorization control → test evidence`.
Preserve every existing requirement and decision ID. Do not renumber IDs if REQ-101 already exists in an updated working tree; detect it first and avoid duplicates.

---

# 12. DEFINITION OF DONE — PHASE 4

Phase 4 may be `DONE` only when:

1. `PRE_PHASE_4_GATE` has a recorded PASS with evidence.
2. One active control baseline is registered and there are no active high-priority control contradictions.
3. Auth/session services use a supported, documented library and safe configuration; no fake production auth exists.
4. Google OIDC path is implemented and tested to the extent possible; missing real credentials are marked `NOT TESTED`, never falsely `VERIFIED`.
5. WhatsApp provider abstraction and tests exist; vendor-specific production integration remains separately blocked if OD-03 is still OPEN.
6. Workspace/tenant/membership/invitation model and safe lifecycle are implemented with controlled migrations.
7. Central server-side authorization is enforced across protected APIs/actions/data paths.
8. Cross-tenant and privilege-escalation negative tests pass.
9. Membership, role, event assignment and entitlement remain separate concepts.
10. Session parameters and role defaults marked OPEN remain explicitly `PROPOSED` and configurable.
11. `REQ-001..REQ-100` and REQ-101 remain intact and traceable; REQ-030 describes three commerce surfaces.
12. Indonesian/English localization and complete UI states work for Phase 4 screens.
13. Lint/typecheck/tests/build and relevant CI checks are run and reported honestly; blocked gates remain blocked.
14. No secret, environment value or database content is exposed in repository output/artifacts.
15. `ROADMAP.md`, `PHASE_STATUS.md`, Phase 4 acceptance/report and `HANDOFF.md` agree on final status and limitations.
16. No Phase 5 or later product features are silently implemented.

If any mandatory criterion fails, use `PARTIAL` or `BLOCKED`, not `DONE`.

---

# 13. REQUIRED FINAL RESPONSE FROM Z.AI

Return the following, with specific file paths and evidence:

1. **Gate verdict first:** `PASS`, `PASS WITH CONDITIONS`, `BLOCKED`, or `NOT ASSESSED` for `PRE_PHASE_4_GATE`.
2. Reconciliation matrix for each discrepancy found in Stage A, including the attached master/register conflicts listed above.
3. Before/after `ROADMAP.md` statuses with rationale and evidence.
4. Git pre-state and final state, including all pre-existing modified/untracked files preserved and classified; do not print secrets.
5. Exact commands, environment, exit codes, logs and tests run.
6. Phase 4 changed files and implemented flows only if the gate passed.
7. Remaining owner decisions: OD-01/02/03/05/06/09/115/122 and any other truly open item, with only the specific sub-scope each blocks.
8. Requirement integrity: table count, unique IDs, REQ-001..REQ-100 preserved, REQ-101 once, no duplicates.
9. Semantic contradiction scan result from the final snapshot, with scope, command/script, output path and exclusions.
10. Security note: `.env` index status, `.env.example` status, `db/custom.db` handling and secret scan result—without showing any value.
11. Updated `HANDOFF.md`.
12. Explicit statement: **Phase 4 started or not started**, and why. Do not claim Phase 4 started if the gate did not pass.

## Final execution rule

Start by reading/inventorying inputs. Perform Stage A, then Gate A. Only if the entry gate passes may you proceed to Phase 4 implementation. If a gate cannot be proven because the environment lacks a required runner/remote/provider, do not fake proof: leave the affected status honest, complete only safe independent remediation, and stop at the gate with a precise owner action list. Do not start Phase 5 automatically.
