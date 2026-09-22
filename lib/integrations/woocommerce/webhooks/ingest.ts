import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logging/logger";
import {
  findExistingWebhookEvent,
  persistWebhookEvent,
} from "@/lib/webhooks/ingestion";
import type { WebhookIngestionStatus } from "@/lib/webhooks/ingestion/types";
import { decryptSecret } from "../oauth/crypto";
import { getWooCommerceEnv } from "../env";
import { normalizeWooCommerceOrder } from "../orders/normalize";
import { persistWooCommerceOrder } from "../orders/persist";
import { wooCommerceOrderSchema } from "../orders/schema";
import { verifyWooCommerceSignature } from "./hmac";
import type { WooCommerceWebhookHeaders } from "./headers";

const ORDER_TOPICS = new Set(["order.created", "order.updated"]);

export interface WooCommerceWebhookIngestionInput {
  rawBody: string;
  headers: WooCommerceWebhookHeaders;
  connectionId: string;
  db?: SupabaseClient;
  receivedAt?: Date;
}

export interface WooCommerceWebhookIngestionResult {
  httpStatus: number;
  status: WebhookIngestionStatus | "unauthorized";
  orderId?: string;
}

async function getDatabaseClient(db?: SupabaseClient): Promise<SupabaseClient> {
  if (db) {
    return db;
  }

  const { createDatabaseClient } = await import("@/lib/database/client");
  return createDatabaseClient();
}

function hashPayload(rawBody: string): string {
  return createHash("sha256").update(rawBody, "utf8").digest("hex");
}

export async function ingestWooCommerceWebhook(
  input: WooCommerceWebhookIngestionInput,
): Promise<WooCommerceWebhookIngestionResult> {
  if (!input.connectionId || !input.headers.signature || !input.headers.deliveryId) {
    return { httpStatus: 401, status: "unauthorized" };
  }

  const db = await getDatabaseClient(input.db);
  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("id, store_id")
    .eq("id", input.connectionId)
    .eq("provider", "woocommerce")
    .maybeSingle();

  if (connectionError || !storeConnection) {
    return { httpStatus: 401, status: "unauthorized" };
  }

  const { data: store, error: storeError } = await db
    .from("stores")
    .select("id, owner_id")
    .eq("id", storeConnection.store_id)
    .maybeSingle();

  const { data: wooConnection, error: wooError } = await db
    .from("woocommerce_connections")
    .select("store_url")
    .eq("store_connection_id", storeConnection.id)
    .maybeSingle();

  const { data: secrets, error: secretsError } = await db
    .from("woocommerce_connection_secrets")
    .select("encrypted_webhook_secret")
    .eq("store_connection_id", storeConnection.id)
    .maybeSingle();

  if (storeError || wooError || secretsError || !store || !wooConnection || !secrets) {
    return { httpStatus: 401, status: "unauthorized" };
  }

  let sessionSecret: string;
  try {
    sessionSecret = getWooCommerceEnv().WOOCOMMERCE_SESSION_SECRET;
  } catch {
    return { httpStatus: 401, status: "unauthorized" };
  }

  const webhookSecret = decryptSecret(
    secrets.encrypted_webhook_secret ?? "",
    sessionSecret,
  );

  if (
    !webhookSecret ||
    !verifyWooCommerceSignature(input.rawBody, input.headers.signature, webhookSecret)
  ) {
    return { httpStatus: 401, status: "unauthorized" };
  }

  const receivedAt = input.receivedAt ?? new Date();

  try {
    const existingEventId = await findExistingWebhookEvent(db, {
      storeId: store.id,
      provider: "woocommerce",
      externalEventId: input.headers.deliveryId,
    });

    if (existingEventId) {
      return { httpStatus: 200, status: "duplicate" };
    }

    let status: WebhookIngestionStatus = "unsupported";
    let orderId: string | undefined;
    let errorMessage: string | undefined;

    if (ORDER_TOPICS.has(input.headers.topic)) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(input.rawBody);
      } catch {
        parsed = null;
      }

      const validated = wooCommerceOrderSchema.safeParse(parsed);
      const normalized = validated.success
        ? normalizeWooCommerceOrder(validated.data)
        : null;

      if (!normalized) {
        status = "rejected";
        errorMessage = validated.success ? "incomplete_order" : "invalid_order";
      } else {
        const saved = await persistWooCommerceOrder(
          {
            store_id: store.id,
            owner_id: store.owner_id,
            normalized_order: normalized,
            receivedAt,
          },
          db,
        );
        status = "accepted";
        orderId = saved.orderId;
      }
    }

    await persistWebhookEvent(db, {
      storeId: store.id,
      provider: "woocommerce",
      externalEventId: input.headers.deliveryId,
      topic: input.headers.topic || "unknown",
      shopDomain: wooConnection.store_url,
      status,
      payloadHash: hashPayload(input.rawBody),
      receivedAt,
      processedAt: receivedAt,
      errorMessage,
    });

    return { httpStatus: 200, status, orderId };
  } catch (error) {
    logger.error("woocommerce_webhook_ingest_failed", {
      message: error instanceof Error ? error.message : "unknown",
      connectionId: input.connectionId,
    });
    return { httpStatus: 500, status: "rejected" };
  }
}
