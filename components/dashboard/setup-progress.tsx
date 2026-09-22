import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";

export async function SetupProgress() {
  const t = await getTranslations("dashboard");

  const steps = [
    { label: t("setupSteps.store"), href: "/onboarding/store", complete: false },
    { label: t("setupSteps.meta"), href: "/onboarding/meta", complete: false },
    {
      label: t("setupSteps.confirmation"),
      href: "/onboarding/confirmation",
      complete: false,
    },
  ] as const;

  const completedCount = steps.filter((step) => step.complete).length;

  return (
    <Card title={t("setupProgressTitle")} description={t("setupProgressDescription")} interactive>
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted">
            {t("integrationsConfigured", {
              completed: completedCount,
              total: steps.length,
            })}
          </span>
          <span className="font-medium">
            {Math.round((completedCount / steps.length) * 100)}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-400 transition-[width] duration-500 ease-out rtl:bg-gradient-to-l"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </div>
      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-surface-muted"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line text-xs font-medium">
                {index + 1}
              </span>
              <span>{step.label}</span>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}
