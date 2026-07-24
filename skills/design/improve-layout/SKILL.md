---
name: improve-layout
description: "This skill should be used when the user asks to audit, fix, build, or improve page layout, app shells, Kanban boards, responsive behavior, grids, sidebars, full-height screens, breakout content, fluid type or spacing, element alignment, or narrow-width overflow in a Tailwind v4, shadcn, React, or plain-CSS project. It preserves the layout's intent, routes behavioral UI to existing/shadcn components, prefers native utilities, and uses hand-rolled modern CSS only for a measurable reduction or a concrete UX fix."
compatibility: Tailwind v4 + shadcn (Base UI, Radix, or React Aria) + React/Next.js; the CSS patterns degrade to any stack
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

Treat origin as provenance, not proof of quality: project code, shadcn core, a community registry, and AI-authored code can each contain either a sound or a brittle layout. Preserve a component's required behavior, accessibility, public API, and state contract; audit its spatial implementation independently. A registry import does not earn exemption from narrow-width, zoom, source-order, or overflow checks.

## Audit or build in this order

1. **Name the intent and context.** Identify the page/component role, primary content, expected density, fixed vs fluid decisions, and user state. Do not infer that every row should wrap or every breakpoint should disappear.
2. **Reproduce the pressure point.** Check the current layout at its narrowest supported width, a wide width, **and the intermediate widths between them** — sweep the resize continuum, not just the extremes, because the "too-early collapse" (folding to a one-column layout while ample width remains) hides in the mid-range. Also check 200% zoom, long/unbroken content, and the component's smallest realistic container. For an audit, inspect rendered/computed layout rather than judging class names alone.
3. **Route each role.** Use the decision below; do not replace an intentional working pattern unless the replacement passes the measurable-benefit and clarity gates.
4. **Implement the smallest coherent change.** Preserve semantic DOM/source order and the project's tokens, component APIs, and styling conventions.
5. **Verify behavior.** Resize through the actual transition point, test long/localized content and keyboard order, and check overflow, focus visibility, sticky/scroll boundaries, and browser fallback. A passing build is not proof that a layout works.

## Route every layout role to its owner

Route by responsibility, then use the lightest owner that satisfies it.

1. **An existing project component or shadcn primitive owns behavior/semantics → use it, don't hand-roll a parallel version.** This includes the app sidebar/shell, resizable panes, accessible separators, off-canvas panels, popovers/tooltips, custom scroll areas, or a whole page scaffold (Blocks). Preserve that behavioral owner while improving layout inside its checked-in source when needed. A simple visual ratio, border, padding wrapper, or native overflow region does not automatically justify a component; use the Tailwind/CSS form unless the project already standardizes the component.
   - **The Sidebar collision** (the classic mistake): shadcn `Sidebar` is a stateful app-nav _shell_ — collapsible, mobile `Sheet`, ⌘B, `SidebarProvider`. The Sidebar layout is a _content-flow column_ beside flexible content that wraps on its own. Same word, different jobs. Route the app shell to shadcn; route the content-flow column to CSS (owner 3).
2. **A native Tailwind v4 utility owns it → use the utility, never an arbitrary value.** The native surface keeps growing, so re-check before hand-writing: `grid-cols-subgrid` / `grid-rows-subgrid`, container queries (`@container`, `@md:`, `@max-md:`, named `@container/main`), `min-h-dvh` / `svh` / `lvh`, `aspect-video`, `text-balance` / `text-pretty`, `field-sizing-content`, `has-*`, `wrap-anywhere` (drops the old `min-width:0` flex hack), `items-center-safe` / `justify-center-safe`. If a utility exists, an arbitrary value (`min-h-[100dvh]`, `[grid-template-rows:subgrid]`) is drift — the utility is what the rest of the codebase reads.
3. **Nothing owns it → hand-roll modern CSS only where it earns its place (next section).** Choose the CSS form by contract: a one-off arbitrary value/property for a genuinely local exception; `@utility` for a small independently applicable rule that benefits from Tailwind variants; ordinary/component CSS for selectors, descendants, or a multi-rule layout algorithm; CSS Modules when that is the project's ownership convention. A named class outside `@utility` is valid. Read tokens as CSS vars / `--spacing(n)` — `theme()` is deprecated in v4.

## Choose the abstraction by contract

Do not promote code through utility → CSS variable → component merely because it repeats. Name an abstraction when it exposes a real concept or enforces an invariant.

| Contract | Reach for | Do not infer |
| :-- | :-- | :-- |
| Local, readable arrangement | Tailwind utilities in the markup | Repetition inside one loop is not duplicated layout logic |
| Small rule that should compose with variants | `@utility` | “Just styles” does not automatically mean `@utility` |
| Reusable CSS algorithm, selectors, or coordinated declarations | ordinary/component CSS, colocated by project convention | A named class outside Tailwind is not a failure |
| Stable structure, slots, semantics, defaults, or constrained API | React layout component around the CSS | `children` alone does not justify a component |
| State, focus, keyboard, collision, resize, or drag behavior | existing project/shadcn component or a tested behavior library | Modern CSS layout does not replace an interaction contract |

