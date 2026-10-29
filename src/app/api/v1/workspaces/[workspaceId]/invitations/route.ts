// GET  /api/v1/workspaces/[workspaceId]/invitations — daftar undangan (REQ-051).
// POST /api/v1/workspaces/[workspaceId]/invitations — buat undangan.
// Permission: workspace.member.invite. Role yang ditawarkan terikat server-side.

import { NextRequest } from "next/server";
import { z } from "zod";
import { requireWorkspacePermission } from "@/lib/authz/guards";
import { createInvitation, listInvitations } from "@/lib/invitations/service";
import { toProblemResponse } from "@/lib/api/problems";
import { db } from "@/lib/db";

const createSchema = z.object({
  contactTarget: z.string().min(3).max(254),
  roleKey: z.enum(["member", "owner"]).default("member"),
});

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await ctx.params;
    await requireWorkspacePermission({
      workspaceId,
      permission: "workspace.member.invite",
    });
    const invitations = await listInvitations(db, workspaceId);
    return Response.json({ invitations });
  } catch (error) {
    return toProblemResponse(error, "/api/v1/workspaces/[workspaceId]/invitations");
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await ctx.params;
    const body = createSchema.parse(await req.json());
    const access = await requireWorkspacePermission({
      workspaceId,
      permission: "workspace.member.invite",
    });
    const result = await createInvitation(db, {
      actorUserId: access.auth.userId,
      workspaceId,
      actorMembershipId: access.membershipId,
      contactTarget: body.contactTarget,
      roleKey: body.roleKey,
      userAgent: access.auth.userAgent,
    });
    // Token ditampilkan SEKALI kepada inviter (delivery provider belum
    // diputuskan — gated prompt §6.5).
    return Response.json(
      {
        invitation: {
          id: result.invitation.id,
          contactTarget: result.invitation.contactTarget,
          roleKey: result.invitation.roleKey,
          expiresAt: result.invitation.expiresAt,
        },
        token: result.token,
      },
      { status: 201 }
    );
  } catch (error) {
    return toProblemResponse(error, "/api/v1/workspaces/[workspaceId]/invitations");
  }
}
