import type {
  ConversionPayload,
  ConversionSendResult,
  MarketingAdapter,
} from "@/lib/integrations/adapters/marketing-adapter";

/**
 * Meta marketing adapter — configuration boundary only in M4-A.
 * Conversion dispatch is intentionally not implemented.
 */
export class MetaMarketingAdapter implements MarketingAdapter {
  readonly platform = "meta" as const;

  async sendConversion(payload: ConversionPayload): Promise<ConversionSendResult> {
    void payload;
    return {
      success: false,
      error: "Meta conversion dispatch is not implemented.",
    };
  }
}
