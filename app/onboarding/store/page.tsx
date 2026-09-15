import { OnboardingStepShell } from "@/components/onboarding";

export default function OnboardingStorePage() {
  return (
    <OnboardingStepShell
      currentStep={1}
      title="Step 1 — Connect your store"
      description="Link Shopify, WooCommerce, or YouCan to import orders into Confirma."
      connectLabel="Connect store"
      nextHref="/onboarding/meta"
    />
  );
}
