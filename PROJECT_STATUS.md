# PROJECT_STATUS.md

**Report generated:** 2026-09-20  
**Workspace path:** `C:\Users\pc\Documents\AI Projects\02_Projects\ConfirmFlow`  
**Git branch:** `master`  
**Latest commit:** `dc2d7eb` — `M6-C2.1: Fix Shopify OAuth public redirect base` (26 commits total)  
**Git remote:** none configured

---

## Naming Note (Kortor vs Confirma)

The user request references a platform called **"Kortor"**. A full-text search across `C:\Users\pc\Documents\AI Projects\02_Projects` found **zero matches** for `Kortor` or `kortor`. The actual codebase in this workspace is named **Confirma** (`package.json` name: `confirma`, version `0.1.0`). The product goal described in the request — sending **real order confirmations to Facebook only** (not fake confirmations) — matches what Confirma implements via Meta Conversions API (CAPI) Purchase events triggered only after merchant confirmation. This report documents **Confirma** as the actual project.

---

## 1) Project Overview

### Name
- **Product name:** Confirma
- **npm package name:** `confirma`
- **Folder name:** `ConfirmFlow`
- **Requested name "Kortor":** does not exist in the codebase

### Goal
Confirma is a standalone SaaS web platform that:
1. Connects to an ecommerce store (Shopify or YouCan).
2. Receives real orders via webhooks.
3. Holds each order in a `pending` confirmation state.
4. Lets the merchant explicitly confirm an order.
5. Sends **one real Meta (Facebook) Conversions API Purchase event** only after confirmation — not on order creation, not automatically, not as fake/test traffic.

### Idea
Ecommerce merchants in markets where phone/WhatsApp order confirmation is common need a bridge between "order received" and "order confirmed for ads attribution." Confirma normalizes orders from store providers, enforces a human confirmation step, and delivers a verified Purchase conversion to Meta's CAPI so ad optimization reflects **confirmed** revenue, not abandoned or unverified orders.

### Product Type
- **Web platform (dashboard):** Next.js 15 App Router application with bilingual UI (English and Arabic).
- **Backend:** Next.js API routes (server-side) + Supabase PostgreSQL + Supabase Auth.
- **Mobile app:** does not exist in this repository.
- **Shopify embedded app / App Store app:** not implemented; Shopify integration is standalone OAuth, not App Bridge.

### Target Audience
- Ecommerce merchants using Shopify or YouCan who confirm orders manually (phone, WhatsApp, COD verification).
- Merchants running Meta (Facebook/Instagram) ads who want Purchase events tied to **confirmed** orders only.

### Core Function
1. Store connection (OAuth for Shopify/YouCan).
2. Webhook ingestion with HMAC verification and idempotency.
3. Order normalization into a provider-agnostic `orders` table.
4. Merchant confirmation workflow (`pending` → `confirmed`).
5. Meta Pixel + access token connection with credential verification.
6. Meta CAPI Purchase delivery after confirmation, with idempotent delivery records.

---

## 2) Tech Stack

All versions below are taken directly from `package.json` and source constants.

### Languages
| Language | Version / Notes |
|----------|-----------------|
| TypeScript | `^5.8.3` (devDependency) |
| SQL | PostgreSQL via Supabase migrations |
| CSS | Tailwind CSS v4 |

### Frameworks & Runtime
| Tool | Version |
|------|---------|
| Next.js | `^15.3.3` |
| React | `^19.1.0` |
| React DOM | `^19.1.0` |
| Node.js | implied by `@types/node ^22.15.21` |

### Database & Auth
| Tool | Version / Notes |
|------|-----------------|
| Supabase (PostgreSQL) | via `@supabase/supabase-js ^2.49.8` |
| Supabase SSR | `@supabase/ssr ^0.6.1` |
| Prisma | **not used** — no `prisma/schema.prisma` exists |

### Internationalization
| Tool | Version |
|------|---------|
| next-intl | `^4.14.5` |
| Locales | `en`, `ar` |

### Validation
| Tool | Version |
|------|---------|
| Zod | `^3.25.36` |

### Styling
| Tool | Version |
|------|---------|
| Tailwind CSS | `^4.1.8` |
| @tailwindcss/postcss | `^4.1.8` |

### Testing
| Tool | Version |
|------|---------|
| Vitest | `^3.1.4` |
| Playwright | `^1.52.0` |

### Linting & Formatting
| Tool | Version |
|------|---------|
| ESLint | `^9.27.0` |
| eslint-config-next | `^15.3.3` |
| eslint-config-prettier | `^10.1.5` |
| Prettier | `^3.5.3` |
| prettier-plugin-tailwindcss | `^0.6.11` |

### Other Dependencies
| Tool | Version |
|------|---------|
| server-only | `^0.0.1` |

### External API Versions (from source constants)
| Integration | Version |
|-------------|---------|
| Shopify Admin REST API | `2026-07` (`lib/integrations/shopify/constants.ts`) |
| Meta Graph API | `v21.0` (`lib/integrations/meta/constants.ts`) |

### Development Tools
- Turbopack enabled for dev: `next dev --turbopack`
- ngrok used in development for public webhook/OAuth URLs (referenced in handoff docs; not a package dependency)

