# CRO suggestions

## 1. Executive summary

The page explains the product. It does not yet prove it. A Moroccan COD merchant is asked to start free, then meets quotes signed by Confirma, stats that count platforms and steps, and a Pro card that says billing is off.

Signup is already in the header, the hero, the proof band, and the final band. The leak is trust, not button count. The sub-headline also names TikTok and Google while only Meta Purchase is live.

Do not invent “500 merchants”, G2 stars, or a money-back promise until those things exist. The highest-leverage move is an honest before/after example, real proof or none, and one offer: free, no card, Meta only, today.

## 2. Current landing audit (Part A)

Section order on `app/[locale]/(marketing)/page.tsx`:

1. Hero: tagline, two-line headline, sub-headline, signup, login, eight brand cards, “trusted by” line, marquee. A hero video renders only if an admin has saved `landing_hero`. That slot is empty unless a row exists.
2. Feature grid (`#features`): six cards, no title, no button.
3. How it works (`#how-it-works`): three setup cards, then the five-circle timeline.
4. Second feature grid: six more cards under “ثلاث خطوات فقط”.
5. Stats (`#stats`): 3, 2, 1, 5. These count platforms, languages, the confirmation gate, and steps. They are not customers or money saved.
6. Testimonials (`#testimonials`): three quotes. The roles are التأكيد / اللغة / الخصوصية, not merchants.
7. Pricing: Basic “ابدأ مجاناً” and Pro “معاينة فقط. الفوترة موقفة.” Neither card is a link.
8. Proof band (`#proof`): product quote signed “Confirma”, then signup.
9. FAQ (`#faq`): four questions. One answer says prices are a visual preview.
10. Final band: signup plus `mailto:privacy@confirma.local`.
11. Footer: product links, login, signup, the same mailto, policy links.

### CTAs

| Place | Label | Goes to |
| --- | --- | --- |
| Header, desktop and mobile menu | تسجيل الدخول | `/login` |
| Header | ابدأ الآن (`navigation.getStarted`) | `/signup` |
| Hero | ابدأ مجاناً | `/signup` |
| Hero | تسجيل الدخول | `/login` |
| Proof band | ابدأ الآن | `/signup` |
| Final band | ابدأ مجاناً | `/signup` |
| Final band | هضر معانا | `mailto:privacy@confirma.local` |
| Footer | login, signup, mailto, policy pages, in-page anchors | mixed |

Primary CTA is signup. It appears four times in the page body/header, plus once more in the footer. Secondary CTA is login in the hero, and a talk link that opens a privacy mailbox.

### Checklist

| Question | Answer |
| --- | --- |
| Social proof | Weak. The trusted-by line names no store. Quotes are the product describing itself. |
| Pricing teaser | Yes, and it says billing is off. |
| Urgency | No. |
| Lead magnet | No. “Start free” is the only offer, and FAQ says billing is a preview. |
| Video | Slot exists. Nothing plays until an admin adds `landing_hero`. |
| Live chat / WhatsApp | No. |
| Demo request form | No. |
| Trust badges | Encryption is a feature card, not a badge row. No SSL, GDPR, or “made in Morocco” mark. |
| Comparison table | No. |
| Money-back guarantee | No. Do not add one while billing is off. |
| “No credit card” | Not stated. Uncertain whether signup collects a card. The page never says it does not. |
| “1-click install” | No, and it would be false. Setup is store connect, then Meta pixel and token, then confirm. |

## 3. CRO ideas (Part B)

### B1. Hero

