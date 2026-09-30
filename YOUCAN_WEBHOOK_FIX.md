# YouCan webhook registration fix

Status: uncommitted, awaiting approval

## 1. Summary

OAuth for `elitemart1` succeeded and the connection was saved. Webhook registration then failed because the access token was issued without YouCan’s resthook scopes. The next authorize request always includes `read-rest-hooks` and `edit-rest-hooks`. Registration now logs the HTTP status and body, and never the access token. The current token cannot gain those scopes until YouCan is disconnected and connected again.

## 2. Logs from the failure

From the dev server that handled the successful OAuth return. The authorization `code` is omitted.

- `youcan_callback_state_check { hasQueryState: true, hasCookieState: true, match: true }`
- `GET /api/integrations/youcan/callback?... 307`
- `GET /ar/onboarding/store?youcan=error&reason=webhook_registration_failed 200`

No YouCan HTTP status or response body was written. The registration error was thrown and turned into that redirect without logging `error.message`.

## 3. Code behavior

| Piece | Behavior |
| --- | --- |
| List | `GET https://api.youcan.shop/resthooks/list` with `Authorization: Bearer` |
| Subscribe | `POST https://api.youcan.shop/resthooks/subscribe` with JSON `{ event: "order.created", target_url }` |
| Unsubscribe | `POST https://api.youcan.shop/resthooks/unsubscribe/{id}` |
| Callback | After the token is saved, `youcanAdapter.registerWebhooks(storeId)` runs. `YouCanWebhookRegistrationError` becomes `reason=webhook_registration_failed`. The handler did not log the error. |
| API base | `https://api.youcan.shop` |
| Scopes before this change | Default `read-orders,read-products`. `parseYouCanOAuthScopes` passed that list through unchanged. |

YouCan’s current docs use the same endpoint, method, and `order.created` event. List requires `read-rest-hooks`. Subscribe requires `edit-rest-hooks`. A token without those scopes gets `401`.

## 4. Root cause

Registration lists hooks before it creates one. That list call requires `read-rest-hooks`, and create requires `edit-rest-hooks`. The authorize request did not include either scope, so the saved token cannot call those endpoints. Endpoint, method, and payload already match the docs.

## 5. Fix applied

`lib/integrations/youcan/env.ts`, `parseYouCanOAuthScopes`: after splitting the configured scopes, append `read-rest-hooks` and `edit-rest-hooks` when they are missing.

The default scope string in `lib/integrations/youcan/env.ts` and `lib/integrations/youcan/oauth/constants.ts` now includes those two scopes as well. Token exchange and store persistence were not changed. `.env.local` was not changed.

The token already stored for `elitemart1` stays as issued. Disconnect and connect again so YouCan shows the new scopes on the authorize screen.

## 6. New logging

In `lib/integrations/youcan/webhooks/register.ts`:

- `youcan_webhook_registration_started` with `store_slug`
- `youcan_webhook_registration_http_request` with `method` and `url`
- `youcan_webhook_registration_http_response` with `status` and `body`
- `youcan_webhook_registration_success` with `webhook_id`
- `youcan_webhook_registration_failed` with `error`

The access token is not logged.

## 7. Tests

326/326 passed (67 files).

## 8. Typecheck and lint

- `npm run typecheck`: pass (exit 0)
- `npm run lint`: pass (exit 0)

Dev server restarted on port 3000. `GET /api/health` returned `{"status":"ok","service":"confirma","milestone":"MVP"}`.

## 9. Files modified

- `lib/integrations/youcan/env.ts`
- `lib/integrations/youcan/oauth/constants.ts`
- `lib/integrations/youcan/webhooks/register.ts`
- `YOUCAN_WEBHOOK_FIX.md`

## 10. Status

uncommitted, awaiting approval

## 11. How to retest

On `/ar/onboarding/store`, disconnect YouCan, connect `elitemart1` again, and accept the new scopes on YouCan’s authorize screen. Success is `/onboarding/store?youcan=connected`. If it fails, the dev log now includes `youcan_webhook_registration_http_response` with the status and body.
