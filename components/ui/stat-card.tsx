"use client";

import type { ReactNode } from "react";
import { useCountUp } from "@/lib/animations/use-count-up";

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
  amber: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  emerald: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
} as const;

function StatFigure({ value }: { value: string }) {
  const numeric = /^-?\d+$/.test(value);
  const current = useCountUp(numeric ? Number(value) : 0, numeric);

  return (
    <p className="mt-5 text-3xl leading-none font-semibold tracking-tight tabular-nums" dir="ltr">
      {numeric ? current : value}
    </p>
  );
}

export function StatCard({ label, value, icon, trend, tone = "indigo" }: StatCardProps) {
  return (
    <article className="hover-lift rounded-2xl border border-line bg-surface p-6 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex size-10 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          {icon}
        </span>
        {trend ? (
          <span className="rounded-full bg-surface-muted px-2 py-1 text-xs font-medium text-muted">
            {trend}
          </span>
        ) : null}
      </div>
      <StatFigure value={value} />
      <p className="mt-2 text-sm leading-6 text-muted">{label}</p>
    </article>
  );
}
