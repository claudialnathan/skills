---
name: design-craft
description: "This skill should be used while creating, changing, or reviewing user-facing interfaces; for visual hierarchy, typography, color, shape, imagery, icons, affordance, and static depth; when UI feels generic or off; and for vague requests such as make it polished, premium, or finished. It provides ambient visual judgment within the product's existing grammar, names the symptom before changing values, and uses the smallest semantic signal that communicates meaning. It does not activate for changes proven to have no visual effect, and it does not turn bounded work into an unrequested redesign."
---

# design-craft

Make static visual language communicate hierarchy, meaning, state, affordance,
trust, and product character coherently. Preserve the product’s local grammar
and use the smallest signal that carries the intended meaning. Decoration is
not evidence of finish.

Shift attention from “make it look better” to:

> Name what the user must notice, understand, or trust; identify the visual
> symptom; then choose the lightest product-native signal that resolves it.

## Select the mode

| Intent | Mode and authority |
| :--- | :--- |
| Ordinary UI creation or an explicitly authorized visible implementation | **Ambient:** improve proportionate details inside the requested scope; do not expand into a redesign or emit a separate report when no decision is needed. |
| “Review,” “audit,” “what feels off?” | **Findings:** inspect and report. Make no visible edits. |
| A broad “polish,” “premium,” or “make it better” request without apply authority | **Proposal:** rank visible decisions and ask for approval. Make no visible edits. |
| “Apply,” “implement approved items,” or approved IDs | **Approved implementation:** change only the accepted scope, then verify it rendered. |
| The interface is already proportionate | **No change:** say `No action needed`; do not invent novelty or an approval request. |

State the active mode. Existing task authority still governs: a direct build
request permits its visible implementation, while an incidental opportunity
does not authorize new colors, hierarchy, interaction, loading/recovery,
menus, toasts, or motion.

## Work from meaning to treatment

1. State the intended first and second perceptual priorities.
2. Inspect up to three successful nearby examples with a comparable role and
   state. Infer repeated semantic roles, not every incidental value.
3. Name the symptom precisely before choosing a value.
4. Classify the proposed treatment as semantic hierarchy/state, interaction
   affordance, product character, or incidental decoration.
5. Keep incidental decoration out. For the first three classes, choose the
   lightest existing signal: type, spacing relationship, color, shape,
   border/depth, icon treatment, image treatment, or no additional treatment.
6. Author realistic content plus the applicable focus, disabled, invalid,
   empty, dark, and high-contrast states before adding product character.
7. Render the changed state and compare it with the selected exemplar.

Keep the current result when it is already proportionate. Reuse an existing
semantic role before composing a local treatment. Correct a shared variant
only when that role owns the distinction. Promote a token, type role, depth
rule, icon rule, or asset only when cross-system semantic evidence earns it.
Repetition alone does not create infrastructure.

## Load references deterministically

- Read [`references/judgment.md`](references/judgment.md) for a vague “feels
  off” diagnosis, local-grammar inference, hierarchy, product character, or a
  novel/divergent/global decision.
- Read [`references/finish.md`](references/finish.md) when the task must choose
  or challenge a concrete treatment in type, color, radius, depth, imagery,
  icons, numbers, affordance, or visual states.
- For a bounded task whose accepted treatment is already complete and leaves no
  unresolved craft decision, load neither reference merely to repeat it.
- For an explicit review or proposal, load `judgment.md` first and
  `finish.md` only when the requested output must decide a concrete treatment,
  not merely because the review reports a symptom.
- For approved implementation, load the reference that owns any unresolved
  treatment. When the approved finding already names the owner, treatment, and
  preserved boundaries, implement it without an extra craft reference.

Verification is part of the task, not a reason to reload settled guidance. Use
available rendered, computed-style, screenshot, contrast, and focused static
proof that applies. When a required runtime tool is unavailable, run the
available source/static checks and mark the rendered claim `Unverified`; never
substitute source inspection for appearance.

## Communicate decisions

Lead with the verdict and edit boundary. Keep the primary queue to five
decision groups while preserving the total blocker count and a path to the
complete result.

| ID | Grade | Finding | Owner | Proposed change | Proof |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | P1 | … | … | … | observed, inferred, decision, or unverified |

Require explicit rationale for novel, divergent, global, or approval-bearing
choices. Routine semantic reuse needs no narration. After implementation,
report applied, remaining, regressed, and unverified states. Do not claim a
rendered or contrast result from source alone.

## Sources

> This skill draws inspiration from publicly available content from [Luis Ouriach](https://luisouriach.com/), [Emil Kowalski](https://emilkowal.ski/), [Rauno Freiberg](https://rauno.me/), and [Josh Puckett](https://joshpuckett.me).
