# Taste and judgment

The judgment layer: how to state reasons that hold up, the vocabulary that makes them checkable, the frequency × novelty rule with worked examples, and the limits of your unaided taste.

## State the reason — the core discipline

Almost every taste call has a logical reason if you look closely enough. Find the reason and write it down — once articulated, it transfers and re-applies; an inarticulate preference doesn't. State reasons quantitatively where possible (durations, scale values, character counts), not as "subtle" or "fast" — a vague reason averages down to a vague result.

Examples of value-with-reason pairs:

| Value | Reason |
| :-- | :-- |
| `transform: scale(0.95)` initial (not `scale(0)`) | Nothing in the real world appears from nothing. |
| `transition-duration: 180ms` | UI animations under 300ms feel responsive; 180ms beats 400ms at the same task. |
| `transform-origin: var(--transform-origin)` on popover | Popovers should scale from their trigger, not center; modals are the exception (no trigger anchor). |
| `text-wrap: balance` on heading | Balanced wrapping prevents one-word last lines that read as broken. |
| `min-h-dvh` not `min-h-screen` | `vh` is wrong on mobile (browser chrome dynamic); `dvh` adapts. |
| `width: min(100% - 2rem, 60ch)` | One rule yields gutters that survive every viewport without overflow. |
| `font-size: max(16px, 1rem)` on inputs | Anything under 16px triggers iOS focus zoom. |
| `outline: max(2px, 0.08em) solid currentColor` for focus | `currentColor` adapts to dark mode and contextual colors automatically. |
| `tabular-nums` on counter | Digits are different widths; without tabular, counter shifts visibly per increment. |
| Image outline `rgb(0 0 0 / 0.1)` (pure, not tinted) | Tinted neutrals pick up surface color and read as edge dirt. |
| No animation on command palette toggle | Used 200×/day; motion at that frequency becomes friction. |
| `scale(0.97)` on `:active` (not `0.85`) | Subtle reads as tactile; heavy reads as broken. |
| Spring `bounce: 0` for productivity UI | Bounce ≥0.3 reads as playful; productivity tools shouldn't be playful. |

**Rule**: when you write a value, write the reason next to it (in review output, in a comment for non-obvious calls, mentally for routine ones). If you can't state the reason, you don't have the call yet.

**Where to look when stuck**: [`animation-craft.md`](animation-craft.md) and the other references in this skill, the Tailwind v4 / shadcn docs, the existing codebase.

## Name it precisely — vocabulary makes reasons checkable

A stated reason is only as good as its nouns. "The spacing feels off" is a feeling; "the icon is mathematically centered but optically low in the row" is a reason someone can verify and act on. Vocabulary that sharpens the most common calls:

| Term | The distinction it buys |
| :-- | :-- |
| Optical vs mathematical centering | Triangles and asymmetric icons centered by math read as off; nudge to the perceived center |
| Kerning vs tracking | Space between one specific pair vs uniform spacing across a run; they're different fixes |
| x-height | Why two fonts at the same `font-size` read as different sizes; match perceived size, not the number |
| Measure | ~65ch is a comfortable line length; the reason behind a `max-w` on prose, not a taste call |
| Affordance | A button looks pressable, a link looks clickable; the reason hover/focus/active states exist at all |
| Filled vs outlined | Icon fill signals state (filled = active/selected), not style preference; mixing them mid-set breaks the signal |
| Icon visual weight | Stroke weight must scale with size, and icons should match the weight of surrounding text or they shout |
| Semantic token | A color named by purpose (`bg-card`) survives a rebrand; one named by value (`gray-100`) is a future bug |
| Voice vs tone | Voice is the product's constant personality; tone adapts to the moment — an error doesn't joke, a success can |
| Front-loading | "Export ready" beats "Your export is complete and available for download"; the first two words carry the message |

Microcopy corollaries, same discipline: error states say what went wrong *and* what to do next; success messages are specific and brief ("Saved", not "Done"); one primary button per view — a second primary is an undecided hierarchy wearing a style.

The pattern across all of these: the precise term converts "I'd nudge this" into a rule you can re-apply. When you catch yourself writing a vague reason, look for the missing noun first.

## Articulate before regenerating — the review loop

When judging existing UI — the codebase's, your own from an earlier pass — name what's wrong *and the reason* before changing anything: "the title wraps to two lines because there's no `text-balance`; the image shifts on load because there's no `aspect-ratio`." Then fix specifically those things.

Skipping the articulation step produces the failure loop: "this feels off" → regenerate → hill-climb to a *different* mediocre solution → repeat. The articulated diagnosis is the work; the edit is the side effect. This is Mode 2 of state-the-reason in SKILL.md — same discipline, applied to code that already exists.

## Frequency × novelty — the master rule

Two axes:

- **Axis 1: how often** the user encounters this surface. Hundreds/day to once.
- **Axis 2: how much** novelty (animation, decoration, custom motion) the surface carries.

The rule: **novelty is inversely proportional to frequency.** Hold this in foreground on every UI choice — your untrained default is universal novelty (every button gets hover motion, every modal gets fade-scale, every list gets stagger), and most of those should be deleted. This one rule disciplines ~80% of the bad calls.

Worked examples on shadcn primitives:

