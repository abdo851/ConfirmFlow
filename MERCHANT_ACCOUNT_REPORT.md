# Merchant account report

## 1. Summary

A second account, `merchant@confirma.local`, was created with role `user`. Logged in at `/ar/login`, the dashboard shows the merchant shell and does not show the Admin group. `/ar/dashboard/admin` and `/ar/dashboard/admin/content` redirect back to `/ar/dashboard`. Orders and connections open for this account and are empty, so the existing WooCommerce store, Meta connection, and orders stay on the admin account.

The landing page now reveals every section below the hero, counts the new stats, and includes testimonials plus an FAQ accordion.

One isolation gap was left unchanged: the Team link (`/dashboard/team`) is still in the sidebar for role `user`. Hiding it would require editing the sidebar model, which this task said not to fix.

## 2. Merchant account created

yes

## 3. Email

merchant@confirma.local

## 4. Role confirmed

user

Profile id: `1b379850-0806-4f70-981d-a50d323224f3`. A second `npm run seed:merchant` printed "Merchant user already exists — skipping creation." and left the role as `user`.

## 5. Admin section hidden for non-admin

yes

`visibleSidebarGroups` keeps a group only when `isAdmin || !group.adminOnly`. The Admin group sets `adminOnly: true`. `isAdmin` is true only when `profiles.role` is `admin` or `owner`. Signed in as the merchant, the sidebar had no "الإدارة" group.

The Team item is not admin-only, so it still appears, marked قريباً.

## 6. Admin routes guarded

yes

`app/[locale]/dashboard/admin/layout.tsx` calls `requireDashboardAdmin`. That function loads `profiles.role` for the signed-in user and, when `isAdminRole` is false, redirects to `/dashboard`. Middleware does not check the admin role. Browser check: `/ar/dashboard/admin` and `/ar/dashboard/admin/content` both ended on `/ar/dashboard`.

## 7. What the merchant sees

- `/dashboard` (Overview)
- `/dashboard/orders` (empty state, no existing orders)
- `/dashboard/analytics`
- `/dashboard/connections` (YouCan, Shopify, WooCommerce, and Meta all disconnected)
- `/dashboard/connections/meta`
- `/dashboard/connections/webhooks`
- `/dashboard/tracking`
- `/dashboard/marketing`
- `/dashboard/wallet`
- `/dashboard/settings`
- `/dashboard/team` (sidebar link is visible; this was not changed)

## 8. What the merchant does not see

- Content CMS (`/dashboard/admin/content`) — sidebar hidden, route redirects to `/dashboard`
- Policies editor (`/dashboard/admin/policies`)
- User management (`/dashboard/admin/users`)
- App settings (`/dashboard/admin/settings`)
- The existing WooCommerce store, Meta connection, and orders

Team management is still linked in the sidebar.

## 9. Landing animations status

- Reveal on scroll for sections below the hero, with staggered card delays
- Count-up stats: 3 store platforms, 2 languages, 1 confirmation step, 5 steps to Meta
- Hover lift on landing cards
- Testimonials section
- FAQ accordion (one item open at a time)
- Reduced motion skips the count-up and the card hover transform

## 10. Tests

316/316

## 11. Typecheck

pass

## 12. Lint

pass

## 13. Files created

- `scripts/create-merchant-user.mjs`
- `components/marketing/count-up.tsx`
- `components/marketing/faq-list.tsx`
- `MERCHANT_ACCOUNT_REPORT.md`

## 14. Files modified

- `package.json` (added `seed:merchant` only)
- `app/[locale]/(marketing)/page.tsx`
- `app/globals.css`
- `messages/en/landing.json` (keys added)
- `messages/ar/landing.json` (keys added)

## 15. Status

uncommitted, awaiting approval
