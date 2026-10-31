// Reason code domain commerce License & Extension Shop — epicRider Phase 5-E
// (ADR-026).
//
// Kode BARU milik domain shop — TIDAK mengubah vocabulary kanonik
// AUTHORIZATION_MODEL §3 maupun reason code Phase 4/5-B/5-C/5-D (pola
// LicenseLifecycleReasonCode 5-D). Denial = first-class dan teraudit
// (kategori COMMERCE; REQ-010/REQ-024 pattern).
//
// Kode otorisasi generik (DENY_NO_SESSION/DENY_PERMISSION_MISSING/dll.)
// tetap berasal dari `@/lib/authz/reason-codes` — TIDAK diduplikasi.

export const ShopReasonCode = {
  /** Keputusan otorisasi/policy mengizinkan (mirror ReasonCode.ALLOW). */
  ALLOW: "ALLOW",

  // --- konteks workspace/aktor (pola rantai Phase 4; dipakai-ulang) ---
  // Rantai sesi→tenant→membership dan DENY_PERMISSION_MISSING TIDAK
  // dideklarasikan ulang di sini — dipakai langsung dari vocabulary kanonik.

  // --- katalog produk (§10 catalog foundation) ---
  /** Produk tidak ditemukan pada surface License & Extension Shop. */
  SHOP_DENY_PRODUCT_NOT_FOUND: "SHOP_DENY_PRODUCT_NOT_FOUND",
  /** Struktur produk invalid: kind↔target tidak konsisten (fail-closed). */
  SHOP_DENY_INVALID_PRODUCT: "SHOP_DENY_INVALID_PRODUCT",
  /** Produk tidak berstatus ACTIVE (INACTIVE/WITHDRAWN) — tidak dapat dibeli. */
  SHOP_DENY_PRODUCT_NOT_ACTIVE: "SHOP_DENY_PRODUCT_NOT_ACTIVE",
  /** Target LicenseTier produk lisensi hilang/tidak resolve (drift). */
  SHOP_DENY_TIER_NOT_RESOLVED: "SHOP_DENY_TIER_NOT_RESOLVED",
  /** Target tier dinonaktifkan owner — lisensi tidak dapat dijual saat ini. */
  SHOP_DENY_TIER_INACTIVE: "SHOP_DENY_TIER_INACTIVE",
  /** Target ExtensionDefinition hilang/tidak resolve (drift). */
  SHOP_DENY_DEFINITION_NOT_RESOLVED: "SHOP_DENY_DEFINITION_NOT_RESOLVED",
  /** Definisi extension tidak aktif / status bukan CATALOG (DMC §3.6). */
  SHOP_DENY_DEFINITION_NOT_AVAILABLE: "SHOP_DENY_DEFINITION_NOT_AVAILABLE",
  /** Type code definisi di luar closed list owner (MC §2/§3) — drift. */
  SHOP_DENY_INVALID_EXTENSION_TYPE: "SHOP_DENY_INVALID_EXTENSION_TYPE",

  // --- eligibility (§11) ---
  /** Konteks workspace tidak valid/tidak ditemukan. */
  SHOP_DENY_WORKSPACE_INVALID: "SHOP_DENY_WORKSPACE_INVALID",
  /** Sudah ada instance LIVE untuk (workspace, type) — slot extension terisi. */
  SHOP_DENY_LIVE_INSTANCE_EXISTS: "SHOP_DENY_LIVE_INSTANCE_EXISTS",
  /** Konten order invalid: tanpa line, quantity < 1, kind campur, dsb. */
  SHOP_DENY_INVALID_ORDER_CONTENT: "SHOP_DENY_INVALID_ORDER_CONTENT",

  // --- order intent (§12; state machine PROVISIONAL — OD-135 OPEN) ---
  /** Intent tidak ditemukan / bukan milik konteks. */
  SHOP_DENY_ORDER_INTENT_NOT_FOUND: "SHOP_DENY_ORDER_INTENT_NOT_FOUND",
  /** Replay dengan idempotencyKey sama tetapi konten berbeda — konflik eksplisit. */
  SHOP_DENY_IDEMPOTENCY_CONFLICT: "SHOP_DENY_IDEMPOTENCY_CONFLICT",
  /** Transisi status intent tidak sah (mis. CANCELLED → COMPLETED). */
  SHOP_DENY_ORDER_INVALID_TRANSITION: "SHOP_DENY_ORDER_INVALID_TRANSITION",
  /** Konkuren: state intent berubah sejak dibaca (optimistic guard). */
  SHOP_DENY_CONCURRENT_MODIFICATION: "SHOP_DENY_CONCURRENT_MODIFICATION",

  // --- verified completion (§13) ---
  /** Bukti completion tidak dikenal / bukan sumber internal tepercaya. */
  SHOP_DENY_COMPLETION_SOURCE_INVALID: "SHOP_DENY_COMPLETION_SOURCE_INVALID",
  /** Completion hanya sah atas intent berstatus OPEN. */
  SHOP_DENY_ORDER_NOT_OPEN: "SHOP_DENY_ORDER_NOT_OPEN",

  // --- issuance (§14) ---
  /** Issuance hanya sah atas intent berstatus COMPLETED. */
  SHOP_DENY_ORDER_NOT_COMPLETED: "SHOP_DENY_ORDER_NOT_COMPLETED",
  /** Cancellation adalah terminal — issuance tidak pernah dilayani. */
  SHOP_DENY_ORDER_CANCELLED: "SHOP_DENY_ORDER_CANCELLED",
  /** State intent ISSUED tetapi target issuance hilang/tidak cocok (invariant). */
  SHOP_DENY_ISSUED_STATE_UNEVALUABLE: "SHOP_DENY_ISSUED_STATE_UNEVALUABLE",
  /** Denormalisasi definition.typeId hilang — invariant 5-D dilanggar. */
  SHOP_DENY_UNEVALUABLE_INSTANCE: "SHOP_DENY_UNEVALUABLE_INSTANCE",
  /** Issuance lisensi wajib tepat satu line quantity 1 (struktur domain). */
  SHOP_DENY_LICENSE_ORDER_SHAPE: "SHOP_DENY_LICENSE_ORDER_SHAPE",
} as const;
export type ShopReasonCode = (typeof ShopReasonCode)[keyof typeof ShopReasonCode];

/** Kind eligibility yang disetujui evaluator (sumber: aturan repo, bukan OD). */
export const ShopEligibilityKind = {
  /** Workspace tanpa lisensi apa pun — pembelian lisensi pertama (ADR-018 §4). */
  FIRST_LICENSE: "FIRST_LICENSE",
  /** Workspace telah memegang lisensi — alur renewal (aturan final = OD-108). */
  RENEWAL: "RENEWAL",
  /** Pembelian extension atas workspace (additive di atas tier; ADR-014). */
  EXTENSION_PURCHASE: "EXTENSION_PURCHASE",
} as const;
export type ShopEligibilityKind =
  (typeof ShopEligibilityKind)[keyof typeof ShopEligibilityKind];
