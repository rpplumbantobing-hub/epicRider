// Navigasi aplikasi minimal — epicRider Phase 4.
// Server component: membaca locale + dictionary sendiri (di luar I18nProvider
// halaman). Hanya tautan — TIDAK ada kontrol keamanan di sini (middleware/
// guard server tetap penjaga sebenarnya; MC §2: UI hiding bukan security control).

import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { dictionaries } from "@/i18n/dictionaries";
import { createTranslator } from "@/i18n/translate";

export async function AppNav() {
  const locale = await getLocale();
  const t = createTranslator(dictionaries[locale]);

  return (
    <nav
      aria-label="Navigasi utama"
      className="border-b border-border bg-card/60 backdrop-blur"
    >
      <div className="mx-auto flex h-12 w-full max-w-6xl items-center gap-1 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="rounded-md px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t("nav.home")}
        </Link>
        <Link
          href="/workspaces"
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t("nav.workspaces")}
        </Link>
        <Link
          href="/account"
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t("nav.account")}
        </Link>
      </div>
    </nav>
  );
}
