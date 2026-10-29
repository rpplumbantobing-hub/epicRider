// GET /api/v1/workspaces/[workspaceId]/members — daftar member (REQ-049).
// Permission: membership.read. Tenant scope dari PATH + membership terverifikasi
// (D-6; §14.1) — bukan dari input client.

import { NextRequest } from "next/server";
import { requireWorkspacePermission } from "@/lib/authz/guards";
import { listMembers } from "@/lib/memberships/service";
import { toProblemResponse } from "@/lib/api/problems";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await ctx.params;
    const access = await requireWorkspacePermission({
      workspaceId,
      permission: "membership.read",
    });
    const members = await listMembers(db, workspaceId, access.auth.userId);
    return Response.json({ members });
  } catch (error) {
    return toProblemResponse(error, "/api/v1/workspaces/[workspaceId]/members");
  }
}
