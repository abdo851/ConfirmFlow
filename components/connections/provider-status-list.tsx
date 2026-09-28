"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface ConnectedStoreCard {
  id: string;
  provider: "youcan" | "woocommerce" | "shopify";
  name: string;
  status: "connected" | "inactive" | "error";
}

export interface MetaStatusItem {
  connected: boolean;
  pixelId?: string;
  verificationStatus?: string;
  lastDelivery?: string | null;
}

interface ProviderStatusListProps {
  stores: ConnectedStoreCard[];
  meta: MetaStatusItem;
}

const PROVIDER_ORDER = ["youcan", "woocommerce", "shopify"] as const;

const LOGOS = {
  youcan: "/brands/youcan.svg",
  woocommerce: "/brands/woocommerce.svg",
  shopify: "/brands/shopify.svg",
} as const;

const DISCONNECT_PATH = {
  youcan: "/api/integrations/youcan/disconnect",
  woocommerce: "/api/integrations/woocommerce/disconnect",
  shopify: "/api/integrations/shopify/disconnect",
} as const;

export function ProviderStatusList({ stores, meta }: ProviderStatusListProps) {
  const t = useTranslations("connections");
  const dashboard = useTranslations("dashboard");
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function disconnect(store: ConnectedStoreCard) {
    const confirmed = window.confirm(dashboard("disconnectStoreConfirm"));
    if (!confirmed) {
      return;
    }
    setPending(store.id);
    setError(null);
    const response = await fetch(DISCONNECT_PATH[store.provider], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: store.id }),
    });
    setPending(null);
    if (!response.ok) {
      setError(t("disconnectFailed"));
      return;
    }
    router.refresh();
  }

  const groups = PROVIDER_ORDER.map((provider) => ({
    provider,
    stores: stores.filter((store) => store.provider === provider),
  })).filter((group) => group.stores.length > 0);

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {groups.length === 0 ? (
        <p className="text-sm text-muted">{dashboard("noConnectedStores")}</p>
      ) : (
        groups.map((group) => (
          <section key={group.provider} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted">{t(`${group.provider}Label`)}</h2>
            <div className="grid gap-4 lg:grid-cols-3">
              {group.stores.map((store) => (
                <Card key={store.id} title={store.name}>
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="size-10 shrink-0 rounded-lg bg-surface-muted bg-contain bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${LOGOS[store.provider]})` }}
                    />
                    <p className="text-sm">
                      {store.status === "error"
                        ? t("status.error")
                        : store.status === "connected"
                          ? t("status.connected")
                          : t("status.not_connected")}
                    </p>
                  </div>
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      loading={pending === store.id}
                      disabled={pending !== null}
                      onClick={() => void disconnect(store)}
                    >
                      {t("disconnect")}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}
      <Card title={t("types.meta.label")} description={t("types.meta.description")}>
        <p className="text-sm">
          {meta.connected ? t("status.connected") : t("status.not_connected")}
        </p>
        {meta.connected ? (
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t("meta.pixelIdLabel")}</dt>
              <dd>{meta.pixelId ?? t("meta.verificationUnverified")}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t("meta.verificationStatusLabel")}</dt>
              <dd>{meta.verificationStatus ?? t("meta.verificationUnverified")}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t("meta.lastDeliveryLabel")}</dt>
              <dd>{meta.lastDelivery ?? t("meta.noDelivery")}</dd>
            </div>
          </dl>
        ) : (
          <div className="mt-4">
            <Link href="/onboarding/meta" className="text-sm font-medium underline">
              {t("meta.connect")}
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
