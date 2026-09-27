# Enable YouCan on the store onboarding page

Status: uncommitted, awaiting approval

## 1. Summary

The YouCan tab on `/onboarding/store` no longer shows a coming-soon badge or waitlist. It renders the existing `YouCanConnectForm`, the same pattern as Shopify and WooCommerce. Integration code was not changed.

## 2. Files changed

- `components/connections/store-provider-panel.tsx`

No other source file was edited. Message files were left as they are (see section 5).

## 3. YouCan form status

Functional. `components/connections/youcan-connect-form.tsx` already existed. It renders a store-slug input (`connections.youcan.storeSlugLabel`) and a Connect control. With a slug, the control is a link to `/api/integrations/youcan/connect?store={slug}`. Without a slug, the button stays disabled. A connected store shows Disconnect, which posts to `/api/integrations/youcan/disconnect`.

Verified in the browser on `/ar/onboarding/store` (Arabic, RTL): the YouCan tab shows the slug field and “ربط YouCan”. After entering `demo-store`, that control becomes a link. The Shopify tab still shows the shop-domain field and “ربط Shopify”. The WooCommerce tab still shows the store URL field and “ربط WooCommerce”. The connect link was not followed, so no OAuth request was started.

## 4. YouCan connect route status

Wired. `app/api/integrations/youcan/connect/route.ts` exists. It requires a signed-in user, reads `store`, and redirects to the YouCan authorize URL. It was not modified.

## 5. i18n changes

None. YouCan form keys already exist in `messages/en/connections.json` and `messages/ar/connections.json` (`youcan.storeSlugLabel`, `storeSlugPlaceholder`, `connect`, `disconnect`, and the success/failure strings).

`connections.comingSoon` and the waitlist strings were not replaced. They are shared with the Shopify row in `components/connections/add-store-dialog.tsx`, which is outside the allowed edit list. Emptying those values would remove the Shopify badge as well. The onboarding panel no longer reads them for YouCan.

## 6. Code readiness

`lib/integrations/youcan/**` exists (32 files), including:

- OAuth: `oauth/state.ts`, `oauth/crypto.ts`, `oauth/authorize-url.ts`, `oauth/token-exchange.ts`, `oauth/callback-handler.ts`, `oauth/store-slug.ts`, `oauth/constants.ts`, `oauth/index.ts`
- Session and persistence: `session/`, `persistence.ts`, `disconnect.ts`, `env.ts`
- Orders: `orders/normalize.ts`, `orders/parse.ts`, `orders/schema.ts`
- Webhooks: `webhooks/ingest.ts`, `webhooks/hmac.ts`, `webhooks/register.ts`, `webhooks/handlers/order-create.ts`

Signed OAuth state, token exchange, and callback handling exist. Webhook HMAC is separate from the OAuth state signature.

API routes that exist:

- `app/api/integrations/youcan/connect/route.ts`
- `app/api/integrations/youcan/callback/route.ts`
- `app/api/integrations/youcan/disconnect/route.ts`
- `app/api/integrations/youcan/status/route.ts`
- `app/api/integrations/youcan/webhooks/route.ts`
- `app/api/integrations/youcan/register-webhooks/route.ts`

Unit tests: `youcan-oauth`, `youcan-adapter`, `youcan-order-normalize`, `youcan-webhook-ingestion`, `youcan-webhook-headers`, `youcan-webhook-hmac`, `youcan-webhook-registration`.

## 7. Env readiness

Checked by name only. Values were not printed.

- `YOUCAN_API_KEY`: yes
- `YOUCAN_API_SECRET`: yes
- `YOUCAN_SESSION_SECRET`: yes (length meets the 32-character schema)
- `YOUCAN_OAUTH_SCOPES`: yes
- `NEXT_PUBLIC_APP_URL` matches `https://ignore-savings-joyfully.ngrok-free.dev`: yes

## 8. Redirect URI

Code builds `NEXT_PUBLIC_APP_URL` + `/api/integrations/youcan/callback`.

Register this exact URL in the YouCan Partners dashboard:

`https://ignore-savings-joyfully.ngrok-free.dev/api/integrations/youcan/callback`

## 9. Missing pieces

- Whether that redirect URI is already saved in the YouCan Partners app cannot be confirmed from this repo. If it is missing or different, YouCan will reject the authorize redirect.
- `components/connections/add-store-dialog.tsx` still shows YouCan as coming soon. That file is outside the allowed list, so the dashboard “add store” dialog was not changed. The onboarding store page is the surface that was updated.
- A live OAuth round trip was not run.

## 10. Verdict

Partial. The onboarding form, connect route, OAuth code, and environment variables are in place. A live test still depends on the redirect URI being registered in YouCan Partners.

## 11. Tests

326/326 passed (67 files).

## 12. Typecheck and lint

- `npm run typecheck`: pass (exit 0)
- `npm run lint`: pass (exit 0, no warnings)

## 13. Files not touched

- `lib/integrations/**`
- `app/api/integrations/**`
- `lib/auth/**`, `lib/supabase/**`, `lib/database/**`
- `lib/confirmation/**`, `lib/orders/**`, `lib/webhooks/**`
- `lib/content/**`, `lib/videos/**`
- `middleware.ts`, `next.config.ts`, `.env.local`, `package.json`
- `database/migrations/**`, `supabase/migrations/**`
- `components/connections/youcan-connect-form.tsx`
- `components/onboarding/steps.ts`
- `messages/**`
- Existing users, stores, connections, and orders

## 14. Status

uncommitted, awaiting approval
