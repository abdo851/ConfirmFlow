import type { SupabaseClient } from "@supabase/supabase-js";
import { getYouCanOAuthEnv } from "@/lib/integrations/youcan/env";
import { extractYouCanStoreIdFromBody } from "@/lib/integrations/youcan/orders";
import {
  findExistingWebhookEvent,
  persistWebhookEvent,
} from "@/lib/webhooks/ingestion";
import type { WebhookIngestionResult } from "@/lib/webhooks/ingestion";
import { YOUCAN_ORDER_CREATED_TOPIC } from "./constants";
import { processYouCanOrderCreateWebhook } from "./handlers/order-create";
import { parseYouCanWebhookHeaders } from "./headers";
import { verifyYouCanWebhookHmac } from "./hmac";
import { normalizeYouCanWebhookEvent } from "./normalize";
import { resolveOrBackfillYouCanStoreByStoreId } from "./resolve-store";
import { classifyYouCanWebhookTopic } from "./topics";

export interface YouCanWebhookIngestionInput {
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

export async function ingestYouCanWebhook(
  input: YouCanWebhookIngestionInput,
): Promise<WebhookIngestionResult> {
  const headerResult = parseYouCanWebhookHeaders(input.headers);
  if (!headerResult.ok) {
    return rejection("rejected", 400, headerResult.reason);
  }

  let secret: string;
  try {
    secret = getYouCanOAuthEnv().YOUCAN_API_SECRET;
  } catch {
    return rejection("rejected", 500, "configuration_error");
  }

  if (
    !verifyYouCanWebhookHmac(
      input.rawBody,
      headerResult.headers.signature,
      secret,
    )
  ) {
    return rejection("rejected", 401, "invalid_hmac");
  }

  const youcanStoreId = extractYouCanStoreIdFromBody(input.rawBody);
  if (!youcanStoreId) {
    return rejection("rejected", 400, "missing_store_id");
  }

  const db = await getDatabaseClient(input.db);
  const store = await resolveOrBackfillYouCanStoreByStoreId(youcanStoreId, db);

  if (!store) {
    return rejection("rejected", 404, "unknown_store");
  }

  const normalizedEvent = normalizeYouCanWebhookEvent({
    headers: headerResult.headers,
    rawBody: input.rawBody,
    store,
    receivedAt: input.receivedAt,
  });

  const topicStatus = classifyYouCanWebhookTopic(normalizedEvent.topic);

  try {
    const existingWebhookEventId = await findExistingWebhookEvent(db, {
      storeId: normalizedEvent.storeId,
      provider: normalizedEvent.provider,
      externalEventId: normalizedEvent.externalEventId,
    });

    if (existingWebhookEventId) {
      return {
        status: "duplicate",
        eventId: existingWebhookEventId,
        httpStatus: 200,
      };
    }

    let orderId: string | undefined;

    if (normalizedEvent.topic === YOUCAN_ORDER_CREATED_TOPIC) {
      const orderResult = await processYouCanOrderCreateWebhook({
        rawBody: input.rawBody,
        normalizedEvent,
        db,
      });

      if (!orderResult.ok) {
        return rejection(
          "rejected",
          orderResult.httpStatus,
          orderResult.reason,
        );
      }

      orderId = orderResult.orderId;
    }

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
        orderId,
      };
    }

    return {
      status: topicStatus,
      eventId: persistResult.eventId,
      httpStatus: 200,
      orderId,
    };
  } catch {
    return rejection("rejected", 500, "persistence_failed");
  }
}
