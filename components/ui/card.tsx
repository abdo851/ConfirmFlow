import type { ReactNode } from "react";

interface CardProps {
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  interactive?: boolean;
  backdrop?: boolean;
  className?: string;
}

export function Card({
  title,
  description,
  children,
  footer,
  interactive = false,
  backdrop = false,
  className = "",
}: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-line p-4 shadow-soft sm:p-6 ${
        backdrop
          ? "bg-white/80 backdrop-blur-xl dark:bg-slate-950/75"
          : "bg-surface"
      } ${interactive ? "hover-lift" : ""} ${className}`.trim()}
    >
      <header>
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        ) : null}
      </header>
      {children ? <div className="mt-4">{children}</div> : null}
      {footer ? (
        <footer className="mt-6 border-t border-line pt-4">{footer}</footer>
      ) : null}
    </section>
  );
}
