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
        <rect x="18" y="16" width="124" height="64" rx="16" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M40 42h48M40 56h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="112" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <p className="text-base font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
