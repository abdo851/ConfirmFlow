# Shopify Readiness Report — Confirma Custom App OAuth Test

**Date:** Monday, 21 September 2026  
**App:** Confirma (`confirma-3`, Active)  
**Partner Dashboard:** `dev.shopify.com/dashboard/177828797/apps/425297805313`  
**Development store:** `yhken8-ej.myshopify.com`  
**Public base URL (from `.env.local`):** `https://ignore-savings-joyfully.ngrok-free.dev`  
**Audit type:** Read-only — no code, env, or migration changes

---

## 1. Code audit summary (STEP 1)

### `lib/integrations/shopify/oauth/shop-domain.ts`

| | |
|---|---|
| **What it does** | Normalizes shop input to `*.myshopify.com` and builds the Shopify authorize URL. |
| **URLs** | `https://{shop}/admin/oauth/authorize` with query params `client_id`, `scope`, `redirect_uri`, `state`. |
| **Validation** | Regex `^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$`. Bare slug (e.g. `yhken8-ej`) auto-appended to `.myshopify.com`. Returns `null` if invalid. |

### `lib/integrations/shopify/oauth/state.ts`

| | |
|---|---|
| **What it does** | Creates and parses signed OAuth `state` containing `nonce`, `shop`, and `issuedAt`. |
| **URLs** | None. |
| **Validation** | State payload must have string `nonce`, string `shop`, number `issuedAt`; rejects expired state (TTL checked by caller). Signature verified via HMAC-SHA256 (`crypto.ts`). |

### `lib/integrations/shopify/oauth/hmac.ts`

| | |
|---|---|
| **What it does** | Validates Shopify callback query params and verifies callback HMAC. |
| **URLs** | None. |
| **Validation** | Requires `code`, `shop`, `state`, `hmac`. HMAC: sort params (exclude `hmac`/`signature`), join as `key=value&...`, HMAC-SHA256 with client secret, timing-safe compare. |

### `lib/integrations/shopify/oauth/token-exchange.ts`

| | |
|---|---|
| **What it does** | Exchanges authorization code for access token via Shopify Admin OAuth endpoint. |
| **URLs** | `POST https://{shop}/admin/oauth/access_token` |
| **Validation** | Requires HTTP 200 and `access_token` in JSON body; returns structured error otherwise. |

### `lib/integrations/shopify/oauth/callback-handler.ts`

| | |
|---|---|
| **What it does** | Orchestrates full callback: param check → shop normalize → shop/state match → HMAC → token exchange. |
| **URLs** | Delegates token exchange to `token-exchange.ts`. |
| **Validation** | Fails on: missing params, invalid shop, shop mismatch with signed state, invalid HMAC, token exchange failure, missing access token. |

### `lib/integrations/shopify/env.ts`

| | |
|---|---|
| **What it does** | Loads and validates Shopify OAuth environment via Zod. |
| **URLs** | Builds redirect URI via `getShopifyOAuthCallbackUrl()` → `{NEXT_PUBLIC_APP_URL}/api/integrations/shopify/callback`. |
| **Validation** | Requires non-empty `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_SESSION_SECRET` (min 32 chars), valid `NEXT_PUBLIC_APP_URL`. `SHOPIFY_OAUTH_SCOPES` defaults to `read_products,read_orders` if unset. |

### `lib/integrations/shopify/constants.ts`

| | |
|---|---|
| **What it does** | Defines Admin API version constant. |
| **URLs** | None directly. |
| **Validation** | `SHOPIFY_ADMIN_API_VERSION = "2026-07"`. |

### `app/api/integrations/shopify/connect/route.ts`

| | |
|---|---|
| **What it does** | OAuth entry point: validates shop, creates signed state cookie, redirects to Shopify authorize URL. |
| **URLs** | Redirects to `buildShopifyAuthorizeUrl(...)`. On error → localized `/onboarding/store?shopify=error&reason=...`. |
| **Validation** | Requires authenticated user (route-level); `normalizeShopDomain(shop)` must succeed; env must parse. Sets `shopify_oauth_state` httpOnly cookie (600s TTL). |

### `app/api/integrations/shopify/callback/route.ts`

