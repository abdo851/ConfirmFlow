import { describe, expect, it } from "vitest";
import {
  buildMetaRelinkPlan,
  isCopyableEncryptedToken,
} from "@/lib/integrations/meta/relink";

const ENCRYPTED_TOKEN = "v1:iv-value:tag-value:ciphertext-value";

describe("Meta store re-link", () => {
  it("attaches the existing Meta connection to the new store without re-encrypting", () => {
    const plan = buildMetaRelinkPlan({
      source: {
        storeConnectionId: "756f3d7e-4900-4472-bb9f-ee66c2d9fd1e",
        pixelId: "4444157855871429",
        encryptedAccessToken: ENCRYPTED_TOKEN,
      },
      newStoreId: "9e1d1728-8146-447f-b8cd-51b4bb5d74ea",
      now: "2026-09-24T18:00:00.000Z",
    });

    expect(plan.deleteStoreConnectionId).toBe(
      "756f3d7e-4900-4472-bb9f-ee66c2d9fd1e",
    );
    expect(plan.storeConnection).toEqual({
      store_id: "9e1d1728-8146-447f-b8cd-51b4bb5d74ea",
      connection_type: "marketing",
      provider: "meta",
      status: "active",
    });
    expect(plan.metaConnection).toEqual({
      pixel_id: "4444157855871429",
      verification_status: "verified",
      verified_at: "2026-09-24T18:00:00.000Z",
      connected_at: "2026-09-24T18:00:00.000Z",
      error_message: null,
    });
    expect(plan.secret.encrypted_access_token).toBe(ENCRYPTED_TOKEN);
  });

  it("refuses a token that is not already in the encrypted format", () => {
    expect(isCopyableEncryptedToken("plaintext-token")).toBe(false);
    expect(() =>
      buildMetaRelinkPlan({
        source: {
          storeConnectionId: "old-connection",
          pixelId: "4444157855871429",
          encryptedAccessToken: "plaintext-token",
        },
        newStoreId: "9e1d1728-8146-447f-b8cd-51b4bb5d74ea",
        now: "2026-09-24T18:00:00.000Z",
      }),
    ).toThrow("encrypted_token_cannot_be_copied");
  });
});