### npm Scripts
| Script | Command |
|--------|---------|
| `dev` | `next dev --turbopack` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint .` |
| `lint:fix` | `eslint . --fix` |
| `format` | `prettier --write .` |
| `format:check` | `prettier --check .` |
| `typecheck` | `tsc --noEmit` |
| `test` | `vitest run` |
| `test:watch` | `vitest` |
| `test:e2e` | `playwright test` |
| `test:e2e:ui` | `playwright test --ui` |

---

## 3) Project Structure (Folder Structure)

```
ConfirmFlow/
├── app/                                    # Next.js App Router
│   ├── layout.tsx                          # Root layout
│   ├── globals.css                         # Global styles
│   ├── [locale]/                           # Locale-prefixed pages (en, ar)
│   │   ├── layout.tsx                      # Locale layout + next-intl provider
│   │   ├── (marketing)/
│   │   │   ├── layout.tsx                  # Marketing layout shell
│   │   │   └── page.tsx                    # Landing page at /[locale]
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                  # Auth pages layout
│   │   │   ├── login/page.tsx              # Login page
│   │   │   └── signup/page.tsx             # Signup page
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                  # Dashboard layout with sidebar
│   │   │   ├── page.tsx                    # Dashboard home
│   │   │   ├── connections/page.tsx        # Connection management page
│   │   │   └── orders/page.tsx             # Orders list + confirm actions
│   │   ├── onboarding/
│   │   │   ├── layout.tsx                  # Onboarding wizard layout
│   │   │   ├── page.tsx                    # Onboarding overview
│   │   │   ├── store/page.tsx              # Store provider connect step
│   │   │   ├── meta/page.tsx               # Meta pixel connect step
│   │   │   └── confirmation/page.tsx       # Confirmation setup step
│   │   └── gsap-test/page.tsx              # GSAP animation prototype (uncommitted)
│   └── api/                                # API route handlers
│       ├── health/route.ts                 # Health check endpoint
│       ├── auth/callback/route.ts          # Supabase Auth OAuth callback
│       ├── supabase/verify/route.ts        # Supabase connectivity verify
│       ├── orders/[id]/confirm/route.ts    # Order confirmation + Meta delivery trigger
│       └── integrations/
│           ├── shopify/                    # Shopify OAuth, webhooks, status, disconnect
│           ├── youcan/                     # YouCan OAuth, webhooks (uncommitted)
│           └── meta/                       # Meta connect, verify, disconnect, status
├── components/
│   ├── connections/                        # Store/Meta connection UI
│   ├── dashboard/                            # Dashboard widgets
│   ├── layout/                               # Site header, footer, dashboard shell
│   ├── onboarding/                           # Onboarding step components
│   ├── orders/                               # Orders list and status badges
│   ├── prototypes/                           # GSAP prototype (uncommitted)
│   └── ui/                                   # Shared UI primitives (button, input, card, badge)
├── lib/
│   ├── auth/                                 # Supabase auth actions, session, protection
│   ├── config/                               # App URL builders (OAuth callbacks, webhooks)
│   ├── confirmation/                         # confirmOrder, state machine, purchase delivery dispatch
│   ├── connections/                          # Store/Meta connection helpers
│   ├── conversions/                          # Purchase event builder, validation, event ID
│   ├── database/                             # Supabase client wrappers, schema constants
│   ├── events/                               # Event type definitions
│   ├── i18n/                                 # Locale helpers, path utilities
│   ├── integrations/
│   │   ├── adapters/                         # StoreAdapter, MarketingAdapter, ConfirmationAdapter interfaces
│   │   ├── stores/                           # Provider registry, supported-providers list
│   │   ├── shopify/                          # Full Shopify integration (34 TypeScript files)
│   │   ├── youcan/                           # Full YouCan integration (32 TypeScript files, uncommitted)
│   │   └── meta/                             # Meta CAPI, verification, delivery (27 TypeScript files)
│   ├── orders/                               # Order persistence, formatting, client fetch
│   ├── security/                             # Webhook verification, authorization helpers
│   ├── supabase/                             # Supabase client factories (browser, server, middleware)
│   ├── validation/                           # Environment and schema validation
│   ├── utils/                                # cn() utility
│   └── webhooks/                             # Generic webhook processor, idempotency store
├── integrations/                             # Adapter implementations (thin layer over lib/)
│   ├── stores/
│   │   ├── shopify/                          # shopify-adapter.ts, constants, types
│   │   ├── youcan/                           # youcan-adapter.ts (uncommitted)
│   │   └── woocommerce/README.md             # Placeholder only
│   ├── marketing/
│   │   ├── meta/                             # meta-marketing-adapter.ts (sendConversion stubbed)
│   │   ├── google/README.md                  # Placeholder only
│   │   └── tiktok/README.md                  # Placeholder only
│   └── confirmation/
│       ├── external-service/README.md        # Placeholder only
│       ├── custom-webhook/README.md          # Placeholder only
│       └── store-status/README.md            # Placeholder only
├── features/                                 # Feature module stubs (auth, billing, confirmations, etc.)
├── database/
│   ├── migrations/                           # SQL migrations 001–009
│   ├── seeds/README.md                       # No seed data implemented
│   └── types/index.ts                        # TypeScript DB type definitions
├── supabase/
│   ├── config.toml                           # Supabase local config
│   ├── migrations/                           # Timestamped mirror of database/migrations
│   └── .temp/                                # Linked project metadata
├── tests/
│   ├── unit/                                 # 39 Vitest unit test files
│   ├── e2e/foundation.spec.ts                # Playwright E2E (landing + health)
│   ├── fixtures/                             # shopify-order.ts, youcan-order.ts
│   └── mocks/server-only.ts                  # Vitest mock for server-only
├── i18n/                                     # next-intl routing, navigation, request config
├── messages/
│   ├── en/                                   # English i18n (auth, common, connections, dashboard, errors, landing, navigation, onboarding, orders)
│   └── ar/                                   # Arabic i18n (same namespaces)
├── docs/
│   ├── architecture/                         # System overview docs
│   ├── decisions/                            # ADRs (e.g. adapter isolation)
│   ├── api/                                  # API documentation stubs
│   ├── integrations/                         # Integration documentation stubs
│   └── CONFIRMA_PROJECT_HANDOFF.md           # Handoff document (uncommitted)
├── scripts/README.md                         # Scripts placeholder
├── middleware.ts                             # i18n routing + Supabase session + auth protection
├── next.config.ts                            # Next.js configuration
├── tsconfig.json                             # TypeScript configuration
├── vitest.config.ts                          # Vitest configuration
├── playwright.config.ts                      # Playwright configuration
├── .env.example                              # Environment variable template
├── .env.local                                # Local secrets (exists; not documented here)
├── README.md                                 # Project readme (outdated — says M0 only)
├── DEVELOPMENT_RULES.md                      # Development conventions
└── CONFIRMA_HANDOFF.md                       # Handoff summary (uncommitted)
```

---

## 4) Backend

### 4.1 API Endpoints

#### Health & Infrastructure

| Path | Method | Purpose | File |
|------|--------|---------|------|
| `/api/health` | GET | Returns `{ status: "ok", service: "confirma", milestone: "M0" }` | `app/api/health/route.ts` |
| `/api/supabase/verify` | GET | Verifies Supabase configuration and reachability | `app/api/supabase/verify/route.ts` |
| `/api/auth/callback` | GET | Supabase Auth OAuth code exchange; redirects to safe internal path | `app/api/auth/callback/route.ts` |

#### Orders

| Path | Method | Purpose | File |
|------|--------|---------|------|
| `/api/orders/[id]/confirm` | POST | Merchant confirms order; atomically updates `confirmation_status` to `confirmed`; triggers Meta CAPI Purchase delivery | `app/api/orders/[id]/confirm/route.ts` |
| `/api/orders/[id]/confirm` | GET, PUT, PATCH, DELETE | Returns 405 Method Not Allowed | `app/api/orders/[id]/confirm/route.ts` |

#### Shopify Integration

| Path | Method | Purpose | File |
|------|--------|---------|------|
| `/api/integrations/shopify/connect` | GET | Starts Shopify OAuth: validates shop domain, creates signed state cookie, redirects to Shopify authorize URL | `app/api/integrations/shopify/connect/route.ts` |
| `/api/integrations/shopify/callback` | GET | Shopify OAuth callback: validates state/HMAC, exchanges code for token, persists encrypted connection, registers webhooks | `app/api/integrations/shopify/callback/route.ts` |
| `/api/integrations/shopify/disconnect` | POST | Disconnects Shopify store: deletes webhooks (best effort), clears DB records | `app/api/integrations/shopify/disconnect/route.ts` |
| `/api/integrations/shopify/status` | GET | Returns public Shopify connection status for authenticated user | `app/api/integrations/shopify/status/route.ts` |
| `/api/integrations/shopify/register-webhooks` | POST | Manual webhook registration for user's connected Shopify store | `app/api/integrations/shopify/register-webhooks/route.ts` |
| `/api/integrations/shopify/webhooks` | POST | Shopify webhook ingestion: HMAC verify, idempotency, `orders/create` handling | `app/api/integrations/shopify/webhooks/route.ts` |
| `/api/integrations/shopify/webhooks` | GET, PUT, PATCH, DELETE | Returns 405 Method Not Allowed | `app/api/integrations/shopify/webhooks/route.ts` |

#### YouCan Integration (uncommitted)

| Path | Method | Purpose | File |
|------|--------|---------|------|
| `/api/integrations/youcan/connect` | GET | Starts YouCan OAuth | `app/api/integrations/youcan/connect/route.ts` |
| `/api/integrations/youcan/callback` | GET | YouCan OAuth callback; persist connection; register webhooks | `app/api/integrations/youcan/callback/route.ts` |
| `/api/integrations/youcan/disconnect` | POST | Disconnects YouCan store | `app/api/integrations/youcan/disconnect/route.ts` |
| `/api/integrations/youcan/status` | GET | YouCan connection status | `app/api/integrations/youcan/status/route.ts` |
| `/api/integrations/youcan/register-webhooks` | POST | Manual YouCan webhook registration | `app/api/integrations/youcan/register-webhooks/route.ts` |
| `/api/integrations/youcan/webhooks` | POST | YouCan webhook ingestion | `app/api/integrations/youcan/webhooks/route.ts` |
| `/api/integrations/youcan/webhooks` | GET, PUT, PATCH, DELETE | Returns 405 Method Not Allowed | `app/api/integrations/youcan/webhooks/route.ts` |

#### Meta Integration

| Path | Method | Purpose | File |
|------|--------|---------|------|
| `/api/integrations/meta/connect` | POST | Saves Meta pixel ID + access token; encrypts token; runs credential verification | `app/api/integrations/meta/connect/route.ts` |
| `/api/integrations/meta/disconnect` | POST | Clears Meta connection and secrets | `app/api/integrations/meta/disconnect/route.ts` |
| `/api/integrations/meta/status` | GET | Returns Meta connection and verification status | `app/api/integrations/meta/status/route.ts` |
| `/api/integrations/meta/verify` | POST | Re-runs Meta credential verification against Graph API | `app/api/integrations/meta/verify/route.ts` |

### 4.2 Controllers / Services / Middlewares

#### Middleware (`middleware.ts`)
- Applies `next-intl` locale routing on all non-API paths.
- Creates Supabase server client and refreshes session cookies on every request.
- **API protection:**
  - `/api/integrations/shopify/*` (except `/webhooks`): requires authenticated user; `/connect` and `/callback` redirect unauthenticated users to localized login with `next` param.
  - `/api/integrations/youcan/*` (except `/webhooks`): same pattern as Shopify.
  - `/api/integrations/meta/*`: requires authenticated user; returns 401 JSON if unauthenticated.
  - Webhook endpoints (`/api/integrations/shopify/webhooks`, `/api/integrations/youcan/webhooks`): **public** (no auth; HMAC verified instead).
- **App protection:**
  - `/dashboard/*` and `/onboarding/*`: require authenticated user; redirect to login.

#### Auth Protection Helpers (`lib/auth/protection.ts`)
- `isProtectedAppPath(pathname)`: true for `/dashboard` and `/onboarding` prefixes.
- `isProtectedShopifyApiPath(pathname)`: true for all `/api/integrations/shopify/*` except webhooks.
- `isProtectedYouCanApiPath(pathname)`: true for all `/api/integrations/youcan/*` except webhooks.
- `isProtectedMetaApiPath(pathname)`: true for all `/api/integrations/meta/*`.

#### Auth Services (`lib/auth/`)
| File | Purpose |
|------|---------|
| `actions.ts` | Server actions: `loginAction`, `signupAction`, `logoutAction` |
| `client.ts` | Browser Supabase client |
| `server.ts` | Server Supabase client |
| `session.ts` | `getAuthenticatedUser()`, `requireAuthenticatedUser()` |
| `protection.ts` | Path protection helpers |
| `redirects.ts` | Safe redirect utilities |
| `login-flow.ts` | Login flow logic |
| `signup-flow.ts` | Signup flow logic (email confirmation redirect to `/onboarding`) |
| `index.ts` | Exports |

#### Confirmation Services (`lib/confirmation/`)
| File | Purpose |
|------|---------|
| `confirm-order.ts` | `confirmOrder()`: atomic pending→confirmed update with ownership check |
| `purchase-delivery.ts` | `dispatchPurchaseDeliveryAfterConfirmation()` wrapper |
| `state-machine.ts` | `canConfirm()`, `isValidConfirmationTransition()` |
| `types.ts` | ConfirmationStatus, ConfirmOrderResult types |
| `index.ts` | Exports |

#### Conversion Services (`lib/conversions/`)
| File | Purpose |
|------|---------|
| `purchase-event.ts` | Builds Purchase ConversionEvent from confirmed order |
| `event-id.ts` | Deterministic event ID from order ID |
| `validation.ts` | Validates conversion event payload |
| `engine.ts` | Conversion engine scaffold |
| `types.ts` | ConversionEvent types |
| `index.ts` | Exports |

#### Order Services (`lib/orders/`)
| File | Purpose |
|------|---------|
| `persist.ts` | Persists normalized order to `orders` table |
| `get-orders-for-user.ts` | Fetches orders for dashboard |
| `confirm-client.ts` | Client-side confirm API call helper |
| `format.ts` | Order display formatting |
| `money.ts` | Money amount formatting (minor units) |
| `types.ts` | OrderProvider, NormalizedOrder types |
| `index.ts` | Exports |

#### Webhook Services (`lib/webhooks/`)
| File | Purpose |
|------|---------|
| `processor.ts` | Generic webhook processing orchestration |
| `types.ts` | Webhook processing types |
| `ingestion/persist.ts` | Idempotent webhook event persistence |
| `ingestion/types.ts` | Ingestion result types |
| `idempotency/database-store.ts` | Database-backed idempotency |
| `index.ts` | Exports |

#### Database Services (`lib/database/`)
| File | Purpose |
|------|---------|
| `client.ts` | Service-role Supabase client factory |
| `user-client.ts` | User-scoped Supabase client |
| `service-role.ts` | Service role access helper |
| `schema.ts` | Table name constants |
| `constants.ts` | Database constants |
| `connection-status.ts` | Connection status helpers |
| `index.ts` | Exports |

#### Connection Services (`lib/connections/`)
| File | Purpose |
|------|---------|
| `store-connection.ts` | Store connection read/write helpers |
| `meta-connection.ts` | Meta connection read/write helpers |
| `defaults.ts` | Default connection values |
| `labels.ts` | Connection label helpers |
| `server.ts` | Server-side connection queries |
| `types.ts` | Connection type definitions |
| `index.ts` | Exports |

#### Security Services (`lib/security/`)
| File | Purpose |
|------|---------|
| `webhook-verification.ts` | Generic webhook verification helpers |
| `authorization.ts` | Authorization helpers |
| `public-config.ts` | Public configuration access |
| `server-secrets.ts` | Server secret access |
| `index.ts` | Exports |

### 4.3 Authentication and Authorization System

**Provider:** Supabase Auth (email/password).

**Flow:**
1. User signs up via `signupAction` → Supabase sends email confirmation.
2. After confirmation, user lands on `/onboarding`.
3. Login via `loginAction` → session cookie set by Supabase SSR.
4. Middleware refreshes session on every request via `createServerClient`.
5. Protected routes check `supabase.auth.getUser()` and redirect or 401.

**Database integration:**
- Trigger `handle_new_user()` on `auth.users` INSERT auto-creates a `profiles` row.
- Row Level Security (RLS) on all tables restricts data to owning user.

**OAuth for stores:**
- Shopify and YouCan use custom OAuth (not Supabase OAuth).
- Signed state cookies (`shopify_oauth_state`, `youcan_oauth_state`) with HMAC.
- Access tokens encrypted with session secrets and stored in `*_connection_secrets` tables (service-role writes only).

**Meta connection:**
- No OAuth; merchant manually enters Pixel ID + access token.
- Token encrypted with `META_SESSION_SECRET`.
- Credentials verified against Graph API before marking as `verified`.

### 4.4 External Integrations

| Integration | Type | Status |
|-------------|------|--------|
| Supabase | Database + Auth | Active (configured via env vars) |
| Shopify | Store OAuth + Webhooks + Admin API | Code complete; live OAuth **not working** (see §13) |
| YouCan | Store OAuth + Webhooks | Code complete (uncommitted); live OAuth **not tested** |
| Meta (Facebook) | CAPI + Graph API verification | Code complete; live CAPI **not verified end-to-end** |
| WooCommerce | — | README placeholder only |
| Google Ads | — | README placeholder only |
| TikTok | — | README placeholder only |

---

## 5) Database

**ORM:** none. Direct Supabase client queries.  
**Migration system:** SQL files in `database/migrations/` mirrored in `supabase/migrations/`.

### 5.1 Shared Functions (Migration 002)

| Function | Purpose |
|----------|---------|
| `public.set_updated_at()` | Trigger function: sets `updated_at = NOW()` on UPDATE |
| `public.handle_new_user()` | Trigger on `auth.users` INSERT: creates matching `profiles` row |

### 5.2 Table: `profiles` (Migration 002)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY, FK → `auth.users(id)` ON DELETE CASCADE |
| `email` | TEXT | NOT NULL |
| `full_name` | TEXT | nullable |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Triggers:** `profiles_set_updated_at`, `on_auth_user_created`  
**RLS:** authenticated users can SELECT/UPDATE/INSERT own row  
**Grants:** SELECT, INSERT, UPDATE, DELETE to `authenticated`

### 5.3 Table: `stores` (Migration 002; platform check extended in 009)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| `owner_id` | UUID | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE |
| `name` | TEXT | NOT NULL |
| `platform` | TEXT | NOT NULL, CHECK IN (`'shopify'`, `'youcan'`) [009] |
| `external_store_id` | TEXT | nullable |
| `status` | TEXT | NOT NULL DEFAULT `'pending'`, CHECK IN (`'pending'`, `'active'`, `'inactive'`) |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Constraints:** UNIQUE (`owner_id`, `platform`, `external_store_id`)  
**Indexes:** `idx_stores_owner_id`  
**Triggers:** `stores_set_updated_at`  
**RLS:** full CRUD on own stores for authenticated

### 5.4 Table: `store_connections` (Migration 002)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| `store_id` | UUID | NOT NULL, FK → `stores(id)` ON DELETE CASCADE |
| `connection_type` | TEXT | NOT NULL, CHECK IN (`'store'`, `'confirmation'`, `'marketing'`) |
| `provider` | TEXT | NOT NULL |
| `status` | TEXT | NOT NULL DEFAULT `'inactive'`, CHECK IN (`'inactive'`, `'connecting'`, `'active'`, `'error'`) |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Constraints:** UNIQUE (`store_id`, `connection_type`, `provider`)  
**Indexes:** `idx_store_connections_store_id`  
**Triggers:** `store_connections_set_updated_at`  
**RLS:** full CRUD via store ownership

### 5.5 Table: `shopify_connections` (Migration 002)

| Column | Type | Constraints |
|--------|------|-------------|
| `store_connection_id` | UUID | PRIMARY KEY, FK → `store_connections(id)` ON DELETE CASCADE |
| `shop_domain` | TEXT | NOT NULL UNIQUE |
| `scope` | TEXT | nullable |
| `connected_at` | TIMESTAMPTZ | nullable |
| `error_message` | TEXT | nullable |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Triggers:** `shopify_connections_set_updated_at`  
**RLS:** SELECT own via store ownership; writes service-role only

### 5.6 Table: `shopify_connection_secrets` (Migration 002)

| Column | Type | Constraints |
|--------|------|-------------|
| `store_connection_id` | UUID | PRIMARY KEY, FK → `shopify_connections(store_connection_id)` ON DELETE CASCADE |
| `encrypted_access_token` | TEXT | NOT NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Triggers:** `shopify_connection_secrets_set_updated_at`  
**RLS:** enabled; no user policies (service-role only)

### 5.7 Table: `store_webhook_events` (Migration 003; provider check extended in 009)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| `store_id` | UUID | NOT NULL, FK → `stores(id)` ON DELETE CASCADE |
| `provider` | TEXT | NOT NULL, CHECK IN (`'shopify'`, `'youcan'`) [009] |
| `external_event_id` | TEXT | NOT NULL |
| `topic` | TEXT | NOT NULL |
| `shop_domain` | TEXT | NOT NULL |
| `status` | TEXT | NOT NULL, CHECK IN (`'accepted'`, `'ignored'`, `'unsupported'`, `'duplicate'`, `'rejected'`) |
| `payload_hash` | TEXT | NOT NULL |
| `received_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| `processed_at` | TIMESTAMPTZ | nullable |
| `error_message` | TEXT | nullable |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Constraints:** UNIQUE (`store_id`, `provider`, `external_event_id`)  
**Indexes:** `idx_store_webhook_events_store_id`, `idx_store_webhook_events_received_at` (DESC), `idx_store_webhook_events_provider_topic`  
**Triggers:** `store_webhook_events_set_updated_at`  
**RLS:** enabled; no authenticated policies (service-role writes)

### 5.8 Table: `orders` (Migration 004; extended in 005 and 008)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| `store_id` | UUID | NOT NULL, FK → `stores(id)` ON DELETE CASCADE |
| `owner_id` | UUID | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE |
| `provider` | TEXT | NOT NULL, CHECK IN (`'shopify'`, `'youcan'`) [009] |
| `external_order_id` | TEXT | NOT NULL |
| `order_number` | TEXT | nullable |
| `customer_email` | TEXT | nullable |
| `customer_phone` | TEXT | nullable |
| `currency` | TEXT | NOT NULL |
| `subtotal_amount_minor` | BIGINT | NOT NULL, CHECK >= 0 |
| `total_amount_minor` | BIGINT | NOT NULL, CHECK >= 0 |
| `financial_status` | TEXT | nullable |
| `confirmation_status` | TEXT | NOT NULL DEFAULT `'pending'`, CHECK IN (`'pending'`, `'confirmed'`) [005] |
| `confirmed_at` | TIMESTAMPTZ | nullable [005] |
| `provider_created_at` | TIMESTAMPTZ | nullable |
| `received_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Constraints:** UNIQUE (`store_id`, `provider`, `external_order_id`); UNIQUE (`id`, `store_id`) [008]  
**Indexes:** `idx_orders_store_id`, `idx_orders_owner_id`, `idx_orders_received_at` (DESC), `idx_orders_confirmation_status`, `idx_orders_confirmed_at` (partial WHERE confirmed_at IS NOT NULL)  
**Triggers:** `orders_set_updated_at`  
**RLS:** SELECT own (`owner_id = auth.uid()`); writes via service role  
**Grants:** SELECT to authenticated

### 5.9 Table: `meta_connections` (Migration 006; extended in 007)

| Column | Type | Constraints |
|--------|------|-------------|
| `store_connection_id` | UUID | PRIMARY KEY, FK → `store_connections(id)` ON DELETE CASCADE |
| `pixel_id` | TEXT | NOT NULL UNIQUE |
| `connected_at` | TIMESTAMPTZ | nullable |
| `error_message` | TEXT | nullable |
| `verification_status` | TEXT | NOT NULL DEFAULT `'unverified'`, CHECK IN (`'unverified'`, `'verified'`, `'credentials_valid'`, `'identifier_not_verified'`, `'failed'`) [007] |
| `verified_at` | TIMESTAMPTZ | nullable [007] |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** `idx_meta_connections_pixel_id`, `idx_meta_connections_verification_status`  
**Triggers:** `meta_connections_set_updated_at`  
**RLS:** SELECT own; writes service-role only  
**Grants:** SELECT to authenticated

### 5.10 Table: `meta_connection_secrets` (Migration 006)

| Column | Type | Constraints |
|--------|------|-------------|
| `store_connection_id` | UUID | PRIMARY KEY, FK → `meta_connections(store_connection_id)` ON DELETE CASCADE |
| `encrypted_access_token` | TEXT | NOT NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Triggers:** `meta_connection_secrets_set_updated_at`  
**RLS:** enabled; no user policies

### 5.11 Table: `meta_conversion_deliveries` (Migration 008)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| `store_id` | UUID | NOT NULL |
| `order_id` | UUID | NOT NULL |
| `provider` | TEXT | NOT NULL, CHECK IN (`'meta'`) |
| `event_type` | TEXT | NOT NULL, CHECK IN (`'Purchase'`) |
| `event_id` | TEXT | NOT NULL UNIQUE |
| `status` | TEXT | NOT NULL DEFAULT `'pending'`, CHECK IN (`'pending'`, `'sending'`, `'sent'`, `'failed'`) |
| `attempts` | INTEGER | NOT NULL DEFAULT 0, CHECK >= 0 |
| `last_attempted_at` | TIMESTAMPTZ | nullable |
| `sent_at` | TIMESTAMPTZ | nullable |
| `last_error` | TEXT | nullable |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Constraints:** FK (`order_id`, `store_id`) → `orders(id, store_id)` ON DELETE CASCADE; UNIQUE (`order_id`, `provider`, `event_type`)  
**Indexes:** `idx_meta_conversion_deliveries_store_id`, `idx_meta_conversion_deliveries_order_id`, `idx_meta_conversion_deliveries_status`  
**Triggers:** `meta_conversion_deliveries_set_updated_at`  
**RLS:** SELECT own via store ownership  
**Grants:** SELECT to authenticated

### 5.12 Table: `youcan_connections` (Migration 009 — uncommitted)

| Column | Type | Constraints |
|--------|------|-------------|
| `store_connection_id` | UUID | PRIMARY KEY, FK → `store_connections(id)` ON DELETE CASCADE |
| `store_slug` | TEXT | NOT NULL UNIQUE |
| `youcan_store_id` | TEXT | nullable |
| `scope` | TEXT | nullable |
| `connected_at` | TIMESTAMPTZ | nullable |
| `error_message` | TEXT | nullable |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Indexes:** `idx_youcan_connections_youcan_store_id`  
**Triggers:** `youcan_connections_set_updated_at`  
**RLS:** enabled (no explicit user policies in migration)

### 5.13 Table: `youcan_connection_secrets` (Migration 009 — uncommitted)

| Column | Type | Constraints |
|--------|------|-------------|
| `store_connection_id` | UUID | PRIMARY KEY, FK → `youcan_connections(store_connection_id)` ON DELETE CASCADE |
| `encrypted_access_token` | TEXT | NOT NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

**Triggers:** `youcan_connection_secrets_set_updated_at`  
**RLS:** enabled (no explicit user policies in migration)

### 5.14 Relationships Summary

```
auth.users
  └── profiles (1:1)
        └── stores (1:N)
              ├── store_connections (1:N)
              │     ├── shopify_connections (1:1) → shopify_connection_secrets (1:1)
              │     ├── youcan_connections (1:1) → youcan_connection_secrets (1:1)
              │     └── meta_connections (1:1) → meta_connection_secrets (1:1)
              ├── store_webhook_events (1:N)
              ├── orders (1:N)
              │     └── meta_conversion_deliveries (1:N)
              └── (meta_conversion_deliveries also FK to store_id)
```

### 5.15 Migrations

| File | Milestone | Contents |
|------|-----------|----------|
| `001_initial_schema.sql` | Historical | Superseded by 002 |
| `002_mvp_database_foundation.sql` | M2-C2 | profiles, stores, store_connections, shopify_connections, shopify_connection_secrets, RLS, triggers |
| `003_shopify_webhook_ingestion.sql` | M3-A | store_webhook_events table |
| `004_shopify_order_ingestion.sql` | M3-B | orders table |
| `005_confirmation_engine_foundation.sql` | M4 | confirmation_status, confirmed_at on orders |
| `006_meta_connection_foundation.sql` | M4-A | meta_connections, meta_connection_secrets |
| `007_meta_credential_verification.sql` | M4-B | verification_status, verified_at on meta_connections |
| `008_meta_purchase_delivery.sql` | M5 | meta_conversion_deliveries table |
| `009_youcan_integration_foundation.sql` | YouCan MVP | youcan_connections, youcan_connection_secrets; extends platform/provider CHECK constraints |

**Supabase mirror:** `supabase/migrations/` contains timestamped copies of 002–009.

**Applied status:** Migrations 002–008 are committed. Migration 009 exists locally but is **uncommitted and not applied to remote Supabase** (uncertain whether applied locally).

---

## 6) Frontend (Dashboard / App)

### 6.1 Pages

All pages are locale-prefixed (`/en/...` or `/ar/...`) via next-intl with `localePrefix: "always"`.

| Route | File | Purpose |
|-------|------|---------|
| `/[locale]` | `app/[locale]/(marketing)/page.tsx` | Landing/marketing page |
| `/[locale]/login` | `app/[locale]/(auth)/login/page.tsx` | Email/password login |
| `/[locale]/signup` | `app/[locale]/(auth)/signup/page.tsx` | Email/password signup |
| `/[locale]/dashboard` | `app/[locale]/dashboard/page.tsx` | Dashboard home with setup progress |
| `/[locale]/dashboard/connections` | `app/[locale]/dashboard/connections/page.tsx` | Manage store and Meta connections |
| `/[locale]/dashboard/orders` | `app/[locale]/dashboard/orders/page.tsx` | View and confirm orders |
| `/[locale]/onboarding` | `app/[locale]/onboarding/page.tsx` | Onboarding overview with step list |
| `/[locale]/onboarding/store` | `app/[locale]/onboarding/store/page.tsx` | Connect store provider (YouCan primary in UI) |
| `/[locale]/onboarding/meta` | `app/[locale]/onboarding/meta/page.tsx` | Connect Meta pixel |
| `/[locale]/onboarding/confirmation` | `app/[locale]/onboarding/confirmation/page.tsx` | Confirmation workflow setup |
| `/[locale]/gsap-test` | `app/[locale]/gsap-test/page.tsx` | GSAP animation prototype (uncommitted) |

### 6.2 Important Components

#### Connections (`components/connections/`)
| Component | Purpose |
|-----------|---------|
| `store-provider-panel.tsx` | Renders store connect UI; currently wired to `YouCanConnectForm` only (Shopify form exists but not shown) |
| `youcan-connect-form.tsx` | YouCan OAuth connect/disconnect form (uncommitted) |
| `shopify-connect-form.tsx` | Shopify OAuth connect/disconnect form |
| `meta-connect-form.tsx` | Meta pixel ID + access token form |
| `meta-provider-panel.tsx` | Meta connection panel wrapper |
| `connection-state-item.tsx` | Single connection status row |
| `connection-status-badge.tsx` | Status badge (active, inactive, error, connecting) |
| `connect-placeholder-button.tsx` | Placeholder button for unimplemented providers |

#### Dashboard (`components/dashboard/`)
| Component | Purpose |
|-----------|---------|
| `sidebar.tsx` | Dashboard navigation sidebar |
| `connection-status.tsx` | Summary of connection states |
| `setup-progress.tsx` | Onboarding/setup progress indicator |
| `recent-events-placeholder.tsx` | Placeholder for recent webhook events |

#### Layout (`components/layout/`)
| Component | Purpose |
|-----------|---------|
| `dashboard-shell.tsx` | Dashboard page wrapper with sidebar |
| `site-header.tsx` | Marketing site header |
| `site-footer.tsx` | Marketing site footer |
| `language-switcher.tsx` | en/ar locale toggle |

#### Onboarding (`components/onboarding/`)
| Component | Purpose |
|-----------|---------|
| `steps.ts` | Onboarding step definitions |
| `step-shell.tsx` | Onboarding step page wrapper |
| `step-nav.tsx` | Step navigation (prev/next) |
| `overview-steps.tsx` | Overview step list display |

#### Orders (`components/orders/`)
| Component | Purpose |
|-----------|---------|
| `orders-list.tsx` | Orders table with confirm button per pending order |
| `order-status-badge.tsx` | pending/confirmed status badge |

#### UI Primitives (`components/ui/`)
| Component | Purpose |
|-----------|---------|
| `button.tsx` | Button component |
| `input.tsx` | Input component |
| `card.tsx` | Card component |
| `badge.tsx` | Badge component |

### 6.3 State Management

- **No Redux, Zustand, or React Context global store.**
- Server Components fetch data directly via Supabase server client.
- Client Components use `fetch()` to call API routes for actions (connect, disconnect, confirm).
- Connection state read from API status endpoints (`/api/integrations/*/status`).
- Locale state managed by next-intl cookie (`NEXT_LOCALE`).
- Supabase session managed by `@supabase/ssr` cookies via middleware.

### 6.4 How Frontend Connects to API

| UI Action | API Call |
|-----------|----------|
| Shopify connect | Browser navigates to `/api/integrations/shopify/connect?shop={domain}` |
| YouCan connect | Browser navigates to `/api/integrations/youcan/connect?store={slug}` |
| Meta connect | `POST /api/integrations/meta/connect` with `{ pixelId, accessToken }` |
| Meta verify | `POST /api/integrations/meta/verify` |
| Disconnect (any) | `POST /api/integrations/{provider}/disconnect` |
| Confirm order | `POST /api/orders/{id}/confirm` via `lib/orders/confirm-client.ts` |
| Read connection status | `GET /api/integrations/{provider}/status` |
| Orders list | Server Component query via `getOrdersForUser()` (direct Supabase, not API route) |

**Important:** Shopify/YouCan connect buttons must use plain `<a href="/api/...">` or non-localized links. Using next-intl `Link` previously caused locale prefixing (`/ar/api/...`) which broke OAuth. Fixed in commit `c9dd5b3`.

---

## 7) Mobile App

**Does not exist.** No React Native, Expo, Flutter, or native mobile project files are present in the repository. The architecture docs mention mobile as a future possibility sharing the same backend API, but no mobile code has been written.

---

## 8) Integrations

### 8.1 Facebook / Meta

#### What Was Done
- **Conversions API (CAPI):** YES — server-side Purchase events sent to `https://graph.facebook.com/v21.0/{pixelId}/events`.
- **Meta Pixel (browser):** NO — no client-side pixel script injection.
- **Meta OAuth:** NO — merchant manually enters Pixel ID and access token.
- **Credential verification:** YES — Graph API read-only calls to verify token and pixel ownership.

