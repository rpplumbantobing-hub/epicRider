-- ============================================================================
-- Phase 5-D — License & Extension Lifecycle invariants (ADR-025).
-- Aditif-only (pola Phase 5-B): TIDAK ada DROP/DELETE/ALTER destruktif;
-- migration Phase 4 & 5-B tidak disentuh.
--
-- 1) Kolom denormalisasi ExtensionInstance.typeId (salinan
--    definition.typeId). SQLite tidak dapat membuat unique index melalui
--    join, sehingga invariant kanonik "satu instance LIVE per (workspace,
--    type)" (LICENSE_MATRIX §5; PHASE_5D_REPORT §B) ditegakkan lewat kolom
--    ini. Diisi/disinkronkan oleh service lifecycle (src/lib/licensing/
--    extension-lifecycle.ts) pada setiap penulisan; nullable demi kompat-
--    ibilitas aditif dengan baris lama. Sinkronisasi diuji test integration.
-- 2) Partial unique index live-instance: status LIVE = PURCHASED/ASSIGNED/
--    ACTIVE/SUSPENDED/RENEWED (EXPIRED/REMOVED terminal — tidak menempati
--    slot). Pola preseden: License_workspaceId_active_key (5-B) dan
--    Membership_workspaceId_userId_live_key (Phase 4).
-- ============================================================================

-- AlterTable (aditif)
ALTER TABLE "ExtensionInstance" ADD COLUMN "typeId" TEXT;

-- CreateIndex
CREATE INDEX "ExtensionInstance_typeId_idx" ON "ExtensionInstance"("typeId");

-- Phase 5-D invariant: satu instance LIVE per (workspace, type)
CREATE UNIQUE INDEX "ExtensionInstance_workspaceId_typeId_live_key"
    ON "ExtensionInstance"("workspaceId", "typeId")
    WHERE "status" IN ('PURCHASED', 'ASSIGNED', 'ACTIVE', 'SUSPENDED', 'RENEWED')
      AND "typeId" IS NOT NULL;
