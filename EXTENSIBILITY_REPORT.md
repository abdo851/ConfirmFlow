# EXTENSIBILITY_REPORT.md

**Project:** Confirma SaaS (ConfirmFlow)  
**Audit date:** 2026-09-20  
**Audit type:** Read-only architecture extensibility review  
**Current state:** Local dev only (`localhost:3000` + ngrok); GitHub remote configured; Supabase migration 009 applied

---

## 1. Executive Summary

Confirma has a **solid adapter-oriented foundation** (StoreAdapter, MarketingAdapter, ConfirmationAdapter) with two fully implemented store integrations (Shopify, YouCan) and a Meta CAPI pipeline that works but **bypasses the marketing adapter layer**. The database is **owner-scoped multi-tenant** via RLS, but the application code **assumes one store per user** in several critical paths. Adding a new store provider is **Medium effort** (repeatable template, not plug-and-play). Adding marketing platforms, billing, team access, or true multi-store UX requires **refactoring** beyond the current MVP. Production deployment is feasible on Vercel/Railway with **env-var and URL changes only** — no Docker/Vercel config exists yet.

---

## 2. Adapter Architecture — Extensibility Score

**Overall score: 7/10 — Good foundation, incomplete enforcement**

### How the registry works

| Component | File | Mechanism |
|-----------|------|-----------|
| Store adapter interface | `lib/integrations/adapters/store-adapter.ts` | Defines `StoreAdapter` with `connect`, `disconnect`, `verifyConnection`, `verifyWebhook`, `normalizeOrder`, `registerWebhooks` |
| Store registry | `lib/integrations/stores/registry.ts` | Manual `Partial<Record<StorePlatform, StoreAdapter>>` map; `getStoreAdapter(platform)` throws if missing |
| Supported providers list | `lib/integrations/stores/supported-providers.ts` | Hardcoded array of `{ id, label }`; `isSupportedStoreProvider()` checks membership |
| Thin adapter implementations | `integrations/stores/shopify/shopify-adapter.ts`, `integrations/stores/youcan/youcan-adapter.ts` | Delegate to `lib/integrations/{provider}/` modules |
| Marketing adapter interface | `lib/integrations/adapters/marketing-adapter.ts` | Defines `MarketingAdapter.sendConversion()` |
| Meta adapter (stub) | `integrations/marketing/meta/meta-marketing-adapter.ts` | `sendConversion()` returns `{ success: false }`; payload builder only |
| Confirmation adapter interface | `lib/integrations/adapters/confirmation-adapter.ts` | **Not implemented** — confirmation is inline in `lib/confirmation/confirm-order.ts` |

**Adding a new store provider today requires:**
1. New `lib/integrations/{provider}/` module tree (~30 files, mirroring Shopify/YouCan)
2. New `integrations/stores/{provider}/{provider}-adapter.ts`
3. Register in `lib/integrations/stores/registry.ts` (line 6–9)
4. Add to `supported-providers.ts` (line 11–20)
5. New API routes under `app/api/integrations/{provider}/` (6 route files)
6. New URL builders in `lib/config/app-url.ts` (lines 12–29) and `lib/config/urls.ts` (lines 27–49)
7. New middleware protection in `lib/auth/protection.ts` (lines 11–33) and `middleware.ts` (lines 61–83)
8. Database migration: extend CHECK constraints + provider-specific connection tables
9. Update TypeScript unions in `database/types/index.ts`, `lib/orders/types.ts`, `lib/webhooks/ingestion/types.ts`
10. UI connect form + wire into `components/connections/store-provider-panel.tsx`

### Hardcoded Shopify/YouCan assumptions in shared code

