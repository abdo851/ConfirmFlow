# CONFIRMA — PROJECT HANDOFF REPORT

> **Purpose:** Technical/product continuity document for a future AI engineer or assistant continuing Confirma safely.  
> **Source of truth:** Repository code, git history, local automated tests, and verified audit observations at report time.  
> **Not a marketing document.**

---

## 1. Document Metadata

| Field | Value |
|---|---|
| **Report date** | 2026-09-19 (UTC+2) |
| **Project name** | Confirma |
| **Package name (`package.json`)** | `confirma` |
| **Physical directory** | `C:\Users\pc\Documents\AI Projects\02_Projects\ConfirmFlow` |
| **Current branch** | `master` |
| **Current HEAD commit** | `dc2d7ebae8755d0eb8df8b9ae557d138f2a5f232` |
| **HEAD commit message** | `M6-C2.1: Fix Shopify OAuth public redirect base` |
| **Git working tree** | Clean except untracked prototype paths (see §22) |
| **Untracked files** | `app/[locale]/gsap-test/`, `components/prototypes/` |
| **GitHub remote** | **None configured** (`git remote -v` empty) |
| **Project isolation** | Confirma is completely separate from `C:\Users\pc\Documents\AI Projects\02_Projects\smart-services`. Do not access, copy, or reuse smart-services code, config, or Supabase. |

### Framework / runtime versions (verified from repo)

| Component | Version |
|---|---|
| Next.js (installed) | 15.5.25 |
| React (installed) | 19.3.0 |
| TypeScript | ^5.8.3 |
| Tailwind CSS | ^4.1.8 |
| `@supabase/ssr` | ^0.6.1 |
| `@supabase/supabase-js` | ^2.49.8 |
| `next-intl` | ^4.14.5 |
| Zod | ^3.25.36 |
| Vitest | ^3.1.4 |
| Playwright | ^1.52.0 |
| Node dev command | `next dev --turbopack` (via `npm run dev`) |

---

## 2. Product Definition

### What Confirma is

Confirma is an order confirmation and conversion tracking platform for e-commerce merchants. It connects store order events, a merchant confirmation workflow, and marketing conversion APIs through an adapter-based architecture.

**Core product concept:** **Confirmed Conversion Bridge**

### Intended core flow (product design)

```
Shopify / WooCommerce / YouCan
        ↓
Order Created
        ↓
Pending / Unconfirmed
        ↓
Merchant confirms order
        ↓
Confirmed
        ↓
Confirma
        ↓
Meta Conversions API
        ↓
Purchase event
```

### Intended value (factual, not a performance guarantee)

When implemented correctly, Confirma is designed so Meta receives **Purchase** events **only after** a merchant confirms an order (especially relevant for COD / manual confirmation flows). This is intended to improve conversion signal quality by avoiding Purchase events for unconfirmed orders.

**Do not claim** that Confirma guarantees lower CPA, higher revenue, or specific ad performance outcomes.

### Scope boundaries

| Category | Description |
|---|---|
| **Current MVP scope** | Shopify store connection (OAuth), webhook ingestion, order normalization, merchant confirmation, Meta connection + CAPI Purchase delivery for confirmed orders, bilingual UI (en/ar), Supabase auth + persistence |
| **Future ideas (not MVP)** | WooCommerce, YouCan, Google/TikTok marketing, mobile app, WhatsApp, AI features, billing/subscriptions, Shopify App Store distribution |
| **Explicitly excluded from MVP** | Mobile app, WhatsApp, AI, WooCommerce, YouCan, billing implementation, production deployment automation |

---

## 3. Current MVP Scope

### Implemented

- **Authentication:** Supabase Auth login, signup, logout, email callback route, middleware session refresh, protected routes, safe internal `next` redirects
- **Onboarding shell:** Multi-step onboarding pages (store, meta, confirmation)
- **Localization:** `next-intl` with `en` and `ar`, locale-prefixed routes, RTL for Arabic
- **Dashboard:** Dashboard shell, connections page, orders page (UI)
- **Shopify OAuth:** Connect/callback routes, signed state, HMAC validation, token exchange, encrypted DB token storage
- **Shopify persistence:** Store/connection records in Supabase; encrypted access tokens in `shopify_connection_secrets`
- **Shopify webhooks:** HMAC verification, idempotent ingestion records, `orders/create` topic handling
- **Shopify webhook registration:** Admin API registration after OAuth callback (idempotent)
- **Shopify disconnect:** Deletes webhooks (best effort), clears DB connection, clears legacy cookies
- **Order ingestion:** Normalized `orders` table from verified Shopify webhooks
- **Confirmation engine:** `pending` → `confirmed` with `confirmed_at`; idempotent confirm API
- **Meta connection:** Pixel ID + access token connect, encrypted storage, credential verification via Graph API
- **Meta CAPI Purchase delivery:** Triggered after confirmation; deterministic `event_id`; delivery records with sent/failed/sending states; stale-sending reclaim
- **Security foundations:** Server-only secrets, RLS on user-facing tables, service-role for server writes
- **Adapter architecture:** Interfaces for store/confirmation/marketing; Shopify implemented; Meta delivery via `lib/integrations/meta` (adapter wrapper partially stubbed)
- **Automated tests:** 235 unit tests passing (32 test files)

### Partially implemented

