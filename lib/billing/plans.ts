export type PlanTier = 'free' | 'starter' | 'pro' | 'business';

export interface PlanLimits {
  maxStores: number;
  maxOrdersPerMonth: number;
  maxUsers: number;
  maxShippingProviders: number;
  maxAdPlatforms: number;
  allowCustomDomain: boolean;
  allowApiAccess: boolean;
  prioritySupport: boolean;
}

export interface PlanMeta {
  tier: PlanTier;
  label: { en: string; ar: string };
  priceMonthly: number;
  priceYearly: number;
  limits: PlanLimits;
}

export const PLANS: PlanMeta[] = [
  { tier: 'free', label: { en: 'Free', ar: 'مجاني' }, priceMonthly: 0, priceYearly: 0, limits: { maxStores: 1, maxOrdersPerMonth: 100, maxUsers: 1, maxShippingProviders: 1, maxAdPlatforms: 1, allowCustomDomain: false, allowApiAccess: false, prioritySupport: false } },
  { tier: 'starter', label: { en: 'Starter', ar: 'المبتدئ' }, priceMonthly: 9900, priceYearly: 99000, limits: { maxStores: 3, maxOrdersPerMonth: 1000, maxUsers: 3, maxShippingProviders: 3, maxAdPlatforms: 3, allowCustomDomain: false, allowApiAccess: false, prioritySupport: false } },
  { tier: 'pro', label: { en: 'Pro', ar: 'الاحترافي' }, priceMonthly: 29900, priceYearly: 299000, limits: { maxStores: 10, maxOrdersPerMonth: 10000, maxUsers: 10, maxShippingProviders: 10, maxAdPlatforms: 3, allowCustomDomain: true, allowApiAccess: true, prioritySupport: true } },
  { tier: 'business', label: { en: 'Business', ar: 'الأعمال' }, priceMonthly: 79900, priceYearly: 799000, limits: { maxStores: 50, maxOrdersPerMonth: 100000, maxUsers: 50, maxShippingProviders: 50, maxAdPlatforms: 3, allowCustomDomain: true, allowApiAccess: true, prioritySupport: true } },
];

export function getPlanLimits(tier: PlanTier): PlanLimits {
  const plan = PLANS.find((p) => p.tier === tier);
  return plan ? plan.limits : PLANS[0].limits;
}
