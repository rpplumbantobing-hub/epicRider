// @vitest-environment node
// Integration test surface isolation — epicRider Phase 5-E (ADR-026; ADR-018;
// REQ-030; prompt owner 5-E §4). Membuktikan secara STRUKTURAL:
//   License & Extension Shop ≠ Public Store ≠ Developer Equipment Store
// - hanya entity family `Shop*` yang ada; TIDAK ada tabel/kolom Public Store
//   (Product/CatalogListing/StoreOrder) atau Equipment Store
//   (EquipmentListing/ListingMedia/StockItem/PriceRecord);
// - ShopProduct hanya REFER LicenseTier/ExtensionDefinition (tanpa duplikasi
//   katalog licensing);
// - shop module tidak mengekspor transisi lifecycle ACTIVE (aktivasi HANYA
//   jalur 5-D);
// - sourceType issuance = konstanta surface-owned.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { Prisma } from "@prisma/client";

import * as shopIssuance from "@/lib/shop/issuance";
import * as shopCompletion from "@/lib/shop/completion";
import * as shopOrderIntent from "@/lib/shop/order-intent";
import * as shopCatalog from "@/lib/shop/catalog";

const SCHEMA_PATH = path.resolve(__dirname, "../../prisma/schema.prisma");

describe("surface isolation (ADR-018; REQ-030; §4)", () => {
  it("model inventory: HANYA family Shop* yang ada untuk shop — tanpa model Public Store / Equipment Store", () => {
    const names = Prisma.dmmf.datamodel.models.map((m) => m.name).sort();

    // Family shop 5-E — tiga model, milik surface License & Extension Shop.
    expect(names).toEqual(
      expect.arrayContaining(["ShopProduct", "ShopOrderIntent", "ShopOrderIntentLine"])
    );

    // TIDAK ada model universal product/order — Public Store (konseptual) dan
    // Equipment Store (Phase 11) TIDAK dimodelkan; tidak ada shared table.
    const forbidden = [
      "Product",
      "ProductType",
      "CatalogListing",
      "StoreOrder",
      "StoreOrderLine",
      "EquipmentListing",
      "ListingMedia",
      "StockItem",
      "PriceRecord",
      // Tidak ada second source of truth entitlement:
      "EntitlementGrant",
      "Seat",
    ];
    for (const name of forbidden) {
      expect(names).not.toContain(name);
    }

    // Tidak ada model dengan prefix lain yang bisa menjadi order universal.
    const orderModels = names.filter((n) => n.toLowerCase().includes("order"));
    expect(orderModels).toEqual(["ShopOrderIntent", "ShopOrderIntentLine"]);
  });

  it("ShopProduct hanya REFER LicenseTier/ExtensionDefinition — tanpa duplikasi katalog licensing", () => {
    const product = Prisma.dmmf.datamodel.models.find((m) => m.name === "ShopProduct");
    expect(product).toBeDefined();
    const relations = product!.fields.filter((f) => f.kind === "object").map((f) => f.name).sort();
    expect(relations).toEqual(["definition", "lines", "tier"]);

    const schema = readFileSync(SCHEMA_PATH, "utf8");
    // Katalog licensing tetap satu-satunya definisi (tidak diduplikasi).
    expect(schema).toMatch(/model LicenseTier \{/);
    expect(schema).toMatch(/model ExtensionDefinition \{/);
    // Tidak ada KOLOM harga/pajak/currency/gateway/refund pada family shop
    // (OD-06) — diperiksa pada NAMA FIELD model saja (bukan komentar).
    const shopSection = schema.slice(schema.indexOf("model ShopProduct"));
    const fieldNames = shopSection
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^[a-zA-Z]+\??\s+(String|Int|Boolean|DateTime)/.test(line))
      .map((line) => line.split(/\s+/)[0].replace("?", "").toLowerCase());
    expect(fieldNames.length).toBeGreaterThan(0);
    for (const fieldName of fieldNames) {
      for (const bannedColumn of ["price", "currency", "tax", "gateway", "refund", "amount", "discount"]) {
        expect(fieldName).not.toContain(bannedColumn);
      }
    }
  });

  it("shop module TIDAK mengekspor transisi lifecycle — aktivasi HANYA jalur 5-D", () => {
    // Semua ekspor modul commerce tidak boleh mengandung fungsi transisi
    // status lisensi/instance ke ACTIVE (pola 5-D `apply*Transition`).
    for (const mod of [shopIssuance, shopCompletion, shopOrderIntent, shopCatalog]) {
      for (const key of Object.keys(mod)) {
        expect(key).not.toMatch(/activate.*license|activate.*instance|apply.*transition/i);
      }
    }
    // Hasil issuance selalu PURCHASED (konstan; bukan ACTIVE).
    const issuanceSource = readFileSync(
      path.resolve(__dirname, "../../src/lib/shop/issuance.ts"),
      "utf8"
    );
    expect(issuanceSource).toContain('status: "PURCHASED"');
    expect(issuanceSource).not.toMatch(/status:\s*"ACTIVE"/);
  });

  it("sourceType issuance adalah konstanta surface-owned SHOP_ORDER_INTENT (sourceRef = intent id)", () => {
    const issuanceSource = readFileSync(
      path.resolve(__dirname, "../../src/lib/shop/issuance.ts"),
      "utf8"
    );
    expect(issuanceSource).toContain("SHOP_ISSUANCE_SOURCE_TYPE");
    expect(issuanceSource).toContain("sourceRef: intent.id");
  });
});
