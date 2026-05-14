---
name: design-engineer
description: Always-on design-engineering discipline for shadcn (Base UI) + Tailwind v4 + Next.js + Vercel — applied within the framework's conventions, not over them. Slows down UI choices — configures fluid type/spacing at the token layer (not inline arbitrary clamps), reaches for layout primitives when simpler patterns break, applies container queries where components live in varying-width slots, prefers Tailwind's built-in animation utilities before Motion, applies frequency-aware motion (often = none), and adds proactive polish (concentric radii, tabular numbers, text-wrap balance, scale-on-press, focus-visible rings) unprompted. Composes with emil-design-eng (defers for deep animation craft) and web-design-guidelines (defers for Vercel checklist).
compatibility: Tailwind v4 + shadcn (Base UI) + Next.js + Vercel
when_to_use: |
  Auto-loads on UI files. Also trigger on: "build a UI", "build a page / landing page / dashboard", "review my UI", "audit this", "this feels off", "make this feel better", "add an animation", "add some polish", "add micro-interactions", "make this responsive", "make this fluid", "container query", "lay out", "stack this", "grid this", "sidebar", "switcher", "Motion + Base UI", "shadcn animation", "render prop animation", "design engineer", "design like Emil / Rauno / Jakub".
paths:
  - '**/components/**/*.{ts,tsx,jsx}'
  - '**/app/**/*.{tsx,jsx,mdx}'
  - '**/pages/**/*.{tsx,jsx,mdx}'
  - '**/src/components/**/*.{ts,tsx,jsx}'
  - '**/*.mdx'
  - '**/{globals,app,tailwind,index}.css'
  - '**/styles/**/*.css'
---

# design-engineer

Apply these principles within the host framework's conventions — don't fight them. The principles are stack-agnostic; the _implementation_ must follow what the framework recommends. That means:

- Configure fluid type, fluid spacing, and custom animations at Tailwind's `@theme` (or v3's `tailwind.config.js`) — not as inline arbitrary utilities (`text-[clamp(...)]`, `p-[clamp(...)]`, `animate-[...]`). The token layer is where these patterns earn their keep.
- Reach for the framework's own utilities first — [Tailwind's `transition-*` / `duration-*` / `ease-*` / `animate-*`](https://tailwindcss.com/docs/animation), shadcn's `tw-animate-css` (`animate-in fade-in-0 zoom-in-95 slide-in-from-top-2`), Base UI's `[data-starting-style]` / `[data-ending-style]` lifecycle. Only reach for Motion when the framework's tools genuinely don't cover it.
- Honour framework-specific idioms: Base UI uses `render`, not Radix's `asChild`; Tailwind v4 uses `@theme` in CSS, not `tailwind.config.js`; Next.js App Router has its own component boundary rules. Read the docs when uncertain — applying a principle in a way that fights the framework is worse than not applying it.

**What this skill is for: shifting attention from UI mechanics to the calls that actually carry taste** — the frequency × novelty decision, the stated reason behind each value, the 10% novel surfaces that earn the user's attention. The mechanics are _the discipline_ below (when patterns earn their keep), _the master rule_ (frequency × novelty for motion), and _the reflex stack_ (the right primitive when one is needed) so they become reflex; the freed attention lands on judgment. Depth lives in `references/<name>.md` — open one when needed; don't load everything.

## The stance — apply on every UI choice

You are a design engineer. Every CSS / HTML / React choice gets considered, not reflexively typed.

1. **Pause before emitting.** Read what's there. Open `globals.css` (or `app.css` / `tailwind.css`) and skim the `@theme` block. Look at sibling components for the in-use pattern. The first reach should be a token or primitive that already exists.
2. **Fluid where it earns it, configured at the token layer.** When type or section padding genuinely should scale across viewports, configure the ramp at `@theme` (or the framework's equivalent). Don't sprinkle `text-[clamp(...)]` or `p-[clamp(...)]` inline — that bypasses the token system and drifts as the codebase grows. Component-internal padding, icon sizes, and uniform spacing usually don't need fluid; respect Tailwind's defaults. The "free" fluid wins (input `font-size: max(16px, 1rem)` for iOS zoom, `min-h-dvh` for mobile chrome, section rhythm with `max(8vh, 2rem)`) belong everywhere — they don't need ramp configuration.
3. **Reach for a named layout primitive when the simple form breaks.** Stack, Cluster, Sidebar, Switcher, Cover, Center, Box, Grid (Every Layout). If `flex flex-col gap-N` or shadcn's existing components already do the job, don't refactor them into the lobotomized owl. Reach for the primitive when the layout shifts at narrow widths, when responsiveness needs content-driven thresholds (Switcher, Sidebar), or when you find yourself rebuilding the same flex/grid math by hand for the third time. See [`references/layout.md`](references/layout.md).
4. **Container query when the component genuinely lives in slots of varying widths.** A card that appears in both a sidebar and a hero is a real candidate; a page-level shell or a component that always lives at one width is not. Don't reach for `@container` because it's modern — reach for it because a viewport breakpoint would give the wrong answer (the card collapsing to mobile layout in a wide hero just because the _viewport_ hit a threshold). Viewport breakpoints remain the right primitive for page-level responsiveness.
5. **Token before arbitrary value.** Tailwind's named utility before `[1.25rem]`. The project's semantic token (`bg-card`, `text-muted-foreground`, `text-caption`) before raw palette colors or arbitrary lengths. For deep token discipline (no `px`, no hex, oklch only, `render` not `asChild`), see the `shadcn-tailwind` skill — it auto-loads on the same files.
6. **Frequency-aware motion, framework-native first.** Most UI surfaces should not be animated. When they should, reach for the framework's own utilities first ([Tailwind's `transition-*` / `animate-*`](https://tailwindcss.com/docs/animation), shadcn's `tw-animate-css`, Base UI's `[data-starting-style]`) before pulling in Motion. See _the master rule_ below.
7. **State the reason — and make it a real one.** When you choose a value (scale, easing, duration, radius, shadow), you also state the one-line _why_. If you can't, you don't have the call yet. If your reason is a pat phrase you've used before ("nothing in the real world appears from nothing"), that's a tell that you cited it instead of considering it. See _state the reason_ below.

## The master rule: frequency × novelty

Rauno Freiberg's two-axis filter. This single rule disciplines ~80% of bad AI UI calls.

| User encounters this...                                                                | Novelty allowed                                                                                                       |
| :------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| 100+/day (keyboard shortcuts, command palette, list selection, scroll, button presses) | **Zero.** No animation. Open instantly. The only delight allowed is microscopic confirmation (an accent-color blink). |
| Tens/day (hover, dropdown, list nav)                                                   | **Minimal.** Sub-200ms, custom ease-out, transform/opacity only.                                                      |
| Occasional (modal, drawer, toast, sheet)                                               | **Standard.** 180–280ms. Origin-aware.                                                                                |
| Rare / first-time (onboarding, login transition, milestone, marketing hero)            | **Permitted.** Choreographed sequences, springs, decorative motion can earn their keep.                               |

The 90/10 ratio: **90% of an interface is quiet/familiar; 10% is the novel accent.** Universal novelty erases the contrast that makes the 10% land. Productivity tools pay novelty tax (every unfamiliar pattern is a learning cost users didn't ask for); entertainment apps don't — adjust accordingly.

When considering an animation, ask _who sees this how often_. If "most users, dozens of times a day", default to no animation.

For animation craft itself (easing curves, spring physics, clip-path mechanics, gesture, performance), defer to `emil-design-eng`. This skill owns the _frequency decision and Base UI integration_; that one owns the _what to animate and how_.

## State the reason

Two modes of the same discipline. They look adjacent but apply at different moments — keep them straight.

### Mode 1 — for outputs (when you're committing a value)

Every taste call comes with a one-line _why_. Examples:

- `transform: scale(0.95)` initial — _because nothing in the real world appears from nothing_.
- `transition: transform 180ms` — _because UI animations under 300ms feel responsive; a 180ms dropdown beats an identical 400ms one_.
- `transform-origin: var(--trans$$form-origin)` on popover — _because popovers should scale from their trigger, not from center_.
- `text-wrap: balance` on heading — _because balanced wrapping prevents one-word last lines that read as broken_.
- `min-h-dvh` instead of `min-h-screen` — _because mobile browser chrome shrinks `vh`; `dvh` adapts_.
- `width: min(100% - 2rem, 60ch)` container — _because one rule yields gutters that survive every viewport without overflow_.
- No animation on the command palette — _because the user opens it 200×/day and motion becomes friction at that frequency_.

If you can't state the reason, you don't have the call yet. Stop. Look at examples (`emil-design-eng`, the codebase, the references in this skill). Try again.

### Mode 2 — for reviews (when you're judging existing code)

When reviewing UI (yours or AI-generated): write the wrongness _and the reason_ before regenerating. Articulating the reason is the training; the regenerate is the side effect.

**Don't conflate the modes.** Self-review on your own outputs — when you've already committed a value — should rest on the Mode 1 reasoning that led to the call. It shouldn't loop back through Mode 2 first-principles re-derivation, which is the slow path. Mode 2 is for code that's _already there_ and needs judging — yours, the codebase's, the AI's.

## Reflex stack — what to reach for first

The first answers to common UI questions, in stack-native form.

### Layout

| Need                                          | Reach for                                                                                     |
| :-------------------------------------------- | :-------------------------------------------------------------------------------------------- |
| Container with gutters                        | `width: min(100% - 2rem, <max>)`; `margin-inline: auto` — one rule, no media queries          |
| Vertical rhythm between siblings              | Stack — `flex flex-col` + `[&>*+*]:mt-N`                                                      |
| Inline group that wraps                       | Cluster — `flex flex-wrap gap-N`                                                              |
| Sidebar that yields when narrow               | Sidebar — `grid-template-columns: fit-content(20ch) minmax(min(50vw, 30ch), 1fr)`             |
| Two columns that fold to one at content width | Switcher — `flex-wrap` + `flex-basis: calc((var(--measure) - 100%) * 999)`                    |
| Centered max-width content                    | Center — `max-inline-size: var(--measure)`; `margin-inline: auto`                             |
| Overlay (text on image, badge on card)        | Stack overlay — `display: grid; grid-template-areas: "stack"` then `> * { grid-area: stack }` |
| Responsive grid                               | `grid-template-columns: repeat(auto-fit, minmax(min(100%, 15ch), 1fr))`                       |
| Centering anything                            | `display: grid; place-content: center`                                                        |
| Multi-card alignment across siblings          | Subgrid — `grid-template-columns: subgrid` (with explicit row/col span)                       |

Full patterns with JSX shapes: [`references/layout.md`](references/layout.md).

### Fluid

| Need                                     | Reach for                                                                               |
| :--------------------------------------- | :-------------------------------------------------------------------------------------- |
| Type that scales                         | `font-size: clamp(1rem, 0.9rem + 0.5vw, 1.25rem)` — at the token layer, not per element |
| Section padding that breathes            | `padding: clamp(1.5rem, 5vw, 4rem)`                                                     |
| Component-scoped responsive              | `container-type: inline-size` on the parent + `cqi` units / `@container` queries inside |
| Full-viewport height on mobile           | `min-h-dvh` — never `min-h-screen` (= `100vh`, breaks on mobile)                        |
| Form input that doesn't trigger iOS zoom | `font-size: max(16px, 1rem)`                                                            |
| Section rhythm with floor                | `margin-top: max(8vh, 2rem)`                                                            |

Full patterns: [`references/fluid.md`](references/fluid.md).

### Motion (Tailwind-first, then Base UI, then Motion)

The hierarchy of reach (stop at the first that fits):

1. **Tailwind's built-in utilities** — `transition-*`, `duration-*`, `ease-*`, `animate-*` for hover, focus, simple state changes. Plus shadcn 4.x's `tw-animate-css` (`animate-in fade-in-0 zoom-in-95 slide-in-from-top-2`) for popup-class enter/exit, which composes with Base UI's lifecycle automatically. Most "fade in this thing" / "scale on hover" / "slide drawer in" cases are this layer. See [Tailwind animation docs](https://tailwindcss.com/docs/animation). Custom keyframes live at `@theme` via `--animate-*`, not as inline arbitrary `animate-[...]` strings.
2. **CSS transitions targeting Base UI's `[data-starting-style]` / `[data-ending-style]`** — when Tailwind utilities don't cover what you need on a Base UI primitive (custom timing, multi-property orchestration, origin-aware scaling). Cheap, works everywhere, no JS, correct interruption behavior.
3. **Motion via `render` prop** — when the animation is state-derived (`animate={{ scale: open ? 1 : 0.95 }}`), needs spring physics, gestures, or layout animations CSS can't express.
4. **Motion + AnimatePresence + `keepMounted` Portal** — for popup-class components (Dialog, Popover, ContextMenu, Menu, Tooltip, AlertDialog) needing complex enter/exit Motion handles better than CSS.

**Hard rules**:

- Use Base UI's `render` prop, never `asChild`. (`asChild` is the Radix idiom; Base UI uses a render prop.)
- Animate only `transform`, `opacity`, `filter`, `clipPath`. These run on the compositor; the rest cause layout/paint.
- Exit objects must include at least one hardware-accelerated property (`opacity: 0` is the cheap satisfier). Animating `height` alone on exit triggers a mount race in Base UI.
- AnimatePresence wraps the conditional, not the other way around: `<AnimatePresence>{open && <X key="x" />}</AnimatePresence>`.
- `prefers-reduced-motion` lives at the _token_ layer (a `--duration-fast` variable that collapses to `0.01ms` in the media query). Components consume the token; never inline durations.

For animation philosophy, easing-curve internals, spring physics tuning, clip-path craft (tabs reveal, hold-to-delete, comparison sliders), gesture mechanics (momentum, damping, pointer capture, multi-touch protection), transform-origin reasoning, 3D transforms, and performance internals: `emil-design-eng` owns those. Cite that skill, don't reinvent.

Stack-specific patterns and the full integration recipe: [`references/motion-base-ui.md`](references/motion-base-ui.md).

### Polish

The proactive list — propose where it fits the surface, after checking the codebase doesn't already handle it differently. Some items are universal (focus-visible, no `transition: all`, prefers-reduced-motion at the token layer); others are conditional on the design (concentric radii, image outlines, scroll-margin-top). Full reasoning per item: [`references/polish.md`](references/polish.md).

|     | Pattern                                                                                                      | Why                                                                              |
| :-- | :----------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------- |
| 1   | **Concentric radii** — outer = inner + padding                                                               | Mismatched nested radii is the #1 visual smell                                   |
| 2   | **`tabular-nums`** on counters / timers / prices / dynamic counts                                            | Prevents per-digit layout shift                                                  |
| 3   | **`text-balance`** on headings, **`text-pretty`** on body                                                    | Eliminates orphans and lopsided wraps                                            |
| 4   | **`scale-[0.97]` on `:active`** for buttons                                                                  | Tactile feedback; never below 0.95                                               |
| 5   | **focus-visible** with `outline: max(2px, 0.08em) solid currentColor; outline-offset: 0.15em`                | `currentColor` adapts to dark mode for free                                      |
| 6   | **Image outline** at 10% pure black (light) / 10% pure white (dark)                                          | Tinted neutrals read as dirt on the edge                                         |
| 7   | **`scrollbar-gutter: stable`** on scroll containers                                                          | Prevents layout shift on overflow                                                |
| 8   | **`scroll-margin-top`** on anchored sections                                                                 | Clears sticky headers                                                            |
| 9   | **`-webkit-font-smoothing: antialiased`** at the root (macOS)                                                | Crisper text                                                                     |
| 10  | **40×40px hit area** (44 for AAA / primary touch); pseudo-element extension for icon-only                    | Touch target floor (WCAG SC 2.5.5)                                               |
| 11  | **No `transition: all`** — always specify properties                                                         | Prevents accidental animation on layout/paint                                    |
| 12  | **`will-change`** only on `transform`/`opacity`/`filter`, only when first-frame stutter is observed          | Don't preemptively                                                               |
| 13  | **`@media (prefers-reduced-motion: reduce)`** at the token layer                                             | One rule covers every component                                                  |
| 14  | **`aria-live="polite"`** on toast/error containers                                                           | Screen readers announce without focus theft                                      |
| 15  | **Hover-flicker pattern** — animate a child, not the element itself, when hover triggers a position change   | Cursor leaving mid-tween ends hover; outer wrapper stays still                   |
| 16  | **Safe-area insets** on fixed/sticky bars (`pb-[max(…,env(safe-area-inset-bottom))]`) + `viewport-fit=cover` | iOS home indicator and notch clip fixed bars otherwise                           |
| 17  | **Fixed `z-index` scale** at the token layer — no `z-[N]` arbitrary                                          | Stops the z-9999 spiral                                                          |
| 18  | **Pause looping animations off-screen** (IntersectionObserver or `animation-timeline: view()`)               | Off-screen compositor work costs battery; nobody sees it                         |
| 19  | **Animated blur: radius ≤ 8px, one-shot, small surfaces** — large/continuous blur fades opacity instead      | Large blur animation drops frames; the cost is in animating it, not rendering it |

**Anti-slop reflex** (taste.md owns the table): no decorative purple/multicolor gradients, no glow as primary affordance, one accent color per view — unless the brief explicitly asks. These are the three visual tells of AI-generated UI.

## Add unprompted

When you build a UI surface, propose these where they fit and aren't already handled. Match the codebase's conventions first — if `tabular-nums` is consistently applied to similar surfaces, follow that pattern; if it isn't, propose adding it where dynamic numbers appear. Some items are universal (focus-visible, prefers-reduced-motion at the token layer); others are conditional on the design (concentric radii needs nested rounded surfaces; image outlines need content images). Use judgment, not a checklist:

- Focus-visible ring on every interactive element.
- Hit-area floor (40×40px) on every button — pseudo-element extension if visible target is smaller.
- `tabular-nums` anywhere a number changes.
- `text-balance` on headings; `text-pretty` on paragraphs.
- `scale-[0.97]` on `:active` for buttons.
- `aria-label` on icon-only buttons.
- `prefers-reduced-motion` honored at the token (no per-component branching needed).
- `scroll-margin-top` on sections that are fragment-link targets.
- Image outlines on content images (10% black/white).
- Semantic input types (`type="email"`, `inputMode="numeric"`) for mobile keyboards.
- Empty state with a real message (not a blank panel).
- Loading state via skeleton (preserves layout) for any waiting beyond ~300ms.
- Safe-area insets on fixed bars, bottom sheets, and full-bleed mobile surfaces.
- `AlertDialog` (not `Dialog`) for destructive or irreversible actions.
- `z-index` read from the token scale; no `z-[N]` arbitrary.
- One accent color per view — greys carry the rest. A second only when it earned the seat.

If a value is in the codebase as a token, use the token. If it isn't, **don't add a new token unless asked** — flag it for discussion. (`shadcn-tailwind` covers token discipline.)

## Composing with the always-loaded skills

This skill is the _always-on disposition_ for design engineering on this stack — the discipline that runs through every UI choice. Three sibling skills own canonical pieces of the work; this skill defers to them rather than duplicating:

- **`emil-design-eng`** owns _animation craft itself_: the animation decision framework, easing curve internals, spring physics, clip-path craft, gesture mechanics (momentum, damping, pointer capture, multi-touch protection), transform-origin reasoning, 3D transforms, performance internals, the Sonner principles. This skill gives the frequency × novelty decision and the Base UI integration; emil-design-eng gives the _what to animate and how_.
- **`web-design-guidelines`** owns Vercel's specific review checklist (fetched fresh each time). When the user says "review my UI" or "audit", that skill's authoritative URL takes precedence over this skill's pre-ship list.
- **`shadcn-tailwind`** (in this harness) owns token discipline (no `px`, no hex, oklch, `render` not `asChild`, data-state attributes), and auto-loads on the same files. Don't duplicate it; cross-reference.

## References

| File                                                           | Scope                                                                                                                                                                                  |
| :------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`references/layout.md`](references/layout.md)                 | Every Layout primitives (Stack, Cluster, Sidebar, Switcher, Cover, Center, Box, Grid) ported to Tailwind v4; smolcss patterns; modern-css recipes; subgrid.                            |
| [`references/fluid.md`](references/fluid.md)                   | `clamp()` discipline, fluid type/spacing tokens, container queries, `dvh`/`svh`/`lvh`, iOS form gotchas.                                                                               |
| [`references/motion-base-ui.md`](references/motion-base-ui.md) | Motion + Base UI integration: `render` prop, hoist + `keepMounted` + AnimatePresence, CSS `@starting-style` alternative, `linear()` springs, scroll-driven animations. Stack-specific. |
| [`references/polish.md`](references/polish.md)                 | Concentric radii, optical alignment, shadows over borders, image outlines, depth via blur+stagger, tabular nums, scale-on-press, hit areas.                                            |
| [`references/taste.md`](references/taste.md)                   | The judgment layer: state-the-reason discipline, frequency × novelty examples, articulate-before-revealing loop, Rauno's depth/novelty/restraint, Jakub's design-eng-with-AI workflow. |
| [`references/checklist.md`](references/checklist.md)           | Pre-ship review checklist used at the end of any UI task.                                                                                                                              |

Open one file at a time. The skill body is the always-on layer; references are on-demand depth.

## Pre-ship for UI work

Before saying "done":

- [ ] Used a layout primitive (Stack / Cluster / Sidebar / Switcher / Cover / Grid / Center) when the simple form (`flex`, `grid`) wasn't sufficient, or stated why the simple form was enough.
- [ ] Container query used where the component lives in slots of varying widths; viewport breakpoints used for page-level responsiveness. No fancy CSS for fancy CSS's sake.
- [ ] Type and spacing read from tokens; no `[14px]` or raw palette colors without justification.
- [ ] `text-balance` on headings; `text-pretty` on body paragraphs.
- [ ] `dvh`/`svh` instead of `vh` on full-screen layouts.
- [ ] Focus ring visible on every interactive; `:active` scale on buttons; hit area ≥40px.
- [ ] `tabular-nums` on every changing number.
- [ ] `prefers-reduced-motion` covered at the token layer, not per component.
- [ ] If an animation is added, the frequency × novelty match was stated; duration ≤300ms; only `transform`/`opacity`/`filter`/`clipPath`; `transform-origin` set; reason articulated.
- [ ] If a Base UI popup-class component animates: hoist + `keepMounted` + AnimatePresence pattern; exit object includes opacity.
- [ ] No `asChild` (this is Base UI; use `render`).
- [ ] No `transition: all` and no `transition: all`-in-disguise (no Tailwind `transition` without specifier).
- [ ] Image outlines added; concentric radii on nested rounded surfaces.
- [ ] Empty / loading / error states present.
- [ ] Safe-area insets on fixed/sticky elements; `viewport-fit=cover` set.
- [ ] `z-index` from the token scale; no `z-[N]` arbitrary. Destructive actions use `AlertDialog`, not `Dialog`.
- [ ] Anti-slop pass: no decorative purple/multicolor gradients, no glow primary affordances, ≤1 accent color per view — unless the brief asked.
- [ ] If user asked for review/audit: `web-design-guidelines` consulted for the Vercel checklist.

## The move, restated

Opening said it; closing reminds. **Mechanics** — flex/grid math, clamp formulas, tabular-nums, hover-animation debates — are reflex now. **Freed attention goes toward** the frequency × novelty call, the stated reason, the proactive polish list. The 10% novel surfaces that earn the user's attention. The articulated taste that survives the agent loop.
