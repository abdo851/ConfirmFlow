import { createHash } from "crypto";
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

export interface GA4PurchaseOrder {
  id: string;
  external_order_id?: string | null;
  order_number?: string | null;
  total_amount_minor: number;
  currency: string;
}

export interface GA4PurchasePayload {
  client_id: string;
  events: Array<{
    name: "purchase";
    params: {
      transaction_id: string;
      value: number;
      currency: string;
      session_id: string;
      engagement_time_msec: number;
      debug_mode?: number;
      items: Array<{ item_id: string; item_name: string; quantity: number }>;
    };
  }>;
}

const CLIENT_ID_MODULUS = BigInt(2147483648);

function positiveClientPart(hash: Buffer, offset: number): number {
  const value = hash.subarray(offset, offset + 8).readBigUInt64BE(0) % CLIENT_ID_MODULUS;
  const part = Number(value);
  return part === 0 ? 1 : part;
}

function stableClientId(value: string): string {
  const hash = createHash("sha256").update(value, "utf8").digest();
  return `${positiveClientPart(hash, 0)}.${positiveClientPart(hash, 8)}`;
}

export function buildGA4Purchase(input: {
  order: GA4PurchaseOrder;
  event_id: string;
}): GA4PurchasePayload {
  const externalId = input.order.external_order_id?.trim() || "";
  const transactionId = externalId || input.event_id;
  const itemName = `Order ${input.order.order_number?.trim() || transactionId}`;
  const debugMode = process.env.GOOGLE_GA4_DEBUG_MODE === "1";

  return {
    client_id: stableClientId(input.order.id || input.event_id),
    events: [
      {
        name: "purchase",
        params: {
          transaction_id: transactionId,
          value: Number(input.order.total_amount_minor) / 100,
          currency: input.order.currency.trim().toUpperCase(),
          session_id: String(Math.floor(Date.now() / 1000)),
          engagement_time_msec: 100,
          ...(debugMode ? { debug_mode: 1 } : {}),
          items: [
            {
              item_id: input.order.id,
              item_name: itemName,
              quantity: 1,
            },
          ],
        },
      },
    ],
  };
}
