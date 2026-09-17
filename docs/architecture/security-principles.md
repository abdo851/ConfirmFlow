# Security Principles

## Secret Management

| Layer | Location | Usage |
|-------|----------|-------|
| Server-only secrets | `lib/security/server-secrets.ts` | Service role keys, API secrets |
| Public config | `lib/security/public-config.ts` | Supabase URL, anon key, app URL |
| Environment validation | `lib/validation/env.ts` | Zod parsing at startup/use |

Never commit `.env` files. Use `.env.example` as the reference for required variable names.

## Authentication

Supabase Auth clients in `lib/auth/`:

- `createAuthBrowserClient()` — client components
- `createAuthServerClient()` — server components and API routes
- Server actions in `lib/auth/actions.ts` for login, signup, and logout
- Session refresh and protected-route redirects in `middleware.ts`
- Email-confirmation callback at `/api/auth/callback`

Login and signup redirects only allow safe internal relative paths. Signup respects whether Supabase returns an immediate session or requires email confirmation first.

## Authorization

`lib/security/authorization.ts` defines placeholder RBAC policies. Real store-scoped permissions will extend `AuthorizationPolicy`.

## Webhook Verification

`lib/security/webhook-verification.ts` provides a generic verifier interface. Provider-specific HMAC/signature validation is implemented per adapter in future milestones.

## Input Validation

All external input must pass through Zod schemas in `lib/validation/`. Extend `schemas.ts` as API routes are added.

## Rules

1. No secrets in source code.
2. `server-only` modules must not be imported in client bundles.
3. Webhook endpoints must verify before processing.
4. Idempotency required before production webhook handlers go live.
