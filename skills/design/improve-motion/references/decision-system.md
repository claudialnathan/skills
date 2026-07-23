# Motion decision system

Use this reference to audit, prioritize, remove, refactor, or tune motion. Start from product behavior and rendered evidence; code patterns are leads, not automatic findings.

## Evidence order

1. User intent and interaction frequency.
2. Rendered behavior at normal speed, slow speed, and rapid reversal.
3. Accessibility and input behavior.
4. Runtime performance evidence.
5. Source structure, dependency cost, and line count.
6. General animation heuristics.

Do not override an interaction that already feels right merely because a generic rule suggests a different duration or scale.

## Audit categories

### Purpose and frequency

Every animation needs at least one job:

- confirm input;
- show state/progress;
- preserve spatial continuity;
- explain causality or hierarchy;
- prevent a discontinuous layout/content change;
- provide rare, proportionate character.

Frequency changes the treatment:

| Exposure | Default |
| :--- | :--- |
| Keyboard-first or 100+/day | Instant state change or microscopic feedback; no open/close choreography. |
| Tens/day | Brief transition, usually under 200ms; remove repeated flourish. |
| Occasional | Standard enter/exit or spatial continuity. |
| Rare/first-time | Choreography may be justified if it does not delay action. |

Reject motion that delays access to controls, replays on every navigation, makes functional data harder to read, or exists only because implementation became easy.

### Response and continuity

- Show press/selection acknowledgment on input, not after the action finishes.
- Keep drag content attached 1:1 to the pointer; preserve the grab offset.
- Enter and exit along paths that preserve the same spatial model.
- Anchor popovers, menus, and tooltips to their trigger-derived transform origin. Centered dialogs are a valid exception.
- Avoid `scale(0)`. For ordinary UI entrances, start close to full size (`0.94–0.98`) with opacity. Use no scale when a fade or directional movement communicates the change better.
- Keep exits shorter or quieter than entrances unless the exit itself communicates direction or consequence.

### Interruptibility

Test every reversible interaction by changing direction before it finishes.

- Use CSS transitions for state changes already represented by a class, attribute, pseudo-class, or custom property. They retarget from the current computed state.
- Use springs for physical or gesture-driven motion that must retain velocity.
- Use keyframes for autonomous loops and staged sequences that should run on a timeline; do not use them for rapidly toggled controls.
- Do not disable input while a decorative transition completes.
- For view transitions, explicitly handle or accept interruption behavior before using them for high-frequency navigation.

### Easing and duration

Treat these as starting ranges, then feel-check in context:

| Interaction | Starting range |
| :--- | :--- |
| Press/check/toggle feedback | 80–160ms |
| Tooltip/small popover | 120–180ms |
| Menu/select | 140–220ms |
| Dialog/toast | 160–280ms |
| Drawer/sheet | 220–400ms |
| Marketing/explanation | May be longer; never blocks interaction. |

Use:

- strong ease-out for an element responding or entering;
- ease-in-out for an object moving between visible positions;
- standard ease for small color/hover changes;
- linear only for constant rates such as progress, rotation, or time-linked motion;
- a critically damped spring for physical movement without playfulness.

Avoid dogma. A deliberately elegant component may use a softer curve; a high-frequency tool may be instant. Never tune an unfamiliar curve from its numbers alone—preview it or inspect it in slow motion.

Recommended token shape for Tailwind v4:

```css
@theme {
  --ease-out-strong: cubic-bezier(0.2, 0, 0, 1);
  --ease-in-out-strong: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);

  --duration-instant: 100ms;
  --duration-fast: 160ms;
  --duration-medium: 240ms;
}
```

Prefer existing project tokens. Generate a CSS `linear()` spring through the Motion AI Kit when available instead of pasting a hand-invented sample list.

### Performance

Classify by the browser work an animation causes:

| Cost | Examples | Response |
| :--- | :--- | :--- |
| Composite | `transform`, `opacity` through CSS/WAAPI | Preferred for large or concurrent movement. |
| Paint | color, shadow, border radius, many filters/masks | Usually fine on small controls; profile large surfaces. |
| Layout | width, height, margin, padding, top/left in flow | Contain, replace with transform/FLIP, or verify the small scope. |
| Thrash | alternating DOM reads and writes each frame | Refactor immediately; batch reads/writes. |

