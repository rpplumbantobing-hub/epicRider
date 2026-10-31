// Order intent boundary License & Extension Shop — epicRider Phase 5-E
// (ADR-026; prompt owner 5-E §12).
//
// MAKNA YANG DIKAT (prompt owner 5-E §12 — WAJIB, tidak boleh lemah):
//   INTENT ≠ PAID
//   INTENT ≠ COMPLETED PAYMENT
//   INTENT ≠ ACTIVE ENTITLEMENT
// TIDAK ada jalur order.created → paid → active. State machine PROVISIONAL
// (OD-135 OPEN): OPEN → COMPLETED → ISSUED; CANCELLED dari OPEN. Tidak ada
// state payment/refund/harga (OD-06/OD-135).
//
// ANTI-DUPLICATION (realistis; pola terbukti 5-D / ADR-017):
// - idempotencyKey unik (DB) yang disuplai pemanggil internal/server — retry
//   dengan key sama + konten identik = no-op SUKSES (state-convergence);
//   konten berbeda = konflik eksplisit teraudit (bukan efek ganda).
// - F-03 (remediasi security — URUTAN WAJIB): OTORISASI SELALU mendahului
//   idempotency probe. Pemanggil tanpa otorisasi TIDAK PERNAH dapat mempelajari
//   apakah sebuah idempotencyKey ada (existence, intent ID, status, workspace,
//   product, buyer, atau bentuk request-nya).
// - optimistic guard (update kondisional) untuk transisi status.
// - replay-cache fisik menunggu OD-01 (ADR-017) — keterbatasan ini
//   dinyatakan jujur, BUKAN infrastruktur replay besar yang dikarang.
// - `Idempotency-Key` pada level HTTP adalah contract boundary API — TIDAK
//   ada route HTTP di Phase 5-E, sehingga tidak diimplementasi di sini.
//
// ELIGIBILITY: dievaluasi server-side per line SEBELUM intent dibuat
// (eligibility.ts); denial = audited. Order intent TIDAK membuat
// License/ExtensionInstance dan TIDAK menyentuh entitlement engine.
//
// STRUKTUR ORDER:
// - satu intent = SATU kind produk (line campur LICENSE+EXTENSION ditolak —
//   semantik issuance per-kind; keputusan struktur, bukan kebijakan bisnis).
// - kind LICENSE: TEPAT SATU line quantity 1 (lisensi per workspace tunggal;
//   kebutuhan kapasitas = seat_package extension per MC §2/REQ-018).
// - kind EXTENSION: line ≥ 1; quantity ≥ 1 (dibawa apa adanya ke instance —
//   TIDAK ada perhitungan kuota; OD-05/OD-06 OPEN).

import type { PrismaClient } from "@prisma/client";

import { AuditOutcome } from "@/lib/audit/audit-service";

import {
  authorizeShopAction,
  recordCommerceAudit,
  type LifecycleActor,
} from "./authorization";
import { resolveShopProductEligibility } from "./eligibility";
import { ShopReasonCode, type ShopEligibilityKind } from "./reason-codes";
import { ShopAction, type ShopOrderIntentStatus } from "./vocabulary";

export interface ShopOrderIntentLineInput {
  productId: string;
  quantity: number;
}

export interface ShopOrderIntentView {
  id: string;
  workspaceId: string;
  status: ShopOrderIntentStatus;
  kind: "LICENSE" | "EXTENSION";
  lines: { productId: string; quantity: number }[];
  createdAt: Date;
}

export type ShopOrderIntentResult =
  | {
      outcome: "SUCCESS";
      intentId: string;
      status: ShopOrderIntentStatus;
      /**
       * Klasifikasi eligibility dari evaluasi BARU pada pembuatan. Pada
       * replay idempotent nilainya `null` — replay TIDAK menghasilkan
       * keputusan eligibility segar (keputusan lama tetap tercatat di audit).
       */
      eligibilityKind: ShopEligibilityKind | null;
      idempotent: boolean;
    }
  | { outcome: "DENIED"; reasonCode: string; intentId: string | null };

/**
 * Buat order intent baru (status OPEN — BUKAN paid, BUKAN completed).
 *
 * Alur (F-03 remediasi — URUTAN WAJIB, tidak boleh dibalik):
 *   validasi bentuk input → OTORISASI `store.order.create` → validasi konteks
 *   tenant/workspace → idempotency probe (state-convergence) → eligibility per
 *   line (server-side) → tulis intent+lines ATOMIK dengan audit.
 *
 * Pemanggil yang gagal otorisasi TIDAK PERNAH mencapai idempotency probe —
 * ia tidak dapat membedakan key yang ada vs tidak ada (anti existence leak).
 */
