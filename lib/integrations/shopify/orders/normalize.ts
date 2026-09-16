import type { ConfirmaOrderInput } from "@/lib/orders/types";
import { parseMoneyStringToMinorUnits } from "@/lib/orders/money";
import type { NormalizedWebhookEvent } from "@/lib/webhooks/ingestion";
import type { ShopifyOrderWebhookPayload } from "./schema";

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveOrderNumber(payload: ShopifyOrderWebhookPayload): string | null {
  if (payload.order_number !== undefined) {
    return String(payload.order_number);
  }

  return normalizeOptionalString(payload.name ?? null);
}

export function normalizeShopifyOrder(
  payload: ShopifyOrderWebhookPayload,
  context: Pick<
    NormalizedWebhookEvent,
    "storeId" | "ownerId" | "receivedAt"
  >,
): ConfirmaOrderInput {
  const currency = payload.currency.toUpperCase();

  return {
    storeId: context.storeId,
    ownerId: context.ownerId,
    provider: "shopify",
    externalOrderId: String(payload.id),
    orderNumber: resolveOrderNumber(payload),
    customerEmail: normalizeOptionalString(payload.email ?? null),
    customerPhone: normalizeOptionalString(payload.phone ?? null),
    currency,
    subtotalAmountMinor: parseMoneyStringToMinorUnits(
      payload.subtotal_price,
      currency,
    ),
    totalAmountMinor: parseMoneyStringToMinorUnits(payload.total_price, currency),
    financialStatus: normalizeOptionalString(payload.financial_status ?? null),
    confirmationStatus: "pending",
    providerCreatedAt: payload.created_at ?? null,
    receivedAt: context.receivedAt,
  };
}
