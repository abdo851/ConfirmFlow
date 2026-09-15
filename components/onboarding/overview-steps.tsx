import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { onboardingSteps } from "./steps";

export function OnboardingOverviewSteps() {
  return (
    <div className="space-y-4">
      {onboardingSteps.map((step) => (
        <Card key={step.href} title={`Step ${step.number} — ${step.label}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {step.description}
            </p>
            <Badge variant="warning">{step.statusLabel}</Badge>
          </div>
          <div className="mt-4">
            <Button href={step.href} variant="outline">
              Open step {step.number}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