export async function createShopOrderIntent(
  db: PrismaClient,
  params: {
    actor: LifecycleActor;
    workspaceId: string;
    /** Atribusi pembeli yang diselesaikan SERVER (bukan claim client). */
    buyerUserId?: string | null;
    idempotencyKey: string;
    lines: readonly ShopOrderIntentLineInput[];
    now: Date;
  }
): Promise<ShopOrderIntentResult> {
  const { actor, workspaceId, idempotencyKey, lines } = params;

  // 1) Validasi bentuk input (sebelum apa pun — murah dan deterministik;
  //    TIDAK menyentuh state idempotency → tidak ada kebocoran existence).
  if (!idempotencyKey || idempotencyKey.length === 0) {
    return denyIntent("shop.order.create", ShopReasonCode.SHOP_DENY_INVALID_ORDER_CONTENT, null);
  }
  if (!lines || lines.length === 0 || lines.some((l) => !Number.isInteger(l.quantity) || l.quantity < 1)) {
    return denyIntent("shop.order.create", ShopReasonCode.SHOP_DENY_INVALID_ORDER_CONTENT, null);
  }

  // 2) OTORISASI AKTOR — WAJIB mendahului idempotency probe (F-03 remediasi):
  //    UNAUTHORIZED CALLER MUST NEVER LEARN WHETHER AN IDEMPOTENCY KEY EXISTS.
  //    Probe yang dapat membuka existence/intent ID/status/workspace/product/
  //    buyer hanya dijangkau pemanggil yang sudah lolos rantai otorisasi
  //    (deny-by-default; explicit permission only — pola remediasi PR #4).
  //    USER dengan key `store.order.create` tetap ditolak sampai owner
  //    meratifikasi katalog (OD-122 OPEN). Denial memakai reason code kanonik
  //    rantai (DENY_NO_SESSION/…/DENY_PERMISSION_MISSING) dan teraudit
  //    sebagai authorization denial — BUKAN idempotency conflict.
  const authz = await authorizeShopAction(db, {
    workspaceId,
    action: ShopAction.ORDER_INTENT_CREATE,
    actor,
  });
  if (!authz.allowed) {
    return denyIntent("shop.order.create", authz.reasonCode, null);
  }

  // 3) Konteks tenant/workspace tervalidasi (issuance target selalu workspace).
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true },
  });
  if (workspace === null) {
    return denyIntent("shop.order.create", ShopReasonCode.SHOP_DENY_WORKSPACE_INVALID, null);
  }

  // 4) Idempotency state-convergence — HANYA SETELAH otorisasi + validasi
  //    konteks (F-03). Hanya key milik konteks authorized yang SAMA yang
  //    diperlakukan sebagai key pemanggil.
  const existing = await db.shopOrderIntent.findUnique({
    where: { idempotencyKey },
    include: { lines: { select: { productId: true, quantity: true } } },
  });
  if (existing !== null && existing.workspaceId === workspaceId) {
    // Same authorized context: workspace guard sudah di cabang; perbandingan
    // konten cukup pada lines.
    const sameContent =
      existing.lines.length === lines.length &&
      [...existing.lines]
        .map((l) => `${l.productId}:${l.quantity}`)
        .sort()
        .join("|") ===
        [...lines]
          .map((l) => `${l.productId}:${l.quantity}`)
          .sort()
          .join("|");
    if (!sameContent) {
      // Replay dengan konten berbeda → konflik eksplisit (bukan duplikasi).
      // Caller SUDAH authorized pada konteks ini — existing.id boleh
      // dikembalikan (bukan disclosure cross-tenant).
      await recordCommerceAudit(db, {
        action: "shop.order.create",
        outcome: AuditOutcome.DENIED,
        actorUserId: actor.type === "USER" ? actor.userId : null,
        isSystemActor: actor.type === "SYSTEM",
        workspaceId,
        targetType: "shop_order_intent",
        targetId: existing.id,
        reasonCode: ShopReasonCode.SHOP_DENY_IDEMPOTENCY_CONFLICT,
      });
      return { outcome: "DENIED", reasonCode: ShopReasonCode.SHOP_DENY_IDEMPOTENCY_CONFLICT, intentId: existing.id };
    }
    // Konten identik → no-op sukses teraudit (idempotent). Status intent
    // dikembalikan apa adanya (bisa saja sudah COMPLETED/ISSUED oleh proses
    // lain — replay TIDAK mengubahnya dan TIDAK menilai ulang eligibility).
    await recordCommerceAudit(db, {
      action: "shop.order.create",
      outcome: AuditOutcome.SUCCESS,
      actorUserId: actor.type === "USER" ? actor.userId : null,
      isSystemActor: actor.type === "SYSTEM",
      workspaceId,
      targetType: "shop_order_intent",
      targetId: existing.id,
      reasonCode: ShopReasonCode.ALLOW,
      idempotent: true,
    });
    return {
      outcome: "SUCCESS",
      intentId: existing.id,
      status: existing.status as ShopOrderIntentStatus,
      eligibilityKind: null,
      idempotent: true,
    };
  }
  if (existing !== null) {
    // Key terbukti milik konteks AUTHORIZED LAIN (cross-tenant collision —
    // hanya aktor tepercaya internal yang dapat mencapai titik ini, karena
    // seluruh USER ditolak di langkah 2). Bukan key pemanggil: TIDAK ada
    // perbandingan konten, TIDAK ada existing.id/status/workspace/product/
    // buyer yang dikembalikan — denial generik tanpa disclosure lintas
    // konteks (intentId null), teraudit tanpa target id.
    await recordCommerceAudit(db, {
      action: "shop.order.create",
      outcome: AuditOutcome.DENIED,
      actorUserId: actor.type === "USER" ? actor.userId : null,
      isSystemActor: actor.type === "SYSTEM",
      workspaceId,
      targetType: "shop_order_intent",
      targetId: null,
      reasonCode: ShopReasonCode.SHOP_DENY_IDEMPOTENCY_CONFLICT,
      metadata: { detail: "idempotency key exists outside authorized context" },
    });
    return { outcome: "DENIED", reasonCode: ShopReasonCode.SHOP_DENY_IDEMPOTENCY_CONFLICT, intentId: null };
  }

  // 5) Eligibility server-side per line + konsistensi kind tunggal.
  const productIds = [...new Set(lines.map((l) => l.productId))];
  const eligibilityKinds: ShopEligibilityKind[] = [];
  for (const productId of productIds) {
    const decision = await resolveShopProductEligibility(db, { workspaceId, productId });
    if (!decision.eligible || decision.kind === null) {
      return denyIntent("shop.order.create", decision.reasonCode, null);
    }
    eligibilityKinds.push(decision.kind);
  }
  const lineProducts = await Promise.all(
    productIds.map((id) =>
      db.shopProduct.findUnique({ where: { id }, select: { id: true, kind: true } })
    )
  );
  if (lineProducts.some((p) => p === null)) {
    return denyIntent("shop.order.create", ShopReasonCode.SHOP_DENY_PRODUCT_NOT_FOUND, null);
  }
  const kinds = new Set(lineProducts.map((p) => p!.kind));
  if (kinds.size !== 1) {
    return denyIntent("shop.order.create", ShopReasonCode.SHOP_DENY_INVALID_ORDER_CONTENT, null);
  }
  const orderKind = lineProducts[0]!.kind as "LICENSE" | "EXTENSION";
  if (orderKind === "LICENSE" && lines.length !== 1) {
    // Lisensi per workspace tunggal — tepat satu line (struktur domain).
    return denyIntent("shop.order.create", ShopReasonCode.SHOP_DENY_LICENSE_ORDER_SHAPE, null);
  }
  const totalLicenseQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);
  if (orderKind === "LICENSE" && totalLicenseQuantity !== 1) {
    return denyIntent("shop.order.create", ShopReasonCode.SHOP_DENY_LICENSE_ORDER_SHAPE, null);
  }

  // 6) Tulis intent + lines ATOMIK dengan audit (transaksi tunggal) — hanya
  //    dijangkau pemanggil authorized dengan key yang benar-benar bebas.
  const intentId = await db.$transaction(async (tx) => {
    const intent = await tx.shopOrderIntent.create({
      data: {
        workspaceId,
        buyerUserId: params.buyerUserId ?? null,
        status: "OPEN",
        idempotencyKey,
      },
    });
    await tx.shopOrderIntentLine.createMany({
      data: lines.map((l) => ({
        orderIntentId: intent.id,
        productId: l.productId,
        quantity: l.quantity,
      })),
    });
    await recordCommerceAudit(tx, {
      action: "shop.order.create",
      outcome: AuditOutcome.SUCCESS,
      actorUserId: actor.type === "USER" ? actor.userId : null,
      isSystemActor: actor.type === "SYSTEM",
      workspaceId,
      targetType: "shop_order_intent",
      targetId: intent.id,
      reasonCode: ShopReasonCode.ALLOW,
      metadata: {
        kind: orderKind,
        lines: lines.length,
        eligibility: [...new Set(eligibilityKinds)].sort().join(","),
      },
    });
    return intent.id;
  });

  return {
    outcome: "SUCCESS",
    intentId,
    status: "OPEN",
    eligibilityKind: eligibilityKinds[0] ?? null,
    idempotent: false,
  };

  async function denyIntent(
    action: string,
    reasonCode: string,
    intentId: string | null
  ): Promise<ShopOrderIntentResult> {
    await recordCommerceAudit(db, {
      action,
      outcome: AuditOutcome.DENIED,
      actorUserId: actor.type === "USER" ? actor.userId : null,
      isSystemActor: actor.type === "SYSTEM",
      workspaceId,
      targetType: "shop_order_intent",
      targetId: intentId,
      reasonCode,
    });
    return { outcome: "DENIED", reasonCode, intentId };
  }
}

