"use client";

import { useEffect, useId, type ReactNode } from "react";

interface DialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  closeLabel: string;
}

export function Dialog({
  open,
  title,
  children,
  onClose,
  closeLabel,
}: DialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label={closeLabel}
        className="absolute inset-0 bg-slate-950/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-dialog-in relative z-10 w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-large"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-11 items-center justify-center rounded-xl text-muted hover:bg-surface-muted"
          >
            <span className="sr-only">{closeLabel}</span>
            <span aria-hidden>×</span>
          </button>
        </div>
        <div className="mt-4 text-sm text-muted">{children}</div>
      </div>
    </div>
  );
}
