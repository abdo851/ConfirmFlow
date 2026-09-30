import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BackButton } from "@/components/ui/back-button";
import { readSidebarIsAdmin } from "@/components/dashboard/read-sidebar-role";
import { SectionHelp } from "@/components/dashboard/section-help";
import { ShippingCatalog } from "@/components/shipping/shipping-catalog";
import { getVideoForPlacement } from "@/lib/videos/queries";

export default async function ShippingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("dashboard.shipping");
  const common = await getTranslations("common");
  const [shippingVideo, isAdmin] = await Promise.all([
    getVideoForPlacement("shipping"),
    readSidebarIsAdmin(),
  ]);

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
      {isAdmin ? (
        <p className="text-sm leading-6 text-muted">
          <Link href="/dashboard/admin/shipping" className="font-medium text-primary underline-offset-4 hover:underline">
            {t("adminReviewNote")}
          </Link>
        </p>
      ) : null}
      <ShippingCatalog locale={locale} allowDetail={isAdmin} />

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
