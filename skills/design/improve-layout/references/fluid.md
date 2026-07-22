# Fluid and responsive

The math + tokens + units that let layouts scale without breakpoint cliffs. Owner tags: **tw** native utility · **css** hand-rolled at the token layer.

The mental shift: stop asking "what should this be at `sm`/`md`/`lg`?" Ask "is this a continuous scale or a categorical change; if it scales, what are the lower bound, upper bound, and rate?" The answer for continuous values is often `clamp()` — configured once at `@theme`, consumed as a token. Keep a breakpoint/container query when the design intentionally changes state.

## `clamp(min, preferred, max)` — the workhorse — css

`clamp()` returns the *preferred* value, bounded by `min`/`max`. The preferred is a viewport- (or container-) relative expression:

```css
font-size: clamp(1rem, 0.9rem + 0.5vw, 1.25rem);
/*               ↑ lower   ↑ slope        ↑ upper */
```

The **slope-and-intercept form** (`Yrem + Xvw`) gives a controlled rate of change: at a chosen min viewport the expression equals `min`, at a chosen max it equals `max`. Solve the linear interpolation:

```ts
// app/lib/fluid.ts
export function fluid(minRem: number, maxRem: number, minVw = 20, maxVw = 80) {
  const slope = (maxRem - minRem) / (maxVw - minVw)
  const intercept = minRem - slope * minVw
  return `clamp(${minRem}rem, ${intercept.toFixed(4)}rem + ${(slope * 100).toFixed(4)}vw, ${maxRem}rem)`
}
```

Always include a `rem` term in the slope so user font-size scaling is honored — `clamp()` with only `vw` breaks zoom. For forgiving cases (section padding, decorative whitespace) a bare `clamp(min, Nvw, max)` is fine; reserve the tuned form for type ramps where the rate matters.

## Fluid type ramp at the token layer — css + tw

In Tailwind v4 declare the ramp inside `@theme`; components consume utilities (`text-xl`), and the ramp tunes itself. A `--text-*` token auto-pairs its companions — `--text-*--line-height`, `--text-*--letter-spacing`, `--text-*--font-weight` — confirmed in the v4 font-size docs.

```css
/* globals.css */
@theme {
  --text-sm:   clamp(0.875rem, 0.8rem  + 0.375vw, 1rem);
  --text-base: clamp(1rem,     0.9rem  + 0.5vw,   1.125rem);
  --text-lg:   clamp(1.125rem, 1rem    + 0.625vw, 1.25rem);
  --text-xl:   clamp(1.25rem,  1rem    + 1.25vw,  1.5rem);
  --text-2xl:  clamp(1.5rem,   1.25rem + 1.25vw,  2rem);
  --text-4xl:  clamp(2.25rem,  1.75rem + 2.5vw,   3.5rem);
  --text-2xl--line-height: 1.15;
}
```

The `/` modifier overrides line-height per use: `text-2xl/6`.

> **Caveat (undocumented-but-valid):** a `clamp()` value in a `--text-*`/`--spacing`/`--container-*` token is valid CSS and works because `@theme` tokens are plain custom properties — but Tailwind's own docs show **no** fluid-clamp token example. Treat it as "works because it's just CSS," not a documented Tailwind pattern; keep the ramp small and readable so a teammate isn't debugging an undocumented mechanism.

## Fluid spacing ramp — css

