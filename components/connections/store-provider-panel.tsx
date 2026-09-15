import { ConnectPlaceholderButton } from "@/components/onboarding/connect-placeholder-button";
import { ConnectionStatusBadge } from "./connection-status-badge";
import {
  SHOPIFY_FOUNDATION_MESSAGE,
  SHOPIFY_PROVIDER_LABEL,
} from "@/integrations/stores/shopify";
import { getDefaultConnectionState } from "@/lib/connections";

export function StoreProviderPanel() {
  const storeConnection = getDefaultConnectionState("store");

  return (
    <div className="rounded-md border border-neutral-200 px-4 py-4 dark:border-neutral-800">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Store provider</p>
          <p className="mt-1 text-base font-semibold">{SHOPIFY_PROVIDER_LABEL}</p>
        </div>
        <ConnectionStatusBadge
          type={storeConnection.type}
          status={storeConnection.status}
        />
      </div>
      <div className="mt-4">
        <ConnectPlaceholderButton
          label="Connect Shopify"
          message={SHOPIFY_FOUNDATION_MESSAGE}
        />
      </div>
    </div>
  );
}
