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
-- 2) BACKFILL existing data (remediasi PR #4): baris ExtensionInstance yang
--    sudah ada SEBELUM Phase 5-D di-backfill ADITIF dari relasi kanonik
--    ExtensionInstance.definitionId → ExtensionDefinition.typeId SEBELUM
--    partial unique index dibuat. Tidak ada data baru tanpa sumber
--    kebenaran; definitionId/workspaceId/quantity/status/timestamp/audit
--    TIDAK diubah.
-- 3) Preflight/postflight VALIDASI (remediasi PR #4): bila data existing
--    tidak dapat di-backfill (instance tanpa definisi valid; definition.
--    typeId NULL/tidak resolve ke ExtensionType) atau melanggar invariant
--    satu-LIVE-instance per (workspace, type) setelah backfill, migration
--    GAGAL EKSPLISIT dengan pesan RAISE yang dapat diidentifikasi — TANPA
--    menghapus record, TANPA memilih satu instance otomatis, TANPA mengubah
--    status diam-diam, TANPA mengabaikan data invalid demi PASS. Tabel/
--    trigger helper `_phase5d_*` dibuat dan di-drop per pemeriksaan (bukan
--    data pengguna; seluruh migration transaksional — kegagalan = rollback
--    penuh, keberhasilan = tidak ada sisa helper).
-- 4) Partial unique index live-instance: status LIVE = PURCHASED/ASSIGNED/
--    ACTIVE/SUSPENDED/RENEWED (EXPIRED/REMOVED terminal — tidak menempati
--    slot) — persis `EXTENSION_LIVE_STATUSES` di
--    src/lib/licensing/extension-lifecycle.ts. Pola preseden:
--    License_workspaceId_active_key (5-B) dan
--    Membership_workspaceId_userId_live_key (Phase 4).
-- ============================================================================

-- AlterTable (aditif)
ALTER TABLE "ExtensionInstance" ADD COLUMN "typeId" TEXT;

-- ---------------------------------------------------------------------------
-- PREFLIGHT 1 (sebelum backfill): setiap instance wajib menunjuk
-- ExtensionDefinition yang ada. Bila ada orphan → ABORT dengan pesan eksplisit.
-- ---------------------------------------------------------------------------

CREATE TABLE "_phase5d_check_instance_definition_resolvable" ("v" INTEGER NOT NULL);
CREATE TRIGGER "_phase5d_fail_instance_definition_resolvable"
BEFORE INSERT ON "_phase5d_check_instance_definition_resolvable"
WHEN NEW."v" <> 0
BEGIN
    SELECT RAISE(ABORT, 'PHASE5D_BACKFILL_FAILED: ada ExtensionInstance tanpa ExtensionDefinition valid (_phase5d_check_instance_definition_resolvable) — perbaiki data legacy sebelum migration; migration tidak menghapus atau memilih pengganti secara otomatis');
END;
INSERT INTO "_phase5d_check_instance_definition_resolvable"("v")
SELECT COUNT(*) FROM "ExtensionInstance" AS "i"
WHERE NOT EXISTS (
    SELECT 1 FROM "ExtensionDefinition" AS "d" WHERE "d"."id" = "i"."definitionId"
);
DROP TRIGGER "_phase5d_fail_instance_definition_resolvable";
DROP TABLE "_phase5d_check_instance_definition_resolvable";

-- ---------------------------------------------------------------------------
-- PREFLIGHT 2 (sebelum backfill): definition.typeId wajib terisi DAN resolve
-- ke ExtensionType. Bila tidak → ABORT dengan pesan eksplisit.
-- ---------------------------------------------------------------------------

CREATE TABLE "_phase5d_check_definition_type_resolvable" ("v" INTEGER NOT NULL);
CREATE TRIGGER "_phase5d_fail_definition_type_resolvable"
BEFORE INSERT ON "_phase5d_check_definition_type_resolvable"
WHEN NEW."v" <> 0
BEGIN
    SELECT RAISE(ABORT, 'PHASE5D_BACKFILL_FAILED: ada ExtensionDefinition dengan typeId NULL atau tidak resolve ke ExtensionType (_phase5d_check_definition_type_resolvable) — sumber kebenaran backfill tidak valid; perbaiki data legacy sebelum migration');