Important corrections:

- CSS is not automatically faster than Motion. CSS and WAAPI can execute off the main thread for supported properties; Motion also uses WAAPI where possible.
- Motion’s independent transforms can require main-thread/CSS-variable work. Prefer a complete `transform` value when hardware acceleration is important and transforms do not need separate composition.
- `clip-path` and `filter` are not universally free. Layer size and browser behavior matter.
- Animating a small, contained height is not automatically a defect. Avoid it when it moves a large document or runs concurrently; verify rather than asserting.
- `@property` improves typing/interpolation and can limit inheritance recalculation, but animating a registered gradient variable can still paint every frame.
- `will-change` is a last-mile response to observed first-frame stutter. Apply shortly before motion and remove afterward where practical. Persistent promotion consumes GPU memory.

Use MotionScore or browser Performance/Animations tooling when jank is in scope. Measure the real page while React/data work is happening.

### Accessibility

Reduced motion is an alternative, not a blanket deletion:

- remove parallax, large spatial movement, spinning, zooming, and elastic overshoot;
- preserve a short opacity/color transition when it communicates state;
- keep essential progress and system status perceivable;
- allow users to pause autonomous motion;
- avoid rapid flashes and long, unavoidable loops;
- gate hover-only motion to hover-capable fine pointers;
- ensure custom controls keep semantic inputs, focus visibility, and adequate hit areas.

Tailwind:

```tsx
<button className="transition-transform duration-150 motion-safe:active:scale-[0.97]">
  Save
</button>
```

Motion:

```tsx
<MotionConfig reducedMotion="user">{children}</MotionConfig>
```

For a component whose opacity remains useful under reduced motion, branch the transform rather than collapsing every duration globally.

## Remediation order

Prefer the first sufficient intervention:

1. **Leave it** — proportionate, coherent, performant, accessible.
2. **Remove it** — purposeless or too frequent.
3. **Reduce it** — smaller distance/scale, fewer properties, shorter duration.
4. **Correct it** — origin, direction, easing, exit asymmetry, first-render behavior.
5. **Make it interruptible** — keyframe to transition or duration tween to spring.
6. **Move work** — layout/paint to transform/opacity, rAF to WAAPI/CSS, or hand measurement to supported native CSS.
7. **Consolidate it** — shared tokens/config/variants.
8. **Add it** — only for a verified seam lacking feedback or continuity.

## Refactoring scorecard

For a simplification, compare:

| Measure | Before | After |
| :--- | :--- | :--- |
| Runtime dependencies | | |
| Motion-specific imports | | |
| State/effect/measurement hooks | | |
| Animated wrappers | | |
| Variants/keyframes/token literals | | |
| Relevant motion lines | | |

Count only the scoped interaction. A higher line count can still be the right result if it restores semantics, reduced motion, or a browser fallback; explain the trade.

Common simplifications:

- two mounted icons + CSS transition instead of `AnimatePresence` for a simple icon swap;
- lifecycle data attributes + CSS instead of hoisted state for a standard popup;
- an existing project animation utility/plugin instead of a duplicate keyframe or new runtime;
- a shared `MotionConfig` instead of repeated transition objects;
- `layout`/`layoutId` instead of manual measurements for React layout continuity;
- intrinsic-size CSS instead of `ResizeObserver` only when the browser floor permits;
- one component-owned keyframe/token instead of repeated inline animation strings;
- no motion at all instead of a library import used once.

## Audit severity

- **High** — motion blocks/repeats on a primary path, breaks input/focus, causes sickness, visibly snaps, or produces confirmed jank.
- **Medium** — wrong origin/direction, non-interruptible control, missing reduced alternative, duplicated machinery, or avoidable layout work.
- **Low** — token consolidation, small timing mismatch, subtle micro-feedback, or uncommon polish.

Prioritize impact divided by implementation and regression risk. Do not pad the low tier when the interface is already quiet.
