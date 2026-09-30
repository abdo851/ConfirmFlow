import type { OrderLineItem } from "@/lib/orders/types";
import { safeProductImageUrl } from "@/lib/orders/products";
import type { WooCommerceOrderPayload } from "./schema";

export interface NormalizedWooCommerceOrder {
  externalOrderId: string;
  orderNumber: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerName: string | null;
  city: string | null;
  addressLine: string | null;
  lineItems: OrderLineItem[] | null;
  currency: string;
  subtotalAmountMinor: number;
  totalAmountMinor: number;
  financialStatus: string | null;
  providerCreatedAt: Date | null;
}

function optionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toMinorUnits(value: string | number | undefined): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) {
    return null;
  }

  const minor = Math.round(amount * 100);
  return minor >= 0 ? minor : null;
}

function parseProviderCreatedAt(value: string | null | undefined): Date | null {
  const trimmed = optionalText(value);
  if (!trimmed) {
    return null;
  }

  const hasZone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(trimmed);
  const parsed = new Date(hasZone ? trimmed : `${trimmed}Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeWooCommerceOrder(
  order: WooCommerceOrderPayload,
): NormalizedWooCommerceOrder | null {
  const externalOrderId = String(order.id).trim();
  const currency = optionalText(order.currency)?.toUpperCase() ?? null;
  const totalAmountMinor = toMinorUnits(order.total);

  if (!externalOrderId || !currency || totalAmountMinor === null) {
    return null;
  }

  const orderNumber = order.number === undefined ? externalOrderId : String(order.number).trim();
  if (!orderNumber) {
    return null;
  }

  const billing = order.billing;
  const shipping = order.shipping;
  const name = [optionalText(billing?.first_name), optionalText(billing?.last_name)]
    .filter((part) => part)
    .join(" ");
  const address = [optionalText(billing?.address_1) ?? optionalText(shipping?.address_1), optionalText(billing?.address_2) ?? optionalText(shipping?.address_2)]
    .filter((part) => part)
    .join(" ");
  const lineItems = order.line_items?.length
    ? order.line_items.map((item) => {
        const raw = item as {
          name?: string | null;
          quantity?: number | null;
          sku?: string | null;
          product_id?: number | string | null;
          image?: { src?: string | null } | null;
        };
        const mapped: OrderLineItem = {
          name: optionalText(raw.name),
          quantity: typeof raw.quantity === "number" ? raw.quantity : null,
          sku: optionalText(raw.sku),
          imageUrl: safeProductImageUrl(raw.image?.src),
          productId: raw.product_id === undefined || raw.product_id === null ? null : String(raw.product_id),
        };
        return mapped;
      })
    : null;

  return {
    externalOrderId,
    orderNumber,
    customerEmail: optionalText(billing?.email),
    customerPhone: optionalText(billing?.phone),
    customerName: name.length > 0 ? name : null,
    city: optionalText(billing?.city) ?? optionalText(shipping?.city),
    addressLine: address.length > 0 ? address : null,
    lineItems,
    currency,
    subtotalAmountMinor: totalAmountMinor,
    totalAmountMinor,
    financialStatus: optionalText(order.status),
    providerCreatedAt: parseProviderCreatedAt(order.date_created_gmt),
  };
}