END;
INSERT INTO "_phase5d_check_definition_type_resolvable"("v")
SELECT COUNT(*) FROM "ExtensionDefinition" AS "d"
WHERE "d"."typeId" IS NULL
   OR NOT EXISTS (
    SELECT 1 FROM "ExtensionType" AS "t" WHERE "t"."id" = "d"."typeId"
);
DROP TRIGGER "_phase5d_fail_definition_type_resolvable";
DROP TABLE "_phase5d_check_definition_type_resolvable";

-- ---------------------------------------------------------------------------
-- BACKFILL (aditif dari relasi existing — satu-satunya sumber kebenaran).
-- ---------------------------------------------------------------------------

UPDATE "ExtensionInstance"
SET "typeId" = (
    SELECT "d"."typeId" FROM "ExtensionDefinition" AS "d"
    WHERE "d"."id" = "ExtensionInstance"."definitionId"
);

-- ---------------------------------------------------------------------------
-- POSTFLIGHT 1 (setelah backfill, sebelum index): TIDAK ada instance tersisa
-- dengan typeId NULL — migration tidak boleh "sukses" menyisakan data yang
-- lifecycle tidak dapat evaluasi (fail-closed tetap benar, tetapi migration
-- wajib memigrasikan data valid terlebih dahulu).
-- ---------------------------------------------------------------------------

CREATE TABLE "_phase5d_check_backfill_complete" ("v" INTEGER NOT NULL);
CREATE TRIGGER "_phase5d_fail_backfill_complete"
BEFORE INSERT ON "_phase5d_check_backfill_complete"
WHEN NEW."v" <> 0
BEGIN
    SELECT RAISE(ABORT, 'PHASE5D_BACKFILL_FAILED: ada ExtensionInstance dengan typeId masih NULL setelah backfill (_phase5d_check_backfill_complete) — data existing valid tidak boleh dibiarkan tidak ter-evaluasi');
END;
INSERT INTO "_phase5d_check_backfill_complete"("v")
SELECT COUNT(*) FROM "ExtensionInstance" WHERE "typeId" IS NULL;
DROP TRIGGER "_phase5d_fail_backfill_complete";
DROP TABLE "_phase5d_check_backfill_complete";

-- ---------------------------------------------------------------------------
-- POSTFLIGHT 2: invariant satu LIVE instance per (workspace, type) —
-- duplikasi legacy = ABORT eksplisit (tanpa auto-pick, tanpa delete,
-- tanpa perubahan status diam-diam).
-- ---------------------------------------------------------------------------

CREATE TABLE "_phase5d_check_live_instance_unique" ("v" INTEGER NOT NULL);
CREATE TRIGGER "_phase5d_fail_live_instance_unique"
BEFORE INSERT ON "_phase5d_check_live_instance_unique"
WHEN NEW."v" <> 0
BEGIN
    SELECT RAISE(ABORT, 'PHASE5D_BACKFILL_FAILED: data legacy melanggar invariant satu instance LIVE per (workspace, type) (_phase5d_check_live_instance_unique) — migration tidak memilih pemenang otomatis; putuskan data mana yang dipertahankan sebelum migration');
END;
INSERT INTO "_phase5d_check_live_instance_unique"("v")
SELECT COUNT(*) FROM (
    SELECT "i"."workspaceId", "i"."typeId"
    FROM "ExtensionInstance" AS "i"
    WHERE "i"."status" IN ('PURCHASED', 'ASSIGNED', 'ACTIVE', 'SUSPENDED', 'RENEWED')
      AND "i"."typeId" IS NOT NULL
    GROUP BY "i"."workspaceId", "i"."typeId"
    HAVING COUNT(*) > 1
);
DROP TRIGGER "_phase5d_fail_live_instance_unique";
DROP TABLE "_phase5d_check_live_instance_unique";

-- ---------------------------------------------------------------------------
-- Index (SETELAH backfill + preflight/postflight lulus).
-- ---------------------------------------------------------------------------

-- CreateIndex
CREATE INDEX "ExtensionInstance_typeId_idx" ON "ExtensionInstance"("typeId");

-- Phase 5-D invariant: satu instance LIVE per (workspace, type)
CREATE UNIQUE INDEX "ExtensionInstance_workspaceId_typeId_live_key"
    ON "ExtensionInstance"("workspaceId", "typeId")
    WHERE "status" IN ('PURCHASED', 'ASSIGNED', 'ACTIVE', 'SUSPENDED', 'RENEWED')
      AND "typeId" IS NOT NULL;
