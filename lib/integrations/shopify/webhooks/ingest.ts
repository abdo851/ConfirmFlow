import type { SupabaseClient } from "@supabase/supabase-js";
import { getShopifyOAuthEnv } from "@/lib/integrations/shopify/env";
import { normalizeShopDomain } from "@/lib/integrations/shopify/oauth/shop-domain";
import { persistWebhookEvent } from "@/lib/webhooks/ingestion";
import type { WebhookIngestionResult } from "@/lib/webhooks/ingestion";
import { parseShopifyWebhookHeaders } from "./headers";
import { verifyShopifyWebhookHmac } from "./hmac";
import { normalizeShopifyWebhookEvent } from "./normalize";
import { resolveShopifyStoreByDomain } from "./resolve-store";
import { classifyShopifyWebhookTopic } from "./topics";

export interface ShopifyWebhookIngestionInput {
  rawBody: string;
  headers: Record<string, string>;
  receivedAt?: Date;
  db?: SupabaseClient;
}

function rejection(
  status: WebhookIngestionResult["status"],
  httpStatus: number,
  message: string,
): WebhookIngestionResult {
  return { status, httpStatus, message };
}

async function getDatabaseClient(db?: SupabaseClient): Promise<SupabaseClient> {
  if (db) {
    return db;
  }

  const { createDatabaseClient } = await import("@/lib/database/client");
  return createDatabaseClient();
}

export async function ingestShopifyWebhook(
  input: ShopifyWebhookIngestionInput,
): Promise<WebhookIngestionResult> {
  const headerResult = parseShopifyWebhookHeaders(input.headers);
  if (!headerResult.ok) {
    return rejection("rejected", 400, headerResult.reason);
  }

  let secret: string;
  try {
    secret = getShopifyOAuthEnv().SHOPIFY_API_SECRET;
  } catch {
    return rejection("rejected", 500, "configuration_error");
  }

  if (
    !verifyShopifyWebhookHmac(
      input.rawBody,
      headerResult.headers.hmac,
      secret,
    )
  ) {
    return rejection("rejected", 401, "invalid_hmac");
  }

  const normalizedShopDomain = normalizeShopDomain(
    headerResult.headers.shopDomain,
  );
  if (!normalizedShopDomain) {
    return rejection("rejected", 400, "invalid_shop_domain");
  }

  const db = await getDatabaseClient(input.db);
  const store = await resolveShopifyStoreByDomain(
    headerResult.headers.shopDomain,
    db,
  );

  if (!store) {
    return rejection("rejected", 404, "unknown_shop");
  }

  const normalizedEvent = normalizeShopifyWebhookEvent({
    headers: headerResult.headers,
    rawBody: input.rawBody,
    store,
    receivedAt: input.receivedAt,
  });

  const topicStatus = classifyShopifyWebhookTopic(normalizedEvent.topic);

  try {
    const persistResult = await persistWebhookEvent(db, {
      storeId: normalizedEvent.storeId,
      provider: normalizedEvent.provider,
      externalEventId: normalizedEvent.externalEventId,
      topic: normalizedEvent.topic,
      shopDomain: normalizedEvent.shopDomain,
      status: topicStatus,
      payloadHash: normalizedEvent.payloadHash,
      receivedAt: normalizedEvent.receivedAt,
      processedAt: normalizedEvent.receivedAt,
    });

    if (persistResult.outcome === "duplicate") {
      return {
        status: "duplicate",
        eventId: persistResult.eventId,
        httpStatus: 200,
      };
    }

    return {
      status: topicStatus,
      eventId: persistResult.eventId,
      httpStatus: 200,
    };
  } catch {
    return rejection("rejected", 500, "persistence_failed");
  }
}
