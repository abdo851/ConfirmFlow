# WooCommerce Readiness Report — Application Authentication Endpoint

**Date:** Monday, 21 September 2026  
**Project:** ConfirmFlow (Confirma)  
**Scope:** Environment bring-up + read-only plan. No application code, migrations, or `.env.local` changes.

---

## 1. Executive summary

WooCommerce can be added as a third store provider beside YouCan and Shopify without rewriting those integrations. The adapter type already includes `"woocommerce"`, but the live registry, database checks, UI, and API routes do not. WooCommerce’s Application Authentication Endpoint (`/wc-auth/v1/authorize`) is built into WooCommerce core — a custom plugin on the merchant store is not required. The flow differs from Shopify/YouCan: keys arrive on a separate HTTPS POST to a callback, while the browser returns to a different URL with only `success` and `user_id`. Estimated overall scope: **L**.

---

## 2. Environment status

### Git

Working directory: `C:\Users\pc\Documents\AI Projects\02_Projects\ConfirmFlow`

**`git status`**
```
On branch master
Your branch is up to date with 'origin/master'.

Changes not staged for commit:
  modified:   SETUP_REPORT.md

Untracked files:
  END_OF_DAY_REPORT.md
```
(These pre-existing files were not included in this commit.)

**`git log --oneline -5`**
```
9d0b3bc fix(middleware): preserve query params on auth redirect; feat(onboarding): wire Shopify connect form
ee39399 docs: add Shopify readiness audit and Custom App test plan
c5e3a08 fix(youcan): align OAuth and API URLs with official YouCan documentation
3b08429 test(e2e): update health milestone assertion from M0 to MVP
d841f8e chore(infra): add safe additive infrastructure utilities ...
```

**`git log origin/master..master`:** empty (in sync before this report).

### Processes

| Check | Result |
|-------|--------|
| Port 3000 before start | Not listening |
| Port 4040 before start | Not listening |
| Next.js | Started (`npm run dev`) |
| Health | `{"status":"ok","service":"confirma","milestone":"MVP"}` |
| ngrok | `https://ignore-savings-joyfully.ngrok-free.dev` |
| `NEXT_PUBLIC_APP_URL` | `https://ignore-savings-joyfully.ngrok-free.dev` |
| URL match | **Yes** |
| Supabase verify | `configured: true`, `reachable: true`, `error: null` |

---

## 3. Existing integrations inventory

### `lib/integrations/`

| Folder | Role |
|--------|------|
| `adapters/` | `StoreAdapter`, `MarketingAdapter`, `ConfirmationAdapter` interfaces |
| `stores/` | Provider registry + supported-providers list |
| `shopify/` | Full OAuth, persistence, webhooks, orders, session |
| `youcan/` | Full OAuth, persistence, webhooks, orders, session |
| `meta/` | Connection, verification, CAPI delivery |

### `integrations/`

| Path | Status |
|------|--------|
| `stores/shopify/` | Implemented adapter |
| `stores/youcan/` | Implemented adapter |
| `stores/woocommerce/` | **README placeholder only** — no adapter class |
| `marketing/meta/` | Implemented |
| `marketing/google/`, `marketing/tiktok/` | README placeholders |
| `confirmation/*` | README placeholders |

### `app/api/integrations/`

| Provider | Routes |
|----------|--------|
| Shopify | `connect`, `callback`, `status`, `disconnect`, `webhooks`, `register-webhooks` |
| YouCan | `connect`, `callback`, `status`, `disconnect`, `webhooks`, `register-webhooks` |
| Meta | `connect`, `status`, `disconnect`, `verify` |
| WooCommerce | **None** |

---

## 4. Adapter architecture summary

`StorePlatform` in `lib/integrations/adapters/store-adapter.ts` is already:

```ts
"shopify" | "woocommerce" | "youcan"
```

`StoreAdapter` requires: `connect`, `disconnect`, `verifyConnection`, `verifyWebhook`, `normalizeOrder`, `registerWebhooks`.