- **Meta marketing adapter (`integrations/marketing/meta/meta-marketing-adapter.ts`):** Builds payloads; `sendConversion` returns `"not implemented"`. Real CAPI sending is implemented in `lib/integrations/meta/delivery/` and wired from confirmation flow.
- **Generic webhook/conversion scaffolds:** Foundation types and processors exist; production breadth beyond Shopify/Meta not built.
- **Billing:** Type definitions only (`lib/billing/`); no Stripe or payment provider.
- **Authorization/RBAC:** Placeholder policy in `lib/security/authorization.ts`.
- **README.md:** Still describes M0 scaffold; outdated relative to current codebase.
- **Real external E2E:** Code complete for MVP path; live Shopify + Meta verification **pending** (see §8, §17, §19).

### Not implemented

- WooCommerce adapter
- YouCan adapter
- Google / TikTok marketing adapters
- WhatsApp confirmation channel
- AI features
- Mobile app
- Billing/subscription enforcement
- Shopify App URL install handler (Dev Dashboard install entry point)
- App Bridge / embedded Shopify admin app
- Production deployment pipeline
- GitHub remote / CI (no remote configured)

### Future / intentionally deferred

- Additional store providers beyond Shopify
- Additional marketing providers beyond Meta CAPI Purchase
- Confirmation adapters beyond built-in merchant UI confirm action
- Shopify managed installation / token exchange (CLI template model)
- Partner Dashboard distribution / App Store listing
- `allowedDevOrigins` Next.js config for ngrok cross-origin dev warnings

---

## 4. Architecture

### Stack

- **Frontend:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 4
- **Backend:** Next.js Route Handlers (`app/api/**`) + server-only `lib/**` modules
- **Database / Auth:** Supabase PostgreSQL + Supabase Auth via `@supabase/ssr`
- **i18n:** `next-intl` with locale prefix (`/en`, `/ar`)
- **Validation:** Zod env and input schemas

### Layered flow

```
Confirma Web (app/[locale]/*, components/*)
        ↓
Core Backend/API (app/api/*, lib/*)
        ↓
Supabase (PostgreSQL + Auth)
        ↓
External integrations via adapters
   ├── Shopify adapter + lib/integrations/shopify/*
   └── Meta integration lib/integrations/meta/*
```

### Why adapters

External platforms must not be imported directly from pages or core domain logic. Integrations implement adapter interfaces under `integrations/` and are invoked through `lib/integrations/` service layers. See `docs/decisions/001-adapter-isolation.md`.

### Future architecture direction (not MVP)

Web + possible future mobile + possible Shopify App Store distribution → same backend/API. **Mobile app is NOT part of MVP.**

---

## 5. Repository Structure

| Path | Responsibility |
|---|---|
| `app/[locale]/` | Locale-prefixed pages: marketing, auth, onboarding, dashboard |
| `app/api/` | Server route handlers (auth, Shopify, Meta, orders, health) |
| `components/` | UI components (connections forms, dashboard shell, orders UI) |
| `components/ui/` | Shared UI primitives (`Button`, `Input`, etc.) |
| `integrations/` | Provider adapter implementations and README placeholders |
| `lib/auth/` | Supabase auth actions, session, protection, redirects |
| `lib/confirmation/` | Confirmation state machine, `confirmOrder`, Meta dispatch hook |
| `lib/config/` | Public app URL builders (OAuth callback, webhooks) |
| `lib/connections/` | Connection state types/defaults for UI |
| `lib/conversions/` | Conversion event types, Purchase builder, deterministic event IDs |
| `lib/database/` | Supabase DB client helpers |
| `lib/integrations/shopify/` | Shopify OAuth, persistence, webhooks, orders, disconnect |
| `lib/integrations/meta/` | Meta env, Graph API, CAPI, verification, delivery |
| `lib/integrations/adapters/` | Adapter interface definitions |
| `lib/orders/` | Order queries/formatting for UI |
| `lib/security/` | Public config, server secrets helpers |
| `lib/validation/` | Shared Zod env schemas (Supabase public env) |
| `lib/webhooks/` | Generic webhook ingestion/idempotency utilities |
| `lib/billing/` | Billing types only (no provider) |
| `lib/i18n/` | Server locale helpers, path utilities |
| `i18n/` | next-intl routing config, request config, navigation wrappers |
| `messages/` | Translation JSON (`en/`, `ar/`) |
| `database/migrations/` | Canonical numbered SQL migrations (001–008) |
| `supabase/migrations/` | Timestamped copies of migrations for Supabase CLI |
| `tests/unit/` | Vitest unit tests (32 files) |
| `tests/e2e/` | Playwright foundation spec |
| `docs/` | Architecture docs + this handoff report |
| `middleware.ts` | i18n routing + Supabase session + API/app auth gates |
| `DEVELOPMENT_RULES.md` | Contributor/agent rules |

### Important API routes (`app/api/`)

