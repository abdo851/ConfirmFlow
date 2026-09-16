import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as verifyPost } from "@/app/api/integrations/meta/verify/route";
import { META_GRAPH_API_VERSION } from "@/lib/integrations/meta/constants";
import { MetaPersistenceError } from "@/lib/integrations/meta/persistence";
import { verifyMetaCredentials } from "@/lib/integrations/meta/verification/verify-credentials";
import { verifyMetaConnectionForUser } from "@/lib/integrations/meta/verification/verify-connection";
import type { MetaGraphTransport } from "@/lib/integrations/meta/verification/types";

const mockLoadMetaConnectionForVerification = vi.fn();
const mockPersistMetaVerificationResult = vi.fn();

vi.mock("@/lib/integrations/meta/env", () => ({
  getMetaEnv: () => ({
    META_SESSION_SECRET: "test-meta-session-secret-minimum-length-1234",
  }),
}));

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/integrations/meta/graph/transport", () => ({
  defaultMetaGraphTransport: {
    get: vi.fn(async (url: string) => {
      if (url.includes("/me?")) {
        return { status: 200, body: { id: "meta-user-1" } };
      }

      if (url.includes("123456789012345")) {
        return { status: 200, body: { id: "123456789012345" } };
      }

      return { status: 500, body: null };
    }),
  },
}));

vi.mock("@/lib/integrations/meta/persistence", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/integrations/meta/persistence")
  >("@/lib/integrations/meta/persistence");

  return {
    ...actual,
    loadMetaConnectionForVerification: (...args: unknown[]) =>
      mockLoadMetaConnectionForVerification(...args),
    persistMetaVerificationResult: (...args: unknown[]) =>
      mockPersistMetaVerificationResult(...args),
  };
});

function createTransport(
  responses: Record<string, { status: number; body: unknown }>,
): MetaGraphTransport {
  return {
    get: vi.fn(async (url: string) => {
      for (const [pattern, response] of Object.entries(responses)) {
        if (url.includes(pattern)) {
          return response;
        }
      }

      throw new Error(`Unexpected Graph URL: ${url}`);
    }),
  };
}

describe("Meta credential verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPersistMetaVerificationResult.mockResolvedValue(undefined);
  });

  it("uses read-only Graph endpoints and never calls /events", async () => {
    const transport = createTransport({
      "/me?": { status: 200, body: { id: "meta-user-1" } },
      "/123456789012345?": { status: 200, body: { id: "123456789012345" } },
    });

    const result = await verifyMetaCredentials({
      pixelId: "123456789012345",
      accessToken: "test-access-token",
      transport,
    });

    expect(result.status).toBe("verified");
    expect(transport.get).toHaveBeenCalledTimes(2);

    for (const call of vi.mocked(transport.get).mock.calls) {
      expect(call[0]).not.toContain("/events");
      expect(call[0]).toContain(META_GRAPH_API_VERSION);
    }
  });

  it("returns identifier_not_verified when pixel is inaccessible", async () => {
    const transport = createTransport({
      "/me?": { status: 200, body: { id: "meta-user-1" } },
      "/123456789012345?": { status: 404, body: { error: { message: "Not found" } } },
    });

    const result = await verifyMetaCredentials({
      pixelId: "123456789012345",
      accessToken: "test-access-token",
      transport,
    });

    expect(result.status).toBe("identifier_not_verified");
  });

  it("returns failed for invalid tokens", async () => {
    const transport = createTransport({
      "/me?": {
        status: 401,
        body: { error: { message: "Invalid OAuth access token." } },
      },
    });

    const result = await verifyMetaCredentials({
      pixelId: "123456789012345",
      accessToken: "bad-token",
      transport,
    });

    expect(result.status).toBe("failed");
    expect(result.message).not.toContain("bad-token");
  });

  it("orchestrates verification without exposing tokens", async () => {
    const transport = createTransport({
      "/me?": { status: 200, body: { id: "meta-user-1" } },
      "/123456789012345?": { status: 200, body: { id: "123456789012345" } },
    });

    mockLoadMetaConnectionForVerification.mockResolvedValue({
      storeConnectionId: "conn-1",
      storeId: "store-1",
      pixelId: "123456789012345",
      accessToken: "secret-token",
    });

    const result = await verifyMetaConnectionForUser({
      userId: "user-1",
      transport,
    });

    expect(result.status).toBe("verified");
    expect(mockPersistMetaVerificationResult).toHaveBeenCalledWith({
      storeConnectionId: "conn-1",
      result: { status: "verified" },
    });
    expect(JSON.stringify(result)).not.toContain("secret-token");
  });

  it("verify route returns safe verification state only", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth/session");
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: "user-1" } as never);

    mockLoadMetaConnectionForVerification.mockResolvedValue({
      storeConnectionId: "conn-1",
      storeId: "store-1",
      pixelId: "123456789012345",
      accessToken: "secret-token",
    });

    const response = await verifyPost();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.verificationStatus).toBe("verified");
    expect(JSON.stringify(body)).not.toContain("secret-token");
    expect(JSON.stringify(body)).not.toContain("access_token");
  });

  it("verify route maps missing connection to 404", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth/session");
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: "user-1" } as never);

    mockLoadMetaConnectionForVerification.mockResolvedValue(null);

    const response = await verifyPost();
    expect(response.status).toBe(404);
  });

  it("verify route maps store ownership errors to 500", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth/session");
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: "user-1" } as never);

    mockLoadMetaConnectionForVerification.mockRejectedValue(
      new MetaPersistenceError("Store not found."),
    );

    const response = await verifyPost();
    expect(response.status).toBe(500);
  });
});
