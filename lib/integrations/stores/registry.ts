import { shopifyAdapter } from "@/integrations/stores/shopify";
import { youcanAdapter } from "@/integrations/stores/youcan";
import type { StoreAdapter, StorePlatform } from "@/lib/integrations/adapters/store-adapter";
import { isSupportedStoreProvider } from "./supported-providers";

const storeAdapters: Partial<Record<StorePlatform, StoreAdapter>> = {
  shopify: shopifyAdapter,
  youcan: youcanAdapter,
};

export function getStoreAdapter(platform: StorePlatform): StoreAdapter {
  const adapter = storeAdapters[platform];
  if (!adapter) {
    throw new Error(`No store adapter registered for platform: ${platform}`);
  }
  return adapter;
}

export function getStoreAdapterIfSupported(
  platform: string,
): StoreAdapter | null {
  if (!isSupportedStoreProvider(platform)) {
    return null;
  }
  return getStoreAdapter(platform);
}