| | |
|---|---|
| **What it does** | OAuth callback: verifies state cookie, runs callback handler, persists connection, registers webhooks. |
| **URLs** | Redirects to localized onboarding paths on success/failure. |
| **Validation** | Auth required; state cookie must match query `state`; signed state must parse and not be expired; full HMAC + token flow via handler. |

### `middleware.ts` (Shopify-related only, lines 57–71)

| | |
|---|---|
| **What it does** | Protects `/api/integrations/shopify/*` except webhooks; unauthenticated connect/callback → login redirect. |
| **URLs** | Redirects to `/{locale}/login?next={pathname}` — **pathname only, no query string**. |
| **Validation** | Webhook path `/api/integrations/shopify/webhooks` is public (HMAC verified in handler). All other Shopify API routes require Supabase session. |

### Additional note (UI, not in STEP 1 file list)

`components/connections/store-provider-panel.tsx` currently renders **`YouCanConnectForm` only**. `ShopifyConnectForm` exists but is **not wired** into onboarding UI. Custom App testing must use a **direct connect URL** (see test plan below).

---

## 2. Shopify URL table (STEP 2)

Base URL used at runtime: `{NEXT_PUBLIC_APP_URL}` = `https://ignore-savings-joyfully.ngrok-free.dev`  
Example shop: `yhken8-ej.myshopify.com`

| Purpose | URL | Source file |
|---------|-----|-------------|
| **Authorization** | `https://{shop}.myshopify.com/admin/oauth/authorize?client_id=...&scope=...&redirect_uri=...&state=...` | `lib/integrations/shopify/oauth/shop-domain.ts` |
| **OAuth callback (Confirma)** | `https://ignore-savings-joyfully.ngrok-free.dev/api/integrations/shopify/callback` | `lib/config/app-url.ts` → `lib/integrations/shopify/env.ts` |
| **Connect entry (Confirma)** | `https://ignore-savings-joyfully.ngrok-free.dev/api/integrations/shopify/connect?shop={shop}` | `app/api/integrations/shopify/connect/route.ts` |
| **Token exchange** | `POST https://{shop}.myshopify.com/admin/oauth/access_token` | `lib/integrations/shopify/oauth/token-exchange.ts` |
| **Webhook ingestion (Confirma)** | `https://ignore-savings-joyfully.ngrok-free.dev/api/integrations/shopify/webhooks` | `lib/config/app-url.ts` → `lib/integrations/shopify/webhooks/register.ts` |
| **Webhook registration (list)** | `GET https://{shop}.myshopify.com/admin/api/2026-07/webhooks.json` | `lib/integrations/shopify/webhooks/register.ts` |
| **Webhook registration (create)** | `POST https://{shop}.myshopify.com/admin/api/2026-07/webhooks.json` | `lib/integrations/shopify/webhooks/register.ts` |
| **Webhook registration (update)** | `PUT https://{shop}.myshopify.com/admin/api/2026-07/webhooks/{id}.json` | `lib/integrations/shopify/webhooks/register.ts` |
| **Webhook registration (delete)** | `DELETE https://{shop}.myshopify.com/admin/api/2026-07/webhooks/{id}.json` | `lib/integrations/shopify/webhooks/register.ts` |
| **Admin API base** | `https://{shop}.myshopify.com/admin/api/2026-07/` | `lib/integrations/shopify/constants.ts` + `webhooks/register.ts` |
| **API version** | `2026-07` | `lib/integrations/shopify/constants.ts` |

---

## 3. Requirement-by-requirement comparison (STEP 3)

