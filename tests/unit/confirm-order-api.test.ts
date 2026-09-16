import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/orders/[id]/confirm/route";

const ORDER_ID = "11111111-1111-1111-1111-111111111111";

const mockConfirmOrder = vi.fn();
const mockDispatchPurchaseDeliveryAfterConfirmation = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/confirmation", () => ({
  confirmOrder: (...args: unknown[]) => mockConfirmOrder(...args),
  dispatchPurchaseDeliveryAfterConfirmation: (...args: unknown[]) =>
    mockDispatchPurchaseDeliveryAfterConfirmation(...args),
}));

describe("POST /api/orders/[id]/confirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDispatchPurchaseDeliveryAfterConfirmation.mockResolvedValue(null);
  });

  it("rejects unauthenticated confirmation requests", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth/session");
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: ORDER_ID }),
    });

    expect(response.status).toBe(401);
  });

  it("returns confirmed for a successful merchant confirmation", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth/session");

    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      id: "user_1",
    } as never);
    mockConfirmOrder.mockResolvedValue({
      status: "confirmed",
      orderId: ORDER_ID,
      confirmedAt: "2024-06-02T10:00:00.000Z",
    });
    mockDispatchPurchaseDeliveryAfterConfirmation.mockResolvedValue({
      status: "sent",
      eventId: `purchase:${ORDER_ID}`,
    });

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: ORDER_ID }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "confirmed",
      orderId: ORDER_ID,
      confirmedAt: "2024-06-02T10:00:00.000Z",
      metaPurchaseDelivery: {
        status: "sent",
        eventId: `purchase:${ORDER_ID}`,
      },
    });
    expect(mockConfirmOrder).toHaveBeenCalledWith({
      orderId: ORDER_ID,
      actor: { userId: "user_1" },
    });
    expect(mockDispatchPurchaseDeliveryAfterConfirmation).toHaveBeenCalledWith({
      orderId: ORDER_ID,
      userId: "user_1",
      createIfMissing: true,
    });
  });

  it("does not accept confirmation_status or confirmed_at from the client body", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth/session");

    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      id: "user_1",
    } as never);
    mockConfirmOrder.mockResolvedValue({
      status: "confirmed",
      orderId: ORDER_ID,
      confirmedAt: "2024-06-02T10:00:00.000Z",
    });

    await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          confirmation_status: "confirmed",
          confirmed_at: "2099-01-01T00:00:00.000Z",
          owner_id: "other-user",
        }),
      }),
      {
        params: Promise.resolve({ id: ORDER_ID }),
      },
    );

    expect(mockConfirmOrder).toHaveBeenCalledWith({
      orderId: ORDER_ID,
      actor: { userId: "user_1" },
    });
  });
});
