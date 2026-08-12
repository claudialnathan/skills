# The improve-* skill shape: applied judgment as a decision router

Owner's design record for the `improve-*` family (`improve-layout`, `improve-motion`, and future skills with the same nature). Gitignored — this is the spec behind the shape, not a shipped file. If it contradicts a shipped skill, the skill wins; reconcile the drift here.

## The idea in one line

An `improve-*` skill helps an agent inspect what exists, infer what “better” means in this product, route each problem to the lightest capable owner, make only evidence-backed changes, and verify the real result.

It is not primarily a catalogue of techniques. It is a reusable decision system for a domain where quality depends on context, intent, and rendered behavior.

## The family contract

Every skill of this shape must answer the same questions:

| Decision | The skill must make clear |
| :--- | :--- |
| Task mode | Is this an audit, implementation, simplification, new reusable primitive, named effect/pattern, or requested plan? |
| Intent | What is the current result for, and which invariants must survive? |
| Evidence | What was observed in the rendered product, source, project conventions, and best local exemplars? |
| Domain relationship | What is the load-bearing domain decision before choosing syntax? |
| Ownership | Which existing component, native platform feature, utility, CSS rule, runtime, or custom abstraction should own it? |
| **Authoring order** | **On a build task, which state gets written first — and which one is therefore never left as residue?** |
| Scope | What is the smallest coherent change, and what should remain untouched? |
| Output | How are observations separated from proven changes and speculative ideas? |
| Verification | What live behavior proves the result works, beyond static checks? |

### Authoring order is the one most easily missed

Added 2026-07-27 after `improve-layout` shipped recurring mobile defects. The skill was not missing knowledge — it was ahead of every comparable source on the domain. It said "decide the narrowest state while designing the widest one," which is a decision to *hold in mind*, never an instruction to *write* that state first. So on a build task the model wrote the desktop composition it was asked for, satisfied every routing rule at desktop width, and the narrow state was whatever fell out.

Each domain has a default state that a build request never explicitly asks for and that therefore arrives as residue:

- **Layout:** the narrow state. Write it as the base declaration; wider states only add.
- **Motion:** the reduced-motion state. Ask whether motion is the base with a reduction bolted on, or the static state with motion added behind a `no-preference` query.
- **Composition:** the non-happy path — loading, empty, error, long-content.
- **Future domains:** find the state the user's phrasing implies but never names, and make writing it first the default.

**Mention is not order.** A skill can reference the residual state repeatedly and still produce output shaped the other way. When auditing a skill for this, read for an explicit instruction about what to write first — not for whether the topic appears.

The domain relationship changes by skill:

- **Layout:** identify the spatial role, responsive intent, source order, fixed/fluid relationship, and pressure point before choosing Grid, Flexbox, a container query, shadcn, or a custom primitive.
- **Motion:** decide whether states share identity, need a content handoff, or should change instantly; name the primary motion carrier before choosing CSS, layout animation, path morphing, presence, or no animation.
- **Future domains:** find the equivalent decision that separates a good result from mechanically applying a technique.

## The package shape

Use this as the default architecture, not a mandatory file count:

```text
improve-<domain>/
├── SKILL.md
├── agents/openai.yaml          # optional picker metadata or invocation policy
└── references/
    ├── patterns.md             # problem-first lookup + stable recipes
    ├── <judgment>.md           # taste/inference model when the domain needs one
    ├── advanced.md             # guarded, niche, or support-sensitive mechanisms
    └── <specialist>.md         # runtime/API/platform detail loaded only when routed
```

### Keep SKILL.md as the router

Target fewer than 3,000 words. Keep only the instructions needed on every invocation:

1. purpose and provenance rule;
2. task-mode router;
3. reconnaissance/evidence order;
4. the domain's load-bearing decision;
5. owner/capability ladder;
6. implementation conventions;
7. review output contract;
8. requested execution-mode contract;
9. rendered and static verification;
10. pre-ship checklist;
11. deterministic reference routing.

Move detailed recipes, long examples, support matrices, and API instructions into references. Do not duplicate a large reflex table in SKILL.md when `patterns.md` can index the same decisions more effectively.

### Put a lookup table at the top of patterns.md

