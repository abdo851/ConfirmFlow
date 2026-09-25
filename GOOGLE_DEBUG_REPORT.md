# GA4 Realtime debug

The purchase was marked `sent` in Confirma. Google Analytics did not show it in Realtime because the `client_id` was the WooCommerce order number `18`, which is not a valid GA4 client id. The production collect endpoint still returned success and an empty body.

## 1. Payload builder

`buildGA4Purchase` in `lib/integrations/google/capi/payload-builder.ts` returns:

```json
{
  "client_id": "<external_order_id, or a hash fallback>",
  "events": [
    {
      "name": "purchase",
      "params": {
        "transaction_id": "<external_order_id, or event_id>",
        "value": "<total_amount_minor / 100>",
        "currency": "<order.currency, uppercased>",
        "items": [
          {
            "item_id": "<order.id>",
            "item_name": "Order <order_number, or transaction_id>",
            "quantity": 1
          }
        ]
      }
    }
  ]
}
```

`client_id` derivation:

- If `order.external_order_id` is non-empty after trim, that string is used as `client_id`.
- Otherwise `stableClientId` SHA-256s `order.id` (or `event_id`) and returns `hash[0:10].hash[10:20]` (hex, not decimal).

For order `e5059e24-7f82-4cda-bffb-0271aaac4897`, `external_order_id` is `18`, so the hash fallback was not used.

`params` keys actually sent: `transaction_id`, `value`, `currency`, `items`. There is no `session_id`, `engagement_time_msec`, or `debug_mode`.

## 2. HTTP client

`sendGA4Event` in `lib/integrations/google/capi/client.ts`:

- URL: `https://www.google-analytics.com/mp/collect?measurement_id=...&api_secret=...`
- Debug URL, only when `debug: true` or `GOOGLE_GA4_DEBUG=true`: `https://www.google-analytics.com/debug/mp/collect` with the same query params
- Method: `POST`
- Headers: `Content-Type: application/json` only
- Body: `JSON.stringify(payload)`
- Timeout: 10 seconds
- `validation_behavior` is not set, so Google uses `RELAXED`

Success and failure logging in `deliver-purchase.ts`:

- Success: `logger.info("google_delivery_success", { order_id, event_id })`. The URL, payload, HTTP status, and body are not logged.
- Failure: `logger.error("google_delivery_failed", { order_id, status })`. The body is not logged.

`googleResponseAccepted` treats every HTTP 200–299 as success, including an empty 204.

## 3. Delivery row

`processGooglePurchaseDelivery`:

1. Inserts `google_conversion_deliveries` with `event_type: "Purchase"`, `event_id: google:purchase:{orderId}`, `status: "pending"`. A unique violation (`23505`) is treated as the existing row.
2. If status is already `sent`, it returns without sending again.
3. Claims the row (`status: "sending"`, `attempts + 1`, `last_attempted_at`).
4. On HTTP 2xx, updates `status: "sent"`, `sent_at`, `last_error: null`, and `response_body`.
5. On any other result, sets `status: "failed"`, `last_error: "GA4 Purchase delivery failed."`, and `response_body`.

`response_body` is `""` when the HTTP body is null or empty. Otherwise it is the body text, with `api_secret=` and `Bearer` redacted, truncated to 2000 characters. The HTTP status code is not stored.

## 4. Stored delivery rows

Only one row exists.

| field | value |
| --- | --- |
| id | `2cf52fd3-fe26-42c4-9b81-45c95f5550fb` |
| order_id | `e5059e24-7f82-4cda-bffb-0271aaac4897` |
| event_id | `google:purchase:e5059e24-7f82-4cda-bffb-0271aaac4897` |
| status | `sent` |
| attempts | `1` |
| sent_at | `2026-09-25T16:36:58.348+00:00` |
| last_error | null |
| response_body | empty string |
| created_at | `2026-09-25T16:36:59.390758+00:00` |

Order fields used to build that payload: `external_order_id` `18`, `order_number` `18`, `total_amount_minor` `2300`, `currency` `USD`.

## 5. What was sent

Production request (the one marked `sent`):

`POST https://www.google-analytics.com/mp/collect?measurement_id=G-LPR5JCJCSZ&api_secret=...`

```json
{
  "client_id": "18",
  "events": [
    {
      "name": "purchase",
      "params": {
        "transaction_id": "18",
        "value": 23,
        "currency": "USD",
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

## 6. What GA4 debug returned

Same payload, `POST https://www.google-analytics.com/debug/mp/collect`, default relaxed validation:

```json
{
  "validationMessages": []
}
```

HTTP 200.

Same payload plus `validation_behavior: "ENFORCE_RECOMMENDATIONS"`:

```json
{
  "validationMessages": [
    {
      "fieldPath": "client_id",
      "description": "client_id [18] has invalid format. It should be in <number>.<number> format.",
      "validationCode": "VALUE_INVALID"
    }
  ]
}
```

HTTP 200.

The debug endpoint does not write events into Realtime. The original send used `/mp/collect`.

## 7. Why Realtime is empty

Google accepted the HTTP request and returned no body. Confirma stored that as `sent` and `response_body` empty. That does not mean the hit was processed.

Google's Measurement Protocol reference says a 2xx only means the request was received, and that a malformed or unprocessed payload still does not return an error. Relaxed validation, which this client uses, does not reject a bad `client_id`. Strict validation does: `18` is not `<number>.<number>`.

`client_id` must be two positive numbers joined by a period (the gtag client id), or the full client-id cookie. This payload used the WooCommerce order number because `external_order_id` was present.

The same payload also omits `session_id` and `engagement_time_msec`. Google's reference says events without those parameters may not be fully reflected in Realtime user counts. The invalid `client_id` is the failure strict validation reported.

## 8. Recommended fix (not applied)

1. Stop using `external_order_id` as `client_id`. Keep it as `transaction_id` only.
2. Set `client_id` to two positive decimal integers joined by `.`, stable per order. The current hex `stableClientId` fallback can still contain `a`–`f`, which is not `<number>.<number>`.
3. Add `engagement_time_msec` (a positive number) and a numeric `session_id` on the purchase params so the event can show in Realtime.
4. For a test hit, also set `debug_mode: 1` and look in DebugView. Do not use `/debug/mp/collect` to check Realtime; that URL only validates.
5. Do not treat HTTP 204 as processed. Optionally validate with `ENFORCE_RECOMMENDATIONS` before marking the row `sent`.

No existing source file was changed. The only new files are `scripts/test-google-debug.mjs` and this report. Nothing was committed.
