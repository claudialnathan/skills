# Motion, Motion+, AI Kit, and Base UI

Use this reference only when runtime motion or Motion tooling is relevant. Search current documentation through the installed Motion AI Kit before relying on an unfamiliar API.

## Detect four different capabilities

| Capability | How to detect | What it means |
| :--- | :--- | :--- |
| Motion+ access | Explicit user context or a successful premium AI Kit result | Account/example entitlement outside the target project. Does not install a runtime. |
| Motion AI Kit | Installed `motion` skill and its MCP capabilities are callable | Current docs/examples search, premium examples when entitled, CSS spring generation, transition preview, and MotionScore. Does not install a project runtime. |
| Free Motion runtime | `motion` dependency/imports in the project | `motion/react`, MotionValues, gestures, layout, presence, and WAAPI-backed animation are available to this project. |
| Motion+ project runtime | `motion-plus` or `@motionplus/core` dependency/imports in the project | Verified premium APIs/components can be imported by this project. |

Never infer project runtime installation from account or AI Kit access. A user may own Motion+, use its AI Kit globally, and still publish a project that ships only CSS or free Motion. Keep entitlement “unknown” rather than “unavailable” when it cannot be established.

## AI Kit workflow

For non-trivial Motion work:

1. Search by the interaction or API (`accordion`, `drag`, `layout`, `AnimatePresence`, `scroll`, `splitText`), not “animation.”
2. Read the relevant current documentation and example source, not just search summaries.
3. Adapt semantics, styling, tokens, and component APIs to the host project.
4. Use CSS spring generation for `linear()` curves and transition preview for uncertain feel.
5. Run MotionScore when performance is requested or the runtime evidence suggests jank.

If the AI Kit is missing or its MCP tools are not callable in the current session, proceed with this reference and project precedent. State the missing authoring capability at handoff without downgrading known Motion+ entitlement.

## Imports and bundle shape

React client component:

```tsx
import { AnimatePresence, motion } from "motion/react";
```

React server component:

```tsx
import * as motion from "motion/react-client";
```

Vanilla:

```ts
import { animate } from "motion";
```

Do not introduce `framer-motion` imports in new code. Follow the project if a migration is outside scope, but flag the current package name when relevant.

Establish reduced-motion ownership before shipping any Motion transform, layout, parallax, or gesture animation:

- Prefer one established `MotionConfig reducedMotion="user"` boundary for an application using Motion across multiple components.
- Use `useReducedMotion` locally when no trusted provider exists or when opacity/color should remain while spatial movement changes.
- Treat reference examples below as requiring one of these policies; do not copy them into an app with Motion’s default policy.

For a Motion-heavy React app, combine that policy with one established `LazyMotion` boundary rather than local providers. `LazyMotion` only saves the intended feature-bundle cost when descendants use the `m` component from `motion/react-m`:

```tsx
import { domAnimation, LazyMotion, MotionConfig } from "motion/react";
import * as m from "motion/react-m";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
```

Use `<m.div>` and other `m` components beneath this boundary. Consider `strict` during migration so an accidental full `motion` component is caught. If the app will keep normal `motion` components, omit `LazyMotion` rather than adding a provider that does not reduce their bundle. Use `domMax` only when required by features such as layout animation. Confirm against the installed Motion version.

Local alternative:

```tsx
import { motion, useReducedMotion } from "motion/react"

export function Panel() {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      animate={{ opacity: 1, transform: "scale(1)" }}
      initial={{
        opacity: 0,
        transform: reduceMotion ? "scale(1)" : "scale(0.96)",
      }}
    />
  )
}
```

## When free Motion earns its place

Use Motion for:

- gesture-driven drag/swipe with velocity, constraints, momentum, or elastic bounds;
- springs that must retain velocity when interrupted;
- React layout animation (`layout`) or shared elements (`layoutId`);
- keyed presence where exit must complete before unmount;
- MotionValue composition (`useMotionValue`, `useTransform`, `useSpring`, `useVelocity`);
- runtime-derived values that would make CSS state awkward;
- coordinated imperative sequences where WAAPI alone would be more code.

Do not use Motion merely for:

- `:active` scale;
- a binary checked/unchecked transition;
- a standard Base UI popup fade/scale already exposed through lifecycle data attributes;
- a single predetermined hover;
- a loop CSS already expresses;
- one effect that introduces the only animation dependency.

## Performance rules

Prefer complete transform strings when execution must stay eligible for WAAPI/compositor acceleration:

```tsx
<motion.div
  animate={{ transform: "translateX(100px) scale(1)" }}
  initial={{ transform: "translateX(0px) scale(0.98)" }}
/>
```

Use independent `x`, `y`, `scale`, and MotionValues when transforms need separate composition, per-value transitions, gesture ownership, or live derivation. Treat this as a deliberate main-thread/authoring trade, not an automatic defect.

Inside per-frame callbacks:

