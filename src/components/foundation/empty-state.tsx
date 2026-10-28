// EmptyState — komponen fondasi epicRider (Phase 3).
// Presentational & props-driven: semua string dikirim dari pemanggil (sudah dilokalkan via t()).

import * as React from "react";
import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  /** Ikon lucide (opsional; default Inbox). Dekoratif — aria-hidden. */
  icon?: LucideIcon;
  /** Judul (string terlokalisasi dari pemanggil). */
  title: string;
  /** Deskripsi opsional (string terlokalisasi). */
  description?: string;
  /** Elemen aksi opsional, mis. <Button>…</Button> berlabel terlokalkan. */
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center",
        className
      )}
    >
      <Icon aria-hidden="true" focusable="false" className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
