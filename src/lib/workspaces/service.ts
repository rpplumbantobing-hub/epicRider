// Workspace service — epicRider Phase 4 (DMC §3.2; REQ-023/025/049).
//
// - createWorkspace: SATU transaksi — Workspace + role sistem (owner, member)
//   + Membership OWNER aktif pembuat (gated prompt §6.1: "creating a workspace
//   must create its initial owner/creator membership through one consistent
//   transaction").
// - listWorkspacesForUser: query tenant-first via membership join — user hanya
//   melihat workspace tempat mereka menjadi member (isolation by construction).
// - TANPA enforcement kuota seat (OD-05 → Phase 5; dicatat jujur).

import type { PrismaClient } from "@prisma/client";
import { logAudit, AuditCategory, AuditOutcome } from "@/lib/audit/audit-service";
import { SYSTEM_ROLE_KEYS, RoleKey, ROLE_PRESETS } from "@/lib/authz/roles";
import { Permission } from "@/lib/authz/permissions";
import { ApiError, ApiErrorCode } from "@/lib/api/problems";

export interface WorkspaceSummary {
  id: string;
  name: string;
  status: string;
  createdAt: Date;
  membershipId: string;
  roleKeys: string[];
  activeMemberCount: number;
}

/** Membuat workspace + role sistem + membership owner pembuat (satu transaksi). */
export async function createWorkspace(
  db: PrismaClient,
  params: { actorUserId: string; name: string; userAgent?: string | null }
): Promise<{ workspaceId: string; membershipId: string }> {
  const name = params.name.trim();
  if (name.length < 1 || name.length > 80) {
    throw new ApiError(422, ApiErrorCode.VALIDATION_FAILED, "Nama workspace tidak valid", "Panjang nama 1–80 karakter.");
  }

  const created = await db.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: { name, createdByUserId: params.actorUserId },
    });
    // Seed role sistem (OD-122 PROPOSED: owner + member).
    const roles = await Promise.all(
      SYSTEM_ROLE_KEYS.map((key) =>
        tx.role.create({ data: { workspaceId: workspace.id, key, isSystem: true } })
      )
    );
    const ownerRole = roles.find((r) => r.key === RoleKey.OWNER)!;
    const membership = await tx.membership.create({
      data: { workspaceId: workspace.id, userId: params.actorUserId, status: "ACTIVE" },
    });
    await tx.membershipRoleAssignment.create({
      data: { membershipId: membership.id, roleId: ownerRole.id, grantedBy: params.actorUserId },
    });
    return { workspace, membership };
  });

  await logAudit(db, {
    category: AuditCategory.WORKSPACE,
    action: "workspace.created",
    outcome: AuditOutcome.SUCCESS,
    actorUserId: params.actorUserId,
    tenantWorkspaceId: created.workspace.id,
    targetType: "Workspace",
    targetId: created.workspace.id,
    userAgent: params.userAgent ?? null,
  });
  await logAudit(db, {
    category: AuditCategory.MEMBERSHIP,
    action: "membership.created.owner",
    outcome: AuditOutcome.SUCCESS,
    actorUserId: params.actorUserId,
    tenantWorkspaceId: created.workspace.id,
    targetType: "Membership",
    targetId: created.membership.id,
    userAgent: params.userAgent ?? null,
  });

  return { workspaceId: created.workspace.id, membershipId: created.membership.id };
}

/** Daftar workspace milik user (via membership — isolation by construction). */
export async function listWorkspacesForUser(
  db: PrismaClient,
  userId: string
): Promise<WorkspaceSummary[]> {
  const memberships = await db.membership.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      workspace: {
        include: { _count: { select: { memberships: { where: { status: "ACTIVE" } } } } },
      },
      roles: { where: { revokedAt: null }, include: { role: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    status: m.workspace.status,
    createdAt: m.workspace.createdAt,
    membershipId: m.id,
    roleKeys: m.roles.map((r) => r.role.key),
    activeMemberCount: m.workspace._count.memberships,
  }));
}

/** Detail workspace dari perspektif member (dipakai UI workspace page). */
export async function getWorkspaceForMember(
  db: PrismaClient,
  params: { workspaceId: string; userId: string }
): Promise<{
  id: string;
  name: string;
  status: string;
  roleKeys: string[];
  myMembershipId: string;
  permissions: Permission[];
} | null> {
  const membership = await db.membership.findFirst({
    where: { workspaceId: params.workspaceId, userId: params.userId, status: "ACTIVE" },
    include: { roles: { where: { revokedAt: null }, include: { role: true } } },
  });
  if (!membership) return null;
  const workspace = await db.workspace.findUnique({ where: { id: params.workspaceId } });
  if (!workspace) return null;
  const roleKeys = membership.roles.map((r) => r.role.key);
  const permissions = new Set<Permission>();
  for (const key of roleKeys) {
    const preset = ROLE_PRESETS[key as RoleKey];
    if (preset) preset.forEach((p) => permissions.add(p));
  }
  return {
    id: workspace.id,
    name: workspace.name,
    status: workspace.status,
    roleKeys,
    myMembershipId: membership.id,
    permissions: [...permissions],
  };
}
