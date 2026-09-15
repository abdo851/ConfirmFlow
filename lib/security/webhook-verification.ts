import type { WebhookVerificationResult } from "@/lib/webhooks";

/**
 * Generic webhook verification scaffold.
 * Provider-specific verification (Shopify, Meta, etc.) in future milestones.
 */
export interface WebhookSignatureVerifier {
  verify(
    headers: Record<string, string>,
    body: string,
    secret: string,
  ): Promise<WebhookVerificationResult>;
}

/** Placeholder verifier — always rejects until a real implementation is registered */
export const unconfiguredWebhookVerifier: WebhookSignatureVerifier = {
  async verify() {
    return {
      valid: false,
      reason: "Webhook verifier not configured for this provider",
    };
  },
};
