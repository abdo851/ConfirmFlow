import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getWooCommerceConnectionStateForUser,
  persistWooCommerceConnectionForUser,
} from "@/lib/integrations/woocommerce/persistence";

process.env.WOOCOMMERCE_SESSION_SECRET =
  "woocommerce-session-secret-with-minimum-length-123456";
process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";

type Row = Record<string, unknown>;

function createMemoryDb() {
  const tables = new Map<string, Row[]>();
  let sequence = 0;

  function tableRows(table: string) {
    const existing = tables.get(table);
    if (existing) {
      return existing;
    }
    const created: Row[] = [];
    tables.set(table, created);
    return created;
  }

  function from(table: string) {
    const filters: Array<(row: Row) => boolean> = [];
    let pending: Row | null = null;

    const execute = async () => {
      if (pending) {
        const row = {
          ...pending,
          id:
            pending.id ??
            (table === "stores" || table === "store_connections"
              ? `${table}-${++sequence}`
              : undefined),
          updated_at: new Date().toISOString(),
        };
        tableRows(table).push(row);
        pending = null;
        return { data: [row], error: null };
      }

      return {
        data: tableRows(table).filter((row) => filters.every((filter) => filter(row))),
        error: null,
      };
    };

    const builder = {
      select() {
        return builder;
      },
      eq(column: string, value: unknown) {
        filters.push((row) => row[column] === value);
        return builder;
      },
      in(column: string, values: unknown[]) {
        filters.push((row) => values.includes(row[column]));
        return builder;
      },
      upsert(payload: Row) {
        pending = { ...payload };
        return builder;
      },
      async maybeSingle() {
        const result = await execute();
        return { data: result.data[0] ?? null, error: null };
      },
      async single() {
        const result = await execute();
        const row = result.data[0] ?? null;
        return { data: row, error: row ? null : { message: "missing" } };
      },
      then(
        resolve: (value: { data: Row[] | null; error: null }) => void,
        reject?: (reason: unknown) => void,
      ) {
        return execute().then(resolve, reject);
      },
    };

    return builder;
  }

  return { from } as unknown as SupabaseClient;
}

describe("WooCommerce persistence round trip", () => {
  it("writes a connection and reads it back for the same user", async () => {
    const db = createMemoryDb();
    const userId = "61540ece-1244-4cf4-823a-7992af8c3420";

    const saved = await persistWooCommerceConnectionForUser(
      {
        userId,
        userEmail: "test@confirma.local",
        storeUrl: "https://ancientcoach.s2-tastewp.com",
        consumerKey: "ck_test",
        consumerSecret: "cs_test",
        scope: "read_write",
      },
      db,
    );

    expect(saved.storeId).toBeTruthy();

    const status = await getWooCommerceConnectionStateForUser(userId, db);

    expect(status.connected).toBe(true);
    expect(status.store_url).toBe("https://ancientcoach.s2-tastewp.com");
    expect(status.status).toBe("connected");
  });
});
