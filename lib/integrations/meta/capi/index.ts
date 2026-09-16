export { META_GRAPH_API_VERSION, buildMetaCapiEventsUrl } from "./config";
export { MetaCapiClient, type MetaCapiTransport } from "./client";
export {
  hashConversionUserDataForMeta,
  hashMetaEmail,
  hashMetaPhone,
  normalizeMetaEmail,
  normalizeMetaPhone,
} from "./hash-user-data";
export {
  buildMetaCapiPayload,
  mapActionSourceToMeta,
} from "./payload-builder";
export type {
  MetaCapiCustomDataPayload,
  MetaCapiEventPayload,
  MetaCapiRequestPayload,
  MetaCapiSendResult,
  MetaCapiUserDataPayload,
} from "./types";
