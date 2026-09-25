# UI fixes

## 1. Summary

Ten visual and copy changes are in the dashboard, signup, theme, and Arabic strings. Integrations, middleware, migrations, and existing store data were left as they are.

## 2. Task status

1. **Orders Actions menu** — done. The menu renders in a portal on `document.body`, positioned from the button, and closes on outside click, Escape, or scroll. The account menu uses the same portal.
2. **Dashboard video bar** — done. An active `dashboard_top` video renders as a full-width bar (thumbnail, title, Watch now, dismiss stored in localStorage). `onboarding_top` uses the same bar. Landing hero is unchanged.
3. **Numeric placement** — done in the video CMS. The form uses a position number. Landing is locked to position 1 and still saves `placement=landing_hero` in a hidden field. Dashboard and onboarding keep their existing placement values.
4. **Avatar chevron** — done on the top-bar avatar, the sidebar account card, and the signed-in landing header. Hover rotates the chevron slightly and highlights the control.
5. **Greeting** — done. The dashboard heading reads `profiles.full_name`, then `user_metadata.full_name`, then the email name, then “there” / “بك”.
6. **Signup** — done. Full name, email, password, and confirm password, with show/hide on both password fields and inline errors. `full_name` is passed to Supabase user metadata.
7. **Theme** — done. Account menu has Light, Dark, and System. The choice is stored in localStorage and a `confirma-theme` cookie, and applied with `class="dark"` on `<html>`. Neutrals invert; indigo and teal stay.
8. **Add store** — done on Connections. WooCommerce goes to `/onboarding/store?add=new`. YouCan and Shopify stay disabled as coming soon. No backend change.
9. **Arabic Fusha** — done for the Darija copy on the landing page, plus the new UI strings. English strings were not changed.
10. **English default and language switcher** — default locale was already `en`, and middleware already follows that config, so middleware was not edited. The switcher now shows 🇬🇧 English and 🇲🇦 العربية and uses `router.replace` with the locale. `fr` was not added.

## 3. Files created

- `components/marketing/dashboard-video-bar.tsx`
- `components/theme/theme-watcher.tsx`
- `components/auth/signup-form.tsx`
- `components/connections/add-store-dialog.tsx`
- `UI_FIXES_REPORT.md`

## 4. Files modified

- `app/[locale]/(auth)/signup/page.tsx`
- `app/[locale]/dashboard/page.tsx`
- `app/[locale]/dashboard/connections/page.tsx`
- `app/[locale]/onboarding/page.tsx`
- `app/[locale]/layout.tsx`
- `app/globals.css`
- `components/admin/video-manager.tsx`
- `components/layout/language-switcher.tsx`
- `components/layout/site-header.tsx`
- `components/layout/user-menu.tsx`
- `components/orders/order-actions-menu.tsx`
- `components/ui/input.tsx`
- `lib/auth/actions.ts`
- `lib/auth/signup-flow.ts`
- `messages/en/admin.json`
- `messages/en/auth.json`
- `messages/en/dashboard.json`
- `messages/en/navigation.json`
- `messages/ar/admin.json`
- `messages/ar/auth.json`
- `messages/ar/dashboard.json`
- `messages/ar/landing.json`
- `messages/ar/navigation.json`

## 5. Tests

326/326 passed.

## 6. Typecheck and lint

- `npm run typecheck`: passed.
- ESLint on the changed files: no errors. One `<img>` warning was removed by using a background thumbnail.

## 7. Files not touched

- `lib/integrations/**`
- `app/api/integrations/**`
- `lib/auth/server.ts`, `lib/auth/client.ts`, `lib/supabase/**`
- `lib/confirmation/**`, `lib/orders/**`, `lib/webhooks/**`
- `lib/content/**`, `lib/videos/**`, `lib/logging/**`, `lib/security/**`
- `lib/utils/**`, `lib/config/**`
- `middleware.ts`, `next.config.ts`, `.env.local`, `package.json`
- `database/migrations/**`, `supabase/migrations/**`
- `app/api/auth/**`, `app/api/orders/**`, `app/api/dashboard/**`, `app/api/supabase/**`, `app/api/health/**`
- Existing users, stores, Meta/TikTok/Google connections, orders, and deliveries

## 8. Status

uncommitted, awaiting approval

## 9. Known limitations

- There is no `tailwind.config.ts`. This app uses Tailwind 4, so `dark` is enabled in `app/globals.css` with `@custom-variant dark`.
- `middleware.ts` was not edited. Unprefixed visits already redirect to `/en` because `defaultLocale` is `en` and `localePrefix` is `always`.
- `fr` was not added. The i18n test requires locales to be exactly `["en", "ar"]` and `isAppLocale("fr")` to be false. Adding French later is one entry in `i18n/routing.ts` plus `messages/fr`.
- The dashboard bar shows the one active `dashboard_top` video with the lowest `position`. The existing reader returns a single row, and no new video query was added. Positions 2 and 3 are saved, but they do not stack on the page yet.
- Password length of 8 characters is checked in the signup form. The signup flow branches were not changed, so Supabase still receives whatever password the action is given.
- If `profiles.full_name` is empty, the greeting falls back to the email name. The existing test account will show that until a full name is stored.
- Logged-in screens were not opened in a browser in this session.
