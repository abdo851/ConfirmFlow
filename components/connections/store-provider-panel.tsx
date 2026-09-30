"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { WooCommerceConnectForm } from "./woocommerce-connect-form";
import { YouCanConnectForm } from "./youcan-connect-form";

type StoreProviderId = "youcan" | "shopify" | "woocommerce";

function StoreProviderLoading() {
  const t = useTranslations("connections");

  return (
    <div className="rounded-md border border-neutral-200 px-4 py-4 text-sm dark:border-neutral-800">
      {t("loadingStoreProvider")}
    </div>
  );
}

function initialProvider(
  searchParams: { get(name: string): string | null },
): StoreProviderId {
  const provider = searchParams.get("provider");
  if (provider === "youcan" || provider === "woocommerce") {
    return provider;
  }
  if (searchParams.get("woocommerce")) {
    return "woocommerce";
  }
  return "youcan";
}

function StoreProviderPanelContent() {
  const t = useTranslations("connections");
  const searchParams = useSearchParams();
  const [activeProvider, setActiveProvider] = useState<StoreProviderId>(() =>
    initialProvider(searchParams),
  );

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
          <span title={t("shopifyLockedHint")} className="inline-flex">
            <Button
              type="button"
              variant="outline"
              disabled
              aria-disabled="true"
              className="cursor-not-allowed opacity-60"
            >
              <span>{t("shopifyLabel")}</span>
              <span className="ms-2 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted uppercase">
                {t("comingSoon")}
              </span>
            </Button>
          </span>
          <Button
            type="button"
            variant={activeProvider === "woocommerce" ? "default" : "outline"}
            onClick={() => setActiveProvider("woocommerce")}
          >
            {t("woocommerceLabel")}
          </Button>
        </div>
      </div>

      {activeProvider === "youcan" ? <YouCanConnectForm /> : null}
      {activeProvider === "woocommerce" ? <WooCommerceConnectForm /> : null}
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
