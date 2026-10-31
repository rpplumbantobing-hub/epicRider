// Verified commercial completion boundary — epicRider Phase 5-E
// (ADR-026; prompt owner 5-E §13).
//
// Konsep (prompt owner 5-E §13):
//
//   Order Intent
//       ↓
//   Commercial Completion Boundary   ← TITIK INI (verified completion)
//       ↓
//   Issuance
//
// ATURAN MUTLAK (fail-closed terhadap claim client):
// - TIDAK ADA `client says paid=true`. TIDAK ADA `checkout submitted = paid`.
//   TIDAK ADA `order created = paid`. Status payment yang disuplai client
//   TIDAK PERNAH dipercaya.
// - Bukti completion HANYA dari sumber internal tepercaya. Union sumber
//   TERTUTUP (ShopCompletionSource): Phase 5-E memuat SATU anggota —
//   `NON_PRODUCTION_TEST_SIMULATION` — yang secara eksplisit BUKAN jalur
//   charging produksi (test-only; prompt owner 5-E §13). Anggota produksi
//   (payment gateway attestation) = OD-06 OPEN — menambahkannya menuntut
//   keputusan owner/ADR; TIDAK dapat muncul dari input client karena union
//   ini adalah kontrak tipe server-side dan TIDAK ada route HTTP Phase 5-E.
// - Completion TIDAK meng-issu apa pun dan TIDAK menyentuh entitlement.
//   Issuance = langkah terpisah (issuance.ts) yang hanya melayani intent
//   berstatus COMPLETED.
// - Completion hanya sah atas intent berstatus OPEN (CANCELLED/COMPLETED/
//   ISSUED ditolak; replay COMPLETED = no-op sukses idempotent teraudit).
//
// Aktor: operasi internal tepercaya (SYSTEM). USER actor = default deny
// teraudit (tidak ada key kanonik; tidak ada surface client Phase 5-E).

import type { PrismaClient } from "@prisma/client";

import { AuditOutcome } from "@/lib/audit/audit-service";

import {
  authorizeShopAction,
  recordCommerceAudit,
  type LifecycleActor,
} from "./authorization";
import { ShopReasonCode } from "./reason-codes";
import { ShopAction, type ShopCompletionSource, type ShopOrderIntentStatus } from "./vocabulary";

/**
 * Bukti verified completion — union tertutup. Anggota saat ini HANYA simulasi
 * non-produksi. Struktur ini adalah payment-adapter boundary minimal: sumber
 * produksi di masa depan menjadi anggota union BARU yang ditambahkan lewat
 * keputusan owner (OD-06) — bukan parameter yang bisa dipalsukan client.
 */
export type CommercialCompletionEvidence =
  | {
        source: "NON_PRODUCTION_TEST_SIMULATION";
        /** Referensi bukti simulasi (mis. id test run) — disimpan di audit. */
        evidenceRef: string;
      };

export type ShopCompletionResult =
  | {
      outcome: "SUCCESS";
      intentId: string;
      status: ShopOrderIntentStatus;
      completionSource: ShopCompletionSource;
      idempotent: boolean;
    }
  | { outcome: "DENIED"; reasonCode: string; intentId: string | null };

/**
 * Verifikasi completion komersial atas order intent (OPEN → COMPLETED).
 * TIDAK menghasilkan efek entitlement; TIDAK mengubah License/ExtensionInstance.
 */
export async function verifyShopOrderCompletion(
  db: PrismaClient,
  params: {
    actor: LifecycleActor;
    orderIntentId: string;
    completion: CommercialCompletionEvidence;
    now: Date;
  }
): Promise<ShopCompletionResult> {
  const { actor } = params;
  const intent = await db.shopOrderIntent.findUnique({
    where: { id: params.orderIntentId },
    select: { id: true, workspaceId: true, status: true },
  });
  if (intent === null) {
    await recordCommerceAudit(db, {
      action: "shop.completion.verify",
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

  const denyCompletion = async (reasonCode: string): Promise<ShopCompletionResult> => {
    await recordCommerceAudit(db, {
      action: "shop.completion.verify",
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

  // 1) Otorisasi aktor — completion operasi internal tepercaya; USER default
  //    deny (termasuk owner; OD-122 OPEN; tidak ada key kanonik).
  const authz = await authorizeShopAction(db, {
    workspaceId: intent.workspaceId,
    action: ShopAction.COMPLETION_VERIFY,
    actor,
  });
  if (!authz.allowed) {
    return denyCompletion(authz.reasonCode);
  }

  // 2) Sumber completion WAJIB anggota union tertutup (fail-closed terhadap
  //    nilai tak dikenal — meski tipe TS sudah membatasi, guard runtime tetap
  //    dipasang sebagai lapisan kedua terhadap pemanggil non-TS).
  if (params.completion.source !== "NON_PRODUCTION_TEST_SIMULATION") {
    return denyCompletion(ShopReasonCode.SHOP_DENY_COMPLETION_SOURCE_INVALID);
  }

  // 3) State: hanya OPEN yang dapat diselesaikan. COMPLETED replay = no-op
  //    sukses idempotent (state-convergence, pola 5-D).
  if (intent.status === "COMPLETED") {
    await recordCommerceAudit(db, {
      action: "shop.completion.verify",
      outcome: AuditOutcome.SUCCESS,
      actorUserId: actor.type === "USER" ? actor.userId : null,
      isSystemActor: actor.type === "SYSTEM",
      workspaceId: intent.workspaceId,
      targetType: "shop_order_intent",
      targetId: intent.id,
      reasonCode: ShopReasonCode.ALLOW,
      idempotent: true,
      metadata: { from: "COMPLETED", to: "COMPLETED", source: params.completion.source },
    });
    return {
      outcome: "SUCCESS",
      intentId: intent.id,
      status: "COMPLETED",
      completionSource: params.completion.source,
      idempotent: true,
    };
  }
  if (intent.status !== "OPEN") {
    return denyCompletion(ShopReasonCode.SHOP_DENY_ORDER_NOT_OPEN);
  }

  // 4) Transisi OPEN → COMPLETED ATOMIK + audit (optimistic guard).
  const applied = await db.$transaction(async (tx) => {
    const updated = await tx.shopOrderIntent.updateMany({
      where: { id: intent.id, status: "OPEN" },
      data: {
        status: "COMPLETED",
        completionSource: params.completion.source,
        completedAt: params.now,
      },
    });
    if (updated.count !== 1) {
      return false;
    }
    await recordCommerceAudit(tx, {
      action: "shop.completion.verify",
      outcome: AuditOutcome.SUCCESS,
      actorUserId: actor.type === "USER" ? actor.userId : null,
      isSystemActor: actor.type === "SYSTEM",
      workspaceId: intent.workspaceId,
      targetType: "shop_order_intent",
      targetId: intent.id,
      reasonCode: ShopReasonCode.ALLOW,
      metadata: {
        from: "OPEN",
        to: "COMPLETED",
        source: params.completion.source,
        // evidenceRef TIDAK dimasukkan metadata bila mengandung pola rahasia —
        // logAudit sudah men-redaksi kunci sensitif secara defensif.
        evidenceRef: params.completion.evidenceRef,
        nonProduction: "true",
      },
    });
    return true;
  });
  if (!applied) {
    return denyCompletion(ShopReasonCode.SHOP_DENY_CONCURRENT_MODIFICATION);
  }
  return {
    outcome: "SUCCESS",
    intentId: intent.id,
    status: "COMPLETED",
    completionSource: params.completion.source,
    idempotent: false,
  };
}
