"use client";

// Showcase fondasi Phase 3 — epicRider.
// Satu-satunya route yang terlihat user di sandbox (`/`). Semua string lewat t() (ADR-020).
// Semua konten = DEMO (UX_UI_STANDARD §2.5): tanpa metrik bisnis palsu, tanpa klaim komersial.

import * as React from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/foundation/empty-state";
import { ErrorState } from "@/components/foundation/error-state";
import { PermissionDenied } from "@/components/foundation/permission-denied";
import { StatusBadge, type StatusTone } from "@/components/foundation/status-badge";
import { useI18n } from "@/i18n/provider";

// Tanggal demo TETAP (UTC) — render server dan klien identik, bebas hydration mismatch.
const DEMO_DATE = new Date(Date.UTC(2026, 9, 28));
const DEMO_NUMBER = 1234567.89;
const DEMO_CURRENCY = 1500000;

type DemoStateKey = "loading" | "empty" | "error" | "success" | "permission";

const DEMO_STATE_KEYS: DemoStateKey[] = ["loading", "empty", "error", "success", "permission"];

const COLOR_TOKENS: { token: string; swatchClass: string }[] = [
  { token: "background", swatchClass: "border bg-background text-foreground" },
  { token: "foreground", swatchClass: "border bg-foreground text-background" },
  { token: "card", swatchClass: "border bg-card text-card-foreground" },
  { token: "muted", swatchClass: "border bg-muted text-muted-foreground" },
  { token: "primary", swatchClass: "border bg-primary text-primary-foreground" },
  { token: "secondary", swatchClass: "border bg-secondary text-secondary-foreground" },
  { token: "accent", swatchClass: "border bg-accent text-accent-foreground" },
  { token: "destructive", swatchClass: "border bg-destructive text-white" },
  { token: "success", swatchClass: "border bg-success text-success-foreground" },
  { token: "warning", swatchClass: "border bg-warning text-warning-foreground" },
  { token: "info", swatchClass: "border bg-info text-info-foreground" },
];