| Route | Purpose |
|---|---|
| `/api/auth/callback` | Supabase email auth callback |
| `/api/health` | Health check |
| `/api/supabase/verify` | Supabase connectivity verification |
| `/api/integrations/shopify/connect` | Start Shopify OAuth |
| `/api/integrations/shopify/callback` | Shopify OAuth callback |
| `/api/integrations/shopify/disconnect` | Disconnect Shopify |
| `/api/integrations/shopify/status` | Public Shopify connection status |
| `/api/integrations/shopify/register-webhooks` | Manual webhook registration |
| `/api/integrations/shopify/webhooks` | Shopify webhook ingestion endpoint |
| `/api/integrations/meta/connect` | Save Meta credentials |
| `/api/integrations/meta/disconnect` | Disconnect Meta |
| `/api/integrations/meta/status` | Meta connection status |
| `/api/integrations/meta/verify` | Verify Meta credentials |
| `/api/orders/[id]/confirm` | Confirm order + trigger Meta Purchase delivery |

---

## 6. Authentication

### Provider

Supabase Auth with `@supabase/ssr` cookie-based sessions.

### Key files

| File | Role |
|---|---|
| `lib/auth/actions.ts` | Server actions: login, signup, logout |
| `lib/auth/login-flow.ts` | Login result resolution |
| `lib/auth/signup-flow.ts` | Signup result (session vs email confirm) |
| `lib/auth/session.ts` | `getAuthenticatedUser`, `requireAuthenticatedUser` |
| `lib/auth/redirects.ts` | `resolveSafeInternalRedirect` — blocks external URLs |
| `lib/auth/protection.ts` | Protected path definitions |
| `app/api/auth/callback/route.ts` | Supabase auth callback with safe `next` |
| `middleware.ts` | Session refresh; redirects unauthenticated users from protected app/API paths |
| `lib/supabase/client.ts`, `server.ts`, `middleware.ts` | Supabase client factories |

### Protected routes (high level)

- Dashboard and onboarding app paths (via `isProtectedAppPath`)
- Shopify connect/callback API routes require auth (redirect to localized login with `next`)
- Meta connect/verify API routes require auth (401 JSON if unauthenticated)
- Order confirm API requires auth

### Safe redirect behavior

Login/signup and auth callback only allow safe internal relative paths. External URLs and protocol-relative URLs are rejected.

---

## 7. Shopify Integration

### Architecture type

**Standalone / non-embedded** authorization code OAuth. No App Bridge. No Shopify CLI app template. No App URL install handler.

### Admin API version (code)

```typescript
// lib/integrations/shopify/constants.ts
export const SHOPIFY_ADMIN_API_VERSION = "2026-07";
```

### OAuth scopes

- **Code default:** `read_products,read_orders` (`SHOPIFY_OAUTH_DEFAULT_SCOPES`, env fallback in `lib/integrations/shopify/env.ts`)
- **Env override:** `SHOPIFY_OAUTH_SCOPES` (optional; uses default when unset)

### OAuth flow (implemented)

```
GET /api/integrations/shopify/connect?shop={domain}
  → require Confirma authenticated user
  → validate shop domain (normalizeShopDomain)
  → getShopifyOAuthEnv() Zod validation
  → createOAuthState(shop, SHOPIFY_SESSION_SECRET)
  → set shopify_oauth_state httpOnly cookie
  → redirect to https://{shop}/admin/oauth/authorize

Shopify authorization

GET /api/integrations/shopify/callback?code&shop&state&hmac&...
  → require Confirma authenticated user
  → validate state cookie === query state
  → parseOAuthState (signed payload, TTL 600s)
  → verify callback HMAC
  → exchange code for access token (POST /admin/oauth/access_token)
  → persistShopifyConnectionForUser (encrypted token in DB)
  → registerWebhooks (orders/create)
  → redirect to /onboarding/store?shopify=connected|error
```

### Key modules

| Area | Path |
|---|---|
| Env validation | `lib/integrations/shopify/env.ts` |
| OAuth state/HMAC/token | `lib/integrations/shopify/oauth/*` |
| DB persistence | `lib/integrations/shopify/persistence.ts` |
| Webhook registration | `lib/integrations/shopify/webhooks/register.ts` |
| Webhook ingestion | `lib/integrations/shopify/webhooks/ingest.ts` |
| Order normalization | `lib/integrations/shopify/orders/*` |
| Disconnect | `lib/integrations/shopify/disconnect.ts`, `persistence.ts` |
| Adapter | `integrations/stores/shopify/shopify-adapter.ts` |
| UI | `components/connections/shopify-connect-form.tsx` |

### Token storage

Access tokens encrypted with `SHOPIFY_SESSION_SECRET` and stored in `shopify_connection_secrets`. Legacy httpOnly connection cookie path exists but DB persistence is the active model.

### Webhook topic

- `orders/create` (`SHOPIFY_ORDER_CREATE_TOPIC`)
- Ingestion URL: `{NEXT_PUBLIC_APP_URL}/api/integrations/shopify/webhooks`

### Webhook security

- HMAC-SHA256 verification via `x-shopify-hmac-sha256`
- Idempotency via `store_webhook_events` unique constraint on `(store_id, provider, external_event_id)`

### Required environment variables (names only)

| Variable | Required | Purpose |
|---|---|---|
| `SHOPIFY_API_KEY` | Yes | Shopify Client ID for OAuth |
| `SHOPIFY_API_SECRET` | Yes | OAuth HMAC + token exchange + webhook HMAC |
| `SHOPIFY_SESSION_SECRET` | Yes (min 32 chars) | OAuth state signing + token encryption |
| `SHOPIFY_OAUTH_SCOPES` | Optional | Defaults to `read_products,read_orders` |
| `NEXT_PUBLIC_APP_URL` | Yes | Public HTTPS base for callback + webhook URLs |

