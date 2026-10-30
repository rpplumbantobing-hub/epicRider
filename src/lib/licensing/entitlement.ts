// Entitlement engine core — epicRider Phase 5-C (ADR-024).
//
// EVALUATOR MURNI (tanpa I/O, tanpa timestamp, tanpa random) — semua fakta
// diselesaikan lapisan service (`entitlement-service.ts`) dari sumber
// tepercaya (DB hasil migration Phase 5-B), lalu evaluator menentukan hasil
// secara DETERMINISTIK: fakta sama → keputusan sama.
//
// Sumber kontrak (tidak ada nilai yang dikarang di sini):
// - Formula effective access: MASTER_CONTROL.md §2 — "Tier Entitlement +
//   Active Extensions + Capability Rules + Role/Permission + Resource Context
//   + Object State". Engine 5-C mengevaluasi input ENTITLEMENT (tier +
//   extension + capability rule); Role/Permission TIDAK digantikan —
//   integrasinya via policy Phase 4 (lihat entitlement-service.ts).
// - Semantik evaluasi: ENTITLEMENT_MODEL.md §3 — prerequisite first,
//   short-circuit deny, additive within tier, gating vs granting, never
//   UI-derived, DENY-BY-DEFAULT (input unknown/unevaluable → deny).
// - Reason code kanonik: AUTHORIZATION_MODEL.md §3 (DENY_TIER_ENTITLEMENT_
//   MISSING / DENY_LICENSE_STATE / DENY_EXTENSION_MISSING — dideklarasikan
//   Phase 4, dievaluasi mulai Phase 5-C). Kode tambahan 5-C didokumentasikan
//   di ADR-024; TIDAK ada kode yang dihapus dari vocabulary kanonik.
// - Matriks tier→capability: LICENSE_MATRIX.md §2 via TIER_CAPABILITY_MATRIX
//   (vocabulary Phase 5-B) — DB rule dan matriks WAJIB konsisten; drift =
//   system error (fail closed), bukan allow.
// - Status lisensi: vocabulary Phase 5-B (DMC §6.2). HANYA ACTIVE
//   (ACTIVE_LICENSE_STATUS) yang menjadi sumber entitlement (ENTITLEMENT_MODEL
//   §4). TIDAK ada semantik expiry/grace/downgrade baru — OD-108 OPEN.
// - Extension: instance status ACTIVE berkontribusi pada effective access
//   (LICENSE_MATRIX §5; ENTITLEMENT_MODEL §7). Lifecycle lengkap = 5-D.
//
// Pemisahan konsep (MC §2; prompt owner 5-C §6): License (tier/status) →
// Capability (kemampuan) → CapabilityRule (aturan tier) → Extension (tambahan
// di atas tier) → Entitlement (hasil evaluasi) → Authorization (bolehkah aktor
// melakukan aksi). Entitlement ≠ Authorization — "punya license" TIDAK berarti
// "boleh melakukan semuanya".

import {
  CAPABILITY_STATUSES,
  EXTENSION_TYPE_CODES,
  LICENSE_STATUSES,
  TIER_CAPABILITY_MATRIX,
  isCapabilityCode,
  isLicenseTierCode,
  type LicenseTierCode,
} from "./vocabulary";

/** Nilai keputusan entitlement — deterministic (prompt owner 5-C §9). */
export const EntitlementDecisionValue = {
  ALLOWED: "ALLOWED",
  DENIED: "DENIED",
} as const;
export type EntitlementDecisionValue =
  (typeof EntitlementDecisionValue)[keyof typeof EntitlementDecisionValue];

/**
 * Jenis keputusan — membedakan TIGA bentuk deny (prompt owner 5-C §9):
 * - POLICY_DENIAL: kebijakan menolak (jawaban deterministik atas fakta valid).
 * - UNKNOWN: input tidak dikenal (mis. capability di luar vocabulary).
 * - SYSTEM_ERROR: input tidak dapat dievaluasi (drift/invariant breach) —
 *   SELALU fail closed, tidak pernah allow.
 */
