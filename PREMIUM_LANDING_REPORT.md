# Premium landing report

## 1. Summary

The public landing page is visual-only polish. Brand marks are real SVGs in square cards, the five-step row is a circle timeline, Arabic and English copy is short and direct, sections share one width and rhythm, and motion is tied to scroll with `prefers-reduced-motion` support. Indigo and teal stay. Amber and emerald are accents. Integrations, auth, data, and `lib/videos` were not changed. Nothing was committed.

## 2. Brand SVGs added

All files are `viewBox="0 0 24 24"` with no text inside the mark.

| File | Mark | Fill |
| --- | --- | --- |
| `public/brands/meta.svg` | simple-icons Meta | `#0866FF` |
| `public/brands/tiktok.svg` | simple-icons TikTok | `#000000` |
| `public/brands/google.svg` | four-path Google G | `#4285F4` `#34A853` `#FBBC05` `#EA4335` |
| `public/brands/shopify.svg` | simple-icons Shopify bag | `#7AB55C` |
| `public/brands/instagram.svg` | simple-icons camera | yellow → pink → purple gradient |
| `public/brands/chatgpt.svg` | simple-icons OpenAI blossom | `#10A37F` |
| `public/brands/youcan.svg` | hand-drawn bag | `#E23B2F` |
| `public/brands/woocommerce.svg` | hand-drawn storefront | `#7F54B3` |

YouCan is not in simple-icons. The official WooCommerce simple-icons file is a wordmark. At 32×32 it collapsed into a dash, so the shipped file is a purple storefront with no letters.

The hero shows eight white rounded cards, a 32×32 mark, hover scale 1.05 plus a brand-colored glow, and a staggered bob. Under them: `مستخدم من قبل تجار في المغرب والعالم العربي`.

## 3. Texts rewritten

Keys were kept. Values were replaced. `trustedBy` was added in English and Arabic.

| Before | After |
| --- | --- |
| شاهد الطلبات المؤكدة / تصل إلى Meta | طلبات حقيقية فقط. / إعلانات أذكى. أرباح أكثر. |
| المشتريات المؤكدة فقط تصبح أحداث تحويل. | نرسل الطلبات المؤكدة فقط إلى Meta وTikTok وGoogle. تتعلم الإعلانات من زبائنك الحقيقيين. |
| إنشاء الطلب / تأكيد الطلب / Meta Conversion API | الطلب / التأكيد / Meta |
| هل أنت مستعد لإرسال بيانات تحويل أنظف؟ | وقف الخسارة على طلبات وهمية. |
| See confirmed orders / reach Meta | Only real orders. / Smarter ads. More profit. |

## 4. Numbered steps redesign

The five square cards are a timeline. A line runs indigo → teal behind 48px circles. Circles start white with an indigo border and fill indigo with a white number when the row is in view. Labels: المتجر، الطلب، التأكيد، Confirma، Meta. On small screens the line is vertical on the start side (left in LTR, right in RTL).

## 5. Motion added

- Hero words fade up, 50ms stagger.
- Logo cards bob from −4px to +4px over 3s, 150ms stagger, and fade up.
- Marquee loop is 40s.
- Feature cards fade up with 100ms stagger. Hover lifts 6px, adds shadow, and rotates the icon 5deg.
- Setup line draws with `scaleX` 0 → 1. Step circles pop from 0.8 to 1.
- Timeline line draws on enter. Circles pop in with delay.
- Stats row fades in, then numbers count, with an underline.
- Quotes fade up, sit at 2deg, and return to 0 on hover.
- FAQ panel uses the existing 250ms height transition. The chevron rotates 180deg.
- CTA gradient shifts on a 20s loop. The button has a 2s glow.
- Footer columns fade in 100ms apart. Link underlines grow from the inline start.

`prefers-reduced-motion` turns these animations off and shows the final state.

## 6. Palette refinements

- Primary stays indigo `#4F46E5`.
- Accent stays teal `#14B8A6`.
- Amber `#F59E0B` is used on the hero wash, the CTA gradient, and the stat underline.
- Emerald `#10B981` stays on success chips.
- Sections alternate a light indigo wash, white, and a light teal wash over one continuous mesh.

## 7. Files created

- `public/brands/meta.svg`
- `public/brands/tiktok.svg`
- `public/brands/google.svg`
- `public/brands/woocommerce.svg`
- `public/brands/shopify.svg`
- `public/brands/youcan.svg`
- `public/brands/instagram.svg`
- `public/brands/chatgpt.svg`
- `components/marketing/hero-words.tsx`
- `components/marketing/flow-timeline.tsx`
- `components/marketing/setup-track.tsx`
- `components/marketing/landing-heading.tsx`
- `PREMIUM_LANDING_REPORT.md`

## 8. Files modified

- `app/[locale]/(marketing)/page.tsx`
- `app/globals.css`
- `components/marketing/platform-row.tsx`
- `components/marketing/count-up.tsx`
- `components/marketing/faq-list.tsx`
- `components/marketing/landing-footer.tsx`
- `messages/ar/landing.json`
- `messages/en/landing.json`

## 9. Tests

318/318 passed (62 files).

## 10. Typecheck + lint

- `npm run typecheck`: pass
- `npm run lint`: pass, 0 problems

`/ar` was checked in the browser: crisp marks, the Arabic headline, the circle timeline in RTL, counting stats, and an FAQ item that opens with the chevron turned.

## 11. Files not touched

- `lib/integrations/woocommerce/**`
- `lib/integrations/meta/**`
- `lib/integrations/youcan/**`
- `lib/integrations/shopify/**`
- `app/api/integrations/woocommerce/**`
- `app/api/integrations/meta/**`
- `app/api/integrations/youcan/**`
- `app/api/integrations/shopify/**`
- `lib/auth/**`
- `lib/supabase/**`
- `lib/database/**`
- `lib/confirmation/**`
- `lib/orders/**`
- `lib/webhooks/**`
- `lib/logging/**`
- `lib/security/**`
- `lib/utils/**`
- `lib/config/**`
- `lib/videos/**`
- `middleware.ts`
- `next.config.ts`
- `.env.local`
- `database/migrations/**`
- `supabase/migrations/**`
- `app/api/auth/**`
- `app/api/orders/**`
- `app/api/dashboard/**`
- `app/api/supabase/**`
- `app/api/health/**`

Existing admin user, merchant user, WooCommerce store, Meta connection, and orders were not modified.

## 12. Status

uncommitted, awaiting approval
