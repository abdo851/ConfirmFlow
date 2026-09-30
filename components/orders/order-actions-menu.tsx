"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { archiveOrderAction, rejectOrderAction } from "@/lib/confirmation/order-actions";
import { confirmOrderRequest, shouldShowConfirmButton } from "@/lib/orders/confirm-client";
import type { OrderConfirmationStatus } from "@/lib/orders/types";

type MenuKey =
  | "pending"
  | "confirmed"
  | "rejected"
  | "shipped"
  | "delivered"
  | "returned"
  | "cancelled"
  | "archived";

const ITEMS: MenuKey[] = [
  "pending",
  "confirmed",
  "rejected",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
  "archived",
];

const COMING_SOON = new Set<MenuKey>(["pending", "shipped", "delivered", "returned", "cancelled"]);

export function OrderActionsMenu({
  orderId,
  confirmationStatus,
  onConfirmed,
}: {
  orderId: string;
  confirmationStatus: OrderConfirmationStatus;
  onConfirmed?: (confirmedAt?: string) => void;
}) {
  const t = useTranslations("orders");
  const router = useRouter();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<Extract<MenuKey, "rejected" | "archived"> | null>(null);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; above: boolean } | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    function place() {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      const width = 224;
      const margin = 8;
      const menuHeight = menuRef.current?.offsetHeight ?? 380;
      const rtl = document.documentElement.dir === "rtl";
      const rawLeft = rtl ? rect.left : rect.right - width;
      const left = Math.min(Math.max(margin, rawLeft), window.innerWidth - width - margin);
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const above = spaceBelow < menuHeight + margin && spaceAbove > spaceBelow;
      const top = above
        ? Math.max(margin, rect.top - menuHeight - margin)
        : Math.min(rect.bottom + margin, window.innerHeight - menuHeight - margin);
      setMenuStyle({ top, left, above });
    }

    place();
    const frame = requestAnimationFrame(place);
    window.addEventListener("resize", place);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    function onScroll() {
      setOpen(false);
    }

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  function enabled(key: MenuKey) {
    if (COMING_SOON.has(key) || pending) {
      return false;
    }
    if (key === "confirmed") {
      return shouldShowConfirmButton(confirmationStatus);
    }
    if (key === "rejected") {
      return confirmationStatus === "pending";
    }
    if (key === "archived") {
      return confirmationStatus === "confirmed" || confirmationStatus === "rejected";
    }
    return false;
  }

  async function choose(key: MenuKey) {
    if (!enabled(key)) {
      return;
    }
    if (key === "rejected" || key === "archived") {
      setPrompt(key);
      setOpen(false);
      return;
    }
    setPending(true);
    setError(null);
    try {
      if (key === "confirmed") {
        const result = await confirmOrderRequest(orderId);
        if (!result.ok) {
          setError(t(`errors.${result.errorKey}`));
          return;
        }
        onConfirmed?.(result.confirmedAt);
        router.refresh();
        setOpen(false);
      }
    } catch {
      setError(t("errors.unexpected"));
    } finally {
      setPending(false);
    }
  }

  async function applyPrompt() {
    if (!prompt) {
      return;
    }
    const key = prompt;
    setPending(true);
    setError(null);
    try {
      if (key === "rejected") {
        await rejectOrderAction(orderId);
      }
      if (key === "archived") {
        await archiveOrderAction(orderId);
      }
      setPrompt(null);
      router.refresh();
    } catch {
      setError(t("errors.unexpected"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        loading={pending}
        onClick={() => setOpen((value) => !value)}
      >
        {t("actionsMenu.label")}
      </Button>
      {open && menuStyle
        ? createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          style={{ top: menuStyle.top, left: menuStyle.left }}
          className={`fixed z-[80] w-56 rounded-2xl border border-line bg-surface p-1 shadow-large ${
            menuStyle.above ? "orders-pop-above" : "orders-pop-below"
          }`}
        >
          {ITEMS.map((key) => {
            const soon = COMING_SOON.has(key);
            const current = confirmationStatus === key;
            return (
              <button
                key={key}
                type="button"
                role="menuitem"
                disabled={!enabled(key)}
                aria-current={current ? "true" : undefined}
                onClick={() => void choose(key)}
                className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-start text-sm enabled:hover:bg-indigo-50 disabled:cursor-default"
              >
                <span>{t(`actionsMenu.${key}`)}</span>
                {soon ? (
                  <span className="text-xs font-semibold text-rose-600">{t("actionsMenu.soon")}</span>
                ) : current ? (
                  <span className="text-xs text-muted">{t("actionsMenu.current")}</span>
                ) : null}
              </button>
            );
          })}
        </div>,
            document.body,
          )
        : null}
      {error ? <p className="mt-1 max-w-56 text-xs text-rose-700">{error}</p> : null}
      {prompt
        ? createPortal(
            <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
              <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-large"
              >
                <h2 className="text-base font-semibold">{t("statusConfirm.title")}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {t("statusConfirm.body", { status: t(`actionsMenu.${prompt}`) })}
                </p>
                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setPrompt(null)} disabled={pending}>
                    {t("statusConfirm.cancel")}
                  </Button>
                  <Button type="button" loading={pending} onClick={() => void applyPrompt()}>
                    {t("statusConfirm.confirm")}
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
