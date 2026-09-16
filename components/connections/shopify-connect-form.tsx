"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConnectionStatusBadge } from "./connection-status-badge";
import { SHOPIFY_PROVIDER_LABEL } from "@/integrations/stores/shopify/constants";
import type { ConnectionStatus } from "@/lib/connections/types";

interface ShopifyStatusResponse {
  provider: "shopify";
  shop?: string;
  status: ConnectionStatus;
  errorMessage?: string;
}

export function ShopifyConnectForm() {
  const searchParams = useSearchParams();
  const t = useTranslations("connections.shopify");
  const connections = useTranslations("connections");
  const errors = useTranslations("errors.shopify");
  const [shop, setShop] = useState("");
  const [status, setStatus] = useState<ShopifyStatusResponse>({
    provider: "shopify",
    status: "not_connected",
  });
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatus() {
      const response = await fetch("/api/integrations/shopify/status");
      if (response.ok) {
        setStatus((await response.json()) as ShopifyStatusResponse);
      }
    }

    void loadStatus();

    const result = searchParams.get("shopify");
    const reason = searchParams.get("reason");

    if (result === "connected") {
      setFlashMessage(t("connectedSuccess"));
    } else if (result === "error") {
      setFlashMessage(
        reason && ["invalid_shop", "invalid_state", "invalid_hmac", "token_exchange_failed", "configuration", "persistence_failed"].includes(reason)
          ? errors(reason as "invalid_shop")
          : t("connectionFailed"),
      );
    }
  }, [searchParams, t, errors]);

  const connectHref = shop.trim()
    ? `/api/integrations/shopify/connect?shop=${encodeURIComponent(shop.trim())}`
    : undefined;

  return (
    <div className="rounded-md border border-neutral-200 px-4 py-4 dark:border-neutral-800">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{connections("storeProvider")}</p>
          <p className="mt-1 text-base font-semibold">{SHOPIFY_PROVIDER_LABEL}</p>
          {status.shop ? (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {status.shop}
            </p>
          ) : null}
        </div>
        <ConnectionStatusBadge type="store" status={status.status} />
      </div>

      {status.status !== "connected" ? (
        <div className="mt-4 space-y-4">
          <Input
            label={t("shopDomainLabel")}
            name="shop"
            placeholder={t("shopDomainPlaceholder")}
            value={shop}
            onChange={(event) => setShop(event.target.value)}
          />
          {connectHref ? (
            <Button href={connectHref}>{t("connect")}</Button>
          ) : (
            <Button type="button" disabled>
              {t("connect")}
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              const response = await fetch("/api/integrations/shopify/disconnect", {
                method: "POST",
              });
              if (response.ok) {
                setStatus({ provider: "shopify", status: "not_connected" });
                setFlashMessage(t("disconnectedSuccess"));
              } else {
                setFlashMessage(t("disconnectFailed"));
              }
            }}
          >
            {t("disconnect")}
          </Button>
        </div>
      )}

      {flashMessage ? (
        <p
          className={`mt-4 text-sm ${
            status.status === "connected"
              ? "text-green-700 dark:text-green-400"
              : "text-red-700 dark:text-red-400"
          }`}
          role="status"
        >
          {flashMessage}
        </p>
      ) : null}

      {status.errorMessage ? (
        <p className="mt-4 text-sm text-red-700 dark:text-red-400" role="alert">
          {status.errorMessage}
        </p>
      ) : null}
    </div>
  );
}
