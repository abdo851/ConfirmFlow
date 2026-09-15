import Link from "next/link";
import { onboardingSteps, type OnboardingStepNumber } from "./steps";

type StepVisualState = "current" | "visited" | "upcoming" | "not-started";

interface OnboardingStepNavProps {
  currentStep?: OnboardingStepNumber;
}

function getStepState(
  stepNumber: OnboardingStepNumber,
  currentStep?: OnboardingStepNumber,
): StepVisualState {
  if (!currentStep) {
    return "not-started";
  }

  if (stepNumber === currentStep) {
    return "current";
  }

  if (stepNumber < currentStep) {
    return "visited";
  }

  return "upcoming";
}

const stateLabels: Record<StepVisualState, string> = {
  current: "Current",
  visited: "Visited",
  upcoming: "Upcoming",
  "not-started": "Not started",
};

export function OnboardingStepNav({ currentStep }: OnboardingStepNavProps) {
  return (
    <nav aria-label="Onboarding progress" className="mb-8">
      <ol className="grid gap-3 sm:grid-cols-3">
        {onboardingSteps.map((step) => {
          const state = getStepState(step.number, currentStep);

          return (
            <li
              key={step.href}
              className={`rounded-lg border px-4 py-3 ${
                state === "current"
                  ? "border-neutral-900 bg-neutral-50 dark:border-neutral-100 dark:bg-neutral-900"
                  : "border-neutral-200 dark:border-neutral-800"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Step {step.number}
                  </p>
                  <Link
                    href={step.href}
                    className={`mt-1 block text-sm ${
                      state === "current" ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {step.label}
                  </Link>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                    state === "current"
                      ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                      : state === "visited"
                        ? "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                        : "bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400"
                  }`}
                >
                  {stateLabels[state]}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      {currentStep ? (
        <p className="mt-3 text-xs text-neutral-500">
          &quot;Visited&quot; means you opened this step. It does not mean the
          integration is connected.
        </p>
      ) : null}
    </nav>
  );
}