export const EntitlementKind = {
  GRANTED: "GRANTED",
  POLICY_DENIAL: "POLICY_DENIAL",
  UNKNOWN: "UNKNOWN",
  SYSTEM_ERROR: "SYSTEM_ERROR",
} as const;
export type EntitlementKind = (typeof EntitlementKind)[keyof typeof EntitlementKind];

/**
 * Reason code entitlement — subset kanonik AUTHORIZATION_MODEL §3 yang kini
 * DIEVALUASI, plus kode tambahan 5-C yang didokumentasikan (ADR-024 §4).
 * Kode kanonik tidak diubah; kode baru tidak menggantikan kode lama.
 */
export const EntitlementReasonCode = {
  /** Kebijakan menggrant capability untuk tier/konteks ini. */
  ALLOW: "ALLOW",
  // --- kanonik (AUTHORIZATION_MODEL §3; deklarasi Phase 4, evaluasi 5-C) ---
  /** Capability tidak termasuk tier workspace (REQ-024). */
  DENY_TIER_ENTITLEMENT_MISSING: "DENY_TIER_ENTITLEMENT_MISSING",
  /** License ada tapi statusnya bukan sumber entitlement (REQ-098; OD-108 OPEN). */
  DENY_LICENSE_STATE: "DENY_LICENSE_STATE",
  /** Extension yang disyaratkan tidak ACTIVE di workspace (MC §2). */
  DENY_EXTENSION_MISSING: "DENY_EXTENSION_MISSING",
  // --- tambahan 5-C (dokumentasi: ADR-024) ---
  /** Tidak ada baris license sama sekali untuk workspace. */
  DENY_NO_ACTIVE_LICENSE: "DENY_NO_ACTIVE_LICENSE",
  /** Capability dikenal tapi status katalognya DEPRECATED (DMC §3.5). */
  DENY_CAPABILITY_DISABLED: "DENY_CAPABILITY_DISABLED",
  /** Capability tidak dikenal (di luar vocabulary dan katalog) — bukan "denied policy". */
  DENY_UNKNOWN_CAPABILITY: "DENY_UNKNOWN_CAPABILITY",
  /** Tier code di luar closed set (HI_RIDER/TOTAL_RIDER/lainnya) — ditolak. */
  DENY_INVALID_TIER: "DENY_INVALID_TIER",
  /** Konteks workspace tidak valid/tidak ditemukan. */
  DENY_WORKSPACE_CONTEXT_INVALID: "DENY_WORKSPACE_CONTEXT_INVALID",
  /** Input tidak dapat dievaluasi (drift katalog/vocabulary, invariant breach) — fail closed. */
  ENTITLEMENT_UNEVALUABLE_INPUT: "ENTITLEMENT_UNEVALUABLE_INPUT",
} as const;
export type EntitlementReasonCode =
  (typeof EntitlementReasonCode)[keyof typeof EntitlementReasonCode];

/** Bukti keputusan — deterministic; TIDAK memuat timestamp (audit menambahkannya). */
export interface EntitlementEvidence {
  workspaceId: string | null;
  licenseId: string | null;
  tierCode: string | null;
  ruleId: string | null;
  /** Type code extension ACTIVE di workspace — sorted, unique (deterministic). */
  extensionsActive: readonly string[];
}

/** Objek keputusan entitlement — eksplisit, deterministic, dapat diaudit. */
export interface EntitlementDecision {
  decision: EntitlementDecisionValue;
  kind: EntitlementKind;
  reasonCode: EntitlementReasonCode;
  capabilityCode: string | null;
  evidence: EntitlementEvidence;
}

/**
 * Fakta yang diselesaikan lapisan service dari sumber tepercaya sebelum
 * evaluator dipanggil (pola Phase 4: evaluator murni + guards I/O).
 */
