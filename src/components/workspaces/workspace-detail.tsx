// WorkspaceDetail — epicRider Phase 4 (client).
// Panel anggota + aksi membership + undangan. Semua aksi → API server-side
// (permission dicek server; tombol disembunyikan/di-disable hanya UX).

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/foundation/empty-state";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserMinus, UserPlus, Users } from "lucide-react";

export interface MemberRow {
  membershipId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  status: string;
  roleKeys: string[];
  isSelf: boolean;
}

export interface InvitationRow {
  id: string;
  contactTarget: string;
  roleKey: string;
  expiresAt: string;
  status: string;
}

export function WorkspaceDetail({
  workspaceId,
  workspaceName,
  canInvite,
  canSuspend,
  canRemove,
  members,
  invitations,
}: {
  workspaceId: string;
  workspaceName: string;
  canInvite: boolean;
  canSuspend: boolean;
  canRemove: boolean;
  members: MemberRow[];
  invitations: InvitationRow[];
}) {
  const { t, formatDate } = useI18n();
  const router = useRouter();
  const { toast } = useToast();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function createInvitation() {
    setInviting(true);
    setInviteError(null);
    setInviteLink(null);
    try {
      const result = await apiFetch<{ token: string }>(
        `/api/v1/workspaces/${workspaceId}/invitations`,
        {
          method: "POST",
          body: JSON.stringify({ contactTarget: inviteEmail.trim(), roleKey: "member" }),
        }
      );
      const base = typeof window !== "undefined" ? window.location.origin : "";
      setInviteLink(`${base}/invitations?token=${result.token}`);
      setInviteEmail("");
      router.refresh();
    } catch (e) {
      setInviteError(e instanceof ApiClientError ? e.message : t("members.inviteError"));
    } finally {
      setInviting(false);
    }
  }

  async function memberAction(membershipId: string, action: "suspend" | "reactivate" | "remove") {
    const confirmMessage =
      action === "remove" ? t("members.confirmRemove") : t("members.confirmSuspend");
    if (!window.confirm(confirmMessage)) return;
    setBusyId(membershipId);
    try {
      await apiFetch(`/api/v1/workspaces/${workspaceId}/members/${membershipId}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      toast({ title: t("members.actionSuccess") });
      router.refresh();
    } catch (e) {
      toast({
        title: t("members.actionError"),
        description: e instanceof ApiClientError ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function revokeInvitation(invitationId: string) {
    setBusyId(invitationId);
    try {
      await apiFetch(`/api/v1/workspaces/${workspaceId}/invitations/${invitationId}`, {
        method: "DELETE",
      });
      toast({ title: t("members.revoked") });
      router.refresh();
    } catch (e) {
      toast({
        title: t("members.actionError"),
        description: e instanceof ApiClientError ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function leaveWorkspace() {
    if (!window.confirm(t("members.leaveConfirm"))) return;
    try {
      await apiFetch(`/api/v1/workspaces/${workspaceId}/members/leave`, { method: "POST" });
      toast({ title: t("members.leaveSuccess") });
      router.push("/workspaces");
      router.refresh();
    } catch (e) {
      toast({
        title: t("members.actionError"),
        description: e instanceof ApiClientError ? e.message : undefined,
        variant: "destructive",
      });
    }
  }

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      ACTIVE: t("members.statusActive"),
      SUSPENDED: t("members.statusSuspended"),
      INVITED: t("members.statusInvited"),
      REMOVED: t("members.statusRemoved"),
      LEFT: t("members.statusLeft"),
      PENDING: t("members.statusInvited"),
      EXPIRED: t("invitations.expired"),
      REVOKED: t("members.revoked"),
    };
    return map[status] ?? status;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{workspaceName}</h1>
          <p className="text-sm text-muted-foreground">{t("members.title")}</p>
        </div>
        <div className="flex gap-2">
          {canInvite && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus aria-hidden="true" className="mr-2 size-4" />
                  {t("members.inviteButton")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("members.inviteTitle")}</DialogTitle>
                  <DialogDescription>{t("members.inviteRoleLabel")}: member</DialogDescription>
                </DialogHeader>
                <div className="grid gap-2 py-2">
                  <Label htmlFor="invite-email">{t("members.inviteEmailLabel")}</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    placeholder={t("members.inviteEmailPlaceholder")}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    aria-invalid={inviteError ? true : undefined}
                    aria-describedby={inviteError ? "invite-email-error" : undefined}
                  />
                  {inviteError && (
                    <p id="invite-email-error" role="alert" className="text-sm text-destructive">
                      {inviteError}
                    </p>
                  )}
                  {inviteLink && (
                    <div className="rounded-md border bg-muted/40 p-3 text-sm">
                      <p className="mb-2">{t("members.inviteCreated")}</p>
                      <div className="flex items-center gap-2">
                        <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
                          {inviteLink}
                        </code>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            void navigator.clipboard?.writeText(inviteLink);
                            toast({ title: t("members.inviteCopied") });
                          }}
                        >
                          {t("members.inviteCopy")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviting}>
                    {t("workspaces.cancel")}
                  </Button>
                  <Button onClick={() => void createInvitation()} disabled={inviting}>
                    {inviting && <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin" />}
                    {t("members.inviteCreate")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" onClick={() => void leaveWorkspace()}>
            <UserMinus aria-hidden="true" className="mr-2 size-4" />
            {t("members.leaveWorkspace")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("members.title")}</CardTitle>
          <CardDescription>
            {members.length} {t("workspaces.memberCount")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <EmptyState title={t("members.listEmpty")} icon={Users} />
          ) : (
            <ul className="divide-y divide-border">
              {members.map((m) => (
                <li key={m.membershipId} className="flex flex-wrap items-center gap-3 py-3">
                  <Avatar className="size-9">
                    {m.image && <AvatarImage src={m.image} alt="" />}
                    <AvatarFallback>
                      {(m.name ?? m.email ?? "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {m.name ?? m.email ?? "—"}
                      {m.isSelf && <span className="ml-2 text-xs text-muted-foreground">({t("members.you")})</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{m.email ?? "—"}</p>
                  </div>
                  <Badge variant={m.status === "ACTIVE" ? "default" : "secondary"}>
                    {statusBadge(m.status)}
                  </Badge>
                  <Badge variant="outline">
                    {m.roleKeys.includes("owner") ? t("members.roleOwner") : t("members.roleMember")}
                  </Badge>
                  {!m.isSelf && m.status === "ACTIVE" && (canSuspend || canRemove) && (
                    <div className="flex gap-1">
                      {canSuspend && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === m.membershipId}
                          onClick={() => void memberAction(m.membershipId, "suspend")}
                        >
                          {t("members.actionSuspend")}
                        </Button>
                      )}
                      {canRemove && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          disabled={busyId === m.membershipId}
                          onClick={() => void memberAction(m.membershipId, "remove")}
                        >
                          {t("members.actionRemove")}
                        </Button>
                      )}
                    </div>
                  )}
                  {!m.isSelf && m.status === "SUSPENDED" && canSuspend && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === m.membershipId}
                      onClick={() => void memberAction(m.membershipId, "reactivate")}
                    >
                      {t("members.actionReactivate")}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {canInvite && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("members.invitationsTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {invitations.length === 0 ? (
              <EmptyState title={t("members.invitationsEmpty")} />
            ) : (
              <ul className="divide-y divide-border">
                {invitations.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{i.contactTarget}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("members.invitationExpires")}: {formatDate(new Date(i.expiresAt))}
                      </p>
                    </div>
                    <Badge variant="outline">{i.roleKey === "owner" ? t("members.roleOwner") : t("members.roleMember")}</Badge>
                    <Badge variant={i.status === "PENDING" ? "secondary" : "outline"}>
                      {statusBadge(i.status)}
                    </Badge>
                    {i.status === "PENDING" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        disabled={busyId === i.id}
                        onClick={() => void revokeInvitation(i.id)}
                      >
                        {t("members.revoke")}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
