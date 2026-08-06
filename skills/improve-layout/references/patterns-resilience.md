# Viewport and layout-resilience patterns

Load this file only for height ownership, device safe areas, responsive tables,
focus visibility, local one-line repairs, nesting, or a final anti-pattern
check.

Owner tags: **sh** existing/shadcn behavioral component · **tw** native
Tailwind v4 utility · **css** authored CSS that passed the measurable-benefit
gate in `SKILL.md`.

## Contents

- [Height](#the-height-enigma--full-height-without-the-100-chain--tw--css)
- [Safe areas](#safe-areas--edge-fixed-ui-on-a-non-rectangular-screen--css)
- [Responsive tables](#responsive-tables--the-scroller-is-the-default--twcss)
- [Layout one-liners](#layout-one-liners--use-only-on-the-owner-that-exhibits-the-problem)
- [Focus outline](#focus-outline--preserve-visibility-through-layout-changes--css)
- [Plain-CSS nesting guardrails](#plain-css-nesting-guardrails)
- [Anti-patterns](#anti-patterns)

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