export interface EntitlementFacts {
  /** Id workspace konteks; null/kosong = konteks tidak valid. */
  workspaceId: string | null;
  /** Apakah workspace benar-benar ada di DB. */
  workspaceExists: boolean;
  capabilityCode: string;
  /** Baris katalog Capability; null = tidak ada baris. */
  capabilityCatalogRow: { status: string } | null;
  /** Jumlah SEMUA baris license workspace (histori termasuk). */
  licenseRowCount: number;
  /** Jumlah baris license berstatus ACTIVE (invariant DB: <= 1). */
  activeLicenseCount: number;
  /** Id license ACTIVE — terisi hanya bila activeLicenseCount === 1. */
  activeLicenseId: string | null;
  /** Baris LicenseTier milik license ACTIVE — null bila tidak ter-resolve. */
  activeTierRow: { code: string; isActive: boolean } | null;
  /** ACTIVE CapabilityRule (capability, tier) — null = tidak ada. */
  activeTierRuleId: string | null;
  /** Extension type yang disyaratkan pemanggil (opsional). */
  requiredExtensionType: string | null;
  /** Type code extension instance ACTIVE milik workspace — sorted, unique. */
  extensionsActive: readonly string[];
}

/** Keputusan deny dengan evidence minimal (helper deterministic). */
export function deniedEntitlement(
  reasonCode: EntitlementReasonCode,
  kind: EntitlementKind,
  facts: Pick<EntitlementFacts, "workspaceId" | "capabilityCode" | "extensionsActive">,
  evidence?: Partial<Omit<EntitlementEvidence, "workspaceId" | "extensionsActive">>
): EntitlementDecision {
  return {
    decision: EntitlementDecisionValue.DENIED,
    kind,
    reasonCode,
    capabilityCode: facts.capabilityCode || null,
    evidence: {
      workspaceId: facts.workspaceId,
      licenseId: evidence?.licenseId ?? null,
      tierCode: evidence?.tierCode ?? null,
      ruleId: evidence?.ruleId ?? null,
      extensionsActive: facts.extensionsActive,
    },
  };
}

/** Keputusan grant dengan evidence lengkap (helper deterministic). */
export function grantedEntitlement(
  facts: EntitlementFacts,
  evidence: { licenseId: string; tierCode: LicenseTierCode; ruleId: string }
): EntitlementDecision {
  return {
    decision: EntitlementDecisionValue.ALLOWED,
    kind: EntitlementKind.GRANTED,
    reasonCode: EntitlementReasonCode.ALLOW,
    capabilityCode: facts.capabilityCode,
    evidence: {
      workspaceId: facts.workspaceId,
      licenseId: evidence.licenseId,
      tierCode: evidence.tierCode,
      ruleId: evidence.ruleId,
      extensionsActive: facts.extensionsActive,
    },
  };
}

/**
 * Evaluasi entitlement tier→capability (intisari 5-C) — MURNI dan
 * DETERMINISTIK. Urutan evaluasi (short-circuit deny; ENTITLEMENT_MODEL §3):
 *
 *   1. konteks workspace
 *   2. capability (unknown → drift → disabled)
 *   3. license (tidak ada → status bukan ACTIVE → invariant breach)
 *   4. tier (invalid code → non-aktif)
 *   5. rule tier + konsistensi matriks DB<->vocabulary
 *   6. extension (bila disyaratkan)
 *
 * DENY-BY-DEFAULT: setiap cabang yang tidak berakhir ALLOWED adalah DENIED.
 */
