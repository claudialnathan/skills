---
name: design-taste
description: "The judgment layer for UI work: state the reason for every taste call (scale, easing, duration, radius, shadow — a one-line why, quantitative where possible), name problems with precise vocabulary (optical vs mathematical centering, measure, affordance, x-height), and refuse the three AI-slop tells — decorative purple/multicolor gradients, glow as primary affordance, multiple competing accent colors — unless the brief explicitly asks. Use when making or defending visual taste calls, reviewing UI that feels off, handling vague asks like make it feel premium, or judging AI-generated UI."
compatibility: Tailwind v4 + shadcn (Base UI) + Next.js
paths:
  - '**/components/**/*.{ts,tsx,jsx}'
  - '**/app/**/*.{tsx,jsx,mdx}'
  - '**/pages/**/*.{tsx,jsx,mdx}'
  - '**/src/components/**/*.{ts,tsx,jsx}'
---

# design-taste

Your unaided default is median motion and median polish — competent, mediocre. The reason is what you apply; the rule alone you merely repeat. **The attention shift this skill makes: no taste value gets committed without its articulated reason, and no "feels off" gets fixed without being named first.**

## State the reason

Two modes of the same discipline — keep them straight:

**Mode 1 — for outputs (committing a value).** Every taste call comes with a one-line *why*, quantitative where possible (durations, scale values, character counts — "subtle" and "fast" average down to vague results). Examples:

- `transform: scale(0.95)` initial — *nothing in the real world appears from nothing*.
- `text-wrap: balance` on a heading — *balanced wrapping prevents one-word last lines that read as broken*.
- `scale(0.97)` on `:active`, not `0.85` — *subtle reads as tactile; heavy reads as broken*.
- No animation on the command palette — *used 200×/day; motion at that frequency becomes friction*.

If you can't state the reason, you don't have the call yet. Stop; look at the codebase and [references/taste.md](references/taste.md); try again. If your reason is a pat phrase you've used before, that's a tell you cited it instead of considering it. When no stated reason exists anywhere — not in this skill, not in the codebase, not from the user — don't manufacture conviction: mirror the codebase's existing pattern, or surface the call with the options and their reasons.

**Mode 2 — for reviews (judging existing code).** Write the wrongness *and the reason* before regenerating: "the title wraps to two lines because there's no `text-balance`." Articulating the diagnosis is the work; the edit is the side effect. Skipping it produces the failure loop: "this feels off" → regenerate → hill-climb to a *different* mediocre solution → repeat.

Don't conflate the modes: self-review of a value you just committed rests on the Mode 1 reasoning that produced it; Mode 2 first-principles re-derivation is for code that's already there.

## Name it precisely

A stated reason is only as good as its nouns. "The spacing feels off" is a feeling; "the icon is mathematically centered but optically low in the row" is a reason someone can verify. The vocabulary table (optical vs mathematical centering, kerning vs tracking, x-height, measure, affordance, filled vs outlined, semantic token, voice vs tone, front-loading) lives in [references/taste.md](references/taste.md) — when you catch yourself writing a vague reason, look for the missing noun first.

## Anti-slop — your defaults to override

Three visual choices read as "generated, not designed." Refuse them on every UI surface unless the brief explicitly asks:

| Default | Override | Reason |
| :-- | :-- | :-- |
| Decorative gradients (especially purple/multicolor) on cards, panels, backgrounds | Solid semantic token, or a single subtle gradient on one hero | Multicolor gradients are the universal AI-image aesthetic; they say "generated" before anything else. |
| Glow effects as primary affordances | Real depth via the shadow scale, concentric radii, image outlines | Glow reads as desktop-screensaver, not product. |
| Multiple accent colors competing in one view | One accent per view; greys carry the rest | Two accents read as undecided; three read as a Figma free-template. |

The tell: `bg-gradient-to-br from-purple-500 to-pink-500` without a stated reason means the reach was "make it pretty" — replace with the design token and ask whether the gradient was earning its place.

## Work in passes

Work large UI asks as sequential narrow passes — structure → states → polish → motion — not one combined emission; a combined pass skips every checklist. And don't report a scaffold as done: structure from a mockup is the foundation, the deliberate polish pass is separate work.

## Review output contract

When reviewing existing UI code, present every change as a markdown table with **Before** and **After** columns — every change made or proposed, not a subset; never loose "Before:" / "After:" lines outside a table. Group changes by principle with a heading above each table, and keep each row to a single diff so the whole list scans quickly. Write every **After** snippet in the styling system the project already uses, carry the one-line reason with each row, and cite `file:line` when it isn't obvious from the snippet. A principle that was reviewed and needed nothing gets no table at all.

## References

| File | Scope |
| :--- | :--- |
| [`references/taste.md`](references/taste.md) | Value-with-reason pairs, the precision vocabulary, anti-slop overrides, depth toolkit (blur, opacity, stagger over rotateX), microcopy corollaries, the limits of unaided taste. |
