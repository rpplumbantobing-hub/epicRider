// Route `/` — satu-satunya route yang terlihat user di sandbox.
// Server component: baca locale dari cookie (ADR-020), render provider + showcase client.

import { Showcase } from "@/components/foundation/showcase";
import { dictionaries } from "@/i18n/dictionaries";
import { I18nProvider } from "@/i18n/provider";
import { getLocale } from "@/i18n/server";

export default async function Home() {
  const locale = await getLocale();
  const dictionary = dictionaries[locale];

  return (
    <I18nProvider locale={locale} dictionary={dictionary}>
      <div className="flex min-h-screen flex-col">
        <Showcase />
      </div>
    </I18nProvider>
  );
}
