import { createDatabaseClient } from "@/lib/database/client";
import { logEvent } from "./event-logger";
import type { AdvertisingDestination, EventSource, EventType } from "./types";

const DESTINATIONS: readonly AdvertisingDestination[] = ["meta", "tiktok", "google"];

function isDestination(value: unknown): value is AdvertisingDestination {
  return typeof value === "string" && (DESTINATIONS as readonly string[]).includes(value);
}

export async function dispatchEvent(input: {
  ownerId: string;
  orderId: string | null;
  type: EventType;
  source: EventSource;
  payload?: Record<string, unknown>;
}): Promise<{
  logged: boolean;
  destinations: AdvertisingDestination[];
}> {
  const logged = (await logEvent(input)) !== null;

  try {
    const db = createDatabaseClient();
    const { data, error } = await db
      .from("routing_rules")
      .select("destination")
      .eq("owner_id", input.ownerId)
      .eq("event_type", input.type)
      .eq("enabled", true);

    if (error || !Array.isArray(data)) {
      console.warn("foundation_routing_rules_failed");
      return { logged, destinations: [] };
    }

    const destinations: AdvertisingDestination[] = [];
    for (const row of data) {
      if (row && typeof row === "object" && "destination" in row && isDestination(row.destination)) {
        destinations.push(row.destination);
      }
    }

    return { logged, destinations };
  } catch {
    console.warn("foundation_routing_rules_failed");
    return { logged, destinations: [] };
  }
}
