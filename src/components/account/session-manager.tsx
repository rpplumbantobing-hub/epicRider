// SessionManager — epicRider Phase 4 (client). Profil minimal + daftar sesi/
// perangkat + revoke satu/semua + sign out (REQ-048).

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/foundation/empty-state";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, MonitorSmartphone } from "lucide-react";

export interface SessionRow {
  id: string;
  deviceLabel: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
  isCurrent: boolean;
}

export function SessionManager({
  profile,
  initialSessions,
}: {
  profile: { name: string | null; email: string | null; image: string | null };
  initialSessions: SessionRow[];
}) {
  const { t, formatDate } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function revokeOne(sessionId: string) {
    setBusyId(sessionId);
    try {
      await apiFetch(`/api/v1/me/sessions/${sessionId}`, { method: "DELETE" });
      toast({ title: t("sessions.revokeSuccess") });
      // Bila sesi ini yang dicabut → kini tak terautentikasi.
      const current = initialSessions.find((s) => s.id === sessionId)?.isCurrent;
      if (current) {
        window.location.assign("/login?signedOut=1");
        return;
      }
      router.refresh();
    } catch (e) {
      toast({
        title: t("sessions.revokeError"),
        description: e instanceof ApiClientError ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function revokeAll() {
    if (!window.confirm(t("sessions.revokeAllConfirm"))) return;
    setBusyId("all");
    try {
      await apiFetch("/api/v1/me/sessions", { method: "DELETE" });
      window.location.assign("/login?signedOut=1");
    } catch (e) {
      toast({
        title: t("sessions.revokeError"),
        description: e instanceof ApiClientError ? e.message : undefined,
        variant: "destructive",
      });
      setBusyId(null);
    }
  }

  async function signOutAll() {
    await signOut({ callbackUrl: "/login?signedOut=1" });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("sessions.title")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("sessions.profileTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              {profile.image && <AvatarImage src={profile.image} alt="" />}
              <AvatarFallback>
                {(profile.name ?? profile.email ?? "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div>
                <Label className="text-xs text-muted-foreground">{t("sessions.profileName")}</Label>
                <p className="text-sm font-medium">{profile.name ?? "—"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t("sessions.profileEmail")}</Label>
                <p className="text-sm font-medium">{profile.email ?? "—"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{t("sessions.sessionsTitle")}</CardTitle>
            <CardDescription>
              {initialSessions.length} {t("workspaces.memberCount")}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={busyId !== null}
              onClick={() => void revokeAll()}
            >
              {busyId === "all" && <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin" />}
              {t("sessions.revokeAll")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => void signOutAll()}>
              <LogOut aria-hidden="true" className="mr-2 size-4" />
              {t("sessions.signOut")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {initialSessions.length === 0 ? (
            <EmptyState title={t("sessions.sessionsEmpty")} icon={MonitorSmartphone} />
          ) : (
            <ul className="divide-y divide-border">
              {initialSessions.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {s.deviceLabel ?? t("sessions.device")}
                      {s.isCurrent && <Badge variant="secondary">{t("sessions.thisDevice")}</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("sessions.created")}: {formatDate(new Date(s.createdAt))} ·{" "}
                      {t("sessions.expires")}: {formatDate(new Date(s.expiresAt))}
                    </p>
                  </div>
                  {s.isCurrent && (
                    <Badge variant="outline" className="sr-only">
                      {t("sessions.thisDevice")}
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={busyId !== null}
                    onClick={() => void revokeOne(s.id)}
                  >
                    {t("sessions.revoke")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
