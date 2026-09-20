export { logger, type LogContext, type LogEntry, type LogLevel } from "./logger";
import { logger } from "./logger";

/**
 * Example usage (not wired into production routes yet):
 *
 * import { logger } from "@/lib/logging";
 * logger.info("Webhook accepted", { provider: "youcan", topic: "orders/create" });
 */
export function logInfrastructureReady(): void {
  logger.debug("Confirma logging utility initialized");
}
