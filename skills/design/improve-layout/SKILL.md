---
name: improve-layout
description: "This skill should be used when the user asks to audit, fix, build, or improve page layout, responsive behavior, grids, sidebars, full-height screens, breakout content, fluid type or spacing, or narrow-width overflow in a Tailwind v4, shadcn, React, or plain-CSS project. It preserves the layout's intent, routes behavioral UI to existing/shadcn components, prefers native utilities, and uses hand-rolled modern CSS only for a measurable reduction or a concrete UX fix."
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

Pause before emitting layout code. Read what's there first: open `globals.css` (or `app.css` / `tailwind.css`), skim the `@theme` block for the tokens in play, and inspect sibling components for the in-use pattern. Establish what the layout is for, what must remain fixed or wrap, what its source order means, and which browser floor the project supports. Then **route** the role to its owner. Apply everything within the framework's conventions; prefer Tailwind v4's CSS-first `@theme`, while respecting an existing legacy config explicitly loaded with `@config`.

## Audit or build in this order

1. **Name the intent and context.** Identify the page/component role, primary content, expected density, fixed vs fluid decisions, and user state. Do not infer that every row should wrap or every breakpoint should disappear.
2. **Reproduce the pressure point.** Check the current layout at its narrowest supported width, a wide width, 200% zoom, with long/unbroken content, and in the component's smallest realistic container. For an audit, inspect rendered/computed layout rather than judging class names alone.
3. **Route each role.** Use the decision below; do not replace an intentional working pattern unless the replacement passes the measurable-benefit and clarity gates.
4. **Implement the smallest coherent change.** Preserve semantic DOM/source order and the project's tokens, component APIs, and styling conventions.
5. **Verify behavior.** Resize through the actual transition point, test long/localized content and keyboard order, and check overflow, focus visibility, sticky/scroll boundaries, and browser fallback. A passing build is not proof that a layout works.

## Route every layout role to its owner

Route by responsibility, then use the lightest owner that satisfies it.

1. **An existing project component or shadcn primitive owns behavior/semantics → use it, don't hand-roll a parallel version.** This includes the app sidebar/shell, resizable panes, accessible separators, off-canvas panels, popovers/tooltips, custom scroll areas, or a whole page scaffold (Blocks). A simple visual ratio, border, padding wrapper, or native overflow region does not automatically justify a component; use the Tailwind/CSS form unless the project already standardizes the component. Follow `shadcn-tailwind` for its edit-vs-fork mechanics.
   - **The Sidebar collision** (the classic mistake): shadcn `Sidebar` is a stateful app-nav *shell* — collapsible, mobile `Sheet`, ⌘B, `SidebarProvider`. The Every Layout "sidebar" is a *content-flow column* beside flexible content that wraps on its own. Same word, different jobs. Route the app shell to shadcn; route the content-flow column to CSS (owner 3).
2. **A native Tailwind v4 utility owns it → use the utility, never an arbitrary value.** The native surface keeps growing, so re-check before hand-writing: `grid-cols-subgrid` / `grid-rows-subgrid`, container queries (`@container`, `@md:`, `@max-md:`, named `@container/main`), `min-h-dvh` / `svh` / `lvh`, `aspect-video`, `text-balance` / `text-pretty`, `field-sizing-content`, `has-*`, `wrap-anywhere` (drops the old `min-width:0` flex hack), `items-center-safe` / `justify-center-safe`. If a utility exists, an arbitrary value (`min-h-[100dvh]`, `[grid-template-rows:subgrid]`) is drift — the utility is what the rest of the codebase reads.
3. **Nothing owns it → hand-roll modern CSS only where it earns its place (next section).** Use this escalation ladder: native utility → one-off arbitrary value/property → CSS custom property for a per-instance parameter → `@utility` for a reusable utility → component CSS/module for selectors or multi-declaration machinery. The intrinsic content-flow sidebar, switcher, centering container, breakout, stack-overlay, `:has()` quantity layout, and guarded Grid Lanes/anchor positioning belong here. Read tokens as CSS vars / `--spacing(n)` — `theme()` is deprecated in v4.

## When modern CSS earns its place — the whole game

A modern-CSS or "neater" alternative is right only when it does one of these, measurably. Name the winning test before making the swap:

- **Removes a breakpoint ladder** — `repeat(auto-fit, minmax(min(100%, 15ch), 1fr))` replaces `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`.
- **Drops a JS dependency** — container queries can replace a ResizeObserver; supported anchor positioning or Grid Lanes can replace positioning/masonry libraries. Count this only after checking the project's browser floor, fallback, behavior, and keyboard/source order.
- **Cuts lines** — one `width: min(100% - 2rem, 60ch); margin-inline: auto` replaces the `max-w-* px-* mx-auto` trio, gutters built in.
- **Fixes a concrete UX bug** — blowout (grid overflow), CLS (`aspect-ratio`), iOS input zoom (`font-size: max(16px, 1rem)`), mobile chrome (`dvh`).

Hits none of these? It's fancy for its own sake. Leave the working layout alone — that is the correct output, and reviewing a layout that needed nothing produces no table row. Passing this test is necessary, not sufficient: reject a shorter solution if the team cannot readily explain or maintain it. One intentional container query is often better than an opaque flex calculation.

## Respect intent — the guard against clever swaps

Read *why* a layout is shaped the way it is before "improving" it. The neater alternative is **wrong** when it fights intent:

- A row set **not to wrap** (a fixed toolbar, a one-line nav) — don't turn it into a Cluster/Switcher that folds.
- A **designer-chosen breakpoint** the design depends on — don't replace it with content-driven folding that flips at a different, uncontrolled width. One intentional `@container`/breakpoint beats three magic media-query numbers, but a *chosen* number is not a magic one.
- **Focusable reordered items** — CSS columns, dense packing, and masonry-like visual reordering can diverge from DOM/keyboard order. Keep source and visual order aligned; use a masonry-like fallback only for non-interactive content unless the tested implementation preserves navigation order.
- **`auto-fit` vs `auto-fill`** — `auto-fit` collapses empty tracks so sparse items stretch; `auto-fill` preserves empty tracks and the space they occupy. They are different behaviors, not a default — pick for what the design wants.

When the intent is unclear, ask or leave the layout in place. A working layout with a reason beats a neater one that breaks it.

## Componentize by parameter, never by parallel library

When a hand-rolled primitive recurs, componentize it by **parameterizing with CSS custom properties as props** — not by copying a fixed component library that drifts from the stack. One worked form, adapted to the project's own className idiom:

```tsx
// Center — the universal max-width container, measure as a prop
function Center({ measure = "60ch", children }: { measure?: string; children: React.ReactNode }) {
  return (
    <div
      className="mx-auto w-full max-w-(--measure) px-4"
      style={{ "--measure": measure } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
// Or the modern-CSS body with gutters built in:
//   <div style={{ width: `min(100% - 2rem, ${measure})`, marginInline: "auto" }}>
```

The custom property *is* the prop (`--measure`, `--min`, `--sidebar-size`, `--grid-min`) — it keeps one source of truth and lets the same primitive nest and recompose. Never componentize a role shadcn already owns; extend shadcn's source instead. `references/layout.md` gives the parametric form for each primitive.

## Layout reflex table

Owner column: **sh** = existing/shadcn component · **tw** = native Tailwind utility · **css** = the hand-rolled escalation ladder above.

