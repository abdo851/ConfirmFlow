import { describe, expect, it } from "vitest";
import { verifyMetaCredentials } from "@/lib/integrations/meta/verification/verify-credentials";
import type { MetaGraphTransport } from "@/lib/integrations/meta/verification/types";

function transport(responses: Array<{ status: number; body: unknown }>): MetaGraphTransport {
  const queue = [...responses];
  return {
    async get() {
      const next = queue.shift();
      if (!next) {
        throw new Error("Unexpected Graph request.");
      }
      return next;
    },
  };
}

describe("meta connect verification", () => {
  it("verifies a token that can read the configured pixel", async () => {
    const result = await verifyMetaCredentials({
      pixelId: "4444157855871429",
      accessToken: "test-token",
      transport: transport([
        { status: 200, body: { id: "111" } },
        { status: 200, body: { id: "4444157855871429" } },
      ]),
    });

    expect(result).toEqual({ status: "verified" });
  });

  it("keeps a readable token unverified when the pixel request is rejected", async () => {
    const result = await verifyMetaCredentials({
      pixelId: "4444157855871429",
      accessToken: "test-token",
      transport: transport([
        { status: 200, body: { id: "111" } },
        { status: 400, body: { error: { message: "(#100) Missing Permission", code: 100 } } },
      ]),
    });

    expect(result.status).toBe("credentials_valid");
    expect(result.message).toMatch(/could not be fully verified/i);
  });
});
