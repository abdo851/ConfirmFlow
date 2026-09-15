/**
 * MarketingAdapter — abstraction for marketing/conversion platforms.
 * Future implementations: MetaAdapter, GoogleAdapter, TikTokAdapter
 */

export type MarketingPlatform = "meta" | "google" | "tiktok";

export type ConversionEventType = "purchase" | "lead" | "custom";

export interface ConversionPayload {
  eventType: ConversionEventType;
  orderId: string;
  storeId: string;
  value?: number;
  currency?: string;
  /** Hashed PII and platform-specific fields — populated in future milestones */
  customerData?: Record<string, string>;
}

export interface ConversionSendResult {
  success: boolean;
  platformEventId?: string;
  error?: string;
}

export interface MarketingAdapter {
  readonly platform: MarketingPlatform;

  /** Send a conversion event to the marketing platform */
  sendConversion(payload: ConversionPayload): Promise<ConversionSendResult>;
}
