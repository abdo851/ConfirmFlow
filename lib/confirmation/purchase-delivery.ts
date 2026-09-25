import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { dispatchGooglePurchaseDelivery } from "@/lib/integrations/google/delivery/deliver-purchase";
import type { MetaCapiTransport } from "@/lib/integrations/meta/capi/client";
import { processMetaPurchaseDelivery } from "@/lib/integrations/meta/delivery/deliver-purchase";
import type { MetaPurchaseDeliveryOutcome } from "@/lib/integrations/meta/delivery/types";
import { dispatchTikTokPurchaseDelivery } from "@/lib/integrations/tiktok/delivery/deliver-purchase";

export async function dispatchPurchaseDeliveryAfterConfirmation(input: {
  orderId: string;
  userId: string;
  db?: SupabaseClient;
  transport?: MetaCapiTransport;
  now?: number;
}): Promise<MetaPurchaseDeliveryOutcome | null> {
  const metaResult = await processMetaPurchaseDelivery(input);

  try {
    await dispatchTikTokPurchaseDelivery(input.orderId);
  } catch {
    // TikTok delivery is independent. A failure must not block Meta.
  }

  try {
    await dispatchGooglePurchaseDelivery(input.orderId);
  } catch {
    // Google delivery is independent. A failure must not block Meta.
  }

  return metaResult;
}
