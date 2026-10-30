# ADR-024 — Entitlement Engine & Enforcement (Phase 5-C)

**Status:** PROPOSED (menunggu ratifikasi owner — pola ADR-022/ADR-023)
**Tanggal:** 2026-10-30 · **Baseline:** commit `20a0169` (Phase 5-B) pada `integration/phase5-b-licensing-domain-db`
**Sumber:** MASTER_CONTROL §2 (formula effective access; taxonomy), ENTITLEMENT_MODEL §3/§4/§7/§10,
AUTHORIZATION_MODEL §2/§3 (vocabulary reason code), LICENSE_MATRIX §2/§5, ADR-010 (authorization),
ADR-011 (entitlement model), ADR-023 (fondasi 5-B), prompt owner Phase 5-C (2026-10-30).

## 1. Konteks

Phase 5-B menyediakan fondasi data licensing (8 model + vocabulary + migration) tanpa runtime.
Phase 5-C mengubah fondasi itu menjadi **mekanisme server-side authoritative** yang menentukan apakah
sebuah Workspace berhak menggunakan Capability tertentu — tanpa menyelesaikan OD-05/OD-06/OD-108.

## 2. Keputusan

1. **Arsitektur evaluator murni + service guards** (identik pola authz Phase 4): semua fakta
   diselesaikan service dari DB; evaluator (`entitlement.ts`) murni dan DETERMINISTIK — fakta sama →
   keputusan sama (objek keputusan tanpa timestamp; audit menambahkan waktu).
2. **Objek keputusan eksplisit**: `decision` (`ALLOWED`/`DENIED`) + `kind`
   (`GRANTED`/`POLICY_DENIAL`/`UNKNOWN`/`SYSTEM_ERROR`) + `reasonCode` + `evidence`
   (workspaceId/licenseId/tierCode/ruleId/extensionsActive). Membedakan denied-policy vs unknown vs
   system-error; SEMUA cabang non-grant = DENIED (fail closed; tidak ada fallback allow).
3. **Vocabulary reason code**: mengevaluasi 3 kode kanonik AUTHORIZATION_MODEL §3 yang sejak Phase 4
   dideklarasikan (`DENY_TIER_ENTITLEMENT_MISSING`, `DENY_LICENSE_STATE`, `DENY_EXTENSION_MISSING`);
   menambahkan 6 kode terdokumentasi 5-C (`DENY_NO_ACTIVE_LICENSE`, `DENY_CAPABILITY_DISABLED`,
   `DENY_UNKNOWN_CAPABILITY`, `DENY_INVALID_TIER`, `DENY_WORKSPACE_CONTEXT_INVALID`,
   `ENTITLEMENT_UNEVALUABLE_INPUT`). Vocabulary kanonik tidak diubah; `DENY_QUOTA_EXCEEDED` (OD-05)
   dan `DENY_STORE_TIER` (Phase 11) tetap deklarasi.
4. **Sumber entitlement = license status ACTIVE saja** (vocabulary 5-B `ACTIVE_LICENSE_STATUS`).
   State lain → `DENY_LICENSE_STATE` deterministik. Engine MENGIKUTI status data — tidak membangun
   transisi/durasi (5-D; OD-108 OPEN).
5. **Konsistensi matriks runtime**: rule DB ⇔ TIER_CAPABILITY_MATRIX (LICENSE_MATRIX §2) wajib cocok;
   drift → `SYSTEM_ERROR` fail closed (invariant "seed = vocabulary" dijaga di runtime).
6. **Extension-aware tanpa lifecycle**: parameter opsional `requiredExtensionType` (closed list
   MC §2/§3; di luar list = SYSTEM_ERROR); instance status ACTIVE berkontribusi (LICENSE_MATRIX §5);
   instance workspace lain tidak pernah menghitung (tenant isolation). Condition-per-rule di schema
   dan lifecycle lengkap = 5-D.
7. **Integrasi Entitlement × Authorization tetap terpisah** (prompt owner §6/§12):
   (a) policy Phase 4 mengevaluasi input entitlement BILA disediakan (entitlement hanya MEMBATASI;
   input absen = perilaku Phase 4 identik — regresi membuktikan);
   (b) `authorizeWorkspaceCapability` = entitlement (gate) → policy aktor (grant) dengan short-circuit
   deny SEBELUM penilaian aktor; kedua keputusan diekspos terpisah (`entitlement`, `authorization`,
   `final`). "Punya license" tidak pernah berarti "boleh melakukan semuanya".
8. **Audit**: kategori `LICENSE` (aditif) pada audit-service Phase 4; `entitlement.denied` (first-class,
   outcome DENIED + reasonCode) dan `entitlement.granted` (snapshot evidence). Key metadata aman
   terhadap sanitizer. Retensi/akses = OD-138 OPEN.
9. **Tanpa perubahan schema/migration** — engine murni kode di atas model 5-B; REQ-029 tetap terjaga.

## 3. Konsekuensi

- Enforcement server-side tersedia sebagai kontrak service teruji; eksposur HTTP/UI = 5-E.
- Tier-gated endpoint masa depan memanggil `authorizeWorkspaceCapability` (atau evaluasi entitlement
  + policy) — bypass UI menghasilkan audited denial (REQ-024).
- OD-05: engine tidak mengonsumsi TierQuota/tidak menghitung seat. OD-06: tidak ada kode komersial.
  OD-108: engine membaca status; state non-ACTIVE deny tanpa memilih kebijakan restrict/archive/delete.
- Keterbatasan: SQLite dev (ADR-006 untuk produksi); vocabulary status PROPOSED; snapshot evidence di
  metadataJson (OD-138).

## 4. Pemetaan reason code (referensi)

| Kode | Pemicu | Sumber |
|---|---|---|
| `ALLOW` | semua input entitlement lolos | AUTHORIZATION_MODEL §3 |
| `DENY_TIER_ENTITLEMENT_MISSING` | tier tidak meng-grant capability (rule+matriks absen) | kanonik §3; REQ-024 |
| `DENY_LICENSE_STATE` | license ada tapi status bukan ACTIVE; atau tier non-aktif | kanonik §3; REQ-098 (OD-108) |
| `DENY_EXTENSION_MISSING` | extension disyaratkan tidak ACTIVE di workspace | kanonik §3; MC §2 |
| `DENY_NO_ACTIVE_LICENSE` | tidak ada baris license sama sekali | tambahan 5-C (ADR-024) |
| `DENY_CAPABILITY_DISABLED` | capability DEPRECATED | tambahan 5-C; DMC §3.5 |
| `DENY_UNKNOWN_CAPABILITY` | capability tidak dikenal (kind UNKNOWN) | tambahan 5-C |
| `DENY_INVALID_TIER` | tier di luar closed set (HI_RIDER/TOTAL_RIDER/dll.) | tambahan 5-C; MC §2.1/§2.2 |
| `DENY_WORKSPACE_CONTEXT_INVALID` | konteks workspace tidak valid | tambahan 5-C; AUTHORIZATION_MODEL §2 |
| `ENTITLEMENT_UNEVALUABLE_INPUT` | drift katalog/vocabulary, invariant breach, input invalid (kind SYSTEM_ERROR) | tambahan 5-C; ENTITLEMENT_MODEL §3.6 |
