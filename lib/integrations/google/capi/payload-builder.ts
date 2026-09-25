import { hashGoogleEmail, hashGooglePhone } from "./hash-user-data";
import { googleCustomerId } from "../validation";

export interface GooglePurchaseOrder {
  id: string;
  currency: string;
  value: number;
  email?: string | null;
  phone?: string | null;
}

export interface GoogleConversionPayload {
  conversions: Array<{
    conversionAction: string;
    conversionDateTime: string;
    conversionValue: number;
    currencyCode: string;
    orderId: string;
    userIdentifiers: Array<{ hashedEmail?: string; hashedPhoneNumber?: string }>;
  }>;
  partialFailure: true;
}

function formatGoogleDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new Error("invalid_confirmed_at");
  }

  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}+00:00`;
}

export function buildGooglePayload(input: {
  conversion_id: string;
  conversion_label?: string | null;
  order: GooglePurchaseOrder;
  event_id: string;
  confirmed_at: string;
}): GoogleConversionPayload {
  const customerId = googleCustomerId(input.conversion_id);
  const label = input.conversion_label?.trim() || "purchase";
  const identifiers: GoogleConversionPayload["conversions"][number]["userIdentifiers"] = [];

  if (input.order.email?.trim()) {
    identifiers.push({ hashedEmail: hashGoogleEmail(input.order.email) });
  }
  if (input.order.phone?.trim()) {
    identifiers.push({ hashedPhoneNumber: hashGooglePhone(input.order.phone) });
  }

  return {
    partialFailure: true,
    conversions: [
      {
        conversionAction: `customers/${customerId}/conversionActions/${label}`,
        conversionDateTime: formatGoogleDateTime(input.confirmed_at),
        conversionValue: input.order.value,
        currencyCode: input.order.currency.trim().toUpperCase(),
        orderId: input.event_id,
        userIdentifiers: identifiers,
      },
    ],
  };
}
