import { registerAdapter } from "@/lib/foundation/registry";
import type { AdapterInterface } from "@/lib/foundation/types";
import type { CodeNetworkSellerConnectionConfig } from "./types";

export const codeNetworkSellerAdapter: AdapterInterface<CodeNetworkSellerConnectionConfig> = {
  providerId: "cod_network_seller",
  kind: "service_provider",
  capabilities: ["create_order", "read_order", "receive_status_webhook"],
  isConfigured(config) {
    return Boolean(config?.apiToken && config.webhookSecret);
  },
};

export function registerCodeNetworkSellerAdapter(): void {
  registerAdapter(codeNetworkSellerAdapter);
}
