# How motion feels good

The feel of an animation is decided by small, specific choices: which object carries the change, whether identity continues, where motion originates, how supporting elements hand off, which curve settles it, and whether a reversal retargets. This reference is the craft layer — the part that makes motion look and feel native to a product once the decision to animate has been made. Load [`decision-system.md`](decision-system.md) for whether motion should exist at all and how often it is seen; the two are co-equal, and both must pass.

Values here are calibrated defaults, not law. Preview an unfamiliar curve or watch the interaction in slow motion before shipping it — a curve cannot be judged from its numbers.

## Infer the product's motion language

When the desired animation is not documented, do not fall back to generic taste or copy the most common transition in the repo. Find up to two or three nearby interactions that are intentionally tuned, rendered successfully, and similar in frequency or purpose. Treat them as exemplars; treat the rest as implementation evidence only. If no reliable exemplar exists, record that absence and use matching source material plus the calibrated defaults below.

Record this compact profile before designing:

| Dimension | What to infer |
| :--- | :--- |
| Job and frequency | Feedback, continuity, causality, progress, hierarchy, or character; repeated vs occasional vs rare |
| Identity and carrier | Which visible object remains the same, and which one element should explain the change |
| Response and energy | Instant vs staged response; quiet/crisp vs soft/elegant vs playful/physical |
| Geometry and origin | Direction, transform origin, distance, size/radius continuity, and whether movement returns to its source |
| Temporal hierarchy | Primary motion first; which content dissolves faster, which color/icon follows, and what must not animate |
| Interruption and exit | Retarget, reverse, retrace, dissolve, or finish; whether velocity matters |
| Reduced alternative | What state cue remains when spatial movement, blur, rotation, or bounce is removed |

Write the result as a one-sentence grammar, for example: “Immediate input response; one no-bounce continuity carrier; supporting content clears faster than the frame; exits return to their source; reduced motion hard-cuts geometry but preserves state.” A new interaction should fit that grammar, not copy another component's literal duration.

Use product precedent in this order:

1. the user's stated feel and intentionally tuned rendered exemplars;
2. project motion tokens, shared primitives, and nearby interactions with the same job/frequency;
3. source material or official examples that match the product;
4. the calibrated defaults in this reference.

Do not average together hover utilities, library defaults, registry code, and one-off experiments. Consistency with mediocre motion is not craft.

## Choose continuity, handoff, or an instant change

“Morph over fade” is a strong taste direction, not a universal implementation rule. First determine the relationship between the states:

| State relationship | First route | Examples | Guard |
| :--- | :--- | :--- | :--- |
| The same visible object changes geometry, position, shape, or role | Preserve identity and morph | Trigger → dialog, pill moving between tabs, field → editor, compatible icon reshape | One legible in-between; stable semantics; proportionate frequency |
| The frame persists but its content/state changes | Keep the frame stable or resize it; hand content off faster | Multi-step form, saving/done state, panel with changing copy | Content supports the frame; it does not become a second primary animation |
| A control reports a binary result with no useful in-between | Mounted swap or instant state | Copy → check, mute → unmute when paths are incompatible | Small opacity/scale/blur is enough; do not import a morph runtime for novelty |
| The states are unrelated, extremely frequent, or already clear | Instant change or microscopic feedback | Keyboard navigation, dense table actions | Continuity is not a requirement when it would add latency |

Then name the **primary motion carrier**. A shared surface can carry position and size while text dissolves; a selection pill can carry state while labels stay still; an orb-shaped reveal can carry causality while the icon fades and label color follows. When every child has equal animation weight, the change loses hierarchy.

## Easing is the main ingredient

Easing describes the rate a value changes over time. It is one of the highest-leverage ingredients in perceived speed and character. The same 300ms move can feel fast or sluggish depending only on the curve, but curve, distance, duration, and continuity still work as a system.

Pick the curve from what the element is doing:

