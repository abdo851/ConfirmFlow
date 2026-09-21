# WooCommerce Connect-Only Report

**Date:** Monday, 21 September 2026

## 1. Summary

WooCommerce is now a third store provider for connect-only Application Authentication. A merchant enters a store URL, Confirma redirects to `{store}/wc-auth/v1/authorize`, WooCommerce POSTs `consumer_key` and `consumer_secret` to an unauthenticated callback, and the browser can return to onboarding. Credentials are encrypted and stored. Order webhooks and normalization are not implemented. YouCan, Shopify, and Meta modules were not edited.

## 2. Files created

- `database/migrations/010_woocommerce_integration_foundation.sql`
- `supabase/migrations/20260921190000_woocommerce_integration_foundation.sql`
- `lib/integrations/woocommerce/constants.ts`
- `lib/integrations/woocommerce/types.ts`
- `lib/integrations/woocommerce/env.ts`
- `lib/integrations/woocommerce/validation.ts`
- `lib/integrations/woocommerce/persistence.ts`
- `lib/integrations/woocommerce/disconnect.ts`
- `lib/integrations/woocommerce/index.ts`
- `lib/integrations/woocommerce/oauth/crypto.ts`
- `lib/integrations/woocommerce/oauth/state.ts`
- `lib/integrations/woocommerce/oauth/authorize-url.ts`
- `lib/integrations/woocommerce/oauth/callback-verify.ts`
- `lib/integrations/woocommerce/session/connection-store.ts`
- `app/api/integrations/woocommerce/connect/route.ts`
- `app/api/integrations/woocommerce/callback/route.ts`
- `app/api/integrations/woocommerce/disconnect/route.ts`
- `app/api/integrations/woocommerce/status/route.ts`
- `components/connections/woocommerce-connect-form.tsx`
- `tests/unit/woocommerce-connect.test.ts`

## 3. Files modified

- `middleware.ts` — protect `/api/integrations/woocommerce/*` except `/callback`
- `components/connections/store-provider-panel.tsx` — WooCommerce toggle
- `messages/en/connections.json`
- `messages/ar/connections.json`
- `.env.example` — `WOOCOMMERCE_SESSION_SECRET` placeholder

`.env.local` received `WOOCOMMERCE_SESSION_SECRET` locally only. It is not committed.

## 4. Migration 010

- Recreates `stores_platform_check`, `orders_provider_check`, and `store_webhook_events_provider_check` to allow `shopify`, `youcan`, and `woocommerce`.
- Adds `woocommerce_connections` (`store_url` unique) and `woocommerce_connection_secrets` (`encrypted_consumer_key`, `encrypted_consumer_secret`).
- Index `idx_woocommerce_connections_store_url`.
- RLS: owners can SELECT connection metadata; secrets have no user policies; writes are service-role only.
- `updated_at` triggers reuse `set_updated_at()`.

Not applied to the remote database in this task.

## 5. API routes

| Route | Auth | Behavior |
|-------|------|----------|
| `GET /api/integrations/woocommerce/connect?store=` | Required | Validates URL, sets `woocommerce_oauth_state`, redirects to `/wc-auth/v1/authorize`. Callback URL includes signed `state`. |
| `POST /api/integrations/woocommerce/callback?state=` | Public | Verifies state and body (`key_id`, `user_id`, `consumer_key`, `consumer_secret`, `key_permissions`). Persists secrets. Returns `OK`. |
| `GET /api/integrations/woocommerce/callback?success=` | Public | `success=1` → onboarding connected; otherwise `callback_failed`. |
| `POST /api/integrations/woocommerce/disconnect` | Required | Deletes connection, secrets, and store connection rows. |
| `GET /api/integrations/woocommerce/status` | Required | `{ connected, store_url, status, error_message }` |

`return_url` is `{NEXT_PUBLIC_APP_URL}/onboarding/store?woocommerce=connected`. `scope` is `read_write`. `user_id` is the Confirma user id.

## 6. Manual test

1. Apply migration 010 (`supabase db push`) before a live connect. Without it, the callback POST cannot insert rows.
2. Restart Next.js so it loads `WOOCOMMERCE_SESSION_SECRET`.
3. Confirm ngrok still matches `NEXT_PUBLIC_APP_URL` (`https://ignore-savings-joyfully.ngrok-free.dev`).
4. Log in as `test@confirma.local`.
5. Open onboarding → Store → WooCommerce.
6. Enter `ancientcoach.s2-tastewp.com` (normalizes to `https://ancientcoach.s2-tastewp.com`).
7. Approve access on the WooCommerce grant screen while logged into that store as an admin.
8. Expect a POST to `/api/integrations/woocommerce/callback` and a browser return with `woocommerce=connected`.
9. `GET /api/integrations/woocommerce/status` should report `connected: true`.

The test consumer key and consumer secret from the working session were **not** written into the repo. WooCommerce generates keys during Application Auth; do not paste them into git. REST checks, if needed later, use HTTP Basic auth against `https://ancientcoach.s2-tastewp.com/wp-json/wc/v3/`.

## 7. Tests

`266/266` passed (40 files). Previous baseline was 261; five WooCommerce unit tests were added.

## 8. Typecheck

`npm run typecheck` passed.

## 9. Latest commit hash

Feature commit: `242c497`.

## 10. Next steps

- Apply migration 010 on Supabase (`supabase db push`). Do not run it from this task.
- Restart the dev server after the env append.
- Live-test Application Auth against `https://ancientcoach.s2-tastewp.com`.
- Later milestone: WooCommerce webhooks and order normalization. Not in this change.
