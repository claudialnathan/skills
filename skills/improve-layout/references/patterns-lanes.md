# Lane, container, and scroller patterns

Load this file only for Kanban/status lanes, component-scoped container
responsiveness, or a native horizontal scroller.

Owner tags: **sh** existing/shadcn behavioral component · **tw** native
Tailwind v4 utility · **css** authored CSS that passed the measurable-benefit
gate in `SKILL.md`.

## Contents

- [Kanban board](#kanban-board--one-lane-on-a-phone-many-lanes-on-a-desk--twcss-plus-behavioral-owner)
- [Container queries](#container-queries--component-scoped-responsiveness--tw)
- [Scroll snap](#scroll-snap--carousel-without-js--tw)

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
