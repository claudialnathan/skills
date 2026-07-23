# View Transitions decision and implementation

Use this reference only after View Transitions survive the purpose, frequency, interruption, support, and complexity gates. Treat framework APIs and browser behavior as perishable. This snapshot was checked on **2026-07-23**.

## Choose the owner first

Prefer:

1. **No animation** for high-frequency navigation, changes without a useful spatial relationship, or motion that delays access.
2. **CSS transition** for local predetermined state already expressed through attributes/classes.
3. **Cross-document platform View Transitions** for same-origin multi-page navigation with acceptable browser fallback.
4. **React `<ViewTransition>`** when the installed React/framework contract supports it and snapshot semantics fit the interaction.
5. **Motion layout/shared elements** when continuity must stay in the live DOM, retarget rapidly, preserve gesture velocity, or remain directly interactive.

View Transitions capture visual snapshots. They can smoothly crossfade, move, and resize visual identity without keeping every underlying element live during the animation. That can reduce layout-animation machinery, but it is a poor fit for drag, scroll-tied motion, frequently interrupted controls, text selection, media that must remain live, or state whose interactivity cannot pause behind an overlay.

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

- use `<ViewTransition>` before intervening DOM nodes; React applies names to its nearest nested DOM nodes;
- trigger through `startTransition`, Suspense, or `useDeferredValue`; ordinary immediate state updates do not activate the transition;
- let React coordinate `document.startViewTransition`; do not start a second platform transition manually around React;
- use `default="none"` unless the browser crossfade is intentionally wanted for every matching update;
- enable only the required `enter`, `exit`, `update`, or `share` behavior;
- use `addTransitionType` or a framework navigation type only when direction/context genuinely changes the treatment.

Do not wrap every page, Suspense boundary, and list item by default. Add the smallest boundary that communicates the intended identity or change.

## Identity, nesting, and snapshots

Use `name` only for shared identity. Keep names globally unique and ensure only one mounted source owns a given name at a time. A shared pair forms only when both sides participate in the same transition and are available for capture. Targets hidden behind unresolved Suspense/data may fall back to enter/exit instead of sharing; prefer correct loading behavior over forcing data or duplicating content merely to preserve a morph.

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

Provide a reduced alternative for every snapshot animation:

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

## Verification matrix

Test:

- every forward, explicit back, browser back/forward, redirect, and same-route path;
- rapid repeated navigation and a second update while the first animation runs;
- cached, uncached, suspended, loading, error, and revalidated states;
- shared-pair present, missing, duplicated, and outside-viewport cases;
- scroll position/restoration and attempted scrolling during the fixed snapshot overlay;
- focus, keyboard activation, selection, inputs, media, dialogs, popovers, sticky/fixed layers, and backdrop filters;
- reduced motion and an unsupported browser;
- development and production builds.

Reject the implementation if animation requires incorrect history semantics, hides useful loading state, blocks interaction, adds a global recipe bundle for one path, or produces more machinery than a CSS/Motion alternative.
