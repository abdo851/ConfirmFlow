/**
 * Provider-independent Confirma order domain model.
 * Core application code must not depend on Shopify payload shapes.
 */

export type OrderProvider = "shopify";

/** M3-B only supports pending — future milestones extend transitions. */
export type OrderConfirmationStatus = "pending";

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
  createdAt: string;
  updatedAt: string;
}
