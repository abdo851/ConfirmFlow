# Exploration report

## 1. Executive summary

Pure CSS plus native browser APIs can carry a premium SaaS landing. They cannot copy a scroll-scrubbed, cursor-reactive Awwwards site.

Most of that premium layer is already on the Confirma landing page: word stagger, bobbing logos, a drawing timeline, fade-up cards, count-up stats, a mesh gradient, a marquee, and an FAQ accordion. No Framer Motion, GSAP, or Lottie is installed. There is no `tailwind.config.*`; Tailwind 4 tokens live in `app/globals.css` under `@theme`.

Honest ceiling: about 85% of a ClearProfit-style marketing page, not 100%. The missing piece is motion locked to scroll position and the cursor.

## 2. Current state (Part A)

### What is implemented

| Effect | Where | Technique |
| --- | --- | --- |
| Fade, slide, scale, rotate | `app/globals.css` `[data-animate]` | CSS keyframes, played when `data-visible="true"` |
| Scroll reveal, one shot | `lib/animations/use-reveal.ts`, `components/ui/reveal.tsx` | `IntersectionObserver`, threshold 0.16, then disconnect |
| Stagger | Landing `Reveal delay={index * 100}` | `animation-delay` |
| Headline word stagger | `components/marketing/hero-words.tsx` | DOM split on spaces, 50ms delay, `cf-hero-rise` |
| Logo bob | `platform-row.tsx` | `cf-bob`, −4px to +4px, 3s, 150ms stagger |
| Marquee | `.marquee-track` | `translateX` 40s loop, pause on hover, separate RTL keyframes |
| Mesh gradient | `.hero-mesh`, `.cta-band`, `.bg-mesh` | `background-position` via `cf-mesh` (22s / 20s) |
| Timeline line + circle pop | `flow-timeline.tsx`, `setup-track.tsx` | Observer sets `data-visible`, then `scaleX` / `scaleY` and `scale(0.8 → 1)` |
| Count-up | `use-count-up.ts` | `requestAnimationFrame`, 900ms ease-out cubic |
| Stat underline | `.stat-figure::after` | `scaleX` after the number is ready |
| Quote tilt | `.quote-tilt` | `rotate(2deg)`, hover back to 0, mirrored in RTL |
| Card hover | `.landing-card` | `translateY(-6px)`, shadow, icon `rotate(5deg)` |
| FAQ | `faq-list.tsx` | `grid-template-rows: 0fr → 1fr` over 250ms, chevron `rotate(180deg)` |
| CTA glow | `.cta-pulse` | existing `glow` keyframes, 2s |
| Footer | `landing-footer.tsx` | column `Reveal` stagger, underline `scaleX` from inline-start |
| Reduced motion | end of `globals.css` | `prefers-reduced-motion: reduce` disables animation and transform |

`components/marketing/` also has `video-embed.tsx` and `placement-video.tsx`. Those are playback UI, not landing motion.

### What is missing versus a ClearProfit / premium-theme feel

- Nothing is scrubbed to scroll progress. Reveals fire once, then stop.
- No floating product mock that drifts at a different speed than the page.
- No cursor-tracked tilt or magnetic buttons.
- The mesh is a moving gradient and blurred orbs, not a reactive WebGL blob.
- Page changes use a simple fade. There is no shared-element or curtain transition.
- No reading-progress bar.
- Letter-by-letter type is not used. That is the right call for Arabic.

## 3. Capability table (Part B)

