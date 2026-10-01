"use client";

import type { ReactNode } from "react";
import { useCountUp } from "@/lib/animations/use-count-up";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  tone?: "indigo" | "teal" | "amber" | "emerald";
  series?: number[];
  enterIndex?: number;
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

function MiniSeries({ values }: { values: number[] }) {
  const width = 120;
  const height = 28;
  const peak = Math.max(...values, 1);
  const step = values.length === 1 ? 0 : width / (values.length - 1);
  const points = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : index * step;
    const y = height - 2 - (value / peak) * (height - 6);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-8 w-full text-indigo-600" aria-hidden>
      <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={points.join(" ")} />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  tone = "indigo",
  series,
  enterIndex,
}: StatCardProps) {
  return (
    <article
      className={`hover-lift relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-soft ${
        enterIndex === undefined ? "" : "animate-fade-in"
      }`}
      style={enterIndex === undefined ? undefined : { animationDelay: `${enterIndex * 60}ms` }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-teal-500/10" />
      <div className="relative">
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
        {series && series.length > 0 ? <MiniSeries values={series} /> : null}
        <p className="mt-2 text-sm leading-6 text-muted">{label}</p>
      </div>
    </article>
  );
}