| # | Requirement | Code status | Notes |
|---|-------------|-------------|-------|
| 1 | Authorization URL: `https://{shop}.myshopify.com/admin/oauth/authorize` | **Correct** | Built in `buildShopifyAuthorizeUrl()`. |
| 2 | Token exchange: `POST https://{shop}.myshopify.com/admin/oauth/access_token` | **Correct** | JSON body with `client_id`, `client_secret`, `code`. |
| 3 | Admin API base: `https://{shop}.myshopify.com/admin/api/2026-07/` | **Correct** | Version constant `2026-07`. **Uncertain:** whether Shopify has fully enabled `2026-07` for this dev store — if API calls fail post-OAuth, try verifying version availability in Partners Dashboard. |
| 4 | Callback verifies HMAC-SHA256 with Client Secret | **Correct** | `verifyShopifyCallbackHmac()` in `hmac.ts`; unit tests cover this. |
| 5 | Callback verifies signed state cookie | **Correct** | Cookie `shopify_oauth_state` must match query `state`; payload signed with `SHOPIFY_SESSION_SECRET`; TTL 600s. |
| 6 | Custom App: Embedded = False in Partner Dashboard | **Unclear** | Not verifiable from code. Must confirm in Partner Dashboard app setup. Confirma uses **standalone OAuth**, not App Bridge / embedded admin. |
| 7 | Authorized redirect URI matches callback exactly | **Correct in code** | Code emits `{NEXT_PUBLIC_APP_URL}/api/integrations/shopify/callback`. **Dashboard must match exactly** — trailing slash, http vs https, and ngrok hostname must align. Previous testing reported a match; re-verify if ngrok was restarted. |

**Code verdict:** OAuth implementation aligns with Shopify OAuth requirements. The previous grant-page failure (`Ce lien d'installation ne peut pas être utilisé`) occurred **before** Confirma's callback — strongly indicating a **Shopify Partners Dashboard / distribution / install eligibility** issue, not incorrect URL construction in code.

---

## 4. Middleware auth behavior (STEP 4)

**Question:** Does middleware preserve the FULL URL including query string when redirecting unauthenticated users to login?

**Answer: No.**

Relevant code (`middleware.ts`, lines 61–67):

```typescript
loginUrl.searchParams.set("next", pathname);
```

For a request to `/api/integrations/shopify/connect?shop=yhken8-ej.myshopify.com`:

1. Unauthenticated user is redirected to `/{locale}/login?next=/api/integrations/shopify/connect`
2. The `?shop=yhken8-ej.myshopify.com` query string is **dropped**
3. After login, `loginAction` redirects to `/api/integrations/shopify/connect` **without** `shop`
4. Connect route calls `normalizeShopDomain("")` → `null` → redirect with `reason=invalid_shop`

**Impact:** If the user is not logged in when clicking Connect, the shop parameter is lost. This causes `invalid_shop`, **not** the French grant-page error — but it is still a real bug for the connect flow.

**Mitigation for testing:** Log into Confirma **first**, then open the full connect URL in the same browser session.

---

## 5. Environment variable status (STEP 5)

Names only — values not printed.

| Variable | Set in `.env.local`? |
|----------|----------------------|
| `SHOPIFY_API_KEY` | **Yes** |
| `SHOPIFY_API_SECRET` | **Yes** |
| `SHOPIFY_SESSION_SECRET` | **Yes** |
| `SHOPIFY_OAUTH_SCOPES` | **No** — code uses default `read_products,read_orders` from `env.ts` |
| `NEXT_PUBLIC_APP_URL` | **Yes** |

User confirmed Client ID in Dashboard matches `SHOPIFY_API_KEY` prefix `85a23fe3a1e8102f94...`.

---

## 6. Shopify Custom App test plan (STEP 6)

### Prerequisites

1. **Next.js running** on port 3000 (`npm run dev`)
2. **ngrok running** on port 3000 (`ngrok http 3000`)
3. **`NEXT_PUBLIC_APP_URL`** in `.env.local` matches current ngrok HTTPS URL
4. **Logged into Confirma** as test user (`test@confirma.local`) in the same browser

### A. Partner Dashboard configuration

