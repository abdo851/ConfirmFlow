import type { SupabaseClient } from "@supabase/supabase-js";
import type { IdempotencyStore } from "../processor";
import type { WebhookProvider } from "../ingestion/types";

export class DatabaseIdempotencyStore implements IdempotencyStore {
  constructor(
    private readonly db: SupabaseClient,
    private readonly storeId: string,
    private readonly provider: WebhookProvider,
  ) {}

  async hasProcessed(externalEventId: string): Promise<boolean> {
    const { data, error } = await this.db
      .from("store_webhook_events")
      .select("id")
      .eq("store_id", this.storeId)
      .eq("provider", this.provider)
      .eq("external_event_id", externalEventId)
      .maybeSingle();

    if (error) {
      throw new Error("Unable to check webhook idempotency.");
    }

    return Boolean(data);
  }

  async markProcessed(externalEventId: string, eventId: string): Promise<void> {
    void externalEventId;
    void eventId;
  }
}