1. Headline: «توقف عن الدفع لفيسبوك مقابل طلبات ما تخلّصاتش.» Names the waste.
2. Headline: «100 طلب COD. 40 مؤكد. فيسبوك يشوف 40.» Shows the gate with an example, labeled مثال.
3. Headline: «كل طلب مؤكد = Purchase واحد في Meta.» One mechanism, no extra platforms.
4. Headline: «متجرك على WooCommerce. إعلانك على فيسبوك. التأكيد في الوسط.» Local and concrete.
5. Headline: «ما تبعتش السلة المتروكة لفيسبوك.» Sharp, and only true if abandoned carts are actually excluded. Confirm that before using it.
6. Sub: «الطلب اللي ما تؤكّدوش ما يتبعتش. الخوارزمية تتعلم من اللي خلّص.»
7. Sub: «WooCommerce وYouCan. بلا مراجعة من Meta. بالعربية.» Three differentiators in one line.
8. Sub: «اربط المتجر، أكّد الطلب، نبعث Purchase واحد.» Setup in the order the merchant does it.
9. Sub: «TikTok وGoogle غادي يجيو. اليوم غير Meta.» Honest. The current line names all three as if they send today.
10. Sub: «تاجر COD في المغرب: فيسبوك كيتعلم من الطلبات الوهمية إلا ما حبستهاش.»
11. Button: «اربط المتجر مجاناً» — outcome, not “start”.
12. Button: «شوف كيفاش يتأكد الطلب» — only if it scrolls to a real demo, not another slogan.
13. Button: «جرّب على طلب واحد» — lower fear than a platform signup.
14. Button: «احسب شحال كتضيّع» — leads into a calculator, not a dead end.
15. Button: keep «ابدأ مجاناً» and add under it «بلا بطاقة. الفوترة مازال موقفة.»
16. Hero visual: a static order card, الحالة مؤكد, and a single “Purchase sent” line. Better than another gradient.
17. Hero visual: 20-second loom of Woo order → confirm → Events Manager. Use the existing video slot. Do not autoplay.
18. Hero visual: do not add a floating dashboard until the card shows a real confirm action. Motion without the gate does not convert.
19. Urgency: «أول 100 متجر: مجاناً حتى نطلق الفوترة.» Only if you will honor it. Write the cap down.
20. Urgency to avoid: a countdown with no deadline, and “limited spots” with no cap.

### B2. Social proof

21. Replace the three self-quotes with one merchant: name, city, store platform, one number they agree to publish. If you have zero, delete the section.
22. Logo wall: store marks you have permission to show. Zero logos is better than the current platform marquee pretending to be customers. The marquee is integrations, not proof. Label it «كيخدم مع».
23. Do not add G2, Trustpilot, or Capterra badges until a real profile exists. A fake badge is a trust crash.
24. Do not write «500+ تاجر» . The page has no such count. Use «مثال» math instead.
25. Case-study teaser: one store, before (all COD orders sent) and after (confirmed only), with the merchant’s approval. Uncertain until a merchant agrees.
26. Before/after block, labeled مثال: 100 COD orders, 45 confirmed, 55 never become Purchases. No claim this is your average.

### B3. Trust

27. One line under the hero button: «بلا بطاقة بنكية.» Add it only after checking the signup form does not ask for a card.
28. «مصنوع للمغرب» next to Arabic-first. Local pride, not a flag gif.
29. «Purchase عبر Meta Conversions API» as a mechanism line, not a “Powered by Meta” badge. You are not a Meta partner unless that is true. Uncertain. Do not badge it.
30. Founder line: first name, city, one sentence why COD ads were the problem. A face converts in this market more than a third feature grid. Needs a real photo and consent.
31. Support: WhatsApp with hours, for example 10:00–19:00 Africa/Casablanca. Do not promise 24/7.
32. Skip a money-back guarantee until money is collected. The FAQ already says billing is off. A guarantee contradicts that.
33. Keep the encryption sentence. Move it under the Meta step, where the merchant is about to paste a token.

### B4. Pricing

34. Hide the Pro card until billing can charge. «الفوترة موقفة» is an exit.
35. One offer on the page: free while billing is off, one store, confirmed orders only.
36. When billing exists, show three tiers in MAD, not “for growing stores”. Competitors at $29–$145 only matter beside a dirham price.
37. Comparison table after billing exists: Confirma vs doing it by hand vs a global CAPI app. Columns: Arabic, WooCommerce, YouCan, confirmation gate, Meta review, price in MAD.
38. Annual discount and founding-member price are P2. They need a real charge. A fake “50% off” next to a disabled Pro card reduces trust.

### B5. Lead magnets

