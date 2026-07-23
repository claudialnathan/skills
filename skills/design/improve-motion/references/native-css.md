# Native CSS and Tailwind routing

This is a capability snapshot checked on **2026-07-23**. Treat support as perishable: verify official documentation and the project’s browser floor before use.

## Stable/default tools

### CSS transitions

Use for interactive state changes expressed through pseudo-classes, attributes, classes, or custom properties. Transitions retarget smoothly when state reverses.

```css
.control {
  transition:
    transform 140ms var(--ease-out-strong),
    opacity 140ms var(--ease-out-strong);
}
```

Prefer an explicit property list. Tailwind’s `transition-transform`, `transition-opacity`, and `transition-[transform,opacity]` are appropriate. Tailwind’s bare `transition` is a curated list rather than literal `all`, but it is still often broader than needed.

### CSS keyframes

Use for one-shot staged entrances, loaders, progress loops, and autonomous sequences. Avoid for rapidly reversed toggles or popups.

In Tailwind v4, reusable animations belong in `@theme`:

```css
@theme {
  --animate-check-pop: check-pop 180ms var(--ease-out-strong);

  @keyframes check-pop {
    from {
      opacity: 0;
      transform: scale(0.85);
    }
  }
}
```

Use `animate-check-pop` in markup. Keep a component-specific keyframe in component CSS when it has one consumer; do not globalize it merely to create a utility.

### `@starting-style`

Use to transition an element on first render or when it moves from `display: none` into the rendered state. This is broadly available in modern browsers, but the destination styles and transition still need to exist.

```css
.popover {
  opacity: 1;
  transform: scale(1);
  transition:
    opacity 160ms var(--ease-out-strong),
    transform 160ms var(--ease-out-strong);

  @starting-style {
    opacity: 0;
    transform: scale(0.96);
  }
}

@media (prefers-reduced-motion: reduce) {
  .popover {
    transition-property: opacity;
  }

  @starting-style {
    .popover {
      transform: scale(1);
    }
  }
}
```

Tailwind v4 exposes the `starting:` variant. Combine it with the actual open/state variant rather than hiding content by default in all browsers.

### Discrete transitions

`transition-behavior: allow-discrete` lets discrete properties such as `display` or overlay participate in a transition lifecycle, keeping an exiting element rendered long enough for interpolable properties to finish.

Tailwind v4 exposes `transition-discrete`.

```css
.notice {
  transition:
    opacity 140ms,
    display 140ms allow-discrete;
}

.notice[hidden] {
  display: none;
  opacity: 0;
}

@starting-style {
  .notice:not([hidden]) {
    opacity: 0;
  }
}
```

Do not assume a framework will keep an element mounted just because CSS supports discrete transitions. React/component lifecycle still decides whether the node remains in the DOM.

### Registered custom properties

Use `@property` to give an animated custom property a type, initial value, and inheritance behavior:

```css
@property --ring-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.ring {
  background: conic-gradient(from var(--ring-angle), transparent, currentColor, transparent);
  transition: --ring-angle 240ms ease-out;
}

.ring:hover {
  --ring-angle: 45deg;
}
```

This enables interpolation; it does not guarantee compositor execution. Gradients and colors may repaint.

## Conditional/progressive tools

### Intrinsic-size interpolation

`interpolate-size: allow-keywords` enables transitions between a length/percentage and an intrinsic keyword such as `auto`, `min-content`, or `max-content`. `calc-size()` permits calculations with intrinsic sizes.

As of the snapshot date, this remains limited/experimental rather than a safe cross-browser default. Use only behind a project browser floor or guarded enhancement.

```css
.disclosure {
  overflow: clip;
  block-size: 0;
  transition: block-size 220ms var(--ease-out-strong);
}

@supports (interpolate-size: allow-keywords) {
  .disclosure {
    interpolate-size: allow-keywords;
  }

  [data-open] .disclosure {
    block-size: auto;
  }
}
```

