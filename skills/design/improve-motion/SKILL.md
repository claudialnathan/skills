---
name: improve-motion
description: "This skill should be used when the user asks to audit, review, fix, simplify, refactor, remove, add, or improve UI animation, motion, transitions, page or view transitions, micro-interactions, gestures, scroll effects, layout animation, enter/exit behavior, easing, springs, or animation performance. It infers the product's motion language from its best tuned interactions, preserves continuous identity through morphs when appropriate, avoids generic fades and choreography, judges whether motion earns its place, and routes implementation to native CSS/Tailwind, WAAPI, free Motion, or an already-installed Motion+ capability."
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

Improve how motion looks and feels rather than maximizing it. Two co-equal lenses decide the outcome: **does it earn its place** — purpose, frequency, and accessibility — and **does it feel native to this product** — identity, easing, direction, choreography, interruption, and restraint. A good pass may retune, morph, simplify, add one subtle response, or delete motion entirely.

Read the implementation before prescribing motion. Inspect the rendered interaction when possible; feel cannot be judged reliably from class names alone.

Treat origin as provenance, not proof of quality. Project code, shadcn core, a community registry, a copied example, and AI-authored code can each contain either excellent or generic motion. Preserve required behavior, semantics, focus, and public APIs; audit the animation independently. The best existing interactions in the product are calibration evidence, not every animation currently checked in.

## Route the task

Choose the narrowest matching mode:

| User intent | Action |
| :--- | :--- |
| “audit,” “review,” “what feels off?” | Inspect and report evidence; do not edit unless fixes were requested. |
| “fix,” “improve,” “polish” | Audit, implement the highest-leverage coherent changes, and verify them live. |
| “simplify,” “refactor,” “reduce code” | Preserve behavior while removing wrappers, hooks, duplicated variants, magic numbers, and unnecessary dependencies. |
| “add motion,” “make this feel responsive” | Find the few common seams where feedback or continuity helps; avoid an animation wishlist. |
| A named interaction/effect | Implement that effect, but still apply the feel, purpose, frequency, accessibility, and capability gates. |

For a broad audit, cover the whole requested surface. For a component or diff, stay local. Do not turn a focused request into a repo-wide redesign.

## Start with recon

1. **Read the interaction.** Identify the trigger, state change, frequency, input methods, spatial relationship, and product personality. Name the motion's job: feedback, continuity, hierarchy, progress, causality, or rare character.
2. **Reproduce the seam.** Watch it at normal speed, in slow motion, and while reversing before completion. Exercise keyboard and pointer input, reduced motion, and the weakest realistic device or busy-page state. For runtime work, the browser is the acceptance criterion.
3. **Derive the local motion language for taste-sensitive or additive work.** Find up to two or three nearby interactions that are intentionally tuned and visibly successful. Record their response speed, energy, direction/origin, continuity technique, choreography, and reduced-motion treatment. Prefer those exemplars and project tokens over generic recipes; do not average in every incidental `transition-*` string. If no reliable exemplar exists, say so and fall back explicitly to matching source material plus the calibrated defaults.
4. **Map the stack.** Inspect dependencies, lockfile, UI primitives, global motion tokens, CSS ownership, browser targets, and nearby precedent. Search for `transition`, `animation`, `@keyframes`, `motion.`, `animate`, `layoutId`, `view-transition`, `will-change`, and reduced-motion handling.
5. **Detect runtime/tooling capabilities only when the route reaches Motion/Motion+, an unfamiliar runtime API, or the user asks about them.** Keep the signals separate:
   - Record Motion+ account/example access from explicit user context or a successful premium AI Kit result.
   - Treat the Motion AI Kit and any callable Motion MCP tools, where available, as authoring capability.
   - Treat `motion` in project dependencies/imports as the free runtime.
   - Treat `motion-plus` or `@motionplus/core` in project dependencies/imports as premium runtime installed in this project.
   - Never infer project runtime installation from account or AI Kit access.
6. **Record a small baseline when simplifying.** Count relevant motion imports, wrappers, hooks, variants/keyframes, and lines. Optimize for less machinery, not merely fewer formatted lines.

## Infer the right motion before choosing an effect

Start with identity, not an animation primitive:

1. **Would the user perceive state B as the same object as state A?** Preserve identity first: position, size, shape, radius, and shared sub-elements can morph. Examples include a trigger becoming a dialog, a field expanding into an editor, a selected pill moving between labels, or a compatible SVG glyph reshaping.
2. **Is there a meaningful visual in-between?** If yes, morph it. If not, use an instant change or a quiet mounted handoff such as opacity + small scale/blur. Copy → check may be a handoff; edit → saving → done may earn a path morph when the changing control is a continuous state carrier.
3. **What is the primary motion carrier?** Choose one element that explains the change. Let content dissolves, icon changes, and color shifts support it instead of making every descendant perform.
4. **Where did the change come from?** Preserve causal origin and direction: anchored popups grow from their trigger, a reveal can originate at the activating icon, and a shared surface can return to its source on close.
5. **What local grammar should it speak?** Reuse the product's established energy, curve family, response speed, and reduced-motion approach. Add bounce, blur, stagger, or long travel only when that grammar and the interaction's frequency earn them.

