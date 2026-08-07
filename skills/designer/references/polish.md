# Visual and interaction finish

Full reasoning per item. Most are micro-details a user never consciously registers; they are applied unprompted on every UI surface unless there is a stated reason not to. The behavioral half — states, forms, navigation, copy — is in [behavior.md](behavior.md).

## 1. Concentric border radius

Outer radius = inner radius + padding. Mismatched nested radii is the loudest visual smell — surfaces look like they don't belong together.

```tsx
// Wrong — same radius on both
<div className="rounded-2xl p-6">
  <button className="rounded-2xl">…</button>
</div>

// Right — outer 24px, inner 16px (padding 8px = 24-16)
<div className="rounded-2xl p-2">
  <button className="rounded-xl">…</button>
</div>

// Right — outer 16px, inner 8px (padding 8px)
<div className="rounded-2xl p-2">
  <div className="rounded-lg">…</div>
</div>
```

**The math**: when a rounded element nests inside a rounded element with padding, the inner radius should be `outer_radius - padding` so the curves stay visually concentric.

**Tailwind v4 token shape**:
```css
@theme {
  --radius-xs:  0.25rem;  /* 4px  */
  --radius-sm:  0.375rem; /* 6px  */
  --radius:     0.5rem;   /* 8px  */
  --radius-md:  0.625rem; /* 10px */
  --radius-lg:  0.75rem;  /* 12px */
  --radius-xl:  1rem;     /* 16px */
  --radius-2xl: 1.5rem;   /* 24px */
}
```

When in doubt: take a screenshot, draw the concentric curves, compare to what's rendered.

## 2. Optical alignment over geometric

Geometric centering puts the bounding box at the center. **Optical centering puts the visual weight at the center**, which is what humans perceive.

Common cases:
- **Play-button triangles** — the geometric centroid of a triangle isn't at the visual center; nudge it 1–2px right of geometric center.
- **Asymmetric icons** (chevron, arrow) — pad asymmetrically so the *visual mass* is centered.
- **Button with leading icon** — geometric centering puts the text-icon group's center at the button's center; optical centering shifts the text slightly to compensate for the icon's heavier visual weight.

```tsx
// Geometric — text feels off-center to the right
<Button><Icon /> Click me</Button>

// Optical — visual weight balanced
<Button className="pl-3 pr-4"><Icon /> Click me</Button>
```

Writing `flex items-center justify-center` and still seeing it look off is the cue to optically align.

## 3. Shadows over borders for depth

Solid borders read as flat lines and don't adapt to the surface beneath. Layered transparent shadows read as depth and adapt to any background.

```css
@theme {
  --shadow-sm:
    0 1px 0 rgb(0 0 0 / 0.04),
    0 1px 2px rgb(0 0 0 / 0.06);
  --shadow:
    0 1px 0 rgb(0 0 0 / 0.04),
    0 2px 6px rgb(0 0 0 / 0.06),
    0 8px 16px rgb(0 0 0 / 0.04);
  --shadow-md:
    0 1px 0 rgb(0 0 0 / 0.05),
    0 4px 8px rgb(0 0 0 / 0.06),
    0 12px 24px rgb(0 0 0 / 0.06);
}
```

**Pre-rendered shadow trick**: don't animate `box-shadow`, which triggers repaints. Pre-render the shadowed state on a pseudo-element and toggle its opacity:

```css
.card                   { position: relative; }
.card::after {
  content: "";
  position: absolute; inset: 0;
  border-radius: inherit;
  box-shadow: var(--shadow-md);
  opacity: 0;
  transition: opacity 200ms;
  pointer-events: none;
}
.card:hover::after      { opacity: 1; }
```

Borders aren't *wrong* — they're the right call for a flat hairline between surfaces. For "card lifts off the page", reach for shadow.

## 4. Focus rings — `currentColor` outline

The universal pattern, set once at the global layer:

```css
:focus-visible {
  outline: max(2px, 0.08em) solid currentColor;
  outline-offset: 0.15em;
}
```

