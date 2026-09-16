/**
 * Provider-independent Confirma conversion event domain.
 * Core code must not depend on Meta Graph API field names or structures.
 */

export type ConversionEventName = "Purchase";

/** Server-side origin for ecommerce conversion events. */
export type ConversionActionSource = "server";

export interface ConversionUserData {
  email?: string | null;
  phone?: string | null;
}

export interface ConversionCustomData {
  currency: string;
  /** Monetary amount in integer minor units — domain representation. */
  valueMinor: number;
}

export interface ConversionEvent {
  eventName: ConversionEventName;
  /** Deterministic identifier derived from Confirma order identity. */
  eventId: string;
  /** Unix timestamp in seconds — supplied by future orchestration, not the browser. */
  eventTime: number;
  actionSource: ConversionActionSource;
  userData: ConversionUserData;
  customData: ConversionCustomData;
}
