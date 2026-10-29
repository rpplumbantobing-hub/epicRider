// WorkspaceList — epicRider Phase 4 (client). Daftar workspace + create flow.
// Data sudah ter-filter server-side via membership (isolation by construction).

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
import { EmptyState } from "@/components/foundation/empty-state";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Users } from "lucide-react";
import Link from "next/link";

export interface WorkspaceItem {
  id: string;
  name: string;
  status: string;
  roleKeys: string[];
  activeMemberCount: number;
}

export function WorkspaceList({ initial }: { initial: WorkspaceItem[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createWorkspace() {
    if (!name.trim()) {
      setError(t("errors.generic"));
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await apiFetch("/api/v1/workspaces", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      toast({ title: t("workspaces.createSuccess") });
      setOpen(false);
      setName("");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : t("workspaces.createError"));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("workspaces.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("workspaces.subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus aria-hidden="true" className="mr-2 size-4" />
              {t("workspaces.createButton")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("workspaces.createTitle")}</DialogTitle>
              <DialogDescription>{t("workspaces.subtitle")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-2">
              <Label htmlFor="workspace-name">{t("workspaces.nameLabel")}</Label>
              <Input
                id="workspace-name"
                value={name}
                placeholder={t("workspaces.namePlaceholder")}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "workspace-name-error" : undefined}
                maxLength={80}
              />
              {error && (
                <p id="workspace-name-error" role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>
                {t("workspaces.cancel")}
              </Button>
              <Button onClick={() => void createWorkspace()} disabled={creating}>
                {creating && <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin" />}
                {t("workspaces.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {initial.length === 0 ? (
        <EmptyState
          title={t("workspaces.empty")}
          description={t("workspaces.emptyDescription")}
          icon={Users}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {initial.map((w) => (
            <Card key={w.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{w.name}</CardTitle>
                  <Badge variant="secondary">
                    {w.roleKeys.includes("owner") ? t("members.roleOwner") : t("members.roleMember")}
                  </Badge>
                </div>
                <CardDescription>
                  {w.activeMemberCount} {t("workspaces.memberCount")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/workspaces/${w.id}`}>{t("workspaces.open")}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
