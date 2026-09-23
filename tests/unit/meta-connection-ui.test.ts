import { describe, expect, it } from "vitest";
import { metaConnectionMode } from "@/lib/dashboard/get-meta-deliveries-for-user";

describe("meta connection ui mode", () => {
  it("shows details when a connection is saved and a connect card otherwise", () => {
    expect(metaConnectionMode("connected")).toBe("details");
    expect(metaConnectionMode("connecting")).toBe("details");
    expect(metaConnectionMode("error")).toBe("details");
    expect(metaConnectionMode("not_connected")).toBe("connect");
    expect(metaConnectionMode(undefined)).toBe("connect");
  });
});
