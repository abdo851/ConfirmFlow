import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { PlacementVideo } from "@/components/marketing/placement-video";
import { ContentBlockFeed } from "@/components/content/content-block-feed";
import { getVideoForPlacement } from "@/lib/videos/queries";
import { OnboardingOverviewSteps, OnboardingStepNav, SetupChecklist } from "@/components/onboarding";
import { listActiveBlocks } from "@/lib/content/blocks";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("onboarding");
  const common = await getTranslations("common");
  const blocks = await listActiveBlocks(locale === "ar" ? "ar" : "en");
  const topVideo = await getVideoForPlacement("onboarding_top");

  return (
    <div>
      {topVideo ? <PlacementVideo video={topVideo} /> : null}
      <BackButton href="/dashboard" label={common("back")} />
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
          {t("description")}
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
      <OnboardingStepNav />

      <div className="mb-8 rounded-2xl border border-line bg-surface px-4 py-5 shadow-soft sm:px-6">
        <p className="text-sm font-medium">{t("setupSequence")}</p>
        <ol className="mt-2 list-decimal space-y-1 ps-5 text-sm text-muted">
          <li>{t("sequenceSteps.store")}</li>
          <li>{t("sequenceSteps.meta")}</li>
          <li>{t("sequenceSteps.confirmation")}</li>
        </ol>
        <div className="mt-4">
          <Button href="/onboarding/store">{t("startStep1")}</Button>
        </div>
      </div>

      <OnboardingOverviewSteps />

      <div className="mt-8">
        <ContentBlockFeed blocks={blocks} />
      </div>

      <p className="mt-8 text-sm">
        <Link href="/dashboard" className="underline">
          {t("backToDashboard")}
        </Link>
      </p>
        </div>
        <SetupChecklist />
      </div>
    </div>
  );
}