---

## 8. Shopify OAuth Flow — IMPORTANT CURRENT STATE

### Correct MVP entry point

Confirma OAuth **must** start from:

```
GET /api/integrations/shopify/connect?shop={shop}.myshopify.com
```

Expected callback:

```
GET /api/integrations/shopify/callback
```

(full URL: `{NEXT_PUBLIC_APP_URL}/api/integrations/shopify/callback`)

### Recent fixes (committed)

| Milestone | Commit | Issue | Fix |
|---|---|---|---|
| **M6-C2** | `c9dd5b3` | next-intl `Link` prefixed `/ar` onto `/api/...` paths → 404 | `components/ui/button.tsx`: use plain `<a>` for `href` starting with `/api/` |
| **M6-C2.1** | `dc2d7eb` | OAuth error/success redirects used `request.url` (localhost behind ngrok) | Connect/callback use `buildAppPath(getAppBaseUrl(), localizedPath)` |
| **M6-C1** | `1ecfcd7` | Shopify Admin API version update | `2026-07` |
| **M6-C1.1** | `c94f776` | Turbopack dynamic JSON import caused `JSON.parse("")` | Static imports in `i18n/request.ts` |

### Observed external test state (2026-09-19 sessions)

| Observation | Status |
|---|---|
| Locale-prefix routing bug (`/ar/api/...` 404) | **VERIFIED FIXED** (commit `c9dd5b3`; connect hits `/api/integrations/shopify/connect`) |
| OAuth configuration error (`reason=configuration`) when Shopify env vars missing | **VERIFIED** (Zod failure in `getShopifyOAuthEnv`) |
| Shopify env vars later added to `.env.local` | **VERIFIED** (keys present at report time; values not documented) |
| Connect route reaches Shopify authorize screen | **REPORTED BY USER / LOCAL ONLY** — not verified from repo logs alone |
| OAuth callback reached | **NOT VERIFIED** — no `GET /api/integrations/shopify/callback` in dev server or ngrok logs |
| Access token persisted to DB after live OAuth | **NOT VERIFIED** |
| Webhook registered on live store after OAuth | **NOT VERIFIED** |
| End-to-end: webhook → order → confirm → Meta Purchase | **NOT VERIFIED** externally |

### Shopify error messages encountered

| Message | Context | Verified cause |
|---|---|---|
| `إعداد OAuth لـ Shopify غير صحيح.` (`reason=configuration`) | Confirma connect catch block | Missing/invalid Shopify env vars in running process |
| `Ce lien d'installation ne peut pas être utilisé` | Shopify UI (French) | **NOT VERIFIED** in repo — observed during Dev Dashboard / install link attempts before legacy flow enabled |
| Dev Dashboard install → `shopify.dev/apps/default-app-home` | Dev Dashboard "Install app" | **VERIFIED EXPECTED** with placeholder App URL; Confirma never receives callback |

### Dev Dashboard install vs Confirma connect

**VERIFIED (code + logs):** Dev Dashboard "Install app" is **not** the MVP test path for Confirma. Confirma has no App URL handler. With App URL = `https://shopify.dev/apps/default-app-home`, install lands on Shopify docs, not Confirma. Installations counter showing `0` is consistent with no completed Confirma OAuth callback; dashboard counter accuracy itself is **NOT VERIFIED**.

---

## 9. Shopify Dev Dashboard Configuration

> Configuration below is from **user-reported Dev Dashboard state** during 2026-09-19 testing. Not read directly from Shopify by this audit.

| Setting | Known value |
|---|---|
| App name | Confirma (exact dashboard name **NOT VERIFIED**) |
| Active version | `confirma-3` |
| Admin API / Webhooks API version (dashboard) | **NOT VERIFIED** (code uses `2026-07`) |
| Scopes | `read_orders`, `read_products` |
| Authorized redirect URL | `https://ignore-savings-joyfully.ngrok-free.dev/api/integrations/shopify/callback` |
| App URL | `https://shopify.dev/apps/default-app-home` |
| Embedded | OFF |
| Legacy installation flow | ENABLED (`use_legacy_install_flow`) |
| POS | **NOT VERIFIED** |
| App proxy | **NOT VERIFIED** |
| Installations count (Dev Dashboard) | `0` (user-reported) |
| Distribution method | **NOT VERIFIED** (Dev Dashboard custom apps may appear "unlisted"; no distribution selection required per Shopify community guidance — not independently verified here) |

### Important clarification

`https://shopify.dev/apps/default-app-home` is Shopify's **placeholder/default app home** for non-embedded apps. It is **NOT** Confirma's hosted UI. Confirma's actual public dev URL during testing was an ngrok tunnel (see §18).

Confirma uses **standalone/non-embedded OAuth** initiated from Confirma's connect route, not embedded admin App Bridge.

---

## 10. Meta Integration

### Graph API version (code)

```typescript
// lib/integrations/meta/constants.ts
export const META_GRAPH_API_VERSION = "v21.0";
```

### Implemented

