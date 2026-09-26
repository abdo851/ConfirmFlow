# Shopify reopen — Custom App install failure

**Date:** 26 September 2026  
**App:** Confirma (Dev Dashboard app `425297805313`, version `confirma-3`)  
**Store:** `yhken8-ej.myshopify.com`  
**Status:** read-only exploration — nothing changed

---

## 1. Executive summary

1. Confirma starts Shopify with `https://{shop}.myshopify.com/admin/oauth/authorize`. That URL is still the official authorization-code grant for a standalone app.
2. For a Custom-distribution app that is not yet installed, that URL is the wrong first hop. Shopify shows “Ce lien d'installation ne peut pas être utilisé” on the grant page and never calls Confirma.
3. The first install must be the link generated in the Dev Dashboard (`Manage custom install link`). That link includes a Shopify `signature`. Confirma cannot mint it.
4. After that install screen, Shopify sends the merchant to the App URL. Confirma has no handler for that hop, and the Dev Dashboard “Install app” button currently lands on `shopify.dev/apps/default-app-home`.
5. Token exchange, HMAC, webhooks, order normalization, and persistence are already implemented. They never ran, because the failure is before the callback.

---

## 2. Part A — code audit

### A1. `lib/integrations/shopify/constants.ts`

- API version: `SHOPIFY_ADMIN_API_VERSION = "2026-07"`.
- No OAuth paths. Admin calls are built elsewhere as `https://{shop}/admin/api/2026-07/...`.
- Matches current Admin API usage. `2026-07` is a valid quarterly version. Whether `2026-10` is already the newest release is **uncertain** and is unrelated to the grant-page error.

### A2. `lib/integrations/shopify/oauth/shop-domain.ts`

- Normalizes input to `{slug}.myshopify.com` with `^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$`.
- `buildShopifyAuthorizeUrl` builds **only**:

  `https://{shop}/admin/oauth/authorize?client_id=&scope=&redirect_uri=&state=`

- It does **not** use `/oauth/install_custom_app` and does not send a `signature`.
- This matches Shopify’s current standalone authorization-code grant. It does **not** match the Custom App first-install link.

### A3. `lib/integrations/shopify/oauth/state.ts`

- No URL.
- State is `{ nonce, shop, issuedAt }`, base64url, then HMAC-SHA256-signed with `SHOPIFY_SESSION_SECRET` (`signPayload` in `crypto.ts`).
- `parseOAuthState` rejects a bad signature, a bad shape, or age greater than the caller’s max age (600 seconds).
- Matches the requirement: signed, short-lived, bound to the shop.

### A4. `lib/integrations/shopify/oauth/hmac.ts`

- No URL.
- Requires `code`, `shop`, `state`, and `hmac`.
- HMAC-SHA256 over sorted `key=value` pairs, excluding `hmac` and `signature`, compared with `timingSafeEqual` against the app client secret.
- Matches Shopify’s callback HMAC. It never runs if the grant page rejects the install link.

### A5. `lib/integrations/shopify/oauth/token-exchange.ts`

- `POST https://{shop}/admin/oauth/access_token`
- Body JSON: `client_id`, `client_secret`, `code`. `Content-Type: application/json`.
- Success requires HTTP ok and `access_token`. Scope is optional. Errors are `token_exchange_failed` or `missing_access_token`. No timeout.
- The endpoint is correct. Shopify’s current standalone sample uses `application/x-www-form-urlencoded` and sends `expiring=1`, then stores `refresh_token` and `expires_in`. Confirma does neither. That difference cannot cause the grant-page error. It can cause a later token failure if Shopify returns an expiring token. **Uncertain** for this Custom app until a real exchange is observed.

### A6. `lib/integrations/shopify/oauth/callback-handler.ts`

- Order: required params → normalize shop → shop must equal signed state → HMAC → token exchange.
- Failure reasons: `invalid_parameters`, `invalid_shop`, `shop_mismatch`, `invalid_hmac`, `token_exchange_failed`, `missing_access_token`.
- Correct for a callback that actually arrives. It did not arrive.

### A7. `lib/integrations/shopify/env.ts`

