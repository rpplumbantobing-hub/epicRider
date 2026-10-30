// Unit test engine entitlement — epicRider Phase 5-C.
// Evaluator MURNI (`src/lib/licensing/entitlement.ts`) + wiring policy Phase 4.
// Membuktikan (prompt owner 5-C §14):
// - evaluasi MINI_RIDER/MAX_RIDER/ISO_RIDER sesuai LICENSE_MATRIX §2;
// - HI_RIDER/TOTAL_RIDER ditolak sebagai tier (fail closed);
// - capability: allowed / denied / unknown / disabled terbedakan eksplisit;
// - state lisensi: no license / non-ACTIVE / ACTIVE;
// - fail closed: drift konfigurasi, invariant breach, input invalid;
// - konteks workspace invalid; deterministic (fakta sama → keputusan sama);
// - ENTITLEMENT ≠ AUTHORIZATION: wiring policy tetap deny-by-default.

import { describe, expect, it } from "vitest";

import {
  EntitlementDecisionValue,
  EntitlementKind,
  EntitlementReasonCode,
  evaluateEntitlement,
  type EntitlementFacts,
} from "@/lib/licensing/entitlement";
import { CAPABILITY_CODES, LICENSE_TIER_CODES, TIER_CAPABILITY_MATRIX } from "@/lib/licensing/vocabulary";
import { ReasonCode } from "@/lib/authz/reason-codes";
import { evaluatePolicy } from "@/lib/authz/policy";

/** Fakta "grant" valid sebagai basis override per-skenario. */
function grantFacts(overrides: Partial<EntitlementFacts> = {}): EntitlementFacts {
  return {
    workspaceId: "ws-1",
    workspaceExists: true,
    capabilityCode: "core_event_workspace",
    capabilityCatalogRow: { status: "ACTIVE" },
    licenseRowCount: 1,
    activeLicenseCount: 1,
    activeLicenseId: "lic-1",
    activeTierRow: { code: "MINI_RIDER", isActive: true },
    activeTierRuleId: "rule-1",
    requiredExtensionType: null,
    extensionsActive: [],
    ...overrides,
  };
}

describe("evaluasi tier — matriks LICENSE_MATRIX §2 penuh (3 tier × 10 capability)", () => {
  for (const tier of LICENSE_TIER_CODES) {
    for (const capability of CAPABILITY_CODES) {
      const grants = (TIER_CAPABILITY_MATRIX[tier] as readonly string[]).includes(capability);
      it(`${tier} ${grants ? "ALLOWED" : "DENIED"} ${capability}`, () => {
        const decision = evaluateEntitlement(
          grantFacts({
            capabilityCode: capability,
            activeTierRow: { code: tier, isActive: true },
            // Rule DB mengikuti matriks (seed = vocabulary; konsistensi diuji engine).
            activeTierRuleId: grants ? "rule-1" : null,
          })
        );
        if (grants) {
          expect(decision.decision).toBe(EntitlementDecisionValue.ALLOWED);
          expect(decision.kind).toBe(EntitlementKind.GRANTED);
          expect(decision.reasonCode).toBe(EntitlementReasonCode.ALLOW);
          expect(decision.evidence.tierCode).toBe(tier);
        } else {
          expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
          expect(decision.kind).toBe(EntitlementKind.POLICY_DENIAL);
          expect(decision.reasonCode).toBe(EntitlementReasonCode.DENY_TIER_ENTITLEMENT_MISSING);
        }
      });
    }
  }
});

describe("tier invalid — HI_RIDER/TOTAL_RIDER tidak pernah sah (MC §2.1/§2.2)", () => {
  it("HI_RIDER → DENY_INVALID_TIER, fail closed (SYSTEM_ERROR)", () => {
    const decision = evaluateEntitlement(grantFacts({ activeTierRow: { code: "HI_RIDER", isActive: true } }));
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.reasonCode).toBe(EntitlementReasonCode.DENY_INVALID_TIER);
    expect(decision.kind).toBe(EntitlementKind.SYSTEM_ERROR);
  });

  it("TOTAL_RIDER → DENY_INVALID_TIER (tidak dihidupkan kembali)", () => {
    const decision = evaluateEntitlement(
      grantFacts({ activeTierRow: { code: "TOTAL_RIDER", isActive: true } })
    );
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.reasonCode).toBe(EntitlementReasonCode.DENY_INVALID_TIER);
  });

  it("tier non-aktif → DENY_LICENSE_STATE (bukan grant)", () => {
    const decision = evaluateEntitlement(
      grantFacts({ activeTierRow: { code: "MINI_RIDER", isActive: false } })
    );
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.reasonCode).toBe(EntitlementReasonCode.DENY_LICENSE_STATE);
    expect(decision.kind).toBe(EntitlementKind.POLICY_DENIAL);
  });
});

