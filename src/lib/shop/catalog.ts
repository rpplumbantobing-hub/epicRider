// Catalog/product foundation License & Extension Shop — epicRider Phase 5-E
// (ADR-026; prompt owner 5-E §10).
//
// Cakupan §10 SAJA — information architecture untuk mengetahui:
//   - apa yang dapat dibeli (produk berstatus ACTIVE),
//   - target issuance (LicenseTier untuk kind LICENSE; ExtensionDefinition
//     untuk kind EXTENSION — TIDAK ada duplikasi LicenseTier/definition),
//   - surface/domain ownership (tabel Shop* — milik surface
//     LICENSE_EXTENSION_SHOP; ADR-018 tiga surface terpisah).
//
// TIDAK diimplementasi (BLOCKED/BUKAN scope):
// - harga, currency, pajak, diskon produksi, payment, inventory, fulfillment,
//   refund (OD-06/OD-133 OPEN);
// - management UI/route (Phase 22);
// - aktivasi produk oleh USER (tidak ada key kanonik catalog pada model
//   otorisasi → seluruh mutasi katalog USER = default deny sampai owner
//   meratifikasi; operasi katalog = aktor SYSTEM internal tepercaya).
//
// Default status produk = INACTIVE (tidak dapat dibeli sampai diaktifkan
// secara eksplisit — mirror ExtensionDefinition.isActive=false 5-B; fail-safe
// terhadap produk yang belum disetujui).
//
// Audit: setiap mutasi katalog teraudit (kategori COMMERCE; denial first-
// class). Optimistic guard pada transisi status (konflik = denial eksplisit).

import type { PrismaClient, Prisma } from "@prisma/client";

import { AuditOutcome } from "@/lib/audit/audit-service";
import type { SessionValidity } from "@/lib/authz/policy";
import { MembershipStatus, ReasonCode } from "@/lib/authz/reason-codes";
import { denyByLifecycleChain } from "@/lib/licensing/lifecycle-shared";

import { recordCommerceAudit, authorizeShopAction, type LifecycleActor } from "./authorization";
import { ShopReasonCode } from "./reason-codes";
import {
  ShopAction,
  SHOP_PRODUCT_STATUSES,
  isShopProductKind,
  type ShopProductKind,
  type ShopProductStatus,
} from "./vocabulary";

/** Input pembuatan produk — TIDAK ada field komersial (OD-06). */
export interface CreateShopProductInput {
  code: string;
  kind: ShopProductKind;
  displayName: string;
  /** Wajib untuk kind=LICENSE — LicenseTier.id target (TIDAK diduplikasi). */
  tierId?: string | null;
  /** Wajib untuk kind=EXTENSION — ExtensionDefinition.id target. */
  definitionId?: string | null;
}

export type ShopProductMutationResult =
  | { outcome: "SUCCESS"; productId: string; status: ShopProductStatus }
  | { outcome: "DENIED"; reasonCode: string; productId: string | null };

function denyProduct(
  db: PrismaClient,
  params: {
    action: string;
    reasonCode: string;
    actor: LifecycleActor;
    productId: string | null;
    workspaceId: string | null;
    metadata?: Record<string, unknown>;
  }
): Promise<ShopProductMutationResult> {
  return recordCommerceAudit(db, {
    action: params.action,
    outcome: AuditOutcome.DENIED,
    actorUserId: params.actor.type === "USER" ? params.actor.userId : null,
    isSystemActor: params.actor.type === "SYSTEM",
    workspaceId: params.workspaceId,
    targetType: "shop_product",
    targetId: params.productId,
    reasonCode: params.reasonCode,
    metadata: params.metadata,
  }).then(() => ({
    outcome: "DENIED" as const,
    reasonCode: params.reasonCode,
    productId: params.productId,
  }));
}

/**
 * Validasi struktur kind ↔ target + eksistensi target (server-side;
 * fail-closed). Mengembalikan reason code null bila valid.
 */
