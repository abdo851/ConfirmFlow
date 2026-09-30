export type CustomCarrierPublic = {
  id: string;
  name: string;
  connectionType: "webhook" | "api";
  status: "active" | "inactive";
  createdAt: string;
  webhookUrl: string | null;
  apiBaseUrl: string | null;
  apiAuthType: "bearer" | "x-api-key" | "basic" | null;
  createShipmentPath: string | null;
  hasSigningSecret: boolean;
  hasApiKey: boolean;
};

export type CustomCarrierRow = {
  id: string;
  owner_id: string;
  name: string;
  connection_type: string;
  status: string;
  created_at: string;
  webhook_url: string | null;
  api_base_url: string | null;
  api_auth_type: string | null;
  create_shipment_path: string | null;
  hmac_secret_encrypted: string | null;
  api_key_encrypted: string | null;
};

export function toPublicCarrier(row: CustomCarrierRow): CustomCarrierPublic {
  return {
    id: row.id,
    name: row.name,
    connectionType: row.connection_type === "api" ? "api" : "webhook",
    status: row.status === "inactive" ? "inactive" : "active",
    createdAt: row.created_at,
    webhookUrl: row.webhook_url,
    apiBaseUrl: row.api_base_url,
    apiAuthType:
      row.api_auth_type === "bearer" || row.api_auth_type === "x-api-key" || row.api_auth_type === "basic"
        ? row.api_auth_type
        : null,
    createShipmentPath: row.create_shipment_path,
    hasSigningSecret: Boolean(row.hmac_secret_encrypted),
    hasApiKey: Boolean(row.api_key_encrypted),
  };
}
