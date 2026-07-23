---
name: improve-motion
description: "This skill should be used when the user asks to audit, review, fix, simplify, refactor, remove, add, or improve UI animation, motion, transitions, page or view transitions, micro-interactions, gestures, scroll effects, layout animation, enter/exit behavior, easing, springs, or animation performance. It determines whether motion should exist, removes overkill, reduces motion code, and routes implementation to native CSS/Tailwind, WAAPI, free Motion, or an already-installed Motion+ capability."
compatibility: Tailwind v4, CSS, React/Next.js, Motion, Motion+, Base UI, shadcn; principles apply to other web stacks
paths:
  - '**/{components,ui}/**/*.{ts,tsx,js,jsx,vue,svelte}'
  - '**/app/**/*.{ts,tsx,js,jsx,mdx}'
  - '**/pages/**/*.{ts,tsx,js,jsx,mdx}'
  - '**/features/**/components/**/*.{ts,tsx,js,jsx,vue,svelte}'
  - '**/src/**/*.{css,scss}'
  - '**/{globals,app,tailwind,index}.css'
  - '**/styles/**/*.{css,scss}'
---

# improve-motion

Determine the job from the request, then improve the result rather than maximizing animation. Treat existing motion and the user's suggested effect as candidates, not conclusions. A good pass may add a subtle checkbox response, replace a measured-height hook with CSS, retune a drawer, or delete an animation entirely.

Read the implementation before prescribing motion. Inspect the rendered interaction when possible; animation cannot be judged reliably from class names alone.

## Route the task

Choose the narrowest matching mode:

| User intent | Action |
| :--- | :--- |
| “audit,” “review,” “what feels off?” | Inspect and report evidence; do not edit unless fixes were requested. |
| “fix,” “improve,” “polish” | Audit, implement the highest-leverage coherent changes, and verify them live. |
| “simplify,” “refactor,” “reduce code” | Preserve behavior while removing wrappers, hooks, duplicated variants, magic numbers, and unnecessary dependencies. |
| “add motion,” “make this feel responsive” | Find the few common seams where feedback or continuity helps; avoid an animation wishlist. |
| A named interaction/effect | Implement that effect, but still apply the purpose, frequency, accessibility, and capability gates. |

For a broad audit, cover the whole requested surface. For a component or diff, stay local. Do not turn a focused request into a repo-wide redesign.

This skill owns task mode, edit authority, implementation, verification, and handoff. Treat overlapping read-only skills such as `improve-animations`, `review-animations`, or `find-animation-opportunities` as optional evidence sources, not competing workflow owners. When useful and supported by the harness, invoke them only in isolated read-only advisor passes and return their findings to this workflow for vetting. Scope their no-mutation rules to those passes. Do not hand implementation authority or the parent workflow to an advisor skill. If isolation is unavailable, inspect only the relevant checked-in guidance rather than loading a contradictory workflow into the implementation context.

## Start with reconnaissance

1. **Read the interaction.** Identify the trigger, state change, frequency, input methods, spatial relationship, and product personality. Note whether motion communicates feedback, continuity, hierarchy, progress, or causality.
2. **Map the stack.** Inspect dependencies, lockfile, UI primitives, global motion tokens, CSS ownership, browser targets, and nearby precedent. Search for `transition`, `animation`, `@keyframes`, `motion.`, `animate`, `layoutId`, `view-transition`, `will-change`, and reduced-motion handling.
3. **Detect capabilities separately.**
   - Record Motion+ account/example access from explicit user context or a successful premium AI Kit result.
   - Treat the Motion AI Kit / `motion` skill and callable MCP tools as authoring capability.
   - Treat `motion` in project dependencies/imports as the free runtime.
   - Treat `motion-plus` or `@motionplus/core` in project dependencies/imports as premium runtime installed in this project.
   - Never infer project runtime installation from account or AI Kit access.
4. **Reproduce the real seam.** Exercise rapid reversal, keyboard and pointer input, reduced motion, slow playback, and the weakest realistic device or busy-page state. For runtime work, the browser is the acceptance criterion.
5. **Record a small baseline.** Count the relevant motion-specific imports, wrappers, hooks, variants/keyframes, and lines before a simplification. Optimize for less machinery, not merely fewer formatted lines.

## Use companion capabilities without bloating context

When installed, invoke the **`motion` skill** for any non-trivial Motion or CSS animation task. Use only its relevant capability:

- Search current docs and official examples before using an unfamiliar Motion/Motion+ API.
- Generate a CSS `linear()` spring instead of inventing one.
- Run MotionScore for a requested performance audit or a runtime where jank is plausible.
- Preview a spring/easing when feel is uncertain.

Load `shadcn-tailwind` when editing shadcn/Base UI primitives and `accessibility` when motion is large, repeated, gesture-driven, or essential to comprehension. This skill stands alone when companions are absent; do not block on them.