| Feature | Location |
|---|---|
| Meta env validation | `lib/integrations/meta/env.ts` (`META_SESSION_SECRET` min 32) |
| Connect/disconnect/status/verify API routes | `app/api/integrations/meta/*` |
| Encrypted token storage | `meta_connections`, `meta_connection_secrets` |
| Credential verification | `lib/integrations/meta/verification/*` |
| CAPI payload builder | `lib/integrations/meta/capi/payload-builder.ts` |
| User data hashing (email/phone) | `lib/integrations/meta/capi/hash-user-data.ts` |
| Purchase delivery orchestration | `lib/integrations/meta/delivery/deliver-purchase.ts` |
| Delivery persistence | `meta_conversion_deliveries` table |
| Stale sending reclaim | 5-minute threshold (`META_PURCHASE_STALE_SENDING_THRESHOLD_MS`) |
| Confirmation-triggered dispatch | `lib/confirmation/purchase-delivery.ts` → called from confirm API |

### Purchase event identity

Deterministic event ID: `purchase:{orderId}` (`lib/conversions/event-id.ts`)

### Delivery states

`pending` → `sending` → `sent` | `failed` (with attempts, `last_error`, stale reclaim)

### Meta marketing adapter status

`integrations/marketing/meta/meta-marketing-adapter.ts` — `sendConversion` returns not implemented. **Real sending** is in `lib/integrations/meta/delivery/`.

### External verification status

| Item | Status |
|---|---|
| Live Meta credential verification against real pixel | **NOT VERIFIED** |
| Live CAPI Purchase delivery to Meta | **NOT VERIFIED** |
| Meta Events Manager receipt | **NOT VERIFIED** |

`META_SESSION_SECRET` was **MISSING** from `.env.local` at report time → Meta connect/encryption paths will fail until set.

---

## 11. Order / Confirmation Domain

### Lifecycle

```
Webhook orders/create
  → idempotent ingestion record
  → normalized order inserted (confirmation_status = pending)

Merchant confirms (API or UI)
  → pending → confirmed (confirmed_at set)
  → ONE Meta Purchase delivery attempt (idempotent by event_id + order unique constraints)
```

### Order identity

- Unique per store: `(store_id, provider, external_order_id)` on `orders`
- Money stored as integer minor units (`total_amount_minor`, `subtotal_amount_minor`)
- `confirmed_at` TIMESTAMPTZ when confirmed

### Idempotency guarantees (implemented in code/tests)

| Scenario | Behavior |
|---|---|
| Duplicate webhook same `external_event_id` | Recorded as duplicate in `store_webhook_events`; order not duplicated |
| Duplicate confirm on already confirmed order | Returns `already_confirmed` |
| Duplicate Meta Purchase for same order | `meta_conversion_deliveries` unique on `(order_id, provider, event_type)` and `event_id` |
| Deterministic Meta event ID | Always `purchase:{orderId}` for same order |

### Confirm API

`POST /api/orders/[id]/confirm` — authenticates user, calls `confirmOrder`, then `dispatchPurchaseDeliveryAfterConfirmation`.

---

## 12. Database

### Migration policy

- Canonical numbered files: `database/migrations/`
- Supabase CLI copies: `supabase/migrations/` (timestamped equivalents)
- **Never apply `001_initial_schema.sql`** — superseded by `002`
- **Do not modify production schema directly** — migrations only

### Migration history (present in repo)

| File | Milestone | Purpose |
|---|---|---|
| `001_initial_schema.sql` | M0 (historical) | **Do not apply** — superseded |
| `002_mvp_database_foundation.sql` | M2-C2 | Profiles, stores, store_connections, shopify_connections, shopify_connection_secrets, RLS |
| `003_shopify_webhook_ingestion.sql` | M3-A | `store_webhook_events` idempotency table |
| `004_shopify_order_ingestion.sql` | M3-B | `orders` table |
| `005_confirmation_engine_foundation.sql` | M3-C | `confirmed` status + `confirmed_at` |
| `006_meta_connection_foundation.sql` | M4-A | `meta_connections`, `meta_connection_secrets` |
| `007_meta_credential_verification.sql` | M4-C | Meta verification columns |
| `008_meta_purchase_delivery.sql` | M4-D/F | `meta_conversion_deliveries`, composite FK on orders |

### Important tables

| Table | Notes |
|---|---|
| `profiles` | Extends `auth.users` |
| `stores` | User-owned; platform check currently `shopify` only |
| `store_connections` | Generic connection registry per store |
| `shopify_connections` | Public Shopify metadata; unique `shop_domain` |
| `shopify_connection_secrets` | Encrypted tokens; service-role only |
| `store_webhook_events` | Webhook idempotency + audit |
| `orders` | Normalized orders; RLS select own |
| `meta_connections` | Pixel ID + verification status |
| `meta_connection_secrets` | Encrypted Meta access token |
| `meta_conversion_deliveries` | CAPI delivery state |

### Remote Supabase migration state

**UNKNOWN / NOT VERIFIED** — this audit did not confirm which migrations are applied on the live Supabase project. Verify with `npx supabase db push` status or SQL inspection before assuming schema parity.

### New migration required?

**UNKNOWN / NOT VERIFIED** — repo migrations 002–008 appear complete for current code. Confirm against remote before adding new migrations.

---

## 13. Supabase

| Field | Value |
|---|---|
| **Separate from smart-services** | **Yes — mandatory isolation** |
| **Project reference (from public URL subdomain)** | `othfbqxjwtlkbiemwsvl` |
| **Region** | **UNKNOWN / NOT VERIFIED** |
| **Project display name** | **UNKNOWN / NOT VERIFIED** |
| **Remote schema applied** | **UNKNOWN / NOT VERIFIED** |

