import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label: string;
  error?: string;
  helperText?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export function Input({
  label,
  id,
  className = "",
  error,
  helperText,
  prefix,
  suffix,
  ...props
}: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const describedBy = error
    ? `${inputId}-error`
    : helperText
      ? `${inputId}-help`
      : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-muted">
            {prefix}
          </span>
        ) : null}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`min-h-11 w-full rounded-xl border bg-surface px-3 text-sm text-foreground shadow-soft outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted focus:border-primary focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--ring)_28%,transparent)] disabled:opacity-60 ${
            prefix ? "ps-10" : ""
          } ${suffix ? "pe-10" : ""} ${
            error ? "border-danger" : "border-line"
          } ${className}`.trim()}
          {...props}
        />
        {suffix ? (
          <span className="absolute inset-y-0 end-0 flex items-center pe-1 text-muted">
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-help`} className="text-sm text-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
