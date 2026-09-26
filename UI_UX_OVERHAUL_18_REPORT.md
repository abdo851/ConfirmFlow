# UI and UX overhaul — 18 tasks

**Status:** uncommitted, awaiting approval

## 1. Summary

Customer-facing “coming soon” copy was removed from the landing text and platform badges. The dashboard keeps coming soon on marketing tools, team, and Google sign-in. The orders export button is larger and green. A real `.xlsx` file was not added, because that needs a new package. Video delete now asks for confirmation and the form edits an existing video. Signup shows a username field in the UI only. The auth action was not changed, so email confirmation still behaves as before and the username is not stored.

## 2. Per task

| Task | Result |
|---|---|
| 1 Export button | **Done** as styling. Existing `/api/orders/export` still returns CSV. Filename stays `orders.csv`. XLSX skipped: a real workbook needs a dependency. |
| 2 Videos | **Done.** Edit already opened the form. Delete uses the existing `deleteVideoAction` with `window.confirm` and the danger button. |
| 3 Profile off marketing | **Done.** Signed-in marketing header shows a Dashboard link, not the avatar menu. Language switcher and signed-out Sign in stay. |
| 4 Signup | **Partial.** Username, full name, email, both passwords, and eye toggles are on the form. Auth logic was not touched, so signup is not forced to skip email confirmation, and username is not saved. |
| 5 Landing coming soon | **Done** for hero, TikTok/Google showcase, and logo badges. Google sign-in and marketing tools were left as coming soon. |
| 6 FAQ | **Done.** Arabic FAQ already used YouCan and Shopify, not يوكان or شوبي فاي. No brand rename was required. |
| 7 Dashboard logo | **Done.** Sidebar wordmark links to `/dashboard`. |
| 8 لوحة التحكم | **Done.** The dashboard top-bar link goes to `/dashboard`, not `/`. |
| 9 OAuth analysis | **Done.** `OAUTH_FEASIBILITY_REPORT.md`. No code change. |
| 10 Analytics export | **Done** as the same styled button on the analytics page. Same CSV limit as task 1. |
| 11 API section | **Done.** `API_SECTION_EXPLANATION.md`. No code change. |
| 12 Announcement | **Done.** Marquee when `dashboard.announcement.text` is set, with dismiss. Example copy is set, so it shows. |
| 13 Video placement | **Partial.** Dropdown lists the five placements the API accepts: `landing_hero`, `landing_below_hero`, `onboarding_top`, `dashboard_top`, `global`. `dashboard_team`, `dashboard_icon`, and `dashboard_connections` were not added. The protected video type rejects them. |
| 14 Dashboard badges | **Done** for the GTM card badge. WooCommerce, Meta, TikTok, and Google cards did not have a coming-soon badge. Marketing, team, and Google sign-in still do. |
| 15 Landing text | **Done** with task 5. |
| 16 Platform readiness | **Done** as task 9. |
| 17 Login panel | **Done** in the shared auth layout: gradient, floating shapes, CSS dashboard preview, three bullets, hidden on phones, 50/50 from tablet, 55/45 on desktop. |
| 18 Responsive | **Partial.** Orders already become cards under `md`. Dashboard main hides horizontal overflow. A full pass of every sub-page at five widths was not completed in the browser. |

## 3. Files created

- `components/layout/dashboard-announcement.tsx`
- `OAUTH_FEASIBILITY_REPORT.md`
- `API_SECTION_EXPLANATION.md`
- `UI_UX_OVERHAUL_18_REPORT.md`

## 4. Files modified

- `components/orders/export-orders-button.tsx`
- `components/admin/video-manager.tsx`
- `components/layout/site-header.tsx`
- `components/layout/dashboard-shell.tsx`
- `components/dashboard/sidebar.tsx`
- `components/auth/signup-form.tsx`
- `components/marketing/platform-row.tsx`
- `app/[locale]/dashboard/analytics/page.tsx`
- `app/[locale]/dashboard/tracking/page.tsx`
- `app/[locale]/(auth)/layout.tsx`
- `messages/en/orders.json`, `messages/ar/orders.json`
- `messages/en/admin.json`, `messages/ar/admin.json`
- `messages/en/dashboard.json`, `messages/ar/dashboard.json`
- `messages/en/auth.json`, `messages/ar/auth.json`
- `messages/en/landing.json`, `messages/ar/landing.json`

## 5. Tests

326/326 passed.

## 6. Typecheck and lint

- Typecheck: pass.
- Lint: pass (exit 0).

## 7. Not touched

Integrations and their API routes, `lib/auth`, `lib/supabase`, `lib/database`, `lib/confirmation`, `lib/orders`, `lib/webhooks`, `lib/content`, `lib/videos`, `lib/logging`, `lib/security`, `lib/utils`, `lib/config`, `middleware.ts`, `next.config.ts`, `.env.local`, `package.json`, and migrations. No users, stores, orders, or ad connections were changed.

## 8. Status

uncommitted, awaiting approval