const TYPOGRAPHY_SIZES = ["text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl"] as const;

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-6" aria-labelledby={slugify(title)}>
      <div className="mb-4">
        <h2 id={slugify(title)} className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
        {note ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function LanguageSwitcher() {
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

function ColorsSection() {
  const { t } = useI18n();
  return (
    <Section title={t("showcase.sectionColors")} note={t("showcase.colorsNote")}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {COLOR_TOKENS.map(({ token, swatchClass }) => (
          <div key={token} className="rounded-xl border bg-card p-6">
            <div className={swatchClass + " flex h-16 items-center justify-center rounded-lg text-sm font-medium"}>
              {t("showcase.colorDemoText")}
            </div>
            <p className="mt-3 font-mono text-xs text-muted-foreground">--{token}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function TypographySection() {
  const { t } = useI18n();
  return (
    <Section title={t("showcase.sectionTypography")} note={t("showcase.typographyNote")}>
      <div className="rounded-xl border bg-card p-6">
        <ul className="space-y-4">
          {TYPOGRAPHY_SIZES.map((size) => (
            <li key={size} className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
              <span className="w-20 shrink-0 font-mono text-xs text-muted-foreground">{size}</span>
              <span className={size}>{t("showcase.typographySample")}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

function SpacingSection() {
  const { t } = useI18n();
  return (
    <Section title={t("showcase.sectionSpacing")} note={t("showcase.spacingNote")}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-xl border bg-card">
          <div className="p-4">
            <div className="rounded-lg border border-dashed bg-muted/50 p-4 text-sm">
              {t("showcase.spacingBox4")}
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card">
          <div className="p-6">
            <div className="rounded-lg border border-dashed bg-muted/50 p-6 text-sm">
              {t("showcase.spacingBox6")}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function ButtonsSection() {
  const { t } = useI18n();
  return (
    <Section title={t("showcase.sectionButtons")} note={t("showcase.buttonsNote")}>
      <div className="rounded-xl border bg-card p-6">
        <div className="space-y-6">
          {(["sm", "default", "lg"] as const).map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-4">
              <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">{size}</span>
              <Button type="button" size={size}>
                {t("buttons.primary")}
              </Button>
              <Button type="button" size={size} variant="secondary">
                {t("buttons.secondary")}
              </Button>
              <Button type="button" size={size} variant="outline">
                {t("buttons.outline")}
              </Button>
              <Button type="button" size={size} variant="ghost">
                {t("buttons.ghost")}
              </Button>
              <Button type="button" size={size} variant="destructive">
                {t("buttons.destructive")}
              </Button>
              <Button type="button" size={size} variant="link">
                {t("buttons.link")}
              </Button>
              <Button type="button" size={size} disabled>
                {t("buttons.disabled")}
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-4 border-t pt-6">
            <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">icon</span>
            <Button type="button" size="icon" aria-label={t("buttons.primary")}>
              <CheckCircle2 aria-hidden="true" />
            </Button>
            <Button type="button" disabled aria-live="polite">
              <Loader2 aria-hidden="true" className="animate-spin" />
              {t("buttons.loading")}
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

function FormsSection() {
  const { t } = useI18n();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<string>("");
  const [consent, setConsent] = React.useState<boolean>(false);
  const [error, setError] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const errorId = "showcase-form-error";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim() === "" || email.trim() === "") {
      setError(true);
      setSubmitted(false);
      return;
    }
    setError(false);
    setSubmitted(true);
  }

  return (
    <Section title={t("showcase.sectionForms")} note={t("showcase.formsNote")}>
      <form onSubmit={handleSubmit} noValidate className="rounded-xl border bg-card p-6">
        <fieldset className="space-y-6">
          <legend className="sr-only">{t("showcase.sectionForms")}</legend>
          <p className="text-sm text-muted-foreground">{t("forms.helpText")}</p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="showcase-name">{t("forms.nameLabel")}</Label>
              <Input
                id="showcase-name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("forms.namePlaceholder")}
                autoComplete="off"
                aria-invalid={error && name.trim() === ""}
                aria-describedby={error ? errorId : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="showcase-email">{t("forms.emailLabel")}</Label>
              <Input
                id="showcase-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("forms.emailPlaceholder")}
                autoComplete="off"
                aria-invalid={error && email.trim() === ""}
                aria-describedby={error ? errorId : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="showcase-role">{t("forms.roleLabel")}</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="showcase-role" className="w-full">
                  <SelectValue placeholder={t("forms.rolePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">{t("forms.roleOption1")}</SelectItem>
                  <SelectItem value="coordinator">{t("forms.roleOption2")}</SelectItem>
                  <SelectItem value="technician">{t("forms.roleOption3")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="showcase-notes">{t("forms.textareaLabel")}</Label>
              <Textarea id="showcase-notes" name="notes" rows={3} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="showcase-consent"
              checked={consent}
              onCheckedChange={(checked) => setConsent(checked === true)}
            />
            <Label htmlFor="showcase-consent" className="font-normal">
              {t("forms.consentLabel")}
            </Label>
          </div>
          {error ? (
            <p
              id={errorId}
              role="alert"
              className="flex items-center gap-2 text-sm font-medium text-destructive"
            >
              <AlertTriangle aria-hidden="true" focusable="false" className="size-4 shrink-0" />
              {t("forms.validationError")}
            </p>
          ) : null}
          {submitted ? (
            <p role="status" className="flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 aria-hidden="true" focusable="false" className="size-4 shrink-0" />
              {t("forms.submitSuccess")}
            </p>
          ) : null}
          <Button type="submit">{t("forms.submit")}</Button>
        </fieldset>
      </form>
    </Section>
  );
}

function StatesSection() {
  const { t } = useI18n();
  const [activeState, setActiveState] = React.useState<DemoStateKey>("loading");
  const [retrying, setRetrying] = React.useState(false);

  // Demo retry murni client-side: setelah jeda singkat "pulih" ke status sukses.
  function handleRetry() {
    setRetrying(true);
    window.setTimeout(() => {
      setRetrying(false);
      setActiveState("success");
    }, 600);
  }

  const stateLabels: Record<DemoStateKey, string> = {
    loading: t("showcase.stateLoading"),
    empty: t("showcase.stateEmpty"),
    error: t("showcase.stateError"),
    success: t("showcase.stateSuccess"),
    permission: t("showcase.statePermission"),
  };

  return (
    <Section title={t("showcase.sectionStates")} note={t("showcase.statesNote")}>
      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {t("common.demo")}
          </span>
          {DEMO_STATE_KEYS.map((key) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={activeState === key ? "default" : "outline"}
              aria-pressed={activeState === key}
              onClick={() => setActiveState(key)}
            >
              {stateLabels[key]}
            </Button>
          ))}
        </div>
        <div aria-live="polite" className="mt-6">
          {activeState === "loading" ? (
            <div className="space-y-4 rounded-lg border border-dashed px-6 py-8">
              <div className="flex items-center gap-3">
                <Loader2 aria-hidden="true" className="size-5 animate-spin text-muted-foreground" />
                <p className="text-sm font-medium">{t("states.loading")}</p>
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Progress value={60} aria-label={t("states.loading")} />
            </div>
          ) : null}
          {activeState === "empty" ? (
            <EmptyState
              title={t("states.emptyTitle")}
              description={t("states.emptyDesc")}
            />
          ) : null}
          {activeState === "error" ? (
            <ErrorState
              title={t("states.errorTitle")}
              description={t("states.errorDesc")}
              retryLabel={t("common.retry")}
              retrying={retrying}
              onRetry={handleRetry}
            />
          ) : null}
          {activeState === "success" ? (
            <Alert className="border-success/40">
              <CheckCircle2 aria-hidden="true" className="size-4 text-success" />
              <AlertTitle>{t("states.successTitle")}</AlertTitle>
              <AlertDescription>
                {t("states.successDesc")} {t("common.demoNote")}
              </AlertDescription>
            </Alert>
          ) : null}
          {activeState === "permission" ? (
            <PermissionDenied
              title={t("states.permissionTitle")}
              description={t("states.permissionDesc")}
            />
          ) : null}
        </div>
      </div>
    </Section>
  );
}

const BADGE_TONES: { tone: StatusTone; key: string }[] = [
  { tone: "success", key: "status.success" },
  { tone: "warning", key: "status.warning" },
  { tone: "info", key: "status.info" },
  { tone: "danger", key: "status.error" },
  { tone: "neutral", key: "status.draft" },
];

function BadgesSection() {
  const { t } = useI18n();
  return (
    <Section title={t("showcase.sectionBadges")} note={t("showcase.badgesNote")}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex flex-wrap items-center gap-3">
            {BADGE_TONES.map(({ tone, key }) => (
              <StatusBadge key={tone} tone={tone}>
                {t(key)}
              </StatusBadge>
            ))}
            <StatusBadge tone="neutral">{t("status.pending")}</StatusBadge>
            <StatusBadge tone="neutral">{t("status.active")}</StatusBadge>
            <StatusBadge tone="neutral">{t("status.archived")}</StatusBadge>
          </div>
        </div>
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <Alert className="border-success/40">
            <CheckCircle2 aria-hidden="true" className="size-4 text-success" />
            <AlertTitle>{t("states.successTitle")}</AlertTitle>
            <AlertDescription>{t("states.successDesc")}</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTriangle aria-hidden="true" className="size-4" />
            <AlertTitle>{t("states.errorTitle")}</AlertTitle>
            <AlertDescription>{t("states.errorDesc")}</AlertDescription>
          </Alert>
        </div>
      </div>
    </Section>
  );
}

function FormattingSection() {
  const { t, locale, formatDate, formatNumber, formatCurrency } = useI18n();
  return (
    <Section title={t("showcase.sectionFormatting")} note={t("showcase.formatNote")}>
      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-6">
          <dt className="text-sm text-muted-foreground">{t("format.dateLabel")}</dt>
          <dd className="mt-2 text-lg font-medium">
            {formatDate(DEMO_DATE, { timeZone: "UTC" })}
          </dd>
          <dd className="mt-1 font-mono text-xs text-muted-foreground">locale: {locale}</dd>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <dt className="text-sm text-muted-foreground">{t("format.numberLabel")}</dt>
          <dd className="mt-2 text-lg font-medium">{formatNumber(DEMO_NUMBER)}</dd>
          <dd className="mt-1 font-mono text-xs text-muted-foreground">locale: {locale}</dd>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <dt className="text-sm text-muted-foreground">{t("format.currencyLabel")}</dt>
          <dd className="mt-2 text-lg font-medium">{formatCurrency(DEMO_CURRENCY)}</dd>
          <dd className="mt-1 font-mono text-xs text-muted-foreground">locale: {locale}</dd>
        </div>
      </dl>
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{t("format.currencyDemoNote")}</p>
    </Section>
  );
}

function ResponsiveSection() {
  const { t } = useI18n();
  return (
    <Section title={t("showcase.sectionResponsive")} note={t("showcase.responsiveNote")}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <div
            key={n}
            className="flex h-16 items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground"
          >
            {t("showcase.responsiveCell")} {n}
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Showcase() {
  const { t } = useI18n();

  return (
    <React.Fragment>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t("common.appName")}</p>
            <h1 className="mt-1 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("showcase.title")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("showcase.subtitle")}</p>
          </div>
          <LanguageSwitcher />
        </header>

        <div className="space-y-12">
          <ColorsSection />
          <TypographySection />
          <SpacingSection />
          <ButtonsSection />
          <FormsSection />
          <StatesSection />
          <BadgesSection />
          <FormattingSection />
          <ResponsiveSection />
        </div>
      </main>

      <footer className="mt-auto border-t bg-muted/40 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-sm font-medium">
            {t("footer.foundationShowcase")} · {t("footer.phaseLabel")}
          </p>
          <p className="text-sm text-muted-foreground">{t("footer.noRealData")}</p>
        </div>
      </footer>
    </React.Fragment>
  );
}
