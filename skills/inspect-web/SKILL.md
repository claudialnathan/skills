---
name: inspect-web
description: "This skill should be used when the question is how a live web page achieves something, or why it looks or behaves wrong — an animation, view transition, layout, type scale, colour scheme, or load speed — on our own page or a third-party reference, whether to reproduce the effect or to diagnose it. Reads timings, easings, keyframes, geometry, computed styles and resource waterfalls out of the running page, so the answer carries measured values rather than a screenshot's impression."
---

# inspect-web

Answer a question about a live page from its runtime. A screenshot carries appearance; it does not carry duration, easing, element correspondence, transform origin, clipping, stacking, or which of two things is actually slow. Read those, then answer.

The failure this exists to prevent: a page gets screenshotted, the most obvious visual reading gets implemented, and the result is a rough approximation nobody can say is wrong because nothing was measured.

## Preflight

Before the first command of a session:

```bash
agent-browser --version && npm view agent-browser version
```

- **Missing CLI** — install with `npm i -g agent-browser`, then `agent-browser install` for its browser. Stop and tell the user if either step is unavailable rather than substituting a fetch of the page's HTML, which carries no runtime.
- **Behind the registry** — upgrade before proceeding. The CLI serves documentation matched to its own version, so a stale binary reports a stale capability set.
- **Capability inventory** — `agent-browser skills list`, then `agent-browser skills get core --full` for the command and flag reference. Read it rather than working from a remembered set.

`agent-browser doctor --fix` diagnoses launch failures, stale daemons, and version mismatches. `agent-browser inspect` opens the Chrome DevTools panel on the active page when a person wants to look directly.

Inspection is read-only against someone else's site. Request interception and response substitution belong against a local or disposable runtime, not a reference.

## Decide the launch before navigating

Three capabilities are fixed at launch and cannot be retrofitted onto an open page. Choose them from the question being asked, because discovering the gap three probes in costs the whole capture.

| Needed for                                                                        | Launch with                                                                 |
| :-------------------------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| Any `react tree` / `inspect` / `renders` / `suspense` call                        | `agent-browser open --enable react-devtools <url>`                          |
| Catching anything transient — a view transition, a one-shot entrance, an rAF loop | `--init-script <path>`, registered before the first navigation              |
| Cold load, request interception, SSR-only HTML                                    | `agent-browser open` with no URL, stage routes and scripts, then `navigate` |

`addinitscript` registers at runtime for the _next_ navigation, so a reload is enough to arm a capture without relaunching.

## Route to the smallest probe that answers it

Run one probe, read it, then decide the next. Running the full battery on arrival buries the answer and spends most of the budget on evidence nobody asked for.

| The question                           | Read                                                                      | Keep it cheap by                                                                                         |
| :------------------------------------- | :------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------- |
| Which colours, fonts, spacing, radii   | `eval` returning resolved computed values for a named handful of elements | Resolving used values; never dump a stylesheet                                                           |
| How a section is laid out              | `get box` plus the container's `display`, `grid-template-*`, `gap`        | Sampling the container and two or three children, not the tree                                           |
| Why it breaks at some width            | The same read at two viewports either side of the break                   | Capturing both sides — the break is a delta, so one side proves nothing                                  |
| How an animation works                 | Classify the engine first (below), then the probe that engine allows      | Not sampling before classifying                                                                          |
| How a page or view transition works    | An init script armed before the navigation that triggers it               | Arming once; a missed transition costs a reload, not a relaunch                                          |
| How fast it loads, why images are slow | `vitals`, then `network har start` / `stop <path>` on a cold load         | Writing the HAR to disk and querying the file — a HAR pasted into context is enormous and mostly headers |
| Why it stutters                        | `trace start` / `trace stop <path>`, then read the file                   | Same: the trace goes to disk, not into context                                                           |
| How a React component is built         | `react tree` scoped to the subtree, then `react inspect <id>`             | Scoping — a whole-app tree is one of the largest outputs available                                       |
| Whether it is accessible               | `a11y --selector <css>`                                                   | Scoping the selector; whole-page `--json` is large                                                       |
| Reference against our build            | `diff url <reference> <local>`, or `diff screenshot --baseline`           | Letting the tool do the comparison instead of narrating two screenshots                                  |

Two levers matter more than the rest. Anything that writes a file — HAR, trace, profile, video — costs almost nothing in context, so prefer it over an inline dump and query the file afterwards. And shape every `eval` to return a small object of already-rounded values rather than a DOM fragment: use `eval --stdin` with a heredoc for anything beyond a bare expression, since inline quoting breaks on real scripts.

`agent-browser batch` runs several commands in one call, which is worth it for a fixed sequence and not worth it while still deciding what to look at.

## Classify the engine before specifying anything

Everything downstream depends on this, and it is one probe:

```js
document.getAnimations();
```

That is the whole-document sweep and it already includes pseudo-elements, `::view-transition-*` among them. It takes no arguments — `{ subtree: true }` is an `Element.getAnimations` option, and passing it here is silently ignored rather than doing anything. Reach for `someElement.getAnimations({ subtree: true })` only to scope a read to one subtree.

