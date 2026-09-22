export interface WooCommerceWebhookHeaders {
  topic: string;
  deliveryId: string;
  signature: string;
}

export function extractWooCommerceHeaders(
  request: Request,
): WooCommerceWebhookHeaders {
  return {
    topic: request.headers.get("x-wc-webhook-topic")?.trim() ?? "",
    deliveryId: request.headers.get("x-wc-webhook-delivery-id")?.trim() ?? "",
    signature: request.headers.get("x-wc-webhook-signature")?.trim() ?? "",
  };
}
