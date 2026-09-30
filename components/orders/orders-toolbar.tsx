"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { ProductFilter } from "./product-filter";
import type { OrderProductOption } from "@/lib/orders/products";
import {
  dayKey,
  formatDateRangeLabel,
  ordersListHref,
  type DatePreset,
  type ResolvedOrdersListQuery,
} from "@/lib/orders/list-query";

const PRESET_LINKS: Array<Exclude<DatePreset, "custom">> = [
  "today",
  "yesterday",
  "last7",
  "last30",
  "month",
];

const STORE_TABS = [
  { id: "all", logo: null },
  { id: "woocommerce", logo: "/brands/woocommerce.svg" },
  { id: "youcan", logo: "/brands/youcan.svg" },
] as const;

function monthCells(cursor: Date): Array<Date | null> {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < first.getDay(); i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

function weekdayLabels(locale: string): string[] {
  const sunday = new Date(2026, 0, 4);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + index);
    return new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(date);
  });
}

export function OrdersToolbar({
  query,
  products,
}: {
  query: ResolvedOrdersListQuery;
  products: OrderProductOption[];
}) {
  const t = useTranslations("orders");
  const locale = useLocale();
  const router = useRouter();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const [cursor, setCursor] = useState(() => new Date());
  const [start, setStart] = useState<string | null>(query.fromDay);
  const [end, setEnd] = useState<string | null>(query.toDay);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const rangeLabel =
    query.from && query.to ? formatDateRangeLabel(query.from, query.to, locale) : t("dates.label");
  const today = dayKey(new Date());
  const cells = monthCells(cursor);
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(cursor);

  function openPicker() {
    const rect = rootRef.current?.getBoundingClientRect();
    const spaceBelow = rect ? window.innerHeight - rect.bottom : 999;
    setAbove(spaceBelow < 420);
    const seed = query.fromDay ?? dayKey(new Date());
    const [year, month] = seed.split("-").map(Number);
    setCursor(new Date(year, (month ?? 1) - 1, 1));
    setStart(query.fromDay);
    setEnd(query.toDay);
    setOpen((current) => !current);
  }

  function pickDay(day: string) {
    if (!start || end) {
      setStart(day);
      setEnd(null);
      return;
    }
    if (day < start) {
      setEnd(start);
      setStart(day);
      return;
    }
    setEnd(day);
  }

  function applyCustom() {
    if (!start) {
      return;
    }
    router.push(
      ordersListHref(query, {
        preset: "custom",
        fromDay: start,
        toDay: end ?? start,
        page: 1,
      }),
    );
    setOpen(false);
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={t("stores.label")}>
          {STORE_TABS.map((store) => {
            const active = query.store === store.id;
            return (
              <Link
                key={store.id}
                href={ordersListHref(query, { store: store.id, page: 1 })}
                role="tab"
                aria-selected={active}
                className={`pressable inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors duration-200 ${
                  active ? "tab-active" : "border border-line bg-surface-muted/60 text-foreground"
                }`}
              >
                {store.logo ? (
                  <span
                    aria-hidden
                    className="size-4 shrink-0 bg-contain bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${store.logo})` }}
                  />
                ) : null}
                {t(`stores.${store.id}`)}
              </Link>
            );
          })}
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex min-h-11 shrink-0 cursor-not-allowed items-center gap-2 rounded-xl border border-dashed border-line bg-surface px-3 text-sm font-medium text-muted"
          >
            <span
              aria-hidden
              className="size-4 shrink-0 bg-contain bg-center bg-no-repeat opacity-70"
              style={{ backgroundImage: "url(/brands/shopify.svg)" }}
            />
            {t("stores.shopify")}
            <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
              {t("stores.comingSoon")}
            </span>
          </button>
        </div>

        <div ref={rootRef} className="relative flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="pressable inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface-muted/60 px-3 text-sm font-medium transition-colors duration-200"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={openPicker}
          >
            <svg viewBox="0 0 20 20" className="size-4 text-muted" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="4" width="14" height="13" rx="2" />
              <path d="M3 8h14M7 2.5V5M13 2.5V5" strokeLinecap="round" />
            </svg>
            <span>{rangeLabel}</span>
          </button>
          <ProductFilter query={query} products={products} />
          {query.from ? (
            <Link
              href={ordersListHref(query, { preset: null, fromDay: null, toDay: null, page: 1 })}
              className="pressable inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-muted underline-offset-4 hover:underline"
            >
              {t("dates.clear")}
            </Link>
          ) : null}

          {open ? (
            <div
              id={menuId}
              className={`absolute inset-inline-end-0 z-30 w-[min(100vw-2rem,20rem)] rounded-2xl border border-line bg-surface p-3 shadow-medium ${
                above ? "bottom-full mb-2 orders-pop-above" : "top-full mt-2 orders-pop-below"
              }`}
            >
              <div className="grid gap-1">
                {PRESET_LINKS.map((preset) => (
                  <Link
                    key={preset}
                    href={ordersListHref(query, { preset, fromDay: null, toDay: null, page: 1 })}
                    className={`rounded-lg px-3 py-2 text-start text-sm transition-colors duration-150 hover:bg-surface-muted ${
                      query.preset === preset ? "bg-primary/10 font-medium text-primary" : ""
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {t(`dates.${preset}`)}
                  </Link>
                ))}
              </div>

              <div className="mt-3 border-t border-line pt-3">
                <p className="px-1 text-xs font-medium text-muted">{t("dates.custom")}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    className="pressable inline-flex size-9 items-center justify-center rounded-lg border border-line"
                    aria-label={t("dates.previousMonth")}
                    onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                  >
                    <svg viewBox="0 0 20 20" className="size-4 rtl:rotate-180" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 5 7 10l5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <p className="text-sm font-medium">{monthLabel}</p>
                  <button
                    type="button"
                    className="pressable inline-flex size-9 items-center justify-center rounded-lg border border-line"
                    aria-label={t("dates.nextMonth")}
                    onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                  >
                    <svg viewBox="0 0 20 20" className="size-4 rtl:rotate-180" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
                  {weekdayLabels(locale).map((label, index) => (
                    <span key={`${label}-${index}`}>{label}</span>
                  ))}
                </div>
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {cells.map((date, index) => {
                    if (!date) {
                      return <span key={`empty-${index}`} />;
                    }
                    const key = dayKey(date);
                    const inRange = Boolean(start && end && key >= start && key <= end);
                    const endpoint = key === start || key === end;
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`h-9 rounded-lg text-sm transition-colors duration-150 ${
                          endpoint
                            ? "bg-primary font-medium text-primary-foreground"
                            : inRange
                              ? "bg-primary/15 text-foreground"
                              : "hover:bg-surface-muted"
                        } ${key === today && !endpoint ? "ring-1 ring-primary/40" : ""}`}
                        onClick={() => pickDay(key)}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="pressable mt-3 min-h-10 w-full rounded-xl bg-primary text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!start}
                  onClick={applyCustom}
                >
                  {t("dates.apply")}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
