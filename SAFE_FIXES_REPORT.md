# SAFE_FIXES_REPORT.md

**Date:** 2026-09-20  
**Project:** Confirma SaaS (ConfirmFlow)  
**Scope:** Additive infrastructure utilities only — no schema, auth, or route behavior changes (except health milestone label)

---

## 1. Executive Summary

Implemented **7 Bucket A items** as new standalone utilities and documentation updates. No new npm dependencies, no migrations, no middleware/auth/RLS changes, and no existing routes were refactored to use the new helpers. **261/261 unit tests pass** and **typecheck passes**. One intentional minor behavior change: `/api/health` now returns `milestone: "MVP"` instead of `"M0"`. Playwright E2E still expects `"M0"` — not updated (out of scope).

---

## 2. Issue Classification (from EXTENSIBILITY_REPORT.md)

### BUCKET A — Safe to fix now (acted on)

| ID | Issue | Action |
|----|-------|--------|
| A1 | No structured logging utility | **DONE** — `lib/logging/` |
| A2 | No rate limiting utility | **DONE** — `lib/utils/rate-limit.ts` |
| A3 | Scattered provider constants | **DONE** — `lib/config/providers.ts` (additive; not wired) |
| A4 | No consistent API response helpers | **DONE** — `lib/utils/api-response.ts` |
| A5 | `.env.example` completeness | **DONE** — verified; no additions needed |
| A6 | README stale (M0) | **DONE** — README refreshed |
| A7 | Health endpoint milestone `"M0"` | **DONE** — now `"MVP"` |
| — | `.gitignore` missing `.temp`, `supabase/.temp`, `.vercel` | **SKIPPED** — config change; low priority |
| — | `AuthorizationPolicy` placeholder unused | **SKIPPED** — wiring is behavior change |

### BUCKET B — Deferred (external / manual)

| Issue | Reason deferred |
|-------|-----------------|
| Custom domain setup | Requires DNS + hosting dashboard |
| Vercel/Railway deployment | Requires hosting account + env config |
| ngrok → production URL switch | Manual partner dashboard updates |
| Shopify OAuth grant page fix | Shopify Partners Dashboard only |
| YouCan/Meta live E2E testing | Requires partner credentials + manual test |
| CI/CD pipeline | GitHub Actions setup (manual) |
| Supabase staging/prod split | Manual Supabase project creation |
| Test user password rotation before prod | Operational manual step |
| Wire rate limiter to webhook routes | Requires route change approval |
| Wire logger into existing code paths | Requires behavior/observability approval |

### BUCKET C — Deferred (breaking / schema / refactor)

| Issue | Reason deferred |
|-------|-----------------|
| Meta CAPI async delivery + retry worker | Architecture refactor |
| MarketingAdapter registry + confirm flow refactor | Breaking pipeline change |
| Billing/subscriptions (Stripe/Paddle) | New tables + XL feature |
| Team/collaborator access (`store_members`) | Schema + RLS rewrite |
| Multi-store UI + `.limit(1)` removal | Application refactor |
| CHECK constraint → lookup table migration | Schema migration |
| Per-provider middleware generalization | middleware.ts change forbidden |
| Generic `provider_connections` table | Schema migration |
| Global pixel/shop uniqueness relaxation | Schema + business rule change |
| StoreProviderPanel multi-provider UI | UI behavior change |
| ConfirmationAdapter implementation | Flow refactor |
| Sentry / external logging | External service |
| Redis / Upstash rate limiter | External dependency |

---

## 3. Bucket A Items — DONE

### A1 — Structured logging utility

| File | Purpose |
|------|---------|
| `lib/logging/logger.ts` | Levels: debug/info/warn/error; JSON in production, human-readable in dev |
| `lib/logging/index.ts` | Re-exports + `logInfrastructureReady()` example |

**Usage example:**
```typescript
import { logger } from "@/lib/logging";
logger.info("Webhook accepted", { provider: "youcan", topic: "orders/create" });
```