#### Key Files
| File | Purpose |
|------|---------|
| `app/api/integrations/meta/connect/route.ts` | POST endpoint to save credentials |
| `app/api/integrations/meta/disconnect/route.ts` | Clear connection |
| `app/api/integrations/meta/status/route.ts` | Read connection + verification status |
| `app/api/integrations/meta/verify/route.ts` | Re-verify credentials |
| `lib/integrations/meta/persistence.ts` | Encrypt/store tokens; enforce pixel uniqueness |
| `lib/integrations/meta/validation.ts` | Zod: pixelId (5–20 digits), accessToken |
| `lib/integrations/meta/env.ts` | Requires `META_SESSION_SECRET` (min 32 chars) |
| `lib/integrations/meta/constants.ts` | Graph API version `v21.0` |
| `lib/integrations/meta/verification/verify-credentials.ts` | Graph API read-only verify |
| `lib/integrations/meta/verification/verify-connection.ts` | User-scoped verification orchestration |
| `lib/integrations/meta/capi/client.ts` | `MetaCapiClient.sendEvent()` |
| `lib/integrations/meta/capi/payload-builder.ts` | Build CAPI payload from ConversionEvent |
| `lib/integrations/meta/capi/hash-user-data.ts` | SHA-256 hash email/phone for user_data |
| `lib/integrations/meta/capi/transport.ts` | Production fetch to Graph API (10s timeout) |
| `lib/integrations/meta/capi/config.ts` | CAPI URL builder |
| `lib/integrations/meta/delivery/deliver-purchase.ts` | Full Purchase delivery orchestration |
| `lib/integrations/meta/delivery/persistence.ts` | Idempotent delivery records in `meta_conversion_deliveries` |
| `lib/integrations/meta/delivery/eligibility.ts` | Requires `verification_status === 'verified'` |
| `lib/integrations/meta/delivery/load-order.ts` | Load confirmed order for delivery |
| `lib/integrations/meta/delivery/stale-sending.ts` | Reconcile stale `sending` deliveries |
| `lib/integrations/meta/session/connection-store.ts` | Public connection state for UI |
| `integrations/marketing/meta/meta-marketing-adapter.ts` | MarketingAdapter wrapper (`sendConversion` is stubbed; actual delivery bypasses adapter) |
| `components/connections/meta-connect-form.tsx` | Meta connect UI |
| `database/migrations/006_meta_connection_foundation.sql` | meta_connections + secrets tables |
| `database/migrations/007_meta_credential_verification.sql` | verification_status column |
| `database/migrations/008_meta_purchase_delivery.sql` | meta_conversion_deliveries table |

