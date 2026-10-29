// DELETE /api/v1/workspaces/[workspaceId]/invitations/[invitationId]
// Cabut undangan (REQ-051). Permission: workspace.member.invite.

import { NextRequest } from "next/server";
import { requireWorkspacePermission } from "@/lib/authz/guards";
import { revokeInvitation } from "@/lib/invitations/service";
import { toProblemResponse } from "@/lib/api/problems";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ workspaceId: string; invitationId: string }> }
) {
  try {
    const { workspaceId, invitationId } = await ctx.params;
    const access = await requireWorkspacePermission({
      workspaceId,
      permission: "workspace.member.invite",
    });
    await revokeInvitation(db, {
      actorUserId: access.auth.userId,
      workspaceId,
      invitationId,
      userAgent: access.auth.userAgent,
    });
    return Response.json({ revoked: invitationId });
  } catch (error) {
    return toProblemResponse(
      error,
      "/api/v1/workspaces/[workspaceId]/invitations/[invitationId]"
    );
  }
}