Start from the user's pressure point, not from a favorite technique. Put the table before the recipes:

| Need / pressure point | Domain decision | Stable first route | Key constraint | Section |
| :--- | :--- | :--- | :--- | :--- |
| A recognizable user problem | The relationship or intent that changes the answer | The lightest stable owner | The main “when not” guard | Link to the recipe |

The exact columns may compress to four when clearer. The important properties are:

- phrased in the user's problem language;
- distinguishes superficially similar jobs;
- routes to a stable baseline before advanced machinery;
- exposes the constraint that would make the suggested pattern wrong;
- links directly to the detailed section.

Keep stable and broadly applicable patterns in `patterns.md`. Move draft, experimental, unusually clever, support-sensitive, or easy-to-misuse mechanisms to `advanced.md`, and point there only from the relevant lookup row.

### Make reference loading deterministic

Avoid “read all references” and avoid contradictory “load this first” instructions.

- **Known problem or named pattern:** open `patterns.md`, use the lookup, then load only the selected recipe or specialist reference.
- **Taste-sensitive, ambiguous, or undocumented result:** open the domain judgment reference first, derive the relationship/grammar, then route to a pattern.
- **Advanced mechanism:** load `advanced.md` only when the stable route is insufficient and the lookup explicitly points there.
- **Runtime/API work:** load the runtime reference only after the owner ladder reaches it.

## Infer quality from the host product

General guidance cannot fully document “great.” Teach the agent how to infer it.

### Choose exemplars, not averages

For additive or taste-sensitive work, find up to two or three nearby examples that are intentionally tuned, rendered successfully, and comparable in purpose or frequency. Do not average every implementation in the repo. Library defaults, registry imports, experiments, AI-generated code, and incidental utility strings are evidence—not calibration.

Record the dimensions that matter in the domain. Motion, for example, records job/frequency, identity/carrier, response/energy, geometry/origin, temporal hierarchy, interruption/exit, and reduced-motion treatment. Layout records role, content priority, density, fixed/fluid decisions, transition behavior, source order, and scroll ownership.

Reduce the evidence to a compact local grammar. A new result should fit that grammar rather than copy another component's literal values.

If no reliable exemplar exists, say so. Fall back explicitly in this order:

1. user-stated intent and desired character;
2. project tokens, shared primitives, and established conventions;
3. matching source material or current official examples;
4. calibrated defaults from the skill.

Never invent a “house style” from mediocre precedent.

### Treat provenance as provenance

Project code, shadcn core, community registries, copied examples, and agent-authored code can each be excellent or brittle. Preserve their required behavior, accessibility, public API, and state contract; audit the domain implementation independently.

An imported component does not earn exemption from the checks relevant to its behavior. Route verification by the affected domain, interaction, and regression risk rather than running every possible check on every change.

## Write calibrated judgment, not dogma

Strong skills need defaults, but every default needs a boundary.

For each significant rule, include:

- the default;
- why it usually works;
- when it does not apply;
- the stronger source of truth that can override it;
- the rendered check that decides.

Examples:

- “Prefer morphing” becomes “morph when identity is continuous and the in-between is legible; use a handoff or instant change otherwise.”
- “Prefer intrinsic layout” becomes “use it when it removes a breakpoint ladder or fixes a pressure point; preserve a deliberately art-directed breakpoint.”
- “Use no bounce” becomes “default to no bounce in a quiet product; allow tuned physical or expressive character.”
- “Use custom easing” becomes “reuse the product's curve family; introduce a stronger token only after rendered calibration.”

Avoid universal claims about performance, browser behavior, abstraction, or taste unless the platform contract truly makes them universal. Explain causal claims precisely: `will-change` is a hint, `transition: all` is risky because of whichever properties change, and CSS is not automatically faster than a runtime.

**Where a rule gates a change on a measurable benefit, require the measurement.** "Removes a ladder", "cuts lines", "reduces machinery" are all countable, so the skill should demand a before-and-after number rather than accept the claim: four breakpoint variants to one track, three wrappers to one, a dependency dropped. A swap asserting a reduction without a count has skipped its own gate, not passed it. State plainly what is outside the ledger — source order, focus behavior, semantics, browser support, and interaction contracts are never traded for a line count.

