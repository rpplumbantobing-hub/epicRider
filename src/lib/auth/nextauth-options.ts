// Konfigurasi next-auth v4 — epicRider Phase 4 (ADR-022).
//
// - Google OIDC (REQ-022): provider DIsertakan HANYA bila kredensial env
//   tersedia (`GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`). Tanpa kredensial:
//   tidak ada provider aktif — UI menampilkan status aman "provider belum
//   dikonfigurasi" (TIDAK ADA login palsu). Validasi state/nonce/signature/
//   issuer/audience/expiry/redirect-uri ditangani library (gated prompt §5.1:
//   jangan re-implement validasi kriptografi manual).
// - Account linking (REQ-022/REQ-047): default AMAN — TANPA
//   `allowDangerousEmailAccountLinking`: email yang sama dari metode lain TIDAK
//   auto-link (next-auth memblokir dengan OAuthAccountNotLinked). Linking
//   eksplisit = alur terpisah (kebijakan di ADR-022; runtime menunggu kanal
//   WhatsApp — OD-03).
// - Sesi (REQ-048): strategi database — mendukung daftar sesi + revoke per
//   perangkat; revoke efektif pada request berikutnya (adapter).
// - Anti-enumerasi: pesan error login tidak membocorkan keberadaan akun.
// - Secret: produksi TANPA NEXTAUTH_SECRET = gagal aman (throw saat build
//   options) — tidak pernah "fake auth".

import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { epicRiderPrismaAdapter } from "./adapter";
import { securityConfig } from "@/lib/config/security-config";
import { logAudit, AuditOutcome } from "@/lib/audit/audit-service";
import { db } from "@/lib/db";

// Augmentasi tipe Session: sertakan id user global (dipakai guards/UI).
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

/** Apakah kredensial Google OIDC tersedia (server-side only). */
export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function buildProviders(): NextAuthOptions["providers"] {
  const providers: NextAuthOptions["providers"] = [];
  if (isGoogleConfigured()) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        // Tidak ada allowDangerousEmailAccountLinking — no-auto-link by design.
      })
    );
  }
  return providers;
}

function assertSafeToBuildOptions(): void {
  // Gagal aman di produksi tanpa secret (gated prompt §8.3).
  if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
    throw new Error(
      "NEXTAUTH_SECRET wajib diisi di produksi (fail-safe: autentikasi tidak aktif tanpa secret)."
    );
  }
}

export const authOptions: NextAuthOptions = {
  adapter: epicRiderPrismaAdapter(db),
  session: {
    strategy: "database",
    // OD-115 OPEN: nilai PROPOSED, terpusat di security-config (env-override).
    maxAge: securityConfig.session.maxAgeSeconds,
    updateAge: 0, // tidak ada sliding update (updateSession no-op di adapter)
  },
  providers: buildProviders(),
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    session({ session, user }) {
      // Sertakan id user global (bukan hanya email) untuk guards/UI.
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    // Audit login/sign-out (REQ-054; REQ-092) — tanpa token/secret di payload.
    async signIn({ user }) {
      await logAudit(db, {
        category: "AUTH",
        action: "auth.login.success",
        outcome: AuditOutcome.SUCCESS,
        actorUserId: user?.id ?? null,
        targetType: "User",
        targetId: user?.id ?? null,
        metadata: { method: "google" },
      });
    },
    async signOut(message) {
      const token =
        "sessionToken" in message ? (message.sessionToken as string | undefined) : undefined;
      if (token) {
        const session = await db.session.findUnique({ where: { sessionToken: token } });
        await logAudit(db, {
          category: "SESSION",
          action: "session.revoked.signout",
          outcome: AuditOutcome.SUCCESS,
          actorUserId: session?.userId ?? null,
          targetType: "Session",
          targetId: session?.id ?? null,
        });
      }
    },
    async createUser({ user }) {
      await logAudit(db, {
        category: "AUTH",
        action: "auth.user.created",
        outcome: AuditOutcome.SUCCESS,
        actorUserId: user?.id ?? null,
        targetType: "User",
        targetId: user?.id ?? null,
      });
    },
    async linkAccount({ account }) {
      await logAudit(db, {
        category: "AUTH",
        action: "auth.account.linked",
        outcome: AuditOutcome.SUCCESS,
        actorUserId: account?.userId ?? null,
        targetType: "Account",
        targetId: null,
        metadata: { provider: account?.provider ?? "unknown" },
      });
    },
  },
  logger: {
    error(code) {
      console.error(`[next-auth] ${code}`);
    },
    warn(code) {
      console.warn(`[next-auth] ${code}`);
    },
    debug() {
      // Tidak menulis log debug (menghindari kebocoran data ke log).
    },
  },
};

// Bangun options sekali di import; gagal aman di produksi bila misconfigured.
assertSafeToBuildOptions();
