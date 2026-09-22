# Dashboard reorganization report

Status: **uncommitted, awaiting user approval**

## 1. Summary

The dashboard sidebar is now one grouped navigation for every current feature. Groups expand and collapse, the open state is stored in `localStorage` under `confirma-sidebar-groups`, the active route highlights the parent and the child, and the mobile drawer is unchanged. New pages sit under `/dashboard`. The existing CMS and policy editor are reused from new view components, and the old `/admin` URLs redirect into `/dashboard/admin`.

## 2. New sidebar structure

```
نظرة عامة                         /dashboard
الطلبات                           /dashboard/orders
  الكل                            /dashboard/orders
  مؤكدة                           /dashboard/orders?status=confirmed
  قيد المراجعة                    /dashboard/orders?status=pending
  مرفوضة                          /dashboard/orders?status=rejected
  مؤرشفة                          /dashboard/orders?status=archived
الإحصائيات                        /dashboard/analytics
الاتصالات                         /dashboard/connections
  المتاجر                         /dashboard/connections
  Meta Pixel                      /dashboard/connections/meta
  Webhooks                        /dashboard/connections/webhooks
أدوات التتبع                      /dashboard/tracking
  إعدادات البيكسل                 /dashboard/tracking/pixel
  Conversion API                  /dashboard/tracking/capi
  Google Tag Manager              /dashboard/tracking/gtm          (قريباً)
  TikTok Events                   /dashboard/tracking/tiktok       (قريباً)
أدوات التسويق                     /dashboard/marketing
  الحملات                         /dashboard/marketing/campaigns   (قريباً)
  الجماهير                        /dashboard/marketing/audiences   (قريباً)
  قوالب الرسائل                   /dashboard/marketing/templates   (قريباً)
محفظتك                            /dashboard/wallet
  الرصيد                          /dashboard/wallet
  المعاملات                       /dashboard/wallet/transactions
  الفواتير                        /dashboard/wallet/invoices
الفريق                            /dashboard/team                  (قريباً)
الإدارة                           /dashboard/admin                 (admin or owner only)
  محتوى المنصة                    /dashboard/admin/content
  السياسات                        /dashboard/admin/policies
  المستخدمون                      /dashboard/admin/users
  الإعدادات العامة                /dashboard/admin/settings
الإعدادات                         /dashboard/settings
  الحساب                          /dashboard/settings/account
  اللغة                           /dashboard/settings/language
  الإشعارات                       /dashboard/settings/notifications
  API                             /dashboard/settings/api
```

Onboarding stays on the overview page. It is not an eleventh sidebar group.

## 3. New pages created

| Route | What it does |
| --- | --- |
| `/dashboard/analytics` | Four stat cards, sparkline, today / 7d / 30d / custom range. Uses the existing stats and timeseries helpers. |
| `/dashboard/connections/meta` | Pixel id, verification, last delivery. Connect CTA and the existing Meta panel when disconnected. |
| `/dashboard/connections/webhooks` | WooCommerce webhook ids stored on the connection, plus last update. |
| `/dashboard/tracking` | Overview cards. |
| `/dashboard/tracking/pixel` | Read-only pixel status. |
| `/dashboard/tracking/capi` | Read-only status and a test event button that posts to the existing Meta verify route. |
| `/dashboard/tracking/gtm` | Coming soon + waitlist. |
| `/dashboard/tracking/tiktok` | Coming soon + waitlist. |
| `/dashboard/marketing` | Overview cards. |
| `/dashboard/marketing/campaigns` | Coming soon + waitlist. |
| `/dashboard/marketing/audiences` | Coming soon + waitlist. |
| `/dashboard/marketing/templates` | Coming soon + waitlist. |
| `/dashboard/wallet` | Balance shown as 0, with links. |
| `/dashboard/wallet/transactions` | Empty state. |
| `/dashboard/wallet/invoices` | Empty state. |
| `/dashboard/team` | Coming soon + waitlist. |
| `/dashboard/settings` | Overview cards. |
| `/dashboard/settings/account` | Session email. Visual only. |
| `/dashboard/settings/language` | Existing language switcher. |
| `/dashboard/settings/notifications` | Visual only. |
| `/dashboard/settings/api` | Visual only. |
| `/dashboard/admin` | Existing content block list, inside the dashboard shell. |
| `/dashboard/admin/content` | Same block list. |
| `/dashboard/admin/content/new` | Existing block form. |
| `/dashboard/admin/content/[id]` | Existing block form. |
| `/dashboard/admin/policies` | Existing policy editor. |
| `/dashboard/admin/users` | Profile id and role list. No role editing. |
| `/dashboard/admin/settings` | Links to content and policies. |