| Location | Issue |
|----------|-------|
| `middleware.ts` (lines 61–83) | Separate auth blocks per provider (`isProtectedShopifyApiPath`, `isProtectedYouCanApiPath`) — not generic |
| `lib/auth/protection.ts` (lines 11–37) | Per-provider path helpers — must add one per new provider |
| `lib/config/app-url.ts` (lines 12–29) | Per-provider OAuth/webhook URL builders — not generic |
| `lib/config/urls.ts` (lines 27–49) | Wraps each provider individually |
| `lib/integrations/adapters/store-adapter.ts` (line 6) | `StorePlatform` union type must be edited for each provider |
| `database/types/index.ts` (lines 6, 22–23) | Hardcoded `"shopify" \| "youcan"` unions |
| `components/connections/store-provider-panel.tsx` (lines 17–22) | UI wired to `YouCanConnectForm` only |
| `lib/connections/defaults.ts` (line 14) | Default metadata says `provider: "youcan"` |
| `app/api/orders/[id]/confirm/route.ts` (lines 10–14, 20–29) | Meta-specific delivery messages and response shape |
| `lib/confirmation/purchase-delivery.ts` (lines 5–15) | Hardwired to `processMetaPurchaseDelivery()` — no adapter dispatch |
| `lib/conversions/engine.ts` (lines 17–30) | `ConversionEngine` interface exists but is **unused** in production flow |

### What works well

- **ADR 001** (`docs/decisions/001-adapter-isolation.md`) mandates adapter isolation — documented and mostly followed for store providers.
- Provider-specific code lives in `lib/integrations/{provider}/` — clean boundary.
- Orders normalized to provider-agnostic `orders` table before confirmation/Meta delivery.
- Webhook ingestion uses shared idempotency in `lib/webhooks/ingestion/persist.ts`.
- YouCan was added by **mirroring Shopify** without modifying Shopify code — proves the copy-paste template works.

### Extensibility rating: New store provider

**Rating: Medium**

| Factor | Assessment |
|--------|------------|
| Pattern clarity | High — Shopify + YouCan are complete templates |
| Registry plug-in | Low — manual edits in 10+ files per provider |
| Shared code coupling | Medium — middleware, URLs, types, UI all need updates |
| Database coupling | Medium — CHECK constraints + provider-specific tables per migration |
| Test coverage | High — each provider has 7+ unit test files as template |

**Reason:** Adding Zid, Salla, or WooCommerce is **mechanical but large** (~70 files, 1 migration, no architectural surprise). It will not require rewriting core confirmation or order logic, but it is **not** a single-registry-entry plug-in.

---

## 3. Multi-Tenancy Readiness

### Database design (multi-tenant by owner)

| Table | Tenant key | RLS | Notes |
|-------|-----------|-----|-------|
| `profiles` | `id = auth.uid()` | Own row only | Auto-created on signup |
| `stores` | `owner_id` | CRUD own stores | `UNIQUE (owner_id, platform, external_store_id)` |
| `store_connections` | via `stores.owner_id` | via store ownership | Generic connection row per store |
| `orders` | `owner_id` | SELECT own (`owner_id = auth.uid()`) | Writes via service role |
| `store_webhook_events` | via `store_id` | No user policies (service role) | Idempotency store |
| `meta_conversion_deliveries` | via `store_id → stores.owner_id` | SELECT own | |
| Provider tables | via `store_connections → stores` | SELECT own or service role | `shopify_connections`, `youcan_connections`, `meta_connections` |

**Source:** `database/migrations/002_mvp_database_foundation.sql` (RLS policies lines 168–291), extended by migrations 003–009.

### Can one user have multiple stores?

**Schema: YES.** `stores` has `UNIQUE (owner_id, platform, external_store_id)` — a user can own multiple stores if they differ by platform or external ID.

**Application: PARTIALLY.** Several code paths assume a single store:

| File | Line(s) | Behavior |
|------|---------|----------|
| `lib/integrations/meta/persistence.ts` | 26–31 | `resolveOwnedStoreId()` — `.limit(1)` on stores, picks most recently updated |
| `lib/integrations/shopify/persistence.ts` | 264, 343 | `.limit(1)` when resolving user's store |
| `lib/integrations/youcan/persistence.ts` | 269, 304 | Same pattern |
| `lib/orders/get-orders-for-user.ts` | 19–24 | Lists all orders for user with no store filter |
| `components/connections/store-provider-panel.tsx` | 17–22 | Single connect form, no store picker |

**Verdict:** DB supports multi-store; UI and several services behave as **single-store MVP**.

### Can one store have multiple users (team access)?

**NO.** Missing entirely:

- No `store_members`, `team_invites`, or role-assignment tables
- RLS uses `owner_id = auth.uid()` exclusively — no shared access path
- `lib/security/authorization.ts` (lines 1–26) defines `AppRole = "owner" | "admin" | "member"` and `AuthorizationPolicy` interface but it is a **placeholder never wired into middleware or API routes**
- No invite/accept flow

