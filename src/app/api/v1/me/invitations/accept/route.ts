// POST /api/v1/me/invitations/accept — menerima undangan (REQ-051).
// Body: { token }. Wajib sesi terautentikasi + identitas cocok target undangan.

import { NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/authz/guards";
import { acceptInvitation } from "@/lib/invitations/service";
import { toProblemResponse } from "@/lib/api/problems";
import { db } from "@/lib/db";

const bodySchema = z.object({
  token: z.string().min(10).max(200),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSession();
    const body = bodySchema.parse(await req.json());
    const result = await acceptInvitation(db, {
      actorUserId: auth.userId,
      actorEmail: auth.user.email,
      token: body.token,
      userAgent: auth.userAgent,
    });
    return Response.json({ workspaceId: result.workspaceId, workspaceName: result.workspaceName });
  } catch (error) {
    return toProblemResponse(error, "/api/v1/me/invitations/accept");
  }
}
