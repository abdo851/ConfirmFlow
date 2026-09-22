import type { WooCommerceOrderPayload } from "./schema";

export interface NormalizedWooCommerceOrder {
  externalOrderId: string;
  orderNumber: string;
  customerEmail: string | null;
  customerPhone: string | null;
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

  return {
    externalOrderId,
    orderNumber,
    customerEmail: optionalText(order.billing?.email),
    customerPhone: optionalText(order.billing?.phone),
    currency,
    subtotalAmountMinor: totalAmountMinor,
    totalAmountMinor,
    financialStatus: optionalText(order.status),
    providerCreatedAt: parseProviderCreatedAt(order.date_created_gmt),
  };
}
