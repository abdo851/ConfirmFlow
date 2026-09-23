# Features report

## 1. Summary

Three dashboard surfaces were added on top of the existing WooCommerce and Meta helpers: a webhooks table, an order-detail timeline with extra actions, and a Meta connection screen that is ready before Pixel verification succeeds. No integration, auth, migration, or environment files were changed. Nothing was committed.

## 2. Webhooks page

`/dashboard/connections/webhooks` lists WooCommerce webhooks for the signed-in user. Each row shows a WooCommerce badge, topic (`order.created` / `order.updated`), a truncated delivery URL, active/paused status, and the last stored delivery time plus status. Row actions are send test, re-register, and delete. The page-level button re-registers every webhook by calling the existing registrar after unregistering the previous ids, and it reuses the stored webhook secret.

Data comes from `woocommerce_connections.webhook_ids`, recent `store_webhook_events`, and a live WooCommerce webhook read when the existing cleanup helper can decrypt the store keys. If the live read fails, the stored rows are still shown.

Files:

- `app/[locale]/dashboard/connections/webhooks/page.tsx`
- `components/dashboard/webhooks-table.tsx`
- `lib/dashboard/get-webhooks-for-user.ts`
- `lib/dashboard/woocommerce-webhook-actions.ts`
- `lib/dashboard/test-woocommerce-webhook.ts`

## 3. Order detail page

`/dashboard/orders/[id]` now shows provider name, external order id, and a timeline: received, confirmed (when present), and Meta delivery status (when a delivery row exists). Actions stay conditional: confirm and reject while pending, archive while confirmed or rejected, resend to Meta only when that delivery is `failed`, plus copy order number. WooCommerce orders get an external “Open in WooCommerce” link to `{store_url}/wp-admin/post.php?post={external_order_id}&action=edit`.

Files:

- `app/[locale]/dashboard/orders/[id]/page.tsx`
- `components/dashboard/order-timeline.tsx`
- `components/orders/order-detail-actions.tsx`
- `lib/dashboard/order-timeline.ts`
- `lib/dashboard/get-woo-admin-url.ts`
- `lib/dashboard/get-meta-deliveries-for-user.ts`

## 4. Meta connection UI

`/dashboard/connections/meta` shows a connect card linking to `/onboarding/meta` when there is no saved Meta connection. When the connection is connected, connecting, or in error, it shows the pixel id, verification badge, last verified time, the latest deliveries, “Test now”, and “Disconnect”. Disconnect posts to the existing `/api/integrations/meta/disconnect` route.

`/onboarding/meta` keeps the existing connect form and adds step-by-step instructions, a link to Meta Events Manager, a numeric pixel-id error, and next-step copy after a successful save.

Files:

- `app/[locale]/dashboard/connections/meta/page.tsx`
- `app/[locale]/onboarding/meta/page.tsx`
- `components/dashboard/meta-connection-actions.tsx`
- `components/connections/meta-onboarding-guide.tsx`
- `components/connections/meta-connect-form.tsx`
- `lib/dashboard/get-meta-deliveries-for-user.ts`

## 5. New API routes

- `GET /api/dashboard/webhooks`
- `POST /api/dashboard/webhooks/test`
- `POST /api/dashboard/webhooks/reregister`
- `POST /api/dashboard/webhooks/delete`
- `GET /api/dashboard/meta/status`
- `POST /api/dashboard/meta/test`
- `POST /api/orders/meta-delivery/retry`

## 6. New components

- `components/dashboard/webhooks-table.tsx`
- `components/dashboard/order-timeline.tsx`
- `components/dashboard/meta-connection-actions.tsx`
- `components/connections/meta-onboarding-guide.tsx`

## 7. i18n keys added

Both `messages/en/dashboard.json` and `messages/ar/dashboard.json` gained `pages.features` with:

- `webhooks`: reregisterAll, emptyTitle, emptyBody, provider, topic, deliveryUrl, status, lastDelivery, actions, active, paused, test, reregister, delete, actionOk, actionFailed
- `timeline`: title, received, confirmed, metaDelivery, metaNotSent, provider, externalId, confirm, reject, archive, resendMeta, copyNumber, copied, openWoo, resent, resendFailed
- `meta`: connectTitle, connectBody, connectButton, connectedTitle, pixelId, verification, verifiedAt, order, event, status, attempts, attemptedAt, error, noDeliveries, testNow, testFailed, disconnect, disconnected, disconnectFailed, guideTitle, guideStep1, guideStep2, guideStep3, eventsManager, nextSteps, pixelInvalid

## 8. Tests