**Registered today** (`lib/integrations/stores/registry.ts`): `shopify`, `youcan` only. Calling `getStoreAdapter("woocommerce")` throws.

**Supported list** (`supported-providers.ts`): YouCan and Shopify only. `isSupportedStoreProvider("woocommerce")` returns false.

**Type split:** `database/types/index.ts` defines `StorePlatform` as `"shopify" | "youcan"` (narrower than the adapter type).

### Files that must change to register WooCommerce

| File | Change |
|------|--------|
| `integrations/stores/woocommerce/` | Replace README-only stub with constants + `WooCommerceAdapter` |
| `lib/integrations/stores/supported-providers.ts` | Add WooCommerce to the supported list |
| `lib/integrations/stores/registry.ts` | Register the adapter |
| `database/types/index.ts` | Add `"woocommerce"` to the DB `StorePlatform` union |

OAuth-style routes, persistence, and a migration live beside the adapter (new folders), not inside Shopify or YouCan code.

---

## 5. Database CHECK constraints to extend

Live constraints after migration 009 (applied). Postgres default names from inline `CHECK` columns, then renamed/replaced in 009.

| Table | Column | Constraint name | Current allowed values | Needed change |
|-------|--------|-----------------|------------------------|---------------|
| `public.stores` | `platform` | `stores_platform_check` | `'shopify', 'youcan'` | Add `'woocommerce'` |
| `public.orders` | `provider` | `orders_provider_check` | `'shopify', 'youcan'` | Add `'woocommerce'` |
| `public.store_webhook_events` | `provider` | `store_webhook_events_provider_check` | `'shopify', 'youcan'` | Add `'woocommerce'` |

**Not a provider allow-list (do not change for WooCommerce):**

| Table | Column | Constraint | Values |
|-------|--------|------------|--------|
| `public.meta_delivery_events` (008) | `provider` | inline `CHECK (provider IN ('meta'))` | `'meta'` only — marketing, not stores |
| `public.store_connections` | `provider` | **No CHECK** | Free text |
| `public.conversions` (001 design) | `platform` | `'meta', 'google', 'tiktok'` | Not store platforms |

**History note:** `001_initial_schema.sql` already listed `'woocommerce'` on `stores.platform`, but `002_mvp_database_foundation.sql` created the live table with `'shopify'` only, and `009` widened it to `'shopify', 'youcan'`. The applied schema does **not** accept `woocommerce` today.

**New migration would also add** (mirroring YouCan/Shopify, not a CHECK change):

- `woocommerce_connections` (store URL, key id, permissions, timestamps)
- `woocommerce_connection_secrets` (encrypted consumer key + consumer secret)
- RLS: select for owner; writes service-role only; secrets with no user policies

---

## 6. Middleware changes needed

Today (`middleware.ts` + `lib/auth/protection.ts`):

| Pattern | Unauthenticated behavior |
|---------|--------------------------|
| `/api/integrations/shopify/webhooks` | Public (HMAC in handler) |
| `/api/integrations/shopify/connect` and `/callback` | Redirect to login; `next` includes query string |
| Other `/api/integrations/shopify/*` | 401 JSON |
| `/api/integrations/youcan/webhooks` | Public |
| `/api/integrations/youcan/connect` and `/callback` | Login redirect with query preserved |
| Other `/api/integrations/youcan/*` | 401 JSON |
| `/api/integrations/meta/*` | 401 JSON (no login redirect) |

**To add WooCommerce:**

1. `isWooCommerceWebhookPath` — public webhook path if webhooks are used.
2. `isProtectedWooCommerceApiPath` — everything under `/api/integrations/woocommerce` except webhooks.
3. In `middleware.ts`, same branch as Shopify/YouCan: `/connect` and the **browser return** route redirect to login with full query; the **credential callback** must stay **unauthenticated** because WooCommerce’s server POSTs the keys (no user cookie).

Important difference: Shopify/YouCan use one browser callback. WooCommerce uses two URLs:

- `callback_url` — server-to-server POST of keys (must **not** require a logged-in session)
- `return_url` — browser redirect with `success` and `user_id` (should require the Confirma session, or correlate via signed `user_id`)

