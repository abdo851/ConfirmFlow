import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as confirmPost } from "@/app/api/orders/[id]/confirm/route";
import { buildPurchaseEventId } from "@/lib/conversions/event-id";
import type { MetaCapiTransport } from "@/lib/integrations/meta/capi/client";
import { META_PURCHASE_STALE_SENDING_THRESHOLD_MS } from "@/lib/integrations/meta/delivery/config";
import { processMetaPurchaseDelivery } from "@/lib/integrations/meta/delivery/deliver-purchase";
import {
  getStaleSendingCutoffIso,
  isStaleSendingDelivery,
} from "@/lib/integrations/meta/delivery/stale-sending";

const ORDER_ID = "11111111-1111-1111-1111-111111111111";
const OWNER_ID = "22222222-2222-2222-2222-222222222222";
const OTHER_OWNER_ID = "33333333-3333-3333-3333-333333333333";
const STORE_ID = "44444444-4444-4444-4444-444444444444";
const DELIVERY_ID = "55555555-5555-5555-5555-555555555555";

type DeliveryRow = {
  id: string;
  store_id: string;
  order_id: string;
  provider: "meta";
  event_type: "Purchase";
  event_id: string;
  status: "pending" | "sending" | "sent" | "failed";
  attempts: number;
  last_attempted_at: string | null;
  sent_at: string | null;
  last_error: string | null;
};

type OrderRow = {
  id: string;
  store_id: string;
  owner_id: string;
  confirmation_status: "pending" | "confirmed";
  confirmed_at: string | null;
  currency: string;
  total_amount_minor: number;
  customer_email: string | null;
  customer_phone: string | null;
};

const mockFrom = vi.fn();
const mockConfirmOrder = vi.fn();

vi.mock("@/lib/database/client", () => ({
  createDatabaseClient: () => ({
    from: mockFrom,
  }),
}));

vi.mock("@/lib/integrations/meta/env", () => ({
  getMetaEnv: () => ({
    META_SESSION_SECRET: "test-meta-session-secret-minimum-length-1234",
  }),
}));

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/confirmation", async () => {
  const actual = await vi.importActual<typeof import("@/lib/confirmation")>(
    "@/lib/confirmation",
  );

  return {
    ...actual,
    confirmOrder: (...args: unknown[]) => mockConfirmOrder(...args),
  };
});

vi.mock("@/lib/integrations/meta/delivery/eligibility", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/integrations/meta/delivery/eligibility")
  >("@/lib/integrations/meta/delivery/eligibility");

  return {
    ...actual,
    loadEligibleMetaConnectionForStore: vi.fn(actual.loadEligibleMetaConnectionForStore),
  };
});

vi.mock("@/lib/integrations/meta/capi/transport", () => ({
  defaultMetaCapiTransport: {
    send: vi.fn(async () => ({ status: 200 })),
  },
}));