Provide a complete fallback. Use the grid implementation in [patterns.md](patterns.md#accordiondisclosure) when intrinsic-size interpolation is outside the project’s browser floor. Prefer an accessible disclosure/accordion primitive for semantics and keyboard behavior; CSS only owns the visual interpolation.

### Scroll-driven animations

`animation-timeline: scroll()` and `view()` bind progress to a scroll container or viewport intersection. As of the snapshot date, the CSS property is not Baseline across all major browsers.

Use for decorative progressive enhancement, not essential state:

```css
.reveal {
  opacity: 1; /* complete fallback */
}

@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .reveal {
      animation: reveal linear both;
      animation-timeline: view();
      animation-range: entry 15% cover 35%;
    }

    @keyframes reveal {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
    }
  }
}
```

Declare `animation-timeline` after the `animation` shorthand because the shorthand resets the timeline. Do not hide content outside the support block. Avoid scroll-tied springs, essential reading sequences, and effects that become confusing when the user scrolls backward.

### Cross-document view transitions

For same-origin multi-page sites, both documents can opt in:

```css
@view-transition {
  navigation: auto;
}
```

Unsupported browsers navigate normally, making this a useful progressive enhancement. Cross-document support is still not universal; verify the browser floor. Add named shared elements only when identity is stable across pages, and test rapid navigation, back/forward, scroll restoration, focus, and reduced motion.

Suppress spatial cross-document choreography for reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

For React/SPA view transitions, prefer the framework’s supported API before hand-rolling snapshot orchestration. Compare snapshot animation with Motion’s live-DOM layout/shared-element animation based on interruption, scroll, layering, routing, and interactive-content requirements. Read [view-transitions.md](view-transitions.md) before implementation.

### `sibling-index()` / `sibling-count()`

These functions can calculate stagger without author-supplied indices:

```css
@supports (width: calc(sibling-index() * 1px)) {
  .item {
    animation-delay: calc((sibling-index() - 1) * 40ms);
  }
}
```

As of the snapshot date, they are limited rather than a cross-browser default. Keep explicit CSS variables or a short `:nth-child()` list as the fallback. Do not stagger long or interactive lists; all controls must be usable immediately.

## Tailwind ownership ladder

Route styling by reuse and complexity:

1. Existing project animation utility/plugin such as a matching `tw-animate-css` primitive.
2. Existing native Tailwind utility/variant.
3. One-off arbitrary property/value for a local gap.
4. CSS custom property for a per-instance parameter.
5. `@theme` for shared duration, easing, animation, or other design token.
6. `@utility` for a reusable utility that Tailwind does not ship.
7. Component CSS/module for selectors, lifecycle combinations, keyframes, pseudo-elements, and multi-declaration machinery.

Example custom utility:

```css
@utility press-feedback {
  transition-property: transform;
  transition-duration: var(--duration-fast);
  transition-timing-function: var(--ease-out-strong);

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  @media (prefers-reduced-motion: reduce) {
    &:active:not(:disabled) {
      transform: none;
    }
  }
}
```

Create this only when the project repeats the same contract. A one-consumer button animation belongs beside the button.

## Choosing CSS over runtime motion

Prefer CSS when:

- state already exists in selectors/attributes;
- start/end values are predetermined;
- interruption is a simple reversal;
- no layout/shared-element measurement or gesture physics is needed;
- the CSS result is shorter and easier to own;
- browser support meets the product floor.

Prefer WAAPI or Motion when:

- JavaScript must coordinate playback or cancellation;
- values are runtime-derived;
- gestures need velocity, constraints, or momentum;
- React layout/shared-element continuity is the job;
- exit presence requires lifecycle orchestration;
- a CSS fallback would be longer or less reliable.

Do not port a working Motion interaction to CSS solely to remove an import already used elsewhere. Count real dependency and complexity savings.
