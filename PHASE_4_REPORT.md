# PHASE 4 REPORT — epicRider

> **Fase:** 4.0 — Identity, Authentication, Session, Workspace/Tenant, Membership, Invitation, Roles & Permissions
> **Baseline kanonik:** `b5defc22dbb634b25af98083cc9b969eb4b1f0a2` (`governance: authorize phase 4 after CI gate pass`)
> **Worktree implementasi:** `/home/z/epicRider-phase4-b5defc22` (git worktree terisolasi, detached HEAD = baseline)
> **Tanggal:** 2026-10-28 · **Status implementasi:** selesai di worktree; integrasi canonical = owner (paket transfer tersedia)

---

## 1. Executive summary

**Selesai** — seluruh scope Phase 4 terimplementasi dan teruji pada worktree terisolasi dari
canonical baseline `b5defc22`: model data identitas/workspace/membership/undangan/audit
(migrasi terversionisasi pertama), autentikasi Google OIDC via next-auth v4 (database session
strategy, adapter Prisma custom, no-auto-link, kondisional kredensial), abstraksi proof-of-control
WhatsApp vendor-netral (OD-03 tetap terbuka — tanpa vendor), policy layer otorisasi terpusat
deny-by-default dengan reason codes, isolasi tenant dua lapis, lifecycle membership penuh,
undangan aman (hash-only, sekali pakai, atomik), audit/security events, UI/i18n penuh (id/en)
di atas fondasi Phase 3, serta 88 test baru (unit + integration + matriks negatif keamanan;
koreksi R2: termasuk 12 test HTTP routing — lihat §9).

**Terbuka/batasan (jujur):** build produksi TIDAK dijalankan di sandbox (larangan platform);
remote CI Phase 4 = PENDING (menunggu integrasi & push oleh owner); Google OIDC round-trip nyata
= NOT TESTED (tanpa kredensial nyata); vendor WhatsApp = OD-03 (abstraksi saja); recovery lintas
metode penuh (REQ-047 runtime) menunggu kanal kedua aktif. Status fase: **IN PROGRESS** —
bukan COMPLETE sampai remote CI terbukti (Definisi Kelulusan §10.9).

**Kepatuhan scope:** tanpa fitur Phase 5+ (tanpa lisensi/entitlement runtime, tanpa event runtime,
tanpa ServiceOffer/RecruitmentOpening, tanpa commerce); tanpa delivery-surface workspace lama;
REQUIREMENTS.md tidak diubah; governance invariants dipertahankan.

## 2. Canonical & preflight (Gate A) — PASS

| Check | Hasil |
|---|---|
| Remote `main` = `b5defc22` (re-verifikasi) | ✅ `git ls-remote` |
| Worktree dari exact commit, detached, bersih | ✅ HEAD = `b5defc22`, tree `e645b33e` = canonical |
| Governance invariants dari blob canonical | ✅ gate PASS; Phase 4 AUTHORIZED; Phase 2/3 PARTIAL |
| REQ integrity | ✅ 101 baris; REQ-101 tepat 1× tabel; REQ-030 tiga commerce surfaces; ServiceOffer ≠ RecruitmentOpening |
| Security preflight | ✅ `.env` tidak ter-track; `.env.example` placeholder; scan tanpa temuan |
| Baseline gates pra-perubahan | ✅ lint 0 / typecheck 0 / 25/25 test (reproduksi bukti Phase 3) |

Detail lengkap: `PHASE_4_IMPLEMENTATION_PLAN.md` §1. Insiden lingkungan (dicatat jujur): variabel
`DATABASE_URL` shell platform menunjuk DB workspace utama — terdeteksi saat `prisma migrate dev`
pertama (mode `--create-only` ABORT, **tidak ada data tersentuh**, mtime DB utama tidak berubah);
seluruh operasi DB selanjutnya memakai `DATABASE_URL` eksplisit per perintah ke file DB terisolasi
worktree (`prisma/phase4-dev.db`; kini di-ignore `.gitignore`).

## 3. Implementasi (Gate D — inkremental)