For each entry, `effect.getComputedTiming()` gives duration, delay, easing, fill, iterations and direction, and `effect.getKeyframes()` gives the actual property values. Record `effect.target` and `effect.pseudoElement` together, because on a view transition the target is the root element and the pseudo-element is the only thing identifying what moved. One pseudo-element commonly carries more than one animation, so the entry count is not the number of moving parts.

Branch on what comes back:

- **Entries returned** — CSS transition, CSS keyframes, WAAPI, or a library's WAAPI path. Timing and keyframes are exact; take them rather than estimating from frames.
- **Nothing returned while something is visibly moving** — the motion is not WAAPI or CSS, so an empty array is a result and not an absence of animation. Say which of the cases below it is before continuing.
- **Canvas or WebGL** — the semantics are not recoverable. Capture frames and a trace, and describe the effect rather than claiming a timing.

When nothing is returned, the next probe depends on what is driving it. GSAP runs on its own ticker and never appears in `getAnimations()`: read `gsap.version` and walk `gsap.globalTimeline.getChildren()`, then take each child's documented accessors from [current GSAP docs](https://gsap.com/docs/v3/) rather than from memory. Motion runs a hybrid engine, so a single site legitimately shows some animations in `getAnimations()` and hides others — its springs and non-accelerable properties take the main-thread path and stay invisible. Where no library is identifiable, fall back to sampling geometry and computed style over time, which is slower and coarser but always available.

Identify libraries by behaviour first and by name second. A global or a bundle filename is a fair hint and rots quickly under renames and minification; whether the motion appears in `getAnimations()`, and whether inline styles are being rewritten frame by frame, is a property of the page you can read today.

Chrome's own Animations panel captures CSS animations, CSS transitions, Web Animations and the View Transitions API, and does not capture `requestAnimationFrame` — the same boundary, which is a reason to trust the classification rather than a coincidence.

## Say which numbers were measured

Give exact values where a probe returned them, and mark the rest as estimated with the reason. A duration read from `getComputedTiming()` and a duration guessed from frame timestamps are different kinds of claim, and the second one silently becomes a magic number in the implementation. Where a capture failed, name the gap instead of filling it.

## Replicating a reference

Capture, specify, build, then compare — and compare at matched points rather than at the end, because a correct final state is exactly what a wrong implementation also produces.

Before writing code, hold: the trigger; the engine class; which element in the old state corresponds to which in the new; a millisecond timeline; per-element timing, easing and keyframes; transform origin, clipping, stacking; and the reduced-motion behaviour. Check `prefers-reduced-motion` is off during capture, or the reference will under-report its own motion.

For anything spanning more than a couple of elements, write that down before editing — a measured spec survives compaction and hands cleanly to another model, where a spec held in context does not. Put it where the user can open it: the working directory root, or an existing `docs/` folder. Working captures — HAR, traces, video, screenshots — go in a gitignored folder and get removed when the task ends.

Then implement with the primitives the target project already has, which is a separate decision from how the reference happened to do it. A native view transition, a CSS keyframe set and a runtime library can produce the same motion; the reference's choice is evidence about the effect, not a requirement on the build.

Verify by triggering both at the same viewport from equivalent states and comparing geometry, trajectory, timing, easing, clipping, layering and final state. `diff url` does this in one call. Report what still differs rather than stopping at the first implementation that looks close.

## Diagnosing rather than replicating

When the question is why something is wrong, the measurement is the answer and there is usually no spec to write. Capture the broken state and one working comparison — the same component elsewhere, the same page at a width that works, or the state before the change — because a single reading of a broken thing rarely identifies its cause. Interruption, reversal, repeat firing, and a second instance in sequence surface most motion bugs that a single play does not.

## Capabilities beyond the browser CLI

Check what else is available locally and through connected MCP servers or plugins before assuming a gap: a framework's own devtools give routes, compilation state and server logs the browser cannot see, and an animation library's own MCP is the right place to check an API against current docs. One known gap in the CLI is a single-command Lighthouse-style audit; where a DevTools MCP happens to be connected, that is where such an audit comes from, and otherwise compose the same picture from `vitals`, a trace and a HAR. Do not require any of these — they are additions when present, and the CLI path above is complete without them.

Where this file and a tool's current documentation disagree, follow the documentation. Reference snapshot: 2026-08-07, agent-browser 0.33.2, Chrome 151.

## References

| File                                             | Load when                                                                                                                    |
| :----------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| [`references/motion.md`](references/motion.md)   | Capturing an animation, a view transition, or scroll-driven motion, and for the per-engine probes and the sampling fallback. |
| [`references/design.md`](references/design.md)   | Extracting layout, grid, type scale, colour, spacing, or token structure from a page.                                        |
| [`references/loading.md`](references/loading.md) | Anything about speed: images, fonts, waterfalls, Core Web Vitals, or jank.                                                   |

## Sources

> This skill draws inspiration from publicly available content from [agent-browser](https://agent-browser.dev), [Chrome DevTools](https://developer.chrome.com), [MDN](https://developer.mozilla.org), [Motion](https://motion.dev), and [GSAP](https://gsap.com).