---

## 7. UI and i18n

`components/connections/store-provider-panel.tsx` renders a local toggle:

- Buttons: YouCan (`youcanLabel`) and Shopify (`shopifyLabel`)
- State: `"youcan" | "shopify"`
- Body: `YouCanConnectForm` or `ShopifyConnectForm`

**Needed:** a third button and `WooCommerceConnectForm` (store URL input → link to `/api/integrations/woocommerce/connect?store=...`). Reuse `Button`, `Input`, `ConnectionStatusBadge`. Do not change YouCan or Shopify form behavior.

### Existing top-level keys (`messages/en/connections.json` and `ar`)

`types.store`, `types.meta`, `types.confirmation`, `status.*`, `loadingShopify`, `loadingYouCan`, `loadingStoreProvider`, `loadingMeta`, `chooseStoreProvider`, `youcanLabel`, `shopifyLabel`, `storeProvider`, `storeProviderLabel`, `connectedToShop`, plus nested `youcan.*`, `shopify.*`, `meta.*`.

### Keys WooCommerce would need

| Key | Purpose |
|-----|---------|
| `woocommerceLabel` | Toggle label |
| `loadingWooCommerce` | Optional loading copy |
| `woocommerce.storeUrlLabel` | Store URL field |
| `woocommerce.storeUrlPlaceholder` | e.g. `https://shop.example.com` |
| `woocommerce.connect` | Connect button |
| `woocommerce.disconnect` | Disconnect button |
| `woocommerce.connectedSuccess` | Success flash |
| `woocommerce.disconnectedSuccess` | Disconnect flash |
| `woocommerce.disconnectFailed` | Disconnect error |
| `woocommerce.connectionFailed` | Generic failure |
| `errors.woocommerce.*` (new namespace in `errors.json`) | `invalid_store`, `access_denied`, `callback_failed`, `configuration` |

English and Arabic files must stay in sync.

---

## 8. WooCommerce Application Auth flow

