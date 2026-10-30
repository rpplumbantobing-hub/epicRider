-- CreateTable
CREATE TABLE "LicenseTier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    -- Phase 5-B (invariant kanonik MC §2.1 / DMC §4.4): closed set TIGA tier.
    -- hiRider BUKAN license tier (portal/capability); tier keempat ditolak DB-level.
    CHECK ("code" IN ('MINI_RIDER', 'MAX_RIDER', 'ISO_RIDER'))
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PURCHASED',
    "purchasedAt" DATETIME,
    "termStartsAt" DATETIME,
    "termEndsAt" DATETIME,
    "renewalWindowStartsAt" DATETIME,
    "graceEndsAt" DATETIME,
    "sourceType" TEXT,
    "sourceRef" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "License_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "License_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "LicenseTier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Capability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "descriptionKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CapabilityRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "capabilityId" TEXT NOT NULL,
    "tierId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CapabilityRule_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CapabilityRule_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "LicenseTier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExtensionType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ExtensionDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'CATALOG',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExtensionDefinition_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ExtensionType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExtensionInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PURCHASED',
    "quantity" INTEGER,
    "provisionedAt" DATETIME,
    "termStartsAt" DATETIME,
    "termEndsAt" DATETIME,
    "sourceType" TEXT,
    "sourceRef" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExtensionInstance_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExtensionInstance_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "ExtensionDefinition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TierQuota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tierId" TEXT NOT NULL,
    "quotaCode" TEXT NOT NULL,
    "limitValue" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "ownerCountedInQuota" BOOLEAN,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TierQuota_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "LicenseTier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "LicenseTier_code_key" ON "LicenseTier"("code");

-- CreateIndex
CREATE INDEX "License_workspaceId_status_idx" ON "License"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "License_tierId_idx" ON "License"("tierId");

