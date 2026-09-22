import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

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

  return (
    <div className="animate-fade-in">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="animate-float absolute -start-16 top-8 size-72 rounded-full bg-indigo-400/30 blur-3xl" />
          <div className="animate-float-delayed absolute end-0 top-24 size-64 rounded-full bg-teal-300/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          <p className="mb-4 text-xs font-semibold tracking-[0.18em] text-secondary uppercase sm:text-sm">
            {t("tagline")}
          </p>
          <h1 className="mx-auto max-w-4xl text-[clamp(2.25rem,5vw,3.75rem)] leading-tight font-bold tracking-tight text-balance">
            <span className="bg-gradient-to-br from-indigo-700 via-indigo-500 to-teal-500 bg-clip-text text-transparent dark:from-indigo-200 dark:via-indigo-300 dark:to-teal-200">
              {t("heroTitle")}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-muted sm:text-base lg:text-lg">
            {t("heroDescription")}
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button href="/signup" size="lg">
              {nav("getStarted")}
            </Button>
            <Button variant="outline" href="/login" size="lg">
              {nav("signIn")}
            </Button>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y border-line bg-surface-muted/70 px-4 py-14 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-sm font-semibold tracking-[0.16em] text-muted uppercase">
            {t("howItWorks")}
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-5">
            {flowSteps.map((step, index) => (
              <li key={step} className="relative">
                <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-4 shadow-soft">
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <p className="mt-3 text-sm font-medium">{step}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("stepsTitle")}
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {setupSteps.map((step, index) => (
            <Reveal key={step.title} delay={index * 90}>
              <article className="hover-lift h-full rounded-2xl border border-line bg-surface p-6 shadow-soft">
                <p className="text-sm font-semibold text-secondary">
                  {t("stepLabel", { number: index + 1 })}
                </p>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{step.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="proof" className="px-4 pb-8 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-6xl rounded-3xl border border-line bg-gradient-to-br from-indigo-600 to-teal-600 p-8 text-white shadow-large sm:p-12">
            <p className="text-sm font-semibold tracking-wide uppercase opacity-80">
              {t("proofTitle")}
            </p>
            <blockquote className="mt-4 max-w-3xl text-2xl leading-snug font-semibold text-balance sm:text-3xl">
              “{t("proofQuote")}”
            </blockquote>
            <p className="mt-6 text-sm opacity-90">{t("proofRole")}</p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("ctaTitle")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted sm:text-base">
          {t("ctaDescription")}
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
          <Button href="/signup" size="lg">
            {nav("getStarted")}
          </Button>
          <Button variant="outline" href="/login" size="lg">
            {nav("signIn")}
          </Button>
        </div>
      </section>
    </div>
  );
}
