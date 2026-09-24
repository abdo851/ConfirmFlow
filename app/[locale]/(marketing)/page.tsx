import { getTranslations } from "next-intl/server";
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

  return (
    <div className="animate-fade-in">
      <section className="bg-mesh relative overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          <p className="mb-4 text-xs font-semibold tracking-[0.18em] text-secondary uppercase sm:text-sm">
            {t("tagline")}
          </p>
          <h1 className="mx-auto max-w-4xl text-4xl leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            <span className="gradient-text">{t("heroHeadline")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted">
            {t("heroLine")}
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button href="/signup" size="lg">
              {nav("getStarted")}
            </Button>
            <Button variant="ghost" href="/login" size="lg">
              {nav("signIn")}
            </Button>
          </div>
          <ul className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-3">
            {["WooCommerce", "YouCan", "Shopify", "Meta", "ChatGPT"].map((name) => (
              <li
                key={name}
                className="rounded-full border border-line bg-surface/80 px-3 py-1.5 text-xs font-medium text-muted"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y border-line bg-surface-muted/70 px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={t("howItWorks")} />
          <ol className="relative mt-10 grid gap-4 md:grid-cols-3">
            <span
              aria-hidden
              className="absolute top-9 start-8 end-8 hidden h-px bg-gradient-to-r from-indigo-500 via-teal-400 to-amber-400 md:block rtl:bg-gradient-to-l"
            />
            {setupSteps.map((step, index) => (
              <li key={step.title} className="hover-lift relative rounded-2xl border border-line bg-surface p-5 shadow-soft sm:p-6">
                <span className="relative z-10 inline-flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg leading-[1.1] font-semibold">{step.title}</h3>
                <p className="mt-2 text-base leading-7 text-muted">{step.description}</p>
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

      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
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
    </div>
  );
}
