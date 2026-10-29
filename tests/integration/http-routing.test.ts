// @vitest-environment node
// HTTP ROUTING TEST — epicRider Phase 4 (R2 re-issue remediation §4.G / Gate Q4).
//
// TUJUAN (R2 spec §7): verifikasi routing HTTP NYATA untuk route family Phase 4 —
// workspace lifecycle, membership lifecycle (TERMASUK dynamic member route
// `/api/v1/workspaces/[workspaceId]/members/[membershipId]`), invitation lifecycle,
// account/session lifecycle, dan authentication routes.
//
// Mengapa HTTP nyata (bukan static source inspection / import handler):
//   - Dynamic segment HANYA ter-resolve jika nama direktori filesystem persis
//     canonical (`[membershipId]`, `[workspaceId]`). Defect historis worktree
//     (direktori `embershipId]` — lihat PHASE_4_ROUTE_DEFECT_REPORT.md) TIDAK
//     mungkin lolos test ini: request PATCH/GET/DELETE ke path dinamis akan 404.
//   - Perilaku authn/authz (401/403/404 problem-details) diverifikasi end-to-end
//     melalui stack Next.js sungguhan (cookie → guard → policy → handler).
//
// Database safety (R2 spec §11): DB SQLite disposable per-run di tmpdir, dibuat
// dari migrasi terversionisasi via `prisma migrate deploy` — BUKAN database
// dev/produksi; DATABASE_URL utama tidak disentuh. Pola identik dengan
// tests/integration/test-db.ts (file R0 tidak diubah; helper lokal karena path
// DB mentah diperlukan untuk env server HTTP).
//
// Mode server: production (`next start`) bila `.next/BUILD_ID` tersedia (build
// sudah dijalankan), selain itu dev server. Keduanya server HTTP Next.js
// sungguhan di port test terisolasi (4311) — bukan port dev-server sandbox (3000).

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { resetDb, seedWorkspaceWithOwner, seedMember } from "./test-db";
import { issueSession } from "@/lib/auth/session-service";
import { createInvitation } from "@/lib/invitations/service";

const PORT = 4311;
const BASE = `http://127.0.0.1:${PORT}`;
const WORKTREE_ROOT = path.resolve(__dirname, "../..");

interface HttpTestDatabase {
  db: PrismaClient;
  dbPath: string;
  destroy: () => Promise<void>;
}

/** DB SQLite disposable untuk server HTTP test (pola test-db.ts; dir lokal). */
async function createHttpTestDatabase(): Promise<HttpTestDatabase> {
  const dir = mkdtempSync(path.join(tmpdir(), `epicrider-http-${randomBytes(4).toString("hex")}-`));
  const dbPath = path.join(dir, "test.db");
  const url = `file:${dbPath}`;
  const result = spawnSync(
    "bunx",
    ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"],
    { cwd: WORKTREE_ROOT, env: { ...process.env, DATABASE_URL: url }, encoding: "utf8", timeout: 120_000 }
  );
  if (result.status !== 0) {
    throw new Error(`prisma migrate deploy gagal (${result.status}):\n${result.stdout}\n${result.stderr}`);
  }
  const db = new PrismaClient({ datasources: { db: { url } }, log: ["error"] });
  return {
    db,
    dbPath,
    async destroy() {
      await db.$disconnect();
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // best-effort (tmpdir dibersihkan OS)
      }
    },
  };
}

let testDb: HttpTestDatabase;
let server: ChildProcess;
let serverLog = "";

async function startServer(): Promise<void> {
  const mode = existsSync(path.join(WORKTREE_ROOT, ".next", "BUILD_ID")) ? ["start"] : ["dev"];
  const env = {
    ...process.env,
    DATABASE_URL: `file:${testDb.dbPath}`,
    NEXTAUTH_SECRET: "http-routing-test-secret (bukan secret nyata)",
    NEXTAUTH_URL: BASE,
  } as NodeJS.ProcessEnv;
  server = spawn("bunx", ["next", ...mode, "-p", String(PORT)], {
    cwd: WORKTREE_ROOT,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.on("data", (d) => (serverLog += String(d)));
  server.stderr?.on("data", (d) => (serverLog += String(d)));

  const deadline = Date.now() + 240_000;
  let lastError: unknown = null;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`server keluar lebih awal (code ${server.exitCode}):\n${serverLog}`);
    }
    try {
      const res = await fetch(`${BASE}/api/auth/session`, { signal: AbortSignal.timeout(5_000) });
      if (res.status === 200) return; // server siap melayani HTTP
    } catch (e) {
      lastError = e;
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }
  throw new Error(`server tidak siap dalam batas waktu; lastError: ${lastError}\nlog:\n${serverLog}`);
}

