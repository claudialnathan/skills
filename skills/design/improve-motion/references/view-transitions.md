# View Transitions decision and implementation

Use this reference only after View Transitions survive the purpose, frequency, interruption, support, and complexity gates. Treat framework APIs and browser behavior as perishable. This snapshot was checked on **2026-07-27**.

## Choose the owner first

Prefer:

1. **No animation** for high-frequency navigation, changes without a useful spatial relationship, or motion that delays access.
2. **CSS transition** for local predetermined state already expressed through attributes/classes.
3. **Cross-document platform View Transitions** for same-origin multi-page navigation with acceptable browser fallback.
4. **React `<ViewTransition>`** when the installed React/framework contract supports it and snapshot semantics fit the interaction.
5. **Motion layout/shared elements** when continuity must stay in the live DOM, retarget rapidly, preserve gesture velocity, or remain directly interactive.

View Transitions capture visual snapshots. They can smoothly crossfade, move, and resize visual identity without keeping every underlying element live during the animation. That can reduce layout-animation machinery, but it is a poor fit for drag, scroll-tied motion, frequently interrupted controls, text selection, media that must remain live, or state whose interactivity cannot pause behind an overlay.

## Support is per-feature

"View Transitions are supported" is not one fact. Check the specific feature against the product browser floor:

| Feature | Floor at this snapshot |
| :--- | :--- |
| Same-document `document.startViewTransition` | Baseline Newly available since 2025-10 (Chromium, Safari, Firefox) |
| Cross-document `@view-transition` | Chromium and Safari 18.2+; not Firefox |
| `view-transition-class` | Chrome 125+, Edge, Safari 18.2+; not Firefox |
| `view-transition-name: match-element` | Chromium only; same-document only |
| Generated names via `ident()` + `sibling-index()` | Not shipped in any engine; do not write it |

Unsupported engines get a normal instant navigation or DOM swap — no error, no layout shift, no fallback code. Design so that fallback is acceptable, then treat the animation as enhancement. Feature-detect same-document support with `if (document.startViewTransition)`. Cross-document has no JS detection: the browser honors the at-rule or ignores it.

## Cross-document activation

Both documents must opt in, the navigation must be same-origin, and only user-initiated navigations transition — links and browser back/forward, not programmatic redirects or cross-origin hops. Gate the opt-in itself so reduced-motion users never capture snapshots at all:

```css
@media (prefers-reduced-motion: no-preference) {
  @view-transition {
    navigation: auto;
  }
}
```

The at-rule accepts any conditional context; exclude small viewports the same way when the travel would disorient. The legacy `<meta name="view-transition" content="same-origin">` opt-in is deprecated and inert — replace it on sight and do not copy it from older tutorials.

## Cross-document lifecycle and the four-second budget

Two events coordinate pages that never run at the same time:

- **`pageswap`** fires on the outgoing page just before the browser snapshots it — the last chance to assign `view-transition-name` on the old page. `event.activation.entry.url` gives the destination; `event.activation.navigationType` gives push/replace/traverse/reload. Keep the handler fast; the window is tens of milliseconds.
- **`pagereveal`** fires on the incoming page before its first render. Assign incoming names here. Guard with `if (event.viewTransition)`, then watch `event.viewTransition.finished` — a rejected `finished` is the only place a `TimeoutError` surfaces.
- Clean up in `finished`: remove dynamically assigned names so the next navigation cannot pair against stale identity.

Cross-document transitions enforce a hard 4-second timeout that starts when navigation begins, not when HTML arrives. TTFB, render-blocking assets, and font loading all spend the budget; an overrun silently skips the transition. Fix page load first. When the snapshot must wait for one element, declare it render-blocking:

```html
<link rel="expect" href="#hero" blocking="render">
```

This delays first paint until the element exists, so the new-page snapshot is complete instead of partial — at the cost of that much blank time. Keep the target early in the document, and never point it at content below the fold.

