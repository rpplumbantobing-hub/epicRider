// POST /api/v1/me/invitations/[invitationId]/accept — terima undangan dari
// daftar "undangan saya" (identitas dicocokkan server-side dengan target).

import { NextRequest } from "next/server";
import { requireSession } from "@/lib/authz/guards";
import { acceptInvitationById } from "@/lib/invitations/service";
import { toProblemResponse } from "@/lib/api/problems";
import { db } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ invitationId: string }> }
) {
  try {
    const { invitationId } = await ctx.params;
    const auth = await requireSession();
    const result = await acceptInvitationById(db, {
      actorUserId: auth.userId,
      actorEmail: auth.user.email,
      invitationId,
      userAgent: auth.userAgent,
    });
    return Response.json({
      workspaceId: result.workspaceId,
      workspaceName: result.workspaceName,
    });
  } catch (error) {
    return toProblemResponse(error, "/api/v1/me/invitations/[invitationId]/accept");
  }
}
