# UI polish pass

Status: uncommitted, awaiting user approval

## 1. Summary

Visual refinement of the marketing, dashboard, orders, connections, auth, and onboarding surfaces. Existing indigo, teal, Inter, and Cairo tokens stay in place. Data loading, confirmation, and provider connect flows are unchanged.

Dashboard stat numbers are an em dash, and the 7-day chart is a CSS placeholder. The overview page does not load orders, so it does not invent counts.

Order status tabs filter the list already loaded in the browser. Statuses the product does not store (in review, rejected, archived) show a count of 0. Confirm still posts to the existing confirm route. There is no order-detail route, so rows do not navigate to a new page.

Export CSV and Google sign-in are disabled controls with a short note. Forgot password is disabled the same way. No new routes were added.

## 2. New UI components

- `components/ui/stat-card.tsx`
- `components/ui/empty-state.tsx`
- `components/ui/section-heading.tsx`
- `components/ui/sparkline.tsx`

## 3. Pages touched

- Landing page
- Dashboard overview
- Orders page and orders list
- Connections cards
- Login, signup, and the auth layout
- Site footer
- Onboarding step navigation already shows a check on visited steps; no flow change

## 4. Motion

CSS mesh background, count fade, sparkline rise, existing hover lift, button press, toast, dialog, and skeleton shimmer. All of the new motion is disabled under `prefers-reduced-motion`.

## 5. Responsive and RTL

Landing, stats, and orders stack on small screens. The orders table stays hidden below `md` and the card list stays visible. Auth illustration is hidden below `lg`. Spacing uses logical properties (`text-start`, `border-s`, `ps`/`pe` where already used).

## 6. Test results

`npm run test`: 282/282 passed (45 files). The suite is 282, not 279, because the WooCommerce webhook tests added earlier are still included. No tests were removed.

`npm run lint`: pass, no new errors.

## 7. Typecheck

`npm run typecheck`: pass.

## 8. Screenshots to review

- `/en` and `/ar` landing, including pricing and the final gradient
- `/en/login` and `/ar/login` split layout
- `/en/dashboard` and `/ar/dashboard`
- `/en/dashboard/orders` with status tabs
- `/en/dashboard/connections` connected and disconnected cards
- `/en/onboarding/store`

## 9. Status

uncommitted, awaiting user approval