Read `references/craft.md` for the full inference method, continuity ladder, easing, choreography, and exemplar anatomy. A naked fade is not automatically wrong; it is wrong when it substitutes for meaningful continuity or becomes generic choreography. A morph is not automatically right; it needs continuous identity, a legible in-between, and proportionate frequency.

## Decide before animating

The co-equal lens: motion that feels good but should not exist is still the wrong answer. More animation is not better — an effect a user triggers hundreds of times a day gets in the way. Ask in order:

1. **Does motion have a job?** Keep motion that explains change, confirms input, maintains spatial continuity, or prevents a jarring seam. Remove decoration that competes with the task.
2. **How often is it seen?** Repeated productivity actions must be nearly instant. Keyboard-first and 100+/day actions generally get no entrance choreography. Occasional dialogs, drawers, and toasts can carry brief continuity. Rare onboarding or marketing moments have more range.
3. **Can it be interrupted?** Rapid toggles, drag, swipe, and reversible state changes must retarget from the current visual state. Prefer transitions or springs; reject keyframes that restart.
4. **What changes on screen?** Prefer `transform` and `opacity`. Treat `filter`, `clip-path`, colors, and masks as paint/compositing decisions to test. Treat size and position properties as layout work to contain or replace where practical. Do not claim a property is “GPU-only” without profiling.
5. **What is the reduced-motion equivalent?** Remove vestibular movement and parallax; preserve useful state feedback through opacity, color, or an instant change.

Favor quiet defaults. Common micro-feedback is appropriate on checkboxes, switches, pressable controls, icon swaps, selection indicators, progress/state confirmation, and spatially-linked popups—but only where the component does not already provide it. Keep transforms subtle, feedback immediate, and bounce absent unless physical momentum or product character earns it.

## Reach for the right capability, not every capability

Before using an unfamiliar Motion or Motion+ API, verify it against current official Motion documentation rather than memory. Where callable Motion MCP tools are available, use them for the specific job and nothing more:

- Search current docs and official examples before using an unfamiliar Motion/Motion+ API.
- Generate a CSS `linear()` spring instead of inventing one.
- Run a performance pass (e.g. MotionScore) for a requested performance audit or a runtime where jank is plausible.
- Preview a spring/easing when feel is uncertain.

When runtime Motion work actually needs these capabilities: if the AI Kit is unavailable, proceed from current official documentation and mention the missing authoring capability at handoff. If neither `motion-plus` nor `@motionplus/core` is present, implement with the project’s existing animation utilities, free Motion, Tailwind, CSS, or WAAPI. Report “Motion+ runtime not installed in this project,” not “Motion+ unavailable,” when account entitlement or AI Kit access exists. Keep entitlement unknown when it cannot be established. Name the fallback that shipped. Do not ask for or handle a private registry token. Use a premium API only when a recognized Motion+ package or import is present, current documentation confirms it, and it materially removes code or improves the interaction.

For a broad repo audit, share the same local motion-language notes, stack, browser floor, and frequency context across every area; re-open every cited finding before reporting it. Load one reference and one Motion capability at a time—do not ingest every documentation result “just in case.”

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

Read `references/craft.md` for easing, morphing, and the feel details; `references/decision-system.md` for the full audit/remediation model; and `references/native-css.md` before using newer CSS. Read `references/view-transitions.md` before choosing React or platform View Transitions.

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

Read `references/patterns.md` for the problem-first lookup and stable recipes. Read `references/motion-runtime.md` only when Motion, Motion+, AI Kit, gestures, layout, or Base UI presence is relevant.

## Verify the actual interaction

- Trigger slowly, at normal speed, and repeatedly before completion; confirm reversals do not snap or queue.
- Watch the curve and any morph in slow motion: the easing should suit the element's job, continuous identity should read as one object changing, supporting motion should not compete with the primary carrier, and authored frame scaling must not distort text.
- Compare the result beside one or two chosen product exemplars when available. Match their grammar, not their literal duration.
- Test keyboard, pointer, touch where relevant, focus visibility, disabled states, and expanded hit areas.
- Emulate `prefers-reduced-motion`; confirm the state remains understandable without spatial movement.
- Inspect DevTools animation/rendering behavior or MotionScore when performance is in scope. Test large layers and busy main-thread conditions, not an empty demo.
- Check mount/unmount, scroll position, layout shift, transform origin, first render, and navigation interruption.
- Run the project’s focused static checks after live behavior passes.

## Review output contract

Lead with the verdict and highest-impact evidence. Briefly state the motion language observed—its energy, response profile, continuity habits, and strongest exemplars—or say that no reliable local grammar was found. Separate observations from proposed changes. When the cause is not proven, report the rendered behavior, reproduction state, and verification criterion without inventing an **After** patch.