39. COD waste calculator: inputs are ad spend, orders, confirmation rate. Output is “Purchases Facebook should not have learned from.” Client-side is enough for a first version. Label it تقدير.
40. One-page PDF: «علاش طلبات COD الوهمية كتحرق ميزانية فيسبوك.» Gate it with WhatsApp or email. A PDF nobody receives is not a magnet.
41. Free pixel check: merchant pastes nothing secret on the marketing page. Ask only for the Events Manager screenshot, or do it after signup. Do not collect tokens on the landing page.
42. The free tier is already the product. Say the limit in orders per month when you know it. Uncertain today. An unnamed “free” feels temporary because the FAQ says billing is a preview.
43. Do not offer a 14-day trial until there is a paid plan to return to.

### B6. CTA placement

44. Keep one primary label everywhere: «اربط المتجر مجاناً» or «ابدأ مجاناً», not both.
45. Header CTA is already sticky. On mobile it is inside the menu. Put the same button visible beside the menu icon. That is the mobile leak.
46. Repeat the primary button after the timeline and after the example math. Do not add a fifth slogan band.
47. No exit-intent popup for this audience. It feels like a foreign template and it is easy to get wrong on mobile.
48. WhatsApp floating button, bottom corner, opposite the reading start so it does not cover the menu. Message draft: «بغيت نربط WooCommerce بـ Meta.»
49. Do not put a long form on the landing page. Signup already exists. A single email field only helps if it creates the account or the waitlist. Uncertain which you want. If billing is off, full signup is fine.
50. Kill `privacy@confirma.local` as the talk CTA. It reads as a placeholder.

### B7. Urgency

51. Founding list: first 100 stores stay free until billing launches, written as a sentence you will keep.
52. No limited-time percent off before a price exists.
53. Beta line, if true: «كنخدمو مع متاجر WooCommerce دابا. TikTok مازال ما تبعتش.» Status, not scarcity.
54. Do not switch the page to a waitlist while signup works. A working free start beats a waitlist.

### B8. Section order

Suggested order:

1. Hero with example math, one button, “no card”, Meta-only honesty.
2. Three-step timeline only. Drop the second six-card grid. It repeats the first.
3. One before/after example.
4. How a confirmed order becomes one Purchase. Keep the setup trio.
5. Integrations labeled as integrations.
6. Proof: real merchant, or founder plus the example. Not both fake quotes and a 3/2/1/5 stat row.
7. FAQ, including billing, TikTok, and where the event shows.
8. Final CTA plus WhatsApp.
9. Footer.

Remove the product-mechanic stats, or rename them so they cannot be read as traction. Remove the Pro preview card. Remove the proof quote signed by Confirma.

### B9. Content to add later

55. Comparison: Confirma vs ClearProfit vs TrackBee vs Analyzify, only with checked facts and a date. Zopi is a weak column. It is a dropshipping tool, not a confirmation gate. Uncertain you want it in the table.
56. FAQ to add, not all at once: COD vs prepaid, who confirms, what is sent about the buyer, can I reject, what if Meta is not verified, why Test Events stays empty, Woo vs YouCan vs Shopify, is TikTok live, is billing live, do you store the token, can my team confirm, what happens to archived orders.
57. Founder story, six lines, under the example. Not a manifesto.
58. Product tour in the existing video slot. Thumbnail first, play on click. Already how the player works.
59. Integration grid you already have. Add the words «اليوم» on Woo and Meta, and «قريباً» on TikTok and Google if they do not send yet.

### B10. Morocco

60. Keep Moroccan Arabic on `/ar`. Do not mix French into the Arabic page. French-speaking merchants need a `/fr` locale later. That is a product change, not a headline tweak. Current locales are `en` and `ar` only.
61. Do not mention CMI or PayPal on this page. Confirma does not take the customer’s payment. Mentioning local checkout implies a feature you do not sell.
62. Publish support hours in Casablanca time. WhatsApp is the channel. Email is the backup.
63. One Casablanca or Marrakech store, with permission, beats a regional slogan.
64. Local press: none until a piece exists. Do not draft a “as seen in” row.

## 4. Competitive analysis (Part C)

### ClearProfit

Lives at a product-UI landing: the dashboard moves, the offer is CAPI for messy commerce data, and the page is English. Learn the concrete waste story and the product visual. Do not copy the English-first layout, the generic “AI platform” voice, or a second motion system. Confirma’s opening is already shorter than a typical global CAPI homepage. The gap is proof and a dirham-sized offer, not more animation.

### TrackBee, Analyzify, Zopi

