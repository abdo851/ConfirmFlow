# TikTok + Google scaffold report

## 1. Summary

TikTok Events API and Google Ads Enhanced Conversions now have their own tables, encrypted credential storage, delivery records, API routes, and dashboard forms. They run beside Meta. A TikTok or Google failure does not change the Meta result.

No live TikTok or Google credentials were added. Google verify only checks that the conversion id and access token have the expected length. TikTok verify sends a zero-value test event and treats HTTP 200 as verified.

Nothing was committed. Existing users, the WooCommerce store, the Meta connection, orders, and `meta_conversion_deliveries` were not modified.

## 2. Migration 014

`database/migrations/014_tiktok_google_integration.sql`

Mirrored to `supabase/migrations/20260925180000_tiktok_google_integration.sql`.

- Extends `stores.platform`, `orders.provider`, and `store_webhook_events.provider` to include `tiktok` and `google`.
- Creates `tiktok_connections`, `tiktok_connection_secrets`, `tiktok_conversion_deliveries`.
- Creates `google_connections`, `google_connection_secrets`, `google_conversion_deliveries`.
- Indexes, `set_updated_at` triggers, and owner-scoped SELECT policies.
- Secret tables have RLS and no user policies.
- Does not alter `meta_conversion_deliveries`.

This file is not applied to the live database yet.

## 3. TikTok files created

- `lib/integrations/tiktok/constants.ts`
- `lib/integrations/tiktok/env.ts`
- `lib/integrations/tiktok/types.ts`
- `lib/integrations/tiktok/validation.ts`
- `lib/integrations/tiktok/persistence.ts`
- `lib/integrations/tiktok/disconnect.ts`
- `lib/integrations/tiktok/index.ts`
- `lib/integrations/tiktok/capi/hash-user-data.ts`
- `lib/integrations/tiktok/capi/payload-builder.ts`
- `lib/integrations/tiktok/capi/client.ts`
- `lib/integrations/tiktok/verification/verify-credentials.ts`
- `lib/integrations/tiktok/delivery/eligibility.ts`
- `lib/integrations/tiktok/delivery/deliver-purchase.ts`
- `lib/integrations/tiktok/session/connection-store.ts`

## 4. Google files created

- `lib/integrations/google/constants.ts`
- `lib/integrations/google/env.ts`
- `lib/integrations/google/types.ts`
- `lib/integrations/google/validation.ts`
- `lib/integrations/google/persistence.ts`
- `lib/integrations/google/disconnect.ts`
- `lib/integrations/google/index.ts`
- `lib/integrations/google/capi/hash-user-data.ts`
- `lib/integrations/google/capi/payload-builder.ts`
- `lib/integrations/google/capi/client.ts`
- `lib/integrations/google/verification/verify-credentials.ts`
- `lib/integrations/google/delivery/eligibility.ts`
- `lib/integrations/google/delivery/deliver-purchase.ts`
- `lib/integrations/google/session/connection-store.ts`

## 5. API routes created

- `app/api/integrations/tiktok/connect/route.ts` (POST, returns `{ ok: true }`)
- `app/api/integrations/tiktok/disconnect/route.ts`
- `app/api/integrations/tiktok/status/route.ts`
- `app/api/integrations/tiktok/verify/route.ts`
- `app/api/integrations/google/connect/route.ts`
- `app/api/integrations/google/disconnect/route.ts`
- `app/api/integrations/google/status/route.ts`
- `app/api/integrations/google/verify/route.ts`

All of these require a signed-in user. Middleware returns 401 when the caller is anonymous.

## 6. UI pages

- `app/[locale]/dashboard/tracking/tiktok/page.tsx` — replaced the Coming Soon panel with `TikTokConnectForm` and delivery counts.
- `app/[locale]/dashboard/tracking/google/page.tsx` — new. Same pattern.
- `components/tracking/tiktok-connect-form.tsx`
- `components/tracking/google-connect-form.tsx`
- Tracking overview links to both and no longer marks them Coming Soon.

The sidebar still shows the Coming Soon badge on TikTok. `components/dashboard/sidebar.tsx` was outside the allowed edit set, so it was left as-is.

