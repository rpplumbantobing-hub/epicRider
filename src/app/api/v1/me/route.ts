// GET /api/v1/me — profil user terautentikasi (REQ-025: identitas global)
// + ringkasan workspace miliknya (isolation by construction — via membership).

import { NextRequest } from "next/server";
import { requireSession } from "@/lib/authz/guards";
import { toProblemResponse } from "@/lib/api/problems";
import { listWorkspacesForUser } from "@/lib/workspaces/service";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  try {
    const auth = await requireSession();
    const workspaces = await listWorkspacesForUser(db, auth.userId);
    return Response.json({
      user: auth.user,
      workspaces: workspaces.map((w) => ({
        id: w.id,
        name: w.name,
        roleKeys: w.roleKeys,
      })),
    });
  } catch (error) {
    return toProblemResponse(error, "/api/v1/me");
  }
}
