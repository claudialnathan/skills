# Layout primitives and patterns

Every pattern here is tagged by owner — **sh** existing/shadcn behavioral component · **tw** native Tailwind v4 utility · **css** the hand-rolled escalation ladder from SKILL.md. Route by responsibility, then use the lightest owner that satisfies it. The primitives below are mostly **css**: no component or single utility owns them, but they replace breakpoint ladders, JS, or line count — that is why they earn the hand-roll.

Name recurring patterns: most layouts are one of a dozen things. Treat the third hand-composed flex/grid version as evidence that a named primitive may exist — but reach for it only when the simple `flex`/`grid` form is not already enough.

Give each hand-rolled primitive only the **CSS custom-property parameters fundamental to its algorithm** (`--measure`, `--min`, `--sidebar-size`). Promote those parameters to component props only when a structural component is justified. Read `globals.css` `@theme` for the tokens before hard-coding any value.

---

## Use this reference

Start from the pressure point, not from a favorite technique:

1. Ignore whether the current code came from shadcn, a registry, or an agent; record that as provenance and audit rendered behavior.
2. Find the need in the table. Follow the stable route first.
3. Read that section's **When NOT** before changing the layout.
4. Load [`advanced.md`](advanced.md) only when the row points there. Stop when a simple existing component or utility already holds at every required width.