### 3.1 Data model & migrasi (REQ-025/023/049/051/052)

`prisma/schema.prisma` diganti dari scaffold demo (User/Post) menjadi model domain DMC §3.1–3.3 +
§3.14: `User` (identitas global, email nullable-unik — bukan PK), `Account` (=AuthenticationMethod),
`Session` (deviceLabel, revokedAt), `VerificationRequest` (hash-only), `DeveloperRoleAssignment`
(global, tanpa FK workspace — REQ-052), `Workspace`, `Membership`, `Role` + `MembershipRoleAssignment`,
`Invitation`, `AuditEvent`. Migrasi terversionisasi PERTAMA repo:
`prisma/migrations/20261028183022_phase4_identity_workspace_foundation/` — SQL direview + tambahan
terdokumentasi: **partial unique index live-membership** `UNIQUE(workspace_id,user_id) WHERE status
IN ('INVITED','ACTIVE','SUSPENDED')` (satu membership hidup per pasangan; histori tetap).
`db:push --accept-data-loss`/`db:reset` TIDAK dipakai. Keputusan penggantian scaffold + rollback
tercatat di `PHASE_4_IMPLEMENTATION_PLAN.md` §6.

### 3.2 Autentikasi & sesi (REQ-022/047/048; ADR-022)

next-auth v4.24.11 (dependensi baseline, tanpa dependency baru): GoogleProvider **kondisional**
(env `GOOGLE_CLIENT_ID/SECRET`); strategi **database**; adapter Prisma custom (revoked→null,
expired→null, deleteSession=revoke, label perangkat dari UA); **no-auto-link** default aman
(`OAuthAccountNotLinked` untuk email terdaftar dari metode lain); `NEXTAUTH_SECRET` wajib di
produksi (fail-safe throw). Parameter sesi (OD-115) PROPOSED terpusat (`security-config.ts`,
env-override). Sesi dibaca via `getAuthContext()` (cookie → DB; user non-ACTIVE ditolak).

### 3.3 WhatsApp proof-of-control (REQ-021; ADR-009; OD-03)

Interface `OtpDeliveryProvider` (send) + domain service: kode 6-digit `crypto.randomInt`,
SHA-256 hash-only, expiry 5 mnt (PROPOSED), maks 5 percobaan → BLOCKED + lockout 15 mnt (PROPOSED),
rate limit ganda (per-target 3/jam, per-IP 10/15mnt — PROPOSED), konsumsi atomik sekali pakai
(anti-replay), audit tanpa kode. Produksi: `resolveOtpDeliveryProvider()` throw → API 503
`PROVIDER_NOT_CONFIGURED`; UI status aman. Test double HANYA environment test. Titik integrasi
vendor terdokumentasi (ADR-022 §8) — vendor = OD-03, tidak dipilih, tidak diklaim.

### 3.4 Otorisasi & isolasi tenant (REQ-023/026/024; ADR-010)

Policy layer murni `evaluatePolicy()` dengan rantai: sesi → tenant → membership(status) →
role/permission → event context → object state (entitlement/extension = deklarasi; evaluasi Phase 5).
Deny-by-default; reason codes terkontrol (vocabulary AUTHORIZATION_MODEL §3 subset + deklarasi).
Guard `requireSession` / `requireWorkspacePermission` menyelesaikan fakta dari DB (bukan input
client), mengaudit denial (first-class), memetakan: non-member → 404 (enumeration resistance,
TC-24), member tanpa permission → 403+reason. Defense in depth: semua service workspace-scoped
by construction. Preset role minimum `owner`+`member` (OD-122 PROPOSED; inheritance eksplisit;
tanpa role editor).

### 3.5 Membership & undangan (REQ-049/051)

