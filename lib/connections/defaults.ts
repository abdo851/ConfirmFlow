import type { ConnectionState } from "./types";

/**
 * Default application connection states.
 * All integrations remain disconnected until future milestones implement real connections.
 */
export const defaultConnectionStates: ConnectionState[] = [
  {
    type: "store",
    status: "not_connected",
    label: "Store",
    description:
      "Your e-commerce platform (Shopify, WooCommerce, or YouCan).",
  },
  {
    type: "meta",
    status: "not_connected",
    label: "Meta",
    description: "Meta Pixel and Conversions API for verified purchase events.",
  },
  {
    type: "confirmation",
    status: "not_connected",
    label: "Confirmation",
    description: "How orders are confirmed before conversions are sent.",
  },
];

export function getDefaultConnectionState(
  type: ConnectionState["type"],
): ConnectionState {
  const connection = defaultConnectionStates.find((item) => item.type === type);
  if (!connection) {
    throw new Error(`Unknown connection type: ${type}`);
  }
  return connection;
}
