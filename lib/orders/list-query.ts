import type { OrderConfirmationStatus, OrderProvider } from "./types";

export const ORDERS_PAGE_SIZE = 20;

export const ORDER_STORES = ["woocommerce", "youcan"] as const;
export type OrderStoreFilter = (typeof ORDER_STORES)[number];

export const ORDER_TABS = ["all", "new", "confirmed", "rejected", "archived"] as const;
export type OrderTab = (typeof ORDER_TABS)[number];

export const DATE_PRESETS = ["today", "yesterday", "last7", "last30", "month", "custom"] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

export interface ResolvedOrdersListQuery {
  store: "all" | OrderStoreFilter;
  tab: OrderTab;
  provider: OrderProvider | null;
  status: OrderConfirmationStatus | null;
  preset: DatePreset | null;
  from: string | null;
  to: string | null;
  fromDay: string | null;
  toDay: string | null;
  productName: string | null;
  productSku: string | null;
  page: number;
}

function cleanLabel(value: string | null, max = 200): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) {
    return null;
  }
  return trimmed;
}

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

export function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDay(value: string | null): Date | null {
  if (!value) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function tabToStatus(tab: OrderTab): OrderConfirmationStatus | null {
  if (tab === "new") {
    return "pending";
  }
  if (tab === "all") {
    return null;
  }
  return tab;
}

export function presetRange(
  preset: Exclude<DatePreset, "custom">,
  now: Date,
): { from: string; to: string } {
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (preset === "today") {
    return { from: todayStart.toISOString(), to: todayEnd.toISOString() };
  }

  if (preset === "yesterday") {
    const day = new Date(todayStart);
    day.setDate(day.getDate() - 1);
    return { from: startOfDay(day).toISOString(), to: endOfDay(day).toISOString() };
  }

  if (preset === "last7") {
    const day = new Date(todayStart);
    day.setDate(day.getDate() - 6);
    return { from: startOfDay(day).toISOString(), to: todayEnd.toISOString() };
  }

  if (preset === "last30") {
    const day = new Date(todayStart);
    day.setDate(day.getDate() - 29);
    return { from: startOfDay(day).toISOString(), to: todayEnd.toISOString() };
  }

  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
  const monthEnd = new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 0);
  return { from: startOfDay(monthStart).toISOString(), to: endOfDay(monthEnd).toISOString() };
}

/**
 * Reads store, status, and date filters from the URL.
 * Account ids in the query string are ignored. The orders query uses the session user only.
 */
export function parseOrdersListSearchParams(
  search: Record<string, string | string[] | undefined>,
  now = new Date(),
): ResolvedOrdersListQuery {
  const storeRaw = firstParam(search.store);
  const store: ResolvedOrdersListQuery["store"] =
    storeRaw === "woocommerce" || storeRaw === "youcan" ? storeRaw : "all";

  const tabRaw = firstParam(search.status);
  const tab: OrderTab = (ORDER_TABS as readonly string[]).includes(tabRaw ?? "")
    ? (tabRaw as OrderTab)
    : "all";

  const presetRaw = firstParam(search.preset);
  const requestedPreset: DatePreset | null = (DATE_PRESETS as readonly string[]).includes(presetRaw ?? "")
    ? (presetRaw as DatePreset)
    : null;

  let from: string | null = null;
  let to: string | null = null;
  let fromDay: string | null = null;
  let toDay: string | null = null;
  let preset = requestedPreset;

  if (requestedPreset === "custom") {
    const start = parseDay(firstParam(search.from));
    const end = parseDay(firstParam(search.to));
    if (start && end) {
      const [earlier, later] = start.getTime() <= end.getTime() ? [start, end] : [end, start];
      from = startOfDay(earlier).toISOString();
      to = endOfDay(later).toISOString();
      fromDay = dayKey(earlier);
      toDay = dayKey(later);
    } else {
      preset = null;
    }
  } else if (requestedPreset) {
    const range = presetRange(requestedPreset, now);
    from = range.from;
    to = range.to;
  }

  const pageRaw = Number(firstParam(search.page));
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  const productName = cleanLabel(firstParam(search.product));
  const productSku = productName ? cleanLabel(firstParam(search.sku)) : null;

  return {
    store,
    tab,
    provider: store === "all" ? null : store,
    status: tabToStatus(tab),
    preset,
    from,
    to,
    fromDay,
    toDay,
    productName,
    productSku,
    page,
  };
}

export function ordersQueryHasFilters(query: ResolvedOrdersListQuery): boolean {
  return query.store !== "all" || query.tab !== "all" || query.from !== null || query.productName !== null;
}

export function formatDateRangeLabel(from: string, to: string, locale: string): string {
  const start = new Date(from);
  const end = new Date(to);
  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  }).format(start);
  const endLabel = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(end);
  return `${startLabel} – ${endLabel}`;
}

export function ordersListHref(
  current: Pick<
    ResolvedOrdersListQuery,
    "store" | "tab" | "preset" | "fromDay" | "toDay" | "productName" | "productSku"
  >,
  patch: {
    store?: ResolvedOrdersListQuery["store"];
    tab?: OrderTab;
    preset?: DatePreset | null;
    fromDay?: string | null;
    toDay?: string | null;
    productName?: string | null;
    productSku?: string | null;
    page?: number;
  } = {},
): string {
  const store = patch.store ?? current.store;
  const tab = patch.tab ?? current.tab;
  const preset = patch.preset === undefined ? current.preset : patch.preset;
  const fromDay = patch.fromDay === undefined ? current.fromDay : patch.fromDay;
  const toDay = patch.toDay === undefined ? current.toDay : patch.toDay;
  const storeChanged = store !== current.store;
  const productName = storeChanged
    ? patch.productName === undefined
      ? null
      : patch.productName
    : patch.productName === undefined
      ? current.productName
      : patch.productName;
  const productSku = storeChanged
    ? patch.productSku === undefined
      ? null
      : patch.productSku
    : patch.productSku === undefined
      ? current.productSku
      : patch.productSku;
  const page = patch.page ?? 1;

  const params = new URLSearchParams();
  if (store !== "all") {
    params.set("store", store);
  }
  if (tab !== "all") {
    params.set("status", tab);
  }
  if (preset && preset !== "custom") {
    params.set("preset", preset);
  } else if (preset === "custom" && fromDay && toDay) {
    params.set("preset", "custom");
    params.set("from", fromDay);
    params.set("to", toDay);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  if (productName) {
    params.set("product", productName);
  }
  if (productName && productSku) {
    params.set("sku", productSku);
  }

  const qs = params.toString();
  return qs ? `/dashboard/orders?${qs}` : "/dashboard/orders";
}