| # | Question | Verdict | Technique | Limitation |
| --- | --- | --- | --- | --- |
| B1 | Split-text headline | YES | Split words in the DOM. Animate each span with `animation-delay`. Already built. | CSS cannot split a single text node. Arabic must stay word-level or the letters stop joining. |
| B2 | Scroll reveal + stagger | YES | `IntersectionObserver` plus `data-visible` and per-item delay. Already built. | One-shot. It does not reverse or scrub. Each item needs its own delay. |
| B3 | Parallax | PARTIALLY | CSS scroll-driven animations (`animation-timeline: scroll()` / `view()`) where the browser supports them. Fallback: a slow keyframe, not real parallax. | `background-attachment: fixed` is janky on iOS. Firefox support for scroll-driven animations is uncertain as of this review. A scroll listener plus `requestAnimationFrame` works without a library, but it is not “pure CSS”. |
| B4 | Floating cards that shift on scroll | PARTIALLY | Enter: the existing fade/slide. Continuous shift: scroll-driven CSS or a native scroll listener. | Keyframes alone cannot track scroll position. Several large blurred layers will cost frames on mid-range phones. |
| B5 | Timeline line draw | YES | `scaleX(0 → 1)` or SVG `stroke-dashoffset`, gated by the observer. Already built with `scaleX`. | `scaleX` draws a straight bar. A curved path needs SVG. RTL needs `transform-origin: inline-start` (already set). |
| B6 | Count-up | YES | `requestAnimationFrame`. Already built. | CSS counters cannot ease. Many simultaneous counters cause extra React renders. |
| B7 | Magnetic buttons | NO for pure CSS | Cursor offset needs `pointermove`. A few lines of native JS can do it. No library required. | `:hover` cannot follow the pointer. Not worth it on touch, and it fights the “not busy” goal. |
| B8 | Slow mesh gradient | YES | Animate `background-position` and float blurred orbs. Already built. | It will not react to the cursor. A true mesh needs WebGL or a library. |
| B9 | Touch | PARTIALLY | `:active` for tap feedback. Already a native button/link press style elsewhere. | Swipe gestures are not CSS. Hover-pause on the marquee does not run on a finger. |
| B10 | FAQ height | YES | `grid-template-rows: 0fr / 1fr`. Already built, 250ms. | `height: auto` cannot be transitioned. The grid trick is the native fix. |
| B11 | Marquee | YES | Duplicated track, `translateX`, 40s. Pause on `:hover`. RTL keyframes exist. | Touch pause needs `:active` or a pointer listener. Long Arabic strings need the duplicated track or the loop jumps. |
| B12 | 3D card rotate | YES for a fixed hover tilt | `perspective` + `rotateX` / `rotateY`. A 2deg hover tilt already exists. | A tilt that follows the pointer is JS, not CSS. |
| B13 | Cinematic page transition | PARTIALLY | Incoming fade is already there. The View Transitions API is native in Chromium and recent Safari. | Next.js App Router does not apply it for you. Shared-element curtains are fragile with locale prefixes. This is the riskiest item. |
| B14 | Scroll progress bar | PARTIALLY | Scroll-driven CSS on a fixed bar, or one scroll listener. | Not possible with keyframes alone. Same browser caveat as B3. |
| B15 | Letter-by-letter | YES in Latin, NO as a good Arabic effect | Same as B1, split into characters. | Arabic is cursive. Per-letter spans break the word. Keep word stagger. |

## 4. What is possible (Part C)

### Fully possible with CSS + native APIs

1. Word-by-word headline reveal (already on the page).
2. One-shot scroll reveals with stagger (already on the page).
3. Straight timeline draw and circle pop (already on the page).
4. Count-up numbers (already on the page).
5. Slow mesh gradient, bob, marquee, glow, hover lift, 3D-ish fixed tilt.
6. FAQ open/close with a real height animation (already on the page).
7. Reduced-motion fallback (already on the page).

### Partially possible

1. Parallax and scroll-shifted cards. Possible with scroll-driven CSS or a small scroll listener. Uneven browser support. Easy to make mobile janky.
2. Scroll progress bar. Same technique and same caveat.
3. Marquee pause while a finger is down. Needs a touch rule, not `:hover`.
4. Route transitions. View Transitions API only, and only if Next.js navigation is wrapped carefully.
5. Pointer-follow tilt. Native JS, not CSS, and pointless on touch.

### Not possible without a library or a custom engine

1. Spring physics, inertia, and layout morphs the way Framer Motion does them.
2. ScrollTrigger-style scrubbing of a complex timeline with pinning, the way GSAP does it, across browsers, without writing that engine yourself.
3. A cursor-reactive WebGL mesh.
4. Letter-by-letter Arabic that still looks like Arabic.

“Not possible without a library” here means “not possible as a small CSS addition”. A determined native implementation can imitate some of it. That implementation becomes the library.

## 5. Proposed plan (Part D)

No code in this pass. D1–D9 are already in the landing page. Further work should tune them, not rebuild them.

