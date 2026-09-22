import { getTranslations } from "next-intl/server";
import { ConnectionStatusBadge } from "@/components/connections";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDefaultConnectionState } from "@/lib/connections";
import { onboardingSteps } from "./steps";

export async function OnboardingOverviewSteps() {
  const t = await getTranslations("onboarding");

  return (
    <div className="space-y-4">
      {onboardingSteps.map((step) => {
        const connection = getDefaultConnectionState(step.connectionType);

        return (
          <Card
            key={step.href}
            interactive
            title={`${t("stepNumber", { number: step.number })} — ${t(`steps.${step.stepKey}.label`)}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="text-sm text-muted">
                {t(`steps.${step.stepKey}.description`)}
              </p>
              <ConnectionStatusBadge
                type={connection.type}
                status={connection.status}
              />
            </div>
            <div className="mt-4">
              <Button href={step.href} variant="outline">
                {t("openStep", { number: step.number })}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
