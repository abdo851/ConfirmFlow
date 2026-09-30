# Shipping integration status

Read-only. No source files, credentials, or migrations were changed. `.env.local` was not opened.

Date: 27 September 2026.

## 1. Current architecture

The shipping area is a static catalog plus a form that never calls a carrier.

### UI

| Piece | Path | Behavior |
| --- | --- | --- |
| Sidebar item | `components/dashboard/sidebar-model.ts` | Group `shipping`, href `/dashboard/shipping`, after Connections |
| List page | `app/[locale]/dashboard/shipping/page.tsx` | Renders `SHIPPING_PROVIDERS` through `ShippingCard`. Does not pass `connected`, so every card stays on the connect link |
| Card | `components/shipping/shipping-card.tsx` | **ربط / Connect** is a `Link` to `/dashboard/shipping/{slug}`. The gear button has no `onClick`. The connected switch is unused |
| Connect page | `app/[locale]/dashboard/shipping/[slug]/page.tsx` | `getShippingProvider(slug)` or `notFound()`. Loads `getStoreConnectionState()`. If the store is connected, shows `ShippingConnectForm`. Otherwise links to `/onboarding/store` |
| Form | `components/shipping/shipping-connect-form.tsx` | `onSubmit` calls `preventDefault()` and `setNotice(comingSoon)`. The API key is not read, stored, or sent |
| Catalog | `lib/shipping/data.ts` | `ShippingProvider` and `getShippingProvider` |
| Workflow | `app/[locale]/dashboard/workflow/page.tsx` | Shipping step status is `soon` |
| Copy | `messages/en/dashboard.json`, `messages/ar/dashboard.json` | `dashboard.shipping` |

There is no `app/api/**/shipping` route.

### Adapter

`lib/integrations/` has store, Meta, TikTok, and Google modules. There is no `lib/integrations/shipping/` and no shipping adapter. `StoreAdapter` in `lib/integrations/adapters/store-adapter.ts` covers Shopify, WooCommerce, and YouCan only.

### Database

No `shipping_*` or `shipments` table exists in `database/migrations/`. Carrier keys are not stored. The connect form does not write to `store_connections`.

`public.orders` (migration `004_shopify_order_ingestion.sql`, later provider and confirmation alters) stores:

- `customer_email`, `customer_phone`
- currency and minor-unit totals
- `confirmation_status`, `confirmed_at`
- provider and external order id

It does **not** store customer name, city, address line, or line items. YouCan normalization (`normalizeYouCanOrder` in `lib/integrations/youcan/orders/normalize.ts`) keeps email and phone only. A carrier create-parcel call cannot be filled from the current row.

### Connect button, exact path

1. `ShippingPage` maps providers and renders `ShippingCard` without `connected`.
2. The link goes to `ShippingConnectPage`.
3. `getStoreConnectionState()` must be `connected` and `metadata.shopDomain` must be non-empty, or the form is replaced by a link to onboarding.
4. `ShippingConnectForm` submit sets the Coming Soon string (`dashboard.shipping.comingSoon`). No `fetch`.

## 2. Provider analysis

The catalog has 10 slugs. None have types, clients, or docs inside the repo. Descriptions live only in `lib/shipping/data.ts` and the dashboard message files.

| Slug | Site in catalog | In-repo API code |
| --- | --- | --- |
| `sendit` | https://sendit.ma | None |
| `cathedis` | https://cathedis.ma | None |
| `ameex` | https://ameex.ma | None |
| `ozon-express` | https://ozonexpress.ma | None |
| `digylog` | https://digylog.ma | None |
| `coliix` | https://coliix.ma | None. The UI name is Coliix, not Colitix |
| `tawssil` | https://tawssil.ma | None |
| `ozonexpress` | https://ozonexpress.ma | None. Duplicate of Ozon Express |
| `forcelog` | https://forcelog.ma | None. Arabic copy says the carrier has an API. Confirma does not call it |
| `colis-swift` | https://colisswift.ma | None |

`.env.example` has no `SENDIT`, `CATHEDIS`, `AMEEX`, or other carrier variables. Application code does not read any. Whether `.env.local` contains a key was **not checked**.

Public docs found outside the repo (27 Sep 2026):

- **Sendit.** The WooCommerce connector “Sendit.ma For WooCommerce” documents `https://app.sendit.ma/api/v1/login`, `/districts`, `/deliveries`, and `/deliveries/getlabels`. A community plugin points at `https://app.sendit.ma/api/v1/` for API v1. Fetching that URL returned **404**, so the OpenAPI page itself is **uncertain**. Auth described there is a public key plus a secret key, exchanged for a session token. Status updates are a webhook to a URL that carries a token.
- **Cathedis.** The marketing site says connectors and an API exist. The public FAQ describes manual delivery creation (recipient, phone, city, sector). No public endpoint list was found. Exact API is **uncertain**.
- **Ameex.** No public create-shipment reference was found in this pass. **Uncertain.**

## 3. Proposed data flow

Do not create a shipment when the store webhook arrives. Create it when the merchant confirms, the same moment Meta Purchase is allowed.

```
Store webhook → orders row (pending)
        → merchant confirms (confirmOrder)
        → if a shipping connection is active
        → POST carrier “create delivery”
        → save shipment id + status
        → carrier webhook (or poll) updates status
```

