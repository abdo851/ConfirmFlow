import "server-only";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { createUserDatabaseClient } from "@/lib/database/user-client";
import { collectOrderProducts, type OrderProductOption } from "./products";
import type { OrderProvider } from "./types";

const BATCH = 500;
const CAP = 5000;

interface ProductRow {
  owner_id: string;
  provider: string | null;
  line_items: unknown;
}

interface ProductFilter {
  eq: (column: string, value: string) => ProductFilter;
  range: (from: number, to: number) => Promise<{
    data: ProductRow[] | null;
    error: { message: string } | null;
  }>;
}

interface ProductDb {
  from: (table: "orders") => {
    select: (columns: string) => ProductFilter;
  };
}

export async function getOrderProductsForAuthenticatedUser(input: {
  provider?: OrderProvider | null;
}): Promise<OrderProductOption[]> {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    return [];
  }

  const db = (await createUserDatabaseClient()) as unknown as ProductDb;
  const rows: Array<{ provider: string | null; lineItems: unknown }> = [];
  let offset = 0;

  while (offset < CAP) {
    let query = db
      .from("orders")
      .select("owner_id, provider, line_items")
      .eq("owner_id", user.id);
    if (input.provider) {
      query = query.eq("provider", input.provider);
    }
    const { data, error } = await query.range(offset, offset + BATCH - 1);
    if (error) {
      throw new Error("Unable to load products.");
    }
    const batch = data ?? [];
    let dropped = 0;
    for (const row of batch) {
      if (row.owner_id !== user.id) {
        dropped += 1;
        continue;
      }
      rows.push({ provider: row.provider, lineItems: row.line_items });
    }
    if (dropped > 0) {
      console.warn("order_products_dropped_foreign_rows", { dropped });
    }
    if (batch.length < BATCH) {
      break;
    }
    offset += BATCH;
  }

  return collectOrderProducts(rows);
}
