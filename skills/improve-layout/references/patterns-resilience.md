# Viewport and layout-resilience patterns

Load this file only for height ownership, device safe areas, responsive tables,
focus visibility, local one-line repairs, nesting, or a resilience-specific
anti-pattern check.

Owner tags: **sh** existing/shadcn behavioral component · **tw** native
Tailwind v4 utility · **css** authored CSS that passed the measurable-benefit
gate in `SKILL.md`.

## Contents

- [Height](#height--full-height-without-the-100-chain--tw--css)
- [Safe areas](#safe-areas--edge-fixed-ui-on-a-non-rectangular-screen--css)
- [Responsive tables](#responsive-tables--the-scroller-is-the-default--twcss)
- [Layout one-liners](#layout-one-liners--use-only-on-the-owner-that-exhibits-the-problem)
- [Focus outline](#focus-outline--preserve-visibility-through-layout-changes--css)
- [Plain-CSS nesting guardrails](#plain-css-nesting-guardrails)
- [Anti-patterns](#anti-patterns)

## Height — full-height without the `100%` chain — tw + css

Percentage heights require a resolved containing-block height. Choose the
replacement by ownership:

- **Viewport height** → use `min-h-dvh` when the viewport-sized minimum
  should respond to retractable browser interface state; use `min-h-svh` when
  it must fit with that interface expanded.
- **Child fills parent** → put the child in a **grid** parent with `min-h-*`; grid children grow to fill their cell with no extra rule. With flex, add `flex-1` to the child.
- **Fill the containing block respecting margins** → `w-[stretch]` /
  `h-[stretch]` applies to the margin box. Use it only after verifying support
  against the target repository's browser floor; otherwise use Grid stretch or
  Flex growth.

## Safe areas — edge-fixed UI on a non-rectangular screen — css

Fixed and full-bleed surfaces need both the viewport setting and inset padding:

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

Without `viewport-fit=cover`, the full-bleed contract is not established; do
not rely on non-zero `env(safe-area-inset-*)` values. `max()` preserves the
design padding when the inset is smaller. The `safe-area-inset-*` values change
with browser chrome; the `safe-area-max-inset-*` constants do not.

Apply this to edge-fixed or full-bleed bottom navigation, floating actions,
sticky footers, drawers, and full-height overlays. In landscape, account for
the left and right insets as well. Keep positioning logical (`inset-inline`,
`inset-block`); the safe-area environment variables themselves name physical
edges. Define the rule once per surface type. At the 2026-07-27 reference
snapshot, no native utility owns these insets.

**When NOT**: content already constrained by a safe-area-aware ancestor, or by
a viewport that remains automatically inset because `viewport-fit=cover` is
not enabled. Do not add the inset again on each descendant.

## Responsive tables — the scroller is the default — tw/css

Default to one semantic table inside a horizontal scroller:

```tsx
<div className="overflow-x-auto">
  <table className="w-full min-w-160">{rows}</table>
</div>
```

The wrapper is the scroll owner; put `min-w-*` on the table or content inside it
so that content overflows the wrapper instead of compressing each column to
min-content. Size in a partial next column or provide another visible overflow
cue.

The second form renders the same data twice, as a table at width and as a stack of labelled cards below it:

```tsx
<table className="hidden md:table w-full">{rows}</table>
<div className="md:hidden">{rows.map(r => <RecordCard key={r.id} record={r} />)}</div>
```

Use the second form only when narrow screens need a different information
design that drops columns or re-ranks fields. It duplicates the DOM,
accessibility tree, render work, and maintenance path. When both forms show the
same cells, keep the scroller.

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
`textarea`/`select`/`input` with a `max-width` guard. Apply these at the
narrowest semantic owner that shows the need.

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

- `100vh` or `min-h-screen` where browser chrome changes the available height.
  Choose `dvh` or `svh` from the surface's fit requirement.
- A percentage-height chain whose containing block has no resolved height, or a
  fixed height that clips growing or localized content. Give height ownership
  to the viewport, Grid, or Flex as appropriate.
- Relying on safe-area insets for a full-bleed surface without
  `viewport-fit=cover`, or applying them again beneath a safe-area-aware
  ancestor.
- A responsive table with `min-width` on the scroll wrapper instead of the
  table or content inside it. Keep the wrapper as the actual scroll owner.
- A card view that duplicates the same table cells. Keep one scroller unless
  the narrow representation changes the information design.
- `scrollbar-gutter` on an ancestor rather than the scroll owner, or without a
  reproduced layout shift.
- `overflow: hidden` used to conceal width overflow or allowed to clip the
  project's focus indicator. Fix the overflowing content and preserve visible
  focus at the clipping owner.
- A new global focus style added during a local layout repair. Preserve and
  verify the project's existing focus treatment in every affected context.
- Deep native nesting, or a high-specificity selector in a comma-separated
  parent list that raises every nested branch through `:is()`. Split the rule
  before it makes overrides surprising.
