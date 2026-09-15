# Shopify Store Adapter

**Status:** M2-B OAuth foundation

`ShopifyAdapter` implements the generic `StoreAdapter` contract in `shopify-adapter.ts`.

## M2-B scope

- OAuth connect/callback API routes
- Signed OAuth state and HMAC validation
- Encrypted httpOnly cookie session for access tokens
- UI connect flow on `/onboarding/store`

## Not implemented in M2-B

- Webhooks
- Order ingestion
- Shopify Admin API usage beyond token exchange
- Database persistence
