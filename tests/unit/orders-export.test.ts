import { describe, expect, it } from "vitest";
import { ordersToCsv } from "@/lib/orders/csv";

describe("ordersToCsv", () => {
  it("escapes quotes and includes confirmation status", () => {
    const csv = ordersToCsv([
      {
        orderNumber: '12, "vip"',
        externalOrderId: "ext-1",
        customerEmail: "a@example.com",
        customerPhone: null,
        currency: "USD",
        totalAmountMinor: 3000,
        confirmationStatus: "rejected",
        receivedAt: "2026-09-22T00:00:00.000Z",
      },
    ]);

    expect(csv.split("\n")[0]).toContain("confirmation_status");
    expect(csv).toContain('"12, ""vip"""');
    expect(csv).toContain("rejected");
    expect(csv).toContain("3000");
  });
});
