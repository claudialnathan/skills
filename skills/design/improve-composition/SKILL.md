---
name: improve-composition
description: |
  Audits and improves a web interface as one composition across product intent and states, foundations, primitives, canonical UI, reusable product compositions, routes, and component catalogs. Use when asked to audit, reconcile, standardize, or make coherent a design system, components page, UI architecture, component hierarchy or placement, shadcn structure, or source of truth; to trace duplication, drift, or page-local overrides to a canonical owner; or to build or refactor a page, flow, or component family that must compose an existing React, Next.js, shadcn, Base UI, Tailwind, or Motion system. Discovers stack and ownership, repairs the highest valid seam, migrates in-scope consumers, and verifies runtime propagation. Adapts to nearby component-based web stacks and reports out-of-scope targets.
---

# improve-composition

Produce an interface whose visible behavior and code hierarchy express the same product system. Each decision should live at the highest layer that genuinely owns its meaning, propagate once to every intended consumer, avoid leaking into unrelated surfaces, and hold across every reachable state.

Shift attention from **“how should this screen or component look?”** to **“which system seam owns this decision, and how will we prove it propagated?”**

Composition here is broader than arranging React children. It is the relationship between:

1. the product job and its states;
2. theme, typography, color, spacing, and styling configuration;
3. behavioral primitives;
4. canonical UI ingredients;
5. reusable product compositions;
6. feature and route workflows;
7. the catalog, examples, tests, and feedback loop that keep the system legible.

The goal is not maximum abstraction, component count, consistency, or scanner score. It is the smallest coherent system in which reuse follows shared meaning.

## Match the requested mode

| Intent | Action |
| :--- | :--- |
| Audit, review, assess, or a bare “improve/refine/polish” request | **Findings:** inspect, reproduce, rank, and propose. Do not edit. |
| Plan or hand off | **Plan:** name owners, files, acceptance, and proof. Do not edit. |
| Apply, implement approved items, or approved finding IDs | **Remediation:** edit only the approved scope, then verify it. |
| Explicitly build, create, or implement a page, flow, component family, catalog, or design system | **Direct implementation:** inventory first, add only missing contracts, compose the requested surface, and verify adoption without an artificial audit pause. |
| Simplify or refactor a named scope | **Direct implementation:** preserve behavior while reducing proven duplicate sources, wrapper layers, prop modes, client boundaries, and styling exceptions. |
| Implementation completed by either path | **Re-audit:** report fixed, remaining, regressed, and unverified states. |

A URL, screenshot, selected element, or example identifies evidence and scope; it does not silently authorize a broader redesign. Keep a focused request focused.

State the active mode at the start of the result and across follow-up turns.
Broad subjective visual polish is a product decision: propose it unless the
request explicitly authorizes visible implementation. Safe structural or
mechanically provable work stays bounded by the selected mode.

## Start with the bounded entry gate

1. **Read local authority.** Inspect repository instructions, the scoped worktree, package-manager files, and the files that own the requested surface. Preserve unrelated work.
2. **Discover the actual stack and installed state.** Read manifests and lockfiles, framework and styling configuration, `components.json` when present, CSS entry points, aliases, primitive and motion packages, catalog routes, tests, and lint or formatting configuration. For each dependency that affects a decision, compare the manifest declaration, lockfile resolution, and package-manager or runtime-resolved installed version. Do not trust an installation that disagrees with its lockfile; reconcile it in implementation mode or report it in audit mode.
3. **Inventory reachable outputs in scope.** Include pages and catalog routes plus affected metadata and Open Graph images, icons, route handlers, feeds, `robots.txt`, sitemaps, web manifests, and downloadable or generated files. A successful build does not prove that a runtime-produced artifact can be requested or rendered.
4. **Decide applicability.**
   - For React/Next.js with shadcn, Base UI, Tailwind, or Motion, use the stack-specific contracts below.
   - For a nearby component-based web stack, keep the composition method and replace framework mechanics with the project’s own contracts.
   - For a substantially different target such as native mobile, email templates, a backend service, or a non-renderable artifact, stop and explain the mismatch. Do not force this workflow onto it.
