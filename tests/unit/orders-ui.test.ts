import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  applyOrderConfirmation,
  confirmOrderRequest,
  getOrderStatusBadgeVariant,
  isConfirmButtonDisabled,
  mapConfirmOrderResponse,
  shouldShowConfirmButton,
} from "@/lib/orders/confirm-client";
import {
  formatMoneyMinor,
  formatOrderCustomerContact,
  formatOrderDisplayIdentifier,
} from "@/lib/orders/format";
import { getOrdersForAuthenticatedUser } from "@/lib/orders/get-orders-for-user";
import {
  formatDateRangeLabel,
  ordersListHref,
  parseOrdersListSearchParams,
} from "@/lib/orders/list-query";
import { collectOrderProducts, safeProductImageUrl } from "@/lib/orders/products";

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/database/user-client", () => ({
  createUserDatabaseClient: vi.fn(),
}));

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, nested]) =>
    flattenKeys(nested, prefix ? `${prefix}.${key}` : key),
  );
}

describe("orders UI helpers", () => {
  it("shows confirm action only for pending orders", () => {
    expect(shouldShowConfirmButton("pending")).toBe(true);
    expect(shouldShowConfirmButton("confirmed")).toBe(false);
  });

  it("maps pending and confirmed statuses to badge variants", () => {
    expect(getOrderStatusBadgeVariant("pending")).toBe("warning");
    expect(getOrderStatusBadgeVariant("confirmed")).toBe("default");
  });

  it("disables confirm buttons while a request is in flight", () => {
    expect(isConfirmButtonDisabled(null)).toBe(false);
    expect(isConfirmButtonDisabled("order_1")).toBe(true);
  });

  it("updates local order state after successful confirmation", () => {
    const orders = [
      {
        id: "order_1",
        orderNumber: "1001",
        externalOrderId: "450789469",
        provider: "woocommerce" as const,
        customerEmail: "customer@example.com",
        customerPhone: null,
        currency: "MAD",
        totalAmountMinor: 22900,
        confirmationStatus: "pending" as const,
        confirmedAt: null,
        receivedAt: "2024-06-01T12:00:00.000Z",
      },
    ];

    expect(
      applyOrderConfirmation(orders, "order_1", "2024-06-02T10:00:00.000Z"),
    ).toEqual([
      {
        ...orders[0],
        confirmationStatus: "confirmed",
        confirmedAt: "2024-06-02T10:00:00.000Z",
      },
    ]);
  });

  it("maps confirm API responses for success and error states", () => {
    expect(
      mapConfirmOrderResponse(200, {
        status: "confirmed",
        confirmedAt: "2024-06-02T10:00:00.000Z",
      }),
    ).toEqual({
      ok: true,
      status: "confirmed",
      confirmedAt: "2024-06-02T10:00:00.000Z",
    });

    expect(
      mapConfirmOrderResponse(200, {
        status: "already_confirmed",
        confirmedAt: "2024-06-02T10:00:00.000Z",
      }),
    ).toEqual({
      ok: true,
      status: "already_confirmed",
      confirmedAt: "2024-06-02T10:00:00.000Z",
    });

    expect(mapConfirmOrderResponse(401, {})).toEqual({
      ok: false,
      errorKey: "unauthorized",
    });
    expect(mapConfirmOrderResponse(403, {})).toEqual({
      ok: false,
      errorKey: "forbidden",
    });
    expect(mapConfirmOrderResponse(404, {})).toEqual({
      ok: false,
      errorKey: "notFound",
    });
    expect(mapConfirmOrderResponse(409, {})).toEqual({
      ok: false,
      errorKey: "invalidState",
    });
    expect(mapConfirmOrderResponse(500, {})).toEqual({
      ok: false,
      errorKey: "unexpected",
    });
  });

  it("calls the correct confirmation endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({
        status: "confirmed",
        confirmedAt: "2024-06-02T10:00:00.000Z",
      }),
    });

    const result = await confirmOrderRequest(
      "11111111-1111-1111-1111-111111111111",
      fetchMock,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/orders/11111111-1111-1111-1111-111111111111/confirm",
      { method: "POST" },
    );
    expect(result.ok).toBe(true);
  });

  it("formats order display fields for the list UI", () => {
    expect(
      formatOrderDisplayIdentifier({
        orderNumber: "1001",
        externalOrderId: "450789469",
      }),
    ).toBe("#1001");
    expect(
      formatOrderCustomerContact({
        customerEmail: "customer@example.com",
        customerPhone: null,
      }),
    ).toBe("customer@example.com");
    expect(formatMoneyMinor(22900, "MAD")).toContain("229");
  });
});

