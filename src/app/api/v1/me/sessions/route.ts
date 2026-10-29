// GET  /api/v1/me/sessions — daftar sesi/device aktif (REQ-048).
// DELETE /api/v1/me/sessions — revoke SEMUA sesi (REQ-048).

import { NextRequest } from "next/server";
import { requireSession } from "@/lib/authz/guards";
import { listActiveSessions, revokeAllSessions } from "@/lib/auth/session-service";
import { toProblemResponse } from "@/lib/api/problems";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  try {
    const auth = await requireSession();
    const sessions = await listActiveSessions(db, auth.userId, auth.sessionToken);
    return Response.json({ sessions });
  } catch (error) {
    return toProblemResponse(error, "/api/v1/me/sessions");
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    const auth = await requireSession();
    const revoked = await revokeAllSessions(db, auth.userId);
    return Response.json({ revoked });
  } catch (error) {
    return toProblemResponse(error, "/api/v1/me/sessions");
  }
}
