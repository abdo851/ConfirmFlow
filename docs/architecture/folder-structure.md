# Folder Structure

```
ConfirmFlow/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Landing / public pages
│   ├── (auth)/             # Login, signup
│   ├── dashboard/          # Authenticated dashboard (placeholder)
│   ├── onboarding/         # Store setup (placeholder)
│   └── api/                # API routes
├── components/             # Reusable UI and layout
├── features/               # Feature modules (domain logic, future)
├── lib/                    # Shared libraries
│   ├── auth/               # Supabase Auth clients
│   ├── database/           # Database client
│   ├── integrations/       # Adapter interfaces
│   ├── webhooks/           # Generic webhook pipeline
│   ├── events/             # Internal event types
│   ├── conversions/        # Conversion engine interfaces
│   ├── security/           # Secrets, authz, webhook verification
│   ├── validation/         # Zod schemas and env validation
│   └── utils/              # Utilities
├── integrations/           # Provider-specific adapter implementations (future)
│   ├── stores/
│   ├── confirmation/
│   └── marketing/
├── database/
│   ├── migrations/         # Versioned SQL migrations
│   ├── seeds/
│   └── types/              # TypeScript entity types
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
├── scripts/
└── DEVELOPMENT_RULES.md
```

## Conventions

- **`lib/`** — Cross-cutting infrastructure and interfaces.
- **`features/`** — Business logic grouped by domain; may use adapters but not provider SDKs directly.
- **`integrations/`** — Concrete adapter implementations per external provider.
- **`app/`** — Routes and page composition only; minimal logic.
