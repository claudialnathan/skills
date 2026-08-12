# Motion forensics

Capturing an animation, transition, or view transition well enough to reproduce it. Contents: [arming a capture](#arming-a-capture) · [reading a WAAPI or CSS animation](#reading-a-waapi-or-css-animation) · [scrubbing the timeline](#scrubbing-the-timeline) · [view transitions](#view-transitions) · [Motion (motion.dev)](#motion-motiondev) · [when getAnimations returns nothing](#when-getanimations-returns-nothing) · [scroll-driven motion](#scroll-driven-motion) · [what to record](#what-to-record)

Reference snapshot: 2026-08-07, agent-browser 0.33.2, Chrome 151. Verify anything version-specific against the tool's current documentation.

## Arming a capture

Most interesting motion is transient. A view transition's pseudo-elements exist only while it runs, an entrance animation plays once per mount, and by the time a probe is typed the evidence is gone. Arm before triggering.

The reliable mechanism is an init script, which runs before any page JavaScript on the next navigation. Register it with `--init-script <path>` at launch or `addinitscript` followed by a reload, then trigger the interaction, then read what the script collected.

Three things an init script is worth writing for:

- **Freeze on arrival.** Patch the entry point so the animation pauses the moment it becomes readable, rather than racing it. For a view transition that is `document.startViewTransition`, whose returned object exposes a `ready` promise — pause inside that, and the pseudo-element tree stays up for inspection.
- **Record what was created.** Push each `Animation` object, or its resolved timing, onto a global array the probe reads afterwards. This survives the animation finishing, which a live query does not.
- **Slow everything down.** Setting `playbackRate` below 1 on every animation turns a 300ms transition into something a screenshot sequence can actually resolve. Do this only for capture, and take timing numbers from `getComputedTiming()` rather than from the slowed clock.

Where a page cannot be reloaded, `document.getAnimations()` immediately after triggering still catches anything longer than a few hundred milliseconds. Treat that as the fallback, not the default.

The pattern that works for a view transition, verified against Chrome 151, is to take the object returned by `startViewTransition` and do the reading inside its `ready` promise, pausing everything at the end of the same callback. At that point the full pseudo-element tree is live and readable, and pausing holds it there for as many follow-up probes as needed.

## Reading a WAAPI or CSS animation

For each `Animation` returned, the two calls that carry the specification are `effect.getComputedTiming()` and `effect.getKeyframes()`. Between them they give duration, delay, end delay, easing, fill, iteration count, direction and the resolved property values at each offset. Take them verbatim. A duration read here is exact, and one inferred from frames is not.

Record alongside each: `effect.target`, `effect.pseudoElement`, and `playState`. Target plus pseudo-element is the only reliable identity — several animations frequently share a target and differ only in which pseudo-element they drive.

Read `effect.composite` and the per-keyframe `composite` too. Both default to `replace`; an `add` or `accumulate` means the effect's values compose onto whatever else drives the same property, and a reproduction that replaces instead will match wherever the animation runs alone and diverge wherever two effects overlap.

Easing needs care in two places. The per-keyframe `easing` in `getKeyframes()` and the effect-level `easing` in `getComputedTiming()` are different values that compose, and reading only the effect level routinely reports `linear` for an animation whose keyframes carry the real curve. Read both, and treat a bare `linear` at the effect level as a prompt to check the keyframes rather than as an answer. A CSS transition also reports the easing it was given, which for a `linear()` function is a long point list rather than a named curve — keep the list rather than rounding it to the nearest cubic-bezier.

Also read, from computed style on the target rather than from the animation:

- `transform-origin`, which decides where a scale or rotate appears to come from and is invisible in keyframes
- `overflow` and `clip-path` on ancestors, which decide whether the movement is travel or reveal
- `z-index`, `position`, `isolation` and `mix-blend-mode`, which decide what passes in front of what
- `will-change` and `contain`, which say what the author expected to be expensive

## Scrubbing the timeline

Pausing holds one frame; scrubbing produces the timeline. With everything paused, set `currentTime` on each animation and read the same property set at each stop, which turns the effect into a table of measured states instead of a single frozen impression.

Sample at 0, 15, 30, 50, 70, 85 and 100 percent of the active interval. The uneven spacing is deliberate — an ease-out puts most of its visible change in the first third, and evenly spaced stops step straight over it. Where several animations run together, drive them from one clock: set every `currentTime` to the same absolute millisecond value rather than to the same percentage of each animation's own duration, or overlapping effects with different durations get sampled out of phase and the timeline reconstructs wrongly.

`getComputedTiming()` reports `activeDuration` alongside `delay`. Scrub from `delay` to `delay + activeDuration` rather than from zero, or an animation with a delay reads as motionless across its first several stops.

At each stop, per animated element:

- `getBoundingClientRect()`, for position and size as rendered
- the computed `transform` — the matrix that actually ran, where the keyframes only say what was asked for
- `opacity`, `filter`, `backdrop-filter`, `clip-path`, `border-radius`, `visibility`
- anything the keyframes named that is not already in this list

Round at capture and keep the offset on every row. Seven rows per element stays small enough to hold in context, and it is what the reproduction gets checked against later — a comparison at matched offsets catches the case a final-state screenshot cannot, where both versions arrive correctly by different routes.

## View transitions

The generated tree nests in a fixed order, one branch per `view-transition-name` plus a `root` branch:

```
::view-transition
└─ ::view-transition-group(name)
   └─ ::view-transition-image-pair(name)
      ├─ ::view-transition-old(name)
      └─ ::view-transition-new(name)
```

The default treatment Chrome applies without any authored CSS is a cross-fade on opacity, an interpolation of position and transform between the old and new viewport rectangles, an interpolation of width and height, and `mix-blend-mode: plus-lighter` on the pair for a correct cross-fade. Recognising the default matters: a transition that looks carefully designed may be entirely unauthored beyond the `view-transition-name` assignments, and the corresponding implementation is then two lines of CSS rather than a keyframe set.

Expect the entry count to run well ahead of the number of things moving. Chrome 151 reports several animations per pseudo-element — an old and a new each carry their fade and their blend separately — so one named element plus the root branch returns ten entries for what a viewer reads as a single box resizing. Group the entries by pseudo-element name before interpreting them, and count names rather than animations when describing the transition.

What to establish, in order:

1. **Which elements carry a name.** Query for a non-`none` computed `view-transition-name` across the document before triggering. The set of names is the element correspondence — it is precisely the thing screenshots cannot give you.
2. **Whether `view-transition-class` is in use.** A class groups several named elements under one rule via `html::view-transition-group(.name)`, so authored CSS may be far smaller than the number of moving parts suggests.
3. **What is authored on top of the defaults.** Read the animations on the pseudo-elements while paused. Anything not in the default list above was written deliberately.
4. **Whether it is same-document or cross-document.** A cross-document transition needs the opt-in at both ends and behaves differently under navigation and history, which changes the implementation more than the visual does.

Chrome's Animations panel pauses and scrubs view transitions, and the pseudo-elements appear in the Elements panel while one is live — worth opening with `agent-browser inspect` when a person is going to look, and not a substitute for recording the values.

## Motion (motion.dev)

Motion splits its work between a WAAPI path and a main-thread path, so one page legitimately shows some of its animations in `getAnimations()` and none of the rest. A short list is therefore not evidence that Motion is absent — check the page's bundles, and on React the component tree, before concluding anything from the count. Where an API's behaviour decides the reproduction, check it against [current Motion documentation](https://motion.dev/docs) rather than from memory.

Four of its behaviours have a readable signature, and each one changes what the specification has to say.

**Springs.** A spring has no duration and no easing to read — its parameters are stiffness, damping and mass, or the `bounce` and `duration` pair. On the main-thread path there is no `Animation` object to take them from, and what is recoverable comes from the sampled curve: whether the value overshoots its target at all, the peak overshoot as a fraction of total travel, how many times it crosses the target before resting, and the time from trigger to visually at rest. Sample on every animation frame rather than on a timer — at 60Hz that is roughly 16ms, and a short spring's overshoot can occupy two or three frames, so a coarser interval misses it and reports the spring as a plain ease-out. Give those four observations and say they imply a spring. Do not convert them into a cubic-bezier, which is the one thing the motion is not.

**Layout animations.** `layout` and `layoutId` move things by measuring, then transforming: the element's layout box is already at its destination while a transform holds it visually at its origin. That has a direct probe, because `offsetWidth` and `offsetHeight` are layout values that ignore transforms while `getBoundingClientRect()` includes them. Read both mid-flight. If they disagree, the movement is a transform over settled layout rather than an interpolation of layout itself — which decides whether the reproduction animates `width` or animates `scale`, and is exactly the distinction a screenshot sequence cannot make.

**Presence.** An exit animation needs the outgoing node to stay mounted after the state that rendered it is gone, so both states coexist mid-flight. Count matching nodes before, during and after the trigger instead of assuming one replaced the other, and record whether the outgoing node still occupies layout space or has been taken out of flow. That choice shows up as a reflow of the surrounding content, and it is a common thing for a reproduction to get wrong while matching the animation itself.

**Values driven imperatively.** MotionValues, and anything wired to scroll, pointer or drag, are written to the element outside any animation timeline. They surface as inline styles being rewritten frame by frame and produce no `Animation` object at all. Sample them against their driver rather than against a clock — replaying a pointer-driven or scroll-driven value against time reconstructs a curve that holds only for the one input speed that happened to be captured.

## When getAnimations returns nothing

An empty array while something moves is a classification, not a dead end. Establish which case it is before sampling, because sampling is the slowest option and the named engines have a better probe.

**GSAP.** Runs on its own ticker and is structurally invisible to `getAnimations()`. Read `gsap.version`, and `window.gsapVersions` where several copies are loaded. The introspection entry point is `gsap.globalTimeline.getChildren()`, whose parameters select nested children, tweens and timelines; take each child's accessors for duration, delay, easing and targets from [current GSAP documentation](https://gsap.com/docs/v3/) rather than from memory, since the internals are not all public API. Do not call `pause()` or `timeScale()` on the global timeline of a page under inspection without expecting it to affect everything at once.

**Motion.** Its main-thread path is the usual reason a page with obvious motion returns a short list or an empty one; springs, physics and properties that cannot be accelerated all take it. See [Motion (motion.dev)](#motion-motiondev) above for the per-behaviour probes.

**Anything else, including hand-written rAF.** Sample. Read the target's bounding rectangle and the computed values of the handful of properties that plausibly change, on a timer, into an array; then read the array once at the end. Sample the properties you have reason to suspect rather than everything, and record the timestamps alongside the values so the curve can be recovered. This produces a shape and a duration, not an easing name — say so rather than naming a curve that was never read.

For canvas and WebGL, the semantics are not in the DOM at all. Capture frames with `record start` / `stop` and a performance trace, and describe the effect without claiming timings that were not measured.

## Scroll-driven motion

Establish which of three mechanisms is running before measuring anything, because they fail and reproduce differently:

- **Native scroll-driven animations**, which appear in `getAnimations()` with a scroll or view timeline; their timing reads in progress rather than milliseconds
- **A scroll listener or observer** driving style or transform directly, which needs sampling against scroll position rather than against time
- **A smooth-scroll library** intercepting the scroll itself, which changes what scroll position even means and is worth identifying early — the motion often looks wrong when reproduced simply because the interception is missing

Sample against `scrollY` rather than against a clock for the last two, and record the scroll positions at which the effect starts and ends.

## What to record

For a reproduction, hold all of this before writing code. A gap here becomes a magic number later.

- The exact trigger, and whether it reproduces on every attempt — an effect that fires once per session needs a fresh context to see twice
- The engine class, and the evidence for it
- Old-to-new element correspondence, by name or by pseudo-element
- A millisecond timeline: what starts when, and what overlaps
- Per element: duration, delay, easing, keyframes, fill, composite, transform origin
- For a spring, in place of duration and easing: overshoot present or not, peak overshoot as a fraction of travel, crossings before rest, time to rest
- Whether movement is a transform over settled layout or an interpolation of layout itself
- The scrub table: the sampled offsets and the measured values at each
- Layering and clipping: stacking order, clipped ancestors, blend modes
- Lifecycle: what mounts, what unmounts, whether both states coexist mid-flight
- Behaviour under `prefers-reduced-motion`, captured separately with `set media` — a reference with no reduced-motion path is a finding worth reporting, not a detail to copy
- What could not be established, named as such
</content>
