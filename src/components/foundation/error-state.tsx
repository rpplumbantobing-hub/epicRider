// ErrorState — komponen fondasi epicRider (Phase 3).
// Presentational & props-driven: string terlokalisasi + callback retry dari pemanggil.

import * as React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ErrorState({
  title,
  description,
  onRetry,
  retrying = false,
  retryLabel,
  className,
}: {
  /** Judul (string terlokalisasi). */
  title: string;
  /** Deskripsi opsional (string terlokalisasi). */
  description?: string;
  /** Callback ketika tombol retry ditekan. Tombol hanya muncul bila callback ada. */
  onRetry?: () => void;
  /** true = tombol retry nonaktif + spinner (mis. saat request berjalan). */
  retrying?: boolean;
  /** Label tombol retry — wajib agar tombol selalu punya accessible name. */
  retryLabel: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-card px-6 py-10 text-center",
        className
      )}
    >
      <AlertTriangle aria-hidden="true" focusable="false" className="size-8 text-destructive" />
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          disabled={retrying}
          aria-busy={retrying}
          onClick={onRetry}
        >
          {retrying ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