1. Open [Confirma app settings](https://dev.shopify.com/dashboard/177828797/apps/425297805313).
2. Confirm version **confirma-3** is **Active**.
3. **Distribution:** Set to **Custom distribution** (not public App Store).
4. **Allowed stores:** Add development store **`yhken8-ej.myshopify.com`** to the allow-list.
5. **Embedded app:** Set **Embedded = false** (standalone OAuth).
6. **Legacy installation flow:** Enable if available (`use_legacy_install_flow`) — prior handoff notes indicate this was required for standalone OAuth.
7. **Allowed redirection URL(s)** — add exactly:
   ```
   https://ignore-savings-joyfully.ngrok-free.dev/api/integrations/shopify/callback
   ```
   If ngrok URL changed, use the new URL instead.
8. **App URL:** Confirma has **no App URL handler**. Placeholder `https://shopify.dev/apps/default-app-home` is expected. **Do not use** the Dev Dashboard **"Install app"** button as the primary test path — it will not reach Confirma's OAuth callback.
9. **Scopes:** Ensure app requests at least `read_products,read_orders` (matches code default).

### B. URL to open in browser

While logged into Confirma, open:

```
https://ignore-savings-joyfully.ngrok-free.dev/api/integrations/shopify/connect?shop=yhken8-ej.myshopify.com
```

Shorthand also works (code appends domain):

```
https://ignore-savings-joyfully.ngrok-free.dev/api/integrations/shopify/connect?shop=yhken8-ej
```

### C. Expected flow at each step

| Step | What happens | Success signal |
|------|--------------|----------------|
| 1 | Browser hits Confirma connect route | HTTP 307 redirect (check dev server log) |
| 2 | Redirect to Shopify authorize page | Shopify login/consent screen for `yhken8-ej` |
| 3 | User approves permissions | Redirect to Confirma callback with `code`, `shop`, `state`, `hmac` |
| 4 | Confirma callback handler runs | Dev server log: `GET /api/integrations/shopify/callback?...` |
| 5 | Token exchange + DB persist + webhook register | Redirect to `/onboarding/store?shopify=connected` |
| 6 | Grant page (previous failure point) | **Must NOT** show `Ce lien d'installation ne peut pas être utilisé` |

### D. How to verify success in Confirma

1. **Browser:** Land on onboarding store page with `?shopify=connected` (no error flash).
2. **Dev server logs:** See callback request with 307/302 to onboarding.
3. **ngrok inspector** (`http://127.0.0.1:4040`): See callback hit on public URL.
4. **API status** (while logged in): `GET /api/integrations/shopify/status` → `status: "connected"`, `shop: "yhken8-ej.myshopify.com"`.
5. **Shopify Partners Dashboard:** Installations counter should increment from `0` to `1`.
6. **Supabase** (optional): Row in `shopify_connections` for the store.

### E. If it fails again

| Symptom | Likely cause |
|---------|--------------|
| Grant page French error | Dashboard distribution / store allow-list / install eligibility |
| `invalid_shop` in Confirma | Lost `shop` query (auth redirect bug) or malformed shop input |
| `invalid_state` | Expired OAuth flow (>10 min) or cookie blocked |
| `invalid_hmac` | `SHOPIFY_API_SECRET` mismatch with Dashboard |
| `configuration` | Missing/invalid env vars |
| No callback in logs | Failure still on Shopify side before redirect |

---

## 7. Three most likely causes of previous grant-page failure

1. **Custom distribution / store allow-list not configured** — App not eligible to install on `yhken8-ej.myshopify.com`. Shopify shows `Ce lien d'installation ne peut pas être utilisé` at the grant step when the store is not permitted for this app's distribution mode.

2. **Wrong install path used** — Dev Dashboard **"Install app"** uses the App URL (`shopify.dev/apps/default-app-home`), not Confirma's OAuth connect flow. This path never reaches Confirma's callback and can produce confusing install errors.

3. **Redirect URI or app version mismatch** — If ngrok URL changed or the Active version's allowed redirect URLs do not exactly match `{NEXT_PUBLIC_APP_URL}/api/integrations/shopify/callback`, Shopify may reject installation at the grant step. Prior testing reported a match; must be re-verified whenever ngrok restarts.

---

## 8. Recommended immediate next action

1. **Start dev server + ngrok** and confirm `NEXT_PUBLIC_APP_URL` matches the live ngrok URL.
2. **In Partner Dashboard:** Confirm Custom distribution, add `yhken8-ej.myshopify.com` to allowed stores, verify redirect URI, confirm Embedded = false.
3. **Log into Confirma**, then open the direct connect URL (Section 6B) — do **not** use Dev Dashboard "Install app".
4. If grant page succeeds and callback reaches Confirma, verify `shopify=connected` and installation count.
5. **Optional follow-up (code, not done in this audit):** Fix middleware to preserve full connect URL including `?shop=` in the login `next` param; wire `ShopifyConnectForm` back into onboarding UI.

---

*Report generated read-only. No application code, `.env.local`, or migrations were modified.*
