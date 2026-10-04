import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireDashboardAdmin } from "@/components/dashboard/require-admin";
import { ShippingCatalog } from "@/components/shipping/shipping-catalog";
import { SHIPPING_PROVIDERS } from "@/lib/shipping/data";

const IMPLEMENTATION = {
  sendit: "client",
  coliix: "client",
  ameex: "stub",
} as const;

export default async function AdminShippingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireDashboardAdmin(locale);
  const t = await getTranslations("admin.shipping");
  const notes = Object.fromEntries(
    SHIPPING_PROVIDERS.map((provider) => {
      const kind = IMPLEMENTATION[provider.slug as keyof typeof IMPLEMENTATION] ?? "catalog";
      const label =
        kind === "client" ? t("codeClient") : kind === "stub" ? t("codeStub") : t("codeCatalog");
      return [provider.slug, label];
    }),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{t("description")}</p>
        </div>
        <Link
          href="/dashboard/shipping"
          className="inline-flex min-h-11 items-center rounded-xl border border-line bg-white px-4 text-sm font-medium shadow-soft hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-slate-950"
        >
          {t("customerView")}
        </Link>
      </div>
      <p className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm leading-6 text-indigo-950 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-100">
        {t("banner")}
      </p>
      <ShippingCatalog locale={locale} notes={notes} implementationLabel={t("implementation")} />
    </div>
  );
}
