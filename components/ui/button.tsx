import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "@/i18n/navigation";

type ButtonVariant =
  | "default"
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-primary text-primary-foreground shadow-soft hover:brightness-110",
  primary:
    "bg-primary text-primary-foreground shadow-soft hover:brightness-110",
  secondary:
    "bg-secondary text-secondary-foreground shadow-soft hover:brightness-110",
  outline:
    "border border-line bg-surface text-foreground hover:bg-surface-muted",
  ghost: "bg-transparent text-foreground hover:bg-surface-muted",
  danger: "bg-danger text-white shadow-soft hover:brightness-110",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-11 gap-1.5 rounded-lg px-3 text-sm",
  md: "min-h-11 gap-2 rounded-xl px-4 text-sm",
  lg: "min-h-12 gap-2 rounded-xl px-5 text-base",
};

const baseClasses =
  "pressable inline-flex items-center justify-center font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

function Spinner() {
  return (
    <span
      aria-hidden
      className="size-4 animate-spin rounded-full border-2 border-current border-e-transparent"
    />
  );
}

export function Button({
  variant = "default",
  size = "md",
  className = "",
  href,
  children,
  type = "button",
  loading = false,
  icon,
  disabled,
  ...props
}: ButtonProps) {
  const classes =
    `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`.trim();
  const content = (
    <>
      {loading ? <Spinner /> : icon}
      {children}
    </>
  );

  if (href && !disabled && !loading) {
    if (href.startsWith("/api/")) {
      return (
        <a href={href} className={classes}>
          {content}
        </a>
      );
    }

    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </button>
  );
}
