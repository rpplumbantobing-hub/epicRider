// /workspaces/[workspaceId] — epicRider Phase 4. Server component:
// tenant scope dari PATH + membership terverifikasi (D-6). Non-member →
// PermissionDenied (keberadaan workspace tidak dibocorkan).

import { redirect } from "next/navigation";
import { getAuthContext, effectivePermissionsInWorkspace } from "@/lib/authz/guards";
import { getWorkspaceForMember } from "@/lib/workspaces/service";
import { listMembers } from "@/lib/memberships/service";
import { listInvitations } from "@/lib/invitations/service";
import { db } from "@/lib/db";
import { WorkspaceDetail } from "@/components/workspaces/workspace-detail";
import { PermissionDenied } from "@/components/foundation/permission-denied";
import { dictionaries } from "@/i18n/dictionaries";
import { I18nProvider } from "@/i18n/provider";
import { getLocale } from "@/i18n/server";
import { createTranslator } from "@/i18n/translate";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const auth = await getAuthContext();
  if (!auth) {
    redirect(`/login?next=/workspaces/${workspaceId}`);
  }

  const workspace = await getWorkspaceForMember(db, { workspaceId, userId: auth.userId });
  const locale = await getLocale();
  const t = createTranslator(dictionaries[locale]);

  if (!workspace || !workspace.permissions.includes("workspace.read")) {
    // Enumeration resistance: member tanpa akses & non-member → tampilan sama.
    return (
      <I18nProvider locale={locale} dictionary={dictionaries[locale]}>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <PermissionDenied
            title={t("members.permissionDeniedMembers")}
            description={t("auth.loginRequired")}
          />
        </main>
      </I18nProvider>
    );
  }

  const [members, invitations, permissions] = await Promise.all([
    workspace.permissions.includes("membership.read")
      ? listMembers(db, workspaceId, auth.userId)
      : Promise.resolve([]),
    workspace.permissions.includes("workspace.member.invite")
      ? listInvitations(db, workspaceId)
      : Promise.resolve([]),
    effectivePermissionsInWorkspace(auth.userId, workspaceId, db),
  ]);

  return (
    <I18nProvider locale={locale} dictionary={dictionaries[locale]}>
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <WorkspaceDetail
          workspaceId={workspaceId}
          workspaceName={workspace.name}
          canInvite={permissions.has("workspace.member.invite")}
          canSuspend={permissions.has("workspace.member.suspend")}
          canRemove={permissions.has("workspace.member.remove")}
          members={members.map((m) => ({
            membershipId: m.membershipId,
            name: m.name,
            email: m.email,
            image: m.image,
            status: m.status,
            roleKeys: m.roleKeys,
            isSelf: m.isSelf,
          }))}
          invitations={invitations.map((i) => ({
            id: i.id,
            contactTarget: i.contactTarget,
            roleKey: i.roleKey,
            expiresAt: i.expiresAt.toISOString(),
            status: i.status,
          }))}
        />
      </main>
    </I18nProvider>
  );
}
