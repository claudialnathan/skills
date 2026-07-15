---
name: design-layout
description: "Layout and fluid-sizing discipline for Tailwind v4 + shadcn (Base UI) + Next.js. Fluid type and spacing configured at the token layer (never inline arbitrary clamps), Every Layout primitives (Stack, Cluster, Sidebar, Switcher, Cover, Center, Grid) reached for when the simple form breaks, container queries only for components living in varying-width slots, and mobile viewport units done right (dvh over vh, the iOS 16px input floor). Use when building or reviewing page structure, responsive behavior, grids, sidebars, section rhythm, scaling type, full-height mobile layouts, or when a layout breaks at narrow widths."
compatibility: Tailwind v4 + shadcn (Base UI) + Next.js
paths:
  - '**/components/**/*.{ts,tsx,jsx}'
  - '**/app/**/*.{tsx,jsx,mdx}'
  - '**/pages/**/*.{tsx,jsx,mdx}'
  - '**/src/components/**/*.{ts,tsx,jsx}'
  - '**/{globals,app,tailwind,index}.css'
  - '**/styles/**/*.css'
---

# design-layout

<!-- Earned against: Opus 4.8, 2026-06-12, v2.1.170 -->

Pause before emitting layout code. Read what's there: open `globals.css` (or `app.css` / `tailwind.css`) and skim the `@theme` block; look at sibling components for the in-use pattern. The first reach should be a token or primitive that already exists. Apply these principles within the framework's conventions — Tailwind v4 configures at `@theme` in CSS, not `tailwind.config.js`.

## The discipline

1. **Fluid where it earns it, configured at the token layer.** When type or section padding genuinely should scale across viewports, configure the ramp at `@theme` (e.g. `--text-hero`). Don't sprinkle `text-[clamp(...)]` or `p-[clamp(...)]` inline — that bypasses the token system and drifts as the codebase grows. Component-internal padding, icon sizes, and uniform spacing usually don't need fluid; respect Tailwind's defaults. The "free" fluid wins belong everywhere and need no ramp: input `font-size: max(16px, 1rem)` (iOS zoom), `min-h-dvh` (mobile chrome), section rhythm with `max(8vh, 2rem)`.
2. **Reach for a named layout primitive when the simple form breaks.** Stack, Cluster, Sidebar, Switcher, Cover, Center, Box, Grid (Every Layout). If `flex flex-col gap-N` or shadcn's existing components already do the job, don't refactor them into the lobotomized owl. Reach for the primitive when the layout shifts at narrow widths, when responsiveness needs content-driven thresholds (Switcher, Sidebar), or when you're rebuilding the same flex/grid math by hand for the third time.
3. **Container query only when the component genuinely lives in slots of varying widths.** A card that appears in both a sidebar and a hero is a real candidate; a page-level shell is not. Reach for `@container` because a viewport breakpoint would give the wrong answer, never because it's modern. Viewport breakpoints remain the right primitive for page-level responsiveness.

## Layout reflex table

| Need | Reach for |
| :--- | :--- |
| Container with gutters | `width: min(100% - 2rem, <max>)`; `margin-inline: auto` — one rule, no media queries |
| Vertical rhythm between siblings | Stack — `flex flex-col` + `[&>*+*]:mt-N` |
| Inline group that wraps | Cluster — `flex flex-wrap gap-N` |
| Sidebar that yields when narrow | Sidebar — `grid-template-columns: fit-content(20ch) minmax(min(50vw, 30ch), 1fr)` |
| Two columns that fold to one at content width | Switcher — `flex-wrap` + `flex-basis: calc((var(--measure) - 100%) * 999)` |
| Centered max-width content | Center — `max-inline-size: var(--measure)`; `margin-inline: auto` |
| Overlay (text on image, badge on card) | Stack overlay — `display: grid; grid-template-areas: "stack"` then `> * { grid-area: stack }` |
| Responsive grid | `grid-template-columns: repeat(auto-fit, minmax(min(100%, 15ch), 1fr))` |
| Centering anything | `display: grid; place-content: center` |
| Multi-card alignment across siblings | Subgrid — `grid-template-columns: subgrid` (with explicit row/col span) |

## Fluid reflex table

| Need | Reach for |
| :--- | :--- |
| Type that scales | `font-size: clamp(1rem, 0.9rem + 0.5vw, 1.25rem)` — at the token layer, not per element |
| Section padding that breathes | `padding: clamp(1.5rem, 5vw, 4rem)` |
| Component-scoped responsive | `container-type: inline-size` on the parent + `cqi` units / `@container` queries inside |
| Full-viewport height on mobile | `min-h-dvh` — never `min-h-screen` (= `100vh`, breaks on mobile) |
| Form input that doesn't trigger iOS zoom | `font-size: max(16px, 1rem)` |
| Section rhythm with floor | `margin-top: max(8vh, 2rem)` |

## Review output contract

When reviewing existing UI code, present every change as a markdown table with **Before** and **After** columns — every change made or proposed, not a subset; never loose "Before:" / "After:" lines outside a table. Group changes by principle with a heading above each table, and keep each row to a single diff so the whole list scans quickly. Write every **After** snippet in the styling system the project already uses, carry the one-line reason with each row, and cite `file:line` when it isn't obvious from the snippet. A principle that was reviewed and needed nothing gets no table at all.

## Pre-ship for layout work

- [ ] A layout primitive was used when the simple form (`flex`, `grid`) wasn't sufficient — or the simple form was enough and stayed.
- [ ] Container query used only where the component lives in slots of varying widths; viewport breakpoints for page-level responsiveness. No fancy CSS for fancy CSS's sake.
- [ ] Fluid ramps read from `@theme` tokens; no inline `[clamp(...)]` values.
- [ ] `dvh`/`svh` instead of `vh` on full-screen layouts; inputs at `font-size: max(16px, 1rem)`.
- [ ] Type and spacing read from tokens; no `[14px]` without justification.

Sibling disciplines, each standalone when installed: `design-motion` (whether and how to animate), `design-polish` (the proactive detail list), `design-taste` (stating the reason), `shadcn-tailwind` (token mechanics — auto-loads on the same files).

## References

| File | Scope |
| :--- | :--- |
| [`references/layout.md`](references/layout.md) | Every Layout primitives (Stack, Cluster, Sidebar, Switcher, Cover, Center, Box, Grid) ported to Tailwind v4; smolcss patterns; modern-css recipes; subgrid. |
| [`references/fluid.md`](references/fluid.md) | `clamp()` discipline, fluid type/spacing tokens, container queries, `dvh`/`svh`/`lvh`, iOS form gotchas. |

Open one file at a time; the body is the always-on layer, references are on-demand depth.
