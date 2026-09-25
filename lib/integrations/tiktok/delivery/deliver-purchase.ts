import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createDatabaseClient } from "@/lib/database/client";
import { minorUnitsToMajorAmount } from "@/lib/orders/money";
import { logger } from "@/lib/logging/logger";
import { sendEvent, tiktokResponseAccepted, type TikTokEventsTransport } from "../capi/client";
import { buildTikTokPayload } from "../capi/payload-builder";
import { loadEligibleTikTokConnectionForStore } from "./eligibility";

const STALE_SENDING_MS = 5 * 60 * 1000;

export interface TikTokPurchaseDeliveryOutcome {
  status: "sent" | "pending" | "failed" | "not_eligible" | "in_progress";
  eventId?: string;
  message?: string;
}

interface DeliveryRow {
  id: string;
  store_id: string;
  order_id: string;
  event_id: string;
  status: "pending" | "sending" | "sent" | "failed";
  attempts: number;
  last_attempted_at: string | null;
  last_error: string | null;
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
  return `tiktok:purchase:${orderId}`;
}

function safeText(value: unknown): string {
  const raw = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return raw
    .replace(/access[_-]?token["']?\s*[:=]\s*["']?[^"'\s]+/gi, "access_token=[REDACTED]")
    .slice(0, 2000);
}

async function loadOrder(db: SupabaseClient, orderId: string): Promise<OrderRow | null> {
  const { data, error } = await db
    .from("orders")
    .select(
      "id, store_id, confirmation_status, confirmed_at, currency, total_amount_minor, customer_email, customer_phone",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as OrderRow;
}

async function loadDelivery(db: SupabaseClient, orderId: string): Promise<DeliveryRow | null> {
  const { data, error } = await db
    .from("tiktok_conversion_deliveries")
    .select("id, store_id, order_id, event_id, status, attempts, last_attempted_at, last_error")
    .eq("order_id", orderId)
    .eq("event_type", "Purchase")
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load TikTok delivery record.");
  }

  return (data as DeliveryRow | null) ?? null;
}

async function ensureDelivery(db: SupabaseClient, order: OrderRow): Promise<DeliveryRow> {
  const existing = await loadDelivery(db, order.id);
  if (existing) {
    return existing;
  }

  const eventId = eventIdFor(order.id);
  const { error } = await db.from("tiktok_conversion_deliveries").insert({
    store_id: order.store_id,
    order_id: order.id,
    event_type: "Purchase",
    event_id: eventId,
    status: "pending",
  });

  if (error && error.code !== "23505") {
    throw new Error("Unable to create TikTok delivery record.");
  }

  const created = await loadDelivery(db, order.id);
  if (!created) {
    throw new Error("Unable to create TikTok delivery record.");
  }

  return created;
}

function isFreshSending(row: DeliveryRow, now: number): boolean {
  if (row.status !== "sending" || !row.last_attempted_at) {
    return false;
  }

  return now - new Date(row.last_attempted_at).getTime() < STALE_SENDING_MS;
}

export async function processTikTokPurchaseDelivery(input: {
  order_id: string;
  db?: SupabaseClient;
  transport?: TikTokEventsTransport;
  now?: number;
}): Promise<TikTokPurchaseDeliveryOutcome | null> {
  const db = input.db ?? createDatabaseClient();
  const order = await loadOrder(db, input.order_id);

  if (!order) {
    return null;
  }

  if (order.confirmation_status !== "confirmed" || !order.confirmed_at) {
    return { status: "not_eligible", message: "Order is not confirmed." };
  }

  const delivery = await ensureDelivery(db, order);
  if (delivery.status === "sent") {
    return { status: "sent", eventId: delivery.event_id };
  }

  const now = input.now ?? Date.now();
  if (isFreshSending(delivery, now)) {
    return { status: "in_progress", eventId: delivery.event_id };
  }

  const eligibility = await loadEligibleTikTokConnectionForStore({
    storeId: order.store_id,
    db,
  });

  if (!eligibility.eligible) {
    await db
      .from("tiktok_conversion_deliveries")
      .update({ status: "failed", last_error: eligibility.message })
      .eq("id", delivery.id);

    return {
      status: "not_eligible",
      eventId: delivery.event_id,
      message: eligibility.message,
    };
  }

  if (!order.currency || order.total_amount_minor === null) {
    const message = "Order is missing required Purchase information.";
    await db
      .from("tiktok_conversion_deliveries")
      .update({ status: "failed", last_error: message })
      .eq("id", delivery.id);
    return { status: "failed", eventId: delivery.event_id, message };
  }

  const { data: claimed, error: claimError } = await db
    .from("tiktok_conversion_deliveries")
    .update({
      status: "sending",
      attempts: delivery.attempts + 1,
      last_attempted_at: new Date(now).toISOString(),
      last_error: null,
    })
    .eq("id", delivery.id)
    .in("status", ["pending", "failed", "sending"])
    .select("id, event_id")
    .maybeSingle();

  if (claimError || !claimed) {
    return { status: "in_progress", eventId: delivery.event_id };
  }

  const payload = buildTikTokPayload({
    pixel_code: eligibility.connection.pixelCode,
    event_id: delivery.event_id,
    confirmed_at: order.confirmed_at,
    order: {
      currency: order.currency,
      value: minorUnitsToMajorAmount(order.total_amount_minor, order.currency),
      email: order.customer_email,
      phone: order.customer_phone,
    },
  });

  const sendResult = await sendEvent({
    pixel_code: eligibility.connection.pixelCode,
    access_token: eligibility.connection.accessToken,
    event: payload,
    transport: input.transport,
  });

  if (tiktokResponseAccepted(sendResult)) {
    await db
      .from("tiktok_conversion_deliveries")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        last_error: null,
        response_body: safeText(sendResult.body),
      })
      .eq("id", delivery.id);

    logger.info("tiktok_delivery_success", { order_id: order.id, event_id: delivery.event_id });
    return { status: "sent", eventId: delivery.event_id };
  }

  const message = "TikTok Purchase delivery failed.";
  await db
    .from("tiktok_conversion_deliveries")
    .update({
      status: "failed",
      last_error: message,
      response_body: safeText(sendResult.body),
    })
    .eq("id", delivery.id);

  logger.error("tiktok_delivery_failed", { order_id: order.id, status: sendResult.status });
  return { status: "failed", eventId: delivery.event_id, message };
}

export async function dispatchTikTokPurchaseDelivery(
  orderId: string,
): Promise<TikTokPurchaseDeliveryOutcome | null> {
  return processTikTokPurchaseDelivery({ order_id: orderId });
}
