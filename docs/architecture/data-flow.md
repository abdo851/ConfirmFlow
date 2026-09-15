# Data Flow

## Inbound Store Webhook (Future)

1. HTTP POST arrives at `app/api/webhooks/...` (future route).
2. Generic `processWebhook()` verifies signature via provider `WebhookVerifier`.
3. Idempotency check against `order_events.idempotency_key`.
4. `StoreAdapter.normalizeOrder()` produces internal order shape.
5. Order persisted; `ORDER_CREATED` internal event emitted.

## Confirmation Flow (Future)

1. `ConfirmationAdapter.sendConfirmation()` dispatched.
2. Customer responds via provider or webhook.
3. `ConfirmationAdapter.handleInboundWebhook()` parses result.
4. Order `confirmation_status` updated.
5. `ORDER_CONFIRMED` or `ORDER_CANCELLED` event emitted.

## Conversion Flow (Future)

1. Conversion Engine receives `ORDER_CONFIRMED`.
2. `evaluate()` decides whether to send conversion.
3. `dispatch()` calls appropriate `MarketingAdapter`.
4. Result logged in `conversion_events` with idempotency key.
5. `CONVERSION_SENT` event emitted.

## M0 Status

Only types, interfaces, and the generic webhook pipeline scaffold exist. No live data flow is connected.
