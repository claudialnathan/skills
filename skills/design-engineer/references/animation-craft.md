# Animation craft

The *what to animate and how*, once frequency × novelty (SKILL.md) has said an animation is allowed at all. Adapted to this stack: curves and durations live at Tailwind's `@theme` as tokens, origin variables are Base UI's, Motion is the JS layer of last resort per the hierarchy of reach.

If the `emil-design-eng` skill is installed it adds more worked examples on the same ground; this file stands alone without it.

## Easing

Decision tree — first match wins:

- Entering or exiting → **ease-out** (starts fast; the user sees instant response).
- Moving or morphing on screen → **ease-in-out**.
- Hover / color change → **ease**.
- Constant motion (marquee, progress) → **linear**.
- Default → ease-out.

**Never ease-in for UI.** It delays the initial movement — the exact moment the user is watching — so a 300ms ease-in dropdown *feels* slower than a 300ms ease-out one. Perceived speed is part of the design: ease-out at 200ms feels faster than ease-in at 200ms, a fast-spinning spinner makes the same load feel shorter.

**Built-in CSS easings are too weak.** Configure stronger custom curves once, as tokens:

```css
@theme {
  --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1); /* iOS-like drawer curve */
}
```

Don't invent curves from scratch; easing.dev and easings.co carry stronger variants of every standard shape.

## Duration

| Element | Duration |
| :-- | :-- |
| Button press feedback | 100–160ms |
| Tooltips, small popovers | 125–200ms |
| Dropdowns, selects | 150–250ms |
| Modals, drawers | 200–500ms |
| Marketing / explanatory | can be longer |

UI animations stay under 300ms (the body's hard rule). Tooltips: delay the *first* open (~700ms, prevents accidental activation), then open adjacent tooltips instantly — `[data-instant]` with `transition-duration: 0ms` — which makes the whole toolbar feel faster without losing the guard.

## Springs

Springs have no fixed duration; they settle by physics, and they **keep velocity when interrupted** — CSS keyframes restart from zero. That makes them right for: drag with momentum, gestures the user can reverse mid-motion, elements that should feel alive. Use Motion's Apple-style config — easier to reason about than mass/stiffness/damping:

```js
{ type: "spring", duration: 0.5, bounce: 0.2 }
```

Bounce 0.1–0.3 when used at all; **bounce 0 for productivity UI** (bounce reads as playful). For decorative mouse-tracking, interpolate through `useSpring` rather than binding values directly to pointer position — direct binding lacks motion and feels artificial. And know the boundary: decorative tracking earns a spring; a functional chart in a banking app earns no animation at all.

## Enter and exit

- **Never animate from `scale(0)`** — nothing in the real world appears from nothing. Start at `scale(0.95)` or higher, paired with `opacity: 0`.
- **Popovers scale from their trigger**: `transform-origin: var(--transform-origin)` (Base UI sets it). **Modals are the exception** — no trigger anchor, keep center.
- **Prefer CSS transitions over keyframes for anything triggered rapidly** (toasts stacking, toggles): transitions retarget smoothly mid-flight; keyframes restart.
- **`@starting-style` animates entry without JS** — it replaces the `useEffect`-sets-`mounted` dance; fall back to a `data-mounted` attribute where support is missing. On Base UI primitives, `[data-starting-style]` / `[data-ending-style]` are the equivalent lifecycle hooks.
- **Asymmetric timing.** Exit faster than enter (a toast: ~180ms in, ~140ms out — transient things shouldn't linger). Slow where the user is deciding, fast where the system responds: hold-to-delete presses at 2s linear, releases at 200ms ease-out.
- **Stagger** (30–80ms between items) is decorative — cascades feel more natural than simultaneous appearance, ~40ms reads as "arrival" — but never block interaction while it plays, and only on surfaces rare enough to carry novelty.
- `translateY(100%)` moves an element by its own height regardless of content — how toasts and drawers hide. Prefer percentages to hardcoded px.
- A crossfade that still looks like two overlapping objects after easing/duration tuning: add `filter: blur(2px)` during the transition — blur bridges the two states into one perceived transformation. Keep the radius small; blur cost grows fast (the polish list caps *animated* blur at 8px).

## clip-path

`clip-path: inset(top right bottom left)` is a hardware-accelerated reveal primitive; each value eats inward from that side. `inset(0 100% 0 0)` is hidden-from-right; transition to `inset(0 0 0 0)` to reveal.

- **Tabs with perfect color transitions** — duplicate the tab list, style the copy as active, clip it to the active tab, animate the clip on change. Timing individual color transitions can't match it.
- **Hold-to-delete** — colored overlay clipped out; on `:active` transition to fully revealed over 2s linear; on release snap back at 200ms ease-out.
- **Scroll reveal** — start `inset(0 0 100% 0)`, animate to zero when the element enters the viewport (`useInView` with `{ once: true, margin: "-100px" }`, or IntersectionObserver).
- **Comparison slider** — two stacked images, clip the top by drag position. No extra DOM, fully accelerated.

## Gesture and drag

- **Momentum dismissal**: don't require dragging past a distance threshold; compute velocity (`distance / elapsed`) and dismiss when it exceeds ~0.11 — a quick flick is enough.
- **Damping at boundaries**: past the natural limit, movement shrinks as drag grows. Real things slow down before they stop; friction beats an invisible wall.
- **Pointer capture** once drag starts, so it survives the pointer leaving the element's bounds.
- **Ignore additional touch points** after a drag begins, or finger-switching teleports the element.

## Performance

- Animate only compositor properties — the body's hard rule (`transform`, `opacity`, `filter`, `clipPath`). `height`/`width`/`padding` trigger layout and paint.
- **Don't animate via CSS variables on a container**: variables inherit, so updating `--swipe-amount` on a parent recalculates style for every child. Set `transform` on the element itself.
- **Motion's shorthand props (`x`, `y`, `scale`) are not hardware-accelerated** — they run on the main thread via rAF and drop frames under load. For motion that must survive a busy main thread, animate the full `transform` string, or use CSS.
- **CSS animations beat JS under load** (they run off the main thread). CSS for predetermined motion; JS for dynamic, interruptible, physics-driven motion. The Web Animations API (`element.animate(...)`) is the middle path: JS control, CSS performance, no library.

## Reduced motion and touch

- `prefers-reduced-motion` means **fewer and gentler, not zero**: keep the opacity/color transitions that aid comprehension, remove movement. This stack implements it at the token layer (a `--duration-*` variable collapsing in the media query) — components consume the token, per the body's hard rule.
- Gate hover effects behind `@media (hover: hover) and (pointer: fine)` — touch devices fire hover on tap and stick it.

## Debugging

Slow the animation down (2–5× duration, or DevTools' animation panel) — wrong transform-origin, out-of-sync properties, and two-state crossfade seams are invisible at full speed. Step frame-by-frame for coordination issues. Test gestures on a physical device, not the simulator. And review with fresh eyes the next day; imperfections surface after the session ends.
