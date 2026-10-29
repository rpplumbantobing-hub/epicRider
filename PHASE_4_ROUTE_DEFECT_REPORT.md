# PHASE 4 ROUTE DEFECT REPORT — epicRider

> **Tipe:** Dokumentasi defect historis (R2 re-issue remediation §4.H — evidence historis TIDAK dihapus).
> **Tanggal:** 2026-10-29 · **Baseline:** `b5defc22dbb634b25af98083cc9b969eb4b1f0a2`
> **Status defect:** DIVERGENSI HISTORIS — path defect HANYA pernah ada di filesystem worktree Z.ai;
> TIDAK pernah ada di paket R0 frozen maupun di kandidat R2.

---

## 1. Ringkasan

Selama era implementasi Phase 4 (Okt 2026, worktree terisolasi Z.ai), terdokumentasi divergensi
path route dinamis membership:

```text
Defect historis (worktree Z.ai saja):
  src/app/api/v1/workspaces/[workspaceId]/members/embershipId]/route.ts

Canonical yang diwajibkan:
  src/app/api/v1/workspaces/[workspaceId]/members/[membershipId]/route.ts
```

Karakter defect: nama direktori dinamis kehilangan dua byte pertama segmen (`[m`), menghasilkan
segmen statis tak sah `embershipId]` — route dinamis `[membershipId]` TIDAK ter-resolve oleh
Next.js jika dalam bentuk ini (request `PATCH /api/v1/workspaces/:id/members/:membershipId`
akan 404).

## 2. Evidence historis & rantai verifikasi (tetap dapat diaudit)

1. **R0 frozen package — canonical, byte-proven** (audit `PHASE_4_R1_CONTROLLED_INTEGRATION_REVIEW_3.md`
   §B, di-reproduksi ulang 2026-10-29):
   - Nama entri ZIP (central directory), hex: `…2f6d656d626572732f` + `5b 6d656d626572736869704964 5d`
     → `5b6d656d6265727368697049645d` = `[membershipId]` — **CANONICAL**.
   - Raw-byte scan seluruh file ZIP: `[membershipId]` ×2; `embershipId]` ×2 — keduanya substring
     dari token canonical; **0** kemunculan path defect yang berdiri sendiri.
   - Konten handler: SHA-256 `12150762af85cb465108ede268e5a5bb5527548278f88d5b20a15ba2efd9bb3c`
     (1.626 byte).
2. **Worktree Z.ai era defect** — divergensi tercatat dalam remediation history Phase 4
   (Controlled Integration Review 1/2); status historis dipertahankan:
   `R0 frozen package = CANONICAL · Z.ai worktree = DIVERGENT · R1 = CORRECTED candidate (tidak
   pernah terverifikasi; CLOSED)`.
3. **Fenomena display-mangling (akar masalah yang paling plausibel — hipotesis berlabel):**
   di lingkungan ini terdokumentasi berulang bahwa transcript/output dapat merender
   `[membershipId]` menjadi `embershipId]` (dua byte `[m` termakan renderer — pola ANSI reset).
   Instance terdokumentasi: (a) near-miss audit Review 3 §11 (listing pertama tampil mangled,
   hex membuktikan canonical); (b) 2026-10-29: output `find` dan bahkan `repr()` Python tampil
   mangled, sementara pemeriksaan byte-true (`os.path.isfile`, `sha256`, hex) membuktikan
   canonical. **Label jujur:** materiialisasi display→filename sebagai akar defect historis
   adalah hipotesis (tidak dapat dibuktikan dari lingkungan ini), bukan klaim terverifikasi.
4. **Aturan metodologis yang lahir dari defect ini:** transcript rendering TIDAK boleh dipakai
   sebagai bukti path/konten — hanya `repr()`/hex/SHA-256/raw-byte count.

## 3. Path canonical yang diharapkan & identitas konten

```text
Path     : src/app/api/v1/workspaces/[workspaceId]/members/[membershipId]/route.ts
Hex path : 5b776f726b737061636549645d 5b6d656d6265727368697049645d (segmen dinamis)
Konten   : SHA-256 12150762af85cb465108ede268e5a5bb5527548278f88d5b20a15ba2efd9bb3c (1.626 byte)
           = hash yang tercatat di manifest R0 = hash BEFORE pada spec remediasi historis.
```

## 4. Koreksi (ringkas — detail di PHASE_4_ROUTE_DEFECT_FIX_REPORT.md)

R0 frozen SUDAH canonical (path + konten) — tidak ada rename yang diperlukan pada paket.
Koreksi R2 = (1) mempertahankan path canonical tanpa perubahan konten handler; (2) menambahkan
`tests/integration/http-routing.test.ts` yang membuktikan route dinamis benar-benar ter-routing
via HTTP nyata (defect kelas ini TIDAK mungkin lolos test tersebut); (3) scan menyeluruh 0 token
mangled standalone di seluruh tree.

## 5. Verifikasi ulang 2026-10-29 (R2 working copy, byte-true)

```text
Canonical exists (os.path.isfile)        : TRUE
Defect directory exists                  : FALSE
Canonical content SHA-256                : 12150762af85cb465108ede268e5a5bb5527548278f88d5b20a15ba2efd9bb3c ✓
Full-tree scan (standalone mangled, benar: count(mangled) − count(canonical)):
  seluruh tree (289 file, excl. node_modules/.next/.git) : 0 file (satu temuan awal
  "orkspaceId]" pada tests/integration/tenant-isolation.test.ts terbukti false positive —
  ekor array literal TS `[tenantA.workspaceId]`, bukan defect path).
HTTP routing proof: tests/integration/http-routing.test.ts 12/12 PASS (dev + production).
```

## 6. Status akhir

```text
R0 frozen package : CANONICAL (byte-proven, 3 kali independen: Review 3, overlay R2, scan R2)
Kandidat R2       : CANONICAL (dipertahankan + terbukti via HTTP nyata)
Defect class      : TERTUTUP untuk kandidat R2 — regression guard aktif (http-routing.test.ts)
```