| Component | Frequency | Default treatment | Reason |
| :-- | :-- | :-- | :-- |
| `cmdk` / Command palette | 100+/day for power users | No animation. Open instantly. | Repeated motion at this frequency stops being delight, becomes tax. |
| `Tooltip` | dozens/day | First open delays 700ms; subsequent in same area instant. | Initial delay prevents accidental activation; subsequent instant feels faster. |
| `DropdownMenu` | dozens/day | Sub-200ms ease-out fade+scale, origin-aware. | Visible enough to confirm action, fast enough to not read as slow. |
| `Toast` | dozens/day | 180ms enter, 140ms exit, slide+fade. Stack with stagger. | Frequent but transient — exit faster than enter so it doesn't linger. |
| `Dialog` | occasional | 200–280ms fade+scale from center. | Big visual change; needs spatial continuity, but still under 300ms. |
| `Drawer` / `Sheet` | occasional | 280–400ms iOS-like slide. | The motion *is* the spatial metaphor; longer is allowed. |
| Onboarding sequence | once | Choreographed, 400–800ms, can carry stagger and decorative motion. | One-time experience; novelty earns its keep. |
| Marketing scroll-driven | per-pageview | Permitted; respect `prefers-reduced-motion`. | Marketing exists to delight; novelty *is* the goal. |

**Why the ratio works — novelty is contrast.** 90% of an interface familiar and quiet; 10% the novel accent. The mechanism is semantic satiation: a flourish repeated everywhere loses its meaning the way a repeated word does, so universal novelty erases the contrast that makes the 10% land. Concretely: a login transition can carry novelty (seen once a session); a "purchase complete" state can be celebratory (at most once a session); a dashboard card hover cannot (seen every minute); a marketing page can be experimental in ways a product UI can't.

**The audience modifier:** productivity-tool users pay novelty tax — every unfamiliar pattern is a learning cost they didn't ask for. Entertainment-app users actively seek it. The same flourish is a gift in one product, friction in another.

## Anti-slop calls — your defaults to override

Independent of frequency × novelty, three visual choices read as "generated, not designed." Refuse them on every UI surface unless the brief explicitly asks.

| Default | Override | Reason |
| :-- | :-- | :-- |
| Decorative gradients (especially purple/multicolor) on cards, panels, backgrounds | Solid semantic token (`bg-card`, `bg-muted`), or a single subtle gradient on one hero — never on every surface | Multicolor gradients are the universal AI-image aesthetic. They communicate "generated" before they communicate anything else. |
| Glow effects (`shadow-[0_0_40px_<color>]`, neon outlines) as primary affordances | Real depth via the shadow scale + concentric radii + image outlines | Glow reads as desktop-screensaver, not product. |
| Multiple accent colors competing in one view (purple CTA + cyan badge + magenta highlight) | One accent per view; greys carry the rest | Two accents read as undecided; three read as a Figma free-template. |

The tell: `bg-gradient-to-br from-purple-500 to-pink-500` without a stated reason means you reached for "make it pretty." Replace with the design token and ask whether the gradient was earning its place. Same test for `shadow-[0_0_…px_<accent>]` and a third accent color creeping into a view that already has two.

## Depth as a design move

Depth in UI doesn't come from perspective transforms. It comes from layering, blur, opacity, and asynchronous timing — borrowing the perceptual machinery humans use to read 3D space.

The toolkit:

1. **Foreground obstructions** — elements that occlude others read as closer. Don't always center the subject; frame it with foreground.
2. **Backdrop blur** — `backdrop-filter: blur(12px)` reads as "this layer is now behind." OS-native cue.
3. **Opacity dimming** — inactive layers fade to indicate they're not interactive right now.
4. **Edge fades** — `mask-image: linear-gradient(...)` at container edges suggests the world continues.
5. **Stagger** — sequential, not synchronous. Stagger amplifies a gesture; sync mutes it.
6. **Motion choreography** — sequence related elements, prioritize feedback near the gesture origin, delay competing animations.

Most of the work is **not** `rotateX`. It's blur + opacity + delay sequencing.

## The limits of your unaided taste

Know where your defaults fail, because that decides when to look things up versus improvise:

- **You can't distinguish "works" from "feels right" without an articulated reason.** Your unaided default is median motion and median polish — competent, mediocre. That's why every rule in this skill carries its reason: the reason is what you apply; the rule alone you merely repeat.
- **You won't notice novelty wasted on a high-frequency surface** unless you ask *who sees this how often* — so ask it, every time motion is on the table.
- **You can't tell when a custom easing is needed vs a stock one** from feel. Use the decision tree in [`animation-craft.md`](animation-craft.md); don't pick by vibe.
- **When no stated reason exists for a taste call** — not in this skill, not in the codebase, not from the user — don't manufacture conviction. Mirror the codebase's existing pattern, or surface the call to the user with the options and their reasons.
- **Scaffolding is not finished UI.** Structure generated from a mockup or design file is the foundation; the polish pass (states, focus, motion, microcopy) is separate, deliberate work. Don't report a scaffold as done.
- **Work large UI asks as sequential narrow passes** — structure → states → polish → motion — not one combined emission. Each pass has its own checklist; a combined pass skips all of them.

## Practical loop

When working on UI:

1. **Open `globals.css` first.** Skim the `@theme` block. Read what's already there.
2. **Walk the SKILL.md stance bullets** before writing — pause, fluid, primitive, container query, token, frequency, reason.
3. **For specific patterns, open the matching reference** — layout, fluid, motion-base-ui, animation-craft, polish.
4. **State the reason for any value you write.** If you can't, find an example or stop.
5. **For review asks**, use `web-design-guidelines` when installed; `checklist.md` is the standalone list.
6. **At the end, run the pre-ship checklist** (`references/checklist.md`).
