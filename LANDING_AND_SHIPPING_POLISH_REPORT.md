# Landing and shipping polish

Status: uncommitted, awaiting approval

## 1. Summary

Shipping cards now use short locale-specific descriptions, a new header, the Ameex wordmark, and a confirmation-provider preview card. A dashboard workflow preview page and Setup sidebar item were added. Signup and login copy and the shared blue panel were updated, and login gained a password visibility toggle. The landing hero, founder line, FAQ, and how-it-works section were rewritten in place. French was not added. The default locale was already English.

## 2. Shipping card changes

- Header title and subtitle were replaced in `messages/en/dashboard.json` and `messages/ar/dashboard.json`.
- Each provider has a short English line and a concrete Arabic line under `dashboard.shipping.providers`. The card reads the active locale instead of always showing Arabic.
- Ameex logo: the site wordmark was downloaded from `https://ameex.ma` (`/_next/static/media/Logo.77ee9529.png`, valid PNG) and saved as `public/shipping/ameex.png`. `lib/shipping/data.ts` points at that file and stores the new English description.
- A preview card sits under the grid: Confirmation Provider / شركة التأكيد, amber “Coming Soon” / قريباً, no connect button.

## 3. Workflow page created

- New page: `app/[locale]/dashboard/workflow/page.tsx`.
- Five steps: Store, New Order, Confirmation, Meta / TikTok / Google (جاهز / Ready), Shipping Company (قريباً / Coming soon).
- Desktop is a row; narrow screens stack. Arrows are a pulse between cards. Header badge: قيد التطوير / In development.
- Sidebar Setup item: مسار الطلبات / Workflow, route `/dashboard/workflow`.
- `tests/unit/sidebar-nav.test.ts` was updated so the new group stays in the expected order (non-admin length 11, admin length 12). No API route and no shipping data-model change.

## 4. Signup / login changes

- Username placeholder is `your-username` / `اسم-المستخدم`, with helper text for lowercase letters, numbers, and hyphens. The signup check allows hyphens. Username is still not stored by the auth action.
- Shared auth panel (`loginSub`, `trust1`–`trust3`): language bullet removed by replacing `trust3`. Kept real confirmed orders and direct delivery to Meta, TikTok, and Google. Third bullet: Works with WooCommerce & YouCan.
- Sub-headline: من الطلب إلى الإعلان — في دقائق. / From order to ad signal — in minutes.
- Login password field uses `components/auth/password-field.tsx` (inline eye, logical end of the field).

## 5. Landing changes

- Hero bullets: Real confirmed orders; Direct delivery to Meta, TikTok, Google; WooCommerce & YouCan ready. No Arabic-language bullet.
- Founder quote is the neutral brand line. Avatar letter is C. Role is Confirma.
- FAQ answers for the existing four questions were rewritten. Two entries were added: WooCommerce & YouCan, and Meta App Review. The review answer says Confirma does not submit an app for review; the merchant’s own pixel still follows Meta’s rules.
- The numbered how-it-works illustration was replaced by a four-counter board (100K+, 30%+, 5 min, 3 platforms) that counts up on scroll. Those figures are the requested marketing numbers, not measured Confirma totals. Old step keys remain in the message files.

## 6. French language status

Blocked. `tests/unit/i18n.test.ts` requires `locales` to equal `["en", "ar"]` and `isAppLocale("fr")` to be false. Adding `fr` would fail that suite. `isAppLocale` lives in `lib/i18n/locales.ts`, which is outside the allowed edit list. `i18n/routing.ts` was not changed.

## 7. Default locale status

Already English. `i18n/routing.ts` has `defaultLocale: "en"` and `localePrefix: "always"`. `middleware.ts` was not edited. A request to `http://127.0.0.1:3000/` returned `307` with `location: /en`.

## 8. Files created

- `app/[locale]/dashboard/workflow/page.tsx`
- `components/auth/password-field.tsx`
- `components/marketing/stats-board.tsx`
- `public/shipping/ameex.png`
- `LANDING_AND_SHIPPING_POLISH_REPORT.md`

The shipping section from the previous pass is still untracked: `app/[locale]/dashboard/shipping/`, `components/shipping/`, `lib/shipping/`, the rest of `public/shipping/`, and `SHIPPING_SECTION_REPORT.md`.

## 9. Files modified

- `app/[locale]/(auth)/login/page.tsx`
- `app/[locale]/(marketing)/page.tsx`
- `app/[locale]/dashboard/orders/page.tsx`
- `app/[locale]/dashboard/shipping/page.tsx` (untracked folder)
- `components/auth/signup-form.tsx`
- `components/dashboard/sidebar-model.ts`
- `components/dashboard/sidebar.tsx`
- `components/marketing/founder-line.tsx`
- `components/shipping/shipping-card.tsx`
- `components/ui/button.tsx`
- `lib/shipping/data.ts`
- `messages/ar/auth.json`
- `messages/ar/dashboard.json`
- `messages/ar/landing.json`
- `messages/ar/navigation.json`
- `messages/en/auth.json`
- `messages/en/dashboard.json`
- `messages/en/landing.json`
- `messages/en/navigation.json`
- `tests/unit/sidebar-nav.test.ts`

## 10. Tests

326/326 passed (67 files).

## 11. Typecheck and lint

- `npm run typecheck`: pass (exit 0)
- `npm run lint`: pass (exit 0, no warnings)

## 12. Files not touched

- `lib/integrations/**`
- `app/api/integrations/**`
- `lib/auth/**`, `lib/supabase/**`, `lib/database/**`
- `lib/confirmation/**`, `lib/orders/**`, `lib/webhooks/**`
- `lib/content/**`, `lib/videos/**`, `lib/logging/**`, `lib/security/**`
- `lib/utils/**`, `lib/config/**`
- `middleware.ts`, `next.config.ts`, `.env.local`, `package.json`
- `database/migrations/**`, `supabase/migrations/**`
- `app/api/auth/**`, `app/api/orders/**`, `app/api/dashboard/**`
- `app/api/supabase/**`, `app/api/health/**`
- `i18n/routing.ts`, `lib/i18n/locales.ts`
- Existing users, stores, connections, orders, and shipping records

Credential scripts `scripts/add-google-connection.mjs` and `scripts/add-tiktok-connection.mjs` remain untracked and were not staged.

## 13. Verification note

The process on port 3000 still served the previous message catalog: new landing keys appeared as raw ids (`landing.heroTrust1`) while the page structure itself updated. That server was not restarted. Root redirect to `/en` was confirmed. Signup, login, shipping, and workflow were not clicked through in the browser against a reloaded catalog.

## 14. Status

uncommitted, awaiting approval
