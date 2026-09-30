import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { dispatchGooglePurchaseDelivery } from "@/lib/integrations/google/delivery/deliver-purchase";
import type { MetaCapiTransport } from "@/lib/integrations/meta/capi/client";
import { processMetaPurchaseDelivery } from "@/lib/integrations/meta/delivery/deliver-purchase";
import type { MetaPurchaseDeliveryOutcome } from "@/lib/integrations/meta/delivery/types";
import { dispatchTikTokPurchaseDelivery } from "@/lib/integrations/tiktok/delivery/deliver-purchase";
import { logAdEvent } from "@/lib/ads/events/log";
import { logger } from "@/lib/logging/logger";

export async function dispatchPurchaseDeliveryAfterConfirmation(input: {
  orderId: string;
  userId: string;
  db?: SupabaseClient;
  transport?: MetaCapiTransport;
  now?: number;
}): Promise<MetaPurchaseDeliveryOutcome | null> {
  let metaResult: MetaPurchaseDeliveryOutcome | null = null;
  let metaError: unknown;
  try {
    metaResult = await processMetaPurchaseDelivery(input);
    notePlatform(input.userId, input.orderId, "meta", metaResult);
  } catch (error) {
    metaError = error;
    logger.error("meta_delivery_failed", { order_id: input.orderId });
    notePlatform(input.userId, input.orderId, "meta", null, error);
  }

  try {
    const tiktokResult = await dispatchTikTokPurchaseDelivery(input.orderId);
    notePlatform(input.userId, input.orderId, "tiktok", tiktokResult);
  } catch (error) {
    // TikTok delivery is independent. A failure must not block Meta.
    notePlatform(input.userId, input.orderId, "tiktok", null, error);
  }

  try {
    const googleResult = await dispatchGooglePurchaseDelivery(input.orderId);
    notePlatform(input.userId, input.orderId, "google", googleResult);
  } catch (error) {
    // Google delivery is independent. A failure must not block Meta.
    notePlatform(input.userId, input.orderId, "google", null, error);
  }

  if (metaError) {
    throw metaError;
  }

  return metaResult;
}

function notePlatform(
  ownerId: string,
  orderId: string,
  platform: "meta" | "tiktok" | "google",
  outcome: {
    status: string;
    eventId?: string;
    message?: string;
    payload?: unknown;
    httpStatus?: number;
    responseSummary?: unknown;
  } | null,
  error?: unknown,
) {
  if (error) {
    void logAdEvent({
      ownerId,
      orderId,
      platform,
      eventName: "Purchase",
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "delivery_failed",
    }).catch(() => {});
    return;
  }

  if (!outcome || outcome.status === "not_eligible" || outcome.status === "pending" || outcome.status === "in_progress") {
    void logAdEvent({
      ownerId,
      orderId,
      platform,
      eventName: "Purchase",
      status: "skipped",
      errorMessage: outcome?.message || outcome?.status || "skipped",
      payload: outcome?.payload,
      httpStatus: outcome?.httpStatus,
      responseSummary: outcome?.responseSummary,
    }).catch(() => {});
    return;
  }

  if (outcome.status === "sent") {
    void logAdEvent({
      ownerId,
      orderId,
      platform,
      eventName: "Purchase",
      status: "sent",
      payload: outcome.payload,
      httpStatus: outcome.httpStatus,
      responseSummary: outcome.responseSummary,
    }).catch(() => {});
    return;
  }

  void logAdEvent({
    ownerId,
    orderId,
    platform,
    eventName: "Purchase",
    status: "failed",
    errorMessage: outcome.message || "failed",
    payload: outcome.payload,
    httpStatus: outcome.httpStatus,
    responseSummary: outcome.responseSummary,
  }).catch(() => {});
}
