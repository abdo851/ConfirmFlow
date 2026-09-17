import "server-only";

import { getShopifyWebhookUrl } from "@/lib/config/urls";
import { SHOPIFY_ADMIN_API_VERSION } from "@/lib/integrations/shopify/constants";
import { getShopifyStoreCredentialsForStore } from "@/lib/integrations/shopify/persistence";
import { SHOPIFY_ORDER_CREATE_TOPIC } from "./constants";

export class ShopifyWebhookRegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopifyWebhookRegistrationError";
  }
}

export interface ShopifyWebhookRecord {
  id: number;
  topic: string;
  address: string;
}

export interface RegisterShopifyWebhookInput {
  shop: string;
  accessToken: string;
  webhookUrl?: string;
}

export type ShopifyWebhookRegistrationAction =
  | "created"
  | "already_registered"
  | "updated";

export interface ShopifyWebhookRegistrationResult {
  action: ShopifyWebhookRegistrationAction;
  webhookId?: number;
}

function buildAdminApiUrl(shop: string, path: string): string {
  return `https://${shop}/admin/api/${SHOPIFY_ADMIN_API_VERSION}${path}`;
}

export async function listShopifyWebhooks(
  shop: string,
  accessToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ShopifyWebhookRecord[]> {
  const response = await fetchImpl(buildAdminApiUrl(shop, "/webhooks.json"), {
    method: "GET",
    headers: {
      "X-Shopify-Access-Token": accessToken,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new ShopifyWebhookRegistrationError(
      `shopify_webhook_list_failed:${response.status}`,
    );
  }

  const body = (await response.json()) as { webhooks?: ShopifyWebhookRecord[] };
  return body.webhooks ?? [];
}

export async function createShopifyWebhook(
  shop: string,
  accessToken: string,
  topic: string,
  address: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ShopifyWebhookRecord> {
  const response = await fetchImpl(buildAdminApiUrl(shop, "/webhooks.json"), {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": accessToken,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      webhook: {
        topic,
        address,
        format: "json",
      },
    }),
  });

  if (!response.ok) {
    throw new ShopifyWebhookRegistrationError(
      `shopify_webhook_create_failed:${response.status}`,
    );
  }

  const body = (await response.json()) as { webhook?: ShopifyWebhookRecord };
  if (!body.webhook) {
    throw new ShopifyWebhookRegistrationError(
      "shopify_webhook_create_missing_body",
    );
  }

  return body.webhook;
}

export async function updateShopifyWebhook(
  shop: string,
  accessToken: string,
  webhookId: number,
  topic: string,
  address: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ShopifyWebhookRecord> {
  const response = await fetchImpl(
    buildAdminApiUrl(shop, `/webhooks/${webhookId}.json`),
    {
      method: "PUT",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        webhook: {
          topic,
          address,
          format: "json",
        },
      }),
    },
  );

  if (!response.ok) {
    throw new ShopifyWebhookRegistrationError(
      `shopify_webhook_update_failed:${response.status}`,
    );
  }

  const body = (await response.json()) as { webhook?: ShopifyWebhookRecord };
  if (!body.webhook) {
    throw new ShopifyWebhookRegistrationError(
      "shopify_webhook_update_missing_body",
    );
  }

  return body.webhook;
}

export async function registerShopifyOrdersCreateWebhook(
  input: RegisterShopifyWebhookInput,
  fetchImpl: typeof fetch = fetch,
): Promise<ShopifyWebhookRegistrationResult> {
  const webhookUrl = input.webhookUrl ?? getShopifyWebhookUrl();
  const existing = await listShopifyWebhooks(
    input.shop,
    input.accessToken,
    fetchImpl,
  );

  const exactMatch = existing.find(
    (webhook) =>
      webhook.topic === SHOPIFY_ORDER_CREATE_TOPIC &&
      webhook.address === webhookUrl,
  );

  if (exactMatch) {
    return {
      action: "already_registered",
      webhookId: exactMatch.id,
    };
  }

  const sameTopic = existing.find(
    (webhook) => webhook.topic === SHOPIFY_ORDER_CREATE_TOPIC,
  );

  if (sameTopic) {
    const updated = await updateShopifyWebhook(
      input.shop,
      input.accessToken,
      sameTopic.id,
      SHOPIFY_ORDER_CREATE_TOPIC,
      webhookUrl,
      fetchImpl,
    );

    return {
      action: "updated",
      webhookId: updated.id,
    };
  }

  const created = await createShopifyWebhook(
    input.shop,
    input.accessToken,
    SHOPIFY_ORDER_CREATE_TOPIC,
    webhookUrl,
    fetchImpl,
  );

  return {
    action: "created",
    webhookId: created.id,
  };
}

export async function registerShopifyWebhooksForStore(
  storeId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ShopifyWebhookRegistrationResult> {
  const credentials = await getShopifyStoreCredentialsForStore(storeId);
  if (!credentials) {
    throw new ShopifyWebhookRegistrationError("shopify_store_not_found");
  }

  return registerShopifyOrdersCreateWebhook(
    {
      shop: credentials.shopDomain,
      accessToken: credentials.accessToken,
    },
    fetchImpl,
  );
}

export async function registerShopifyWebhooksForOwnedStore(
  storeId: string,
  userId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ShopifyWebhookRegistrationResult> {
  const credentials = await getShopifyStoreCredentialsForStore(storeId);
  if (!credentials) {
    throw new ShopifyWebhookRegistrationError("shopify_store_not_found");
  }

  if (credentials.ownerId !== userId) {
    throw new ShopifyWebhookRegistrationError("shopify_store_forbidden");
  }

  return registerShopifyOrdersCreateWebhook(
    {
      shop: credentials.shopDomain,
      accessToken: credentials.accessToken,
    },
    fetchImpl,
  );
}

export function toSafeWebhookRegistrationResponse(
  result: ShopifyWebhookRegistrationResult,
) {
  return {
    success: true as const,
    action: result.action,
    webhookId: result.webhookId,
  };
}
