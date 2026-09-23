import { MetaOnboardingGuide } from "@/components/connections/meta-onboarding-guide";
import { MetaProviderPanel } from "@/components/connections";
import { OnboardingStepShell } from "@/components/onboarding";

export default function OnboardingMetaPage() {
  return (
    <OnboardingStepShell
      currentStep={2}
      connectOverride={
        <>
          <MetaOnboardingGuide />
          <MetaProviderPanel />
        </>
      }
    />
  );
}
