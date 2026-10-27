# TESTING — epicRider

## 1. CURRENT STATE — audit Phase 0 (2026-05-22)

| Aspek | Fakta | Status |
|---|---|---|
| Test framework aplikasi | Tidak terpasang (tidak ada vitest/jest/playwright di `package.json`) | `NOT FOUND` |
| Test suite aplikasi | Tidak ada; `tests/` berisi 3 script infrastruktur sandbox (`python-runtime-build.sh`, `database-runtime-build.sh`, `python-runtime-container.sh`) yang BUKAN test aplikasi | `NOT FOUND` |
| Lint | `bun run lint` (eslint .) → exit 0, bersih, dijalankan 2026-05-22 | `VERIFIED` (dijalankan) |
| Dev server smoke | `GET / 200` di `dev.log`; render terverifikasi via headless browser (screenshot `audit/evidence/current-home-*.png`) | `VERIFIED` (dijalankan) |
| Build produksi | `bun run build` TIDAK dijalankan pada Phase 0 (dilarang oleh batasan lingkungan; sandbox memakai dev server) | `NOT RUN` |
| Migration/test DB | Tidak ada migrations folder; tidak dijalankan perubahan schema pada Phase 0 | `NOT RUN` (sesuai batasan) |
| Security scan | Tidak ada tool/scanner; tidak dijalankan | `NOT RUN` |
| Aksesibilitas otomatis | Tidak ada; layar yang ada hanya placeholder logo | `NOT TESTED` |

## 2. TARGET STATE — strategi testing (PROPOSED, dirinci per fase)

### 2.1 Level & tooling usulan (keputusan tooling final = ADR saat Phase 3, jangan mengunci sekarang)
- **Unit/integration:** runner test TypeScript (mis. vitest) untuk domain logic: permission, entitlement, workflow states.
- **API/contract:** test endpoint via HTTP untuk kontrak web+mobile.
- **E2E:** browser automation untuk golden path (login, event, rider, aset, evidence).
- **Aksesibilitas:** axe/serupa + keyboard manual check per layar kunci (UX_UI_STANDARD).
- **Visual regression:** bila tersedia, untuk design system.
- **Security:** dependency audit + threat-model-driven test (Phase 2+).

### 2.2 Definition of Done per fase (dari Master Control §15)
Fase hanya boleh `DONE` jika: acceptance criteria terpenuhi; test relevan dijalankan & hasilnya dicatat; regresi diperiksa; keamanan/tenant isolation/entitlement diperiksa sesuai scope; migrasi aman; dokumentasi diperbarui; tanpa blocker kritis tersembunyi. Build sukses ≠ penerimaan; screenshot ≠ bukti business logic.

### 2.3 Test wajib pertama kali muncul (per domain, dipetakan dari REQUIREMENTS)
| Domain | Test minimum |
|---|---|
| Auth (REQ-021/022) | Validasi OTP sekali pakai/expiry/anti-replay; OIDC state/nonce/aud; account-linking |
| Tenancy (REQ-023) | Isolasi lintas workspace (CRUP lintas-tenant ditolak) |
| Entitlement (REQ-024, 010) | Akses fitur diblokir server-side untuk tier tanpa hak |
| Permission (REQ-026) | Matrix aktor×objek×aksi×konteks |
| Rider/Media kit (REQ-004/005) | Relasi ke event ditegakkan |
| Seat limit (REQ-009) | Penolakan kru ke-6 sesuai keputusan kuota |
| Evidence/Sign-off (REQ-043) | Record locked setelah approval; koreksi via amendment |
| QR/Scan (REQ-036) | Generate→print→scan→lookup end-to-end |

## 3. Bukti pengujian akan dicatat per fase
Setiap fase wajib menulis: command yang dijalankan, hasil aktual, lingkup, dan yang tidak dijalankan (`NOT RUN`) — pola sama dengan `PHASE_0_ACCEPTANCE.md`.