**Why `currentColor`**: the focus ring matches the element's text color, so it adapts to dark mode, error states and contextual color shifts automatically. **One rule for the whole app.**

For component-internal focus rings where `outline` would be clipped by `overflow: hidden`, use the double-shadow pattern:

```css
:focus-visible {
  box-shadow:
    0 0 0 2px var(--color-background),
    0 0 0 4px var(--color-ring);
}
```

The inner shadow matches the page background to create a halo gap; the outer shadow is the visible ring. Robust across components and color contexts.

**Never** remove focus styles without replacing them. `outline: none` with no alternative is an accessibility violation.

## 5. Image outlines — 10% pure black / pure white

Adds a subtle edge to images for consistent depth. Critical: the outline must be **pure** black or white, never tinted.

```css
img {
  outline: 1px solid rgb(0 0 0 / 0.1);
  outline-offset: -1px;
}

.dark img {
  outline-color: rgb(255 255 255 / 0.1);
}
```

Or via a token:
```css
@theme {
  --color-image-outline: rgb(0 0 0 / 0.1);
}
.dark { --color-image-outline: rgb(255 255 255 / 0.1); }

img { outline: 1px solid var(--color-image-outline); outline-offset: -1px; }
```

**Why pure**: a tinted neutral picks up the surface color underneath and reads as dirt on the image edge. Pure black or white is mathematically clean and always works.

## 6. `tabular-nums` on changing numbers

`font-variant-numeric: tabular-nums` makes all digits the same width. Without it, "9" (narrow) and "0" (wide) cause visible per-digit shifts in counters, timers and prices.

```tsx
<span className="tabular-nums">{count}</span>
<span className="tabular-nums">{price.toFixed(2)}</span>
<time className="tabular-nums">{time}</time>
```

Or set on the root for app-wide adoption — it costs nothing visually for static text and fixes every dynamic counter:
```css
:root { font-variant-numeric: tabular-nums; }
```

**Always apply** to anything that updates: counters, timers, currency, percentages, vote counts.

## 7. Text wrap — balance and pretty

```css
h1, h2, h3, h4, h5, h6 { text-wrap: balance; }
p, li, blockquote      { text-wrap: pretty; }
```

- `balance` evenly distributes lines, eliminating the one-word-last-line smell on headings.
- `pretty` avoids orphans and very short last lines in body text.

**Set once at the type layer**, not per component. Tailwind v4: `text-balance`, `text-pretty`.

## 8. Scale on press — `:active` feedback

Every pressable element should respond to press. The reflex value is `scale(0.97)`; never go below `0.95`.

```tsx
<Button className="active:scale-[0.97] transition-transform duration-150">
  Click
</Button>
```

**Why subtle**: a heavy scale-down (0.85, 0.9) reads as broken, not tactile. Subtle (0.95–0.98) reads as the interface acknowledging the press.

**Apply to**: buttons, pressable cards, list rows, anything with an `onClick`.

## 9. Hit area — 40×40px floor (44 for AAA / primary touch)

Every interactive element needs at least 40×40px of touchable area. The hard floor is **24×24 CSS pixels** (WCAG 2.2 SC 2.5.8, Level AA) — smaller fails outright unless the spacing exception applies. **44×44 CSS pixels** is the WCAG SC 2.5.5 (AAA) recommendation and the Apple HIG target size; reach for 44 on primary touch surfaces or apps targeting AAA. 40 is a pragmatic floor that clears AA comfortably while respecting compact density on dense desktop UIs.

The visible target can be smaller; **extend the hit area with a pseudo-element**:

```css
.icon-btn {
  position: relative;
  width: 24px; height: 24px;
}
.icon-btn::before {
  content: "";
  position: absolute;
  inset: -8px;        /* extends 8px on every side: 24+16 = 40px */
}
```

Tailwind v4:
```tsx
<button className="relative h-6 w-6 before:absolute before:-inset-2 before:content-['']">
  <Icon />
</button>
```

**Hit areas of two adjacent elements should never overlap** — a tap on the boundary is ambiguous. Test by triggering hits at the edge.

