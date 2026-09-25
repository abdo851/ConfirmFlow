# GA4 client_id fix

## 1. Root cause

`client_id` was `order.external_order_id`. For the test order that value is `18`. GA4 requires `<number>.<number>`. Relaxed validation accepted the hit and `/mp/collect` returned an empty success body, so Confirma marked it `sent`. Strict validation rejected it, and Realtime never showed it.

## 2. Fix applied

`client_id` is now a stable `<number>.<number>` derived from the order id:

- SHA-256 the order id
- Read bytes 0–7 and 8–15 as big-endian unsigned integers
- Take each modulo 2^31
- If a part is 0, use 1

The same order id always produces the same `client_id`.

`transaction_id` is still `external_order_id`.

Each purchase now also sends:

- `session_id`: current Unix time in seconds, as a string
- `engagement_time_msec`: `100`
- `debug_mode`: `1` only when `GOOGLE_GA4_DEBUG_MODE=1`

Normal deliveries do not set that env var, so they omit `debug_mode`. The test scripts set it for this run so the event can also show in DebugView.

## 3. New payload example

Measurement ID `G-LPR5JCJCSZ`. API secret not shown.

```json
{
  "client_id": "1018257972.1401861331",
  "events": [
    {
      "name": "purchase",
      "params": {
        "transaction_id": "18",
        "value": 23,
        "currency": "USD",
        "session_id": "1790355355",
        "engagement_time_msec": 100,
        "debug_mode": 1,
        "items": [
          {
            "item_id": "e5059e24-7f82-4cda-bffb-0271aaac4897",
            "item_name": "Order 18",
            "quantity": 1
          }
        ]
      }
    }
  ]
}
```

The live send rebuilds `session_id` at send time. This test was sent at `2026-09-25T16:55:58.496Z`, so that field is the Unix second of the send. `client_id` does not change.

## 4. Debug endpoint result

`POST https://www.google-analytics.com/debug/mp/collect` with `validation_behavior: "ENFORCE_RECOMMENDATIONS"`.

HTTP 200.

```json
{
  "validationMessages": []
}
```

## 5. Live send result

Order `e5059e24-7f82-4cda-bffb-0271aaac4897`.

The previous delivery row was already `sent`, so the test script set it back to `failed` and then called `processGooglePurchaseDelivery`. That sent a new hit to `/mp/collect`.

- Result: **sent**
- Attempts: 2
- `last_error`: empty
- `response_body`: empty (collect returns no body on success)
- Log: `google_delivery_success` at `2026-09-25T16:55:58.496Z`

This session cannot open the GA4 property, so the Realtime screen itself was not viewed here. The payload now passes strict validation, and the collect endpoint accepted the event. With `debug_mode: 1` on this test hit, it should show in DebugView and in Realtime within a few seconds of that timestamp.

## 6. Files modified

- `lib/integrations/google/capi/payload-builder.ts`

## Files created

- `scripts/test-google-event-v2.mjs`
- `scripts/verify-google-client-id.mjs`
- `GOOGLE_GA4_FIX_REPORT.md`

## 7. Tests

`npm run typecheck` passed. `npm run test`: **326/326**.

## 8. Status

uncommitted, awaiting approval

## 9. How to verify in GA4

Open the property for `G-LPR5JCJCSZ` within a few minutes of `18:55` local time (`16:55` UTC).

- Reports → Realtime → Event count by Event name. Look for `purchase`.
- Admin → DebugView. This test event included `debug_mode: 1`.

`client_id` to look for: `1018257972.1401861331`. `transaction_id`: `18`.
