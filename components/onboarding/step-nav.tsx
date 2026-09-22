"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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

export function OnboardingStepNav({ currentStep }: OnboardingStepNavProps) {
  const t = useTranslations("onboarding");
  const progress = currentStep
    ? Math.round((currentStep / onboardingSteps.length) * 100)
    : 0;

  const stateLabels = {
    current: t("stepStates.current"),
    visited: t("stepStates.visited"),
    upcoming: t("stepStates.upcoming"),
    "not-started": t("stepStates.notStarted"),
  };

  return (
    <nav aria-label={t("stepNavAria")} className="mb-8">
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-400 transition-[width] duration-500 ease-out rtl:bg-gradient-to-l"
          style={{ width: `${progress}%` }}
        />
      </div>
      <ol className="grid gap-3 sm:grid-cols-3">
        {onboardingSteps.map((step) => {
          const state = getStepState(step.number, currentStep);

          return (
            <li
              key={step.href}
              className={`rounded-2xl border px-4 py-3 shadow-soft transition-colors duration-200 ${
                state === "current"
                  ? "border-primary bg-indigo-50/80 dark:bg-indigo-950/40"
                  : state === "visited"
                    ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30"
                    : "border-line bg-surface"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                    {t("stepNumber", { number: step.number })}
                  </p>
                  <Link
                    href={step.href}
                    className={`mt-1 block min-h-11 text-sm ${
                      state === "current" ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {t(`steps.${step.stepKey}.label`)}
                  </Link>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium tracking-wide uppercase ${
                    state === "current"
                      ? "bg-primary text-primary-foreground"
                      : state === "visited"
                        ? "bg-emerald-600 text-white"
                        : "bg-surface-muted text-muted"
                  }`}
                >
                  {state === "visited" ? <span aria-hidden>✓</span> : null}
                  {stateLabels[state]}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      {currentStep ? (
        <p className="mt-3 text-xs text-muted">{t("visitedHint")}</p>
      ) : null}
    </nav>
  );
}
