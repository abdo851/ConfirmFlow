import { describe, expect, it } from "vitest";
import { buildDashboardTimeseries } from "@/lib/dashboard/stats";

describe("buildDashboardTimeseries", () => {
  it("groups received and confirmed orders by UTC day", () => {
    const series = buildDashboardTimeseries(
      [
        {
          received_at: "2026-09-22T08:00:00.000Z",
          confirmed_at: "2026-09-22T10:00:00.000Z",
        },
        {
          received_at: "2026-09-21T08:00:00.000Z",
          confirmed_at: null,
        },
        {
          received_at: "2026-09-01T08:00:00.000Z",
          confirmed_at: "2026-09-21T12:00:00.000Z",
        },
      ],
      7,
      new Date("2026-09-22T18:00:00.000Z"),
    );

    expect(series).toHaveLength(7);
    expect(series[0]?.date).toBe("2026-09-16");
    expect(series.at(-1)?.date).toBe("2026-09-22");
    expect(series.find((point) => point.date === "2026-09-22")).toEqual({
      date: "2026-09-22",
      new: 1,
      confirmed: 1,
    });
    expect(series.find((point) => point.date === "2026-09-21")).toEqual({
      date: "2026-09-21",
      new: 1,
      confirmed: 1,
    });
  });
});
