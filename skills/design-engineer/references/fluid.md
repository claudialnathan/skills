# Fluid and responsive

The math + tokens + units that let layouts scale without breakpoint cliffs.

The mental shift: stop asking "what should this be at the `sm`/`md`/`lg` breakpoint?" Start asking "what's the lower bound, what's the upper bound, and how should it interpolate?" The answer is almost always `clamp()`.

## `clamp(min, preferred, max)` — the workhorse

`clamp()` returns the *preferred* value, clamped between `min` and `max`. The "preferred" is usually a viewport-relative expression that interpolates between min and max.

```css
font-size: clamp(1rem, 0.9rem + 0.5vw, 1.25rem);
/*               ↑ lower    ↑ slope         ↑ upper */
```

**The slope-and-intercept form** (`Yrem + Xvw`) gives you a controlled rate of change. The viewport math:

- At a chosen min viewport (e.g., 320px = 20rem), the expression should equal `min`.
- At a chosen max viewport (e.g., 1280px = 80rem), the expression should equal `max`.
- Solve for the linear interpolation; the `Yrem + Xvw` form is the result.

For most cases, you don't need to do the math by hand:
```ts
// utility (drop in app/lib/fluid.ts or similar)
export function fluid(minRem: number, maxRem: number, minVw = 20, maxVw = 80) {
  const slope = (maxRem - minRem) / (maxVw - minVw)
  const intercept = minRem - slope * minVw
  return `clamp(${minRem}rem, ${intercept.toFixed(4)}rem + ${(slope * 100).toFixed(4)}vw, ${maxRem}rem)`
}

// Usage in @theme:
// --text-base: ${fluid(1, 1.125)};
```

**When the slope-and-intercept form doesn't matter**: a simple `clamp(min, Nvw, max)` is fine for forgiving cases (section padding, decorative whitespace). Reserve the tuned form for type ramps where the rate of change matters.

## Fluid type ramp at the token layer

In Tailwind v4, declare the ramp inside `@theme`. Components consume utilities; the ramp tunes itself.

```css
/* globals.css */
@theme {
  --text-xs:   clamp(0.75rem,  0.7rem  + 0.25vw,  0.875rem);
  --text-sm:   clamp(0.875rem, 0.8rem  + 0.375vw, 1rem);
  --text-base: clamp(1rem,     0.9rem  + 0.5vw,   1.125rem);
  --text-lg:   clamp(1.125rem, 1rem    + 0.625vw, 1.25rem);
  --text-xl:   clamp(1.25rem,  1rem    + 1.25vw,  1.5rem);
  --text-2xl:  clamp(1.5rem,   1.25rem + 1.25vw,  2rem);
  --text-3xl:  clamp(1.875rem, 1.5rem  + 1.875vw, 2.5rem);
  --text-4xl:  clamp(2.25rem,  1.75rem + 2.5vw,   3.5rem);

  --text-caption: 0.8125rem;
  --text-caption--line-height: 1.4;
}
```

Components stay token-driven:
```tsx
<h1 className="text-4xl">{title}</h1>
<p className="text-base">{body}</p>
```

**Pair with line-height tokens** if your design system needs them — Tailwind v4 picks up `--text-{name}--line-height` automatically.

## Fluid spacing ramp

The same shape, for padding, margin, gap. Fluid spacing makes section rhythm breathe with the viewport.

```css
@theme {
  --space-xs: clamp(0.25rem, 0.2rem + 0.25vw, 0.5rem);
  --space-sm: clamp(0.5rem,  0.4rem + 0.5vw,  0.75rem);
  --space-md: clamp(1rem,    0.8rem + 1vw,    1.5rem);
  --space-lg: clamp(1.5rem,  1.2rem + 1.5vw, 2.5rem);
  --space-xl: clamp(2rem,    1.5rem + 2.5vw, 4rem);
}
```

You usually don't need this for *uniform* component padding (Tailwind's `p-*` scale is fine via `--spacing`). Use it for **section-level rhythm**: `py-[var(--space-xl)]` between hero / feature / CTA blocks.

## `min()` and `max()` patterns

These compose cleanly with `clamp()` and stand alone for specific cases.

```css
/* Container with built-in gutters */
.container { width: min(100% - 2rem, 60ch); margin-inline: auto; }

/* Adaptive padding — fixed floor, fluid middle, fixed ceiling */
.section { padding: 1.5rem clamp(1rem, 5%, 3rem); }

/* Section rhythm with a minimum */
.section + .section { margin-top: max(8vh, 2rem); }

/* Touch-safe button — always at least 44px even with small font */
.icon-btn { width: max(44px, 2em); height: max(44px, 2em); }

/* iOS zoom prevention — input font never below 16px */
input, select, textarea { font-size: max(16px, 1rem); }
```

**The iOS gotcha is non-obvious**: any input with effective `font-size < 16px` triggers Safari's auto-zoom on focus, which shifts your layout. `max(16px, 1rem)` wins both ways: respects the user's root size, never drops below the zoom threshold.

## Container queries — component-scoped responsive

Container queries scope responsiveness to a component's *parent container width*, not the viewport. The right primitive when:

- The component is reusable across slots of varying widths (sidebar vs hero vs grid cell).
- You'd otherwise reach for a viewport breakpoint inside the component.

### Setup

```css
/* Mark the parent as a query container */
.card-shell { container-type: inline-size; }
/* Or: container: card / inline-size;  for named queries */
```

