// InvitationList — epicRider Phase 4 (client). Undangan milik user (matched
// server-side via email). Mendukung: (1) terima dari daftar (by id);
// (2) tautan ?token= → auto-accept dengan identitas terautentikasi
// (kepemilikan URL saja tidak cukup — REQ-051).

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EmptyState } from "@/components/foundation/empty-state";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2, MailCheck, ShieldAlert } from "lucide-react";

export interface MyInvitationRow {
  id: string;
  workspaceId: string;
  workspaceName: string;
  roleKey: string;
  expiresAt: string;
}

export function InvitationList({
  initial,
  initialToken,
}: {
  initial: MyInvitationRow[];
  initialToken: string | null;
}) {
  const { t, formatDate } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const acceptById = useCallback(
    async (invitationId: string) => {
      setBusyId(invitationId);
      try {
        const result = await apiFetch<{ workspaceName: string }>(
          `/api/v1/me/invitations/${invitationId}/accept`,
          { method: "POST" }
        );
        toast({ title: t("invitations.accepted"), description: result.workspaceName });
        router.push("/workspaces");
        router.refresh();
      } catch (e) {
        toast({
          title: t("invitations.acceptError"),
          description: e instanceof ApiClientError ? e.message : undefined,
          variant: "destructive",
        });
      } finally {
        setBusyId(null);
      }
    },
    [router, t, toast]
  );

  const acceptByToken = useCallback(
    async (token: string) => {
      setBusyId("token");
      try {
        const result = await apiFetch<{ workspaceName: string }>("/api/v1/me/invitations/accept", {
          method: "POST",
          body: JSON.stringify({ token }),
        });
        toast({ title: t("invitations.accepted"), description: result.workspaceName });
        router.push("/workspaces");
        router.refresh();
      } catch (e) {
        setTokenError(e instanceof ApiClientError ? e.message : t("invitations.acceptError"));
      } finally {
        setBusyId(null);
      }
    },
    [router, t, toast]
  );

  // Tautan undangan dibuka (?token=…) → coba terima dengan identitas aktif.
  // (acceptByToken sengaja tidak masuk deps: hanya berjalan sekali per token.)
  useEffect(() => {
    if (initialToken) {
      void acceptByToken(initialToken);
    }
  }, [initialToken]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("invitations.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("invitations.subtitle")}</p>
      </div>

      {initialToken && !tokenError && (
        <Alert>
          {busyId === "token" ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <MailCheck aria-hidden="true" className="size-4" />
          )}
          <AlertTitle>{t("invitations.openToken")}</AlertTitle>
        </Alert>
      )}
      {tokenError && (
        <Alert variant="destructive">
          <ShieldAlert aria-hidden="true" className="size-4" />
          <AlertTitle>{t("invitations.invalidToken")}</AlertTitle>
          <AlertDescription>{tokenError}</AlertDescription>
        </Alert>
      )}

      {initial.length === 0 ? (
        <EmptyState title={t("invitations.empty")} icon={MailCheck} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {initial.map((i) => (
            <Card key={i.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{i.workspaceName}</CardTitle>
                  <Badge variant="outline">
                    {i.roleKey === "owner" ? t("members.roleOwner") : t("members.roleMember")}
                  </Badge>
                </div>
                <CardDescription>
                  {t("members.invitationExpires")}: {formatDate(new Date(i.expiresAt))}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  disabled={busyId !== null}
                  onClick={() => void acceptById(i.id)}
                >
                  {busyId === i.id ? (
                    <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Check aria-hidden="true" className="mr-2 size-4" />
                  )}
                  {t("invitations.accept")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
