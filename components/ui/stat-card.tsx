import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  tone?: "indigo" | "teal" | "amber" | "emerald";
}

const toneClasses = {
  indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200",
  teal: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-200",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
} as const;

export function StatCard({ label, value, icon, trend, tone = "indigo" }: StatCardProps) {
  return (
    <article className="hover-lift rounded-2xl border border-line bg-surface p-5 shadow-soft sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex size-10 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          {icon}
        </span>
        {trend ? (
          <span className="text-xs font-medium text-muted" aria-hidden>
            {trend}
          </span>
        ) : null}
      </div>
      <p className="animate-count mt-4 text-3xl leading-none font-semibold tracking-tight">
        {value}
      </p>
      <p className="mt-2 text-sm leading-7 text-muted">{label}</p>
    </article>
  );
}
