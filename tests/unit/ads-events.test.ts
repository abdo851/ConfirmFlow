import { beforeEach, describe, expect, it, vi } from "vitest";

const { state } = vi.hoisted(() => ({
  state: { from: vi.fn() },
}));

vi.mock("@/lib/database/client", () => ({
  createDatabaseClient: () => ({
    from: (...args: unknown[]) => state.from(...args),
  }),
}));

import { logAdEvent } from "@/lib/ads/events/log";
import { getAdEventStats, listAdEvents } from "@/lib/ads/events/queries";

describe("ad events log", () => {
  beforeEach(() => {
    state.from.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("masks email and phone recursively", async () => {
    const insert = vi.fn(async (row: { payload: { customerEmail: string; nested: { phone: string; items: Array<{ tel: string; sku: string }> } } }) => {
      void row;
      return { error: null };
    });
    state.from.mockReturnValue({ insert });

    await logAdEvent({
      ownerId: "owner-1",
      platform: "meta",
      eventName: "Purchase",
      status: "sent",
      payload: {
        customerEmail: "a@example.com",
        nested: { phone: "0600000000", items: [{ tel: "0611111111", sku: "hat" }] },
      },
    });

    const stored = insert.mock.calls[0]?.[0]?.payload;
    expect(stored).toBeDefined();
    if (!stored) return;
    expect(stored.customerEmail).toBe("***");
    expect(stored.nested.phone).toBe("***");
    expect(stored.nested.items[0].tel).toBe("***");
    expect(stored.nested.items[0].sku).toBe("hat");
  });

  it("truncates a long error and a large payload", async () => {
    const insert = vi.fn(async (row: { error_message: string; payload: { truncated: boolean; preview: string } }) => {
      void row;
      return { error: null };
    });
    state.from.mockReturnValue({ insert });

    await logAdEvent({
      ownerId: "owner-1",
      platform: "google",
      eventName: "Purchase",
      status: "failed",
      errorMessage: "x".repeat(800),
      payload: { blob: "y".repeat(9000) },
    });

    const stored = insert.mock.calls[0]?.[0];
    expect(stored).toBeDefined();
    if (!stored) return;
    expect(stored.error_message).toHaveLength(500);
    expect(stored.payload).toEqual({ truncated: true, preview: expect.any(String) });
    expect(stored.payload.preview.length).toBeLessThanOrEqual(1024);
  });

  it("does not throw when the client fails", async () => {
    state.from.mockImplementation(() => {
      throw new Error("down");
    });

    await expect(
      logAdEvent({
        ownerId: "owner-1",
        platform: "tiktok",
        eventName: "Purchase",
        status: "sent",
      }),
    ).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalled();
  });

  it("scopes the list to owner_id", async () => {
    const eq = vi.fn();
    const range = vi.fn(async () => ({ data: [], count: 0, error: null }));
    const order = vi.fn(() => ({ range }));
    eq.mockReturnValue({ eq, order, gte: vi.fn(() => ({ eq, order })) });
    state.from.mockReturnValue({
      select: vi.fn(() => ({ eq })),
    });

    await listAdEvents("owner-9", {});

    expect(eq).toHaveBeenCalledWith("owner_id", "owner-9");
  });

  it("returns one stats row per platform", async () => {
    const eq = vi.fn(async () => ({
      data: [
        { platform: "meta", status: "sent", sent_at: "2026-09-30T00:00:00.000Z" },
        { platform: "meta", status: "failed", sent_at: "2026-09-30T01:00:00.000Z" },
      ],
      error: null,
    }));
    state.from.mockReturnValue({
      select: vi.fn(() => ({ eq })),
    });

    const stats = await getAdEventStats("owner-9");
    expect(eq).toHaveBeenCalledWith("owner_id", "owner-9");
    expect(stats.map((row) => row.platform)).toEqual(["meta", "tiktok", "google"]);
    expect(stats[0]).toMatchObject({ sent: 1, failed: 1, skipped: 0 });
  });
});
