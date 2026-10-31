// Unit test domain commerce License & Extension Shop — epicRider Phase 5-E
// (ADR-026). MURNI (tanpa DB): vocabulary closed set, evaluator eligibility
// deterministik, dan bentuk tabel otorisasi commerce (explicit permission
// only; tidak ada jalur ALLOW selain SYSTEM).

import { describe, expect, it } from "vitest";

import { Permission } from "@/lib/authz/permissions";
import { SHOP_ACTION_AUTHORIZATION } from "@/lib/shop/authorization";
import {
  ShopReasonCode,
  ShopEligibilityKind,
} from "@/lib/shop/reason-codes";
import {
  evaluateShopEligibility,
  type ShopEligibilityFacts,
} from "@/lib/shop/eligibility";
import {
  SHOP_COMPLETION_SOURCES,
  SHOP_ORDER_INTENT_STATUSES,
  SHOP_PRODUCT_KINDS,
  SHOP_PRODUCT_STATUSES,
  SHOP_SURFACE_CODE,
  isShopOrderIntentStatus,
  isShopProductKind,
  isShopProductStatus,
} from "@/lib/shop/vocabulary";

// ---------------------------------------------------------------------------
// Vocabulary — closed set & guards
// ---------------------------------------------------------------------------

describe("shop vocabulary (ADR-026)", () => {
  it("kind produk closed set: LICENSE | EXTENSION saja (ADR-018)", () => {
    expect(SHOP_PRODUCT_KINDS).toEqual(["LICENSE", "EXTENSION"]);
    expect(isShopProductKind("LICENSE")).toBe(true);
    expect(isShopProductKind("EXTENSION")).toBe(true);
    expect(isShopProductKind("PHYSICAL")).toBe(false);
    expect(isShopProductKind("")).toBe(false);
    expect(isShopProductKind("license")).toBe(false);
  });

  it("status produk closed set + default INACTIVE tidak dapat dibeli", () => {
    expect(SHOP_PRODUCT_STATUSES).toEqual(["ACTIVE", "INACTIVE", "WITHDRAWN"]);
    expect(isShopProductStatus("ACTIVE")).toBe(true);
    expect(isShopProductStatus("INACTIVE")).toBe(true);
    expect(isShopProductStatus("WITHDRAWN")).toBe(true);
    expect(isShopProductStatus("PUBLISHED")).toBe(false);
  });

  it("status order intent PROVISIONAL tanpa state payment/refund (OD-135 OPEN)", () => {
    expect(SHOP_ORDER_INTENT_STATUSES).toEqual(["OPEN", "COMPLETED", "ISSUED", "CANCELLED"]);
    for (const status of SHOP_ORDER_INTENT_STATUSES) {
      expect(isShopOrderIntentStatus(status)).toBe(true);
      // §12: tidak ada status yang menyatakan paid/payment/refund.
      expect(status.toLowerCase()).not.toContain("paid");
      expect(status.toLowerCase()).not.toContain("payment");
      expect(status.toLowerCase()).not.toContain("refund");
    }
  });

  it("sumber completion union tertutup: HANYA simulasi non-produksi (§13; OD-06)", () => {
    expect(SHOP_COMPLETION_SOURCES).toEqual(["NON_PRODUCTION_TEST_SIMULATION"]);
    // Guard jujur: tidak ada anggota yang menyiratkan gateway/charging produksi.
    for (const source of SHOP_COMPLETION_SOURCES) {
      expect(source).toMatch(/^NON_PRODUCTION/);
    }
  });

  it("surface ownership: satu konstanta surface (DMC §3.12a; ADR-018)", () => {
    expect(SHOP_SURFACE_CODE).toBe("LICENSE_EXTENSION_SHOP");
  });
});

// ---------------------------------------------------------------------------
// Tabel otorisasi commerce — explicit permission only, tanpa jalur allow lain
// ---------------------------------------------------------------------------

