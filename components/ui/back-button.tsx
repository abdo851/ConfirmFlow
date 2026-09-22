"use client";

import { useRouter } from "@/i18n/navigation";

interface BackButtonProps {
  href: string;
  label: string;
}

export function BackButton({ href, label }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label={label}
      className="pressable inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium text-foreground hover:text-primary"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
          return;
        }

        router.push(href);
      }}
    >
      <span className="rtl:rotate-180" aria-hidden>
        ←
      </span>
      {label}
    </button>
  );
}