### Tailwind v4 form

```tsx
<div className="@container">
  <div className="flex flex-col @md:flex-row">
    <img className="w-full @md:w-48 aspect-video @md:aspect-square" />
    <div className="p-4">
      <h3 className="text-lg @md:text-xl @lg:text-2xl">{title}</h3>
      <p className="@md:line-clamp-3">{body}</p>
    </div>
  </div>
</div>
```

The `@md:`, `@lg:` prefixes query the nearest containment context. Default Tailwind v4 container query breakpoints: `@xs` (20rem) up through `@7xl` (80rem).

### Container query units

| Unit | Resolves to |
| :-- | :-- |
| `cqi` | inline-size of nearest query container (1cqi = 1% of container's inline size) |
| `cqb` | block-size of container |
| `cqw` | width (≡ `cqi` in horizontal writing modes) |
| `cqh` | height (≡ `cqb`) |

**Component-scoped fluid type**: type that scales with the *card*, not the viewport.
```css
.card-title { font-size: clamp(1rem, 5cqi, 1.5rem); }
```

A card in a sidebar (200px wide) uses `200 * 0.05 = 10px` for the preferred — clamped up to 1rem. The same card in a hero (1200px) uses `60px` — clamped down to 1.5rem. **One rule, contextually responsive.**

### When to skip container queries

- Page-level shells where the viewport *is* the relevant context.
- Components that always live in one slot at one width.
- Very simple cases where a single breakpoint suffices and adding a container is overkill.

## Viewport units — `dvh`/`svh`/`lvh` not `vh`

`vh` is broken on mobile: it doesn't account for the dynamic browser chrome (URL bar appears/disappears as you scroll), so `100vh` either causes a scrollbar or hides content under a chrome that isn't actually there.

| Unit | Behavior |
| :-- | :-- |
| `100vh`  | **Avoid.** Static viewport height; ignores mobile chrome. |
| `100dvh` | Dynamic — adapts as mobile chrome shows/hides. **The default for full-screen layouts.** |
| `100svh` | Smallest viewport height (mobile chrome at max). Use when content must always fit even with chrome. |
| `100lvh` | Largest viewport height (mobile chrome hidden). Use sparingly. |

**Tailwind v4**: `min-h-dvh`, `h-dvh`, `min-h-svh`, etc. Default to `dvh` for hero sections, full-screen modals, login screens.

```tsx
// Hero
<section className="min-h-dvh grid place-content-center">…</section>

// Login screen — content must always fit even with full chrome
<main className="min-h-svh grid place-content-center">…</main>
```

## `aspect-ratio` — kill content jump

```css
img, video, iframe { aspect-ratio: 16 / 9; }
.card-image       { aspect-ratio: 1 / 1; object-fit: cover; }
.placeholder      { aspect-ratio: var(--ratio, 16 / 9); }
```

Tailwind v4: `aspect-video` (16/9), `aspect-square` (1/1), `aspect-[3/2]` for arbitrary.

**Why this matters**: prevents Cumulative Layout Shift. If you don't reserve the box, the page jumps when the image loads. Always set aspect-ratio on images that aren't intrinsic-sized.

## Slope tracking — when not to use clamp

`clamp()` is for scaling. **Don't use it for binary state changes** (open/closed, mobile/desktop nav, hover/no-hover). Those still want media queries or container queries that produce a categorical change.

Anti-pattern: trying to interpolate between a hamburger and a horizontal nav with `clamp()`. Use `@container (min-width: …)` instead.

## When fluid is wrong

- **Categorical changes** (column count switching from 1 to 3): use container queries (or breakpoints if viewport-scoped).
- **Fixed UI chrome** (status bar, sticky headers with predictable height): use rems.
- **Designer-specified fixed values** that need to be exact (brand-mark sizing, logo dimensions): use rems.
- **Print media**: use mm/in/pt where applicable.

The rule isn't "clamp() everything." It's "consider whether the value scales with viewport — if yes, fluid; if no, fixed."

## Anti-patterns

- `font-size: 14px` on inputs (iOS zoom).
- `100vh` on full-screen layouts (mobile chrome).
- `grid-cols-1 sm:2 md:3 lg:4` ladder when a single `auto-fit` rule does it (see `layout.md`).
- Media query inside a reusable component (use container query).
- `clamp()` with `vw` and no `rem` floor (breaks user font-size scaling — clamp should always include `rem` in the slope to honor root font size).
- Hard-coded type scale per component instead of token-driven (drift accumulates as the codebase grows).
- **Inline arbitrary fluid utilities** — `text-[clamp(...)]`, `p-[clamp(...)]`, `gap-[clamp(...)]`. Configure the ramp at `@theme` once; let components consume named tokens (`text-xl`, `py-section-lg`). Inline arbitrary clamps are token-system bypasses; each one drifts the codebase further from the configured scale.
- Applying fluid type/spacing on a project that hasn't configured a fluid ramp at `@theme`. Propose configuring the ramp first; don't quietly start sprinkling clamps that no other component shares.

## Further reading

- modern-css.com — fluid layout and intrinsic sizing recipes.
- Utopia.fyi — fluid type and space calculator (web tool).
- Josh Comeau's CSS for JS (paid course) — clamp() chapter is the deepest treatment.
- Stephanie Eckles' modern-css articles on `min()` / `max()` / `clamp()`.
