import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MetaCapiTransport } from "@/lib/integrations/meta/capi/client";
import { processMetaPurchaseDelivery } from "@/lib/integrations/meta/delivery/deliver-purchase";
import type { MetaPurchaseDeliveryOutcome } from "@/lib/integrations/meta/delivery/types";

export async function dispatchPurchaseDeliveryAfterConfirmation(input: {
  orderId: string;
  userId: string;
  db?: SupabaseClient;
  transport?: MetaCapiTransport;
  now?: number;
}): Promise<MetaPurchaseDeliveryOutcome | null> {
  return processMetaPurchaseDelivery(input);
}
