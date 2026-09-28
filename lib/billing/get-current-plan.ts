import type { PlanTier } from './plans';

/**
 * STUB: returns 'free' until the subscriptions table is live.
 * Do NOT call any external API here.
 */
export async function getCurrentPlan(): Promise<PlanTier> {
  return 'free';
}
