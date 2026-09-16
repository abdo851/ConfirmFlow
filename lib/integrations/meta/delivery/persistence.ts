import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createDatabaseClient } from "@/lib/database/client";
import { buildPurchaseEventId } from "@/lib/conversions/event-id";
import type { MetaConversionDeliveryRecord } from "./types";

export class MetaDeliveryPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MetaDeliveryPersistenceError";
  }
}

async function getDatabaseClient(db?: SupabaseClient): Promise<SupabaseClient> {
  return db ?? createDatabaseClient();
}

export async function getMetaPurchaseDeliveryByOrderId(input: {
  orderId: string;
  db?: SupabaseClient;
}): Promise<MetaConversionDeliveryRecord | null> {
  const db = await getDatabaseClient(input.db);

  const { data, error } = await db
    .from("meta_conversion_deliveries")
    .select("*")
    .eq("order_id", input.orderId)
    .eq("provider", "meta")
    .eq("event_type", "Purchase")
    .maybeSingle();

  if (error) {
    throw new MetaDeliveryPersistenceError("Unable to load Meta delivery record.");
  }

  return (data as MetaConversionDeliveryRecord | null) ?? null;
}

export async function ensureMetaPurchaseDeliveryRecord(input: {
  storeId: string;
  orderId: string;
  db?: SupabaseClient;
}): Promise<MetaConversionDeliveryRecord> {
  const db = await getDatabaseClient(input.db);
  const eventId = buildPurchaseEventId(input.orderId);

  const { error: insertError } = await db.from("meta_conversion_deliveries").insert({
    store_id: input.storeId,
    order_id: input.orderId,
    provider: "meta",
    event_type: "Purchase",
    event_id: eventId,
    status: "pending",
  });

  if (insertError && insertError.code !== "23505") {
    throw new MetaDeliveryPersistenceError("Unable to create Meta delivery record.");
  }

  const existing = await getMetaPurchaseDeliveryByOrderId({
    orderId: input.orderId,
    db,
  });

  if (!existing) {
    throw new MetaDeliveryPersistenceError("Unable to create Meta delivery record.");
  }

  return existing;
}

export async function claimMetaPurchaseDelivery(input: {
  deliveryId: string;
  db?: SupabaseClient;
}): Promise<MetaConversionDeliveryRecord | null> {
  const db = await getDatabaseClient(input.db);
  const existing = await db
    .from("meta_conversion_deliveries")
    .select("*")
    .eq("id", input.deliveryId)
    .maybeSingle();

  if (existing.error || !existing.data) {
    throw new MetaDeliveryPersistenceError("Unable to claim Meta delivery record.");
  }

  const record = existing.data as MetaConversionDeliveryRecord;
  const attemptedAt = new Date().toISOString();

  const { data, error } = await db
    .from("meta_conversion_deliveries")
    .update({
      status: "sending",
      attempts: record.attempts + 1,
      last_attempted_at: attemptedAt,
      last_error: null,
    })
    .eq("id", input.deliveryId)
    .in("status", ["pending", "failed"])
    .select("*")
    .maybeSingle();

  if (error) {
    throw new MetaDeliveryPersistenceError("Unable to claim Meta delivery record.");
  }

  return (data as MetaConversionDeliveryRecord | null) ?? null;
}

export async function markMetaPurchaseDeliverySent(input: {
  deliveryId: string;
  db?: SupabaseClient;
}): Promise<void> {
  const db = await getDatabaseClient(input.db);
  const sentAt = new Date().toISOString();

  const { error } = await db
    .from("meta_conversion_deliveries")
    .update({
      status: "sent",
      sent_at: sentAt,
      last_error: null,
    })
    .eq("id", input.deliveryId);

  if (error) {
    throw new MetaDeliveryPersistenceError("Unable to update Meta delivery record.");
  }
}

export async function markMetaPurchaseDeliveryFailed(input: {
  deliveryId: string;
  errorMessage: string;
  db?: SupabaseClient;
}): Promise<void> {
  const db = await getDatabaseClient(input.db);

  const { error } = await db
    .from("meta_conversion_deliveries")
    .update({
      status: "failed",
      last_error: input.errorMessage,
    })
    .eq("id", input.deliveryId);

  if (error) {
    throw new MetaDeliveryPersistenceError("Unable to update Meta delivery record.");
  }
}

export async function markMetaPurchaseDeliveryNotEligible(input: {
  deliveryId: string;
  errorMessage: string;
  db?: SupabaseClient;
}): Promise<void> {
  const db = await getDatabaseClient(input.db);

  const { error } = await db
    .from("meta_conversion_deliveries")
    .update({
      status: "pending",
      last_error: input.errorMessage,
    })
    .eq("id", input.deliveryId);

  if (error) {
    throw new MetaDeliveryPersistenceError("Unable to update Meta delivery record.");
  }
}
