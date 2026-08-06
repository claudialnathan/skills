# Grid and content-resilience patterns

Load this file only for intrinsic grids, grid blowout, content growth, subgrid,
neutral wrappers, overlays, breakouts, or DOM-shape-aware layout.

Owner tags: **sh** existing/shadcn behavioral component · **tw** native
Tailwind v4 utility · **css** authored CSS that passed the measurable-benefit
gate in `SKILL.md`.

## Contents

- [Grid](#grid--intrinsically-responsive-card-grid--tw)
- [Grid blowout](#the-two-grid-blowout-fixes--dont-conflate-them--twcss)
- [Content growth](#the-third-overflow--the-content-grew-the-container-didnt--twcss)
- [Subgrid](#subgrid--align-content-across-sibling-cardsrows--tw)
- [display: contents](#display-contents--promote-a-wrappers-children-into-the-parent-grid--tw)
- [Stack-overlay](#stack-overlay--layered-content-in-one-cell--css)
- [Breakout](#breakout--full-bleed--content-column-with-wider-elements--css)
- [:has() and quantity queries](#has--quantity-queries--content-aware-layout--css)

## Grid — intrinsically responsive card grid — tw

```tsx
<div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(min(100%,15ch),1fr))]">{items}</div>
```
Replaces the `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` ladder — passes removes-a-ladder. Two decisions:

- **`auto-fill` vs `auto-fit`** — `auto-fill` preserves empty tracks and the space they occupy when items are few; `auto-fit` collapses empty tracks so existing items stretch into that space. Pick deliberately; they are different UX, not a default.
- **The parametric form** (RAM): `--min: min(320px, 100%)` then `grid-cols-[repeat(auto-fill,minmax(var(--min),1fr))]` — `--min` is the prop.

## The two grid-blowout fixes — don't conflate them — tw/css

Overflow on narrow screens has two distinct causes and two distinct fixes:

1. **Track-minimum blowout** — the track floor exceeds the viewport (`minmax(400px, 1fr)` on a 320px screen). Fix: wrap the floor in `min()` → `minmax(min(100%, 400px), 1fr)`. `min()` returns `100%` when it's smaller than the floor, so the track never exceeds the container. This is why the Grid above uses `min(100%, 15ch)`.
2. **Item min-content blowout** — a grid/flex *item* with unbreakable content (a `<pre>`, a long URL, `white-space: nowrap`) forces its track wider than `1fr` should allow, because a track's implicit minimum is `auto` (content-based), not `0`. Fix, in order of preference:
   - `wrap-anywhere` (Tailwind v4.1) when words/URLs are allowed to break — it participates in intrinsic sizing and can remove the need for `min-width: 0`;
   - `min-w-0` on an item that should shrink while its own content scrolls, truncates, or wraps by another policy; or
   - `grid-cols-[minmax(0,1fr)_…]` at the track level.

`overflow-hidden` can also make the automatic minimum shrink, but it does so by clipping overflow and may hide content, shadows, or focus indicators. Treat it as an intentional clipping policy, not the generic blowout fix. `max-width: 100%` alone does not solve the track's automatic minimum.

**Related — content-sized fields overflow too.** `field-sizing: content` (utility `field-sizing-content`) grows a `select`/`input`/`textarea` to fit its content, so an unbounded one blows out its container just as a track floor does. Always pair it with a `max-width` guard (`max-width: 100%`); the placeholder text acts as the effective minimum width. It is pure progressive enhancement — in Safari/Firefox without support at the 2026-07-22 reference snapshot, the field sizes normally, so nothing breaks.

## The third overflow — the content grew, the container didn't — tw/css

The two blowouts above are *the container got narrower than the content needs*. The third is the mirror image: the container is fine and the **string got longer than the one it was sized against**. It surfaces after translation, after a real record replaces lorem text, and at 200% zoom — which is why a layout can pass every width sweep and still break in production.

Expansion is not a single percentage. It varies by target language and, sharply, by source-string length: short UI labels expand far more proportionally than paragraphs. Do not size to English and add a fixed margin of safety — remove the fixed size instead:

- **No fixed width on a text container.** `max-width` plus wrapping, never `width`.
- **No fixed height on a text container.** `min-height` when a floor is genuinely needed, so the box grows with its content instead of clipping it.
- **Buttons and chips size from their label** via `padding-inline`. A hardcoded width either truncates the longer translation or forces an ellipsis into a control that has room to be legible.
- **Let rows wrap** rather than compressing every cell. A toolbar deliberately held to one line is an intent to preserve — but then its labels need an abbreviated or icon form for the case where they no longer fit.

```css
/* Good: the label defines the size, the box grows with it */
.button { padding-inline: --spacing(4); }
.field-label { max-inline-size: 24ch; }

/* Bad: sized to the English string, clips or overflows in German */
.button { inline-size: 6rem; overflow: hidden; }
.field-label { block-size: 1.5rem; }
```

**Test it, don't reason about it.** Pseudo-localization (accented, lengthened strings) or one representative long-string locale exposes this in one pass; unbounded user content — a long display name, an untruncated filename — exposes the same boxes. Run it before shipping any layout whose text came from a design mock.

## Subgrid — align content across sibling cards/rows — tw

Tailwind v4 provides native `grid-rows-subgrid` / `grid-cols-subgrid` utilities; do not retain the older arbitrary-property form. When card content (image, title, body, CTA) must align across a row, give each card a subgrid inheriting the parent's tracks:

```tsx
<div className="grid grid-cols-3 gap-6 grid-rows-[auto_1fr_auto]">
  {cards.map(c => (
    <article key={c.id} className="grid grid-rows-subgrid row-span-3">
      <h3>{c.title}</h3><p>{c.body}</p><Button>Read more</Button>
    </article>
  ))}
</div>
```

**Two gotchas**: (1) line numbers reset inside the subgrid; (2) rows must be reserved with `row-span-N` — subgrids don't auto-generate rows from children. The `row-span-99` hack to cover unknown row counts works only when row `gap` is zero; otherwise every empty row still contributes a gap. Do not assume an `auto-fit`/`auto-fill` parent can provide the explicit spans a sibling-alignment subgrid needs; validate the exact pattern or use explicit tracks.

Check the project's browser floor; Tailwind v4's own minimum browser set does not by itself prove every subgrid target is covered. Add a fallback when required:
```css
@supports not (grid-template-rows: subgrid) {
  .card { grid-template-rows: 140px 1fr auto; }
}
```
**When NOT**: if a nested flex/grid gives the same row structure without cross-sibling alignment, prefer it — the plain nested form is often simpler; subgrid earns it only when siblings must be level with *each other*.

## `display: contents` — promote a wrapper's children into the parent grid — tw

When a wrapper element (`.section-content`, a fragment `div`) sits between a grid and the items that must occupy its tracks, `display: contents` (utility `contents`) drops the wrapper's own box so its children participate directly in the parent grid — e.g. promoting a header and cards into one shared grid, often gated by a `:has()` quantity condition:

```tsx
<section className="has-[.card:nth-child(2):last-child]:grid grid-cols-[1fr_1.25fr_1fr]">
  <header>{title}</header>
  <div className="contents">{cards}</div>   {/* ungrouped: cards join the section grid */}
</section>
```

**Caveat**: `display: contents` historically stripped the element's semantics/role from the accessibility tree (largely fixed in current browsers — verify against the project floor), so keep it off elements whose box or role is load-bearing (a `<fieldset>`, a landmark, an element with a border/background/padding you still need). Use it on neutral grouping wrappers only.

## Stack-overlay — layered content in one cell — css

```tsx
<div className="grid [grid-template-areas:'stack'] *:[grid-area:stack]">
  <img src={hero} alt="" className="h-full w-full object-cover" />
  <div className="self-end p-6 text-white"><h1>{headline}</h1></div>
</div>
```

Reach for it when layered children should contribute to the parent's intrinsic size. It avoids many absolute-position sizing hacks, but overlap can still obscure controls or pointer targets; verify DOM order, focus visibility, and hit-testing.

## Breakout / full-bleed — content column with wider elements — css

**Grid form** (a constrained column with named lines; elements opt into full width):
```tsx
<article className="grid grid-cols-[[grid-start]_1fr_[content-start]_minmax(min(100%,60ch),1fr)_[content-end]_1fr_[grid-end]] gap-y-6 *:col-[content]">
  <h1>{title}</h1><p>{body}</p>
  <figure className="col-[grid]"><img src={img} className="w-full" /></figure>
</article>
```

**Container-unit form** (preserves a flexible/sidebar layout a grid can't): mark the content container `@container`, then a breakout child fills it with `w-[100cqi]`:
```tsx
<div className="@container">
  <p>…</p>
  <div className="w-[100cqi] …">{fullBleed}</div>   {/* 100cqi = 100% of the container's width */}
</div>
```
Container units degrade gracefully — without support the breakout is just content-width, an acceptable floor. Use the grid form for a classic article column; the container-unit form when the breakout lives inside a flexible sidebar layout that a full-bleed grid would fight.

`100cqi` expands from the breakout element's own inline-start edge. Confirm the content/sidebar direction makes that expansion cover the intended region; a sidebar on the opposite side may also need an offset or a different wrapper structure.

## `:has()` + quantity queries — content-aware layout — css

Adapt a component to *how many* children it has or *what* it contains, per instance, no JS:

```css
/* Re-layout the parent when it holds 3 or fewer badges */
.list-item:has(.badge:last-child:nth-child(-n + 3)) {
  grid-template-columns: var(--leading) max-content 1fr max-content;
}
/* Parent-aware focus ring — precise where :focus-within is coarse */
.card:has(button:focus-visible) { outline: 2px solid var(--color-ring); }
/* Global side effects from anywhere in the tree */
html:has([data-scroll-locked="true"]) { overflow: hidden; }
```

Do not reject `:has()` based on selector folklore; measure style recalculation only if the page has a demonstrated hot path. **When NOT**: if the condition is dynamic app state already tracked in React, or the logic is elaborate, do it in JS — `:has()` shines for *visual*, DOM-shape conditions (focus ring, quantity, scroll-lock), not as a state engine. A quantity threshold (e.g. "≤3 badges") is a magic number: derive it from real and localized content, pair it with the component's available width, and start from a usable narrow/default layout.
