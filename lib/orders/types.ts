/**
 * Provider-independent Confirma order domain model.
 * Core application code must not depend on Shopify payload shapes.
 */

export type OrderProvider = "shopify" | "youcan";

/** Confirmation lifecycle states for Confirma orders. */
export type OrderConfirmationStatus = "pending" | "confirmed";

export interface ConfirmaOrderInput {
  storeId: string;
  ownerId: string;
  provider: OrderProvider;
  externalOrderId: string;
  orderNumber: string | null;
  /** Stored for future confirmation workflows (WhatsApp/email). */
  customerEmail: string | null;
  /** Stored for future confirmation workflows (WhatsApp/SMS). */
  customerPhone: string | null;
  currency: string;
  subtotalAmountMinor: number;
  totalAmountMinor: number;
  /** Provider financial status — informational only, not confirmation. */
  financialStatus: string | null;
  confirmationStatus: OrderConfirmationStatus;
  providerCreatedAt: string | null;
  receivedAt: Date;
}

export interface ConfirmaOrder extends ConfirmaOrderInput {
  id: string;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Merchant-facing order row for the dashboard orders list. */
export interface MerchantOrderListItem {
  id: string;
  orderNumber: string | null;
  externalOrderId: string;
  customerEmail: string | null;
  customerPhone: string | null;
  currency: string;
  totalAmountMinor: number;
  confirmationStatus: OrderConfirmationStatus;
  confirmedAt: string | null;
  receivedAt: string;
}