describe("SHOP_ACTION_AUTHORIZATION (pola remediasi PR #4)", () => {
  it("ORDER_INTENT_CREATE memakai key kanonik terdokumentasi §4.12", () => {
    const entry = SHOP_ACTION_AUTHORIZATION.ORDER_INTENT_CREATE;
    expect(entry.permission).toBe(Permission.STORE_ORDER_CREATE);
    expect(entry.permission).toBe("store.order.create");
    expect(entry.source).toContain("AUTHORIZATION_MODEL §4.12");
  });

  it("aksi tanpa key kanonik memiliki permission null — default deny USER", () => {
    for (const action of ["ORDER_INTENT_CANCEL", "COMPLETION_VERIFY", "ISSUANCE"] as const) {
      expect(SHOP_ACTION_AUTHORIZATION[action].permission).toBeNull();
    }
  });

  it("ownerRatificationStatus selalu PROPOSED — bukan jalur otorisasi (OD-122 OPEN)", () => {
    for (const entry of Object.values(SHOP_ACTION_AUTHORIZATION)) {
      expect(entry.ownerRatificationStatus).toBe("PROPOSED");
    }
  });
});

// ---------------------------------------------------------------------------
// Evaluator eligibility MURNI — deny-by-default, deterministic
// ---------------------------------------------------------------------------

function baseFacts(overrides: Partial<ShopEligibilityFacts>): ShopEligibilityFacts {
  return {
    workspaceId: "ws-1",
    workspaceExists: true,
    licenseRowCount: 0,
    liveInstanceOfTypeCount: 0,
    product: null,
    ...overrides,
  };
}

const licenseProduct = {
  id: "prod-lic-1",
  code: "shop.license.mini",
  kind: "LICENSE",
  status: "ACTIVE",
  tier: { id: "tier-1", code: "MINI_RIDER", isActive: true },
  definition: null,
};

const extensionProduct = {
  id: "prod-ext-1",
  code: "shop.extension.landing",
  kind: "EXTENSION",
  status: "ACTIVE",
  tier: null,
  definition: {
    id: "def-1",
    code: "ext.workspace_landing",
    status: "CATALOG",
    isActive: true,
    typeCode: "workspace_landing",
  },
};