#### Verification Statuses
- `unverified` — default after connect
- `verified` — credentials valid and pixel verified (required for CAPI delivery)
- `credentials_valid` — token works but pixel not verified
- `identifier_not_verified` — pixel ID mismatch
- `failed` — verification failed

#### Delivery Eligibility
CAPI Purchase send requires:
1. Active `store_connection` with provider `meta`.
2. `verification_status === 'verified'`.
3. Decrypted access token available via `META_SESSION_SECRET`.

### 8.2 Shopify

#### What Was Done
- Standalone OAuth authorization code flow (not embedded App Bridge).
- Signed OAuth state cookie (`shopify_oauth_state`).
- HMAC validation on callback query params.
- Token exchange with Shopify.
- Encrypted access token storage in `shopify_connection_secrets`.
- Webhook registration via Admin REST API (`orders/create` topic).
- Webhook ingestion with HMAC-SHA256 verification.
- Order normalization from Shopify payload to provider-agnostic `orders` row.
- Disconnect with webhook cleanup (best effort).
- Full unit test coverage.

#### OAuth Flow (Code)
1. `GET /api/integrations/shopify/connect?shop={domain}`
2. Validates shop domain via `normalizeShopDomain()` (`lib/integrations/shopify/oauth/shop-domain.ts`).
3. Creates signed state via `createOAuthState()`.
4. Sets `shopify_oauth_state` httpOnly cookie (TTL 600s).
5. Redirects to:
   ```
   https://{shop}.myshopify.com/admin/oauth/authorize
     ?client_id={SHOPIFY_API_KEY}
     &scope={SHOPIFY_OAUTH_SCOPES}
     &redirect_uri={NEXT_PUBLIC_APP_URL}/api/integrations/shopify/callback
     &state={signed_state}
   ```
