import { buildPurchaseEventId } from "./event-id";
import type { ConversionEvent } from "./types";

export interface PurchaseConversionEventInput {
  orderId: string;
  /** Unix timestamp in seconds from server-side confirmation time. */
  eventTime: number;
  currency: string;
  valueMinor: number;
  email?: string | null;
  phone?: string | null;
}

/**
 * Builds a provider-independent Purchase conversion event.
 * Does not query orders or the confirmation engine — caller supplies data.
 */
export function buildPurchaseConversionEvent(
  input: PurchaseConversionEventInput,
): ConversionEvent {
  return {
    eventName: "Purchase",
    eventId: buildPurchaseEventId(input.orderId),
    eventTime: input.eventTime,
    actionSource: "server",
    userData: {
      email: input.email ?? null,
      phone: input.phone ?? null,
    },
    customData: {
      currency: input.currency.trim().toUpperCase(),
      valueMinor: input.valueMinor,
    },
  };
}
