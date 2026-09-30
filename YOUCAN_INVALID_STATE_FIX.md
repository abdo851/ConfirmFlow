# YouCan invalid_state fix

Status: uncommitted, awaiting approval

## 1. Summary

YouCan finished authorization and sent the browser back to Confirma. The callback rejected the return because the OAuth state cookie was not available to compare. The cookie was stored without the `Secure` flag while the merchant uses the HTTPS ngrok host from `next dev` (`NODE_ENV=development`). The state cookie is now `Secure`. A presence-only log was added on the callback.

## 2. Root cause

The connect route sets `youcan_oauth_state` with `secure: process.env.NODE_ENV === "production"`. `npm run dev` sets `NODE_ENV` to `development`, so the cookie is not marked `Secure`. The browser is on `https://ignore-savings-joyfully.ngrok-free.dev`. A non-secure cookie is not kept for that HTTPS host, so the callback sees no cookie and returns `reason=invalid_state`.

SameSite was already `lax`, path was already `/`, maxAge was already 600 seconds, and no Domain was set. The signed-state TTL is the same 600 seconds and is not what failed on an immediate Authorize click.

`invalid_state` is returned in `app/api/integrations/youcan/callback/route.ts` when the query state is missing, the cookie is missing, the two strings differ, or `parseOAuthState` rejects the signature or the 600-second TTL.

### Behavior

| Step | Behavior |
| --- | --- |
| Connect state | `createOAuthState(storeSlug, YOUCAN_SESSION_SECRET)`: JSON `{nonce, storeSlug, issuedAt}`, base64url, HMAC-SHA256 hex after a `.` |
| Cookie | Name `youcan_oauth_state`. Before: `httpOnly` true, `secure` only in production, `sameSite` `lax`, `path` `/`, `maxAge` 600, no `domain` |
| Connect redirect | `buildYouCanAuthorizeUrl` with `client_id`, `redirect_uri`, `response_type=code`, `state`, and `scope[]` |
| Callback query | `searchParams` → `query.state` |
| Callback cookie | `cookies().get("youcan_oauth_state")` |
| Compare | Strict string equality, then `parseOAuthState` with `YOUCAN_SESSION_SECRET` and `600_000` ms |
| Signing secret | `YOUCAN_SESSION_SECRET` from `getYouCanOAuthEnv()`. Redirect URI comes from `NEXT_PUBLIC_APP_URL` + `/api/integrations/youcan/callback` |

## 3. Exact fix

`app/api/integrations/youcan/connect/route.ts`, cookie options on the redirect response: `secure` is now `true` instead of `process.env.NODE_ENV === "production"`.

## 4. Cookie settings before → after

| Attribute | Before | After |
| --- | --- | --- |
| httpOnly | true | true |
| secure | `NODE_ENV === "production"` (false in `next dev`) | true |
| sameSite | lax | lax |
| path | `/` | `/` |
| maxAge | 600 | 600 |
| domain | unset | unset |

## 5. Debug logging

`app/api/integrations/youcan/callback/route.ts` logs `youcan_callback_state_check` with `hasQueryState`, `hasCookieState`, and `match`. The state strings are not logged.

## 6. Tests

326/326 passed (67 files).

## 7. Typecheck and lint

- `npm run typecheck`: pass (exit 0)
- `npm run lint`: pass (exit 0)

Dev server was restarted on port 3000 after deleting `.next`. `GET /api/health` returned `{"status":"ok","service":"confirma","milestone":"MVP"}`.

## 8. Files modified

- `app/api/integrations/youcan/connect/route.ts`
- `app/api/integrations/youcan/callback/route.ts`
- `YOUCAN_INVALID_STATE_FIX.md`

## 9. Status

uncommitted, awaiting approval

## 10. How to retest

Open `/ar/onboarding/store`, choose YouCan, enter `elitemart1`, click "ربط YouCan", then Authorize on YouCan. A successful return lands on `/onboarding/store?youcan=connected`. If it fails again, the dev log line `youcan_callback_state_check` shows whether the query state, the cookie, or both were missing, without printing the state.