**To add team access:** new tables (`store_members`, roles), RLS policy rewrite, middleware context enrichment, UI for invites — **XL effort**.

### Can the same Meta pixel be used across multiple stores?

**NO — globally unique.** `meta_connections.pixel_id` has `UNIQUE` constraint (`database/migrations/006_meta_connection_foundation.sql`, line 17). One pixel ID can only be connected to one store_connection worldwide. `assertPixelAvailableForUser()` in `lib/integrations/meta/persistence.ts` (lines 42–81) enforces cross-account uniqueness.

Similarly:
- `shopify_connections.shop_domain` — globally UNIQUE (002, line 122)
- `youcan_connections.store_slug` — globally UNIQUE (009)

---

## 4. Domain & Hosting Readiness

### How `NEXT_PUBLIC_APP_URL` is used

**Centralized entry point:** `lib/config/urls.ts` → `getAppBaseUrl()` reads from `lib/validation/env.ts` Zod schema (line 6).

**Consumers:**

| Consumer | File | Usage |
|----------|------|-------|
| Shopify OAuth redirect | `lib/integrations/shopify/env.ts` → `getShopifyRedirectUri()` | OAuth callback URL |
| YouCan OAuth redirect | `lib/integrations/youcan/env.ts` → `getYouCanRedirectUri()` | OAuth callback URL |
| Shopify/YouCan webhook registration | `lib/integrations/{provider}/webhooks/register.ts` | Webhook destination URL |
| Post-OAuth user redirects | `app/api/integrations/{provider}/connect/route.ts`, `callback/route.ts` | `buildAppPath(getAppBaseUrl(), localizedPath)` |
| Supabase auth callback | `app/api/auth/callback/route.ts` | Base URL for redirect |
| Public config | `lib/security/public-config.ts` | Exposes `appUrl` |

**Verdict:** URL usage is **centralized** through `getAppBaseUrl()`. Switching domain = change one env var + update partner dashboards (Shopify, YouCan, Supabase auth redirect URLs).

### Hardcoded localhost / ngrok references

| Location | Type | Production impact |
|----------|------|-------------------|
| `.env.example` line 4 | `http://localhost:3000` default | Example only — not runtime |
| `README.md` line 23 | localhost link | Docs only |
| `playwright.config.ts` lines 11, 22 | `http://localhost:3000` | Test config only |
| `tests/unit/*.test.ts` | `http://localhost/...` in Request URLs | Test only |
| `SETUP_REPORT.md`, handoff docs | ngrok URL references | Docs only |
| **Application runtime code** | **None found** | No hardcoded ngrok/localhost in production paths |

### Files to change: ngrok → custom domain

1. **`.env.local` (or hosting env vars):** set `NEXT_PUBLIC_APP_URL=https://yourdomain.com`
2. **Shopify Partners Dashboard:** update Authorized redirect URL to `https://yourdomain.com/api/integrations/shopify/callback`
3. **YouCan Partner Dashboard:** update OAuth callback to `https://yourdomain.com/api/integrations/youcan/callback`
4. **Supabase Dashboard → Auth → URL Configuration:** add `https://yourdomain.com/api/auth/callback` to redirect URLs
5. **Remove ngrok** — no code changes required
6. **(Optional)** Update `.env.example` default from localhost to production URL pattern

### Vercel deployment readiness

| Requirement | Status |
|-------------|--------|
| Next.js 15 App Router | Compatible with Vercel |
| `next.config.ts` | Minimal — only next-intl plugin; no custom server |
| Environment variables | All via env vars — Vercel-compatible |
| `vercel.json` | **Missing** — not required but useful for headers/redirects |
| `Dockerfile` | **Missing** |
| Build script | `npm run build` — standard |
| Serverless constraints | Webhook routes + OAuth callbacks work on Vercel serverless |
| Supabase | External — no co-location needed |
| Edge middleware | `middleware.ts` runs on Edge — compatible |
| Long-running processes | None required (no background workers) |
| Cron / queue | **Missing** — Meta delivery retry is synchronous in confirm API |

