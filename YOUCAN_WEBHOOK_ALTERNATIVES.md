# YouCan webhook alternatives

Read-only research. No source files were changed. Official pages checked on 27 Sep 2026:

- https://developer.youcan.shop/store-admin/resthooks/subscribe.html
- https://developer.youcan.shop/store-admin/resthooks/list.html
- https://developer.youcan.shop/store-admin/resthooks/overview
- https://developer.youcan.shop/apps/webhooks
- https://developer.youcan.shop/apps/embedded_app/nuxt-app-dev
- https://developer.youcan.shop/store-admin/orders/listing

## 1. Summary

YouCan supports two webhook setups. Confirma already uses the Store Admin REST Hooks API, and that registration succeeded for `elitemart1`. `youcan.app.json` is the separate Apps-platform manifest. The Partners Dashboard empty state ("Declare webhooks in youcan.app.json…") is that manifest's monitor, not proof that the API subscription failed. Polling `GET /orders` is a viable backup. The recommended path is to keep the API subscription and prove delivery with a test order.

## 2. Answers

### Q1. Does YouCan support webhook registration via API?

Yes.

| | |
| --- | --- |
| Subscribe | `POST https://api.youcan.shop/resthooks/subscribe` |
| Scope | `edit-rest-hooks` |
| List | `GET https://api.youcan.shop/resthooks/list` |
| List scope | `read-rest-hooks` |
| Unsubscribe | `POST https://api.youcan.shop/resthooks/unsubscribe/{id}` |

Subscribe body:

```json
{
  "event": "order.created",
  "target_url": "https://yourdomain.com/webhooks/order.created"
}
```

`target_url` must be public `https`. Localhost and private networks are rejected. A matching event and address returns the existing id instead of a duplicate. Success body is `{ "id": "<uuid>" }`.

Current event names include `order.created`, `order.updated`, `order.paid`, `product.inventory.low`, `upsell.accepted`, `app.uninstalled`, and `app.charge_updated`. `order.create` is a deprecated alias. Confirma correctly sends `order.created`.

Limit on the current subscribe page: at most 7 active subscriptions per event per OAuth client per store. A `429` means that cap was hit. Older cached copies of the same page still say "max 3" and `order.create`. Treat the current page as authoritative.

Deliveries are `POST` JSON:

```json
{
  "event_name": "order.created",
  "event_happened_at": "2026-08-08T21:30:00.000000Z",
  "data": {}
}
```

Headers: `X-YOUCAN-SIGNATURE` (HMAC-SHA256 of the raw body, key = OAuth client secret), `X-YOUCAN-TOPIC`, `X-YOUCAN-DELIVERY-ID`, `X-YOUCAN-API-VERSION` (`v1`). Respond `2xx` quickly. `5xx` retries up to 5 times over about 4 hours. `4xx` is not retried. `410` deactivates the subscription.

### Q2. What is `youcan.app.json`?

It is the config-as-code file for a YouCan **App** built with the YouCan CLI (`pnpm create @youcan/app`). It is not required for REST Hooks API subscriptions.

Schema used by the official Apps docs:

```json
{
  "name": "my-app",
  "app_url": "https://myapp.example.com",
  "webhooks": [
    { "topic": "order.created", "address": "/webhooks/order.created" },
    { "topic": "app.uninstalled", "address": "/webhooks/app.uninstalled" }
  ]
}
```

- `topic` is an event name.
- `address` may be relative to `app_url`, or an absolute `https` URL.
- Up to 20 declared webhooks. The same 7-active-per-topic-per-store cap still applies.

Deploy:

- `youcan app dev` subscribes the development store to the declared topics and points addresses at the CLI tunnel. Those subscriptions are removed when the dev session ends.
- `youcan app deploy` creates a version and releases it. The release applies the declaration to every installed store. New installs subscribe automatically. A release also reactivates declared subscriptions that were deactivated after failures.

Putting the file in the Confirma repo does nothing by itself. It takes effect only after the YouCan CLI links that app and a version is released. That is a republish.

The Partners Dashboard Webhooks tab is the monitor for this app declaration. Its empty copy matches what you saw. The same docs also say an app may subscribe at runtime through the REST Hooks API when the static declaration does not cover the case. Whether that tab lists API-created subscriptions before any `webhooks` array exists is **uncertain**. The empty message is the declarative empty state.

### Q3. Is polling an alternative?

Yes. `GET https://api.youcan.shop/orders` with scope `read-orders`, which the current OAuth scopes already request.

Useful query shape from the listing and query-filter docs:

`GET https://api.youcan.shop/orders?sort_field=created_at&sort_order=desc&limit=50&page=1`

The response includes `meta.pagination` (`total`, `per_page`, `current_page`, `total_pages`, `links.next`).

A published numeric rate limit for this endpoint was **not found**. Mark the limit as **uncertain**. Subscription `429`s are a per-event cap, not an orders-list quota.

YouCan does not publish a recommended poll interval. An engineering default, not an official interval, is 60 seconds per connected store, with backoff if a `429` appears.

### Q4. What is the current state of the webhook we registered?

It is registered.

Dev log for store `elitemart1`, after the scoped reconnect:

