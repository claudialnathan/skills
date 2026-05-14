# Layout primitives

The eight Every Layout primitives, plus smolcss and modern-CSS recipes that survive in 2026, ported to Tailwind v4 + shadcn (Base UI) idiom.

The point of layout primitives: most layouts are one of eight things. If you find yourself composing flex/grid by hand for the third time, you're rebuilding a primitive that has a name. Reach for the name first.

## The eight primitives

### 1. Stack — vertical rhythm between siblings

Vertical spacing applied between adjacent children only — not at the top or bottom of the stack itself, so stacks compose without margin collapse or double-padding.

```tsx
// One-line via Tailwind's any-arbitrary lobotomized owl
<div className="flex flex-col [&>*+*]:mt-6">
  <h2>Title</h2>
  <p>Body</p>
  <button>Action</button>
</div>

// Or: use gap (works whenever the parent is flex/grid and you want uniform spacing)
<div className="flex flex-col gap-6">…</div>
```

**When to reach for it**: any vertical list of dissimilar elements. Article body, form, card content, settings list.

**`gap` vs lobotomized owl**: `gap` works in flex/grid containers and is simpler. The lobotomized owl (`[&>*+*]:mt-N`) is the right answer when (a) the container can't be flex/grid (e.g., a `prose` block), or (b) you want the *between* semantic — first/last child has no externally-imposed margin.

**Anti-pattern**: applying `mb-N` to every child. Last child gets phantom space.

### 2. Cluster — inline group that wraps cleanly

Tag list, breadcrumb, button group, byline. Wraps on its own at content width.

```tsx
<div className="flex flex-wrap gap-2">
  {tags.map(t => <Badge key={t}>{t}</Badge>)}
</div>
```

**When to reach for it**: anything inline that needs to wrap. Reach for `gap`, never margins (they compound at wrap boundaries).

**Tip**: pair with `align-items: center` if the children have varying heights.

### 3. Sidebar — intrinsic-width sidebar, content fills the rest

A real sidebar that yields to content when narrow. The Every Layout original uses flex-basis math; the modern grid form is cleaner:

```tsx
<div
  className="grid gap-6"
  style={{ gridTemplateColumns: "fit-content(20ch) minmax(min(50vw, 30ch), 1fr)" }}
>
  <aside>{nav}</aside>
  <main>{content}</main>
</div>
```

**Why this shape**:
- `fit-content(20ch)` — the sidebar takes its content width, capped at 20 characters.
- `minmax(min(50vw, 30ch), 1fr)` — the main column is at least 30ch (or 50vw if narrower), at most all remaining space. Below 30ch the layout breaks to one column on its own.

**When to reach for it**: dashboard layouts, docs sites, side-nav app shells. Skip viewport breakpoints — the primitive handles its own collapse.

**JSX with shadcn Sheet for mobile**: keep the sidebar always-rendered and let CSS hide it on narrow viewports if you need a mobile-specific UI.

### 4. Switcher — two columns that fold to one at a content-driven width

The Every Layout switch — flex-basis math that flips orientation when total intrinsic width exceeds a threshold (`--measure`).

```tsx
<div
  className="flex flex-wrap gap-6"
  style={{ "--measure": "60ch" } as React.CSSProperties}
>
  <div className="grow basis-[calc((var(--measure)-100%)*999)]">{left}</div>
  <div className="grow basis-[calc((var(--measure)-100%)*999)]">{right}</div>
</div>
```

**Why this works**: the basis evaluates to a hugely positive or hugely negative number depending on whether the container is wider or narrower than `--measure`. Flexbox clamps; the result is a binary switch from row to column. **No media queries**, content-driven.

**When to reach for it**: marketing two-column with image+text where you want a clean fold to mobile without a designer-picked breakpoint.

### 5. Cover — full viewport, optional centered content

```tsx
<section className="grid min-h-dvh gap-8 p-6 [grid-template-rows:auto_1fr_auto]">
  <header>{topbar}</header>
  <div className="self-center justify-self-center">{centered}</div>
  <footer>{footer}</footer>
</section>
```