TrackBee and Analyzify are strongest as Shopify tracking and analytics around the pixel and CAPI. Their path is the app ecosystem and a merchant who already lives in Shopify admin. Confirma’s opening is the confirmation gate for COD, WooCommerce, YouCan, and Arabic. Do not compete on “more events” or “full analytics”.

Zopi is a different job: finding and fulfilling dropshipping products. Putting it in a CAPI comparison confuses the buyer. Mention it only to say you do not source products.

Facts above are category-level. Prices and current headlines were not re-fetched for this note. Treat competitor details as uncertain until someone checks the live sites.

### Angles worth keeping

- Arabic-first, including RTL. Say it as «كتأكد بالعربية», not “RTL support”.
- WooCommerce first. YouCan second. Shopify is supported, but it is not the Morocco wedge.
- No Meta App Review, if that stays true for the Woo path. Say «ما محتاجش مراجعة التطبيق». Do not say it for Shopify if that path differs. Uncertain on the Shopify wording. Check before it ships.
- Free while billing is off, with a written cap if you use “first 100”.
- Faster setup than a Shopify app review. Show the three steps you already have. Do not say “1-click”.

## 5. Prioritized list (Part D)

Impact ratings are judgment, not measured lifts.

| # | Idea | Impact | Effort | Time | Needs | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Rewrite the sub-headline so only Meta is “today”; TikTok and Google say later | High | Low | 1h | Copy | P0 |
| 2 | Add an example block: 100 COD, 40 confirmed, 40 Purchases, labeled مثال | High | Low | 2h | Copy | P0 |
| 3 | Remove or replace testimonials that are signed by the product | High | Low | 2h | Copy | P0 |
| 4 | Remove the Pro card that says billing is off | High | Low | 1h | Copy | P0 |
| 5 | Put «بلا بطاقة» under the hero button after verifying signup | High | Low | 1h | Copy | P0 |
| 6 | Show the signup button on mobile outside the hamburger | High | Low | 2h | CSS | P0 |
| 7 | Change the hero button to «اربط المتجر مجاناً» and use that label on every primary button | Medium | Low | 1h | Copy | P0 |
| 8 | Point “talk to us” at a real WhatsApp number, not privacy@ | High | Low | 2h | Copy | P0 |
| 9 | Label the logo row «كيخدم مع», not as customers | Medium | Low | 1h | Copy | P0 |
| 10 | Delete the 3/2/1/5 stat row or retitle it so it is not traction | Medium | Low | 1h | Copy | P0 |
| 11 | Cut the second six-card feature grid | Medium | Low | 1h | CSS | P1 |
| 12 | Sticky-feeling mobile CTA bar after the hero scrolls away | Medium | Medium | 3h | CSS | P1 |
| 13 | Record a 20s confirm → Events Manager clip into `landing_hero` | High | Medium | 4h | Content | P1 |
| 14 | Founder sentence and photo | Medium | Low | 2h | Content | P1 |
| 15 | WhatsApp floating button with a prefilled Arabic message | High | Medium | 3h | Copy | P1 |
| 16 | Mark Woo and Meta as live, TikTok and Google as قريباً | High | Low | 1h | Copy | P1 |
| 17 | Move the encryption line under the Meta setup step | Low | Low | 1h | Copy | P1 |
| 18 | COD waste calculator, client-side, labeled تقدير | High | Medium | 6h | Logic | P1 |
| 19 | FAQ: billing, TikTok, token storage, who confirms, Test Events | Medium | Low | 2h | Copy | P1 |
| 20 | One real merchant quote with city and platform, or no quote section | High | High | uncertain | Data | P1 |
| 21 | Founding-100 sentence, only with a written cap you will keep | Medium | Low | 1h | Copy | P2 |
| 22 | Comparison table with checked competitor facts and a date | Medium | Medium | 5h | Copy | P2 |
| 23 | MAD pricing, three tiers, only after billing charges | High | High | uncertain | Backend | P2 |
| 24 | French locale for advertisers who buy ads in French | Medium | High | uncertain | Logic | P2 |
| 25 | Support hours in Africa/Casablanca next to WhatsApp | Medium | Low | 1h | Copy | P1 |

