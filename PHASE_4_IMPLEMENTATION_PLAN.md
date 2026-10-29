# PHASE 4 IMPLEMENTATION PLAN — epicRider

> **Status dokumen:** Implementation plan (Gate B) + execution log. Dibuat di worktree terisolasi
> dari canonical baseline `b5defc22dbb634b25af98083cc9b969eb4b1f0a2` sebelum implementasi dimulai.
> Sumber otoritas: `MASTER_CONTROL.md` (MC-V4), `REQUIREMENTS.md`, ADR-008/009/010/017/020,
> `AUTHORIZATION_MODEL.md`, `DATA_MODEL_CONCEPT.md`, `API_ARCHITECTURE.md`, `SECURITY.md`,
> prompt Phase 4 final (2026-10-28) + gated prompt Stage B/C.

---

## 1. Preflight & Gate A — hasil

| Check | Hasil | Bukti |
|---|---|---|
| Remote canonical dapat dijangkau; `main` = `b5defc22` | PASS | `git ls-remote canonical refs/heads/main` → `b5defc22…` (2026-10-28) |
| Worktree terisolasi dari exact commit | PASS | `/home/z/epicRider-phase4-b5defc22`, HEAD = `b5defc22`, detached, bersih (0 perubahan), tree `e645b33e…` = canonical |
| Tanpa delivery-surface workspace lama | PASS | `src/app/api/` hanya `route.ts`; `src/components/` hanya `foundation`+`ui`; `page.tsx` = versi canonical (tanpa kartu delivery) |
| Governance invariants dari canonical tree | PASS | `PRE_PHASE_4_GATE = PASS`; Phase 4 = `AUTHORIZED / READY TO START`; Phase 2 = PARTIAL; Phase 3 = PARTIAL (dibaca dari blob canonical) |
| REQ integrity | PASS | 101 baris REQ; REQ-101 tepat 1 baris tabel (+4 catatan teks); REQ-001..100 utuh |
| REQ-030 tiga commerce surfaces | PASS | License & Extension Shop, Public Store, Developer Equipment Store (terverifikasi di baris REQ-030) |
| `ServiceOffer != RecruitmentOpening`; implementasi tetap Phase 16 | PASS | REQ-101 + MC §2.2 — TIDAK diimplementasikan di Phase 4 |
| `.env` tidak ter-track; `.env.example` placeholder | PASS | `git ls-files` = 0 untuk `.env`; `.gitignore` `\.env*` + `!.env.example` |
| Stack terverifikasi dari worktree | PASS | Next 16.1.1, React 19, TS 5, Prisma 6.11.1 (SQLite), Vitest 3, ESLint 9, Tailwind 4, `next-auth ^4.24.11` (ada, belum terimplementasi) |
| Schema saat ini | SCAFFOLD | `prisma/schema.prisma` = demo `User`(email)+`Post` bawaan template — bukan domain epicRider (sesuai SECURITY.md current state) |
| Prisma migrations saat ini | TIDAK ADA | folder `prisma/migrations` belum ada — Phase 4 memperkenalkan migrasi terversionisasi pertama |

**Kesimpulan Gate A: PASS** — baseline, governance, security preflight lolos; implementasi boleh
dimulai sesuai prompt final §1 (butir 1–5).

## 2. Scope lock — REQ Phase 4 & status

In-scope (13 REQ, prioritas Must): REQ-021, REQ-022, REQ-023, REQ-025, REQ-026, REQ-047, REQ-048,
REQ-049, REQ-050, REQ-051, REQ-052, REQ-054, REQ-092.

Batas scope (dipertahankan, TIDAK diimplementasikan): seat/quota berbayar (OD-05 → Phase 5),
lifecycle lisensi (Phase 5), modul event produk (Phase 6+), ServiceOffer/RecruitmentOpening
(Phase 16), commerce (Phase 11/22), IMS (Phase 17+), vendor WhatsApp spesifik (OD-03 OPEN —
hanya abstraksi), email/SMS provider (belum diputuskan — invitation link ditampilkan ke inviter,
tidak ada pengiriman), dynamic role editor (fase lanjut).

