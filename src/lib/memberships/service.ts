// Membership service — epicRider Phase 4 (DMC §3.3; REQ-049/025).
//
// Lifecycle: invite→accept→suspend→remove→leave. Setiap transisi:
//  - divalidasi permission-nya (policy layer, server-side);
//  - atomik (transaksi) + teraudit;
//  - mengubah akses efektif SEKETIKA (policy membaca status terkini per
//    request — acceptance REQ-049: "removed member loses access on next request").
//
// Aturan transisi (PROPOSED, minimal — REQ-049):
//  - suspend:   ACTIVE → SUSPENDED   (workspace.member.suspend; atas membership orang lain)
//  - reactivate: SUSPENDED → ACTIVE  (workspace.member.suspend — kapabilitas kelola status sama)
//  - remove:    ACTIVE|SUSPENDED → REMOVED (workspace.member.remove)
//  - leave:     ACTIVE → LEFT (workspace.member.leave; self-action SAJA)
//  - suspend/remove atas membership SENDIRI ditolak (gunakan leave — mencegah
//    self-lockout & memisahkan semantik admin vs self).
//  - Baris terminal (REMOVED/LEFT) tidak ditransisikan lagi; re-invite =
//    membership BARU (history preserved — DMC §3.3).

import type { PrismaClient } from "@prisma/client";
import { logAudit, AuditCategory, AuditOutcome } from "@/lib/audit/audit-service";
import { MembershipStatus } from "@/lib/authz/reason-codes";
import { Permission } from "@/lib/authz/permissions";
import { ApiError, ApiErrorCode } from "@/lib/api/problems";

export type MemberAction = "suspend" | "reactivate" | "remove";

const ACTION_PERMISSION: Record<MemberAction, Permission> = {
  suspend: Permission.WORKSPACE_MEMBER_SUSPEND,
  reactivate: Permission.WORKSPACE_MEMBER_SUSPEND,
  remove: Permission.WORKSPACE_MEMBER_REMOVE,
};

export interface MemberSummary {
  membershipId: string;
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  status: string;
  roleKeys: string[];
  createdAt: Date;
  isSelf: boolean;
}

