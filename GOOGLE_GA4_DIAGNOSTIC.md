# GA4 diagnostic

## Implementation

Confirma sends GA4 purchases with `POST` and `Content-Type: application/json`.

- Live URL: `https://www.google-analytics.com/mp/collect?measurement_id=...&api_secret=...`
- Debug URL, only when `debug: true` or `GOOGLE_GA4_DEBUG=true`: `https://www.google-analytics.com/debug/mp/collect`
- Body: `{ client_id, events: [{ name: "purchase", params }] }`
- `client_id` is two positive integers joined by a dot, derived from the order id
- `params` include `transaction_id`, `value`, `currency`, `session_id`, `engagement_time_msec`, `items`, and `debug_mode` only when `GOOGLE_GA4_DEBUG_MODE=1`
- The client aborts after 10 seconds. A network failure returns status `0` and `{ message: "GA4 request failed." }` instead of throwing. Any HTTP 200–299, including an empty 204, is treated as sent.

The database has no `measurement_id` or `encrypted_api_secret` columns. The measurement ID is stored in `google_connections.conversion_id`. The API secret is stored in `google_connection_secrets.encrypted_access_token`.

## 1. Measurement ID

`G-LPR5JCJCSZ`

Connection `a9b06da0-e93d-4992-9958-2a8fa12118c0`, verification status `verified`.

## 2. API secret length

Decrypted secret length: **22**. Encrypted value length: **73**. The secret is not printed.

## 3. `/mp/collect` response

HTTP **204**. Body empty. `content-length: 0`. Server: `Golfe2`.

Headers:

- `alt-svc`: `h3=":443"; ma=2592000,h3-29=":443"; ma=2592000`
- `cache-control`: `no-cache, no-store, must-revalidate`
- `content-length`: `0`
- `content-type`: `text/plain`
- `content-security-policy-report-only`: present
- `cross-origin-opener-policy-report-only`: present
- `cross-origin-resource-policy`: `cross-origin`
- `date`: `Sat, 26 Sep 2026 14:30:36 GMT`
- `expires`: `Fri, 01 Jan 1990 00:00:00 GMT`
- `last-modified`: `Sun, 17 May 1998 03:00:00 GMT`
- `pragma`: `no-cache`
- `report-to`: present
- `server`: `Golfe2`

No GA4 error header.

## 4. `/debug/mp/collect` response

HTTP **200**. Server: `MPVS`.

```json
{
  "validationMessages": []
}
```

The payload was the same diagnostic event plus `validation_behavior: "ENFORCE_RECOMMENDATIONS"`.

A second `/mp/collect` with the same payload returned **204** again. Header names were the same. None suggested a credential or validation problem.

Whether the API secret is still active cannot be checked. Google does not return a distinct error for a revoked secret.

## 5. Analysis

The payload shape is valid. Strict validation returned no messages, and collect returned the normal empty 204. That response only means Google received a parseable POST. It does not mean the hit was written to the property.

Possible causes, in order:

1. **API secret revoked, or measurement ID not the stream being viewed.** The debug server does not validate `api_secret`. A wrong or revoked secret still returns 204 and an empty `validationMessages` array. This is the most likely reason a structurally valid event never appears in Realtime or DebugView.
2. **Looking at a different GA4 property.** `G-LPR5JCJCSZ` must be the Measurement ID of the web stream open in Realtime.
3. **DebugView needs `debug_mode`.** This diagnostic event did not set `debug_mode`, so it will not show in DebugView even if it is recorded. Realtime does not have that requirement. The earlier purchase test did set `debug_mode: 1` and still was not seen, which points back to the secret or the property, not the payload.
4. **No web data stream, or a data filter** on the property can drop server hits. Less likely than a credential mismatch, because the protocol itself accepted the body.
5. **De-duplication** does not explain this. `client_id` `9999999999.9999999999` and event name `diag_test` are new. GA4 does not drop a new event name because some other client id existed.
6. **Endpoint outage** is unlikely. Both collect (`Golfe2`) and debug (`MPVS`) answered normally.

## 6. Recommended fix (not applied)

1. In GA4 Admin → Data streams, confirm the web stream ID is exactly `G-LPR5JCJCSZ`.
2. Create a new Measurement Protocol API secret on that stream. Do not reuse one that may have been copied or revoked.
3. Save it through the Google connect form so it is encrypted again. Do not put it in `.env.local`.
4. Send one purchase with `debug_mode: 1` and open Admin → DebugView for that same property within a minute. Also check Reports → Realtime for `diag_test` from this run (`client_id` `9999999999.9999999999`).
5. Keep treating HTTP 204 as “received”, not “recorded”.

## 7. Status

diagnostic only, nothing changed

Typecheck passed. Tests: 326/326. The diagnostic script and this report are untracked. The UI commit `0ac0b48` is on `origin/master`.
