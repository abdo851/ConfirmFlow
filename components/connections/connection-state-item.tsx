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

  const accent =
    connection.type === "meta"
      ? "border-s-sky-500"
      : connection.type === "confirmation"
        ? "border-s-teal-500"
        : "border-s-indigo-500";

  return (
    <li className={`flex items-start justify-between gap-4 rounded-2xl border border-line border-s-4 bg-surface p-4 shadow-soft ${accent}`}>
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
      <ConnectionStatusBadge
        type={connection.type}
        status={connection.status}
      />
    </li>
  );
}
