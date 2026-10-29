// /account — epicRider Phase 4. Profil minimal + manajemen sesi (REQ-048).

import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/authz/guards";
import { listActiveSessions } from "@/lib/auth/session-service";
import { db } from "@/lib/db";
import { SessionManager } from "@/components/account/session-manager";
import { dictionaries } from "@/i18n/dictionaries";
import { I18nProvider } from "@/i18n/provider";
import { getLocale } from "@/i18n/server";

export default async function AccountPage() {
  const auth = await getAuthContext();
  if (!auth) {
    redirect("/login?next=/account");
  }

  const sessions = await listActiveSessions(db, auth.userId, auth.sessionToken);
  const locale = await getLocale();

  return (
    <I18nProvider locale={locale} dictionary={dictionaries[locale]}>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <SessionManager
          profile={{ name: auth.user.name, email: auth.user.email, image: auth.user.image }}
          initialSessions={sessions.map((s) => ({
            id: s.id,
            deviceLabel: s.deviceLabel,
            createdAt: s.createdAt.toISOString(),
            lastUsedAt: s.lastUsedAt?.toISOString() ?? null,
            expiresAt: s.expiresAt.toISOString(),
            isCurrent: s.isCurrent,
          }))}
        />
      </main>
    </I18nProvider>
  );
}
