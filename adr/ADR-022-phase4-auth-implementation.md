# ADR-022 — Phase 4 authentication implementation (next-auth v4, database sessions, custom Prisma adapter)

**Scope:** implementasi konkret fondasi identitas/autentikasi/sesi Phase 4 di atas abstraksi ADR-008/ADR-009.

## Status

**ACCEPTED (implementasi engineering Phase 4 — konsisten dengan ADR-008/009 PROPOSED yang menunggu ratifikasi owner)** · **Date:** 2026-10-28

## Context

- ADR-008 menetapkan abstraksi autentikasi provider-agnostic; ADR-009 menetapkan antarmuka OTP vendor-netral (OD-03 OPEN).
- Baseline kanonik memiliki `next-auth ^4.24.11` sebagai dependensi TANPA implementasi (SECURITY.md current state).
- REQ-022 (Google OIDC), REQ-048 (siklus hidup sesi: daftar perangkat, pencabutan per/semua perangkat, pencabutan efektif pada permintaan berikutnya), REQ-021 (bukti kontrol WhatsApp), REQ-047 (pemulihan/penghubungan akun), REQ-054 (anti-penyalahgunaan).
- Prompt bergerbang §5.1: gunakan framework terpilih untuk OAuth/OIDC (state, nonce, PKCE, validasi token, cookie, CSRF) — JANGAN mengimplementasikan ulang validasi kriptografi secara manual.
- OD-115 (parameter sesi) OPEN: nilai pengembangan harus PROPOSED, terpusat, dapat dikonfigurasi.

## Decision

1. **Framework = `next-auth` v4.24.11** (dependensi baseline; tanpa dependensi baru; tanpa pergantian framework).
   Seluruh mekanisme protokol OAuth/OIDC (state/nonce/PKCE, pertukaran token, validasi issuer/audience/signature/expiry,
   cookie httpOnly, CSRF) ditangani library via `GoogleProvider`.
2. **Strategi sesi = database** (bukan JWT) — satu-satunya model yang mendukung REQ-048 penuh
   (daftar sesi/perangkat + pencabutan per perangkat + pencabutan efektif pada permintaan berikutnya)
   dan selaras entitas `Session` DMC §3.1.
3. **Adapter Prisma custom minimal** (`src/lib/auth/adapter.ts`, ~180 baris) mengimplementasikan
   antarmuka `Adapter` next-auth di atas model domain epicRider (User/Account/Session) —
   TANPA dependensi `@auth/prisma-adapter` baru (prompt bergerbang §8.2: alasan dependensi baru
   wajib terdokumentasi; adapter custom lebih kecil daripada paket eksternal dan memetakan persis
   ke DMC §3.1). Perilaku keamanan adapter:
   - `getSessionAndUser` menolak sesi yang dicabut (revokedAt) / kedaluwarsa → pencabutan efektif pada permintaan berikutnya;
   - `deleteSession` = pencabutan (jejak audit tetap, bukan penghapusan);
   - `createSession` menangkap label perangkat dari User-Agent permintaan (untuk REQ-048);
   - token verifikasi (magic-link) TIDAK didukung — throw eksplisit (tidak ada alur tersebut di epicRider).
4. **Kebijakan penghubungan akun (account linking) — TANPA auto-link:** `allowDangerousEmailAccountLinking`
   TIDAK diaktifkan. Sign-in Google dengan email yang sudah terdaftar dari metode lain DITOLAK
   (`OAuthAccountNotLinked`) — penghubungan eksplisit = alur terpisah (menunggu kanal WhatsApp aktif, OD-03).
   Email terverifikasi provider, sesi aktif, dan konfirmasi eksplisit = sinyal keamanan yang dipisahkan (gated prompt §5.1).
5. **Kredensial bersyarat:** `GoogleProvider` hanya aktif bila `GOOGLE_CLIENT_ID`+`GOOGLE_CLIENT_SECRET`
   tersedia. Tanpa kredensial: provider tidak terpasang; UI menampilkan status aman
   "belum dikonfigurasi" — tidak ada mode login palsu. Produksi tanpa `NEXTAUTH_SECRET` = gagal aman (throw).