| Step | Status | Technique | Complexity |
| --- | --- | --- | --- |
| D1 Hero words | Done | DOM word split + `animation-delay` 50ms | Low |
| D2 Logo bob | Done | CSS keyframes, 3s, 150ms stagger, hover glow | Low |
| D3 Timeline | Done | Observer + `scaleX` / `scaleY` + pop | Medium |
| D4 Feature grid | Done | `Reveal` fade-up, 100ms stagger, hover lift and icon rotate | Low |
| D5 Stats | Done | Row fade, then `requestAnimationFrame` count, then underline | Medium |
| D6 Testimonials | Done | Fade-up stagger + `rotate(2deg)` / hover 0 | Low |
| D7 FAQ | Done | `grid-template-rows` 250ms + chevron rotate | Low |
| D8 CTA | Done | `cf-mesh` 20s + `glow` 2s | Low |
| D9 Footer | Done | `Reveal` 100ms + underline from inline-start | Low |
| D10 Floating dashboard | Not built | One-shot slide is easy. Real parallax is scroll-driven CSS with a static fallback | High |

If D10 is in scope, build one composed “product” card, not five independent parallax layers. Pin nothing. Do not add a library.

## 6. Limitations and risks (Part E)

1. What will not look like ClearProfit: a product UI that moves with the scrollbar, cursor magnetism, springy shared-element route changes, and a living mesh. Those are the last 15%.
2. Where mobile suffers: blurred orbs, infinite mesh, marquee, bob, and glow already run together. Adding parallax or `background-attachment: fixed` on top is the likely jank. iOS Safari is the weak target.
3. Technical risks: scroll-driven CSS support is not uniform (Firefox uncertain). View Transitions plus `next-intl` locale prefixes can flash or skip. Splitting Arabic into letters damages the script. Hover and reveal both set `transform`, so they override each other if they land on the same element. The sticky header can cover the timeline if a section is scrolled to center.
4. Compromise: keep one-shot reveals. Skip magnetic buttons. Skip letter-by-letter. Skip route transitions. Treat D10 as optional and ship it only with a reduced-motion and small-screen fallback that does not translate on scroll.

## 7. Final recommendation (Part F)

**F1. Can we reach 90% of ClearProfit’s premium feel with pure CSS?**
PARTIALLY. About **85%** of a premium SaaS landing is realistic, and most of that is already on `/ar`. 90% is the optimistic ceiling if D10 is a restrained one-shot composition. It is not 90% of an Awwwards case study.

**F2. Can we reach 100%?**
NO. The missing slice is scroll-scrubbed product motion, cursor-reactive 3D, spring physics, and cinematic route transitions.

**F3. Complexity and time**
Medium overall, because the base is done. Tuning only: about **3–5 hours**. Adding a safe D10 mock: about **6–10 hours** of Cursor work. Rebuilding the page from scratch would be High and is unnecessary.

**F4. Risk**
Low if we stop at the current system. Medium if we add parallax or View Transitions. Reason: browser gaps and mobile GPU cost, not data or auth risk, as long as the allowed folders stay the only edit surface.

**F5. Recommendation**
**Option A. Stay on CSS and native APIs.**

Option B (Framer Motion) and Option C (GSAP) are better at the missing 15% and are the wrong call here: the constraint is no new dependency, and `package.json` is protected. Option D is the same conflict. Do not install either library.

## 8. Protection rules (Part G)

Understood. This pass changed nothing in the product. If a later pass proceeds, it stays inside:

- `app/[locale]/(marketing)/**`
- `components/marketing/**`
- `app/globals.css`
- `messages/**` (values only)
- `tailwind.config.*` (none exists today)

Not touched, and not to be touched later:

- `lib/integrations/woocommerce/**`, `lib/integrations/meta/**`, `lib/integrations/youcan/**`, `lib/integrations/shopify/**`
- `app/api/integrations/**`
- `lib/auth/**`, `lib/supabase/**`, `lib/database/**`
- `lib/confirmation/**`, `lib/orders/**`, `lib/webhooks/**`
- `lib/content/**`, `lib/videos/**`, `lib/logging/**`, `lib/security/**`
- `lib/utils/**`, `lib/config/**`
- `middleware.ts`, `next.config.ts`, `.env.local`, `package.json`
- `database/migrations/**`, `supabase/migrations/**`
- `app/api/auth/**`, `app/api/orders/**`, `app/api/dashboard/**`
- `app/api/supabase/**`, `app/api/health/**`
- Existing users, store, Meta connection, and orders

`lib/animations/use-reveal.ts` and `use-count-up.ts` are not on the protected list. They are also not on the allowed list. Leave them alone unless you explicitly expand the allow list.

## 9. Status

exploration only — nothing in the app was changed. This file is the only write.
