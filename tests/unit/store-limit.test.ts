import { describe, expect, it } from "vitest";
import { STORES_PER_PROVIDER_LIMIT, storeSlotAvailable } from "@/lib/connections/store-limit";

describe("storeSlotAvailable", () => {
  it("allows a new store while the account is under the limit", () => {
    expect(storeSlotAvailable(["store-a", "store-b"], "store-c")).toBe(true);
  });

  it("rejects a fourth distinct store", () => {
    expect(
      storeSlotAvailable(["store-a", "store-b", "store-c"], "store-d"),
    ).toBe(false);
    expect(STORES_PER_PROVIDER_LIMIT).toBe(3);
  });

  it("still allows reconnecting a store that is already connected at the limit", () => {
    expect(
      storeSlotAvailable(["store-a", "store-b", "store-c"], "store-b"),
    ).toBe(true);
  });
});