## 3. Keputusan implementasi (dalam batas ADR/kontrol aktif)

1. **Auth framework = `next-auth` v4.24.11 (sudah ada di baseline)** — memakai OAuth/OIDC,
   state/nonce/PKCE, validasi token, cookie session + CSRF bawaan library (gated prompt §5.1:
   jangan re-implement validasi kriptografi manual). **Tanpa dependency baru.**
2. **Session strategy = database** (bukan JWT) — satu-satunya strategi yang mendukung REQ-048
   (daftar sesi aktif per device, revoke per-device/semua, efektif pada request berikutnya) dan
   selaras `DATA_MODEL_CONCEPT.md` §3.1 entitas `Session`.
3. **Prisma adapter custom minimal** (implement `Adapter` interface next-auth v4 di atas model
   domain epicRider) — tanpa dependency `@auth/prisma-adapter` baru; pemetaan persis ke entitas
   `User`/`Account`(=AuthenticationMethod)/`Session` sesuai DATA_MODEL §3.1.
4. **Kebijakan account-linking aman (REQ-022/REQ-047):** default `next-auth` TANPA
   `allowDangerousEmailAccountLinking` — akun Google dengan email yang sudah dimiliki user dari
   metode lain TIDAK auto-link (gagal `OAuthAccountNotLinked`); linking eksplisit = fitur
   terpisah (hanya kebijakan didokumentasikan + test negatif di Phase 4).
5. **OD-115 (param sesi) = PROPOSED, terpusat & configurable** (`src/lib/config/security-config.ts`,
   overridable via env): `SESSION_MAX_AGE_SECONDS` (default 7 hari), `SESSION_ABSOLUTE_MAX_AGE`?
   tidak — hanya maxAge (PROPOSED). Tidak ada klaim persetujuan owner.
6. **WhatsApp proof-of-control = abstraksi provider-netral (ADR-009):** interface
   `OtpDeliveryProvider { send(target, code): Promise<void> }` — hanya kontrak pengiriman;
   domain service (`VerificationRequest` DB: token hash SHA-256, sekali pakai, expiry, attempt
   counter, anti-replay, rate-limit, lockout, audit) dimiliki platform. Test double hanya di
   environment test. Vendor = OD-03 OPEN — TIDAK dipilih; UI WhatsApp menampilkan status
   provider-not-configured (tanpa login palsu).
7. **Role preset minimum (OD-122 PROPOSED):** `owner` + `member` (baseline miniRider, sesuai
   AUTHORIZATION_MODEL §5.2 "miniRider baseline is expected to need only owner + member").
   Owner mewarisi baseline member (inheritance eksplisit §5.4). Tanpa role editor dinamis.
8. **Policy layer otorisasi terpusat (ADR-010):** deny-by-default, reason code terkontrol
   (vocabulary §3), evaluasi: session → tenant scope → membership status → role/permission →
   object state. Input tier-entitlement/extension = interface disiapkan namun TIDAK dievaluasi
   (runtime lisensi = Phase 5; tanpa mengarang license state).
9. **Migrasi terversionisasi (§7 gated prompt):** `prisma migrate dev` pada database dev
   terisolasi (file SQLite baru `prisma/phase4-dev.db`, bukan `db/custom.db` scaffold); SQL
   di-review; demo model `Post`/`User` lama diganti dengan model domain (decision record di
   §6 bawah + laporan; rollback = revert migration). `db:push --accept-data-loss`/`db:reset`
   TIDAK dipakai.
10. **Isolasi tenant dua lapis:** (a) policy layer per-request (tenant scope dari
    principal+membership, bukan input client); (b) repository/service level — semua query
    workspace-scoped membawa `workspaceId` dari konteks terverifikasi (defense in depth,
    API_ARCHITECTURE §14.2).
11. **API = route handlers `/api/v1/...`** (client-neutral, D-1 versioning, D-6 workspace path),
    error = RFC 9457-style problem details + `code` (reason code) + `traceId` (§10), tanpa
    kebocoran internal. Server actions TIDAK dipakai untuk operasi sensitif.
