import { describe, expect, it, vi } from "vitest";
import {
  findConfirmaOrderCreatedWebhook,
  registerYouCanOrderCreatedWebhook,
} from "@/lib/integrations/youcan/webhooks/register";

describe("YouCan webhook registration", () => {
  it("returns already_registered when webhook URL already exists", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: "hook-1",
            event: "order.created",
            target_url: "https://app.example.com/api/integrations/youcan/webhooks",
          },
        ],
      });

    const result = await registerYouCanOrderCreatedWebhook(
      {
        accessToken: "token",
        webhookUrl:
          "https://app.example.com/api/integrations/youcan/webhooks",
      },
      fetchMock,
    );

    expect(result.action).toBe("already_registered");
    expect(result.webhookId).toBe("hook-1");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("creates webhook subscription when missing", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "hook-new" }),
      });

    const result = await registerYouCanOrderCreatedWebhook(
      {
        accessToken: "token",
        webhookUrl:
          "https://app.example.com/api/integrations/youcan/webhooks",
      },
      fetchMock,
    );

    expect(result.action).toBe("created");
    expect(result.webhookId).toBe("hook-new");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("finds owned order.created webhook by event and URL", () => {
    const match = findConfirmaOrderCreatedWebhook(
      [
        {
          id: "hook-1",
          event: "order.created",
          target_url: "https://app.example.com/api/integrations/youcan/webhooks",
        },
      ],
      "https://app.example.com/api/integrations/youcan/webhooks",
    );

    expect(match?.id).toBe("hook-1");
  });
});
