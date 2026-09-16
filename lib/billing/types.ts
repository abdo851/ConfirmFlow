/**
 * Billing foundation types — no provider implementation in M2-C4.
 */

export type BillingProviderId = "stripe";

export interface BillingPlan {
  id: string;
  name: string;
  description?: string;
}

export interface BillingEntitlement {
  key: string;
  enabled: boolean;
}

export interface BillingProvider {
  readonly id: BillingProviderId;
  createCheckoutSession(input: {
    userId: string;
    planId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string }>;
  getEntitlements(userId: string): Promise<BillingEntitlement[]>;
}
