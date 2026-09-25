# GA4 Measurement Protocol

## 1. Summary

Confirmed purchases can be sent to GA4 through the Measurement Protocol. A live Google connection was created for the admin WooCommerce store, credentials were checked on the GA4 debug endpoint, and a real `purchase` event was accepted for the latest confirmed order.

Google Ads Enhanced Conversions were not implemented.

## 2. Env vars added

- `GOOGLE_SESSION_SECRET` (appended to `.env.local`)

The GA4 API secret is not stored in `.env.local`.

## 3. New store_connection id

`a9b06da0-e93d-4992-9958-2a8fa12118c0`

Store: `9e1d1728-8146-447f-b8cd-51b4bb5d74ea` (reused from the existing TikTok connection).

## 4. New google_connections id

`a9b06da0-e93d-4992-9958-2a8fa12118c0`

Primary key is `store_connection_id`.

## 5. Measurement ID

`G-LPR5JCJCSZ`

Stored in `google_connections.conversion_id`.

## 6. API Secret

Encrypted and stored in `google_connection_secrets.encrypted_access_token`. Not printed.

## 7. Verification status

`verified`

Debug check: `POST https://www.google-analytics.com/debug/mp/collect` returned HTTP 200 with `validationMessages` length 0.

## 8. Test delivery

- Result: **sent**
- Order: `e5059e24-7f82-4cda-bffb-0271aaac4897`
- Event id: `google:purchase:e5059e24-7f82-4cda-bffb-0271aaac4897`
- Attempts: 1
- GA4 response body: empty (Measurement Protocol `/mp/collect` returns no body on success)
- `validationMessages`: none on the live collect call. The credential debug check above had an empty `validationMessages` array.

## 9. Files created

- `scripts/add-google-connection.mjs`
- `scripts/test-google-event.mjs`
- `GOOGLE_GA4_REPORT.md`

## 10. Files modified

- `.env.local` (append only)
- `lib/integrations/google/constants.ts`
- `lib/integrations/google/validation.ts`
- `lib/integrations/google/persistence.ts`
- `lib/integrations/google/types.ts`
- `lib/integrations/google/index.ts`
- `lib/integrations/google/capi/client.ts`
- `lib/integrations/google/capi/payload-builder.ts`
- `lib/integrations/google/delivery/eligibility.ts`
- `lib/integrations/google/delivery/deliver-purchase.ts`
- `lib/integrations/google/verification/verify-credentials.ts`
- `app/api/integrations/google/connect/route.ts`
- `components/tracking/google-connect-form.tsx`
- `messages/en/tracking.json`
- `messages/ar/tracking.json`

`app/api/integrations/google/verify/route.ts`, `status/route.ts`, and `disconnect/route.ts` already call the updated helpers and did not need edits. `lib/confirmation/purchase-delivery.ts` already dispatches Google after Meta and TikTok inside its own try/catch.

## 11. Status

uncommitted, awaiting approval

Checks: `npm run typecheck` passed. `npm run test` passed 326/326.
