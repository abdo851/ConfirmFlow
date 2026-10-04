import { describe, expect, it, vi } from "vitest";
import {
  ColiixClientError,
  createShipment,
  getLabel,
  listRates,
  trackParcel,
} from "@/lib/integrations/shipping/coliix/client";

const BASE = "https://api.example.test/v1";

function mockFetch(status = 200): typeof fetch {
  return vi.fn(async () =>
    new Response(JSON.stringify({ ok: true }), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  ) as typeof fetch;
}

describe("Coliix client placeholders", () => {
  it("calls placeholder shipment, track, label, and rates paths", async () => {
    const fetchImpl = mockFetch();
    const apiKey = "placeholder-key";

    await createShipment(apiKey, { name: "A", phone: "1", address: "Street" }, fetchImpl, BASE);
    await trackParcel(apiKey, "parcel 1", fetchImpl, BASE);
    await getLabel(apiKey, "parcel 1", fetchImpl, BASE);
    await listRates(apiKey, fetchImpl, BASE);

    const calls = vi.mocked(fetchImpl).mock.calls;
    expect(calls.map((call) => String(call[0]))).toEqual([
      `${BASE}/shipments`,
      `${BASE}/shipments/parcel%201`,
      `${BASE}/shipments/parcel%201/label`,
      `${BASE}/rates`,
    ]);
    const firstInit = calls[0]?.[1] as RequestInit;
    expect(new Headers(firstInit.headers).get("X-API-Key")).toBe(apiKey);
  });

  it("does not call the network when the base URL is missing", async () => {
    const previous = process.env.COLIIX_API_BASE_URL;
    delete process.env.COLIIX_API_BASE_URL;
    const fetchImpl = mockFetch();

    await expect(listRates("placeholder-key", fetchImpl)).rejects.toBeInstanceOf(ColiixClientError);
    expect(fetchImpl).not.toHaveBeenCalled();

    if (previous === undefined) {
      delete process.env.COLIIX_API_BASE_URL;
    } else {
      process.env.COLIIX_API_BASE_URL = previous;
    }
  });
});
