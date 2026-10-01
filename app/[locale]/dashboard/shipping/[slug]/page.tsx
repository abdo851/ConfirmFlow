import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { readSidebarIsAdmin } from "@/components/dashboard/read-sidebar-role";
import { ShippingConnectForm } from "@/components/shipping/shipping-connect-form";
import { getStoreConnectionState } from "@/lib/connections/store-connection";
import { getShippingProvider } from "@/lib/shipping/data";

export default async function ShippingConnectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const isAdmin = await readSidebarIsAdmin();
  if (!isAdmin) {
    const t = await getTranslations("dashboard.shipping");
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("comingSoonTitle")}</h1>
        <p className="mt-2 max-w-md text-sm text-muted">{t("comingSoonBody")}</p>
        <Link href="/dashboard" className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-primary">
          {t("backToDashboard")}
        </Link>
      </div>
    );
  }
  const provider = getShippingProvider(slug);
  if (!provider) {
    notFound();
  }

  const t = await getTranslations("dashboard.shipping");
  const store = await getStoreConnectionState();
  const storeUrl = store.status === "connected" ? store.metadata?.shopDomain?.trim() : "";
  const name = locale === "ar" ? provider.nameAr : provider.nameEn;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link href="/dashboard/shipping" className="inline-flex min-h-11 items-center text-sm font-medium text-primary">
        {t("back")}
      </Link>
      <div className="rounded-2xl bg-white p-6 shadow-soft dark:bg-slate-950">
        <Image src={provider.logo} alt="" width={160} height={64} unoptimized className="h-16 w-auto max-w-[10rem] object-contain" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{name}</h1>
        <p className="mt-1 text-sm text-muted">{provider.descriptionAr}</p>
        {storeUrl ? (
          <>
            <p className="mt-6 text-sm leading-6">{t("storeWillBeLinked", { url: storeUrl })}</p>
            <ShippingConnectForm
              apiKeyLabel={t("apiKey")}
              connectLabel={t("connect")}
              comingSoon={t("comingSoon")}
            />
          </>
        ) : (
          <p className="mt-6 text-sm leading-6">
            {t("noStore")}{" "}
            <Link href="/onboarding/store" className="font-medium text-primary">
              {t("connect")}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
