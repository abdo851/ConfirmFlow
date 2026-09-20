import "server-only";

import { getYouCanWebhookUrl } from "@/lib/config/urls";
import {
  YOUCAN_RESTHOOKS_LIST_URL,
  YOUCAN_RESTHOOKS_SUBSCRIBE_URL,
  YOUCAN_RESTHOOKS_UNSUBSCRIBE_URL,
} from "@/lib/integrations/youcan/constants";
import { getYouCanStoreCredentialsForStore } from "@/lib/integrations/youcan/persistence";
import { YOUCAN_ORDER_CREATED_TOPIC } from "./constants";

export class YouCanWebhookRegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YouCanWebhookRegistrationError";
  }
}

export interface YouCanWebhookRecord {
  id: string;
  event: string;
  target_url: string;
}

export interface RegisterYouCanWebhookInput {
  accessToken: string;
  webhookUrl?: string;
}

export type YouCanWebhookRegistrationAction =
  | "created"
  | "already_registered";

export type YouCanWebhookUnregisterAction = "deleted" | "already_missing";

export interface YouCanWebhookRegistrationResult {
  action: YouCanWebhookRegistrationAction;
  webhookId?: string;
}

export interface YouCanWebhookUnregisterResult {
  action: YouCanWebhookUnregisterAction;
  webhookId?: string;
}

function authHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export async function listYouCanWebhooks(
  accessToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<YouCanWebhookRecord[]> {
  const response = await fetchImpl(YOUCAN_RESTHOOKS_LIST_URL, {
    method: "GET",
    headers: authHeaders(accessToken),
  });

  if (!response.ok) {
    throw new YouCanWebhookRegistrationError(
      `youcan_webhook_list_failed:${response.status}`,
    );
  }

  const body = (await response.json()) as YouCanWebhookRecord[];
  return Array.isArray(body) ? body : [];
}

export async function subscribeYouCanWebhook(
  accessToken: string,
  event: string,
  targetUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<YouCanWebhookRecord> {
  const response = await fetchImpl(YOUCAN_RESTHOOKS_SUBSCRIBE_URL, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({
      event,
      target_url: targetUrl,
    }),
  });

  if (!response.ok) {
    throw new YouCanWebhookRegistrationError(
      `youcan_webhook_create_failed:${response.status}`,
    );
  }

  const body = (await response.json()) as { id?: string };
  if (!body.id) {
    throw new YouCanWebhookRegistrationError(
      "youcan_webhook_create_missing_body",
    );
  }

  return {
    id: body.id,
    event,
    target_url: targetUrl,
  };
}

export async function unsubscribeYouCanWebhook(
  accessToken: string,
  webhookId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(
    `${YOUCAN_RESTHOOKS_UNSUBSCRIBE_URL}/${webhookId}`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
    },
  );

  if (!response.ok && response.status !== 404) {
    throw new YouCanWebhookRegistrationError(
      `youcan_webhook_delete_failed:${response.status}`,
    );
  }
}

export function findConfirmaOrderCreatedWebhook(
  webhooks: YouCanWebhookRecord[],
  webhookUrl: string,
): YouCanWebhookRecord | undefined {
  return webhooks.find(
    (webhook) =>
      webhook.event === YOUCAN_ORDER_CREATED_TOPIC &&
      webhook.target_url === webhookUrl,
  );
}

export async function unregisterYouCanOrderCreatedWebhook(
  input: RegisterYouCanWebhookInput,
  fetchImpl: typeof fetch = fetch,
): Promise<YouCanWebhookUnregisterResult> {
  const webhookUrl = input.webhookUrl ?? getYouCanWebhookUrl();
  const existing = await listYouCanWebhooks(input.accessToken, fetchImpl);
  const ownedWebhook = findConfirmaOrderCreatedWebhook(existing, webhookUrl);

  if (!ownedWebhook) {
    return { action: "already_missing" };
  }

  await unsubscribeYouCanWebhook(
    input.accessToken,
    ownedWebhook.id,
    fetchImpl,
  );

  return {
    action: "deleted",
    webhookId: ownedWebhook.id,
  };
}

export async function registerYouCanOrderCreatedWebhook(
  input: RegisterYouCanWebhookInput,
  fetchImpl: typeof fetch = fetch,
): Promise<YouCanWebhookRegistrationResult> {
  const webhookUrl = input.webhookUrl ?? getYouCanWebhookUrl();
  const existing = await listYouCanWebhooks(input.accessToken, fetchImpl);
  const exactMatch = findConfirmaOrderCreatedWebhook(existing, webhookUrl);

  if (exactMatch) {
    return {
      action: "already_registered",
      webhookId: exactMatch.id,
    };
  }

  const created = await subscribeYouCanWebhook(
    input.accessToken,
    YOUCAN_ORDER_CREATED_TOPIC,
    webhookUrl,
    fetchImpl,
  );

  return {
    action: "created",
    webhookId: created.id,
  };
}

export async function registerYouCanWebhooksForStore(
  storeId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<YouCanWebhookRegistrationResult> {
  const credentials = await getYouCanStoreCredentialsForStore(storeId);
  if (!credentials) {
    throw new YouCanWebhookRegistrationError("youcan_store_not_found");
  }

  return registerYouCanOrderCreatedWebhook(
    {
      accessToken: credentials.accessToken,
    },
    fetchImpl,
  );
}

export function toSafeWebhookRegistrationResponse(
  result: YouCanWebhookRegistrationResult,
) {
  return {
    success: true as const,
    action: result.action,
    webhookId: result.webhookId,
  };
}
