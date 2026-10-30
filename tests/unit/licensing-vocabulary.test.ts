// @vitest-environment node
// Test vocabulary domain licensing — Phase 5-B.
// Sumber kebenaran: LICENSE_MATRIX.md §1/§2/§5, MC §2.1, DMC §3.5/§3.6/§6.2,
// REQ-018/REQ-009. Menguji bahwa vocabulary TIDAK mengarang nilai di luar
// kontrak (hiRider bukan tier; tepat 3 tier; matriks persis LICENSE_MATRIX §2).

import { describe, expect, it } from "vitest";

import {
  ACTIVE_LICENSE_STATUS,
  CAPABILITY_CODES,
  CAPABILITY_RULE_STATUSES,
  CAPABILITY_STATUSES,
  EXTENSION_DEFINITION_STATUSES,
  EXTENSION_INSTANCE_STATUSES,
  EXTENSION_TYPE_CODES,
  LICENSE_STATUSES,
  LICENSE_TIER_CODES,
  LICENSE_TIER_DISPLAY_NAMES,
  MINI_RIDER_BASE_CREW_SEATS,
  QUOTA_CODE_CREW_SEATS_PER_WORKSPACE,
  TIER_CAPABILITY_MATRIX,
  isCapabilityCode,
  isExtensionInstanceStatus,
  isExtensionTypeCode,
  isLicenseStatus,
  isLicenseTierCode,
} from "@/lib/licensing/vocabulary";

