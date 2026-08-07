---
name: designer
description: "Apply whenever building, finishing, or reviewing UI in a React + Tailwind + shadcn project. Every taste call carries its one-line reason — scale, easing, duration, radius, shadow, quantitative where possible — named in precise vocabulary; the finish details get proposed unprompted where they fit, from concentric radii and focus-visible rings to hit areas, tabular-nums, empty/loading/error states, safe-area insets and z-index off a token scale; the three AI-slop tells get refused unless the brief asks for them; and every pass closes with a token-drift audit of its own diff."
---

# designer

Two habits on every UI surface. **State the reason** — no value is committed without its articulated why. **Add the finish unprompted** — the detail pass is separate work from the structure pass, and nobody will ask for it.

The attention shift: from *does this render?* to *can I say why each value is what it is, and is this actually finished?*

## The stack

Assume React, Tailwind and shadcn unless the project says otherwise, and read the project before writing into it — the theme entrypoint (`globals.css` in most setups; skim the `@theme` block) for which tokens exist, `components.json` and `package.json` for what is installed and at which version. Behavior differs across majors in all three, so where the harness exposes a documentation MCP server or plugin for one of them, read the current docs through it rather than recalling how a version behaved.

Match what is already there before adding, reading the two or three strongest comparable surfaces rather than averaging everything nearby: if they consistently apply `tabular-nums`, follow that; if a value exists as a token, use the token. A repeated semantic relationship is stronger evidence than a repeated number — a single nearby value can be accidental. Don't mint new tokens unprompted; flag them for discussion instead. Where no reliable example exists, say so rather than presenting a generic default as the local pattern, and start from quiet hierarchy and the brief.

## State the reason

Two modes of one discipline. Keep them straight.

**Mode 1 — committing a value.** Each taste call carries a one-line *why*, quantitative where possible; durations, scale values and character counts survive review, "subtle" and "fast" average down to vague results.

- `transform: scale(0.95)` initial — *nothing in the real world appears from nothing*.
- `text-wrap: balance` on a heading — *balanced wrapping prevents one-word last lines that read as broken*.
- `scale(0.97)` on `:active`, not `0.85` — *subtle reads as tactile; heavy reads as broken*.
- No animation on the command palette — *used 200×/day; motion at that frequency becomes friction*.

If you can't state the reason, you don't have the call yet: look at the codebase and [references/taste.md](references/taste.md), then try again. A reason that arrives as a pat phrase you've used before was cited rather than considered. Where no stated reason exists anywhere — not here, not in the codebase, not from the user — mirror the codebase's existing pattern or surface the call with its options and their reasons, rather than manufacturing conviction.

Form the reason for every call; **surface** it only where it earns the words — a choice that is new to the product, divergent from the comparable surfaces, promoted into a shared token or variant, visible but not yet authorized, or expensive to reverse. Reusing an existing semantic role the way the product already reuses it needs no narration, and narrating it buries the calls that did need defending.

**Mode 2 — judging existing code.** Write the wrongness *and* its cause before regenerating: "the title wraps to two lines because there's no `text-balance`." The diagnosis is the work; the edit is the side effect. Skipping it produces the failure loop — "this feels off" → regenerate → land on a *different* mediocre solution → repeat. When the complaint arrives as a reaction rather than a mechanism — "looks flat", "type is weak", "feels slow" — convert it through the reaction-to-diagnosis table in [references/taste.md](references/taste.md) before changing a value.

Don't conflate them: self-review of a value you just committed rests on the Mode 1 reasoning that produced it. Mode 2 re-derivation is for code that was already there.

## Name it precisely

A stated reason is only as good as its nouns. "The spacing feels off" is a feeling; "the icon is mathematically centered but optically low in the row" is a reason someone can verify. When a reason comes out vague, look for the missing noun first — [references/taste.md](references/taste.md) carries both halves: the reaction-to-diagnosis table that names the mechanism, and the vocabulary (optical vs mathematical centering, kerning vs tracking, x-height, measure, affordance, filled vs outlined, semantic token, voice vs tone, front-loading) that names the fix.

## Refuse the slop

Three choices read as generated rather than designed. Refuse them on every surface unless the brief explicitly asks.

| Default | Override | Reason |
| :-- | :-- | :-- |
| Decorative gradients, especially purple or multicolor, on cards, panels and backgrounds | A solid semantic token, or one subtle gradient on a single hero | Multicolor gradients are the universal AI-image aesthetic; they say "generated" before anything else |
| Glow as a primary affordance | Real depth — the shadow scale, concentric radii, image outlines | Glow reads as desktop screensaver, not product |
| Multiple accent colors competing in one view | One accent per view; greys carry the rest | Two accents read as undecided; three read as a free template |

The tell is a decorative gradient or a colored glow shadow with no stated reason behind it: the reach was "make it pretty". Replace it with the design token, then ask whether the effect was earning its place.

## Add the finish unprompted

Propose these where they fit and aren't already handled. Some are universal — focus-visible, no `transition: all`, reduced motion at the token layer. Others are conditional on the design: concentric radii need nested rounded surfaces, image outlines need content images. Judgment, not a sweep. Full reasoning per item: [references/polish.md](references/polish.md) for the visual and interaction half, [references/behavior.md](references/behavior.md) for states, forms, navigation and copy.