Expose only parameters fundamental to the algorithm — for example `--measure`, `--lane-min`, or `--sidebar-size`. Keep design tokens as defaults, allow the project's normal `className` composition, and do not turn every CSS value into a React prop.

## When modern CSS earns its place — the whole game

A modern-CSS or "neater" alternative is right only when it does one of these, measurably. Name the winning test before making the swap:

- **Removes a breakpoint ladder** — `repeat(auto-fit, minmax(min(100%, 15ch), 1fr))` replaces `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`.
- **Drops a JS dependency** — container queries can replace a ResizeObserver; supported anchor positioning or Grid Lanes can replace positioning/masonry libraries. Count this only after checking the project's browser floor, fallback, behavior, and keyboard/source order.
- **Cuts lines** — one `width: min(100% - 2rem, 60ch); margin-inline: auto` replaces the `max-w-* px-* mx-auto` trio, gutters built in.
- **Fixes a concrete UX bug** — blowout (grid overflow), CLS (`aspect-ratio`), iOS input zoom (`font-size: max(16px, 1rem)`), mobile chrome (`dvh`).

Hits none of these? It's fancy for its own sake. Leave the working layout alone — that is the correct output, and reviewing a layout that needed nothing produces no table row. Passing this test is necessary, not sufficient: reject a shorter solution if the team cannot readily explain or maintain it. One intentional container query is often better than an opaque flex calculation.

## Respect intent — the guard against clever swaps

Read _why_ a layout is shaped the way it is before "improving" it. The neater alternative is **wrong** when it fights intent:

- A row set **not to wrap** (a fixed toolbar, a one-line nav) — don't turn it into a Cluster/Switcher that folds.
- A **designer-chosen breakpoint** the design depends on — don't replace it with content-driven folding that flips at a different, uncontrolled width. One intentional `@container`/breakpoint beats three magic media-query numbers, but a _chosen_ number is not a magic one.
- **Focusable reordered items** — CSS columns, dense packing, and masonry-like visual reordering can diverge from DOM/keyboard order. Keep source and visual order aligned; use a masonry-like fallback only for non-interactive content unless the tested implementation preserves navigation order. `reading-flow` (Chrome 137+, no cross-browser floor yet) natively realigns focus order to visual order — layer it behind `@supports (reading-flow: flex-visual)` so aligned source order stays the fallback everywhere else. It is a progressive enhancement on top of aligned order, never a licence to ship reordered focusable content by default. See `references/advanced.md`.
- **`auto-fit` vs `auto-fill`** — `auto-fit` collapses empty tracks so sparse items stretch; `auto-fill` preserves empty tracks and the space they occupy. They are different behaviors, not a default — pick for what the design wants.

When the intent is unclear, ask or leave the layout in place. A working layout with a reason beats a neater one that breaks it.

## Alignment — fewer invisible rules, balance over math

When a layout is structurally fine but "feels off," alignment is the usual cause: too many invisible rules for the eye to reconcile, or mathematically-equal spacing that reads as unbalanced because the boxes being aligned aren't the shapes the eye actually tracks. Name the method each element uses, then cut the count.

**Five methods**, roughly in order of how often they fit:

- **Edge** — align to a shared, usually invisible, edge. The document default; lists and stacked content.
- **Axis / spine** — align _centers_ to one horizontal or vertical spine. For controls or icons of differing shape and bounds, where a shared edge leaves them ragged.
- **Baseline** — align to the baseline of a key label. Sparingly — it breaks down against variable-height content.
- **Mathematical** — equal, ratio-derived values inside a container (button, card, padding). The honest first guess.
- **Optical** — deliberately _unequal_ values that _feel_ balanced. The correction when the math is right but the eye disagrees.

**Three principles**, in priority:

1. **Reduce the number of invisible rules.** Every distinct edge, spine, or baseline in play is one more thing the eye must reconcile — aim for one dominant method per region.
2. **Favor balanced over mathematically consistent.** Equal padding is a starting guess, not the goal; trim it where invisible space throws it off.
3. **Reduce the number of methods on one screen.** Mixing edge + spine + baseline in one view is what reads as unresolved.

**Why "correct" spacing looks wrong — the invisible-box problem.** An icon ships with a consistent invisible bounding box; a line of text carries leading above its cap height. So equal padding lands the _visible_ form off-center. The fixes are optical, and they are the same problem at two scales: an icon in a button gets its padding nudged, not equalized; a container that opens with a title gets its **top padding trimmed**, because the title's line-box already adds space the sides don't. `references/alignment.md` walks the recurring "feels-off" scenarios — navigation, button icons, container title padding, content-list emphasis rows and accessories, and forms — each with the fix.

## Review output contract