- avoid allocation and array helpers that create garbage;
- read MotionValues through callbacks/effects, not React render;
- batch DOM reads and writes;
- avoid inherited custom-property updates high in the tree;
- keep large blur/mask/paint effects rare and profiled;
- do not add `will-change` everywhere.

Motion layout animation uses measurement/FLIP-style setup and transforms. It is often a good replacement for hand-animated width/position, but measure its setup/concurrency on large lists.

## Gesture contract

For direct manipulation:

- track 1:1 with the pointer;
- preserve the initial grab offset;
- use pointer capture;
- disambiguate drag from click with a small threshold;
- ignore additional touch points once a drag begins;
- apply resistance past boundaries rather than a hard stop;
- hand release velocity into the settling animation;
- choose dismissal/snap from distance and velocity;
- keep keyboard/button alternatives for drag-only actions;
- test on real touch hardware.

Use a critically damped/no-bounce spring for general product UI. Add overshoot only when momentum or product character explains it.

## Layout and shared elements

Use `layout` for a React-rendered element changing size/position:

```tsx
<motion.div layout />
```

Use `layoutId` to connect visually identical elements across states:

```tsx
{active && <motion.div layoutId="active-tab" />}
```

Keep IDs unique within a layout group. Avoid shared-element animation on high-frequency selection when a fixed CSS transform is sufficient. Test scroll, border-radius/content distortion, nested transforms, and interruption.

Compare with native view transitions:

- Motion layout is usually easier to interrupt and stays in the live DOM.
- Native view transitions snapshot visual states, can cover document navigation with graceful fallback, and may freeze scrolling or interactive content while the overlay is active.
- Choose from the routing/navigation model and interaction behavior, not novelty.

Read [view-transitions.md](view-transitions.md) before choosing snapshot-based continuity.

## Presence

The conditional belongs inside `AnimatePresence`, and direct children need stable keys:

```tsx
<AnimatePresence initial={false} mode="wait">
  {open && (
    <motion.div
      animate={{ opacity: 1, transform: "scale(1)" }}
      exit={{ opacity: 0, transform: "scale(0.98)" }}
      initial={{ opacity: 0, transform: "scale(0.96)" }}
      key="panel"
    />
  )}
</AnimatePresence>
```

Use:

- default/sync for simultaneous enter/exit;
- `wait` for sequential keyed content;
- `popLayout` when exiting content should leave layout before the next state settles.

Set `initial={false}` for controls whose default state should not animate on page load. Keep it `true` for an intentional first-time entrance.

## Base UI

Use CSS lifecycle attributes for standard popup motion. For Motion on a Base UI element, use `render`, not Radix `asChild`:

```tsx
<Menu.Popup
  render={
    <motion.div
      animate={{ opacity: 1, transform: "scale(1)" }}
      initial={{ opacity: 0, transform: "scale(0.96)" }}
    />
  }
/>
```

For a self-managing popup whose exit needs Motion:

1. Hoist `open` state.
2. Put the conditional inside `AnimatePresence`.
3. Add `keepMounted` to the primitive Portal.
4. Animate the Popup through `render`.
5. Include at least one accelerated/detectable property such as opacity or transform on exit.

```tsx
<Popover.Root onOpenChange={setOpen} open={open}>
  <Popover.Trigger>Open</Popover.Trigger>
  <AnimatePresence>
    {open && (
      <Popover.Portal keepMounted>
        <Popover.Positioner>
          <Popover.Popup
            render={
              <motion.div
                animate={{ opacity: 1, transform: "scale(1)" }}
                exit={{ opacity: 0, transform: "scale(0.98)" }}
                initial={{ opacity: 0, transform: "scale(0.96)" }}
              />
            }
          />
        </Popover.Positioner>
      </Popover.Portal>
    )}
  </AnimatePresence>
</Popover.Root>
```

Verify against the installed Base UI version and current Motion integration guide.

## Motion+ decision

Use a Motion+ API already installed in the project when it removes meaningful custom work or supplies a tested behavior the free layers do not. Likely candidates include sophisticated text splitting/typing/scrambling, number animation, ticker/carousel/cursor behavior, advanced layout/page transitions, or an exact premium example requested by the user.

Before use:

- record account/example access separately from project runtime installation;
- confirm `motion-plus` or `@motionplus/core` is a project dependency/import before writing a premium import;
- search current docs/example source;
- verify import path and API stability (some premium APIs may be early access);
- evaluate accessibility and reduced-motion behavior;
- compare its shipped code/bundle with the existing free/CSS solution;
- adapt rather than copy visual styling.

Do not add Motion+ to produce a checkbox pop, button press, toggle thumb, or standard popup fade. If an official premium example is the user’s explicit visual target, inspect it first, then adopt only the behavior that survives the restraint and complexity gates.

If the premium runtime is not installed in the project, reproduce the intended behavior with existing project utilities, free Motion, CSS, Tailwind, or WAAPI—not a guessed premium API. Report Motion+ access as “available,” “unavailable,” or “unknown,” then report the project runtime separately and name the fallback that shipped.
