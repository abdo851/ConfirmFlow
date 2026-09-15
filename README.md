# Confirma

Order confirmation and conversion tracking platform — **M0 foundation scaffold**.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth)
- Zod validation
- Vitest + Playwright

## Getting Started

```bash
cp .env.example .env.local
# Fill in Supabase credentials

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run typecheck` | TypeScript check |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright E2E tests |

## Documentation

- [Architecture overview](docs/architecture/system-overview.md)
- [Development rules](DEVELOPMENT_RULES.md)
- [ADR: Adapter isolation](docs/decisions/001-adapter-isolation.md)

## Milestone Status

**M0 — Project Foundation & Architecture Scaffold** — Complete when reviewed and approved.

No product features or external integrations are implemented in this milestone.
