import Link from "next/link";

const steps = [
  { number: 1, label: "Connect store", href: "/onboarding/store" },
  { number: 2, label: "Connect Meta", href: "/onboarding/meta" },
  { number: 3, label: "Configure confirmation", href: "/onboarding/confirmation" },
] as const;

interface OnboardingStepNavProps {
  currentStep: 1 | 2 | 3;
}

export function OnboardingStepNav({ currentStep }: OnboardingStepNavProps) {
  return (
    <nav aria-label="Onboarding progress" className="mb-8">
      <ol className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {steps.map((step) => {
          const isCurrent = step.number === currentStep;
          const isComplete = step.number < currentStep;

          return (
            <li key={step.href} className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  isCurrent
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : isComplete
                      ? "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                      : "border border-neutral-300 text-neutral-500 dark:border-neutral-700"
                }`}
              >
                {step.number}
              </span>
              <Link
                href={step.href}
                className={`text-sm ${isCurrent ? "font-semibold" : "text-neutral-600 dark:text-neutral-400"}`}
              >
                {step.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