-- CreateIndex
CREATE INDEX "License_status_termEndsAt_idx" ON "License"("status", "termEndsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Capability_code_key" ON "Capability"("code");

-- CreateIndex
CREATE INDEX "CapabilityRule_capabilityId_status_idx" ON "CapabilityRule"("capabilityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CapabilityRule_capabilityId_tierId_key" ON "CapabilityRule"("capabilityId", "tierId");

-- CreateIndex
CREATE UNIQUE INDEX "ExtensionType_code_key" ON "ExtensionType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ExtensionDefinition_code_key" ON "ExtensionDefinition"("code");

-- CreateIndex
CREATE INDEX "ExtensionDefinition_typeId_isActive_idx" ON "ExtensionDefinition"("typeId", "isActive");

-- CreateIndex
CREATE INDEX "ExtensionInstance_workspaceId_status_idx" ON "ExtensionInstance"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "ExtensionInstance_definitionId_idx" ON "ExtensionInstance"("definitionId");

-- CreateIndex
CREATE INDEX "ExtensionInstance_status_termEndsAt_idx" ON "ExtensionInstance"("status", "termEndsAt");

-- CreateIndex
CREATE INDEX "TierQuota_tierId_status_idx" ON "TierQuota"("tierId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TierQuota_tierId_quotaCode_key" ON "TierQuota"("tierId", "quotaCode");

-- ============================================================================
-- Phase 5-B — penegakan invariant kanonik via SQL terversionisasi (pola
-- preseden: partial unique index "Membership_workspaceId_userId_live_key"
-- Phase 4). Prisma tidak mendeklarasikan partial unique index secara deklaratif.
-- 1) LicenseTier.code = closed set tiga tier — CHECK di CREATE TABLE di atas
--    (keputusan owner SUDAH ditetapkan: MC §2.1, DMC §4.4, TESTING.md
--    "hiRider != LicenseTier").
-- 2) Tepat satu lisensi ACTIVE per workspace (ENTITLEMENT_MODEL.md §2 — aturan
--    kanonik). Baris histori status lain (PURCHASED/RENEWAL_DUE/EXPIRED/GRACE/
--    DOWNGRADED) tetap diizinkan — histori lisensi append-only (REQ-099,
--    DMC §2.3 "never deleted"). Resolusi "current license" = lapisan runtime
--    Phase 5-C; schema tidak mengunci lebih dari aturan kanonik ini.
-- ============================================================================
CREATE UNIQUE INDEX "License_workspaceId_active_key"
    ON "License"("workspaceId")
    WHERE "status" = 'ACTIVE';

-- ============================================================================
-- Phase 5-B — seed data referensi. HANYA nilai yang bersumber dokumen owner
-- (LICENSE_MATRIX.md §1/§2/§5; MASTER_CONTROL.md §2.1; REQ-018/REQ-009;
-- DATA_MODEL_CONCEPT.md §3.5/§3.6). TIDAK ada harga/komersial (OD-06), TIDAK
-- ada durasi/window (OD-108), TIDAK ada nilai kuota lain (OD-05/OD-06/OD-137),
-- TIDAK ada definisi extension produk. Kode language-neutral (DMC §2.9);
-- string tampilan = locale files saat UI licensing dibangun (bukan 5-B).
-- ============================================================================

-- License tiers (LICENSE_MATRIX §1; MC §2.1 — tepat tiga)
INSERT INTO "LicenseTier" ("id", "code", "isActive", "createdAt", "updatedAt") VALUES
  ('tier_mini_rider', 'MINI_RIDER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tier_max_rider', 'MAX_RIDER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tier_iso_rider', 'ISO_RIDER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Extension types (REQ-018; MC §2/§3; DMC §3.6 — closed-by-owner list)
INSERT INTO "ExtensionType" ("id", "code", "createdAt", "updatedAt") VALUES
  ('exttype_additional_workspace', 'additional_workspace', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('exttype_seat_package', 'seat_package', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('exttype_workspace_landing', 'workspace_landing', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('exttype_mobile_client', 'mobile_client', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Capabilities (baris matriks LICENSE_MATRIX §2; kode snake_case language-neutral)
INSERT INTO "Capability" ("id", "code", "descriptionKey", "status", "createdAt", "updatedAt") VALUES
  ('cap_core_event_workspace', 'core_event_workspace', 'licensing.capability.core_event_workspace', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cap_home_event_asset_team_profile', 'home_event_asset_team_profile', 'licensing.capability.home_event_asset_team_profile', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cap_technical_rider', 'technical_rider', 'licensing.capability.technical_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cap_media_kit', 'media_kit', 'licensing.capability.media_kit', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cap_basic_asset_management', 'basic_asset_management', 'licensing.capability.basic_asset_management', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cap_crm', 'crm', 'licensing.capability.crm', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cap_finance_commercial', 'finance_commercial', 'licensing.capability.finance_commercial', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cap_full_asset_rental_lifecycle', 'full_asset_rental_lifecycle', 'licensing.capability.full_asset_rental_lifecycle', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cap_advanced_operational_controls', 'advanced_operational_controls', 'licensing.capability.advanced_operational_controls', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cap_ims_capability', 'ims_capability', 'licensing.capability.ims_capability', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Capability rules inklusi tier — PERSIS matriks LICENSE_MATRIX §2 (✓/—):
-- miniRider 5 baris, maxRider 9 baris, ISOrider 10 baris. Tidak ada baris lain.
INSERT INTO "CapabilityRule" ("id", "capabilityId", "tierId", "status", "createdAt", "updatedAt") VALUES
  ('caprule_mini_core_event_workspace', 'cap_core_event_workspace', 'tier_mini_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_mini_home_event_asset_team_profile', 'cap_home_event_asset_team_profile', 'tier_mini_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_mini_technical_rider', 'cap_technical_rider', 'tier_mini_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_mini_media_kit', 'cap_media_kit', 'tier_mini_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_mini_basic_asset_management', 'cap_basic_asset_management', 'tier_mini_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_max_core_event_workspace', 'cap_core_event_workspace', 'tier_max_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_max_home_event_asset_team_profile', 'cap_home_event_asset_team_profile', 'tier_max_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_max_technical_rider', 'cap_technical_rider', 'tier_max_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_max_media_kit', 'cap_media_kit', 'tier_max_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_max_basic_asset_management', 'cap_basic_asset_management', 'tier_max_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_max_crm', 'cap_crm', 'tier_max_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_max_finance_commercial', 'cap_finance_commercial', 'tier_max_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_max_full_asset_rental_lifecycle', 'cap_full_asset_rental_lifecycle', 'tier_max_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_max_advanced_operational_controls', 'cap_advanced_operational_controls', 'tier_max_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_iso_core_event_workspace', 'cap_core_event_workspace', 'tier_iso_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_iso_home_event_asset_team_profile', 'cap_home_event_asset_team_profile', 'tier_iso_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_iso_technical_rider', 'cap_technical_rider', 'tier_iso_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_iso_media_kit', 'cap_media_kit', 'tier_iso_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_iso_basic_asset_management', 'cap_basic_asset_management', 'tier_iso_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_iso_crm', 'cap_crm', 'tier_iso_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_iso_finance_commercial', 'cap_finance_commercial', 'tier_iso_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_iso_full_asset_rental_lifecycle', 'cap_full_asset_rental_lifecycle', 'tier_iso_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_iso_advanced_operational_controls', 'cap_advanced_operational_controls', 'tier_iso_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('caprule_iso_ims_capability', 'cap_ims_capability', 'tier_iso_rider', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- TierQuota — SATU-SATUNYA nilai kuota yang ditetapkan owner (MC §2.1/REQ-009):
-- miniRider = maksimal 5 kru per workspace. ownerCountedInQuota = NULL
-- (OD-05 OPEN — keputusan owner cukup mengubah DATA, bukan schema, DMC §8).
-- Tidak ada kuota maxRider/ISOrider yang dikarang (OD-06/OD-137 OPEN).
INSERT INTO "TierQuota" ("id", "tierId", "quotaCode", "limitValue", "unit", "ownerCountedInQuota", "status", "createdAt", "updatedAt") VALUES
  ('quota_mini_crew_seats', 'tier_mini_rider', 'crew_seats_per_workspace', 5, 'CREW_SEAT', NULL, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
