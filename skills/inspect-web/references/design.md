# Design forensics

Extracting layout, type, colour and spacing from a page well enough to reuse the decisions rather than the pixels. Contents: [resolve used values](#resolve-used-values) · [colour](#colour) · [type](#type) · [layout and grid](#layout-and-grid) · [spacing and rhythm](#spacing-and-rhythm) · [tokens](#tokens) · [diagnosing a broken layout](#diagnosing-a-broken-layout)

Reference snapshot: 2026-08-07.

## Resolve used values

Read `getComputedStyle`, not the stylesheet. A stylesheet gives authored intent across every breakpoint and state, most of which does not apply; computed style gives what is actually in force at the viewport in front of you, with cascade, custom properties and `@media` already resolved. It is also far smaller.

Shape the read to return a small object of the properties in question across a named handful of elements. A single `eval` returning twelve properties for six elements is a few hundred tokens; the same information taken by dumping the DOM is thousands, and most of it is inline SVG.

Two habits keep the output honest. Round lengths at capture time, because sub-pixel values from layout are noise rather than design decisions. And record the viewport width alongside the values, since half of what is read is width-dependent and a number without its breakpoint cannot be reused.

## Colour

Computed colour comes back resolved and in the browser's serialisation, not the author's — a value written as `oklch()` may serialise differently, and a token indirection is gone. Read both the computed value and, where a custom property is in play, the property itself from the element it resolves on.

Worth reading beyond the obvious foreground and background: border colours, which are frequently a distinct step in the scale rather than a mix; `color-scheme`, which decides scrollbars and form controls; shadow colours, which in a considered palette are tinted rather than neutral black at low alpha; and any `color-mix()` still visible in the custom property, which shows the derivation the author intended.

Capture both themes. Toggle with `set media dark` and `set media light` rather than clicking the page's own switch where possible, since the page's switch may set a class the media query does not, and the difference between the two is itself a finding. A palette read in one theme is half a palette.

## Type

The reusable decisions are the scale and the relationships, not the literal pixel sizes. Read across a heading run and body text together, then look for the ratio.

Per element: `font-family` as computed, which reveals the real stack including fallbacks; `font-size`, `line-height` and `letter-spacing`, which are the scale; `font-weight` and any `font-variation-settings`, which on a variable font is where the actual weight lives and often disagrees with `font-weight` alone; `font-feature-settings`; and `text-wrap`, which explains headline ragging that otherwise looks like luck.

Two values are commonly the interesting ones and commonly missed. Fluid sizing built on `clamp()` is gone by the time it reaches computed style, so read it at two viewport widths and reconstruct the slope rather than reading it once. And negative letter-spacing that scales with size is a deliberate optical correction — a single reading at one size will not show that it changes.

For the loaded fonts themselves, `document.fonts` enumerates what actually resolved, which is the only way to tell a specified family from a rendered one.

## Layout and grid

Start at the container, not the children. Read `display`, and then whichever family applies: `grid-template-columns` and `grid-template-rows` as computed, which resolve to used pixel tracks and show what the `fr` units worked out to; `gap`; `align-*` and `justify-*`; and `container-type`, which if set means the children respond to the container rather than the viewport and the whole layout will behave differently when transplanted.

Then read geometry for two or three children with `get box`. Compare the boxes against the computed tracks: the gap between what the grid declares and where things actually sit is where the interesting decisions are — spanning, `subgrid`, negative margins, or a breakout pattern.

Read the page's own maximum width and gutter as one thing. Most layouts have a content measure and an escape hatch for full-bleed elements, and the escape hatch is the part worth understanding.

## Spacing and rhythm

Spacing is only legible as a set. Reading one margin gives a number; reading every vertical gap in a section and sorting them reveals whether there is a scale at all, and if so its base and ratio.

Collect the resolved vertical gaps between siblings across one representative section, then look at the distinct values. A short list of values that are multiples of a base is a spacing scale worth reproducing. A long list of unrelated values is ad-hoc spacing, which is a finding — do not reverse-engineer a scale that is not there.

## Tokens

Where custom properties are in use, they are the design system, and reading them is cheaper and more faithful than inferring the system from rendered values. Enumerate the custom properties defined on the root element and on the theme-carrying element, and read their values in both themes.

This gives the authored names and the derivation, which is what makes the extraction reusable. Rendered values give a palette; token names give the intent behind it. Where both are available, report the tokens and keep the rendered values as confirmation.

## Diagnosing a broken layout

A single reading of a broken state rarely identifies its cause. Capture a comparison: the same component where it works, the same page at a width where it does not break, or the state before the change.

Overflow is the common case and has a specific probe. Compare `scrollWidth` against `clientWidth` on the document element to confirm it, then walk elements whose right edge exceeds the viewport to find the culprit. The element that overflows is usually not the element at fault — the fault is normally an ancestor's missing `min-width: 0` in a flex or grid context, an unbreakable string, or a fixed width in a fluid container. Read the ancestors of the overflowing element, not just the element.

Check at the widths that actually matter: the narrowest supported width as a named number, the width where the layout changes, and 200% zoom. Longest realistic content matters more than typical content, since most layout breaks are content-length bugs that placeholder text never triggers.
</content>
