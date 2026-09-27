import type { OrderLineItem, OrderProvider } from "./types";

export interface OrderProductOption {
  key: string;
  name: string;
  sku: string | null;
  imageUrl: string | null;
  provider: OrderProvider | null;
}

export function safeProductImageUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2000 || !/^https?:\/\/[^\s"'<>]+$/i.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function imageFromRecord(value: unknown): string | null {
  const direct = safeProductImageUrl(value);
  if (direct) {
    return direct;
  }
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  return (
    safeProductImageUrl(record.src) ??
    safeProductImageUrl(record.url) ??
    imageFromRecord(record.thumbnail) ??
    imageFromRecord(record.image)
  );
}

export function readStoredLineItem(value: unknown): OrderLineItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (!name) {
    return null;
  }
  const sku = typeof record.sku === "string" && record.sku.trim() ? record.sku.trim() : null;
  const quantity = typeof record.quantity === "number" ? record.quantity : null;
  const productId =
    typeof record.productId === "string" && record.productId.trim()
      ? record.productId.trim()
      : record.product_id !== undefined && record.product_id !== null
        ? String(record.product_id)
        : null;
  return {
    name,
    sku,
    quantity,
    imageUrl: imageFromRecord(record.imageUrl) ?? imageFromRecord(record.image),
    productId,
  };
}

export function productKey(provider: OrderProvider | null, name: string, sku: string | null): string {
  return `${provider ?? "unknown"}\n${name}\n${sku ?? ""}`;
}

export function collectOrderProducts(
  rows: Array<{ provider: string | null; lineItems: unknown }>,
): OrderProductOption[] {
  const grouped = new Map<string, OrderProductOption>();

  for (const row of rows) {
    const provider =
      row.provider === "woocommerce" || row.provider === "youcan" || row.provider === "shopify"
        ? row.provider
        : null;
    const items = Array.isArray(row.lineItems) ? row.lineItems : [];
    for (const raw of items) {
      const item = readStoredLineItem(raw);
      if (!item?.name) {
        continue;
      }
      const key = productKey(provider, item.name, item.sku ?? null);
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, {
          key,
          name: item.name,
          sku: item.sku ?? null,
          imageUrl: item.imageUrl ?? null,
          provider,
        });
        continue;
      }
      if (!existing.imageUrl && item.imageUrl) {
        existing.imageUrl = item.imageUrl;
      }
    }
  }

  return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name));
}
