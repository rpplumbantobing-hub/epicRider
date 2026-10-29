// POST /api/v1/workspaces/[workspaceId]/members/leave — keluar dari workspace
// (self-action; REQ-049). Permission: workspace.member.leave.

import { NextRequest } from "next/server";
import { requireWorkspacePermission } from "@/lib/authz/guards";
import { leaveWorkspace } from "@/lib/memberships/service";
import { toProblemResponse } from "@/lib/api/problems";
import { db } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await ctx.params;
    const access = await requireWorkspacePermission({
      workspaceId,
      permission: "workspace.member.leave",
    });
    await leaveWorkspace(db, {
      actorUserId: access.auth.userId,
      workspaceId,
      userAgent: access.auth.userAgent,
    });
    return Response.json({ left: true, workspaceId });
  } catch (error) {
    return toProblemResponse(error, "/api/v1/workspaces/[workspaceId]/members/leave");
  }
}
