# Layout implementation decisions

Load this file for a fix, build, implementation, or refactor. It expands the
owner and abstraction decisions in `SKILL.md`; pressure-point recipes live in
the four `patterns-*` references linked directly from `SKILL.md`. Use
[`patterns.md`](patterns.md) only when the pressure point does not select one.
Skip this file for an audit that will not change code.

## Contents

- [Inspect the local contract](#inspect-the-local-contract)
- [Route every role to its owner](#route-every-role-to-its-owner)
- [Make modern CSS earn the change](#make-modern-css-earn-the-change)
- [Preserve intent while implementing](#preserve-intent-while-implementing)
- [Before handing off implementation](#before-handing-off-implementation)

## Inspect the local contract

Open `globals.css` (or `app.css` / `tailwind.css`), inspect the `@theme` tokens
in play, read sibling components for the in-use pattern, and confirm the
viewport meta tag when viewport behavior is relevant. Establish what must stay
fixed or wrap, what source order means, and which browser floor the project
supports. Prefer Tailwind v4’s CSS-first `@theme` while respecting an existing
legacy config explicitly loaded with `@config`.

Preserve the component’s behavior, accessibility, public API, and state
contract while changing spatial implementation. An imported component does not
earn exemption from narrow-width, zoom, source-order, or overflow checks.

## Route every role to its owner

### Existing behavior and semantics

Use the existing project component or shadcn primitive for app sidebars,
resizable panes, accessible separators, off-canvas panels, popovers, tooltips,
custom scroll areas, or a whole page scaffold. Improve layout inside its
checked-in source when needed. A ratio, border, padding wrapper, or native
overflow region does not automatically justify a component.

The Sidebar collision is responsibility, not naming: shadcn `Sidebar` is a
stateful app-nav shell with collapse, mobile sheet, keyboard shortcut, and
provider behavior. A content-flow sidebar is a narrow column beside flexible
content that wraps on its own. Route the first to the existing component and
the second to CSS.

### Native utilities

Re-check the installed utility surface before hand-writing. Relevant Tailwind
v4 forms include subgrid, container queries, dynamic viewport units,
`aspect-video`, `text-balance`, `text-pretty`, `field-sizing-content`, `has-*`,
`wrap-anywhere`, safe alignment, coarse-pointer variants, and orientation
variants. If a native utility exists, an arbitrary spelling such as
`min-h-[100dvh]` or `[grid-template-rows:subgrid]` creates unnecessary drift.

Use logical direction utilities such as `ms-*`, `me-*`, `ps-*`, `pe-*`,
`start-*`, `end-*`, `text-start`, and `border-e-*` when geometry follows the
writing direction. Reserve physical sides for genuinely physical geometry such
as a device notch or fixed gesture direction.

### Authored CSS and components

When no existing owner or native utility holds, choose the form by contract:

| Contract | Reach for | Do not infer |
| :-- | :-- | :-- |
| Local, readable arrangement | Tailwind utilities in markup | Repetition inside one loop is not duplicated layout logic. |
| Small independently applicable rule that needs variants | `@utility` | “Just styles” does not automatically mean `@utility`. |
| Selectors or a coordinated layout algorithm | Ordinary/component CSS, colocated by project convention | A named class outside Tailwind is not a failure. |
| Stable structure, slots, semantics, defaults, or constrained API | React layout component around the CSS | `children` alone does not justify a component. |
| State, focus, keyboard, collision, resize, or drag behavior | Existing component or tested behavior library | Modern CSS does not replace an interaction contract. |

Expose only parameters fundamental to the algorithm, such as `--measure`,
`--lane-min`, or `--sidebar-size`. Keep design tokens as defaults and allow the
project’s normal class composition; do not turn every CSS value into a prop.

Read tokens as CSS variables or `--spacing(n)`; `theme()` is deprecated in
Tailwind v4. Use a local arbitrary value only for a genuinely local exception,
not as a substitute for a semantic token or native utility.

## Make modern CSS earn the change

Before replacing a working layout, name at least one concrete result:

- one intrinsic track removes a breakpoint ladder;
- a container query removes JavaScript or a dependency;
- one coordinated rule removes wrappers or declarations; or
- intrinsic sizing, aspect ratio, viewport units, or content growth fixes a
  reproduced UX defect.

Report the count or defect: four variants to one track, three wrappers to one,
one dependency removed, or one reproduced overflow eliminated. If none
applies, leave the working mechanism alone. A shorter solution still loses if
it obscures intent, weakens support, changes source/focus order, or replaces a
behavioral owner.

## Preserve intent while implementing

- Keep fixed one-line toolbars and designer-chosen transitions when they
  express product intent.
- Choose `auto-fit` versus `auto-fill` deliberately; sparse-track behavior is
  part of the design.
- Write the narrow layout as the base. Wider variants add rather than undo a
  desktop-first default.
- Use container queries for reusable components whose available space varies;
  use viewport context for page-level shells.
- Let text containers grow rather than clip. Pressure long, localized, numeric,
  and unbroken content before fixing dimensions.
- Keep one owner for each scroll axis across responsive states. Preserve
  keyboard reachability, visible focus, sticky boundaries, and hidden-content
  cues.
- Use guarded mechanisms only as enhancements over a complete fallback; load
  [`advanced.md`](advanced.md) before selecting one.

## Before handing off implementation

- The mechanism belongs to the lightest correct owner and no native utility was
  replaced by an arbitrary spelling.
- The narrow base, intermediate pressure point, wide state, source/focus order,
  and applicable content/device pressures were exercised or marked unverified.
- Any claimed simplification has a before-and-after count or reproduced defect.
- Touched Tailwind classes pass the project’s current language-server
  diagnostics, including canonical-class suggestions.
- Runtime, browser, network, and documentation attempts obeyed the bounded
  retry rule and task-owned processes were closed.
