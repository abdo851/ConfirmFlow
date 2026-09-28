import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { BackButton } from "@/components/ui/back-button";
import { SectionHelp } from "@/components/dashboard/section-help";
import { ShippingCard } from "@/components/shipping/shipping-card";
import { SHIPPING_PROVIDERS, type ShippingProvider } from "@/lib/shipping/data";
import { getVideoForPlacement } from "@/lib/videos/queries";

export default async function ShippingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("dashboard.shipping");
  const common = await getTranslations("common");
  const direct = SHIPPING_PROVIDERS.filter((provider) => provider.integrationType === "direct");
  const soon = SHIPPING_PROVIDERS.filter((provider) => provider.integrationType === "broker-required");
  const shippingVideo = await getVideoForPlacement("shipping");

  return (
    <div className="dash-stagger animate-fade-in space-y-10">
      <BackButton href="/dashboard" label={common("back")} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">{t("subtitle")}</p>
        </div>
        <SectionHelp video={shippingVideo} />
      </div>

      <section className="space-y-4" aria-labelledby="shipping-direct">
        <h2 id="shipping-direct" className="text-lg font-semibold tracking-tight">
          {t("directTitle")}
        </h2>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {direct.map((provider) => (
            <li key={provider.slug}>
              <ShippingCard
                provider={provider}
                locale={locale}
                description={t(`providers.${provider.slug}` as "providers.sendit")}
                statusLabel={t("available")}
                connectLabel={t("connect")}
                connectedLabel={t("connected")}
                settingsLabel={t("settings")}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4" aria-labelledby="shipping-soon">
        <h2 id="shipping-soon" className="text-lg font-semibold tracking-tight text-slate-700 dark:text-slate-200">
          {t("soonTitle")}
        </h2>
        <ComingSoonTable
          providers={soon}
          locale={locale}
          companyLabel={t("company")}
          logoLabel={t("logo")}
          statusLabel={t("status")}
          soonLabel={t("soonBadge")}
        />
        <p className="text-sm leading-6 text-muted">{t("soonNote")}</p>
      </section>

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

function ComingSoonTable({
  providers,
  locale,
  companyLabel,
  logoLabel,
  statusLabel,
  soonLabel,
}: {
  providers: ShippingProvider[];
  locale: string;
  companyLabel: string;
  logoLabel: string;
  statusLabel: string;
  soonLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft dark:bg-slate-950">
      <table className="w-full text-start text-sm">
        <thead className="bg-slate-50 text-xs font-medium text-muted dark:bg-slate-900">
          <tr>
            <th className="px-4 py-3 text-start font-medium">{companyLabel}</th>
            <th className="px-4 py-3 text-start font-medium">{logoLabel}</th>
            <th className="px-4 py-3 text-start font-medium">{statusLabel}</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((provider) => {
            const name = locale === "ar" ? provider.nameAr : provider.nameEn;
            return (
              <tr key={provider.slug} className="border-t border-line">
                <td className="px-4 py-3 font-medium">{name}</td>
                <td className="px-4 py-3">
                  <Image
                    src={provider.logo}
                    alt=""
                    width={96}
                    height={32}
                    unoptimized
                    className="h-8 w-auto max-w-24 object-contain"
                  />
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {soonLabel}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
