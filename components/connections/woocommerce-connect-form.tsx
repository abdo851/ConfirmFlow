"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConnectionStatusBadge } from "./connection-status-badge";
import type { ConnectionStatus } from "@/lib/connections/types";

interface WooCommerceStatusResponse {
  connected: boolean;
  store_url?: string;
  status?: ConnectionStatus;
  error_message?: string;
}

const ERROR_REASONS = ["invalid_store", "callback_failed", "invalid_state"] as const;

export function WooCommerceConnectForm() {
  const searchParams = useSearchParams();
  const t = useTranslations("connections");
  const [storeUrl, setStoreUrl] = useState("");
  const [status, setStatus] = useState<WooCommerceStatusResponse>({
    connected: false,
  });
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatus() {
      const response = await fetch("/api/integrations/woocommerce/status");
      if (response.ok) {
        setStatus((await response.json()) as WooCommerceStatusResponse);
      }
    }

    void loadStatus();

    const result = searchParams.get("woocommerce");
    const reason = searchParams.get("reason");

    if (result === "connected") {
      setFlashMessage(t("woocommerceConnected"));
    } else if (result === "error") {
      setFlashMessage(
        reason &&
          ERROR_REASONS.includes(reason as (typeof ERROR_REASONS)[number])
          ? t(`woocommerceReasons.${reason}` as "woocommerceReasons.invalid_store")
          : t("woocommerceConnectionFailed"),
      );
    }
  }, [searchParams, t]);

  const connectHref = storeUrl.trim()
    ? `/api/integrations/woocommerce/connect?store=${encodeURIComponent(storeUrl.trim())}`
    : undefined;
  const badgeStatus: ConnectionStatus = status.connected
    ? "connected"
    : (status.status ?? "not_connected");

  return (
    <div className="rounded-md border border-neutral-200 px-4 py-4 dark:border-neutral-800">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{t("storeProvider")}</p>
          <p className="mt-1 text-base font-semibold">{t("woocommerceLabel")}</p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {t("woocommerceHint")}
          </p>
          {status.store_url ? (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {status.store_url}
            </p>
          ) : null}
        </div>
        <ConnectionStatusBadge type="store" status={badgeStatus} />
      </div>

      {!status.connected ? (
        <div className="mt-4 space-y-4">
          <Input
            label={t("woocommerceStoreUrl")}
            name="store"
            placeholder="your-store.com"
            value={storeUrl}
            onChange={(event) => setStoreUrl(event.target.value)}
          />
          {connectHref ? (
            <a
              href={connectHref}
              className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
            >
              {t("woocommerceConnect")}
            </a>
          ) : (
            <Button type="button" disabled>
              {t("woocommerceConnect")}
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              const response = await fetch(
                "/api/integrations/woocommerce/disconnect",
                { method: "POST" },
              );
              if (response.ok) {
                setStatus({ connected: false });
                setFlashMessage(t("woocommerceDisconnected"));
              } else {
                setFlashMessage(t("woocommerceDisconnectFailed"));
              }
            }}
          >
            {t("woocommerceDisconnect")}
          </Button>
        </div>
      )}

      {flashMessage ? (
        <p
          className={`mt-4 text-sm ${
            status.connected
              ? "text-green-700 dark:text-green-400"
              : "text-red-700 dark:text-red-400"
          }`}
          role="status"
        >
          {flashMessage}
        </p>
      ) : null}

      {status.error_message ? (
        <p className="mt-4 text-sm text-red-700 dark:text-red-400" role="alert">
          {status.error_message}
        </p>
      ) : null}
    </div>
  );
}
