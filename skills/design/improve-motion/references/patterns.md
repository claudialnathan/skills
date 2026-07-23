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

## Accessible checkbox confirmation

Keep the native checkbox as the source of semantics and state. Animate only the small checkmark; do not mount/unmount the input.

```tsx
<label className="relative inline-flex min-h-11 cursor-pointer items-center gap-2">
  <input className="peer sr-only" type="checkbox" />
  <span
    aria-hidden="true"
    className="
      grid size-5 place-items-center rounded-[5px] border border-input
      bg-background transition-[background-color,border-color] duration-150
      peer-checked:border-primary peer-checked:bg-primary
      peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2
      peer-focus-visible:outline-ring
    "
  />
  <svg
    aria-hidden="true"
    className="
      pointer-events-none absolute left-0.5 top-1/2 size-4 -translate-y-1/2
      text-primary-foreground opacity-0 transition-opacity duration-150
      ease-(--ease-out-strong) peer-checked:opacity-100
      motion-safe:scale-90 motion-safe:transition-[opacity,scale]
      motion-safe:peer-checked:scale-100
    "
    viewBox="0 0 16 16"
  >
    <path d="m3.5 8 3 3 6-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
  <span>Include archived projects</span>
</label>
```

If the codebase already uses a Base UI/shadcn Checkbox, keep that primitive and apply the same visual treatment to its indicator/state attributes. Prefer a CSS transition for this frequent, binary interaction. Search an installed Motion+ example only when the user requests that exact treatment and it materially improves on this small CSS contract.

Provenance note: the `working/examples.md` checkbox named during this skill’s rebuild was not present in the available worktree, and the Motion Codex source could not be queried in that session. Treat the pattern above as an original restrained fallback, not a reproduction or verified match. When the named source or AI Kit example becomes available, compare its state model, timing, easing, reduced-motion behavior, and mounting strategy before adopting any part of it.

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