### Environment variable names (never values)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Public URL and publishable key are client-safe. Service role key is server-only.

---

## 14. Environment Variables

Current state verified via `@next/env loadEnvConfig()` against `.env.local` at report time. **No values recorded.**

| Variable | Required | Current state | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | SET | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | SET | Supabase anon/publishable key (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) | SET | Server-side DB writes bypassing RLS |
| `NEXT_PUBLIC_APP_URL` | Yes | SET | Public HTTPS base for OAuth callback, webhooks, redirects |
| `NODE_ENV` | Optional | MISSING in `.env.local` | Set at runtime by Next.js (`development` in dev) |
| `SHOPIFY_API_KEY` | Yes | SET | Shopify OAuth Client ID |
| `SHOPIFY_API_SECRET` | Yes | SET | Shopify Client secret |
| `SHOPIFY_SESSION_SECRET` | Yes (≥32 chars) | SET | OAuth state signing + token encryption |
| `SHOPIFY_OAUTH_SCOPES` | Optional | MISSING (code default applies) | OAuth scopes; defaults to `read_products,read_orders` |
| `META_SESSION_SECRET` | Yes for Meta | MISSING | Meta token encryption |

---

## 15. Git History / Milestones

All commits on `master` (verified from `git log`):

| Commit | Message | Milestone summary |
|---|---|---|
| `c8271f6` | M0: Confirma foundation | Project scaffold, adapters, initial structure |
| `1741fc4` | M0-B: Normalize Confirma project naming | Naming normalization |
| `bb4a1a3` | M1-A: Build Confirma product shell | Landing, dashboard shell, layouts |
| `d053d31` | M1-B: Improve onboarding experience | Onboarding UX |
| `968b94b` | M1-C: Add connection state foundation | Connection state model + UI |
| `9996625` | M2-A: Add Shopify integration foundation | Shopify adapter scaffold |
| `951e674` | M2-B: Implement Shopify OAuth connection | OAuth routes, cookie session (later superseded by DB) |
| `5d52aff` | M2-C2: Finalize Supabase database foundation | Migration 002, RLS |
| `e452f0b` | M2-C3: Add auth and Shopify database persistence | Supabase auth + Shopify DB tokens |
| `b9f9051` | M2-C4: Add localization and extensibility foundation | next-intl en/ar, URL config, billing types |
| `66830b5` | M3-A: Add Shopify webhook ingestion foundation | Webhook HMAC + idempotency |
| `35f77ce` | M3-B: Add Shopify order ingestion and normalization | Orders table + normalization |
| `1453edc` | M3-C: Add confirmation engine foundation | pending → confirmed |
| `d28bd62` | M3-D: Add confirmation UI | Orders UI + confirm action |
| `0e64041` | M4-A: Add Meta connection foundation | Meta DB + connect |
| `10d064c` | M4-B: Add Meta CAPI event foundation | CAPI payload builder |
| `8bdf307` | M4-C: Add Meta credential verification | Graph API verify |
| `93b924c` | M4-D: Add Meta Purchase delivery | Delivery records + send |
| `539ce1d` | M4-F: Harden Meta Purchase delivery | Stale sending reclaim, integrity constraints |
| `bc4e2c0` | M4-G: Fix dashboard cookie mutation | Removed cookie delete from read paths |
| `de2aef8` | M5-A: Implement Shopify webhook registration | orders/create registration after OAuth |
| `a6b4d24` | M5: Harden Shopify disconnect, auth, and MVP flow | Disconnect + auth hardening |
| `1ecfcd7` | M6-C1: Update Shopify API version to 2026-07 | Admin API version constant |
| `c94f776` | M6-C1.1: Fix Turbopack i18n JSON loading | Static message imports |
| `c9dd5b3` | M6-C2: Fix locale-independent Shopify API links | Button `/api/` fix |
| `dc2d7eb` | M6-C2.1: Fix Shopify OAuth public redirect base | ngrok-safe redirects |

**Note:** No separate git commits named M2-C1, M4-E, or M6-B were found. M6 work to date is C1/C1.1/C2/C2.1 only.

---

## 16. Recent Shopify Fixes

### M6-C2 — Fix locale-independent Shopify API links

| Field | Detail |
|---|---|
| **Commit** | `c9dd5b3a8452930cf7f6b416e9204f3acfbdbb0e` |
| **Root cause** | `Button` used next-intl `Link`, prefixing locale (`/ar`) onto `/api/integrations/shopify/connect` |
| **Files changed** | `components/ui/button.tsx` |
| **Before** | Connect button navigated to `/ar/api/...` → 404 |
| **After** | `/api/` hrefs use plain `<a>` without locale prefix |
| **Tests** | Existing i18n/auth tests; no dedicated new test file for this one-line routing fix |

### M6-C2.1 — Fix Shopify OAuth public redirect base

| Field | Detail |
|---|---|
| **Commit** | `dc2d7ebae8755d0eb8df8b9ae557d138f2a5f232` |
| **Root cause** | Error/success redirects used `new URL(path, request.url)`; behind ngrok `request.url` was `http://localhost:3000` |
| **Files changed** | `app/api/integrations/shopify/connect/route.ts`, `app/api/integrations/shopify/callback/route.ts` |
| **Before** | OAuth errors/success redirected to localhost |
| **After** | Redirects use `buildAppPath(getAppBaseUrl(), localizedPath)` from `NEXT_PUBLIC_APP_URL` |
| **Note** | OAuth `redirect_uri` sent to Shopify was already derived from `NEXT_PUBLIC_APP_URL`; this fix affected post-OAuth user redirects only |
| **Tests** | URL builder covered in `tests/unit/i18n.test.ts` |