Unauthenticated requests to `/ar/dashboard/tracking/tiktok`, `/ar/dashboard/tracking/google`, and `/ar/dashboard/tracking/capi` all return 307 to the Arabic login page. A logged-in visual pass was not completed in this turn.

## 7. Files modified

- `lib/confirmation/purchase-delivery.ts` — after the existing Meta call, adds TikTok and Google dispatches, each in its own try/catch. The Meta return value is unchanged.
- `middleware.ts` — protects `/api/integrations/tiktok` and `/api/integrations/google`. Existing Shopify, YouCan, WooCommerce, and Meta checks are unchanged.
- `app/[locale]/dashboard/tracking/page.tsx` — TikTok and Google cards, Coming Soon removed from those two.
- `app/[locale]/dashboard/tracking/tiktok/page.tsx` — replaced Coming Soon.
- `tests/unit/i18n.test.ts` — added the `tracking` namespace to the key-parity list.
- `messages/en/tracking.json` and `messages/ar/tracking.json` — new files. No existing keys were deleted.

`i18n/request.ts` was not changed. The new pages import the tracking JSON directly.

## 8. Tests

326/326 passed (67 files). Previous suite was 318. The 8 new tests are the TikTok and Google files below.

- `tests/unit/tiktok-payload-builder.test.ts`
- `tests/unit/tiktok-persistence.test.ts`
- `tests/unit/tiktok-delivery-eligibility.test.ts`
- `tests/unit/google-payload-builder.test.ts`
- `tests/unit/google-persistence.test.ts`

## 9. Typecheck

pass

## 10. Lint

pass (eslint, no problems)

## 11. Files not touched

- `lib/integrations/meta/**`
- `lib/integrations/woocommerce/**`
- `lib/integrations/youcan/**`
- `lib/integrations/shopify/**` (imported the existing encrypt helper only)
- `app/api/integrations/meta/**`
- `app/api/integrations/woocommerce/**`
- `app/api/integrations/youcan/**`
- `app/api/integrations/shopify/**`
- `lib/auth/**`, `lib/supabase/**`, `lib/database/**`
- `lib/orders/**`, `lib/webhooks/**`, `lib/content/**`, `lib/videos/**`
- `lib/logging/**`, `lib/security/**`, `lib/utils/**`, `lib/config/**`
- `next.config.ts`, `.env.local`, `package.json`
- `database/migrations/001` through `013`
- `supabase/migrations` files other than the new `20260925180000_tiktok_google_integration.sql`
- `app/api/auth/**`, `app/api/orders/**`, `app/api/dashboard/**`, `app/api/supabase/**`, `app/api/health/**`

`lib/confirmation/purchase-delivery.ts` and `middleware.ts` were edited only as specified in parts F and G. The rest of `lib/confirmation/**` was not touched.

Existing admin user, merchant user, WooCommerce store, Meta connection, orders, and `meta_conversion_deliveries` were not modified.

## 12. Status

uncommitted, awaiting approval

## 13. Next steps

Apply migration 014 only after review:

1. Review `database/migrations/014_tiktok_google_integration.sql`.
2. Apply that file to the Supabase project (SQL editor or `supabase db push` against the matching remote). Do not edit migrations 001–013.
3. Add `TIKTOK_SESSION_SECRET` (at least 32 characters) before a merchant saves a TikTok token. The value encrypts the token. It is not a TikTok API credential.
4. Add `GOOGLE_SESSION_SECRET` (at least 32 characters) the same way. Add `GOOGLE_ADS_DEVELOPER_TOKEN` only when a real Google Ads upload should run. Until then, delivery records fail with “developer token is not configured” and Meta is unaffected.
5. TikTok verify calls `https://business-api.tiktok.com/open_api/v1.3/event/track/`. Do not press Verify until a real pixel code and access token exist.
6. Google verify does not call Google. Real OAuth is still future work.
7. After the migration is applied, open `/ar/dashboard/tracking/tiktok` and `/ar/dashboard/tracking/google` while signed in and confirm the forms, masked ids, and zero delivery counts.
