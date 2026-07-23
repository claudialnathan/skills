# Layout primitives and patterns

Every pattern here is tagged by owner — **sh** existing/shadcn behavioral component · **tw** native Tailwind v4 utility · **css** the hand-rolled escalation ladder from SKILL.md. Route by responsibility, then use the lightest owner that satisfies it. The primitives below are mostly **css**: no component or single utility owns them, but they replace breakpoint ladders, JS, or line count — that is why they earn the hand-roll.

Name recurring patterns: most layouts are one of a dozen things. Treat the third hand-composed flex/grid version as evidence that a named primitive may exist — but reach for it only when the simple `flex`/`grid` form is not already enough.

Give each hand-rolled primitive **CSS custom-property parameters** (`--measure`, `--min`, `--sidebar-size`) that double as component props when componentized (see SKILL.md). Read `globals.css` `@theme` for the tokens before hard-coding any value.

---

## Stack — vertical rhythm between siblings — tw

```tsx
<div className="flex flex-col gap-6">…</div>          {/* uniform spacing */}
<div className="flex flex-col [&>*+*]:mt-6">…</div>   {/* the "between" semantic */}
```

`gap` is the default and owns this — flex/grid + `gap-N`, nothing to hand-roll. Use the lobotomized owl (`[&>*+*]:mt-N`) only when (a) the container cannot be flex/grid (a `prose` block), or (b) the *between* semantic is required so the first/last child carries no externally imposed margin and stacks compose without double-padding.

**Anti-pattern**: `mb-N` on every child — the last child gets phantom space.

## Cluster — inline group that wraps cleanly — tw

```tsx
<div className="flex flex-wrap items-center gap-2">{tags.map(t => <Badge key={t}>{t}</Badge>)}</div>
```

Tag lists, breadcrumbs, button groups, bylines. `gap`, never margins (they compound at wrap boundaries). **When NOT**: a row that must stay one line (a toolbar, a nav) — don't add `flex-wrap`; that fights its intent.

## Content-flow sidebar — a narrow column beside flexible content — css

