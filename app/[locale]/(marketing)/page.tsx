import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

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
    <>
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          {t("tagline")}
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {t("heroTitle")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
          {t("heroDescription")}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button href="/signup">{nav("getStarted")}</Button>
          <Button variant="outline" href="/login">
            {nav("signIn")}
          </Button>
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-neutral-50 px-6 py-14 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-neutral-500">
            {t("howItWorks")}
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
            {flowSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <span className="rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900">
                  {step}
                </span>
                {index < flowSteps.length - 1 ? (
                  <span className="text-neutral-400">→</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-2xl font-semibold">{t("stepsTitle")}</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {setupSteps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800"
            >
              <p className="text-sm font-semibold text-neutral-500">
                {t("stepLabel", { number: index + 1 })}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
