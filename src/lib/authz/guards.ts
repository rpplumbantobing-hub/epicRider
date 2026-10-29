// Guards otorisasi server-side — epicRider Phase 4 (ADR-010; REQ-023/024/026).
//
// Semua route handler / server component sensitif WAJIB melewati guard ini.
// Guard menyelesaikan FAKTA dari penyimpanan tepercaya (DB), mengevaluasi via
// policy layer murni, mengaudit denial sebagai event first-class, lalu
// melempar ApiError dengan reason code.
//
// Mapping HTTP (API_ARCHITECTURE §5.3):
// - Tanpa sesi valid            → 401 (DENY_NO_SESSION).
// - Non-member atas resource workspace → 404 (enumeration resistance, TC-24;
//   keberadaan workspace sensitif) — TIDAK 403, agar tidak membocorkan
//   keberadaan tenant.
// - Member tanpa permission     → 403 + reason code (klien render denied state
//   yang jujur — REQ-034).

import type { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sessionCookieName } from "@/lib/auth/session-cookie";
import { evaluatePolicy, type SessionValidity } from "./policy";
import { ReasonCode, MembershipStatus } from "./reason-codes";
import { Permission } from "./permissions";
import { ApiError } from "@/lib/api/problems";
import { logAudit, AuditCategory, AuditOutcome } from "@/lib/audit/audit-service";
import { ROLE_PRESETS, type RoleKey } from "./roles";

export interface AuthContext {
  userId: string;
  sessionId: string;
  sessionToken: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  userAgent: string | null;
}

/** Menyelesaikan konteks sesi dari cookie → DB (valid, tidak revoked/expired). */
export async function getAuthContext(
  prisma: PrismaClient = db
): Promise<AuthContext | null> {
  const store = await cookies();
  const token = store.get(sessionCookieName())?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.revokedAt !== null) return null;
  if (session.expires.getTime() <= Date.now()) return null;
  if (session.user.status !== "ACTIVE") return null;

  return {
    userId: session.userId,
    sessionId: session.id,
    sessionToken: session.sessionToken,
    userAgent: session.userAgent,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
  };
}

/**
 * Guard sesi: tanpa sesi valid → 401. (Sesi revoked/expired dibaca dari DB —
 * perbedaan alasan dicatat di audit; respons HTTP = 401 DENY_NO_SESSION agar
 * tidak membocorkan informasi ke klien tak terautentikasi.)
 */
export async function requireSession(prisma: PrismaClient = db): Promise<AuthContext> {
  const store = await cookies();
  const token = store.get(sessionCookieName())?.value;

  if (token) {
    const session = await prisma.session.findUnique({ where: { sessionToken: token } });
    if (session && session.revokedAt === null && session.expires.getTime() > Date.now()) {
      return (await getAuthContext(prisma))!;
    }
    if (session) {
      const reason =
        session.revokedAt !== null ? ReasonCode.DENY_SESSION_REVOKED : ReasonCode.DENY_SESSION_EXPIRED;
      await logAudit(prisma, {
        category: AuditCategory.AUTHZ,
        action: "authz.denied.session",
        outcome: AuditOutcome.DENIED,
        reasonCode: reason,
        actorUserId: session.userId,
      });
    }
  }
  throw new ApiError(401, ReasonCode.DENY_NO_SESSION, "Diperlukan sesi yang valid");
}

export interface WorkspaceAccess {
  auth: AuthContext;
  workspaceId: string;
  membershipId: string;
  roleKeys: string[];
}

/**
 * Guard akses workspace: menyelesaikan membership aktor di workspace path
 * (fakta dari DB — TIDAK dari input client), mengevaluasi policy, mengaudit
 * denial, dan mengembalikan konteks akses.
 */
export async function requireWorkspacePermission(
  params: { workspaceId: string; permission: Permission; instance?: string },
  prisma: PrismaClient = db
): Promise<WorkspaceAccess> {
  const auth = await requireSession(prisma);

  const membership = await prisma.membership.findFirst({
    where: {
      workspaceId: params.workspaceId,
      userId: auth.userId,
    },
    orderBy: { createdAt: "desc" },
    include: {
      roles: { where: { revokedAt: null }, include: { role: true } },
    },
  });

  const membershipStatus = (membership?.status ?? null) as MembershipStatus | null;
  const roleKeys = membership?.roles.map((r) => r.role.key) ?? [];

  const decision = evaluatePolicy({
    session: "VALID",
    actorUserId: auth.userId,
    workspaceId: params.workspaceId,
    membershipStatus,
    roleKeys,
    permission: params.permission,
  });

  if (decision.decision === "DENY") {
    await logAudit(prisma, {
      category: AuditCategory.AUTHZ,
      action: "authz.denied.workspace",
      outcome: AuditOutcome.DENIED,
      actorUserId: auth.userId,
      tenantWorkspaceId: params.workspaceId,
      reasonCode: decision.reasonCode,
      targetType: "Workspace",
      targetId: params.workspaceId,
      metadata: { permission: params.permission },
      userAgent: auth.userAgent,
    });

    // Non-member → 404 (enumeration resistance); member tanpa permission → 403.
    if (
      decision.reasonCode === ReasonCode.DENY_NOT_MEMBER ||
      decision.reasonCode === ReasonCode.DENY_MEMBERSHIP_REMOVED ||
      decision.reasonCode === ReasonCode.DENY_TENANT_MISMATCH
    ) {
      throw new ApiError(404, decision.reasonCode, "Tidak ditemukan");
    }
    throw new ApiError(403, decision.reasonCode, "Akses ditolak");
  }

  return {
    auth,
    workspaceId: params.workspaceId,
    membershipId: membership!.id,
    roleKeys,
  };
}

/** Permission efektif aktor di sebuah workspace (untuk UI menampilkan UI-state; keamanan tetap server-side). */
export async function effectivePermissionsInWorkspace(
  userId: string,
  workspaceId: string,
  prisma: PrismaClient = db
): Promise<Set<Permission>> {
  const membership = await prisma.membership.findFirst({
    where: { workspaceId, userId, status: MembershipStatus.ACTIVE },
    include: { roles: { where: { revokedAt: null }, include: { role: true } } },
  });
  if (!membership) return new Set<Permission>();
  const keys = membership.roles.map((r) => r.role.key);
  const result = new Set<Permission>();
  for (const key of keys) {
    const preset = ROLE_PRESETS[key as RoleKey];
    if (preset) preset.forEach((p) => result.add(p));
  }
  return result;
}
