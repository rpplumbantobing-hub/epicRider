# PHASE 5-D ACCEPTANCE — License & Extension Lifecycle (RECOVERY)

Penilaian berdasarkan kondisi aktual recovery (baseline `165b3ba`; bukan angka lama yang
dipaksakan). Status yang dipakai: VERIFIED / PARTIAL / NOT TESTED / BLOCKED / PROPOSED.

| # | Kriteria | Status | Bukti |
|---|---|---|---|
| 1 | Mesin transisi lisensi deterministik fail-closed, 8 aksi kanonik DMC §6.2 | **VERIFIED** | `LICENSE_TRANSITIONS` + 48 pasangan ter-cover (`tests/unit/license-lifecycle.test.ts`) |
| 2 | EXPIRED → ACTIVE langsung ditolak | **VERIFIED** | unit (4 aksi ditolak dari EXPIRED) + integration (`EXPIRED terminal` loop) |
| 3 | PURCHASED → DOWNGRADED ditolak sampai ambiguitas owner selesai | **VERIFIED** | unit + integration (`downgrade-purchased`) |
| 4 | Seluruh status reachable; tidak ada status dead; RENEWAL_DUE terpetakan | **VERIFIED** | unit `keterjangkauan status` + `RENEWAL_DUE punya pemetaan transisi yang jelas` |
| 5 | Term/window/grace tidak dihitung sendiri; tanpa scheduler (OD-108) | **VERIFIED** | verify-only assertions (`DENY_TERM_NOT_ENDED`/`DENY_GRACE_NOT_ENDED`); tanggal baru = data disuplai; modul tanpa jam dinding/scheduler |
| 6 | Otorisasi: member/non-member/sesi tidak sah/role tak dikenal ditolak; denial teraudit | **VERIFIED** | integration (24 test); audit `license.lifecycle.*.denied` |
| 7 | **Remediasi PR #4:** OWNER_FALLBACK_PROPOSED DIHAPUS sebagai jalur ALLOW — tanpa permission eksplisit terdokumentasi = default deny `DENY_PERMISSION_MISSING` TERMASUK untuk role `owner`; ratifikasi katalog = keputusan owner (PROPOSED/OPEN), bukan kebijakan aktif | **VERIFIED** | integration: owner USER ditolak (keyless + keyed), SYSTEM-allow vs USER-deny; unit: struktur tabel tanpa mekanisme allow lain (`ownerRatificationStatus` tidak pernah dibaca `authorizeLifecycleAction`) |
| 8 | Aktor SYSTEM hanya pemanggil internal; client tidak dapat menyuplai | **VERIFIED (scope domain)** | Tidak ada route HTTP 5-D (test `existsSync src/app/api/v1/{licensing,licenses,extensions}` false); SYSTEM teraudit `actorType:"SYSTEM"`. Binding API fase berikutnya wajib membentuk actor server-side (ADR-025 §7) |
| 9 | Extension lifecycle LICENSE_MATRIX §5 end-to-end | **VERIFIED** | integration 16 test (ASSIGN→…→REMOVE) |
| 10 | RENEWED/SUSPENDED/EXPIRED/REMOVED tidak memberi entitlement; ACTIVATE memberi | **VERIFIED** | integrasi engine 5-C (`DENY_EXTENSION_MISSING`↔`ALLOWED`) |
| 11 | Satu LIVE instance per (workspace, type) ditegakkan DB + service | **VERIFIED** | P2002 sejak PURCHASED; slot bebas pasca-EXPIRED; type terpisah; index terpasang (sqlite_master) |
| 11b | **Remediasi PR #4 (Temuan A):** migration backfill existing data — legacy 5-B `typeId` NULL di-backfill dari `definitionId → ExtensionDefinition.typeId` SEBELUM unique index; data utuh; lifecycle mengevaluasi hasil migration; data invalid (orphan / type tidak resolve / duplikat LIVE) → migration gagal eksplisit tanpa delete/auto-pick/status change | **VERIFIED** | `licensing-migration.test.ts`: POSITIVE legacy nyata + 3 NEGATIVE (`PHASE5D_BACKFILL_FAILED: …` teridentifikasi); predicate LIVE = persis `EXTENSION_LIVE_STATUSES` |
| 12 | Kompatibilitas katalog/type fail-closed | **VERIFIED** | definisi non-aktif; rogue type; typeId null |
| 13 | Idempotensi: retry identik = no-op teraudit; tidak menimpa data; data berbeda = konflik | **VERIFIED** (state-convergence) | integration license RENEW replay + extension ASSIGN replay; keterbatasan replay-cache fisik = OD-01 (jujur) |
| 14 | Konkurensi: konflik permukaan eksplisit (bukan silent last-write-wins) | **VERIFIED** (SQLite lokal) | license race (1 pemenang + denial teraudit); **NOT TESTED pada DB produksi (OD-01)** |
| 15 | Tepat satu ACTIVE per workspace | **VERIFIED** | service denial + P2002 partial unique 5-B |
| 16 | REQ-099: DOWNGRADE/REMOVE tidak menghapus data; data utuh untuk upgrade kembali | **VERIFIED** | license: tierId/membership/audit utuh + REACTIVATE memulihkan entitlement; extension: baris REMOVED tetap dengan sourceRef |
| 17 | Akses mengikuti status (engine 5-C terintegrasi) | **VERIFIED** | `DENY_LICENSE_STATE` pasca-DOWNGRADE; `ALLOWED` pasca-REACTIVATE |
| 18 | Audit sukses atomik dengan transisi | **VERIFIED** (desain + test positif) | audit ditulis dalam `$transaction`; pengujian kegagalan-tulis-audit dengan fault injection tidak dilakukan (PARTIAL note) |
| 19 | Regression penuh (Phase 4 + 5-B + 5-C) tidak terganggu | **VERIFIED** | 291/291 (221 regresi + 70 baru 5-D; 2× stabil); migration test 5-B lulus — Phase 4/5-B/lock terbukti tidak berubah vs HEAD |
| 20 | Lint / typecheck / build | **VERIFIED** | exit 0 / exit 0 / exit 0 (placeholder NEXTAUTH_SECRET pola CI owner) |
| 21 | Prisma validate/generate/migrate diff/deploy disposable | **VERIFIED** | valid; generate OK; "No difference detected"; deploy PASS (kosong) + PASS pada legacy 5-B nyata (backfill) |
| 22 | OD-05/OD-06/OD-108/OD-122 tidak diambil keputusannya | **VERIFIED** | tanpa kuota/harga/issuance/scheduler; tanpa grant permission baru ke role manapun (fallback dihapus — action menunggu ratifikasi owner = default deny); `OPEN_DECISIONS.md` tidak diubah |
| 23 | License key tidak dimodelkan | **VERIFIED** | mengikuti posisi 5-B; tidak ada field/kode license key |
| 24 | Dukungan bahasa/nilai baru dikarang? (tidak boleh) | **VERIFIED** | hanya 4 key permission §4.5/§4.6 + reason code lifecycle baru terdokumentasi ADR-025; vocabulary lama utuh |
| 25 | Keamanan payload audit (REQ-054) | **VERIFIED** | audit lifecycle memakai sanitizer `logAudit` Phase 4 (kunci sensitif di-redaksi) |
| 26 | Dokumentasi & traceability | **VERIFIED** | ADR-025 (PROPOSED), PHASE_5D_REPORT, PHASE_5D_TRACEABILITY, ROADMAP, PHASE_STATUS, worklog |

## Rekap

```text
VERIFIED : 27 (26 area + 11b remediasi backfill)
PARTIAL  : 0
NOT TESTED (sub-scope tercatat dalam nomor VERIFIED): DB produksi konkurensi (OD-01, #14);
  fault-injection audit-write (#18); binding API SYSTEM-actor (#8 — fase 5-E+);
  database produksi untuk migration backfill (diuji pada SQLite disposable legacy)
BLOCKED  : 0
PROPOSED : ratifikasi katalog permission lifecycle kepada role/preset (keputusan owner;
           sampai disahkan: aksi lifecycle USER = default deny — remediasi PR #4);
           ADR-025 (PROPOSED, pola ADR-023/024)
```

**HASIL: PHASE_5D RECOVERY + REMEDIASI PR #4 ACCEPTANCE = PASS WITH LIMITATIONS (27/27
area VERIFIED, dengan limitations sub-scope yang dinyatakan jujur — bukan 24/26 angka
lama yang dipaksakan; perbedaan dijelaskan di PHASE_5D_REPORT §E/§G).**
