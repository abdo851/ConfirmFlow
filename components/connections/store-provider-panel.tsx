"use client";

import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { joinWaitlistAction } from "@/lib/waitlist/actions";
import { WooCommerceConnectForm } from "./woocommerce-connect-form";

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
  if (searchParams.get("woocommerce")) {
    return "woocommerce";
  }
  if (searchParams.get("shopify")) {
    return "shopify";
  }
  return "youcan";
}

function ComingSoonProvider({ provider }: { provider: "youcan" | "shopify" }) {
  const t = useTranslations("connections");
  const auth = useTranslations("auth");
  const [state, action, pending] = useActionState(joinWaitlistAction, { status: "idle" as const });
  const label = provider === "youcan" ? t("youcanLabel") : t("shopifyLabel");

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dashed border-line bg-surface-muted/60 p-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-surface text-sm font-semibold">
            {label.slice(0, 1)}
          </span>
          <div>
            <p className="font-medium">{label}</p>
            <p className="text-sm text-muted">{t("comingSoonSubtitle")}</p>
          </div>
          <Badge variant="muted">{t("comingSoon")}</Badge>
        </div>
        <Button type="button" className="mt-4" disabled>
          {t("comingSoon")}
        </Button>
      </div>
      <div className="rounded-2xl border border-line p-4">
        <p className="font-medium">{t("teamTitle")}</p>
        <p className="mt-1 text-sm text-muted">{t("waitlistNote")}</p>
        <form action={action} className="mt-4 space-y-3">
          <input type="hidden" name="provider" value={provider} />
          <Input label={auth("email")} name="email" type="email" required />
          <Button type="submit" loading={pending}>
            {t("notifyMe")}
          </Button>
        </form>
        {state.status === "saved" ? <Toast tone="success">{t("waitlistSaved")}</Toast> : null}
        {state.status === "invalid" || state.status === "failed" ? (
          <Toast tone="danger">{t("waitlistInvalid")}</Toast>
        ) : null}
      </div>
    </div>
  );
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
          <Button
            type="button"
            variant={activeProvider === "shopify" ? "default" : "outline"}
            onClick={() => setActiveProvider("shopify")}
          >
            {t("shopifyLabel")}
          </Button>
          <Button
            type="button"
            variant={activeProvider === "woocommerce" ? "default" : "outline"}
            onClick={() => setActiveProvider("woocommerce")}
          >
            {t("woocommerceLabel")}
          </Button>
        </div>
      </div>

      {activeProvider === "youcan" ? <ComingSoonProvider provider="youcan" /> : null}
      {activeProvider === "shopify" ? <ComingSoonProvider provider="shopify" /> : null}
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