**Verdict:** Deployable on Vercel **out of the box** with env vars configured. Missing: deployment config file, CI/CD pipeline, production env var documentation, stale-sending reconciliation cron.

**Railway/Fly.io:** Same — standard Node.js Next.js app, no special infra.

---

## 5. Payment & Billing Readiness

### Existing billing scaffold

| Artifact | File | Status |
|----------|------|--------|
| Billing types | `lib/billing/types.ts` | `BillingProviderId = "stripe"` only; `BillingPlan`, `BillingEntitlement`, `BillingProvider` interfaces — **no implementation** |
| Billing feature stub | `features/billing/index.ts` | Comment: "implementation in future milestones" |
| Billing provider interface | `lib/billing/types.ts` lines 18–27 | `createCheckoutSession()`, `getEntitlements()` — interface only |
| Subscriptions table | `database/migrations/001_initial_schema.sql` lines 89–99 | **Historical only** — superseded by 002; **not in active schema** |
| Active DB billing tables | — | **None** |

### Search results for billing keywords

- No Stripe, Paddle, CMI, or PayPal SDK imports in codebase
- No `/api/billing/*` routes
- No plan tier enforcement anywhere
- Test files reference `"billing"` and `"subscriptions"` only as **negative assertions** (confirming those tables are NOT created in active migrations)

### What needs to be built for paid plans

1. **Database:** `plans`, `subscriptions`, `usage_counters` (or similar) tables + RLS
2. **Billing provider:** Stripe/Paddle integration implementing `BillingProvider`
3. **Checkout flow:** API routes + UI for plan selection and payment
4. **Webhook handler:** Stripe/Paddle subscription lifecycle events
5. **Entitlement enforcement:** middleware or service-layer checks before order ingestion, confirmation, or CAPI delivery
6. **Usage metering:** count orders/month per user/store, compare against plan limit
7. **UI:** pricing page, billing settings, upgrade/downgrade

### Where usage limits would be enforced

| Enforcement point | File | Current state |
|-------------------|------|---------------|
| Webhook ingestion | `lib/integrations/{provider}/webhooks/ingest.ts` | No limit check |
| Order confirmation | `lib/confirmation/confirm-order.ts` | No limit check |
| Meta CAPI delivery | `lib/integrations/meta/delivery/deliver-purchase.ts` | No limit check |
| Best insertion point | `lib/conversions/engine.ts` `evaluate()` | Interface exists but unused — ideal future gate |

**Effort: XL** — full billing subsystem from types-only scaffold.

---

## 6. Marketing Integrations Extensibility

### MarketingAdapter interface analysis

**File:** `lib/integrations/adapters/marketing-adapter.ts`

```typescript
interface MarketingAdapter {
  readonly platform: MarketingPlatform; // "meta" | "google" | "tiktok"
  sendConversion(payload: ConversionPayload): Promise<ConversionSendResult>;
}
```

**ConversionPayload** (lines 10–18): `eventType`, `orderId`, `storeId`, `value`, `currency`, `customerData` — generic enough for Google Enhanced Conversions, TikTok Events API, Snapchat CAPI.

### Current Meta implementation

| Layer | File | Status |
|-------|------|--------|
| Adapter (stub) | `integrations/marketing/meta/meta-marketing-adapter.ts` | `sendConversion()` not implemented |
| Actual delivery | `lib/integrations/meta/delivery/deliver-purchase.ts` | Full CAPI pipeline — **bypasses adapter** |
| Confirm trigger | `lib/confirmation/purchase-delivery.ts` | Calls `processMetaPurchaseDelivery()` directly |
| Confirm API | `app/api/orders/[id]/confirm/route.ts` | Returns `metaPurchaseDelivery` in response — Meta-specific |
| Delivery records | `meta_conversion_deliveries` table | CHECK `provider IN ('meta')` only |
| Placeholders | `integrations/marketing/google/README.md`, `tiktok/README.md` | "Placeholder — M0" |

### What would need to change for a second marketing provider

