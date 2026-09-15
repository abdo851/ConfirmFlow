import { OnboardingStepShell } from "@/components/onboarding";

export default function OnboardingMetaPage() {
  return (
    <OnboardingStepShell
      currentStep={2}
      title="Step 2 — Connect Meta"
      description="Add your Meta Pixel and Conversions API credentials to send verified purchase events."
      connectLabel="Connect Meta"
      backHref="/onboarding/store"
      nextHref="/onboarding/confirmation"
    />
  );
}