| Need / pressure point | Stable first route | Key constraint | Section |
| :-- | :-- | :-- | :-- |
| Stateful app navigation shell | Existing project/shadcn `Sidebar` | Preserve provider, mobile panel, focus, and keyboard behavior | [App shell](#stateful-app-shell--sh-plus-layout-audit) |
| Vertical rhythm | Flex/Grid `gap` | Do not add child margins by reflex | [Stack](#stack--vertical-rhythm-between-siblings--tw) |
| Inline items that may wrap | `flex flex-wrap gap-*` | Preserve fixed one-line toolbars/nav | [Cluster](#cluster--inline-group-that-wraps-cleanly--tw) |
| Content companion beside flexible content | Intrinsic wrapping Flexbox | Not the shadcn app-nav component | [Content-flow sidebar](#content-flow-sidebar--a-narrow-column-beside-flexible-content--css) |
| Row that should fold at content pressure | Switcher | Use a chosen query when the transition is art-directed | [Switcher](#switcher--two-columns-that-fold-to-one-at-a-content-width--css) |
| Full-viewport composition | Grid plus `min-h-dvh`/`svh` | Account for mobile browser chrome | [Cover](#cover--full-viewport-optional-centered-content--tw--css) |
| App/page regions with bounded sticky UI | Existing shell or grid-area shell | Verify the actual scroll ancestor | [Sticky shell](#sticky-shell--sticky-headersidebar-bounded-by-page-regions--tw--css) |
| Max-width content with built-in gutters | `min()` width plus auto margins | Keep one measure owner | [Center](#center--the-universal-max-width-container--css) |
| Padded visual surface | Utilities or the project's Card | Card anatomy and generic boxes differ | [Box](#box--border-respecting-padded-container--twsh) |
| Cards/tiles that add and drop columns fluidly | Intrinsic `auto-fill`/`auto-fit` Grid | Choose empty-track behavior deliberately | [Grid](#grid--intrinsically-responsive-card-grid--tw) |
| Narrow-width overflow | Fix the track floor or item minimum | Diagnose which blowout exists first | [Grid blowout](#the-two-grid-blowout-fixes--dont-conflate-them--twcss) |
| Text clips or overflows after translation | Remove the fixed size; `max-width` + wrap | Expansion varies by language and string length | [Content growth](#the-third-overflow--the-content-grew-the-container-didnt--twcss) |
| Cross-card row alignment | Subgrid | It earns its place only across siblings | [Subgrid](#subgrid--align-content-across-sibling-cardsrows--tw) |
| Wrapper blocks children from joining a grid | `contents` on a neutral wrapper | Preserve load-bearing semantics/box styles | [`display: contents`](#display-contents--promote-a-wrappers-children-into-the-parent-grid--tw) |
| Layered content that should size its parent | Single-cell Grid overlay | Check focus, hit testing, and contrast | [Stack-overlay](#stack-overlay--layered-content-in-one-cell--css) |
| Full-bleed child inside constrained content | Named-line Grid or container units | Confirm inline direction/offset | [Breakout](#breakout--full-bleed--content-column-with-wider-elements--css) |
| Layout responds to DOM shape/quantity | `:has()` visual condition | Keep application state in application code | [`:has()` and quantity](#has--quantity-queries--content-aware-layout--css) |
| Kanban/status lanes scale down poorly, or the board is unusable on a phone | Intrinsic lane Grid or horizontal lane scroller | Choose stack vs parallel continuity from the task; size lanes so one fills a phone | [Kanban board](#kanban-board--one-lane-on-a-phone-many-lanes-on-a-desk--twcss-plus-behavioral-owner) |
| Component responds to its allocated slot | Container query | Use viewport context for page shells | [Container queries](#container-queries--component-scoped-responsiveness--tw) |
| Plain horizontal scroller | Flex overflow plus scroll snap if useful | Do not imply full carousel behavior; leave the next item peeking | [Scroll snap](#scroll-snap--carousel-without-js--tw) |
| Percentage/full-height chain fails | Viewport unit, Grid stretch, or Flex growth | Resolve which containing block owns height | [Height](#the-height-enigma--full-height-without-the-100-chain--tw--css) |
| Edge-fixed UI collides with the notch or home indicator | `max()` against the safe-area inset | Insets stay `0` without `viewport-fit=cover` | [Safe areas](#safe-areas--edge-fixed-ui-on-a-non-rectangular-screen--css) |
| Table or wide data grid overflows a phone | Scroll container with a visible cue | Dual-render duplicates the a11y tree | [Tables](#responsive-tables--the-scroller-is-the-default--twcss) |
| Form controls visually assign cards to state columns | Guarded `:has()` specialization | Not application state or drag-and-drop | [`advanced.md`](advanced.md#form-driven-board-state-assignment--css-specialist) |
| Masonry/waterfall, style queries, or raw tethering | Guarded enhancement over stable fallback | Verify current support and focus/source order | [`advanced.md`](advanced.md) |

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

## Stateful app shell — sh plus layout audit

Keep the installed project/shadcn shell as the behavioral owner. Improve its checked-in layout rather than replacing its provider, collapse state, mobile panel, focus behavior, or keyboard controls with a parallel shell.

The common shadcn composition is:

```text
SidebarProvider
├── Sidebar
└── SidebarInset
    └── Main content
```

Audit the seams around that structure:

- Give the flexible main/inset track permission to shrink (`min-inline-size: 0` or the project's utility) and diagnose its long-content policy separately.
- Name one block-axis scroll owner. Accidental overflow on the provider, inset, and inner page at once produces broken sticky regions and nested scroll traps.
- Test expanded, collapsed, mobile panel, and controlled states; preserve focus return, the existing trigger, and the keyboard shortcut.
- Sweep widths and 200% zoom with long navigation labels, deep menu nesting, wide tables/code blocks, and a page footer. Verify the sidebar never leaves the main track unusably narrow before its intended collapse.
- Keep shell responsiveness viewport-scoped when the shell fills the page. Use container queries inside cards/panels placed in `SidebarInset`, not to replace the shell's state contract.

**When NOT:** a passive content companion beside a main region has no provider, collapse state, mobile sheet, or keyboard contract. Use the content-flow sidebar below.

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

Keep that threshold intentional; at the 2026-07-22 reference snapshot, dimensional container queries cannot read the desired breakpoint from a custom property. Prefer nesting one two-child Sidebar inside another when that produces more predictable states. Selector cost is not a reason to avoid this pattern absent a measured style-recalculation hot path.

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
Replaces the `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` ladder — passes removes-a-ladder. Two decisions:

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

**Related — content-sized fields overflow too.** `field-sizing: content` (utility `field-sizing-content`) grows a `select`/`input`/`textarea` to fit its content, so an unbounded one blows out its container just as a track floor does. Always pair it with a `max-width` guard (`max-width: 100%`); the placeholder text acts as the effective minimum width. It is pure progressive enhancement — in Safari/Firefox without support at the 2026-07-22 reference snapshot, the field sizes normally, so nothing breaks.

## The third overflow — the content grew, the container didn't — tw/css

The two blowouts above are *the container got narrower than the content needs*. The third is the mirror image: the container is fine and the **string got longer than the one it was sized against**. It surfaces after translation, after a real record replaces lorem text, and at 200% zoom — which is why a layout can pass every width sweep and still break in production.

Expansion is not a single percentage. It varies by target language and, sharply, by source-string length: short UI labels expand far more proportionally than paragraphs. Do not size to English and add a fixed margin of safety — remove the fixed size instead:

- **No fixed width on a text container.** `max-width` plus wrapping, never `width`.
- **No fixed height on a text container.** `min-height` when a floor is genuinely needed, so the box grows with its content instead of clipping it.
- **Buttons and chips size from their label** via `padding-inline`. A hardcoded width either truncates the longer translation or forces an ellipsis into a control that has room to be legible.
- **Let rows wrap** rather than compressing every cell. A toolbar deliberately held to one line is an intent to preserve — but then its labels need an abbreviated or icon form for the case where they no longer fit.

```css
/* Good: the label defines the size, the box grows with it */
.button { padding-inline: --spacing(4); }
.field-label { max-inline-size: 24ch; }

/* Bad: sized to the English string, clips or overflows in German */
.button { inline-size: 6rem; overflow: hidden; }
.field-label { block-size: 1.5rem; }
```

**Test it, don't reason about it.** Pseudo-localization (accented, lengthened strings) or one representative long-string locale exposes this in one pass; unbounded user content — a long display name, an untruncated filename — exposes the same boxes. Run it before shipping any layout whose text came from a design mock.

## Subgrid — align content across sibling cards/rows — tw

Tailwind v4 provides native `grid-rows-subgrid` / `grid-cols-subgrid` utilities; do not retain the older arbitrary-property form. When card content (image, title, body, CTA) must align across a row, give each card a subgrid inheriting the parent's tracks:

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
<div className="grid [grid-template-areas:'stack'] *:[grid-area:stack]">
  <img src={hero} alt="" className="h-full w-full object-cover" />
  <div className="self-end p-6 text-white"><h1>{headline}</h1></div>
</div>
```

Reach for it when layered children should contribute to the parent's intrinsic size. It avoids many absolute-position sizing hacks, but overlap can still obscure controls or pointer targets; verify DOM order, focus visibility, and hit-testing.

## Breakout / full-bleed — content column with wider elements — css

**Grid form** (a constrained column with named lines; elements opt into full width):
```tsx
<article className="grid grid-cols-[[grid-start]_1fr_[content-start]_minmax(min(100%,60ch),1fr)_[content-end]_1fr_[grid-end]] gap-y-6 *:col-[content]">
  <h1>{title}</h1><p>{body}</p>
  <figure className="col-[grid]"><img src={img} className="w-full" /></figure>
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

## Kanban board — one lane on a phone, many lanes on a desk — tw/css plus behavioral owner

Separate the board's **layout contract** from its **interaction contract**. CSS owns how lanes use available space and how the board pans. Application data owns which tasks belong to each lane. A tested behavior library owns drag sensors, announcements, keyboard movement, collision, and persistence when cards can be reordered.

Decide the narrow end while building the wide one. A board is the composition most often shipped desktop-only, because at a desk it looks finished — and the phone state is not a later variant of it, it is the same rule read at a smaller width.

First choose what narrow screens should preserve:

| Board intent | Narrow behavior | Layout |
| :-- | :-- | :-- |
| Overview or status summary; seeing one complete lane at a time is acceptable | Lanes drop from many columns to fewer, then stack into one scrolling page | Intrinsic lane Grid |
| Active workflow or drag-and-drop; comparison between neighboring lanes must remain | Lanes stay parallel; one lane fills the view and the board pages sideways | Lane scroller |
| A product-defined compact representation exists | Switch to that representation at its pressure point | One intentional container/viewport query |

“Breakpointless” is a means, not the acceptance test. Choose the transition from lane/card pressure, not device labels; do not stack a board if doing so destroys the workflow's spatial model.

**Intrinsic lane Grid — stacks at the content-determined moment:**

```css
.kanban-board {
  --kanban-lane-min: 18rem;
  display: grid;
  grid-template-columns:
    repeat(auto-fit, minmax(min(100%, var(--kanban-lane-min)), 1fr));
  align-items: start;
  gap: var(--kanban-gap, 1rem);
}

.kanban-lane {
  min-inline-size: 0;
  display: flex;
  flex-direction: column;
  gap: var(--kanban-card-gap, 0.75rem);
}
```

This removes a column-count breakpoint ladder and lets the board respond to its actual inline size. Use `auto-fit` when the remaining lanes should stretch; use `auto-fill` when empty track space is part of the board design. Its narrow end is a single stacked column, so lane source order becomes the reading order — keep it the workflow's own order, and give each lane heading its card count, since a stacked lane can no longer be compared against the neighbour beside it.

**Lane scroller — one continuum from phone to desk:**

```css
.kanban-board {
  --lane-max: 20rem;       /* the width a lane settles at when there is room */
  --lane-gutter: 1rem;     /* board edge inset */
  --lane-gap: 0.75rem;
  --lane-peek: 2rem;       /* sliver of the next lane once one lane fills the view */

  display: flex;
  align-items: start;      /* lanes size to their cards; see the full-height form below */
  gap: var(--lane-gap);
  overflow-x: auto;
  padding-inline: var(--lane-gutter);
  scroll-padding-inline: var(--lane-gutter);
  overscroll-behavior-inline: contain;
  scroll-snap-type: inline proximity;
}

.kanban-lane {
  /* wide: --lane-max. narrow: whatever leaves the next lane peeking. no query. */
  flex: 0 0 min(var(--lane-max), 100% - var(--lane-gap) - var(--lane-peek));
  min-inline-size: 0;
  scroll-snap-align: start;
}
```

The two arms of that `min()` **are** the two layouts. Above the crossover the subtraction is the larger value, so lanes hold at `--lane-max` and the board simply carries more of them; below it the lane shrinks to keep one lane and one sliver in view. Nothing duplicates, nothing flips, and there is no width at which the board becomes "the mobile board" — which is also why the mid-range cannot be forgotten. A fixed `flex-basis` (or a `min()` whose arms never cross, such as `min(85%, 18rem)`) never reaches the viewport: on a phone it shows one lane and a fraction, so nothing reads as *the* current lane.

**Percentages in `flex-basis` resolve against the flex container's content box**, so `100%` is already the board minus its two gutters. Subtract only the gap and the peek, and expect the rendered sliver to run about one gutter wider than `--lane-peek`. Tune it against the rendered board at the narrowest supported width rather than trusting the arithmetic.

**Snap strength is the one thing that cannot interpolate:**

```css
/* a container cannot query itself — the wrapper carries the container */
.kanban-shell { container: board / inline-size; }

/* keep in sync with the min() crossover: --lane-max + gap + peek + both gutters */
@container board (inline-size < 24.75rem) {
  .kanban-board { scroll-snap-type: inline mandatory; }
  .kanban-lane { scroll-snap-stop: always; }
}
```

Mandatory snapping plus `scroll-snap-stop: always` is the paging feel — one fling advances exactly one lane. It is wrong at the wide end, where it fights a pointer user dragging across seven visible lanes, so pin the flip to the width the `min()` already crosses and the layout changes once instead of twice. `scroll-snap-stop: always` also puts lane 6 five flings away, so a board with many lanes needs a jump control (a lane menu or heading strip), not swipe as the only route. At the 2026-07-26 snapshot a dimensional container query cannot read that threshold from a custom property, so the number is duplicated — keep the comment. A page-level board may legitimately use a viewport media query here instead.

**Who owns block-axis scrolling is decided by the board's height, not its width.** A board that fills the screen: each lane scrolls its own cards. A board sitting in page flow: the page scrolls and lanes simply grow. Do not move that ownership at a breakpoint — sticky lane headers, drag auto-scroll, and scroll restoration all change meaning when the owner moves, and the seam lands mid-resize.

```css
.kanban-board { align-items: stretch; block-size: 100%; }  /* the shell owns dvh */

.kanban-lane {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;   /* header · cards · add-card */
  max-block-size: 100%;
}

.kanban-cards {
  overflow-y: auto;
  overscroll-behavior-block: contain;
}
```

A header as its own grid row beats a sticky header inside one scroller: the heading sits outside the scroll container, so it needs no `position: sticky`, no z-index, and no `scroll-padding-block-start` to stop a keyboard-focused card landing underneath it. `minmax(0, 1fr)` is what lets the list scroll — a bare `1fr` has an `auto` minimum, so the lane grows instead. For the page-scrolled board, drop the block-size chain and make the lane heading `position: sticky; inset-block-start: var(--app-header-height)`.

**The scroller is the swipe — do not write one.** Inline overflow gives momentum, rubber-banding, mid-fling interruption, a pointer scrollbar, keyboard scrolling, and scroll-into-view for assistive tech. A hand-rolled pager (pointer handlers driving a transform) re-implements all of that and typically loses at least fling interruption and keyboard access. Route lane paging to the scroller; reserve a gesture runtime for card *drag*, which the scroller genuinely does not own. Where the two meet:

- **Constrain the drag's touch activation.** A pointer-drag that starts on the first horizontal move makes the board unpannable on a phone. Use the library's long-press/delay or drag-handle constraint for coarse pointers, and set `touch-action` on the draggable so the browser still owns the axis you are not dragging.
- **`overscroll-behavior-inline: contain`** stops a swipe past the last lane from triggering the browser's back gesture or scrolling an ancestor; the block-axis twin does the same for a lane's card list.
- **Point drag auto-scroll at the real overflow owner** — the board scrolls inline, the lane scrolls block. A library configured against the wrong element auto-scrolls nothing.
- **Programmatic lane jumps** use `scrollIntoView({ inline: "start" })`, with `scroll-behavior: smooth` behind `@media (prefers-reduced-motion: no-preference)`.
- **Lane-header controls and card affordances stay at least 44px** wherever the board is touch-reachable; a 24px icon button reads fine at a desk and is unusable on the phone the same CSS just produced.

For a reusable template, document the coordinated structure so agents and callers preserve it:

```text
KanbanBoard
└── KanbanLane*
    ├── KanbanLaneHeader
    └── KanbanCardList
        └── KanbanCard*
```

Create React components for that tree only when the project benefits from its slots/invariants. Otherwise keep semantic `<section>`/heading/list markup and colocated CSS. Expose fundamental layout inputs such as `laneMin` only if callers genuinely need them; keep card spacing, radius, and color in design tokens rather than growing a prop language.

**Audit an imported board at the seams:**

- Preserve any sound drag/state behavior while changing its layout classes or CSS.
- Render lane-grouped DOM so reading and keyboard order follow the visual board; do not ask CSS to reconstruct React state from interleaved cards.
- Check the board's smallest realistic container, every add/drop-column transition, 200% zoom, long lane titles, long card content, empty lanes, and many lanes.
- Reproduce it at a real phone width, not only a narrow desktop window: exactly one lane should read as the current one, the next should peek, and a fling should land on a lane rather than between two.
- Confirm every lane is reachable without a swipe — keyboard scrolling of the board, and a jump control when the lane count makes paging tedious. Tabbing to a card in an off-screen lane must scroll it fully into view, not leave it clipped at a snap position.
- Verify one intentional owner for inline overflow, one for block overflow that does not change with width, no clipped focus/drag previews, usable lane widths, and correct sticky/auto-scroll boundaries.
- Use a container query for lane *internals* when the same lane appears in dashboard, modal, and full-page slots. A page-level board may correctly use viewport context.

The form-driven `:has()` state-assignment experiment is a separate specialist pattern; load [`advanced.md`](advanced.md#form-driven-board-state-assignment--css-specialist) only when the DOM control itself is the state source. It is not the default Kanban architecture.

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

**When NOT**: page-level shells where the viewport *is* the context; a component that only ever lives at one width.

Style queries and name-only container queries are separate support-sensitive mechanisms. Load [`advanced.md`](advanced.md#advanced-container-queries--css-guarded) only when a normal size query cannot express the required context.

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

**Hidden content needs a visible affordance — size the peek deliberately.** A scroller whose last visible card ends flush with the container edge looks like a complete row, so nobody scrolls it and the remaining items may as well not exist. The fix is layout, not decoration: size items so the next one is *partially* visible past the edge. Give the container the inline padding, match `scroll-padding-inline` to it so snap positions land on the content edge rather than the viewport edge, and subtract both the padding and the intended peek from the item's basis:

```css
.scroller {
  --gutter: 1.5rem;
  --peek: 1.5rem;                      /* visible sliver of the next item */
  --gap: 0.75rem;
  display: flex;
  gap: var(--gap);
  overflow-x: auto;
  padding-inline: var(--gutter);
  scroll-padding-inline: var(--gutter);
  scroll-snap-type: x mandatory;
}
.scroller > * {
  flex: 0 0 calc(100% - var(--gap) - var(--peek));
  scroll-snap-align: start;
}
```

Percentages in `flex-basis` resolve against the flex container's **content box**, so `100%` is already the scroller minus its two gutters — subtract only the gap and the peek, and expect the rendered sliver to run about one gutter wider than `--peek`. Subtracting the gutters again is a common miscalculation that quietly doubles the peek; tune against the rendered result, not the arithmetic.

`--peek` is the parameter; below roughly a thumbnail's width the sliver stops reading as "there is more" and starts reading as a rendering error. The same rule generalizes past scrollers: collapsed content gets a disclosure control whose label states what is hidden ("Show 12 more results", not "More"), and clamped text gets both an ellipsis and a way to expand. Content hidden with no cue at all is content the user will never find — verify the cue at the narrowest supported width, where peeks are most often squeezed out by a gutter.

## The height enigma — full-height without the `100%` chain — tw + css

`height: 50%` needs the parent to have a resolved height, which it usually doesn't (parent sizes to content → circular). Modern fixes, in order:

- **Viewport height** → `min-h-svh` / `min-h-dvh` (the old `html,body{height:100%}` chain is no longer needed).
- **Child fills parent** → put the child in a **grid** parent with `min-h-*`; grid children grow to fill their cell with no extra rule. With flex, add `flex-1` to the child.
- **Fill the containing block respecting margins** → `w-[stretch]` / `h-[stretch]` applies to the margin box — verify the browser floor; otherwise use Grid stretch or Flex growth.

## Safe areas — edge-fixed UI on a non-rectangular screen — css

A rounded corner, a camera cutout, or the home-indicator bar overlaps the viewport rather than shrinking it, so an element pinned to an edge sits underneath the hardware. This is the one mobile failure a desktop resize sweep can never surface — the insets are `0` on every rectangular screen, including a 320px-wide browser window.

Two halves, and both are required:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

```css
.bottom-bar {
  position: fixed;
  inset-inline: 0;
  inset-block-end: 0;
  padding-block-end: max(var(--bar-padding, 1rem), env(safe-area-inset-bottom));
}
```

Without `viewport-fit=cover` every `env(safe-area-inset-*)` resolves to `0` and the CSS is inert — the layout looks correct in review and fails on the device. `max()` rather than addition is what keeps the padding at its design value on a rectangular screen instead of collapsing to nothing; `safe-area-inset-*` values change as browser chrome retracts, while the `safe-area-max-inset-*` constants do not.

Reach for it on anything fixed or full-bleed: bottom navigation, floating actions, sticky footers, drawers, and full-height overlays in landscape, where the left and right insets become the non-zero pair. Set it in the base layer once per surface type — an `env()` sprinkled into component-level arbitrary values is drift, and no native utility owns this at the 2026-07-27 snapshot.

**When NOT**: content in normal page flow. It is already inside the safe area, and padding it again just inflates the gutter.

## Responsive tables — the scroller is the default — tw/css

A table is a fixed set of columns whose min-content width is the sum of its cells, so it is the composition most likely to blow past a phone viewport. Two forms, and the first is almost always right:

```tsx
<div className="overflow-x-auto">
  <table className="w-full min-w-160">{rows}</table>
</div>
```

The `min-w-*` is what makes the scroller work: without it the table compresses each column to min-content, producing unreadable one-word-per-line cells rather than an honest horizontal scroll. Give the wrapper the same treatment any scroller gets — the last column ending flush with the container edge reads as a complete table, so nobody scrolls it. Size in a peek, or pair it with a visible cue.

The second form renders the same data twice, as a table at width and as a stack of labelled cards below it:

```tsx
<table className="hidden md:table w-full">{rows}</table>
<div className="md:hidden">{rows.map(r => <RecordCard key={r.id} record={r} />)}</div>
```

Its cost is real: duplicated DOM, a duplicated accessibility tree, two code paths that drift, and a doubled render for every row. It earns its place only when the narrow representation is a genuinely different information design — a summary that drops columns and re-ranks fields — never as a way to reflow the same table. When both renders show the same cells, use the scroller.

**When NOT**: a table that is really a layout grid. Route that to the intrinsic Grid above; only tabular *data* needs a table.

## Layout one-liners — use only on the owner that exhibits the problem

```css
/* globals.css base layer */
.scroll-region { scrollbar-gutter: stable; }    /* only when this scroll owner shifts */
[id] { scroll-margin-top: var(--sticky-offset); } /* derive from the real sticky owner */
input, select, textarea { font-size: max(16px, 1rem); }   /* iOS zoom floor */
img, video { max-width: 100%; height: auto; }
```
Apply `scrollbar-gutter` only after scrollbar appearance reproduces layout
instability on that scroll owner; overlay-scrollbar platforms may show no
benefit. Derive scroll margins from the sticky header/footer that can obscure a
target rather than applying a guessed global offset.

As utilities where they exist: use `text-balance` on suitable short headings
and `text-pretty` on suitable prose after checking narrow and localized
content; use `aspect-*` on media; use `field-sizing-content` on content-sized
`textarea`/`select`/`input` with a `max-width` guard. Adopt these at the
narrowest semantic owner that proves the need, not as a universal polish pass.

## Focus outline — preserve visibility through layout changes — css

```css
:focus-visible { outline: max(2px, 0.08em) solid currentColor; outline-offset: 0.15em; }
```
`currentColor` follows the element's text color, but that does not prove focus
contrast against every surrounding background. Verify the rendered focus state
in light, dark, error, and colored contexts that apply. When `overflow: hidden`
would clip it, use a project-owned inner/outer ring treatment that preserves
contrast and remains visible outside the clipping owner.

Do not add a new global focus policy during an unrelated layout change. Use this as a diagnostic: a layout that clips or obscures the project's existing indicator is not finished.

## Plain-CSS nesting guardrails

When a reusable layout needs component CSS, keep declarations before nested rules, use `&` explicitly for pseudo-classes/modifiers, and stop around three levels. Native nesting resolves parents through `:is()`, so a high-specificity selector in a comma-separated parent list raises the specificity of every nested branch. Split the rule when that would make overrides surprising.

## Anti-patterns

- Arbitrary value where a utility exists — `min-h-[100dvh]` (→ `min-h-dvh`), `[grid-template-rows:subgrid]` (→ `grid-rows-subgrid`), `[aspect-ratio:16/9]` (→ `aspect-video`).
- `mb-N` on every child instead of `gap-N` or the owl.
- `position: absolute` for layered content that should size its parent — use Stack-overlay, then verify overlap and focus.
- Viewport breakpoints inside a reusable component — use a container query.
- `100vh` / `min-h-screen` on full-screen layouts — use `dvh`/`svh`.
- Repeated, inconsistent `max-w-* px-* mx-auto` wrappers — consolidate into a shared Center; leave a clear one-off alone.
- `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` ladders with no intentional counts — use `repeat(auto-fill, minmax(min(100%, X), 1fr))`; preserve designer-chosen counts.
- Column-grouped masonry approximation on focusable content — reading order breaks, unless `reading-flow` realigns it behind `@supports` and its support is verified.
- Collapsing to a one-column/"mobile" layout while ample width remains (the "too-early breakpoint") — add an intermediate state or use an intrinsic grid; audit the mid-range widths, not just the extremes.
- Content-sized field (`field-sizing-content`) with no `max-width` — it blows out its container like an unbounded track floor.
- Conflating the two blowout fixes — `min(100%, X)` (track floor) vs `min-w-0`/`wrap-anywhere` (item min-content) solve different overflows.
- `overflow-x: hidden` on `html`/`body` (or a section) to "fix" narrow-width overflow — it hides the symptom while leaving the cause, clips whatever escaped, breaks `position: sticky` in descendants, and interferes with scroll anchoring. Diagnose which blowout it is and fix the width that overflows.
- Branching layout on a JS media-query hook — `const isMobile = useMediaQuery(...)` returning one tree or another. The hook resolves after mount, so a server render emits the desktop tree, hydration mismatches, and every phone load flashes the wrong layout before correcting; it also leaves two trees to keep in sync. Express layout state in CSS. Reserve the hook for genuinely behavioral branches — mounting a different *component*, not a different arrangement of the same one.
- Sizing a touch target by viewport width (`md:h-8`) when the concern is the finger — a narrow desktop window is not a thumb. Use `pointer-coarse`.
- `env(safe-area-inset-*)` shipped without `viewport-fit=cover` in the viewport meta tag — every inset resolves to `0` and the rule is inert.
- A responsive table that drops `min-width` on its scroll container — each column compresses to min-content and the data becomes one word per line, which reads as broken rather than scrollable.
- Fixed `width`/`height` on a text container, or a hardcoded button width — sized to the English string; it clips or overflows once translated. `max-width` + wrap, `min-height` for a floor, `padding-inline` for controls.
- Physical direction utilities (`ml-*`, `pr-*`, `left-*`, `text-left`) in a localizable layout — use `ms-*` / `pe-*` / `start-*` / `text-start`; reserve physical sides for genuinely physical geometry.
- A horizontal scroller whose last card ends flush with the container edge — it reads as a complete row and never gets scrolled; size in a peek.
- Hand-rolling anchor positioning where a project/shadcn `Popover`/`Tooltip` already owns the interaction.
- Treating a Kanban board as only a fixed multi-column Grid — choose intrinsic stacking or a deliberate horizontal lane scroller from the board's workflow.
- A lane basis that never reaches the viewport (`min(85%, 18rem)`, a fixed `20rem`) — on a phone the board shows one lane and a fraction, so nothing reads as the current lane and every swipe lands between two.
- Hand-rolled pointer paging for horizontal columns — an overflow scroller with snap points already is the swipe, with momentum, interruption, and keyboard scrolling included.
- `scroll-snap-type: mandatory` at every width — paging is right when one lane fills the view and hostile when seven are visible.
- Moving the block-axis scroll owner at a breakpoint (lane scrolls at desktop, page scrolls on mobile) — sticky headers, drag auto-scroll, and scroll restoration all change meaning mid-resize.
- Reaching for form-driven `:has()` state assignment when application data already groups the cards, or when users need drag-and-drop.