| The element… | Curve | Why |
| :--- | :--- | :--- |
| enters, exits, or responds to input (dropdown, modal, toast, most UI) | **ease-out** | Fast start reads as instant response; settles gently, which is where the eye expects motion to end. The workhorse. |
| moves to a new position or **morphs** while staying on screen | **ease-in-out** | Accelerate then decelerate, like a car pulling away and arriving — natural for something that travels across the screen. |
| changes color, background, or opacity on hover | **ease** | An elegant, gentle asymmetric curve. CSS's default timing function. |
| runs at a constant rate: spinner, marquee, progress, time-linked, 3D spin | **linear** | Constant speed is correct only when the thing itself is constant. Anywhere else it reads robotic. |
| visibly accelerates away or follows a deliberate physical departure | **ease-in**, rarely | Usually avoid for ordinary UI response because the slow start feels sluggish. It can fit an accelerating exit when direction/consequence or the product's physical model calls for it. |

### Reuse the product's curve family before inventing one

Prefer an existing project curve that already produces the right response. Built-in `ease` is often appropriate for gentle hover/color work; built-in `ease-out` may be enough for a quiet component. When the product's tuned motion uses stronger acceleration, define or reuse custom curves as tokens rather than scattering cubic-bezier literals.

```css
@theme {
  /* enter, exit, and most UI response — starts fast, settles soft */
  --ease-out-strong: cubic-bezier(0.22, 1, 0.36, 1);
  /* elements that move or morph while staying on screen */
  --ease-in-out-strong: cubic-bezier(0.65, 0, 0.35, 1);
  /* drawers, sheets, iOS-style panels (the Vaul/iOS sheet curve) */
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);

  --duration-fast: 150ms;
  --duration-medium: 240ms;
}
```

Use `--ease-out-strong` as a calibrated fallback for enter/exit and response when the project has no established token. A very strong ease-out such as `cubic-bezier(0.19, 1, 0.22, 1)` suits rare expressive intros where the deceleration is the point. For a specific platform feel, a known curve may be appropriate, but preview it in the host UI before turning it into a global token.

### Write easing and properties explicitly

- **Write `ease` out** even though it is the CSS default. Many people assume the default is `linear`; naming it removes the doubt.
- **Avoid `transition: all`.** Name the properties: `transition: transform 150ms var(--ease-out-strong), opacity 150ms var(--ease-out-strong)`. `all` may animate a property you did not intend; if that changed property requires paint or layout, the transition inherits that work. Tailwind's bare `transition` is a curated set, not literal `all`, but it is still usually broader than the element needs — prefer `transition-transform`, `transition-opacity`, or `transition-[transform,opacity]`.
- **Do not fold `transition-delay` into the shorthand.** `transition: transform 0.2s ease 1s` hides the delay; a separate `transition-delay: 1s` reads at a glance.

### Springs, when physical

For gesture-driven motion, morphs, and anything that should carry velocity through an interruption, a spring often fits better than a fixed curve. In a quiet product, default to **no bounce** — crisp arrival, no end-of-move wobble that reads as jank:

```ts
// Motion — crisp morph/response, symmetric (interpolates both ways)
const SPRING = { type: "spring", bounce: 0, duration: 0.3 } as const;
```

Add overshoot only when physical momentum or the product's established character earns it. An intentionally bouncy disclosure or playful surface can use asymmetric spring profiles; an ordinary checkbox, toggle, or menu usually should not. Generate a CSS `linear()` approximation of a spring with tooling rather than hand-inventing a sample list.

## Morph where identity is continuous

When two states are perceived as the same object changing, prefer a morph over a hard cut or naked crossfade. A morph preserves identity and gives the eye a continuous model. It is not decoration: if no meaningful identity or intermediate shape exists, use the lighter handoff from the continuity table.

Three morphs cover most cases:

**Shared element (`layoutId`).** Give the same `layoutId` to a small element in state A and a larger one in state B; the runtime interpolates position and size between them. A trigger button becomes a dialog; a card becomes a detail view; a selection pill slides between tabs. Keep the id unique within its group.

