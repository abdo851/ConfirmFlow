# Confirma

Confirma is a SaaS platform that bridges ecommerce order confirmation with Meta (Facebook) Conversions API. Merchants receive orders via webhooks, confirm them manually, and Confirma sends one real **Purchase** event to Meta CAPI per confirmed order.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Supabase (PostgreSQL + Auth)
- Tailwind CSS 4
- next-intl (English + Arabic)
- Zod, Vitest, Playwright

## Integrations

| Integration | Status |
|-------------|--------|
| **Shopify** | Code complete — live OAuth blocked externally (Shopify grant page) |
| **YouCan** | Code complete — live OAuth not yet tested |
| **Meta CAPI** | Code complete — live end-to-end not yet verified |

## Local Development

```bash
cp .env.example .env.local
# Fill in Supabase, Shopify, YouCan, and Meta values

npm install
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000). For OAuth and webhooks during development, set `NEXT_PUBLIC_APP_URL` to your public tunnel URL (e.g. ngrok).

### Test user (optional)

```bash
npm run seed:test-user
```

Creates `test@confirma.local` in your Supabase project for local login.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Vitest unit tests (261 tests) |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run seed:test-user` | Ensure local test user exists |

## Environment

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_SESSION_SECRET`
- `YOUCAN_API_KEY`, `YOUCAN_API_SECRET`, `YOUCAN_SESSION_SECRET`
- `META_SESSION_SECRET`

See `.env.example` for optional scope overrides.

## Documentation

- [Architecture overview](docs/architecture/system-overview.md)
- [Development rules](DEVELOPMENT_RULES.md)
- [Adapter isolation ADR](docs/decisions/001-adapter-isolation.md)
- [Project status](PROJECT_STATUS.md)
- [Setup report](SETUP_REPORT.md)
- [Extensibility audit](EXTENSIBILITY_REPORT.md)

## Health Check

```bash
curl http://localhost:3000/api/health
# {"status":"ok","service":"confirma","milestone":"MVP"}
```
