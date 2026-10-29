// Session service — epicRider Phase 4 (REQ-048).
//
// Daftar sesi/device aktif milik user + revoke per-device/semua. Revoke
// men-set revokedAt → adapter menolak pada request berikutnya (guard membaca
// DB langsung) — "revoke mengakhiri akses pada request berikutnya".

import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { securityConfig } from "@/lib/config/security-config";
import { logAudit, AuditCategory, AuditOutcome } from "@/lib/audit/audit-service";
import { describeUserAgent } from "./user-agent";

export interface SessionInfo {
  id: string;
  deviceLabel: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date;
  isCurrent: boolean;
}

/** Sesi aktif (tidak revoked, belum kedaluwarsa) milik user. */
export async function listActiveSessions(
  db: PrismaClient,
  userId: string,
  currentSessionToken: string | null
): Promise<SessionInfo[]> {
  const sessions = await db.session.findMany({
    where: { userId, revokedAt: null, expires: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  return sessions.map((s) => ({
    id: s.id,
    deviceLabel: s.deviceLabel,
    createdAt: s.createdAt,
    lastUsedAt: s.lastUsedAt,
    expiresAt: s.expires,
    isCurrent: s.sessionToken === currentSessionToken,
  }));
}

/** Revoke SATU sesi milik user (object-level: sesi orang lain → tidak ditemukan). */
export async function revokeSession(
  db: PrismaClient,
  userId: string,
  sessionId: string
): Promise<boolean> {
  const session = await db.session.findFirst({
    where: { id: sessionId, userId, revokedAt: null },
  });
  if (!session) return false;
  await db.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });
  await logAudit(db, {
    category: AuditCategory.SESSION,
    action: "session.revoked.one",
    outcome: AuditOutcome.SUCCESS,
    actorUserId: userId,
    targetType: "Session",
    targetId: session.id,
  });
  return true;
}

/** Revoke SEMUA sesi user. */
export async function revokeAllSessions(
  db: PrismaClient,
  userId: string
): Promise<number> {
  const result = await db.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await logAudit(db, {
    category: AuditCategory.SESSION,
    action: "session.revoked.all",
    outcome: AuditOutcome.SUCCESS,
    actorUserId: userId,
    metadata: { count: result.count },
  });
  return result.count;
}

/**
 * Menerbitkan sesi baru untuk user (token acak 32-byte). Dipakai jalur
 * WhatsApp login setelah OTP terverifikasi — integration point provider
 * (OD-03): route handler bertugas men-set cookie sesi saat kanal nyata aktif.
 * Dipakai test untuk membuktikan rantai domain penuh.
 */
export async function issueSession(
  db: PrismaClient,
  params: { userId: string; userAgent?: string | null }
): Promise<{ sessionToken: string; expires: Date }> {
  const sessionToken = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + securityConfig.session.maxAgeSeconds * 1000);
  await db.session.create({
    data: {
      sessionToken,
      userId: params.userId,
      expires,
      userAgent: params.userAgent?.slice(0, 160) ?? null,
      deviceLabel: params.userAgent ? describeUserAgent(params.userAgent) : null,
    },
  });
  await logAudit(db, {
    category: AuditCategory.SESSION,
    action: "session.issued",
    outcome: AuditOutcome.SUCCESS,
    actorUserId: params.userId,
  });
  return { sessionToken, expires };
}
