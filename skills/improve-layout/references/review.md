# Layout review and reporting

Load this file for an audit, review, or focused re-audit after implementation.
Use [`verification.md`](verification.md) for the evidence scope and rendered
checks. Skip this file for a direct implementation that needs only a concise
handoff.

## Grade findings by impact

- **P0** — a supported viewport, zoom level, or reading direction leaves
  content unreachable, an action unusable, or focus lost. Someone cannot do
  the thing.
- **P1** — the layout works but degrades: broken hierarchy or reading order, a
  fold at the wrong width, unexpected overflow, or structure that collapses
  under long or localized content.
- **P2** — isolated spacing, alignment, or optical polish. Nothing is blocked
  and nothing misleads.

The verdict follows the findings: an unresolved P0 blocks; P1-only means
changes are wanted; no actionable finding means the layout is sound. Do not
manufacture a balanced list or an empty table.

## Label the evidence

- **Observed** — seen in the rendered layout, computed style, or command
  output.
- **Inferred** — the best explanation across observations; state what would
  prove it.
- **Decision** — a product or design call rather than a defect.
- **Unverified** — plausible but not exercised.

Keep an inferred P0 separate from a reproduced one. Scanner, linter, and
overflow-probe output is evidence rather than authority; reproduce a seam
before restructuring around it.

## Report the requested review

Lead with the verdict, highest-impact seam, responsible owner, and reason. Name
unverified checks explicitly. Keep the primary queue to five decision groups
while preserving the total blocker count and a route to the complete result.
Broad subjective polish remains a proposal unless visible implementation was
authorized.

For a bounded implemented repair with one owner:

| Location | Before | After | Proof |
| :-- | :-- | :-- | :-- |

For a broad or multi-layer implemented change:

| Location | Grade | Before | After | Why | Proof |
| :-- | :-- | :-- | :-- | :-- | :-- |

For audit-only findings use `Location | Grade | Finding | Proof`; do not invent
an **After**. Proof is the width, state, or measurement exercised, or
`unverified`. Cite `file:line`, keep one change per row, and use the project’s
styling system.

After implementation, report only the focused surface as fixed, remaining,
regressed, and unverified. End a proportionate no-change result with
`No action needed`.

