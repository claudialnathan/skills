# Motion + Base UI

The integration layer for animating shadcn (4.x, on Base UI) components with Motion (formerly Framer Motion). Stack-specific. The deeper craft (easing curve choice, spring tuning, clip-path mechanics, gesture physics) lives in `emil-design-eng` — invoke that skill when you need *what to animate and how*; this one covers the *Base UI integration and the frequency-aware decision*.

## Stack context

shadcn 4.x's canonical base imports three things at the top of `globals.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
```

`tw-animate-css` is the source of `animate-in`, `animate-out`, `fade-in-0`, `zoom-in-95`, `slide-in-from-top-2` and the rest of the shadcn animation utility set. It also provides helpers that compose with Base UI's `[data-starting-style]` lifecycle. If you reach for `animate-in fade-in-0` and the class doesn't apply, the import is missing.

**Tailwind v4 also ships first-party animation primitives**: `transition`, `transition-{property}`, `duration-{ms}`, `ease-{linear|in|out|in-out|initial}`, `animate-{spin|ping|pulse|bounce|none}`. Custom animations register at `@theme` via `--animate-<name>`, with `@keyframes <name>` declared in the same file. See [Tailwind animation docs](https://tailwindcss.com/docs/animation). The first reach for "animate this" is almost always one of these utilities — not Motion.

## Hierarchy of reach

When you decide to animate something, walk this hierarchy top-to-bottom. Stop at the first that fits — don't escalate without reason.

1. **Tailwind's built-in animation utilities** — `transition`, `transition-{property}`, `duration-*`, `ease-*`, `animate-{spin|pulse|...}`, plus custom `--animate-<name>` registered at `@theme`. Plus `tw-animate-css`'s `animate-in fade-in-0 zoom-in-95 slide-in-from-top-2` set, which composes with Base UI's `[data-starting-style]` lifecycle automatically. Most "fade in", "scale on hover", "slide drawer in", and standard enter/exit cases live here. Cheapest reach, and the one most aligned with how Tailwind expects you to author animation. See [Tailwind animation docs](https://tailwindcss.com/docs/animation).
2. **Custom CSS transitions targeting Base UI's `[data-starting-style]` / `[data-ending-style]`** — when Tailwind's utility set doesn't cover what you need (multi-property orchestration with different timings, origin-aware scale + opacity + filter, `data-instant` overrides). Cheap, works everywhere, no JS, correct interruption behavior.
3. **Motion via `render` prop** — when the animation is *state-derived* (`animate={{ scale: open ? 1 : 0.95 }}`) or you need spring physics, gestures, or layout animations CSS can't express.
4. **Motion + AnimatePresence + `keepMounted` Portal** — for popup-class components (Dialog, Popover, ContextMenu, Menu, Tooltip, AlertDialog) whose Portal controls its own mount lifecycle and need behavior CSS / Tailwind utilities can't deliver.

Default down the hierarchy. If a Tailwind utility does it, don't reach for `[data-starting-style]`. If `[data-starting-style]` does it, don't reach for Motion. If Motion without AnimatePresence does it, don't reach for AnimatePresence.

## Layer 1 — Tailwind's built-in animation utilities

Tailwind v4's first-party utilities cover most "animate this" cases without ever touching Base UI's data-attribute lifecycle directly. Reach for these first.

### Built-in utilities

```tsx
{/* Hover scale */}
<button className="transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.97]">…</button>

{/* Color transitions */}
<a className="transition-colors duration-150 ease-out hover:text-primary">…</a>

{/* Built-in keyframe animations */}
<div className="animate-pulse" />            {/* skeleton */}
<div className="animate-spin" />              {/* loader */}
<div className="animate-bounce" />            {/* attention nudge */}
```

Tailwind's named easings: `ease-linear`, `ease-in`, `ease-out`, `ease-in-out`, `ease-initial`. For UI you almost always want `ease-out` (entering) or a custom curve at the token layer — `ease-in` starts slow at the moment users are watching, which feels wrong.

### shadcn's `tw-animate-css` set (composes with Base UI)

Already imported at the top of `globals.css`. Pair with Base UI's `data-state` for popup-class enter/exit:

```tsx
<Popover.Popup className="
  data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
  data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
  data-[side=bottom]:slide-in-from-top-2
  data-[side=top]:slide-in-from-bottom-2
