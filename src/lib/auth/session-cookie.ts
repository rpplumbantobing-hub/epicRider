// Session cookie helpers — epicRider Phase 4.
//
// `next-auth` v4 menamai cookie sesi `next-auth.session-token` (http) atau
// `__Secure-next-auth.session-token` (https / USE_SECURE_COOKIES). Helper ini
// dipakai guards untuk membaca token sesi dan endpoint sesi untuk menandai
// "perangkat ini" — TIDAK untuk keputusan keamanan (validasi tetap lewat
// adapter + DB, bukan keberadaan cookie).

export function sessionCookieName(): string {
  const useSecure =
    process.env.USE_SECURE_COOKIES === "true" ||
    (process.env.NEXTAUTH_URL ?? "").startsWith("https://");
  return useSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token";
}

/** Membaca cookie sesi dari request context (server component/route handler). */
export async function readSessionCookie(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  return store.get(sessionCookieName())?.value ?? null;
}
