# Critical fixes report

Status: uncommitted, awaiting approval

## 1. Summary

Four reported issues were handled inside the allowed UI and message files. The sidebar no longer remounts its scroll area on navigation. Dashboard routes now show a skeleton immediately, and in-app links prefetch. The false “without review” claim and the green “Today” badge on platform logos are gone. Supabase query caching was not added, because those reads call `cookies()` through protected helpers and `unstable_cache` would throw.

## 2. Sidebar fix

Root cause: `Panel` was declared inside `DashboardSidebar` and rendered as `<Panel />`. Each navigation created a new component type, so React unmounted the nav and the scroll position returned to the top. The sidebar already lived in the dashboard layout. No `key` was changing.

Solution:

- Render the panel as plain JSX so the same nav node stays mounted.
- Give the sidebar `h-screen` and its own `overflow-y-auto` nav. The shell no longer uses `position: sticky` on that sidebar, and the main column scrolls on its own.
- Restore the nav scroll from `sessionStorage` (`confirma-sidebar-scroll`) after navigation.

## 3. Performance fix

- Added `loading.tsx` on `/dashboard`, `/dashboard/orders`, `/dashboard/analytics`, and `/dashboard/connections`, using the existing `Skeleton`.
- Turned on `prefetch` for sidebar links, the dashboard home link, and the analytics range links. Those range links were full-page `<a>` tags; they are now client `Link`s.
- Removed `backdrop-blur-xl` from the dashboard top bar. There was no `blur-3xl` and no `will-change` to remove.

`unstable_cache` was not wrapped around orders, analytics, connections, or dashboard stats. `getDashboardStats`, `getOrdersForAuthenticatedUser`, and the connection readers call `createUserDatabaseClient()`, which reads cookies. Caching that call throws at runtime, and changing the readers would edit protected `lib/database`, `lib/orders`, and `lib/integrations` code. The skeleton removes the frozen-screen wait. The database round trip itself is unchanged.

## 4. "بدون مراجعة" fix

| Place | Before | After |
| --- | --- | --- |
| `messages/ar/auth.json` `trust3` | بالعربية وبدون مراجعة | بالعربية |
| `messages/en/auth.json` `trust3` | In Arabic, with no review step | In Arabic |

No other “بدون مراجعة”, “no review”, “without review”, or “ما محتاجش مراجعة” strings were found. Order status “قيد المراجعة” and the onboarding sentence “بعد مراجعة هذه الخطوة” were left as they are. They do not claim that platforms connect without review.

## 5. "اليوم" fix

| Place | Before | After |
| --- | --- | --- |
| Platform logo badge | Green badge “اليوم” / “Today” on Meta, TikTok, Google, and WooCommerce | Badge removed. Logos and card styling stay. |
| `messages/ar/landing.json` `badgeLive` | اليوم | empty string (key kept) |
| `messages/en/landing.json` `badgeLive` | Today | empty string (key kept) |
| Showcase title | Meta اليوم / Meta today | Meta |

`dashboard.pages.rangeToday` still says “اليوم” / “Today”. That is the analytics date filter, not a platform logo.

## 6. Files created

- `components/dashboard/page-skeleton.tsx`
- `app/[locale]/dashboard/loading.tsx`
- `app/[locale]/dashboard/orders/loading.tsx`
- `app/[locale]/dashboard/analytics/loading.tsx`
- `app/[locale]/dashboard/connections/loading.tsx`
- `CRITICAL_FIXES_REPORT.md`

## 7. Files modified

- `components/dashboard/sidebar.tsx`
- `components/layout/dashboard-shell.tsx`
- `components/marketing/platform-row.tsx`
- `app/[locale]/(marketing)/page.tsx`
- `app/[locale]/dashboard/analytics/page.tsx`
- `messages/ar/auth.json`
- `messages/en/auth.json`
- `messages/ar/landing.json`
- `messages/en/landing.json`

## 8. Tests

326/326 passed (67 files).

## 9. Typecheck and lint

- Typecheck: pass (`tsc --noEmit`, exit 0).
- Lint: pass (`eslint .`, exit 0).

## 10. Files not touched

- `lib/integrations/**`
- `lib/auth/**`, `lib/supabase/**`, `lib/database/**`
- `lib/confirmation/**`, `lib/orders/**`, `lib/webhooks/**`
- `lib/content/**`, `lib/videos/**`
- `app/api/integrations/**`
- `app/api/auth/**`, `app/api/orders/**`, `app/api/dashboard/**`
- `middleware.ts`, `next.config.ts`, `.env.local`, `package.json`
- `database/migrations/**`, `supabase/migrations/**`
- Existing users, stores, connections, and orders

## 11. Status

uncommitted, awaiting approval

Live browser check was not run in this pass. No dev server was open. Confirm on `/ar/dashboard` that the sidebar stays scrolled, and on `/ar` and `/en` that the logo row has no “اليوم” / “Today” badge.