If an installed read-only motion advisor is useful, invoke it only through the isolated advisor boundary above. Re-open and vet its evidence before changing code.

Treat an installed `vercel-react-view-transitions` skill as a perishable API and failure-mode source only after View Transitions win the owner gate. Keep this workflow’s purpose, restraint, project-token, and code-reduction rules authoritative; do not inherit blanket instructions to animate every candidate or copy a complete global recipe set.

If the AI Kit is unavailable, continue from checked-in guidance and mention the missing authoring capability at handoff. If neither `motion-plus` nor `@motionplus/core` is present, implement with the project’s existing animation utilities, free Motion, Tailwind, CSS, or WAAPI. Report “Motion+ runtime not installed in this project,” not “Motion+ unavailable,” when account entitlement or AI Kit access exists. Keep entitlement unknown when it cannot be established. Name the fallback that shipped. Do not ask for or handle a private registry token. Use a premium API only when a recognized Motion+ package or import is present, current documentation confirms it, and it materially removes code or improves the interaction.

For a single component, work directly. For a broad repo audit, perform one shared reconnaissance, then use read-only parallel workers by non-overlapping app area or audit category when the harness supports them. Give every worker the same stack, token, browser-floor, and frequency context; re-open every cited finding before reporting it. Keep implementation centralized or assign disjoint files so agents do not overwrite one another. Load one reference and one Motion capability at a time—do not ingest every companion skill or documentation result “just in case.”

## Decide before animating

Ask in order:

1. **Does motion have a job?** Keep motion that explains change, confirms input, maintains spatial continuity, or prevents a jarring seam. Remove decoration that competes with the task.
2. **How often is it seen?** Repeated productivity actions must be nearly instant. Keyboard-first and 100+/day actions generally get no entrance choreography. Occasional dialogs, drawers, and toasts can carry brief continuity. Rare onboarding or marketing moments have more range.
3. **Can it be interrupted?** Rapid toggles, drag, swipe, and reversible state changes must retarget from the current visual state. Prefer transitions or springs; reject keyframes that restart.
4. **What changes on screen?** Prefer `transform` and `opacity`. Treat `filter`, `clip-path`, colors, and masks as paint/compositing decisions to test. Treat size and position properties as layout work to contain or replace where practical. Do not claim a property is “GPU-only” without profiling.
5. **What is the reduced-motion equivalent?** Remove vestibular movement and parallax; preserve useful state feedback through opacity, color, or an instant change.

Favor quiet defaults. Common micro-feedback is appropriate on checkboxes, switches, pressable controls, icon swaps, selection indicators, progress/state confirmation, and spatially-linked popups—but only where the component does not already provide it. Keep transforms subtle, feedback immediate, and bounce absent unless physical momentum or product character earns it.

## Choose the lightest capable owner

Stop at the first layer that fully satisfies behavior, interruption, accessibility, support, and maintainability:

1. **No animation** — high-frequency, keyboard-driven, redundant, or purposeless.
2. **Existing primitive behavior** — preserve Base UI/shadcn lifecycle, semantics, and state attributes.
3. **Existing animation utility or plugin** — reuse project-defined keyframes, utilities, `tw-animate-css`, or equivalent when the behavior already fits.
4. **CSS transition expressed in the project’s Tailwind/CSS conventions** — hover, press, focus, checked state, popup lifecycle, and other state-to-state motion.
5. **CSS keyframes** — finite staged entrances or autonomous loops that are not rapidly reversed.
6. **Native platform animation** — `@starting-style`, discrete transitions, view transitions, scroll timelines, intrinsic-size interpolation, or registered custom properties, only after checking the project’s browser floor and a no-motion fallback.
7. **WAAPI** — imperative playback/control with platform animation performance and no framework runtime.
8. **Free Motion** — springs, gestures, layout/shared-element animation, MotionValues, or complex presence/state orchestration.
9. **Motion+** — an installed premium component/API or official example that is a clearer, smaller fit than layers 3–8.

CSS is the default for predetermined state changes because it is local, dependency-free, and often interruptible. It is not automatically faster: animated property, layer size, browser, and execution path decide performance. Motion can use WAAPI and compositor execution when written appropriately.

Read `references/decision-system.md` for the full audit/remediation model and `references/native-css.md` before using newer CSS. Read `references/view-transitions.md` before choosing React or platform View Transitions.

## Refactor for less machinery

Prefer deletions in this order:

1. Delete purposeless motion and its imports/configuration.
2. Replace repeated literal values with existing project tokens.
3. Collapse duplicated enter/exit objects, variants, and local `MotionConfig` instances.
4. Replace JS measurement/listeners with native CSS only when the browser floor supports the behavior or a clean fallback exists.
5. Replace Motion with CSS when the state is already represented in DOM attributes/classes and no spring, gesture, layout, or presence orchestration remains.
6. Replace hand-rolled gesture or layout code with installed Motion/Motion+ only when it reduces complexity and preserves semantics.

