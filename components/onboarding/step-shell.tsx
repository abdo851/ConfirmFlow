import Link from "next/link";
import type { ReactNode } from "react";
import { ConnectionStatusBadge } from "@/components/connections";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDefaultConnectionState } from "@/lib/connections";
import { ConnectPlaceholderButton } from "./connect-placeholder-button";
import { OnboardingStepNav } from "./step-nav";
import {
  getNextStepHref,
  getOnboardingStep,
  getPreviousStepHref,
  onboardingSteps,
  type OnboardingStepNumber,
} from "./steps";

interface OnboardingStepShellProps {
  currentStep: OnboardingStepNumber;
  children?: ReactNode;
  connectOverride?: ReactNode;
}

export function OnboardingStepShell({
  currentStep,
  children,
  connectOverride,
}: OnboardingStepShellProps) {
  const step = getOnboardingStep(currentStep);
  const connection = getDefaultConnectionState(step.connectionType);
  const backHref = getPreviousStepHref(currentStep);
  const nextHref = getNextStepHref(currentStep) ?? "/dashboard";
  const nextLabel =
    currentStep === 3 ? "Continue to dashboard" : "Continue";
  const remainingSteps = onboardingSteps.filter(
    (item) => item.number > currentStep,
  );

  return (
    <div>
      <OnboardingStepNav currentStep={currentStep} />
      <Card
        title={`Step ${step.number} — ${step.label}`}
        description={step.description}
      >
        <div className="flex items-start justify-between gap-4 rounded-md border border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <div>
            <p className="text-sm font-medium">Connection status</p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              No real integration is connected in this milestone.
            </p>
          </div>
          <ConnectionStatusBadge
            type={connection.type}
            status={connection.status}
          />
        </div>

        {children ? <div className="mt-4">{children}</div> : null}

        <div className="mt-6">
          {connectOverride ?? (
            <ConnectPlaceholderButton
              label={step.connectLabel}
              message={step.placeholderMessage}
            />
          )}
        </div>

        {remainingSteps.length > 0 ? (
          <div className="mt-6 rounded-md border border-dashed border-neutral-300 px-4 py-3 dark:border-neutral-700">
            <p className="text-sm font-medium">What remains</p>
            <ul className="mt-2 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
              {remainingSteps.map((item) => (
                <li key={item.href}>
                  Step {item.number}: {item.label}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-6 rounded-md border border-dashed border-neutral-300 px-4 py-3 dark:border-neutral-700">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              After reviewing this step, continue to your dashboard. Integrations
              will remain unavailable until future milestones.
            </p>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-4 border-t border-neutral-200 pt-6 dark:border-neutral-800">
          <Link href={backHref} className="text-sm underline">
            Back
          </Link>
          <Button href={nextHref}>{nextLabel}</Button>
        </div>
      </Card>
    </div>
  );
}
