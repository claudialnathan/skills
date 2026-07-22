---
name: improve-layout
description: "Audit or build layout on a Tailwind v4 + shadcn (Base UI) + React stack by routing each role to its owner: a shadcn component where one owns the role (app sidebar/shell, aspect-ratio, resizable, scroll-area, blocks), a native Tailwind utility before any arbitrary value (grid, subgrid, container queries, dvh/svh, wrap-anywhere, safe alignment), or hand-rolled modern baseline CSS only where it measurably removes a breakpoint ladder, drops a JS dependency, cuts code, or fixes a real UX bug (blowout, CLS, iOS zoom, mobile chrome) — never neater-for-its-own-sake, never against the layout's intent. The CSS patterns also stand alone without the stack. Use when building or reviewing page structure, responsive or fluid behavior, grids, sidebars, section rhythm, scaling type, full-height mobile layouts, card and subgrid alignment, overlays, breakout or full-bleed, carousels, or when a layout breaks at narrow widths."
compatibility: Tailwind v4 + shadcn (Base UI) + React/Next.js; the CSS patterns degrade to any stack
paths:
  - '**/components/**/*.{ts,tsx,jsx}'
  - '**/app/**/*.{tsx,jsx,mdx}'
  - '**/pages/**/*.{tsx,jsx,mdx}'
  - '**/src/components/**/*.{ts,tsx,jsx}'
  - '**/{globals,app,tailwind,index}.css'
  - '**/styles/**/*.css'
---

# improve-layout

Pause before emitting layout code. Read what's there first: open `globals.css` (or `app.css` / `tailwind.css`), skim the `@theme` block for the tokens in play, and look at sibling components for the in-use pattern. Then **route** the layout role to its owner — don't reflex into a hand-rolled div or a breakpoint ladder. Apply everything here within the framework's conventions; Tailwind v4 configures at `@theme` in CSS, not `tailwind.config.js`.

## Route every layout role to its owner

Three owners, checked in order. The first that owns the role wins.

1. **A shadcn component owns it → use the component, don't hand-roll.** App sidebar/shell, aspect-ratio lock, resizable panes, scrollable region, divider, off-canvas panel, or a whole page template (Blocks). shadcn source is copied into `components/ui/` and is yours to edit — extend it there, never build a parallel one (that's `shadcn-tailwind`'s rule).
   - **The Sidebar collision** (the classic mistake): shadcn `Sidebar` is a stateful app-nav *shell* — collapsible, mobile `Sheet`, ⌘B, `SidebarProvider`. The Every Layout "sidebar" is a *content-flow column* beside flexible content that wraps on its own. Same word, different jobs. Route the app shell to shadcn; route the content-flow column to CSS (owner 3).
2. **A native Tailwind v4 utility owns it → use the utility, never an arbitrary value.** The native surface keeps growing, so re-check before hand-writing: `grid-cols-subgrid` / `grid-rows-subgrid`, container queries (`@container`, `@md:`, `@max-md:`, named `@container/main`), `min-h-dvh` / `svh` / `lvh`, `aspect-video`, `text-balance` / `text-pretty`, `field-sizing-content`, `has-*`, `wrap-anywhere` (drops the old `min-width:0` flex hack), `items-center-safe` / `justify-center-safe`. If a utility exists, an arbitrary value (`min-h-[100dvh]`, `[grid-template-rows:subgrid]`) is drift — the utility is what the rest of the codebase reads.
3. **Nothing owns it → hand-roll modern baseline CSS, but only where it earns its place (next section).** The intrinsic content-flow sidebar, switcher, centering container, breakout, stack-overlay, `:has()` + quantity content-aware layout, masonry fallback, anchor positioning. Reach for the Tailwind **arbitrary-value** form first (`grid-cols-[fit-content(20ch)_minmax(min(50vw,30ch),1fr)]`); drop to plain CSS in `@layer` only when the value recurs or won't fit a class. Read tokens as CSS vars / `--spacing(n)` — `theme()` is deprecated in v4.