**Surface** — concentric radii, outer = inner + padding, because mismatched nested radii is the loudest visual smell. Shadows rather than borders where depth is implied. Image outlines at 10% *pure* black or white, since tinted neutrals read as dirt on the edge. Optical alignment on icon-with-text buttons and asymmetric icons, where `justify-center` still looks wrong.

**Interaction** — a focus-visible ring on every interactive element, `outline: max(2px, 0.08em) solid currentColor` with `outline-offset: 0.15em`, because `currentColor` adapts to dark mode for free. A 40×40px hit area (44 for primary touch or AAA), extended with a pseudo-element when the visible target is smaller. `scale-[0.97]` on `:active`, never below `0.95`. `aria-label` on icon-only buttons. On hover-triggered movement, animate a child rather than the hovered element, or the cursor falls off mid-tween and flickers.

**Type and numbers** — `text-balance` on headings, `text-pretty` on body. `tabular-nums` anywhere a number changes, or each digit's width shifts the layout. Curly quotes, the single `…` character, non-breaking spaces in units and shortcut lockups, `translate="no"` on brand and code tokens, and `Intl` for dates and numbers rather than hand-assembled strings.

**States** — an empty state with a real message, not a blank panel. A skeleton rather than a spinner for any wait past ~300ms, since a skeleton preserves layout and says what will be there; it is for the cold-cache case only, so render cached data when it exists. An error state with a recovery path. Disabled visually distinct from read-only. `aria-live="polite"` on toast and status containers so screen readers announce without focus theft.

**Motion hygiene** — never `transition: all`; name the properties, or layout and paint get animated by accident. `prefers-reduced-motion` handled once at the token layer, so one rule covers every component. `will-change` only on `transform`, `opacity` or `filter`, and only after observing first-frame stutter. Looping animations paused off-screen, because off-screen compositor work costs battery and nobody sees it.

**Layering and chrome** — `z-index` from a fixed token scale, no arbitrary `z-[N]`, which is what stops the z-9999 spiral. Safe-area insets on fixed and sticky bars, paired with `viewport-fit=cover` or the rule silently resolves to zero. `scrollbar-gutter: stable` on scroll containers. `scroll-margin-top` on anchor targets and on focusables a sticky bar could hide (WCAG 2.2 SC 2.4.11). `-webkit-font-smoothing: antialiased` at the root on macOS, and `-webkit-tap-highlight-color` set to the design system rather than left at the platform default.

**Forms and navigation** — paste never blocked, since it breaks password managers and 2FA far more often than it catches anything validation wouldn't. Submit stays enabled until the request starts, then shows a spinner beside its original label. Errors inline beside their field, with focus moving to the first. An unsaved-changes warning before navigation. Semantic `type`, `inputMode` and `autoComplete` on every field. Whitespace trimmed only where the field contract makes it non-semantic — never passwords or exact tokens. `AlertDialog`, not `Dialog`, for destructive or irreversible actions. The URL carries view state — filters, tabs, pagination, expanded panels — and navigation goes through real links, never a `div` with an onClick.

## Work in passes

Run a large UI ask as sequential narrow passes — structure, then states, then polish — rather than one combined emission, which skips every check above. Structure generated from a mockup is the foundation, not the finish; don't report a scaffold as done.

## Review output contract

When reviewing existing UI code, present every change as a markdown table with **Before** and **After** columns — every change made or proposed, not a subset; never loose "Before:" / "After:" lines outside a table. Group changes by principle with a heading above each table, and keep each row to a single diff so the whole list scans quickly. Write every **After** snippet in the styling system the project already uses, carry the one-line reason with each row, and cite `file:line` when it isn't obvious from the snippet. A principle that was reviewed and needed nothing gets no table at all.

## Close the pass

Before reporting done, re-read the diff you just produced — only those files, not the wider codebase — against the theme entrypoint you read at the start, and treat every raw value the theme already covers as drift:

| Found in the diff | Replace with |
| :-- | :-- |
| A hex or `rgb()` literal | The semantic color token, or `oklch()` where none fits |
| A `px` length | `rem`, or the spacing token |
| A raw palette class such as `bg-zinc-100` | The semantic equivalent, such as `bg-muted` |
| An arbitrary value such as `min-h-[3.75rem]` | The named utility, `min-h-15` |
| An arbitrary `z-[N]` or a hardcoded duration | The z-index or duration token |

Fix what is mechanical. Where the theme has no token for a value that recurs, say so and propose the token rather than adding one silently. Then walk [references/checklist.md](references/checklist.md) over the same files.

## References

| File | Scope |
| :--- | :--- |
| [`references/taste.md`](references/taste.md) | Value-with-reason pairs, the precision vocabulary, frequency × novelty, anti-slop overrides, the depth toolkit, microcopy corollaries. |
| [`references/polish.md`](references/polish.md) | Visual and interaction finish, with reasoning and code per item — concentric radii, optical alignment, shadows, focus rings, image outlines, hit areas, safe areas, the z-index scale. |
| [`references/behavior.md`](references/behavior.md) | Behavioral and copy finish — empty/loading/error states, `aria-live`, input types, forms, URL as state, tooltip timing, typographic and locale micro-craft. |
| [`references/checklist.md`](references/checklist.md) | The pre-ship list walked at the end of a UI task. |

Open one at a time; the body is the always-on layer, the references are on-demand depth.

## Sources

> This skill draws inspiration from publicly available content from [Emil Kowalski](https://emilkowal.ski/), [Rauno Freiberg](https://rauno.me/), [index.how](https://index.how/), and [Vercel](https://vercel.com/).
