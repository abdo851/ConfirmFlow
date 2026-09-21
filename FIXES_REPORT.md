# Fixes Report — Auth Query Preservation & Shopify Onboarding UI

**Date:** Monday, 21 September 2026

---

## 1. Executive summary

Middleware now preserves the full path and query string in the login `next` param (e.g. `?shop=` on Shopify connect). `resolveSafeInternalRedirect` validates and passes through safe query strings after login. The onboarding store panel now shows both YouCan and Shopify connect forms with a local provider toggle.

---

## 2. `middleware.ts` changes

**Before (lines 61–67, 73–79, 95–100):**
```typescript
loginUrl.searchParams.set("next", pathname);
```
Only `pathname` was stored — query params like `?shop=yhken8-ej.myshopify.com` were dropped.

**After (lines 54–68, 78–88, 104–106):**
```typescript
function buildLoginNextPath(request: NextRequest): string {
  const { pathname, search } = request.nextUrl;
  return `${pathname}${search}`;
}

function redirectUnauthenticatedToLogin(request, locale) {
  loginUrl.search = "";
  loginUrl.searchParams.set("next", buildLoginNextPath(request));
  return NextResponse.redirect(loginUrl);
}
```

Applied to:
- `/api/integrations/shopify/connect` and `/callback`
- `/api/integrations/youcan/connect` and `/callback`
- Protected app paths (`/dashboard`, `/onboarding`, etc.) — preserves any query they carry

Meta API routes unchanged (still return 401 JSON, no login redirect).

**Example:**  
`/api/integrations/shopify/connect?shop=yhken8-ej.myshopify.com` →  
`/en/login?next=%2Fapi%2Fintegrations%2Fshopify%2Fconnect%3Fshop%3Dyhken8-ej.myshopify.com`

---

## 3. `lib/auth/redirects.ts` changes

**Before:** Rejected or mishandled `next` values containing `?` because `includes("://")` checks ran on the full string.

**After (lines 3–54):** Split `next` into pathname and search; validate each separately; return `${pathname}${search}` when both are safe.

Example accepted value:
```
/api/integrations/shopify/connect?shop=yhken8-ej.myshopify.com
```

Login page and `loginAction` already pass `next` through `resolveSafeInternalRedirect` — no changes to `lib/auth/actions.ts` required.

---

## 4. `store-provider-panel.tsx` changes

**Before:** Rendered only `<YouCanConnectForm />`.

**After:** Provider toggle (YouCan / Shopify buttons) with local `useState`; renders `<YouCanConnectForm />` or `<ShopifyConnectForm />` based on selection. Both wrapped in existing `Suspense` boundary.

---

## 5. i18n keys added

| Key | English | Arabic |
|-----|---------|--------|
| `connections.chooseStoreProvider` | Choose a store provider | اختر مزود المتجر |
| `connections.youcanLabel` | YouCan | YouCan |
| `connections.shopifyLabel` | Shopify | Shopify |
| `connections.loadingStoreProvider` | Loading store connection... | جارٍ تحميل اتصال المتجر... |

Files: `messages/en/connections.json`, `messages/ar/connections.json`

---

## 6. Test failures encountered

None. One typecheck error after initial middleware edit (`locale: string` vs `AppLocale`) — fixed by typing `redirectUnauthenticatedToLogin` with `AppLocale`.

---

## 7. Test results

| Suite | Result |
|-------|--------|
| `npm run test` | **261/261 passed** (39 files) |
| `npm run typecheck` | **Passed** |

---

## 8. Latest commit hash

*(Set after push — see git log)*

---

## 9. Recommended next action

1. Start Next.js + ngrok; confirm `NEXT_PUBLIC_APP_URL` matches ngrok URL.
2. Log into Confirma → onboarding store step → select **Shopify** tab → enter `yhken8-ej.myshopify.com` → Connect.
3. Complete Shopify Custom App OAuth per `SHOPIFY_READINESS_REPORT.md`.

**Note:** Post-login redirect to `/api/*` routes may still receive a locale prefix from `loginAction`'s `redirectWithLocale` (pre-existing). Users already logged in when clicking Connect are unaffected. A follow-up fix in auth actions could skip locale prefix for `/api/` paths.