12. **UI = reuse fondasi Phase 3** (design token, EmptyState/ErrorState/PermissionDenied/
    StatusBadge, shadcn/ui, i18n ADR-20): route baru `/login`, `/workspaces`,
    `/workspaces/[workspaceId]`, `/invitations`, `/account/sessions`; nav minimal additif di
    `layout.tsx` (tanpa mengubah logika showcase `page.tsx`); semua string id+en parity.

## 4. Peta traceability (REQ → ADR/model → modul → test → bukti)

| REQ | ADR/Model | Modul implementasi | Test | Bukti acceptance |
|---|---|---|---|---|
| REQ-021 WhatsApp proof-of-control | ADR-009; DMC §3.1 VerificationRequest | `src/lib/auth/otp/` (provider interface + service + rate limit); schema `VerificationRequest` | `tests/unit/otp-service.test.ts`, `tests/integration/verification-request.test.ts` (sekali-pakai, expiry, replay, attempt, lockout, rate limit, audit) | Laporan §E.3; OD-03 terbuka (vendor) |
| REQ-022 Google OIDC | ADR-008; SECURITY OAuth/OIDC | `src/lib/auth/nextauth-options.ts` (GoogleProvider kondisional), adapter Prisma custom; `/api/auth/[...nextauth]` | `tests/unit/auth-config.test.ts` (state/nonce handled library; config-missing → provider tidak aktif; no auto-link); real e2e = NOT TESTED (tanpa credential) | Laporan §E.2; config-state aman di UI |
| REQ-023 isolasi tenant | ADR-010; API_ARCH §14 | `src/lib/authz/` policy + guards; semua service workspace-scoped | `tests/integration/tenant-isolation.test.ts` (matriks lintas-tenant read/write/list denied + audited; manipulasi tenant-id client tidak berpengaruh) | Matriks test §F; audit event DENY_TENANT_MISMATCH |
| REQ-025 identitas global terpisah | DMC §3.1/§3.3 | Model `User`/`Membership`/`MembershipRoleAssignment` terpisah; satu user beda role per workspace | `tests/integration/membership.test.ts` (role beda per workspace tanpa konflik) | Skema + test |
| REQ-026 permission chain | ADR-010 | `src/lib/authz/policy.ts` (input chain + reason codes); permission vocab subset Phase 4 dari AUTHZ_MODEL §4.1–4.3 | `tests/unit/authz-policy.test.ts` (matriks aktor×tenant×objek×aksi×status) | Matriks |
| REQ-047 recovery/fallback | ADR-008 | Kebijakan linking aman (no auto-link); `identity.account.recover` = NOT IMPLEMENTED (Butir terdefer, dicatat jujur — butuh keputusan vendor/mechanism) → status NOT ASSESSED untuk flow penuh; test negatif anti-takeover | `tests/unit/auth-config.test.ts` (unsafe linking ditolak) | Laporan §E.1 + residual risk |
| REQ-048 session lifecycle | ADR-008; DMC §3.1 Session | next-auth database strategy + `Session` model (deviceLabel, revokedAt); `/api/v1/me/sessions` GET/DELETE | `tests/integration/session-lifecycle.test.ts` (revoke → request berikutnya ditolak; expiry; daftar device) | Test + UI /account/sessions |
| REQ-049 membership lifecycle | DMC §3.3 | `src/lib/memberships/` (invite→accept→suspend→remove→leave + reactive; transisi audited; partial unique index live-membership) | `tests/integration/membership.test.ts` (setiap transisi mengubah akses seketika; removed → akses hilang request berikutnya) | Test |
| REQ-050 event assignment terpisah | DMC §3.4 | Reference-only: permission `event.read` (assignment-required) ada di policy; runtime event = Phase 6 → test fixture minimal di policy layer (assignment-missing deny) | `tests/unit/authz-policy.test.ts` | Policy test; runtime event = Phase 6 |
| REQ-051 undangan aman | DMC §3.3 Invitation | `src/lib/invitations/` (token 32-byte random, hash-only storage, workspace+role bound server-side, expiry PROPOSED 7d configurable, revocation, konsumsi atomik satu kali, accept butuh identitas cocok) | `tests/integration/invitation.test.ts` (expired/revoked/replayed/wrong-recipient denied; satu kali accept; role tak bisa diubah via token) | Test |
| REQ-052 developer role terpisah | DMC §3.1; AUTHZ §5.3 | Model `DeveloperRoleAssignment` (global, tanpa FK workspace); policy `DENY_CROSS_CONTEXT_ROLE` | `tests/unit/authz-policy.test.ts` (developer role tidak membawa permission workspace) | Test |
| REQ-054 anti-abuse auth | ADR-008/009; SECURITY | `src/lib/auth/rate-limiter.ts` (per-target/per-IP window, PROPOSED configurable), lockout VerificationRequest, audit per percobaan, tanpa token/OTP/secret di log | `tests/unit/rate-limiter.test.ts`, otp tests (attempt abuse) | Test + audit event sample |
| REQ-092 baseline keamanan | SECURITY.md | Secret hygiene (.env.example placeholder), no-secret-in-log (Prisma log query dimatikan → hanya `error`; justifikasi keamanan REQ-023/§7.7), audit events, problem-details tanpa kebocoran | Secret scan terhadap artefak; test output bersih | Laporan §E.9 |

