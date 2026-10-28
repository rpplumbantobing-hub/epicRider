// StatusBadge — komponen fondasi epicRider (Phase 3).
// Presentational: label (string yang sudah dilokalkan) dikirim lewat props.
// Prinsip aksesibilitas: ikon + teks, TIDAK warna saja; warna memakai token status globals.css.

import * as React from "react";
import { AlertTriangle, CheckCircle2, Circle, Info, XCircle, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "info" | "danger" | "neutral";

type ToneConfig = {
  icon: LucideIcon;
  /** Kelas warna dari token semantik (bukan literal). */
  className: string;
};

const toneConfig: Record<StatusTone, ToneConfig> = {
  success: {
    icon: CheckCircle2,
    className: "border-transparent bg-success text-success-foreground",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-transparent bg-warning text-warning-foreground",
  },
  info: {
    icon: Info,
    className: "border-transparent bg-info text-info-foreground",
  },
  danger: {
    icon: XCircle,
    className: "border-transparent bg-destructive text-white",
  },
  neutral: {
    icon: Circle,
    className: "border-transparent bg-secondary text-secondary-foreground",
  },
};

export function StatusBadge({
  tone,
  children,
  className,
}: {
  /** Nuansa status — menentukan ikon + token warna. */
  tone: StatusTone;
  /** Teks badge (sudah dilokalkan, mis. hasil t("status.active")). */
  children: React.ReactNode;
  className?: string;
}) {
  const config = toneConfig[tone];
  const Icon = config.icon;

  return (
    <Badge data-tone={tone} className={cn(config.className, className)}>
      <Icon aria-hidden="true" focusable="false" />
      {children}
    </Badge>
  );
}
