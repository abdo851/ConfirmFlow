import type { ConfirmaOrderInput, OrderLineItem } from "@/lib/orders/types";
import { parseMoneyStringToMinorUnits } from "@/lib/orders/money";
import { safeProductImageUrl } from "@/lib/orders/products";
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

function joinName(first: string | null, last: string | null): string | null {
  const name = [first, last].filter((part) => part && part.length > 0).join(" ");
  return name.length > 0 ? name : null;
}

function resolveCustomerName(payload: YouCanOrderWebhookPayload): string | null {
  return joinName(
    normalizeOptionalString(payload.customer?.first_name ?? null),
    normalizeOptionalString(payload.customer?.last_name ?? null),
  );
}

function resolveCity(payload: YouCanOrderWebhookPayload): string | null {
  return normalizeOptionalString(payload.shipping?.city ?? null);
}

function resolveAddressLine(payload: YouCanOrderWebhookPayload): string | null {
  return (
    normalizeOptionalString(payload.shipping?.address ?? null) ??
    normalizeOptionalString(payload.shipping?.address_line ?? null) ??
    normalizeOptionalString(payload.shipping?.first_line ?? null)
  );
}

function resolveLineItems(payload: YouCanOrderWebhookPayload): OrderLineItem[] | null {
  if (!payload.variants?.length) {
    return null;
  }

  return payload.variants.map((item) => {
    const product = item.variant?.product as
      | {
          name?: string | null;
          id?: string | number | null;
          thumbnail?: unknown;
          image?: unknown;
        }
      | undefined;
    const variantImage = (item.variant as { image?: unknown } | undefined)?.image;
    return {
      name: normalizeOptionalString(product?.name ?? null),
      quantity: typeof item.quantity === "number" ? item.quantity : null,
      sku: normalizeOptionalString(item.variant?.sku ?? null),
      imageUrl:
        safeProductImageUrl(product?.thumbnail) ??
        safeProductImageUrl(
          product?.thumbnail && typeof product.thumbnail === "object"
            ? (product.thumbnail as { url?: unknown }).url
            : null,
        ) ??
        safeProductImageUrl(product?.image) ??
        safeProductImageUrl(
          product?.image && typeof product.image === "object"
            ? (product.image as { url?: unknown; src?: unknown }).url ??
                (product.image as { src?: unknown }).src
            : null,
        ) ??
        safeProductImageUrl(variantImage) ??
        safeProductImageUrl(
          variantImage && typeof variantImage === "object"
            ? (variantImage as { url?: unknown; src?: unknown }).url ??
                (variantImage as { src?: unknown }).src
            : null,
        ),
      productId: product?.id === undefined || product?.id === null ? null : String(product.id),
    };
  });
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
    customerName: resolveCustomerName(payload),
    city: resolveCity(payload),
    addressLine: resolveAddressLine(payload),
    lineItems: resolveLineItems(payload),
    currency,
    subtotalAmountMinor,
    totalAmountMinor,
    financialStatus: resolveFinancialStatus(payload),
    confirmationStatus: "pending",
    providerCreatedAt: payload.created_at ?? null,
    receivedAt: context.receivedAt,
  };
}
