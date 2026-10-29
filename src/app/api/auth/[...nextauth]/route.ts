// next-auth v4 route handler — epicRider Phase 4 (ADR-022).
// OAuth/OIDC protocol (state/nonce/PKCE/token validation/cookie/CSRF)
// ditangani library; konfigurasi di `src/lib/auth/nextauth-options.ts`.

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/nextauth-options";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