1. **Marketing registry** — does not exist; must create类似 `lib/integrations/stores/registry.ts`
2. **Refactor confirm flow** — `dispatchPurchaseDeliveryAfterConfirmation()` must route through registry, not Meta directly
3. **Generic delivery table** — rename/generalize `meta_conversion_deliveries` or add provider-specific tables
4. **Database migration** — extend CHECK on delivery provider column
5. **Store connection model** — already supports `connection_type: 'marketing'` with generic `provider` field
6. **UI** — `MetaConnectForm` is Meta-specific; need provider picker or multi-marketing panel
7. **Implement adapter** — Google/TikTok/Snapchat-specific CAPI client, credential verification, payload builder

### Extensibility rating: New marketing provider

**Rating: Medium–Hard**

| Factor | Assessment |
|--------|------------|
| Interface design | Good — generic payload shape |
| Registry | Missing — must be built |
| Production flow coupling | High — confirm route is Meta-hardwired |
| DB coupling | Medium — delivery table is Meta-specific |
| Credential patterns | Established — Meta pattern reusable for token-based APIs |

**Reason:** Interface is ready, but the **production delivery path ignores it**. Adding Google Ads requires refactoring the confirm → delivery pipeline first, then implementing the provider (~same size as Meta module).

---

## 7. Data Model Extensibility — The CHECK Constraint Problem

### Provider-related CHECK constraints (active schema 002–009)

| Table | Column | Constraint | Migration | Values |
|-------|--------|------------|-----------|--------|
| `stores` | `platform` | CHECK | 002 → extended 009 | `('shopify', 'youcan')` |
| `store_webhook_events` | `provider` | CHECK | 003 → extended 009 | `('shopify', 'youcan')` |
| `orders` | `provider` | CHECK | 004 → extended 009 | `('shopify', 'youcan')` |
| `meta_conversion_deliveries` | `provider` | CHECK | 008 | `('meta')` |
| `meta_conversion_deliveries` | `event_type` | CHECK | 008 | `('Purchase')` |

### Other CHECK constraints (not provider-specific)

| Table | Column | Values |
|-------|--------|--------|
| `stores` | `status` | `pending`, `active`, `inactive` |
| `store_connections` | `connection_type` | `store`, `confirmation`, `marketing` |
| `store_connections` | `status` | `inactive`, `connecting`, `active`, `error` |
| `orders` | `confirmation_status` | `pending`, `confirmed` |
| `orders` | `subtotal_amount_minor`, `total_amount_minor` | `>= 0` |
| `store_webhook_events` | `status` | `accepted`, `ignored`, `unsupported`, `duplicate`, `rejected` |
| `meta_connections` | `verification_status` | `unverified`, `verified`, `credentials_valid`, `identifier_not_verified`, `failed` |
| `meta_conversion_deliveries` | `status` | `pending`, `sending`, `sent`, `failed` |

### Historical 001 schema (NOT active) — broader provider lists

| Table | Column | Values in 001 |
|-------|--------|---------------|
| `stores.platform` | | `shopify`, `woocommerce`, `youcan` |
| `conversion_events.platform` | | `meta`, `google`, `tiktok` |

These were **not carried forward** into 002+.

### TypeScript mirrors of CHECK constraints

| File | Type | Values |
|------|------|--------|
| `database/types/index.ts` line 6 | `StorePlatform` | `"shopify" \| "youcan"` |
| `database/types/index.ts` line 22 | `WebhookProvider` | `"shopify" \| "youcan"` |
| `database/types/index.ts` line 23 | `OrderProvider` | `"shopify" \| "youcan"` |
| `database/types/index.ts` line 116 | `MetaConversionDelivery.provider` | `"meta"` |
| `lib/integrations/adapters/store-adapter.ts` line 6 | `StorePlatform` | `"shopify" \| "woocommerce" \| "youcan"` |
| `lib/integrations/adapters/marketing-adapter.ts` line 6 | `MarketingPlatform` | `"meta" \| "google" \| "tiktok"` |

**Note:** TypeScript unions in adapter interfaces are **ahead of DB** for woocommerce/google/tiktok but **behind** for Zid/Salla/Magento/Snapchat.

### Foreign keys — provider-agnostic?

**YES for core flow.** `orders.store_id → stores.id`, `orders.owner_id → profiles.id`, `meta_conversion_deliveries.(order_id, store_id) → orders.(id, store_id)` — all provider-agnostic.

**NO for credentials.** Each store provider has dedicated connection tables (`shopify_connections`, `youcan_connections`) keyed by `store_connection_id`. Pattern must repeat per provider.