async function validateProductStructure(
  db: PrismaClient,
  input: { kind: string; tierId?: string | null; definitionId?: string | null }
): Promise<string | null> {
  if (!isShopProductKind(input.kind)) {
    return ShopReasonCode.SHOP_DENY_INVALID_PRODUCT;
  }
  if (input.kind === "LICENSE") {
    if (!input.tierId || input.definitionId) {
      return ShopReasonCode.SHOP_DENY_INVALID_PRODUCT;
    }
    const tier = await db.licenseTier.findUnique({
      where: { id: input.tierId },
      select: { id: true },
    });
    if (tier === null) {
      return ShopReasonCode.SHOP_DENY_TIER_NOT_RESOLVED;
    }
    return null;
  }
  // kind === "EXTENSION"
  if (!input.definitionId || input.tierId) {
    return ShopReasonCode.SHOP_DENY_INVALID_PRODUCT;
  }
  const definition = await db.extensionDefinition.findUnique({
    where: { id: input.definitionId },
    select: { id: true },
  });
  if (definition === null) {
    return ShopReasonCode.SHOP_DENY_DEFINITION_NOT_RESOLVED;
  }
  return null;
}

/**
 * F-04 (remediasi): reason code denial USER mutasi katalog memakai vocabulary
 * kanonik — kaki SESI rantai otorisasi dievaluasi dengan mekanisme yang SAMA
 * dengan 5-D/5-E (`denyByLifecycleChain`, diekspor tepat untuk pemakaian-ulang
 * lapisan commerce): ABSENT → `DENY_NO_SESSION`, EXPIRED →
 * `DENY_SESSION_EXPIRED`, REVOKED → `DENY_SESSION_REVOKED` — BUKAN
 * `DENY_TENANT_MISMATCH` generik untuk semua kondisi.
 *
 * Kaki membership/tenant rantai TIDAK applicable pada domain katalog
 * platform-global (tidak ada konteks workspace yang dapat diuji untuk USER):
 * status membership non-menolak disuplai agar HANYA kaki sesi yang dievaluasi.
 * USER dengan sesi VALID tetap ditolak `DENY_TENANT_MISMATCH` (tanpa konteks
 * tenant sah untuk mutasi katalog platform — pola policy Phase 4). TIDAK ada
 * reason code baru yang dikarang.
 */
function catalogUserDenialReason(session: SessionValidity): string {
  return (
    denyByLifecycleChain(session, {
      membershipStatus: MembershipStatus.ACTIVE,
      roleKeys: [],
    }) ?? ReasonCode.DENY_TENANT_MISMATCH
  );
}

/**
 * Buat produk shop baru (status default INACTIVE — belum dapat dibeli).
 * Otorisasi: SYSTEM internal tepercaya; USER = rantai penuh + default deny
 * (tidak ada key kanonik katalog shop pada model otorisasi; OD-122 OPEN).
 */