**Source:** [WooCommerce REST authentication docs](https://developer.woocommerce.com/docs/apis/rest-api/authentication/) and core class `WC_Auth` (`/wc-auth/v1/authorize`).

### Plugin required on the merchant store?

**No.** The endpoint ships with WooCommerce. It is not a separate plugin.

**Still required on the merchant store (not a custom plugin):**

- WooCommerce installed and active
- Pretty permalinks enabled (plain permalinks often make `/wc-auth/v1/authorize` unreachable)
- A store admin logged in who can `manage_woocommerce`
- The store must be able to POST to Confirma’s public HTTPS callback (ngrok or production)

### Endpoints Confirma would implement

| Route | Method | Role |
|-------|--------|------|
| `/api/integrations/woocommerce/connect` | GET | Authenticated. Validate store URL. Redirect browser to `{store}/wc-auth/v1/authorize` |
| `/api/integrations/woocommerce/callback` | POST | **Unauthenticated.** Receives JSON keys from WooCommerce. Persist secrets. |
| `/api/integrations/woocommerce/return` | GET | Browser return (`success`, `user_id`). Show connected or denied. |
| `/api/integrations/woocommerce/status` | GET | Authenticated connection state |
| `/api/integrations/woocommerce/disconnect` | POST | Authenticated disconnect |
| `/api/integrations/woocommerce/webhooks` | POST | Later: order webhooks (optional for first connect milestone) |

### Data exchanged

Authorize query (all mandatory, values URL-encoded):

| Param | Meaning |
|-------|---------|
| `app_name` | Shown on the grant screen (e.g. Confirma) |
| `scope` | `read` / `write` / `read_write` — orders need at least `read` |
| `user_id` | **Confirma’s** user/connection id, not the WordPress user id |
| `return_url` | Browser lands here after approve/deny |
| `callback_url` | **Must be HTTPS.** WooCommerce POSTs keys here |

Callback JSON body:

```json
{
  "key_id": 1,
  "user_id": "<confirma user id>",
  "consumer_key": "ck_...",
  "consumer_secret": "cs_...",
  "key_permissions": "read_write"
}
```

Return URL query: `success=1|0` and `user_id`. Keys are **not** on the return URL.

### Mapping to YouCan / Shopify

| | Shopify / YouCan | WooCommerce |
|--|------------------|-------------|
| Start | Confirma redirects to provider authorize URL | Confirma redirects to the **merchant’s** `/wc-auth/v1/authorize` |
| Secret delivery | Browser returns `code`; Confirma exchanges it | WooCommerce **POSTs** `consumer_key` / `consumer_secret` to `callback_url` |
| Browser finish | Same callback URL | Separate `return_url` |
| Stored secret | Access token | Consumer key + consumer secret |
| Store identity | `*.myshopify.com` or YouCan slug | Full store origin the merchant typed |

### REST API after connect

- Base: `https://{store-url}/wp-json/wc/v3/`
- Auth over HTTPS: HTTP Basic, username = consumer key, password = consumer secret
- Example orders: `GET /wp-json/wc/v3/orders`
- Webhook create: `POST /wp-json/wc/v3/webhooks` (topic `order.created`)

Query-string auth exists for non-HTTPS stores in WooCommerce docs. Confirma should require HTTPS stores and use Basic auth only.

---

## 9. Numbered checklist (do not implement in this task)

1. New migration: extend the three CHECK constraints; add `woocommerce_connections` + secrets + RLS.
2. Persistence module: encrypt consumer key and secret; one connection per store URL.
3. Connect route: normalize store URL, build authorize URL, redirect.
4. Callback route: read raw JSON body, verify `user_id` against a signed pending connection, store keys. No session cookie.
5. Return route: read `success` + `user_id`; flash connected or denied.
6. Status + disconnect routes.
7. `WooCommerceAdapter` + registry + supported-providers + DB type union.
8. Middleware: protect connect/return/status/disconnect; leave callback (and later webhooks) unauthenticated.
9. UI tab + form + en/ar strings.
10. Unit tests with mocked fetch (authorize URL, callback JSON, Basic auth header). Do not call a live store in CI.
11. Manual test: real WooCommerce store with permalinks + HTTPS, ngrok callback, approve grant screen, confirm status endpoint.

---

## 10. Estimated scope

| Component | Size |
|-----------|------|
| Migration + RLS | **M** |
| Auth routes (connect, callback, return) | **M** |
| Persistence / encryption | **S** |
| Adapter + registry wiring | **S** |
| Middleware | **S** |
| UI + i18n | **S** |
| Order webhooks + normalization | **L** (separate milestone) |
| Live store verification | **M** (depends on a real WooCommerce shop) |
| **Connect-only first milestone** | **M** |
| **Full provider (orders + webhooks)** | **L** |

---

## 11. Risks and unknowns

- **Callback vs return race:** the browser may hit `return_url` before the POST to `callback_url` arrives. Status must tolerate “approved, keys not stored yet.”
- **Callback is unauthenticated.** Correlate with a signed `user_id` created at connect time. Reject unknown ids.
- **Pretty permalinks** on the merchant store are required. Uncertain until tested on the target shop.
- **HTTP shops** cannot use Basic auth safely. Plan assumes HTTPS store URLs only.
- **ngrok URL changes** force a new `callback_url`. Keys already issued stay valid; new connects must use the current public URL.
- **One store URL, many Confirma accounts:** need a uniqueness rule like YouCan’s slug unique constraint.
- **WooCommerce version differences** in webhook payload shape — uncertain until a fixture from a current WC version is captured.
- Pre-existing uncommitted files (`SETUP_REPORT.md`, `END_OF_DAY_REPORT.md`) are unrelated and were left unstaged.

---

## 12. Recommended immediate next action

Do not write WooCommerce code yet. Next session: implement the **connect-only** milestone (checklist items 1–10) against a real HTTPS WooCommerce store with pretty permalinks, using the current ngrok URL as `callback_url` and `return_url`. Leave order webhooks for a follow-up. Do not modify YouCan or Shopify modules.
