---
name: design-motion
description: "Frequency-aware motion discipline for Tailwind v4 + shadcn (Base UI) + Next.js. The master rule: novelty is inversely proportional to frequency — most UI surfaces should not animate, and the ones that should reach framework-native tools first (Tailwind transition/animate utilities, tw-animate-css, Base UI data-starting-style) before Motion. Compositor-only properties, origin-aware scaling, reduced-motion at the token layer. Use when adding, reviewing, or removing any animation or transition, choosing easing, duration, or springs, wiring Motion to Base UI popups, or deciding whether a surface should animate at all."
compatibility: Tailwind v4 + shadcn (Base UI) + Next.js
paths:
  - '**/components/**/*.{ts,tsx,jsx}'
  - '**/app/**/*.{tsx,jsx,mdx}'
  - '**/pages/**/*.{tsx,jsx,mdx}'
  - '**/src/components/**/*.{ts,tsx,jsx}'
  - '**/{globals,app,tailwind,index}.css'
  - '**/styles/**/*.css'
---

# design-motion

Your untrained default is universal novelty — every button gets hover motion, every modal gets fade-scale, every list gets stagger — and most of it should be deleted. **The attention shift this skill makes: before any easing or duration question, ask *who sees this how often*.** The craft questions only exist for surfaces that survive that filter.

Apply the principles within the framework's conventions: custom keyframes and durations live at Tailwind's `@theme` (`--animate-*`, `--duration-*`), not as inline arbitrary utilities; Base UI composes through `render`, not Radix's `asChild`.

## The master rule: frequency × novelty

| User encounters this... | Novelty allowed |
| :--- | :--- |
| 100+/day (keyboard shortcuts, command palette, list selection, scroll, button presses) | **Zero.** No animation. Open instantly. The only delight allowed is microscopic confirmation (an accent-color blink). |
| Tens/day (hover, dropdown, list nav) | **Minimal.** Sub-200ms, custom ease-out, transform/opacity only. |
| Occasional (modal, drawer, toast, sheet) | **Standard.** 180–280ms. Origin-aware. |
| Rare / first-time (onboarding, login transition, milestone, marketing hero) | **Permitted.** Choreographed sequences, springs, decorative motion can earn their keep. |

