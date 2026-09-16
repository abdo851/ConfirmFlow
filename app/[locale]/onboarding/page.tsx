import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { OnboardingOverviewSteps, OnboardingStepNav } from "@/components/onboarding";

export default async function OnboardingPage() {
  const t = await getTranslations("onboarding");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {t("description")}
        </p>
      </div>

      <OnboardingStepNav />

      <div className="mb-8 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-4 dark:border-neutral-800 dark:bg-neutral-950">
        <p className="text-sm font-medium">{t("setupSequence")}</p>
        <ol className="mt-2 list-decimal space-y-1 ps-5 text-sm text-neutral-600 dark:text-neutral-400">
          <li>{t("sequenceSteps.store")}</li>
          <li>{t("sequenceSteps.meta")}</li>
          <li>{t("sequenceSteps.confirmation")}</li>
        </ol>
        <div className="mt-4">
          <Button href="/onboarding/store">{t("startStep1")}</Button>
        </div>
      </div>

      <OnboardingOverviewSteps />

      <p className="mt-8 text-sm">
        <Link href="/dashboard" className="underline">
          {t("backToDashboard")}
        </Link>
      </p>
    </div>
  );
}
