# Comprehensive report

## 1. Summary

Migration 012 and migration 013 are on the remote database. The test account `test@confirma.local` is an admin. Admins can create, edit, reorder, hide, and delete content blocks, and can edit policy JSON. Active blocks render on the dashboard and onboarding, with a close control stored in localStorage. The overview Stores card is connected when YouCan, Shopify, or WooCommerce is connected. YouCan and Shopify tabs show “قريباً” and a waitlist form. WooCommerce connect is unchanged. Nothing was committed.

## 2. Migration 012 applied

Yes. It was local-only (`20260922110000`), and the dry run listed only that file.

Dry run:

```
Would push these migrations:
 • 20260922110000_order_confirmation_status.sql
```

Push applied `20260922110000_order_confirmation_status.sql`. A later `npx supabase migration list` shows Local and Remote both at `20260922110000`.

## 3. Migration 013 applied

Yes. The dry run listed only `20260922120000_admin_roles_and_content.sql`. Push applied that file. Local and Remote both show `20260922120000`.

## 4. Admin CMS overview

`/admin` and `/admin/content` list blocks. Drag and drop uses native HTML5 events and saves `position`. Add, edit, hide, and delete are available. `/admin` redirects signed-out visitors to login (verified: `GET /ar/admin` returned 307 to `/ar/login`). A signed-in non-admin is redirected to `/dashboard` by the admin layout. The test user opened `/ar/admin/content` and created a banner, which then appeared on `/ar/onboarding` and `/ar/dashboard`.

## 5. Content blocks schema

`content_blocks`: id, type (`banner` | `video` | `ad` | `text`), title, description, image_url, video_url, cta_label, cta_url, extra JSONB, position, is_active, locale (`both` | `ar` | `en`), created_by, created_at, updated_at. Indexes on position, type, and is_active. Authenticated users can read. Insert, update, and delete require `profiles.role` of `admin` or `owner`. Server writes use the service-role client after the same role check.

## 6. Policy pages list

- `/policies/privacy`
- `/policies/terms`
- `/policies/refund`
- `/policies/cookies`

Draft copy is in `messages/en/policies.json` and `messages/ar/policies.json`. Footer links point at those pages. `/admin/policies` edits a JSON document of title and body for both languages and saves it to `app_settings.key = 'policies'`. Public pages use that override when it is a complete catalog, otherwise the i18n draft.

## 7. Overview card fix

`getStoreConnectionState` now reads the public YouCan, Shopify, and WooCommerce states. The Stores card shows “متصل” when any one is connected. On `/ar/dashboard` it showed connected to `https://ancientcoach.s2-tastewp.com`.

## 8. Coming soon section

YouCan and Shopify tabs stay visible. Selecting one shows a muted card, a “قريباً” / “Coming soon” badge, a disabled button, and a Team waitlist (email + “أبلغني عند الإطلاق”). Rows go to `waitlist` (`provider`, `email`, unique pair). WooCommerce still uses its connect form.

## 9. New API routes

No new REST routes. Server actions:

- `createBlockAction`, `updateBlockAction`, `deleteBlockAction`, `reorderBlocksAction`, `toggleBlockAction`
- `joinWaitlistAction`
- `savePoliciesAction`

## 10. New pages

- `/admin`, `/admin/content`, `/admin/content/new`, `/admin/content/[id]`, `/admin/policies`
- `/policies/privacy`, `/policies/terms`, `/policies/refund`, `/policies/cookies`

## 11. New components

- `components/admin/block-editor.tsx`
- `components/admin/block-preview.tsx`
- `components/admin/block-form.tsx`
- `components/admin/media-picker.tsx`
- `components/admin/policy-editor.tsx`
- `components/content/content-block-feed.tsx`
- `components/policies/policy-document.tsx`

## 12. Files created

- `database/migrations/013_admin_roles_and_content.sql`
- `supabase/migrations/20260922120000_admin_roles_and_content.sql`
- `lib/admin/roles.ts`
- `lib/content/schema.ts`, `lib/content/blocks.ts`, `lib/content/actions.ts`
- `lib/waitlist/validate.ts`, `lib/waitlist/actions.ts`
- `lib/policies/settings.ts`, `lib/policies/actions.ts`
- `app/[locale]/admin/layout.tsx`, `page.tsx`, `content/page.tsx`, `content/new/page.tsx`, `content/[id]/page.tsx`, `policies/page.tsx`
- `app/[locale]/policies/privacy/page.tsx`, `terms/page.tsx`, `refund/page.tsx`, `cookies/page.tsx`
- `messages/en/admin.json`, `messages/ar/admin.json`, `messages/en/policies.json`, `messages/ar/policies.json`
- `tests/unit/content-blocks.test.ts`, `tests/unit/admin-role-check.test.ts`, `tests/unit/waitlist.test.ts`
- `COMPREHENSIVE_REPORT.md`

## 13. Files modified

- `lib/connections/store-connection.ts`
- `lib/auth/protection.ts`
- `components/connections/store-provider-panel.tsx`
- `components/layout/site-footer.tsx`
- `app/[locale]/dashboard/page.tsx`
- `app/[locale]/onboarding/page.tsx`
- `i18n/request.ts`
- `tests/unit/i18n.test.ts`
- `messages/en/connections.json`, `messages/ar/connections.json`
- `messages/en/dashboard.json`, `messages/ar/dashboard.json`

Earlier uncommitted wiring and UI files are still in the working tree.

## 14. Tests

296/296 passed. The previous suite was 289. Seven tests were added.

## 15. Typecheck

pass

## 16. Lint

pass

## 17. Screenshots recommended

- `/ar/admin/content` with the banner “ترحيب بك في Confirma”
- `/ar/onboarding` and `/ar/dashboard` showing that banner and a close control
- `/ar/dashboard` Stores card: متصل, WooCommerce store URL
- `/ar/onboarding/store` YouCan and Shopify “قريباً” plus the waitlist
- `/ar/policies/privacy`

## 18. Status

uncommitted, awaiting user approval

## 19. Known limitations

- A banner was created in the live database during verification. Hide or delete it from `/admin` if it should not stay.
- YouCan and Shopify connection forms are not shown. Their integration modules were not changed. WooCommerce connect still works.
- Media fields accept an image URL or a YouTube URL. There is no file upload.
- `profiles.role` cannot be changed by a signed-in user update. The migration set the test user to admin.
- Policy pages keep the i18n draft until an admin saves a complete en/ar JSON catalog.
- Google sign-in is still disabled.
