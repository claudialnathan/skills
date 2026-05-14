# Taste, judgment, and the agent loop

The meta-layer. Why this skill is structured the way it is, what taste actually consists of, how to train it, and how to use AI without outsourcing the design.

## State the reason — the core discipline

(Emil Kowalski's `agents-with-taste`, lifted to authoring rule.)

Almost every taste call has a logical reason if you look closely enough. The work of being a design engineer working with agents is to **find the reason and write it down**. Once articulated, the reason transfers cleanly to the agent — articulation is the bottleneck, not the model.

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

**Rule**: when you write a value, write the reason next to it (in code review, in a comment for non-obvious calls, mentally for routine ones). If you can't state the reason, you don't have the call yet — go look at examples.

**Where to look when stuck**: `emil-design-eng`, the Tailwind v4 / shadcn docs, the existing codebase, the references in this skill.

## Articulate before revealing — the judgment loop

(Emil's `train-your-judgement`.)

Side-by-side comparison + writing the reasoning *before* checking the expert's = the actual training.

The exercise:
1. Look at two options (two animations, two layouts, two colors).
2. Pick the one that feels better.
3. Write down *why* — in actual sentences.
4. Then read the expert's reasoning (Emil's article, Comeau's post, etc.) and compare.

The same loop applied to AI-generated UI:
1. AI produces a card layout.
2. Before regenerating: write what's wrong *and the reason* — "the title is wrapping to two lines because there's no `text-balance`; the image is shifting on load because there's no `aspect-ratio`."
3. Then ask the AI to fix specifically those things, with the reasons.

The articulate step is the work. The regenerate is the side effect. Skipping articulation produces "this feels off" → "make it better" → AI hill-climbs to a different mediocre solution → repeat.

## Develop taste — where it actually comes from

(Emil's `developing-taste`.)

Taste is **trained**, not innate. The mechanism, in three parts:

1. **Surround yourself with great work.** Active consumption. Look at apps that feel right, study them, screenshot them, read what their builders wrote about them. Anu Atluru: "In a world of scarcity, we treasure tools. In a world of abundance, we treasure taste." Steve Jobs (paraphrased): "Expose yourself to the best things humans have done and bring those into what you're doing."
2. **Analyze deeply, don't just react.** Ask *why* something resonates. Reverse engineer the animation. Inspect the spacing. Read the easing curve in DevTools. The inarticulate "I like this" doesn't transfer; the articulate "the easing on the dropdown enter is a strong ease-out so the user sees instant response, and the duration is 180ms which is below the 300ms perceived-slow threshold" does.
3. **Create relentlessly. Get critical feedback.** There's a phase where your taste exceeds your execution — your eye knows the work isn't on par yet. Emil: "this phase is normal." Push through. The lag closes with practice.

Where taste *doesn't* come from: passive scrolling. Looking at things without analyzing them is ambient exposure that produces familiarity, not skill.

## Frequency × novelty — the master rule

(Rauno Freiberg's `craft/interaction-design`.)

Two axes:

- **Axis 1: how often** the user encounters this surface. Hundreds/day to once.
- **Axis 2: how much** novelty (animation, decoration, custom motion) the surface carries.

The rule: **novelty is inversely proportional to frequency.** Hold this in foreground when reviewing any UI choice.

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

The 90/10 ratio (Rauno, lifted from cinematography's three-color rule): **90% of an interface should be familiar/quiet; 10% is the novel accent.** Universal novelty erases the contrast that makes the 10% land.

The audience modifier: productivity-tool users pay novelty tax (every unfamiliar pattern is a learning cost they didn't ask for); entertainment-app users actively seek novelty. Same flourish is gift in one product, friction in another.

**This rule disciplines ~80% of bad AI UI calls.** AI's default is to make *everything* novel — every button gets hover motion, every modal gets fade-scale, every list item gets stagger. The override is "most of those should be deleted."

## Novelty as accent

(Rauno's `craft/novelty`.)

Quotes that anchor it:

> "Novelty is the contrast to sameness. And novelty works best as a contrast."
> "Make 90% of the experience familiar, and 10% novel."

The mechanism is *semantic satiation* — the perceptual phenomenon where a word loses its meaning when repeated. Visual flourishes work the same way: novel things land *because* they sit against familiar things. Make everything novel and the entire surface becomes ambient noise.

Practical applications:
- A login transition can carry novelty because the user sees it once a session.
- A "purchase complete" state can be celebratory because users see it at most once per session.
- A dashboard card hover *cannot* carry novelty because users see it every minute.
- A marketing site can be experimental in ways a product UI cannot — different audience, different cost-of-attention.

## Anti-slop calls — what AI defaults to that you override

Independent of frequency × novelty, three visual choices read as "generated, not designed." Refuse them on every UI surface unless the brief explicitly asks.

| Default | Override | Reason |
| :-- | :-- | :-- |
| Decorative gradients (especially purple/multicolor) on cards, panels, backgrounds | Solid semantic token (`bg-card`, `bg-muted`), or a single subtle gradient on one hero — never on every surface | Multicolor gradients are the universal AI-image aesthetic. They communicate "generated" before they communicate anything else. |
| Glow effects (`shadow-[0_0_40px_<color>]`, neon outlines) as primary affordances | Real depth via the shadow scale + concentric radii + image outlines | Glow reads as desktop-screensaver, not product. |
| Multiple accent colors competing in one view (purple CTA + cyan badge + magenta highlight) | One accent per view; greys carry the rest | Two accents read as undecided; three read as a Figma free-template. |

The tell: `bg-gradient-to-br from-purple-500 to-pink-500` without a stated reason means the model reached for "make it pretty." Replace with the design token and ask whether the gradient was earning its place. Same test for `shadow-[0_0_…px_<accent>]` and a third accent color creeping into a view that already has two.

## Depth as a design move

(Rauno's `craft/depth`.)

Depth in UI doesn't come from perspective transforms. It comes from layering, blur, opacity, and asynchronous timing — borrowing the perceptual machinery humans use to read 3D space.

The toolkit:

1. **Foreground obstructions** — elements that occlude others read as closer. Don't always center the subject; frame it with foreground.
2. **Backdrop blur** — `backdrop-filter: blur(12px)` reads as "this layer is now behind." OS-native cue.
3. **Opacity dimming** — inactive layers fade to indicate they're not interactive right now.
4. **Edge fades** — `mask-image: linear-gradient(...)` at container edges suggests the world continues.
5. **Stagger** — sequential, not synchronous. Real flocks aren't synchronized; UI doesn't have to be either. Stagger amplifies a gesture; sync mutes it.
6. **Motion choreography** — sequence related elements, prioritize feedback near the gesture origin, delay competing animations.

Most of the work is **not** transform: rotateX. It's blur + opacity + delay sequencing.

## Jakub's design-engineering with AI

(Jakub Krehel's `using-ai-as-a-design-engineer`.)

Use AI to *accelerate*, never to outsource thinking. Quotes that anchor it:

> "AI works best if the user is in charge and not the other way around."
> "Handing-off everything you do to an agent and outsourcing your thinking can hurt you in the long run."
> "Quality and craftsmanship will be more important than ever."
> "Design and user-experience will become the product."

Concrete recommendations:

**Setup (the most leveraged step)**:
- Write codebase-specific rules before starting. Animation perf, accessibility, design system. Keep them short. **Understand them yourself — don't copy-paste rule packs you can't defend.** This skill is the user's version of those rules.
- Reference existing rule frameworks (ui-skills, Vercel Web Interface Guidelines, Motion Plus rules) — but adapt, don't adopt wholesale.

**Prompting**:
- Decompose. Sequential narrow tasks beat one combined ask.
- Use plan mode for larger features — "the difference is pretty significant."
- Non-technical natural language is fine *if the rules carry the technical context*.

**Custom commands**:
- `/deslop` to strip AI-tells (extra comments, defensive null checks, redundant type casts).
- `/review` against codebase rules.

**Layered review**:
- Use a second model on PRs as a check on the first.

**Where AI excels**:
- Finding duplications, extracting shared components.
- Mechanical migrations.
- Scaffolding UI-heavy features.
- Layered review.
- Placeholder image generation.

**Where AI fails**:
- Strategic and design decisions.
- Working without established rules/context.
- Assuming cross-conversation context.
- Unreviewed acceptance of output.

**Figma MCP**:
- Pair with Opus 4.5 to scaffold complex screens. **Use for structural foundation, not finished UI.** Polish and animation are still hand work.

## What AI can and can't do in design

The Emil + Jakub composite:

**Can**:
- Execute frontend tasks at high leverage when given clear rules, decision frameworks, and worked examples.
- Reproduce a designer's philosophy across many surfaces once it has been written down strictly.
- Follow flowcharts (e.g., "which easing to choose"), duration tables, and practical-tip lists.
- Find duplications, extract shared components, mechanical migrations.
- Scaffold UI structure from mockups.

**Can't (without articulated reasons)**:
- Distinguish "works" from "feels right" on visual / animation work.
- Make taste calls intuitively — defaults to the median, which is mediocre motion.
- Generate creative direction independently.
- Recognize when novelty is wasted on a high-frequency surface.
- Know when a custom easing is needed vs when a stock one suffices.

The bottleneck shift: in 2026, the scarce skill isn't *typing the code* — it's *recognizing mediocrity and articulating what would be better*. This skill exists to encode as much of that recognition as possible so AI can hold the discipline; the residual is what the human handles.

## Set the rules. Be strict.

(Emil, `agents-with-taste`.)

> "Set the rules, be strict."

Loose guidelines let agents guess; strict rules don't. **Decision flowcharts beat prose. Tables beat sentences. Worked examples beat principles.**

This is the authoring rule for skills like this one. Every section in the SKILL.md and references should be:

- A rule, a flowchart, a table, or a worked example.
- Specific, not "consider…" or "where applicable."
- Quantitative where possible (durations, scale values, char counts) — not "subtle" or "fast."
- Reasoned — every rule includes the *why*.

If a section isn't one of those forms, it's prose-soft and the agent will average it down.

## The deliverable form has shifted

(Emil's framing.)

> "An engineer has never been more leveraged than today thanks to a fleet of agents. But when it comes to more visual work, like animations, coding agents don't quite know what great feels like."

> "The more you can package into a skill, the more leverage you can get out of your agents."

The 2026 leverage move: **package taste as skill files**. Articulate the reasons. Write strict rules. Include decision flowcharts. Include worked examples. Use Anthropic's `skill-creator` (or this harness's `skill-forge`) to scaffold; iterate on the descriptions and bodies until the agent reliably follows them.

Each principle articulated is a permanent multiplier. This skill is the user's version of that move.

## Practical loop for using this skill

When working on UI:

1. **Open `globals.css` first.** Skim the `@theme` block. Read what's already there.
2. **Walk the SKILL.md stance bullets** before writing — pause, fluid, primitive, container query, token, frequency, reason.
3. **For specific patterns, open the matching reference** — layout, fluid, motion-base-ui, polish.
4. **State the reason for any value you write.** If you can't, find an example or stop.
5. **For animation craft**, invoke `emil-design-eng` — don't reinvent what's there.
6. **For Vercel-specific review**, invoke `web-design-guidelines`.
7. **At the end, run the pre-ship checklist** (`references/checklist.md`).

## Quotes worth keeping in foreground

> "All those unseen details combine to produce something that's just stunning, like a thousand barely audible voices all singing in tune." — Paul Graham (via Emil)

> "Almost every 'taste' decision has a logical reason if you look close enough." — Emil

> "Sometimes the best animation is no animation." — Emil

> "Make 90% of the experience familiar, and 10% novel." — Rauno

> "AI works best if the user is in charge and not the other way around." — Jakub

> "Set the rules, be strict." — Emil

## Further reading

- Emil Kowalski: `emilkowal.ski/ui` — the canonical recent essays (`agents-with-taste`, `train-your-judgement`, `developing-taste`, `you-dont-need-animations`, `7-practical-animation-tips`, `the-magic-of-clip-path`, `great-animations`, `good-vs-great-animations`, `css-transforms`).
- Rauno Freiberg: `rauno.me/craft` — the craft series (`interaction-design`, `novelty`, `depth`, `nextjs`).
- Jakub Krehel: `jakub.kr/work` — `using-ai-as-a-design-engineer`, `motion-gestures`.
- Anu Atluru on taste in an age of abundance.
