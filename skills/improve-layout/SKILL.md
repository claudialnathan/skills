---
name: improve-layout
description: "This skill should be used when the user asks to audit, fix, build, or improve page layout, app shells, Kanban boards, responsive and touch behavior, swipeable or paging columns, grids, sidebars, full-height screens, breakout content, fluid type or spacing, element alignment, or narrow-width overflow in a Tailwind v4, shadcn, React, or plain-CSS project. It preserves the layout's intent, routes behavioral UI to existing/shadcn components, prefers native utilities, and uses hand-rolled modern CSS only for a measurable reduction or a concrete UX fix."
---

# improve-layout

Improve the spatial behavior of the requested surface while preserving its
product intent, source and focus order, behavior, accessibility, public API,
and project conventions. Read the relevant code and rendered state before
prescribing a mechanism. Treat project, shadcn, registry, and AI authorship as
provenance rather than proof of layout quality.

## Choose the execution path

Infer the path from the request; do not present a mode menu.

- **Audit/review, or a bare “improve/refine/polish” request** → inspect the
  rendered layout, rank evidence-backed findings, and propose; do not edit.
- **Plan/handoff** → name intent, owners, files, guardrails, acceptance, and
  proof; do not edit.
- **Fix, build, create, implement, refactor, apply, or approved finding IDs** →
  implement the smallest coherent requested change and verify it. Do not insert
  a redundant audit pause before an explicit implementation request.
- **After implementation** → re-audit only the affected surface and report
  fixed, remaining, regressed, and unverified states.

## Work in dependency order

1. **Name intent and pressure.** Identify the surface’s job, primary content,
   density, fixed and fluid decisions, meaningful source order, input methods,
   browser floor, and narrowest supported width. Name that floor as a number;
   default to 320px when the project declares none.
2. **Reproduce the claim.** Exercise the failing state, the floor, one relevant
   intermediate pressure point, a wide state, and only adversarial states that
   can falsify the claim. Render geometry; do not infer it from class names.
3. **Route responsibility.** Preserve an existing behavioral owner, prefer a
   native project/Tailwind mechanism for local layout, and author CSS or a React
   abstraction only when its contract requires one.
4. **Make the smallest coherent change, narrow state first.** In Tailwind, the
   unprefixed utility is the narrow base and wider variants add to it. Preserve
   the project’s tokens, APIs, styling system, and semantic DOM.
5. **Verify and stop.** Derive proof from the claims made. Use a full width
   ladder only for a broad audit or foundational responsive change. After one
   diagnosed retry or clean restart fails, finish independent checks and mark
   dependent rendered claims unverified.

## Route to the lightest correct owner

- **Behavior or semantics** — retain the existing project component, shadcn
  primitive, or tested behavior library. Improve its checked-in spatial
  implementation rather than hand-rolling a parallel sidebar, resizer,
  popover, scroll area, or drag interaction. A shadcn `Sidebar` is a stateful
  app-nav shell; a content-flow sidebar is a CSS relationship.
- **Local arrangement** — use a native utility before an arbitrary value or
  custom rule. Confirm the installed Tailwind surface, project tokens, and
  generated utility rather than relying on a remembered version label.
- **Unowned structure** — choose authored CSS for selectors or coordinated
  layout algorithms and a React component only for stable structure, slots,
  semantics, defaults, or constrained API. Repetition alone does not justify
  promotion.

Load [`references/implementation.md`](references/implementation.md) for the
full owner, abstraction, and measurable-benefit decisions on an implementation
path.

## Keep these layout decisions visible

- Preserve an intentional working layout unless a replacement removes a
  breakpoint ladder, dependency, wrapper/declaration set, or reproduced UX
  defect without weakening clarity, support, order, or behavior. State the
  before-and-after reduction rather than asserting improvement.
- Decide the narrow end while building the wide end. A basis such as
  `min(var(--lane-max), calc(100% - var(--gap) - var(--peek)))` keeps one
  continuous rule across the forgotten middle. Spend a categorical flip only
  where interpolation cannot express the behavior, and pin related changes to
  the same crossover.
- Keep one inline-scroll owner and one block-scroll owner across widths. Native
  overflow is the swipe; reserve gesture code for behavior the scroller does
  not own, such as card drag.
- Viewport width is not input method or screen shape. Use `pointer-coarse` or
  `any-pointer-coarse` for finger concerns; use `max(44px, 2em)` as a design
  floor for primary controls; pair safe-area padding with `viewport-fit=cover`;
  treat disabled zoom as a failed layout check.
- Keep source, visual, reading, focus, and logical-direction order aligned.
  When alignment merely “feels off,” classify the visible edge, spine,
  baseline, mathematical center, or optical center before changing numbers.

## Load only the selected depth

Do not preload every reference. Read the row selected by the request or the
reproduced pressure point.

| Reference | Load when |
| :-- | :-- |
| [`implementation.md`](references/implementation.md) | Fixing, building, implementing, or refactoring; selecting the owner or abstraction. |
| [`review.md`](references/review.md) | Auditing, reviewing, grading findings, or re-auditing an implemented change. |
| [`patterns.md`](references/patterns.md) | The pressure point does not yet select one of the pattern groups below. |
| [`patterns-flow.md`](references/patterns-flow.md) | Flow or shell relationships: stack, cluster, sidebars, switcher, cover, sticky shell, center, or box. |
| [`patterns-grid.md`](references/patterns-grid.md) | Intrinsic grids, blowout, content growth, subgrid, overlays, breakouts, or `:has()`. |
| [`patterns-lanes.md`](references/patterns-lanes.md) | Kanban/status lanes, container queries, or native horizontal scrollers. |
| [`patterns-resilience.md`](references/patterns-resilience.md) | Height, safe areas, tables, focus clipping, nesting, local repairs, or anti-pattern review. |
| [`advanced.md`](references/advanced.md) | Guarded `:has()`, Grid Lanes/reading-flow, advanced container queries, or raw anchor positioning. |
| [`fluid.md`](references/fluid.md) | Fluid type/spacing, container units, viewport units, or `clamp()` discipline. |
| [`alignment.md`](references/alignment.md) | A specific optical or invisible-rule alignment problem. |
| [`verification.md`](references/verification.md) | Rendered geometry, responsive transitions, broad audits, or bounded runtime handling. |

## Finish in the requested form

- For implementation, make the code the deliverable. Summarize the intent,
  owner, material change, and exercised proof without turning it into an audit
  report.
- For audit, lead with the verdict and highest-impact seam. Use the grading and
  evidence language in `review.md`; do not manufacture findings or an empty
  table when no action is needed.
- For plan/handoff, make the next decision and proof obligations executable,
  without implying that unrun checks passed.

Treat utility names, component inventories, and browser support as perishable.
The current reference snapshot ends on 2026-07-28. Verify only
decision-bearing claims against installed versions and current primary
documentation. Unrun or blocked checks remain unverified.

## Sources

This skill draws inspiration from publicly available content from [Josh Comeau](https://www.joshwcomeau.com/), [Josh Puckett](https://joshpuckett.me), [Heydon Pickering](https://heydonworks.com), [Andy Bell](https://piccalil.li/), [Adam Argyle](https://nerdy.dev/), [Stephanie Eckles](https://thinkdobecreate.com), [Ahmad Shadeed](https://ishadeed.com), [Miriam Suzanne](https://www.oddbird.net/), and [Joe Crawford](https://artlung.com/).
