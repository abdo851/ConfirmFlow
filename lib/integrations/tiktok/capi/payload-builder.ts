import { hashTikTokEmail, hashTikTokPhone } from "./hash-user-data";

export interface TikTokPurchaseOrder {
  currency: string;
  value: number;
  email?: string | null;
  phone?: string | null;
}

export interface TikTokEventPayload {
  event_source: "web";
  event_source_id: string;
  data: Array<{
    event: "CompletePayment";
    event_time: number;
    event_id: string;
    user: {
      email_hashed?: string;
      phone_hashed?: string;
    };
    properties: {
      currency: string;
      value: number;
    };
  }>;
}

export function buildTikTokPayload(input: {
  pixel_code: string;
  order: TikTokPurchaseOrder;
  event_id: string;
  confirmed_at: string;
}): TikTokEventPayload {
  const confirmedAt = new Date(input.confirmed_at);
  if (Number.isNaN(confirmedAt.getTime())) {
    throw new Error("invalid_confirmed_at");
  }

  const user: TikTokEventPayload["data"][number]["user"] = {};
  if (input.order.email?.trim()) {
    user.email_hashed = hashTikTokEmail(input.order.email);
  }
  if (input.order.phone?.trim()) {
    user.phone_hashed = hashTikTokPhone(input.order.phone);
  }

  return {
    event_source: "web",
    event_source_id: input.pixel_code,
    data: [
      {
        event: "CompletePayment",
        event_time: Math.floor(confirmedAt.getTime() / 1000),
        event_id: input.event_id,
        user,
        properties: {
          currency: input.order.currency.trim().toUpperCase(),
          value: input.order.value,
        },
      },
    ],
  };
}