6. Shopify redirects to callback with `code`, `shop`, `state`, `hmac`, etc.
7. Callback validates state cookie, HMAC, exchanges code for access token.
8. Persists connection via `persistShopifyConnectionForUser()`.
9. Registers `orders/create` webhook.
10. Redirects to `/onboarding/store?shopify=connected` or `?shopify=error&reason={reason}`.

#### Default OAuth Scopes
- Code default: `read_products,read_orders`
- Env override: `SHOPIFY_OAUTH_SCOPES`

#### Webhook Configuration
- URL: `{NEXT_PUBLIC_APP_URL}/api/integrations/shopify/webhooks`
- Topic: `orders/create`
- HMAC header: `x-shopify-hmac-sha256`
- Required headers: `x-shopify-shop-domain`, `x-shopify-topic`, `x-shopify-webhook-id`

#### Key Files (34 files in `lib/integrations/shopify/`)
| Category | Files |
|----------|-------|
| API routes | `app/api/integrations/shopify/{connect,callback,disconnect,status,register-webhooks,webhooks}/route.ts` |
| Adapter | `integrations/stores/shopify/shopify-adapter.ts` |
| OAuth | `oauth/{shop-domain,state,crypto,hmac,token-exchange,callback-handler,constants,index}.ts` |
| Persistence | `persistence.ts`, `disconnect.ts`, `verify-connection.ts` |
| Session | `session/{connection-store,types,index}.ts` |
| Webhooks | `webhooks/{ingest,register,hmac,headers,resolve-store,verify-request,verifier,normalize,topics,payload-hash,constants,handlers/order-create,index}.ts` |
| Orders | `orders/{parse,normalize,schema,index}.ts` |
| Config | `env.ts`, `constants.ts` (Admin API `2026-07`) |
| UI | `components/connections/shopify-connect-form.tsx` |

