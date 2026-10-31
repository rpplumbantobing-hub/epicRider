# ADR-025 — Phase 5-D: License & Extension Lifecycle

## Status

**PROPOSED** — dirumuskan pada recovery Phase 5-D (2026-10-31); menunggu ratifikasi owner.
Terhubung ke REQ-098/REQ-099 (sudah disitir requirement) dan ADR-017/023/024. Status dokumen
mengikuti pola ADR-023/024: implementasi ada, keputusan owner atas policy parametrik menunggu.

## Context

- Phase 5-B membangun fondasi domain/database licensing (DMC §3.5/§3.6; ADR-023); Phase 5-C
  membangun engine entitlement fail-closed (ADR-024) yang membaca **status** License dan
  ExtensionInstance namun tidak memiliki mekanisme transisinya.
- REQ-098 mensyaratkan siklus lisensi `purchase→active→renewal→expiry→grace→downgrade`
  dengan RENEWAL_DUE (DMC §6.2); REQ-099 mensyaratkan tidak ada kehilangan data diam-diam
  pada downgrade/removal.
- OD-05 (owner/seat counting), OD-06 (harga/billing/gateway), dan OD-108 (aturan & durasi
  expiry/grace/downgrade) tetap **OPEN** — parameter kebijakan TIDAK boleh dikarang.
- Candidate Phase 5-D pertama (`b687ace`, branch lama) hilang bersih dari environment
  (sandbox ephemeral; tidak pernah dipush/emas). Phase 5-D dieksekusi ulang terkendali
  (recovery) di atas baseline `165b3ba` tanpa menyentuh 5-B/5-C.

## Decision

### 1. Mesin transisi lisensi — 8 aksi kanonik, fail-closed (DMC §6.2; REQ-098)

| Action | From | To | Prasyarat kunci |
|---|---|---|---|
| ACTIVATE | PURCHASED | ACTIVE | tier aktif; belum ada lisensi ACTIVE lain di workspace |
| RENEW | RENEWAL_DUE | ACTIVE | termEndsAt baru **disuplai** pemanggil |
| TERM_END | ACTIVE | RENEWAL_DUE | verify-only: bila termEndsAt tersimpan, `now ≥ termEndsAt` |
| GRACE_ENTER | RENEWAL_DUE | GRACE | tanpa gerbang durasi (OD-108 OPEN); graceEndsAt disimpan bila disuplai |
| RENEW_IN_GRACE | GRACE | ACTIVE | seperti RENEW; penanda grace ditutup (null) |
| GRACE_END | GRACE | EXPIRED | verify-only: bila graceEndsAt tersimpan, `now ≥ graceEndsAt` |
| DOWNGRADE | ACTIVE | DOWNGRADED | tidak mengubah tierId; tidak menyentuh data lain (REQ-099) |
| REACTIVATE | DOWNGRADED | ACTIVE | seperti ACTIVATE |

Semua pasangan (status, action) lain **ditolak fail-closed**, termasuk:
`EXPIRED → ACTIVE` (tidak ditambahkan hanya karena intuitif — EXPIRED terminal),
`PURCHASED → DOWNGRADED` (ambiguitas owner belum diselesaikan — DOWNGRADE hanya dari ACTIVE).
Seluruh 6 status dapat dicapai (tidak ada status dead); RENEWAL_DUE punya pemetaan jelas
(RENEW → ACTIVE; GRACE_ENTER → GRACE). Efek entitlement deterministik: hanya transisi
bertiba di ACTIVE yang meng-grant (engine 5-C membaca status; OD-108 OPEN — tanpa semantik
grace/downgrade tambahan).

**Verify-only, tanpa perhitungan, tanpa scheduler:** modul TIDAK menghitung term/window/grace
dan TIDAK menjadwalkan apa pun (OD-108). `now` disuplai pemanggil/server; batas tersimpan
diverifikasi (belum tercapai → tolak); semua tanggal baru yang ditulis adalah data yang
DISUPLAI pemanggil (alur issuance/renewal 5-E), bukan hasil perhitungan.