6. **Parameter sesi (OD-115) PROPOSED terpusat:** `src/lib/config/security-config.ts`
   (`SESSION_MAX_AGE_SECONDS`, default 7 hari; tanpa sliding expiry — `updateSession` no-op).
   Tidak ada klaim persetujuan owner atas parameter sesi.
7. **Konteks sesi dibaca lewat adapter + `cookies()`** (`src/lib/authz/guards.ts` → `getAuthContext`),
   bukan `getServerSession` bawaan — kompatibel dengan API request async Next 16 dan memberikan
   kontrol penuh atas validitas (revokedAt/expires/status user ACTIVE).
8. **Antarmuka OTP (ADR-009)** direalisasikan: `OtpDeliveryProvider` (send) + domain service
   `VerificationRequest` (hash-only, sekali pakai, kedaluwarsa, percobaan, lockout sementara,
   rate limit ganda target+IP, audit tanpa kode). Produksi: `resolveOtpDeliveryProvider()` throw
   (OD-03) → endpoint 503 `PROVIDER_NOT_CONFIGURED`. Penerbitan sesi WhatsApp (`issueSession`)
   = titik integrasi penyedia yang didokumentasikan; rantai domain dibuktikan test.

## Consequences

**Positive**

- REQ-022/048 terimplementasi dengan library teruji (bukan kriptografi buatan sendiri);
- model data persis DMC §3.1 (Account = AuthenticationMethod; Session dengan revokedAt/deviceLabel);
- pencabutan sesi efektif pada permintaan berikutnya terbukti di integration test;
- tanpa dependensi baru sama sekali.

**Negative / risiko**

- `next-auth` v4 secara resmi menargetkan Next 13/14 — pada Next 16 berjalan (terverifikasi runtime
  di sesi ini: cookie sesi, adapter, endpoint, sign-out) namun pembaruan major Next di masa depan
  perlu evaluasi ulang; kelas risiko dicatat di PHASE_4_SECURITY_REVIEW;
- strategi database session menambah satu pembacaan DB per permintaan terautentikasi (diterima;
  throttling `lastUsedAt` menulis maksimal 1×/menit per sesi);
- `expires_at` next-auth (detik epoch) dikonversi ke DateTime saat penyimpanan.

## Evidence

- Implementasi: `src/lib/auth/nextauth-options.ts`, `src/lib/auth/adapter.ts`, `src/lib/authz/guards.ts`,
  `src/lib/auth/otp/*`, `src/lib/config/security-config.ts`.
- Test: `tests/unit/auth-config.test.ts` (provider bersyarat; tanpa auto-link; strategi database),
  `tests/integration/session-lifecycle.test.ts` (pencabutan → null; kedaluwarsa → null; label perangkat),
  `tests/integration/otp-whatsapp.test.ts` (hash-only, sekali pakai, replay, percobaan, rate limit).
- Verifikasi runtime (agent-browser + curl, port 3100, db dev terisolasi): 401 problem-details tanpa sesi;
  200 `/api/v1/me` dengan sesi; label perangkat pada `/account`; sign-out = pencabutan.
- Google OIDC round-trip nyata = **NOT TESTED** (tidak ada kredensial nyata; dilarang membuat kredensial palsu).

## Dependencies

- **Keputusan terbuka:** OD-03 (penyedia WhatsApp — memblokir integrasi produksi kanal OTP),
  OD-115 (parameter sesi final), OD-122 (katalog peran final), OD-01 (database produksi).
- **ADR terkait:** ADR-008 (abstraksi identitas), ADR-009 (abstraksi OTP), ADR-010 (otorisasi),
  ADR-017 (anti-replay), ADR-019 (quality gates).
- **Fase:** Phase 4 (implementasi); pengujian penyedia nyata menunggu kredensial/integrasi penyedia.