## 5. Urutan implementasi (Gate D)

1. Konfigurasi & fondasi: `security-config.ts`, audit service, problem-details helper.
2. Skema Prisma + migrasi terversionisasi (+ generate client, verifikasi SQL).
3. Otorisasi: permission vocabulary, role presets, policy layer, guards.
4. Auth: next-auth options + Prisma adapter + session service + middleware UX.
5. OTP WhatsApp abstraction + rate limiter.
6. Domain services: workspaces, memberships, invitations (transaksi audited).
7. API route handlers `/api/v1/*`.
8. UI + i18n (id/en) + states.
9. Test suite (unit + integration DB terisolasi + negative security matrix).
10. Quality gates (lint/typecheck/test) + catat keterbatasan (build = larangan platform; remote CI = PENDING).
11. Verifikasi UI via agent-browser (dev server worktree port 3100, terpisah dari workspace utama 3000).
12. Artefak laporan + governance update + transfer package.

## 6. Decision record — perubahan skema

- **Mengganti demo `User`(email non-null)/`Post` dengan model domain Phase 4.** Alasan: keduanya
  adalah scaffold template (SECURITY.md current state: "demo User/Post models"), bukan bagian
  domain epicRider (DATA_MODEL_CONCEPT tidak memiliki entitas Post; User domain epicRider tidak
  memakai email sebagai kunci utama — gated prompt §5.1). Tidak ada data nyata di DB dev
  terisolasi; `db/custom.db` (scaffold legacy, tercatat sebagai hygiene risk di SECURITY.md)
  TIDAK disentuh dan TIDAK dipakai. Rollback: revert migrasi (migrasi pertama terversionisasi;
  belum ada data produksi). Pencatatan: bagian ini + PHASE_4_REPORT.
- **Prisma `log: ['query']` → `['error']`** di `src/lib/db.ts`. Alasan: keamanan REQ-023/§7.7 —
  query log berpotensi menulis data tenant ke log; hanya error yang perlu tercatat.
- **Partial unique index live-membership** ditambahkan via edit SQL migrasi (SQLite partial
  index tidak didukung deklaratif Prisma): `UNIQUE(workspace_id, user_id) WHERE status IN
  ('INVITED','ACTIVE','SUSPENDED')` — memungkinkan baris histori + satu membership hidup.

## 7. Risiko & blockers yang diketahui sejak awal

- **Build produksi TIDAK dijalankan di sandbox** (larangan platform) → bukti build hanya dari
  remote CI setelah integrasi owner; status build lokal = NOT RUN (jujur dicatat; pola yang sama
  dengan Phase 3).
- **Google OIDC real round-trip = NOT TESTED** (tidak ada credential nyata; dilarang membuat
  credential palsu). Test memakai konfigurasi/mock terkendali; UI menampilkan status aman.
- **Vendor WhatsApp = OD-03 OPEN** → hanya abstraksi + test double; tidak ada klaim provider.
- **next-auth v4 + Next 16**: dependensi sudah ada di baseline & CI baseline lulus install;
  bila ditemukan inkompatibilitas material saat implementasi → STOP bagian terdampak dan laporkan
  (jangan ganti framework tanpa keputusan).
