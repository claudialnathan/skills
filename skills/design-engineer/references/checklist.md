# Pre-ship checklist for UI work

Walk this at the end of any UI task before saying "done." Group by concern; tick or fix.

## Layout

- [ ] Used a layout primitive (Stack / Cluster / Sidebar / Switcher / Cover / Center / Grid / Box) where applicable, or stated reason not to.
- [ ] Container query (`@container`, `cqi`) before viewport breakpoint for any reusable component.
- [ ] Universal container pattern: `width: min(100% - 2rem, <max>); margin-inline: auto` (or Tailwind `mx-auto px-* max-w-*` ladder where it composes cleanly).
- [ ] Auto-fit grid (`repeat(auto-fit, minmax(min(100%, X), 1fr))`) instead of `grid-cols-1 sm:2 md:3` ladder.
- [ ] Stack-overlay grid (one cell, layered children) instead of `position: absolute` for overlays.
- [ ] Subgrid for cross-card alignment where rows must match.
- [ ] No media queries inside reusable components (they belong on page-level shells).

## Tokens (composes with `shadcn-tailwind`)

- [ ] No `px` anywhere in lengths. All values rem.
- [ ] No `#hex` anywhere. Colors via semantic tokens or `oklch(…)`.
- [ ] No raw palette colors (`bg-zinc-100`, `text-red-500`) without a justified reason.
- [ ] Named utility tried before arbitrary (`min-h-15` before `[3.75rem]`).
- [ ] `--font-weight-*` token confirmed before reaching for `font-medium`/`font-semibold`.
- [ ] `render` prop used, not `asChild` (Base UI, not Radix).
- [ ] State variants use `data-[state=...]` attribute selectors, not className branching.

## Fluid

- [ ] Type ramp uses `clamp()` at the token layer, not per-component.
- [ ] Section padding fluid (`clamp` or `min`/`max`) where the content scales.
- [ ] `dvh`/`svh` instead of `vh` on full-screen layouts.
- [ ] Form inputs `font-size: max(16px, 1rem)` (iOS zoom prevention).
- [ ] Container queries used for component-scoped responsive type (`5cqi` etc.).

## Motion

- [ ] Frequency × novelty match stated for every animation.
- [ ] Duration ≤ 300ms (or marketing/onboarding exception with a stated reason).
- [ ] Reason articulated for each animated property.
- [ ] Properties limited to `transform`, `opacity`, `filter`, `clipPath`.
- [ ] `transform-origin` set from trigger (`var(--transform-origin)` for Base UI), or `center` for modals (no trigger anchor).
- [ ] Easing is a custom curve at the token layer, not stock `ease-in-out`.
- [ ] Never `ease-in` for UI animation (starts slow, feels sluggish).
- [ ] If popup-class component animates: hoist + `keepMounted` + AnimatePresence pattern.
- [ ] Exit object includes `opacity` (or another compositor property) so Base UI's animation detection fires.
- [ ] AnimatePresence wraps the conditional, not the other way around.
- [ ] Stable `key` on every direct child of AnimatePresence.
- [ ] No animation on keyboard-driven actions (command palette, list nav, shortcut-triggered states).
- [ ] `prefers-reduced-motion` covered at the token layer (one media query, every component).
- [ ] No `transition: all` (or bare Tailwind `transition` without a property suffix).
- [ ] CSS transitions for interruptible UI, keyframes only for one-shot sequences.

## Polish (apply unprompted)