describe("dashboard orders page", () => {
  it("redirects unauthenticated users to login", async () => {
    const redirect = vi.fn(() => {
      throw new Error("redirect");
    });

    vi.doMock("@/i18n/navigation", () => ({ redirect }));
    vi.doMock("@/lib/orders/get-orders-for-user", () => ({
      getOrdersForAuthenticatedUser: vi.fn().mockResolvedValue(null),
    }));
    vi.doMock("next-intl/server", () => ({
      getTranslations: vi.fn().mockResolvedValue((key: string) => key),
    }));
    vi.doMock("@/components/orders", () => ({
      OrdersList: () => null,
    }));

    const page = await import("@/app/[locale]/dashboard/orders/page");

    await expect(
      page.default({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("redirect");

    expect(redirect).toHaveBeenCalledWith({ href: "/login", locale: "en" });

    vi.resetModules();
  }, 15000);
});

describe("orders page data retrieval", () => {
  it("returns null for unauthenticated users", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth/session");
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

    const result = await getOrdersForAuthenticatedUser();
    expect(result).toBeNull();
  });

  it("loads orders for the authenticated user via RLS-backed client", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth/session");
    const { createUserDatabaseClient } = await import(
      "@/lib/database/user-client"
    );

    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      id: "user_1",
    } as never);

    const calls: Array<{ method: string; args: unknown[] }> = [];
    const filter = () => {
      const api = {
        eq: (...args: unknown[]) => {
          calls.push({ method: "eq", args });
          return api;
        },
        gte: (...args: unknown[]) => {
          calls.push({ method: "gte", args });
          return api;
        },
        lte: (...args: unknown[]) => {
          calls.push({ method: "lte", args });
          return api;
        },
        order: (...args: unknown[]) => {
          calls.push({ method: "order", args });
          return api;
        },
        range: async (...args: unknown[]) => {
          calls.push({ method: "range", args });
          return {
            data: [
              {
                id: "order_1",
                owner_id: "user_1",
                provider: "woocommerce",
                order_number: "1001",
                external_order_id: "450789469",
                customer_email: "customer@example.com",
                customer_phone: null,
                currency: "MAD",
                total_amount_minor: 22900,
                confirmation_status: "pending",
                confirmed_at: null,
                received_at: "2024-06-01T12:00:00.000Z",
              },
            ],
            error: null,
            count: 1,
          };
        },
      };
      return api;
    };

    vi.mocked(createUserDatabaseClient).mockResolvedValue({
      from: () => ({
        select: () => filter(),
      }),
    } as never);

    const result = await getOrdersForAuthenticatedUser();

    expect(result?.orders).toHaveLength(1);
    expect(result?.orders[0]?.confirmationStatus).toBe("pending");
    expect(result?.pageSize).toBe(20);
    expect(calls).toContainEqual({ method: "eq", args: ["owner_id", "user_1"] });
    expect(calls).toContainEqual({
      method: "order",
      args: ["received_at", { ascending: false }],
    });
    expect(calls).toContainEqual({ method: "range", args: [0, 19] });
  });

  it("drops rows that do not belong to the signed-in account", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth/session");
    const { createUserDatabaseClient } = await import("@/lib/database/user-client");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      id: "user_1",
    } as never);

    const filter = () => {
      const api = {
        eq: () => api,
        gte: () => api,
        lte: () => api,
        order: () => api,
        range: async () => ({
          data: [
            {
              id: "order_1",
              owner_id: "user_1",
              provider: "youcan",
              order_number: "1001",
              external_order_id: "450789469",
              customer_email: "owner@example.com",
              customer_phone: null,
              currency: "MAD",
              total_amount_minor: 1000,
              confirmation_status: "pending",
              confirmed_at: null,
              received_at: "2024-06-01T12:00:00.000Z",
            },
            {
              id: "order_2",
              owner_id: "other_user",
              provider: "woocommerce",
              order_number: "1002",
              external_order_id: "999",
              customer_email: "other@example.com",
              customer_phone: null,
              currency: "MAD",
              total_amount_minor: 2000,
              confirmation_status: "pending",
              confirmed_at: null,
              received_at: "2024-06-02T12:00:00.000Z",
            },
          ],
          error: null,
          count: 2,
        }),
      };
      return api;
    };

    vi.mocked(createUserDatabaseClient).mockResolvedValue({
      from: () => ({
        select: () => filter(),
      }),
    } as never);

    const result = await getOrdersForAuthenticatedUser();

    expect(result?.orders).toHaveLength(1);
    expect(result?.orders[0]?.id).toBe("order_1");
    expect(result?.total).toBe(1);
    expect(warn).toHaveBeenCalledWith("orders_list_dropped_foreign_rows", { dropped: 1 });
    warn.mockRestore();
  });
});

