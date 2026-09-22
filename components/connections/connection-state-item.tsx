"use client";

import { useTranslations } from "next-intl";
import { ConnectionStatusBadge } from "./connection-status-badge";
import type { ConnectionState } from "@/lib/connections";
import { getStoreProviderLabel } from "@/lib/integrations/stores/supported-providers";

interface ConnectionStateItemProps {
  connection: ConnectionState;
}

export function ConnectionStateItem({ connection }: ConnectionStateItemProps) {
  const t = useTranslations("connections");
  const providerLabel = connection.metadata?.provider
    ? getStoreProviderLabel(connection.metadata.provider)
    : undefined;

  const description = connection.metadata?.shopDomain
    ? t("connectedToShop", { shop: connection.metadata.shopDomain })
    : t(`types.${connection.type}.description`);

  const connected = connection.status === "connected";
  const disconnected = connection.status === "not_connected";
  const frame = connected
    ? "border-emerald-200 border-s-4 border-s-emerald-500 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20"
    : disconnected
      ? "border-dashed border-line bg-surface-muted/40 text-muted"
      : "border-line bg-surface";

  return (
    <li className={`hover-lift flex items-start justify-between gap-4 rounded-2xl border p-4 shadow-soft sm:p-6 ${frame}`}>
      <div>
        <p className="font-medium">{t(`types.${connection.type}.label`)}</p>
        {providerLabel ? (
          <p className="mt-1 text-sm text-muted">
            {t("storeProviderLabel", { provider: providerLabel })}
          </p>
        ) : null}
        <p className="mt-1 text-sm text-muted">
          {description}
        </p>
        {connection.metadata?.errorMessage ? (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {connection.metadata.errorMessage}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {connected ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <span className="animate-pulse-dot size-2 rounded-full bg-emerald-500" />
            {t("activeNow")}
          </span>
        ) : null}
        <ConnectionStatusBadge
          type={connection.type}
          status={connection.status}
        />
      </div>
    </li>
  );
}
