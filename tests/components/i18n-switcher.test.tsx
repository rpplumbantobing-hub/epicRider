// Component test language switcher via I18nProvider — epicRider (Phase 3).
// `router.refresh()` di-mock (tidak ada server di jsdom); perubahan string datang
// dari state locale di provider; cookie diverifikasi langsung di document.cookie.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider, useI18n } from "@/i18n/provider";
import { LOCALE_COOKIE } from "@/i18n/config";
import { dictionary as idDictionary } from "@/i18n/dictionaries/id";

const { refreshSpy } = vi.hoisted(() => ({ refreshSpy: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshSpy }),
}));

function Harness() {
  const { locale, t, setLocale } = useI18n();
  return (
    <div>
      <h1>{t("showcase.title")}</h1>
      <p data-testid="active-locale">{locale}</p>
      <p data-testid="retry-label">{t("common.retry")}</p>
      <button type="button" onClick={() => setLocale("en")}>
        switch-en
      </button>
      <button type="button" onClick={() => setLocale("id")}>
        switch-id
      </button>
    </div>
  );
}

function clearLocaleCookie() {
  document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0`;
}

describe("I18nProvider + setLocale (language switcher)", () => {
  beforeEach(() => {
    clearLocaleCookie();
    refreshSpy.mockClear();
  });

  afterEach(() => {
    clearLocaleCookie();
  });

  it("render awal memakai locale id (default) — judul bahasa Indonesia", () => {
    render(
      <I18nProvider locale="id" dictionary={idDictionary}>
        <Harness />
      </I18nProvider>
    );

    expect(screen.getByTestId("active-locale")).toHaveTextContent("id");
    expect(
      screen.getByRole("heading", { name: idDictionary.showcase.title })
    ).toBeInTheDocument();
    expect(screen.getByTestId("retry-label")).toHaveTextContent("Coba lagi");
  });

  it("setLocale('en') → string berubah ke EN, cookie diperbarui, router.refresh dipanggil", async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider locale="id" dictionary={idDictionary}>
        <Harness />
      </I18nProvider>
    );

    await user.click(screen.getByRole("button", { name: "switch-en" }));

    expect(screen.getByTestId("active-locale")).toHaveTextContent("en");
    expect(screen.getByTestId("retry-label")).toHaveTextContent("Retry");
    expect(document.cookie).toContain(`${LOCALE_COOKIE}=en`);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it("kembali ke id → string kembali ke bahasa Indonesia", async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider locale="id" dictionary={idDictionary}>
        <Harness />
      </I18nProvider>
    );

    await user.click(screen.getByRole("button", { name: "switch-en" }));
    expect(screen.getByTestId("retry-label")).toHaveTextContent("Retry");

    await user.click(screen.getByRole("button", { name: "switch-id" }));
    expect(screen.getByTestId("active-locale")).toHaveTextContent("id");
    expect(screen.getByTestId("retry-label")).toHaveTextContent("Coba lagi");
    expect(document.cookie).toContain(`${LOCALE_COOKIE}=id`);
    expect(refreshSpy).toHaveBeenCalledTimes(2);
  });
});
