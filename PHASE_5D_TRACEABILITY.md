# PHASE 5-D TRACEABILITY — License & Extension Lifecycle (RECOVERY)

Setiap klaim → sumber kontrak → implementasi → bukti test. (Pola PHASE_5_TRACEABILITY.)

## 1. Requirement → Implementasi → Test

| Req/Dokumen | Klaim | Implementasi | Bukti |
|---|---|---|---|
| REQ-098 (MC §2/§3; DMC §6.2) | Siklus purchase→active→renewal→expiry→grace→downgrade; setiap transisi teruji; akses mengikuti status | `license-lifecycle.ts` matriks 8 aksi; status vocabulary 5-B tidak berubah | unit 48-pasangan; integration alur penuh; engine 5-C `DENY_LICENSE_STATE`↔`ALLOWED` |
| REQ-098 → OD-108 | Aturan & durasi = keputusan owner | verify-only; tanpa scheduler; tanggal = data disuplai | `DENY_TERM_NOT_ENDED`/`DENY_GRACE_NOT_ENDED` test; tanpa jam dinding di modul |
| REQ-099 (MC §2) | Downgrade/removal tanpa kehilangan data diam-diam; data utuh untuk upgrade kembali | DOWNGRADE tanpa ubah tierId/data; REMOVE logis; REACTIVATE memulihkan | integration REQ-099 (license & extension) |
| REQ-099 → OD-108 | restrict vs archive vs delete = owner | REMOVED/EXPIRED = status logis; tidak ada DELETE data | test REMOVED baris tetap + sourceRef |
| REQ-024 (MC §5/§6) | Entitlement server-side; bypass = denial teraudit | transisi memengaruhi engine 5-C; denial lifecycle teraudit | integration entitlement naik/turun; audit events |
| REQ-010/REQ-024 | Denial = first-class | audit `.denied` dengan reason code | integration audit-denial test |
| REQ-023 | Isolasi tenant | fakta aktor dari DB per (workspace, user); identitas kosong ditolak | integration owner-workspace-lain & anon test |
| REQ-026 | Permission memeriksa aktor/objek/status | rantai policy Phase 4 + prasyarat status di matriks | unit+integration otorisasi |
| LICENSE_MATRIX §5 | Lifecycle extension kanonik | `extension-lifecycle.ts` 6 aksi; satu-live per (workspace,type) | unit 49-slot; integration P2002 + index |
| ENTITLEMENT_MODEL §4 | Hanya ACTIVE lisensi/instance yang meng-grant | efek transisi deterministik; engine 5-C tak berubah | unit efek; integration SUSPEND/RENEW/EXPIRE/REMOVE |
| AUTHORIZATION_MODEL §4.5/§4.6 | Vocabulary permission kanonik | 4 key dipetakan persis; TANPA key = default deny `DENY_PERMISSION_MISSING` (remediasi PR #4 — fallback owner ALLOW dihapus; ratifikasi katalog = keputusan owner) | unit tabel otorisasi; integration owner/member/non-member/sesi ditolak + SYSTEM-allow vs USER-deny |
| Remediasi PR #4 — Temuan A | Migration mempertahankan & memigrasikan data existing yang valid; gagal eksplisit pada data invalid | backfill `typeId` dari `definitionId → ExtensionDefinition.typeId` SEBELUM unique index; preflight/postflight RAISE eksplisit; tanpa delete/auto-pick | `licensing-migration.test.ts`: POSITIVE legacy nyata + 3 NEGATIVE |
| ADR-017 | Optimistic concurrency + idempotency keys | guard kondisional; state-convergence idempotency; keterbatasan OD-01 jujur | race test license; replay tests |
| ADR-023/024 | Fondasi 5-B/5-C tidak diubah | tidak ada perubahan implementasi/migration lama (aditif-only) | test migration; `git diff` laporan §D |
| MC §2/§3 (REQ-018) | Extension type closed list owner | type di luar list ditolak fail-closed | rogue-type test |

## 2. Open decisions — status tidak berubah

| OD | Status | Perilaku 5-D |
|---|---|---|
| OD-05 | **OPEN** | `TierQuota`/`quantity` tidak dikonsumsi; tidak ada seat counting |
| OD-06 | **OPEN** | tidak ada harga/issuance/checkout; sourceType/sourceRef netral |
| OD-108 | **OPEN** | verify-only; tanpa scheduler; DOWNGRADE tanpa target tier |
| (terkait) OD-01 | **OPEN** | jaminan konkurensi teruji SQLite lokal saja — dinyatakan jujur |
| (terkait) OD-122 | **OPEN** | preset role Phase 4 tidak berubah; TIDAK ada grant permission lifecycle ke role manapun — tanpa ratifikasi owner, aksi lifecycle USER = default deny (remediasi PR #4) |

## 3. Artefak Phase 5-D (recovery)

```text
New:
  src/lib/licensing/lifecycle-shared.ts
  src/lib/licensing/license-lifecycle.ts
  src/lib/licensing/extension-lifecycle.ts
  adr/ADR-025-phase5d-license-extension-lifecycle.md
  PHASE_5D_REPORT.md · PHASE_5D_ACCEPTANCE.md · PHASE_5D_TRACEABILITY.md
  prisma/migrations/20261031090000_phase5d_lifecycle_invariants/migration.sql
  tests/unit/license-lifecycle.test.ts · tests/unit/extension-lifecycle.test.ts
  tests/unit/lifecycle-authorization.test.ts
  tests/integration/license-lifecycle.test.ts · tests/integration/extension-lifecycle.test.ts
Modified (aditif / remediasi PR #4):
  src/lib/authz/permissions.ts (+4 key §4.5/§4.6)
  prisma/schema.prisma (ExtensionInstance +typeId denormalisasi, terdokumentasi)
  prisma/migrations/20261031090000_phase5d_lifecycle_invariants/migration.sql
    (backfill existing-data + preflight/postflight — remediasi PR #4; 4/5-B tidak disentuh)
  src/lib/licensing/lifecycle-shared.ts · license-lifecycle.ts · extension-lifecycle.ts
    (fallback owner ALLOW dihapus — remediasi PR #4)
  tests/integration/licensing-migration.test.ts (daftar migration untracked: 5-B atau 5-D;
    preseden penyesuaian 5-C + suite backfill remediasi)
  tests/integration/license-lifecycle.test.ts · extension-lifecycle.test.ts (aktor SYSTEM
    untuk success-path; matriks otorisasi remediasi)
  tests/unit/license-lifecycle.test.ts · extension-lifecycle.test.ts ·
    lifecycle-authorization.test.ts (label ratifikasi, bukan jalur otorisasi)
  ROADMAP.md · PHASE_STATUS.md · worklog.md (koreksi historis + status remediasi)
Tidak disentuh:
  implementation/migration Phase 4/5-B/5-C · OPEN_DECISIONS.md · REQUIREMENTS.md ·
  LICENSE_MATRIX.md · ENTITLEMENT_MODEL.md · AUTHORIZATION_MODEL.md · MASTER_CONTROL.md
```

## 4. Catatan recovery & remediasi

Candidate historis `b687ace` PERNAH dibuat dan dipaketkan pada sesinya (Git bundle + ZIP
transfer package dihasilkan; ukuran dan SHA-256 tercatat pada laporan historis). Namun
branch/artifact tersebut TIDAK lagi tersedia pada environment saat recovery dilakukan dan
TIDAK ditemukan pada GitHub (tidak ada bukti pernah dipush). Karena itu recovery
menghasilkan candidate baru `cb4fc97` yang diverifikasi terhadap baseline `165b3ba`.
Tidak ada file/dokumen lama yang dipalsukan; laporan ini dibuat dari bukti aktual recovery.

Remediasi PR #4 (satu commit di atas `cb4fc97`): Temuan A — backfill existing-data pada
migration `typeId` + preflight/postflight gagal-eksplisit; Temuan B — jalur ALLOW
`OWNER_FALLBACK_PROPOSED` dihapus (explicit permission only; default deny termasuk owner;
ratifikasi katalog = keputusan owner); Temuan C — koreksi formulasi historis pada
dokumen (termasuk paragraf ini). Full gate: 291/291 test (2×), lint/typecheck/build exit 0,
prisma validate/generate/migrate diff/deploy (kosong + legacy) PASS.