#### What Did NOT Work (see §13 for full details)
- Live OAuth end-to-end: user reaches Shopify authorize screen but fails at grant page.
- OAuth callback never reached in dev/ngrok logs.
- Dev Dashboard "Install app" button lands on `shopify.dev/apps/default-app-home` (placeholder App URL).
- Zero successful Shopify installations recorded.

### 8.3 YouCan (Uncommitted Work)

#### What Was Done
Full parallel integration mirroring Shopify architecture:
- OAuth connect/callback/disconnect/status routes.
- Webhook ingestion with HMAC verification.
- Order normalization.
- Encrypted token persistence in `youcan_connections` + `youcan_connection_secrets`.
- UI form (`youcan-connect-form.tsx`) wired as primary in `store-provider-panel.tsx`.
- Migration 009 for YouCan tables and CHECK constraint extensions.
- 7 unit test files + fixture.

#### OAuth Configuration
- Default scopes: `read-orders,read-products`
- State cookie: `youcan_oauth_state` (TTL 600s)
- Callback URL: `{NEXT_PUBLIC_APP_URL}/api/integrations/youcan/callback`
- Env vars: `YOUCAN_API_KEY`, `YOUCAN_API_SECRET`, `YOUCAN_SESSION_SECRET`, `YOUCAN_OAUTH_SCOPES`

#### Key Files (32 files in `lib/integrations/youcan/`)
Same structure as Shopify: oauth/, webhooks/, orders/, session/, persistence, disconnect, env, constants, store/fetch-details.ts.

#### Status
- Code complete, 261/261 unit tests pass (includes YouCan tests).
- **Not committed to git.**
- **Migration 009 not applied to remote Supabase.**
- **Live OAuth not tested.**

#### Known Gaps in YouCan Implementation
- Default scopes lack `edit-rest-hooks` (needed for automatic webhook registration).
- Default scopes lack `view-store-info` (needed for `GET /me` store ID resolution).
- Backfill heuristic for `youcan_store_id` when exactly one pending connection exists (partial implementation).

### 8.4 Other Integrations (Placeholders Only)

| Provider | Location | Status |
|----------|----------|--------|
| WooCommerce | `integrations/stores/woocommerce/README.md` | README only |
| Google Ads | `integrations/marketing/google/README.md` | README only |
| TikTok | `integrations/marketing/tiktok/README.md` | README only |
| External confirmation service | `integrations/confirmation/external-service/README.md` | README only |
| Custom webhook confirmation | `integrations/confirmation/custom-webhook/README.md` | README only |
| Store status confirmation | `integrations/confirmation/store-status/README.md` | README only |

---

## 9) Current Flow

### End-to-End: Order Received → Facebook Purchase Event

#### Phase A — Store Connection (One-Time Setup)

1. Merchant signs up / logs in via Supabase Auth.
2. Merchant navigates to `/onboarding/store`.
3. Merchant enters store identifier and clicks Connect.
4. Browser redirects to provider OAuth (Shopify or YouCan).
5. After OAuth callback, Confirma:
   - Validates state and HMAC.
   - Exchanges authorization code for access token.
   - Encrypts token with session secret.
   - Creates `stores`, `store_connections`, and provider-specific connection rows.
   - Registers `orders/create` webhook with the store provider.
6. Merchant navigates to `/onboarding/meta`.
7. Merchant enters Meta Pixel ID and access token.
8. Confirma encrypts token, verifies credentials against Graph API, sets `verification_status`.

#### Phase B — Order Ingestion (Automatic)

1. Customer places order on connected store.
2. Store provider sends webhook POST:
   - Shopify: `POST /api/integrations/shopify/webhooks`
   - YouCan: `POST /api/integrations/youcan/webhooks`
3. Confirma parses required headers (HMAC, shop domain/slug, topic, webhook ID).
4. Confirma verifies HMAC signature using provider API secret.
5. Confirma resolves store by shop domain or store slug.
6. Confirma checks idempotency via `store_webhook_events` unique constraint (`store_id`, `provider`, `external_event_id`).
7. If topic is `orders/create`:
   - Parse JSON payload.
   - Normalize to provider-agnostic order shape.
   - Persist to `orders` table with `confirmation_status: 'pending'`.
8. Persist webhook event record with status (`accepted`, `duplicate`, `rejected`, etc.).

#### Phase C — Merchant Confirmation (Manual)

1. Merchant views orders at `/dashboard/orders`.
2. `OrdersList` component displays orders with status badges.
3. Merchant clicks Confirm on a pending order.
4. Client calls `POST /api/orders/{id}/confirm`.
5. Server calls `confirmOrder()`:
   - Atomic UPDATE: `confirmation_status = 'confirmed'`, `confirmed_at = NOW()`.
   - Only succeeds if current status is `pending` and order belongs to authenticated user.
   - Returns: `confirmed`, `already_confirmed`, `not_found`, `forbidden`, or `invalid_state`.

#### Phase D — Meta CAPI Purchase Delivery (Automatic After Confirmation)

1. After successful confirmation, `dispatchPurchaseDeliveryAfterConfirmation()` is called.
2. `processMetaPurchaseDelivery()` in `lib/integrations/meta/delivery/deliver-purchase.ts`:
   - Loads confirmed order.
   - Checks Meta connection eligibility (`verification_status === 'verified'`).
   - Creates or reuses idempotent delivery record in `meta_conversion_deliveries`.
   - Generates deterministic `event_id` from order ID.
   - Builds Purchase `ConversionEvent`:
     - `eventName`: `Purchase`
     - `eventTime`: `confirmed_at` as Unix seconds
     - `userData`: SHA-256 hashed email and/or phone
     - `customData`: currency, value (from `total_amount_minor`)
   - Claims delivery (status `pending`/`failed` → `sending`).
   - Sends to Meta CAPI via `MetaCapiClient.sendEvent()`:
     - URL: `https://graph.facebook.com/v21.0/{pixelId}/events?access_token={token}`
     - 10-second timeout.
   - Updates delivery record to `sent` or `failed` with `last_error`.
3. API response includes `metaPurchaseDelivery: { status, eventId, message }`.

#### State Transitions

```
Order: pending → confirmed (one-way, merchant-initiated)
Meta delivery: pending → sending → sent | failed
Meta connection: unverified → verified | credentials_valid | identifier_not_verified | failed
Store connection: inactive → connecting → active | error
```

---

## 10) What Has Been Done So Far (Done)

- Next.js 15 App Router project scaffold with TypeScript, Tailwind CSS 4, ESLint, Prettier.
- Bilingual UI (English and Arabic) via next-intl with locale-prefixed routing.
- Supabase Auth integration (email/password signup, login, logout, session middleware).
- Auto-profile creation trigger on user signup.
- Row Level Security on all database tables.
- Database migrations 002–008 (profiles through meta_conversion_deliveries).
- Adapter architecture: StoreAdapter, MarketingAdapter, ConfirmationAdapter interfaces.
- Provider registry with supported-providers list.
- **Shopify integration (code complete):**
  - OAuth connect/callback with signed state and HMAC validation.
  - Encrypted access token persistence in Supabase.
  - Webhook ingestion with HMAC verification and idempotency.
  - `orders/create` topic handling and order normalization.
  - Webhook auto-registration after OAuth.
  - Disconnect with webhook cleanup.
  - Connection status API.
  - Manual webhook registration API.
  - Shopify connect form UI component.
- **Meta integration (code complete):**
  - Pixel ID + access token connect form.
  - Encrypted token persistence.
  - Graph API credential verification.
  - Verification status tracking.
  - Meta CAPI Purchase event builder with hashed user data.
  - Idempotent delivery records in `meta_conversion_deliveries`.
  - Stale-sending reconciliation.
  - Delivery triggered automatically after order confirmation.
