import "server-only";

import { createUserDatabaseClient } from "@/lib/database/user-client";

export interface MetaDeliveryRow {
  order_id: string;
  event_type: string;
  status: string;
  attempts: number;
  last_attempted_at: string | null;
  last_error: string | null;
}

export async function getMetaDeliveriesForUser(limit = 10): Promise<MetaDeliveryRow[]> {
  const db = await createUserDatabaseClient();
  const { data, error } = await db
    .from("meta_conversion_deliveries")
    .select("order_id, event_type, status, attempts, last_attempted_at, last_error")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    order_id: String(row.order_id),
    event_type: String(row.event_type),
    status: String(row.status),
    attempts: Number(row.attempts ?? 0),
    last_attempted_at: row.last_attempted_at ? String(row.last_attempted_at) : null,
    last_error: row.last_error ? String(row.last_error) : null,
  }));
}

export async function getMetaDeliveryForOrder(orderId: string): Promise<MetaDeliveryRow | null> {
  const db = await createUserDatabaseClient();
  const { data, error } = await db
    .from("meta_conversion_deliveries")
    .select("order_id, event_type, status, attempts, last_attempted_at, last_error")
    .eq("order_id", orderId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    order_id: String(data.order_id),
    event_type: String(data.event_type),
    status: String(data.status),
    attempts: Number(data.attempts ?? 0),
    last_attempted_at: data.last_attempted_at ? String(data.last_attempted_at) : null,
    last_error: data.last_error ? String(data.last_error) : null,
  };
}

export function metaConnectionMode(status: string | undefined): "details" | "connect" {
  return status === "connected" || status === "connecting" || status === "error" ? "details" : "connect";
}