describe("capability — allowed / denied / unknown / disabled terbedakan", () => {
  it("unknown capability (di luar vocabulary & katalog) → kind UNKNOWN, tetap DENIED", () => {
    const decision = evaluateEntitlement(
      grantFacts({ capabilityCode: "totally_unknown_capability", capabilityCatalogRow: null, activeTierRuleId: null })
    );
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.reasonCode).toBe(EntitlementReasonCode.DENY_UNKNOWN_CAPABILITY);
    expect(decision.kind).toBe(EntitlementKind.UNKNOWN);
  });

  it("capability DEPRECATED → DENY_CAPABILITY_DISABLED (bukan unknown)", () => {
    const decision = evaluateEntitlement(
      grantFacts({ capabilityCatalogRow: { status: "DEPRECATED" } })
    );
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.reasonCode).toBe(EntitlementReasonCode.DENY_CAPABILITY_DISABLED);
    expect(decision.kind).toBe(EntitlementKind.POLICY_DENIAL);
  });

  it("capability di luar matriks tier (rule absen) → DENY_TIER_ENTITLEMENT_MISSING", () => {
    // ims_capability TIDAK termasuk MINI_RIDER (LICENSE_MATRIX §2) — rule absen
    // pada tier ini adalah jawaban policy, bukan drift.
    const decision = evaluateEntitlement(
      grantFacts({ capabilityCode: "ims_capability", activeTierRuleId: null })
    );
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.reasonCode).toBe(EntitlementReasonCode.DENY_TIER_ENTITLEMENT_MISSING);
    expect(decision.kind).toBe(EntitlementKind.POLICY_DENIAL);
  });
});

describe("state lisensi — no license / non-ACTIVE / ACTIVE", () => {
  it("tanpa license sama sekali → DENY_NO_ACTIVE_LICENSE", () => {
    const decision = evaluateEntitlement(
      grantFacts({ licenseRowCount: 0, activeLicenseCount: 0, activeLicenseId: null, activeTierRow: null, activeTierRuleId: null })
    );
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.reasonCode).toBe(EntitlementReasonCode.DENY_NO_ACTIVE_LICENSE);
  });

  it("ada histori license tapi tidak ada ACTIVE → DENY_LICENSE_STATE (fail closed)", () => {
    // Service memfilter baris status ACTIVE; state non-ACTIVE apa pun
    // (PURCHASED/RENEWAL_DUE/EXPIRED/GRACE/DOWNGRADED) bukan sumber entitlement.
    // Perilaku per-status nyata diuji di tests/integration/entitlement-domain.test.ts.
    const decision = evaluateEntitlement(
      grantFacts({ licenseRowCount: 1, activeLicenseCount: 0, activeLicenseId: null, activeTierRow: null, activeTierRuleId: null })
    );
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.reasonCode).toBe(EntitlementReasonCode.DENY_LICENSE_STATE);
    expect(decision.kind).toBe(EntitlementKind.POLICY_DENIAL);
  });

  it("license ACTIVE → evaluasi berlanjut hingga keputusan policy", () => {
    const decision = evaluateEntitlement(grantFacts());
    expect(decision.decision).toBe(EntitlementDecisionValue.ALLOWED);
    expect(decision.evidence.licenseId).toBe("lic-1");
  });
});