export async function createShopProduct(
  db: PrismaClient,
  params: { actor: LifecycleActor; input: CreateShopProductInput; now: Date }
): Promise<ShopProductMutationResult> {
  const { actor, input } = params;

  // Katalog shop adalah domain platform-global (bukan tenant-scoped) —
  // rantai otorisasi USER (sesi→tenant→membership) selalu menolak karena
  // tidak ada konteks workspace yang sah untuk mutasi katalog platform
  // (DMC §3.12a; pola DENY_TENANT_MISMATCH policy Phase 4). SYSTEM =
  // internal tepercaya.
  if (actor.type === "USER") {
    return denyProduct(db, {
      action: "shop.catalog.create",
      reasonCode: catalogUserDenialReason(actor.session),
      actor,
      productId: null,
      workspaceId: null,
      metadata: { detail: "shop catalog mutation requires internal trusted caller" },
    });
  }

  const structureReason = await validateProductStructure(db, input);
  if (structureReason !== null) {
    return denyProduct(db, {
      action: "shop.catalog.create",
      reasonCode: structureReason,
      actor,
      productId: null,
      workspaceId: null,
      metadata: { kind: input.kind },
    });
  }

  try {
    const created = await db.$transaction(async (tx) => {
      const product = await tx.shopProduct.create({
        data: {
          code: input.code,
          kind: input.kind,
          displayName: input.displayName,
          status: "INACTIVE", // default: belum ditawarkan (fail-safe)
          tierId: input.kind === "LICENSE" ? (input.tierId ?? null) : null,
          definitionId: input.kind === "EXTENSION" ? (input.definitionId ?? null) : null,
        },
      });
      await recordCommerceAudit(tx, {
        action: "shop.catalog.create",
        outcome: AuditOutcome.SUCCESS,
        actorUserId: null,
        isSystemActor: true,
        workspaceId: null,
        targetType: "shop_product",
        targetId: product.id,
        reasonCode: ShopReasonCode.ALLOW,
        metadata: { code: product.code, kind: product.kind, status: product.status },
      });
      return product;
    });
    return { outcome: "SUCCESS", productId: created.id, status: "INACTIVE" };
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    if (code === "P2002") {
      // Kode produk duplikat (unique constraint) — denial eksplisit (bukan
      // silent). CATATAN F-04 (keterbatasan vocabulary, unresolved): vocabulary
      // kanonik saat ini TIDAK menyediakan reason code khusus duplicate-
      // code/unique-constraint yang lebih tepat; kode domain terdekat
      // dipertahankan agar TIDAK mengarang taxonomy baru. Pemetaan ulang
      // menunggu keputusan owner (pola OD — bukan keputusan implementasi).
      return denyProduct(db, {
        action: "shop.catalog.create",
        reasonCode: ShopReasonCode.SHOP_DENY_IDEMPOTENCY_CONFLICT,
        actor,
        productId: null,
        workspaceId: null,
        metadata: { detail: "duplicate product code" },
      });
    }
    throw error;
  }
}

/**
 * Aktifkan produk (INACTIVE → ACTIVE). Fail-closed: struktur + target wajib
 * valid dan tersedia saat aktivasi (produk rusak tidak pernah menjadi
 * dapat-dibeli hanya karena statusnya diubah).
 */
export async function activateShopProduct(
  db: PrismaClient,
  params: { actor: LifecycleActor; productId: string; now: Date }
): Promise<ShopProductMutationResult> {
  const { actor } = params;
  if (actor.type === "USER") {
    return denyProduct(db, {
      action: "shop.catalog.activate",
      reasonCode: catalogUserDenialReason(actor.session),
      actor,
      productId: params.productId,
      workspaceId: null,
    });
  }

  const product = await db.shopProduct.findUnique({
    where: { id: params.productId },
    select: { id: true, kind: true, status: true, tierId: true, definitionId: true },
  });
  if (product === null) {
    return denyProduct(db, {
      action: "shop.catalog.activate",
      reasonCode: ShopReasonCode.SHOP_DENY_PRODUCT_NOT_FOUND,
      actor,
      productId: params.productId,
      workspaceId: null,
    });
  }
  if (product.status === "WITHDRAWN") {
    // WITHDRAWN terminal — tidak dapat diaktifkan kembali (histori terjaga).
    return denyProduct(db, {
      action: "shop.catalog.activate",
      reasonCode: ShopReasonCode.SHOP_DENY_ORDER_INVALID_TRANSITION,
      actor,
      productId: product.id,
      workspaceId: null,
      metadata: { from: product.status },
    });
  }
  const structureReason = await validateProductStructure(db, {
    kind: product.kind,
    tierId: product.tierId,
    definitionId: product.definitionId,
  });
  if (structureReason !== null) {
    return denyProduct(db, {
      action: "shop.catalog.activate",
      reasonCode: structureReason,
      actor,
      productId: product.id,
      workspaceId: null,
    });
  }

  const applied = await db.$transaction(async (tx) => {
      const updated = await tx.shopProduct.updateMany({
        where: { id: product.id, status: product.status },
        data: { status: "ACTIVE" },
      });
      if (updated.count !== 1) {
        return false;
      }
      await recordCommerceAudit(tx, {
        action: "shop.catalog.activate",
        outcome: AuditOutcome.SUCCESS,
        actorUserId: null,
        isSystemActor: true,
        workspaceId: null,
        targetType: "shop_product",
        targetId: product.id,
        reasonCode: ShopReasonCode.ALLOW,
        metadata: { from: product.status, to: "ACTIVE" },
      });
      return true;
    });
    if (!applied) {
      return denyProduct(db, {
        action: "shop.catalog.activate",
        reasonCode: ShopReasonCode.SHOP_DENY_CONCURRENT_MODIFICATION,
        actor,
        productId: product.id,
        workspaceId: null,
        metadata: { from: product.status },
      });
    }
  return { outcome: "SUCCESS", productId: product.id, status: "ACTIVE" };
}

