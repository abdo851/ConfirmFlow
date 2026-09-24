import { beforeEach, describe, expect, it, vi } from "vitest";
import { processMetaPurchaseDelivery } from "@/lib/integrations/meta/delivery/deliver-purchase";

const ORDER_ID = "40a907f9-4bbe-4003-8ddb-cf4f06761a75";
const USER_ID = "61540ece-1244-4cf4-823a-7992af8c3420";

const mockMaybeSingle = vi.fn();

vi.mock("@/lib/database/client", () => ({
  createDatabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: mockMaybeSingle,
        }),
      }),
    }),
  }),
}));

describe("meta purchase delivery for order state", () => {
  beforeEach(() => {
    mockMaybeSingle.mockReset();
  });

  it("does not send a Purchase when the confirmed order has been archived", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: ORDER_ID,
        store_id: "71e24709-75a4-4f11-8d85-9f31e783d747",
        owner_id: USER_ID,
        confirmation_status: "archived",
        confirmed_at: "2026-09-22T18:12:45.000Z",
        currency: "USD",
        total_amount_minor: 3000,
        customer_email: "test@example.com",
        customer_phone: "0612345678",
      },
      error: null,
    });

    const result = await processMetaPurchaseDelivery({
      orderId: ORDER_ID,
      userId: USER_ID,
    });

    expect(result).toBeNull();
  });
});
