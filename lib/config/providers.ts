export const SUPPORTED_STORE_PROVIDERS = ["shopify", "youcan"] as const;
export const SUPPORTED_MARKETING_PROVIDERS = ["meta"] as const;
export const SUPPORTED_CONFIRMATION_PROVIDERS = [] as const;

export type SupportedStoreProvider =
  (typeof SUPPORTED_STORE_PROVIDERS)[number];
export type SupportedMarketingProvider =
  (typeof SUPPORTED_MARKETING_PROVIDERS)[number];
export type SupportedConfirmationProvider =
  (typeof SUPPORTED_CONFIRMATION_PROVIDERS)[number];

export function isSupportedStoreProviderId(
  provider: string,
): provider is SupportedStoreProvider {
  return (SUPPORTED_STORE_PROVIDERS as readonly string[]).includes(provider);
}

export function isSupportedMarketingProviderId(
  provider: string,
): provider is SupportedMarketingProvider {
  return (SUPPORTED_MARKETING_PROVIDERS as readonly string[]).includes(provider);
}