## 10. `scrollbar-gutter: stable` on scroll containers

Prevents layout shift when content goes from "fits" to "overflows":

```css
.scroll-region { overflow-y: auto; scrollbar-gutter: stable; }

/* Or app-wide */
html { scrollbar-gutter: stable; }
```

**`stable both-edges`** keeps the gutter symmetrical even when no scrollbar is needed — useful when content alignment matters, as in a centered hero.

## 11. `scroll-margin-top` on anchored sections

Sticky headers cover anchor-link targets. `scroll-margin-top` fixes it:

```css
[id] { scroll-margin-top: 4rem; }  /* matches the sticky header height */
```

Or per-section in JSX:
```tsx
<section id="features" className="scroll-mt-16">…</section>
```

Set once at the global layer using `[id]`. Per-section opt-out is cheaper than per-section opt-in.

The same trick covers keyboard focus. WCAG 2.2 (SC 2.4.11) requires that a focused element is not entirely hidden by author-created sticky content — headers, footers, toolbars. One global rule handles it:

```css
:focus {
  scroll-margin-top: 5rem;     /* sticky header height */
  scroll-margin-bottom: 4rem;  /* sticky footer / toolbar height */
}
```

## 12. Font smoothing on macOS

```css
html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
```

Crisper text on Retina macOS displays. Set at the root.

**Don't** apply `subpixel-antialiased` to dark backgrounds — it reads as fuzzy, and default rendering is already correct on dark backgrounds in modern browsers.

## 13. No `transition: all`

Always specify properties:

```css
.thing { transition: transform 200ms, opacity 200ms; }
/* Not: transition: all 200ms; */
```

**Why**: `transition: all` animates layout properties — width, height, padding, margin, top, left — which trigger reflow and repaint and drop frames. Explicit properties keep the work on the compositor track.

Tailwind: prefer `transition-transform`, `transition-colors`, `transition-opacity` over a bare `transition`.

## 14. `will-change` only when needed

`will-change` hints to the browser to promote a layer. Useful for first-frame stutter; expensive when over-applied.

- Only on `transform`, `opacity`, `filter` — the compositor properties.
- Only after observing first-frame stutter.
- **Never `will-change: all`**, which promotes the entire element and defeats the purpose.

```css
/* Good — opt-in for a known-heavy animation */
.heavy-animation { will-change: transform; }
```

## 15. `prefers-reduced-motion` at the token layer

```css
@theme {
  --duration-fast: 180ms;
  --duration-medium: 240ms;
  --duration-slow: 320ms;
}

@media (prefers-reduced-motion: reduce) {
  @theme {
    --duration-fast: 0.01ms;
    --duration-medium: 0.01ms;
    --duration-slow: 0.01ms;
  }
}
```

Components consume the variable; one media query covers everything. Don't write per-component `prefers-reduced-motion` branches.

Where reduced motion should still permit *opacity* changes but skip *transform* changes — the vestibular concern — branch per property, but this is rare.

## 16. Depth via blur, edge fade and stagger

Depth comes from layering, blur and asynchronous timing, not from perspective transforms.

**Backdrop blur** as Z-axis demotion:
```css
.overlay-bg { backdrop-filter: blur(12px); background: rgb(0 0 0 / 0.4); }
```

**Edge fades** suggest space continuing:
```css
.scroll-row {
  mask-image: linear-gradient(
    to right,
    transparent 0,
    black 1rem,
    black calc(100% - 1rem),
    transparent 100%
  );
}
```

**Stagger** — sequential rather than synchronous, because stagger amplifies a gesture where sync mutes it. Keep the delay between items to 30–80ms; longer makes the interface feel slow.

## 17. Hover flicker — animate a child, not the element itself

When a hover handler triggers a position change on the hovered element, the cursor can fall *off* the element mid-tween: the hover state ends, the element snaps back, the cursor catches up, and it flickers.

