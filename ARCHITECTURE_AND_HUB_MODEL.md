# Confirma architecture and hub model

Read-only review of the code on 27 September 2026. No source files were changed. `.env.local` was not opened.

## 1. Executive summary

Confirma is the product that stores the order and talks to the outside systems itself. There is no eGrow, Zapier, or other broker in the order, confirmation, or conversion path. Store webhooks are received by Confirma routes. Ad Purchase events are sent by Confirma’s own Meta, TikTok, and Google clients.

The intended hub model is: one confirmation, then two independent dispatches (shipping and ads). **Only the ads half is implemented.** `confirmOrder` writes `confirmation_status = confirmed`. The confirm API route then calls `dispatchPurchaseDeliveryAfterConfirmation`, which sends Meta, TikTok, and Google. Nothing in that path creates a Sendit, Coliix, or Ameex shipment.

So Confirma is the hub for stores and ad platforms. It is not yet the hub for carriers.

## 2. Order lifecycle

### Entry

| Store | Route | Normalize | Persist |
| --- | --- | --- | --- |
| YouCan | `app/api/integrations/youcan/webhooks/route.ts` | `lib/integrations/youcan/orders/normalize.ts` `normalizeYouCanOrder` | `lib/orders/persist.ts` `persistOrder` |
| WooCommerce | `app/api/integrations/woocommerce/webhooks/route.ts` | `lib/integrations/woocommerce/orders/normalize.ts` `normalizeWooCommerceOrder` | `lib/integrations/woocommerce/orders/persist.ts` `persistWooCommerceOrder` |
| Shopify | `app/api/integrations/shopify/webhooks/route.ts` | `lib/integrations/shopify/orders/normalize.ts` `normalizeShopifyOrder` | `persistOrder` |

New rows start as `confirmation_status: "pending"`. Webhook repeats are skipped with `findExistingWebhookEvent` in `lib/webhooks/ingestion/persist.ts` (`store_webhook_events.external_event_id`).

### Storage

`public.orders` is created in `database/migrations/004_shopify_order_ingestion.sql` and extended later. Fields used by the hub:

- Identity: `store_id`, `owner_id`, `provider`, `external_order_id`, `order_number`
- Buyer: `customer_email`, `customer_phone`, plus nullable `customer_name`, `city`, `address_line`, `line_items` from `015_shipping_sendit.sql`
- Money: `currency`, `subtotal_amount_minor`, `total_amount_minor`
- State: `confirmation_status` (`pending`, `confirmed`, `rejected`, `archived`), `confirmed_at`

Confirma does not keep the raw store payload on the order row. Name, city, address, and line items are filled only when the YouCan or WooCommerce normalizer sees them. Shopify’s normalizer does not set those four fields.

### Confirmation

Single writer: `confirmOrder` in `lib/confirmation/confirm-order.ts`.

It updates `orders` only when `owner_id` matches `actor.userId` and `confirmation_status` is `pending`. A second call returns `already_confirmed` and does not change the row. It does not call Meta, TikTok, Google, or any carrier.

### What fires after the status is set

The only production caller is `POST` `app/api/orders/[id]/confirm/route.ts`.

1. `confirmOrder` (status flip only).
2. If the result is `confirmed` or `already_confirmed`, `runPurchaseDeliveryAfterConfirmation` calls `dispatchPurchaseDeliveryAfterConfirmation` in `lib/confirmation/purchase-delivery.ts`.
3. That function awaits Meta, then TikTok in its own try/catch, then Google in its own try/catch.
4. The route returns JSON including `metaPurchaseDelivery`.

The dashboard button in `components/orders/order-actions-menu.tsx` calls `confirmOrderRequest` in `lib/orders/confirm-client.ts`, which POSTs that same route.

No shipping function is called. There is no shipment row write on confirm.

## 3. Marketing dispatch path

