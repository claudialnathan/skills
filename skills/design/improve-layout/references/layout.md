# Layout primitives and patterns

Every pattern here is tagged by owner — **sh** shadcn component · **tw** native Tailwind v4 utility · **css** hand-rolled modern CSS (arbitrary value first, plain CSS in `@layer` only if it recurs). Reach in that order. The primitives below are mostly **css**: no shadcn component and no single utility owns them, but they replace breakpoint ladders, JS, or line count — that is why they earn the hand-roll. Where a utility or component *does* own the role, it's called out.

The point of naming them: most layouts are one of a dozen things. If you're composing flex/grid by hand for the third time, you're rebuilding a primitive that has a name. Reach for the name — but only when the simple `flex`/`grid` form isn't already enough.

Each hand-rolled primitive takes its parameters as **CSS custom properties** (`--measure`, `--min`, `--sidebar-size`), which double as component props when you componentize (see SKILL.md). Read `globals.css` `@theme` for the tokens before hard-coding any value.

---

## Stack — vertical rhythm between siblings — tw

```tsx
<div className="flex flex-col gap-6">…</div>          {/* uniform spacing */}
<div className="flex flex-col [&>*+*]:mt-6">…</div>   {/* the "between" semantic */}
```

`gap` is the default and owns this — flex/grid + `gap-N`, nothing to hand-roll. The lobotomized owl (`[&>*+*]:mt-N`) is the right answer only when (a) the container can't be flex/grid (a `prose` block), or (b) you need the *between* semantic so the first/last child carries no externally-imposed margin and stacks compose without double-padding.

**Anti-pattern**: `mb-N` on every child — the last child gets phantom space.

## Cluster — inline group that wraps cleanly — tw

```tsx
<div className="flex flex-wrap items-center gap-2">{tags.map(t => <Badge key={t}>{t}</Badge>)}</div>
```

Tag lists, breadcrumbs, button groups, bylines. `gap`, never margins (they compound at wrap boundaries). **When NOT**: a row that must stay one line (a toolbar, a nav) — don't add `flex-wrap`; that fights its intent.

## Content-flow sidebar — a narrow column beside flexible content — css