### A2 — In-memory rate limiter

| File | Purpose |
|------|---------|
| `lib/utils/rate-limit.ts` | `checkRateLimit(key, limit, windowMs)`, `cleanupRateLimitStore()`, `resetRateLimitStore()` |

**Usage example:**
```typescript
import { checkRateLimit } from "@/lib/utils/rate-limit";
const result = checkRateLimit("webhook:youcan:store-123", 100, 60_000);
if (!result.allowed) { /* reject */ }
```

**Note:** Not wired into any route. Wiring into `/api/integrations/*/webhooks` is a follow-up requiring explicit approval.

### A3 — Centralized provider constants

| File | Purpose |
|------|---------|
| `lib/config/providers.ts` | `SUPPORTED_STORE_PROVIDERS`, `SUPPORTED_MARKETING_PROVIDERS`, `SUPPORTED_CONFIRMATION_PROVIDERS` + derived types |

**Usage example:**
```typescript
import { SUPPORTED_STORE_PROVIDERS, isSupportedStoreProviderId } from "@/lib/config/providers";
```

Existing `lib/integrations/stores/supported-providers.ts` **unchanged** — gradual migration pending approval.

### A4 — API response helpers

| File | Purpose |
|------|---------|
| `lib/utils/api-response.ts` | `ok()`, `badRequest()`, `unauthorized()`, `notFound()`, `serverError()` |

**Usage example:**
```typescript
import { unauthorized } from "@/lib/utils/api-response";
return unauthorized();
```

No existing routes modified to use these helpers.

### A5 — Environment template completeness

**Variables checked:** `YOUCAN_API_KEY`, `YOUCAN_API_SECRET`, `YOUCAN_SESSION_SECRET`, `YOUCAN_OAUTH_SCOPES`, `META_SESSION_SECRET`, `SHOPIFY_OAUTH_SCOPES`

**Result:** All already present in `.env.example`. **No variables added.**

### A6 — README refresh

| File | Change |
|------|--------|
| `README.md` | Updated to reflect Confirma MVP: integrations, stack, scripts, env setup, docs links |

### A7 — Health endpoint milestone

| File | Change |
|------|--------|
| `app/api/health/route.ts` | `milestone: "M0"` → `milestone: "MVP"` |

Response shape unchanged except milestone string value.

---

## 4. Bucket A Items — SKIPPED

| Item | Reason |
|------|--------|
| `.gitignore` additions (`.temp`, `supabase/.temp`, `.vercel`) | Config change outside A1–A7 list; can be done separately |
| Wire new utilities into existing routes | Explicitly forbidden by task rules |
| Unit tests for new utilities | Not requested; utilities are standalone |
| Update Playwright E2E health assertion (`M0` → `MVP`) | E2E out of `npm test` scope; noted as drift |

---

## 5. Bucket B — DEFERRED

Listed in §2 classification table. Requires manual dashboard access, hosting setup, or partner credentials.

---

## 6. Bucket C — DEFERRED

Listed in §2 classification table. Requires migrations, refactors, or external paid services.

---

## 7. Files That Hardcode Provider Names (for future migration)

Grep pattern: `'shopify'`, `'youcan'`, `'meta'` in `*.ts` / `*.tsx`:

| File |
|------|
| `lib/config/providers.ts` *(new canonical source — not yet adopted elsewhere)* |
| `lib/integrations/stores/supported-providers.ts` |
| `lib/integrations/stores/registry.ts` |
| `lib/integrations/adapters/store-adapter.ts` |
| `lib/integrations/adapters/marketing-adapter.ts` |
| `database/types/index.ts` |
| `lib/orders/types.ts` |
| `lib/webhooks/ingestion/types.ts` |
| `lib/connections/types.ts` |
| `lib/connections/defaults.ts` |
| `lib/connections/store-connection.ts` |
| `lib/connections/meta-connection.ts` |
| `lib/auth/protection.ts` |
| `lib/config/app-url.ts` |
| `lib/config/urls.ts` |
| `middleware.ts` |
| `integrations/stores/shopify/constants.ts` |
| `integrations/stores/youcan/constants.ts` |
| `integrations/marketing/meta/meta-marketing-adapter.ts` |
| `lib/integrations/shopify/persistence.ts` |
| `lib/integrations/shopify/orders/normalize.ts` |
| `lib/integrations/shopify/webhooks/constants.ts` |
| `lib/integrations/shopify/session/types.ts` |
| `lib/integrations/shopify/session/connection-store.ts` |
| `lib/integrations/youcan/persistence.ts` |
| `lib/integrations/youcan/orders/normalize.ts` |
| `lib/integrations/youcan/webhooks/constants.ts` |
| `lib/integrations/youcan/session/types.ts` |
| `lib/integrations/youcan/session/connection-store.ts` |
| `lib/integrations/meta/persistence.ts` |
| `lib/integrations/meta/delivery/persistence.ts` |
| `lib/integrations/meta/delivery/eligibility.ts` |
| `lib/integrations/meta/delivery/types.ts` |
| `lib/integrations/meta/types.ts` |
| `lib/integrations/meta/session/connection-store.ts` |
| `app/api/integrations/shopify/status/route.ts` |
| `app/api/integrations/shopify/register-webhooks/route.ts` |
| `app/api/integrations/youcan/status/route.ts` |
| `app/api/integrations/youcan/register-webhooks/route.ts` |
| `app/api/integrations/meta/status/route.ts` |
| `components/connections/shopify-connect-form.tsx` |
| `components/connections/youcan-connect-form.tsx` |
| `components/connections/meta-connect-form.tsx` |
| `components/onboarding/steps.ts` |
| `tests/unit/shopify-adapter.test.ts` |
| `tests/unit/youcan-adapter.test.ts` |
| `tests/unit/shopify-connection-store.test.ts` |
| `tests/unit/youcan-order-normalize.test.ts` |
| `tests/unit/meta-connection.test.ts` |
| `tests/unit/meta-purchase-delivery.test.ts` |
| `lib/logging/index.ts` *(example comment only)* |

**Migration strategy (future):** Adopt `lib/config/providers.ts` in `supported-providers.ts` first, then TypeScript types, one file at a time with tests.

---

## 8. Test Results

| Check | Before | After |
|-------|--------|-------|
| `npm run typecheck` | pass (pre-change baseline) | **pass** |
| Unit tests (`npm test`) | 261 passed | **261 passed** (39 files) |
| Tests failed | 0 | **0** |

---

## 9. Commit and Push Status

| Item | Value |
|------|-------|
| Commit message | `chore(infra): add safe additive infrastructure utilities (logging, rate-limit, api-response, providers config, env template, README, health milestone)` |
| Branch | `master` |
| Push | `origin/master` |

*(Hash recorded after commit — see git log)*

---

## 10. We Did NOT Touch (Safety Verification)

- `middleware.ts` logic
- Supabase clients (`lib/supabase/*`, `lib/database/*`)
- Auth flows (`lib/auth/*`, signup/login actions)
- Existing API route behavior (except health milestone string)
- Database migrations (002–009)
- RLS policies
- `.env.local` or any secrets
- `package.json` dependencies
- Shopify / YouCan / Meta integration modules
- Order confirmation or Meta CAPI delivery pipeline
- Billing code
- Any npm package installs

---

## 11. Recommended Next Safe Step

1. **Update Playwright E2E** health assertion from `"M0"` to `"MVP"` in `tests/e2e/foundation.spec.ts` (one-line test fix).
2. **Add unit tests** for `lib/utils/rate-limit.ts` (sliding window behavior).
3. **With approval:** wire `checkRateLimit()` into webhook routes only (additive guard at top of route handlers).
4. **With approval:** gradually import `SUPPORTED_STORE_PROVIDERS` from `lib/config/providers.ts` into `supported-providers.ts`.

---

*End of SAFE_FIXES_REPORT.md*