## When modern CSS earns its place — the whole game

A modern-CSS or "neater" alternative is right only when it does one of these, measurably. Name which one before you make the swap:

- **Removes a breakpoint ladder** — `repeat(auto-fit, minmax(min(100%, 15ch), 1fr))` replaces `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`.
- **Drops a JS dependency** — container queries replace a ResizeObserver; `Popover`/anchor positioning replaces a floating-ui bundle; CSS masonry replaces a masonry lib. Fewer deps is a real, shippable win.
- **Cuts lines** — one `width: min(100% - 2rem, 60ch); margin-inline: auto` replaces the `max-w-* px-* mx-auto` trio, gutters built in.
- **Fixes a concrete UX bug** — blowout (grid overflow), CLS (`aspect-ratio`), iOS input zoom (`font-size: max(16px, 1rem)`), mobile chrome (`dvh`).

Hits none of these? It's fancy for its own sake. Leave the working layout alone — that is the correct output, and reviewing a layout that needed nothing produces no table row.

## Respect intent — the guard against clever swaps

Read *why* a layout is shaped the way it is before "improving" it. The neater alternative is **wrong** when it fights intent:

- A row set **not to wrap** (a fixed toolbar, a one-line nav) — don't turn it into a Cluster/Switcher that folds.
- A **designer-chosen breakpoint** the design depends on — don't replace it with content-driven folding that flips at a different, uncontrolled width. One intentional `@container`/breakpoint beats three magic media-query numbers, but a *chosen* number is not a magic one.
- **Focusable grid items** — the composable "masonry" (switcher + stack) breaks keyboard/reading order; use it only for non-focusable content.
- **`auto-fit` vs `auto-fill`** — `auto-fit` stretches items to fill the row; `auto-fill` keeps column width and leaves empty tracks. They are different behaviors, not a default — pick for what the design wants.

When you can't tell why a layout is shaped a certain way, ask or leave it. A working layout with a reason beats a neater one that breaks it.

## Componentize by parameter, never by parallel library

When a hand-rolled primitive recurs, componentize it by **parameterizing with CSS custom properties as props** — not by copying a fixed component library that drifts from the stack. One worked form, adapted to the project's own className idiom:

```tsx
// Center — the universal max-width container, measure as a prop
function Center({ measure = "60ch", children }: { measure?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full px-4" style={{ maxWidth: measure }}>{children}</div>
  )
}
// Or the modern-CSS body with gutters built in:
//   <div style={{ width: `min(100% - 2rem, ${measure})`, marginInline: "auto" }}>
```

The custom property *is* the prop (`--measure`, `--min`, `--sidebar-size`, `--grid-min`) — it keeps one source of truth and lets the same primitive nest and recompose. Never componentize a role shadcn already owns; extend shadcn's source instead. `references/layout.md` gives the parametric form for each primitive.

## Layout reflex table

Owner column: **sh** = shadcn component · **tw** = native Tailwind utility · **css** = hand-rolled modern CSS (arbitrary value, then plain CSS if it recurs).

