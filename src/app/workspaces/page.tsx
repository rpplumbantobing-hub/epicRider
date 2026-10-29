// /workspaces — epicRider Phase 4. Server component: guard sesi (redirect ke
// /login bila tidak ada); data workspace VIA membership (isolation by
// construction); banner undangan menunggu.

import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/authz/guards";
import { listWorkspacesForUser } from "@/lib/workspaces/service";
import { listMyPendingInvitations } from "@/lib/invitations/service";
import { db } from "@/lib/db";
import { WorkspaceList } from "@/components/workspaces/workspace-list";
import { dictionaries } from "@/i18n/dictionaries";
import { I18nProvider } from "@/i18n/provider";
import { getLocale } from "@/i18n/server";
import { createTranslator } from "@/i18n/translate";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail } from "lucide-react";

export default async function WorkspacesPage() {
  const auth = await getAuthContext();
  if (!auth) {
    redirect("/login?next=/workspaces");
  }

  const [workspaces, invitations] = await Promise.all([
    listWorkspacesForUser(db, auth.userId),
    listMyPendingInvitations(db, { userId: auth.userId, email: auth.user.email }),
  ]);

  const locale = await getLocale();
  const t = createTranslator(dictionaries[locale]);

  return (
    <I18nProvider locale={locale} dictionary={dictionaries[locale]}>
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {invitations.length > 0 && (
          <Alert>
            <Mail aria-hidden="true" className="size-4" />
            <AlertTitle>{t("workspaces.invitationsBanner")}</AlertTitle>
            <AlertDescription>
              <Link href="/invitations" className="font-medium underline underline-offset-4">
                {t("workspaces.viewInvitations")}
              </Link>
            </AlertDescription>
          </Alert>
        )}
        <WorkspaceList
          initial={workspaces.map((w) => ({
            id: w.id,
            name: w.name,
            status: w.status,
            roleKeys: w.roleKeys,
            activeMemberCount: w.activeMemberCount,
          }))}
        />
      </main>
    </I18nProvider>
  );
}