Lifecycle penuh INVITED→ACTIVE→SUSPENDED→REMOVED/LEFT (+reactivate): transaksi + optimistic
versioning + audit; akses berubah seketika (policy baca status terkini — teruji). Admin actions
(suspend/reactivate/remove) ≠ self-action (leave); self-admin ditolak. Undangan: token 32-byte
base64url, hash-only, workspace+role terikat server-side, expiry 7 hari (PROPOSED configurable),
revocation, konsumsi atomik satu-kali, penerimaan wajib identitas cocok (token-link DAN by-id),
already-member rollback tanpa konsumsi, rate-limit per aktor. Delivery provider belum diputus —
link ditampilkan sekali ke inviter (dokumentasi §6.5 gated prompt).

### 3.6 Audit & anti-abuse (REQ-054/092)

`logAudit()` dengan redaksi defensif (kunci `token|otp|code|password|secret|cookie|…` →
`[REDACTED]`; hanya nilai primitif) — teruji (metadata `otp`/`sessionToken` ter-redaksi, nilai
kode tidak pernah muncul). Event: login/sign-out/user/account (next-auth events), workspace/membership/
invitation transitions, authz denials, OTP request/verify/blocked/rate-limited/replay.
Rate limiter in-memory sliding window (keterbatasan single-instance dicatat jujur).
`src/lib/db.ts` log `['query']`→`['error']` (justifikasi keamanan: no tenant data in logs).

### 3.7 API (API_ARCHITECTURE D-1/D-5/D-6)

`/api/auth/[...nextauth]` + `/api/v1/...`: `me`, `me/sessions[/id]`, `me/invitations[/accept|/:id/accept]`,
`workspaces`, `workspaces/:id/members[/:id|/leave]`, `workspaces/:id/invitations[/:id]`,
`auth/otp/request|verify`. Error = RFC 9457-style problem details (`type/title/status/detail/
instance/code/traceId`) tanpa kebocoran internal; 401/403/404/409/410/422/429/503 sesuai mapping;
validasi zod → 422 `errors[]`.

### 3.8 UI/UX & i18n (gated prompt §8; REQ-028)

Reuse fondasi Phase 3 (design token, EmptyState/PermissionDenied, shadcn/ui, i18n ADR-020):
`/login` (status provider aman + switcher bahasa), `/workspaces` (list/create/switch),
`/workspaces/[id]` (anggota + aksi + undangan), `/invitations` (accept by-id + token-link +
state invalid/replay), `/account` (profil + daftar sesi/perangkat + revoke satu/semua + sign-out).
Nav minimal additif di layout (showcase `page.tsx` TIDAK disentuh). Semua string id+en
(dictionary parity type-level). States: loading (spinner/disabled), empty, validasi inline
(aria-invalid/describedby), error/success (toast), permission-denied, provider-not-configured,
session-expired, undangan expired/replayed. Responsif desktop+mobile-390 (screenshot);
keyboard/aria (label, role, focus-visible). `middleware`→`proxy.ts` (konvensi Next 16).

## 4. Test & bukti (Gate E)

**Lokal (worktree, Bun 1.3.14, SQLite terisolasi per-file via `migrate deploy`):**

| Command | Exit | Ringkasan |
|---|---|---|
| `bun install --frozen-lockfile` | 0 | 933 paket (baseline) |
| `bun run lint` | 0 | 0 error / 0 warning |
| `bun run typecheck` (tsc --noEmit) | 0 | — |
| `bun run test` (vitest run) | 0 | **13 file, 113/113 PASS** — 25 regresi Phase 3 + 88 baru (koreksi R2: + `tests/integration/http-routing.test.ts` 12 test HTTP routing) |

Test baru: unit (policy matrix, rate limiter, auth-config/no-auto-link, OTP domain, UA) +
integration DB terisolasi (workspace+owner transaksi, lifecycle membership penuh, re-invite =
baris baru, **matriks isolasi tenant** (read/write/invite lintas tenant denied+audited; suspended/
removed seketika; list tidak bocor; audit redaksi), **undangan** (happy/replay/expired/revoked/
wrong-recipient/already-member/role-bound/by-id), **sesi** (revoke→null, expired→null, device
label, revoke satu/semua, object-level), **OTP** (hash-only, sekali pakai, replay, attempt→lockout,
expired, rate limit, audit tanpa kode)).

