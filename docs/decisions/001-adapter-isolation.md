# ADR 001: Integration Isolation Behind Adapters

**Status:** Accepted  
**Date:** M0  
**Context:** Confirma integrates with multiple e-commerce platforms (Shopify, WooCommerce, YouCan), confirmation providers, and marketing APIs (Meta, Google, TikTok). Each provider has different APIs, authentication, webhook formats, and error semantics.

## Decision

All external integrations must be implemented as adapters conforming to one of three interfaces:

- `StoreAdapter`
- `ConfirmationAdapter`
- `MarketingAdapter`

Core application code (features, API routes, conversion engine) depends only on these interfaces, never on provider SDKs or HTTP clients directly.

## Rationale

1. **Testability** — Core logic can be tested with mock adapters.
2. **Replaceability** — Adding or swapping a provider does not require changes across the codebase.
3. **Consistency** — Orders, confirmations, and conversions follow normalized internal shapes regardless of source platform.
4. **Security boundary** — Provider credentials and verification logic stay in `integrations/` modules.
5. **Milestone control** — Each provider can be delivered in its own milestone without blocking core development.

## Consequences

- New providers require a new adapter implementation and registration, not changes to feature modules.
- Adapter interfaces must be stable; breaking changes require ADR updates and migration plans.
- `integrations/` directory is the only location for provider-specific code.

## Alternatives Considered

- **Direct SDK usage in features** — Rejected due to tight coupling and difficult testing.
- **Single generic HTTP client** — Rejected; normalization and verification differ too much per provider.
