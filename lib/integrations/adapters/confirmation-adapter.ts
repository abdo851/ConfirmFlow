/**
 * ConfirmationAdapter — abstraction for order confirmation providers.
 * Future implementations: StoreStatusAdapter, ExternalServiceAdapter, CustomWebhookAdapter
 */

export type ConfirmationProvider =
  | "store_status"
  | "external_service"
  | "custom_webhook";

export type ConfirmationStatus = "pending" | "confirmed" | "cancelled";

export interface ConfirmationRequest {
  orderId: string;
  storeId: string;
  customerContact?: string;
}

export interface ConfirmationResult {
  orderId: string;
  status: ConfirmationStatus;
  providerReference?: string;
  rawResponse?: unknown;
}

export interface ConfirmationAdapter {
  readonly provider: ConfirmationProvider;

  /** Send a confirmation request to the customer or provider */
  sendConfirmation(request: ConfirmationRequest): Promise<ConfirmationResult>;

  /** Parse and verify an inbound confirmation webhook */
  handleInboundWebhook(
    headers: Record<string, string>,
    body: string,
  ): Promise<ConfirmationResult>;
}
