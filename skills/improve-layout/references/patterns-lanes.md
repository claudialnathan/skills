# Lane, container, and scroller patterns

Load this file only for Kanban/status lanes, component-scoped container
responsiveness, or a native horizontal scroller.

Owner tags: **sh** existing/shadcn behavioral component · **tw** native
Tailwind v4 utility · **css** authored CSS that passed the measurable-benefit
gate in `SKILL.md`.

## Contents

- [Kanban board](#kanban-board--one-lane-on-a-phone-many-lanes-on-a-desk--twcss-plus-behavioral-owner)
- [Container queries](#container-queries--component-scoped-responsiveness--tw)
- [Scroll snap](#scroll-snap--native-horizontal-scroller--tw)

## Kanban board — one lane on a phone, many lanes on a desk — tw/css plus behavioral owner

Separate the board's **layout contract** from its **interaction contract**. CSS owns how lanes use available space and how the board pans. Application data owns which tasks belong to each lane. A tested behavior library owns drag sensors, announcements, keyboard movement, collision, and persistence when cards can be reordered.

Define the narrow behavior before selecting the wide-screen track rule:

| Board intent | Narrow behavior | Layout |
| :-- | :-- | :-- |
| Overview or status summary; seeing one complete lane at a time is acceptable | Lanes drop from many columns to fewer, then stack into one scrolling page | Intrinsic lane Grid |
| Active workflow or drag-and-drop; comparison between neighboring lanes must remain | Lanes stay parallel; one lane fills the view and the board pages sideways | Lane scroller |
| A product-defined compact representation exists | Switch to that representation at its pressure point | One intentional container/viewport query |

Choose the transition from measured lane/card pressure, not device labels. Stack only when the workflow can lose side-by-side lane comparison.

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

This responds to the board's inline size without a column-count breakpoint ladder. Use `auto-fit` when remaining lanes should stretch and `auto-fill` when empty track space is intentional. In the single-column state, source order becomes reading order; keep workflow order and include the card count in each lane heading.

**Native scroller contract, specialized for lanes:**

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

The `min()` creates one content-driven crossover. Above it, `--lane-max` wins and more lanes enter the view. Below it, the subtraction wins and leaves one lane plus the deliberate peek. A fixed basis, or a `min()` whose crossover falls below the supported container range, cannot produce both states; for example, `min(85%, 18rem)` stays at `18rem` until the content box is narrower than about `21.18rem`.

**Percentages in `flex-basis` resolve against the flex container's content box**, so `100%` is already the board minus its two gutters. Subtract only the gap and the peek, and expect the rendered sliver to run about one gutter wider than `--lane-peek`. Tune it against the rendered board at the narrowest supported width rather than trusting the arithmetic.

**Switch snap strength at the same crossover:**

```css
/* a container cannot query itself — the wrapper carries the container */
.kanban-shell { container: board / inline-size; }

/* keep in sync with the min() crossover: --lane-max + gap + peek + both gutters */
@container board (inline-size < 24.75rem) {
  .kanban-board { scroll-snap-type: inline mandatory; }
  .kanban-lane { scroll-snap-stop: always; }
}
```

Use mandatory snapping plus `scroll-snap-stop: always` below the crossover so a relative fling cannot pass the first eligible lane snap point. Keep proximity snapping above it so pointer scrolling across several visible lanes need not stop at each lane. Because `always` can require one gesture per lane, provide a jump control such as a lane menu or heading strip when the board has many lanes. At the 2026-07-26 snapshot a dimensional container query cannot read that threshold from a custom property, so the number is duplicated; keep the crossover comment. A page-level board may use a viewport media query instead.

**Assign one scroll owner per axis.** The board owns inline scrolling. In a full-height board, each lane's card list owns block scrolling; in page flow, the page owns it and lanes grow. Do not change the block-axis owner at a width breakpoint because sticky headers, drag auto-scroll, and scroll restoration depend on that owner.

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

In the full-height form, keep the header in its own grid row outside the card scroller. It then needs no sticky positioning, z-index, or block scroll padding. Use `minmax(0, 1fr)` so the list can shrink and scroll; a bare `1fr` retains an `auto` minimum and lets the lane grow. For the page-scrolled form, remove the block-size chain and use `position: sticky; inset-block-start: var(--app-header-height)` on the lane heading.

Use native inline overflow for lane panning and reserve the gesture runtime for card *drag*. Integrate the two owners as follows:

- **Constrain the drag's touch activation.** A pointer-drag that starts on the first horizontal move makes the board unpannable on a phone. Use the library's long-press/delay or drag-handle constraint for coarse pointers, and set `touch-action` on the draggable so the browser still owns the axis you are not dragging.
- **`overscroll-behavior-inline: contain`** stops a swipe past the last lane from triggering the browser's back gesture or scrolling an ancestor; the block-axis twin does the same for a lane's card list.
- **Point drag auto-scroll at the real overflow owner** — the board scrolls inline, the lane scrolls block. A library configured against the wrong element auto-scrolls nothing.
- **Programmatic lane jumps** use `scrollIntoView({ inline: "start" })`, with `scroll-behavior: smooth` behind `@media (prefers-reduced-motion: no-preference)`.
- **Keep lane-header controls and card affordances at least 44px** wherever the board is touch-reachable.

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

## Scroll snap — native horizontal scroller — tw

```tsx
<div className="flex snap-x snap-proximity gap-6 overflow-x-auto pb-4">
  {items.map(i => (
    <div key={i.id} className="w-[min(45ch,60vw)] shrink-0 snap-center">{i.content}</div>
  ))}
</div>
```
This baseline uses proximity snapping. Use `snap-mandatory` with `snap-always` only for explicit one-item paging, then provide jump controls when sequential gestures make distant items tedious to reach. A plain horizontal list needs no carousel runtime; preserve an existing behavior owner when the product requires controls, status, autoplay, or other carousel semantics.

Reuse the native-scroller contract above: the overflow element owns inline scrolling, matching padding and `scroll-padding-inline` align inset snap positions, and the item basis leaves a deliberate peek when that cue is required. In a Flex scroller, percentages resolve against the content box, so subtract the gap and peek from `100%`, not the inline gutters. Tune the peek at the narrowest supported container width; if no next item remains visible, add a labeled next or jump control.

Keep DOM order equal to visual order, ensure keyboard focus scrolls every interactive item fully into view, and expose every item without requiring a swipe.
