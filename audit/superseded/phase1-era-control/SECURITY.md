# SECURITY — epicRider

Bagian 1 = `CURRENT STATE` (audit Phase 0, 2026-05-22). Bagian 2 = `TARGET STATE` (model target dari Master Control). Dilarang mencampur tanpa label.

---

## 1. CURRENT STATE — audit faktual

### 1.1 Secrets & kredensial
- `.env` berisi tepat 1 key: `DATABASE_URL` (nilai tidak ditampilkan dalam dokumen ini). Status: `VERIFIED`.
- `.gitignore` meng-exclude `.env*`, `*.pem`, `*.log` (baris 26–30, 43–47). Status: `VERIFIED`.
- `git ls-files` menunjukkan `.env` tidak ter-track git. Status: `VERIFIED`.
- Tidak ditemukan secret/kredensial lain ter-commit. Status: `VERIFIED` (berdasar grep pola umum di file tracked + manual review entry points; bukan scan sekret komersial menyeluruh → batas audit dicatat di `PHASE_0_AUDIT_REPORT.md`).

### 1.2 Autentikasi & otorisasi
- Tidak ada implementasi auth: tanpa route `/api/auth`, tanpa konfigurasi provider, tanpa middleware. `next-auth` hanya dependency terpasang. Status: `NOT FOUND`.
- Tidak ada mekanisme otorisasi/entitlement/isolasi tenant. Status: `NOT FOUND`.
- Konsekuensi: SELURUH endpoint yang mungkin dibuat berikutnya tanpa auth adalah terbuka. Saat ini hanya ada 1 route demo publik `GET /api` (hello world) dan 1 halaman statis — tidak ada data sensitif yang terekspos. Status: `VERIFIED`.

### 1.3 Permukaan & konfigurasi
- `next.config.ts`: `ignoreBuildErrors: true` (mematikan pemeriksaan tipe saat build) dan `reactStrictMode: false` — `next.config.ts` baris 6–9. Status: `VERIFIED`. Risiko: bug tipe lolos ke runtime; dicatat sebagai gap G-012.
- Database SQLite lokal `db/custom.db` berisi data demo; tidak berisi data pelanggan. Status: `VERIFIED`.
- Gateway `Caddyfile` satu-port (sandbox). Konfigurasi forward `XTransformPort`. Status: `VERIFIED` (file ada); analisis hardening gateway: `NOT TESTED`.
- CI/CD, dependency scanning, SAST: `NOT FOUND`.

### 1.4 Testing keamanan
- Belum ada security test apa pun. Status: `NOT FOUND`. Command security scan: `NOT RUN` (tidak tersedia tool-nya di scope Phase 0).

## 2. TARGET STATE — model keamanan target (dari Master Control; belum terimplementasi)

### 2.1 Autentikasi (MC §4)
1. **WhatsApp login request:** bukti kontrol atas akun/nomor via mekanisme terverifikasi (dipilih setelah feasibility/vendor review — OD-03); token/request sekali pakai; expiry; anti-replay; rate limiting; anti-abuse monitoring; audit events; recovery/fallback. Nomor telepon saja bukan bukti identitas.
2. **Google Sign-In/SSO:** OAuth 2.0/OIDC dengan validasi state/nonce, issuer, audience, signature, expiry, redirect URI, account-linking aman.
3. Secrets tidak pernah ada di frontend/repository.

### 2.2 Otorisasi & tenancy (MC §5, §6)
1. Multi-tenant/multi-workspace dengan isolasi terbukti (test, bukan klaim).
2. Entitlement server-side untuk perbedaan lisensi; UI hiding bukan kontrol.
3. Identitas global user terpisah dari workspace membership, role, event assignment, developer role, auditor access.
4. Permission memeriksa: aktor, tenant/workspace, objek, aksi, konteks event, lisensi, status objek.
5. Role terpisah & least privilege untuk Developer Portal; semua perubahan komersial teraudit.
6. Auditor: read-only, scoped, time-bound (MC §10).

### 2.3 Integritas record (MC §5, §10)
1. Approved records/evidence tidak boleh dihapus/diubah diam-diam; koreksi via amendment/version history.
2. Sign-off mengikat aktor terautentikasi, role, waktu, konteks, versi.
3. Audit trail: requirement → obligation/risk → control → process → … → closure.
4. Hak akses tetap ditegakkan saat sync offline kembali ke server (MC §8).

### 2.4 Notifikasi developer (MC §2)
Verifikasi hak akses, pratinjau penerima, pembatasan pengiriman, audit log, dedup/idempotency, status pengiriman, proteksi penyalahgunaan.

### 2.5 Data & privasi (MC §9, §10)
1. Metadata sensitif/lokasi hanya dikumpulkan bila perlu, transparan, sesuai kebijakan privasi.
2. Tidak menyalin teks standar berhak cipta; metadata referensi sesuai lisensi penggunaan.
3. Hukum/kewajiban lokal (yurisdiksi Indonesia) diidentifikasi dengan validasi ahli — bukan kesimpulan legal dari engineer (lihat OD-09 di open decisions).

## 3. Gap keamanan → tracking

Semua gap keamanan terdaftar di `PHASE_0_GAP_REGISTER.md` (G-001..G-0xx) dengan severity. Ringkas:
- G-006: tidak ada auth/authorization (High, prerequisite Phase 4)
- G-012: `ignoreBuildErrors: true` melemahkan quality gate (Medium, Phase 3)
- G-013: tidak ada CI/dependency scanning (Medium, Phase 3)
- Threat model penuh: tugas Phase 2 (ROADMAP).
