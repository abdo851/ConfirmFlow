import type {
  ExternalOrder,
  StoreAdapter,
  StoreConnectionConfig,
  StoreConnectionResult,
} from "@/lib/integrations/adapters/store-adapter";
import { YOUCAN_PROVIDER_ID } from "./constants";

export class YouCanAdapter implements StoreAdapter {
  readonly platform = YOUCAN_PROVIDER_ID;

  async connect(_config: StoreConnectionConfig): Promise<StoreConnectionResult> {
    void _config;
    return {
      success: false,
      error: "Use /api/integrations/youcan/connect to start YouCan OAuth.",
    };
  }

  async disconnect(storeId: string): Promise<StoreConnectionResult> {
    const { disconnectYouCanStoreForAuthenticatedUser, YouCanDisconnectError } =
      await import("@/lib/integrations/youcan/disconnect");
    const { YouCanPersistenceError } = await import(
      "@/lib/integrations/youcan/persistence"
    );
    const { YouCanWebhookRegistrationError } = await import(
      "@/lib/integrations/youcan/webhooks/register"
    );

    try {
      await disconnectYouCanStoreForAuthenticatedUser(storeId);
      return { success: true };
    } catch (error) {
      if (
        error instanceof YouCanDisconnectError ||
        error instanceof YouCanPersistenceError ||
        error instanceof YouCanWebhookRegistrationError
      ) {
        return {
          success: false,
          error: "Unable to disconnect YouCan store.",
        };
      }

      return {
        success: false,
        error: "Unable to disconnect YouCan store.",
      };
    }
  }

  async verifyConnection(_storeId: string): Promise<boolean> {
    void _storeId;
    return false;
  }

  async verifyWebhook(
    headers: Record<string, string>,
    body: string,
  ): Promise<boolean> {
    const { verifyYouCanWebhookHmac } = await import(
      "@/lib/integrations/youcan/webhooks/hmac"
    );
    const secret = process.env.YOUCAN_API_SECRET;

    if (!secret) {
      return false;
    }

    const signature =
      headers["x-youcan-signature"] ?? headers["X-YOUCAN-SIGNATURE"];

    if (!signature) {
      return false;
    }

    return verifyYouCanWebhookHmac(body, signature, secret);
  }

  async normalizeOrder(rawPayload: unknown): Promise<ExternalOrder> {
    const { parseYouCanOrderPayload, normalizeYouCanOrder } = await import(
      "@/lib/integrations/youcan/orders"
    );

    const parsed = parseYouCanOrderPayload(
      typeof rawPayload === "string"
        ? rawPayload
        : JSON.stringify(rawPayload),
    );

    if (!parsed.ok) {
      throw new Error(parsed.reason);
    }

    const normalized = normalizeYouCanOrder(parsed.payload, {
      storeId: "unknown",
      ownerId: "unknown",
      receivedAt: new Date(),
    });

    return {
      externalId: normalized.externalOrderId,
      storeId: normalized.storeId,
      rawPayload: normalized,
    };
  }

  async registerWebhooks(storeId: string): Promise<void> {
    const { registerYouCanWebhooksForStore } = await import(
      "@/lib/integrations/youcan/webhooks/register"
    );
    await registerYouCanWebhooksForStore(storeId);
  }
}

export const youcanAdapter = new YouCanAdapter();
