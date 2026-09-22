import type { ReactNode } from "react";

type ToastTone = "info" | "success" | "danger";

interface ToastProps {
  children: ReactNode;
  tone?: ToastTone;
  role?: "status" | "alert";
}

const toneClasses: Record<ToastTone, string> = {
  info: "border-accent/30 bg-cyan-50 text-cyan-950 dark:bg-cyan-950 dark:text-cyan-100",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  danger:
    "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100",
};

export function Toast({ children, tone = "info", role = "status" }: ToastProps) {
  return (
    <div
      role={role}
      className={`animate-toast-in rounded-xl border px-4 py-3 text-sm shadow-soft ${toneClasses[tone]}`}
    >
      {children}
    </div>
  );
}
