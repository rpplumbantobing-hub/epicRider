-- ============================================================================
-- Phase 5-E — Commerce foundation: License & Extension Shop (ADR-026).
-- Aditif-only (pola Phase 4/5-B/5-D): hanya CREATE TABLE + CREATE INDEX;
-- TIDAK ada DROP/DELETE/ALTER; migration Phase 4, 5-B, dan 5-D TIDAK disentuh.
-- Aman terhadap existing data 5-B/5-C/5-D (tidak ada kolom/baris existing
-- yang diubah — seluruh objek baru).
--
-- Entity family `Shop*` = surface "License & Extension Shop" SAJA
-- (DMC §3.12a — direkonsiliasi Phase 5-E; ADR-018 tiga surface terpisah;
-- REQ-030). TIDAK ada tabel bersama dengan Public Store (konseptual —
-- Product/CatalogListing/StoreOrder TIDAK dimodelkan) atau Developer
-- Equipment Store (Phase 11).
--
-- Rantai (prompt owner 5-E):
--   ShopProduct (katalog struktur SAJA — tanpa harga/pajak/gateway: OD-06;
--     tanpa diskon: OD-133)
--   → ShopOrderIntent (INTENT ≠ PAID ≠ ACTIVE ENTITLEMENT; state PROVISIONAL
--     — OD-135 OPEN; tanpa state payment/refund)
--   → verified completion boundary (sumber internal tepercaya — union tertutup
--     NON_PRODUCTION_TEST_SIMULATION; bukan claim client; jalur charging
--     produksi = OD-06 OPEN, TIDAK dimodelkan)
--   → issuance: License(status=PURCHASED) / ExtensionInstance(status=
--     PURCHASED) + sourceType='SHOP_ORDER_INTENT' + sourceRef intent id
--   → aktivasi HANYA via layanan lifecycle 5-D (bukan dari commerce)
--   → engine entitlement 5-C membaca status.
-- TIDAK ada EntitlementGrant (DMC §3.5 direkonsiliasi ADR-026 — License +
-- ExtensionInstance tetap satu-satunya sumber entitlement; TIDAK ada second
-- source of truth).
--
-- OD-108 OPEN: tidak ada kolom durasi baru; term data lisensi/instance
-- caller-supplied pada waktu issuance (kolom 5-B dipakai apa adanya).
-- OD-122 OPEN: tidak ada tabel permission baru; key kanonik satu-satunya
-- (store.order.create, AUTHORIZATION_MODEL §4.12) tidak diikat preset.
-- ============================================================================

-- CreateTable
CREATE TABLE "ShopProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INACTIVE',
    "tierId" TEXT,
    "definitionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    -- Phase 5-E (invariant ADR-018, ACCEPTED owner 2026-10-28): surface
    -- License & Extension Shop hanya menjual LICENSE dan EXTENSION — closed
    -- set kind, preseden CHECK LicenseTier.code (5-B). Status katalog tidak
    -- dikunci DB (vocabulary structural; ditegakkan lapisan service, pola
    -- status License/ExtensionInstance 5-B/5-D).
    CHECK ("kind" IN ('LICENSE', 'EXTENSION')),
    CONSTRAINT "ShopProduct_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "LicenseTier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShopProduct_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "ExtensionDefinition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShopOrderIntent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "buyerUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "idempotencyKey" TEXT NOT NULL,
    "completionSource" TEXT,
    "completedAt" DATETIME,
    "issuedAt" DATETIME,
    "cancelledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShopOrderIntent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShopOrderIntent_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShopOrderIntentLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderIntentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    -- Phase 5-E: quantity minimal 1 — integritas data murni (tanpa makna
    -- kuota; OD-05/OD-06 OPEN).
    CHECK ("quantity" >= 1),
    CONSTRAINT "ShopOrderIntentLine_orderIntentId_fkey" FOREIGN KEY ("orderIntentId") REFERENCES "ShopOrderIntent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShopOrderIntentLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ShopProduct" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopProduct_code_key" ON "ShopProduct"("code");

-- CreateIndex
CREATE INDEX "ShopProduct_kind_status_idx" ON "ShopProduct"("kind", "status");

-- CreateIndex
CREATE INDEX "ShopProduct_status_idx" ON "ShopProduct"("status");

-- CreateIndex
CREATE INDEX "ShopOrderIntent_workspaceId_status_idx" ON "ShopOrderIntent"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "ShopOrderIntent_status_idx" ON "ShopOrderIntent"("status");

-- Phase 5-E anti-duplication (ADR-017; prompt owner 5-E §12): key idempotensi
-- unik — retry dengan key sama TIDAK menggandakan order intent.
CREATE UNIQUE INDEX "ShopOrderIntent_idempotencyKey_key" ON "ShopOrderIntent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ShopOrderIntentLine_orderIntentId_idx" ON "ShopOrderIntentLine"("orderIntentId");

-- CreateIndex
CREATE INDEX "ShopOrderIntentLine_productId_idx" ON "ShopOrderIntentLine"("productId");
