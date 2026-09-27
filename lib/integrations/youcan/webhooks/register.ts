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

async function readJsonBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function youcanWebhookRequest(
  url: string,
  init: RequestInit,
  fetchImpl: typeof fetch,
): Promise<{ ok: boolean; status: number; body: unknown }> {
  console.log("youcan_webhook_registration_http_request", {
    method: init.method,
    url,
  });

  const response = await fetchImpl(url, init);
  const body = await readJsonBody(response);

  console.log("youcan_webhook_registration_http_response", {
    status: response.status,
    body,
  });

  return { ok: response.ok, status: response.status, body };
}

function logWebhookFailure(error: unknown): void {
  console.log("youcan_webhook_registration_failed", {
    error: error instanceof Error ? error.message : "unknown",
  });
}

export async function listYouCanWebhooks(
  accessToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<YouCanWebhookRecord[]> {
  const result = await youcanWebhookRequest(
    YOUCAN_RESTHOOKS_LIST_URL,
    {
      method: "GET",
      headers: authHeaders(accessToken),
    },
    fetchImpl,
  );

  if (!result.ok) {
    const error = new YouCanWebhookRegistrationError(
      `youcan_webhook_list_failed:${result.status}`,
    );
    logWebhookFailure(error);
    throw error;
  }

  return Array.isArray(result.body) ? result.body : [];
}

export async function subscribeYouCanWebhook(
  accessToken: string,
  event: string,
  targetUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<YouCanWebhookRecord> {
  const result = await youcanWebhookRequest(
    YOUCAN_RESTHOOKS_SUBSCRIBE_URL,
    {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify({
        event,
        target_url: targetUrl,
      }),
    },
    fetchImpl,
  );

  if (!result.ok) {
    const error = new YouCanWebhookRegistrationError(
      `youcan_webhook_create_failed:${result.status}`,
    );
    logWebhookFailure(error);
    throw error;
  }

  const body = result.body as { id?: string };
  if (!body?.id) {
    const error = new YouCanWebhookRegistrationError(
      "youcan_webhook_create_missing_body",
    );
    logWebhookFailure(error);
    throw error;
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
  const result = await youcanWebhookRequest(
    `${YOUCAN_RESTHOOKS_UNSUBSCRIBE_URL}/${webhookId}`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
    },
    fetchImpl,
  );

  if (!result.ok && result.status !== 404) {
    const error = new YouCanWebhookRegistrationError(
      `youcan_webhook_delete_failed:${result.status}`,
    );
    logWebhookFailure(error);
    throw error;
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
    console.log("youcan_webhook_registration_success", {
      webhook_id: exactMatch.id,
    });
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

  console.log("youcan_webhook_registration_success", {
    webhook_id: created.id,
  });

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
    const error = new YouCanWebhookRegistrationError("youcan_store_not_found");
    logWebhookFailure(error);
    throw error;
  }

  console.log("youcan_webhook_registration_started", {
    store_slug: credentials.storeSlug,
  });

  try {
    return await registerYouCanOrderCreatedWebhook(
      {
        accessToken: credentials.accessToken,
      },
      fetchImpl,
    );
  } catch (error) {
    logWebhookFailure(error);
    throw error;
  }
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
