// Vocabulary domain commerce "License & Extension Shop" — epicRider Phase 5-E
// (ADR-026).
//
// SURFACE ISOLATION (ADR-018; REQ-030; DMC §3.12/§3.12a/§4.6): entity family
// ini MILIK surface "License & Extension Shop" SAJA — terpisah struktur dari
// Public Store (Product/CatalogListing/StoreOrder — konseptual, TIDAK
// diimplementasi) dan Developer Equipment Store (EquipmentListing/… — Phase
// 11). Tidak ada tabel bersama, tidak ada cross-link antar surface; penamaan
// `Shop*` menandai kepemilikan surface secara eksplisit.
//
// Sumber kontrak (TIDAK ada nilai yang dikarang):
// - Surface & scope: ADR-018 (ACCEPTED owner 2026-10-28) — jalur publik
//   first-license/renewal/extension; ARCHITECTURE.md §7; LICENSE_MATRIX.md §4;
//   DMC §3.12a (dokumentasi entity family, direkonsiliasi Phase 5-E).
// - Order intent: prompt owner 5-E §12 — INTENT ≠ PAID ≠ COMPLETED PAYMENT ≠
//   ACTIVE ENTITLEMENT. State machine PROVISIONAL (OD-135 OPEN — final
//   invoice/order state machine = keputusan owner): OPEN → COMPLETED → ISSUED,
//   plus CANCELLED dari OPEN. TIDAK ada state payment/refund (OD-06/OD-135).
// - Verified completion: prompt owner 5-E §13 — bukti completion HANYA dari
//   sumber internal tepercaya; `client says paid` TIDAK PERNAH dipercaya.
//   Satu-satunya sumber di Phase 5-E = simulasi non-produksi (test-only),
//   secara eksplisit BUKAN jalur charging produksi. Sumber produksi
//   (payment gateway attestation) = OD-06 OPEN — TIDAK diimplementasi.
// - Issuance: prompt owner 5-E §14 — membuat License(status=PURCHASED) /
//   ExtensionInstance(status=PURCHASED) dengan sourceType/sourceRef + term
//   data yang DISUPLAI pemanggil. TIDAK ada transisi PURCHASED → ACTIVE dari
//   kode commerce (aktivasi = layanan lifecycle 5-D; OD-108: tanpa durasi
//   default, tanpa scheduler).
// - Entitlement boundary: Commerce → License/ExtensionInstance → lifecycle
//   5-D → engine 5-C. TIDAK ada EntitlementGrant (DMC §3.5 direkonsiliasi
//   Phase 5-E: conceptual/obsolete — BUKAN second source of truth).
// - Waktu: `now` selalu disuplai pemanggil/server; TIDAK ada perhitungan
//   durasi/window/grace (OD-108 OPEN).

/**
 * Surface code — penanda ownership domain (DMC §3.12a). Konstanta ini
 * mendokumentasikan bahwa seluruh entity family di modul `src/lib/shop/`
 * melayani SATU surface saja: License & Extension Shop.
 */
export const SHOP_SURFACE_CODE = "LICENSE_EXTENSION_SHOP" as const;

/** Jenis produk shop — closed set. Menentukan target issuance (ADR-018 §5). */
export const SHOP_PRODUCT_KINDS = ["LICENSE", "EXTENSION"] as const;
export type ShopProductKind = (typeof SHOP_PRODUCT_KINDS)[number];

/**
 * Status produk shop (DMC §3.12a — direkonsiliasi Phase 5-E):
 * - INACTIVE (default): belum ditawarkan — tidak dapat dibeli.
 * - ACTIVE: dapat dibeli (memenuhi catalog foundation §10).
 * - WITHDRAWN: ditarik dari katalog (terminal; histori order tetap hidup).
 * TIDAK ada harga/ketersediaan komersial (OD-06 OPEN).
 */
export const SHOP_PRODUCT_STATUSES = ["ACTIVE", "INACTIVE", "WITHDRAWN"] as const;
export type ShopProductStatus = (typeof SHOP_PRODUCT_STATUSES)[number];

/**
 * Status order intent — PROVISIONAL (OD-135 OPEN; final state machine =
 * keputusan owner). Makna yang diikat prompt owner 5-E §12:
 * - OPEN: intent tercatat; BUKAN paid; BUKAN completed payment.
 * - COMPLETED: verified commercial completion (boundary §13) — BUKAN
 *   entitlement aktif; bukti hanya dari sumber internal tepercaya.
 * - ISSUED: issuance selesai (License/ExtensionInstance PURCHASED dibuat) —
 *   BELUM ACTIVE; aktivasi = lifecycle 5-D.
 * - CANCELLED: dibatalkan dari OPEN (terminal).
 */
export const SHOP_ORDER_INTENT_STATUSES = ["OPEN", "COMPLETED", "ISSUED", "CANCELLED"] as const;
export type ShopOrderIntentStatus = (typeof SHOP_ORDER_INTENT_STATUSES)[number];

/**
 * Sumber verified commercial completion — closed set Phase 5-E. SATU-satunya
 * anggota adalah simulasi NON-PRODUKSI (test-only; prompt owner 5-E §13).
 * Sumber produksi (payment gateway) = OD-06 OPEN: menambah anggota di sini
 * menuntut ADR/keputusan owner — TIDAK dapat muncul lewat input client.
 */
export const SHOP_COMPLETION_SOURCES = ["NON_PRODUCTION_TEST_SIMULATION"] as const;
export type ShopCompletionSource = (typeof SHOP_COMPLETION_SOURCES)[number];

/**
 * Nilai `sourceType` yang ditulis ke License / ExtensionInstance saat
 * issuance dari shop (kontrak 5-B: kolom sourceType/sourceRef "diisi alur
 * 5-E" — ADR-025 §6). sourceRef = ShopOrderIntent.id.
 */
export const SHOP_ISSUANCE_SOURCE_TYPE = "SHOP_ORDER_INTENT" as const;

/** Aksi commerce yang diotorisasi (tabel eksplisit — authorization.ts). */
export const ShopAction = {
  ORDER_INTENT_CREATE: "ORDER_INTENT_CREATE",
  ORDER_INTENT_CANCEL: "ORDER_INTENT_CANCEL",
  COMPLETION_VERIFY: "COMPLETION_VERIFY",
  ISSUANCE: "ISSUANCE",
} as const;
export type ShopAction = (typeof ShopAction)[keyof typeof ShopAction];

export function isShopProductKind(value: string): value is ShopProductKind {
  return (SHOP_PRODUCT_KINDS as readonly string[]).includes(value);
}

export function isShopProductStatus(value: string): value is ShopProductStatus {
  return (SHOP_PRODUCT_STATUSES as readonly string[]).includes(value);
}

export function isShopOrderIntentStatus(value: string): value is ShopOrderIntentStatus {
  return (SHOP_ORDER_INTENT_STATUSES as readonly string[]).includes(value);
}
