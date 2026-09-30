# YouCan readiness

Status: uncommitted, awaiting approval

This is a read-only audit of the YouCan integration, plus the onboarding UI change recorded in `ENABLE_YOUCAN_REPORT.md`. No integration file was modified for this audit.

## 1. Summary

YouCan OAuth, callback, disconnect, status, webhook ingestion, and order normalization are already in the codebase. Environment variables required by `getYouCanOAuthEnv()` are set. The onboarding store page now exposes the existing connect form. A live OAuth test still needs the callback URL registered in YouCan Partners.

## 2. Files changed

UI only:

- `components/connections/store-provider-panel.tsx`

## 3. YouCan form status

The form already existed and is now rendered on the YouCan tab.

- Store slug input: yes (`connections.youcan.storeSlugLabel`)
- Connect button: yes (`connections.youcan.connect`)
- Link target: `/api/integrations/youcan/connect?store={slug}` when the slug is non-empty

Browser check on `/ar/onboarding/store`: slug field and “ربط YouCan” are visible. With `demo-store` typed, the control becomes a link. Shopify and WooCommerce tabs still show their own inputs and connect buttons. The link was not opened.

## 4. YouCan connect route status

`app/api/integrations/youcan/connect/route.ts` exists and is the target of that link. It was not modified.

## 5. i18n changes

No message values were added or replaced. YouCan form strings were already present in English and Arabic. Shared `comingSoon` / waitlist keys stay because the Shopify row in `add-store-dialog.tsx` still uses them.

## 6. Code readiness

### A) Code readiness

`lib/integrations/youcan/**` exists. Files:

- `constants.ts`
- `disconnect.ts`
- `env.ts`
- `index.ts`
- `persistence.ts`
- `oauth/authorize-url.ts`
- `oauth/callback-handler.ts`
- `oauth/constants.ts`
- `oauth/crypto.ts`
- `oauth/index.ts`
- `oauth/state.ts`
- `oauth/store-slug.ts`
- `oauth/token-exchange.ts`
- `orders/index.ts`
- `orders/normalize.ts`
- `orders/parse.ts`
- `orders/schema.ts`
- `session/connection-store.ts`
- `session/index.ts`
- `session/types.ts`
- `store/fetch-details.ts`
- `webhooks/constants.ts`
- `webhooks/handlers/order-create.ts`
- `webhooks/headers.ts`
- `webhooks/hmac.ts`
- `webhooks/index.ts`
- `webhooks/ingest.ts`
- `webhooks/normalize.ts`
- `webhooks/payload-hash.ts`
- `webhooks/register.ts`
- `webhooks/resolve-store.ts`
- `webhooks/topics.ts`

OAuth flow: yes. Signed state (`oauth/state.ts` + `oauth/crypto.ts`), authorize URL, token exchange, and callback handler. Webhook requests use HMAC in `webhooks/hmac.ts`.

Routes:

- connect: yes
- callback: yes
- disconnect: yes
- status: yes
- webhook ingestion: `app/api/integrations/youcan/webhooks/route.ts`
- extra: `app/api/integrations/youcan/register-webhooks/route.ts`

Order normalization: `lib/integrations/youcan/orders/normalize.ts`.

Unit tests: `youcan-oauth.test.ts`, `youcan-adapter.test.ts`, `youcan-order-normalize.test.ts`, `youcan-webhook-hmac.test.ts`, `youcan-webhook-headers.test.ts`, `youcan-webhook-ingestion.test.ts`, `youcan-webhook-registration.test.ts`.

## 7. Env readiness

### B) Environment readiness

Presence only. No values printed.

- `YOUCAN_API_KEY`: yes
- `YOUCAN_API_SECRET`: yes
- `YOUCAN_SESSION_SECRET`: yes, and long enough for the schema (`min(32)`)
- `YOUCAN_OAUTH_SCOPES`: yes
- `NEXT_PUBLIC_APP_URL` matches the current ngrok host: yes

## 8. Redirect URI

### C) Redirect URI readiness

Expected callback from `buildYouCanOAuthCallbackUrl`:

`{NEXT_PUBLIC_APP_URL}/api/integrations/youcan/callback`

That matches:

`https://ignore-savings-joyfully.ngrok-free.dev/api/integrations/youcan/callback`

Register that exact URL in the YouCan Partners dashboard.

## 9. Missing pieces

### D) Missing pieces

- Partner-dashboard registration of the callback URL is not visible from the repo. A mismatch blocks the authorize redirect.
- The dashboard add-store dialog still labels YouCan “coming soon”. That component was not in the allowed edit list.
- No live authorize → callback → token exchange was executed in this pass.

## 10. Verdict

### E) Verdict

Partial.

Ready in code and environment. Blocker for a live test: the callback URL above must already be the redirect URI on the YouCan app. If it is, the onboarding form can start the flow. If it is not, YouCan will refuse the install before Confirma’s callback runs.

## 11. Tests

326/326 passed (67 files).

## 12. Typecheck and lint

- `npm run typecheck`: pass (exit 0)
- `npm run lint`: pass (exit 0, no warnings)

## 13. Files not touched

- `lib/integrations/**` (read only)
- `app/api/integrations/**` (read only)
- `lib/auth/**`, `lib/supabase/**`, `lib/database/**`
- `lib/confirmation/**`, `lib/orders/**`, `lib/webhooks/**`
- `lib/content/**`, `lib/videos/**`
- `middleware.ts`, `next.config.ts`, `.env.local`, `package.json`
- `database/migrations/**`, `supabase/migrations/**`
- Existing users, stores, connections, and orders

## 14. Status

uncommitted, awaiting approval