**Verifikasi runtime (dev server worktree port 3100, agent-browser + curl):** 401 problem-details
tanpa sesi; 200 `/api/v1/me`; cross-tenant 404; OTP 503 PROVIDER_NOT_CONFIGURED; undangan token
sekali-tampil; UI: login states (Google not-configured; WhatsApp OD-03), i18n id↔en, mobile-390,
create workspace via dialog, suspend/reactivate via UI, undangan via UI, accept via token-link,
replay token ditolak di UI, revoke sesi perangkat lain, regresi showcase. Bukti: 11 screenshot
(koreksi R2 — hitung ulang filesystem; klaim lama "12" stale) `audit/evidence/phase4/`. Console browser bersih.

**Keterbatasan lingkungan (jujur):** `bun run build` TIDAK dijalankan (larangan platform sandbox —
pola yang sama dengan Phase 3; CI workflow menjalankan build di runner). Remote CI Phase 4 =
**PENDING — REMOTE CI NOT YET VERIFIED** (menunggu integrasi owner + push; jangan dianggap lulus).

## 5. Inventaris perubahan (vs baseline `b5defc22`)

> **Koreksi R2 (2026-10-29):** angka pada versi lama bagian ini ("73 added / 11 modified /
> 16 route handler / 7 komponen UI / 12 screenshot / 9 file test") STALE — tidak cocok dengan
> manifest & filesystem. Semua angka kini berasal dari inventaris aktual paket R2
> (`PHASE_4_TRANSFER_MANIFEST.txt` di dalam paket).

- **Added (80 file):** modul lib (auth, authz, audit, api, workspaces, memberships, invitations,
  config) 21 file + `src/proxy.ts`, **15 route handler** (14 `/api/v1` problem-details + 1
  `/api/auth/[...nextauth]`; koreksi R2 dari "16"), 5 halaman, **6 komponen UI** (koreksi R2 dari
  "7"), 2 file migrasi, 6 dokumen governance Phase 4 (4 laporan + plan + ADR-022) + 2 laporan
  route-defect R2, **11 screenshot bukti** (koreksi R2 dari "12"), 11 file test (10 file test —
  termasuk `tests/integration/http-routing.test.ts` — + 1 helper `tests/integration/test-db.ts`).
- **Modified (17):** `.env.example`, `.gitignore`, `ADR_REGISTER.md`, `ARCHITECTURE.md`,
  `HANDOFF.md`, `PHASE_STATUS.md`, `README.md`, `ROADMAP.md`, `SECURITY.md`, `TESTING.md`,
  `prisma/schema.prisma`, `src/app/layout.tsx`, `src/i18n/dictionaries/en.ts`,
  `src/i18n/dictionaries/id.ts`, `src/lib/db.ts`, `vitest.config.ts`, `worklog.md`
  (koreksi R2 dari daftar parsial 11 file).
- **Deleted (0):** — (`db/custom.db` scaffold legacy TIDAK disentuh; catatan hygiene tetap).
- **File penting yang sengaja TIDAK disentuh:** `src/app/page.tsx` (showcase canonical),
  `MASTER_CONTROL.md`, `OBSOLETE_AND_SUPERSEDED_REGISTER.md`, `REQUIREMENTS.md`,
  seluruh dokumen model/arsitektur Phase 2, `upload/*`.

## 6. Keputusan terbuka yang memengaruhi Phase 4 (tidak diputuskan diam-diam)

| OD | Sub-scope yang tertahan | Status implementasi Phase 4 |
|---|---|---|
| OD-03 | Integrasi/konfigurasi/production-test vendor WhatsApp | Abstraksi + test double; produksi 503 aman |
| OD-115 | Parameter sesi final (maks/idle/force-logout) | PROPOSED terpusat + configurable |
| OD-122 | Katalog role preset final | Minimum `owner`+`member` PROPOSED |
| OD-05 | Kuota seat final | TIDAK diimplementasikan (Phase 5; tanpa enforcement berbayar) |
| OD-01 | Database produksi | SQLite = dev/test terisolasi saja; tanpa klaim produksi |
| OD-101/102/110 | Detail role developer/broadcast/auditor | Model global terpisah (REQ-052); katalog detail menunggu |

## 7. Governance update (Gate C)

`ROADMAP.md` + `PHASE_STATUS.md`: Phase 4 **AUTHORIZED/READY TO START → IN PROGRESS** (mulai
2026-10-28, tanggal + bukti tercatat; riwayat dipertahankan). Phase 2 = PARTIAL, Phase 3 =
PARTIAL, `PRE_PHASE_4_GATE` = PASS — **tidak berubah**. Tidak ada fase lain dinaikkan. Status
final fase ini = IN PROGRESS (bukan COMPLETE/DONE) sampai seluruh acceptance + remote CI
terbukti (DoD §10.9; gated prompt §12).

## 8. Handover

Paket transfer: `epicRider_PHASE_4_TRANSFER_20261028.zip` (dibuat dari diff worktree vs baseline;
manifest berisi SHA-256 seluruh file + baseline SHA + instruksi integrasi + exclusions — lihat
`PHASE_4_TRANSFER_MANIFEST.txt` di dalam paket). Integrasi = owner: review → terapkan file →
commit → push → remote CI → baru status dapat dinaikkan sesuai kontrol. Z.ai TIDAK melakukan
push/checkpoint otomatis sebagai persetujuan.

## 9. Re-issue R2 (2026-10-29) — kandidat terkontrol baru dari R0

**Konteks:** R1 (kandidat historis 2026-10-29) tidak pernah tersedia di lingkungan owner dan
dinyatakan `NOT RECOVERABLE / CLOSED` (lihat `PHASE_4_R1_RECOVERY_REPORT.md` +
`PHASE_4_R1_REDELIVERY_REPORT.md`).

**R2 = NEW CONTROLLED CANDIDATE — BUKAN R1.** R2 dibangun eksplisit dari paket R0 frozen
(SHA-256 `5049185c8d887ca681b6215a8c9c55d00b8f4b420343d9b6cb2a85750074130f`, terverifikasi utuh;
94/94 hash manifest cocok) dengan remediation yang disepakati saja:

1. **Koreksi dokumentasi stale** — inventaris (73/11 → 80/17 aktual R2), route handler
   ("13"/"16" → 15 = 14 `/api/v1` + 1 NextAuth), komponen UI (7 → 6), screenshot (12 → 11),
   test count (76/101 → 88/113) — semua dihitung ulang dari filesystem & manifest (§12 spec R2).
2. **Route defect** — path canonical `members/[membershipId]` SUDAH kanonik di R0 (byte-proven,
   konten SHA `12150762af85cb465108ede268e5a5bb5527548278f88d5b20a15ba2efd9bb3c`); R2
   mempertahankan tanpa rename, menambahkan bukti routing HTTP nyata, dan mendokumentasikan
   rantai defect historis (lihat `PHASE_4_ROUTE_DEFECT_REPORT.md` +
   `PHASE_4_ROUTE_DEFECT_FIX_REPORT.md`).
3. **HTTP routing test (Gate Q4)** — `tests/integration/http-routing.test.ts` baru: 12 test
   real-HTTP (server Next.js production/dev di port terisolasi, DB SQLite disposable): 401
   problem-details tanpa sesi, workspace/membership/invitation/session lifecycle, dynamic member
   route PATCH (suspend) via HTTP, tenant isolation 404/403, anti-replay undangan. PASS dev +
   production mode.

**Hasil gate R2:** test **113/113 PASS** (13 file) · lint **0 error** · typecheck **0 error** ·
build produksi **exit 0** (working copy terisolasi; `NEXTAUTH_SECRET` placeholder build-time —
fail-safe by design, bukan secret nyata; 25 route ter-register termasuk dynamic member route,
byte-proven di `app-path-routes-manifest.json`) · security scan **0 temuan** · inventaris
**80 ADDED / 17 MODIFIED / 0 DELETED** konsisten antara worktree/manifest/ZIP/dokumentasi.
