// DELETE /api/v1/me/sessions/[sessionId] — revoke SATU sesi milik sendiri
// (REQ-048). Object-level: sesi milik user lain → 404 (enumeration resistance).

import { NextRequest } from "next/server";
import { requireSession } from "@/lib/authz/guards";
import { revokeSession } from "@/lib/auth/session-service";
import { toProblemResponse, problemResponse } from "@/lib/api/problems";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await ctx.params;
    const auth = await requireSession();
    const ok = await revokeSession(db, auth.userId, sessionId);
    if (!ok) {
      return problemResponse(404, "NOT_FOUND", "Sesi tidak ditemukan", {
        instance: `/api/v1/me/sessions/${sessionId}`,
      });
    }
    return Response.json({ revoked: sessionId });
  } catch (error) {
    return toProblemResponse(error, "/api/v1/me/sessions/[sessionId]");
  }
}
