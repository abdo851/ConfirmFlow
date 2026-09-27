"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ORDERS_PAGE_SIZE, ordersListHref, type ResolvedOrdersListQuery } from "@/lib/orders/list-query";

function pageItems(page: number, pageCount: number): Array<number | "gap"> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const items: Array<number | "gap"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) {
    items.push("gap");
  }
  for (let value = start; value <= end; value += 1) {
    items.push(value);
  }
  if (end < pageCount - 1) {
    items.push("gap");
  }
  items.push(pageCount);
  return items;
}

export function OrdersPagination({
  query,
  total,
  page,
}: {
  query: ResolvedOrdersListQuery;
  total: number;
  page: number;
}) {
  const t = useTranslations("orders");
  const pageCount = Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE));
  const fromIndex = (page - 1) * ORDERS_PAGE_SIZE;
  const from = total === 0 || fromIndex >= total ? 0 : fromIndex + 1;
  const to = total === 0 || fromIndex >= total ? 0 : Math.min(page * ORDERS_PAGE_SIZE, total);
  const items = pageItems(Math.min(page, pageCount), pageCount);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted" aria-live="polite">
        {t("pagination.showing", { from, to, total })}
      </p>
      <nav className="flex flex-wrap items-center gap-1" aria-label={t("pagination.label")}>
        {page <= 1 ? (
          <span className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm text-muted/60">
            {t("pagination.previous")}
          </span>
        ) : (
          <Link
            href={ordersListHref(query, { page: page - 1 })}
            className="pressable inline-flex min-h-10 items-center rounded-xl border border-line px-3 text-sm font-medium transition-colors duration-200 hover:bg-surface-muted"
          >
            {t("pagination.previous")}
          </Link>
        )}
        {items.map((item, index) =>
          item === "gap" ? (
            <span key={`gap-${index}`} className="px-1 text-sm text-muted">
              …
            </span>
          ) : (
            <Link
              key={item}
              href={ordersListHref(query, { page: item })}
              aria-current={item === page ? "page" : undefined}
              className={`inline-flex size-10 items-center justify-center rounded-xl text-sm font-medium transition-colors duration-200 ${
                item === page ? "tab-active" : "border border-line hover:bg-surface-muted"
              }`}
            >
              {item}
            </Link>
          ),
        )}
        {page >= pageCount ? (
          <span className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm text-muted/60">
            {t("pagination.next")}
          </span>
        ) : (
          <Link
            href={ordersListHref(query, { page: page + 1 })}
            className="pressable inline-flex min-h-10 items-center rounded-xl border border-line px-3 text-sm font-medium transition-colors duration-200 hover:bg-surface-muted"
          >
            {t("pagination.next")}
          </Link>
        )}
      </nav>
    </div>
  );
}
