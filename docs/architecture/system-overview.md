# System Overview

Confirma is an order confirmation and conversion tracking platform. It connects e-commerce stores, confirmation workflows, and marketing conversion APIs through a unified adapter-based architecture.

## M0 Scope

M0 establishes the project foundation only:

- Next.js application with TypeScript and Tailwind CSS
- Supabase PostgreSQL and Auth scaffolding
- Adapter interfaces for stores, confirmations, and marketing
- Generic webhook, event, and conversion engine foundations
- Initial database schema and migration structure
- Development, testing, and documentation infrastructure

No external integrations or product features are implemented in M0.

## High-Level Flow (Future)

```
Store (Shopify/WooCommerce/YouCan)
        ↓ webhook
StoreAdapter → Order persisted
        ↓
ConfirmationAdapter → customer confirms/cancels
        ↓
Conversion Engine → decision
        ↓
MarketingAdapter (Meta/Google/TikTok)
```

## Core Principles

1. **Adapter isolation** — Core logic never imports provider SDKs directly.
2. **Versioned schema** — All database changes via migrations.
3. **Idempotent webhooks** — External events deduplicated before processing.
4. **Security separation** — Server secrets, public config, auth, and validation are distinct layers.
