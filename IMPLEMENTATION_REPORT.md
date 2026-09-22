# Implementation report

## 1. Summary

Visual-only dashboard, order, connection, and password surfaces now read and write real account data. Order confirmation can move from pending to rejected, and from confirmed or rejected to archived. Every listed subpage has a back control that points toward the start edge in both Arabic (RTL) and English (LTR). YouCan, Shopify, and Meta integration modules and their API routes were not modified. No dependencies were added. Nothing was committed.

## 2. New API routes / server actions

- `POST /api/orders/export` — CSV of the signed-in user's orders.
- `rejectOrder` and `archiveOrder` in `lib/confirmation/state-machine.ts` (pending → rejected, confirmed or rejected → archived).
- `rejectOrderAction` and `archiveOrderAction` in `lib/confirmation/order-actions.ts`.
- `requestPasswordReset` and `updatePasswordAction` in `lib/auth/password-actions.ts`. Reset email returns to `/api/auth/callback`, then the localized reset page. Success copy does not say whether the email exists.

## 3. New pages

- `/dashboard/orders/[id]` — order number, provider, email, phone, amount, currency, created date, status, received/confirmed timeline, confirm / reject / archive.
- `/forgot-password` — email form, generic success.
- `/reset-password` — new password and confirmation, then redirect to `/login`.

## 4. New components

- `components/ui/back-button.tsx` — `router.back()`, fallback `href`, `aria-label`, arrow flipped in RTL.
- `components/orders/order-detail-actions.tsx`
- `components/orders/export-orders-button.tsx`
- `components/connections/provider-status-list.tsx`

## 5. Migration 012 (status enum)

`orders.confirmation_status` check becomes `pending | confirmed | rejected | archived`.

- `database/migrations/012_order_confirmation_status.sql`
- `supabase/migrations/20260922110000_order_confirmation_status.sql`

This file is not applied to the remote database.

## 6. Files created

- `database/migrations/012_order_confirmation_status.sql`
- `supabase/migrations/20260922110000_order_confirmation_status.sql`
- `lib/dashboard/stats.ts`
- `lib/dashboard/get-dashboard-stats.ts`
- `lib/dashboard/get-dashboard-timeseries.ts`
- `lib/orders/csv.ts`
- `lib/orders/get-order-for-user.ts`
- `lib/confirmation/order-actions.ts`
- `lib/auth/password-actions.ts`
- `lib/connections/meta-delivery-summary.ts`
- `app/api/orders/export/route.ts`
- `app/[locale]/dashboard/orders/[id]/page.tsx`
- `app/[locale]/(auth)/forgot-password/page.tsx`
- `app/[locale]/(auth)/reset-password/page.tsx`
- `components/ui/back-button.tsx`
- `components/orders/order-detail-actions.tsx`
- `components/orders/export-orders-button.tsx`
- `components/connections/provider-status-list.tsx`
- `tests/unit/dashboard-stats.test.ts`
- `tests/unit/dashboard-timeseries.test.ts`
- `tests/unit/orders-status.test.ts`
- `tests/unit/orders-export.test.ts`
- `IMPLEMENTATION_REPORT.md`

## 7. Files modified

- `lib/confirmation/state-machine.ts`
- `lib/confirmation/types.ts`
- `lib/orders/types.ts`
- `lib/orders/confirm-client.ts`
- `database/types/index.ts`
- `components/orders/orders-list.tsx`
- `components/orders/order-status-badge.tsx`
- `components/ui/sparkline.tsx`
- `components/onboarding/step-shell.tsx`
- `app/[locale]/dashboard/page.tsx`
- `app/[locale]/dashboard/orders/page.tsx`
- `app/[locale]/dashboard/connections/page.tsx`
- `app/[locale]/onboarding/page.tsx`
- `app/[locale]/(auth)/login/page.tsx`
- `app/[locale]/(auth)/signup/page.tsx`
- `messages/en/orders.json`, `messages/ar/orders.json`
- `messages/en/dashboard.json`, `messages/ar/dashboard.json`
- `messages/en/connections.json`, `messages/ar/connections.json`
- `messages/en/auth.json`, `messages/ar/auth.json`

Earlier uncommitted UI polish files remain in the working tree and were not part of this wiring pass.

## 8. Test results

289/289 passed (`npm run test`). The previous suite was 282; 7 tests were added.

## 9. Typecheck result

`npm run typecheck` passed.

## 10. Lint result

`npm run lint` passed with no new errors.

## 11. Screenshots recommended

- `/en/dashboard` — counts 0 new, 1 confirmed, 0 rejected, 0 archived; confirmation rate 100.0%; confirmed revenue $30.00; recent order #16.
- `/en/dashboard/orders` — tabs All 1, New 0, Confirmed 1, Rejected 0, Archived 0.
- `/en/dashboard/orders/[id]` — #16, Archive action, timeline, Back returns to the orders list.
- `/en/dashboard/connections` — WooCommerce connected with store URL and Disconnect; YouCan and Shopify not connected; Meta links to onboarding.
- `/ar/dashboard` — `dir=rtl`, same counts in Arabic.
- `/en/forgot-password` and `/en/login` — Back control, Google button disabled with “Coming soon”.

## 12. Status

uncommitted, awaiting user approval

## 13. Known limitations

- Google sign-in stays disabled with “Coming soon” / “قريباً”. OAuth is not implemented.
- Migration 012 is only a file. Reject and archive updates will fail the database check until it is applied.
- The orders table has email and phone, not a customer name. The detail page shows email and phone.
- Dashboard stats use the last 30 days. New orders are pending with `received_at` in range. Confirmed orders, confirmed revenue, and the confirmation rate use confirmed orders with `confirmed_at` in range, divided by all orders. Rejected and archived counts are all-time.
- The overview “Stores” card still uses `getStoreConnectionState`, which reads YouCan only. The connections page is the surface that shows YouCan, Shopify, and WooCommerce from their public status getters.
- Meta delivery text is read from `meta_conversion_deliveries` outside the Meta integration module. Pixel id and verification status come from the existing public Meta state.
