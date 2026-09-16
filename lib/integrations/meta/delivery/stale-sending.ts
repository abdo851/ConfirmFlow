import { META_PURCHASE_STALE_SENDING_THRESHOLD_MS } from "./config";
import type { MetaConversionDeliveryRecord } from "./types";

export function getStaleSendingCutoffIso(now = Date.now()): string {
  return new Date(now - META_PURCHASE_STALE_SENDING_THRESHOLD_MS).toISOString();
}

/**
 * A sending delivery is stale when reclaim is safe.
 * Meta event_id deduplication prevents duplicate logical Purchase events on retry.
 */
export function isStaleSendingDelivery(
  record: MetaConversionDeliveryRecord,
  now = Date.now(),
): boolean {
  if (record.status !== "sending") {
    return false;
  }

  if (!record.last_attempted_at) {
    return true;
  }

  return (
    now - new Date(record.last_attempted_at).getTime() >=
    META_PURCHASE_STALE_SENDING_THRESHOLD_MS
  );
}