5. **Recover product intent.** State the user job, primary action, information hierarchy, scoped surfaces and outputs, and meaningful loading, empty, error, success, disabled, permission, responsive, and interaction states. Distinguish facts in code from design decisions still requiring judgment.
6. **Render or request the relevant outputs.** Code reveals structure; the runtime reveals whether the composition and its non-page artifacts work. If a target is unavailable, say which claims remain unverified.

Resolve authority conflicts by the kind of claim:

- **Product intent:** explicit user direction → accepted normative product decision or ADR → executable product evidence → descriptive repository instructions → adjacent patterns and heuristics.
- **Vendor or framework mechanics:** reproduced behavior of the resolved installed version → installed types or source → version-matched primary documentation → repository assumptions and descriptive instructions.

Observed runtime behavior establishes a mechanical fact, not automatically the desired product behavior. Reproduce the disagreement, classify it, then reconcile affected code, tests, documentation, and stale instructions.

Keep discovery finite. Prefer checked-in configuration and installed source before network-backed documentation or registry calls. Give external commands, server startup, and browser connection attempts a bounded wait; after one diagnosed retry or clean restart fails, pivot to available evidence and mark the dependent claims unverified instead of polling or retrying indefinitely.

When a decision depends on a perishable vendor API or framework convention, verify only the decision-bearing claim against primary documentation for the resolved installed version. Encode discovery in the implementation instead of “upgrading” a project to remembered conventions.

Read [`references/audit-system.md`](references/audit-system.md) for a broad or ground-up audit.

## Map the system before changing it

Build a compact composition map for the scoped surface:

| Layer | Actual owner | Consumers | Evidence |
| :--- | :--- | :--- | :--- |
| Intent and states | route, product spec, accepted behavior | route and compositions | rendered flow, tests, copy |
| Foundations | theme, fonts, tokens, global styling config | all styled layers | CSS/config/computed styles |
| Primitives | platform or behavioral library | canonical UI | semantics, focus, state attributes |
| UI ingredients | canonical component modules | compositions and routes | imports, variants, tests |
| Product compositions | shared product-shaped modules | features and routes | repeated structures and workflows |
| Feature/route | colocated workflow code | users | data, permissions, navigation |
| Catalog and feedback | gallery, stories, examples, checks | humans and agents | direct imports, state coverage, audits |

Trace in both directions:

- **Upward: consumer → owner.** Start at the broken surface and follow imports, variants, tokens, state, and data until the first layer that truly owns the decision.
- **Downward: owner → consumers.** After repair, enumerate the intended consumers and prove they now receive the change. Check for clones that bypass the owner.

The right owner is the highest layer that shares the meaning **without capturing unrelated consumers**. A global token is not better than a local rule merely because it is higher. Promote only when the semantic role is shared.

## Diagnose seams, not screenshots

Look for system failures with visible consequences:

- **Information:** the component lacks the content, state, or product truth needed to render correctly.
- **Ownership:** the same decision is repeated at call sites, or a low-level primitive contains route or business meaning.
- **Boundary:** behavior, accessibility, data, styling, or state is owned by the wrong layer.
- **Source:** parallel components, local lookalikes, copied registry code, and gallery-only replicas compete with the canonical implementation.
- **Contract:** prop combinations, slots, variants, events, or state ownership make valid composition difficult and invalid composition easy.
- **Foundation:** raw values, token aliases, theme configuration, type roles, and global rules disagree or fail to reach consumers.
- **Reachable states:** default looks correct while loading, error, empty, overflow, focus, disabled, permission, theme, or reduced-motion states break.
- **Framework:** client boundaries, hydration, data waterfalls, providers, portals, and bundle cost fight the intended composition.
- **Feedback:** the catalog, tests, static checks, and runtime probes do not exercise the real source.

Prioritize by user impact, reach, recurrence, and confidence—not by finding count. One root cause with six manifestations is one system finding.