- Requires `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_SESSION_SECRET` (min 32), and a valid `NEXT_PUBLIC_APP_URL`.
- `SHOPIFY_OAUTH_SCOPES` defaults to `read_products,read_orders` when unset.
- Redirect URI is `{NEXT_PUBLIC_APP_URL}/api/integrations/shopify/callback` via `getShopifyOAuthCallbackUrl()`.
- With the current public URL that is `https://ignore-savings-joyfully.ngrok-free.dev/api/integrations/shopify/callback`.
- Env validation is fine. The Dashboard allow-list must match that string exactly. This file cannot see the Dashboard.

### A8. `app/api/integrations/shopify/connect/route.ts`

- Logged-in user required. Invalid shop redirects to `/onboarding/store?shopify=error&reason=invalid_shop`.
- Creates signed state, sets cookie `shopify_oauth_state`, redirects to the authorize URL above.
- Cookie: `httpOnly`, `sameSite: lax`, `path: /`, `maxAge: 600`, `secure` only when `NODE_ENV === "production"`.
- This is the URL the previous test opened. It is the step Shopify rejects for a not-yet-installed Custom app.

### A9. `app/api/integrations/shopify/callback/route.ts`

- Requires a Confirma session.
- Cookie `state` must equal the query `state`, then the signature and 600s TTL are checked.
- On success: persist the shop and encrypted token, register `orders/create`, redirect to `/onboarding/store?shopify=connected`.
- This route was never hit.

### A10. `middleware.ts` (Shopify only)

- `/api/integrations/shopify/webhooks` is public. Other `/api/integrations/shopify/*` routes require a Supabase user.
- Unauthenticated `/connect` and `/callback` redirect to `/{locale}/login?next={pathname}{search}`.
- The query string is preserved. The 21 September report that said `?shop=` was dropped is out of date.
- Middleware cannot produce the French grant-page error. That page is on Shopify, after Confirma has already redirected.

### UI note (not in the file list)

`ShopifyConnectForm` exists and links to `/api/integrations/shopify/connect?shop=...`. It is not mounted. `store-provider-panel.tsx` renders only the WooCommerce form. A merchant in the onboarding UI cannot start Shopify from the screen.

---

## 3. Part B — requirements comparison

| # | Requirement | What the code does | Match? |
|---|-------------|--------------------|--------|
| B1 | Custom App **first install** is the Dashboard-generated link `https://admin.shopify.com/store/{store}/oauth/install_custom_app?client_id=…&signature=…` (older form also seen on `{shop}.myshopify.com/admin/oauth/install_custom_app`). The code-grant URL remains `https://{shop}/admin/oauth/authorize` and is still what Shopify documents for standalone apps. | Code uses only `/admin/oauth/authorize`. No install link, no `signature`. | **No, for the first install.** Yes, for the grant that should run after Shopify accepts the install. |
| B2 | `POST https://{shop}.myshopify.com/admin/oauth/access_token` | Same URL. JSON body with `client_id`, `client_secret`, `code`. | **Endpoint yes.** Body shape differs from the current sample (`form-urlencoded` + `expiring=1`). |
| B3 | Admin API `https://{shop}.myshopify.com/admin/api/{version}/` | Version `2026-07`. | **Yes.** |
| B4 | Callback HMAC-SHA256 with the client secret | Implemented in `hmac.ts`. | **Yes.** |
| B5 | Signed httpOnly state cookie, short TTL | Cookie `shopify_oauth_state`, httpOnly, 600s. The value itself is HMAC-signed. | **Yes.** |
| B6 | Redirect URI in the Dev Dashboard must equal the callback | Code sends `{NEXT_PUBLIC_APP_URL}/api/integrations/shopify/callback`. | **Code is consistent.** Dashboard equality was not re-checked in this pass. A mismatch usually fails as a redirect error, not as “this install link cannot be used.” **Uncertain** as the cause of this specific French message. |
| B7 | Custom app may be standalone. If `embedded = false`, App URL can be empty for some setups. Managed install and the Dev Dashboard “Install app” button use the App URL. | Code is standalone. No App Bridge, no session-token exchange, no App URL route. | **Assumes standalone OAuth.** Does not handle the post-install redirect to the App URL. |
| B8 | Minimum scopes `read_orders`, `read_products` | Default `read_products,read_orders`. `SHOPIFY_OAUTH_SCOPES` overrides when set. | **Yes.** |

