"use client";

import { useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
      {open ? (
        <path d="M4 4l16 16M9.5 9.7A4 4 0 0 0 14.3 14.5M6.1 6.4C4.3 7.8 3 9.7 3 12c2.2 4 5.4 6 9 6 1.5 0 2.9-.3 4.1-.9M10 6.1A10 10 0 0 1 12 6c3.6 0 6.8 2 9 6-.5 1-1.2 1.9-2 2.7" />
      ) : (
        <>
          <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      )}
    </svg>
  );
}

export function PasswordField({
  label,
  name,
  placeholder,
  autoComplete,
  revealLabel,
  concealLabel,
}: {
  label: string;
  name: string;
  placeholder: string;
  autoComplete: string;
  revealLabel: string;
  concealLabel: string;
}) {
  const [visible, setVisible] = useState(false);
  const suffix: ReactNode = (
    <button
      type="button"
      className="inline-flex size-11 items-center justify-center rounded-lg transition duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
      aria-label={visible ? concealLabel : revealLabel}
      aria-pressed={visible}
      onClick={() => setVisible((current) => !current)}
    >
      <EyeIcon open={visible} />
    </button>
  );

  return (
    <Input
      label={label}
      type={visible ? "text" : "password"}
      name={name}
      autoComplete={autoComplete}
      placeholder={placeholder}
      required
      suffix={suffix}
    />
  );
}
