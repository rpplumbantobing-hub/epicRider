// PermissionDenied — komponen fondasi epicRider (Phase 3).
// Presentational & props-driven. Pola UI saja — otorisasi sebenarnya tetap di server
// (MC §4: UI hiding bukan security control; implementasi di Phase 4/5).

import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function PermissionDenied({
  title,
  description,
  resource,
  className,
}: {
  /** Judul (string terlokalisasi). */
  title: string;
  /** Deskripsi opsional (string terlokalisasi). */
  description?: string;
  /** Nama resource (opsional) yang aksesnya ditolak — ditampilkan apa adanya. */
  resource?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-warning/40 bg-card px-6 py-10 text-center",
        className
      )}
    >
      <ShieldAlert aria-hidden="true" focusable="false" className="size-8 text-warning" />
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {resource ? (
        <p className="mt-1 rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
          {resource}
        </p>
      ) : null}
    </div>
  );
}
