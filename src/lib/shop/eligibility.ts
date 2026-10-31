// Eligibility boundary License & Extension Shop — epicRider Phase 5-E
// (ADR-026; prompt owner 5-E §11).
//
// Server-side, deny-by-default, tanpa trust pada claim client: seluruh fakta
// diselesaikan dari DB (sumber tepercaya) oleh resolver; evaluator MURNI dan
// DETERMINISTIK (pola 5-C). Setiap denial diaudit oleh pemanggil (lapisan
// service order-intent/issuance).
//
// Klasifikasi yang DUKUNG governance (bukan aturan baru yang dikarang):
// - FIRST_LICENSE: workspace tanpa baris lisensi apa pun — pembelian lisensi
//   pertama HARUS dilayani surface ini (ADR-018 §1/§4; LICENSE_MATRIX §4).
//   CATATAN F-05 (ambiguitas semantik — MENUNGGU RATIFIKASI OWNER, bukan
//   keputusan implementasi): implementasi menghitung SEMUA baris lisensi
//   historis (licenseRowCount === 0 → FIRST_LICENSE); wording ADR-018
//   "without LIVE license" dapat pula dibaca sebagai menghitung hanya lisensi
//   berstatus LIVE. Kedua pembacaan menghasilkan klasifikasi berbeda untuk
//   workspace yang hanya memegang lisensi non-LIVE (EXPIRED/DOWNGRADED/dll).
//   Semantik final = keputusan bisnis owner (pola OD-108/OD-122; ADR-026
//   PROPOSED) — TIDAK diputuskan di sini; historis-row-count dipertahankan
//   apa adanya sebagai klasifikasi data (bukan kebijakan).
// - RENEWAL: workspace telah memegang lisensi (rows > 0) — shop melayani
//   "alur renewal yang disepakati" (LICENSE_MATRIX §4); aturan/durasi final
//   renewal = OD-108 OPEN. Issuance foundation hanya mencatat intent dan
//   membuat baris PURCHASED — TIDAK mengaktifkan apa pun.
// - EXTENSION_PURCHASE: extension bersifat ADDITIVE di atas tier (ADR-014;
//   MC §2). Satu-satunya aturan eligibility yang menetap repository saat ini:
//   slot (workspace, type) TIDAK boleh sudah diisi instance LIVE (invariant
//   satu-LIVE 5-D — ditolak lebih awal agar tidak bergantung pada P2002).
//   Parameter availability lain (precondition tier per extension) = OD-06
//   sub-scope (ADR-014 Consequences) — TIDAK dikarang di sini.
//
// TIDAK ada di modul ini: harga/currency (OD-06), durasi/window (OD-108),
// kuota seat (OD-05), pengecekan membership/role aktor (itu rantai
// otorisasi — authorization.ts), UI.

import type { PrismaClient } from "@prisma/client";

import { EXTENSION_LIVE_STATUSES } from "@/lib/licensing/extension-lifecycle";
import { EXTENSION_TYPE_CODES } from "@/lib/licensing/vocabulary";

import {
  ShopReasonCode,
  ShopEligibilityKind,
} from "./reason-codes";
import { isShopProductStatus } from "./vocabulary";

/** Fakta produk shop yang diselesaikan resolver dari DB (tanpa keputusan). */
export interface ShopProductFacts {
  id: string;
  code: string;
  kind: string;
  status: string;
  /** Resolved bila kind=LICENSE — null selain itu. */
  tier: { id: string; code: string; isActive: boolean } | null;
  /** Resolved bila kind=EXTENSION — null selain itu. */
  definition: {
    id: string;
    code: string;
    status: string;
    isActive: boolean;
    typeCode: string | null;
  } | null;
}

/** Fakta eligibility lengkap (produk + workspace) — tanpa keputusan. */
export interface ShopEligibilityFacts {
  workspaceId: string | null;
  workspaceExists: boolean;
  /** Jumlah SEMUA baris lisensi workspace (histori termasuk). */
  licenseRowCount: number;
  /**
   * Untuk produk EXTENSION: jumlah instance LIVE milik workspace pada type
   * definisi target (LIVE = EXTENSION_LIVE_STATUSES 5-D). 0 untuk produk
   * LICENSE (tidak relevan).
   */
  liveInstanceOfTypeCount: number;
  product: ShopProductFacts | null;
}

/** Keputusan eligibility — eksplisit, deterministic, dapat diaudit. */
export interface ShopEligibilityDecision {
  eligible: boolean;
  kind: ShopEligibilityKind | null;
  reasonCode: string;
}

function denied(
  reasonCode: string,
  facts: ShopEligibilityFacts
): ShopEligibilityDecision {
  return { eligible: false, kind: null, reasonCode };
}

/**
 * Evaluasi eligibility MURNI — DENY-BY-DEFAULT; setiap cabang yang tidak
 * berakhir eligible adalah denial dengan reason code eksplisit.
 *
 * Urutan evaluasi (short-circuit):
 *   1. konteks workspace
 *   2. produk ada
 *   3. struktur produk (kind ↔ target konsisten)
 *   4. produk berstatus ACTIVE
 *   5. target ter-resolve & tersedia (tier aktif / definisi aktif+CATALOG)
 *   6. aturan per-kind (extension: slot LIVE; license: klasifikasi)
 */