describe("evaluateShopEligibility (murni; §11)", () => {
  it("first license: workspace tanpa lisensi → eligible FIRST_LICENSE", () => {
    const decision = evaluateShopEligibility(baseFacts({ product: licenseProduct }));
    expect(decision.eligible).toBe(true);
    expect(decision.kind).toBe(ShopEligibilityKind.FIRST_LICENSE);
    expect(decision.reasonCode).toBe(ShopReasonCode.ALLOW);
  });

  it("renewal: workspace telah memegang lisensi → eligible RENEWAL (aturan final = OD-108)", () => {
    const decision = evaluateShopEligibility(
      baseFacts({ product: licenseProduct, licenseRowCount: 2 })
    );
    expect(decision.eligible).toBe(true);
    expect(decision.kind).toBe(ShopEligibilityKind.RENEWAL);
  });

  it("extension: definisi aktif + slot LIVE kosong → eligible EXTENSION_PURCHASE", () => {
    const decision = evaluateShopEligibility(baseFacts({ product: extensionProduct }));
    expect(decision.eligible).toBe(true);
    expect(decision.kind).toBe(ShopEligibilityKind.EXTENSION_PURCHASE);
  });

  it("deny: workspace konteks invalid/tidak ada (fail-closed)", () => {
    for (const facts of [
      baseFacts({ workspaceId: null, product: licenseProduct }),
      baseFacts({ workspaceId: "", product: licenseProduct }),
      baseFacts({ workspaceExists: false, product: licenseProduct }),
    ]) {
      const decision = evaluateShopEligibility(facts);
      expect(decision.eligible).toBe(false);
      expect(decision.reasonCode).toBe(ShopReasonCode.SHOP_DENY_WORKSPACE_INVALID);
    }
  });

  it("deny: produk tidak ditemukan", () => {
    const decision = evaluateShopEligibility(baseFacts({ product: null }));
    expect(decision.eligible).toBe(false);
    expect(decision.reasonCode).toBe(ShopReasonCode.SHOP_DENY_PRODUCT_NOT_FOUND);
  });

  it("deny: produk inactive dan withdrawn tidak dapat dibeli", () => {
    for (const status of ["INACTIVE", "WITHDRAWN"]) {
      const decision = evaluateShopEligibility(
        baseFacts({ product: { ...licenseProduct, status } })
      );
      expect(decision.eligible).toBe(false);
      expect(decision.reasonCode).toBe(ShopReasonCode.SHOP_DENY_PRODUCT_NOT_ACTIVE);
    }
  });

  it("deny: struktur kind↔target tidak konsisten (fail-closed)", () => {
    const licenseWithDefinition = {
      ...licenseProduct,
      tier: null,
      definition: extensionProduct.definition,
    };
    const extensionWithTier = {
      ...extensionProduct,
      tier: licenseProduct.tier,
      definition: null,
    };
    const unknownKind = { ...licenseProduct, kind: "PHYSICAL", tier: null, definition: null };
    for (const product of [licenseWithDefinition, extensionWithTier, unknownKind]) {
      const decision = evaluateShopEligibility(baseFacts({ product }));
      expect(decision.eligible).toBe(false);
      expect(decision.reasonCode).toBe(ShopReasonCode.SHOP_DENY_INVALID_PRODUCT);
    }
  });

  it("deny: tier target tidak aktif / tidak resolve", () => {
    const inactiveTier = evaluateShopEligibility(
      baseFacts({
        product: { ...licenseProduct, tier: { id: "tier-1", code: "MINI_RIDER", isActive: false } },
      })
    );
    expect(inactiveTier.reasonCode).toBe(ShopReasonCode.SHOP_DENY_TIER_INACTIVE);

    const missingTier = evaluateShopEligibility(
      baseFacts({ product: { ...licenseProduct, tier: null } })
    );
    expect(missingTier.reasonCode).toBe(ShopReasonCode.SHOP_DENY_INVALID_PRODUCT);
  });

  it("deny: definisi extension tidak tersedia (isActive=false / status bukan CATALOG)", () => {
    const inactiveDef = evaluateShopEligibility(
      baseFacts({
        product: {
          ...extensionProduct,
          definition: { ...extensionProduct.definition!, isActive: false },
        },
      })
    );
    expect(inactiveDef.reasonCode).toBe(ShopReasonCode.SHOP_DENY_DEFINITION_NOT_AVAILABLE);

    const withdrawnDef = evaluateShopEligibility(
      baseFacts({
        product: {
          ...extensionProduct,
          definition: { ...extensionProduct.definition!, status: "WITHDRAWN" },
        },
      })
    );
    expect(withdrawnDef.reasonCode).toBe(ShopReasonCode.SHOP_DENY_DEFINITION_NOT_AVAILABLE);
  });

  it("deny: type code di luar closed list owner (MC §2/§3) — drift fail-closed", () => {
    const decision = evaluateShopEligibility(
      baseFacts({
        product: {
          ...extensionProduct,
          definition: { ...extensionProduct.definition!, typeCode: "hologram_projector" },
        },
      })
    );
    expect(decision.eligible).toBe(false);
    expect(decision.reasonCode).toBe(ShopReasonCode.SHOP_DENY_INVALID_EXTENSION_TYPE);
  });

  it("deny: slot (workspace, type) sudah diisi instance LIVE (invariant 5-D)", () => {
    const decision = evaluateShopEligibility(
      baseFacts({ product: extensionProduct, liveInstanceOfTypeCount: 1 })
    );
    expect(decision.eligible).toBe(false);
    expect(decision.reasonCode).toBe(ShopReasonCode.SHOP_DENY_LIVE_INSTANCE_EXISTS);
  });

  it("deterministik: fakta sama → keputusan sama", () => {
    const facts = baseFacts({ product: extensionProduct });
    expect(evaluateShopEligibility(facts)).toEqual(evaluateShopEligibility(facts));
  });
});