The 90/10 ratio: **90% of an interface is quiet/familiar; 10% is the novel accent.** The mechanism is semantic satiation — a flourish repeated everywhere loses its meaning the way a repeated word does, so universal novelty erases the contrast that makes the 10% land. The audience modifier: productivity-tool users pay novelty tax (every unfamiliar pattern is a learning cost they didn't ask for); entertainment apps actively seek it.

Worked examples on shadcn primitives:

| Component | Frequency | Default treatment | Reason |
| :-- | :-- | :-- | :-- |
| `cmdk` / Command palette | 100+/day for power users | No animation. Open instantly. | Repeated motion at this frequency stops being delight, becomes tax. |
| `Tooltip` | dozens/day | First open delays 700ms; subsequent in same area instant. | Initial delay prevents accidental activation; subsequent instant feels faster. |
| `DropdownMenu` | dozens/day | Sub-200ms ease-out fade+scale, origin-aware. | Visible enough to confirm action, fast enough to not read as slow. |
| `Toast` | dozens/day | 180ms enter, 140ms exit, slide+fade. | Frequent but transient — exit faster than enter so it doesn't linger. |
| `Dialog` | occasional | 200–280ms fade+scale from center. | Big visual change; needs spatial continuity, but still under 300ms. |
| `Drawer` / `Sheet` | occasional | 280–400ms iOS-like slide. | The motion *is* the spatial metaphor; longer is allowed. |
| Onboarding sequence | once | Choreographed, 400–800ms, can carry stagger and decorative motion. | One-time experience; novelty earns its keep. |

## The hierarchy of reach (stop at the first that fits)

1. **Tailwind's built-in utilities** — `transition-*`, `duration-*`, `ease-*`, `animate-*` for hover, focus, simple state changes; shadcn 4.x's `tw-animate-css` (`animate-in fade-in-0 zoom-in-95 slide-in-from-top-2`) for popup-class enter/exit, which composes with Base UI's lifecycle automatically. Most "fade this in" / "scale on hover" / "slide drawer in" cases end here. Custom keyframes live at `@theme` via `--animate-*`, never inline `animate-[...]` strings.
2. **CSS transitions targeting Base UI's `[data-starting-style]` / `[data-ending-style]`** — when Tailwind utilities don't cover it on a Base UI primitive (custom timing, multi-property orchestration, origin-aware scaling). Cheap, no JS, correct interruption behavior.
3. **Motion via the `render` prop** — when the animation is state-derived (`animate={{ scale: open ? 1 : 0.95 }}`), needs spring physics, gestures, or layout animations CSS can't express.
4. **Motion + AnimatePresence + `keepMounted` Portal** — for popup-class components (Dialog, Popover, Menu, Tooltip, AlertDialog) needing complex enter/exit that Motion handles better than CSS.

## Hard rules

- Animate only `transform`, `opacity`, `filter`, `clipPath` — these run on the compositor; the rest cause layout/paint.
- Exit objects must include at least one hardware-accelerated property (`opacity: 0` is the cheap satisfier). Animating `height` alone on exit triggers a mount race in Base UI.
- AnimatePresence wraps the conditional, not the other way around: `<AnimatePresence>{open && <X key="x" />}</AnimatePresence>`.
- `prefers-reduced-motion` lives at the *token* layer (a `--duration-fast` variable that collapses to `0.01ms` in the media query). Components consume the token; never inline durations.
- Set `transform-origin` — popovers scale from their trigger, not from center; modals are the exception (no trigger anchor).
- Animated blur: radius ≤ 8px, one-shot, small surfaces; large or continuous blur fades opacity instead.
- Every animation you commit gets its one-line *why*, with the frequency call stated. If you can't state it, you don't have the call yet.

## Review output contract

When reviewing existing UI code, present every change as a markdown table with **Before** and **After** columns — every change made or proposed, not a subset; never loose "Before:" / "After:" lines outside a table. Group changes by principle with a heading above each table, and keep each row to a single diff so the whole list scans quickly. Write every **After** snippet in the styling system the project already uses, carry the one-line reason with each row, and cite `file:line` when it isn't obvious from the snippet. A principle that was reviewed and needed nothing gets no table at all.

## Pre-ship for motion work

- [ ] Every added animation states its frequency × novelty match; a 100+/day surface got none.
- [ ] Duration ≤ 300ms outside the rare/first-time tier; only `transform`/`opacity`/`filter`/`clipPath` animated.
- [ ] Framework-native layer tried before Motion; Motion imports justified by state-derivation, springs, or gestures.
- [ ] Base UI popup animations use hoist + `keepMounted` + AnimatePresence; exit objects include opacity.
- [ ] `transform-origin` set on scaling popups; `prefers-reduced-motion` covered at the token layer, not per component.
- [ ] No `transition: all`, and no Tailwind bare `transition` without a property specifier.

Sibling disciplines, each standalone when installed: `design-layout` (structure and fluid sizing), `design-polish` (the proactive detail list), `design-taste` (stating the reason), `shadcn-tailwind` (token mechanics and Base UI data attributes — auto-loads on the same files).

## References

| File | Scope |
| :--- | :--- |
| [`references/animation-craft.md`](references/animation-craft.md) | Easing decision tree and custom curves, duration tables, springs, enter/exit discipline, clip-path patterns, gesture mechanics, performance internals, reduced motion. |
| [`references/motion-base-ui.md`](references/motion-base-ui.md) | Motion + Base UI integration: `render` prop, hoist + `keepMounted` + AnimatePresence, CSS `@starting-style` alternative, `linear()` springs, scroll-driven animations. |

Open one file at a time; the body is the always-on layer, references are on-demand depth.
