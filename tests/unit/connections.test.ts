import { describe, expect, it } from "vitest";
import {
  defaultConnectionStates,
  getConnectionStatusLabel,
  getConnectionStatusVariant,
  getDefaultConnectionState,
} from "@/lib/connections";

describe("connection state foundation", () => {
  it("defines default disconnected states", () => {
    expect(defaultConnectionStates).toHaveLength(3);
    expect(defaultConnectionStates.every((item) => item.status === "not_connected")).toBe(
      true,
    );
  });

  it("labels confirmation as Not configured when not connected", () => {
    expect(getConnectionStatusLabel("confirmation", "not_connected")).toBe(
      "Not configured",
    );
    expect(getConnectionStatusLabel("store", "not_connected")).toBe(
      "Not connected",
    );
  });

  it("maps statuses to badge variants", () => {
    expect(getConnectionStatusVariant("not_connected")).toBe("warning");
    expect(getConnectionStatusVariant("connecting")).toBe("muted");
    expect(getConnectionStatusVariant("connected")).toBe("default");
    expect(getConnectionStatusVariant("error")).toBe("error");
  });

  it("returns default connection state by type", () => {
    const store = getDefaultConnectionState("store");
    expect(store.label).toBe("Store");
    expect(store.status).toBe("not_connected");
  });
});
