# Layout verification and termination

Use this reference for a broad layout audit, a change spanning responsive transitions, or any claim that depends on rendered geometry. Start from the claims, not from a universal browser ritual.

## Choose the evidence scope

For a bounded repair, check:

1. the reproduced failing width, container, content, or interaction;
2. the declared narrow floor;
3. one representative intermediate pressure point;
4. one wide state;
5. each adversarial state that can falsify the claim, such as 200% zoom, long content, keyboard order, coarse pointer, reduced motion, or RTL.

For a broad audit or foundational layout change, sweep the full project-relevant ladder. A useful default is 320, 360, 390, 430, 768, 1024, 1280, and 1440px, pairing phone widths with realistic phone heights. Add the smallest realistic component container when it differs from the viewport.

Do not render every permutation. Cover each distinct layout mode and highest-risk transition once, then use source and computed-style evidence for equivalent consumers.

Use one browser session resized through the ladder so transitions remain observable. Pay particular attention to 768–1024px, 1024–1280px, and the first state above 1440px when those ranges are in the project floor: tablet inheritance, sidebar/column changes, and stranded max-width content often hide there.

## Bound runtime work

Prefer an already-running project server. If startup is required:

1. use the repository-owned command in a controllable session;
2. observe startup output and probe one health or target route with a bounded wait;
3. diagnose the first failure;
4. allow one clean restart or retry when the diagnosis justifies it;
5. stop retrying after that, preserve the logs, finish independent static checks, and mark rendered claims unverified.

Do not leave opaque watch commands, repeated reconnects, browser refresh loops, or multiple competing dev servers running. Terminate only processes started for the task.

If browser control connects but cannot inspect the DOM, geometry, or interaction, do not keep reconnecting. Use the evidence it can provide, route the remaining claims to another available project-owned tool once, or mark them unverified.

Apply the same boundary to current-documentation and package/registry lookups: prefer installed versions, types, source, and checked-in configuration; use request timeouts when available; after one diagnosed retry, continue without the external evidence and disclose the gap.

## Locate only meaningful transitions

Continuous resizing is useful when a layout mode changes or a defect appears between sampled widths. Drag through that interval, then bisect only it. Stop when the flip is located to about 10px or the exact CSS query is established from source and confirmed at its boundary.

Do not bisect stable intervals, every breakpoint in the framework, or transitions unrelated to the requested surface. Re-check a located transition after the interaction that stresses it, such as opening navigation, expanding a row, or adding content.

## Pressure the rendered layout

Select only applicable pressures:

- 200% zoom and user font scaling;
- longest real, localized, pseudo-localized, numeric, or unbroken content;
- realistic empty, typical, and high-density data;
- keyboard order, focus visibility, pointer, touch, and coarse-pointer behavior;
- light, dark, forced-color, reduced-motion, and RTL modes when supported or changed;
- short phone height, dynamic browser chrome, safe-area inset, sticky boundaries, and nested scroll owners when relevant.

Inspect console output, layout shift, clipped focus, horizontal overflow, stale state, accidental scroll boundaries, and the actual scroll ancestor.

## Route claims to proof

| Claim | Minimum evidence |
| :-- | :-- |
| “It works at the floor” | rendered at the named width and realistic height |
| “It folds at X” | the changed interval bisected to about 10px or the source threshold confirmed at its rendered boundary |
| “No overflow” | `scrollWidth` against `clientWidth` in each distinct layout mode |
| “Responsive” | narrow, relevant intermediate transition, wide, zoomed, and content-pressure states |
| “Touch targets are fine” | measured rendered boxes under coarse-pointer emulation or a real device |
| “Safe areas are handled” | an emulated or real inset; a rectangular viewport proves nothing |
| “Survives long content” | the longest real string or a pseudo-localized pass |
| “Source and visual order agree” | DOM/source trace plus rendered keyboard sequence where visual order can diverge |

Static evidence cannot prove geometry. A screenshot cannot prove source order, keyboard behavior, or overflow measurements. Report every claim not actually exercised as **unverified**.