export function evaluateShopEligibility(
  facts: ShopEligibilityFacts
): ShopEligibilityDecision {
  // 1) Konteks workspace (prasyarat tenant; issuance target selalu workspace —
  //    ENTITLEMENT_MODEL §8).
  if (!facts.workspaceId || facts.workspaceId.length === 0 || !facts.workspaceExists) {
    return denied(ShopReasonCode.SHOP_DENY_WORKSPACE_INVALID, facts);
  }

  // 2) Produk ada pada surface shop.
  if (facts.product === null) {
    return denied(ShopReasonCode.SHOP_DENY_PRODUCT_NOT_FOUND, facts);
  }
  const product = facts.product;

  // 3) Struktur produk — kind ↔ target wajib konsisten (fail-closed terhadap
  //    data rusak; CHECK DB lapisan kedua).
  if (product.kind === "LICENSE") {
    if (product.tier === null || product.definition !== null) {
      return denied(ShopReasonCode.SHOP_DENY_INVALID_PRODUCT, facts);
    }
  } else if (product.kind === "EXTENSION") {
    if (product.definition === null || product.tier !== null) {
      return denied(ShopReasonCode.SHOP_DENY_INVALID_PRODUCT, facts);
    }
  } else {
    // Kind di luar closed set — drift data; tidak pernah dilayani.
    return denied(ShopReasonCode.SHOP_DENY_INVALID_PRODUCT, facts);
  }

  // 4) Produk harus ACTIVE (INACTIVE belum ditawarkan; WITHDRAWN ditarik).
  if (!isShopProductStatus(product.status) || product.status !== "ACTIVE") {
    return denied(ShopReasonCode.SHOP_DENY_PRODUCT_NOT_ACTIVE, facts);
  }

  // 5) Target ter-resolve dan tersedia.
  if (product.kind === "LICENSE" && product.tier !== null) {
    if (!product.tier.isActive) {
      return denied(ShopReasonCode.SHOP_DENY_TIER_INACTIVE, facts);
    }
  }
  if (product.kind === "EXTENSION" && product.definition !== null) {
    const definition = product.definition;
    if (definition.typeCode === null) {
      return denied(ShopReasonCode.SHOP_DENY_DEFINITION_NOT_RESOLVED, facts);
    }
    if (!(EXTENSION_TYPE_CODES as readonly string[]).includes(definition.typeCode)) {
      // Type di luar closed list owner (MC §2/§3) — drift; fail-closed.
      return denied(ShopReasonCode.SHOP_DENY_INVALID_EXTENSION_TYPE, facts);
    }
    if (!definition.isActive || definition.status !== "CATALOG") {
      return denied(ShopReasonCode.SHOP_DENY_DEFINITION_NOT_AVAILABLE, facts);
    }
    // 6a) Extension: slot (workspace, type) belum boleh diisi instance LIVE.
    if (facts.liveInstanceOfTypeCount > 0) {
      return denied(ShopReasonCode.SHOP_DENY_LIVE_INSTANCE_EXISTS, facts);
    }
  }

  // 6b) License: klasifikasi FIRST_LICENSE vs RENEWAL — keduanya ELIGIBLE
  //     (shop wajib melayani keduanya; ADR-018). Klasifikasi = data, bukan
  //     keputusan komersial; durasi/aturan renewal = OD-108 OPEN. Semantik
  //     persis FIRST_LICENSE (historis-row-count vs "without LIVE license")
  //     menunggu ratifikasi owner — lihat catatan F-05 di header modul.
  if (product.kind === "LICENSE") {
    const kind =
      facts.licenseRowCount === 0 ? ShopEligibilityKind.FIRST_LICENSE : ShopEligibilityKind.RENEWAL;
    return { eligible: true, kind, reasonCode: ShopReasonCode.ALLOW };
  }
  return {
    eligible: true,
    kind: ShopEligibilityKind.EXTENSION_PURCHASE,
    reasonCode: ShopReasonCode.ALLOW,
  };
}

/**
 * Resolver fakta eligibility dari DB untuk satu produk pada satu workspace —
 * pola 5-C (resolver I/O + evaluator murni). TIDAK mengambil keputusan
 * otorisasi aktor (itu lapisan authorization).
 */
export async function resolveShopProductEligibility(
  db: PrismaClient,
  params: { workspaceId: string; productId: string }
): Promise<ShopEligibilityDecision> {
  const [workspace, product] = await Promise.all([
    db.workspace.findUnique({ where: { id: params.workspaceId }, select: { id: true } }),
    db.shopProduct.findUnique({
      where: { id: params.productId },
      include: {
        tier: { select: { id: true, code: true, isActive: true } },
        definition: {
          select: {
            id: true,
            code: true,
            status: true,
            isActive: true,
            typeId: true,
            type: { select: { code: true } },
          },
        },
      },
    }),
  ]);

  let liveInstanceOfTypeCount = 0;
  const definitionRow = product?.definition ?? null;
  if (product !== null && product.kind === "EXTENSION" && definitionRow !== null) {
    liveInstanceOfTypeCount = await db.extensionInstance.count({
      where: {
        workspaceId: params.workspaceId,
        typeId: definitionRow.typeId,
        status: { in: [...EXTENSION_LIVE_STATUSES] },
      },
    });
  }

  const licenseRowCount =
    workspace === null ? 0 : await db.license.count({ where: { workspaceId: params.workspaceId } });

  return evaluateShopEligibility({
    workspaceId: params.workspaceId,
    workspaceExists: workspace !== null,
    licenseRowCount,
    liveInstanceOfTypeCount,
    product:
      product === null
        ? null
        : {
            id: product.id,
            code: product.code,
            kind: product.kind,
            status: product.status,
            tier: product.tier
              ? { id: product.tier.id, code: product.tier.code, isActive: product.tier.isActive }
              : null,
            definition: definitionRow
              ? {
                  id: definitionRow.id,
                  code: definitionRow.code,
                  status: definitionRow.status,
                  isActive: definitionRow.isActive,
                  typeCode: definitionRow.type?.code ?? null,
                }
              : null,
          },
  });
}
