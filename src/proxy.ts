// Proxy proteksi rute (UX; Next 16: middleware → proxy) — epicRider Phase 4.
//
// PENTING (MC §2; REQ-024): ini BUKAN kontrol keamanan — hanya cek keberadaan
// cookie sesi untuk redirect ramah ke /login. Penegakan sebenarnya ada di
// guard server-side (policy layer + DB) pada setiap route handler/server
// component. Middleware edge tidak bisa memeriksa DB.

import { NextRequest, NextResponse } from "next/server";

// Next 16: konvensi `proxy.ts` menggantikan `middleware.ts` (deprecation).

const SESSION_COOKIE_CANDIDATES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

export default function proxy(req: NextRequest) {
  const hasSessionCookie = SESSION_COOKIE_CANDIDATES.some(
    (name) => req.cookies.get(name)?.value
  );
  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/workspaces/:path*", "/invitations", "/account/:path*"],
};
