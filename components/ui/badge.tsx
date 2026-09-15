import type { ReactNode } from "react";

type BadgeVariant = "default" | "muted" | "warning";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900",
  muted:
    "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  warning:
    "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