">…</Popover.Popup>
```

This is what shadcn ships in its component templates. **It already composes with Base UI's lifecycle correctly** — Base UI's `getAnimations()` detects the running animation and gates unmount. No `keepMounted`, no AnimatePresence, no Motion.

### Custom keyframes at the token layer

When Tailwind's built-in animations don't cover what you need, register custom ones at `@theme` — never as inline arbitrary `animate-[...]` strings.

```css
/* globals.css */
@theme {
  --animate-shimmer: shimmer 2s linear infinite;
  --animate-fade-up: fade-up 240ms cubic-bezier(0.23, 1, 0.32, 1);
}

@keyframes shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Now `animate-shimmer` and `animate-fade-up` are first-class Tailwind utilities. See [Tailwind animation docs](https://tailwindcss.com/docs/animation) for the full configuration surface.

**Anti-pattern**: `animate-[shimmer_2s_linear_infinite]` inline. The string-encoded form bypasses the token system, isn't searchable, and makes prefers-reduced-motion overrides per-component instead of token-level.

### When this layer is enough

If the answer to "how should this animate?" is one of:
- Hover / focus state change on a button, card, or link.
- Skeleton loader, spinner, attention pulse.
- Open/close of a Base UI popup with stock fade+scale or slide.
- Self-contained looping animation (shimmer, marquee, indicator).

…then Tailwind utilities are the answer. Don't escalate to layers 2-4 because you saw a Motion example.

## Layer 2 — Custom CSS transitions on Base UI's data-* lifecycle

Base UI components expose their open/close state via data attributes. Style transitions against them and Base UI uses `element.getAnimations()` to detect running transitions before unmounting. **No mount-race, no `keepMounted` needed for simple cases.**

```css
.Popup {
  transition: transform 180ms, opacity 180ms;
  transition-timing-function: var(--ease-out);
}
.Popup[data-starting-style],
.Popup[data-ending-style] {
  opacity: 0;
  transform: scale(0.95);
}
```

Or the Tailwind v4 inline:
```tsx
<Popover.Popup
  className="transition-[transform,opacity] duration-180 ease-out
             data-[starting-style]:opacity-0 data-[starting-style]:scale-95
             data-[ending-style]:opacity-0 data-[ending-style]:scale-95"
>…</Popover.Popup>
```

**When to reach for it**: a popover, dialog, or menu that fades / scales in and out. The vast majority of "animate the popup" cases.

**Why prefer CSS here**: the bundle cost is zero, the timing is platform-native, the interruption behavior is correct (CSS transitions retarget mid-flight; keyframes restart from zero), and `prefers-reduced-motion` flows from the token layer for free.

### Base UI's animation variable surface

Base UI exposes a richer set of CSS variables on Positioner/Popup/Trigger than the basic `--transform-origin`. Read these where they fit; they replace JS measurement.

| Variable | Where set | What it carries |
| :-- | :-- | :-- |
| `--transform-origin` | Popup | Computed from anchor position. `transform-origin: var(--transform-origin)` makes scale animations origin-aware on every side. |
| `--popup-width`, `--popup-height` | Popup | The popup's measured size. Use to animate width/height changes (e.g., NavigationMenu content swaps). |
| `--available-width`, `--available-height` | Positioner | Collision-aware available space. Cap popup size with `max-width: var(--available-width)`. |
| `--positioner-width`, `--positioner-height` | Positioner | The positioner's measured size. Animate these when popup contents change height. |
| `data-side` | Positioner / Popup | `top` / `right` / `bottom` / `left` — actual placement after collision resolution. Drive direction-aware variants: `data-[side=top]:slide-in-from-bottom-2`. |
| `data-instant` | Positioner / Popup | Set when the transition should fire instantly (e.g., second tooltip in a hover-group, before the leave delay). Pair with `data-[instant]:transition-none`. |
| `data-activation-direction` | Viewport (NavigationMenu) | Direction state changed (`left` / `right`) for swipe-style cross-fades between menu sections. |

Worked example, NavigationMenu Popup with the full surface:

```tsx
<NavigationMenu.Popup
  className="
    relative
    w-[var(--popup-width)] h-[var(--popup-height)]
    max-w-[var(--available-width)]
    origin-[var(--transform-origin)]
    transition-[opacity,transform,width,height] duration-(--duration) ease-(--easing)
    data-[starting-style]:scale-90 data-[starting-style]:opacity-0
    data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[ending-style]:duration-150
    data-[instant]:transition-none
  "
  style={{
    "--duration": "200ms",
    "--easing": "cubic-bezier(0.22, 1, 0.36, 1)",
  } as React.CSSProperties}
>…</NavigationMenu.Popup>
```

**Reach for `data-instant`** specifically when:
- A tooltip group should make the first open delay-and-animate, then subsequent hovers within the group should snap (no delay, no animation).
- A modal/popover is being repositioned mid-open (e.g., scroll happens while open) and you want the position update to be instant rather than tweened.
- A dropdown is opening "again" within the same hover session and the animation is now redundant.

Base UI sets `data-instant` for you in these cases — your job is to honor it with `transition-none` (or `transition-duration: 0`) under the attribute selector.

## Layer 3 — Motion via the `render` prop

Base UI's `render` prop replaces Radix's `asChild`. It accepts a JSX element; Base UI merges its props (refs, ARIA, behavior) onto your element.

```tsx
import { Menu } from "@base-ui-components/react/menu"
import { motion } from "motion/react"

<Menu.Trigger render={
  <motion.button
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    whileTap={{ scale: 0.97 }}
    transition={{ type: "spring", duration: 0.3, bounce: 0 }}
  />
} />
```

**Hard rule**: if you find yourself writing `asChild` in a Base UI codebase, that's the Radix idiom — translate to `render`. Components from Radix-era examples *will* type-check (the prop names look similar) but may misbehave at runtime.

**When to use Motion via `render`**: state-derived animation on a single element. Spring physics. Gesture handling (`whileTap`, `whileHover`, `whileDrag`). Layout animations. Anything CSS can't express.

## Layer 4 — Motion + AnimatePresence + `keepMounted` for popup-class components

The components that own their mount lifecycle (Dialog, Popover, ContextMenu, Menu, Tooltip, AlertDialog) need a three-part recipe so AnimatePresence can run exit animations:

1. **Hoist `open` state** so the consumer controls mounting.
2. **`keepMounted` on the Portal** so Base UI doesn't unmount on close.
3. **Conditional inside AnimatePresence** so AnimatePresence sees the state change.

```tsx
function MyMenu() {
  const [open, setOpen] = useState(false)

  return (
    <ContextMenu.Root open={open} onOpenChange={setOpen}>
      <ContextMenu.Trigger>Open menu</ContextMenu.Trigger>
      <AnimatePresence>
        {open && (
          <ContextMenu.Portal keepMounted>
            <ContextMenu.Positioner>
              <ContextMenu.Popup
                render={
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  />
                }
              >
                {/* items */}
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        )}
      </AnimatePresence>
    </ContextMenu.Root>
  )
}
```

**Same shape works for**: `Dialog.Root`, `Popover.Root`, `Menu.Root`, `Tooltip.Root`, `AlertDialog.Root`. One recipe, six components.

### The hardware-accelerated property requirement

Base UI's animation detection uses `element.getAnimations()` to determine when an animation has finished, which gates unmount. **The animation must run a property on the compositor track** (`opacity`, `transform`, `filter`, `clipPath`) for detection to fire.

Common bug: animating `height` alone on exit. The `height` animation runs on the layout track, `getAnimations()` doesn't catch it, Base UI unmounts mid-tween, the exit appears to skip.

Fix: include `opacity` in every exit object even if you don't visually need it.

```tsx
exit={{ opacity: 0, height: 0 }}  // ✓ opacity satisfies the detection
exit={{ height: 0 }}              // ✗ exit appears to skip
```

**Note on `interpolate-size: allow-keywords`.** When this is baked at `:root` (it is, in this workshop's [`baseline-bakein-2026-05-09.md`](../../../guides/baseline-bakein-2026-05-09.md)), height transitions can interpolate from `auto` / `min-content` / `max-content`. That's a separate problem from the Base UI race above — `interpolate-size` makes height-from-keyword *possible*; it doesn't change what `getAnimations()` reports. The "include opacity in exit" fix still applies, because the issue isn't whether the height animation runs, it's whether Base UI's lifecycle detection sees it. The `<details>` content-toggle pattern in the bake-in doc shows the working shape: the layout-track transition runs alongside `transition-behavior: allow-discrete` for `content-visibility`, but for Base UI popups the compositor-property requirement is non-negotiable.

### The AnimatePresence rule everyone gets wrong

The conditional must live *inside* AnimatePresence, not outside:

```tsx
// Wrong — exit never fires
{open && <AnimatePresence><Popup /></AnimatePresence>}

// Right
<AnimatePresence>{open && <Popup key="popup" />}</AnimatePresence>
```

Every direct child needs a stable `key` (use ids, not array indices). For tab/route swap-style transitions, use `mode="wait"`:

```tsx
<AnimatePresence mode="wait">
  <Tabs.Panel value={value} key={value} render={
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
    />
  }>
    {/* panel content for `value` */}
  </Tabs.Panel>
</AnimatePresence>
```

## Frequency × novelty applied to motion

Before reaching for any of the layers above, apply Rauno's filter (see `references/taste.md`):

| Component | Frequency | Default treatment |
| :-- | :-- | :-- |
| Command palette / `cmdk` | 100+/day | **No animation.** Open instantly. Optional 60–80ms accent-color blink on selected item. |
| Toast (added) | dozens/day | Fast slide+fade enter (~180ms), brief exit (~140ms). Sub-200ms. |
| Tooltip | dozens/day | First open delays 700ms; subsequent within "tooltip group" should skip delay (`data-instant`). Fade+scale 125ms. |
| Dropdown / Select | dozens/day | Fade+scale, 150ms, ease-out. Origin-aware (`var(--transform-origin)`). |
| Modal / Dialog | occasional | 200–280ms enter, 180–200ms exit. Origin-center is fine for modals (they're not anchored to a trigger). |
| Drawer / Sheet | occasional | 280–400ms slide. iOS-like ease — `cubic-bezier(0.32, 0.72, 0, 1)`. |
| Popover (anchored) | occasional | 180ms fade+scale from `var(--transform-origin)`. Never from center. |
| Onboarding / first-run | once | Choreographed. Permitted to be longer (400–800ms), can carry stagger. |
| Marketing scroll-driven | per-pageview | `animation-timeline: view()` for fade-ins. No springs. |

**Hard rules across all layers**:

- Duration ≤ 300ms for UI animations. Marketing/onboarding can exceed.
- Animate only `transform`, `opacity`, `filter`, `clipPath` (compositor only).
- `transform-origin` from the trigger (`var(--transform-origin)` for Base UI), or `bottom center` / `top center` for anchored elements. **Modals are the exception** — they keep `center` because they have no trigger anchor.
- No animation on keyboard-driven actions (command palette toggle, list selection via arrow keys, shortcut-triggered states).

## Easing — token layer + Comeau's `linear()` enhancement

Stock CSS easings (`ease`, `ease-in-out`) are weak. Use named custom curves at the token layer, with a progressive-enhancement upgrade to spring approximations via the `linear()` timing function.

```css
@theme {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);            /* strong ease-out */
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);        /* strong ease-in-out */
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);         /* iOS-like */

  --duration-fast: 180ms;
  --duration-medium: 240ms;
  --duration-slow: 320ms;
}

@supports (animation-timing-function: linear(0, 1)) {
  @theme {
    --ease-spring: linear(
      0, 0.013 0.6%, 0.05 1.2%, 0.971 47.2%,
      1.012 59.1%, 0.995 70.8%, 1
    );
  }
}

@media (prefers-reduced-motion: reduce) {
  @theme {
    --duration-fast: 0.01ms;
    --duration-medium: 0.01ms;
    --duration-slow: 0.01ms;
  }
}
```

Components consume tokens, never literal values:
```tsx
className="transition-transform duration-(--duration-fast) ease-(--ease-out)"
```

**Why never `ease-in` for UI**: it starts slow at the moment users are watching most closely. A 200ms `ease-in` *feels* slower than a 200ms `ease-out` because the perceived motion is delayed. (See `emil-design-eng` for the deep treatment.)

**Why generators, not hand-tuning**: don't write `linear()` strings by hand. Use Jake Archibald's spring tool or Easing Wizard to generate them; copy-paste into your tokens.

## prefers-reduced-motion at the token layer

The pattern above (collapsing `--duration-*` to `0.01ms` inside the media query) is the right shape. Components consume the variable; one media query covers every component. Don't:

- Write `@media (prefers-reduced-motion)` per component.
- Branch on `useReducedMotion()` per component.
- Set `transition: none` per component.

The rare case where you *do* want per-component branching is when reduced-motion should still allow *opacity* changes but skip *transform* changes (which can cause vestibular issues). For that, apply per-property:

```css
.thing { transition: opacity 200ms, transform 200ms; }
@media (prefers-reduced-motion: reduce) {
  .thing { transition: opacity 200ms, transform 0.01ms; }
}
```

## Scroll-driven animations

For fade-in-on-scroll patterns, prefer native CSS `animation-timeline: view()` over `IntersectionObserver`:

```css
.fade-in-on-scroll {
  opacity: 0;
  animation: fade-in linear;
  animation-timeline: view();
  animation-range: entry 25% cover 50%;
}

@keyframes fade-in { to { opacity: 1; } }
```

**When to use it**: marketing fade-ins, decorative reveals as content enters the viewport.

**When NOT** (per Comeau):
- Discrete threshold triggers (use `IntersectionObserver` so logic is single-shot).
- Anything where reversing on scroll-back would confuse the user.
- **Springs on scroll timelines are cursed** — the spring oscillates as users scroll back and forth.

`animation-fill-mode: backwards` keeps offscreen elements hidden before the range begins — easy to forget.

## squash-and-stretch on micro-interactions

Apply *subtle* squash/stretch to give micro-interactions an elastic feel. Volume conservation: when something stretches, it should also get thinner.

```tsx
// SVG arrow that stretches on hover
<motion.svg
  whileHover={{ scaleX: 1.15, scaleY: 0.92 }}
  transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
/>
```

**Discipline** (per Comeau): production-strength is 25–50% of the demo intensity. If a tutorial uses `1.5×` stretch, ship `1.1–1.2×`. Easy place to over-do.

For animation philosophy on this (when, why, with what easing), defer to `emil-design-eng`.

## Springs vs duration — when each fits

| Use case | Reach for |
| :-- | :-- |
| Drag with momentum | Spring (`useSpring`, `whileDrag`) |
| Element that should feel "alive" (Dynamic Island) | Spring |
| Gesture interruptible mid-animation | Spring (springs maintain velocity; CSS resets) |
| Decorative mouse-follow | Spring with high damping |
| Modal enter / exit | Duration + custom ease |
| Dropdown / popover | Duration + custom ease |
| Toast | Duration + custom ease |
| Comparison slider drag | Spring on the slider; transition on the reveal clip-path |

**Spring config** (Apple-style — easier to reason about):
```tsx
transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
```

**Bounce 0–0.3** for productivity feel. Higher only for explicitly playful surfaces.

For physics tuning, the Sonner principles, gesture mechanics, and the perceived-speed treatment, defer to `emil-design-eng`.

## Defer-points to `emil-design-eng`

Invoke `/emil-design-eng` (or read its body) when you need:

- **The animation decision framework** — should this animate at all? full treatment.
- **Easing curve internals** — why `ease-out` for entering, `ease-in-out` for moving, `linear` for marquee/progress, never `ease-in` for UI.
- **Spring physics tuning** — stiffness/damping/mass, Apple's bounce/duration form, when interruptibility matters.
- **Clip-path craft** — image reveals on scroll, perfect color transitions on tabs, hold-to-delete pattern, comparison sliders.
- **Gesture mechanics** — momentum-based dismissal, damping at boundaries, pointer capture, multi-touch protection, friction over hard stops.
- **Transform-origin reasoning** — why popovers scale from trigger but modals from center, the percentage-translate trick (`translateY(100%)` for variable-height drawers/toasts).
- **3D transforms** — `rotateY` with `preserve-3d` for orbits, coin flips, depth.
- **Performance internals** — why CSS animations beat JS under load, why Framer Motion's shorthand `x`/`y` props aren't hardware-accelerated, when to use WAAPI for programmatic CSS animation.
- **The Sonner principles** — building loved components.
- **Stagger** — values, when it helps, when it slows the interface.

This skill owns the *frequency × novelty decision* and the *Base UI integration*. That skill owns the *what to animate and how*.

## Pre-ship for motion code

Before saying "done" on a UI surface that animates:

- [ ] Stated frequency × novelty match (which axis, why permitted).
- [ ] Reason articulated for each animated property (the *why*).
- [ ] Duration ≤ 300ms (or marketing/onboarding exception with a stated reason).
- [ ] Properties limited to `transform`, `opacity`, `filter`, `clipPath`.
- [ ] `transform-origin` set from trigger (or center for modals).
- [ ] Easing is a custom curve at the token layer, not stock `ease-in-out`.
- [ ] If popup-class component: hoist + `keepMounted` + AnimatePresence pattern.
- [ ] Exit object includes `opacity` (or another compositor property) so Base UI's detection fires.
- [ ] AnimatePresence wraps the conditional, not the other way around.
- [ ] No `asChild` (Base UI uses `render`).
- [ ] `prefers-reduced-motion` covered at the token layer.
- [ ] No animation on keyboard-driven actions.
- [ ] Stable `key` on every direct child of AnimatePresence.

## Further reading

- `motion.dev/docs/base-ui` — canonical Motion + Base UI integration guide.
- `base-ui.com/react/handbook/animation` — Base UI's own animation API (`[data-starting-style]`, `[data-ending-style]`).
- Josh Comeau on `linear()`, scroll-driven, squash and stretch.
- Emil Kowalski's animations.dev course — full craft layer.
