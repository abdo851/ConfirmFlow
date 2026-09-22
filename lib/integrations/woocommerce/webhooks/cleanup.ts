import { logger } from "@/lib/logging/logger";
import { getWooCommerceWebhookCleanupTargets } from "../persistence";
import { unregisterWebhooks } from "./unregister";

export async function cleanupWooCommerceWebhooksForUser(
  userId: string,
): Promise<void> {
  try {
    const targets = await getWooCommerceWebhookCleanupTargets(userId);
    for (const target of targets) {
      await unregisterWebhooks(target);
    }
  } catch (error) {
    logger.error("woocommerce_webhook_cleanup_failed", {
      message: error instanceof Error ? error.message : "unknown",
      userId,
    });
  }
}
