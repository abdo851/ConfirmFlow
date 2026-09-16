const PURCHASE_EVENT_PREFIX = "purchase";

/**
 * Deterministic Purchase event ID for a Confirma order.
 * Same order + event type always yields the same event_id.
 */
export function buildPurchaseEventId(orderId: string): string {
  const normalizedOrderId = orderId.trim();
  if (!normalizedOrderId) {
    throw new Error("order_id_required");
  }

  return `${PURCHASE_EVENT_PREFIX}:${normalizedOrderId}`;
}
