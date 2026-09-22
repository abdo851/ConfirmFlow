"use client";

import type { ReactNode } from "react";

interface TooltipProps {
  label: string;
  children: ReactNode;
}

export function Tooltip({ label, children }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full left-1/2 z-30 mt-2 -translate-x-1/2 rounded-lg bg-slate-900 px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-medium transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-slate-100 dark:text-slate-900"
      >
        {label}
      </span>
    </span>
  );
}