| Need | Reach for | Owner |
| :--- | :--- | :--- |
| App nav shell / dashboard sidebar | shadcn `Sidebar` (collapsible, mobile `Sheet`, ⌘B) | sh |
| Whole page template to start from | shadcn Blocks (`dashboard-01`, `sidebar-NN`) | sh |
| Locked media ratio (kills CLS) | `aspect-video` / `aspect-square` / `aspect-[3/2]` | tw |
| Draggable split panes | shadcn `Resizable` | sh |
| Bounded custom-scrollbar region | shadcn `ScrollArea` | sh |
| Tooltip/popover tethered to a trigger | shadcn `Popover`/`Tooltip` (Base UI); anchor positioning only if hand-rolling | sh |
| Container with gutters (universal wrapper) | `width: min(100% - 2rem, <max>); margin-inline: auto` | css |
| Vertical rhythm between siblings (Stack) | `flex flex-col gap-N` | tw |
| Inline group that wraps (Cluster) | `flex flex-wrap gap-N` | tw |
| Content-flow sidebar that yields when narrow | `grid-cols-[fit-content(20ch)_minmax(min(50vw,30ch),1fr)]` | css |
| Two columns that fold at content width (Switcher) | flex + `basis-[calc((var(--measure)-100%)*999)]` | css |
| Full mobile viewport | `min-h-dvh` (never `min-h-screen` = `100vh`) | tw |
| Responsive card grid, no breakpoints | `grid-cols-[repeat(auto-fit,minmax(min(100%,15ch),1fr))]` | tw |
| Cards aligned across a row (image/title/CTA) | `grid-rows-subgrid` + `row-span-N` | tw |
| Layered content in one cell (text on image) | grid stack-overlay, not `position: absolute` | css |
| Content column with full-bleed breakout | breakout grid, or `w-[100cqi]` in a `@container` | css |
| Component responds to its own width | `@container` + `@md:` (not a viewport breakpoint) | tw |
| Layout adapts to child count / content | `:has()` + quantity queries | css |
| Horizontal carousel without JS | `flex overflow-x-auto snap-x snap-mandatory` | tw |
| Centering anything | `grid place-content-center` / `place-items-center` | tw |
| Fluid type/space that scales | `clamp()` ramp at `@theme`, consumed as a token | css |

## Review output contract

When reviewing existing UI code, present every change as a markdown table with **Before** and **After** columns — every change made or proposed, not a subset; never loose "Before:" / "After:" lines outside a table. Group changes by principle with a heading above each table. Keep each row to a single diff so the list scans. Every **After** snippet uses the project's own styling system, carries a one-line reason (which of the four earn-its-place tests it passes, or which shadcn/utility it routes to), and cites `file:line` when it isn't obvious from the snippet. A principle reviewed that needed nothing gets no table.

## Pre-ship for layout work

- [ ] Each role was routed to its owner: a shadcn component where one exists, a native utility before any arbitrary value, hand-rolled CSS only where it passed an earn-its-place test.
- [ ] No arbitrary value stands in for an existing utility (`min-h-dvh`, `grid-rows-subgrid`, `aspect-*`, `wrap-anywhere`, `has-*`, `*-safe`).
- [ ] No working, intentional layout was refactored just because a neater form exists. Non-focusable-only for composable masonry; `auto-fit`/`auto-fill` chosen deliberately.
- [ ] `dvh`/`svh` not `vh` on full-screen layouts; inputs at `font-size: max(16px, 1rem)`; images/media carry `aspect-ratio`.
- [ ] Fluid ramps read from `@theme` tokens; no inline `[clamp(...)]`. Type/spacing read from tokens; no `[14px]` without a reason.
- [ ] Container queries only where a component lives in slots of varying widths; viewport breakpoints for page-level responsiveness.

Sibling disciplines, each standalone when installed: `design-motion` (whether and how to animate), `design-polish` (the proactive detail list), `design-taste` (stating the reason), `shadcn-tailwind` (token mechanics and Base UI data attributes — auto-loads on the same files).

## References

| File | Scope |
| :--- | :--- |
| [`references/layout.md`](references/layout.md) | Every layout primitive and pattern, each tagged by owner with its when-NOT: content-flow sidebar (`:has()` form), switcher, centering container, responsive/subgrid grids, the two grid-blowout fixes, stack-overlay, breakout (grid + container-unit), `:has()` + quantity content-aware layout, masonry fallback + its a11y limit, container queries, scroll-snap, the height-enigma fix, modern one-liners. |
| [`references/fluid.md`](references/fluid.md) | `clamp()` discipline, fluid type/spacing ramps at `@theme`, `--spacing(n)`, container-query units, `dvh`/`svh`/`lvh` + `stretch`, iOS form floor, `theme()` deprecation. |

Open one file at a time; the body is the always-on layer, references are on-demand depth.
