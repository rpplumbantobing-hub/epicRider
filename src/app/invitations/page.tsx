// /invitations — epicRider Phase 4. Server component: guard sesi; undangan
// milik user (email-matched, server-side). Mendukung ?token= (alur tautan).

import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/authz/guards";
import { listMyPendingInvitations } from "@/lib/invitations/service";
import { db } from "@/lib/db";
import { InvitationList } from "@/components/invitations/invitation-list";
import { dictionaries } from "@/i18n/dictionaries";
import { I18nProvider } from "@/i18n/provider";
import { getLocale } from "@/i18n/server";

export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const auth = await getAuthContext();
  if (!auth) {
    redirect("/login?next=/invitations");
  }

  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;

  const invitations = await listMyPendingInvitations(db, {
    userId: auth.userId,
    email: auth.user.email,
  });

  const locale = await getLocale();

  return (
    <I18nProvider locale={locale} dictionary={dictionaries[locale]}>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <InvitationList
          initial={invitations.map((i) => ({
            id: i.id,
            workspaceId: i.workspaceId,
            workspaceName: i.workspaceName,
            roleKey: i.roleKey,
            expiresAt: i.expiresAt.toISOString(),
          }))}
          initialToken={token}
        />
      </main>
    </I18nProvider>
  );
}