| Need | Reach for | Owner |
| :--- | :--- | :--- |
| App nav shell / dashboard sidebar | shadcn `Sidebar` (collapsible, mobile `Sheet`, keyboard shortcut) | sh |
| Whole page template to start from | shadcn Blocks (`dashboard-01`, `sidebar-NN`) | sh |
| Locked media ratio (kills CLS) | `aspect-video` / `aspect-square` / `aspect-[3/2]`; shadcn `AspectRatio` only if already standardized | tw/sh |
| Draggable split panes | shadcn `Resizable` | sh |
| Bounded custom-scrollbar region | shadcn `ScrollArea` | sh |
| Tooltip/popover tethered to a trigger | shadcn `Popover`/`Tooltip` (Base UI); anchor positioning only if hand-rolling | sh |
| Container with gutters (universal wrapper) | `width: min(100% - 2rem, <max>); margin-inline: auto` | css |
| Vertical rhythm between siblings (Stack) | `flex flex-col gap-N` | tw |
| Inline group that wraps (Cluster) | `flex flex-wrap gap-N` | tw |
| Content-flow sidebar that yields when narrow | wrapping flex sidebar, optionally assembled with `:has()` | css |
| Sticky header/sidebar bounded before footer | grid-area shell + sticky child; shadcn `Sidebar` if stateful | tw/css |
| Masonry/waterfall packing | responsive Grid baseline; Grid Lanes only as a tested enhancement | tw/css |
| Two columns that fold at content width (Switcher) | flex + `basis-[calc((var(--measure)-100%)*999)]` | css |
| Full mobile viewport | `min-h-dvh`, or `min-h-svh` when chrome-visible fit matters | tw |
| Responsive card grid, no breakpoints | `repeat(auto-fill, …)` for stable cells; `auto-fit` when sparse rows should stretch | tw |
| Cards aligned across a row (image/title/CTA) | `grid-rows-subgrid` + `row-span-N` | tw |
| Layered content in one cell (text on image) | grid stack-overlay, not `position: absolute` | css |
| Content column with full-bleed breakout | breakout grid, or `w-[100cqi]` in a `@container` | css |
| Component responds to its own width | `@container` + `@md:` (not a viewport breakpoint) | tw |
| Layout adapts to child count / content | `:has()` + quantity queries | css |
| Horizontal carousel without JS | `flex overflow-x-auto snap-x snap-mandatory` | tw |
| Centering anything | `grid place-content-center` / `place-items-center` | tw |
| Fluid type/space that scales | `clamp()` ramp at `@theme`, consumed as a token | css |

## Review output contract

When reviewing existing UI code, order findings by impact: structural flow/source-order issues, then responsive/scroll/interaction behavior, then visual spacing/alignment. Present every change as a markdown table with **Before** and **After** columns — every change made or proposed, not a subset; never loose "Before:" / "After:" lines outside a table. Group changes by principle with a heading above each table. Keep each row to a single diff so the list scans. Every **After** snippet uses the project's own styling system, carries a one-line reason (which of the four earn-its-place tests it passes, or which existing component/utility it routes to), and cites `file:line` when it isn't obvious from the snippet. A principle reviewed that needed nothing gets no table.

## Pre-ship for layout work

- [ ] Each role was routed by responsibility: existing/shadcn for behavior or semantics, a native utility before any arbitrary value, hand-rolled CSS only where it passed an earn-its-place test.
- [ ] No arbitrary value stands in for an existing utility (`min-h-dvh`, `grid-rows-subgrid`, `aspect-*`, `wrap-anywhere`, `has-*`, `*-safe`).
- [ ] No working, intentional layout was refactored just because a neater form exists. Source and visual order agree; `auto-fit`/`auto-fill` was chosen deliberately.
- [ ] `dvh`/`svh` not `vh` on full-screen layouts; inputs stay at least 16px; non-intrinsically sized media reserves its aspect ratio.
- [ ] Fluid ramps read from `@theme` tokens; no inline `[clamp(...)]` except a deliberate component-scoped `cqi` case. Type/spacing read from tokens; no `[14px]` without a reason.
- [ ] Container queries only where a component lives in slots of varying widths; viewport breakpoints for page-level responsiveness.
- [ ] Rendered behavior was checked at transition widths, 200% zoom, with long content, and by keyboard; no horizontal overflow or clipped focus remains.

Treat utility names, component inventories, and browser support as perishable. The reference snapshot was checked on 2026-07-22; verify current official docs and the project's actual dependency/browser versions before claiming a feature or fallback is available.

Sibling disciplines, each standalone when installed: `design-motion` (whether and how to animate), `design-polish` (the proactive detail list), `design-taste` (stating the reason), `shadcn-tailwind` (token mechanics and Base UI data attributes — auto-loads on the same files).

## References

| File | Scope |
| :--- | :--- |
| [`references/layout.md`](references/layout.md) | Core layout primitives and patterns, each tagged by owner with its when-NOT: content-flow sidebar (`:has()` form), sticky shell, switcher, centering container, responsive/subgrid grids, the two grid-blowout fixes, stack-overlay, breakout (grid + container-unit), `:has()` + quantity layout, Grid Lanes and masonry-approximation limits, container queries, scroll-snap, height fixes, and plain-CSS nesting guardrails. |
| [`references/fluid.md`](references/fluid.md) | `clamp()` discipline, fluid type/spacing ramps at `@theme`, `--spacing(n)`, container-query units, `dvh`/`svh`/`lvh` + `stretch`, iOS form floor, `theme()` deprecation. |

Open one file at a time; the body is the always-on layer, references are on-demand depth.
