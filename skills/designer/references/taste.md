# Taste and judgment

How to state reasons that hold up, the vocabulary that makes them checkable, why the frequency × novelty ratio works, and where taste calls need looking up rather than improvising.

## State the reason — the core discipline

Almost every taste call has a logical reason underneath if you look closely enough. Find it and write it down: once articulated it transfers and re-applies, where an inarticulate preference does neither. State reasons quantitatively where possible — durations, scale values, character counts — because a vague reason averages down to a vague result.

Value-with-reason pairs:

| Value | Reason |
| :-- | :-- |
| `transform: scale(0.95)` initial, not `scale(0)` | Nothing in the real world appears from nothing. |
| `transition-duration: 180ms` | UI animations under 300ms feel responsive; 180ms beats 400ms at the same task. |
| `transform-origin` bound to the trigger on a popover | Popovers should scale from their trigger, not their center; modals are the exception, having no trigger anchor. |
| `text-wrap: balance` on a heading | Balanced wrapping prevents one-word last lines that read as broken. |
| `min-h-dvh`, not `min-h-screen` | `vh` is wrong on mobile because browser chrome is dynamic; `dvh` adapts. |
| `width: min(100% - 2rem, 60ch)` | One rule yields gutters that survive every viewport without overflow. |
| `font-size: max(16px, 1rem)` on inputs | Anything under 16px triggers iOS focus zoom. |
| `outline: max(2px, 0.08em) solid currentColor` for focus | `currentColor` adapts to dark mode and contextual colors automatically. |
| `tabular-nums` on a counter | Digits are different widths; without it the counter shifts visibly per increment. |
| Image outline at `rgb(0 0 0 / 0.1)`, pure rather than tinted | Tinted neutrals pick up the surface color and read as edge dirt. |
| No animation on the command palette toggle | Used 200×/day; motion at that frequency becomes friction. |
| `scale(0.97)` on `:active`, not `0.85` | Subtle reads as tactile; heavy reads as broken. |
| Spring `bounce: 0` for productivity UI | Bounce at 0.3 and above reads as playful; productivity tools shouldn't be playful. |

**The rule**: when you write a value, write the reason next to it — in review output, in a comment for non-obvious calls, mentally for routine ones. If you can't state the reason, you don't have the call yet.

**Where to look when stuck**: the existing codebase first, then the current Tailwind and shadcn docs for the installed majors.

## Name it precisely — vocabulary makes reasons checkable

A stated reason is only as good as its nouns. A feeling names how the interface landed on you; a diagnosis names the mechanism that produced it, which is the thing someone else can verify and act on. Convert the reaction before touching a value:

| Vague reaction | The diagnosis that changes the decision |
| :-- | :-- |
| "The spacing feels off" | The icon's visible mass sits optically low, although its box is mathematically centered. |
| "The type is weak" | The first and second priorities share size, weight, contrast and measure, so the hierarchy collapses. |
| "The card looks flat" | This surface needs separating from *this* background; that depth is the right separator is not yet established. |
| "The colors clash" | Two accents are competing for primary-action meaning. |
| "The icon looks wrong" | Its stroke weight and fill conflict with the surrounding type and the rest of the icon set. |
| "The heading looks broken" | The last line orphans one word, because nothing is balancing the wrap. |
| "The numbers jump" | Digits are proportional, so each increment re-flows the line. |
| "It feels slow" | A spinner replaced the layout during the wait, so the page re-lays-out twice instead of once. |
| "It looks unfinished" | Only the happy path exists; the empty, loading and error states were never authored. |
| "It looks generated" | A treatment repeats with no semantic role behind it, competing with the product's own meaning. |

Once the mechanism is named, the noun that names it is usually the fix:

| Term | The distinction it buys |
| :-- | :-- |
| Optical vs mathematical centering | Triangles and asymmetric icons centered by math read as off; nudge to the perceived center |
| Kerning vs tracking | Space between one specific pair vs uniform spacing across a run; different fixes |
| x-height | Why two fonts at the same `font-size` read as different sizes; match perceived size, not the number |
| Measure | ~65ch is a comfortable line length; the reason behind a `max-w` on prose, not a taste call |
| Affordance | A button looks pressable, a link looks clickable; the reason hover, focus and active states exist at all |
| Filled vs outlined | Icon fill signals state — filled means active or selected — not style preference; mixing them mid-set breaks the signal |
| Icon visual weight | Stroke weight must scale with size, and icons should match the weight of surrounding text or they shout |
| Semantic token | A color named by purpose (`bg-card`) survives a rebrand; one named by value (`gray-100`) is a future bug |
| Voice vs tone | Voice is the product's constant personality; tone adapts to the moment — an error doesn't joke, a success can |
| Front-loading | "Export ready" beats "Your export is complete and available for download"; the first two words carry the message |

