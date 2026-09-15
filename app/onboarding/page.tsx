import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OnboardingOverviewSteps, OnboardingStepNav } from "@/components/onboarding";

export default function OnboardingPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Setup Confirma</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Complete these three steps in order to prepare your account for verified
          conversions.
        </p>
      </div>

      <OnboardingStepNav />

      <div className="mb-8 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-4 dark:border-neutral-800 dark:bg-neutral-950">
        <p className="text-sm font-medium">Setup sequence</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-neutral-600 dark:text-neutral-400">
          <li>Connect your store</li>
          <li>Connect Meta</li>
          <li>Configure confirmation</li>
        </ol>
        <div className="mt-4">
          <Button href="/onboarding/store">Start with Step 1</Button>
        </div>
      </div>

      <OnboardingOverviewSteps />

      <p className="mt-8 text-sm">
        <Link href="/dashboard" className="underline">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}
