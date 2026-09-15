import { ConnectionStatusBadge } from "@/components/connections";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDefaultConnectionState } from "@/lib/connections";
import { onboardingSteps } from "./steps";

export function OnboardingOverviewSteps() {
  return (
    <div className="space-y-4">
      {onboardingSteps.map((step) => {
        const connection = getDefaultConnectionState(step.connectionType);

        return (
          <Card key={step.href} title={`Step ${step.number} — ${step.label}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {step.description}
              </p>
              <ConnectionStatusBadge
                type={connection.type}
                status={connection.status}
              />
            </div>
            <div className="mt-4">
              <Button href={step.href} variant="outline">
                Open step {step.number}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