When reviewing existing UI code, order findings by impact: structural flow/source-order issues, then responsive/scroll/interaction behavior, then visual spacing and alignment (invisible-rule count, optical vs mathematical balance). Separate observed evidence from proposed changes: when the cause is not yet proven, report the rendered behavior, reproduction width/state, and verification criterion without inventing an **After** patch. Present every change made or proposed as a markdown table with **Before** and **After** columns — every change, not a subset; never loose "Before:" / "After:" lines outside a table. Group changes by principle with a heading above each table. Keep each row to a single diff so the list scans. Every **After** snippet uses the project's own styling system, carries a one-line reason (which of the four earn-its-place tests it passes, or which existing component/utility it routes to), and cites `file:line` when it isn't obvious from the snippet. A principle reviewed that needed nothing gets no table.

## Match the requested execution mode

- **Audit/review** → inspect the rendered layout and report evidence-backed findings; do not edit unless requested.
- **Fix/build/improve** → implement the smallest coherent change and verify it in the same task. Do not stop at a plan merely because the change spans files.
- **Create a reusable template/primitive** → inspect existing conventions, define the structural contract and fundamental parameters, implement one coherent abstraction, and exercise it in a representative example.
- **Plan/handoff** → write a self-contained plan only when requested or when execution is genuinely blocked. Include intent, owner routing, grouped Before/After tables with `file:line`, guardrails, browser floor, and resize/zoom/keyboard/overflow verification. Review an executor's rendered result against that plan when a handoff actually occurs.

## Pre-ship for layout work

- [ ] Each role was routed by responsibility: existing/shadcn for behavior or semantics, a native utility before any arbitrary value, hand-rolled CSS only where it passed an earn-its-place test.
- [ ] No arbitrary value stands in for an existing utility (`min-h-dvh`, `grid-rows-subgrid`, `aspect-*`, `wrap-anywhere`, `has-*`, `*-safe`).
- [ ] No working, intentional layout was refactored just because a neater form exists. Source and visual order agree; `auto-fit`/`auto-fill` was chosen deliberately.
- [ ] `dvh`/`svh` not `vh` on full-screen layouts; inputs stay at least 16px; any `field-sizing-content` field is bounded by `max-width` so it can't blow out; non-intrinsically sized media reserves its aspect ratio.
- [ ] Fluid ramps read from `@theme` tokens; no inline `[clamp(...)]` except a deliberate component-scoped `cqi` case. Type/spacing read from tokens; no `[14px]` without a reason.
- [ ] Container queries only where a component lives in slots of varying widths; viewport breakpoints for page-level responsiveness.
- [ ] Rendered behavior was checked at transition widths, 200% zoom, with long content, and by keyboard; no horizontal overflow or clipped focus remains.
- [ ] Alignment audited: the fewest invisible rules that work (one dominant method per region); optical correction applied where an icon's bounding box or a title's line-box leading throws equal spacing off; baseline alignment not used against variable-height rows.

Treat utility names, component inventories, and browser support as perishable. The reference snapshot was checked on 2026-07-22 (the modern-CSS additions — `reading-flow`, `round()`/`calc-size()`, style queries, and the `field-sizing` guard — plus the specialist form-driven board pattern on 2026-07-23); verify current official docs and the project's actual dependency/browser versions before claiming a feature or fallback is available.

## References

| File                                                 | Scope                                                                                                                                                                                                                                                                                                                                                                                                                           |
| :--------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`references/patterns.md`](references/patterns.md)   | Start here for the top lookup table and stable core patterns: content-flow sidebar, sticky shell, switcher, centering container, responsive/subgrid grids, blowout fixes, breakout, fluid Kanban lanes, container queries, scroll-snap, and height fixes. |
| [`references/advanced.md`](references/advanced.md)   | Load only for guarded or specialist mechanisms: form-driven CSS state assignment, Grid Lanes/reading-flow, style and name-only container queries, and raw anchor positioning. |
| [`references/fluid.md`](references/fluid.md)         | `clamp()` discipline, fluid type/spacing ramps at `@theme`, `--spacing(n)`, container-query units, `dvh`/`svh`/`lvh` + `stretch`, iOS form floor, `theme()` deprecation.                                                                                                                                                                                                                                                        |
| [`references/alignment.md`](references/alignment.md) | The five alignment methods (edge, spine/axis, baseline, mathematical, optical) and the recurring "feels-off" scenarios with fixes: navigation rule-count, button-icon optical nudge, container top-padding trim, content-list emphasis rows / accessory spines / mixed-alignment sections, and form left-edge + control spine.                                                                                                  |

Open `patterns.md` for a named layout problem and use its top lookup table. Load `advanced.md` only when the selected row points there; load `fluid.md` or `alignment.md` only for those separate concerns.

## Sources

Distilled into applied practice here; the underlying ideas draw on the works of [Josh Comeau](https://www.joshwcomeau.com/), [Josh Puckett](https://joshpuckett.me), [Heydon Pickering](https://heydonworks.com), [Andy Bell](https://piccalil.li/), [Adam Argyle](https://nerdy.dev/), [Stephanie Eckles](https://thinkdobecreate.com), [Ahmad Shadeed](https://ishadeed.com), [Miriam Suzanne](https://www.oddbird.net/), and [Joe Crawford](https://artlung.com/). Acknowledgment only — not a reading list to open mid-task.
