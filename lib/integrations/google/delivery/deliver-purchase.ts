import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createDatabaseClient } from "@/lib/database/client";
import { logger } from "@/lib/logging/logger";
import { minorUnitsToMajorAmount } from "@/lib/orders/money";
import { googleResponseAccepted, sendEvent, type GoogleAdsTransport } from "../capi/client";
import { buildGooglePayload } from "../capi/payload-builder";
import { googleCustomerId } from "../validation";
import { loadEligibleGoogleConnectionForStore } from "./eligibility";

const STALE_SENDING_MS = 5 * 60 * 1000;

export interface GooglePurchaseDeliveryOutcome {
  status: "sent" | "pending" | "failed" | "not_eligible" | "in_progress";
  eventId?: string;
  message?: string;
}

interface DeliveryRow {
  id: string;
  event_id: string;
  status: "pending" | "sending" | "sent" | "failed";
  attempts: number;
  last_attempted_at: string | null;
}

interface OrderRow {
  id: string;
  store_id: string;
  confirmation_status: string;
  confirmed_at: string | null;
  currency: string | null;
  total_amount_minor: number | null;
  customer_email: string | null;
  customer_phone: string | null;
}

function eventIdFor(orderId: string): string {
  return `google:purchase:${orderId}`;
}

function safeText(value: unknown): string {
  const raw = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return raw.replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]").slice(0, 2000);
}

export async function processGooglePurchaseDelivery(input: {
  order_id: string;
  db?: SupabaseClient;
  transport?: GoogleAdsTransport;
  now?: number;
}): Promise<GooglePurchaseDeliveryOutcome | null> {
  const db = input.db ?? createDatabaseClient();
  const { data: order, error: orderError } = await db
    .from("orders")
    .select(
      "id, store_id, confirmation_status, confirmed_at, currency, total_amount_minor, customer_email, customer_phone",
    )
    .eq("id", input.order_id)
    .maybeSingle();

  if (orderError || !order) {
    return null;
  }

  const row = order as OrderRow;
  if (row.confirmation_status !== "confirmed" || !row.confirmed_at) {
    return { status: "not_eligible", message: "Order is not confirmed." };
  }

  const eventId = eventIdFor(row.id);
  const { error: insertError } = await db.from("google_conversion_deliveries").insert({
    store_id: row.store_id,
    order_id: row.id,
    event_type: "Purchase",
    event_id: eventId,
    status: "pending",
  });

  if (insertError && insertError.code !== "23505") {
    throw new Error("Unable to create Google delivery record.");
  }

  const { data: delivery, error: deliveryError } = await db
    .from("google_conversion_deliveries")
    .select("id, event_id, status, attempts, last_attempted_at")
    .eq("order_id", row.id)
    .eq("event_type", "Purchase")
    .maybeSingle();

  if (deliveryError || !delivery) {
    throw new Error("Unable to load Google delivery record.");
  }

  const current = delivery as DeliveryRow;
  if (current.status === "sent") {
    return { status: "sent", eventId: current.event_id };
  }

  const now = input.now ?? Date.now();
  if (
    current.status === "sending" &&
    current.last_attempted_at &&
    now - new Date(current.last_attempted_at).getTime() < STALE_SENDING_MS
  ) {
    return { status: "in_progress", eventId: current.event_id };
  }

  const eligibility = await loadEligibleGoogleConnectionForStore({
    storeId: row.store_id,
    db,
  });

  if (!eligibility.eligible) {
    await db
      .from("google_conversion_deliveries")
      .update({ status: "failed", last_error: eligibility.message })
      .eq("id", current.id);

    return {
      status: "not_eligible",
      eventId: current.event_id,
      message: eligibility.message,
    };
  }

  if (!row.currency || row.total_amount_minor === null) {
    const message = "Order is missing required Purchase information.";
    await db
      .from("google_conversion_deliveries")
      .update({ status: "failed", last_error: message })
      .eq("id", current.id);
    return { status: "failed", eventId: current.event_id, message };
  }

  const { data: claimed, error: claimError } = await db
    .from("google_conversion_deliveries")
    .update({
      status: "sending",
      attempts: current.attempts + 1,
      last_attempted_at: new Date(now).toISOString(),
      last_error: null,
    })
    .eq("id", current.id)
    .in("status", ["pending", "failed", "sending"])
    .select("id")
    .maybeSingle();

  if (claimError || !claimed) {
    return { status: "in_progress", eventId: current.event_id };
  }

  const payload = buildGooglePayload({
    conversion_id: eligibility.connection.conversionId,
    conversion_label: eligibility.connection.conversionLabel,
    event_id: current.event_id,
    confirmed_at: row.confirmed_at,
    order: {
      id: row.id,
      currency: row.currency,
      value: minorUnitsToMajorAmount(row.total_amount_minor, row.currency),
      email: row.customer_email,
      phone: row.customer_phone,
    },
  });

  const sendResult = await sendEvent({
    customer_id: googleCustomerId(eligibility.connection.conversionId),
    access_token: eligibility.connection.accessToken,
    event: payload,
    transport: input.transport,
  });

  if (googleResponseAccepted(sendResult)) {
    await db
      .from("google_conversion_deliveries")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        last_error: null,
        response_body: safeText(sendResult.body),
      })
      .eq("id", current.id);

    logger.info("google_delivery_success", { order_id: row.id, event_id: current.event_id });
    return { status: "sent", eventId: current.event_id };
  }

  const message =
    sendResult.status === 0
      ? "Google Ads developer token is not configured."
      : "Google Purchase delivery failed.";

  await db
    .from("google_conversion_deliveries")
    .update({
      status: "failed",
      last_error: message,
      response_body: safeText(sendResult.body),
    })
    .eq("id", current.id);

  logger.error("google_delivery_failed", { order_id: row.id, status: sendResult.status });
  return { status: "failed", eventId: current.event_id, message };
}

export async function dispatchGooglePurchaseDelivery(
  orderId: string,
): Promise<GooglePurchaseDeliveryOutcome | null> {
  return processGooglePurchaseDelivery({ order_id: orderId });
}
