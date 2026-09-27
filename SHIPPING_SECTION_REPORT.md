# Shipping section report

Status: uncommitted, awaiting approval

## 1. Summary

The dashboard Setup group now has **شركات التوصيل / Shipping Companies**, immediately after Connections. The page shows 10 provider cards. **ربط** opens `/dashboard/shipping/{slug}`, which reads the merchant’s already connected store and asks only for an API key. The connect button does not call a shipping API. It shows “قريباً” / “Coming Soon”.

The dashboard layout file was left unchanged. The shell already renders `DashboardSidebar`, and the new item is a group in the sidebar model.

## 2. Sidebar change

- `components/dashboard/sidebar-model.ts` line 36: `{ key: "shipping", href: "/dashboard/shipping", items: [] }` placed after `connections`.
- `components/dashboard/sidebar.tsx`: truck icon and indigo icon tone for `shipping`. No existing item was removed.
- Labels: `messages/ar/navigation.json` `sidebar.shipping` = شركات التوصيل, `messages/en/navigation.json` = Shipping Companies.
- `tests/unit/sidebar-nav.test.ts` expects `shipping` in that position. A non-admin now sees 10 groups.

How a new item is added: append a `SidebarGroup` in `sidebarGroups`. Groups whose key is not `overview`, `orders`, or `analytics` render under Setup, in array order. The label is `navigation.sidebar.{key}`.

## 3. Shipping data model

`lib/shipping/data.ts`

Static `SHIPPING_PROVIDERS` plus `getShippingProvider(slug)`. No database table.

## 4. Cards page

`app/[locale]/dashboard/shipping/page.tsx`

`components/shipping/shipping-card.tsx`

White rounded card, soft shadow, hover lift. Green **مجاني** badge at the top left. Gear button at the top right (no action). Logo, bold name, one-line Arabic description, full-width indigo **ربط**. A connected card would show **متصل** and a switch. Nothing is connected yet, so every card shows **ربط**.

Grid: 1 column, 2 from `md`, 3 from `lg`, gap 16px.

## 5. Connection page

`app/[locale]/dashboard/shipping/[slug]/page.tsx`

`components/shipping/shipping-connect-form.tsx`

Uses the existing `getStoreConnectionState()` (same store readers as Connections: WooCommerce, then YouCan, then Shopify). It does not modify those readers.

- Store found: “سيتم ربط متجرك: {url}”, one API key field, **ربط**.
- No store: “اربط متجرك أولاً” linking to `/onboarding/store`.
- Submit shows the coming-soon text. No API call.
- **رجوع** returns to `/dashboard/shipping`.
- Unknown slug: 404.

## 6. i18n keys added

Under `dashboard.shipping` in `messages/en/dashboard.json` and `messages/ar/dashboard.json`:

- title, subtitle, free, connect, connected, back, storeWillBeLinked, noStore, apiKey, comingSoon
- settings (gear button label)

`navigation.sidebar.shipping` in both navigation files.

No existing key was deleted.

## 7. Logos

Saved under `public/shipping/`. No CDN at runtime.

| Provider | File | Source |
| --- | --- | --- |
| Sendit | `sendit.png` | Fetched from sendit.ma |
| Cathedis | `cathedis.png` | Fetched from shop.cathedis.ma |
| Ameex | `ameex.ico` | Fetched favicon from ameex.ma |
| Ozon Express | `ozon-express.png` | Fetched from ozonexpress.ma |
| Ozonexpress | `ozonexpress.png` | Same logo, second slug |
| Digylog | `digylog.png` | Fetched from digylog.com |
| Coliix | `coliix.png` | Fetched from coliix.com |
| Tawssil | `tawssil.svg` | Local wordmark already in the project |
| Forcelog | `forcelog.png` | Fetched from forcelog.ma |
| Colis Swift | `colis-swift.svg` | Placeholder: teal circle, letter S. colisswift.ma did not resolve |

## 8. Files created

- `app/[locale]/dashboard/shipping/page.tsx`
- `app/[locale]/dashboard/shipping/[slug]/page.tsx`
- `components/shipping/shipping-card.tsx`
- `components/shipping/shipping-connect-form.tsx`
- `lib/shipping/data.ts`
- `public/shipping/sendit.png`
- `public/shipping/cathedis.png`
- `public/shipping/ameex.ico`
- `public/shipping/ozon-express.png`
- `public/shipping/ozonexpress.png`
- `public/shipping/digylog.png`
- `public/shipping/coliix.png`
- `public/shipping/tawssil.svg`
- `public/shipping/forcelog.png`
- `public/shipping/colis-swift.svg`
- `SHIPPING_SECTION_REPORT.md`

## 9. Files modified

- `components/dashboard/sidebar-model.ts`
- `components/dashboard/sidebar.tsx`
- `messages/ar/dashboard.json`
- `messages/en/dashboard.json`
- `messages/ar/navigation.json`
- `messages/en/navigation.json`
- `tests/unit/sidebar-nav.test.ts`

## 10. Tests

326/326 passed (67 files).

## 11. Typecheck and lint

- Typecheck: pass (`tsc --noEmit`, exit 0), including the Next image swap.
- Lint: pass (`eslint .`, exit 0, no warnings) after replacing `<img>` with `next/image`.

## 12. Files not touched

- `lib/integrations/**` (meta, woocommerce, youcan, shopify, tiktok, google)
- `app/api/integrations/**`
- `lib/auth/**`, `lib/supabase/**`, `lib/database/**`
- `lib/confirmation/**`, `lib/orders/**`, `lib/webhooks/**`
- `lib/content/**`, `lib/videos/**`, `lib/logging/**`, `lib/security/**`
- `lib/utils/**`, `lib/config/**`
- `middleware.ts`, `next.config.ts`, `.env.local`, `package.json`
- `database/migrations/**`, `supabase/migrations/**`
- `app/api/auth/**`, `app/api/orders/**`, `app/api/dashboard/**`, `app/api/supabase/**`, `app/api/health/**`
- `app/[locale]/dashboard/layout.tsx` (the sidebar is already mounted there)
- Existing users, stores, connections, and orders

## 13. Status

uncommitted, awaiting approval

## 14. What remains for tomorrow

Per provider: store the API key, call that carrier’s API, and persist a connection row. The form does not save the key. The gear button and the connected toggle are visual only. The top bar title still falls back to the brand name on this route, because that map lives in `components/layout/dashboard-shell.tsx`, which this task does not allow editing.
