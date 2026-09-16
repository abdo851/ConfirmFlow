import type { ConversionEvent } from "@/lib/conversions/types";
import type {
  ConversionPayload,
  ConversionSendResult,
  MarketingAdapter,
} from "@/lib/integrations/adapters/marketing-adapter";
import { buildMetaCapiPayload } from "@/lib/integrations/meta/capi/payload-builder";
import type { MetaCapiRequestPayload } from "@/lib/integrations/meta/capi/types";

/**
 * Meta marketing adapter — maps Confirma conversion events to Meta CAPI payloads.
 * M4-B builds payloads only; network delivery is not implemented.
 */
export class MetaMarketingAdapter implements MarketingAdapter {
  readonly platform = "meta" as const;

  buildPurchasePayload(event: ConversionEvent): MetaCapiRequestPayload {
    return buildMetaCapiPayload(event);
  }

  async sendConversion(payload: ConversionPayload): Promise<ConversionSendResult> {
    void payload;
    return {
      success: false,
      error: "Meta conversion dispatch is not implemented.",
    };
  }
}
