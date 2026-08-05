---
name: improve-layout
description: "This skill should be used when the user asks to audit, fix, build, or improve page layout, app shells, Kanban boards, responsive and touch behavior, swipeable or paging columns, grids, sidebars, full-height screens, breakout content, fluid type or spacing, element alignment, or narrow-width overflow in a Tailwind v4, shadcn, React, or plain-CSS project. It preserves the layout's intent, routes behavioral UI to existing/shadcn components, prefers native utilities, and uses hand-rolled modern CSS only for a measurable reduction or a concrete UX fix."
---

# improve-layout

Pause before emitting layout code. Read what's there first: open `globals.css` (or `app.css` / `tailwind.css`), skim the `@theme` block for the tokens in play, inspect sibling components for the in-use pattern, and confirm the document's viewport meta tag — it is the precondition for every rule below. Establish what the layout is for, what must remain fixed or wrap, what its source order means, and which browser floor the project supports. Then **route** the role to its owner. Apply everything within the framework's conventions; prefer Tailwind v4's CSS-first `@theme`, while respecting an existing legacy config explicitly loaded with `@config`.

Treat origin as provenance, not proof of quality: project code, shadcn core, a community registry, and AI-authored code can each contain either a sound or a brittle layout. Preserve a component's required behavior, accessibility, public API, and state contract; audit its spatial implementation independently. A registry import does not earn exemption from narrow-width, zoom, source-order, or overflow checks.

## Audit or build in this order

1. **Name the intent and context.** Identify the page/component role, primary content, expected density, fixed vs fluid decisions, user state, and the input methods and narrowest supported width the composition has to survive. **Name that width as a number** — default to **320px** unless the project declares otherwise (360px is the modal Android width; 390–430 the common iPhone band). "Narrow" left unnamed is a check that never runs. A board, split view, or dashboard has a phone state whether or not the mock shows one. Do not infer that every row should wrap or every breakpoint should disappear.
2. **Reproduce the pressure point.** Name the claim first, then check the failing state, the declared floor, one relevant intermediate pressure point, a wide state, and only the adversarial states that can falsify that claim. Run rendered checks in a browser rather than inferring geometry from class names.
3. **Route each role.** Use the decision below; do not replace an intentional working pattern unless the replacement passes the measurable-benefit and clarity gates.
4. **Implement the smallest coherent change, narrow state first.** Write the narrow layout as the base declaration and let wider states add to it: in Tailwind the unprefixed utility *is* the phone state, so `md:`/`lg:` variants should only add. A `max-*` variant that undoes a desktop base is the same layout authored backwards, and it leaves the narrow state as whatever fell out — which is how a composition that reads as finished at a desk arrives broken on a phone. Preserve semantic DOM/source order and the project's tokens, component APIs, and styling conventions.
5. **Verify behavior and stop.** Derive the minimum evidence matrix from the claims being made. Use the full width ladder only for a broad audit or foundational responsive change. Bound server, browser, network, and registry attempts; after one diagnosed retry fails, finish independent checks and mark rendered claims unverified rather than looping.

## Route every layout role to its owner

Route by responsibility, then use the lightest owner that satisfies it.

1. **An existing project component or shadcn primitive owns behavior/semantics → use it, don't hand-roll a parallel version.** This includes the app sidebar/shell, resizable panes, accessible separators, off-canvas panels, popovers/tooltips, custom scroll areas, or a whole page scaffold (Blocks). Preserve that behavioral owner while improving layout inside its checked-in source when needed. A simple visual ratio, border, padding wrapper, or native overflow region does not automatically justify a component; use the Tailwind/CSS form unless the project already standardizes the component.
   - **The Sidebar collision** (the classic mistake): shadcn `Sidebar` is a stateful app-nav _shell_ — collapsible, mobile `Sheet`, ⌘B, `SidebarProvider`. The Sidebar layout is a _content-flow column_ beside flexible content that wraps on its own. Same word, different jobs. Route the app shell to shadcn; route the content-flow column to CSS (owner 3).