## Route ownership before writing syntax

Define a domain-specific owner ladder and stop at the first layer that fully satisfies behavior, accessibility, support, interruption, and maintainability.

Examples:

- **Layout:** existing behavioral component → native Tailwind utility → ordinary/component CSS or `@utility` when a real layout algorithm earns it.
- **Motion:** no animation → existing primitive behavior → project utility/plugin → CSS transition → CSS keyframes → guarded native platform feature → WAAPI → free Motion → installed premium runtime.

Do not probe or report every high-end capability unconditionally. Detect a runtime, premium package, experimental feature, or specialist tool only when the selected route reaches it or the user explicitly asks.

Choose abstractions by contract, not repetition count:

- local understandable arrangement → local utilities;
- small independently composable rule → utility;
- reusable algorithm/selectors/coordinated declarations → owned CSS;
- stable structure, slots, semantics, defaults, or constrained API → component;
- state, focus, keyboard, collision, drag, or other behavior → existing tested behavioral owner.

## Match the user's requested execution mode

This replaces the old mandatory “plan, hand off, review” envelope.

| User request | Required behavior |
| :--- | :--- |
| Audit/review | Inspect and report evidence; do not edit unless fixes were requested. |
| Fix/improve/polish | Implement the smallest coherent changes and verify them in the same task. Do not stop at a plan because several files are involved. |
| Build/create reusable primitive | Define the domain contract and fundamental parameters, implement one coherent abstraction, and exercise it in a representative example. |
| Simplify/refactor | Preserve the rendered contract while reducing machinery; report meaningful before/after measures. |
| Named pattern/effect | Implement it, but still apply intent, owner, accessibility, support, and “when not” gates. |
| Plan/handoff | Write a self-contained plan only when requested or when execution is genuinely blocked. Review the rendered result when a handoff actually occurs. |

The skill keeps edit authority. Complexity does not automatically transfer implementation to another model.

## Make output evidence-shaped

Lead with the verdict and highest-impact evidence.

Separate:

- **observations** — rendered behavior, reproduction state, evidence, and verification criterion;
- **proposed or completed changes** — target/location, prior state or evidence, resulting change, reason, owner, and verification;
- **unverified possibilities** — clearly marked, never promoted to findings.

Label how each conclusion was reached. Four labels carry every domain:

- **Observed** — seen directly in the rendered result, computed state, or command output.
- **Inferred** — the best explanation across several observations; name what would prove it.
- **Decision** — a product or design call, not a defect.
- **Unverified** — plausible but not exercised.

A severity grade without one of these labels is an assertion. Keep a top-severity finding that was only *inferred* visibly separate from one that was reproduced.

**Carry a proof field in whatever table the domain uses.** Its value is the state, width, or measurement the row was checked at, or the word `unverified`. A row that cannot fill it has not been verified, and surfacing that is the entire purpose of the field — it converts the omission from invisible into reportable.

**Automated output is evidence, not authority.** A scanner, linter, or probe can surface a seam it cannot interpret. Reproduce a finding before restructuring the system around it.

Do not force an **After** snippet for a rendered problem whose cause is not yet proven. That pressure makes agents invent patches. Define the presentation format per domain: tables work well for several comparable code changes; a tiny fix, non-code artifact, or cross-cutting deletion may be clearer in a compact domain-specific form. Keep the evidence fields above mandatory even when the table is not.

Allow “already proportionate” or “no change needed” as valid outcomes. Do not pad reports to demonstrate effort.

## Treat rendered behavior as acceptance

Static checks prove syntax and integration, not domain quality.

Each skill must distinguish:

- **universal gates** for every task in that domain;
- **conditional checks** selected by the changed behavior, input method, capability, platform feature, and regression risk.

Name the live acceptance surface and route only the applicable checks:

- layout: resize continuum, intermediate transition widths, smallest realistic container, long/localized content, 200% zoom, keyboard/source order, scroll ownership, and overflow;
- motion: normal speed, slow motion, rapid reversal, primary vs supporting choreography, keyboard/pointer/touch, reduced motion, mount/unmount, first render, and busy-page performance;
- future domains: the real behavior or artifact where the judgment can fail.

