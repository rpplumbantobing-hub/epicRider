// LoginScreen — epicRider Phase 4 (client).
//
// Status provider JUJUR dari server (props): Google aktif hanya bila
// kredensial env tersedia; WhatsApp menampilkan status vendor belum dipilih
// (OD-03). TIDAK ada tombol palsu / sukses palsu (gated prompt §8).

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert, Smartphone } from "lucide-react";

/** Switcher bahasa compact (pola sama dengan showcase Phase 3 — ADR-020). */
function LoginLanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div role="group" aria-label={t("common.switchLanguage")} className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={locale === "id" ? "default" : "outline"}
        aria-pressed={locale === "id"}
        aria-label={`${t("common.switchLanguage")}: ID`}
        onClick={() => setLocale("id")}
      >
        ID
      </Button>
      <Button
        type="button"
        size="sm"
        variant={locale === "en" ? "default" : "outline"}
        aria-pressed={locale === "en"}
        aria-label={`${t("common.switchLanguage")}: EN`}
        onClick={() => setLocale("en")}
      >
        EN
      </Button>
    </div>
  );
}

export function LoginScreen({
  googleConfigured,
  nextPath,
  showExpired,
  showSignedOut,
  oauthError,
}: {
  googleConfigured: boolean;
  nextPath: string | null;
  showExpired: boolean;
  showSignedOut: boolean;
  oauthError: boolean;
}) {
  const { t } = useI18n();
  const [signingIn, setSigningingIn] = useState(false);

  const callbackUrl = nextPath && nextPath.startsWith("/") ? nextPath : "/workspaces";

  return (
    <main className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        <div className="flex justify-end">
          <LoginLanguageSwitcher />
        </div>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">{t("auth.title")}</CardTitle>
            <CardDescription>{t("auth.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            {showExpired && (
              <Alert className="mb-4">
                <ShieldAlert aria-hidden="true" className="size-4" />
                <AlertTitle>{t("auth.sessionExpired")}</AlertTitle>
              </Alert>
            )}
            {showSignedOut && (
              <Alert className="mb-4">
                <ShieldAlert aria-hidden="true" className="size-4" />
                <AlertTitle>{t("auth.signedOut")}</AlertTitle>
              </Alert>
            )}
            {oauthError && (
              <Alert variant="destructive" className="mb-4">
                <ShieldAlert aria-hidden="true" className="size-4" />
                <AlertTitle>{t("auth.signInError")}</AlertTitle>
              </Alert>
            )}

            <Tabs defaultValue="google">
              <TabsList className="grid w-full grid-cols-2" aria-label={t("auth.title")}>
                <TabsTrigger value="google">{t("auth.googleTab")}</TabsTrigger>
                <TabsTrigger value="whatsapp">{t("auth.whatsappTab")}</TabsTrigger>
              </TabsList>

              <TabsContent value="google" className="mt-4 space-y-3">
                {googleConfigured ? (
                  <Button
                    className="w-full"
                    onClick={() => {
                      setSigningingIn(true);
                      void signIn("google", { callbackUrl });
                    }}
                    disabled={signingIn}
                  >
                    {signingIn && <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin" />}
                    {t("auth.googleButton")}
                  </Button>
                ) : (
                  <Alert>
                    <ShieldAlert aria-hidden="true" className="size-4" />
                    <AlertTitle>{t("auth.googleNotConfiguredTitle")}</AlertTitle>
                    <AlertDescription>{t("auth.googleNotConfiguredDetail")}</AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="whatsapp" className="mt-4 space-y-3">
                <Alert>
                  <Smartphone aria-hidden="true" className="size-4" />
                  <AlertTitle className="flex items-center gap-2">
                    {t("auth.whatsappNotConfiguredTitle")}
                    <Badge variant="outline">OD-03</Badge>
                  </AlertTitle>
                  <AlertDescription>{t("auth.whatsappNotConfiguredDetail")}</AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
