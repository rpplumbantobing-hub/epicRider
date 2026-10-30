// Vocabulary domain licensing — epicRider Phase 5-B.
//
// Sumber kontrak (tidak ada nilai yang dikarang di sini):
// - Tier: MASTER_CONTROL.md §2.1 + DATA_MODEL_CONCEPT.md §3.5/§4.4 — closed set
//   TIGA tier; hiRider BUKAN tier (portal/capability, MC §2.2; TESTING.md).
// - Status lisensi: DATA_MODEL_CONCEPT.md §6.2 (mesin status REQ-098, termasuk
//   RENEWAL_DUE). ENTITLEMENT_MODEL.md §4 memperlakukan renewal sebagai
//   transisi — nuansa antar-dokumen dibawa apa adanya (lihat PHASE_5_REPORT.md).
//   Durasi/aturan transisi = OD-108 OPEN; vocabulary ini hanya struktur data.
// - Lifecycle extension instance: LICENSE_MATRIX.md §5 (kanonik).
// - Capability + pemetaan tier: LICENSE_MATRIX.md §2 (10 capability; ✓ per tier).
// - Jenis extension: MC §2/§3 + REQ-018 — closed-by-owner list (DMC §3.6).
// - Kuota: MC §2.1 + REQ-009 — miniRider base 5 kru/workspace; owner-counting
//   = OD-05 OPEN (ownerCountedInQuota null = belum diputuskan, bukan keputusan).
//
// Kode disimpan language-neutral (DMC §2.9); string tampilan tinggal di locale
// files saat UI licensing dibangun (bukan scope 5-B).

/** Tiga license tier resmi — closed set (MC §2.1; DMC §4.4; CHECK DB-level). */
export const LICENSE_TIER_CODES = ["MINI_RIDER", "MAX_RIDER", "ISO_RIDER"] as const;
export type LicenseTierCode = (typeof LICENSE_TIER_CODES)[number];

/** Penulisan kanonik nama tier (MC) per kode — pemetaan display/i18n. */
export const LICENSE_TIER_DISPLAY_NAMES: Record<LicenseTierCode, string> = {
  MINI_RIDER: "miniRider",
  MAX_RIDER: "maxRider",
  ISO_RIDER: "ISOrider",
};

/**
 * Status lisensi (DMC §6.2; REQ-098: purchase→active→renewal→expiry→grace→
 * downgrade). RENEWAL_DUE diikutkan sesuai DMC/PHASE_2_TRACEABILITY; transisi
 * dan durasi = keputusan owner (OD-108) — TIDAK ada mekanika transisi di 5-B.
 */
export const LICENSE_STATUSES = [
  "PURCHASED",
  "ACTIVE",
  "RENEWAL_DUE",
  "EXPIRED",
  "GRACE",
  "DOWNGRADED",
] as const;
export type LicenseStatus = (typeof LICENSE_STATUSES)[number];

/** Status yang menyatakan lisensi berlaku penuh (resolusi lisensi efektif = 5-C). */
export const ACTIVE_LICENSE_STATUS: LicenseStatus = "ACTIVE";

/** Jenis extension — closed-by-owner list (MC §2/§3; REQ-018; DMC §3.6). */
export const EXTENSION_TYPE_CODES = [
  "additional_workspace",
  "seat_package",
  "workspace_landing",
  "mobile_client",
] as const;
export type ExtensionTypeCode = (typeof EXTENSION_TYPE_CODES)[number];

/** Lifecycle kanonik instance extension (LICENSE_MATRIX §5). */
export const EXTENSION_INSTANCE_STATUSES = [
  "PURCHASED",
  "ASSIGNED",
  "ACTIVE",
  "SUSPENDED",
  "EXPIRED",
  "RENEWED",
  "REMOVED",
] as const;
export type ExtensionInstanceStatus = (typeof EXTENSION_INSTANCE_STATUSES)[number];

/** Status definisi katalog extension (DMC §3.6; WITHDRAWN = PROPOSED). */
export const EXTENSION_DEFINITION_STATUSES = ["CATALOG", "WITHDRAWN"] as const;

/** Status capability (DMC §3.5). */
export const CAPABILITY_STATUSES = ["ACTIVE", "DEPRECATED"] as const;

/** Status capability rule (DMC §3.5). */
export const CAPABILITY_RULE_STATUSES = ["ACTIVE", "SUPERSEDED"] as const;

/**
 * Capability codes — 1:1 dari baris matriks LICENSE_MATRIX §2 (tidak ada
 * capability baru yang dikarang). Urutan = urutan baris LICENSE_MATRIX.
 */
export const CAPABILITY_CODES = [
  "core_event_workspace",
  "home_event_asset_team_profile",
  "technical_rider",
  "media_kit",
  "basic_asset_management",
  "crm",
  "finance_commercial",
  "full_asset_rental_lifecycle",
  "advanced_operational_controls",
  "ims_capability",
] as const;
export type CapabilityCode = (typeof CAPABILITY_CODES)[number];

/**
 * Matriks tier → capability, 1:1 dari LICENSE_MATRIX §2 (✓ per baris/kolom).
 * miniRider 5, maxRider 9 (mini + CRM/finance/asset-lifecycle/advanced ops),
 * ISOrider 10 (max + IMS). Sumber kebenaran tunggal pemetaan di sini + seed
 * migration — konsistensi keduanya divalidasi test integration.
 */
export const TIER_CAPABILITY_MATRIX: Record<LicenseTierCode, readonly CapabilityCode[]> = {
  MINI_RIDER: [
    "core_event_workspace",
    "home_event_asset_team_profile",
    "technical_rider",
    "media_kit",
    "basic_asset_management",
  ],
  MAX_RIDER: [
    "core_event_workspace",
    "home_event_asset_team_profile",
    "technical_rider",
    "media_kit",
    "basic_asset_management",
    "crm",
    "finance_commercial",
    "full_asset_rental_lifecycle",
    "advanced_operational_controls",
  ],
  ISO_RIDER: [...CAPABILITY_CODES],
};

/** Kode kuota yang ditetapkan owner (satu-satunya; MC §2.1/REQ-009). */
export const QUOTA_CODE_CREW_SEATS_PER_WORKSPACE = "crew_seats_per_workspace";
export const QUOTA_UNIT_CREW_SEAT = "CREW_SEAT";

/** Nilai dasar kuota miniRider dari MC §2.1 — satu-satunya nilai yang di-seed. */
export const MINI_RIDER_BASE_CREW_SEATS = 5;

export function isLicenseTierCode(value: string): value is LicenseTierCode {
  return (LICENSE_TIER_CODES as readonly string[]).includes(value);
}

export function isLicenseStatus(value: string): value is LicenseStatus {
  return (LICENSE_STATUSES as readonly string[]).includes(value);
}

export function isExtensionTypeCode(value: string): value is ExtensionTypeCode {
  return (EXTENSION_TYPE_CODES as readonly string[]).includes(value);
}

export function isExtensionInstanceStatus(value: string): value is ExtensionInstanceStatus {
  return (EXTENSION_INSTANCE_STATUSES as readonly string[]).includes(value);
}

export function isCapabilityCode(value: string): value is CapabilityCode {
  return (CAPABILITY_CODES as readonly string[]).includes(value);
}