### 2. Lifecycle extension — LICENSE_MATRIX §5

| Action | From | To | Catatan |
|---|---|---|---|
| ASSIGN | PURCHASED | ASSIGNED | provisionedAt disuplai; katalog harus aktif |
| ACTIVATE | ASSIGNED, RENEWED | ACTIVE | satu-satunya status yang berkontribusi entitlement |
| SUSPEND | ACTIVE | SUSPENDED | jalur pemadaman — tidak pernah diblokir katalog |
| EXPIRE | ACTIVE, SUSPENDED | EXPIRED | verify-only termEndsAt |
| RENEW | SUSPENDED, EXPIRED | RENEWED | RENEWED **tidak** memberi entitlement sampai ACTIVATE |
| REMOVE | semua non-REMOVED | REMOVED | penghapusan LOGIS (REQ-099); REMOVED terminal |

- **Satu instance LIVE per (workspace, type):** LIVE = {PURCHASED, ASSIGNED, ACTIVE,
  SUSPENDED, RENEWED}. Ditegakkan di level DB via partial unique index pada kolom
  denormalisasi `typeId` (migration `20261031090000_phase5d_lifecycle_invariants`,
  aditif-only; pola preseden 5-B) DAN di service (defense-in-depth).
- Kompatibilitas katalog/type: ASSIGN/ACTIVATE/RENEW butuh definisi `isActive` + status
  CATALOG; type code di luar closed list owner (MC §2/§3) ditolak fail-closed.
- `quantity` dibawa apa adanya sesuai model 5-B — TIDAK ada perhitungan kuota (OD-05/06).

### 3. Otorisasi — vocabulary kanonik dulu, fallback owner PROPOSED (jujur ber-status)

- Permission keys yang dipakai dipetakan PERSIS dari AUTHORIZATION_MODEL §4.5/§4.6:
  `license.renew.initiate` (RENEW, RENEW_IN_GRACE), `extension.assign` (ASSIGN),
  `extension.remove` (REMOVE), `extension.renew.initiate` (RENEW). Key ditambahkan ke
  `permissions.ts` tanpa mengubah key lama dan TIDAK diikat ke preset role Phase 4
  (binding final menunggu ratifikasi owner; OD-122 tetap OPEN).
- Aksi transisi tanpa key kanonik pada model (ACTIVATE, TERM_END, GRACE_ENTER, GRACE_END,
  DOWNGRADE, REACTIVATE, extension ACTIVATE/SUSPEND/EXPIRE) **tidak dikarang permission-
  nya**. Satu-satunya jalur allow = **fallback owner** (membership ACTIVE + role `owner`)
  yang ber-status **PROPOSED** — flag `viaOwnerFallback` selalu teraudit. Status PROPOSED
  BUKAN kebijakan final dan tidak boleh disalahartikan sebagai keputusan owner yang sudah
  diterima.
- Aksi tanpa key kanonik tidak pernah dievaluasi lewat permission placeholder (mencegah
  celah eskalasi jika suatu permission read diberikan ke member di masa depan); rantai
  sesi→tenant→membership ditegakkan eksplisit dengan reason code identik policy Phase 4.
- **Aktor SYSTEM** hanya dapat dibentuk pemanggil internal tepercaya. Phase 5-D tidak
  menambahkan route/API HTTP apa pun (sesuai batas scope 5-B/5-C); aktor USER dibentuk
  server-side dari sesi; client tidak dapat menyuplai `actorType=SYSTEM` untuk eskalasi
  hak. Identitas USER kosong/undefined tidak pernah ter-resolve ke membership mana pun
  (fail-closed; teruji).
- Deny tetap deny: non-member, INVITED, SUSPENDED, REMOVED, LEFT, role tak dikenal, dan
  sesi tidak sah DITOLAK tanpa fallback (teruji per kasus).

### 4. Konkurensi & idempotensi (ADR-017)