| Platform | Sender | Event id |
| --- | --- | --- |
| Meta CAPI | `processMetaPurchaseDelivery` in `lib/integrations/meta/delivery/deliver-purchase.ts` | `purchase:{orderId}` from `buildPurchaseEventId` in `lib/conversions/event-id.ts` |
| TikTok | `dispatchTikTokPurchaseDelivery` in `lib/integrations/tiktok/delivery/deliver-purchase.ts` | `tiktok:purchase:{orderId}` |
| GA4 | `dispatchGooglePurchaseDelivery` in `lib/integrations/google/delivery/deliver-purchase.ts` | `google:purchase:{orderId}` |

Idempotency:

- Meta stores one `meta_conversion_deliveries` row per order (`order_id` + `provider` + `event_type` Purchase). A row already `sent` is not sent again. Retries reuse the same `event_id`, which Meta dedupes.
- TikTok and Google use the same pattern on their own delivery tables: if status is `sent`, return `sent` without another HTTP call. In-progress rows are not double-sent until they go stale.

Failure behavior in `purchase-delivery.ts`:

- TikTok’s throw is swallowed. Google still runs.
- Google’s throw is swallowed. Meta’s result is still returned.
- Meta is **not** inside that try/catch. If `processMetaPurchaseDelivery` throws, TikTok and Google do not run. The confirm route catches that throw in `runPurchaseDeliveryAfterConfirmation` and still returns HTTP 200 for the confirmation. The order stays confirmed. Confirmation is not rolled back.
- Shipping cannot be blocked by an ad failure, because shipping is not invoked. An ad failure also cannot be blocked by shipping, for the same reason.

Purchase is not sent when the order is created. Delivery loads the order and requires `confirmation_status === "confirmed"`.

## 4. Shipping dispatch path

| Carrier | Code | Create-on-confirm |
| --- | --- | --- |
| Sendit | `lib/integrations/shipping/sendit/client.ts` (`login`, `getDistricts`, `createDelivery`, `getLabel`), `connect.ts`, `app/api/integrations/shipping/sendit/connect/route.ts` | **Not implemented** |
| Coliix | `lib/integrations/shipping/coliix/client.ts` (`createShipment`, `trackParcel`, `getLabel`, `listRates`), `connect.ts`, `app/api/integrations/shipping/coliix/connect/route.ts` | **Not implemented** |
| Ameex | Catalog card only in `lib/shipping/data.ts` (`slug: "ameex"`). Connect form shows Coming Soon | **Not implemented** |

There is no `app/api/integrations/shipping/sendit/webhooks` route. `shipments` (Sendit migration) and `coliix_shipments` are unused by application code.

Where the create call should live, without folding it into `confirmOrder`:

- After `confirmOrder` returns `confirmed` in `app/api/orders/[id]/confirm/route.ts`, call a new shipping dispatcher in its own try/catch, parallel to `runPurchaseDeliveryAfterConfirmation`.
- That dispatcher should check the store’s carrier connection, call only that carrier’s client, and insert one shipment row. A second confirm must see the existing row and return.
- `confirmOrder` itself should stay a status flip. Ad modules should not import shipping, and shipping should not import Meta, TikTok, or Google.

Independence is then the same shape as TikTok and Google: a thrown carrier error is logged and does not change the confirm response or the ad calls. Today that independence is vacuously true because the shipping call does not exist.

## 5. Connection methods

| System | Method | Where |
| --- | --- | --- |
| YouCan store | OAuth. Browser authorize, token exchange, encrypted access token | `app/api/integrations/youcan/connect/route.ts`, `callback/route.ts`, `lib/integrations/youcan/persistence.ts` |
| Sendit | Merchant public key + secret key. `POST /login` returns a session token. All three values are encrypted | `shipping_connections` + `shipping_connection_secrets` (`015_shipping_sendit.sql`) |
| Coliix | One API key from the seller profile. Encrypted in `coliix_connection_secrets.api_key_encrypted`. Remote verify runs only if `COLIIX_API_BASE_URL` is set | `016_coliix_shipping.sql` (file exists; apply state is **uncertain** from this read-only pass) |
| Ameex | No client, no table, no route | Coming Soon form |

There is **no** shared shipping interface. Sendit and Coliix do not implement a common `ShippingAdapter`. Each has its own client, connect function, route, and secret table. Confirma does not treat them as one type. YouCan is a store connection, not a carrier connection.

