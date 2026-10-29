# PHASE 4 SECURITY REVIEW — epicRider

> Scope: authentication/session, Google OIDC, WhatsApp abstraction, server authorization,
> tenant isolation, invitation/membership, roles/permissions, audit events, secret hygiene.
> Baseline `b5defc22` · Worktree terisolasi · 2026-10-28 · Mengacu THREAT_MODEL TC-01..TC-08/TC-24.

## 1. Authentication & session (TC-01/TC-02; REQ-021/022/048/054)

- Protokol OAuth/OIDC ditangani **next-auth v4** (state, nonce, PKCE, token exchange, validasi
  issuer/audience/signature/expiry, redirect URI, cookie httpOnly, CSRF) — tanpa kriptografi
  buatan sendiri (gated prompt §5.1). ✅
- Strategi sesi database: revoke = `revokedAt` → ditolak request berikutnya (teruji); expired
  ditolak (teruji); user non-ACTIVE ditolak guard. ✅
- Kebijakan **no-auto-link**: `allowDangerousEmailAccountLinking` tidak diaktifkan (test statis);
  email sama dari metode lain → `OAuthAccountNotLinked`. Anti takeover TC-04. ✅
- Anti-enumerasi: 401 seragam tanpa sesi; pesan login tidak membocorkan keberadaan akun. ✅
- Rate limiter in-memory (REQ-054): per-target/per-IP OTP, per-actor undangan; lockout OTP
  (BLOCKED + blockedUntil). **Keterbatasan**: single-instance (sandbox/dev); limiter terdistribusi
  = keputusan deployment (residual risk R-1). ⚠️ tercatat
- Produksi tanpa `NEXTAUTH_SECRET` → throw (fail-safe). Tanpa kredensial Google → provider
  tidak terpasang + UI status aman (tanpa login palsu). ✅

## 2. Google OIDC (REQ-022)

- Provider kondisional env-only (`GOOGLE_CLIENT_ID/SECRET`); tidak ada kredensial di kode/
  laporan/paket; `.env.example` placeholder. ✅
- Redirect/callback validation oleh library; callbackUrl divalidasi same-origin oleh next-auth;
  parameter `next` di `/login` hanya path relatif (anti open-redirect). ✅
- **Real round-trip = NOT TESTED** (tanpa kredensial nyata; dilarang memalsukan). Klaim jujur. ⚠️

## 3. WhatsApp proof-of-control (TC-05; REQ-021; OD-03)

- Vendor-netral (ADR-009): interface `send` saja; domain (hash-only, sekali-pakai, expiry,
  attempt/lockout, rate-limit, audit) milik platform — teruji dengan test double (test env only).
- Produksi: `resolveOtpDeliveryProvider()` throw → 503 `PROVIDER_NOT_CONFIGURED` (gagal aman);
  kode OTP tidak pernah di respons/log/audit (teruji). ✅
- Provider-specific (callback auth, anti-spoofing sisi vendor) = UNKNOWN hingga OD-03 — konsisten
  THREAT_MODEL TC-05. ⚠️ tercatat (bukan blocker arsitektur).

## 4. Server authorization & tenant isolation (TC-06/TC-07/TC-24; REQ-023/024/026)

- **Deny-by-default** policy layer terpusat; rantai: sesi → tenant → membership → permission →
  event context → object state. Reason codes terkontrol. ✅
- Tenant scope dari **principal + membership (DB)**, bukan input client; workspace path D-6. ✅
- Non-member → **404** (enumeration resistance); member tanpa permission → 403 + reason. ✅
- Denial **teraudit** first-class (who/what/when/reason/tenant). ✅
- Defense in depth: semua query workspace-scoped by construction (service menerima workspaceId
  dari konteks terverifikasi). ✅
- Matriks negative test otomatis: lintas-tenant read/write/invite denied + audited; suspended/
  removed seketika; manipulasi identitas tenant tidak berpengaruh (fakta dari DB). ✅
- **Object-level**: sesi/membership orang lain → 404 (teruji). ✅
- UI hiding tidak dipakai sebagai kontrol (proxy = UX saja; guard = penjaga). ✅

## 5. Membership/invitation/roles (REQ-049/051/052; TC-03/TC-04)

- Transisi membership tervalidasi (matrix + optimistic versioning + transaksi + audit); self-admin
  ditolak (pakai leave). ✅
- Undangan: token 32-byte CSPRNG, **hash-only**; role+workspace terikat server-side; menawarkan
  owner ditolak (Phase 4); konsumsi atomik satu-kali; expired/revoked/replay/wrong-recipient
  denied (teruji); already-member rollback tanpa konsumsi. ✅
- Eskalasi: role dari client tidak dinilai (hanya dari DB); preset minimum; role tak dikenal →
  tanpa permission. ✅
- Developer role global tanpa FK workspace; `DENY_CROSS_CONTEXT_ROLE`. ✅

## 6. Audit events & log hygiene (REQ-054/092; API_ARCH §10)

- Kategori/aksi/outcome/reasonCode/aktor/tenant; redaksi defensif (kunci sensitif → `[REDACTED]`,
  hanya nilai primitif) — teruji (metadata `otp`/`sessionToken` ter-redaksi). ✅
- Prisma log `query` → `error` (tidak ada data tenant di log). ✅
- console.error API hanya traceId+path (tanpa internal). ✅
- Problem details tanpa stack/SQL/path internal/dependency. ✅

## 7. Secret hygiene (REQ-092)

- `.env` tidak ter-track (worktree .env dev-only; secret dev dibuat acak lokal; TIDAK masuk
  paket transfer). `.env.example` placeholder + komentar aman. ✅
- Tidak ada secret hardcode (scan; kredensial hanya via env). ✅
- DB dev/test terisolasi + `.gitignore` `prisma/*.db`; `db/custom.db` scaffold tidak disentuh. ✅
- Token/OTP/session tidak di respons, log, audit, atau paket. ✅

## 8. Findings & residual risks

| # | Temuan | Klasifikasi | Status |
|---|---|---|---|
| F-4.1 | Rate limiter in-memory (single-instance) | Residual risk (deployment) | Terbuka — doc R-1; limiter terdistribusi saat multi-instance |
| F-4.2 | next-auth v4 resmi Next 13/14 — berjalan di Next 16 (terverifikasi runtime) namun upgrade major Next berikutnya perlu evaluasi | Residual risk (dependency) | Terbuka — R-2; dipantau |
| F-4.3 | Google OIDC real round-trip belum teruji (tanpa kredensial) | NOT TESTED (environment) | Menunggu kredensial owner + integrasi |
| F-4.4 | Vendor WhatsApp belum dipilih (OD-03) — produksi 503 aman | BLOCKED (owner decision) | Sesuai baseline; tidak diakali |
| F-4.5 | Runtime recovery lintas metode (REQ-047) menunggu kanal kedua | NOT ASSESSED (dependency OD-03) | Kebijakan anti-takeover sudah PASS |
| F-4.6 | Entitlement runtime (REQ-024 full) = Phase 5 — Phase 4 tanpa license state palsu | By design (scope) | Interface disiapkan; tidak dipalsukan |
| F-4.7 | Audit retention/akses = OD-138 OPEN | Open decision | Dicatat; tidak diputuskan sendiri |

**Tidak ada temuan kritis yang belum ditangani.** Tidak ada operasi destruktif; tanpa data nyata
di lingkungan; DB disposable terisolasi.
