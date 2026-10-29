// PATCH /api/v1/workspaces/[workspaceId]/members/[membershipId]
// Transisi admin membership orang lain: suspend / reactivate / remove (REQ-049).
// Permission per aksi; self-target ditolak (gunakan leave).

import { NextRequest } from "next/server";
import { z } from "zod";
import { requireWorkspacePermission } from "@/lib/authz/guards";
import { applyMemberAction, type MemberAction } from "@/lib/memberships/service";
import { toProblemResponse } from "@/lib/api/problems";
import { db } from "@/lib/db";

const bodySchema = z.object({
  action: z.enum(["suspend", "reactivate", "remove"]),
});

const ACTION_PERMISSION: Record<
  MemberAction,
  "workspace.member.suspend" | "workspace.member.remove"
> = {
  suspend: "workspace.member.suspend",
  reactivate: "workspace.member.suspend",
  remove: "workspace.member.remove",
};

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ workspaceId: string; membershipId: string }> }
) {
  try {
    const { workspaceId, membershipId } = await ctx.params;
    const body = bodySchema.parse(await req.json());

    const access = await requireWorkspacePermission({
      workspaceId,
      permission: ACTION_PERMISSION[body.action],
    });

    const result = await applyMemberAction(db, {
      actorUserId: access.auth.userId,
      workspaceId,
      membershipId,
      action: body.action,
      userAgent: access.auth.userAgent,
    });
    return Response.json({ membershipId, status: result.status });
  } catch (error) {
    return toProblemResponse(
      error,
      "/api/v1/workspaces/[workspaceId]/members/[membershipId]"
    );
  }
}