Every new page includes a back button.

## 4. Old routes moved

| Before | After |
| --- | --- |
| `/admin` | `/dashboard/admin` |
| `/admin/content` | `/dashboard/admin/content` |
| `/admin/content/new` | `/dashboard/admin/content/new` |
| `/admin/content/[id]` | `/dashboard/admin/content/[id]` |
| `/admin/policies` | `/dashboard/admin/policies` |

The old pages are redirects only. The block editor, block form, and policy editor logic were not rewritten. CMS buttons that still point at `/admin/content/...` follow these redirects. Saving a block still returns to `/admin`, which then redirects to `/dashboard/admin`.

## 5. Role-based visibility

The Admin group renders only when `profiles.role` is `admin` or `owner` (`isAdminRole`). A regular user gets 9 groups. An admin or owner gets 10. `/dashboard/admin` also checks the role and sends anyone else to `/dashboard`. The old `/admin` layout still performs its own role check before the page redirect.

## 6. i18n keys added

`messages/en/navigation.json` and `messages/ar/navigation.json` both gained a `sidebar` object: overview, orders, ordersAll, ordersConfirmed, ordersPending, ordersRejected, ordersArchived, analytics, connections, stores, metaPixel, webhooks, tracking, pixelSettings, capi, gtm, tiktok, marketing, campaigns, audiences, templates, wallet, balance, transactions, invoices, team, admin, cms, policies, users, generalSettings, settings, account, language, notifications, api.

`messages/en/dashboard.json` and `messages/ar/dashboard.json` both gained a `pages` object for the new screen copy (analytics filters, Meta status, webhooks, coming soon, wallet, settings, admin users).

## 7. Tests

**300/300 passed** (53 files). The previous suite was 296. `tests/unit/sidebar-nav.test.ts` adds 4 tests: group order, admin visibility, parent highlighting, and order-status child matching.

## 8. Typecheck

**Pass** (`tsc --noEmit`).

## 9. Lint

**Pass** (`eslint .`, exit 0).

## 10. Files created

Sidebar and pages:

- `components/dashboard/sidebar-model.ts`
- `components/dashboard/read-sidebar-role.ts`
- `components/dashboard/section.tsx`
- `components/dashboard/coming-soon-panel.tsx`
- `components/dashboard/meta-status-card.tsx`
- `components/dashboard/meta-verify-button.tsx`
- `components/dashboard/nav-cards.tsx`
- `components/dashboard/require-admin.ts`
- `lib/dashboard/list-woocommerce-webhooks.ts`
- `lib/marketing/feature-waitlist.ts`
- `lib/marketing/feature-waitlist-action.ts`
- `components/admin/views/block-list.tsx`
- `components/admin/views/new-block.tsx`
- `components/admin/views/edit-block.tsx`
- `components/admin/views/policies.tsx`
- `app/[locale]/dashboard/analytics/page.tsx`
- `app/[locale]/dashboard/connections/meta/page.tsx`
- `app/[locale]/dashboard/connections/webhooks/page.tsx`
- `app/[locale]/dashboard/tracking/page.tsx`
- `app/[locale]/dashboard/tracking/pixel/page.tsx`
- `app/[locale]/dashboard/tracking/capi/page.tsx`
- `app/[locale]/dashboard/tracking/gtm/page.tsx`
- `app/[locale]/dashboard/tracking/tiktok/page.tsx`
- `app/[locale]/dashboard/marketing/page.tsx`
- `app/[locale]/dashboard/marketing/campaigns/page.tsx`
- `app/[locale]/dashboard/marketing/audiences/page.tsx`
- `app/[locale]/dashboard/marketing/templates/page.tsx`
- `app/[locale]/dashboard/wallet/page.tsx`
- `app/[locale]/dashboard/wallet/transactions/page.tsx`
- `app/[locale]/dashboard/wallet/invoices/page.tsx`
- `app/[locale]/dashboard/team/page.tsx`
- `app/[locale]/dashboard/settings/page.tsx`
- `app/[locale]/dashboard/settings/account/page.tsx`
- `app/[locale]/dashboard/settings/language/page.tsx`
- `app/[locale]/dashboard/settings/notifications/page.tsx`
- `app/[locale]/dashboard/settings/api/page.tsx`
- `app/[locale]/dashboard/admin/layout.tsx`
- `app/[locale]/dashboard/admin/page.tsx`
- `app/[locale]/dashboard/admin/content/page.tsx`
- `app/[locale]/dashboard/admin/content/new/page.tsx`
- `app/[locale]/dashboard/admin/content/[id]/page.tsx`
- `app/[locale]/dashboard/admin/policies/page.tsx`
- `app/[locale]/dashboard/admin/users/page.tsx`
- `app/[locale]/dashboard/admin/settings/page.tsx`
- `tests/unit/sidebar-nav.test.ts`
- `DASHBOARD_REORG_REPORT.md`

