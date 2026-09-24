import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PlatformRow } from "@/components/marketing/platform-row";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const featureTones = [
  "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200",
  "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-200",
  "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
  "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
  "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200",
  "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-200",
] as const;

function FeatureIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3.5 18.5 7v5.2c0 3.4-2.3 6-6.5 7.8-4.2-1.8-6.5-4.4-6.5-7.8V7L12 3.5z" />
    </svg>
  );
}

function Mark({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`inline-flex size-12 items-center justify-center rounded-full ${className}`}>
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
        {children}
      </svg>
    </span>
  );
}

export default async function LandingPage() {
  const t = await getTranslations("landing");
  const nav = await getTranslations("navigation");

  const flowSteps = [
    t("flowSteps.store"),
    t("flowSteps.orderCreated"),
    t("flowSteps.orderConfirmed"),
    t("flowSteps.confirma"),
    t("flowSteps.metaCapi"),
  ];

  const setupSteps = [
    {
      title: t("setupSteps.storeTitle"),
      description: t("setupSteps.storeDescription"),
    },
    {
      title: t("setupSteps.metaTitle"),
      description: t("setupSteps.metaDescription"),
    },
    {
      title: t("setupSteps.confirmationTitle"),
      description: t("setupSteps.confirmationDescription"),
    },
  ];

  const features = [
    t("features.confirm"),
    t("features.stores"),
    t("features.meta"),
    t("features.inbox"),
    t("features.rtl"),
    t("features.privacy"),
  ];

  const showcase = [
    {
      title: t("showcase.analyticsTitle"),
      body: t("showcase.analyticsBody"),
      chip: "bg-indigo-100 text-indigo-700",
      icon: <path d="M4 19V10M10 19V5M16 19v-7M22 19H2" />,
    },
    {
      title: t("showcase.metaTitle"),
      body: t("showcase.metaBody"),
      chip: "bg-sky-100 text-sky-700",
      icon: <circle cx="12" cy="12" r="7" />,
    },
    {
      title: t("showcase.adsTitle"),
      body: t("showcase.adsBody"),
      chip: "bg-rose-100 text-rose-700",
      icon: <path d="M12 4v16M5 9h14M7 15h10" />,
    },
    {
      title: t("showcase.privacyTitle"),
      body: t("showcase.privacyBody"),
      chip: "bg-emerald-100 text-emerald-700",
      icon: <path d="M12 3.5 18.5 7v5.2c0 3.4-2.3 6-6.5 7.8-4.2-1.8-6.5-4.4-6.5-7.8V7L12 3.5z" />,
    },
    {
      title: t("showcase.rtlTitle"),
      body: t("showcase.rtlBody"),
      chip: "bg-amber-100 text-amber-800",
      icon: <path d="M5 7h10a4 4 0 0 1 0 8H9M5 7v10M9 15v4" />,
    },
    {
      title: t("showcase.fastTitle"),
      body: t("showcase.fastBody"),
      chip: "bg-teal-100 text-teal-800",
      icon: <path d="M5 15c4-8 8-8 14-12-1 6 1 8 1 8s-3 1-6 4c-2 2-3 5-3 5s-2-2-6-5z" />,
    },
  ];

  const marquee = t("marquee");

  return (
    <div className="animate-fade-in">
      <section className="hero-mesh relative overflow-hidden">
        <span aria-hidden className="hero-orb hero-orb-a" />
        <span aria-hidden className="hero-orb hero-orb-b" />
        <span aria-hidden className="hero-orb hero-orb-c" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          <p className="hero-rise mb-4 text-xs font-semibold tracking-[0.18em] text-secondary uppercase sm:text-sm">
            {t("tagline")}
          </p>
          <h1 className="mx-auto max-w-4xl text-4xl leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            <span className="hero-rise gradient-indigo block">{t("heroLine1")}</span>
            <span className="hero-rise gradient-teal mt-2 block" style={{ animationDelay: "140ms" }}>
              {t("heroLine2")}
            </span>
          </h1>
          <p className="hero-rise mx-auto mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg" style={{ animationDelay: "280ms" }}>
            {t("heroLine")}
          </p>
          <div className="hero-rise mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center" style={{ animationDelay: "420ms" }}>
            <Button href="/signup" size="lg" className="cta-shimmer">
              {t("ctaStart")}
            </Button>
            <Button variant="ghost" href="/login" size="lg">
              {nav("signIn")}
            </Button>
          </div>
          <div className="hero-rise" style={{ animationDelay: "560ms" }}>
            <PlatformRow />
          </div>
          <div className="marquee mt-10" aria-hidden>
            <div className="marquee-track">
              <p className="px-4 text-sm font-semibold tracking-wide text-indigo-900/80">{marquee}</p>
              <p className="px-4 text-sm font-semibold tracking-wide text-indigo-900/80">{marquee}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {showcase.map((item, index) => (
            <Reveal key={item.title} delay={index * 60}>
              <article className="hover-lift h-full rounded-2xl border border-line bg-surface p-5 shadow-soft sm:p-6">
                <Mark className={item.chip}>{item.icon}</Mark>
                <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted sm:text-base">{item.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y border-line bg-surface-muted/70 px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={t("howItWorks")} />
          <ol className="relative mt-10 grid gap-4 md:grid-cols-3">
            <span aria-hidden className="step-line absolute top-9 start-8 end-8 hidden h-1 rounded-full md:block" />
            {setupSteps.map((step, index) => (
              <li key={step.title}>
                <Reveal delay={index * 90}>
                  <article className="hover-lift relative rounded-2xl border border-line bg-surface p-5 shadow-soft sm:p-6">
                    <div className="flex items-center gap-3">
                      <span className="relative z-10 inline-flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
                        {index + 1}
                      </span>
                      <Mark className={featureTones[index] ?? featureTones[0]}>
                        {index === 0 ? (
                          <path d="M4 8h16v10H4zM8 8V6h8v2" />
                        ) : index === 1 ? (
                          <path d="M12 4v6M8 14h8M7 18h10" />
                        ) : (
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        )}
                      </Mark>
                    </div>
                    <h3 className="mt-4 text-lg leading-[1.1] font-semibold">{step.title}</h3>
                    <p className="mt-2 text-base leading-7 text-muted">{step.description}</p>
                  </article>
                </Reveal>
              </li>
            ))}
          </ol>
          <ol className="mt-6 grid gap-3 md:grid-cols-5">
            {flowSteps.map((step, index) => (
              <li key={step} className="rounded-2xl border border-line bg-surface p-4 text-sm font-medium">
                <span className="text-xs text-muted">{index + 1}</span>
                <p className="mt-2">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <SectionHeading title={t("stepsTitle")} />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {features.map((feature, index) => (
            <Reveal key={feature} delay={index * 40}>
              <article className="hover-lift h-full rounded-2xl border border-line bg-surface p-5 shadow-soft sm:p-6">
                <span className={`inline-flex size-10 items-center justify-center rounded-xl ${featureTones[index] ?? featureTones[0]}`}>
                  <FeatureIcon />
                </span>
                <h3 className="mt-4 text-base leading-7 font-semibold">{feature}</h3>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface-muted/60 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          <article className="hover-lift rounded-2xl border border-line bg-surface p-6 shadow-soft">
            <p className="text-sm font-semibold text-secondary">{t("pricing.basicName")}</p>
            <p className="mt-3 text-3xl font-semibold">{t("pricing.basicPrice")}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{t("pricing.basicDetail")}</p>
          </article>
          <article className="hover-lift rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-600 to-teal-500 p-6 text-white shadow-medium">
            <p className="text-sm font-semibold text-white/80">{t("pricing.proName")}</p>
            <p className="mt-3 text-3xl font-semibold">{t("pricing.proPrice")}</p>
            <p className="mt-2 text-sm leading-6 text-white/85">{t("pricing.proDetail")}</p>
          </article>
        </div>
      </section>

      <section id="proof" className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-6xl rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-teal-500 p-8 text-white shadow-large sm:p-12">
            <p className="text-sm font-semibold tracking-wide uppercase opacity-80">
              {t("proofTitle")}
            </p>
            <h2 className="mt-4 max-w-3xl text-3xl leading-[1.15] font-semibold text-balance sm:text-4xl">
              {t("ctaTitle")}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
              {t("ctaDescription")}
            </p>
            <blockquote className="mt-6 max-w-3xl text-lg leading-snug font-medium">
              “{t("proofQuote")}”
            </blockquote>
            <p className="mt-4 text-sm opacity-90">{t("proofRole")}</p>
            <div className="mt-8">
              <Button href="/signup" variant="secondary" size="lg">
                {nav("getStarted")}
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
        <div className="cta-band mx-auto max-w-6xl rounded-3xl px-6 py-12 text-center text-white shadow-large sm:px-10 sm:py-16">
          <h2 className="mx-auto max-w-3xl text-3xl leading-[1.15] font-semibold text-balance sm:text-5xl">
            {t("ctaReady")}
          </h2>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button href="/signup" variant="secondary" size="lg" className="cta-shimmer">
              {t("ctaStart")}
            </Button>
            <a
              href="mailto:privacy@confirma.local"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/40 px-5 text-base font-medium text-white hover:bg-white/10"
            >
              {t("ctaTalk")}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
