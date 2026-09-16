export type MetaConversionDeliveryStatus =
  | "pending"
  | "sending"
  | "sent"
  | "failed";

export type MetaPurchaseDeliveryOutcomeStatus =
  | "sent"
  | "pending"
  | "failed"
  | "not_eligible"
  | "in_progress";

export interface MetaPurchaseDeliveryOutcome {
  status: MetaPurchaseDeliveryOutcomeStatus;
  eventId?: string;
  message?: string;
}

export interface MetaConversionDeliveryRecord {
  id: string;
  store_id: string;
  order_id: string;
  provider: "meta";
  event_type: "Purchase";
  event_id: string;
  status: MetaConversionDeliveryStatus;
  attempts: number;
  last_attempted_at: string | null;
  sent_at: string | null;
  last_error: string | null;
}
