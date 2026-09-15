import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OnboardingStepNav } from "@/components/onboarding";

const steps = [
  {
    number: 1,
    title: "Connect your store",
    description: "Link your e-commerce platform to receive order events.",
    href: "/onboarding/store",
  },
  {
    number: 2,
    title: "Connect Meta",
    description: "Add Meta Pixel and Conversions API credentials.",
    href: "/onboarding/meta",
  },
  {
    number: 3,
    title: "Configure confirmation",
    description: "Set how orders are confirmed before conversions are sent.",
    href: "/onboarding/confirmation",
  },
] as const;

export default function OnboardingPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Setup Confirma</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Complete these three steps to prepare your account for verified
          conversions.
        </p>
      </div>
      <OnboardingStepNav currentStep={1} />
      <div className="space-y-4">
        {steps.map((step) => (
          <Card key={step.href} title={`Step ${step.number} — ${step.title}`}>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {step.description}
            </p>
            <div className="mt-4">
              <Button href={step.href} variant="outline">
                Open step
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-8 text-sm">
        <Link href="/dashboard" className="underline">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}