/**
 * Batalkan order intent (OPEN → CANCELLED; terminal). COMPLETED/ISSUED tidak
 * dapat dibatalkan lewat jalur ini — completion adalah fakta komersial yang
 * tercatat; issuance menangani statusnya sendiri. Otorisasi: SYSTEM internal;
 * USER = default deny (tidak ada key kanonik cancellation; OD-122 OPEN).
 */
export async function cancelShopOrderIntent(
  db: PrismaClient,
  params: { actor: LifecycleActor; orderIntentId: string; now: Date }
): Promise<
  | { outcome: "SUCCESS"; intentId: string; status: ShopOrderIntentStatus; idempotent: boolean }
  | { outcome: "DENIED"; reasonCode: string; intentId: string | null }
> {
  const { actor } = params;
  const intent = await db.shopOrderIntent.findUnique({
    where: { id: params.orderIntentId },
    select: { id: true, workspaceId: true, status: true },
  });
  if (intent === null) {
    await recordCommerceAudit(db, {
      action: "shop.order.cancel",
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

  const denyCancel = async (reasonCode: string): Promise<ShopOrderIntentResult> => {
    await recordCommerceAudit(db, {
      action: "shop.order.cancel",
      outcome: AuditOutcome.DENIED,
      actorUserId: actor.type === "USER" ? actor.userId : null,
      isSystemActor: actor.type === "SYSTEM",
      workspaceId: intent.workspaceId,
      targetType: "shop_order_intent",
      targetId: intent.id,
      reasonCode,
      metadata: { from: intent.status },
    });
    return { outcome: "DENIED", reasonCode, intentId: intent.id };
  };

  const authz = await authorizeShopAction(db, {
    workspaceId: intent.workspaceId,
    action: ShopAction.ORDER_INTENT_CANCEL,
    actor,
  });
  if (!authz.allowed) {
    return denyCancel(authz.reasonCode);
  }
  if (intent.status !== "OPEN") {
    // State-convergence: replay cancel pada CANCELLED = no-op sukses.
    if (intent.status === "CANCELLED") {
      await recordCommerceAudit(db, {
        action: "shop.order.cancel",
        outcome: AuditOutcome.SUCCESS,
        actorUserId: actor.type === "USER" ? actor.userId : null,
        isSystemActor: actor.type === "SYSTEM",
        workspaceId: intent.workspaceId,
        targetType: "shop_order_intent",
        targetId: intent.id,
        reasonCode: ShopReasonCode.ALLOW,
        idempotent: true,
      });
      return { outcome: "SUCCESS", intentId: intent.id, status: "CANCELLED", idempotent: true };
    }
    return denyCancel(ShopReasonCode.SHOP_DENY_ORDER_INVALID_TRANSITION);
  }

  const applied = await db.$transaction(async (tx) => {
    const updated = await tx.shopOrderIntent.updateMany({
      where: { id: intent.id, status: "OPEN" },
      data: { status: "CANCELLED", cancelledAt: params.now },
    });
    if (updated.count !== 1) {
      return false;
    }
    await recordCommerceAudit(tx, {
      action: "shop.order.cancel",
      outcome: AuditOutcome.SUCCESS,
      actorUserId: actor.type === "USER" ? actor.userId : null,
      isSystemActor: actor.type === "SYSTEM",
      workspaceId: intent.workspaceId,
      targetType: "shop_order_intent",
      targetId: intent.id,
      reasonCode: ShopReasonCode.ALLOW,
      metadata: { from: "OPEN", to: "CANCELLED" },
    });
    return true;
  });
  if (!applied) {
    return denyCancel(ShopReasonCode.SHOP_DENY_CONCURRENT_MODIFICATION);
  }
  return { outcome: "SUCCESS", intentId: intent.id, status: "CANCELLED", idempotent: false };
}