function createDeliveryMockDb(initial: {
  orders?: Record<string, OrderRow>;
  deliveries?: Record<string, DeliveryRow>;
}) {
  const orders = new Map(Object.entries(initial.orders ?? {}));
  const deliveries = new Map(Object.entries(initial.deliveries ?? {}));

  mockFrom.mockImplementation((table: string) => {
    if (table === "orders") {
      const filters: Record<string, string> = {};
      return {
        select: () => ({
          eq: (field: string, value: string) => {
            filters[field] = value;
            return {
              maybeSingle: async () => ({
                data: filters.id ? orders.get(filters.id) ?? null : null,
                error: null,
              }),
            };
          },
        }),
      };
    }

    if (table === "meta_conversion_deliveries") {
      const filters: Record<string, string> = {};
      return {
        select: () => ({
          eq: (field: string, value: string) => {
            filters[field] = value;
            return {
              eq: (nextField: string, nextValue: string) => {
                filters[nextField] = nextValue;
                return {
                  eq: (finalField: string, finalValue: string) => {
                    filters[finalField] = finalValue;
                    return {
                      maybeSingle: async () => {
                        const delivery = [...deliveries.values()].find(
                          (row) =>
                            row.order_id === filters.order_id &&
                            row.provider === filters.provider &&
                            row.event_type === filters.event_type,
                        );
                        return { data: delivery ?? null, error: null };
                      },
                    };
                  },
                  maybeSingle: async () => {
                    const delivery = filters.id
                      ? deliveries.get(filters.id) ?? null
                      : null;
                    return { data: delivery, error: null };
                  },
                };
              },
              maybeSingle: async () => {
                const delivery = filters.id
                  ? deliveries.get(filters.id) ?? null
                  : null;
                return { data: delivery, error: null };
              },
            };
          },
        }),
        insert: (
          values: Omit<
            DeliveryRow,
            "id" | "attempts" | "last_attempted_at" | "sent_at" | "last_error"
          >,
        ) => {
          const existing = [...deliveries.values()].some(
            (row) => row.order_id === values.order_id,
          );
          if (!existing) {
            deliveries.set(DELIVERY_ID, {
              id: DELIVERY_ID,
              attempts: 0,
              last_attempted_at: null,
              sent_at: null,
              last_error: null,
              ...values,
            });
          }

          return Promise.resolve({
            data: null,
            error: existing ? { code: "23505" } : null,
          });
        },
        update: (values: Partial<DeliveryRow>) => {
          type ClaimFilters = {
            id?: string;
            statusEq?: string;
            statusIn?: string[];
            lastAttemptedLt?: string;
            lastAttemptedIsNull?: boolean;
          };

          const claimFilters: ClaimFilters = {};

          function matchesClaimFilters(delivery: DeliveryRow): boolean {
            if (claimFilters.statusIn && !claimFilters.statusIn.includes(delivery.status)) {
              return false;
            }

            if (claimFilters.statusEq && delivery.status !== claimFilters.statusEq) {
              return false;
            }

            if (claimFilters.lastAttemptedLt) {
              if (
                !delivery.last_attempted_at ||
                delivery.last_attempted_at >= claimFilters.lastAttemptedLt
              ) {
                return false;
              }
            }

            if (claimFilters.lastAttemptedIsNull && delivery.last_attempted_at !== null) {
              return false;
            }

            return true;
          }

          const builder = {
            eq(field: string, value: string) {
              if (field === "id") {
                claimFilters.id = value;
              }
              if (field === "status") {
                claimFilters.statusEq = value;
              }
              return builder;
            },
            in(field: string, statuses: string[]) {
              if (field === "status") {
                claimFilters.statusIn = statuses;
              }
              return builder;
            },
            lt(field: string, value: string) {
              if (field === "last_attempted_at") {
                claimFilters.lastAttemptedLt = value;
              }
              return builder;
            },
            is(field: string, value: null) {
              if (field === "last_attempted_at" && value === null) {
                claimFilters.lastAttemptedIsNull = true;
              }
              return builder;
            },
            select: () => ({
              maybeSingle: async () => {
                const delivery = claimFilters.id
                  ? deliveries.get(claimFilters.id)
                  : undefined;

                if (!delivery || !matchesClaimFilters(delivery)) {
                  return { data: null, error: null };
                }

                const updated: DeliveryRow = {
                  ...delivery,
                  ...values,
                  attempts:
                    values.attempts !== undefined ? values.attempts : delivery.attempts,
                };
                deliveries.set(updated.id, updated);
                return { data: updated, error: null };
              },
            }),
            then(onFulfilled?: (value: { error: null }) => unknown) {
              const delivery = claimFilters.id
                ? deliveries.get(claimFilters.id)
                : undefined;
              if (delivery) {
                Object.assign(delivery, values);
              }
              return Promise.resolve({ error: null }).then(onFulfilled);
            },
          };

          return builder;
        },
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return { orders, deliveries };
}

function createTransport(
  response: { status: number; body?: unknown },
  onSend?: MetaCapiTransport["send"],
): MetaCapiTransport {
  return {
    send:
      onSend ??
      vi.fn(async () => response),
  };
}

describe("Meta Purchase delivery", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { loadEligibleMetaConnectionForStore } = await import(
      "@/lib/integrations/meta/delivery/eligibility"
    );
    vi.mocked(loadEligibleMetaConnectionForStore).mockResolvedValue({
      eligible: true,
      connection: {
        pixelId: "123456789012345",
        accessToken: "secret-token",
      },
    });
  });

  it("uses deterministic purchase event IDs", () => {
    expect(buildPurchaseEventId(ORDER_ID)).toBe(`purchase:${ORDER_ID}`);
  });

  it("creates one delivery record per confirmed order", async () => {
    const db = createDeliveryMockDb({
      orders: {
        [ORDER_ID]: {
          id: ORDER_ID,
          store_id: STORE_ID,
          owner_id: OWNER_ID,
          confirmation_status: "confirmed",
          confirmed_at: "2024-06-02T10:00:00.000Z",
          currency: "MAD",
          total_amount_minor: 22900,
          customer_email: "customer@example.com",
          customer_phone: "+212600000000",
        },
      },
    });

    const transport = createTransport({ status: 200 });
    const result = await processMetaPurchaseDelivery({
      orderId: ORDER_ID,
      userId: OWNER_ID,
      createIfMissing: true,
      transport,
    });

    expect(result?.status).toBe("sent");
    expect(result?.eventId).toBe(`purchase:${ORDER_ID}`);
    expect(db.deliveries.size).toBe(1);
  });

  it("does not create duplicate delivery records on repeat confirmation", async () => {
    const db = createDeliveryMockDb({
      orders: {
        [ORDER_ID]: {
          id: ORDER_ID,
          store_id: STORE_ID,
          owner_id: OWNER_ID,
          confirmation_status: "confirmed",
          confirmed_at: "2024-06-02T10:00:00.000Z",
          currency: "MAD",
          total_amount_minor: 22900,
          customer_email: "customer@example.com",
          customer_phone: null,
        },
      },
      deliveries: {
        [DELIVERY_ID]: {
          id: DELIVERY_ID,
          store_id: STORE_ID,
          order_id: ORDER_ID,
          provider: "meta",
          event_type: "Purchase",
          event_id: `purchase:${ORDER_ID}`,
          status: "sent",
          attempts: 1,
          last_attempted_at: "2024-06-02T10:00:01.000Z",
          sent_at: "2024-06-02T10:00:01.000Z",
          last_error: null,
        },
      },
    });

    const send = vi.fn(async () => ({ status: 200 }));
    const result = await processMetaPurchaseDelivery({
      orderId: ORDER_ID,
      userId: OWNER_ID,
      transport: { send },
    });

    expect(result?.status).toBe("sent");
    expect(result?.eventId).toBe(`purchase:${ORDER_ID}`);
    expect(send).not.toHaveBeenCalled();
    expect(db.deliveries.size).toBe(1);
  });

  it("rejects delivery for unconfirmed orders", async () => {
    createDeliveryMockDb({
      orders: {
        [ORDER_ID]: {
          id: ORDER_ID,
          store_id: STORE_ID,
          owner_id: OWNER_ID,
          confirmation_status: "pending",
          confirmed_at: null,
          currency: "MAD",
          total_amount_minor: 22900,
          customer_email: null,
          customer_phone: null,
        },
      },
    });

    const result = await processMetaPurchaseDelivery({
      orderId: ORDER_ID,
      userId: OWNER_ID,
      createIfMissing: true,
      transport: createTransport({ status: 200 }),
    });

    expect(result).toBeNull();
  });

  it("marks delivery failed when Meta CAPI fails", async () => {
    createDeliveryMockDb({
      orders: {
        [ORDER_ID]: {
          id: ORDER_ID,
          store_id: STORE_ID,
          owner_id: OWNER_ID,
          confirmation_status: "confirmed",
          confirmed_at: "2024-06-02T10:00:00.000Z",
          currency: "MAD",
          total_amount_minor: 22900,
          customer_email: "customer@example.com",
          customer_phone: null,
        },
      },
    });

    const result = await processMetaPurchaseDelivery({
      orderId: ORDER_ID,
      userId: OWNER_ID,
      createIfMissing: true,
      transport: createTransport({ status: 400, body: { error: { message: "Bad request" } } }),
    });

    expect(result?.status).toBe("failed");
    expect(result?.message).not.toContain("secret-token");
  });

  it("marks delivery failed on network timeout", async () => {
    createDeliveryMockDb({
      orders: {
        [ORDER_ID]: {
          id: ORDER_ID,
          store_id: STORE_ID,
          owner_id: OWNER_ID,
          confirmation_status: "confirmed",
          confirmed_at: "2024-06-02T10:00:00.000Z",
          currency: "MAD",
          total_amount_minor: 22900,
          customer_email: "customer@example.com",
          customer_phone: null,
        },
      },
    });

    const result = await processMetaPurchaseDelivery({
      orderId: ORDER_ID,
      userId: OWNER_ID,
      createIfMissing: true,
      transport: {
        send: vi.fn(async () => ({ status: 0 })),
      },
    });

    expect(result?.status).toBe("failed");
  });

  it("returns not_eligible when Meta verification is incomplete", async () => {
    createDeliveryMockDb({
      orders: {
        [ORDER_ID]: {
          id: ORDER_ID,
          store_id: STORE_ID,
          owner_id: OWNER_ID,
          confirmation_status: "confirmed",
          confirmed_at: "2024-06-02T10:00:00.000Z",
          currency: "MAD",
          total_amount_minor: 22900,
          customer_email: "customer@example.com",
          customer_phone: null,
        },
      },
    });

    const { loadEligibleMetaConnectionForStore } = await import(
      "@/lib/integrations/meta/delivery/eligibility"
    );
    vi.mocked(loadEligibleMetaConnectionForStore).mockResolvedValue({
      eligible: false,
      message: "Meta credentials are valid but not fully verified for delivery.",
    });

    const send = vi.fn(async () => ({ status: 200 }));
    const result = await processMetaPurchaseDelivery({
      orderId: ORDER_ID,
      userId: OWNER_ID,
      createIfMissing: true,
      transport: { send },
    });

    expect(result?.status).toBe("not_eligible");
    expect(send).not.toHaveBeenCalled();
  });

  it.each([
    "unverified",
    "credentials_valid",
    "identifier_not_verified",
    "failed",
  ] as const)("treats %s Meta verification as ineligible", async (verificationStatus) => {
    createDatabaseMocksForEligibility(verificationStatus);
    const { loadEligibleMetaConnectionForStore: loadEligible } = await import(
      "@/lib/integrations/meta/delivery/eligibility"
    );
    vi.mocked(loadEligible).mockRestore();
    vi.mocked(loadEligible).mockImplementation(
      (
        await vi.importActual<typeof import("@/lib/integrations/meta/delivery/eligibility")>(
          "@/lib/integrations/meta/delivery/eligibility",
        )
      ).loadEligibleMetaConnectionForStore,
    );

    const result = await loadEligible({
      userId: OWNER_ID,
      storeId: STORE_ID,
    });

    expect(result.eligible).toBe(false);
  });

  it("returns in_progress when another delivery is already sending", async () => {
    const now = Date.parse("2024-06-02T10:05:00.000Z");
    createDeliveryMockDb({
      orders: {
        [ORDER_ID]: {
          id: ORDER_ID,
          store_id: STORE_ID,
          owner_id: OWNER_ID,
          confirmation_status: "confirmed",
          confirmed_at: "2024-06-02T10:00:00.000Z",
          currency: "MAD",
          total_amount_minor: 22900,
          customer_email: "customer@example.com",
          customer_phone: null,
        },
      },
      deliveries: {
        [DELIVERY_ID]: {
          id: DELIVERY_ID,
          store_id: STORE_ID,
          order_id: ORDER_ID,
          provider: "meta",
          event_type: "Purchase",
          event_id: `purchase:${ORDER_ID}`,
          status: "sending",
          attempts: 1,
          last_attempted_at: "2024-06-02T10:04:30.000Z",
          sent_at: null,
          last_error: null,
        },
      },
    });

    const send = vi.fn(async () => ({ status: 200 }));
    const result = await processMetaPurchaseDelivery({
      orderId: ORDER_ID,
      userId: OWNER_ID,
      createIfMissing: false,
      transport: { send },
      now,
    });

    expect(result?.status).toBe("in_progress");
    expect(send).not.toHaveBeenCalled();
  });

  it("reconciles a missing delivery record for an already confirmed order", async () => {
    const db = createDeliveryMockDb({
      orders: {
        [ORDER_ID]: {
          id: ORDER_ID,
          store_id: STORE_ID,
          owner_id: OWNER_ID,
          confirmation_status: "confirmed",
          confirmed_at: "2024-06-02T10:00:00.000Z",
          currency: "MAD",
          total_amount_minor: 22900,
          customer_email: "customer@example.com",
          customer_phone: null,
        },
      },
    });

    const result = await processMetaPurchaseDelivery({
      orderId: ORDER_ID,
      userId: OWNER_ID,
      createIfMissing: false,
      transport: createTransport({ status: 200 }),
    });

    expect(result?.status).toBe("sent");
    expect(result?.eventId).toBe(`purchase:${ORDER_ID}`);
    expect(db.deliveries.size).toBe(1);
  });

  it("keeps orphan recovery idempotent across repeated attempts", async () => {
    const db = createDeliveryMockDb({
      orders: {
        [ORDER_ID]: {
          id: ORDER_ID,
          store_id: STORE_ID,
          owner_id: OWNER_ID,
          confirmation_status: "confirmed",
          confirmed_at: "2024-06-02T10:00:00.000Z",
          currency: "MAD",
          total_amount_minor: 22900,
          customer_email: "customer@example.com",
          customer_phone: null,
        },
      },
    });

    const transport = createTransport({ status: 200 });
    const first = await processMetaPurchaseDelivery({
      orderId: ORDER_ID,
      userId: OWNER_ID,
      transport,
    });
    const second = await processMetaPurchaseDelivery({
      orderId: ORDER_ID,
      userId: OWNER_ID,
      transport,
    });

    expect(first?.eventId).toBe(`purchase:${ORDER_ID}`);
    expect(second?.status).toBe("sent");
    expect(db.deliveries.size).toBe(1);
  });

  it("returns in_progress for fresh sending deliveries", async () => {
    const now = Date.parse("2024-06-02T10:05:00.000Z");
    createDeliveryMockDb({
      orders: {
        [ORDER_ID]: {
          id: ORDER_ID,
          store_id: STORE_ID,
          owner_id: OWNER_ID,
          confirmation_status: "confirmed",
          confirmed_at: "2024-06-02T10:00:00.000Z",
          currency: "MAD",
          total_amount_minor: 22900,
          customer_email: "customer@example.com",
          customer_phone: null,
        },
      },
      deliveries: {
        [DELIVERY_ID]: {
          id: DELIVERY_ID,
          store_id: STORE_ID,
          order_id: ORDER_ID,
          provider: "meta",
          event_type: "Purchase",
          event_id: `purchase:${ORDER_ID}`,
          status: "sending",
          attempts: 1,
          last_attempted_at: "2024-06-02T10:04:30.000Z",
          sent_at: null,
          last_error: null,
        },
      },
    });

    const send = vi.fn(async () => ({ status: 200 }));
    const result = await processMetaPurchaseDelivery({
      orderId: ORDER_ID,
      userId: OWNER_ID,
      transport: { send },
      now,
    });

    expect(result?.status).toBe("in_progress");
    expect(send).not.toHaveBeenCalled();
    expect(isStaleSendingDelivery(
      {
        id: DELIVERY_ID,
        store_id: STORE_ID,
        order_id: ORDER_ID,
        provider: "meta",
        event_type: "Purchase",
        event_id: `purchase:${ORDER_ID}`,
        status: "sending",
        attempts: 1,
        last_attempted_at: "2024-06-02T10:04:30.000Z",
        sent_at: null,
        last_error: null,
      },
      now,
    )).toBe(false);
  });

  it("reclaims stale sending deliveries with the same event ID", async () => {
    const now = Date.parse("2024-06-02T10:10:00.000Z");
    const staleAttemptedAt = new Date(
      now - META_PURCHASE_STALE_SENDING_THRESHOLD_MS - 1_000,
    ).toISOString();

    createDeliveryMockDb({
      orders: {
        [ORDER_ID]: {
          id: ORDER_ID,
          store_id: STORE_ID,
          owner_id: OWNER_ID,
          confirmation_status: "confirmed",
          confirmed_at: "2024-06-02T10:00:00.000Z",
          currency: "MAD",
          total_amount_minor: 22900,
          customer_email: "customer@example.com",
          customer_phone: null,
        },
      },
      deliveries: {
        [DELIVERY_ID]: {
          id: DELIVERY_ID,
          store_id: STORE_ID,
          order_id: ORDER_ID,
          provider: "meta",
          event_type: "Purchase",
          event_id: `purchase:${ORDER_ID}`,
          status: "sending",
          attempts: 1,
          last_attempted_at: staleAttemptedAt,
          sent_at: null,
          last_error: null,
        },
      },
    });

    expect(staleAttemptedAt < getStaleSendingCutoffIso(now)).toBe(true);

    const result = await processMetaPurchaseDelivery({
      orderId: ORDER_ID,
      userId: OWNER_ID,
      transport: createTransport({ status: 200 }),
      now,
    });

    expect(result?.status).toBe("sent");
    expect(result?.eventId).toBe(`purchase:${ORDER_ID}`);
  });

  it("retries failed delivery with the same event ID", async () => {
    createDeliveryMockDb({
      orders: {
        [ORDER_ID]: {
          id: ORDER_ID,
          store_id: STORE_ID,
          owner_id: OWNER_ID,
          confirmation_status: "confirmed",
          confirmed_at: "2024-06-02T10:00:00.000Z",
          currency: "MAD",
          total_amount_minor: 22900,
          customer_email: "customer@example.com",
          customer_phone: null,
        },
      },
      deliveries: {
        [DELIVERY_ID]: {
          id: DELIVERY_ID,
          store_id: STORE_ID,
          order_id: ORDER_ID,
          provider: "meta",
          event_type: "Purchase",
          event_id: `purchase:${ORDER_ID}`,
          status: "failed",
          attempts: 1,
          last_attempted_at: "2024-06-02T10:00:01.000Z",
          sent_at: null,
          last_error: "Meta CAPI request failed.",
        },
      },
    });

    const result = await processMetaPurchaseDelivery({
      orderId: ORDER_ID,
      userId: OWNER_ID,
      createIfMissing: false,
      transport: createTransport({ status: 200 }),
    });

    expect(result?.status).toBe("sent");
    expect(result?.eventId).toBe(`purchase:${ORDER_ID}`);
  });
});

function createDatabaseMocksForEligibility(
  verificationStatus: "unverified" | "credentials_valid" | "identifier_not_verified" | "failed" | "verified",
) {
  mockFrom.mockImplementation((table: string) => {
    if (table === "stores") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { id: STORE_ID }, error: null }),
            }),
          }),
        }),
      };
    }

    if (table === "store_connections") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { id: "conn-1" },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      };
    }

    if (table === "meta_connections") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                pixel_id: "123456789012345",
                verification_status: verificationStatus,
              },
              error: null,
            }),
          }),
        }),
      };
    }

    if (table === "meta_connection_secrets") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { encrypted_access_token: "enc:test" },
              error: null,
            }),
          }),
        }),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });
}