Never trade away focus management, DOM semantics, interruption, browser support, or reduced-motion behavior to win a line count. Report the before/after machinery count for meaningful simplifications.

## Implement in the project’s styling system

In Tailwind v4:

- Use native transition/animation utilities and `starting:`, `motion-safe:`, `motion-reduce:`, state/data, and `transition-discrete` variants when they express the whole rule clearly.
- Put shared easing, duration, and `--animate-*` values in `@theme`; consume variables with `duration-(--token)`, `ease-(--token)`, or `animate-(--token)`.
- Use an arbitrary property/value for a truly one-off gap. Promote reusable multi-declaration machinery to `@utility` or component-owned CSS. Do not scatter long arbitrary animation strings through markup.
- Specify transition properties. Avoid `transition: all`; note that Tailwind’s bare `transition` is a curated property set, not literally `all`, but it can still be broader than the component needs.

In Base UI, use lifecycle data attributes for CSS and `render` for Motion; do not transplant Radix `asChild`. Preserve primitive-controlled mounting unless a documented presence pattern requires hoisted state and `keepMounted`.

Read `references/patterns.md` for subtle controls and popup/accordion examples. Read `references/motion-runtime.md` only when Motion, Motion+, AI Kit, gestures, layout, or Base UI presence is relevant.

## Verify the actual interaction

- Trigger slowly, at normal speed, and repeatedly before completion; confirm reversals do not snap or queue.
- Test keyboard, pointer, touch where relevant, focus visibility, disabled states, and expanded hit areas.
- Emulate `prefers-reduced-motion`; confirm the state remains understandable without spatial movement.
- Inspect DevTools animation/rendering behavior or MotionScore when performance is in scope. Test large layers and busy main-thread conditions, not an empty demo.
- Check mount/unmount, scroll position, layout shift, transform origin, first render, and navigation interruption.
- Run the project’s focused static checks after live behavior passes.

## Review output contract

Lead with the verdict and highest-impact evidence. For reviews, use one markdown table with **Location**, **Before**, **After**, **Why**, and **Owner** columns; omit categories with no findings. Distinguish removal, correction, simplification, and additive polish. Cite `file:line`.

For implementation, summarize:

- what was removed, fixed, refactored, and added;
- meaningful motion machinery before/after;
- live and static verification;
- Motion+ account/example access, Motion AI Kit availability, free Motion runtime, project Motion+ runtime, and any fallback used.

Do not manufacture changes to fill a report. “The motion is already proportionate” is a valid result.

## Pre-ship

- [ ] Every remaining animation has a purpose and frequency call.
- [ ] The lightest capable owner was used; premium/runtime code was not added for a CSS-sized problem.
- [ ] Rapid and gesture-driven interactions retarget cleanly.
- [ ] Transition properties are explicit; persistent `will-change` and large animated blur are absent unless profiled.
- [ ] Motion+ access, AI Kit capability, free runtime, and premium project runtime were detected independently; unfamiliar APIs came from current docs, not memory.
- [ ] Reduced motion, keyboard, pointer/touch, mount/unmount, and first render were tested.
- [ ] Any experimental CSS has a verified browser floor, `@supports` guard where useful, and a behaviorally complete fallback.
- [ ] View Transitions preserve navigation/history semantics and match the installed React/framework contract.
- [ ] Refactoring reduced machinery without weakening semantics or support.

## References

| File | Load when |
| :--- | :--- |
| [`references/decision-system.md`](references/decision-system.md) | Auditing, prioritizing, deleting overkill, refactoring, easing/timing, performance, or accessibility. |
| [`references/native-css.md`](references/native-css.md) | Choosing Tailwind/CSS ownership or using 2026-era platform features and fallbacks. |
| [`references/patterns.md`](references/patterns.md) | Implementing subtle controls, icon swaps, popups, accordions, lists, or state transitions. |
| [`references/motion-runtime.md`](references/motion-runtime.md) | Using free Motion, Motion+, AI Kit, gestures, layout/shared elements, or Base UI presence. |
| [`references/view-transitions.md`](references/view-transitions.md) | Choosing or implementing cross-document, React, or Next.js View Transitions and verifying snapshot behavior. |

Open only the references the task needs.

## Sources and influences

This is an ingestion and distillation, not a reproduction. The primary foundation is Claudia Nathan’s original `design-motion` skill and working notes. Craft and judgment were further shaped by Emil Kowalski, Jakub Krehel, Josh Puckett, Rauno Freiberg, Benji Taylor, the Motion team, the Tailwind CSS team, the Vercel team, and MDN contributors.
