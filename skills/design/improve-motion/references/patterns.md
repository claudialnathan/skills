# Restrained motion patterns

Adapt structure, tokens, and component APIs to the host project. These are decision examples, not a requirement to animate every matching component.

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
import { motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useState } from "react";

function AnimatedCheckbox() {
  const [checked, setChecked] = useState(false);
  const reduceMotion = useReducedMotion();
  const pathLength = useMotionValue(checked ? 1 : 0);
  const strokeLinecap = useTransform(() => (pathLength.get() === 0 ? "none" : "round"));

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
              style={{ pathLength, strokeLinecap }}
            />
          </svg>
        </motion.button>
      }
    />
  );
}
```

Craft details worth keeping: asymmetric duration (≈300ms to draw, ≈100ms to erase — the exit is quieter), `bounce: 0` (a checkbox is not playful), and `strokeLinecap: "none"` at `pathLength` 0 so no dot lingers when unchecked. Set stroke color through CSS (`stroke-primary` / `style`), not the SVG `stroke` attribute, which does not resolve `var()`. Under reduced motion the check still appears and hover/tap scale is dropped; only the draw is removed.

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

## Base UI anchored popup with CSS

Use the primitive’s state and transform-origin variables:

```tsx
<Popover.Popup
  className="
    origin-[var(--transform-origin)]
    transition-[opacity,scale] duration-160 ease-(--ease-out-strong)
    data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0
    data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0
    data-[instant]:transition-none
    motion-reduce:data-[starting-style]:scale-100
    motion-reduce:data-[ending-style]:scale-100
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
