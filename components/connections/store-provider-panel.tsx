"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ShopifyConnectForm } from "./shopify-connect-form";
import { YouCanConnectForm } from "./youcan-connect-form";

type StoreProviderId = "youcan" | "shopify";

function StoreProviderLoading() {
  const t = useTranslations("connections");

  return (
    <div className="rounded-md border border-neutral-200 px-4 py-4 text-sm dark:border-neutral-800">
      {t("loadingStoreProvider")}
    </div>
  );
}

function StoreProviderPanelContent() {
  const t = useTranslations("connections");
  const [activeProvider, setActiveProvider] = useState<StoreProviderId>("youcan");

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">{t("chooseStoreProvider")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={activeProvider === "youcan" ? "default" : "outline"}
            onClick={() => setActiveProvider("youcan")}
          >
            {t("youcanLabel")}
          </Button>
          <Button
            type="button"
            variant={activeProvider === "shopify" ? "default" : "outline"}
            onClick={() => setActiveProvider("shopify")}
          >
            {t("shopifyLabel")}
          </Button>
        </div>
      </div>

      {activeProvider === "youcan" ? <YouCanConnectForm /> : <ShopifyConnectForm />}
    </div>
  );
}

export function StoreProviderPanel() {
  return (
    <Suspense fallback={<StoreProviderLoading />}>
      <StoreProviderPanelContent />
    </Suspense>
  );
}