`confirmOrder` in `lib/confirmation/confirm-order.ts` only flips `confirmation_status` to `confirmed`. It does not call a carrier. A shipment step should run after that update succeeds, and a carrier failure must not roll back the confirmation or the Meta send.

### What the merchant must provide

For Sendit, based on the public connector, not on an OpenAPI file:

- Public key and secret key (the current form has a single password field; that is not enough).
- Pickup city / district, chosen from `GET /districts`.
- Parcel defaults: allow try-on, allow opening. **Uncertain** which fields are required until a live login response is captured.
- Confirma already knows the store from `getStoreConnectionState()`. A separate carrier “store id” is **uncertain**.

The order row must also grow, or the raw store payload must be kept, so the create call has:

- recipient name
- phone (already stored)
- city and district id from the carrier list
- address line
- COD amount (`total_amount_minor`)
- order reference (`order_number` or `external_order_id`)
- line items and quantities

### Status updates

Prefer the carrier webhook. Sendit’s connector says Sendit POSTs progress to a URL that includes a token, and requests without that token are rejected. Polling `GET` delivery status is the fallback if a merchant cannot register a URL. A published poll interval was **not found**.

Confirma should store `external_shipment_id`, last status, and last event id, and ignore duplicate deliveries.

## 4. First provider: Sendit

Sendit is the simplest start. Login, district list, create delivery, and label download are named in a public connector. Cathedis and Ameex do not publish that list.

Do not add an npm package. Use `fetch`, as the other integrations do.

### External API (from the WooCommerce connector)

| Action | Method and URL | Auth |
| --- | --- | --- |
| Login | `POST https://app.sendit.ma/api/v1/login` | Public key + secret key. Response is a session token. Exact JSON keys are **uncertain** |
| Districts | `GET https://app.sendit.ma/api/v1/districts` | Session token. **Uncertain** header name (`Authorization` vs a custom header) |
| Create parcel | `POST https://app.sendit.ma/api/v1/deliveries` | Session token. Body includes name, phone, address, order reference, items, COD amount, parcel options. Exact property names are **uncertain** |
| Label | `POST https://app.sendit.ma/api/v1/deliveries/getlabels` | Session token. Parcel code |
| Status | Webhook to Confirma | Shared token on the URL. Event body is **uncertain** |

### Steps

1. **Order address.** Migration adds recipient name, city, address line, and a JSON line-items column on `orders` (or a side table). Extend YouCan, WooCommerce, and Shopify normalizers. Without this, Sendit cannot be called for order #044.
2. **Credentials.** New tables, same pattern as other secrets: `shipping_connections` (store, provider `sendit`, status) and `shipping_connection_secrets` (encrypted public key, secret key, and cached token). Encrypt with the existing secret helper. Do not log the keys.
3. **Connect API.** `POST /api/integrations/shipping/sendit/connect` reads both keys, calls `/login`, and stores the row only if login succeeds. Disconnect deletes the rows. The form replaces the single password field.
4. **Districts.** After connect, cache `/districts` and let the merchant pick a pickup city. Map the customer city text to a district id before create. Unmapped cities stay as a manual choice on the order.
5. **Create on confirm.** After `confirmOrder` returns `confirmed`, call `/deliveries` once. Persist `shipments` (`order_id`, `provider`, `external_id`, `status`). A second confirm must not create a second parcel.
6. **Webhook.** `POST /api/integrations/shipping/sendit/webhooks?token=…` checks the token, updates `shipments.status`, and returns 200. Do not confirm or reject the order from a carrier status in the first slice.
7. **UI.** Card `connected` comes from the new table. Errors from login and create show on the form and the order, not as Coming Soon.

## 5. Gap analysis

| Gap | Blocker? |
| --- | --- |
| No HTTP client, route, or adapter | Yes, for any live call |
| No credential or shipment tables | Yes |
| Orders lack name, city, address, and items | Yes. Largest product gap |
| Form accepts one key and discards it | Yes, for Sendit’s two-key login |
| Duplicate catalog rows `ozon-express` and `ozonexpress` | No, but confusing |
| No Sendit merchant keys in app config | Yes, until the merchant pastes them. `.env.local` was not read |
| OpenAPI for `/deliveries` returned 404 | The endpoint names are from a third-party plugin page. Confirm with one login before coding the body |
| Cathedis / Ameex public contracts | **Uncertain.** Do not start there |
| Webhook signature algorithm | **Uncertain.** The connector describes a URL token, not an HMAC |

Confirmation and Meta delivery should stay independent. A Sendit outage must not block Purchase.

### Effort

About **4–6 days** for Sendit only, after a working public/secret key pair:

- 1–1.5 days: address fields and normalizers
- 1 day: encrypted connect and login
- 1–2 days: create-on-confirm, idempotent `shipments`, order UI
- 0.5–1 day: webhook and tests

Label PDF and district auto-match can follow. The other nine carriers are out of this slice.

### Risks

- Plugin docs and the live API can disagree. The documented index URL already 404s.
- City names from YouCan will not match Sendit district ids without a map.
- COD amount must use the order total in major units. Minor units sent by mistake would collect the wrong cash.
- A changed ngrok host breaks the status webhook until it is registered again.
- Storing the API key in the browser form without a server route would leak it into logs if someone later adds a client `fetch` to a third party. Keep the call on the server.

## Next action

Obtain a Sendit public key and secret key, call `POST /login` once, and save the real request and response field names. Then add the order address columns before any create-parcel code.
