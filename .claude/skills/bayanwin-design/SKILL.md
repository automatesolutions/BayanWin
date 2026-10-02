---
name: bayanwin-design
description: BayanWin frontend design system — tokens, type, components, copy and motion rules. Use whenever building or changing any UI in frontend/src.
---

# BayanWin design system

Dark, calm, data-first analytics UI. Ink-navy surfaces, one blue for interaction, one warm orange for the lottery balls and the single primary action per view.

Tokens live in `frontend/tailwind.config.js`; component classes in `frontend/src/styles/index.css`; chart colours in `frontend/src/utils/chartTheme.js`. Use those, never raw hex in JSX.

## Colour

| Role | Token | Use |
|---|---|---|
| Page background | `charcoal-900` (#0C1119) | `body`, sections |
| Surface | `charcoal-800` (#131A25) | `.card` |
| Raised / inset | `charcoal-700`, `charcoal-900/60` | nested panels (`.card-inset`) |
| Hairlines | `white/[0.06–0.08]` | all borders. No coloured 2px borders |
| Text | `white` headings, `silver-300` body, `silver-400` secondary, `silver-500` meta | never below `silver-500` for text |
| Primary (interactive) | `electric-300/400/500` | links, focus ring, selected state, chips |
| Accent | `orange-500` | number balls, the one primary button, key money values |
| Status | `emerald` success, `amber` warning/disclaimer, `red` error | via `<Notice tone>` only |

No gradients on text, no rainbow per-card accents, no infinite glow/pulse animations.

## Type

- Display: **General Sans** 500/600/700 (`font-display`, applied to h1–h4 automatically).
- Body/UI: **Satoshi** 400/500/700 (`font-sans`, default).
- Data: **JetBrains Mono** (`font-mono` + `.tabular`) for numbers, draws, money, odds only. Not as decoration for labels.
- Licences: General Sans and Satoshi are Fontshare (ITF Free Font License: free for commercial web use, no attribution; don't redistribute the files). JetBrains Mono is SIL OFL.
- Fontshare loads from `api.fontshare.com`, **one `<link>` per family**: the API silently drops every family after the first when they're combined in one URL.
- Scale: hero `text-4xl→6xl`, `.section-title` (2xl→3xl), `.card-title` (lg), body `text-base`, secondary `text-sm`, meta `text-xs`/`text-2xs`. Long-form article text is 17px via `.article`.
- **No eyebrows/kickers above headings** (Impeccable craft floor). `.eyebrow` is only a small label for a data group.

## Layout and spacing

- Page wrapper: `.page` (container + responsive padding); home sections use `container mx-auto px-4 sm:px-6`.
- Cards: `.card` (rounded-2xl, p-5/sm:p-6). Grid gaps `gap-4`/`gap-6`; section rhythm `space-y-6` in the dashboard, `space-y-20` between editorial sections.
- Max reading width `max-w-prose` (68ch).

## Components (use these, don't restyle ad hoc)

- Buttons: `.btn-primary` (orange, max one per view), `.btn-secondary`, `.btn-ghost`; sizes `.btn-sm`, `.btn-lg`. All ≥44px tall except `.btn-sm` (40px) inside dense cards.
- `.link` for inline links. `.chip` for tags. `.tabs` + `.tab[aria-selected]` with `role="tablist"/"tab"/"tabpanel"`.
- `.data-table` for tables (right-align numbers, `—` for missing values, never "N/A").
- `components/ui/`: `CardHeader` (icon + title + description + actions), `Notice` (inline status, replaces `window.alert`), `EmptyState` (icon, title, what to do next, action), `Spinner`, `Reveal` (GSAP scroll reveal).
- Loading = `.skeleton` shapes of the final content, not centred spinners.
- `NumberBall` for every lottery number (zero-padded, mono).

## Icons

Tabler only (the `tabler:*` set on Iconify), imported via `react-icons/tb`. One stroke style. No emoji in UI chrome or headings. **Never generate or hand-draw icons**; pick from Tabler.

Diagrams and illustrations are inline SVG with clean paths, colours set in CSS classes (`.pd-*` in `index.css`) or `currentColor`, so they can be recoloured and animated. Raster only for photos.

Effects: Canvas UI `ParticleReveal` (`src/components/canvasui/`, installed through the shadcn registry, `components.json` has the `@canvas-ui` registry) wraps the hero H1. It only activates in browsers with the experimental HTML-in-Canvas API; elsewhere it renders the heading normally.

## Motion (GSAP only — bar: gsap.com/showcase)

All in `frontend/src/components/motion/` (`gsap.js` registers ScrollTrigger, ScrollSmoother, SplitText, DrawSVG):

- **Smooth scrolling:** `SmoothScroll` (ScrollSmoother) on desktop fine pointers only. Fixed UI (header, cookie banner) must sit outside `#smooth-wrapper`. Use `scrollToElement()` for in-page jumps. CSS `position: sticky` does not work inside the smoother; use ScrollTrigger `pin`.
- **Pinned hero:** home hero pins (`pinSpacing: false`) and the next layer slides over it. Desktop only.
- **Text reveals:** hero H1 rises line by line on load (SplitText `mask: 'lines'`); `ScrollWords` brightens one statement word by word on scroll (min opacity 0.4).
- **Scroll-driven sections:** `Reveal` rises children marked `data-reveal` (transform only, `expo.out`, 1.1s); `PipelineDiagram` draws its SVG paths with DrawSVG on scrub.
- **Never hide content at rest.** No `opacity: 0` start states for scroll reveals: readers who don't scroll, crawlers, and the detector must see everything.
- Every effect is wrapped in `gsap.matchMedia()` with `prefers-reduced-motion: no-preference`. CSS transitions ≤150ms for hover/press. No scale-on-hover.

## Accessibility (Apple HIG + WCAG AA)

- Touch targets ≥44×44px. Visible `:focus-visible` ring (global). Skip link to `#main` (every page's `<main id="main">`).
- One `<h1>` per page. Never skip heading levels.
- Interactive groups get proper roles (`radiogroup`, `tablist`), toggles get `aria-expanded`, async regions `aria-busy` / `aria-live`.

## Copy rules

Derived from the five strongest sites in the niche (National Lottery UK, Lotterycodex, Lottery.net, LotteryUSA, LottoNumbers) against weaker ones (Lottery Post, PhilNews). Voice and banned words live in the `/my-tone` skill; follow both.

**What the strong sites do that the weak ones don't**

1. **First screen = the latest numbers.** Results and the jackpot are visible without scrolling (National Lottery: "Last result: 19 24 29 33 36"; Lottery.net/LottoNumbers: "Recent Draws" first). Weak sites open on a news feed or a menu wall.
2. **The H1 is the search term.** "Lottery Numbers", "Lotto Numbers". Ours: "PCSO lotto results…". No clever taglines in the H1.
3. **Buttons = verb + specific object**, often naming the game: "Check results for Thunderball", "Check My Tickets", "Go to Powerball", "Show full table". Weak: "Learn more", "Find out more", "Read more" alone.
4. **Time anchors everywhere:** "Tonight", "This Saturday", "Play by 11:55pm", "Last updated: 28th September". Ours: "Next: Tonight, 9 PM", draw dates on every result.
5. **The same tool set per game:** results · ticket checker · statistics · generator. Ours: results · ticket checker · statistics · 7 models.
6. **Proof is a specific number:** "138 millionaires so far this year", "Est. 1995", "Over 680,000 projects". Never vague ("thousands of users").
7. **Honesty framing** (Lotterycodex): "Not to find shortcuts. Not to predict results." Ours: say plainly that draws are random, once per screen that shows picks.
8. **Short noun navigation:** "Draw games", "Results", "Responsible Play". No clever menu names.

**Rules for BayanWin**

- One idea per screen. One H2 + at most one supporting sentence before the content.
- Headlines: 4–9 words, sentence case, no colon-subtitle constructions.
- Buttons: verb + object, ≤4 words, include the game when one is selected ("Analyze 6/49", "Run all 7 models", "Check my numbers").
- Numbers beat adjectives: "1 in 13,983,816", "every 90 seconds", "7 models". Never "massive", "huge", "amazing".
- Every result shows its date. Every game shows its next draw.
- Disclaimers are short, plain, and near the thing they qualify; full legal text lives on its own page.
- Banned in UI: exclamation marks, emoji, "Learn more" without an object, "Oops", hype words (see `/my-tone` §2).