- Optimistic: setiap transisi = `updateMany` kondisional pada status terbaca dalam satu
  transaksi; count ≠ 1 → **DENY_CONCURRENT_MODIFICATION** (konflik permukaan eksplisit,
  bukan silent last-write-wins). Keterbatasan jujur: diuji pada SQLite lokal (OD-01 OPEN);
  karakteristik isolasi database produksi TIDAK diuji pada fase ini.
- Invariant "tepat satu ACTIVE per workspace": partial unique index 5-B + pemeriksaan
  service; pelanggaran P2002 dipetakan ke denial teraudit.
- Idempotensi = **state-convergence**: replay aksi state-arrival pada status tujuan yang
  sudah tercapai → no-op SUKSES teraudit (`idempotent: true`); RENEW/RENEW_IN_GRACE hanya
  no-op bila termEndsAt baru identik dengan tersimpan — data berbeda = konflik eksplisit,
  bukan efek ganda. Replay TIDAK menimpa data (provisionedAt/term tetap). Replay-cache
  fisik (ADR-017) menunggu OD-01 — keterbatasan ini disatakan, bukan disembunyikan.

### 5. Audit (REQ-010/024; ENTITLEMENT_MODEL §10)

- Sukses: audit ditulis **dalam transisi yang sama** (atomik — transisi tanpa audit tidak
  mungkin; transaksi gagal = keduanya batal).
- Denial: first-class, teraudit dengan reason code (kategori LICENSE; pola 5-C), best-
  effort `logAudit` Phase 4 (kegagalan tulis audit tidak mengubah keputusan deny yang
  dikembalikan ke pemanggil — tidak ada jalur "gagal senyap tanpa jejak keputusan").

### 6. Tidak diambil keputusannya (tetap OPEN)

- **OD-05** — owner/seat counting: `TierQuota` tidak dikonsumsi; `quantity` tidak dihitung.
- **OD-06** — harga/billing/gateway/checkout: tidak ada issuance/purchase; `sourceType/
  sourceRef` tetap referensi netral yang diisi alur 5-E.
- **OD-108** — aturan/durasi expiry/grace/downgrade: verify-only + data disuplai; tanpa
  scheduler; DOWNGRADE tidak memilih tier tujuan.
- License key: tetap tidak dimodelkan (mengikuti posisi 5-B/PHASE_5_REPORT §D).

## Consequences

**Positif:** mesin status deterministik fail-closed yang dapat diuji penuh; entitlement
5-C kini memiliki mekanisme transisi resmi; invariant per-slot ditegakkan DB; audit
lengkap dua arah (sukses+denial); tidak ada keputusan owner yang dicuri.

**Risiko/keterbatasan (jujur):** jaminan konkurensi hanya teruji pada SQLite lokal
(OD-01); idempotensi state-convergence bukan replay-cache penuh; permission lifecycle
menunggu ratifikasi (fallback PROPOSED aktif); tidak ada surface API/UI — integrasi
endpoint adalah pekerjaan fase berikutnya (5-E).

## Evidence

- `src/lib/licensing/license-lifecycle.ts`, `src/lib/licensing/extension-lifecycle.ts`,
  `src/lib/licensing/lifecycle-shared.ts`; `src/lib/authz/permissions.ts` (4 key §4.5/§4.6);
  `prisma/migrations/20261031090000_phase5d_lifecycle_invariants/`.
- Test: unit (license matrix 48 pasangan; extension 49 slot; tabel otorisasi) +
  integration (transisi end-to-end, otorisasi/denial teraudit, idempotensi, tepat-satu-
  ACTIVE, satu-live-instance P2002, isolasi tenant, REQ-099 data preservation, integrasi
  engine 5-C). Full suite **275/275 PASS**; lint/typecheck/build exit 0; `prisma migrate
  diff` = "No difference detected".
- Ketergantungan: ADR-010 (policy), ADR-017 (konkurensi/idempotensi), ADR-023/024 (5-B/5-C);
  OPEN: OD-05, OD-06, OD-108, OD-01, OD-122.