Microcopy runs on the same discipline: error states say what went wrong *and* what to do next; success messages are specific and brief ("Saved", not "Done"); one primary button per view, because a second primary is an undecided hierarchy wearing a style.

The pattern across all of these is that the precise term converts "I'd nudge this" into a rule you can re-apply.

## Articulate before regenerating — the review loop

When judging existing UI — the codebase's, or your own from an earlier pass — name what's wrong *and its cause* before changing anything: "the title wraps to two lines because there's no `text-balance`; the image shifts on load because there's no `aspect-ratio`." Then fix specifically those things.

Skipping the articulation produces the failure loop: "this feels off" → regenerate → land on a *different* mediocre solution → repeat. The articulated diagnosis is the work; the edit is the side effect.

## Frequency × novelty — the rule taste reasons lean on

**Novelty is inversely proportional to frequency.** The ratio works because novelty is contrast: 90% of an interface familiar and quiet, 10% the novel accent. The mechanism is semantic satiation — a flourish repeated everywhere loses its meaning the way a repeated word does, so universal novelty erases the contrast that makes the 10% land.

Concretely: a login transition can carry novelty, being seen once a session; a "purchase complete" state can be celebratory, at most once a session; a dashboard card hover cannot, being seen every minute; a marketing page can be experimental in ways a product UI can't. The audience modifier: productivity-tool users pay a novelty tax, since every unfamiliar pattern is a learning cost they didn't ask for, where entertainment-app users actively seek it.

Taste reasons cite frequency and purpose constantly. The same flourish is a gift in one product and friction in another.

## Anti-slop calls — defaults to override

Independent of frequency × novelty, three visual choices read as generated rather than designed. Refuse them on every UI surface unless the brief explicitly asks.

| Default | Override | Reason |
| :-- | :-- | :-- |
| Decorative gradients, especially purple or multicolor, on cards, panels and backgrounds | A solid semantic token such as `bg-card` or `bg-muted`, or one subtle gradient on a single hero — never on every surface | Multicolor gradients are the universal AI-image aesthetic. They communicate "generated" before they communicate anything else. |
| Glow effects — large colored shadow spreads, neon outlines — as primary affordances | Real depth via the shadow scale, concentric radii and image outlines | Glow reads as desktop screensaver, not product. |
| Multiple accent colors competing in one view — a purple CTA beside a cyan badge beside a magenta highlight | One accent per view; greys carry the rest | Two accents read as undecided; three read as a free template. |

The tell is any of the three arriving with no stated reason behind it: the reach was "make it pretty". Replace with the design token, then ask whether the effect was earning its place.

## Depth as a design move

Depth in UI doesn't come from perspective transforms. It comes from layering, blur, opacity and asynchronous timing — the perceptual machinery humans use to read 3D space.

1. **Foreground obstructions** — elements that occlude others read as closer. Don't always center the subject; frame it with foreground.
2. **Backdrop blur** — `backdrop-filter: blur(12px)` reads as "this layer is now behind". An OS-native cue.
3. **Opacity dimming** — inactive layers fade to indicate they aren't interactive right now.
4. **Edge fades** — `mask-image: linear-gradient(…)` at container edges suggests the world continues.
5. **Stagger** — sequential rather than synchronous, since stagger amplifies a gesture where sync mutes it. Keep it to 30–80ms between items; longer makes the interface feel slow.

Most of the work is not `rotateX`. It's blur, opacity and delay sequencing.

## Where taste calls need looking up

- **Novelty wasted on a high-frequency surface is invisible until you ask** *who sees this, how often* — so ask it every time motion is on the table.
- **A custom easing versus a stock one can't be settled by feel.** Reason from what the motion is for and match the project's existing easings rather than picking by numbers alone.
- **When no stated reason exists for a call** — not here, not in the codebase, not from the user — mirror the codebase's existing pattern, or surface the call to the user with the options and their reasons.
- **Structure from a mockup or design file is the foundation, not the finish.** The polish pass — states, focus, motion, microcopy — is separate, deliberate work; don't report a scaffold as done.
- **Run a large UI ask as sequential narrow passes** — structure, then states, then polish — each with its own stated reasons, rather than one combined emission that skips all of them.
