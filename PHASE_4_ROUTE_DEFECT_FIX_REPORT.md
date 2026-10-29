# PHASE 4 ROUTE DEFECT FIX REPORT — epicRider (R2 re-issue)

> **Tipe:** Laporan koreksi + verifikasi (R2 re-issue remediation §4.F/§4.G/§4.H).
> **Tanggal:** 2026-10-29 · **Baseline:** `b5defc22dbb634b25af98083cc9b969eb4b1f0a2`
> **Prinsip:** R2 = kandidat terkontrol BARU dari R0 — bukan recovery/rename R1.
> **Laporan pendamping:** `PHASE_4_ROUTE_DEFECT_REPORT.md` (evidence historis lengkap).

---

## 1. Defect yang diremediasi

| Aspek | Defect historis (worktree Z.ai, Okt 2026) | Kondisi R0 frozen (verifikasi 2026-10-29) |
|---|---|---|
| Nama direktori dinamis | `members/embershipId]` (kehilangan `[m`) | `members/[membershipId]` — **CANONICAL** (byte-proven) |
| Konten handler | — | SHA-256 `12150762af85cb465108ede268e5a5bb5527548278f88d5b20a15ba2efd9bb3c` (1.626 B) |
| Verifikasi routing | statis saja (tidak memadai) | **TIDAK ada** test HTTP khusus routing di R0 → diperbaiki R2 |

Divergensi path TIDAK pernah masuk ke paket R0 (94/94 manifest hash-match; scan raw-byte 0
standalone). Namun governance mewajibkan koreksi eksplisit + bukti routing nyata pada kandidat
integrasi — itulah yang dieksekusi R2.

## 2. Koreksi yang dieksekusi (exact changes)

1. **Path canonical dipertahankan — TANPA rename, TANPA perubahan konten handler.**
   R0 terbukti canonical; perubahan apa pun justru menyimpang dari baseline. Konten handler R2
   = R0 (hash identik — lihat §4).
2. **`tests/integration/http-routing.test.ts` — file BARU (ADDED), 12 test real-HTTP:**
   - Server Next.js sungguhan di port test terisolasi (4311) — mode produksi (`next start`)
     bila build tersedia, selain itu dev server; keduanya HTTP nyata, bukan import handler.
   - DB SQLite disposable dari migrasi terversionisasi (`prisma migrate deploy`, tmpdir) —
     DATABASE_URL utama tidak disentuh (§11 database safety).
   - Cakupan (R2 spec §7): authentication routes (NextAuth resolve + 401 `DENY_NO_SESSION`
     problem-details), workspace lifecycle (POST 201 via HTTP), membership lifecycle (list 200),
     **dynamic member route `[membershipId]` PATCH suspend → 200 via HTTP nyata**, tenant
     isolation (non-member 404; suspended 403 `DENY_MEMBERSHIP_SUSPENDED`; removed → 404),
     invitation lifecycle (POST 201 + token sekali-tampil; accept by token 200; anti-replay
     404 `DENY_INVALID_INVITE`), session lifecycle (revoke → 401 request berikutnya).
   - **Sifat anti-regresi:** defect kelas "direktori mangled" menghasilkan 404 pada request
     dinamis — test ini GAGAL jika path tidak canonical. Static source inspection saja
     TIDAK memadai (R2 spec §7) — kini terpenuhi.
3. **Dokumentasi (§4.H)** — laporan defect + fix (2 file ADDED) + koreksi angka stale di 9
   dokumen (klaim lama dipertahankan sebagai sejarah berkoreksi, tidak dihapus).

## 3. Hasil verifikasi (gate R2, 2026-10-29)

| Gate | Hasil |
|---|---|
| Byte-true path check (working copy) | canonical TRUE · defect path FALSE |
| Konten handler | SHA-256 `12150762af85cb465108ede268e5a5bb5527548278f88d5b20a15ba2efd9bb3c` — identik R0 ✓ |
| Full-tree mangle scan (metode benar: count(mangled) − count(canonical)) | **0 file** (1 false positive dijelaskan di laporan defect §5) |
| HTTP routing test — dev server | **12/12 PASS** |
| HTTP routing test — production server (`next start`, pasca-build) | **12/12 PASS** (2,94 s) |
| Build manifest (`app-path-routes-manifest.json`, byte-true) | standalone mangled = 0; dynamic member route ter-register |
| Suite penuh | 113/113 PASS (13 file) |
| Lint / typecheck | 0 error / 0 error |
| Build produksi | exit 0 (working copy terisolasi; `NEXTAUTH_SECRET` placeholder build-time — fail-safe by design, bukan secret nyata) |
| Security scan | 0 temuan (pola: AWS/private key/Slack/Google/GitHub/JWT/credentialed-URL/secret-named-var) |

## 4. Identitas hash/konten (before → after)

| Objek | BEFORE (R0) | AFTER (R2) | Perubahan |
|---|---|---|---|
| Path handler member | canonical `[membershipId]` | canonical `[membershipId]` | TIDAK ADA (dipertahankan) |
| Konten handler member | `12150762…` | `12150762…` | TIDAK ADA (hash identik) |
| Cakupan test routing | tanpa test HTTP khusus | + `http-routing.test.ts` (12 test) | ADDED baru |
| Dokumentasi defect | tersebar di audit repo-level (di luar paket) | + 2 laporan di dalam paket | ADDED baru |

## 5. Batasan jujur

- Root-cause materiialisasi display→filename (hipotesis) tidak dapat dibuktikan dari
  lingkungan ini — hanya pola dan instance display-mangling yang terdokumentasi.
- Google OIDC real round-trip tetap NOT TESTED (tanpa kredensial — di luar scope remediation).
- Remote CI tetap PENDING sampai owner mengintegrasikan + push (build lokal R2 = bukti tambahan,
  bukan pengganti CI runner).

## 6. Status

```text
ROUTE DEFECT REMEDIATION (R2) = COMPLETE
R2 OWNER VERIFICATION         = PENDING (owner menerima paket → Controlled Integration Review 3 terpisah)
```