Same shape for padding/margin/gap, for **section-level rhythm** (not uniform component padding — Tailwind's `p-*` scale via `--spacing` is fine there):

```css
@theme {
  --space-md: clamp(1rem,   0.8rem + 1vw,    1.5rem);
  --space-lg: clamp(1.5rem, 1.2rem + 1.5vw,  2.5rem);
  --space-xl: clamp(2rem,   1.5rem + 2.5vw,  4rem);
}
```

Consume as `py-(--space-xl)` (the v4 CSS-var shorthand) between hero / feature / CTA blocks.

**`--spacing` and `theme()`:** the numeric spacing scale derives from a single `--spacing` base; reference it in a calc with the `--spacing(n)` function → `py-[calc(--spacing(4)-1px)]` = `calc(var(--spacing) * 4) - 1px`. **`theme()` is deprecated in v4** — prefer CSS variables (`var(--color-primary)`) or `--spacing()`/`--alpha()`. Retain `theme()` only for compatibility contexts such as media-query values where CSS variables cannot be used.

## `min()` / `max()` patterns — css

```css
.container { width: min(100% - 2rem, 60ch); margin-inline: auto; }   /* gutters built in */
.section   { padding: 1.5rem clamp(1rem, 5%, 3rem); }               /* fixed floor, fluid mid, fixed ceiling */
.icon-btn  { width: max(44px, 2em); height: max(44px, 2em); }       /* touch target never below 44px */
input, select, textarea { font-size: max(16px, 1rem); }            /* iOS zoom floor */
```

The **iOS floor is non-obvious**: any input with effective `font-size < 16px` triggers Safari's auto-zoom on focus, shifting the layout. `max(16px, 1rem)` respects the user's root size and never drops below the threshold.

## Container-query units — component-scoped scaling — tw

When a component is reused across slots of varying widths, scale to the *container*, not the viewport. Mark it `@container` (named `@container/main`), then:

| Unit | Resolves to |
| :-- | :-- |
| `cqi` | inline-size of nearest query container (1cqi = 1%) |
| `cqb` | block-size |
| `cqw` / `cqh` | width / height |

```tsx
<h3 className="text-[clamp(1rem,5cqi,1.5rem)]">{title}</h3>
```
A card at 200px uses `10px` for the preferred (clamped up to 1rem); the same card at 1200px uses `60px` (clamped down to 1.5rem). One rule, contextually responsive. Query-length units also work in size utilities: `w-[50cqi]`. See `layout.md` for `@container`/`@md:` structural queries and the name-only variant.

## Viewport units — `dvh`/`svh`/`lvh`, and `stretch` — tw

`100vh` is unsafe for viewport-filling mobile UI because its static viewport can disagree with dynamic browser chrome, causing overflow or hidden content.

| Unit | Behavior |
| :-- | :-- |
| `100vh`  | **Avoid.** Static; ignores mobile chrome. |
| `100dvh` | Dynamic — adapts as chrome shows/hides. **Default for full-screen.** (`min-h-dvh`) |
| `100svh` | Smallest viewport (chrome shown). Use when content must always fit — login screens. (`min-h-svh`) |
| `100lvh` | Largest viewport (chrome hidden). Rare. |

For "fill the containing block respecting margins," the **`stretch`** sizing keyword applies to the margin box rather than the content/border box, avoiding some `100%` + margin `calc()` hacks: `w-[stretch]` / `h-[stretch]`. Treat it as progressive until the project's browser floor is verified; Grid stretch or Flex `flex-1` remains the robust answer for the parent-height case. See the height-enigma section in `layout.md`.

## `aspect-ratio` — kill content jump — tw

```tsx
<img className="aspect-video w-full object-cover" />   {/* or aspect-square, aspect-[3/2] */}
```

Reserve the box so the page doesn't jump when media loads (CLS). Prefer correct intrinsic `width`/`height` attributes on images; use `aspect-*` when the rendered crop/container needs an explicit ratio. `aspect-video` = 16/9, `aspect-square` = 1/1, `aspect-[3/2]` arbitrary.

## When fluid is wrong

`clamp()` is for *scaling*. Don't use it for **binary state changes** (open/closed, mobile/desktop nav, column count 1→3) — those want a container query (or a viewport breakpoint if viewport-scoped) that produces a categorical change. Also fixed: predictable UI chrome (sticky header heights) → rem; designer-specified exact values (logo, brand mark) → rem; print → mm/pt.

The rule isn't "clamp() everything." It's "does this value scale with its context — if yes, fluid; if no, fixed."

Verify a fluid ramp at 200% zoom, at both viewport bounds, with the longest supported language/content, and with the project's minimum font size. A mathematically valid ramp can still create wrapping, clipping, or hierarchy regressions.

## Anti-patterns

- Inline arbitrary fluid utilities — `text-[clamp(...)]`, `p-[clamp(...)]` for *page/viewport* scaling. Configure the ramp at `@theme` once; consume named tokens. (Container-scoped `text-[clamp(…,cqi,…)]` on a component is the deliberate exception.)
- `clamp()` with `vw` and no `rem` floor — breaks user font-size scaling.
- `font-size: 14px` on inputs — iOS zoom.
- `100vh` / `min-h-screen` on full-screen layouts — mobile chrome.
- `theme(...)` in v4 — deprecated; use CSS vars / `--spacing()`.
- Hard-coded per-component type scale instead of tokens — drift accumulates.
- Applying a fluid ramp to a project that hasn't configured one at `@theme` — propose the ramp first; don't sprinkle clamps no other component shares.
