import type { ConversionEvent } from "@/lib/conversions/types";
import { validateConversionEvent } from "@/lib/conversions/validation";
import { minorUnitsToMajorAmount } from "@/lib/orders/money";
import { hashConversionUserDataForMeta } from "./hash-user-data";
import type { MetaCapiEventPayload, MetaCapiRequestPayload } from "./types";

const SERVER_ACTION_SOURCE_MAP = {
  server: "website",
} as const;

export function mapActionSourceToMeta(
  actionSource: ConversionEvent["actionSource"],
): MetaCapiEventPayload["action_source"] {
  return SERVER_ACTION_SOURCE_MAP[actionSource];
}

export function buildMetaCapiPayload(
  event: ConversionEvent,
): MetaCapiRequestPayload {
  const validated = validateConversionEvent(event);
  if (!validated.ok) {
    throw new Error(validated.error);
  }

  const { value: conversionEvent } = validated;

  const userData = hashConversionUserDataForMeta(conversionEvent.userData);
  const value = minorUnitsToMajorAmount(
    conversionEvent.customData.valueMinor,
    conversionEvent.customData.currency,
  );

  const payload: MetaCapiEventPayload = {
    event_name: "Purchase",
    event_time: conversionEvent.eventTime,
    event_id: conversionEvent.eventId,
    action_source: mapActionSourceToMeta(conversionEvent.actionSource),
    user_data: userData,
    custom_data: {
      currency: conversionEvent.customData.currency,
      value,
    },
  };

  return { data: [payload] };
}