| Priority | Meaning |
| :--- | :--- |
| P0 | Blocks the task, corrupts data/state, or creates a severe accessibility or security failure. |
| P1 | Breaks a core workflow or shared system contract across surfaces. |
| P2 | Creates bounded inconsistency, brittleness, or missing states. |
| P3 | Is proportionate polish after the composition already holds. |

## Repair in propagation order

For each finding, choose the smallest coherent repair:

1. restore missing product information or state, then author the highest-risk
   applicable non-happy or content-pressure state first—such as empty, failed,
   permission-limited, slow, long-content, or narrow—so the default state does
   not leave it as accidental residue;
2. correct the ownership or behavioral contract;
3. update the canonical foundation, primitive, component, or composition;
4. migrate every in-scope consumer and delete proven duplicates;
5. update the executable catalog and tests;
6. tune local visual details only after the preceding seams hold.

Do not perform every step when a lower layer is already correct. Avoid both failure modes:

- **under-promotion:** patching every consumer separately when they share one meaning;
- **over-promotion:** turning one screen’s taste into a global token, variant, or abstraction.

Before creating a component, use this adoption ladder:

1. use the canonical component as-is;
2. use or correct an existing variant or slot;
3. compose existing ingredients at the product layer;
4. extend the canonical API when multiple consumers share a stable contract;
5. create a new component only when the concept has a distinct responsibility and expected reuse.

Choose confirmation and interruption from the action’s actual reversibility and
preconditions. A destructive label alone does not prove that an
`AlertDialog`-style primitive is required: reversible actions may use a lighter
confirmation or undo path, while irreversible or consequential actions may
need explicit interruption. Verify the resolved primitive’s dismiss, focus,
keyboard, and portal contracts before asserting its behavior.

Do not hand-roll behavior already owned by a trusted primitive. Do not add a wrapper that merely renames props or classes. Do not “clean up” a working boundary unless the change reduces a demonstrated composition cost.

Read [`references/component-system.md`](references/component-system.md) for placement, API, state ownership, and catalog rules.

## Reconcile the whole change

Changing a canonical source is not completion. Within the requested scope, follow its effects through imports, aliases, manifests and lockfiles, installed state, generated and runtime-produced artifacts, consumers, catalog examples, tests, validation, CI, documentation, and durable agent instructions.

- Use the repository’s declared package manager, generator, and CLI rather than reconstructing their output.
- When a destination, alias, registry target, or configuration option changes, perform the corresponding migration. A configuration edit does not move files or repair consumers.
- Inspect generated drift and include only explained in-scope output. Do not hand-edit generated files unless the repository requires it.
- Update `AGENTS.md` or its imported project instructions when the change alters a durable source of truth, ownership boundary, canonical command, required verification, or non-obvious trap. Point to executable authority; do not add task history or copy discoverable values.
- Prefer objective invariants in existing tests, scripts, hooks, or CI over prose. Add enforcement only when it is within scope and materially prevents recurrence.
- Complete routine in-scope follow-through directly. Ask only for a decision, credential, irreversible action, or authority that cannot be established from the repository.

This does not independently authorize commits, pushes, deployments, production migrations, destructive actions, secrets access, or unrelated refactors.

## Respect the discovered stack

For React/Next.js with shadcn, Base UI, Tailwind, or Motion:

- treat generated or copied components as project-owned canonical source, with placement and imports determined by checked-in targets and aliases;
- preserve primitive semantics, refs, focus, keyboard, lifecycle, portals, and documented composition;
- reuse the resolved Tailwind version’s tokens and utilities; keep server/client and provider boundaries as narrow as their behavior requires;
- choose the lightest motion owner that preserves interruption and reduced motion;
- use configured checks in scoped read-only mode; do not initialize, migrate, or auto-fix tooling unless requested.

Read [`references/stack-contracts.md`](references/stack-contracts.md) before changing stack-specific mechanics.

## Make the catalog executable

When a catalog exists, production modules remain the implementation source of truth and the catalog becomes executable discovery and state coverage. Import public production exports directly, show each in-scope reusable ingredient and product composition in meaningful states, keep route-only UI colocated until it earns reuse, group by responsibility, and exclude development-only inspection tooling from production behavior and bundles.