### Recommendation: CHECK vs lookup tables

| Approach | Pros | Cons |
|----------|------|------|
| **Keep CHECK (current)** | Simple, enforced at DB level, works for MVP | Requires `ALTER TABLE ... DROP CONSTRAINT + ADD CONSTRAINT` migration per new provider; downtime-free but migration-heavy |
| **Lookup table (`providers`)** | Add row instead of migration; easier admin | Extra JOIN, RLS complexity, overkill for <10 providers |
| **Remove CHECK, validate in app** | Maximum flexibility | Loses DB-level integrity |

**Recommendation:** Keep CHECK constraints for MVP stage (2–5 providers). When reaching 5+ providers or needing dynamic provider registration, migrate to a `providers` lookup table and replace CHECK with FK. The current pattern (009 extended 002/003/004 constraints) is **proven and safe** — migration 009 was additive-only.

---

## 8. Production Gaps — Severity Table

### Domain / Hosting

| Gap | Severity | Fix |
|-----|----------|-----|
| No custom domain configured | High | Register domain, set `NEXT_PUBLIC_APP_URL`, update partner dashboards |
| ngrok dependency for dev webhooks/OAuth | Medium (dev only) | Replace with production URL when deploying |
| No `vercel.json` / deployment config | Low | Add Vercel project config or Railway service definition |
| No CI/CD pipeline | Medium | Add GitHub Actions for lint/test/build on push |

### Security

| Gap | Severity | Fix |
|-----|----------|-----|
| No rate limiting on API/webhook routes | High | Add middleware rate limiter (e.g., `@upstash/ratelimit` or Vercel KV) |
| Webhook endpoints are public (HMAC-only) | Medium | Acceptable with HMAC; add IP allowlisting optional |
| Service role key used server-side without rotation policy | Medium | Document rotation; use Supabase vault or env secrets manager |
| No CSRF protection on Meta connect POST | Medium | SameSite cookies + origin check |
| Test user with known password in cloud Supabase | Low (dev) | Disable or rotate before production launch |
| `.gitignore` missing `.temp`, `supabase/.temp` | Low | Add patterns to prevent accidental commit of link metadata |

### Scaling

| Gap | Severity | Fix |
|-----|----------|-----|
| Meta CAPI delivery is synchronous in confirm API request | High | Move to async queue (Supabase Edge Function, Inngest, or background job) |
| No retry worker for failed `meta_conversion_deliveries` | High | Cron job calling `stale-sending` reconciliation + retry |
| Single Supabase project (no staging/prod split) | Medium | Create staging Supabase project |
| No connection pooling config | Low | Supabase handles via pooler URL for serverless |

### Observability / Logging

| Gap | Severity | Fix |
|-----|----------|-----|
| No structured logging (console only) | High | Add pino/winston + log aggregation (Axiom, Datadog) |
| No error tracking (Sentry etc.) | High | Add Sentry or similar |
| No webhook/delivery dashboard UI | Medium | Build admin view of `store_webhook_events` and `meta_conversion_deliveries` |
| Health endpoint reports `milestone: "M0"` | Low | Update string in `app/api/health/route.ts` |

### Rate Limiting

| Gap | Severity | Fix |
|-----|----------|-----|
| No rate limiting anywhere | High | Per-IP on webhooks, per-user on confirm API |

### Error Handling

| Gap | Severity | Fix |
|-----|----------|-----|
| Confirm API swallows Meta delivery errors (returns 200 with failed delivery) | Medium | Document behavior; consider 207 or webhook retry |
| No dead-letter queue for failed webhooks | Medium | Mark rejected events; add admin retry |

### Backups

| Gap | Severity | Fix |
|-----|----------|-----|
| Relying on Supabase managed backups only | Low | Verify Supabase Pro backup schedule; document restore procedure |
| No application-level export | Low | Optional pg_dump automation |

---

## 9. Adding a New Store Provider — Step-by-Step Checklist

Example: adding **Zid** as a store provider.

