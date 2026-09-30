import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ShippingCard } from "@/components/shipping/shipping-card";
import { SHIPPING_PROVIDERS, type ShippingProvider } from "@/lib/shipping/data";

export async function ShippingCatalog({
  locale,
  notes,
  implementationLabel,
  allowDetail = true,
}: {
  locale: string;
  notes?: Record<string, string>;
  implementationLabel?: string;
  allowDetail?: boolean;
}) {
  const t = await getTranslations("dashboard.shipping");
  const direct = SHIPPING_PROVIDERS.filter((provider) => provider.integrationType === "direct");
  const soon = SHIPPING_PROVIDERS.filter((provider) => provider.integrationType === "broker-required");

  return (
    <div className="space-y-10">
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
                statusLabel={t("comingSoon")}
                connectLabel={t("connect")}
                connectedLabel={t("connected")}
                settingsLabel={t("settings")}
                soonMessage={t("carrierSoonMessage")}
                allowDetail={allowDetail}
              />
              {notes?.[provider.slug] ? (
                <p className="mt-2 text-xs font-medium text-muted">{notes[provider.slug]}</p>
              ) : null}
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
          notes={notes}
          implementationLabel={implementationLabel}
        />
        <p className="text-sm leading-6 text-muted">{t("soonNote")}</p>
      </section>
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
  notes,
  implementationLabel,
}: {
  providers: ShippingProvider[];
  locale: string;
  companyLabel: string;
  logoLabel: string;
  statusLabel: string;
  soonLabel: string;
  notes?: Record<string, string>;
  implementationLabel?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft dark:bg-slate-950">
      <table className="w-full text-start text-sm">
        <thead className="bg-slate-50 text-xs font-medium text-muted dark:bg-slate-900">
          <tr>
            <th className="px-4 py-3 text-start font-medium">{companyLabel}</th>
            <th className="px-4 py-3 text-start font-medium">{logoLabel}</th>
            <th className="px-4 py-3 text-start font-medium">{statusLabel}</th>
            {implementationLabel ? (
              <th className="px-4 py-3 text-start font-medium">{implementationLabel}</th>
            ) : null}
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
                {implementationLabel ? (
                  <td className="px-4 py-3 text-xs text-muted">{notes?.[provider.slug] ?? ""}</td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