Present every change made or proposed in a markdown table with **Location**, **Before**, **After**, **Why**, and **Owner** columns. Group by removal, correction, simplification, continuity/morph, and additive polish only when those groups contain findings. For continuity changes, the **Why** must name the identity and primary motion carrier. Cite `file:line`.

For implementation, summarize:

- what was removed, fixed, refactored, and added;
- meaningful motion machinery before/after;
- live and static verification;
- when runtime Motion/Motion+ was relevant: account/example access, AI Kit availability, free runtime, project premium runtime, and any fallback used.

Do not manufacture changes to fill a report. “The motion is already proportionate” is a valid result.

## Match the requested execution mode

- **Audit/review** → inspect rendered motion and report evidence-backed findings; do not edit unless requested.
- **Fix/improve/polish** → implement the smallest coherent changes and verify them in the same task. Do not stop at a plan merely because the change spans files.
- **Add motion or create a reusable motion primitive** → derive the local motion language, define the interaction/identity contract and fundamental parameters, implement one coherent abstraction, and exercise it in a representative state sequence.
- **Simplify/refactor** → preserve the rendered contract while reducing machinery; report the scoped before/after count.
- **Plan/handoff** → write a self-contained plan only when requested or when execution is genuinely blocked. Include the local motion language, trigger/frequency/input context, identity and primary carrier, owner routing, capability/fallback decisions, concrete changes, guardrails, and live/static verification. Review an executor's rendered result when a handoff actually occurs.

## Pre-ship

- [ ] Every remaining animation has a purpose and frequency call.
- [ ] The result follows the product's best relevant exemplars when available—not the average of every existing transition—or explicitly uses source/default calibration when no reliable local grammar exists.
- [ ] Easing matches what each element does and the project's curve family; unfamiliar curves were previewed rather than judged from numbers.
- [ ] Continuous-identity changes preserve the right object and primary carrier; morphing was not forced where no meaningful in-between exists.
- [ ] Supporting dissolves, icon changes, color shifts, and stagger do not compete with the primary motion; no generic text/frame fade was added by reflex.
- [ ] The lightest capable owner was used; premium/runtime code was not added for a CSS-sized problem.
- [ ] Rapid and gesture-driven interactions retarget cleanly.
- [ ] Transition properties are explicit; persistent `will-change` and large animated blur are absent unless profiled.
- [ ] When runtime Motion/Motion+ was relevant, access, AI Kit capability, free runtime, and premium project runtime were detected independently; unfamiliar APIs came from current docs, not memory.
- [ ] Reduced motion, keyboard, pointer/touch, mount/unmount, and first render were tested.
- [ ] Any experimental CSS has a verified browser floor, `@supports` guard where useful, and a behaviorally complete fallback.
- [ ] View Transitions preserve navigation/history semantics and match the installed React/framework contract.
- [ ] Refactoring reduced machinery without weakening semantics or support.

Treat API names, package names, and browser support as perishable. The reference snapshots were checked on 2026-07-23; verify current official docs and the project's actual dependency and browser versions before claiming a feature, package, or fallback is available.

## References

| File | Load when |
| :--- | :--- |
| [`references/craft.md`](references/craft.md) | Load first when taste, identity, choreography, or an undocumented animation must be inferred. |
| [`references/decision-system.md`](references/decision-system.md) | Auditing, prioritizing, deleting overkill, refactoring, duration/frequency, performance, or accessibility. |
| [`references/native-css.md`](references/native-css.md) | Choosing Tailwind/CSS ownership or using 2026-era platform features and fallbacks. |
| [`references/patterns.md`](references/patterns.md) | Start here for the top problem-to-pattern lookup, then load the named stable recipe. |
| [`references/motion-runtime.md`](references/motion-runtime.md) | Using free Motion, Motion+, AI Kit, gestures, layout/shared elements, or Base UI presence. |
| [`references/view-transitions.md`](references/view-transitions.md) | Choosing or implementing cross-document, React, or Next.js View Transitions and verifying snapshot behavior. |

For a known motion problem, open `patterns.md` first and use its top lookup table; load `craft.md` if the identity or product-grammar decision remains unresolved. For taste-sensitive or undocumented motion, open `craft.md` first, then use `patterns.md` for the selected implementation recipe. Open only the remaining references the route needs.

## Sources

This is an ingestion and distillation, not a reproduction. The primary foundation is Claudia Nathan’s original `design-motion` skill and working notes. The craft and judgment further draw on the works of [Emil Kowalski](https://emilkowal.ski/) (including the animations.dev course), [Rauno Freiberg](https://rauno.me/), [Jakub Krehel](https://jakub.kr/), [Josh Puckett](https://joshpuckett.me), and [benji.org](https://benji.org), and on documentation from the [Motion](https://motion.dev/), [Tailwind CSS](https://tailwindcss.com/), and [Vercel](https://vercel.com/) teams and [MDN](https://developer.mozilla.org/). Acknowledgment only — not a reading list to open mid-task.