2. **A native Tailwind v4 utility owns it → use the utility, never an arbitrary value.** The native surface keeps growing, so re-check before hand-writing: `grid-cols-subgrid` / `grid-rows-subgrid`, container queries (`@container`, `@md:`, `@max-md:`, named `@container/main`), `min-h-dvh` / `svh` / `lvh`, `aspect-video`, `text-balance` / `text-pretty`, `field-sizing-content`, `has-*`, `wrap-anywhere` (drops the old `min-width:0` flex hack), `items-center-safe` / `justify-center-safe`, `pointer-coarse` / `any-pointer-coarse` and `portrait` / `landscape` for the device axes a width variant cannot express. If a utility exists, an arbitrary value (`min-h-[100dvh]`, `[grid-template-rows:subgrid]`) is drift — the utility is what the rest of the codebase reads.
   - **Direction-dependent position is a utility choice too.** `ms-*` / `me-*` / `ps-*` / `pe-*` / `start-*` / `end-*` / `text-start` / `text-end` / `border-s-*` / `border-e-*` are native, cost exactly what their physical twins cost, and mirror under `dir="rtl"` for free; the CSS forms are `margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `text-align: start`, `border-inline-end`. Reserve `ml-*` / `pr-*` / `left-*` / `text-left` for geometry that is genuinely physical regardless of language — a device notch, a hardware-anchored control, an arrow matching a fixed gesture direction. Where a sequence encodes progression (steps, ratings, progress fills), flex/grid with logical properties mirrors it automatically; hand-positioned elements do not.
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

## Let modern CSS earn its place

Name one measurable win before replacing a working layout:

- **Remove a breakpoint ladder:** one intrinsic track replaces several width variants.
- **Drop JavaScript or a dependency:** a container query replaces a ResizeObserver, or a supported platform mechanism replaces a library without losing behavior.
- **Cut wrappers or declarations:** a centered `min()` width with built-in gutters replaces separate max-width, padding, and margin rules.
- **Fix a reproduced UX defect:** intrinsic sizing, `aspect-ratio`, the iOS input floor, or dynamic viewport units resolve overflow, layout shift, input zoom, or mobile chrome.

Report the before-and-after count rather than asserting improvement: four variants to one track, three wrappers to one, or one dependency removed. If none applies, leave the layout alone. A shorter solution still loses if it obscures intent, weakens support, changes source/focus order, or replaces an interaction contract.

Read only the matching row in [`references/patterns.md`](references/patterns.md), including its **When NOT**, and stop when an existing component or native utility already holds.

## Preserve intent before changing the mechanism

- Keep fixed one-line toolbars and designer-chosen transitions when they express product intent.
- Keep source, visual, reading, and focus order aligned. Treat `reading-flow`, masonry, raw anchor positioning, and other support-sensitive mechanisms as guarded enhancements from [`references/advanced.md`](references/advanced.md), never the baseline.
- Choose `auto-fit` versus `auto-fill` deliberately; sparse-track behavior is part of the design.
- When intent remains unclear after repository evidence, ask or leave the working layout in place. A reasoned layout beats a neater mechanism that changes the product.

## Degrade along one continuum

Decide the narrow end while building the wide end. Prefer one rule whose two arms are the two layouts: a lane basis such as `min(var(--lane-max), calc(100% - var(--gap) - var(--peek)))` holds a useful maximum when space exists and reaches the viewport when it does not. This removes the forgotten mid-range rather than creating a separate “mobile layout.”

Spend categorical flips only where interpolation cannot express the behavior, then pin scroll-snap strength, menu folding, or summary replacement to the same crossover. Keep one inline-scroll owner and one block-scroll owner across widths.

The scroller is the swipe: native overflow and snap already provide momentum, interruption, pointer scrollbars, keyboard scrolling, and scroll-into-view. Do not reimplement paging with pointer transforms; reserve a gesture library for behavior the scroller does not own, such as card drag.

## Treat touch and device chrome as separate axes

Viewport width is neither input method nor screen shape:

- Use `pointer-coarse:` or `any-pointer-coarse:` when the concern is the finger. Size primary controls from `max(44px, 2em)` as a design floor while distinguishing it from WCAG 2.2’s 24×24 AA minimum and clearance exception.
- Pair edge-fixed padding such as `max(var(--space), env(safe-area-inset-bottom))` with `viewport-fit=cover`; otherwise the inset stays `0`. Own this once at the surface/base layer rather than scattering arbitrary values.
- Treat `user-scalable=no` or `maximum-scale=1` as a failed zoom check; downstream layout CSS cannot repair it.

The detailed lane, scroller, safe-area, table, blowout, and content-growth contracts live in [`references/patterns.md`](references/patterns.md). Fluid ramps and units live in [`references/fluid.md`](references/fluid.md).

## Verify claims without getting stuck

Static source can prove ownership and thresholds, not rendered geometry. For a bounded repair, render the failing state, declared floor, one relevant intermediate pressure point, a wide state, and only the adversarial states capable of falsifying the claim. Use the full width ladder and transition bisection only for broad audits, foundational layout changes, or an observed transition defect.

Prefer one controllable browser/server session. After one diagnosed retry or clean restart fails, stop reconnecting or polling, preserve logs, complete independent checks, and mark rendered claims **unverified**. Do not leave watch commands or task-owned servers running.

Read [`references/verification.md`](references/verification.md) for the evidence matrix, full ladder, transition stopping rule, content/device pressures, and bounded server/browser/network handling.

## Align by visible rules

Classify alignment as edge, axis/spine, baseline, mathematical, or optical. Use the fewest rules that work—usually one dominant method per region—and prefer visible balance over equal numbers.

The mechanism is the invisible-box problem: an icon’s bounding box is larger than its visible mass, and a title’s line box includes leading above the visible glyphs. Equal padding can therefore look unequal. Correct the visible form optically, avoid baseline alignment against variable-height content, and express leading/trailing corrections with logical properties.

Read [`references/alignment.md`](references/alignment.md) only for a “feels off” alignment problem.

## Grade every finding

Impact order alone does not tell a reader how bad anything is, or when the review is finished. Grade each finding, in layout terms:

- **P0** — a supported viewport, zoom level, or reading direction leaves content unreachable, an action unusable, or focus lost. Someone cannot do the thing.
- **P1** — the layout works but degrades: broken hierarchy or reading order, a fold at the wrong width, overflow that forces unexpected scrolling, structure that collapses under long or localized content.
- **P2** — isolated spacing, alignment, or optical polish. Nothing is blocked and nothing misleads.

Close with a **verdict** the grades imply: unresolved P0 blocks, P1-only means changes are wanted, and no actionable finding means the layout is sound — say so plainly rather than manufacturing a table.

Label how each conclusion was reached, because a grade carries no weight without it:

- **Observed** — seen directly in the rendered layout, computed style, or command output.
- **Inferred** — the best explanation across several observations; name what would prove it.
- **Decision** — a product or design call, not a defect.
- **Unverified** — plausible but not exercised. Any check not actually run lands here.

Keep a P0 that is only *inferred* separate from one that was reproduced. Automated output — a scanner, a linter, an overflow probe — is evidence, not authority: it can surface a seam it cannot interpret, so reproduce a finding before restructuring a layout around it.

## Review output contract

Lead with the verdict, highest-impact seam, owner, and reason. Name unverified checks explicitly.
State whether the current mode is findings, plan, remediation, direct
implementation, or re-audit. Keep the primary queue to five decision groups
while preserving the total blocker count and a path to the complete result.
Broad subjective visual polish remains a proposal unless visible implementation
was explicitly authorized.

For a tightly bounded repair with one shared owner, use:

| Location | Before | After | Proof |
| :-- | :-- | :-- | :-- |

For a broad or multi-layer change, use:

| Location | Grade | Before | After | Why | Proof |
| :-- | :-- | :-- | :-- | :-- | :-- |

For audit-only findings without an implemented repair, use `Location | Grade | Finding | Proof`; do not invent an **After**. **Proof** is the width, state, or measurement exercised, or `unverified`. Cite `file:line`, keep one change per row, and use the project’s styling system.

## Match the requested execution mode

- **Audit/review or a bare “improve/refine/polish” request** → findings mode:
  inspect the rendered layout, rank evidence-backed findings, and propose;
  do not edit.
- **Plan/handoff** → plan mode: name intent, owner routing, files, guardrails,
  browser floor, acceptance, and resize/zoom/keyboard/overflow proof; do not
  edit.
- **Apply, implement approved items, or approved finding IDs** → remediation
  mode: implement only that scope, then verify it.
- **Explicit build/create/implement or a named refactor** → direct
  implementation mode: inspect existing conventions, implement the smallest
  coherent requested change, and verify it without a redundant audit pause.
- **After either implementation path** → re-audit the focused surface and
  report fixed, remaining, regressed, and unverified states. End a proportionate
  no-change result with `No action needed`.

## Pre-ship for layout work

- [ ] Each role was routed by responsibility: existing/shadcn for behavior or semantics, a native utility before any arbitrary value, hand-rolled CSS only where it passed an earn-its-place test.
- [ ] No arbitrary value stands in for a native utility; every claimed reduction has a before-and-after count.
- [ ] The narrow state is the base; source, visual, reading, focus, and logical-direction order agree; no intentional layout was replaced for neatness alone.
- [ ] Full-screen layout uses `dvh`/`svh`; inputs retain the 16px floor; content-sized fields have a max-width; media reserves its ratio.
- [ ] Fluid ramps live at the token layer; container-relative `cqi` remains a deliberate component exception.
- [ ] Container queries, viewport breakpoints, and categorical flips match their true owner and share one deliberate crossover where needed.
- [ ] Text containers grow rather than clip; long/localized content, logical direction, and optical alignment preserve the fewest useful rules.
- [ ] Scrollers, lanes, touch targets, safe areas, sticky regions, and hidden-content cues preserve one clear owner and remain reachable by keyboard, pointer, and touch where applicable.
- [ ] Explicit claims determined the rendered widths, containers, content pressures, and interaction states; unrun checks are `unverified`.
- [ ] Browser, server, network, and registry attempts stopped at the bounded retry rule, and task-owned sessions were closed.
- [ ] Every reported finding carries a P0/P1/P2 grade, the verdict follows from those grades, and unrun checks are named as unverified rather than implied to have passed.
- [ ] Every touched Tailwind class string passes the current Tailwind CSS language-server diagnostics, including `suggestCanonicalClasses`; no utility was accepted from visual or documentation review alone.

Treat utility names, component inventories, and browser support as perishable. The current reference snapshot ends on 2026-07-28. Verify only decision-bearing claims against the project’s installed versions and current primary documentation; if external evidence remains unavailable after the bounded retry, use the stable fallback and disclose the gap.

## References

| File | Load for |
| :-- | :-- |
| [`references/patterns.md`](references/patterns.md) | One named stable layout pressure point; use its lookup table and read only the selected section. |
| [`references/advanced.md`](references/advanced.md) | Guarded `:has()`, Grid Lanes/reading-flow, advanced container queries, or raw anchor positioning. |
| [`references/fluid.md`](references/fluid.md) | Fluid type/spacing, container units, viewport units, and `clamp()` discipline. |
| [`references/alignment.md`](references/alignment.md) | A specific optical or invisible-rule alignment problem. |
| [`references/verification.md`](references/verification.md) | Broad audits, transition claims, rendered evidence, and bounded runtime handling. |

## Sources

This skill draws inspiration from publicly available content from [Josh Comeau](https://www.joshwcomeau.com/), [Josh Puckett](https://joshpuckett.me), [Heydon Pickering](https://heydonworks.com), [Andy Bell](https://piccalil.li/), [Adam Argyle](https://nerdy.dev/), [Stephanie Eckles](https://thinkdobecreate.com), [Ahmad Shadeed](https://ishadeed.com), [Miriam Suzanne](https://www.oddbird.net/), and [Joe Crawford](https://artlung.com/).