describe("licensing vocabulary (Phase 5-B)", () => {
  it("1. merepresentasikan tepat tiga tier secara unik (MC §2.1)", () => {
    expect(LICENSE_TIER_CODES).toEqual(["MINI_RIDER", "MAX_RIDER", "ISO_RIDER"]);
    expect(new Set(LICENSE_TIER_CODES).size).toBe(3);
  });

  it("2. hiRider tidak bisa menjadi LicenseTier (MC §2.2; TESTING.md)", () => {
    expect(isLicenseTierCode("HI_RIDER")).toBe(false);
    expect(LICENSE_TIER_CODES.includes("HI_RIDER" as never)).toBe(false);
    // totalRider tidak dihidupkan kembali tanpa keputusan owner (MC §2.1)
    expect(isLicenseTierCode("TOTAL_RIDER")).toBe(false);
  });

  it("3. nama tier kanonik terpetakan per kode", () => {
    expect(LICENSE_TIER_DISPLAY_NAMES.MINI_RIDER).toBe("miniRider");
    expect(LICENSE_TIER_DISPLAY_NAMES.MAX_RIDER).toBe("maxRider");
    expect(LICENSE_TIER_DISPLAY_NAMES.ISO_RIDER).toBe("ISOrider");
  });

  it("4. status lisensi = mesin status DMC §6.2 / REQ-098 (termasuk RENEWAL_DUE)", () => {
    expect(LICENSE_STATUSES).toEqual([
      "PURCHASED",
      "ACTIVE",
      "RENEWAL_DUE",
      "EXPIRED",
      "GRACE",
      "DOWNGRADED",
    ]);
    expect(isLicenseStatus("ACTIVE")).toBe(true);
    expect(isLicenseStatus("SOMETHING_ELSE")).toBe(false);
    expect(ACTIVE_LICENSE_STATUS).toBe("ACTIVE");
  });

  it("5. jenis extension = closed-by-owner list (REQ-018; MC §2/§3)", () => {
    expect(EXTENSION_TYPE_CODES).toEqual([
      "additional_workspace",
      "seat_package",
      "workspace_landing",
      "mobile_client",
    ]);
    expect(isExtensionTypeCode("seat_package")).toBe(true);
    expect(isExtensionTypeCode("fourth_tier")).toBe(false);
  });

  it("6. lifecycle extension instance = LICENSE_MATRIX §5 (kanonik)", () => {
    expect(EXTENSION_INSTANCE_STATUSES).toEqual([
      "PURCHASED",
      "ASSIGNED",
      "ACTIVE",
      "SUSPENDED",
      "EXPIRED",
      "RENEWED",
      "REMOVED",
    ]);
  });

  it("7. capability codes 1:1 dengan baris LICENSE_MATRIX §2 (10 capability)", () => {
    expect(CAPABILITY_CODES).toHaveLength(10);
    expect(isCapabilityCode("crm")).toBe(true);
    expect(isCapabilityCode("not_a_capability")).toBe(false);
  });

  it("8. matriks tier→capability persis LICENSE_MATRIX §2", () => {
    expect(TIER_CAPABILITY_MATRIX.MINI_RIDER).toEqual([
      "core_event_workspace",
      "home_event_asset_team_profile",
      "technical_rider",
      "media_kit",
      "basic_asset_management",
    ]);
    expect(TIER_CAPABILITY_MATRIX.MAX_RIDER).toEqual([
      ...TIER_CAPABILITY_MATRIX.MINI_RIDER,
      "crm",
      "finance_commercial",
      "full_asset_rental_lifecycle",
      "advanced_operational_controls",
    ]);
    expect(TIER_CAPABILITY_MATRIX.ISO_RIDER).toEqual([...CAPABILITY_CODES]);
    // hiRider tidak punya kolom matriks tier (bukan tier)
    expect("HI_RIDER" in TIER_CAPABILITY_MATRIX).toBe(false);
  });

  it("9. kuota miniRider base 5 kru — satu-satunya nilai owner (MC §2.1/REQ-009)", () => {
    expect(MINI_RIDER_BASE_CREW_SEATS).toBe(5);
    expect(QUOTA_CODE_CREW_SEATS_PER_WORKSPACE).toBe("crew_seats_per_workspace");
    // OD-05 (owner counting) TIDAK diputuskan di lapisan vocabulary:
    // tidak ada konstanta jawaban yes/no yang diekspor.
  });
  it("10. tidak ada silent fallback ke tier yang tidak terdaftar (MC §2.1)", () => {
    const unregistered = [
      "HI_RIDER",
      "TOTAL_RIDER",
      "hiRider",
      "totalRider",
      "HIRIDER",
      "mini_rider", // varian casing TIDAK dinormalisasi diam-diam
      "MINI-RIDER",
      "MINIRIDER",
      "",
      "   ",
      "MINI_RIDER ",
    ];
    for (const code of unregistered) {
      expect(isLicenseTierCode(code)).toBe(false);
    }
    // Tidak ada kunci fallback di matriks/pemetaan display — hanya 3 tier.
    expect(Object.keys(TIER_CAPABILITY_MATRIX).sort()).toEqual([...LICENSE_TIER_CODES].sort());
    expect(Object.keys(LICENSE_TIER_DISPLAY_NAMES).sort()).toEqual([...LICENSE_TIER_CODES].sort());
  });

  it("11. kode language-neutral & konsisten — bukan string tampilan (DMC §2.9)", () => {
    const upperSnake = /^[A-Z][A-Z0-9_]*$/;
    const lowerSnake = /^[a-z][a-z0-9_]*$/;
    for (const code of LICENSE_TIER_CODES) expect(code).toMatch(upperSnake);
    for (const status of LICENSE_STATUSES) expect(status).toMatch(upperSnake);
    for (const status of EXTENSION_INSTANCE_STATUSES) expect(status).toMatch(upperSnake);
    for (const status of EXTENSION_DEFINITION_STATUSES) expect(status).toMatch(upperSnake);
    for (const status of CAPABILITY_STATUSES) expect(status).toMatch(upperSnake);
    for (const status of CAPABILITY_RULE_STATUSES) expect(status).toMatch(upperSnake);
    for (const code of CAPABILITY_CODES) expect(code).toMatch(lowerSnake);
    for (const code of EXTENSION_TYPE_CODES) expect(code).toMatch(lowerSnake);
    expect(QUOTA_CODE_CREW_SEATS_PER_WORKSPACE).toMatch(lowerSnake);
    for (const code of [
      ...LICENSE_TIER_CODES,
      ...LICENSE_STATUSES,
      ...CAPABILITY_CODES,
      ...EXTENSION_TYPE_CODES,
    ]) {
      expect(code).not.toMatch(/\s/); // tanpa spasi — aman sebagai kunci data/i18n
    }
    // Guard case-sensitive — tidak ada normalisasi/fallback diam-diam.
    expect(isLicenseStatus("active")).toBe(false);
    expect(isLicenseStatus("Active")).toBe(false);
    expect(isCapabilityCode("CRM")).toBe(false);
    expect(isExtensionInstanceStatus("unknown")).toBe(false);
    expect(isExtensionTypeCode("SEAT_PACKAGE")).toBe(false);
  });

});
