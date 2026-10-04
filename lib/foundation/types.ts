/** Whether an integration is a store, a service provider, or an advertising channel. */
export type IntegrationKind = "store" | "service_provider" | "advertising";

/** Identity and lifecycle of one integration a merchant can connect. */
export interface IntegrationProvider {
  id: string;
  kind: IntegrationKind;
  displayName: string;
  status: "active" | "reserved" | "coming_soon";
}

/** What a connected provider is allowed to do inside Onafirm. */
export type Capability =
  | "create_order"
  | "read_order"
  | "receive_status_webhook"
  | "send_conversion_event"
  | "receive_lead_status"
  | "product_mapping_required";

/** A merchant's link to one provider, including the capabilities that link grants. */
export interface Connection {
  id: string;
  ownerId: string;
  providerId: string;
  status: "connected" | "disconnected" | "pending";
  capabilities: Capability[];
  createdAt: string;
  updatedAt: string;
}

/** Who produced an order event. Manual and automated sources share this list. */
export type EventSource =
  | "manual"
  | "cod_network_seller"
  | "cod_network_affiliate"
  | "service_b"
  | "service_c";

/** The only order facts the router is allowed to act on. */
export type EventType = "ORDER_CONFIRMED" | "ORDER_DELIVERED" | "ORDER_CANCELLED";

/** One immutable fact about an order, independent of which provider produced it. */
export interface OrderEvent {
  id: string;
  ownerId: string;
  orderId: string;
  type: EventType;
  source: EventSource;
  occurredAt: string;
  payload: Record<string, unknown>;
}

/** An advertising channel the router may send a confirmed event to. */
export type AdvertisingDestination = "meta" | "tiktok" | "google";

/** The merchant's choice of which destinations receive a given event type. */
export interface RoutingRule {
  id: string;
  ownerId: string;
  eventType: EventType;
  destinations: AdvertisingDestination[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A link between an Onafirm product and that product's id inside one provider. */
export interface ProductMapping {
  id: string;
  ownerId: string;
  internalProductId: string;
  externalProviderId: string;
  externalProductId: string;
  status: "auto" | "manual" | "required";
  createdAt: string;
}

/** The merchant-owned product. External catalog ids live on ProductMapping, not here. */
export interface InternalProduct {
  id: string;
  ownerId: string;
  name: string;
  sku: string | null;
  variant: string | null;
}

/** The shape every future adapter must satisfy. TConfig is chosen by that adapter. */
export interface AdapterInterface<TConfig> {
  providerId: string;
  kind: IntegrationKind;
  capabilities: Capability[];
  isConfigured(config: TConfig | null): boolean;
}
