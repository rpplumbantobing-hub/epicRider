// Issuance boundary License & Extension Shop — epicRider Phase 5-E
// (ADR-026; prompt owner 5-E §14).
//
// BATAS ISSUANCE (WAJIB, tidak boleh dilanggar):
//   Commerce → License / ExtensionInstance (status = PURCHASED)
//            → existing 5-D lifecycle (aktivasi terpisah)
//            → existing 5-C entitlement engine
// - Issuance BOLEH membuat License(status=PURCHASED) /
//   ExtensionInstance(status=PURCHASED) dengan sourceType=SHOP_ORDER_INTENT,
//   sourceRef=ShopOrderIntent.id, dan TERM DATA YANG DISUPLAI PEMANGGIL.
// - Issuance TIDAK BOLEH membuat PURCHASED → ACTIVE. Aktivasi HANYA lewat
//   layanan lifecycle 5-D (`applyLicenseLifecycleTransition` /
//   `applyExtensionLifecycleTransition`) — commerce BUKAN lifecycle engine
//   kedua. Diuji test: setelah issuance status tetap PURCHASED dan engine
//   5-C tetap menolak (PURCHASED bukan sumber entitlement).
// - OD-108 OPEN: TIDAK ada durasi default, TIDAK ada perhitungan
//   term/window/grace, TIDAK ada scheduler. Semua tanggal term = caller-
//   supplied; kolom yang tidak disuplai dibiarkan null. `purchasedAt` diisi
//   dari fakta `completedAt` intent (catatan peristiwa, bukan perhitungan
//   kebijakan) kecuali pemanggil menyuplai eksplisit.
// - Aktor: operasi internal tepercaya (SYSTEM). USER = default deny teraudit
//   (tidak ada key kanonik issuance; ENTITLEMENT_MODEL §8).
// - Idempotensi state-convergence (pola 5-D): intent sudah ISSUED + target
//   masih konsisten → no-op SUKSES; inkonsisten → denial invariant teraudit.
// - Duplicate issuance extension dicegah DB (partial unique satu-LIVE per
//   (workspace,type) migration 5-D) — P2002 dipetakan ke denial teraudit.
// - Fail-closed pada waktu issuance: produk WAJIB masih ACTIVE dan
//   eligibility dinilai ULANG (state workspace dapat berubah sejak intent).

import type { PrismaClient } from "@prisma/client";

import { AuditOutcome } from "@/lib/audit/audit-service";

import {
  authorizeShopAction,
  recordCommerceAudit,
  type LifecycleActor,
} from "./authorization";
import { resolveShopProductEligibility } from "./eligibility";
import { ShopReasonCode } from "./reason-codes";
import { ShopAction, SHOP_ISSUANCE_SOURCE_TYPE } from "./vocabulary";

/** Term data yang DISUPLAI pemanggil — modul TIDAK PERNAH menghitung. */
export interface ShopIssuanceTermData {
  purchasedAt?: Date | null;
  termStartsAt?: Date | null;
  termEndsAt?: Date | null;
  renewalWindowStartsAt?: Date | null;
}

export type ShopIssuanceResult =
  | {
      outcome: "SUCCESS";
      intentId: string;
      kind: "LICENSE" | "EXTENSION";
      issuedLicenseId: string | null;
      issuedExtensionInstanceIds: readonly string[];
      idempotent: boolean;
    }
  | { outcome: "DENIED"; reasonCode: string; intentId: string | null };

/**
 * Issue dari order intent berstatus COMPLETED:
 * - kind LICENSE  → tepat satu License(status=PURCHASED) pada tier target.
 * - kind EXTENSION → satu ExtensionInstance(status=PURCHASED) per line
 *   (quantity dibawa dari line intent — caller-supplied saat pembuatan).
 *
 * TIDAK melakukan aktivasi; TIDAK menyentuh engine entitlement.
 */