/**
 * Tarik produk dari katalog (ACTIVE|INACTIVE → WITHDRAWN; terminal).
 * Produk WITHDRAWN tidak pernah dapat dibeli; order intent yang sudah ada
 * tidak otomatis dibatalkan — issuance tetap menolak produk non-ACTIVE
 * (fail-closed pada waktu issuance).
 */
export async function withdrawShopProduct(
  db: PrismaClient,
  params: { actor: LifecycleActor; productId: string; now: Date }
): Promise<ShopProductMutationResult> {
  const { actor } = params;
  if (actor.type === "USER") {
    return denyProduct(db, {
      action: "shop.catalog.withdraw",
      reasonCode: catalogUserDenialReason(actor.session),
      actor,
      productId: params.productId,
      workspaceId: null,
    });
  }

  const product = await db.shopProduct.findUnique({
    where: { id: params.productId },
    select: { id: true, status: true },
  });
  if (product === null) {
    return denyProduct(db, {
      action: "shop.catalog.withdraw",
      reasonCode: ShopReasonCode.SHOP_DENY_PRODUCT_NOT_FOUND,
      actor,
      productId: params.productId,
      workspaceId: null,
    });
  }
  if (!(SHOP_PRODUCT_STATUSES as readonly string[]).includes(product.status)) {
    return denyProduct(db, {
      action: "shop.catalog.withdraw",
      reasonCode: ShopReasonCode.SHOP_DENY_INVALID_PRODUCT,
      actor,
      productId: product.id,
      workspaceId: null,
    });
  }

  const applied = await db.$transaction(async (tx) => {
      const updated = await tx.shopProduct.updateMany({
        where: { id: product.id, status: product.status },
        data: { status: "WITHDRAWN" },
      });
      if (updated.count !== 1) {
        return false;
      }
      await recordCommerceAudit(tx, {
        action: "shop.catalog.withdraw",
        outcome: AuditOutcome.SUCCESS,
        actorUserId: null,
        isSystemActor: true,
        workspaceId: null,
        targetType: "shop_product",
        targetId: product.id,
        reasonCode: ShopReasonCode.ALLOW,
        metadata: { from: product.status, to: "WITHDRAWN" },
      });
      return true;
    });
    if (!applied) {
      return denyProduct(db, {
        action: "shop.catalog.withdraw",
        reasonCode: ShopReasonCode.SHOP_DENY_CONCURRENT_MODIFICATION,
        actor,
        productId: product.id,
        workspaceId: null,
      });
    }
  return { outcome: "SUCCESS", productId: product.id, status: "WITHDRAWN" };
}

/**
 * Resolver data produk untuk lapisan order (tanpa keputusan) — dipakai
 * order-intent/issuance; keputusan eligibility ada di eligibility.ts.
 */
export async function getShopProductRow(
  db: PrismaClient,
  productId: string
): Promise<{
  id: string;
  code: string;
  kind: string;
  status: string;
  tierId: string | null;
  definitionId: string | null;
} | null> {
  return db.shopProduct.findUnique({
    where: { id: productId },
    select: {
      id: true,
      code: true,
      kind: true,
      status: true,
      tierId: true,
      definitionId: true,
    },
  });
}

/** Ekspor tipe transaksi untuk pemakaian modul lain (issuance). */
export type ShopTx = Prisma.TransactionClient;
