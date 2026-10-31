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
| AUTHORIZATION_MODEL §4.5/§4.6 | Vocabulary permission kanonik | 4 key dipetakan persis; tanpa key = fallback owner PROPOSED | unit tabel otorisasi; integration member/non-member |
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
| (terkait) OD-122 | **OPEN** | preset role Phase 4 tidak berubah; binding permission lifecycle menunggu ratifikasi |

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
Modified (aditif):
  src/lib/authz/permissions.ts (+4 key §4.5/§4.6)
  prisma/schema.prisma (ExtensionInstance +typeId denormalisasi, terdokumentasi)
  tests/integration/licensing-migration.test.ts (daftar migration untracked: 5-B atau 5-D;
    preseden penyesuaian 5-C)
  ROADMAP.md · PHASE_STATUS.md · worklog.md
Tidak disentuh:
  implementation/migration Phase 4/5-B/5-C · OPEN_DECISIONS.md · REQUIREMENTS.md ·
  LICENSE_MATRIX.md · ENTITLEMENT_MODEL.md · AUTHORIZATION_MODEL.md · MASTER_CONTROL.md
```

## 4. Catatan recovery

Candidate lama `b687ace` hilang (sandbox ephemeral; tidak pernah dipush/dipack). Recovery
dibangun ulang dari baseline `165b3ba` dengan kontrak yang sama; hash baru adalah NORMAL.
Tidak ada file/dokumen lama yang dipalsukan; laporan ini dibuat dari bukti aktual recovery.
