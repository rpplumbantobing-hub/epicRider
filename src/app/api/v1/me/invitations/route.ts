// GET /api/v1/me/invitations — undangan PENDING yang ditujukan kepada user
// (via email terverifikasi; user-scoped — TIDAK menerima parameter workspace).

import { NextRequest } from "next/server";
import { requireSession } from "@/lib/authz/guards";
import { listMyPendingInvitations } from "@/lib/invitations/service";
import { toProblemResponse } from "@/lib/api/problems";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  try {
    const auth = await requireSession();
    const invitations = await listMyPendingInvitations(db, {
      userId: auth.userId,
      email: auth.user.email,
    });
    // Token TIDAK dikirim di daftar — accept mengirim token yang dimiliki user
    // (dari link undangan). Daftar hanya metadata.
    return Response.json({
      invitations: invitations.map((i) => ({
        id: i.id,
        workspaceId: i.workspaceId,
        workspaceName: i.workspaceName,
        roleKey: i.roleKey,
        expiresAt: i.expiresAt,
      })),
    });
  } catch (error) {
    return toProblemResponse(error, "/api/v1/me/invitations");
  }
}