- [ ] 1. Create `integrations/stores/zid/constants.ts` with `ZID_PROVIDER_ID = "zid"`
- [ ] 2. Create `integrations/stores/zid/zid-adapter.ts` implementing `StoreAdapter`
- [ ] 3. Create `lib/integrations/zid/` module tree (oauth/, webhooks/, orders/, session/, persistence, env, disconnect)
- [ ] 4. Register in `lib/integrations/stores/registry.ts`
- [ ] 5. Add to `lib/integrations/stores/supported-providers.ts`
- [ ] 6. Extend `StorePlatform` in `lib/integrations/adapters/store-adapter.ts`
- [ ] 7. Update TypeScript unions in `database/types/index.ts`, `lib/orders/types.ts`, `lib/webhooks/ingestion/types.ts`
- [ ] 8. Create API routes: `app/api/integrations/zid/{connect,callback,disconnect,status,register-webhooks,webhooks}/route.ts`
- [ ] 9. Add URL builders in `lib/config/app-url.ts` and wrappers in `lib/config/urls.ts`
- [ ] 10. Add middleware protection: `isProtectedZidApiPath()` in `lib/auth/protection.ts` + block in `middleware.ts`
- [ ] 11. Write migration: extend CHECK on `stores.platform`, `orders.provider`, `store_webhook_events.provider`; create `zid_connections` + `zid_connection_secrets` tables
- [ ] 12. Add env vars to `.env.example`: `ZID_API_KEY`, `ZID_API_SECRET`, `ZID_SESSION_SECRET`, `ZID_OAUTH_SCOPES`
- [ ] 13. Create `components/connections/zid-connect-form.tsx`
- [ ] 14. Wire into `store-provider-panel.tsx` or add provider picker
- [ ] 15. Add i18n strings in `messages/en/connections.json` and `messages/ar/connections.json`
- [ ] 16. Write unit tests (mirror `tests/unit/youcan-*.test.ts` — 7 files)
- [ ] 17. Add test fixture `tests/fixtures/zid-order.ts`
- [ ] 18. Configure OAuth redirect + webhook URL in Zid partner dashboard
- [ ] 19. Run `npx supabase db push` for migration
- [ ] 20. End-to-end test: connect → webhook → order → confirm → Meta CAPI

**Estimated effort: L** (2–3 weeks for one developer, following YouCan template)

---

## 10. Adding a New Marketing Provider — Step-by-Step Checklist

Example: adding **Google Ads Enhanced Conversions**.

- [ ] 1. **Refactor delivery pipeline first:** make `dispatchPurchaseDeliveryAfterConfirmation()` use a marketing registry instead of calling Meta directly
- [ ] 2. Create `lib/integrations/marketing/registry.ts` (mirror store registry)
- [ ] 3. Create `integrations/marketing/google/google-marketing-adapter.ts` implementing `MarketingAdapter`
- [ ] 4. Create `lib/integrations/google/` module (capi/, verification/, persistence, env)
- [ ] 5. Create API routes: `app/api/integrations/google/{connect,disconnect,status,verify}/route.ts`
- [ ] 6. Add middleware protection in `lib/auth/protection.ts` + `middleware.ts`
- [ ] 7. Write migration: generalize `meta_conversion_deliveries` → `conversion_deliveries` OR extend CHECK to include `'google'`
- [ ] 8. Create `google_connections` + `google_connection_secrets` tables (or generic `marketing_connections`)
- [ ] 9. Update confirm API response to be provider-agnostic (not `metaPurchaseDelivery`)
- [ ] 10. Implement `sendConversion()` in adapter (currently stubbed in Meta adapter)
- [ ] 11. Wire `ConversionEngine.dispatch()` in confirm flow
- [ ] 12. Add UI: Google connect form in connections page
- [ ] 13. Add env vars: `GOOGLE_ADS_*` or similar
- [ ] 14. Unit tests for adapter, payload builder, delivery
- [ ] 15. E2E: confirm order → Google conversion event sent

**Estimated effort: L–XL** (3–4 weeks — includes pipeline refactor)

---

## 11. Adding Custom Domain — Step-by-Step Checklist

