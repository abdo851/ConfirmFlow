import Link from "next/link";
import { Card } from "@/components/ui/card";

const steps = [
  { label: "Connect store", href: "/onboarding/store", complete: false },
  { label: "Connect Meta", href: "/onboarding/meta", complete: false },
  {
    label: "Configure confirmation",
    href: "/onboarding/confirmation",
    complete: false,
  },
] as const;

export function SetupProgress() {
  const completedCount = steps.filter((step) => step.complete).length;

  return (
    <Card
      title="Setup progress"
      description="Complete onboarding to configure integrations. None are connected yet."
    >
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-neutral-600 dark:text-neutral-400">
            {completedCount} of {steps.length} integrations configured
          </span>
          <span className="font-medium">{Math.round((completedCount / steps.length) * 100)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-neutral-900 transition-all dark:bg-neutral-100"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </div>
      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-xs font-medium dark:border-neutral-700">
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
