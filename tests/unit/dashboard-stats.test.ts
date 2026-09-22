import { describe, expect, it } from "vitest";
import { computeDashboardStats } from "@/lib/dashboard/stats";

const range = {
  from: "2026-09-01T00:00:00.000Z",
  to: "2026-09-30T23:59:59.000Z",
};

describe("computeDashboardStats", () => {
  it("counts range-scoped new and confirmed orders and all rejected or archived orders", () => {
    const stats = computeDashboardStats(
      [
        {
          confirmation_status: "pending",
          received_at: "2026-09-10T00:00:00.000Z",
          confirmed_at: null,
          total_amount_minor: 1000,
        },
        {
          confirmation_status: "pending",
          received_at: "2026-08-01T00:00:00.000Z",
          confirmed_at: null,
          total_amount_minor: 500,
        },
        {
          confirmation_status: "confirmed",
          received_at: "2026-09-02T00:00:00.000Z",
          confirmed_at: "2026-09-03T00:00:00.000Z",
          total_amount_minor: 2500,
        },
        {
          confirmation_status: "confirmed",
          received_at: "2026-08-02T00:00:00.000Z",
          confirmed_at: "2026-08-03T00:00:00.000Z",
          total_amount_minor: 9000,
        },
        {
          confirmation_status: "rejected",
          received_at: "2026-07-01T00:00:00.000Z",
          confirmed_at: null,
          total_amount_minor: 100,
        },
        {
          confirmation_status: "archived",
          received_at: "2026-07-02T00:00:00.000Z",
          confirmed_at: null,
          total_amount_minor: 100,
        },
      ],
      range,
    );

    expect(stats.new_orders).toBe(1);
    expect(stats.confirmed_orders).toBe(1);
    expect(stats.rejected_orders).toBe(1);
    expect(stats.archived_orders).toBe(1);
    expect(stats.total_orders).toBe(6);
    expect(stats.confirmed_revenue_minor).toBe(BigInt(2500));
    expect(stats.avg_order_value_minor).toBe(BigInt(2500));
    expect(stats.confirmation_rate).toBeCloseTo((1 / 6) * 100);
  });

  it("returns zero rate and average when there are no orders", () => {
    const stats = computeDashboardStats([], range);
    expect(stats.total_orders).toBe(0);
    expect(stats.confirmation_rate).toBe(0);
    expect(stats.avg_order_value_minor).toBe(BigInt(0));
    expect(stats.confirmed_revenue_minor).toBe(BigInt(0));
  });
});
