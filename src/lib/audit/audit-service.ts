// Audit/security event service — epicRider Phase 4 (DMC §3.14; REQ-054, REQ-092).
//
// Semua event autentikasi, sesi, workspace, membership, undangan, keputusan
// otorisasi yang sensitif, dan aktivitas anti-abuse WAJIB tercatat. Denial
// adalah event first-class (REQ-010/REQ-024 pattern).
//
// KEAMANAN PAYLOAD (REQ-054; gated prompt §5.5/§7.6): token, OTP, password,
// cookie, session identifier, dan secret TIDAK BOLEH masuk audit. Layanan ini
// menolak (drop + rename) kunci metadata yang mencurigakan secara defensif.

import type { PrismaClient, Prisma } from "@prisma/client";

/** Kategori audit (DMC §3.14 — subset Phase 4). */
export const AuditCategory = {
  AUTH: "AUTH",
  SESSION: "SESSION",
  WORKSPACE: "WORKSPACE",
  MEMBERSHIP: "MEMBERSHIP",
  INVITATION: "INVITATION",
  AUTHZ: "AUTHZ",
  ABUSE: "ABUSE",
  /** Phase 5-C: keputusan entitlement (denial = first-class; ENTITLEMENT_MODEL §10). */
  LICENSE: "LICENSE",
} as const;
export type AuditCategory = (typeof AuditCategory)[keyof typeof AuditCategory];

export const AuditOutcome = {
  SUCCESS: "SUCCESS",
  DENIED: "DENIED",
  FAILURE: "FAILURE",
} as const;
export type AuditOutcome = (typeof AuditOutcome)[keyof typeof AuditOutcome];

export interface AuditEventInput {
  category: AuditCategory;
  action: string; // mis. "auth.login.success" | "authz.denied" | "membership.removed"
  outcome: AuditOutcome;
  actorUserId?: string | null;
  tenantWorkspaceId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  reasonCode?: string | null;
  metadata?: Record<string, unknown> | null;
  userAgent?: string | null;
}

/** Kunci metadata yang dilarang keras (nilai rahasia/sensitif). */
const FORBIDDEN_METADATA_KEYS =
  /(token|otp|code|password|secret|cookie|authorization|session|credential|apikey|api_key)/i;

function sanitizeMetadata(
  metadata: Record<string, unknown> | null | undefined
): string | null {
  if (!metadata) return null;
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (FORBIDDEN_METADATA_KEYS.test(key)) {
      // Jangan pernah menulis nilai kunci sensitif — ganti penanda redaksi.
      safe[key] = "[REDACTED]";
      continue;
    }
    // Hanya izinkan tipe primitif yang aman di-JSON-kan (tanpa objek bersarang).
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      safe[key] = value;
    } else {
      safe[key] = "[OMITTED]";
    }
  }
  return JSON.stringify(safe);
}

/**
 * Menulis satu audit event. TIDAK melempar error ke pemanggil ketika gagal
 * menulis (audit tidak boleh mengganggu jalur utama), tapi kesalahan tetap
 * dicatat di log server dengan pesan tanpa data sensitif.
 */
export async function logAudit(
  db: PrismaClient | Prisma.TransactionClient,
  event: AuditEventInput
): Promise<void> {
  try {
    await db.auditEvent.create({
      data: {
        category: event.category,
        action: event.action,
        outcome: event.outcome,
        actorUserId: event.actorUserId ?? null,
        tenantWorkspaceId: event.tenantWorkspaceId ?? null,
        targetType: event.targetType ?? null,
        targetId: event.targetId ?? null,
        reasonCode: event.reasonCode ?? null,
        metadataJson: sanitizeMetadata(event.metadata),
        userAgent: event.userAgent ? event.userAgent.slice(0, 160) : null,
      },
    });
  } catch (error) {
    // Audit write failure tidak boleh meruntuhkan request; catat tanpa isi event
    // yang berpotensi sensitif.
    console.error(
      `[audit] gagal menulis audit event action=${event.action} category=${event.category}`,
      error instanceof Error ? error.message : "unknown error"
    );
  }
}
