// Otorisasi aksi commerce License & Extension Shop — epicRider Phase 5-E
// (ADR-026).
//
// ATURAN (prompt owner 5-E §15; remediasi PR #4 sebagai preseden wajib):
// - Server-side, deny-by-default, audited denial, tenant/workspace isolation.
// - Permission vocabulary HANYA dari governance tercatat. SATU-satunya key
//   kanonik yang terdokumentasi AUTHORIZATION_MODEL §4.12 untuk order/purchase
//   adalah `store.order.create` (REQ-098; OD-06; OD-135) — dipakai persis,
//   tanpa key baru yang dikarang. Key TIDAK diikat ke preset role Phase 4
//   (OD-122 OPEN): sampai owner meratifikasi katalog, seluruh USER = default
//   deny `DENY_PERMISSION_MISSING` — TERMASUK role `owner`. TIDAK ada owner
//   fallback / owner implicit allow / PROPOSED → ALLOW.
// - COMPLETION dan ISSUANCE TIDAK memiliki key kanonik pada model → permission
//   `null` → DEFAULT DENY untuk siapa pun selain aktor SYSTEM internal
//   tepercaya. Bukti completion tidak pernah dapat disuplai client (union
//   sumber tertutup — hanya simulasi non-produksi di Phase 5-E).
// - Aktor SYSTEM hanya dibentuk pemanggil internal tepercaya di server; TIDAK
//   ada route HTTP Phase 5-E sehingga tidak ada permukaan publik yang dapat
//   memilih actorType=SYSTEM (pola 5-D; ADR-025 §7).
//
// REUSE (tanpa duplikasi): rantai sesi→tenant→membership→permission
// DIEKSEKUSI oleh `authorizeLifecycleAction` dari `@/lib/licensing/
// lifecycle-shared` — implementasi remediasi PR #4 yang sama yang mengikat
// aksi lifecycle 5-D. Tidak ada framework otorisasi kedua.

import type { PrismaClient, Prisma } from "@prisma/client";

import { AuditCategory, AuditOutcome, logAudit } from "@/lib/audit/audit-service";
import type { Permission } from "@/lib/authz/permissions";
import {
  authorizeLifecycleAction,
  type LifecycleActionAuthorization,
  type LifecycleActor,
} from "@/lib/licensing/lifecycle-shared";

import type { ShopAction } from "./vocabulary";

export type { LifecycleActor } from "@/lib/licensing/lifecycle-shared";

/**
 * Tabel otorisasi aksi commerce — eksplisit IMPLEMENTED vs PROPOSED jujur
 * (pola LICENSE_ACTION_AUTHORIZATION 5-D).
 *
 * `permission: null` = model otorisasi belum mendefinisikan key kanonik untuk
 * aksi ini → seluruh USER actor DEFAULT DENY `DENY_PERMISSION_MISSING`
 * (ratifikasi katalog menunggu keputusan owner — OD-122 OPEN).
 */
export interface ShopActionAuthorization {
  permission: Permission | null;
  /**
   * Status ratifikasi owner atas katalog permission commerce — SELALU
   * "PROPOSED" (menunggu keputusan owner; OD-122 OPEN). BUKAN jalur
   * otorisasi: TIDAK pernah dibaca oleh fungsi otorisasi dan TIDAK PERNAH
   * menghasilkan ALLOW.
   */
  ownerRatificationStatus: "PROPOSED";
  /** Bukti sumber vocabulary (AUTHORIZATION_MODEL §4.12 atau absennya). */
  source: string;
}

export const SHOP_ACTION_AUTHORIZATION: Record<ShopAction, ShopActionAuthorization> = {
  // Key kanonik terdokumentasi AUTHORIZATION_MODEL §4.12 (REQ-098; OD-06; OD-135).
  ORDER_INTENT_CREATE: {
    permission: "store.order.create" as Permission,
    ownerRatificationStatus: "PROPOSED",
    source: "AUTHORIZATION_MODEL §4.12 store.order.create",
  },
  // Tidak ada key kanonik untuk cancellation pada model → default deny USER.
  ORDER_INTENT_CANCEL: {
    permission: null,
    ownerRatificationStatus: "PROPOSED",
    source: "no canonical key — AUTHORIZATION_MODEL §4.12",
  },
  // Verified completion = operasi internal tepercaya (bukti tidak pernah dari
  // client). Sumber produksi (payment gateway) = OD-06 OPEN.
  COMPLETION_VERIFY: {
    permission: null,
    ownerRatificationStatus: "PROPOSED",
    source: "no canonical key — internal trusted boundary only (OD-06 OPEN)",
  },
  // Issuance = operasi internal tepercaya (membuat License/ExtensionInstance
  // PURCHASED). Tidak ada key kanonik issuance pada model → default deny USER.
  ISSUANCE: {
    permission: null,
    ownerRatificationStatus: "PROPOSED",
    source: "no canonical key — internal trusted boundary only (ENTITLEMENT_MODEL §8)",
  },
};

export interface ShopAuthorizationDecision {
  allowed: boolean;
  reasonCode: string;
}

/**
 * Otorisasi satu aksi commerce untuk aktor tertentu pada workspace target.
 * Delegasi penuh ke rantai remediasi PR #4 (`authorizeLifecycleAction`):
 * SYSTEM → allow (internal trusted); USER → rantai sesi→tenant→membership→
 * permission eksplisit; tanpa key kanonik → DENY_PERMISSION_MISSING untuk
 * siapa pun termasuk role `owner`.
 */
export async function authorizeShopAction(
  db: PrismaClient,
  params: {
    workspaceId: string;
    action: ShopAction;
    actor: LifecycleActor;
  }
): Promise<ShopAuthorizationDecision> {
  const authz = await authorizeLifecycleAction(db, {
    workspaceId: params.workspaceId,
    action: params.action,
    authorization: SHOP_ACTION_AUTHORIZATION[params.action],
    actor: params.actor,
  });
  return { allowed: authz.allowed, reasonCode: authz.reasonCode };
}

export interface CommerceAuditInput {
  action: string;
  outcome: AuditOutcome;
  actorUserId: string | null;
  isSystemActor: boolean;
  workspaceId: string | null;
  targetType: string | null;
  targetId: string | null;
  reasonCode: string | null;
  idempotent?: boolean;
  metadata?: Record<string, unknown>;
}

/** Tulis audit commerce (kategori COMMERCE; denial = first-class). */
export async function recordCommerceAudit(
  db: PrismaClient | Prisma.TransactionClient,
  input: CommerceAuditInput
): Promise<void> {
  await logAudit(db, {
    category: AuditCategory.COMMERCE,
    action: input.action,
    outcome: input.outcome,
    actorUserId: input.actorUserId,
    tenantWorkspaceId: input.workspaceId,
    targetType: input.targetType,
    targetId: input.targetId,
    reasonCode: input.reasonCode,
    metadata: {
      surface: "LICENSE_EXTENSION_SHOP",
      actorType: input.isSystemActor ? "SYSTEM" : "USER",
      idempotent: input.idempotent === true ? "true" : null,
      ...(input.metadata ?? {}),
    },
  });
}
