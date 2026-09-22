import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  archiveOrder,
  canArchive,
  canReject,
  isValidConfirmationTransition,
  rejectOrder,
} from "@/lib/confirmation/state-machine";

function statusDb(input: {
  updated: { id: string } | null;
  existing?: { id: string; owner_id: string; confirmation_status: string } | null;
}) {
  const updateChain = {
    eq() {
      return updateChain;
    },
    in() {
      return updateChain;
    },
    select() {
      return updateChain;
    },
    maybeSingle: async () => ({ data: input.updated, error: null }),
  };

  return {
    from() {
      return {
        update() {
          return updateChain;
        },
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({
                  data: input.existing ?? null,
                  error: null,
                }),
              };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
}

describe("order status transitions", () => {
  it("allows pending to rejected and confirmed or rejected to archived", () => {
    expect(canReject("pending")).toBe(true);
    expect(canReject("confirmed")).toBe(false);
    expect(canArchive("confirmed")).toBe(true);
    expect(canArchive("rejected")).toBe(true);
    expect(canArchive("pending")).toBe(false);
    expect(isValidConfirmationTransition("pending", "rejected")).toBe(true);
    expect(isValidConfirmationTransition("confirmed", "archived")).toBe(true);
    expect(isValidConfirmationTransition("rejected", "archived")).toBe(true);
    expect(isValidConfirmationTransition("pending", "archived")).toBe(false);
  });

  it("rejects a pending order for its owner", async () => {
    const result = await rejectOrder({
      orderId: "order-1",
      actor: { userId: "user-1" },
      db: statusDb({ updated: { id: "order-1" } }),
    });

    expect(result).toEqual({ status: "rejected", orderId: "order-1" });
  });

  it("refuses to archive an order that is still pending", async () => {
    const result = await archiveOrder({
      orderId: "order-1",
      actor: { userId: "user-1" },
      db: statusDb({
        updated: null,
        existing: {
          id: "order-1",
          owner_id: "user-1",
          confirmation_status: "pending",
        },
      }),
    });

    expect(result.status).toBe("invalid_state");
  });
});