```tsx
// Wrong — hover lifts the box, cursor leaves, hover ends, element drops, repeat
<div className="transition-transform duration-200 hover:-translate-y-2">…</div>

// Right — outer parent owns the hover area; inner child is what moves
<div className="group">
  <div className="transition-transform duration-200 group-hover:-translate-y-2">…</div>
</div>
```

The outer wrapper's bounding box stays still, so the hover state stays continuous.

**Tailwind v4's `hover:` is device-aware** — automatically wrapped in `@media (hover: hover) and (pointer: fine)`, so an accidental finger drag on a touch device won't trigger hover states. Don't manually wrap `hover:` utilities in a media query; Tailwind already does it.

## 18. Safe-area insets on fixed and sticky elements

iOS clips fixed bottom bars under the home indicator; notched devices clip top bars. Reserve the gap with `env(safe-area-inset-*)`.

```tsx
<nav className="fixed inset-x-0 bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]" />
```

```css
.bottom-bar { padding-bottom: max(0.75rem, env(safe-area-inset-bottom)); }
.top-bar    { padding-top:    max(0.75rem, env(safe-area-inset-top));    }
```

**Pair with `viewport-fit=cover`** in the viewport meta — without it, `env(safe-area-inset-*)` resolves to `0` and the rule silently does nothing. In the Next.js App Router, set `viewportFit: "cover"` in the `viewport` export.

## 19. Fixed `z-index` scale at the token layer

An arbitrary `z-[9999]` spirals as the app grows. Define a layer scale once; every component reads from it.

```css
@theme {
  --z-base:     0;
  --z-dropdown: 10;
  --z-sticky:   20;
  --z-overlay:  30;
  --z-modal:    40;
  --z-popover:  50;
  --z-toast:    60;
}
```

No arbitrary `z-[N]`. A new layer means a new token, not a new magic number. Installed primitives usually ship with their own z values — read those before adding one. When two layers conflict, the fix is reordering the scale, not bumping a number.

## 20. Never animate `letter-spacing` / `tracking-*`

Tracking changes reshape the line: glyph positions recompute, the layout jiggles, and the eye reads it as broken. Static tracking adjustments belong in the type tokens; *animating* them is the trap.

If a heading should feel like it's settling, animate `opacity` and `transform: translateY` instead. Reveal effects that genuinely call for tracking motion are rare enough to be explicitly briefed; the default is no.

## 21. Pause looping animations off-screen

Marquees, pulses, gradient rotations: pause when not visible. Continuous compositor work off-screen still costs battery, and with `backdrop-filter` it costs repaint budget too.

```tsx
const ref = useRef<HTMLDivElement>(null);
useEffect(() => {
  const el = ref.current;
  if (!el) return;
  const io = new IntersectionObserver(([entry]) => {
    el.style.animationPlayState = entry.isIntersecting ? "running" : "paused";
  });
  io.observe(el);
  return () => io.disconnect();
}, []);
```

For scroll-driven motion specifically, prefer CSS `animation-timeline: view()` — it pauses by definition and degrades to no animation in unsupported browsers, which is the right fallback.

## 22. Animated blur — small radius, one-shot, small surfaces

`filter: blur()` and `backdrop-filter: blur()` are GPU-expensive. Bounds when animating:

- **Radius ≤ 8px.** Larger values dominate the frame budget.
- **One-shot, never infinite.** Continuous blur animation is the most reliable way to drop frames.
- **Small surfaces only.** A chip or avatar can animate blur; a full-screen overlay should fade `opacity` instead.
- **Stack `opacity` and `translate` first.** If they carry the intent, leave blur on the floor.

Static backdrop blur (section 16) is fine — the cost is in *animating* a large blur, not in rendering one once.

## 23. `-webkit-tap-highlight-color`

iOS Safari and Android Chrome paint a translucent grey-blue box over any tapped element. Set it to match the design system rather than shipping the platform default:

```css
:root { -webkit-tap-highlight-color: rgb(0 0 0 / 0.04); }
```

`transparent` is only right when the element already has a visible `:active` state — otherwise taps feel dead. Pair with `touch-action: manipulation` on tappable controls to drop the double-tap-zoom delay.
