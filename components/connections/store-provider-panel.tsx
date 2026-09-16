"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { ShopifyConnectForm } from "./shopify-connect-form";

function StoreProviderLoading() {
  const t = useTranslations("connections");

  return (
    <div className="rounded-md border border-neutral-200 px-4 py-4 text-sm dark:border-neutral-800">
      {t("loadingShopify")}
    </div>
  );
}

export function StoreProviderPanel() {
  return (
    <Suspense fallback={<StoreProviderLoading />}>
      <ShopifyConnectForm />
    </Suspense>
  );
}
