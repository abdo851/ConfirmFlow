"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface ProviderStatusItem {
  id: "youcan" | "shopify" | "woocommerce";
  connected: boolean;
  target?: string;
  connectHref: string;
  disconnectPath: string;
}

export interface MetaStatusItem {
  connected: boolean;
  pixelId?: string;
  verificationStatus?: string;
  lastDelivery?: string | null;
}

interface ProviderStatusListProps {
  providers: ProviderStatusItem[];
  meta: MetaStatusItem;
}

export function ProviderStatusList({ providers, meta }: ProviderStatusListProps) {
  const t = useTranslations("connections");
  const locale = useLocale();
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function disconnect(item: ProviderStatusItem) {
    if (item.id === "youcan") {
      const confirmed = window.confirm(
        locale === "ar"
          ? "هل أنت متأكد من قطع الاتصال؟ بعد قطع الاتصال لن يستقبل Confirma طلبات هذا المتجر حتى تعيد ربطه."
          : "Are you sure you want to disconnect? Once disconnected, Confirma will not receive orders from this store until you connect it again.",
      );
      if (!confirmed) {
        return;
      }
    }
    setPending(item.id);
    setError(null);
    const response = await fetch(item.disconnectPath, { method: "POST" });
    setPending(null);
    if (!response.ok) {
      setError(t("disconnectFailed"));
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <div className="grid gap-4 lg:grid-cols-3">
        {providers.map((item) => (
          <Card key={item.id} title={t(`${item.id}Label` as "youcanLabel")}>
            <p className="text-sm">
              {item.connected ? t("status.connected") : t("status.not_connected")}
            </p>
            {item.connected && item.target ? (
              <p className="mt-1 text-sm text-muted">{item.target}</p>
            ) : null}
            <div className="mt-4">
              {item.connected ? (
                <Button
                  type="button"
                  variant="outline"
                  loading={pending === item.id}
                  disabled={pending !== null}
                  onClick={() => void disconnect(item)}
                >
                  {t("disconnect")}
                </Button>
              ) : (
                <Button href={item.connectHref}>{t("connect")}</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
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