- `GET https://api.youcan.shop/resthooks/list` → `200`, body `[]`
- `POST https://api.youcan.shop/resthooks/subscribe` → `200`, body `{ id: "cc3b5f58-7912-4bb9-bc1b-a1b55653b5a1" }`
- `youcan_webhook_registration_success`
- Callback redirected to `/ar/onboarding/store?youcan=connected`

The id is not stored in the database. It exists only in that log and in YouCan's subscription list.

Shortly afterward the dev server logged `POST /api/integrations/youcan/webhooks 200`. Confirma returns 200 only after a valid `X-YOUCAN-SIGNATURE`, a store id in the body, a known store, and a successful persist (or a duplicate). Rejected signatures return 401. So at least one signed delivery was accepted. The access log does not print the topic or order id, so which order it was is **uncertain** without opening `/ar/dashboard/orders`.

The Partners page can still show 0 deliveries because that tab is the `youcan.app.json` monitor. It is not the REST Hooks list.

How to verify:

1. `GET https://api.youcan.shop/resthooks/list` with the store token and `read-rest-hooks`. Expect `event: "order.created"` and `target_url` ending in `/api/integrations/youcan/webhooks`.
2. Place a COD test order on `elitemart1`.
3. Confirm `POST /api/integrations/youcan/webhooks` returns 200 and the order appears in Confirma.
4. Do not treat the Partners Webhooks tab as the source of truth until `youcan.app.json` is deployed.

The target URL is `{NEXT_PUBLIC_APP_URL}/api/integrations/youcan/webhooks`. If the ngrok host changes, YouCan keeps posting to the old URL until subscribe runs again.

### Q5. Recommended path

| | Option A — `youcan.app.json` | Option B — polling | Option C — keep REST Hooks API |
| --- | --- | --- | --- |
| Effort | High. Confirma is not a YouCan CLI app. Needs CLI link, manifest, and `youcan app deploy`. | Medium. New scheduler, cursor, and idempotent ingest. | Already implemented. |
| Time to work | After a successful app release. Dev-session subscriptions disappear when `youcan app dev` stops. | After the job is deployed. First poll is late by one interval. | Already live for `elitemart1`. |
| Reliability | High once released to installed stores. Dashboard then shows deliveries. | Medium. Gaps if the job stops, pagination is wrong, or an unpublished limit returns 429. | High if the public URL stays stable and the endpoint keeps returning 2xx. YouCan retries 5xx for about 4 hours. |
| Limitations | Republish required. Relative URLs follow `app_url`. Does not replace per-store API hooks unless the seller installed that app version. | Not real time. No official interval or rate limit. Must dedupe by order id. | Partners tab stays empty until the manifest exists. Subscription id is not persisted. URL changes strand the hook. 4xx responses are not retried. |

## 3. Recommended path

Option C. Keep `POST /resthooks/subscribe` for `order.created`. Do not block orders on `youcan.app.json`.

Add polling later only as reconciliation (missed deliveries, URL changes), not as the primary path. Add `youcan.app.json` later only if the Partners delivery graph is required. That is an app-platform migration, not a one-file drop-in.

## 4. Implementation plan

No code change is required for `elitemart1` to receive orders.

1. Leave the current subscribe call in the OAuth callback.
2. Place one test order on `elitemart1` and confirm it on `/ar/dashboard/orders`.
3. If the order is missing, call `GET /resthooks/list` and compare `target_url` with the current public app URL. Reconnect once if they differ.
4. Optional later: a 60-second reconciliation job that lists orders created since the last cursor and reuses the existing order normalizer. Skip it until a real miss is observed.

## 5. Exact code changes needed

None for the recommended path.

If reconciliation is added later:

- A scheduled route that loads each connected YouCan token, calls `GET /orders?sort_field=created_at&sort_order=desc`, and inserts only unseen order ids.
- Store `last_polled_at` per connection.
- Do not remove the REST Hooks subscribe call.

If the Partners graph is required later:

- Add `youcan.app.json` through `youcan app config`, with a relative webhook address `/api/integrations/youcan/webhooks` and topic `order.created`.
- Release with `youcan app deploy`.
- The existing receiver already checks `x-youcan-signature`, `x-youcan-topic`, and `x-youcan-delivery-id`.

## 6. Files to modify

None now.

Later, only if reconciliation is built:

- new scheduler under `app/api/integrations/youcan/**`
- order fetch helper under `lib/integrations/youcan/**`
- a cursor column or equivalent store on the YouCan connection

`youcan.app.json` would be a new app-config file, deployed with the YouCan CLI, not a change to the subscribe client.

## 7. Estimated time

- Prove the current hook with one test order: about 15 minutes.
- Reconciliation poll: about 4–8 hours, including idempotency and tests.
- `youcan.app.json` plus CLI release: about 1–2 days, and **uncertain** if the existing Partner app must be recreated as a CLI app.

## 8. Risks

- Reading 0 deliveries in the Partners tab and disconnecting a working API subscription.
- ngrok host changes leave YouCan posting to a dead URL. 4xx is not retried.
- Repeated endpoint failures can deactivate the subscription (410 immediately, or after a long failure streak; the Apps page says 1000 consecutive failures).
- The subscribe id `cc3b5f58-7912-4bb9-bc1b-a1b55653b5a1` is not in the database, so a later list call is the only durable check.
- Orders-list rate limit is **uncertain**.
- Whether the Partners Webhooks tab will ever show REST Hooks API deliveries without a manifest is **uncertain**.