304/304 passed (`npm run test`). New files: `tests/unit/webhooks-list.test.ts`, `tests/unit/order-timeline.test.ts`, `tests/unit/meta-connection-ui.test.ts`.

## 9. Typecheck

Pass (`npm run typecheck`).

## 10. Lint

Pass (`npm run lint`, exit 0).

## 11. Files created

- `app/api/dashboard/webhooks/route.ts`
- `app/api/dashboard/webhooks/test/route.ts`
- `app/api/dashboard/webhooks/reregister/route.ts`
- `app/api/dashboard/webhooks/delete/route.ts`
- `app/api/dashboard/meta/status/route.ts`
- `app/api/dashboard/meta/test/route.ts`
- `app/api/orders/meta-delivery/retry/route.ts`
- `components/dashboard/webhooks-table.tsx`
- `components/dashboard/order-timeline.tsx`
- `components/dashboard/meta-connection-actions.tsx`
- `components/connections/meta-onboarding-guide.tsx`
- `lib/dashboard/get-webhooks-for-user.ts`
- `lib/dashboard/woocommerce-webhook-actions.ts`
- `lib/dashboard/test-woocommerce-webhook.ts`
- `lib/dashboard/order-timeline.ts`
- `lib/dashboard/get-meta-deliveries-for-user.ts`
- `lib/dashboard/get-woo-admin-url.ts`
- `tests/unit/webhooks-list.test.ts`
- `tests/unit/order-timeline.test.ts`
- `tests/unit/meta-connection-ui.test.ts`
- `FEATURES_REPORT.md`

## 12. Files modified

- `app/[locale]/dashboard/connections/webhooks/page.tsx`
- `app/[locale]/dashboard/orders/[id]/page.tsx`
- `app/[locale]/dashboard/connections/meta/page.tsx`
- `app/[locale]/onboarding/meta/page.tsx`
- `components/connections/meta-connect-form.tsx`
- `components/orders/order-detail-actions.tsx`
- `messages/en/dashboard.json`
- `messages/ar/dashboard.json`

Earlier uncommitted Meta wiring files were left as they were: `META_INTEGRATION_REPORT.md`, `scripts/connect-meta.mjs`, `scripts/meta-script-lib.mjs`.

## 13. Files NOT touched

- `lib/integrations/woocommerce/**`
- `lib/integrations/meta/**`
- `lib/integrations/youcan/**`
- `lib/integrations/shopify/**`
- `app/api/integrations/woocommerce/**`
- `app/api/integrations/meta/**`
- `app/api/integrations/youcan/**`
- `app/api/integrations/shopify/**`
- `lib/auth/**`
- `lib/supabase/**`
- `lib/database/**`
- `middleware.ts`
- `database/migrations/**`
- `supabase/migrations/**`
- `.env.local`
- `next.config.ts`

## 14. Screenshots recommended

- Arabic webhooks table: two active WooCommerce rows (`order.created`, `order.updated`), RTL, back button.
- Arabic order #16: timeline (received, confirmed, Meta pending), copy and WooCommerce link. Confirm, reject, archive, and Meta resend stay hidden because the order is archived and the delivery is pending.
- Arabic Meta connection: pixel `4444157855871429`, badge `credentials_valid`, one Purchase delivery, Test now and Disconnect.
- Arabic and English onboarding Meta: three steps, Events Manager link, numeric pixel validation.
- English webhooks, order #16, Meta, and onboarding: `dir=ltr`.

Browser check on 23 Sep 2026 against `http://localhost:3000`: Arabic pages were RTL, English pages were LTR, and Back used browser history (existing back-button behavior). Re-register, delete, test send, Meta test, and disconnect were not clicked, so live webhooks and the Meta row were not mutated.

## 15. Status

uncommitted, awaiting user approval

## 16. Known limitations

- `POST /api/dashboard/meta/test` and “Resend to Meta” call `processMetaPurchaseDelivery`. Delivery stays ineligible until `verification_status` is `verified` and the store connection is active. This account is `credentials_valid` with status `connecting`, so a test Purchase will not send until the pixel permission is fixed. The current delivery row already says the Meta connection is not configured.
- This account already has a Meta row, so the page shows the details card. The “not connected” card appears only when there is no connected, connecting, or error state.
- “Send test” runs the existing webhook receiver’s activation ping (`webhook_id=<id>`). It does not ask WooCommerce to deliver a real order payload.
- “Re-register all webhooks” unregisters current ids, then calls `registerOrderWebhooks` with the stored secret. If that secret is missing, the route returns 400 and does not mint a new secret.
- Order #16 is archived, so confirm, reject, and archive are not on screen. Meta resend appears only when the delivery status is `failed`.
