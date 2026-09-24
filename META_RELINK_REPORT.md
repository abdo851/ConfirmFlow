# Meta re-link report

## Current state before the change

| Table | Row |
| --- | --- |
| `meta_connections` | `store_connection_id` `756f3d7e-4900-4472-bb9f-ee66c2d9fd1e`, pixel `4444157855871429`, `verification_status` `verified`, `verified_at` `2026-09-24T06:43:03.999+00:00` |
| `meta_connection_secrets` | same `store_connection_id`, encrypted token length `367`, format `v1` (4 parts) |
| `store_connections` | id `756f3d7e-4900-4472-bb9f-ee66c2d9fd1e`, store `71e24709-75a4-4f11-8d85-9f31e783d747` (old store), `connection_type` `marketing`, `provider` `meta`, `status` `active` |

The ciphertext was already in the existing encrypted format, so it was copied unchanged. It was not decrypted or re-encrypted.

## What the script did

`scripts/relink-meta.mjs` deleted the old Meta secret, Meta connection, and marketing `store_connections` row, then created a marketing Meta connection on store `9e1d1728-8146-447f-b8cd-51b4bb5d74ea`.

## Verified state after the change

| Field | Value |
| --- | --- |
| Old Meta `store_connection` (deleted) | `756f3d7e-4900-4472-bb9f-ee66c2d9fd1e` |
| New Meta `store_connection` | `a1ec2779-061d-4f4f-8768-5d68afb321cf` |
| Store | `9e1d1728-8146-447f-b8cd-51b4bb5d74ea` (`https://humorousdirt.s2-tastewp.com`) |
| Connection type / provider / status | `marketing` / `meta` / `active` |
| Pixel | `4444157855871429` |
| Verification | `verified` |
| Encrypted token | copied, length still `367` |

## Checks

- Tests: 314/314
- Typecheck: pass