/** Daftar member workspace (tenant-scoped by construction; permission: membership.read — dijaga route). */
export async function listMembers(
  db: PrismaClient,
  workspaceId: string,
  viewerUserId: string
): Promise<MemberSummary[]> {
  const memberships = await db.membership.findMany({
    where: { workspaceId, status: { in: ["ACTIVE", "SUSPENDED", "INVITED"] } },
    include: {
      user: true,
      roles: { where: { revokedAt: null }, include: { role: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return memberships.map((m) => ({
    membershipId: m.id,
    userId: m.userId,
    name: m.user.name,
    email: m.user.email,
    image: m.user.image,
    status: m.status,
    roleKeys: m.roles.map((r) => r.role.key),
    createdAt: m.createdAt,
    isSelf: m.userId === viewerUserId,
  }));
}

async function loadMembership(
  db: PrismaClient,
  workspaceId: string,
  membershipId: string
) {
  const membership = await db.membership.findFirst({
    where: { id: membershipId, workspaceId },
  });
  if (!membership) {
    // Enumeration resistance: jangan bocorkan keberadaan.
    throw new ApiError(404, "NOT_FOUND", "Membership tidak ditemukan");
  }
  return membership;
}

/** Transisi admin atas membership orang lain: suspend / reactivate / remove. */
export async function applyMemberAction(
  db: PrismaClient,
  params: {
    actorUserId: string;
    workspaceId: string;
    membershipId: string;
    action: MemberAction;
    userAgent?: string | null;
  }
): Promise<{ status: string }> {
  // Permission dijaga route handler via requireWorkspacePermission — di sini
  // kita validasi transisi domain + target.
  const membership = await loadMembership(db, params.workspaceId, params.membershipId);

  if (membership.userId === params.actorUserId) {
    throw new ApiError(
      422,
      ApiErrorCode.VALIDATION_FAILED,
      "Tindakan admin atas membership sendiri tidak diizinkan", "Gunakan leave untuk keluar dari workspace.");
  }

  const from = membership.status as MembershipStatus;
  let to: MembershipStatus;
  switch (params.action) {
    case "suspend":
      if (from !== MembershipStatus.ACTIVE) {
        throw new ApiError(409, ApiErrorCode.CONFLICT, "Transisi tidak valid", `suspend hanya dari ACTIVE (saat ini ${from}).`);
      }
      to = MembershipStatus.SUSPENDED;
      break;
    case "reactivate":
      if (from !== MembershipStatus.SUSPENDED) {
        throw new ApiError(409, ApiErrorCode.CONFLICT, "Transisi tidak valid", `reactivate hanya dari SUSPENDED (saat ini ${from}).`);
      }
      to = MembershipStatus.ACTIVE;
      break;
    case "remove":
      if (from !== MembershipStatus.ACTIVE && from !== MembershipStatus.SUSPENDED) {
        throw new ApiError(409, ApiErrorCode.CONFLICT, "Transisi tidak valid", `remove hanya dari ACTIVE/SUSPENDED (saat ini ${from}).`);
      }
      to = MembershipStatus.REMOVED;
      break;
  }

  const updated = await db.$transaction(async (tx) => {
    // Optimistic concurrency: hanya update bila status belum berubah.
    const result = await tx.membership.updateMany({
      where: { id: membership.id, status: from },
      data: { status: to, version: { increment: 1 } },
    });
    if (result.count === 0) {
      throw new ApiError(409, ApiErrorCode.CONFLICT, "Status membership berubah, coba lagi");
    }
    if (to === MembershipStatus.REMOVED) {
      // Cabut seluruh role assignment aktif membership yang dihapus.
      await tx.membershipRoleAssignment.updateMany({
        where: { membershipId: membership.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return tx.membership.findUniqueOrThrow({ where: { id: membership.id } });
  });

  await logAudit(db, {
    category: AuditCategory.MEMBERSHIP,
    action: `membership.${params.action}`,
    outcome: AuditOutcome.SUCCESS,
    actorUserId: params.actorUserId,
    tenantWorkspaceId: params.workspaceId,
    targetType: "Membership",
    targetId: membership.id,
    metadata: { from, to: updated.status },
    userAgent: params.userAgent ?? null,
  });

  return { status: updated.status };
}

/** leave: self-action (ACTIVE → LEFT). */
export async function leaveWorkspace(
  db: PrismaClient,
  params: { actorUserId: string; workspaceId: string; userAgent?: string | null }
): Promise<void> {
  const membership = await db.membership.findFirst({
    where: { workspaceId: params.workspaceId, userId: params.actorUserId, status: MembershipStatus.ACTIVE },
  });
  if (!membership) {
    throw new ApiError(404, "NOT_FOUND", "Membership aktif tidak ditemukan");
  }

  await db.$transaction(async (tx) => {
    const result = await tx.membership.updateMany({
      where: { id: membership.id, status: MembershipStatus.ACTIVE },
      data: { status: MembershipStatus.LEFT, version: { increment: 1 } },
    });
    if (result.count === 0) {
      throw new ApiError(409, ApiErrorCode.CONFLICT, "Status membership berubah, coba lagi");
    }
    await tx.membershipRoleAssignment.updateMany({
      where: { membershipId: membership.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  });

  await logAudit(db, {
    category: AuditCategory.MEMBERSHIP,
    action: "membership.left",
    outcome: AuditOutcome.SUCCESS,
    actorUserId: params.actorUserId,
    tenantWorkspaceId: params.workspaceId,
    targetType: "Membership",
    targetId: membership.id,
    userAgent: params.userAgent ?? null,
  });
}
