import { OnboardingStepShell } from "@/components/onboarding";

export default function OnboardingConfirmationPage() {
  return (
    <OnboardingStepShell
      currentStep={3}
      title="Step 3 — Configure confirmation"
      description="Define how orders are confirmed before Confirma sends conversion events to Meta."
      connectLabel="Configure confirmation"
      statusLabel="Not configured"
      backHref="/onboarding/meta"
    />
  );
}