**`min-h-dvh` not `min-h-screen`**: `100vh` is wrong on mobile (doesn't account for browser chrome). Tailwind v4's `min-h-dvh` resolves to `100dvh`, which adapts.

**When to reach for it**: hero sections, full-screen modals, marketing splash, login screens.

### 6. Center — max-width centered content (the universal container)

```tsx
// Tailwind v4 form
<div className="mx-auto w-full max-w-prose px-6">{prose}</div>

// Modern CSS form (one rule, gutters built in)
<div style={{ width: "min(100% - 2rem, 60ch)", marginInline: "auto" }}>
  {prose}
</div>
```

**The modern-CSS form** (`width: min(100% - 2rem, max)`) is one rule, has built-in gutters, and never overflows on narrow viewports. **This is the universal container pattern** — reach for it before composing `max-w-* px-* mx-auto`.

**When to reach for it**: every prose container, every page wrapper, every form column.

### 7. Box — border-respecting padding wrapper

A primitive that adds padding without breaking when borders / outlines / shadows surround it. The Every Layout original includes a transparent outline for high-contrast mode:

```tsx
<div className="rounded-lg border bg-card p-6 outline outline-1 outline-transparent">
  {content}
</div>
```

**Why the transparent outline**: in Windows High Contrast Mode, transparent outlines become visible — it's a free a11y signal that costs nothing in normal rendering.

**When to reach for it**: any bordered container with padding. shadcn's Card already implements this; this is the principle, not a new component.

### 8. Grid — auto-fit responsive grid

```tsx
// One rule for "wraps when narrow, fills when wide"
<div
  className="grid gap-6"
  style={{
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 15ch), 1fr))",
  }}
>
  {items.map(...)}
</div>
```

**Why `min(100%, 15ch)`**: without it, on viewports narrower than your `minmax` minimum, the grid overflows. Wrapping the min in `min(100%, X)` clamps it to viewport width — no overflow ever.

**When to reach for it**: card grids, image galleries, product listings. Replaces `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` ladders. No breakpoints, content-driven.

**Tailwind v4 alternative**: `grid grid-cols-[repeat(auto-fit,minmax(min(100%,15ch),1fr))]`.

## Subgrid — siblings that align across each other

When card content (image, title, body, CTA) needs to align across a row of cards, give each card a subgrid that inherits the parent's row tracks:

```tsx
<div className="grid grid-cols-3 gap-6 [grid-template-rows:auto_1fr_auto]">
  {cards.map(c => (
    <article
      key={c.id}
      className="grid [grid-template-rows:subgrid] [grid-row:span_3]"
    >
      <h3>{c.title}</h3>
      <p>{c.body}</p>
      <Button>Read more</Button>
    </article>
  ))}
</div>
```

**Two gotchas (per Comeau's subgrid article)**:
1. Line numbers reset inside the subgrid — `grid-row: 2` references the subgrid's own track 2, not the parent's.
2. **Rows must be reserved** with `grid-row: span N` — subgrids don't auto-generate rows from children.

**Fallback** (older browsers — under ~6% as of 2026):
```css
@supports not (grid-template-columns: subgrid) {
  .card { grid-template-rows: 140px 1fr auto; }
}
```

**When to reach for it**: card grids where titles, images, or CTAs must align across siblings. Pricing tables. Don't use it with `auto-fill`/`auto-fit` minmax — they don't compose well.

## Container queries — component-scoped responsiveness

Reusable components shouldn't ask the *viewport* whether to wrap; they should ask their *container*.

```css
/* In globals.css or a CSS module */
.card-shell { container-type: inline-size; }
```

```tsx
// Tailwind v4 form
<div className="@container">
  <article className="flex flex-col @md:flex-row @md:gap-4">
    <img className="w-full @md:w-48 aspect-video @md:aspect-square" />
    <div>
      <h3 className="text-lg @md:text-xl @lg:text-2xl">{title}</h3>
      <p className="@md:line-clamp-3">{body}</p>
    </div>
  </article>
</div>
```

**Container query units**: `cqi` (inline), `cqb` (block), `cqw`, `cqh`. For fluid type that scales with the *container* not the viewport:
```css
.card-title { font-size: clamp(1rem, 5cqi, 1.5rem); }
```

**When to reach for them**: any time you'd otherwise reach for a viewport breakpoint inside a component. The same card in a sidebar vs a hero behaves differently because the *container* is different — that's the entire point.

## Stack-overlay — layered content in one cell

Hero with text-on-image, video with caption, image with badge. One grid cell, multiple children, all stacked.

```tsx
<div className="grid [grid-template-areas:'stack'] [&>*]:[grid-area:stack]">
  <img src={hero} alt="" className="w-full h-full object-cover" />
  <div className="self-end p-6 text-white">
    <h1>{headline}</h1>
  </div>
</div>
```

**When to reach for it**: any time you're tempted to reach for `position: absolute`. Stack-overlay keeps everything in flow; absolute positioning loses you a11y, hit-testing, scroll, and the parent's intrinsic sizing.

## Breakout grid — content column with break-out elements

Marketing layout where most content sits in a narrow column, but some elements (full-bleed images, pull quotes, decorative grids) break out to wider widths.

```css
.prose-grid {
  display: grid;
  grid-template-columns:
    [grid-start] 1fr
    [content-start] minmax(min(100%, 60ch), 1fr)
    [content-end] 1fr
    [grid-end];
}
.prose-grid > *           { grid-column: content; }
.prose-grid > .breakout   { grid-column: grid; }
```

```tsx
<article className="grid [grid-template-columns:[grid-start]_1fr_[content-start]_minmax(min(100%,60ch),1fr)_[content-end]_1fr_[grid-end]]">
  <h1 className="[grid-column:content]">{title}</h1>
  <p className="[grid-column:content]">{body}</p>
  <figure className="[grid-column:grid]">
    <img src={image} className="w-full" />
  </figure>
</article>
```

**When to reach for it**: long-form articles, marketing pages, docs with occasional full-bleed media. shadcn marketing sites reach for and re-invent this badly.

## Scroll snap — horizontal carousel without JS

```tsx
<div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4">
  {items.map(i => (
    <div key={i.id} className="snap-center snap-always shrink-0 w-[min(45ch,60vw)]">
      {i.content}
    </div>
  ))}
</div>
```

**When to reach for it**: image galleries, testimonial sets, mobile card scrollers. The `snap-always` is the difference between a polished carousel and one that keeps drifting between snap points.

## Modern CSS one-liners — set these once

These belong at the type / global / app shell layer, not per component:

```css
/* In globals.css base layer */
:root {
  color-scheme: light dark;        /* native form / scrollbar adapts */
  accent-color: var(--color-primary);
  scrollbar-gutter: stable;        /* no layout shift on overflow */
}

html { -webkit-font-smoothing: antialiased; }

h1, h2, h3, h4 { text-wrap: balance; }
p, li          { text-wrap: pretty; }

img            { aspect-ratio: attr(width) / attr(height); }
img, video     { max-width: 100%; height: auto; }

[id]           { scroll-margin-top: 4rem; }  /* clears sticky header on anchor links */
input, select, textarea { font-size: max(16px, 1rem); }  /* iOS zoom prevention */

button         { cursor: pointer; }
```

These are reflexive. Don't write them per component; set them once at the global layer.

## Currentcolor focus outline — universal pattern

```css
:focus-visible {
  outline: max(2px, 0.08em) solid currentColor;
  outline-offset: 0.15em;
}
```

**Why it works**: `currentColor` is the element's own `color`. Focus ring matches text color → adapts to dark mode automatically, adapts to error states, adapts when nested inside colored sections. **One rule for the whole app.**

For component-internal focus (when the outline would be clipped by `overflow: hidden`), use the double-shadow Rauno pattern:
```css
:focus-visible {
  box-shadow:
    0 0 0 2px var(--color-background),
    0 0 0 4px var(--color-ring);
}
```

## Stack of reach — layout decision tree

First, check whether the simple form is enough — `flex flex-col gap-N`, `grid grid-cols-N`, shadcn's existing components. If it works at every viewport without layout shift or content-driven breakage, stop there. Don't refactor working layouts into named primitives just because the primitives have names.

When the simple form *isn't* enough — layout shifts at narrow widths, responsiveness needs content-driven thresholds, you're rebuilding the same flex/grid math by hand — walk this tree top-to-bottom. Stop at the first match.

1. Does this need to wrap inline? → **Cluster**.
2. Does this stack vertically? → **Stack** (or `flex-col gap-N`).
3. Does this need a fixed-content sidebar? → **Sidebar** (grid form).
4. Does this need to fold from row to column without a media query? → **Switcher**.
5. Does this fill the viewport? → **Cover** with `min-h-dvh`.
6. Does this center max-width content? → **Center** (`width: min(100% - gutter, max); margin-inline: auto`).
7. Is this a card / box with padding? → **Box** (or shadcn `Card`).
8. Is this a uniform grid of cards? → **Grid** (`auto-fit, minmax(min(100%, X), 1fr)`).
9. Do siblings need to align across cards? → **Subgrid**.
10. Are layered children in one cell? → **Stack-overlay**.
11. Is there a content column with break-out elements? → **Breakout grid**.
12. Is this a horizontal scroller with snap? → **Scroll snap**.
13. Should responsiveness scope to the component, not the viewport? → **Container queries**.

If none match, you're probably building a new primitive. Name it; reach for the named pattern next time.

## Anti-patterns

- `mb-N` on every child instead of `gap-N` or the lobotomized owl.
- `position: absolute` for layered content — use Stack-overlay.
- Viewport breakpoints inside reusable components — use container queries.
- `100vh` on full-screen layouts — use `100dvh` (`min-h-dvh`).
- `max-width + padding + margin: auto` ladder — use `width: min(100% - gutter, max); margin-inline: auto`.
- `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` ladder — use `repeat(auto-fit, minmax(min(100%, X), 1fr))`.
- Flexbox math by hand for sidebar/switcher — use the named pattern.

## Further reading

- Every Layout (Heydon Pickering / Andy Bell): the canonical book on these primitives.
- smolcss.dev (Stephanie Eckles): minimal CSS demos for most of the above patterns.
- moderncss.dev (Stephanie Eckles): article series on platform-native solutions.
- Josh Comeau on subgrid, container queries: practical recipes with browser support context.
