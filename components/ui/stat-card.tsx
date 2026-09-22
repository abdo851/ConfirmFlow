import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: string;
}

export function StatCard({ label, value, icon, trend }: StatCardProps) {
  return (
    <article className="hover-lift rounded-2xl border border-line bg-surface p-4 shadow-soft sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-primary dark:bg-indigo-950/50">
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
      <p className="mt-2 text-sm text-muted">{label}</p>
    </article>
  );
}
