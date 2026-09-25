# Video and menu report

## 1. Summary

The landing sections below the hero now share the hero mesh, spacing, radius, and reveal motion. The dashboard top bar, the sidebar account card, and the landing header (when signed in) open the same account menu. Videos are a separate table from content blocks, with an admin page, a thumbnail-first player, and placements for the landing hero, onboarding, and dashboard.

## 2. Landing consistency

Each of these sections uses `section-premium`: full-width indigo/teal mesh, blurred floating shapes, `py-16` then `lg:py-24`, and no hard divider between sections.

- Feature grid
- How it works
- Steps
- Stats (المسار بالأرقام), with count-up numbers
- Testimonials
- Pricing
- Proof
- FAQ accordion
- CTA band
- Footer

Cards stay `rounded-2xl`. Proof and the CTA stay `rounded-3xl`. Section titles and cards use `data-animate="fade-up"` with a stagger. Icons use `appear-pulse` once when the card appears.

## 3. User menu

Component: `components/layout/user-menu.tsx`.

It appears on:

- Dashboard top bar (avatar)
- Sidebar account card (opens upward)
- Landing header when a session exists. Signed-out visitors still see تسجيل الدخول and ابدأ الآن.

Items:

- معلومات الحساب → `/dashboard/settings/account`
- الملف الشخصي → `/dashboard/settings/account`
- الإعدادات → `/dashboard/settings`
- الإشعارات → `/dashboard/settings/notifications` (red dot only when `unreadCount` is greater than 0; nothing supplies unread items yet, so the dot stays off)
- اللغة → العربية / English through the existing locale router
- Divider
- تسجيل الخروج in red, using the existing `logoutAction`

The menu closes on outside click and Escape. Arrow Up and Arrow Down move between items.

Verified in the browser on `/ar` while signed in: the menu opened with those items, and logout returned to `/ar/login`. Signed out, the header shows the login and start buttons again.

## 4. Video system

- New file `database/migrations/012_video_blocks.sql`. The existing `012_order_confirmation_status.sql` was not edited.
- Mirror: `supabase/migrations/20260925120000_video_blocks.sql`.
- The SQL was applied on the linked database. `public.video_blocks` exists with placement, active, and position indexes, public read of active rows, and admin-only insert/update/delete.
- `lib/videos/types.ts`, `youtube.ts`, `queries.ts`, `actions.ts`.
- Reads of a placement use the user client. Writes use the service-role client after an admin role check.
- Admin page: `/dashboard/admin/videos` (also linked in the admin sidebar).
- Player: `components/marketing/video-embed.tsx`. Before play it shows the YouTube thumbnail and a gradient play button. The iframe loads only after the click.
- `landing_hero` sits beside the hero copy on desktop and below it on small screens.
- `onboarding_top` renders at the top of onboarding.
- `dashboard_top` renders at the top of the dashboard and can be dismissed.

A temporary hero row was inserted, `/ar` showed the title "Confirma preview" and the thumbnail `https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg` with no iframe, then that row was deleted. The landing hero is empty again until a real video is saved.

## 5. Animations utility

- `lib/animations/use-reveal.ts` returns `{ ref, isVisible, delay, direction }`.
- `lib/animations/use-count-up.ts` animates from 0 and respects reduced motion.
- Keyframes in `app/globals.css`: `fade-in`, `fade-up`, `fade-down`, `fade-left`, `fade-right`, `scale-in`, `rotate-in`, `pulse-soft`, `glow`, `float`, `shimmer`.
- Usage is documented in `UI_OVERHAUL_REPORT.md` section 12: `<div data-animate="fade-up" data-delay="200">`.

## 6. Files created

- `database/migrations/012_video_blocks.sql`
- `supabase/migrations/20260925120000_video_blocks.sql`
- `lib/videos/types.ts`
- `lib/videos/youtube.ts`
- `lib/videos/queries.ts`
- `lib/videos/actions.ts`
- `lib/animations/use-reveal.ts`
- `lib/animations/use-count-up.ts`
- `components/layout/user-menu.tsx`
- `components/marketing/video-embed.tsx`
- `components/marketing/placement-video.tsx`
- `components/admin/video-manager.tsx`
- `app/[locale]/dashboard/admin/videos/page.tsx`
- `tests/unit/video-youtube.test.ts`
- `VIDEO_AND_MENU_REPORT.md`

## 7. Files modified

- `app/[locale]/(marketing)/page.tsx`
- `app/[locale]/(marketing)/layout.tsx`
- `app/[locale]/dashboard/page.tsx`
- `app/[locale]/onboarding/page.tsx`
- `app/globals.css`
- `components/dashboard/sidebar.tsx`
- `components/dashboard/sidebar-model.ts`
- `components/layout/dashboard-shell.tsx`
- `components/layout/site-header.tsx`
- `components/marketing/landing-footer.tsx`
- `components/ui/reveal.tsx`
- `messages/en/navigation.json`
- `messages/ar/navigation.json`
- `messages/en/admin.json`
- `messages/ar/admin.json`
- `messages/en/dashboard.json`
- `messages/ar/dashboard.json`
- `UI_OVERHAUL_REPORT.md`

Earlier uncommitted work (merchant seed script, landing scroll sections, `package.json` `seed:merchant`) is still in the tree and was not part of this change.

## 8. Tests

318/318

## 9. Typecheck

pass

## 10. Lint

pass

## 11. Files not touched

- `lib/integrations/woocommerce/**`, `lib/integrations/meta/**`, `lib/integrations/youcan/**`, `lib/integrations/shopify/**`
- `app/api/integrations/**`
- `lib/auth/**`, `lib/supabase/**`, `lib/database/**`, `lib/confirmation/**`, `lib/orders/**`, `lib/webhooks/**`, `lib/content/**`, `lib/logging/**`, `lib/security/**`, `lib/utils/**`, `lib/config/**`
- `middleware.ts`, `next.config.ts`, `.env.local`
- Existing files under `database/migrations/**` and `supabase/migrations/**` (only new files were added)
- `app/api/auth/**`, `app/api/orders/**`, `app/api/dashboard/**`, `app/api/supabase/**`, `app/api/health/**`
- Admin user, merchant user, WooCommerce store, Meta connection, and existing orders

## 12. Status

uncommitted, awaiting approval

## 13. How to test

1. Sign in as the admin at http://localhost:3000/ar/login
2. Open http://localhost:3000/ar/dashboard/admin/videos
3. Create a video with a YouTube URL and placement `landing_hero`
4. Open http://localhost:3000/ar and confirm the hero shows the thumbnail and play button, not an empty iframe
5. Click the play button to load YouTube