interface ApiResult {
  status: number;
  body: string;
  json: Record<string, unknown>;
}

async function api(
  urlPath: string,
  opts: { method?: string; token?: string | null; body?: unknown } = {}
): Promise<ApiResult> {
  const headers: Record<string, string> = {};
  if (opts.token) headers.cookie = `next-auth.session-token=${opts.token}`;
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(`${BASE}${urlPath}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: AbortSignal.timeout(60_000),
  });
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    json = { _raw: text };
  }
  return { status: res.status, body: text, json };
}

/** Sesi valid untuk user (token dipakai sebagai cookie next-auth.session-token). */
async function tokenFor(db: PrismaClient, userId: string): Promise<string> {
  const { sessionToken } = await issueSession(db, {
    userId,
    userAgent: "http-routing-test/1.0 (vitest)",
  });
  return sessionToken;
}

beforeAll(async () => {
  testDb = await createHttpTestDatabase();
  await startServer();
}, 300_000);

afterAll(async () => {
  if (server && server.exitCode === null) {
    server.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 500));
    if (server.exitCode === null) server.kill("SIGKILL");
  }
  await testDb.destroy();
});

describe("HTTP routing — authentication & session routes (R2 spec §7)", () => {
  it("1. GET /api/auth/session resolves; GET /api/v1/me tanpa sesi → 401 problem-details", async () => {
    const anon = await api("/api/auth/session");
    expect(anon.status).toBe(200); // route NextAuth benar-benar ter-routing

    const me = await api("/api/v1/me");
    expect(me.status).toBe(401);
    expect(me.json.status).toBe(401);
    expect(me.json.code).toBe("DENY_NO_SESSION");
    expect(String(me.json.type)).toContain("/problems/");
    expect(typeof me.json.traceId).toBe("string");
    expect(String(me.json.title ?? "").length).toBeGreaterThan(0);
  }, 90_000);

  it("2. POST /api/v1/workspaces tanpa sesi → 401 problem-details", async () => {
    const res = await api("/api/v1/workspaces", {
      method: "POST",
      body: { name: "Tidak Boleh" },
    });
    expect(res.status).toBe(401);
    expect(res.json.code).toBe("DENY_NO_SESSION");
  }, 90_000);

  it("3. POST /api/v1/workspaces dengan sesi → 201 (workspace lifecycle via HTTP)", async () => {
    await resetDb(testDb.db);
    const user = await testDb.db.user.create({
      data: { name: "Owner HTTP", email: "owner-http@test.local", emailVerified: new Date() },
    });
    const token = await tokenFor(testDb.db, user.id);

    const res = await api("/api/v1/workspaces", {
      method: "POST",
      token,
      body: { name: "WS via HTTP" },
    });
    expect(res.status).toBe(201);
    expect(typeof res.json.workspaceId).toBe("string");

    const me = await api("/api/v1/me", { token });
    expect(me.status).toBe(200);
    const workspaces = me.json.workspaces as Array<{ id: string; roleKeys: string[] }>;
    expect(workspaces).toHaveLength(1);
    expect(workspaces[0].roleKeys).toContain("owner");
  }, 90_000);

  it("12. GET+DELETE /api/v1/me/sessions — revoke efektif pada request berikutnya", async () => {
    await resetDb(testDb.db);
    const user = await testDb.db.user.create({
      data: { name: "Sesi HTTP", email: "sesi-http@test.local", emailVerified: new Date() },
    });
    const tokenA = await tokenFor(testDb.db, user.id);
    const tokenB = await tokenFor(testDb.db, user.id);

    const list = await api("/api/v1/me/sessions", { token: tokenA });
    expect(list.status).toBe(200);
    const sessions = list.json.sessions as Array<{ id: string; isCurrent: boolean }>;
    expect(sessions.length).toBe(2);

    const target = sessions.find((s) => !s.isCurrent)!;
    const del = await api(`/api/v1/me/sessions/${target.id}`, { method: "DELETE", token: tokenA });
    expect(del.status).toBe(200);

    // Sesi yang direvoke ditolak pada request berikutnya (end-to-end via HTTP).
    const after = await api("/api/v1/me", { token: tokenB });
    expect(after.status).toBe(401);
    // Sesi aktif tetap berfungsi.
    const still = await api("/api/v1/me", { token: tokenA });
    expect(still.status).toBe(200);
  }, 90_000);
});

describe("HTTP routing — workspace & membership lifecycle (dynamic member route)", () => {
  it("4. GET members oleh owner → 200 (membership.read)", async () => {
    await resetDb(testDb.db);
    const seed = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Owner 4", email: "owner4@test.local", workspaceName: "WS 4",
    });
    const token = await tokenFor(testDb.db, seed.userId);

    const res = await api(`/api/v1/workspaces/${seed.workspaceId}/members`, { token });
    expect(res.status).toBe(200);
    const members = res.json.members as Array<{ membershipId: string; status: string }>;
    expect(
      members.some((m) => m.membershipId === seed.membershipId && m.status === "ACTIVE")
    ).toBe(true);
  }, 90_000);

  it("5. GET members oleh non-member → 404 (enumeration resistance)", async () => {
    await resetDb(testDb.db);
    const seed = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Owner 5", email: "owner5@test.local", workspaceName: "WS 5",
    });
    const outsider = await testDb.db.user.create({
      data: { name: "Orang Luar", email: "luar5@test.local", emailVerified: new Date() },
    });
    const outsiderToken = await tokenFor(testDb.db, outsider.id);

    const res = await api(`/api/v1/workspaces/${seed.workspaceId}/members`, {
      token: outsiderToken,
    });
    expect(res.status).toBe(404); // bukan 403 — keberadaan tenant tidak dibocorkan
  }, 90_000);

  it("9. PATCH members/[membershipId] suspend oleh owner → 200 SUSPENDED (route dinamis ter-routing)", async () => {
    await resetDb(testDb.db);
    const seed = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Owner 9", email: "owner9@test.local", workspaceName: "WS 9",
    });
    const member = await seedMember(testDb.db, {
      email: "member9@test.local", name: "Member 9", workspaceId: seed.workspaceId,
    });
    const ownerToken = await tokenFor(testDb.db, seed.userId);

    // Request HTTP NYATA ke dynamic segment /members/[membershipId] — path
    // dinamis hanya ter-resolve jika direktori canonical ([membershipId]).
    const res = await api(
      `/api/v1/workspaces/${seed.workspaceId}/members/${member.membershipId}`,
      { method: "PATCH", token: ownerToken, body: { action: "suspend" } }
    );
    expect(res.status).toBe(200);
    expect(res.json.membershipId).toBe(member.membershipId);
    expect(res.json.status).toBe("SUSPENDED");

    const row = await testDb.db.membership.findUniqueOrThrow({
      where: { id: member.membershipId },
    });
    expect(row.status).toBe("SUSPENDED");
  }, 90_000);

  it("10. Member SUSPENDED kehilangan akses seketika → 403 + reason (via HTTP)", async () => {
    await resetDb(testDb.db);
    const seed = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Owner 10", email: "owner10@test.local", workspaceName: "WS 10",
    });
    const member = await seedMember(testDb.db, {
      email: "member10@test.local", name: "Member 10", workspaceId: seed.workspaceId,
    });
    const ownerToken = await tokenFor(testDb.db, seed.userId);
    const memberToken = await tokenFor(testDb.db, member.userId);

    const before = await api(`/api/v1/workspaces/${seed.workspaceId}/members`, {
      token: memberToken,
    });
    expect(before.status).toBe(200);

    await api(`/api/v1/workspaces/${seed.workspaceId}/members/${member.membershipId}`, {
      method: "PATCH",
      token: ownerToken,
      body: { action: "suspend" },
    });

    const after = await api(`/api/v1/workspaces/${seed.workspaceId}/members`, {
      token: memberToken,
    });
    expect(after.status).toBe(403);
    expect(after.json.code).toBe("DENY_MEMBERSHIP_SUSPENDED");
  }, 90_000);

  it("11. PATCH remove → 200; akses member hilang (404) pada request berikutnya", async () => {
    await resetDb(testDb.db);
    const seed = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Owner 11", email: "owner11@test.local", workspaceName: "WS 11",
    });
    const member = await seedMember(testDb.db, {
      email: "member11@test.local", name: "Member 11", workspaceId: seed.workspaceId,
    });
    const ownerToken = await tokenFor(testDb.db, seed.userId);
    const memberToken = await tokenFor(testDb.db, member.userId);

    const res = await api(
      `/api/v1/workspaces/${seed.workspaceId}/members/${member.membershipId}`,
      { method: "PATCH", token: ownerToken, body: { action: "remove" } }
    );
    expect(res.status).toBe(200);
    expect(res.json.status).toBe("REMOVED");

    const after = await api(`/api/v1/workspaces/${seed.workspaceId}/members`, {
      token: memberToken,
    });
    expect(after.status).toBe(404);
  }, 90_000);
});

describe("HTTP routing — invitation lifecycle", () => {
  it("6. POST invitations oleh owner → 201 + token sekali-tampil", async () => {
    await resetDb(testDb.db);
    const seed = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Owner 6", email: "owner6@test.local", workspaceName: "WS 6",
    });
    const ownerToken = await tokenFor(testDb.db, seed.userId);

    const res = await api(`/api/v1/workspaces/${seed.workspaceId}/invitations`, {
      method: "POST",
      token: ownerToken,
      body: { contactTarget: "kru6@test.local", roleKey: "member" },
    });
    expect(res.status).toBe(201);
    const inv = res.json.invitation as { contactTarget: string; roleKey: string };
    expect(inv.contactTarget).toBe("kru6@test.local");
    expect(inv.roleKey).toBe("member");
    expect(typeof res.json.token).toBe("string");
    expect(String(res.json.token).length).toBeGreaterThanOrEqual(10);
  }, 90_000);

  it("7-8. GET /api/v1/me/invitations → terlihat; POST accept by token → membership terbentuk", async () => {
    await resetDb(testDb.db);
    const seed = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Owner 7", email: "owner7@test.local", workspaceName: "WS 7",
    });
    const invitee = await testDb.db.user.create({
      data: { name: "Invitee 7", email: "kru7@test.local", emailVerified: new Date() },
    });
    const ownerToken = await tokenFor(testDb.db, seed.userId);
    const inviteeToken = await tokenFor(testDb.db, invitee.id);

    const created = await createInvitation(testDb.db, {
      actorUserId: seed.userId,
      workspaceId: seed.workspaceId,
      actorMembershipId: seed.membershipId,
      contactTarget: "kru7@test.local",
      roleKey: "member",
    });

    const list = await api("/api/v1/me/invitations", { token: inviteeToken });
    expect(list.status).toBe(200);
    const invitations = list.json.invitations as Array<{ workspaceId: string; roleKey: string }>;
    expect(
      invitations.some((i) => i.workspaceId === seed.workspaceId && i.roleKey === "member")
    ).toBe(true);

    const accept = await api("/api/v1/me/invitations/accept", {
      method: "POST",
      token: inviteeToken,
      body: { token: created.token },
    });
    expect(accept.status).toBe(200);
    expect(accept.json.workspaceId).toBe(seed.workspaceId);

    const members = await api(`/api/v1/workspaces/${seed.workspaceId}/members`, {
      token: ownerToken,
    });
    expect(members.status).toBe(200);
    const rows = members.json.members as Array<{ membershipId: string }>;
    expect(rows).toHaveLength(2); // owner + invitee yang baru diterima
  }, 90_000);

  it("13. Replay accept token yang sama via HTTP → ditolak 404 DENY_INVALID_INVITE (konsumsi sekali-pakai end-to-end)", async () => {
    await resetDb(testDb.db);
    const seed = await seedWorkspaceWithOwner(testDb.db, {
      userName: "Owner 13", email: "owner13@test.local", workspaceName: "WS 13",
    });
    const invitee = await testDb.db.user.create({
      data: { name: "Invitee 13", email: "kru13@test.local", emailVerified: new Date() },
    });
    const inviteeToken = await tokenFor(testDb.db, invitee.id);

    const created = await createInvitation(testDb.db, {
      actorUserId: seed.userId,
      workspaceId: seed.workspaceId,
      actorMembershipId: seed.membershipId,
      contactTarget: "kru13@test.local",
      roleKey: "member",
    });

    const first = await api("/api/v1/me/invitations/accept", {
      method: "POST",
      token: inviteeToken,
      body: { token: created.token },
    });
    expect(first.status).toBe(200);

    // Konsumsi sekali-pakai terbukti pada DB: status undangan = ACCEPTED.
    const row = await testDb.db.invitation.findUniqueOrThrow({
      where: { id: created.invitation.id },
    });
    expect(row.status).toBe("ACCEPTED");
    expect(row.usedAt).not.toBeNull();

    // Hapus membership agar penolakan kedua murni karena replay (bukan
    // ALREADY_MEMBER) — pola yang sama dengan tests/integration/invitation.test.ts.
    await testDb.db.membershipRoleAssignment.deleteMany({
      where: { membership: { workspaceId: seed.workspaceId, userId: invitee.id } },
    });
    await testDb.db.membership.deleteMany({
      where: { workspaceId: seed.workspaceId, userId: invitee.id },
    });

    // Replay berurutan ditolak: undangan non-PENDING diperlakukan tak dapat
    // dibedakan dari token tak valid (404 DENY_INVALID_INVITE — enumeration
    // resistance; 409 DENY_REPLAY hanya backstop ras transaksi).
    const replay = await api("/api/v1/me/invitations/accept", {
      method: "POST",
      token: inviteeToken,
      body: { token: created.token },
    });
    expect(replay.status).toBe(404);
    expect(replay.json.code).toBe("DENY_INVALID_INVITE");
    expect(typeof replay.json.traceId).toBe("string");
  }, 90_000);
});