---

## 17. Testing

### Commands (`package.json`)

| Command | Purpose |
|---|---|
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright (foundation spec exists) |
| `npm run format:check` | Prettier check |

### Unit test summary (verified at report time)

- **32 test files, 235 tests — all passing**
- Duration ~5–12s locally

### Test coverage areas

| Area | Example test files |
|---|---|
| Shopify OAuth | `shopify-oauth.test.ts` |
| Shopify webhooks | `shopify-webhook-hmac.test.ts`, `shopify-webhook-ingestion.test.ts`, `shopify-webhook-registration.test.ts` |
| Shopify orders | `shopify-order-ingestion.test.ts`, `shopify-order-normalize.test.ts` |
| Shopify disconnect | `shopify-disconnect.test.ts` |
| Shopify persistence | `shopify-persistence.test.ts` |
| Meta connection/CAPI/delivery | `meta-connection.test.ts`, `meta-capi-foundation.test.ts`, `meta-purchase-delivery.test.ts` |
| Confirmation | `confirmation-state-machine.test.ts`, `confirm-order.test.ts`, `confirm-order-api.test.ts` |
| Auth | `auth-session-flow.test.ts`, `auth-protection.test.ts` |
| i18n/URLs | `i18n.test.ts` |
| Migrations (SQL structure) | `*-migration.test.ts` files |

### LOCAL AUTOMATED TESTS vs REAL EXTERNAL INTEGRATION TESTS

| Category | Status |
|---|---|
| Unit/integration tests (mocked HTTP/DB) | **235/235 passing — LOCAL ONLY** |
| Live Shopify OAuth end-to-end | **EXTERNAL VERIFICATION PENDING** |
| Live Shopify webhook delivery | **EXTERNAL VERIFICATION PENDING** |
| Live Meta CAPI Purchase | **EXTERNAL VERIFICATION PENDING** |
| Playwright E2E against production-like stack | **NOT VERIFIED** (spec exists; live run not confirmed in this audit) |

---

## 18. Current Runtime / Local Development

| Item | Detail |
|---|---|
| Dev command | `npm run dev` → `next dev --turbopack` |
| Default port | 3000 (can pass `-p 3000`) |
| Env file | `.env.local` (loaded by Next.js; shown in dev startup as `Environments: .env.local`) |
| Public URL for OAuth/webhooks | Must be HTTPS in dev → **ngrok** (or similar) tunnel to localhost |
| Known test ngrok URL (session) | `https://ignore-savings-joyfully.ngrok-free.dev` — **volatile; changes when ngrok restarts unless reserved domain** |
| ngrok command used | `ngrok http 3000` |
| Restart requirement | **Restart `npm run dev` after `.env.local` changes** (hot reload may reload env, but full restart is safer) |
| Cross-origin dev warning | Next.js warns about ngrok origin for `/_next/*` — may need `allowedDevOrigins` in future Next versions |

---

## 19. Current Known Problems / Blockers

| Problem | Evidence | Status | Do not change yet? |
|---|---|---|---|
| Live Shopify OAuth E2E not verified | No callback hits in dev/ngrok logs; user reports connect reaches Shopify but callback/persistence unconfirmed | **BLOCKER for M6-D** | Do not declare MVP live-ready |
| Dev Dashboard Install app not suitable for current architecture | App URL = default-app-home; no App URL handler; 0 installations | **VERIFIED mismatch** | Do not use Dev Dashboard install as primary test |
| `META_SESSION_SECRET` missing | Env audit MISSING | **BLOCKER for Meta connect** | Set before Meta testing |
| ngrok URL volatility | Free ngrok URLs change | **OPERATIONAL RISK** | Update Shopify redirect URL + `NEXT_PUBLIC_APP_URL` together when URL changes |
| Remote Supabase migration parity unknown | Not verified in audit | **UNKNOWN** | Verify before relying on DB features |
| README outdated (still says M0) | `README.md` content | **DOC DRIFT** | Low priority; do not confuse with code state |
| Middleware login redirect may use `request.nextUrl` (localhost behind ngrok) | Observed pattern in middleware for some paths | **POSSIBLE ISSUE** | Diagnose if login redirect lands on localhost during ngrok testing |
| Previous Shopify error `Ce lien d'installation ne peut pas être utilisé` | User-reported | **NOT VERIFIED root cause in repo** | May have been pre-legacy-flow or wrong install path |
| No git remote | `git remote -v` empty | **INFO** | No GitHub backup unless user adds remote |

---

## 20. What MUST NOT Be Changed

Unless explicitly requested in a future milestone:

1. **Do not touch `smart-services`** or reuse its Supabase project.
2. **Do not apply schema changes directly** on production/live DB — migrations only.
3. **Do not hardcode secrets** — use env vars per `.env.example`.
4. **Do not break Meta Purchase idempotency** — one Purchase per confirmed order (`purchase:{orderId}`).
5. **Do not break webhook idempotency** — respect `store_webhook_events` uniqueness.
6. **Do not add unrequested features** (mobile, WhatsApp, AI, WooCommerce, YouCan, billing).
7. **Do not redesign adapter architecture** without approval.
8. **Do not delete untracked prototype files** (`gsap-test`, `components/prototypes`) unless user asks.
9. **Do not assume OAuth works** without callback log evidence.
10. **Do not use Dev Dashboard "Install app"** as the MVP OAuth test entry point.

---

## 21. Cursor Working Rules

Cursor (and other AI agents) are **implementation agents**, not product owners.

Rules from `DEVELOPMENT_RULES.md` and project practice:

1. Follow exact user instructions; do not expand scope autonomously.
2. Suggestions must be labeled **NOT IMPLEMENTED** unless approved.
3. Perform read-only audit before risky changes (OAuth, auth, migrations, secrets).
4. Security-sensitive changes require explicit review.
5. Database changes → migration files in `database/migrations/` (+ supabase copy).
6. Run tests after changes (`npm test`, `npm run typecheck`, `npm run lint`).
7. Commit only when user explicitly requests; use milestone-style messages.
8. **Never expose secrets** in chat, commits, or documentation.
9. Preserve backward compatibility; incremental diffs preferred.
10. When requirements are ambiguous, stop and ask.

---

## 22. Untracked / Prototype Files

| Path | Status | Notes |
|---|---|---|
| `app/[locale]/gsap-test/` | Untracked (`??`) | GSAP experiment page — preserve unless user asks to remove |
| `components/prototypes/` | Untracked (`??`) | Prototype components — preserve unless user asks to remove |

Do **not** delete or commit these without explicit user instruction.

---

## 23. Current Safe Checkpoint

| Field | Value |
|---|---|
| **Latest verified commit** | `dc2d7eb` — M6-C2.1 Shopify OAuth public redirect base fix |
| **Latest active functionality** | Full MVP code path through M5 + M6-C fixes; 235/235 unit tests pass |
| **Working tree** | Clean except untracked prototypes |
| **Current blocker** | Live Shopify OAuth callback + token persistence + webhook registration + Meta E2E **NOT VERIFIED** |
| **Not verified** | Remote Supabase migrations applied; live callback; live webhooks; live Meta CAPI; Dev Dashboard installation count accuracy |
| **Test next** | Confirma-authenticated OAuth from ngrok URL → approve scopes → confirm `/api/integrations/shopify/callback` hit → `shopify=connected` → verify DB token + webhook |
| **Do not modify before next test** | Architecture, Shopify Dashboard version, adapter boundaries, idempotency logic |

---

## 24. NEXT SESSION START HERE

1. **Read this report completely** (`docs/CONFIRMA_PROJECT_HANDOFF.md`).
2. **Verify git status** — expect HEAD `dc2d7eb`, untracked prototypes only.
3. **Do not modify code yet.**
4. **Verify runtime:** Is `npm run dev` running? Is ngrok forwarding to port 3000? Does `NEXT_PUBLIC_APP_URL` match current ngrok HTTPS URL?
5. **Verify env vars** (SET/MISSING only): Shopify trio, `NEXT_PUBLIC_APP_URL`, `META_SESSION_SECRET` if testing Meta.
6. **Do not use Dev Dashboard "Install app"** as the primary OAuth test — use Confirma connect from `/ar/onboarding/store` or `/dashboard/connections` while logged in via ngrok.
7. **Watch logs** for `GET /api/integrations/shopify/callback` — absence means OAuth did not complete.
8. **Do not create a new Shopify app version** unless a specific config mismatch is proven and user approves.
9. **Do not change architecture** (standalone OAuth, adapter pattern, DB token model).
10. **Do not rotate secrets** unless explicitly required.
11. **After diagnosis only**, propose the **smallest safe fix** (env, dashboard URL sync, or targeted code change).
12. **Set `META_SESSION_SECRET`** before any Meta connect/CAPI live test.
13. **Verify Supabase migrations** applied on project `othfbqxjwtlkbiemwsvl` before debugging persistence failures.
14. **Do not blindly repeat** Dev Dashboard install troubleshooting — that path is architecturally mismatched.
15. **Commit only when user asks**, after verified milestone completion.

---

## Appendix A — Related existing documentation

| Document | Path |
|---|---|
| System overview | `docs/architecture/system-overview.md` |
| Adapter architecture | `docs/architecture/adapter-architecture.md` |
| Security principles | `docs/architecture/security-principles.md` |
| Development rules (duplicate) | `docs/architecture/development-rules.md`, `DEVELOPMENT_RULES.md` |
| Migration README | `database/migrations/README.md` |

---

## Appendix B — Information that could not be verified in this audit

- Which SQL migrations are applied on remote Supabase
- Supabase project region and display name
- Shopify Dev Dashboard exact app name, POS, app proxy settings
- Shopify distribution method / listing state
- Whether a live OAuth access token exists in `shopify_connection_secrets` for `yhken8-ej.myshopify.com`
- Whether `orders/create` webhook is registered on the live store
- Whether Meta CAPI Purchase was ever accepted by Meta for a real order
- Exact root cause of French Shopify message `Ce lien d'installation ne peut pas être utilisé` (may have been pre-fix state)
- Whether Playwright E2E passes on current HEAD

---

*End of handoff report.*