export async function issueFromCompletedShopOrderIntent(
  db: PrismaClient,
  params: {
    actor: LifecycleActor;
    orderIntentId: string;
    /** Term data caller-supplied untuk lisensi (OD-108: tanpa default). */
    licenseTerm?: ShopIssuanceTermData;
    /** Term data caller-supplied untuk instance extension (OD-108). */
    extensionTerm?: { termStartsAt?: Date | null; termEndsAt?: Date | null };
    /** provisionedAt caller-supplied; default = waktu keputusan `now`. */
    provisionedAt?: Date | null;
    /** Jam keputusan — disuplai pemanggil/server (pola 5-D). */
    now: Date;
  }
): Promise<ShopIssuanceResult> {
  const { actor } = params;
  const intent = await db.shopOrderIntent.findUnique({
    where: { id: params.orderIntentId },
    include: { lines: { select: { id: true, productId: true, quantity: true } } },
  });
  if (intent === null) {
    await recordCommerceAudit(db, {
      action: "shop.issuance.execute",
      outcome: AuditOutcome.DENIED,
      actorUserId: actor.type === "USER" ? actor.userId : null,
      isSystemActor: actor.type === "SYSTEM",
      workspaceId: null,
      targetType: "shop_order_intent",
      targetId: params.orderIntentId,
      reasonCode: ShopReasonCode.SHOP_DENY_ORDER_INTENT_NOT_FOUND,
    });
    return {
      outcome: "DENIED",
      reasonCode: ShopReasonCode.SHOP_DENY_ORDER_INTENT_NOT_FOUND,
      intentId: null,
    };
  }

  const denyIssuance = async (reasonCode: string): Promise<ShopIssuanceResult> => {
    await recordCommerceAudit(db, {
      action: "shop.issuance.execute",
      outcome: AuditOutcome.DENIED,
      actorUserId: actor.type === "USER" ? actor.userId : null,
      isSystemActor: actor.type === "SYSTEM",
      workspaceId: intent.workspaceId,
      targetType: "shop_order_intent",
      targetId: intent.id,
      reasonCode,
      metadata: { status: intent.status },
    });
    return { outcome: "DENIED", reasonCode, intentId: intent.id };
  };

  // 1) Otorisasi aktor (internal trusted; USER default deny).
  const authz = await authorizeShopAction(db, {
    workspaceId: intent.workspaceId,
    action: ShopAction.ISSUANCE,
    actor,
  });
  if (!authz.allowed) {
    return denyIssuance(authz.reasonCode);
  }

  // 2) Idempotensi state-convergence: intent ISSUED → verifikasi target masih
  //    konsisten (invariant), lalu no-op SUKSES (tanpa efek ganda).
  if (intent.status === "ISSUED") {
    const existingLicenses = await db.license.findMany({
      where: { workspaceId: intent.workspaceId, sourceType: SHOP_ISSUANCE_SOURCE_TYPE, sourceRef: intent.id },
      select: { id: true },
    });
    const existingInstances = await db.extensionInstance.findMany({
      where: { workspaceId: intent.workspaceId, sourceType: SHOP_ISSUANCE_SOURCE_TYPE, sourceRef: intent.id },
      select: { id: true },
    });
    const lineCount = intent.lines.length;
    const consistent =
      (lineCount === 1 && existingLicenses.length === 1 && existingInstances.length === 0) ||
      (lineCount >= 1 && existingLicenses.length === 0 && existingInstances.length === lineCount);
    if (!consistent) {
      return denyIssuance(ShopReasonCode.SHOP_DENY_ISSUED_STATE_UNEVALUABLE);
    }
    await recordCommerceAudit(db, {
      action: "shop.issuance.execute",
      outcome: AuditOutcome.SUCCESS,
      actorUserId: actor.type === "USER" ? actor.userId : null,
      isSystemActor: actor.type === "SYSTEM",
      workspaceId: intent.workspaceId,
      targetType: "shop_order_intent",
      targetId: intent.id,
      reasonCode: ShopReasonCode.ALLOW,
      idempotent: true,
      metadata: {
        issuedLicenseId: existingLicenses[0]?.id ?? null,
        issuedExtensionInstanceIds: existingInstances.map((i) => i.id).join(","),
      },
    });
    return {
      outcome: "SUCCESS",
      intentId: intent.id,
      kind: existingLicenses.length === 1 ? "LICENSE" : "EXTENSION",
      issuedLicenseId: existingLicenses[0]?.id ?? null,
      issuedExtensionInstanceIds: existingInstances.map((i) => i.id),
      idempotent: true,
    };
  }

  // 3) Hanya COMPLETED yang dapat di-issue (OPEN belum verified; CANCELLED
  //    terminal). INTENT ≠ COMPLETED — completion = boundary §13.
  if (intent.status === "OPEN") {
    return denyIssuance(ShopReasonCode.SHOP_DENY_ORDER_NOT_COMPLETED);
  }
  if (intent.status === "CANCELLED") {
    return denyIssuance(ShopReasonCode.SHOP_DENY_ORDER_CANCELLED);
  }

  // 4) Muat produk per line + konsistensi kind tunggal (guard konten).
  const productIds = [...new Set(intent.lines.map((l) => l.productId))];
  const products = await Promise.all(
    productIds.map((id) =>
      db.shopProduct.findUnique({
        where: { id },
        select: {
          id: true,
          code: true,
          kind: true,
          status: true,
          tierId: true,
          definitionId: true,
        },
      })
    )
  );
  if (products.some((p) => p === null)) {
    return denyIssuance(ShopReasonCode.SHOP_DENY_PRODUCT_NOT_FOUND);
  }
  const resolvedProducts = products as NonNullable<(typeof products)[number]>[];
  const kinds = new Set(resolvedProducts.map((p) => p.kind));
  if (kinds.size !== 1) {
    return denyIssuance(ShopReasonCode.SHOP_DENY_INVALID_ORDER_CONTENT);
  }
  const kind = resolvedProducts[0].kind as "LICENSE" | "EXTENSION";
  if (kind === "LICENSE" && (intent.lines.length !== 1 || intent.lines[0].quantity !== 1)) {
    return denyIssuance(ShopReasonCode.SHOP_DENY_LICENSE_ORDER_SHAPE);
  }

  // 5) Fail-closed pada waktu issuance: produk masih ACTIVE + eligibility
  //    dinilai ulang (state workspace/definisi dapat berubah sejak intent).
  for (const productId of productIds) {
    const decision = await resolveShopProductEligibility(db, {
      workspaceId: intent.workspaceId,
      productId,
    });
    if (!decision.eligible) {
      return denyIssuance(decision.reasonCode);
    }
  }

  const licenseProduct = kind === "LICENSE" ? resolvedProducts[0] : null;
  if (kind === "LICENSE" && (licenseProduct === null || licenseProduct.tierId === null)) {
    // Struktur produk invalid — issuance tidak pernah menebak tier.
    return denyIssuance(ShopReasonCode.SHOP_DENY_INVALID_PRODUCT);
  }

  // 6) Issuance ATOMIK: buat baris PURCHASED + tandai intent ISSUED + audit.
  try {
    const result = await db.$transaction(async (tx) => {
      let issuedLicenseId: string | null = null;
      const issuedExtensionInstanceIds: string[] = [];

      if (kind === "LICENSE" && licenseProduct !== null) {
        const tierId = licenseProduct.tierId;
        if (tierId === null) {
          // Struktur produk invalid — issuance tidak pernah menebak tier.
          throw new IssuanceInputError(ShopReasonCode.SHOP_DENY_INVALID_PRODUCT);
        }
        const license = await tx.license.create({
          data: {
            workspaceId: intent.workspaceId,
            tierId,
            status: "PURCHASED", // BUKAN ACTIVE — aktivasi = lifecycle 5-D
            purchasedAt: params.licenseTerm?.purchasedAt ?? intent.completedAt ?? null,
            termStartsAt: params.licenseTerm?.termStartsAt ?? null,
            termEndsAt: params.licenseTerm?.termEndsAt ?? null,
            renewalWindowStartsAt: params.licenseTerm?.renewalWindowStartsAt ?? null,
            sourceType: SHOP_ISSUANCE_SOURCE_TYPE,
            sourceRef: intent.id,
          },
        });
        issuedLicenseId = license.id;
      }

      if (kind === "EXTENSION") {
        for (const line of intent.lines) {
          const product = resolvedProducts.find((p) => p.id === line.productId);
          if (!product || product.definitionId === null) {
            // Struktur produk invalid di tengah transaksi → lempar → rollback.
            throw new IssuanceInputError(ShopReasonCode.SHOP_DENY_INVALID_PRODUCT);
          }
          const definition = await tx.extensionDefinition.findUnique({
            where: { id: product.definitionId },
            select: { id: true, typeId: true },
          });
          if (definition === null || definition.typeId === null) {
            // Denormalisasi typeId hilang — invariant 5-D dilanggar; fail-closed.
            throw new IssuanceInputError(ShopReasonCode.SHOP_DENY_UNEVALUABLE_INSTANCE);
          }
          const instance = await tx.extensionInstance.create({
            data: {
              workspaceId: intent.workspaceId,
              definitionId: product.definitionId,
              typeId: definition.typeId,
              status: "PURCHASED", // BUKAN ACTIVE — aktivasi = lifecycle 5-D
              quantity: line.quantity,
              provisionedAt: params.provisionedAt ?? params.now,
              termStartsAt: params.extensionTerm?.termStartsAt ?? null,
              termEndsAt: params.extensionTerm?.termEndsAt ?? null,
              sourceType: SHOP_ISSUANCE_SOURCE_TYPE,
              sourceRef: intent.id,
            },
          });
          issuedExtensionInstanceIds.push(instance.id);
        }
      }

      // Tandai intent ISSUED — optimistic guard pada status COMPLETED.
      const updated = await tx.shopOrderIntent.updateMany({
        where: { id: intent.id, status: "COMPLETED" },
        data: { status: "ISSUED", issuedAt: params.now },
      });
      if (updated.count !== 1) {
        throw new IssuanceInputError(ShopReasonCode.SHOP_DENY_CONCURRENT_MODIFICATION);
      }

      await recordCommerceAudit(tx, {
        action: "shop.issuance.execute",
        outcome: AuditOutcome.SUCCESS,
        actorUserId: actor.type === "USER" ? actor.userId : null,
        isSystemActor: actor.type === "SYSTEM",
        workspaceId: intent.workspaceId,
        targetType: "shop_order_intent",
        targetId: intent.id,
        reasonCode: ShopReasonCode.ALLOW,
        metadata: {
          kind,
          issuedLicenseId,
          issuedExtensionInstanceIds: issuedExtensionInstanceIds.join(","),
          issuedStatus: "PURCHASED",
        },
      });

      return { issuedLicenseId, issuedExtensionInstanceIds };
    });

    return {
      outcome: "SUCCESS",
      intentId: intent.id,
      kind,
      issuedLicenseId: result.issuedLicenseId,
      issuedExtensionInstanceIds: result.issuedExtensionInstanceIds,
      idempotent: false,
    };
  } catch (error) {
    if (error instanceof IssuanceInputError) {
      return denyIssuance(error.reasonCode);
    }
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    if (code === "P2002") {
      // Pelanggaran invariant DB (mis. satu-LIVE extension per (workspace,type))
      // → denial eksplisit teraudit; transaksi sudah rollback penuh.
      return denyIssuance(ShopReasonCode.SHOP_DENY_LIVE_INSTANCE_EXISTS);
    }
    throw error;
  }
}

/** Error kontrol alur issuance (rollback transaksi + denial teraudit). */
class IssuanceInputError extends Error {
  constructor(public readonly reasonCode: string) {
    super(reasonCode);
    this.name = "IssuanceInputError";
  }
}