- [ ] 1. Register domain (e.g., `app.confirma.com`)
- [ ] 2. Deploy to Vercel/Railway and attach custom domain with DNS (CNAME/A record)
- [ ] 3. Set `NEXT_PUBLIC_APP_URL=https://app.confirma.com` in hosting env vars
- [ ] 4. Update Shopify Partners → App → Allowed redirection URL(s)
- [ ] 5. Update YouCan Partner Dashboard → OAuth callback URL
- [ ] 6. Update Supabase Dashboard → Authentication → Site URL + Redirect URLs
- [ ] 7. Verify SSL certificate is active on hosting platform
- [ ] 8. Test: `curl https://app.confirma.com/api/health`
- [ ] 9. Test OAuth flows for each connected store provider
- [ ] 10. Test webhook delivery from each store provider
- [ ] 11. Remove ngrok from development workflow (or keep for local-only testing with separate Shopify dev app)
- [ ] 12. Update `.env.example` with production URL comment

**Estimated effort: S** (hours, mostly dashboard config — no code changes)

---

## 12. Recommended Priorities (Ranked)

1. **Complete live MVP loop** — YouCan OAuth + webhook + confirm + Meta CAPI E2E (env vars + partner config)
2. **Async Meta delivery + retry worker** — decouple CAPI from confirm API response (production-critical)
3. **Production deployment** — Vercel + custom domain + env vars
4. **Rate limiting + error tracking** — Sentry + webhook/API rate limits
5. **Refactor marketing delivery through adapter registry** — prerequisite for Google/TikTok
6. **Multi-store UI** — store picker, per-store orders filter (if merchants need multiple stores)
7. **Billing/subscriptions** — Stripe integration + plan enforcement
8. **Second store provider** — Zid or Salla (MENA market fit)
9. **Team/collaborator access** — store_members table + invite flow
10. **Webhook/delivery admin dashboard** — operational visibility

---

## 13. Estimated Effort (T-Shirt Sizes)

| Extension | Size | Notes |
|-----------|------|-------|
| Custom domain + Vercel deploy | **S** | Env vars + DNS + partner dashboards |
| Production hardening (logging, Sentry, rate limits) | **M** | No architecture change |
| Async delivery queue + retry cron | **M** | New infra component (Inngest/cron) |
| New store provider (Zid/Salla/WooCommerce) | **L** | Copy YouCan template; ~70 files + migration |
| Multi-store UI + service refactor | **M–L** | Remove `.limit(1)` assumptions, add store picker |
| Second marketing provider (Google/TikTok) | **L–XL** | Requires delivery pipeline refactor first |
| Billing + plan tiers (Stripe) | **XL** | New tables, checkout, webhooks, enforcement |
| Team/collaborator access | **XL** | New tables, RLS rewrite, invite UI, role middleware |
| Shopify App Store embedded app | **XL** | App Bridge, different OAuth model — parallel to current standalone OAuth |
| Mobile app | **XL** | New codebase sharing same API |
| Migrate CHECK constraints to lookup tables | **M** | Only needed at 5+ providers |

---

## Appendix: Architectural Debt (Explicit List)

1. **MarketingAdapter bypassed** — `lib/confirmation/purchase-delivery.ts` calls Meta directly; `ConversionEngine` unused.
2. **ConfirmationAdapter unused** — confirmation is hardcoded merchant-click, not pluggable.
3. **Per-provider middleware/URL boilerplate** — no generic `/api/integrations/[provider]/*` dynamic routing.
4. **Per-provider DB tables** — `shopify_connections`, `youcan_connections` pattern repeats; no generic `provider_connections` with JSONB config.
5. **Single-store assumptions** — `.limit(1)` in meta/shopify/youcan persistence (lines cited in §3).
6. **Global uniqueness on shop_domain, store_slug, pixel_id** — prevents multi-account testing and agency use cases.
7. **TypeScript union drift** — adapter types include woocommerce/google/tiktok but DB CHECK does not.
8. **README and health endpoint stale** — still say M0/no integrations.
9. **StoreProviderPanel** — YouCan-only UI despite Shopify being fully implemented.
10. **001 schema ghost references** — subscriptions/billing in historical migration but not active; could confuse developers.
11. **No marketing registry** — unlike stores, marketing has no `getMarketingAdapter()`.
12. **Synchronous CAPI in HTTP request** — confirm API waits for Meta Graph API response (10s timeout in transport).
13. **Authorization policy placeholder** — `lib/security/authorization.ts` defines RBAC types but never used.

---

*End of EXTENSIBILITY_REPORT.md*
