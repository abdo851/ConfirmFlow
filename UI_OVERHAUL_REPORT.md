# UI overhaul report

Status: uncommitted, awaiting user approval

## 1. Summary

Dashboard orders now use one Actions menu. Statuses the database can store are wired to the existing confirm, reject, and archive actions. Statuses the database cannot store stay visible and are marked قريباً in red, and they do not write anything.

Unfinished sidebar and hub links keep their destinations and now show a red قريباً badge with the tooltip "قيد التطوير — سيُفعّل قريباً".

The content admin form only asks for the fields each essential block type needs. Drag reorder and the active toggle stay.

Mobile layout uses the existing slide-in sidebar, stacks orders, webhooks, and Meta deliveries as cards, and keeps the top bar as hamburger, page title, and avatar.

An earlier visual pass (hero, login, sidebar grouping, stat tones, onboarding checklist) is still in this same uncommitted tree. Design tokens were not changed. No dependencies were added. Nothing was committed or pushed.

## 2. Order status actions

One button, "إجراءات" / "Actions", opens the menu on the orders list (cards and table) and on the order detail page.

| Menu item | Stored? | Behavior |
| --- | --- | --- |
| قيد المراجعة (pending) | Enum exists | قريباً. No existing action sets a status back to pending, and adding one would require `lib/confirmation` or `lib/orders`. |
| تم التأكيد (confirmed) | Yes | Calls the existing `confirmOrderRequest` when the order is pending. |
| مرفوض (rejected) | Yes | Calls the existing `rejectOrderAction` when the order is pending. |
| قيد التوصيل (shipped) | No | قريباً in red. Not stored. |
| تم التوصيل (delivered) | No | قريباً in red. Not stored. |
| مرتجع (returned) | No | قريباً in red. Not stored. |
| ملغى (cancelled) | No | قريباً in red. Not stored. This is not wired to reject. |
| مؤرشف (archived) | Yes | Calls the existing `archiveOrderAction` when the order is confirmed or rejected. |

Rejected stays in the menu because the database and the existing reject action support it. Cancelled stays a separate coming-soon item.

## 3. Coming soon badges

Red badge `قريباً` plus tooltip "قيد التطوير — سيُفعّل قريباً" (English tooltip: "In development — this will turn on soon."). Links were not removed.

Sidebar:

- Marketing group, Campaigns, Audiences, Message templates
- Google Tag Manager, TikTok Events
- Transactions, Invoices
- Team

Hub cards:

- `/dashboard/marketing` — campaigns, audiences, templates
- `/dashboard/tracking` — GTM and TikTok only
- `/dashboard/wallet` — transactions and invoices

Pixel settings, Conversion API, stores, webhooks, orders, analytics, and overview are not badged.

## 4. Admin CMS simplification

`/dashboard/admin/content` new-block flow is three steps: choose Text, Video, or Banner; fill the fields for that type; publish.

- Text: title and body
- Video: title, description, YouTube URL
- Banner: title, description, optional image URL, optional button label and link
- Active toggle stays
- Drag-and-drop reorder stays
- Locale picker is hidden. The form still submits the existing locale (default `both`) so the current save action keeps working
- Extra JSON was not a form field. The save action still clears `extra`; changing that would require `lib/content`
- The Ad type is no longer offered for new blocks. An existing ad block can still be edited with banner fields
- `lib/content/blocks.ts` and the block schema were not modified

## 5. Mobile responsiveness

Checked at 375px (iPhone SE metrics) on `/ar/dashboard/orders` and the content admin.

- Sidebar: hamburger opens the existing slide-in drawer. Desktop sidebar stays hidden below `lg`
- Top bar: hamburger, current page title, language control, and the account avatar
- Orders: cards below `md`, table from `md` up. Actions buttons measure 44px tall
- Webhooks and Meta delivery rows: cards below `md`, tables from `md` up
- Overview recent orders: stacked rows
- Stat cards: 1 column, 2 from `sm`, 4 from `xl` on the overview and analytics
- Sparkline: full width of its section
- Analytics date fields and content form inputs: full width, 44px minimum height
- Section titles scale from `text-xl` to `text-3xl`
- Shell padding stays `px-4 py-6`, then `sm:px-6 sm:py-8`, then `lg:px-8`
- Drawer, tooltip, and other motion classes stay off under `prefers-reduced-motion`
- Arabic pages use `dir="rtl"`. English pages use `dir="ltr"`

## 6. Fixes applied

- Orders list and order detail now share the Actions menu instead of a single confirm button. Confirm, reject, and archive still use the existing actions
- Pending is shown as coming soon because there is no existing writer for that transition. No protected file was edited to add one
- Content "add" and "edit" links from the block list now open the dashboard content routes, which use the simplified form

## 7. Tests

316/316 passed (`npm run test`, 61 files).

## 8. Typecheck

Pass (`npm run typecheck`).

## 9. Lint

Pass (`npm run lint`, exit 0).

## 10. Files not touched

Protected categories were not modified:

- `lib/integrations/woocommerce/**`, `lib/integrations/meta/**`, `lib/integrations/youcan/**`, `lib/integrations/shopify/**`
- `app/api/integrations/woocommerce/**`, `app/api/integrations/meta/**`, `app/api/integrations/youcan/**`, `app/api/integrations/shopify/**`
- `lib/auth/**`, `lib/supabase/**`, `lib/database/**`, `lib/confirmation/**`, `lib/orders/**`, `lib/webhooks/**`, `lib/content/**`, `lib/logging/**`, `lib/security/**`, `lib/utils/**`, `lib/config/**`
- `middleware.ts`, `next.config.ts`, `tsconfig.json`, `.env.local`, `.env.example`, `package.json`
- `database/migrations/**`, `supabase/migrations/**`
- `app/api/auth/**`, `app/api/orders/**`, `app/api/dashboard/**`, `app/api/supabase/**`, `app/api/health/**`

Existing translation keys were not renamed or removed. New keys were added under `orders.actionsMenu`, `dashboard.pages.comingSoonShort`, `dashboard.pages.comingSoonHint`, `admin.chooseType`, and `admin.publish`.

## 11. Status

uncommitted, awaiting user approval

## 12. Animation helpers

Use the client hooks in `lib/animations` and the keyframes in `app/globals.css`. No new packages.

A block reveals when it scrolls into view:

```html
<div data-animate="fade-up" data-delay="200">...</div>
```

`data-animate` accepts `fade-in`, `fade-up`, `fade-down`, `fade-left`, `fade-right`, `scale-in`, and `rotate-in`. Set `data-visible="true"` when `useReveal` reports the element is on screen. `data-delay` is milliseconds and maps to `animation-delay`.

`useCountUp(target, active)` eases a number from 0 to `target` with `requestAnimationFrame`. It jumps to the final number when the user prefers reduced motion.

Other keyframes: `pulse-soft`, `glow`, `float`, `shimmer`. Icons inside a revealed block can use the class `appear-pulse` to pulse once.