P0 items that are copy and CSS stay inside the marketing surface. Pricing charges, a French locale, and a saved merchant quote need a later, explicit scope. Do not build them inside a visual pass.

## 6. Top 5 (Part E)

### 1. Tell the truth about what sends today

The sub-headline says confirmed orders go to Meta, TikTok, and Google. The working path is Meta Purchase. A merchant who connects and does not see TikTok will not trust the next sentence.

Change `heroLine` in both locales. Meta is live. TikTok and Google are named only as next. Same correction on the ads feature card.

Expected effect: fewer signups who churn in onboarding, which is the conversion that matters. Estimate, not a measured rate: this is a trust fix, often worth more than a new button. About 1 hour.

### 2. Replace slogans with one labeled example

“Smarter ads. More profit.” does not tell a COD buyer what changes. “100 orders, 40 confirmed, 40 Purchases” does.

Add one example block under the hero buttons. Mark it مثال. Do not call it your customer average.

Expected effect: higher signup intent from people who already waste budget. Directional estimate: this is the largest copy lift available without new data. About 2 hours.

### 3. Delete fake proof

The testimonial roles are Confirmation, Language, and Privacy. The proof quote is signed Confirma. The stats are 3, 2, 1, and 5. Sophisticated buyers read that as decoration. In a small market, one suspicious block undoes the Arabic advantage.

Remove those three quotes and the stat row. Keep a proof section only when a merchant has agreed, or replace it with the founder sentence.

Expected effect: less bounce on the middle of the page. You may lose “social proof” and still gain trust. About 2 hours.

### 4. One honest offer

The Pro card says the price is a picture and billing is off. The FAQ repeats it. The hero says start free and never says there is no card.

Remove the Pro card. Under the primary button, after a signup check: «بلا بطاقة. الفوترة مازال موقفة.» Use one button label.

Expected effect: fewer people who click, see a disabled plan, and leave. About 1–2 hours plus the signup check.

### 5. A human next step on mobile

Desktop has a sticky signup. Mobile hides it in the menu. “Talk to us” emails `privacy@confirma.local`. Moroccan merchants will not start a sales conversation there.

Show signup beside the menu icon. Replace the mailto with WhatsApp, a real number, and hours. Prefill «بغيت نربط المتجر بـ Meta.»

Expected effect: the largest channel lift for this audience, if the number is answered. About 3 hours. The number is a dependency. Do not ship a dead `wa.me` link.

## 7. A/B tests (Part F)

Run these only after signup works and you can count visits and completed accounts. Five tests at once will not teach anything. Run one.

1. **Meta-only sub-headline.** Hypothesis: naming only the live integration raises signup completion. Metric: signup completion rate, then share who connect Meta within 7 days. Success: completion up, and Meta-connect rate not down, over at least a few hundred visits per variant. The visit count is a guess until traffic exists.
2. **Example math vs current headline.** Hypothesis: 100 / 40 / 40 outperforms “real orders / smarter ads”. Metric: hero button click rate and signup completion. Success: completion up without a drop in people who finish store connect.
3. **Button label.** «ابدأ مجاناً» vs «اربط المتجر مجاناً». Metric: hero click-through. Success: higher clicks that still complete signup. Clicks alone are not success.
4. **No testimonials vs founder line.** Hypothesis: removing self-quotes raises scroll-to-signup and completion. Metric: clicks on the final CTA and signup completion. Success: completion up. If both variants are flat, the page is not the bottleneck.
5. **WhatsApp vs email on the secondary CTA.** Hypothesis: WhatsApp starts more conversations than `privacy@`. Metric: clicks, then replies you actually answer. Success: more replied conversations per 100 visits. Unanswered WhatsApp is a failed test even if clicks rise.

Do not A/B test a fake merchant count against an honest page.

## 8. Constraints (Part G)

This pass did not change the app. A later implementation must still avoid:

- `lib/integrations/**`
- `lib/auth/**`, `lib/supabase/**`, `lib/database/**`
- `app/api/**`
- `middleware.ts`
- `database/migrations/**`
- existing users, store, Meta connection, and orders
- new npm dependencies
- commit and push

Signup copy that claims “no card” has to match the real signup form. That check is read-only until you decide to implement.

## 9. Status

suggestions only — nothing changed
