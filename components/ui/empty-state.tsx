import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface px-4 py-10 text-center sm:px-6 sm:py-14">
      <svg viewBox="0 0 160 96" className="mx-auto mb-4 h-24 w-40 text-muted" aria-hidden>
        <rect x="16" y="18" width="88" height="64" rx="14" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M32 38h40M32 50h28M32 62h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <rect x="96" y="34" width="46" height="36" rx="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M104 46h30M104 56h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M128 28l6 6 12-14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-base font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