- **Confirmation engine:**
  - `confirmOrder()` with atomic pending→confirmed transition.
  - State machine (`canConfirm`, `isValidConfirmationTransition`).
  - Confirm API endpoint with Meta delivery dispatch.
- **Orders UI:**
  - Orders list page with status badges.
  - Confirm button for pending orders.
- **Onboarding wizard:**
  - Multi-step flow: overview → store → meta → confirmation.
  - Step navigation and progress indicators.
- **Dashboard:**
  - Sidebar navigation.
  - Connection status summary.
  - Setup progress widget.
- **YouCan integration (code complete, uncommitted):**
  - Full parallel to Shopify: OAuth, webhooks, orders, persistence, UI, tests.
  - Migration 009 for YouCan tables.
  - YouCan listed first in supported providers.
  - YouCan connect form wired as primary in store onboarding.
- **Testing:**
  - 39 unit test files, 261 tests, all passing.
  - 1 E2E test file (landing page + health API).
  - Test fixtures for Shopify and YouCan orders.
- **Documentation:**
  - Architecture overview, ADRs, development rules.
  - Handoff documents (uncommitted).
- **Recent fixes:**
  - M6-C2: Fixed locale-independent Shopify API links (commit `c9dd5b3`).
  - M6-C2.1: Fixed Shopify OAuth public redirect base for ngrok (commit `dc2d7eb`).

---

## 11) What Is Missing or Incomplete (TODO / Missing)

- **Live Shopify OAuth end-to-end:** OAuth callback never successfully completed (blocked at Shopify grant page).
- **Live Shopify webhook delivery:** No verified webhook received from a real Shopify store.
- **Live Meta CAPI end-to-end:** No verified Purchase event sent to Meta from a real confirmed order.
- **YouCan integration commit:** All YouCan code is uncommitted (20 modified + 18 untracked files).
- **Migration 009 application:** YouCan tables not applied to remote Supabase.
- **YouCan live OAuth testing:** Not attempted with real YouCan Partner credentials.
- **YouCan webhook auto-registration scopes:** Default scopes missing `edit-rest-hooks`.
- **YouCan store ID resolution:** Default scopes missing `view-store-info`; `youcan_store_id` may remain null.
- **README update:** Still says "M0 foundation scaffold" and "No product features or external integrations implemented."
- **Health endpoint milestone:** Still reports `milestone: "M0"`.
- **MetaMarketingAdapter.sendConversion():** Stubbed; actual delivery bypasses adapter layer.
- **Billing/subscriptions:** Not implemented (`features/billing/` is a stub).
- **WooCommerce integration:** README placeholder only.
- **Google/TikTok marketing integrations:** README placeholders only.
- **Mobile app:** Not started.
- **Shopify App Store distribution:** Not implemented (no App Bridge, no embedded app, no App URL handler).
- **Shopify managed installation / token exchange:** Not implemented.
- **Confirmation provider integrations:** All README placeholders.
- **Recent events dashboard widget:** Placeholder component only.
- **Webhook event viewer UI:** No UI to inspect `store_webhook_events`.
- **Meta delivery retry UI:** Failed deliveries visible only in DB, no dashboard UI.
- **Git remote:** No GitHub or other remote configured.
- **Production deployment:** No deployment configuration (Vercel, Docker, etc.) in repo.
- **E2E tests for integrations:** Only foundation E2E exists; no OAuth/webhook/confirm E2E.
- **Rate limiting:** No rate limiting on API routes or webhooks.
- **Monitoring/alerting:** No logging infrastructure beyond console.
- **GSAP prototype:** Uncommitted experimental page.

---

## 12) Current Problems and Errors (Known Issues)

### Shopify OAuth — Grant Page Failure (Primary Blocker)

| Symptom | Detail |
|---------|--------|
| User reaches Shopify authorize screen | Reported by user during testing |
| Failure at grant page | URL pattern: `admin.shopify.com/store/{shop}/app/grant` |
| Error message (French) | `Ce lien d'installation ne peut pas être utilisé` ("This installation link cannot be used") |
| OAuth callback never reached | No `GET /api/integrations/shopify/callback` entries in dev server or ngrok logs |
| Installations counter | Shows `0` in Shopify Dev Dashboard |

**Likely root cause:** Shopify-side distribution/install eligibility for the specific store (`yhken8-ej.myshopify.com`) and app (`confirma-3`), not Confirma OAuth URL construction. Distribution mode cannot be determined from repo — **Shopify Partners Dashboard verification required**.

### Shopify Dev Dashboard "Install App" Mismatch

| Symptom | Detail |
|---------|--------|
| Dev Dashboard "Install app" button | Lands on `shopify.dev/apps/default-app-home` |
| Expected behavior with placeholder App URL | Confirma never receives callback; this is expected for non-embedded standalone OAuth |
| App URL setting | `https://shopify.dev/apps/default-app-home` (Shopify placeholder, not Confirma) |

### Confirma-Side Shopify Errors (Code-Defined)

| Error | Trigger | Redirect/Response |
|-------|---------|-------------------|
| `reason=configuration` | Missing/invalid Shopify env vars (Zod failure in `getShopifyOAuthEnv`) | Redirect to `/onboarding/store?shopify=error&reason=configuration` |
| `reason=invalid_shop` | Invalid shop domain format | Redirect to `/onboarding/store?shopify=error&reason=invalid_shop` |
| `reason=invalid_state` | OAuth state cookie mismatch or expired | Redirect to `/onboarding/store?shopify=error&reason=invalid_state` |
| `reason=invalid_hmac` | HMAC verification failed on callback | Redirect with reason |
| `reason=token_exchange_failed` | Shopify token exchange HTTP failure | Redirect with reason |
| `reason=persistence_failed` | Database write failure during connection save | Redirect with reason |
| `reason=webhook_registration_failed` | Webhook registration failed after successful OAuth | Redirect with reason |

### Locale-Prefix Bug (Fixed)

| Symptom | Status |
|---------|--------|
| `/ar/api/integrations/shopify/connect` returned 404 | **Fixed** in commit `c9dd5b3` |
| Cause: next-intl Link prefixing locale onto API paths | Fixed by using non-localized links for API routes |

### Documentation Staleness

| Item | Issue |
|------|-------|
| `README.md` | Says M0 only, no integrations implemented |
| `/api/health` | Returns `milestone: "M0"` |
| Both contradict actual codebase state |

### ngrok URL Volatility

| Risk | Detail |
|------|--------|
| Free ngrok URLs change on restart | Requires updating `NEXT_PUBLIC_APP_URL` and Shopify authorized redirect URL together |
| Current dev URL (from handoff docs) | `https://ignore-savings-joyfully.ngrok-free.dev` |

### Uncommitted Work Risk

| Risk | Detail |
|------|--------|
| YouCan integration | 38 files modified or untracked; could be lost without commit |
| Migration 009 | Not applied remotely; YouCan tables do not exist in production Supabase |

### Meta Integration Gaps

| Gap | Detail |
|-----|--------|
| `MetaMarketingAdapter.sendConversion()` | Stubbed; not used for actual delivery |
| Live CAPI verification | No confirmed end-to-end test with real Meta pixel |
| `META_SESSION_SECRET` | Present in `.env.example` but was previously missing from docs |

---

## 13) Current Stopping Point

### What Was Being Attempted
The last major integration effort was **Shopify OAuth connection** — connecting a real Shopify development store to Confirma so that orders could flow in via webhooks and eventually be confirmed and sent to Meta CAPI.

A secondary parallel effort (uncommitted) added **YouCan as the primary MVP store integration** while preserving all Shopify code intact, but Shopify OAuth troubleshooting was the active blocker at the time work stopped.

### Shopify OAuth Attempt — Step by Step

#### What Succeeded
1. **Confirma connect route works:** `GET /api/integrations/shopify/connect?shop=yhken8-ej.myshopify.com` returns HTTP 307 redirect to Shopify.
2. **Shopify authorize screen loads:** User reported reaching the Shopify OAuth authorization page.
3. **Environment variables configured:** `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_SESSION_SECRET`, `SHOPIFY_OAUTH_SCOPES`, `NEXT_PUBLIC_APP_URL` are set in `.env.local`.
4. **Redirect URI matches:** `{NEXT_PUBLIC_APP_URL}/api/integrations/shopify/callback` matches Shopify Dev Dashboard authorized redirect URL (`https://ignore-savings-joyfully.ngrok-free.dev/api/integrations/shopify/callback`).
5. **Locale-prefix bug fixed:** API routes no longer get `/ar/` prefix (commit `c9dd5b3`).
6. **Post-OAuth redirect base fixed:** ngrok-safe redirect after callback (commit `dc2d7eb`).
7. **Legacy installation flow enabled** in Shopify Dev Dashboard (`use_legacy_install_flow`).
8. **All 261 unit tests pass**, including full Shopify OAuth, webhook, order, disconnect, and persistence test suites.