Not the shadcn `Sidebar` (that's a stateful app-nav shell — owner **sh**). This is the content-flow Sidebar *pattern*: a sidebar-width child and a companion that fills the rest, collapsing to one column when narrow, **with no media/container query**. The wrapping behavior comes from Flexbox; a fixed two-track Grid does not collapse itself into one column.

Drop a `.sidebar` child into a wrapper and let `:has()` assemble the layout, parametric via custom properties. The `:has()` form supersedes the older `.with-sidebar` wrapper class:
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
Override per instance like a prop: `<div style={{ "--sidebar-size": "8rem" } as React.CSSProperties}>`. If `.sidebar` is too easy to confuse with the shadcn component in a particular project, rename the marker consistently (for example, `[data-content-sidebar]`) without changing the selector structure.

Treat exactly two children as the default contract and expose incorrect markup during development:

```css
:root { --layout-error: 0.25rem solid red; }
:has(> .sidebar) > :only-child,
:has(> .sidebar) > :nth-child(3) {
  outline: var(--layout-error);
  --error: "Sidebar layouts expect exactly two child elements";
}
```

Multiple sidebars can work, but introduce more wrapping states; test each state rather than disabling Flexbox's normal behavior. Add one container query only when a real intermediate state makes the main content sidebar-narrow:

```css
:has(> .sidebar) { container-type: inline-size; }
@container (max-inline-size: 400px) {
  :has(> .sidebar) > .sidebar { inline-size: 100cqw; }
}
```

Keep that threshold intentional; dimensional container queries cannot currently read the desired breakpoint from a custom property. Prefer nesting one two-child Sidebar inside another when that produces more predictable states. Selector cost is not a reason to avoid this pattern absent a measured style-recalculation hot path.

**When to reach for it**: a content column with an intrinsic-width companion (docs TOC, filters beside results). **When NOT**: a full app shell with collapsible nav + mobile drawer → shadcn `Sidebar`.

When the intent is explicitly to **stay two columns**, use the two-column Grid form instead:

```tsx
<div className="grid grid-cols-[fit-content(20ch)_minmax(min(50vw,30ch),1fr)] gap-6">
  <aside>{nav}</aside>
  <main>{content}</main>
</div>
```

This form constrains the tracks on narrow screens but never stacks them. Do not describe it as a wrapping/collapsing sidebar; use the Flex pattern above when a one-column state is required.

## Switcher — two columns that fold to one at a content width — css

```tsx
<div className="flex flex-wrap gap-6" style={{ "--measure": "60ch" } as React.CSSProperties}>
  <div className="grow basis-[calc((var(--measure)-100%)*999)]">{left}</div>
  <div className="grow basis-[calc((var(--measure)-100%)*999)]">{right}</div>
</div>
```

The basis evaluates hugely positive when the container is narrower than `--measure`, forcing each child onto its own row. When the result is negative, the declaration is invalid and drops out, leaving the children to share a row through `grow`. **No media query, content-driven.** This is clever CSS: use it only when the team recognizes or documents the pattern. **When NOT**: a fold the design pins to a *specific* breakpoint — use `@container`/breakpoint so it flips at the chosen width, not a content-derived one.

## Cover — full viewport, optional centered content — tw + css

```tsx
<section className="grid min-h-dvh gap-8 p-6 grid-rows-[auto_1fr_auto]">
  <header>{topbar}</header>
  <div className="place-self-center">{centered}</div>
  <footer>{footer}</footer>
</section>
```

`min-h-dvh` (owner **tw**) not `min-h-screen` (= `100vh`, wrong on mobile — ignores browser chrome). Use `min-h-svh` when content must always fit even with chrome shown (login screens). **When to reach for it**: heroes, full-screen modals, splash/login.

## Sticky shell — sticky header/sidebar bounded by page regions — tw + css

Keep the sidebar's sticky element inside an `aside` that occupies the shell's sidebar grid area. The grid item supplies the containing region, so the sticky child stops before the footer instead of overlapping it:

```css
.shell {
  --header-height: 5rem;
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-columns: 14rem minmax(0, 1fr);
}
.shell-header { grid-area: header; position: sticky; inset-block-start: 0; z-index: 2; }
.shell-sidebar { grid-area: sidebar; position: relative; }
.shell-sidebar > * { position: sticky; inset-block-start: var(--header-height); }
.shell-main { grid-area: main; min-inline-size: 0; }
.shell-footer { grid-area: footer; }
```

Use shadcn `Sidebar` instead when the shell also needs collapsible state, an off-canvas mobile panel, or keyboard controls. Test the actual scroll container: sticky positioning is relative to the nearest scrolling ancestor, and an accidental `overflow` ancestor commonly breaks it.

This is the wide shell state, not a complete mobile strategy. Add one intentional viewport/container transition when the fixed sidebar would leave the main area unusably narrow.

## Center — the universal max-width container — css

```tsx
<div style={{ width: "min(100% - 2rem, 60ch)", marginInline: "auto" }}>{prose}</div>
```

One rule, gutters built in, never overflows narrow viewports. **Reach for this before composing `max-w-* px-* mx-auto`** — it passes the cuts-lines test. Every prose container, page wrapper, form column. The `--measure`/max is the prop when componentized.

## Box — border-respecting padded container — tw/sh

Use shadcn `Card` when the content has card anatomy (header/content/footer) or the project already standardizes it. For a generic padded wrapper, use utilities; a Card is not the owner merely because both draw a box. When a boundary must survive forced-colors mode, add a transparent outline alongside the visual border (`outline outline-transparent`).

## Grid — intrinsically responsive card grid — tw

```tsx
<div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(min(100%,15ch),1fr))]">{items}</div>
```
Replaces the `grid-cols-1 sm:2 md:3 lg:4` ladder — passes removes-a-ladder. Two decisions:

- **`auto-fill` vs `auto-fit`** — `auto-fill` preserves empty tracks and the space they occupy when items are few; `auto-fit` collapses empty tracks so existing items stretch into that space. Pick deliberately; they are different UX, not a default.
- **The parametric form** (RAM): `--min: min(320px, 100%)` then `grid-cols-[repeat(auto-fill,minmax(var(--min),1fr))]` — `--min` is the prop.

## The two grid-blowout fixes — don't conflate them — tw/css

Overflow on narrow screens has two distinct causes and two distinct fixes:

1. **Track-minimum blowout** — the track floor exceeds the viewport (`minmax(400px, 1fr)` on a 320px screen). Fix: wrap the floor in `min()` → `minmax(min(100%, 400px), 1fr)`. `min()` returns `100%` when it's smaller than the floor, so the track never exceeds the container. This is why the Grid above uses `min(100%, 15ch)`.
2. **Item min-content blowout** — a grid/flex *item* with unbreakable content (a `<pre>`, a long URL, `white-space: nowrap`) forces its track wider than `1fr` should allow, because a track's implicit minimum is `auto` (content-based), not `0`. Fix, in order of preference:
   - `wrap-anywhere` (Tailwind v4.1) when words/URLs are allowed to break — it participates in intrinsic sizing and can remove the need for `min-width: 0`;
   - `min-w-0` on an item that should shrink while its own content scrolls, truncates, or wraps by another policy; or
   - `grid-cols-[minmax(0,1fr)_…]` at the track level.

`overflow-hidden` can also make the automatic minimum shrink, but it does so by clipping overflow and may hide content, shadows, or focus indicators. Treat it as an intentional clipping policy, not the generic blowout fix. `max-width: 100%` alone does not solve the track's automatic minimum.

**Related — content-sized fields overflow too.** `field-sizing: content` (utility `field-sizing-content`) grows a `select`/`input`/`textarea` to fit its content, so an unbounded one blows out its container just as a track floor does. Always pair it with a `max-width` guard (`max-width: 100%`); the placeholder text acts as the effective minimum width. It is pure progressive enhancement — where unsupported (Safari/Firefox at the reference date) the field sizes normally, so nothing breaks.

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

**Two gotchas**: (1) line numbers reset inside the subgrid; (2) rows must be reserved with `row-span-N` — subgrids don't auto-generate rows from children. The `row-span-99` hack to cover unknown row counts works only when row `gap` is zero; otherwise every empty row still contributes a gap. Do not assume an `auto-fit`/`auto-fill` parent can provide the explicit spans a sibling-alignment subgrid needs; validate the exact pattern or use explicit tracks.

Check the project's browser floor; Tailwind v4's own minimum browser set does not by itself prove every subgrid target is covered. Add a fallback when required:
```css
@supports not (grid-template-rows: subgrid) {
  .card { grid-template-rows: 140px 1fr auto; }
}
```
**When NOT**: if a nested flex/grid gives the same row structure without cross-sibling alignment, prefer it — the plain nested form is often simpler; subgrid earns it only when siblings must be level with *each other*.

## `display: contents` — promote a wrapper's children into the parent grid — tw

When a wrapper element (`.section-content`, a fragment `div`) sits between a grid and the items that must occupy its tracks, `display: contents` (utility `contents`) drops the wrapper's own box so its children participate directly in the parent grid — e.g. promoting a header and cards into one shared grid, often gated by a `:has()` quantity condition:

```tsx
<section className="has-[.card:nth-child(2):last-child]:grid grid-cols-[1fr_1.25fr_1fr]">
  <header>{title}</header>
  <div className="contents">{cards}</div>   {/* ungrouped: cards join the section grid */}
</section>
```

**Caveat**: `display: contents` historically stripped the element's semantics/role from the accessibility tree (largely fixed in current browsers — verify against the project floor), so keep it off elements whose box or role is load-bearing (a `<fieldset>`, a landmark, an element with a border/background/padding you still need). Use it on neutral grouping wrappers only.

## Stack-overlay — layered content in one cell — css

```tsx
<div className="grid [grid-template-areas:'stack'] [&>*]:[grid-area:stack]">
  <img src={hero} alt="" className="h-full w-full object-cover" />
  <div className="self-end p-6 text-white"><h1>{headline}</h1></div>
</div>
```

Reach for it when layered children should contribute to the parent's intrinsic size. It avoids many absolute-position sizing hacks, but overlap can still obscure controls or pointer targets; verify DOM order, focus visibility, and hit-testing.

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

`100cqi` expands from the breakout element's own inline-start edge. Confirm the content/sidebar direction makes that expansion cover the intended region; a sidebar on the opposite side may also need an offset or a different wrapper structure.

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
html:has([data-scroll-locked="true"]) { overflow: hidden; }
```

Do not reject `:has()` based on selector folklore; measure style recalculation only if the page has a demonstrated hot path. **When NOT**: if the condition is dynamic app state already tracked in React, or the logic is elaborate, do it in JS — `:has()` shines for *visual*, DOM-shape conditions (focus ring, quantity, scroll-lock), not as a state engine. A quantity threshold (e.g. "≤3 badges") is a magic number: derive it from real and localized content, pair it with the component's available width, and start from a usable narrow/default layout.

## Grid Lanes — masonry/waterfall packing — css (guarded)

The current CSS Grid Level 3 direction is **Grid Lanes**, using `display: grid-lanes` with the familiar `grid-template-columns` / `grid-template-rows` properties. Do not teach the older `grid-template-rows: masonry` proposal as the future-facing syntax.

```css
@supports (display: grid-lanes) {
  .waterfall {
    display: grid-lanes;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
    gap: 1rem;
  }
}
```

Grid Lanes is still a draft with limited availability. Ship it only as a tested enhancement after checking the project's browser matrix, and keep the fallback usable. Inspect source, focus, and visual order; tune `flow-tolerance` from real content rather than treating the default as universal.

**Composable approximation** — pre-group markup into columns, lay those columns out with a Switcher, and Stack the items inside each column. It can drop a masonry library, but it is not automatic packing and it makes source/tab order run top-to-bottom by column rather than across the visual rows. **Use only for non-focusable content** (image walls, decorative cards). Anything interactive → use a plain responsive Grid or a tested implementation that preserves navigation order.

`reading-flow` is the native realignment for that navigation-order break, where the browser floor allows it: on a flex/grid container it makes sequential focus follow visual order (`flex-visual`, `flex-flow`; `grid-rows`, `grid-columns`, `grid-order`), so a reordered layout stays keyboard-usable. Gate it so aligned source order remains the fallback everywhere else:

```css
@supports (reading-flow: flex-visual) {
  .reordered-grid { reading-flow: grid-rows; }
}
```

Chrome 137+ only at the reference date — treat it as a verified progressive enhancement layered on aligned source order, never a reason to ship reordered focusable content to a cross-browser floor. Two gotchas: a `reading-flow` container becomes a focus-scope owner (focus visits every child before leaving the container), and positive `tabindex` is ignored for ordering inside it. `reading-order: <integer>` overrides a single item's place when the parent is `reading-flow: source-order`. Test the scope interaction against the project's real tab sequence.

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

**Style queries — the third axis, beside size and name.** `@container style(--x: …)` restyles a component from a custom-property value set on an ancestor container, not from its size — the mechanism behind a "featured" variant toggled by `--featured: true` rather than by width. No Tailwind variant owns this; hand-roll it:

```css
@container style(--featured: true) { .card { display: grid; gap: 0; } }
```

Size and style queries nest — a size query *inside* a style query scopes the featured variant to the space it actually has (`@container style(--featured: true) { @container (min-width: 500px) { … } }`). **Not supported in Firefox** at the reference date; keep the unqueried layout usable so it degrades to the default variant.

**Newly available:** name-only container queries — `@container sidebar { … }` with no size condition, styling purely by container name. Verify the project's browser floor before relying on them and keep the unqueried layout usable.

**When NOT**: page-level shells where the viewport *is* the context; a component that only ever lives at one width.

## Scroll snap — carousel without JS — tw

```tsx
<div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4">
  {items.map(i => (
    <div key={i.id} className="w-[min(45ch,60vw)] shrink-0 snap-center snap-always">{i.content}</div>
  ))}
</div>
```
Use `snap-always` only when a fast gesture must not skip a snap position; otherwise normal snap behavior may be less restrictive. This can drop a carousel library for a plain horizontal scroller, not for every carousel contract.

Keep DOM order equal to visual order, ensure focus can scroll each interactive item into view, and add controls/status when the product expects carousel semantics rather than a plain horizontal list.

## The height enigma — full-height without the `100%` chain — tw + css

`height: 50%` needs the parent to have a resolved height, which it usually doesn't (parent sizes to content → circular). Modern fixes, in order:

- **Viewport height** → `min-h-svh` / `min-h-dvh` (the old `html,body{height:100%}` chain is no longer needed).
- **Child fills parent** → put the child in a **grid** parent with `min-h-*`; grid children grow to fill their cell with no extra rule. With flex, add `flex-1` to the child.
- **Fill the containing block respecting margins** → `w-[stretch]` / `h-[stretch]` applies to the margin box — verify the browser floor; otherwise use Grid stretch or Flex growth.

## Anchor positioning — tether one element to another — sh first, else css

**Prefer the shadcn/Base UI primitives** — `Popover`, `Tooltip`, `DropdownMenu`, `HoverCard` already tether, collision-detect, and flip. Reach for raw CSS anchor positioning only to tether *outside* a component primitive.

No Tailwind utility — arbitrary property or plain CSS:
```css
.trigger { anchor-name: --t; }
.pop {
  position: fixed; position-anchor: --t; position-area: top;
  position-try-fallbacks: flip-block;
}
```
Use `fixed` when the viewport is the overflow boundary; with `absolute`, the containing block may scroll with the target and never trigger the viewport fallback. `flip-block` also flips directional margins. **Anchored container queries** for a flipping caret (`container-type: anchored` + `@container anchored(fallback: flip-block)`) require an inner element because a container query can style only descendants, not the query container itself. Verify support and provide a fallback; for load-bearing behavior, the existing component/positioning library remains safer until the project's browser floor covers the required feature level.

## Layout one-liners — adopt only where no project policy exists

```css
/* globals.css base layer */
:root { scrollbar-gutter: stable; }
[id] { scroll-margin-top: 4rem; }               /* clears a sticky header on anchor jump */
input, select, textarea { font-size: max(16px, 1rem); }   /* iOS zoom floor */
img, video { max-width: 100%; height: auto; }
```
As utilities where they exist: `text-balance` on headings, `text-pretty` on body, `aspect-*` on media, `field-sizing-content` on content-sized `textarea`/`select`/`input` (always with a `max-width` guard — see the blowout note above — since an unbounded one overflows; the placeholder acts as its min width). These are reflexive; set them once, not per component.

## Focus outline — preserve visibility through layout changes — css

```css
:focus-visible { outline: max(2px, 0.08em) solid currentColor; outline-offset: 0.15em; }
```
`currentColor` matches the element's own text color, so the ring adapts to dark mode, error states, and colored sections for free. When `overflow: hidden` would clip it, use the double box-shadow ring instead (`0 0 0 2px var(--color-background), 0 0 0 4px var(--color-ring)`).

Do not add a new global focus policy during an unrelated layout change. Use this as a diagnostic: a layout that clips or obscures the project's existing indicator is not finished.

## Plain-CSS nesting guardrails

When a reusable layout needs component CSS, keep declarations before nested rules, use `&` explicitly for pseudo-classes/modifiers, and stop around three levels. Native nesting resolves parents through `:is()`, so a high-specificity selector in a comma-separated parent list raises the specificity of every nested branch. Split the rule when that would make overrides surprising.

## Stack of reach — the decision tree

Route first (SKILL.md): existing/shadcn behavioral owner → native utility → hand-rolled CSS. Then, within a hand-roll, check the simple form is truly insufficient before naming a primitive — if `flex flex-col gap-N` / `grid grid-cols-N` / an existing component works at every width with no shift, stop. When it isn't enough, walk top-to-bottom, stop at the first match:

1. Wraps inline? → **Cluster** (`flex flex-wrap gap`).
2. Stacks vertically? → **Stack** (`flex-col gap`).
3. App nav shell? → shadcn **Sidebar**. Content-flow column? → wrapping Flex **content-flow sidebar**, optionally assembled with `:has()`.
4. Folds row→column at content width? → **Switcher**.
5. Fills the viewport? → **Cover** (`min-h-dvh`).
6. Centers max-width content? → **Center** (`min(100% - gutter, max)`).
7. Card anatomy? → shadcn **Card**. Generic padded box? → utilities/CSS.
8. Uniform grid of cards? → **Grid** (`auto-fill`/`auto-fit` + the blowout `min()`).
9. Siblings align across cards? → **Subgrid** (`grid-rows-subgrid`).
10. Layered children in one cell? → **Stack-overlay**.
11. Content column with break-out? → **Breakout** (grid or `100cqi`).
12. Adapts to child count/content? → **`:has()` + quantity**.
13. Horizontal snap scroller? → **Scroll snap**.
14. Responsiveness scoped to the component? → **Container query**.

No match → treat the result as a new primitive. Name it for reuse.

## Anti-patterns

- Arbitrary value where a utility exists — `min-h-[100dvh]` (→ `min-h-dvh`), `[grid-template-rows:subgrid]` (→ `grid-rows-subgrid`), `[aspect-ratio:16/9]` (→ `aspect-video`).
- `mb-N` on every child instead of `gap-N` or the owl.
- `position: absolute` for layered content that should size its parent — use Stack-overlay, then verify overlap and focus.
- Viewport breakpoints inside a reusable component — use a container query.
- `100vh` / `min-h-screen` on full-screen layouts — use `dvh`/`svh`.
- Repeated, inconsistent `max-w-* px-* mx-auto` wrappers — consolidate into a shared Center; leave a clear one-off alone.
- `grid-cols-1 sm:2 md:3` ladders with no intentional counts — use `repeat(auto-fill, minmax(min(100%, X), 1fr))`; preserve designer-chosen counts.
- Column-grouped masonry approximation on focusable content — reading order breaks, unless `reading-flow` realigns it behind `@supports` and its support is verified.
- Collapsing to a one-column/"mobile" layout while ample width remains (the "too-early breakpoint") — add an intermediate state or use an intrinsic grid; audit the mid-range widths, not just the extremes.
- Content-sized field (`field-sizing-content`) with no `max-width` — it blows out its container like an unbounded track floor.
- Conflating the two blowout fixes — `min(100%, X)` (track floor) vs `min-w-0`/`wrap-anywhere` (item min-content) solve different overflows.
- Hand-rolling anchor positioning where a shadcn `Popover`/`Tooltip` already does it.
