export { META_GRAPH_API_VERSION } from "./constants";
export {
  MetaCapiClient,
  buildMetaCapiEventsUrl,
  buildMetaCapiPayload,
  hashConversionUserDataForMeta,
  hashMetaEmail,
  hashMetaPhone,
  normalizeMetaEmail,
  normalizeMetaPhone,
  type MetaCapiRequestPayload,
  type MetaCapiTransport,
} from "./capi";
export { getMetaEnv, type MetaEnv } from "./env";
export {
  MetaPersistenceError,
  assertPixelAvailableForUser,
  disconnectMetaConnectionForUser,
  getMetaAccessTokenForUser,
  getMetaConnectionStateForUser,
  loadMetaConnectionForVerification,
  persistMetaConnectionForUser,
  persistMetaVerificationResult,
} from "./persistence";
export { processMetaPurchaseDelivery } from "./delivery/deliver-purchase";
export type {
  MetaConversionDeliveryStatus,
  MetaPurchaseDeliveryOutcome,
  MetaPurchaseDeliveryOutcomeStatus,
} from "./delivery/types";
export { verifyMetaConnectionForUser } from "./verification/verify-connection";
export { verifyMetaCredentials } from "./verification/verify-credentials";
export type {
  MetaCredentialVerificationResult,
  MetaGraphTransport,
  MetaVerificationStatus,
} from "./verification/types";
export {
  clearMetaConnection,
  getMetaConnectionPublicState,
} from "./session";
export type { MetaConnectionPublicState } from "./types";
export {
  maskPixelId,
  metaConnectionInputSchema,
  parseMetaConnectionInput,
  type MetaConnectionInput,
} from "./validation";