The marketing side is closer to a shared pattern: separate modules under `lib/integrations/{meta,tiktok,google}`, encrypted secrets, and a delivery row keyed by a stable event id. Shipping copies the “encrypted secret + connection row” idea only. It does not copy webhook dedupe or idempotent send.

## 6. Confirmation source

`confirmOrder` does not know whether the caller was a button or another service. It only receives `{ orderId, actor: { userId } }`.

In the current app that is not source-agnostic in practice:

- The only HTTP entry is `POST /api/orders/[id]/confirm`.
- That route requires `getAuthenticatedUser()`. There is no agency API key, no service account, and no second route.
- The update matches `owner_id` to that user. A confirmation agency that is not the store owner gets `forbidden`.
- No code path mentions an external confirmation agency.

The single source of truth for the status change is `confirmOrder` in `lib/confirmation/confirm-order.ts`. The single source of truth for “confirmation happened, now tell the ads platforms” is the confirm route, not `confirmOrder`.

## 7. Gap analysis

### Sendit live dispatch

- Login with the keys currently in the environment returned HTTP 401 `Accès non autorisé à Utilisateur` on an earlier run. Fresh keys are required. **Blocker.**
- `createDelivery` is never called from confirm. **Blocker.** `app/api/orders/[id]/confirm/route.ts`
- No district mapping from `city` to Sendit `district_id`. **Blocker.** `lib/integrations/shipping/sendit/client.ts` can list districts; nothing maps them.
- No status webhook. **Blocker.** Route does not exist.
- Shipment idempotency table exists (`shipments`) and is unused.
- Orders may lack name, city, and address if the store payload did not include them.

### Coliix live dispatch

- Endpoints are placeholders (`/shipments`, `/rates`, `/label`). `COLIIX_API_BASE_URL` must be set or the client throws `coliix_not_configured`. **Blocker.** `lib/integrations/shipping/coliix/client.ts`
- Not called from confirm. **Blocker.**
- Migration `016` / `supabase/migrations/20260927180000_coliix_shipping.sql` was not confirmed applied in this pass. If the table is missing, connect fails. **Uncertain.**
- No Coliix status webhook.

### Ameex

- No integration module. **Blocker.** Only `lib/shipping/data.ts` and the Coming Soon branch in `components/shipping/shipping-connect-form.tsx`.

### External confirmation agency

- No public confirm API that accepts an agency credential. **Blocker.** `app/api/orders/[id]/confirm/route.ts` is session-only.
- `ConfirmOrderActor` is only `userId`. **Blocker.** `lib/confirmation/types.ts`
- `confirmOrder` requires `orders.owner_id = actor.userId`. An agency user cannot confirm a merchant’s order without an ownership or delegation rule. **Blocker.** `lib/confirmation/confirm-order.ts`

## 8. Risks

- Putting `createDelivery` inside `confirmOrder` would couple carriers to the status flip. A carrier throw could be mistaken for a failed confirmation if a future edit removes the route’s try/catch. Keep the call in the route, after the update has succeeded.
- Meta is awaited before TikTok and Google, and it is outside their try/catch. A thrown Meta error skips the other two ad sends. Confirmation still stands. That is ad-to-ad coupling, not shipping-to-ad coupling.
- `already_confirmed` still runs ad dispatch (so a missed Purchase can be reconciled). A naive shipping hook on that same branch would create a second parcel. Shipping must run only when `result.status === "confirmed"`, and must also check `shipments` for an existing row.
- Sendit and Coliix do not share an adapter. A new carrier copied into the confirm route by hand will drift. A small dispatcher that picks the connected provider is the missing seam.
- There is no import from `lib/confirmation` into shipping, and no import from shipping into Meta, TikTok, or Google. The coupling point that does exist is only the confirm route, and it couples confirmation to ads. Shipping is not on that edge yet.

## Next action

Add a shipping dispatcher next to `runPurchaseDeliveryAfterConfirmation` in `app/api/orders/[id]/confirm/route.ts`, called only for `status === "confirmed"`, in its own try/catch. Implement Sendit first, after a login that returns `data.token`. Leave `confirmOrder` and the ad modules unchanged.