describe("orders list filters", () => {
  const now = new Date(2026, 8, 27, 15, 30, 0);

  it("ignores account ids in the query string and keeps store plus status", () => {
    const query = parseOrdersListSearchParams(
      {
        owner_id: "someone-else",
        store_id: "store-2",
        store: "youcan",
        status: "new",
        page: "2",
      },
      now,
    );

    expect(query.provider).toBe("youcan");
    expect(query.status).toBe("pending");
    expect(query.page).toBe(2);
    expect("ownerId" in query).toBe(false);
    expect(query.store).not.toBe("someone-else");
  });

  it("keeps Shopify as a disabled filter instead of a live store", () => {
    expect(parseOrdersListSearchParams({ store: "shopify" }, now).store).toBe("all");
  });

  it("resolves date presets and custom ranges", () => {
    const today = parseOrdersListSearchParams({ preset: "today" }, now);
    expect(new Date(today.from ?? "").getDate()).toBe(27);
    expect(new Date(today.to ?? "").getDate()).toBe(27);

    const last7 = parseOrdersListSearchParams({ preset: "last7" }, now);
    expect(new Date(last7.from ?? "").getDate()).toBe(21);

    const month = parseOrdersListSearchParams({ preset: "month" }, now);
    expect(new Date(month.from ?? "").getDate()).toBe(1);
    expect(new Date(month.to ?? "").getDate()).toBe(30);

    const custom = parseOrdersListSearchParams(
      { preset: "custom", from: "2026-09-27", to: "2026-09-20" },
      now,
    );
    expect(custom.fromDay).toBe("2026-09-20");
    expect(custom.toDay).toBe("2026-09-27");
    expect(formatDateRangeLabel(custom.from ?? "", custom.to ?? "", "en-US")).toContain("2026");
    expect(ordersListHref(custom, { page: 2 })).toContain("preset=custom");
    expect(ordersListHref(custom, { store: "all", tab: "all", preset: null, page: 1 })).toBe(
      "/dashboard/orders",
    );
  });

  it("keeps a product filter with the store tab and drops unsafe image urls", () => {
    const query = parseOrdersListSearchParams(
      { store: "woocommerce", product: "Blue shirt", sku: "SKU-1" },
      now,
    );
    expect(query.productName).toBe("Blue shirt");
    expect(query.productSku).toBe("SKU-1");
    expect(query.provider).toBe("woocommerce");
    expect(ordersListHref(query, { page: 1 })).toContain("product=");
    expect(ordersListHref(query, { page: 1 })).toContain("sku=SKU-1");
    expect(ordersListHref(query, { store: "youcan", page: 1 })).not.toContain("product=");

    const products = collectOrderProducts([
      {
        provider: "woocommerce",
        lineItems: [
          { name: "Blue shirt", sku: "SKU-1", imageUrl: "https://cdn.example.com/shirt.jpg" },
          { name: "Blue shirt", sku: "SKU-1", imageUrl: "javascript:alert(1)" },
        ],
      },
      {
        provider: "youcan",
        lineItems: [{ name: "Blue shirt", sku: "SKU-1", image: "https://cdn.example.com/youcan.jpg" }],
      },
    ]);
    expect(products).toHaveLength(2);
    expect(products[0]?.imageUrl).toBe("https://cdn.example.com/shirt.jpg");
    expect(safeProductImageUrl("javascript:alert(1)")).toBeNull();
  });
});

describe("orders empty state", () => {
  it("uses localized empty-state copy", () => {
    const en = JSON.parse(
      readFileSync(join(process.cwd(), "messages/en/orders.json"), "utf8"),
    );

    expect(en.emptyTitle).toBe("No orders yet");
    expect(en.emptyDescription).toContain("Orders from your connected store");
  });
});

describe("orders UI localization", () => {
  it("defines matching English and Arabic orders messages", () => {
    const en = JSON.parse(
      readFileSync(join(process.cwd(), "messages/en/orders.json"), "utf8"),
    );
    const ar = JSON.parse(
      readFileSync(join(process.cwd(), "messages/ar/orders.json"), "utf8"),
    );

    expect(flattenKeys(ar).sort()).toEqual(flattenKeys(en).sort());
    expect(ar.pageTitle).not.toBe(en.pageTitle);
    expect(ar.confirmOrder).not.toBe(en.confirmOrder);
  });
});
