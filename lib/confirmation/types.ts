/**
 * Provider-independent confirmation domain.
 * Operates on Confirma orders — not Shopify or other store payloads.
 */

export type ConfirmationStatus = "pending" | "confirmed";

export type ConfirmOrderResultStatus =
  | "confirmed"
  | "already_confirmed"
  | "not_found"
  | "forbidden"
  | "invalid_state";

export interface ConfirmOrderResult {
  status: ConfirmOrderResultStatus;
  orderId?: string;
  confirmedAt?: string;
}

export interface ConfirmOrderActor {
  userId: string;
}