export function evaluateEntitlement(facts: EntitlementFacts): EntitlementDecision {
  // 1) Konteks workspace — prasyarat (AUTHORIZATION_MODEL §2 tenant scope).
  if (!facts.workspaceId || facts.workspaceId.length === 0 || !facts.workspaceExists) {
    return deniedEntitlement(
      EntitlementReasonCode.DENY_WORKSPACE_CONTEXT_INVALID,
      EntitlementKind.POLICY_DENIAL,
      facts
    );
  }

  // 2) Capability — bedakan unknown vs denied vs drift konfigurasi.
  const vocabularyKnown = isCapabilityCode(facts.capabilityCode);
  const catalogRowExists = facts.capabilityCatalogRow !== null;
  if (!vocabularyKnown && !catalogRowExists) {
    // Tidak dikenal di mana pun — bukan "denied policy"; tetap fail closed.
    return deniedEntitlement(
      EntitlementReasonCode.DENY_UNKNOWN_CAPABILITY,
      EntitlementKind.UNKNOWN,
      facts
    );
  }
  if (vocabularyKnown !== catalogRowExists) {
    // Drift: kode ada di vocabulary tapi tidak di katalog (seed hilang), atau
    // baris katalog ber kode di luar vocabulary. TIDAK pernah di-allow.
    return deniedEntitlement(
      EntitlementReasonCode.ENTITLEMENT_UNEVALUABLE_INPUT,
      EntitlementKind.SYSTEM_ERROR,
      facts
    );
  }
  const catalogStatus = facts.capabilityCatalogRow?.status ?? null;
  if (catalogStatus !== null && !(CAPABILITY_STATUSES as readonly string[]).includes(catalogStatus)) {
    return deniedEntitlement(
      EntitlementReasonCode.ENTITLEMENT_UNEVALUABLE_INPUT,
      EntitlementKind.SYSTEM_ERROR,
      facts
    );
  }
  if (catalogStatus === "DEPRECATED") {
    return deniedEntitlement(
      EntitlementReasonCode.DENY_CAPABILITY_DISABLED,
      EntitlementKind.POLICY_DENIAL,
      facts
    );
  }

  // 3) License — hanya ACTIVE yang menjadi sumber entitlement (5-B vocabulary;
  //    ENTITLEMENT_MODEL §4). Tidak ada semantik expiry/grace baru (OD-108 OPEN).
  if (facts.activeLicenseCount > 1) {
    // Invariant "tepat satu ACTIVE per workspace" dilanggar — fail closed.
    return deniedEntitlement(
      EntitlementReasonCode.ENTITLEMENT_UNEVALUABLE_INPUT,
      EntitlementKind.SYSTEM_ERROR,
      facts
    );
  }
  if (facts.activeLicenseCount === 0) {
    if (facts.licenseRowCount === 0) {
      return deniedEntitlement(
        EntitlementReasonCode.DENY_NO_ACTIVE_LICENSE,
        EntitlementKind.POLICY_DENIAL,
        facts
      );
    }
    // Ada histori license, tapi tidak ada yang ACTIVE (PURCHASED/EXPIRED/
    // GRACE/DOWNGRADED/RENEWAL_DUE/status tak dikenal — semua bukan sumber).
    return deniedEntitlement(
      EntitlementReasonCode.DENY_LICENSE_STATE,
      EntitlementKind.POLICY_DENIAL,
      facts
    );
  }
  if (facts.activeLicenseId === null || facts.activeTierRow === null) {
    // FK menjamin tier ada; baris hilang = state tidak ter-resolve — fail closed.
    return deniedEntitlement(
      EntitlementReasonCode.ENTITLEMENT_UNEVALUABLE_INPUT,
      EntitlementKind.SYSTEM_ERROR,
      facts
    );
  }

  // 4) Tier — closed set TIGA tier; HI_RIDER/TOTAL_RIDER tidak pernah sah
  //    (MC §2.1/§2.2). CHECK DB mencegahnya tersimpan; guard ini lapisan kedua.
  if (!isLicenseTierCode(facts.activeTierRow.code)) {
    return deniedEntitlement(
      EntitlementReasonCode.DENY_INVALID_TIER,
      EntitlementKind.SYSTEM_ERROR,
      facts,
      { licenseId: facts.activeLicenseId, tierCode: facts.activeTierRow.code }
    );
  }
  const tierCode: LicenseTierCode = facts.activeTierRow.code;
  if (!facts.activeTierRow.isActive) {
    // Tier dinonaktifkan owner — license pada tier itu bukan sumber entitlement
    // pada state ini (deterministik; bukan keputusan OD-05/06/108).
    return deniedEntitlement(
      EntitlementReasonCode.DENY_LICENSE_STATE,
      EntitlementKind.POLICY_DENIAL,
      facts,
      { licenseId: facts.activeLicenseId, tierCode }
    );
  }

  // 5) Rule tier + konsistensi DB<->matriks (LICENSE_MATRIX §2; seed = vocabulary).
  const matrixGrants = (TIER_CAPABILITY_MATRIX[tierCode] as readonly string[]).includes(
    facts.capabilityCode
  );
  if (facts.activeTierRuleId === null && matrixGrants) {
    // Matriks mengharuskan grant, rule DB hilang — drift seed, fail closed.
    return deniedEntitlement(
      EntitlementReasonCode.ENTITLEMENT_UNEVALUABLE_INPUT,
      EntitlementKind.SYSTEM_ERROR,
      facts,
      { licenseId: facts.activeLicenseId, tierCode }
    );
  }
  if (facts.activeTierRuleId !== null && !matrixGrants) {
    // Rule DB di luar matriks — drift, fail closed.
    return deniedEntitlement(
      EntitlementReasonCode.ENTITLEMENT_UNEVALUABLE_INPUT,
      EntitlementKind.SYSTEM_ERROR,
      facts,
      { licenseId: facts.activeLicenseId, tierCode, ruleId: facts.activeTierRuleId }
    );
  }
  if (facts.activeTierRuleId === null) {
    // Jawaban policy deterministik: tier tidak meng-grant capability ini.
    return deniedEntitlement(
      EntitlementReasonCode.DENY_TIER_ENTITLEMENT_MISSING,
      EntitlementKind.POLICY_DENIAL,
      facts,
      { licenseId: facts.activeLicenseId, tierCode }
    );
  }

  // 6) Extension — hanya bila pemanggil menyatakan capability ini memerlukan
  //    extension type tertentu (additive di atas tier; MC §2). Instance status
  //    ACTIVE yang berkontribusi (LICENSE_MATRIX §5). Lifecycle = 5-D.
  if (facts.requiredExtensionType !== null) {
    if (!(EXTENSION_TYPE_CODES as readonly string[]).includes(facts.requiredExtensionType)) {
      // Input pemanggil di luar closed list owner — bug pemanggil, fail closed.
      return deniedEntitlement(
        EntitlementReasonCode.ENTITLEMENT_UNEVALUABLE_INPUT,
        EntitlementKind.SYSTEM_ERROR,
        facts,
        { licenseId: facts.activeLicenseId, tierCode, ruleId: facts.activeTierRuleId }
      );
    }
    if (!facts.extensionsActive.includes(facts.requiredExtensionType)) {
      return deniedEntitlement(
        EntitlementReasonCode.DENY_EXTENSION_MISSING,
        EntitlementKind.POLICY_DENIAL,
        facts,
        { licenseId: facts.activeLicenseId, tierCode, ruleId: facts.activeTierRuleId }
      );
    }
  }

  // Semua input entitlement lolos — workspace berhak atas capability.
  // (Role/Permission AKTOR masih dievaluasi terpisah oleh policy Phase 4 —
  // entitlement meng-gate, authorization meng-grant. ENTITLEMENT_MODEL §3.4.)
  return grantedEntitlement(facts, {
    licenseId: facts.activeLicenseId,
    tierCode,
    ruleId: facts.activeTierRuleId,
  });
}

/** Guard status license dikenal (untuk lapisan service yang perlu membedakan). */
export function isKnownLicenseStatus(status: string): boolean {
  return (LICENSE_STATUSES as readonly string[]).includes(status);
}