### A check with no number is a check that never runs

The lists above name *surfaces*, and a surface alone is not yet a check. "Smallest realistic container" and "resize continuum" are precisely how `improve-layout` shipped an unfalsifiable verification step: with no width, no tool and no artifact named, an agent discharges the whole thing by reasoning over source. It then reports the check as done, which is worse than skipping it.

Every universal gate needs three things the skill states outright:

1. **A number or a named state** — 320px, not "narrowest supported"; the actual data volume, not "realistic".
2. **A mechanism** — the tool or command that produces the observation, named generically enough to survive (a browser automation tool, DevTools, the project's own test command), never assumed present.
3. **An artifact** — the value, measurement, or transition width the check yields. A check whose output is a feeling cannot be reported, disputed, or repeated.

Route each claim to the evidence that can actually support it, rather than letting one blanket statement cover them all:

| Claim | Minimum evidence |
| :--- | :--- |
| A domain quality claim | the rendered observation at the named state, never the source that produced it |
| A threshold claim | bisected to a stated precision and reported as a number |
| A capability claim | the installed version or a current primary source, dated |
| Anything not exercised | the word `unverified`, carried into the output |

**Never accept an empty demo as the acceptance surface.** Mock-scale content hides the failure: three cards and three hundred are different layouts, an idle main thread and a busy one are different animations. Verify at the volume and pressure the product actually carries.

**Absence of a mechanism is a reportable fact, not a licence to infer.** If the browser, device, or runtime is unavailable, the skill must say so and label every dependent claim unverified. An honestly unverified result is usable; source inspection reported as rendered acceptance is what puts the defect in production.

For example, a focused icon-path morph needs normal/slow playback, reversal if state can change rapidly, reduced motion, semantics, and the affected inputs; it does not automatically require layout zoom or busy-page profiling unless the implementation or observed risk makes those relevant. A page-shell layout needs resize, zoom, scroll, and keyboard checks but no touch check when it has no touch-specific behavior.

Run focused static checks after the live behavior passes. If live verification is unavailable, state the gap plainly and report exactly what was verified; never convert source inspection into a claim of rendered acceptance.

## Treat platform and tooling claims as perishable

Require current verification before asserting an API, utility, component behavior, browser feature, package, or fallback is available:

- inspect the project's installed dependency versions, types/source, browser floor, and configuration;
- prefer current primary documentation for unfamiliar or support-sensitive claims;
- date reference snapshots with an absolute `YYYY-MM-DD`;
- distinguish a source snapshot from the live project contract;
- keep guarded/experimental mechanisms behind stable fallbacks and appropriate support checks.

Do not make a whole task browse or probe APIs it never reaches. Apply this contract when a selected route depends on a perishable claim.

## Build future skills with this sequence

1. Collect concrete invocation examples: audit, fix, build, simplify, named pattern, and reusable-template cases.
2. When a predecessor exists, read the current skill and identify the ownership of any uncommitted changes before treating them as direction. Preserve unrelated or provisional work. For greenfield skills, start from source material and the strongest real project examples.
3. Identify the domain's load-bearing decision—the question an excellent agent must answer before selecting a technique.
4. Define the evidence hierarchy, owner ladder, scope boundary, and stop condition.
5. Keep SKILL.md as the router; create the problem-first pattern lookup and only the references justified by actual use cases.
6. Simulate at least five representative prompts, including one where the correct result is no change.
7. Exercise representative invocations in an actual harness: confirm frontmatter triggering, task-mode routing, selective reference loading, edit authority, and output shape. Include one audit-only and one implementation path.
8. Ask: “What would a strong agent infer from this, and what could a literal agent over-apply?” Add the inference method and the “when not” guards.
9. Run repository validation, link/reference checks, perishable-claim checks where relevant, and an independent read-only skill review.
10. Fix the review findings and recheck them before calling the structure complete.

## Failure modes to reject

- Turning the skill into a primitive or API catalogue without a decision model.
- **Letting restraint machinery crowd out the build path.** An `improve-*` skill accumulates guards — respect intent, earn its place, do not refactor a working result — and they are correct. But on a build request there is nothing yet to restrain, and if the affirmative guidance left over is only a routing table, the agent satisfies every guard while producing the default-shaped result. Check the ratio: if most of `SKILL.md` is about what *not* to change, the create path is under-specified.
- **Naming a residual state without ordering it.** See the family contract: mention is not order.
- **Acceptance surfaces with no numbers, mechanism, or artifact** — the surface reads as rigor and verifies nothing.
- **Verifying against an empty demo** instead of real content volume and pressure.
- **Letting sibling skills diverge on a shared check.** When one skill sharpens a check the family shares, the vaguer phrasing in a sibling dilutes it — both plausibly load on the same task. Align them, or record why the divergence is deliberate.
- Requiring a plan/handoff for every multi-file change.
- Treating registry, shadcn, project, or AI-authored code as automatically correct.
- Copying a repo-wide average instead of choosing tuned exemplars.
- Presenting a taste preference as a universal law.
- Duplicating large quick-reference tables in SKILL.md and `patterns.md`.
- Loading every reference or probing every premium/runtime capability “just in case.”
- Using advanced or experimental mechanisms before a stable baseline.
- Forcing code changes or After snippets when evidence supports only an observation.
- Claiming live acceptance from class names, source inspection, builds, or screenshots that cannot show the behavior.
- Routing to another skill for load-bearing behavior; keep every shipped skill self-contained.
- Rewriting behavior, semantics, source order, focus, history, interruption, or reduced-motion contracts merely to get a neater implementation.

## Validation checklist

- [ ] Frontmatter triggers cover the real user phrasings and modes.
- [ ] SKILL.md is a lean decision router, ideally 1,500–2,000 words and below 3,000.
- [ ] A top-of-patterns lookup starts from user problems and links directly to stable recipes.
- [ ] Reference-loading order is deterministic and progressive.
- [ ] The domain's load-bearing decision and owner ladder are explicit.
- [ ] The default authoring order is stated as an instruction, not implied by coverage: the residual state is written first on a build task.
- [ ] `SKILL.md` is not so weighted toward restraint that the create path reduces to a routing table.
- [ ] Every universal gate names a number or state, a mechanism, and the artifact it produces; claims are routed to their minimum evidence.
- [ ] Conclusions carry Observed / Inferred / Decision / Unverified, and the output table carries a proof field.
- [ ] Any measurable-benefit gate demands the before-and-after count rather than accepting the claim.
- [ ] Checks shared with a sibling skill are phrased at the same specificity, or the divergence is recorded.
- [ ] Host-product quality can be inferred from selected exemplars, with a zero-exemplar fallback.
- [ ] Every strong heuristic includes a “when not” boundary.
- [ ] Perishable API/platform claims are verified against the installed project and current primary sources, with absolute snapshot dates.
- [ ] Task mode controls edit authority; fixes execute directly unless planning was requested or work is blocked.
- [ ] Observations are separated from proposed/completed changes using a domain-appropriate evidence schema.
- [ ] Universal and conditional verification are distinguished; live acceptance and static validation are specified without irrelevant checklists.
- [ ] Representative prompts were exercised in a real harness, including audit-only and implementation paths.
- [ ] No unrelated working-tree changes were overwritten.
- [ ] Repository pre-ship validation and an independent review pass.

## Dates

Original delivery-envelope record established 2026-07-23. Replaced with the decision-router and product-inference shape on 2026-07-24 after the `improve-layout` and `improve-motion` structural reviews.

Revised 2026-07-27 after `improve-layout` produced recurring mobile defects downstream, and four community responsive-design skills were ingested to diagnose it. Added: the authoring-order row in the family contract and its section; the numbers/mechanism/artifact requirement and claim-to-evidence routing under rendered acceptance; the four evidence labels, the proof field, and the scanner-is-not-authority rule under output; the measurable-benefit count; six failure modes; seven checklist items.

The diagnosis worth preserving: the defect was **not** missing domain knowledge, and it was **not** weak verification relative to the family — `improve-composition` and `improve-motion` both had stronger verification sections at the time. It was an unstated authoring order plus an unfalsifiable check, and both had been inherited from the unnamed acceptance surfaces in this document. A blueprint that lists surfaces without demanding numbers propagates that gap to every skill built from it.
