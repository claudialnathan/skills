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
| Cross-card row alignment | Subgrid | It earns its place only across siblings | [Subgrid](#subgrid--align-content-across-sibling-cardsrows--tw) |
| Wrapper blocks children from joining a grid | `contents` on a neutral wrapper | Preserve load-bearing semantics/box styles | [`display: contents`](#display-contents--promote-a-wrappers-children-into-the-parent-grid--tw) |
| Layered content that should size its parent | Single-cell Grid overlay | Check focus, hit testing, and contrast | [Stack-overlay](#stack-overlay--layered-content-in-one-cell--css) |
| Full-bleed child inside constrained content | Named-line Grid or container units | Confirm inline direction/offset | [Breakout](#breakout--full-bleed--content-column-with-wider-elements--css) |
| Layout responds to DOM shape/quantity | `:has()` visual condition | Keep application state in application code | [`:has()` and quantity](#has--quantity-queries--content-aware-layout--css) |
| Kanban/status lanes scale down poorly | Intrinsic lane Grid or horizontal lane scroller | Choose stack vs parallel continuity from the task | [Kanban board](#kanban-board--fluid-lanes-first--twcss-plus-behavioral-owner) |
| Component responds to its allocated slot | Container query | Use viewport context for page shells | [Container queries](#container-queries--component-scoped-responsiveness--tw) |
| Plain horizontal scroller | Flex overflow plus scroll snap if useful | Do not imply full carousel behavior | [Scroll snap](#scroll-snap--carousel-without-js--tw) |
| Percentage/full-height chain fails | Viewport unit, Grid stretch, or Flex growth | Resolve which containing block owns height | [Height](#the-height-enigma--full-height-without-the-100-chain--tw--css) |
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

## Kanban board — fluid lanes first — tw/css plus behavioral owner

Separate the board's **layout contract** from its **interaction contract**. CSS owns how lanes use available space. Application data owns which tasks belong to each lane. A tested behavior library owns drag sensors, announcements, keyboard movement, collision, and persistence when cards can be reordered.

First choose what narrow screens should preserve:

| Board intent | Narrow behavior | Layout |
| :-- | :-- | :-- |
| Overview or status summary; seeing one complete lane at a time is acceptable | Lanes drop from many columns to fewer, then stack | Intrinsic Grid |
| Active workflow or drag-and-drop; comparison between neighboring lanes must remain | Lanes remain parallel and the board scrolls horizontally | Flex/Grid lane scroller |
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

This removes a column-count breakpoint ladder and lets the board respond to its actual inline size. Use `auto-fit` when the remaining lanes should stretch; use `auto-fill` when empty track space is part of the board design.

**Parallel lane scroller — preserves the board mental model:**

```css
.kanban-board {
  display: flex;
  gap: var(--kanban-gap, 1rem);
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-snap-type: inline proximity;
}

.kanban-lane {
  flex: 1 0 min(85%, var(--kanban-lane-min, 18rem));
  min-inline-size: 0;
  scroll-snap-align: start;
}
```

Do not add a nested vertical scroller to every lane by reflex. Decide whether the page, board, or lane owns block-axis scrolling; sticky lane headers and drag auto-scroll depend on that boundary.

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
- Verify one intentional owner for inline overflow, no clipped focus/drag previews, usable lane widths, and correct sticky/auto-scroll boundaries.
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

## The height enigma — full-height without the `100%` chain — tw + css

`height: 50%` needs the parent to have a resolved height, which it usually doesn't (parent sizes to content → circular). Modern fixes, in order:

- **Viewport height** → `min-h-svh` / `min-h-dvh` (the old `html,body{height:100%}` chain is no longer needed).
- **Child fills parent** → put the child in a **grid** parent with `min-h-*`; grid children grow to fill their cell with no extra rule. With flex, add `flex-1` to the child.
- **Fill the containing block respecting margins** → `w-[stretch]` / `h-[stretch]` applies to the margin box — verify the browser floor; otherwise use Grid stretch or Flex growth.

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
- Hand-rolling anchor positioning where a project/shadcn `Popover`/`Tooltip` already owns the interaction.
- Treating a Kanban board as only a fixed multi-column Grid — choose intrinsic stacking or a deliberate horizontal lane scroller from the board's workflow.
- Reaching for form-driven `:has()` state assignment when application data already groups the cards, or when users need drag-and-drop.
