import type { ConfirmaOrderInput } from "@/lib/orders/types";
import { parseMoneyStringToMinorUnits } from "@/lib/orders/money";
import type { NormalizedWebhookEvent } from "@/lib/webhooks/ingestion";
import type { YouCanOrderWebhookPayload } from "./schema";

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function moneyToMinorUnits(
  amount: number | string,
  currency: string,
): number {
  if (typeof amount === "number") {
    if (!Number.isFinite(amount)) {
      throw new Error("invalid_money_format");
    }

    return parseMoneyStringToMinorUnits(amount.toFixed(2), currency);
  }

  return parseMoneyStringToMinorUnits(amount, currency);
}

function resolveOrderNumber(payload: YouCanOrderWebhookPayload): string | null {
  if (payload.ref !== undefined) {
    return String(payload.ref);
  }

  return null;
}

function resolveCustomerEmail(payload: YouCanOrderWebhookPayload): string | null {
  return (
    normalizeOptionalString(payload.customer?.email ?? null) ??
    normalizeOptionalString(payload.email ?? null)
  );
}

function resolveCustomerPhone(payload: YouCanOrderWebhookPayload): string | null {
  return (
    normalizeOptionalString(payload.customer?.phone ?? null) ??
    normalizeOptionalString(payload.phone ?? null)
  );
}

function resolveFinancialStatus(payload: YouCanOrderWebhookPayload): string | null {
  if (typeof payload.status_text === "string" && payload.status_text.trim()) {
    return payload.status_text.trim();
  }

  if (payload.status !== undefined) {
    return String(payload.status);
  }

  return null;
}

export function normalizeYouCanOrder(
  payload: YouCanOrderWebhookPayload,
  context: Pick<
    NormalizedWebhookEvent,
    "storeId" | "ownerId" | "receivedAt"
  >,
): ConfirmaOrderInput {
  const currency = payload.currency.toUpperCase();
  const totalAmountMinor = moneyToMinorUnits(payload.total, currency);
  const subtotalAmountMinor = payload.subtotal
    ? moneyToMinorUnits(payload.subtotal, currency)
    : totalAmountMinor;

  return {
    storeId: context.storeId,
    ownerId: context.ownerId,
    provider: "youcan",
    externalOrderId: String(payload.id),
    orderNumber: resolveOrderNumber(payload),
    customerEmail: resolveCustomerEmail(payload),
    customerPhone: resolveCustomerPhone(payload),
    currency,
    subtotalAmountMinor,
    totalAmountMinor,
    financialStatus: resolveFinancialStatus(payload),
    confirmationStatus: "pending",
    providerCreatedAt: payload.created_at ?? null,
    receivedAt: context.receivedAt,
  };
}
