import { getTranslations } from "next-intl/server";

export async function MetaOnboardingGuide() {
  const t = await getTranslations("dashboard.pages.features.meta");

  return (
    <div className="mb-6 space-y-3 rounded-2xl border border-line bg-surface p-5 text-sm">
      <h2 className="text-base font-semibold">{t("guideTitle")}</h2>
      <ol className="list-decimal space-y-1 ps-5 text-muted">
        <li>{t("guideStep1")}</li>
        <li>{t("guideStep2")}</li>
        <li>{t("guideStep3")}</li>
      </ol>
      <a
        href="https://eventsmanager.facebook.com/"
        className="inline-flex text-primary underline"
        target="_blank"
        rel="noreferrer"
      >
        {t("eventsManager")}
      </a>
      <p className="text-muted">{t("nextSteps")}</p>
    </div>
  );
}
