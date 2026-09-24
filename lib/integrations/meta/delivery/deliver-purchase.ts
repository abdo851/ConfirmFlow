import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPurchaseConversionEvent } from "@/lib/conversions/purchase-event";
import { validateConversionEvent } from "@/lib/conversions/validation";
import { logger } from "@/lib/logging/logger";
import { MetaCapiClient, type MetaCapiTransport } from "../capi/client";
import { defaultMetaCapiTransport } from "../capi/transport";
import { loadEligibleMetaConnectionForStore } from "./eligibility";
import { loadOrderForPurchaseDelivery, type OrderForPurchaseDelivery } from "./load-order";
import {
  claimMetaPurchaseDelivery,
  ensureMetaPurchaseDeliveryRecord,
  getMetaPurchaseDeliveryByOrderId,
  markMetaPurchaseDeliveryFailed,
  markMetaPurchaseDeliveryNotEligible,
  markMetaPurchaseDeliverySent,
} from "./persistence";
import { isStaleSendingDelivery } from "./stale-sending";
import type {
  MetaConversionDeliveryRecord,
  MetaPurchaseDeliveryOutcome,
} from "./types";

function mapDeliveryRecordToOutcome(
  record: MetaConversionDeliveryRecord,
): MetaPurchaseDeliveryOutcome {
  switch (record.status) {
    case "sent":
      return {
        status: "sent",
        eventId: record.event_id,
      };
    case "sending":
      return {
        status: "in_progress",
        eventId: record.event_id,
      };
    case "failed":
      return {
        status: "failed",
        eventId: record.event_id,
        message: record.last_error ?? "Meta Purchase delivery failed.",
      };
    default:
      return {
        status: "pending",
        eventId: record.event_id,
        message: record.last_error ?? undefined,
      };
  }
}

function buildPurchaseEventFromOrder(order: OrderForPurchaseDelivery) {
  return buildPurchaseConversionEvent({
    orderId: order.id,
    eventTime: Math.floor(new Date(order.confirmed_at!).getTime() / 1000),
    currency: order.currency,
    valueMinor: order.total_amount_minor,
    email: order.customer_email,
    phone: order.customer_phone,
  });
}

function redactLoggedBody(body: unknown): unknown {
  try {
    return JSON.parse(
      JSON.stringify(body ?? null).replace(
        /access_token=[^&\s"]+/gi,
        "access_token=[REDACTED]",
      ),
    );
  } catch {
    return null;
  }
}

async function attemptMetaPurchaseSend(input: {
  delivery: MetaConversionDeliveryRecord;
  order: OrderForPurchaseDelivery;
  userId: string;
  db?: SupabaseClient;
  transport?: MetaCapiTransport;
  now?: number;
}): Promise<MetaPurchaseDeliveryOutcome> {
  const eligibility = await loadEligibleMetaConnectionForStore({
    userId: input.userId,
    storeId: input.order.store_id,
    db: input.db,
  });

  if (!eligibility.eligible) {
    logger.info("meta_delivery_eligibility_failed", {
      order_id: input.order.id,
      reason: eligibility.message,
    });
    await markMetaPurchaseDeliveryNotEligible({
      deliveryId: input.delivery.id,
      errorMessage: eligibility.message,
      db: input.db,
    });

    return {
      status: "not_eligible",
      eventId: input.delivery.event_id,
      message: eligibility.message,
    };
  }

  const event = buildPurchaseEventFromOrder(input.order);
  const validated = validateConversionEvent(event);
  if (!validated.ok) {
    const message = "Order is missing required Purchase information.";
    logger.error("meta_delivery_failed", {
      order_id: input.order.id,
      error: message,
    });
    await markMetaPurchaseDeliveryFailed({
      deliveryId: input.delivery.id,
      errorMessage: message,
      db: input.db,
    });

    return {
      status: "failed",
      eventId: input.delivery.event_id,
      message,
    };
  }

  const claimed = await claimMetaPurchaseDelivery({
    deliveryId: input.delivery.id,
    now: input.now,
    db: input.db,
  });

  if (!claimed) {
    const latest = await getMetaPurchaseDeliveryByOrderId({
      orderId: input.order.id,
      db: input.db,
    });

    if (!latest) {
      return {
        status: "failed",
        eventId: input.delivery.event_id,
        message: "Meta Purchase delivery record is unavailable.",
      };
    }

    return mapDeliveryRecordToOutcome(latest);
  }

  const client = new MetaCapiClient(input.transport ?? defaultMetaCapiTransport);
  const url = client.buildEventsUrl(eligibility.connection.pixelId);
  logger.info("meta_delivery_http_request", {
    order_id: input.order.id,
    url,
  });
  const sendResult = await client.sendEvent({
    pixelId: eligibility.connection.pixelId,
    accessToken: eligibility.connection.accessToken,
    event: validated.value,
  });
  logger.info("meta_delivery_http_response", {
    order_id: input.order.id,
    status: sendResult.status ?? null,
    body: redactLoggedBody(sendResult.body),
  });

  if (sendResult.success) {
    await markMetaPurchaseDeliverySent({
      deliveryId: claimed.id,
      db: input.db,
    });
    logger.info("meta_delivery_success", {
      order_id: input.order.id,
      event_id: claimed.event_id,
    });

    return {
      status: "sent",
      eventId: claimed.event_id,
    };
  }

  const failureMessage = sendResult.error ?? "Meta Purchase delivery failed.";
  logger.error("meta_delivery_failed", {
    order_id: input.order.id,
    error: failureMessage,
  });
  await markMetaPurchaseDeliveryFailed({
    deliveryId: claimed.id,
    errorMessage: failureMessage,
    db: input.db,
  });

  return {
    status: "failed",
    eventId: claimed.event_id,
    message: failureMessage,
  };
}

export async function processMetaPurchaseDelivery(input: {
  orderId: string;
  userId: string;
  /** @deprecated Reconciliation now occurs for any confirmed order missing a delivery row. */
  createIfMissing?: boolean;
  db?: SupabaseClient;
  transport?: MetaCapiTransport;
  now?: number;
}): Promise<MetaPurchaseDeliveryOutcome | null> {
  logger.info("meta_delivery_started", { order_id: input.orderId });

  const orderResult = await loadOrderForPurchaseDelivery({
    orderId: input.orderId,
    userId: input.userId,
    db: input.db,
  });

  if (!orderResult.ok) {
    logger.error("meta_delivery_failed", {
      order_id: input.orderId,
      error: orderResult.reason,
    });
    return null;
  }

  let delivery = await getMetaPurchaseDeliveryByOrderId({
    orderId: input.orderId,
    db: input.db,
  });

  if (!delivery) {
    delivery = await ensureMetaPurchaseDeliveryRecord({
      storeId: orderResult.order.store_id,
      orderId: input.orderId,
      db: input.db,
    });
  }

  if (delivery.status === "sent") {
    return mapDeliveryRecordToOutcome(delivery);
  }

  if (
    delivery.status === "sending" &&
    !isStaleSendingDelivery(delivery, input.now)
  ) {
    return mapDeliveryRecordToOutcome(delivery);
  }

  return attemptMetaPurchaseSend({
    delivery,
    order: orderResult.order,
    userId: input.userId,
    db: input.db,
    transport: input.transport,
    now: input.now,
  });
}
