import { createDatabaseClient } from "@/lib/database/client";
import type { EventSource, EventType } from "./types";

export async function logEvent(input: {
  ownerId: string;
  orderId: string | null;
  type: EventType;
  source: EventSource;
  payload?: Record<string, unknown>;
}): Promise<{ id: string } | null> {
  try {
    const db = createDatabaseClient();
    const { data, error } = await db
      .from("events")
      .insert({
        owner_id: input.ownerId,
        order_id: input.orderId,
        type: input.type,
        source: input.source,
        payload: input.payload ?? {},
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return null;
      }
      console.warn("foundation_event_log_failed");
      return null;
    }

    if (!data || typeof data.id !== "string") {
      console.warn("foundation_event_log_failed");
      return null;
    }

    return { id: data.id };
  } catch {
    console.warn("foundation_event_log_failed");
    return null;
  }
}