Not the shadcn `Sidebar` (that's a stateful app-nav shell — owner **sh**). This is the Every Layout *pattern*: a sidebar-width column and a companion that fills the rest, collapsing to one column when narrow, **with no media/container query**. Two forms:

**Grid form (default — a fixed two-part layout):**
```tsx
<div className="grid gap-6 grid-cols-[fit-content(20ch)_minmax(min(50vw,30ch),1fr)]">
  <aside>{nav}</aside>
  <main>{content}</main>
</div>
```
- `fit-content(20ch)` — sidebar takes its content width, capped at 20ch.
- `minmax(min(50vw,30ch),1fr)` — main column is ≥30ch (or 50vw if narrower), ≤ all remaining space. Below that it wraps to one column on its own.

**`:has()` self-assembling form (Heydon Pickering, 2025 — supersedes the original `.with-sidebar` wrapper class).** Drop a `.sidebar` element anywhere and the parent assembles the layout, parametric via custom properties:
```css
:has(> .sidebar) {
  display: flex; flex-wrap: wrap; gap: var(--sidebar-gap, 1rem);
}
.sidebar { flex-basis: var(--sidebar-size, 20rem); flex-grow: 1; }
:has(> .sidebar) > :not(.sidebar) {
  flex-basis: 0; flex-grow: 999;
  min-inline-size: var(--sidebar-wrap-at, 50%);   /* wrap threshold */
}
```
Override per instance like a prop: `<div style="--sidebar-size: 8rem">`. `:has()` cost here is ~0.005ms — a non-issue. Intervene with a `@container (max-inline-size: …)` **only** at the one wrap point where the main content has itself become sidebar-narrow; normal flex wrapping should do the rest.

**When to reach for it**: a content column with an intrinsic-width companion (docs TOC, filters beside results). **When NOT**: a full app shell with collapsible nav + mobile drawer → shadcn `Sidebar`.

## Switcher — two columns that fold to one at a content width — css

```tsx
<div className="flex flex-wrap gap-6" style={{ "--measure": "60ch" } as React.CSSProperties}>
  <div className="grow basis-[calc((var(--measure)-100%)*999)]">{left}</div>
  <div className="grow basis-[calc((var(--measure)-100%)*999)]">{right}</div>
</div>
```

The basis evaluates hugely positive or negative depending on whether the container is wider or narrower than `--measure`; flexbox clamps, producing a binary row↔column switch. **No media query, content-driven.** **When NOT**: a fold the design pins to a *specific* breakpoint — use `@container`/breakpoint so it flips at the chosen width, not a content-derived one.

## Cover — full viewport, optional centered content — tw + css

```tsx
<section className="grid min-h-dvh gap-8 p-6 grid-rows-[auto_1fr_auto]">
  <header>{topbar}</header>
  <div className="place-self-center">{centered}</div>
  <footer>{footer}</footer>
</section>
```

`min-h-dvh` (owner **tw**) not `min-h-screen` (= `100vh`, wrong on mobile — ignores browser chrome). Use `min-h-svh` when content must always fit even with chrome shown (login screens). **When to reach for it**: heroes, full-screen modals, splash/login.

## Center — the universal max-width container — css

```tsx
<div style={{ width: "min(100% - 2rem, 60ch)", marginInline: "auto" }}>{prose}</div>
```

One rule, gutters built in, never overflows narrow viewports. **Reach for this before composing `max-w-* px-* mx-auto`** — it passes the cuts-lines test. Every prose container, page wrapper, form column. The `--measure`/max is the prop when componentized.

## Box — border-respecting padded container — sh (shadcn Card)

shadcn's `Card` already implements this (padding that survives borders/outlines/shadows). Use it. The principle if hand-rolling: add a transparent `outline` so Windows High Contrast Mode gets a visible edge for free (`outline outline-transparent`). Don't build a parallel Box where Card exists.

## Grid — intrinsically responsive card grid — tw

```tsx
<div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(min(100%,15ch),1fr))]">{items}</div>
```
Replaces the `grid-cols-1 sm:2 md:3 lg:4` ladder — passes removes-a-ladder. Two decisions:

- **`auto-fill` vs `auto-fit`** — `auto-fill` keeps column width and leaves empty tracks when items are few (consistent cell size — the usual default); `auto-fit` collapses empty tracks so items stretch to fill the row. Pick deliberately; they are different UX, not a default.
- **The parametric form** (RAM): `--min: min(320px, 100%)` then `grid-cols-[repeat(auto-fill,minmax(var(--min),1fr))]` — `--min` is the prop.

## The two grid-blowout fixes — don't conflate them — tw/css

Overflow on narrow screens has two distinct causes and two distinct fixes:

1. **Track-minimum blowout** — the track floor exceeds the viewport (`minmax(400px, 1fr)` on a 320px screen). Fix: wrap the floor in `min()` → `minmax(min(100%, 400px), 1fr)`. `min()` returns `100%` when it's smaller than the floor, so the track never exceeds the container. This is why the Grid above uses `min(100%, 15ch)`.
2. **Item min-content blowout** — a grid/flex *item* with unbreakable content (a `<pre>`, a long URL, `white-space: nowrap`) forces its track wider than `1fr` should allow, because a track's implicit minimum is `auto` (content-based), not `0`. Fix, in order of preference:
   - `wrap-anywhere` (Tailwind v4.1) on the item — sets `overflow-wrap: anywhere` and removes the need for the `min-width:0` hack;
   - `min-w-0` on the flex/grid item; or
   - `grid-cols-[minmax(0,1fr)_…]` at the track level.

`max-width: 100%` / `overflow: hidden` on the item does **not** fix case 2.

## Subgrid — align content across sibling cards/rows — tw

Native utilities now (was arbitrary last year): `grid-rows-subgrid` / `grid-cols-subgrid`. When card content (image, title, body, CTA) must align across a row, give each card a subgrid inheriting the parent's tracks:

```tsx
<div className="grid grid-cols-3 gap-6 grid-rows-[auto_1fr_auto]">
  {cards.map(c => (
    <article key={c.id} className="grid grid-rows-subgrid row-span-3">
      <h3>{c.title}</h3><p>{c.body}</p><Button>Read more</Button>
    </article>
  ))}
</div>
```

**Two gotchas**: (1) line numbers reset inside the subgrid; (2) rows must be reserved with `row-span-N` — subgrids don't auto-generate rows from children. The `row-span-99` hack to cover unknown row counts works but **loses `gap`**. Don't combine subgrid with `auto-fit`/`auto-fill` — they don't compose.

**Support**: all major browsers since 2023 but still <90% (caniuse, Nov 2025) — add a fallback:
```css
@supports not (grid-template-columns: subgrid) {
  .card { grid-template-rows: 140px 1fr auto; }
}
```
**When NOT**: if a nested flex/grid gives the same row structure without cross-sibling alignment, prefer it — Comeau notes the plain nested form is often simpler; subgrid earns it only when siblings must be level with *each other*.

## Stack-overlay — layered content in one cell — css

```tsx
<div className="grid [grid-template-areas:'stack'] [&>*]:[grid-area:stack]">
  <img src={hero} alt="" className="h-full w-full object-cover" />
  <div className="self-end p-6 text-white"><h1>{headline}</h1></div>
</div>
```

Reach for it any time you'd use `position: absolute` for layered content — stack-overlay keeps everything in flow, preserving a11y, hit-testing, scroll, and the parent's intrinsic sizing.

## Breakout / full-bleed — content column with wider elements — css

**Grid form** (a constrained column with named lines; elements opt into full width):
```tsx
<article className="grid grid-cols-[[grid-start]_1fr_[content-start]_minmax(min(100%,60ch),1fr)_[content-end]_1fr_[grid-end]] gap-y-6 [&>*]:[grid-column:content]">
  <h1>{title}</h1><p>{body}</p>
  <figure className="[grid-column:grid]"><img src={img} className="w-full" /></figure>
</article>
```

**Container-unit form** (preserves a flexible/sidebar layout a grid can't): mark the content container `@container`, then a breakout child fills it with `w-[100cqi]`:
```tsx
<div className="@container">
  <p>…</p>
  <div className="w-[100cqi] …">{fullBleed}</div>   {/* 100cqi = 100% of the container's width */}
</div>
```
Container units degrade gracefully — without support the breakout is just content-width, an acceptable floor. Use the grid form for a classic article column; the container-unit form when the breakout lives inside a flexible sidebar layout that a full-bleed grid would fight.

## `:has()` + quantity queries — content-aware layout — css

Adapt a component to *how many* children it has or *what* it contains, per instance, no JS:

```css
/* Re-layout the parent when it holds 3 or fewer badges */
.list-item:has(.badge:last-child:nth-child(-n + 3)) {
  grid-template-columns: var(--leading) max-content 1fr max-content;
}
/* Parent-aware focus ring — precise where :focus-within is coarse */
.card:has(button:focus-visible) { outline: 2px solid var(--color-ring); }
/* Global side effects from anywhere in the tree */
html:has([data-scroll-locked]) { overflow: hidden; }
```

`:has()` performance is a non-issue (~0.1ms on 2500 nodes). **When NOT**: if the condition is dynamic app state you already track in React, or the logic is elaborate, do it in JS — `:has()` shines for *visual*, DOM-shape conditions (focus ring, quantity, scroll-lock), not as a state engine. The quantity threshold (e.g. "≤3 badges") is a magic number — justify it from real content.

## Masonry — Pinterest-style packing — css (guarded)

**Native** `grid-template-rows: masonry` is still experimental (Firefox behind a flag / Safari TP) and the spec is contested between WebKit and Google — do **not** ship it as baseline yet; behind `@supports (grid-template-rows: masonry)` at most.

**Composable fallback** — a switcher + stack (CSS columns) gets close without JS, dropping a masonry library. **Hard a11y limit**: column packing breaks keyboard/reading order (tab goes top-to-bottom per column, not across) — **use only for non-focusable content** (image walls, decorative cards). Anything focusable → a plain responsive Grid, or accept a JS library.

## Container queries — component-scoped responsiveness — tw

A reusable component should ask its *container*, not the viewport:

```tsx
<div className="@container">
  <article className="flex flex-col @md:flex-row @md:gap-4">
    <img className="aspect-video w-full @md:aspect-square @md:w-48" />
    <div><h3 className="text-lg @md:text-xl">{title}</h3><p className="@md:line-clamp-3">{body}</p></div>
  </article>
</div>
```

Named containers: `@container/main` → `@md/main:`. Arbitrary thresholds: `@min-[475px]:`, `@max-[960px]:`. Container-query units in arbitrary values: `w-[50cqi]`, `h-[50cqb]`. Component-scoped fluid type: `text-[clamp(1rem,5cqi,1.5rem)]` scales with the card, not the viewport (one rule, contextually responsive).

**Newer (progressive, not baseline):** name-only container queries — `@container sidebar { … }` with no size condition, styling purely by container name (Chrome 149 / Safari 26.4 / Firefox 148). Treat as enhancement.

**When NOT**: page-level shells where the viewport *is* the context; a component that only ever lives at one width.

## Scroll snap — carousel without JS — tw

```tsx
<div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4">
  {items.map(i => (
    <div key={i.id} className="w-[min(45ch,60vw)] shrink-0 snap-center snap-always">{i.content}</div>
  ))}
</div>
```
`snap-always` is the difference between a polished carousel and one that drifts between snap points. Drops a carousel library for the common case.

## The height enigma — full-height without the `100%` chain — tw + css

`height: 50%` needs the parent to have a resolved height, which it usually doesn't (parent sizes to content → circular). Modern fixes, in order:

- **Viewport height** → `min-h-svh` / `min-h-dvh` (the old `html,body{height:100%}` chain is no longer needed).
- **Child fills parent** → put the child in a **grid** parent with `min-h-*`; grid children grow to fill their cell with no extra rule. With flex, add `flex-1` to the child.
- **Fill the containing block respecting margins** → `w-[stretch]` / `h-[stretch]` (the `stretch` keyword, Baseline 2025) applies to the margin box — no `calc()` hacks around `100%`.

## Anchor positioning — tether one element to another — sh first, else css

**Prefer the shadcn/Base UI primitives** — `Popover`, `Tooltip`, `DropdownMenu`, `HoverCard` already tether, collision-detect, and flip. Reach for raw CSS anchor positioning only to tether *outside* a component primitive.

No Tailwind utility — arbitrary property or plain CSS:
```css
.trigger { anchor-name: --t; }
.pop {
  position: absolute; position-anchor: --t; position-area: top;
  position-try-fallbacks: flip-block;   /* flips to bottom when it would overflow; cross-browser */
}
```
`flip-block` works across all major browsers. **Anchored container queries** for a flipping caret (`container-type: anchored` + `@container anchored(fallback: bottom)`) are **Chromium-only** as of mid-2026 — needs a fallback, and for anything load-bearing a JS positioning lib is still the safer call until support broadens.

## Modern one-liners — set once at the global layer

```css
/* globals.css base layer */
:root { color-scheme: light dark; accent-color: var(--color-primary); scrollbar-gutter: stable; }
[id] { scroll-margin-top: 4rem; }               /* clears a sticky header on anchor jump */
input, select, textarea { font-size: max(16px, 1rem); }   /* iOS zoom floor */
button { cursor: pointer; }
img, video { max-width: 100%; height: auto; }
```
As utilities where they exist: `text-balance` on headings, `text-pretty` on body, `aspect-*` on media, `field-sizing-content` on auto-growing textareas. These are reflexive; set them once, not per component.

## Focus outline — one rule for the app — css

```css
:focus-visible { outline: max(2px, 0.08em) solid currentColor; outline-offset: 0.15em; }
```
`currentColor` matches the element's own text color, so the ring adapts to dark mode, error states, and colored sections for free. When `overflow: hidden` would clip it, use the double box-shadow ring instead (`0 0 0 2px var(--color-background), 0 0 0 4px var(--color-ring)`).

## Stack of reach — the decision tree

Route first (SKILL.md): shadcn component → native utility → hand-rolled CSS. Then, within a hand-roll, check the simple form is truly insufficient before naming a primitive — if `flex flex-col gap-N` / `grid grid-cols-N` / a shadcn component works at every width with no shift, stop. When it isn't enough, walk top-to-bottom, stop at the first match:

1. Wraps inline? → **Cluster** (`flex flex-wrap gap`).
2. Stacks vertically? → **Stack** (`flex-col gap`).
3. App nav shell? → shadcn **Sidebar**. Content-flow column? → **content-flow sidebar** (grid/`:has()`).
4. Folds row→column at content width? → **Switcher**.
5. Fills the viewport? → **Cover** (`min-h-dvh`).
6. Centers max-width content? → **Center** (`min(100% - gutter, max)`).
7. Card/box with padding? → shadcn **Card**.
8. Uniform grid of cards? → **Grid** (`auto-fill`/`auto-fit` + the blowout `min()`).
9. Siblings align across cards? → **Subgrid** (`grid-rows-subgrid`).
10. Layered children in one cell? → **Stack-overlay**.
11. Content column with break-out? → **Breakout** (grid or `100cqi`).
12. Adapts to child count/content? → **`:has()` + quantity**.
13. Horizontal snap scroller? → **Scroll snap**.
14. Responsiveness scoped to the component? → **Container query**.

No match → you're building a new primitive. Name it; reach for the name next time.

## Anti-patterns

- Arbitrary value where a utility exists — `min-h-[100dvh]` (→ `min-h-dvh`), `[grid-template-rows:subgrid]` (→ `grid-rows-subgrid`), `[aspect-ratio:16/9]` (→ `aspect-video`).
- `mb-N` on every child instead of `gap-N` or the owl.
- `position: absolute` for layered content — use Stack-overlay.
- Viewport breakpoints inside a reusable component — use a container query.
- `100vh` / `min-h-screen` on full-screen layouts — use `dvh`/`svh`.
- `max-w-* px-* mx-auto` ladder — use `width: min(100% - gutter, max); margin-inline: auto`.
- `grid-cols-1 sm:2 md:3` ladder — use `repeat(auto-fill, minmax(min(100%, X), 1fr))`.
- Composable masonry on focusable content — reading order breaks.
- Conflating the two blowout fixes — `min(100%, X)` (track floor) vs `min-w-0`/`wrap-anywhere` (item min-content) solve different overflows.
- Hand-rolling anchor positioning where a shadcn `Popover`/`Tooltip` already does it.
