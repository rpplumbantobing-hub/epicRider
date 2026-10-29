// Prisma adapter untuk next-auth v4 — epicRider Phase 4 (ADR-022).
//
// Implementasi `Adapter` interface next-auth v4 di atas model domain epicRider
// (User/Account/Session — DMC §3.1) TANPA dependency adapter eksternal baru
// (gated prompt §8.2: dependency baru wajib didokumentasikan — keputusan:
// adapter custom minimal, ~150 baris, alih-alih paket @auth/prisma-adapter).
//
// Keamanan bawaan implementasi ini:
// - `getSessionAndUser` menolak sesi yang revoked (revokedAt) atau kedaluwarsa
//   → revoked session ditolak pada request berikutnya (REQ-048 acceptance).
// - `deleteSession` = revoke (set revokedAt), bukan hapus — jejak audit tetap.
// - `createSession` menangkap label perangkat dari User-Agent request (untuk
//   daftar sesi REQ-048) dengan aman (try/catch — konteks request tidak selalu
//   tersedia, mis. pada test).
// - `createVerificationToken`/`useVerificationToken` TIDAK didukung (tidak ada
//   alur magic-link di Phase 4) — throw eksplisit, tidak silent.

import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
  VerificationToken,
} from "next-auth/adapters";
import type { PrismaClient } from "@prisma/client";
import { describeUserAgent } from "./user-agent";

/** Membaca User-Agent request berjalan (bila ada) — untuk label perangkat. */
async function currentUserAgent(): Promise<string | null> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    return h.get("user-agent");
  } catch {
    return null; // di luar konteks request (test/background) — bukan error.
  }
}

export function epicRiderPrismaAdapter(db: PrismaClient): Adapter {
  return {
    async createUser(data): Promise<AdapterUser> {
      const user = await db.user.create({
        data: {
          email: data.email,
          emailVerified: data.emailVerified,
          name: data.name,
          image: data.image,
        },
      });
      return user as AdapterUser;
    },
    async getUser(id): Promise<AdapterUser | null> {
      const user = await db.user.findUnique({ where: { id } });
      return (user as AdapterUser) ?? null;
    },
    async getUserByEmail(email): Promise<AdapterUser | null> {
      const user = await db.user.findUnique({ where: { email } });
      return (user as AdapterUser) ?? null;
    },
    async getUserByAccount({
      provider,
      providerAccountId,
    }): Promise<AdapterUser | null> {
      const account = await db.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { user: true },
      });
      return (account?.user as AdapterUser) ?? null;
    },
    async updateUser(partial): Promise<AdapterUser> {
      const user = await db.user.update({
        where: { id: partial.id },
        data: {
          name: partial.name,
          email: partial.email,
          emailVerified: partial.emailVerified,
          image: partial.image,
        },
      });
      return user as AdapterUser;
    },
    async deleteUser(userId): Promise<AdapterUser | null> {
      const user = await db.user.delete({ where: { id: userId } });
      return user as AdapterUser;
    },
    async linkAccount(account: AdapterAccount): Promise<void> {
      await db.account.create({
        data: {
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refreshToken: account.refresh_token,
          accessToken: account.access_token,
          // next-auth `expires_at` = epoch DETIK; kolom kita DateTime.
          expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
          tokenType: account.token_type,
          scope: account.scope,
          idToken: account.id_token,
          sessionState: account.session_state,
        },
      });
    },
    async unlinkAccount({
      provider,
      providerAccountId,
    }): Promise<void | AdapterAccount | undefined> {
      await db.account.update({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        data: { unlinkedAt: new Date() },
      });
    },
    async createSession({
      sessionToken,
      userId,
      expires,
    }): Promise<AdapterSession> {
      const userAgent = await currentUserAgent();
      const session = await db.session.create({
        data: {
          sessionToken,
          userId,
          expires,
          userAgent: userAgent ?? null,
          deviceLabel: userAgent ? describeUserAgent(userAgent) : null,
        },
      });
      return { sessionToken: session.sessionToken, userId: session.userId, expires: session.expires };
    },
    async getSessionAndUser(
      sessionToken: string
    ): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
      const record = await db.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });
      if (!record) return null;
      // REQ-048: revoke berlaku pada request berikutnya; sesi kedaluwarsa ditolak.
      if (record.revokedAt !== null) return null;
      if (record.expires.getTime() <= Date.now()) return null;
      // Throttle pembaruan lastUsedAt (maksimal sekali per menit) agar tidak
      // menulis pada setiap request.
      if (!record.lastUsedAt || Date.now() - record.lastUsedAt.getTime() > 60_000) {
        await db.session
          .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
          .catch(() => undefined);
      }
      return {
        session: {
          sessionToken: record.sessionToken,
          userId: record.userId,
          expires: record.expires,
        },
        user: record.user as AdapterUser,
      };
    },
    async updateSession(_partial) {
      // Tidak ada sliding expiry di Phase 4 (OD-115 PROPOSED — umur sesi tetap
      // dari maxAge; perpanjangan = keputusan owner).
      return undefined;
    },
    async deleteSession(sessionToken) {
      // Sign-out = revoke (jejak tetap untuk audit; akses berakhir seketika).
      await db.session.update({
        where: { sessionToken },
        data: { revokedAt: new Date() },
      });
    },
    async createVerificationToken(
      _token: VerificationToken
    ): Promise<VerificationToken | null | undefined> {
      throw new Error("createVerificationToken tidak didukung epicRider (tidak ada alur magic-link)");
    },
    async useVerificationToken(_params: {
      identifier: string;
      token: string;
    }): Promise<VerificationToken | null> {
      throw new Error("useVerificationToken tidak didukung epicRider (tidak ada alur magic-link)");
    },
  };
}
