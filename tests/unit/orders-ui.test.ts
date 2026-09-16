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
  });
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

    vi.mocked(createUserDatabaseClient).mockResolvedValue({
      from: () => ({
        select: () => ({
          order: async () => ({
            data: [
              {
                id: "order_1",
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
          }),
        }),
      }),
    } as never);

    const result = await getOrdersForAuthenticatedUser();

    expect(result?.orders).toHaveLength(1);
    expect(result?.orders[0]?.confirmationStatus).toBe("pending");
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