#### What Failed
1. **Shopify grant page rejection:** After authorize screen, Shopify shows grant page at `admin.shopify.com/store/yhken8-ej/app/grant` with French error: **`Ce lien d'installation ne peut pas être utilisé`** ("This installation link cannot be used").
2. **OAuth callback never reached:** No `GET /api/integrations/shopify/callback` request appears in Next.js dev server logs or ngrok request logs. The failure occurs entirely on Shopify's side before redirecting back to Confirma.
3. **No Shopify connection persisted:** Because callback never fires, no rows are created in `shopify_connections`, `shopify_connection_secrets`, or related tables for this store.
4. **No webhooks registered:** Webhook registration happens in the callback handler; it never ran.
5. **Dev Dashboard "Install app" also fails:** Clicking "Install app" in Shopify Dev Dashboard redirects to `shopify.dev/apps/default-app-home` (Shopify's placeholder App URL), not to Confirma. This is expected because Confirma has no App URL handler and uses standalone OAuth, not embedded app installation.
6. **Zero installations:** Shopify Dev Dashboard installations counter shows `0`.

#### Errors Observed

| Error | Source | When |
|-------|--------|------|
| `Ce lien d'installation ne peut pas être utilisé` | Shopify UI (French) | At grant page after authorize screen |
| `reason=configuration` (Arabic: `إعداد OAuth لـ Shopify غير صحيح.`) | Confirma redirect | Earlier, when Shopify env vars were missing (since resolved) |
| Dev Dashboard install → `shopify.dev/apps/default-app-home` | Shopify Dev Dashboard | When using "Install app" button (expected with placeholder App URL) |

#### Files Involved in Shopify OAuth

| File | Role in Flow |
|------|-------------|
| `app/api/integrations/shopify/connect/route.ts` | OAuth initiation (works — returns 307) |
| `app/api/integrations/shopify/callback/route.ts` | OAuth callback (never reached) |
| `lib/integrations/shopify/oauth/shop-domain.ts` | Shop domain normalization + authorize URL builder |
| `lib/integrations/shopify/oauth/state.ts` | Signed OAuth state creation/validation |
| `lib/integrations/shopify/oauth/hmac.ts` | Callback HMAC verification |
| `lib/integrations/shopify/oauth/token-exchange.ts` | Authorization code → access token |
| `lib/integrations/shopify/oauth/callback-handler.ts` | Full callback orchestration |
| `lib/integrations/shopify/env.ts` | Zod env validation |
| `lib/integrations/shopify/persistence.ts` | DB connection persistence |
| `lib/integrations/shopify/webhooks/register.ts` | Post-OAuth webhook registration |
| `lib/config/urls.ts` | OAuth callback URL builder |
| `lib/config/app-url.ts` | App base URL helpers |
| `components/connections/shopify-connect-form.tsx` | UI connect button |
| `middleware.ts` | Auth protection for connect/callback routes |

#### Assessment
The Confirma OAuth implementation appears correct based on code review and unit tests. The failure occurs on Shopify's grant/installation eligibility step, which is controlled by Shopify Partners Dashboard settings (app distribution mode, store allow-list, app status) that cannot be verified from the repository alone. The French error message is a standard Shopify response when an app is not eligible for installation on the target store.

#### What Was NOT Attempted After Shopify Blocker
- YouCan OAuth live testing (code written but not tested externally).
- Meta CAPI live end-to-end test (requires a connected store with real orders first).
- Shopify Partners Dashboard distribution settings changes (requires manual dashboard access).

---

## 14) Suggested Next Steps

### Immediate (Unblock Shopify)

1. **Verify Shopify Partners Dashboard settings** for app `confirma-3`:
   - Go to Partners → Apps → Confirma → Distribution.
   - Confirm distribution mode (custom app vs public vs unlisted).
   - Verify the app's Client ID matches `SHOPIFY_API_KEY` in `.env.local`.
   - Check if store `yhken8-ej.myshopify.com` is in an allowed store list (if custom distribution).
   - Confirm app status is not draft/rejected/suspended.

2. **Retry OAuth via Confirma connect route** (not Dev Dashboard "Install app"):
   ```
   GET /api/integrations/shopify/connect?shop=yhken8-ej.myshopify.com
   ```
   Monitor ngrok logs for callback arrival.

3. **If grant page error persists**, try a different Shopify development store or create a new custom app in Partners Dashboard with explicit store allow-list.

### Short-Term (YouCan MVP Path)

4. **Commit YouCan integration work** to preserve 38 modified/untracked files.

5. **Apply migration 009** to local and remote Supabase:
   ```sql
   -- Adds youcan_connections, youcan_connection_secrets
   -- Extends platform/provider CHECK constraints
   ```

6. **Configure YouCan Partner Dashboard** with OAuth callback URL:
   ```
   {NEXT_PUBLIC_APP_URL}/api/integrations/youcan/callback
   ```

7. **Set YouCan env vars** in `.env.local`: `YOUCAN_API_KEY`, `YOUCAN_API_SECRET`, `YOUCAN_SESSION_SECRET`.

8. **Test YouCan OAuth end-to-end** via `/onboarding/store` (YouCan is primary in UI).

9. **Add missing OAuth scopes** if webhook auto-registration fails:
   - `edit-rest-hooks` for webhook registration.
   - `view-store-info` for store ID resolution.

### Medium-Term (Complete MVP Loop)

10. **Connect Meta pixel** via `/onboarding/meta` with real Pixel ID and access token.

11. **Verify Meta credentials** reach `verification_status: 'verified'`.

12. **Trigger test order** on connected store; verify webhook ingestion creates `orders` row with `confirmation_status: 'pending'`.

13. **Confirm order** via dashboard; verify Meta CAPI Purchase delivery record reaches `status: 'sent'`.

14. **Update README.md** and health endpoint to reflect actual milestone status.

15. **Configure git remote** and push for backup.

### Longer-Term

16. Add E2E tests for full connect → webhook → confirm → CAPI flow.
17. Build webhook event viewer and Meta delivery status dashboard.
18. Implement billing/subscriptions if SaaS monetization is planned.
19. Evaluate Shopify App Store distribution vs standalone OAuth for production.
20. Add rate limiting and structured logging.

---

## 15) Notes and Technical Risks

### Technical Debt

| Item | Risk Level | Detail |
|------|------------|--------|
| README/health milestone stale | Low | Misleading for new developers |
| MetaMarketingAdapter stubbed | Medium | Actual delivery bypasses adapter; inconsistent architecture |
| No git remote | High | All work exists only locally |
| 38 uncommitted YouCan files | High | Could be lost on disk failure or accidental reset |
| Migration 009 not applied remotely | Medium | YouCan code will fail at runtime against production Supabase |
| Health endpoint says M0 | Low | Cosmetic but inaccurate |

### Security Considerations

| Item | Detail |
|------|--------|
| Access tokens encrypted at rest | Uses session secrets (`SHOPIFY_SESSION_SECRET`, `YOUCAN_SESSION_SECRET`, `META_SESSION_SECRET`) |
| Service-role key required | Server-side DB writes bypass RLS; must never be exposed to client |
| Webhook endpoints are public | Protected by HMAC verification, not auth middleware |
| No rate limiting | Webhook and API endpoints have no rate limiting |
| ngrok in development | Exposes local server to internet; dev-only pattern |

### Operational Risks

| Item | Detail |
|------|--------|
| ngrok URL changes | Breaks OAuth redirect URI and webhook URL until both Shopify/YouCan dashboards and `.env.local` are updated |
| Supabase CLI not on PATH | Remote migration status could not be verified during audit |
| No monitoring | Failures in webhook ingestion or Meta delivery are silent unless manually checked in DB |
| Single Supabase project | No staging/production separation visible in repo |

### Architecture Strengths

| Item | Detail |
|------|--------|
| Adapter isolation | Store/marketing/confirmation adapters with clear interfaces |
| Provider-agnostic orders | Normalized `orders` table decouples confirmation/Meta delivery from store provider |
| Idempotent webhooks | `store_webhook_events` unique constraint prevents duplicate processing |
| Idempotent Meta delivery | `meta_conversion_deliveries` unique `event_id` prevents duplicate CAPI sends |
| Atomic confirmation | Single UPDATE with status check prevents race conditions |
| Comprehensive unit tests | 261 tests covering OAuth, webhooks, orders, confirmation, Meta delivery |
| Additive migrations | Migration 009 extends CHECK constraints without breaking existing Shopify data |

### Uncertainties

| Item | Status |
|------|--------|
| Whether migration 009 is applied locally | uncertain |
| Whether remote Supabase has migrations 002–008 applied | assumed yes (project linked in `.temp/linked-project.json`, ref `othfbqxjwtlkbiemwsvl`) |
| Shopify app distribution mode | uncertain — requires Partners Dashboard inspection |
| Exact Shopify app Client ID vs env var match | uncertain — requires dashboard comparison |
| Whether Meta CAPI works with real pixel | uncertain — no live test performed |
| Whether YouCan Partner API endpoints match implementation assumptions | uncertain — no live test performed |

---

*End of PROJECT_STATUS.md*
