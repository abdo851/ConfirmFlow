"use client";

import { useEffect, useId, useRef, useState } from "react";
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
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
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
      const rtl = document.documentElement.dir === "rtl";
      const rawLeft = rtl ? rect.left : rect.right - width;
      const left = Math.min(Math.max(margin, rawLeft), window.innerWidth - width - margin);
      const top = rect.bottom + margin;
      setMenuStyle({ top, left });
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

    place();
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", place);
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
        return;
      }
      if (key === "rejected") {
        await rejectOrderAction(orderId);
      }
      if (key === "archived") {
        await archiveOrderAction(orderId);
      }
      router.refresh();
      setOpen(false);
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
          className="fixed z-[80] w-56 rounded-2xl border border-line bg-surface p-1 shadow-large"
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
    </div>
  );
}
