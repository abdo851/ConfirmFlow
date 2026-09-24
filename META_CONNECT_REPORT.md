# Meta connect report

## 1. Summary

The previous Meta connection was removed and a new one was saved for the WooCommerce store `https://ancientcoach.s2-tastewp.com`. Graph verification succeeded and the store connection is active. The Purchase for order #16 was not sent. The existing delivery loader only accepts `confirmation_status = confirmed`, and this order is `archived`.

## 2. Old Meta state cleaned

Yes. Removed marketing connection `8672aafc-8b26-4b2d-ba85-b0ac1cb893a1` (pixel `4444157855871429`, verification `credentials_valid`, status `connecting`) and its secret row. `META_SESSION_SECRET` was already set, so `.env.local` was not changed.

## 3. New connection created

Yes. Store `71e24709-75a4-4f11-8d85-9f31e783d747`. Store connection `756f3d7e-4900-4472-bb9f-ee66c2d9fd1e`. Pixel `4444157855871429`. The access token was encrypted with the same helper `persistence.ts` uses and was not printed.

## 4. Verification status

`verified`. Pixel Graph request returned HTTP 200. Connection status is `active`.

## 5. Order #16 delivery

Not sent. `processMetaPurchaseDelivery` returned no outcome because `confirmation_status` is `archived`. The delivery row is still `pending`, attempts `0`, `sent_at` null, `last_error` `Meta connection is not configured.` That error is the previous row; this run did not update it.

## 6. Files created

- `scripts/reset-meta-state.mjs`
- `scripts/retry-delivery.mjs`
- `tests/unit/meta-connect-verify.test.ts`
- `tests/unit/meta-delivery-purchase.test.ts`
- `META_CONNECT_REPORT.md`

## 7. Files modified

- `scripts/connect-meta.mjs`

`package.json` and `package-lock.json` are still uncommitted from the earlier Supabase CLI install. They were not changed for this Meta connect.

## 8. Tests

307/307 passed.

## 9. Typecheck

Fail. `tsc` reports two errors in `components/prototypes/gsap-scroll-machine-scene.tsx`: missing modules `gsap` and `gsap/ScrollTrigger`. That file was not part of this change, and `gsap` is not a project dependency. It was not added, because this task does not allow new packages or component edits.

## 10. Status

uncommitted, awaiting user approval

## 11. Test Events

https://eventsmanager.facebook.com/events_manager2/list/pixel/4444157855871429/test_events

No new Purchase was sent, so this page will not show a new event from this run.