If the catalog and a production route disagree, determine which behavior is intentional, repair the canonical component, and make both consume it. Never cosmetically synchronize two independent implementations.

## Verify the loop

Select the claims the handoff will make, then derive the minimum evidence for each claim. Run only checks that can prove or falsify those claims; the state lists below are prompts, not a universal ceremony.

1. run focused type, lint, format, test, and build checks already owned by the project;
2. render the changed or highest-risk page and catalog contexts at relevant sizes and states;
3. directly request every changed or high-risk non-page output and inspect status, content type, usable body, and runtime errors;
4. use a complete static consumer trace plus rendered or otherwise exercised representatives from each distinct high-risk context to prove propagation;
5. check console, hydration, layout shift, network, and bundle behavior only where the claim or changed boundary requires it;
6. search for obsolete clones, raw values, old variants, and bypass imports;
7. stop bounded external attempts according to the entry gate and report every unexercised claim as unverified.

Treat scanner output as evidence, not authority. A score can reveal an untested seam; it cannot decide product intent or prove rendered quality.

Read [`references/verification.md`](references/verification.md) for affected-surface reconciliation, the evidence matrix, and tool routing.

## Output contract

Lead with the system verdict and the highest-leverage seam. State the detected stack, execution mode, scope, and any mismatch or unverified coverage.

For findings and proposals, keep the primary queue to five decision groups
while preserving the total blocker count and a path to the complete result.
Label evidence as **Observed**, **Inferred**, **Decision**, or **Unverified**.

For a tightly bounded repair with one shared owner, use:

| Location | Before | After | Proof |
| :--- | :--- | :--- | :--- |

Name the owner, system seam, and reason in the lead. For a broad audit or multi-layer change, use:

| Location | Layer | Before | After | Why | Proof |
| :--- | :--- | :--- | :--- | :--- | :--- |

For audit-only findings without an implemented repair, use `Location | Layer | Finding | Proof` instead of inventing an **After**. Group broad results by shared foundation/component, product composition, and page/route when useful. Cite `file:line` and separate observation from inference.

For implementation, finish with:

- what changed at the canonical source and which consumers migrated;
- which duplicates or exceptions were removed;
- static and live verification;
- unverified states or human decisions;
- scoped Git state, clearly distinguishing edited, staged, committed, pushed, and deployed.

Then perform the focused re-audit and state which findings are fixed,
remaining, regressed, or unverified. End a no-change review with
`No action needed`; do not manufacture a repair or request approval.

“The current composition is already coherent” is a valid result. Do not manufacture abstractions or changes to make the report look substantial.

## Pre-ship

- [ ] Product job, reachable states, in-scope pages, and non-page outputs were mapped.
- [ ] Decision-bearing versions resolve consistently across manifest, lockfile, and installed state, or the mismatch is reported.
- [ ] Authority conflicts were reproduced, classified as intent or mechanics, and reconciled across affected code, tests, docs, and instructions.
- [ ] Each finding names one root cause; the repair lives at the highest valid owner without leaking route-specific taste.
- [ ] Existing primitives and components were adopted first; semantics and framework boundaries remain sound.
- [ ] Intended consumers and catalog examples use canonical exports; bypass clones are removed or reported.
- [ ] Configuration, generators, imports, packages, artifacts, tests, CI, docs, and durable instructions were reconciled where affected.
- [ ] Explicit claims drove the minimum sufficient static, runtime, and propagation evidence; bounded failures are unverified.
- [ ] Decision-bearing perishable API claims were checked against installed evidence and version-matched primary documentation, or the gap is reported.

## Sources

> This skill draws inspiration from publicly available content from [Luis Ouriach](https://luisouriach.com/), [Vercel](https://vercel.com/), [Tailwind CSS](https://tailwindcss.com/), [shadcn](https://ui.shadcn.com/), [Base UI](https://base-ui.com/), [Motion](https://motion.dev/), [Jakub Krehel](https://jakub.kr/), [Addy Osmani](https://addyosmani.com/), and [Shadscan](https://shadscan.com/).
