# Enable Shopify on the onboarding store page

**Status:** uncommitted, awaiting approval

## 1. Summary

The Shopify tab on `/ar/onboarding/store` now shows the existing shop-domain field and Connect control. YouCan still shows «قريباً» and the waitlist. WooCommerce is unchanged. No Shopify, WooCommerce, YouCan, Meta, TikTok, or Google integration logic was edited.

## 2. File changed

`components/connections/store-provider-panel.tsx`

- Line 11: import `ShopifyConnectForm`.
- Lines 38–42: `ComingSoonProvider` now accepts only `"youcan"`.
- Line 117: the Shopify tab renders `<ShopifyConnectForm />` instead of the coming-soon panel.

## 3. What changed for Shopify

The Shopify tab no longer renders the dashed coming-soon card, the disabled «قريباً» button, or the waitlist form. It renders the existing form: label «نطاق متجر Shopify», placeholder `your-store.myshopify.com`, and «ربط Shopify». The button stays disabled until a shop is entered, then becomes a link to `/api/integrations/shopify/connect?shop=...`.

Checked in the browser on `http://127.0.0.1:3000/ar/onboarding/store` (Arabic, `dir=rtl`): typing `yhken8-ej` produced href `/api/integrations/shopify/connect?shop=yhken8-ej`. That link was not opened.

## 4. What stayed the same for YouCan

YouCan is still `ComingSoonProvider`: badge and disabled button «قريباً», subtitle «نعمل على إضافة هذه المنصة قريباً», and the email waitlist. YouCan connection code was not touched.

## 5. Shopify form readiness

| | |
|---|---|
| Exists | Yes. `components/connections/shopify-connect-form.tsx` was already present. It was not rewritten. |
| Wired | Yes. The store panel now renders it when the Shopify tab is active. |
| Functional | The form collects a shop and links to the existing connect route. End-to-end OAuth was not run. |

## 6. Shopify connect route readiness

`app/api/integrations/shopify/connect/route.ts` already exists. It normalizes `shop` and redirects to `https://{shop}/admin/oauth/authorize` with `client_id`, `scope`, `redirect_uri`, and `state`. It was not modified.

## 7. i18n changes

None. `connections.shopify` and `errors.shopify` already had the form strings in English and Arabic. Shared `comingSoon` / `waitlist` keys were left in place because YouCan still uses them.

## 8. Tests

326/326 passed (67 files).

## 9. Typecheck and lint

- `npm run typecheck`: pass
- `npm run lint`: pass (exit 0)

## 10. Files not touched

Integration logic and protected areas were not edited, including:

- `lib/integrations/shopify/**` and `app/api/integrations/shopify/**`
- Meta, WooCommerce, YouCan, TikTok, and Google integration trees and API routes
- `lib/auth/**`, `lib/supabase/**`, `lib/database/**`
- `lib/confirmation/**`, `lib/orders/**`, `lib/webhooks/**`
- `lib/content/**`, `lib/videos/**`, `lib/logging/**`, `lib/security/**`
- `lib/utils/**`, `lib/config/**`
- `middleware.ts`, `next.config.ts`, `.env.local`, `package.json`
- `database/migrations/**`, `supabase/migrations/**`
- `messages/en/*.json`, `messages/ar/*.json`
- `components/connections/shopify-connect-form.tsx`
- `components/connections/add-store-dialog.tsx` (dashboard “add store” still marks Shopify «قريباً»; that file was outside this task)

## 11. Status

uncommitted, awaiting approval
