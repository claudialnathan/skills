# Restrained motion patterns

Adapt structure, tokens, and component APIs to the host project. These are decision examples, not a requirement to animate every matching component.

## Use this reference

Start from the interaction, not a favorite animation:

1. Confirm that motion has a job and is proportionate to frequency.
2. Decide whether the states share identity, need a content handoff, or should change instantly. Load [`craft.md`](craft.md) when that is unclear.
3. Find the need in the table and follow the stable first route.
4. Preserve the host primitive's semantics, focus, state, and lifecycle. Stop when an existing project pattern already fits.

| Need / pressure point | Identity call | Stable first route | Section |
| :--- | :--- | :--- | :--- |
| High-frequency or keyboard-first action | Usually no continuity choreography | Instant state or microscopic existing feedback | [`decision-system.md`](decision-system.md#purpose-and-frequency) |
| Press/tap needs acknowledgment | Same control responds | Existing button response or short CSS transform | [Press feedback](#press-feedback) |
| Checkbox checkmark should visibly draw | Same mark completes | CSS stroke dash; free Motion path length only when the spring/draw matters | [Animated checkbox](#animated-checkbox) |
| Switch/toggle changes state | Same thumb moves in one track | CSS transform + color transition | [Switch/toggle](#switchtoggle) |
| Two icons have no useful in-between | State handoff, not morph | Keep both mounted; small opacity/scale/blur swap | [Contextual icon swap](#contextual-icon-swap) |
| Compatible glyph should visibly reshape | Same glyph identity | Motion SVG `d` interpolation with matched topology | [Icon path morph](#icon-path-morph) |
| Element moves/resizes across states | Same object persists | Motion layout/shared element | [Shared element](#shared-element) |
| Container resizes around changing content | Frame persists; content hands off | Real measured dimensions + faster content dissolve | [Size morph](#size-morph--a-container-resizing-to-fit-new-content) |
| Anchored popup/menu/tooltip opens | New surface with causal origin | Primitive lifecycle data + CSS starting/ending styles | [Base UI popup](#base-ui-anchored-popup-with-css) |
| Accordion/disclosure expands | Same panel reveals content | Accessible primitive + CSS intrinsic/grid height; measured spring only when character earns it | [Accordion/disclosure](#accordiondisclosure) |
| Keyed content must finish exiting | Content handoff inside a stable owner | Mounted CSS states or Motion presence when unmount timing matters | [Enter/exit content swap](#enterexit-content-swap) |
| Selection indicator moves | Same indicator persists | CSS transform for equal slots; Motion `layoutId` for content-derived geometry | [Selection indicator](#selection-indicator) |
| Hover highlight moves across items in a run | Same highlight travels | One highlight element that relocates; frame-accurate hit testing only when the run moves under the pointer | [Traveling hover highlight](#traveling-hover-highlight) |
| Toast enters, stacks, and dismisses | Toast persists while stack retargets | Proven toast primitive or interruptible transitions | [Toast](#toast) |
| Rare grouped entrance needs hierarchy | Distinct items, one sequence | Short capped stagger | [Stagger](#stagger) |
| Decorative content responds to scroll | No task-critical identity | Guarded native timeline over fully visible fallback | [Scroll reveal](#scroll-reveal) |
| Progress/indeterminate loading | State/progress carrier persists | Determinate progress; linear spinner only when indeterminate | [Loading and progress](#loading-and-progress) |
| Drag/swipe, layout projection, shared presence, or advanced runtime orchestration | Physical/continuous identity | Free Motion after verifying current API | [`motion-runtime.md`](motion-runtime.md) |
| Cross-page/route continuity | Page/element identity may cross navigation | Native/React View Transition only when navigation and interruption fit | [`view-transitions.md`](view-transitions.md) |

## Press feedback

Use on primary pressable surfaces that otherwise feel inert. Skip tiny toolbar controls, high-frequency list rows, destructive holds with their own feedback, and components already providing a pressed response.

```tsx
<button
  className="
    transition-transform duration-150 ease-(--ease-out-strong)
    motion-safe:active:not-disabled:scale-[0.97]
  "
  type="button"
>
  Save
</button>
```

Keep native `<button>` semantics and disabled behavior. Test Space and Enter as well as pointer input.

## Animated checkbox

Keep the native/Base UI checkbox as the source of semantics and state; animate only the checkmark, and never mount/unmount the input. Here the checkmark *draws* — one of the few checkbox cases where Motion earns its place over a CSS fade, because animating an SVG `pathLength` with a spring is cleaner than the `stroke-dashoffset` equivalent. This needs only free Motion (`motion/react`), not Motion+.

```tsx
"use client";

import { Checkbox } from "@base-ui-components/react/checkbox";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

function AnimatedCheckbox() {
  const [checked, setChecked] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <Checkbox.Root
      checked={checked}
      onCheckedChange={setChecked}
      className="size-8 rounded-md border border-input bg-background p-1 focus-visible:border-ring focus-visible:outline-none"
      render={
        <motion.button
          type="button"
          whileHover={reduceMotion ? undefined : { scale: 1.05 }}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
        >
          <svg className="stroke-primary" viewBox="0 0 24 24" fill="none">
            <motion.path
              d="M4 12L10 18L20 6"
              strokeWidth={3}
              animate={{ pathLength: checked ? 1 : 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: "spring", bounce: 0, duration: checked ? 0.3 : 0.1 }
              }
              strokeLinecap={checked ? "round" : "butt"}
            />
          </svg>
        </motion.button>
      }
    />
  );
}
```

Craft details worth keeping: asymmetric duration (≈300ms to draw, ≈100ms to erase — the exit is quieter), `bounce: 0` (a checkbox is not playful), and a `"butt"` cap while unchecked so no rounded dot lingers at `pathLength: 0`. Set stroke color through CSS (`stroke-primary` / `style`), not the SVG `stroke` attribute, which does not resolve `var()`. Under reduced motion the check still appears and hover/tap scale is dropped; only the draw is removed.

CSS-only equivalent (no runtime): give the path a `stroke-dasharray` equal to its length, transition `stroke-dashoffset` from that length to `0` on `[data-checked]`. Prefer it when the checkbox is the only thing pulling in Motion; prefer the version above when the draw's spring feel matters or Motion already ships in the project.

## Switch/toggle

Use one short transform transition for the thumb and a color transition for the track. No bounce by default.

```tsx
<button
  aria-checked={enabled}
  className="
    group relative h-6 w-10 rounded-full bg-muted
    transition-colors duration-150
    aria-checked:bg-primary
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring
  "
  onClick={() => setEnabled((value) => !value)}
  role="switch"
  type="button"
>
  <span
    aria-hidden="true"
    className="
      absolute left-0.5 top-0.5 size-5 rounded-full bg-background shadow-sm
      transition-transform duration-150 ease-(--ease-out-strong)
      group-aria-checked:translate-x-4
      motion-reduce:transition-none
    "
  />
  <span className="sr-only">Enable notifications</span>
</button>
```

Prefer the project’s existing Switch primitive. Preserve form submission semantics when a native checkbox is required.

## Contextual icon swap

For a simple binary state, keep both icons mounted and crossfade them. This is often smaller than `AnimatePresence`.

```tsx
<button aria-label={copied ? "Copied" : "Copy"} className="relative size-10" type="button">
  <CopyIcon
    aria-hidden="true"
    className={cn(
      "absolute inset-1/2 size-4 -translate-1/2 transition-opacity duration-150 motion-safe:transition-[opacity,scale]",
      copied ? "opacity-0 motion-safe:scale-95" : "opacity-100 motion-safe:scale-100",
    )}
  />
  <CheckIcon
    aria-hidden="true"
    className={cn(
      "absolute inset-1/2 size-4 -translate-1/2 transition-opacity duration-150 motion-safe:transition-[opacity,scale]",
      copied ? "opacity-100 motion-safe:scale-100" : "opacity-0 motion-safe:scale-95",
    )}
  />
</button>
```

Keep the scale change close to `1`; a frequent copy control does not need a dramatic `0.25 → 1` pop. Use Motion when the icon morph is genuinely stateful/interruptible, several states coordinate, or an official installed example reduces the implementation.

## Morphing

Prefer morphing between states over a hard swap or a naked crossfade whenever the two states are the same object changing (see [craft.md](craft.md)). Three recipes cover most UI.

### Size morph — a container resizing to fit new content

Animate the frame's real `width`/`height` to a measured target with a no-bounce spring; never `scale` the frame (it distorts text and children). Keep the `ref` on an inner wrapper — never on the animated box itself, which would feed the box's own animated size back into the measurement — and dissolve the content faster than the box resizes so the states never double-expose:

```tsx
const SPRING = { type: "spring", bounce: 0, duration: 0.3 } as const;
const CONTENT = { ...SPRING, opacity: { duration: 0.12, ease: "easeOut" } } as const;
const EXIT = { duration: 0.1, ease: "easeOut" } as const;

function MorphBox({ state, children }: { state: string; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const [ref, size] = useMeasure(); // e.g. react-use-measure → [ref, { width, height }]

  return (
    <MotionConfig transition={reduce ? { duration: 0 } : SPRING}>
      <m.div
        animate={size.width ? { width: size.width, height: size.height } : undefined}
        initial={false}
        className="overflow-hidden"
      >
        <div ref={ref}>
          <AnimatePresence initial={false} mode="popLayout">
            <m.div
              key={state}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1, transition: reduce ? { duration: 0 } : CONTENT }}
              exit={{ opacity: 0, transition: reduce ? { duration: 0 } : EXIT }}
            >
              {children}
            </m.div>
          </AnimatePresence>
        </div>
      </m.div>
    </MotionConfig>
  );
}
```

`popLayout` pops the exiting content out of flow so the wrapper measures the incoming state cleanly. The whisper of `scale: 0.98` on the content is for presence only — the frame's size is carried by the box, not by scaling.

### Icon path morph

When the reshape itself is the point (not a binary swap), interpolate the SVG `d`. Build both glyphs from the same point count on a shared grid so vertices map one-to-one, spring the `d`, and fade an unused stroke by collapsing it to a centre point:

```tsx
<m.path
  animate={{ d: ICONS[icon].d, opacity: ICONS[icon].visible ? 1 : 0 }}
  initial={false}
  transition={{
    d: reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 26 },
    opacity: { duration: reduce ? 0 : 0.2 },
  }}
  stroke="currentColor"
  strokeWidth={2}
  strokeLinecap="round"
  strokeLinejoin="round"
  fill="none"
/>
```

### Shared element

To morph one element into another across states — a trigger button into a dialog, a card into a detail view, a pill between tabs — give both the same `layoutId`; the runtime interpolates position and size. Keep the id unique within its group, and keep `layoutId` elements outside `AnimatePresence` when you do not want `initial`/`exit` to fire during the layout transition. See [Selection indicator](#selection-indicator) for the tab/segmented case.

## Base UI anchored popup with CSS

Use the primitive’s state and transform-origin variables:

```tsx
<Popover.Popup
  className="
    origin-(--transform-origin)
    transition-[opacity,scale] duration-160 ease-(--ease-out-strong)
    data-starting-style:scale-[0.96] data-starting-style:opacity-0
    data-ending-style:scale-[0.98] data-ending-style:opacity-0
    data-instant:transition-none
    motion-reduce:data-starting-style:scale-100
    motion-reduce:data-ending-style:scale-100
  "
>
  {children}
</Popover.Popup>
```

Exit is slightly quieter than entry. Honor `data-instant` for repeated tooltips or repositioning. Use a centered origin for a viewport-centered dialog, not a trigger-derived origin.

## Accordion/disclosure

Use an accessible Accordion/Disclosure primitive for semantics and state. Use CSS for visual expansion.

Cross-browser grid fallback:

```css
.accordion-panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 220ms var(--ease-out-strong);
}

[data-open] .accordion-panel {
  grid-template-rows: 1fr;
}

.accordion-panel > div {
  min-block-size: 0;
  overflow: hidden;
}

@supports (interpolate-size: allow-keywords) {
  .accordion-panel {
    display: block;
    block-size: 0;
    overflow: clip;
    interpolate-size: allow-keywords;
    transition: block-size 220ms var(--ease-out-strong);
  }

  [data-open] .accordion-panel {
    block-size: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .accordion-panel {
    transition-duration: 0ms;
  }
}
```

When the product browser floor supports intrinsic-size interpolation, place its `@supports` branch before the final reduced-motion override as shown so the `transition` shorthand cannot re-enable motion.

Do not add a measurement hook only to animate height until both native CSS and an existing layout-animation facility have been considered. Keep measurement when content changes during the transition, browser support is insufficient, or the exact behavior needs it.

An intentionally expressive disclosure can be a valid exception: measure the content's real height, use a spring with asymmetric open/close profiles, and give the chevron its own subordinate spring. Do this only when a tuned product exemplar establishes bounce as character; reduced motion should hard-cut the height and rotation. An ordinary app accordion should keep the quieter CSS route above.

## Enter/exit content swap

Use a plain CSS crossfade when both states can remain mounted:

```css
.state {
  grid-area: 1 / 1;
  transition:
    opacity 140ms var(--ease-out-strong),
    transform 140ms var(--ease-out-strong);
}

.state[aria-hidden="true"] {
  pointer-events: none;
  opacity: 0;
  transform: translateY(2px);
}

@media (prefers-reduced-motion: reduce) {
  .state {
    transition-property: opacity;
  }

  .state[aria-hidden="true"] {
    transform: none;
  }
}
```

Use Motion presence when unmount timing, several keyed states, or layout changes make two mounted states awkward. Keep the current state accessible and hide inactive duplicate content from assistive technology.

## Selection indicator

For a tab/segmented control:

- Use a CSS transform when positions are fixed and equal.
- Use Motion `layoutId` when widths/positions are content-derived or the indicator crosses component boundaries.
- Use native view transitions only when the state/navigation model and interruption behavior fit.

Do not animate the label itself unless it improves contrast continuity. The selected state must be correct before the indicator finishes.

## Traveling hover highlight

One highlight that moves between items instead of each item fading its own background in and out — a sidebar, menu, command palette, file list, or dense grid where the pointer sweeps across several items in a single gesture. Two separable decisions: how the highlight moves, and where the hover state comes from.

Reach for it when the items form a continuous run, the highlight reads as one visual object rather than per-item chrome, and adjacent items are close enough that the pointer crosses them without leaving the run. Skip it for scattered cards, items split by headings or large gaps, and single controls — there the per-item background is the honest answer.

### Make the highlight travel

- Equal fixed slots → one absolutely-positioned highlight moved by CSS `transform`.
- Content-derived widths or heights → Motion `layoutId` on the highlight; this is [Selection indicator](#selection-indicator) machinery driven by hover state instead of selection.
- A highlight relocating is an on-screen element moving, so use ease-in-out and keep it short — roughly 120–180ms. Slower than that and it visibly trails the pointer.
- Fade it out in place when the pointer leaves the run. Do not fly it back to a home position.
- Keep the item's own content still. Let the highlight carry the motion; a label that also shifts competes with it.
- Under reduced motion, reposition instantly and keep the highlight visible: the travel is the spatial part, the highlight is the information. If the run also scrolls, the state source needs its own reduced-motion gate — see below.

### When native `:hover` is the wrong state source

Browsers deliberately skip `:hover` recomputation during scroll, and `:hover` does not re-evaluate when content moves under a stationary pointer. In a scrollable run, the highlight then sticks to the row the pointer *was* over until the pointer moves again. A fast sweep can also skip items outright between frames.

Treat that as a defect worth a dependency only when the run scrolls or reorders under the pointer *and* the stale highlight is visible enough to matter. A static list, or one the user stops moving across before scrolling, needs nothing beyond CSS. Verify by parking the pointer over a row and scrolling with the wheel — if the highlight follows the rows past it, the state source is already fine.

Two cheaper moves come first. If the run is heavy, `content-visibility: auto` on offscreen items can leave the browser enough headroom to update `:hover` more often during scroll — non-deterministic, but free. And if the items sit in equal fixed slots, you already own the geometry: derive the active index from pointer position and scroll offset yourself and skip the DOM queries and `getBoundingClientRect` reads any general-purpose solution has to perform.

When neither fits — arbitrary or dynamic item geometry, and staleness that shows — `super-hover` (MIT, no runtime dependencies, framework-free core plus `/react`, `/vue`, `/svelte` entries) hit-tests with `elementFromPoint` on a coalesced `requestAnimationFrame` and toggles an attribute on whichever item is genuinely under the pointer:

```tsx
import { useSuperHoverRef } from "super-hover/react";

const rootRef = useSuperHoverRef({ enabled: !prefersReducedMotion });

<ul ref={rootRef}>
  {items.map((item) => (
    <li
      key={item.id}
      data-super-hover
      className="transition-colors duration-100 data-super-hover-active:bg-accent"
    >
      {item.label}
    </li>
  ))}
</ul>;
```

Defaults worth knowing before configuring it:

- Attribute-only mode is the default (`events: false`). Style off `data-super-hover-active` and add no callbacks.
- `pointerTypes` omits `touch`, so finger scrolling cannot manufacture hover. Leave it that way.
- Leave `sweptHitTest` off for a traveling highlight. It briefly activates every item the pointer path crossed, in path order — right for a trail, scrubber, or flash effect where each crossed item should react, wrong for one highlight that should land on the final target without strobing through the items between. Turn it on only when the crossed items are the point; then keep `root` narrow and tune `sweptHitTestMargin` (default `320`, trading candidates tested per frame against how large a jump is caught).
- `disableWhilePointerDown: true` when the run is also text the user selects or drags through.
- `pause()` when the surface is hidden and `destroy()` on unmount. A per-frame hit test against an offscreen list is pure cost.
- Enable `"move"` events only for an effect that needs per-frame pointer coordinates; enter/leave is enough to drive a highlight.

Gate the whole mechanism on reduced motion, as shown above. Frame-accurate hover makes the interface change continuously during scroll, which is itself hostile to motion-sensitive users — so the fallback is native `:hover`, not a slower travel. This is separate from cutting the highlight's travel distance; a run that scrolls needs both.

Keep the work done on each change cheap, since it now runs per frame: a background or color swap is fine, a React state update fanning out across many components or an animated `box-shadow` is not.

For a shared traveling highlight, take the rect of `event.detail.current` on enter and position the highlight from it. Per-item styling needs no events at all.

The attribute is a visual state and nothing more. It does not move focus, does not imply `aria-activedescendant`, and gives keyboard users nothing. Keep `:focus-visible` and any real selection state owned by the component, and add frame-accurate hover as a visual layer over them. If the highlight also communicates selection or the active descendant, that state must not come from a hit test.

## Toast

- Enter in roughly 160–200ms; exit faster.
- Translate by its own size when direction matters.
- Use transitions or a proven toast primitive so stacking can retarget.
- Pause timers while the page is hidden and during pointer interaction.
- Preserve swipe-to-dismiss velocity and pointer capture.
- Do not hand-roll focus/live-region semantics for visual novelty.

## Stagger

Use only for a rare grouped entrance. Keep items interactive immediately and cap the total cascade.

Portable fallback:

```tsx
{items.map((item, index) => (
  <li
    className="motion-safe:animate-(--animate-list-in) [animation-delay:var(--delay)]"
    key={item.id}
    style={{ "--delay": `${index * 40}ms` } as React.CSSProperties}
  >
    {item.label}
  </li>
))}
```

```css
@theme {
  --animate-list-in: list-in 240ms var(--ease-out-strong) both;

  @keyframes list-in {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }
}
```

Use `sibling-index()` only as a verified enhancement. Do not stagger menus, command palettes, dense tables, or results the user is waiting to use.

## Scroll reveal

Default to fully visible content. Add a guarded `view()` timeline only for decorative continuity. Use IntersectionObserver or Motion `useInView` when a single threshold event, persistent completion state, analytics, or unsupported browsers require JavaScript.

Avoid applying the same fade-up to every section. Repetition turns an accent into latency.

## Loading and progress

- Prefer determinate progress when the system knows it.
- Use a simple linear rotation for an indeterminate spinner; do not add spring.
- Stop loops when offscreen or complete.
- Under reduced motion, use a static/progressive indicator rather than a large moving shimmer.
- Animate dynamic numbers with stable/tabular numerals; use an installed number component only when rolling continuity is the actual design.
