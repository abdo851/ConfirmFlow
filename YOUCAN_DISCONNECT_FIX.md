# YouCan disconnect fix

Status: uncommitted, awaiting approval

## 1. Summary

Disconnect always removes the YouCan connection from the database, even when YouCan webhook unregistration fails. The API returns `200` with `{ ok: true }`. The disconnect buttons ask for confirmation before the request is sent.

## 2. Root cause

Webhook unregistration ran before any database delete. `unregisterYouCanOrderCreatedWebhook` lists hooks at `GET https://api.youcan.shop/resthooks/list`. The stored token does not include `read-rest-hooks`, so YouCan returns `401` with body `unauthorized`.

`listYouCanWebhooks` throws `YouCanWebhookRegistrationError` with message `youcan_webhook_list_failed:401`. That throw happened inside `disconnectYouCanStoreForUser` before `removeYouCanConnectionRecordsForStore`. The route catch returned `502` and the UI showed "تعذر قطع اتصال YouCan".

Dev log (`POST /api/integrations/youcan/disconnect`):

```
youcan_webhook_registration_http_response { status: 401, body: 'unauthorized' }
youcan_webhook_registration_failed { error: 'youcan_webhook_list_failed:401' }
POST /api/integrations/youcan/disconnect 502
```

No webhooks exist on the store. The list call fails because of the missing scope, not because the hook list is empty. An empty list returns `{ action: "already_missing" }` and does not throw.

## 3. Fix applied

`disconnectYouCanStoreForUser` in `lib/integrations/youcan/persistence.ts`:

- Logs `youcan_disconnect_started` with `store_slug`.
- Calls webhook unregistration inside try/catch. Failures are logged and not rethrown.
- Then deletes `youcan_connection_secrets`, `youcan_connections`, and the `store_connections` row for `provider = youcan`.
- If that store has no remaining `store_connections` rows, it deletes the `stores` row. A foreign-key rejection on that optional delete does not fail the request (the Supabase client returns the error instead of throwing).
- Logs `youcan_disconnect_db_deleted` with `connection_id`, then `youcan_disconnect_success`.

`app/api/integrations/youcan/disconnect/route.ts` returns `{ ok: true }` on success.

Confirmation before disconnect (YouCan only):

- `components/connections/youcan-connect-form.tsx`
- `components/connections/provider-status-list.tsx` when `item.id === "youcan"`

English: "Are you sure you want to disconnect? Once disconnected, Confirma will not receive orders from this store until you connect it again."

Arabic: "هل أنت متأكد من قطع الاتصال؟ بعد قطع الاتصال لن يستقبل Confirma طلبات هذا المتجر حتى تعيد ربطه."

Shopify and WooCommerce disconnect buttons are unchanged. Shopify install availability is a Shopify-side grant; this change does not contact Shopify or edit Shopify integration code.

## 4. Logging added

- `youcan_disconnect_started` — `{ store_slug }`
- `youcan_disconnect_webhooks_failed` — `{ error }` only when unregistration throws
- `youcan_disconnect_db_deleted` — `{ connection_id }`
- `youcan_disconnect_success`

## 5. Tests

326/326 passed (67 files).

## 6. Typecheck + Lint

- `npm run typecheck` — pass (exit 0)
- `npm run lint` — pass (exit 0)
- `GET http://localhost:3000/api/health` — `{"status":"ok","service":"confirma","milestone":"MVP"}`

## 7. Files modified

- `lib/integrations/youcan/persistence.ts`
- `app/api/integrations/youcan/disconnect/route.ts`
- `components/connections/youcan-connect-form.tsx`
- `components/connections/provider-status-list.tsx`

## 8. Status

uncommitted, awaiting approval

## 9. How to retest

Open `/ar/onboarding/store`, click "قطع اتصال YouCan", confirm the prompt, and check that the connection is removed. Then connect again so YouCan can grant `read-rest-hooks` and `edit-rest-hooks`.
