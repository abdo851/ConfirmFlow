import type { ConnectionType } from "@/lib/connections";

export const onboardingSteps = [
  {
    number: 1 as const,
    label: "Connect your store",
    shortLabel: "Store",
    connectionType: "store" as ConnectionType,
    description: "Link your e-commerce platform to receive order events.",
    href: "/onboarding/store",
    connectLabel: "Connect store",
    placeholderMessage:
      "Store connection will be available in a future milestone.",
  },
  {
    number: 2 as const,
    label: "Connect Meta",
    shortLabel: "Meta",
    connectionType: "meta" as ConnectionType,
    description: "Add Meta Pixel and Conversions API credentials.",
    href: "/onboarding/meta",
    connectLabel: "Connect Meta",
    placeholderMessage:
      "Meta connection will be available in a future milestone.",
  },
  {
    number: 3 as const,
    label: "Configure confirmation",
    shortLabel: "Confirmation",
    connectionType: "confirmation" as ConnectionType,
    description: "Set how orders are confirmed before conversions are sent.",
    href: "/onboarding/confirmation",
    connectLabel: "Configure confirmation",
    placeholderMessage:
      "Confirmation setup will be available in a future milestone.",
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

export function getPreviousStepHref(
  stepNumber: OnboardingStepNumber,
): string {
  if (stepNumber === 1) {
    return "/onboarding";
  }

  const previous = onboardingSteps.find((step) => step.number === stepNumber - 1);
  return previous?.href ?? "/onboarding";
}