describe("Confirmation API Purchase delivery response", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns Meta delivery status without exposing tokens", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth/session");
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: OWNER_ID } as never);

    mockConfirmOrder.mockResolvedValue({
      status: "confirmed",
      orderId: ORDER_ID,
      confirmedAt: "2024-06-02T10:00:00.000Z",
    });

    createDeliveryMockDb({
      orders: {
        [ORDER_ID]: {
          id: ORDER_ID,
          store_id: STORE_ID,
          owner_id: OWNER_ID,
          confirmation_status: "confirmed",
          confirmed_at: "2024-06-02T10:00:00.000Z",
          currency: "MAD",
          total_amount_minor: 22900,
          customer_email: "customer@example.com",
          customer_phone: null,
        },
      },
    });

    const response = await confirmPost(new Request("http://localhost"), {
      params: Promise.resolve({ id: ORDER_ID }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metaPurchaseDelivery?.status).toBe("sent");
    expect(JSON.stringify(body)).not.toContain("secret-token");
    expect(JSON.stringify(body)).not.toContain("access_token");
  });

  it("keeps confirmation success when Meta delivery fails", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth/session");
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: OWNER_ID } as never);

    mockConfirmOrder.mockResolvedValue({
      status: "already_confirmed",
      orderId: ORDER_ID,
      confirmedAt: "2024-06-02T10:00:00.000Z",
    });

    createDeliveryMockDb({
      orders: {
        [ORDER_ID]: {
          id: ORDER_ID,
          store_id: STORE_ID,
          owner_id: OWNER_ID,
          confirmation_status: "confirmed",
          confirmed_at: "2024-06-02T10:00:00.000Z",
          currency: "MAD",
          total_amount_minor: 22900,
          customer_email: "customer@example.com",
          customer_phone: null,
        },
      },
    });

    const { defaultMetaCapiTransport } = await import(
      "@/lib/integrations/meta/capi/transport"
    );
    vi.mocked(defaultMetaCapiTransport.send).mockResolvedValueOnce({ status: 400 });

    const response = await confirmPost(new Request("http://localhost"), {
      params: Promise.resolve({ id: ORDER_ID }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("already_confirmed");
    expect(body.metaPurchaseDelivery?.status).toBe("failed");
    expect(body.error).toBeUndefined();
  });

  it("does not dispatch delivery for forbidden confirmation results", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth/session");
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: OTHER_OWNER_ID } as never);

    mockConfirmOrder.mockResolvedValue({ status: "forbidden" });

    const response = await confirmPost(new Request("http://localhost"), {
      params: Promise.resolve({ id: ORDER_ID }),
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.metaPurchaseDelivery).toBeUndefined();
  });
});
