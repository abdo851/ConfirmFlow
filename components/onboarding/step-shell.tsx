import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OnboardingStepNav } from "./step-nav";

interface OnboardingStepShellProps {
  currentStep: 1 | 2 | 3;
  title: string;
  description: string;
  connectLabel: string;
  statusLabel?: string;
  children?: ReactNode;
  backHref?: string;
  nextHref?: string;
  nextLabel?: string;
}

export function OnboardingStepShell({
  currentStep,
  title,
  description,
  connectLabel,
  statusLabel = "Not connected",
  children,
  backHref,
  nextHref,
  nextLabel = "Continue",
}: OnboardingStepShellProps) {
  return (
    <div>
      <OnboardingStepNav currentStep={currentStep} />
      <Card title={title} description={description}>
        <div className="flex items-center justify-between gap-4 rounded-md border border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <div>
            <p className="text-sm font-medium">Connection status</p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Integration will be available in a future milestone.
            </p>
          </div>
          <Badge variant="warning">{statusLabel}</Badge>
        </div>
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" disabled>
            {connectLabel}
          </Button>
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          Connection is not available yet. This button is a UI placeholder only.
        </p>
        <div className="mt-8 flex items-center justify-between gap-4 border-t border-neutral-200 pt-6 dark:border-neutral-800">
          {backHref ? (
            <Link href={backHref} className="text-sm underline">
              Back
            </Link>
          ) : (
            <span />
          )}
          {nextHref ? (
            <Button href={nextHref} variant="outline">
              {nextLabel}
            </Button>
          ) : (
            <Button href="/dashboard" variant="outline">
              Go to dashboard
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