describe("fail closed — drift konfigurasi & invariant breach tidak pernah allow", () => {
  it(">1 license ACTIVE (invariant breach) → SYSTEM_ERROR", () => {
    const decision = evaluateEntitlement(grantFacts({ activeLicenseCount: 2, activeLicenseId: null, activeTierRow: null, activeTierRuleId: null }));
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.kind).toBe(EntitlementKind.SYSTEM_ERROR);
    expect(decision.reasonCode).toBe(EntitlementReasonCode.ENTITLEMENT_UNEVALUABLE_INPUT);
  });

  it("kode di vocabulary tapi tidak ada di katalog (drift seed) → SYSTEM_ERROR", () => {
    const decision = evaluateEntitlement(grantFacts({ capabilityCatalogRow: null, activeTierRuleId: null }));
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.kind).toBe(EntitlementKind.SYSTEM_ERROR);
    expect(decision.reasonCode).toBe(EntitlementReasonCode.ENTITLEMENT_UNEVALUABLE_INPUT);
  });

  it("rule DB melebihi matriks (drift) → SYSTEM_ERROR", () => {
    const decision = evaluateEntitlement(
      grantFacts({ capabilityCode: "ims_capability", activeTierRuleId: "rule-rogue" })
    );
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.kind).toBe(EntitlementKind.SYSTEM_ERROR);
  });

  it("matriks mengharuskan grant tapi rule DB hilang (drift) → SYSTEM_ERROR", () => {
    const decision = evaluateEntitlement(grantFacts({ activeTierRuleId: null }));
    expect(decision.reasonCode).toBe(EntitlementReasonCode.ENTITLEMENT_UNEVALUABLE_INPUT);
    expect(decision.kind).toBe(EntitlementKind.SYSTEM_ERROR);
  });

  it("requiredExtensionType di luar closed list → SYSTEM_ERROR (bug pemanggil)", () => {
    const decision = evaluateEntitlement(grantFacts({ requiredExtensionType: "hi_rider_addon" }));
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.kind).toBe(EntitlementKind.SYSTEM_ERROR);
  });
});

describe("konteks workspace & extension", () => {
  it("workspace tidak ada → DENY_WORKSPACE_CONTEXT_INVALID", () => {
    const decision = evaluateEntitlement(grantFacts({ workspaceExists: false }));
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.reasonCode).toBe(EntitlementReasonCode.DENY_WORKSPACE_CONTEXT_INVALID);
  });

  it("extension disyaratkan tapi tidak ACTIVE → DENY_EXTENSION_MISSING", () => {
    const decision = evaluateEntitlement(grantFacts({ requiredExtensionType: "seat_package" }));
    expect(decision.decision).toBe(EntitlementDecisionValue.DENIED);
    expect(decision.reasonCode).toBe(EntitlementReasonCode.DENY_EXTENSION_MISSING);
  });

  it("extension disyaratkan dan ACTIVE → ALLOWED dengan evidence", () => {
    const decision = evaluateEntitlement(
      grantFacts({ requiredExtensionType: "seat_package", extensionsActive: ["seat_package"] })
    );
    expect(decision.decision).toBe(EntitlementDecisionValue.ALLOWED);
    expect(decision.evidence.extensionsActive).toEqual(["seat_package"]);
  });
});

describe("determinisme — fakta sama → keputusan identik", () => {
  it("dua evaluasi berurutan deep-equal (tanpa timestamp/random)", () => {
    const facts = grantFacts({ requiredExtensionType: "seat_package", extensionsActive: ["seat_package"] });
    expect(evaluateEntitlement(facts)).toEqual(evaluateEntitlement(facts));
  });
});

describe("wiring policy Phase 4 — entitlement membatasi, tidak meng-allow sendiri", () => {
  const baseRequest = {
    session: "VALID" as const,
    actorUserId: "u1",
    workspaceId: "ws-1",
    membershipStatus: "ACTIVE" as const,
    roleKeys: ["owner"],
    permission: "workspace.update" as const,
  };

  it("entitlement tierActive=false → DENY_TIER_ENTITLEMENT_MISSING (kanonik)", () => {
    const decision = evaluatePolicy({
      ...baseRequest,
      entitlement: { tierActive: false, extensionsActive: [] },
    });
    expect(decision.decision).toBe("DENY");
    expect(decision.reasonCode).toBe(ReasonCode.DENY_TIER_ENTITLEMENT_MISSING);
  });

  it("extension disyaratkan tapi tidak aktif → DENY_EXTENSION_MISSING", () => {
    const decision = evaluatePolicy({
      ...baseRequest,
      entitlement: { tierActive: true, extensionsActive: [], requiredExtensionType: "seat_package" },
    });
    expect(decision.decision).toBe("DENY");
    expect(decision.reasonCode).toBe(ReasonCode.DENY_EXTENSION_MISSING);
  });

  it("entitlement disediakan dan lolos → policy berlanjut seperti Phase 4", () => {
    const decision = evaluatePolicy({
      ...baseRequest,
      entitlement: { tierActive: true, extensionsActive: ["seat_package"], requiredExtensionType: "seat_package" },
    });
    expect(decision.decision).toBe("ALLOW");
    expect(decision.reasonCode).toBe(ReasonCode.ALLOW);
  });

  it("entitlement TIDAK disediakan (pemanggil Phase 4 lama) → perilaku tidak berubah", () => {
    const decision = evaluatePolicy(baseRequest);
    expect(decision.decision).toBe("ALLOW");
  });
});
