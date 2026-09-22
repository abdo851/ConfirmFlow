# Confirma UI overhaul

status = "uncommitted, awaiting user approval"

## 1. Summary of design decisions

The interface now uses an indigo primary and a teal accent on a slate surface, with Inter for English and Cairo for Arabic. Existing routes, forms, server actions, and data loading are unchanged. New copy was added only where the layout needed a label that did not already exist.

The dashboard welcome banner does not insert a personal name. That page does not load a profile, and fetching one would be a data change. The banner uses the new “Welcome back” line plus the existing overview title.

Orders do not have a search or filter action, so no non-functional search box was added. The table is a sticky-header table from the `md` breakpoint up, and stacked cards below that.

Footer icons link to Home, Sign in, and Get started. They are not placeholder social-network profiles.

## 2. Design tokens added

Defined in `app/globals.css`:

- Colors: primary indigo, secondary teal, accent cyan, success emerald, warning amber, danger rose, slate neutrals, plus dark-mode values under `prefers-color-scheme`
- Type: `--font-inter` and `--font-cairo` (weights 400, 500, 600, 700), loaded with `next/font`
- Radius: existing Tailwind scale, applied as `rounded-xl` / `rounded-2xl` / `rounded-3xl` / `rounded-full`
- Shadows: `shadow-soft`, `shadow-medium`, `shadow-large`
- Motion: 150ms, 250ms, and 400ms ease-out, plus fade, slide, float, pulse, shimmer, toast, dialog, and drawer keyframes
- `prefers-reduced-motion` disables those animations and press/hover transforms

## 3. Components refined

- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/card.tsx`
- `components/ui/badge.tsx`
- `components/layout/site-header.tsx`
- `components/layout/site-footer.tsx`
- `components/layout/language-switcher.tsx`
- `components/layout/dashboard-shell.tsx`
- `components/dashboard/sidebar.tsx`
- `components/dashboard/connection-status.tsx`
- `components/dashboard/setup-progress.tsx`
- `components/dashboard/recent-events-placeholder.tsx`
- `components/onboarding/step-nav.tsx`
- `components/onboarding/step-shell.tsx`
- `components/onboarding/overview-steps.tsx`
- `components/orders/orders-list.tsx`
- `components/orders/order-status-badge.tsx`
- `components/connections/connection-status-badge.tsx`
- `components/connections/connection-state-item.tsx`

## 4. Components added

- `components/ui/toast.tsx`
- `components/ui/dialog.tsx`
- `components/ui/tooltip.tsx`
- `components/ui/skeleton.tsx`
- `components/ui/reveal.tsx`

## 5. Pages redesigned

- `app/[locale]/(marketing)/page.tsx`
- `app/[locale]/(auth)/layout.tsx`
- `app/[locale]/(auth)/login/page.tsx`
- `app/[locale]/(auth)/signup/page.tsx`
- `app/[locale]/onboarding/layout.tsx`
- `app/[locale]/onboarding/page.tsx`
- `app/[locale]/dashboard/page.tsx`
- `app/[locale]/dashboard/orders/page.tsx`
- `app/[locale]/dashboard/connections/page.tsx`
- `app/[locale]/layout.tsx` (fonts and page background)
- `app/globals.css`

Provider connect forms, API routes, and `lib/` were not rewritten. Buttons, inputs, badges, and cards pick up the new styles where those screens already use them.

## 6. Responsive breakpoints used

- Mobile: default through `640px` (`sm`), padding `p-4`, stacked actions, sidebar and marketing nav as drawers, orders as cards
- Tablet: `sm` to `lg` (`1024px`), padding `p-6`
- Desktop: `lg` and up, padding `p-8`, persistent sidebar, orders table
- Wide: content capped at `max-w-6xl`

Touch targets on primary controls use at least `min-h-11` (44px).

## 7. RTL considerations

- Navigation, drawers, badges, and progress bars use logical properties (`start`/`end`, `ps`/`pe`, `border-s`, `border-e`)
- Drawer motion swaps direction under `html[dir="rtl"]`
- Arabic pages use Cairo; English pages use Inter
- Existing translation keys were kept. New keys were added in both `en` and `ar`

## 8. Test results

270/270

## 9. Typecheck result

pass

Lint: pass, no new errors.

## 10. Screenshots recommended

- `/en` and `/ar` landing, including the mobile menu
- `/en/login` and `/ar/signup`
- `/en/onboarding` and `/ar/onboarding/store` while WooCommerce is connected
- `/en/dashboard`, `/en/dashboard/orders` (empty and with rows), `/en/dashboard/connections`
- Desktop sidebar collapsed and expanded
- A narrow 375px viewport for the orders cards and the dashboard drawer

## 11. Status

status = "uncommitted, awaiting user approval"
