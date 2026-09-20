import { describe, expect, it } from "vitest";
import { youcanAdapter } from "@/integrations/stores/youcan";
import { YOUCAN_PROVIDER_ID } from "@/integrations/stores/youcan/constants";
import {
  getStoreAdapter,
  getStoreAdapterIfSupported,
  supportedStoreProviders,
} from "@/lib/integrations/stores";
import { isSupportedStoreProvider } from "@/lib/integrations/stores/supported-providers";
import { getDefaultConnectionState } from "@/lib/connections/defaults";

describe("YouCan adapter registry", () => {
  it("registers YouCanAdapter in the store adapter registry", () => {
    expect(isSupportedStoreProvider("youcan")).toBe(true);
    expect(supportedStoreProviders[0]).toEqual({
      id: "youcan",
      label: "YouCan",
    });
    expect(getStoreAdapter("youcan")).toBe(youcanAdapter);
    expect(getStoreAdapter("youcan").platform).toBe(YOUCAN_PROVIDER_ID);
  });

  it("returns YouCan-first default store connection metadata", () => {
    const store = getDefaultConnectionState("store");
    expect(store.metadata?.provider).toBe("youcan");
  });

  it("delegates unsupported connect to OAuth route", async () => {
    const result = await getStoreAdapterIfSupported("youcan")!.connect({
      storeId: "store-id",
      platform: "youcan",
      credentialsRef: "ref",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("/api/integrations/youcan/connect");
  });
});