## Snapshot geometry

Old and new snapshots default to `object-fit: fill`, so a shared element whose aspect ratio differs between states stretches during the morph. Fix the snapshots, not the group:

```css
::view-transition-old(hero-image),
::view-transition-new(hero-image) {
  object-fit: cover;
  overflow: hidden;
}
```

`object-position` may differ per side to control which crop each state shows. Put the name on the `<img>` itself, not a wrapper, so snapshot geometry matches the media; give overlays and backdrops their own names so they animate independently. Contain escape during size interpolation at the pair:

```css
::view-transition-image-pair(hero-image) {
  overflow: hidden;
}
```

Bitmap morphs handle some shapes badly regardless: text reflowing between inline and block, and large shape changes, may read better as a plain crossfade or no shared pair at all when the in-between distorts.

## Lists and feeds at scale

`view-transition-name` is identity — which element on page A is the same element on page B — and names must be globally unique per page. `view-transition-class` is a styling hook shared by many named elements. Never mint one rule per item; style the class through the wildcard group selector:

```css
::view-transition-group(*.card) {
  animation-duration: 0.35s;
}

::view-transition-old(*.card),
::view-transition-new(*.card) {
  object-fit: cover;
}
```

One rule covers ten cards or ten thousand. Name feed items just in time instead of naming every row at load:

1. In `pageswap`, read the destination from `event.activation.entry.url` and assign a unique name (plus the shared class) to the one clicked card.
2. In `pagereveal`, find the matching element on the detail page and assign the same name.
3. After `finished`, remove the assigned names.

Just-in-time naming avoids snapshotting every unclicked item and prevents stale names pairing the wrong elements on later navigations. It also makes infinite scroll free: the handlers query the DOM at navigation time, so dynamically loaded items need no extra wiring.

For same-document reorder — sort, filter, paginate in place — `view-transition-name: match-element` generates per-element identity without hand-written names, but it is Chromium-only and same-document-only at this snapshot. Elsewhere, assign explicit names to visible rows only, or accept the crossfade. In React, list identity comes from correct keys plus a per-item boundary with `default="none"` so typing, filtering, and revalidation do not crossfade — see the nesting rules below.

## Verify runtime and framework status

Before using React View Transitions:

- inspect `package.json`, the lockfile, installed React exports/types, framework version, and feature configuration;
- treat `<ViewTransition>` and `addTransitionType` as React Canary APIs until the installed stable channel proves otherwise;
- in Next.js, use the framework-bundled React contract rather than adding `react@canary` solely for this feature;
- treat Next.js View Transition integration as experimental unless current installed-version documentation says otherwise;
- verify `next/link` support from installed types/source rather than assuming all Next.js 16 releases expose `transitionTypes` (the documented stable addition began in 16.2);
- verify the product browser floor and production build, not only development.

Do not add an experimental runtime/channel for decorative continuity without explicit product acceptance.

## React activation contract

For React-owned View Transitions:

- use `<ViewTransition>` before intervening DOM nodes; React applies names to its nearest nested DOM nodes, and a boundary placed after sibling DOM elements in the same parent does not work;
- trigger through `startTransition`, Suspense, or `useDeferredValue`; ordinary immediate state updates do not activate the transition;
- let React coordinate `document.startViewTransition`; do not start a second platform transition manually around React;
- use `default="none"` unless the browser crossfade is intentionally wanted for every matching update;
- enable only the required `enter`, `exit`, `update`, or `share` behavior;
- use `addTransitionType` or a framework navigation type only when direction/context genuinely changes the treatment.

Do not wrap every page, Suspense boundary, and list item by default. Add the smallest boundary that communicates the intended identity or change.

## Identity, nesting, and snapshots

