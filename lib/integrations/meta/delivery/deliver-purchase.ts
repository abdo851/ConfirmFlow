import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPurchaseConversionEvent } from "@/lib/conversions/purchase-event";
import { validateConversionEvent } from "@/lib/conversions/validation";
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

async function attemptMetaPurchaseSend(input: {
  delivery: MetaConversionDeliveryRecord;
  order: OrderForPurchaseDelivery;
  userId: string;
  db?: SupabaseClient;
  transport?: MetaCapiTransport;
}): Promise<MetaPurchaseDeliveryOutcome> {
  const eligibility = await loadEligibleMetaConnectionForStore({
    userId: input.userId,
    storeId: input.order.store_id,
    db: input.db,
  });

  if (!eligibility.eligible) {
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
  const sendResult = await client.sendEvent({
    pixelId: eligibility.connection.pixelId,
    accessToken: eligibility.connection.accessToken,
    event: validated.value,
  });

  if (sendResult.success) {
    await markMetaPurchaseDeliverySent({
      deliveryId: claimed.id,
      db: input.db,
    });

    return {
      status: "sent",
      eventId: claimed.event_id,
    };
  }

  const failureMessage = sendResult.error ?? "Meta Purchase delivery failed.";
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
  createIfMissing: boolean;
  db?: SupabaseClient;
  transport?: MetaCapiTransport;
}): Promise<MetaPurchaseDeliveryOutcome | null> {
  const orderResult = await loadOrderForPurchaseDelivery({
    orderId: input.orderId,
    userId: input.userId,
    db: input.db,
  });

  if (!orderResult.ok) {
    return null;
  }

  let delivery = await getMetaPurchaseDeliveryByOrderId({
    orderId: input.orderId,
    db: input.db,
  });

  if (!delivery && input.createIfMissing) {
    delivery = await ensureMetaPurchaseDeliveryRecord({
      storeId: orderResult.order.store_id,
      orderId: input.orderId,
      db: input.db,
    });
  }

  if (!delivery) {
    return null;
  }

  if (delivery.status === "sent") {
    return mapDeliveryRecordToOutcome(delivery);
  }

  if (delivery.status === "sending") {
    return mapDeliveryRecordToOutcome(delivery);
  }

  return attemptMetaPurchaseSend({
    delivery,
    order: orderResult.order,
    userId: input.userId,
    db: input.db,
    transport: input.transport,
  });
}
