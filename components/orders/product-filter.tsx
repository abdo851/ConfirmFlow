"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { ordersListHref, type ResolvedOrdersListQuery } from "@/lib/orders/list-query";
import type { OrderProductOption } from "@/lib/orders/products";

const ROW_HEIGHT = 56;
const VIEWPORT = 320;

export function ProductFilter({
  query,
  products,
}: {
  query: ResolvedOrdersListQuery;
  products: OrderProductOption[];
}) {
  const t = useTranslations("orders");
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const [search, setSearch] = useState("");
  const [scrollTop, setScrollTop] = useState(0);

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    if (!needle) {
      return products;
    }
    return products.filter((product) => {
      const haystack = `${product.name} ${product.sku ?? ""}`.toLocaleLowerCase();
      return haystack.includes(needle);
    });
  }, [products, search]);

  const virtual = filtered.length > 100;
  const start = virtual ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 2) : 0;
  const visibleCount = Math.ceil(VIEWPORT / ROW_HEIGHT) + 4;
  const end = virtual ? Math.min(filtered.length, start + visibleCount) : filtered.length;
  const visible = filtered.slice(start, end);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    const rect = rootRef.current?.getBoundingClientRect();
    const spaceBelow = rect ? window.innerHeight - rect.bottom : VIEWPORT;
    setAbove(spaceBelow < VIEWPORT + 16);
    setOpen((current) => !current);
    setSearch("");
    setScrollTop(0);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="pressable inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border border-line bg-surface-muted/60 px-3 text-sm font-medium transition-colors duration-200"
        aria-expanded={open}
        onClick={toggle}
      >
        <span className="truncate">{query.productName ?? t("products.label")}</span>
      </button>
      {query.productName ? (
        <Link
          href={ordersListHref(query, { productName: null, productSku: null, page: 1 })}
          className="ms-2 inline-flex min-h-11 items-center rounded-xl bg-primary/10 px-3 text-sm font-medium text-primary"
        >
          <span className="max-w-40 truncate">{query.productName}</span>
          <span className="ms-2 text-xs">{t("products.clear")}</span>
        </Link>
      ) : null}
      {open ? (
        <div
          className={`absolute inset-inline-end-0 z-30 w-[min(100vw-2rem,22rem)] rounded-2xl border border-line bg-surface p-2 shadow-medium ${
            above ? "bottom-full mb-2 orders-pop-above" : "top-full mt-2 orders-pop-below"
          }`}
        >
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setScrollTop(0);
            }}
            placeholder={t("products.search")}
            className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            autoFocus
          />
          {filtered.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted">{t("products.empty")}</p>
          ) : (
            <div
              className="mt-2 overflow-auto"
              style={{ maxHeight: VIEWPORT }}
              onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
            >
              <div style={{ height: virtual ? filtered.length * ROW_HEIGHT : undefined, position: "relative" }}>
                <div style={virtual ? { position: "absolute", top: start * ROW_HEIGHT, left: 0, right: 0 } : undefined}>
                  {visible.map((product) => (
                    <button
                      key={product.key}
                      type="button"
                      className="flex min-h-14 w-full items-center gap-3 rounded-xl px-2 text-start transition-colors duration-150 hover:bg-surface-muted"
                      onClick={() => {
                        router.push(
                          ordersListHref(query, {
                            productName: product.name,
                            productSku: product.sku,
                            page: 1,
                          }),
                        );
                        setOpen(false);
                      }}
                    >
                      <ProductThumb name={product.name} imageUrl={product.imageUrl} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{product.name}</span>
                        {product.sku ? (
                          <span className="block truncate text-xs text-muted">{product.sku}</span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ProductThumb({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  if (imageUrl) {
    return (
      <span
        aria-hidden
        className="size-10 shrink-0 rounded-lg bg-surface-muted bg-cover bg-center"
        style={{ backgroundImage: `url("${imageUrl}")` }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-sm font-semibold text-muted"
    >
      {name.slice(0, 1).toLocaleUpperCase()}
    </span>
  );
}