Use `name` only for shared identity. Keep names globally unique and ensure only one mounted source owns a given name at a time; React throws when two mounted `<ViewTransition>` components share a name. A shared pair forms only when both sides participate in the same transition and are available for capture. Targets hidden behind unresolved Suspense/data may fall back to enter/exit instead of sharing; prefer correct loading behavior over forcing data or duplicating content merely to preserve a morph.

Nested boundaries are conservative:

- updates generally belong to the innermost matching boundary;
- when a parent exits, nested enter/exit animation may be subsumed by the parent;
- list reorder boundaries need correct React keys and placement before wrapper DOM;
- preserve `default="none"` on named/list boundaries that must not crossfade on filtering, typing, revalidation, or unrelated updates.

Treat experimental nested parent enter/exit options as version-gated, not default guidance.

## Persistent and floating layers

Persistent headers, sidebars, players, popovers, tooltips, dialogs, and other floating layers can be captured into the root snapshot and flicker or settle incorrectly. Give a layer a real, unique `view-transition-name` only when it must be isolated, then neutralize its snapshot animation. `view-transition-name: none` does not isolate it.

Test backdrop filters, top-layer elements, stacking, fixed positioning, focus rings, and open popovers. Avoid hard-coded global z-index values; use the project’s layer scale.

## Preserve navigation semantics

Legacy `popstate` back/forward navigation may skip React View Transition animation. Do not replace `router.back()` or browser history with `router.push()` merely to obtain motion; that changes the history stack and interaction contract. Preserve correct navigation and accept no animation until the router/framework uses a compatible Navigation API path.

Directional movement is appropriate only for hierarchy or ordered sequences. Lateral navigation may use a quiet crossfade or no motion. Never impose a directional slide merely because a shared element exists.

## Own only the required CSS

Adapt one required recipe to project tokens and colocate it with the narrowest shared owner. Do not paste a complete global recipe catalogue. Avoid blur, large travel, `scale(0.85)`, long delays, and arbitrary layer values as defaults.

Reduced motion has two treatments. Cross-document: gate the `@view-transition` opt-in itself, as above — no opt-in, no snapshots. Same-document and React have no at-rule to gate, so suppress the snapshot animations:

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

Preserve an instant state change when opacity is unnecessary; keep a short opacity-only transition only when it materially communicates completion.

## Imperative control

Reach for the `ViewTransition` object only for cases CSS cannot express. `Document.activeViewTransition` exposes the active transition in any context, including both cross-document event objects. `ready` resolves once the pseudo-element tree exists — the hook for WAAPI-driven custom animation targeting `pseudoElement: "::view-transition-new(root)"`; neutralize the default crossfade on the targeted pair first (`animation: none` and `mix-blend-mode: normal` on old/new, `isolation: auto` on the image pair) or the two states blend. `skipTransition()` abandons the animation but still runs the DOM update. `waitUntil(promise)` extends the transition and its pseudo-element tree until the promise settles. `types` reads and mutates the active transition types for type-scoped styling.

## Verification matrix

Test:

- every forward, explicit back, browser back/forward, redirect, and same-route path;
- rapid repeated navigation and a second update while the first animation runs;
- a navigation immediately after one completes, confirming dynamically assigned names were removed;
- a throttled first load whose TTFB pushes past the four-second budget — expect a plain navigation, and confirm nothing depends on the transition running;
- cached, uncached, suspended, loading, error, and revalidated states;
- shared-pair present, missing, duplicated, and outside-viewport cases;
- shared images whose aspect ratios differ between the two states;
- scroll position/restoration and attempted scrolling during the fixed snapshot overlay;
- focus, keyboard activation, selection, inputs, media, dialogs, popovers, sticky/fixed layers, and backdrop filters;
- reduced motion and an unsupported engine (expect a normal navigation with nothing broken);
- development and production builds.

Reject the implementation if animation requires incorrect history semantics, hides useful loading state, blocks interaction, adds a global recipe bundle for one path, or produces more machinery than a CSS/Motion alternative.