**Size morph — animate the frame's *real* dimensions.** When a container changes size (a field expanding into an edit form, a panel resizing to fit new content), measure the target and animate `width`/`height` to the concrete value with a no-bounce spring when that scope performs well. Do not author `scale` merely to fake a resize — it distorts every child, and text goes blurry or stretched. Layout/FLIP systems may use transforms internally; the guard is against choosing visible scale distortion as the design.

```tsx
// Measure the laid-out size, then spring the box to it. Content lives in a
// separate measured child so there is no measure↔animate feedback loop.
const [ref, { width, height }] = useMeasure();

<MotionConfig transition={SPRING}>
  <m.div animate={width ? { width, height } : undefined} initial={false}>
    <div ref={ref}>{content}</div>
  </m.div>
</MotionConfig>
```

Pair the size spring with a **fast content dissolve** so the outgoing and incoming contents never double-expose. The content swap runs quicker than the box resizes — that timing offset is exactly what reads as a morph instead of a swap revealed by a clip wipe:

```tsx
const CONTENT = { ...SPRING, opacity: { duration: 0.12, ease: "easeOut" } };
const EXIT = { duration: 0.1, ease: "easeOut" };

<AnimatePresence initial={false} mode="popLayout">
  <m.div
    key={state}
    initial={{ opacity: 0, scale: 0.98 }}       // whisper of scale, for presence
    animate={{ opacity: 1, scale: 1, transition: CONTENT }}
    exit={{ opacity: 0, transition: EXIT }}      // quick opacity-only exit
  >
    {content}
  </m.div>
</AnimatePresence>
```

**Path morph (icons).** When the reshape itself is meaningful — edit → saving → done, play → pause, menu → close — interpolate the SVG `d` if the glyphs can share a clean topology. Build both states from the same point count on a shared grid so vertices map one-to-one, then spring the `d`. Collapse an unused stroke to a centre point and fade it. A technically interpolable path that produces a tangled in-between is not a successful morph.

```tsx
<m.path animate={{ d: paths[state], opacity: op[state] }} initial={false}
  transition={{ d: { type: "spring", stiffness: 300, damping: 26 }, opacity: { duration: 0.2 } }} />
```

For a simple binary icon with no meaningful in-between, two mounted icons on an opacity + small scale/blur handoff is lighter than a path morph. Reach for path morphing when the changing glyph is an identity carrier, not merely because both states are SVGs.

## Do not use fades as a substitute for continuity

A naked opacity crossfade often reads as generic when the user needs an object, origin, or state relationship to track. Opacity alone can still be correct for a quiet high-frequency handoff, reduced-motion alternative, backdrop, or subordinate content beneath a stronger continuity carrier.

- **Frames and containers:** if the frame persists, morph size, position, or radius and dissolve its changing content underneath. If the frame is genuinely appearing/disappearing, a small transform/origin cue can support opacity. Do not add blur merely to avoid a “fade” label.
- **Text:** ordinary product text should usually appear immediately or take a short, subtle handoff. Use blur + `translateY` + split/stagger for rare expressive headings or grouped storytelling where the product's motion language supports it—not for menus, forms, results, or every page title.

```css
@keyframes text-in {
  from { opacity: 0; transform: translateY(8px); filter: blur(8px); }
}
.text-in {
  animation: text-in 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  animation-delay: calc(var(--i, 0) * 80ms);   /* stagger words/lines */
}
```

- **Exits preserve the causal model.** A shared element may retrace to its source because the return explains continuity. Ephemeral content can dissolve without replaying its entrance choreography. A drawer or sheet should follow the product's spatial model rather than obeying a universal “never travel” rule. Keep exits shorter or quieter unless direction/consequence is the message.

The rule is not “opacity is banned.” The rule is “opacity does not explain identity.” Use it where disappearance is the message or as a supporting layer; do not let it erase a relationship the user would benefit from seeing.

## Exemplar anatomy

These combinations demonstrate how to infer tasteful motion beyond a single documented recipe:

| Interaction | Primary carrier | Supporting choreography | What makes it strong |
| :--- | :--- | :--- | :--- |
| Collapsed surface → dialog/card | One shared surface carrying position, size, and radius | Shared title/action details; quiet backdrop; content exits inside the returning shell | Motion preserves identity while native dialog semantics, focus, and Escape remain load-bearing constraints |
| Compact field → editor → saving → done | The real measured frame plus one state chip/icon | Content clears faster than the frame; busy geometry stays pinned so fields do not jump | Different timings have hierarchy; measurement reads a static target rather than feeding the animated size back into itself |
| Icon/orb → full-surface reveal | Reveal geometry growing from the activating icon | Icon hands off early; label color follows only when contrast requires it; close is quicker | Origin communicates causality, and secondary timing supports rather than competes |
| Copy → check confirmation | Stable button; small mounted glyph handoff | Opacity + modest scale/blur; polite status text | No useful path in-between is invented; the high-frequency control stays compact and accessible |

The lesson is not to reproduce these effects everywhere. It is to identify the carrier, preserve the semantic contract, stabilize geometry, and give supporting elements a clear temporal rank.

## The little big details

Small responses, applied consistently, are most of what separates UI that feels good from UI that feels dead. None of these should call attention to itself.

- **Press feedback.** When the project uses physical button response, a small `active:scale-[0.97]` or slight translation over ~150ms can work. Match the existing control primitive, keep it on `motion-safe`, and skip disabled or ultra-frequent controls that already respond clearly.
- **Interruptibility.** CSS transitions interpolate toward the *latest* target and can be interrupted mid-flight; keyframe animations run a fixed timeline and will not retarget once started. Use transitions for anything reversible or interactive (toggles, dropdowns, drags); reserve keyframes for one-shot staged sequences and loops. A dropdown that snaps instead of reversing when you change your mind feels broken — test every reversible interaction by changing direction before it finishes.
- **Contextual icon handoff.** When two icons have no meaningful path morph, a small `opacity` + `scale` + `blur` handoff often lands more softly than a hard toggle. Keep both icons mounted when the DOM/semantics allow:

```tsx
<span className="relative">
  <CopyIcon  className={cn("transition-[opacity,scale,filter] duration-150", copied ? "opacity-0 scale-95 blur-[2px]" : "opacity-100")} />
  <CheckIcon className={cn("absolute inset-0 transition-[opacity,scale,filter] duration-150", copied ? "opacity-100" : "opacity-0 scale-95 blur-[2px]")} />
</span>
```

- **Split and stagger enters.** For a rare grouped entrance (title, description, buttons), the product may animate chunks individually with an ~80–100ms delay rather than one block. Cap the cascade and keep every item interactive immediately. Do not stagger menus, tables, forms, or results the user is waiting on.
- **Hover only where hovering is real.** Gate hover effects to fine pointers so a tap on touch does not stick the hover state: `@media (hover: hover) and (pointer: fine)` (Tailwind v4 does this for `hover:` by default).
- **Tabular numbers.** Any number that updates or animates — a timer, a counter, a live figure — should use `font-variant-numeric: tabular-nums` (`tabular-nums` in Tailwind) so digits are equal width and the layout does not jitter as it changes.
- **`will-change`, sparingly.** It is a hint, not a speed switch: it lets the browser prepare for likely changes and may lead to layer promotion, but the result is implementation-dependent. Name the properties (`will-change: transform`), put it only on elements that actually animate, and remove it afterward where practical. Never `will-change: all` (ignored) and never on `*` (can waste resources across the page).
- **Crisp text under transforms.** `antialiased` (`-webkit-font-smoothing: antialiased`) on the app root keeps text from rendering heavy, which is most visible while an element is mid-transform on macOS.

Static-render issues can change how motion is perceived—for example, an off-center icon makes a correct morph look wrong. Report one only when it materially affects the scoped animation; do not turn a motion task into a general visual-polish pass unless the user asks.