- [ ] Concentric radii — outer = inner + padding on every nested rounded surface.
- [ ] Optical alignment checked on icon-with-text buttons, play triangles, asymmetric icons.
- [ ] Shadows over borders where depth is implied.
- [ ] Focus-visible ring on every interactive element (`outline: max(2px, 0.08em) solid currentColor; outline-offset: 0.15em`).
- [ ] Image outlines added (10% pure black light / 10% pure white dark — never tinted).
- [ ] `tabular-nums` on every changing number (counter, price, timer).
- [ ] `text-balance` on headings; `text-pretty` on paragraphs.
- [ ] `:active scale(0.97)` on buttons (never below 0.95).
- [ ] Hit area ≥ 40×40px (pseudo-element extension if visible target smaller).
- [ ] `scrollbar-gutter: stable` on scroll containers.
- [ ] `scroll-margin-top` on anchored sections (clears sticky header).
- [ ] `-webkit-font-smoothing: antialiased` at root (macOS).
- [ ] `will-change` only on `transform`/`opacity`/`filter`, only when first-frame stutter observed.
- [ ] `initial={false}` on AnimatePresence at app shell (no enter on first paint).
- [ ] Stagger limited to 30–80ms between items.
- [ ] Backdrop blur for overlays (Z-axis demotion); edge-fade masks on horizontal scrollers.
- [ ] Safe-area insets on fixed/sticky bars; `viewport-fit=cover` set in viewport meta.
- [ ] `z-index` from the token scale; no `z-[N]` arbitrary.
- [ ] Looping animations paused off-screen (IntersectionObserver or scroll-timeline).
- [ ] No animated `tracking-*`; animated blur radius ≤ 8px, one-shot, small surfaces only.
- [ ] `AlertDialog` (not `Dialog`) for destructive/irreversible actions.

## Anti-slop (taste-layer reflex)

- [ ] No decorative purple/multicolor gradients on cards or panels (one subtle hero gradient max — if briefed).
- [ ] No glow effects (`shadow-[0_0_…px_<color>]`, neon outlines) as primary affordances.
- [ ] One accent color per view; second only if it earned the seat.

## Accessibility

- [ ] Focus order matches visual order.
- [ ] `aria-live="polite"` on toast / status; `role="alert"` on errors.
- [ ] `aria-label` on icon-only buttons.
- [ ] Semantic `type` and `inputMode` on form inputs (`type="email"`, `inputMode="numeric"`, `autoComplete="…"`).
- [ ] Color is not the only signal (icon or text accompanies status colors).
- [ ] Alt text descriptive (or `alt=""` on decorative images).
- [ ] Keyboard-only path tested (tab through; every interactive reachable; focus visible).
- [ ] Modals and sheets have a clear close affordance (escape key + visible button).
- [ ] Heading hierarchy sequential (h1 → h2 → h3, no level skip).
- [ ] Touch targets ≥ 44×44pt on mobile (the ≥40px floor + 8px gap from the next element).

## States

- [ ] Empty state with a real message and suggested action (not a blank panel).
- [ ] Loading state via skeleton (preserves layout) for any wait > 300ms.
- [ ] Error state with recovery path (retry button or actionable message — not just "Error").
- [ ] Disabled state visually distinct (reduced opacity 0.5–0.6, `cursor-not-allowed`).
- [ ] Read-only state distinct from disabled.

## Vercel-specific

When the user explicitly asks for "review" or "audit":

- [ ] Ran `web-design-guidelines` against the changed files. That skill's checklist is canonical for Vercel-specific rules; this checklist is the always-on baseline.

## Composition

- [ ] If deep animation craft was needed (easing internals, springs, clip-path, gestures): `emil-design-eng` was invoked rather than reinvented inline.
- [ ] If working in shadcn 4.x / Base UI / Tailwind v4 / Next.js: `shadcn-tailwind` discipline was applied (auto-loads on UI files; this skill cross-references but doesn't duplicate).

## Reason articulation

- [ ] Every taste call (scale value, duration, easing, radius, shadow, color choice) has a stated *why* — in code review, in commit message, mentally for routine ones.
- [ ] If the same value appeared three times, it's now a token; if it's a token, the token name reflects intent (`--ease-out` not `--ease-1`).

## Final pass

- [ ] Read the diff straight through, looking for: arbitrary values that should be tokens, raw palette colors that should be semantic, `asChild` that should be `render`, `vh` that should be `dvh`, hardcoded durations that should be tokens.
- [ ] Type-check passed (TypeScript / `tsc --noEmit`).
- [ ] If interactive: clicked through it in a browser. Tested keyboard. Tested at small viewport. Tested with `prefers-reduced-motion: reduce`.

## When a check fails

Don't disable the check. Fix the underlying choice. Most failures here are from:

1. Reaching for a default (e.g., `transition all`) before considering the right tool.
2. Skipping the layout primitives and composing flex/grid by hand.
3. Animating something the user sees frequently (frequency × novelty mismatch).
4. Adding novelty for novelty's sake (90/10 rule).

Each fix is a learning. The next time you reach for the wrong default, the gap is shorter.
