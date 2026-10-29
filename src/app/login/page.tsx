// /login — epicRider Phase 4. Server component: status konfigurasi provider
// (dari env server-side) → LoginScreen. next-auth pages.signIn mengarah ke sini.

import { LoginScreen } from "@/components/auth/login-screen";
import { isGoogleConfigured } from "@/lib/auth/nextauth-options";
import { dictionaries } from "@/i18n/dictionaries";
import { I18nProvider } from "@/i18n/provider";
import { getLocale } from "@/i18n/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getLocale();
  const params = await searchParams;

  const nextParam = typeof params.next === "string" ? params.next : null;
  // Hanya path relatif yang diizinkan (anti open-redirect).
  const safeNext =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;

  return (
    <I18nProvider locale={locale} dictionary={dictionaries[locale]}>
      <LoginScreen
        googleConfigured={isGoogleConfigured()}
        nextPath={safeNext}
        showExpired={params.expired === "1"}
        showSignedOut={params.signedOut === "1"}
        oauthError={params.error === "OAuthAccountNotLinked" || params.error === "Configuration" || params.error === "AccessDenied"}
      />
    </I18nProvider>
  );
}
