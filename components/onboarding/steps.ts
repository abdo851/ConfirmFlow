import type { ConnectionType } from "@/lib/connections";

export const onboardingSteps = [
  {
    number: 1 as const,
    stepKey: "store",
    connectionType: "store" as ConnectionType,
    href: "/onboarding/store",
  },
  {
    number: 2 as const,
    stepKey: "meta",
    connectionType: "meta" as ConnectionType,
    href: "/onboarding/meta",
  },
  {
    number: 3 as const,
    stepKey: "confirmation",
    connectionType: "confirmation" as ConnectionType,
    href: "/onboarding/confirmation",
  },
] as const;

export type OnboardingStepNumber = (typeof onboardingSteps)[number]["number"];

export function getOnboardingStep(stepNumber: OnboardingStepNumber) {
  return onboardingSteps.find((step) => step.number === stepNumber)!;
}

export function getNextStepHref(stepNumber: OnboardingStepNumber): string | null {
  const next = onboardingSteps.find((step) => step.number === stepNumber + 1);
  return next?.href ?? null;
}

export function getPreviousStepHref(stepNumber: OnboardingStepNumber): string {
  if (stepNumber === 1) {
    return "/onboarding";
  }

  const previous = onboardingSteps.find((step) => step.number === stepNumber - 1);
  return previous?.href ?? "/onboarding";
}
