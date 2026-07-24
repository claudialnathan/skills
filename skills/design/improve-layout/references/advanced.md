# Guarded and specialist layout mechanisms

Load this file only after the stable baseline in [`patterns.md`](patterns.md) is understood. Every mechanism here is either niche, support-sensitive, or easy to misuse. Keep the unenhanced layout usable, verify the project's browser floor against current primary documentation, and test source/focus order in the rendered result.

| Need | Mechanism | Load when | Stable fallback |
| :-- | :-- | :-- | :-- |
| A form-driven board visually groups cards from each card's own control | [`:has()` state assignment](#form-driven-board-state-assignment--css-specialist) | The DOM control is the state source and no drag/reorder behavior is required | Render lanes from application data, or keep a single-column list |
| Waterfall packing | [Grid Lanes](#grid-lanes--masonrywaterfall-packing--css-guarded) | A plain responsive Grid is insufficient and the draft feature is a tested enhancement | Responsive Grid in source order |
| A component responds to an ancestor custom property or container name | [Advanced container queries](#advanced-container-queries--css-guarded) | The default size-query pattern cannot express the variant | Unqueried default layout |
| Raw tethering outside an installed popover/tooltip/menu | [Anchor positioning](#anchor-positioning--sh-first-else-css) | No existing behavioral component owns the interaction | Existing positioning/component implementation |

## Form-driven board state assignment — css (specialist)

Use this only for a form-first status board where each card owns a radio group or select and changing that control should visually move the card. It removes JavaScript that *paints an already-represented form state into a column*; it does not replace application state, persistence, drag-and-drop, or a data model.

In a React application that already knows each task's state, render lane groups from that data. Avoid interleaving every card in one DOM list and asking CSS to reconstruct the application model.

For the specialist form case, give the wide board fixed state columns and let `:has()` assign each card. Render and place a visible heading for every state; the abbreviated example focuses only on card assignment:

```css
.state-board {
  container: board / inline-size;
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--board-gap, 1rem);
}

.state-card:has(input[value="on-deck"]:checked) {
  --state-color: var(--color-on-deck);
}

.state-card:has(input[value="in-progress"]:checked) {
  --state-color: var(--color-in-progress);
}

.state-card:has(input[value="done"]:checked) {
  --state-color: var(--color-done);
}

@container board (inline-size >= 50rem) {
  .state-board {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-flow: column;
  }

  .state-card { grid-column: 1; }
  .state-card:has(input[value="in-progress"]:checked) { grid-column: 2; }
  .state-card:has(input[value="done"]:checked) { grid-column: 3; }
}
```

For a native `<select>`, target its selected option rather than copying the radio selector:

```css
.state-card:has(option[value="in-progress"]:checked) {
  grid-column: 2;
}
```

Choose a viewport query instead when the board is a page-level shell; use the named container query only when the board lives in variable-width slots.

**Focus-order guard:** `grid-auto-flow: column` can group cards visually while Tab order still follows interleaved DOM order. Prefer lane-grouped DOM. `reading-flow: grid-columns` may realign focus where supported, but only as a verified enhancement:

```css
@supports (reading-flow: grid-columns) {
  .state-board { reading-flow: grid-columns; }
}
```

Keep aligned source order as the cross-browser baseline. A `reading-flow` container becomes a focus-scope owner, and positive `tabindex` does not define ordering inside it; test the whole board's real keyboard sequence.

## Grid Lanes — masonry/waterfall packing — css (guarded)

The CSS Grid Level 3 draft direction is Grid Lanes, using `display: grid-lanes` with familiar grid track properties. Treat syntax and support as perishable.

```css
.waterfall {
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(min(100%, var(--lane-min, 15rem)), 1fr)
  );
  gap: var(--lane-gap, 1rem);
}

@supports (display: grid-lanes) {
  .waterfall {
    display: grid-lanes;
  }
}
```

Ship it only after checking the project's browser matrix and rendered behavior. Inspect source, focus, and visual order; tune `flow-tolerance` from real content rather than treating a draft default as universal.

**Composable approximation:** pre-group markup into columns, lay those columns out with a Switcher, and Stack items inside each column. This is not automatic packing and makes reading/Tab order run top-to-bottom by column. Restrict it to non-focusable decorative content. Anything interactive needs a plain responsive Grid or a tested implementation that preserves navigation order.

Where support permits, `reading-flow` can make sequential focus follow a flex/grid visual order:

```css
@supports (reading-flow: flex-visual) {
  .reordered-grid { reading-flow: grid-rows; }
}
```

Never use that enhancement as permission to ship a reordered focus baseline. Keep source and visual order aligned without it.

## Advanced container queries — css (guarded)

Use ordinary size queries from `patterns.md` for the common case.

**Style queries** restyle descendants from a custom-property value on an ancestor container:

```css
@container style(--featured: true) {
  .card {
    display: grid;
    gap: 0;
  }
}
```

Size and style queries can nest when a featured variant also depends on available space. Keep the unqueried default complete because support differs by engine.

**Name-only container queries** select by container name without a size condition:

```css
@container sidebar {
  .card { /* sidebar-context adjustment */ }
}
```

Use either mechanism only when it expresses a real context contract more clearly than a React variant/data attribute. Verify support before relying on it.

## Anchor positioning — sh first, else css

Prefer installed project/shadcn `Popover`, `Tooltip`, `DropdownMenu`, or `HoverCard` components: they already own interaction, focus, collision, and fallback behavior. Reach for raw CSS anchor positioning only to tether outside such a component contract.

```css
.trigger { anchor-name: --trigger; }

.tethered {
  position: fixed;
  position-anchor: --trigger;
  position-area: top;
  position-try-fallbacks: flip-block;
}
```

Use `fixed` when the viewport is the overflow boundary; with `absolute`, a containing block can scroll with the target and prevent the expected viewport fallback. `flip-block` also flips directional margins.

Anchored container queries for a flipping caret (`container-type: anchored` plus `@container anchored(...)`) require an inner element because a container query styles descendants, not the query container itself. Keep an established positioning implementation as the load-bearing fallback until the project's browser floor covers the required feature set.
