import { getTranslations } from "next-intl/server";
import { BackButton } from "@/components/ui/back-button";
import { ShippingCard } from "@/components/shipping/shipping-card";
import { SHIPPING_PROVIDERS } from "@/lib/shipping/data";

export default async function ShippingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("dashboard.shipping");
  const common = await getTranslations("common");

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard" label={common("back")} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">{t("subtitle")}</p>
      </div>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SHIPPING_PROVIDERS.map((provider) => (
          <li key={provider.slug}>
            <ShippingCard
              provider={provider}
              locale={locale}
              description={t(`providers.${provider.slug}` as "providers.sendit")}
              freeLabel={t("free")}
              connectLabel={t("connect")}
              connectedLabel={t("connected")}
              settingsLabel={t("settings")}
            />
          </li>
        ))}
      </ul>
      <article className="rounded-2xl border border-amber-200 bg-white p-5 shadow-soft dark:border-amber-900/40 dark:bg-slate-950">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">{t("confirmationTitle")}</h2>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            {t("comingSoon")}
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{t("confirmationBody")}</p>
      </article>
    </div>
  );
}
