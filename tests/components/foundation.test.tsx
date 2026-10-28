// Component test komponen fondasi — epicRider (Phase 3).
// Komponen presentational: string dikirim via props; asersi memakai role/nama aksesibel & teks.

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "@/components/foundation/empty-state";
import { ErrorState } from "@/components/foundation/error-state";
import { PermissionDenied } from "@/components/foundation/permission-denied";
import { StatusBadge } from "@/components/foundation/status-badge";

describe("EmptyState", () => {
  it("merender title, description, dan action dengan nama aksesibel", () => {
    render(
      <EmptyState
        title="Belum ada data"
        description="Daftar masih kosong."
        action={<button type="button">Buat item</button>}
      />
    );

    const region = screen.getByRole("status");
    expect(region).toBeInTheDocument();
    expect(screen.getByText("Belum ada data")).toBeInTheDocument();
    expect(screen.getByText("Daftar masih kosong.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buat item" })).toBeInTheDocument();
  });

  it("tanpa description dan action → hanya title yang dirender", () => {
    render(<EmptyState title="Kosong" />);
    const region = screen.getByRole("status");
    expect(region).toHaveTextContent("Kosong");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("ErrorState", () => {
  it("merender title/description dan tombol retry; klik memanggil onRetry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <ErrorState
        title="Terjadi kendala"
        description="Coba lagi."
        onRetry={onRetry}
        retryLabel="Coba lagi"
      />
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Terjadi kendala")).toBeInTheDocument();
    const retryButton = screen.getByRole("button", { name: "Coba lagi" });
    expect(retryButton).toBeEnabled();

    await user.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("retrying=true → tombol disabled (dengan spinner, bukan warna saja)", () => {
    const onRetry = vi.fn();
    render(<ErrorState title="Gagal" onRetry={onRetry} retrying retryLabel="Coba lagi" />);

    const retryButton = screen.getByRole("button", { name: "Coba lagi" });
    expect(retryButton).toBeDisabled();
    expect(retryButton).toHaveAttribute("aria-busy", "true");
    // Spinner dirender sebagai svg (indikator non-warna).
    expect(retryButton.querySelector("svg")).not.toBeNull();
  });
});

describe("PermissionDenied", () => {
  it("merender title, description, dan resource", () => {
    render(
      <PermissionDenied
        title="Akses ditolak"
        description="Anda tidak punya izin."
        resource="workspace/abc"
      />
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Akses ditolak")).toBeInTheDocument();
    expect(screen.getByText("Anda tidak punya izin.")).toBeInTheDocument();
    expect(screen.getByText("workspace/abc")).toBeInTheDocument();
  });
});

describe("StatusBadge", () => {
  it("merender teks + ikon (bukan warna saja) untuk tiap tone", () => {
    const tones = ["success", "warning", "info", "danger", "neutral"] as const;
    const { container } = render(
      <div>
        {tones.map((tone) => (
          <StatusBadge key={tone} tone={tone}>
            {tone}
          </StatusBadge>
        ))}
      </div>
    );

    const badges = container.querySelectorAll("[data-slot='badge']");
    expect(badges).toHaveLength(tones.length);
    for (const badge of badges) {
      // Setiap badge punya ikon svg (indikator non-warna) dan data-tone.
      expect(badge.querySelector("svg")).not.toBeNull();
      expect(badge.getAttribute("data-tone")).not.toBeNull();
    }
  });

  it("mengganti tone → ikon berubah (perbandingan glyph, bukan warna) + data-tone ikut", () => {
    const { container, rerender } = render(<StatusBadge tone="success">Status</StatusBadge>);

    const badge = container.querySelector("[data-slot='badge']");
    expect(badge?.getAttribute("data-tone")).toBe("success");
    const successIcon = badge?.querySelector("svg")?.outerHTML ?? "";
    expect(successIcon).not.toBe("");

    rerender(<StatusBadge tone="danger">Status</StatusBadge>);
    expect(badge?.getAttribute("data-tone")).toBe("danger");
    const dangerIcon = badge?.querySelector("svg")?.outerHTML ?? "";

    expect(dangerIcon).not.toBe(successIcon);

    rerender(<StatusBadge tone="warning">Status</StatusBadge>);
    const warningIcon = badge?.querySelector("svg")?.outerHTML ?? "";
    expect(warningIcon).not.toBe(successIcon);
    expect(warningIcon).not.toBe(dangerIcon);
  });
});
