// GET  /api/v1/workspaces — daftar workspace milik user (REQ-023: via membership).
// POST /api/v1/workspaces — buat workspace (+ owner membership, satu transaksi).

import { NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/authz/guards";
import { createWorkspace, listWorkspacesForUser } from "@/lib/workspaces/service";
import { toProblemResponse } from "@/lib/api/problems";
import { db } from "@/lib/db";

const createSchema = z.object({
  name: z.string().min(1).max(80),
});

export async function GET(_req: NextRequest) {
  try {
    const auth = await requireSession();
    const workspaces = await listWorkspacesForUser(db, auth.userId);
    return Response.json({ workspaces });
  } catch (error) {
    return toProblemResponse(error, "/api/v1/workspaces");
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSession();
    const body = createSchema.parse(await req.json());
    const result = await createWorkspace(db, {
      actorUserId: auth.userId,
      name: body.name,
      userAgent: auth.userAgent,
    });
    return Response.json({ workspaceId: result.workspaceId }, { status: 201 });
  } catch (error) {
    return toProblemResponse(error, "/api/v1/workspaces");
  }
}