Official sources used: [Select a distribution method](https://shopify.dev/docs/apps/launch/distribution/select-distribution-method) and [Authenticate a standalone app](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant) (still shows `/admin/oauth/authorize`). The signed `install_custom_app` URL shape is from Shopify community reports of this exact error, not from a URL template on the distribution doc. The distribution doc only says “Generate link” in the Dev Dashboard.

---

## 4. Part C — why the grant page failed

The failure happened on Shopify’s page. Confirma’s callback, HMAC, and token exchange were not involved.

### C1. Most likely cause

**(a)** The test opened `/admin/oauth/authorize` for a Custom app that was not already installed. Shopify treats that as an invalid installation link and shows “Ce lien d'installation ne peut pas être utilisé” (“This installation link cannot be used”).

### C2. Ranked causes

| Rank | Cause | Likelihood |
|------|--------|------------|
| 1 | (a) Authorize URL used as the first install | Highest. The code does this, and this is the reported symptom for that mistake. |
| 2 | (c) `yhken8-ej.myshopify.com` is not the store on the custom install link | High. Custom links are store-specific. A link for another shop, or no generated link at all, yields the same sentence. |
| 3 | (b) Distribution is not Custom, or no install link has been generated | High, and it overlaps (a). If distribution was never selected, there is no valid custom link. The method cannot be changed after it is chosen. |
| 4 | (d) The person on the grant page was staff, not the store owner | Medium. Shopify staff have reported the same wording when a non-owner installs a custom app, even with full app permissions. |
| 5 | (e) Redirect URI / ngrok mismatch | Lower for this exact sentence. It more often surfaces as a redirect-URI error. Still worth confirming because the ngrok host is hardcoded via `NEXT_PUBLIC_APP_URL`. |
| 6 | (f) Client ID mismatch | Low. The Client ID in `.env.local` was previously checked against the Dashboard (`85a23fe3…`). A full-string mismatch was not re-read in this pass (`.env.local` was not opened). |
| 7 | (g) App URL is the placeholder `shopify.dev/apps/default-app-home` | This explains the Dev Dashboard “Install app” button. It does not by itself explain a grant page reached from Confirma’s authorize redirect. It will block the step after a successful custom install. |
| 8 | Embedded app left on, with managed installation | **Uncertain.** Would send the merchant to the App URL instead of Confirma’s callback. Different failure mode unless that URL then bounces into a bad grant. |

### C3. Why each cause produces that error, and what would change

**(a) Authorize URL as first install**  
Shopify’s custom install link is a signed, store-bound URL. `/admin/oauth/authorize` is the permission grant used after Shopify has accepted an install (or for a public app). Opening it first is an install link Shopify will not honor, so the grant page stops and Confirma never sees `code`.  
Fix: generate the custom install link in the Dev Dashboard and open that. Keep `/admin/oauth/authorize` as the second redirect, started by Confirma after Shopify returns `shop`, `hmac`, and `timestamp`.

**(b) Distribution not Custom**  
Without Custom distribution there is no valid per-store install link. Public distribution requires App Store review before install. An app with no distribution method has nothing Shopify will install from a hand-built OAuth URL.  
Fix: on the app Home, Distribution → Custom. This choice is permanent.

**(c) Store not allow-listed**  
The generated link is for one `myshopify.com` domain (or stores in one Plus org). Using it, or an authorize URL, for a different shop produces “this link cannot be used.”  
Fix: generate the link for `yhken8-ej.myshopify.com` specifically.

**(d) Installer is not the store owner**  
Custom install is owner-gated. A staff login can see the same French error.  
Fix: install while logged into `yhken8-ej` as the store owner.

**(e) Redirect URI mismatch**  
If the allow-listed callback is an old ngrok host, Shopify can refuse the install before redirecting. The usual text is about the redirect URI, so this is a weaker fit.  
Fix: allow-list exactly `https://ignore-savings-joyfully.ngrok-free.dev/api/integrations/shopify/callback` with no trailing slash. Restart nothing until that string matches `NEXT_PUBLIC_APP_URL`.

**(f) Client ID mismatch**  
The grant is for a different app than the one whose install link was issued, so Shopify rejects the link.  
Fix: `SHOPIFY_API_KEY` must be the Client ID `85a23fe3a1e8102f9410587962f92f16`. Do not rotate the secret as part of this fix.

**(g) Placeholder App URL**  
The Dev Dashboard install button is not Confirma’s callback. After a real custom install, Shopify redirects to the App URL with `shop`, `hmac`, and `timestamp`, and expects the app to begin the code grant. A placeholder never reaches `/api/integrations/shopify/callback`.  
Fix: set the App URL to a new Confirma route that verifies that HMAC and then redirects to the existing authorize URL. Leave `embedded` off if the app stays standalone.

---

## 5. Part D — the fix (do not apply yet)

### D1. Code

Do not replace `/admin/oauth/authorize` with `install_custom_app`. Confirma cannot create the `signature`.

1. Add one install-entry route, for example `GET /api/integrations/shopify/install`.
2. Read `shop`, `hmac`, `timestamp` (and `host` if present). Verify HMAC-SHA256 with `SHOPIFY_API_SECRET` the same way as the OAuth callback.
3. Require a Confirma session. Preserve the query on the login `next` URL (middleware already does this).
4. Then redirect with the existing `buildShopifyAuthorizeUrl` (`client_id`, `scope`, `redirect_uri`, `state`) and the existing state cookie.
5. Leave token exchange, callback, persistence, and webhook registration as they are for the first test.
6. After a successful exchange, check whether the JSON includes `expires_in` and `refresh_token`. If it does, the current store-only-`access_token` path will go stale. That is a follow-up, not the grant-page fix.
7. Mount `ShopifyConnectForm` only after the install entry exists. A Connect button that still jumps straight to `/authorize` will reproduce this error on every new store.

### D2. Dev Dashboard (app `425297805313`, version `confirma-3`)

1. Distribution: **Custom**. Enter `yhken8-ej.myshopify.com`. Generate link. Copy that full URL. Do not hand-edit it.
2. Allowed redirection URL, exact:

   `https://ignore-savings-joyfully.ngrok-free.dev/api/integrations/shopify/callback`

3. App URL: the new Confirma install route on the same ngrok host, not `https://shopify.dev/apps/default-app-home`.
4. Embedded: **off** for this standalone flow.
5. Scopes on the active version must include `read_products` and `read_orders`. Release `confirma-3` if a scope or URL change is only saved as a draft.
6. Do not use the Dev Dashboard “Install app” button until the App URL points at Confirma.

### D3. `.env.local` names only

No new names are required.

| Name | Action |
|------|--------|
| `SHOPIFY_API_KEY` | Keep. Must stay the Dashboard Client ID. |
| `SHOPIFY_API_SECRET` | Keep. Used for HMAC and token exchange. |
| `SHOPIFY_SESSION_SECRET` | Keep. |
| `SHOPIFY_OAUTH_SCOPES` | Optional. Unset already means `read_products,read_orders`. |
| `NEXT_PUBLIC_APP_URL` | Must stay `https://ignore-savings-joyfully.ngrok-free.dev` while this tunnel is the callback host. |

### D4. URL to open

Open the **generated** link from Dev Dashboard → Distribution → Manage custom install link, while logged into the store as the owner.

Its shape is:

`https://admin.shopify.com/store/yhken8-ej/oauth/install_custom_app?client_id=85a23fe3a1e8102f9410587962f92f16&signature=<Shopify-signed value>`

A URL with only `client_id` is **not** confirmed as valid. The signature comes from “Generate link.” Confirma’s connect URL is the wrong first URL:

`https://ignore-savings-joyfully.ngrok-free.dev/api/integrations/shopify/connect?shop=yhken8-ej.myshopify.com`

Use that connect URL only after the app is already installed, or from the new install-entry route.

### D5. Expected experience after the fix

1. Store owner opens the generated install link.
2. Shopify shows the Confirma install / permissions screen. The French “link cannot be used” page does not appear.
3. Shopify redirects the browser to Confirma’s App URL with `shop`, `hmac`, and `timestamp`.
4. If the merchant is logged into Confirma, Confirma redirects to `/admin/oauth/authorize`.
5. The merchant approves `read_products` and `read_orders`.
6. Shopify redirects to `/api/integrations/shopify/callback?code&shop&state&hmac`.
7. Confirma checks the state cookie and HMAC, exchanges the code, stores the token, registers `orders/create`, and lands on onboarding with `shopify=connected`.

### D6. Risks

- Choosing Custom distribution is permanent, and one app installs on one store (or one Plus organization). Other merchants need a public app and review, or a separate app per store.
- Pointing the App URL at Confirma before the install route exists will 404 after Shopify’s install screen.
- Changing ngrok without updating the redirect allow-list and `NEXT_PUBLIC_APP_URL` breaks the callback.
- If the token comes back expiring and the code ignores `refresh_token`, webhooks registered at install time can later fail with 401.
- Replacing the authorize URL entirely would break re-authorization, which still uses `/admin/oauth/authorize`.

---

## 6. Part E — readiness

| Piece | Ready? |
|-------|--------|
| OAuth code grant (authorize, state, HMAC, token POST, callback) | Yes, once Shopify actually redirects |
| Custom-app first install | No |
| App URL handler | No |
| Onboarding UI for Shopify | No. The form exists and is unwired |
| Webhook register + `orders/create` ingest + HMAC | Yes |
| Order normalization | Yes |
| Persistence (encrypted access token, shop row) | Yes, for a non-expiring token |
| Token refresh | No |
| Adapter `verifyConnection` | Returns `false` always. Not on the install path |

**E2. About 80%** of the integration is functional once the grant page lets the merchant through. The remaining 20% is the first-install entry, the App URL, wiring the form, and confirming whether the token expires.

**E3. After the grant page is fixed, still left:** install-entry route, Dashboard App URL and custom link, mount the Shopify form, and a live check that the callback stores a token and that `orders/create` arrives. Refresh-token support only if the exchange returns `expires_in`.

---

## 7. Part F — alternatives

### F1. Per-store custom app credentials, client-credentials grant

Shopify’s current Dev Dashboard path for an app and a store in the **same organization** is the client-credentials grant: `POST https://{shop}/admin/oauth/access_token` with `grant_type=client_credentials`. The token lasts 24 hours. No merchant OAuth redirect.

- Pros: no grant page, no install-link signature, no App Store review.
- Cons: does not work for a store outside the app’s organization. Token must be refreshed every 24 hours. One Client ID cannot serve arbitrary merchant stores.
- Effort: medium. New token client and a refresh schedule. The current authorization-code callback would stay unused for that store.
- Confirma changes: yes.

Legacy admin-created custom apps (created in the store admin before 1 January 2026) can still reveal a non-expiring Admin API token in the admin. Shopify no longer lets you create those. **Uncertain** whether `yhken8-ej` still has that screen.

### F2. Shopify managed installation

Scopes live in app config. Shopify installs and updates scopes without calling the app. Embedded apps then use token exchange. Standalone apps are told to keep using the authorization-code grant.

- Pros: fewer redirects for an embedded app.
- Cons: Confirma is standalone and has no embedded session handling. Managed install still needs a real App URL. It does not remove Custom-distribution store binding.
- Effort: high if Confirma becomes embedded. Low value if it stays standalone.
- Confirma changes: yes, and they do not fix a bad custom install link by themselves.

### F3. Public distribution

Any merchant can install from the App Store after review. `/admin/oauth/authorize` from Confirma’s connect route is the right start for that model.

- Pros: one Client ID, many stores, the code that already exists is the right grant.
- Cons: review, listing, and billing rules. Not a same-day fix for `yhken8-ej`.
- Effort: product and review work, plus small code only if Shopify requires `expiring=1`.
- Confirma changes: mostly Dashboard and listing, not a new install URL.

---

## 8. Recommended action

Generate the Custom install link for `yhken8-ej.myshopify.com` in the Dev Dashboard and open that signed link as the store owner; add a Confirma route that receives Shopify’s App URL redirect and only then sends the browser to the existing `/admin/oauth/authorize` flow.

## 9. Status

read-only exploration — nothing changed
