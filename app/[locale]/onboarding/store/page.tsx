import { StoreProviderPanel } from "@/components/connections";
import { OnboardingStepShell } from "@/components/onboarding";

export default function OnboardingStorePage() {
  return (
    <OnboardingStepShell
      currentStep={1}
      connectOverride={<StoreProviderPanel />}
    />
  );
}
