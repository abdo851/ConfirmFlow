# TikTok connect report

## 1. Summary

The admin WooCommerce store now has a verified TikTok marketing connection. A real CompletePayment event was sent for the latest confirmed order and TikTok accepted it (`code: 0`, `message: OK`).

The access token is encrypted at rest. It is not written in this report.

## 2. TIKTOK_SESSION_SECRET added

yes. It was missing. A 64-character hex value was appended to `.env.local`. No other variable was changed.

## 3. New store_connection id

`08cc5b92-d339-4638-9768-1301809e33b1`

Store: `9e1d1728-8146-447f-b8cd-51b4bb5d74ea` (the WooCommerce store that already has the active Meta connection).

## 4. New tiktok_connections id

`08cc5b92-d339-4638-9768-1301809e33b1`

That table uses `store_connection_id` as its primary key, so the id is the same as the store connection.

## 5. Pixel code

`DAR98D3C77UA02BT28DG`

`verification_status` is `verified`.

## 6. Access token

Encrypted and stored in `tiktok_connection_secrets`. Not printed.

## 7. Test delivery result

sent.

- Order: `e5059e24-7f82-4cda-bffb-0271aaac4897`
- Event id: `tiktok:purchase:e5059e24-7f82-4cda-bffb-0271aaac4897`
- Attempts: 1
- Last error: none
- TikTok body: `{"code":0,"message":"OK","request_id":"20260925154312B5FDD99F0E7A83C65D8F","data":{}}`

The delivery function only marks a row sent when TikTok returns HTTP 2xx and `code` 0. The stored body confirms `code` 0.

## 8. Files created

- `scripts/add-tiktok-connection.mjs`
- `scripts/test-tiktok-event.mjs`
- `TIKTOK_CONNECT_REPORT.md`

## 9. Files modified

- `.env.local` (appended `TIKTOK_SESSION_SECRET` only)

## 10. Status

uncommitted, awaiting approval

Typecheck passed. Tests: 326/326.