## 11. Files modified

This reorganization changed:

- `components/dashboard/sidebar.tsx`
- `components/layout/dashboard-shell.tsx`
- `app/[locale]/dashboard/layout.tsx` (passes the admin flag into the shell)
- `components/orders/orders-list.tsx` (reads `?status=` so the sidebar filters select the matching tab; the orders page fetch is unchanged)
- `messages/en/navigation.json`
- `messages/ar/navigation.json`
- `messages/en/dashboard.json`
- `messages/ar/dashboard.json`
- `app/[locale]/admin/page.tsx`
- `app/[locale]/admin/content/page.tsx`
- `app/[locale]/admin/content/new/page.tsx`
- `app/[locale]/admin/content/[id]/page.tsx`
- `app/[locale]/admin/policies/page.tsx`

Those five admin pages are now redirects. `app/[locale]/admin/layout.tsx` was not rewritten.

The working tree also still contains earlier uncommitted work (dashboard stats, order actions, CMS, policies, reports). That work was not recommitted and was not reverted.

## 12. Files NOT touched

This task did not edit:

1. YouCan — `lib/integrations/youcan/**`, `app/api/integrations/youcan/**`
2. Shopify — `lib/integrations/shopify/**`, `app/api/integrations/shopify/**`
3. Meta — `lib/integrations/meta/**`, `app/api/integrations/meta/**`
4. WooCommerce — `lib/integrations/woocommerce/**`, `app/api/integrations/woocommerce/**`
5. Auth system — `lib/auth/**`, `app/api/auth/**`
6. Supabase clients — `lib/supabase/**`, `lib/database/**`
7. Middleware — `middleware.ts`
8. Migrations — `database/migrations/**`, `supabase/migrations/**` (no new migration)
9. Environment — `.env.local`, `.env.example`, `next.config.ts`
10. Existing working pages — `/dashboard`, `/dashboard/orders`, `/dashboard/connections`, `/onboarding/*`, `/login`, `/signup`, `/policies/*` (page files and their data flow were not changed)
11. Confirmation engine — `lib/confirmation/**`
12. Orders pipeline — `lib/orders/**`, `lib/webhooks/**`
13. Content blocks system — `lib/content/**`
14. Admin CMS logic — `components/admin/block-editor.tsx`, `block-form.tsx`, `policy-editor.tsx`, and `app/[locale]/admin/layout.tsx` were not rewritten. Only the five admin `page.tsx` files became redirects.

New pages call the existing public helpers. They do not change those modules.

## 13. Screenshots recommended

Checked in the browser while signed in as the admin test user:

- Arabic `/ar/dashboard`: RTL, sidebar on the right, all 10 groups, Admin visible.
- Orders group expands and collapses. `?status=pending` highlights "قيد المراجعة" and selects the "جديدة" tab.
- `/ar/dashboard/analytics`: back button, range filters, four cards, sparkline.
- `/ar/dashboard/team`: "قريباً" copy and waitlist form.
- `/ar/admin` lands on `/ar/dashboard/admin` and shows the existing content blocks.
- English `/en/dashboard`: `dir=ltr`, English group labels, Admin visible.

A non-admin browser session was not available. Hiding the Admin group is covered by the unit test.

## 14. Status

**uncommitted, awaiting user approval**

Nothing was committed or pushed.

## 15. Known limitations

- "إعادة تسجيل" on the webhooks page opens `/onboarding/store`. Calling the WooCommerce register function from a new page would create duplicate webhooks and needs connection secrets. Those modules were left untouched. The page lists `webhook_ids` and `updated_at` from the user's own connection row. Delivery events in `store_webhook_events` are not readable with the user client.
- Coming-soon waitlist entries are stored in `app_settings` under the key `feature_waitlist`. The existing `waitlist` table only allows `youcan` and `shopify`, and no new migration was added.
- Wallet, notifications, and API settings are visual. Balance is 0. No keys are issued.
- Admin users are listed as profile id and role. Roles cannot be edited from this screen.
- The content editor's own links still target `/admin/content/...`. Redirects carry them into the dashboard. After save, the content action still redirects to `/admin`, then to `/dashboard/admin`.
- Onboarding is reached from the overview page, not from a sidebar group.
- The Next.js dev overlay reported two hydration warnings while the browser tools were attached. Both diffs were a `data-cursor-ref` attribute injected by the browser session, not an attribute rendered by the app.
