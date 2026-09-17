import {
  SHOPIFY_PROVIDER_ID,
  SHOPIFY_PROVIDER_LABEL,
} from "@/integrations/stores/shopify/constants";
import type { StorePlatform } from "@/lib/integrations/adapters/store-adapter";

export const supportedStoreProviders = [
  {
    id: SHOPIFY_PROVIDER_ID,
    label: SHOPIFY_PROVIDER_LABEL,
  },
] as const satisfies ReadonlyArray<{ id: StorePlatform; label: string }>;

export function isSupportedStoreProvider(
  provider: string,
): provider is StorePlatform {
  return supportedStoreProviders.some((item) => item.id === provider);
}

export function getStoreProviderLabel(provider: string): string | undefined {
  return supportedStoreProviders.find((item) => item.id === provider)?.label;
}
