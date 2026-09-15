import type { MarketingAdapter } from "@/lib/integrations/adapters";
import type { InternalEventType } from "@/lib/events";

/**
 * Conversion Engine — future responsibility:
 * Order confirmation → Conversion decision → Marketing adapter → Platform API
 *
 * M0: interface only. No Meta events, no Purchase logic, no deduplication.
 */

export interface ConversionDecision {
  shouldSend: boolean;
  reason?: string;
  eventType?: string;
}

export interface ConversionEngine {
  /** Evaluate whether a confirmed order should trigger a conversion event */
  evaluate(
    orderId: string,
    storeId: string,
  ): Promise<ConversionDecision>;

  /** Route an approved conversion to the appropriate marketing adapter */
  dispatch(
    orderId: string,
    storeId: string,
    adapter: MarketingAdapter,
  ): Promise<void>;
}

/** Placeholder type linking internal events to conversion flow */
export type ConversionTriggerEvent =
  | InternalEventType.ORDER_CONFIRMED
  | InternalEventType.CONVERSION_CREATED;
