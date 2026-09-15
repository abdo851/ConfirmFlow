export enum InternalEventType {
  ORDER_CREATED = "ORDER_CREATED",
  ORDER_UPDATED = "ORDER_UPDATED",
  ORDER_CONFIRMED = "ORDER_CONFIRMED",
  ORDER_CANCELLED = "ORDER_CANCELLED",
  CONVERSION_CREATED = "CONVERSION_CREATED",
  CONVERSION_SENT = "CONVERSION_SENT",
}

export interface InternalEvent<TPayload = unknown> {
  id: string;
  type: InternalEventType;
  aggregateId: string;
  storeId?: string;
  payload: TPayload;
  occurredAt: Date;
  correlationId?: string;
}

export interface EventPublisher {
  publish(event: InternalEvent): Promise<void>;
}

export interface EventSubscriber {
  subscribedTypes: InternalEventType[];
  handle(event: InternalEvent): Promise<void>;
}
