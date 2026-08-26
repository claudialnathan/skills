# Layout pattern index

Use this index when the reproduced pressure point or a legacy workaround does
not already select a narrower reference from `SKILL.md`. Route by
responsibility, use the lightest owner that satisfies it, and read the selected
reference's constraints and fallback before changing a working layout.

| Need / pressure point | Stable first route | Reference |
| :-- | :-- | :-- |
| Vertical rhythm, wrapping inline groups, app navigation, content-flow sidebar, content-driven fold, viewport cover, sticky shell, centered measure, or padded box | Existing behavioral owner, then Flex/Grid or the named CSS relationship | [Flow and shells](patterns-flow.md) |
| Intrinsic card grid, grid blowout, localized content growth, cross-card alignment, neutral wrapper, overlay, breakout, or DOM-shape query | Diagnose intrinsic sizing and source/semantic constraints before selecting a grid mechanism | [Grid and content](patterns-grid.md) |
| Kanban/status lanes, component-scoped responsive behavior, or a horizontal snap region | Preserve lane continuity and let native overflow own scrolling | [Lanes and scrollers](patterns-lanes.md) |
| Full-height ownership, device safe areas, wide tables, focus clipping, local blowout repair, nesting, or resilience-specific anti-pattern review | Identify the containing block, device axis, or actual overflow owner | [Viewport and resilience](patterns-resilience.md) |
| Form-driven visual board assignment, masonry/reading flow, style queries, or raw anchor positioning | Build a stable fallback first, then load the guarded mechanism | [Advanced mechanisms](advanced.md) |

## Route from a legacy seam

These are routing clues, not automatic replacements. Reproduce the seam and
preserve working behavior before selecting a modern mechanism.

| Legacy seam observed | Stable first route | Guardrail and reference |
| :-- | :-- | :-- |
| Per-child margins, last-child resets, or wrapper spacing patches | Flex/Grid `gap`, or a true between-siblings rule | Preserve external-flow semantics. [Flow and shells](patterns-flow.md) |
| JavaScript resize or media branching that only rearranges the same content | A viewport query for a page shell or a container query for a reusable component | Keep JavaScript when behavior or the mounted component changes. [Implementation decisions](implementation.md) · [Lanes and containers](patterns-lanes.md) |
| Repeated column-count breakpoints, fixed track floors, or wrapper-based breakout math | Intrinsic Grid, a corrected track minimum, named Grid lines, or container units | Preserve intentional categorical counts and source order. [Grid and content](patterns-grid.md) |
| `100vh`, a percentage-height chain, or root overflow clipping | Dynamic/small viewport units, Grid/Flex growth, or diagnosis of the actual overflow owner | Preserve one block-scroll owner; clipping is a policy, not a generic repair. [Grid and content](patterns-grid.md) · [Viewport and resilience](patterns-resilience.md) |
| Pointer or transform code used only to page a horizontal list | Native inline overflow and optional scroll snap | Keep a behavior owner for carousel semantics, virtualization, or drag. [Lanes and scrollers](patterns-lanes.md) |
| Padding-ratio media boxes or fixed crop wrappers | Intrinsic dimensions, then `aspect-ratio` and `object-fit` where the rendered crop needs them | Do not constrain content that should grow. [Fluid sizing](fluid.md) |
| JavaScript sticky/tether geometry or hand-packed masonry | Bounded sticky layout, an installed behavioral component, or a guarded enhancement | Raw anchors and Grid Lanes require a complete fallback and browser-floor proof. [Flow and shells](patterns-flow.md) · [Advanced mechanisms](advanced.md) |
| Repeated fluid-value breakpoints or line-height/negative-margin optical patches | Token-layer fluid math or alignment diagnosis | Keep categorical changes as queries; correct visible geometry rather than normalizing numbers. [Fluid sizing](fluid.md) · [Alignment](alignment.md) |
| Scrollbar compensation math or a `100vw` breakout that gains a classic-scrollbar overflow | `scrollbar-gutter` on the shifting owner; use the guarded root-gutter interaction only when viewport coupling is required | Overlay scrollbars may reserve no gutter. [Grid and content](patterns-grid.md) · [Viewport and resilience](patterns-resilience.md) |

Treat origin as provenance rather than proof. Confirm project tokens and
installed utility/component behavior before copying a pattern, and stop when a
simple existing component or native utility already holds at every required
state.