- **next-env.d.ts / generated files**: dikelola sesuai .gitignore baseline.

## 8. Execution log

| Tahap | Ringkasan | Hasil |
|---|---|---|
| 1. Preflight & Gate A | Verifikasi canonical + worktree + invarian + baseline gates (lint 0 / typecheck 0 / 25/25) | PASS |
| — Insiden lingkungan | `DATABASE_URL` shell menunjuk DB utama; `prisma migrate dev --create-only` pertama ABORT non-interaktif; DB utama tidak tersentuh (mtime tidak berubah). Koreksi: `DATABASE_URL` eksplisit per-perintah ke `prisma/phase4-dev.db` terisolasi | Terkendali + terdokumentasi |
| 2. Skema & migrasi | `migrate dev --create-only` → review SQL → tambah partial unique index live-membership → apply → verifikasi index via sqlite_master | PASS (11 tabel + index) |
| 3. Fondasi lib | security-config (PROPOSED terpusat), audit-service (redaksi defensif), problems (RFC 9457-style), db.ts log error-only | PASS |
| 4. Otorisasi | reason-codes/permissions/roles (preset owner+member, OD-122 PROPOSED)/policy murni/guards (401/404/403+reason; audit denial) | PASS |
| 5. Auth | nextauth-options (GoogleProvider kondisional; no-auto-link; events audit), adapter Prisma custom (revoke/expired→null), session-service, rate-limiter, OTP provider interface + fake (test-only) + service (hash-only/sekali-pakai/lockout) | PASS |
| 6. Domain services | workspaces (transaksi owner), memberships (lifecycle + self-admin ditolak), invitations (token hash-only; konsumsi atomik; by-token + by-id; already-member rollback) | PASS |
| 7. API (15 route handler — 14 `/api/v1` problem-details + 1 `/api/auth/[...nextauth]`; koreksi R2 dari "13 route", hitung ulang filesystem) | /api/auth/[...nextauth] + /api/v1/{me, me/sessions(+id), me/invitations(+accept token & id), workspaces(+members+leave+invitations(+id)), auth/otp/request+verify} | PASS |
| 8. UI + i18n | 5 halaman + 6 komponen UI (koreksi R2 dari "7", hitung ulang filesystem) + nav layout + dictionary id/en + switcher di login; proxy.ts (Next 16) | PASS |
| 9. Test suite | 10 file test baru (koreksi R2: + `tests/integration/http-routing.test.ts`); 2 ekspektasi test dikoreksi (non-member → DENY_NOT_MEMBER; assignment gate dengan permission yang dipegang aktor) | 113/113 PASS (koreksi R2) |
| 10. Quality gates | lint exit 0 (0 error/0 warning); typecheck exit 0; test 13 file 113/113 (koreksi R2); build: era R0 NOT RUN (larangan platform) — R2: production build exit 0 pada working copy terisolasi (lihat PHASE_4_REPORT.md §9) | PASS + keterbatasan tercatat |
| 11. Verifikasi runtime | Dev server worktree port 3100 (DB terisolasi): curl (401 problem-details / 200 / 404 cross-tenant / 503 OTP / undangan token sekali-tampil) + agent-browser (login states, i18n id↔en, mobile-390, create/suspend/reactivate/undang/accept-via-link/replay-ditolak/revoke-sesi/regresi showcase); 11 screenshot (koreksi R2 dari "12"); console bersih | PASS |
| 12. Artefak & governance | ROADMAP/PHASE_STATUS → IN PROGRESS (dated, riwayat dipertahankan); ADR-022 + register (next free ADR-023); PHASE_4_{REPORT,ACCEPTANCE,SECURITY_REVIEW,TRACEABILITY}; HANDOFF; worklog; current-state SECURITY/TESTING/ARCHITECTURE/README; .gitignore prisma/*.db; .env.example placeholder baru | Selesai |
| 13. Transfer package | `epicRider_PHASE_4_TRANSFER_20261028.zip` + manifest SHA-256 + sidecar `.sha256` | Siap |
