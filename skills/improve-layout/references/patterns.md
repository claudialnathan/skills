# Layout pattern index

Use this index only when the reproduced pressure point does not already select
one of the narrower pattern references linked from `SKILL.md`. Route by
responsibility, use the lightest owner that satisfies it, and read the selected
reference's **When NOT** before changing a working layout.

| Need / pressure point | Stable first route | Reference |
| :-- | :-- | :-- |
| Vertical rhythm, wrapping inline groups, app navigation, content-flow sidebar, content-driven fold, viewport cover, sticky shell, centered measure, or padded box | Existing behavioral owner, then Flex/Grid or the named CSS relationship | [Flow and shells](patterns-flow.md) |
| Intrinsic card grid, grid blowout, localized content growth, cross-card alignment, neutral wrapper, overlay, breakout, or DOM-shape query | Diagnose intrinsic sizing and source/semantic constraints before selecting a grid mechanism | [Grid and content](patterns-grid.md) |
| Kanban/status lanes, component-scoped responsive behavior, or a horizontal snap region | Preserve lane continuity and let native overflow own scrolling | [Lanes and scrollers](patterns-lanes.md) |
| Full-height ownership, device safe areas, wide tables, focus clipping, local blowout repair, nesting, or final anti-pattern review | Identify the containing block, device axis, or actual overflow owner | [Viewport and resilience](patterns-resilience.md) |
| Form-driven visual board assignment, masonry/reading flow, style queries, or raw anchor positioning | Build a stable fallback first, then load the guarded mechanism | [Advanced mechanisms](advanced.md) |

Treat origin as provenance rather than proof. Confirm project tokens and
installed utility/component behavior before copying a pattern, and stop when a
simple existing component or native utility already holds at every required
state.
