import type { ReactNode } from "react";

type BadgeVariant =
  | "default"
  | "muted"
  | "warning"
  | "success"
  | "danger"
  | "accent";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  pulse?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-primary text-primary-foreground",
  muted: "bg-surface-muted text-muted",
  warning: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  success:
    "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  danger: "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  accent: "bg-cyan-50 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200",
};

const dotClasses: Record<BadgeVariant, string> = {
  default: "bg-primary-foreground",
  muted: "bg-muted",
  warning: "bg-amber-500",
  success: "bg-emerald-500",
  danger: "bg-rose-500",
  accent: "bg-cyan-500",
};

export function Badge({
  children,
  variant = "default",
  dot = false,
  pulse = false,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${variantClasses[variant]}`}
    >
      {dot ? (
        <span
          aria-hidden
          className={`size-1.5 rounded-full ${dotClasses[variant]} ${
            pulse ? "animate-pulse-dot" : ""
          }`}
        />
      ) : null}
      {children}
    </span>
  );
}
