---
name: improve-composition
description: |
  Audits and improves a web interface as one connected composition: product intent and reachable states, theme and Tailwind foundations, behavioral primitives, canonical UI components, reusable product compositions, route-level workflows, and any component catalog or gallery. Use when asked to audit, reconcile, standardize, or make coherent a design system, components page, UI architecture, component hierarchy or placement, shadcn structure, or a design-system source of truth; when duplication, visual drift, or page-local overrides need tracing to a canonical owner; or when building a page, flow, or component family that must compose an existing system rather than hand-roll beside it, in a frontend using React, Next.js, shadcn, Base UI, Tailwind, or Motion. Starts with stack and ownership discovery, traces each finding to its highest valid owner, then implements and verifies the smallest coherent system-level repair. Adapts to nearby web stacks but stops and explains when the target is outside its scope.
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
| Audit, review, assess | Inspect and report evidence. Do not edit. |
| Improve, refine, fix, standardize | Run the bounded audit, repair the highest-leverage seams, and verify them in the same task. |
| Build a page, flow, component family, or design system | Inventory the existing system first, add only the missing contracts, compose the surface, and verify adoption. |
| Reconcile a catalog or components page | Compare production use with canonical exports, repair divergence at the source, then make the catalog render those exports and their meaningful states. |
| Simplify or refactor | Preserve behavior while reducing duplicate sources, wrapper layers, prop modes, client boundaries, and styling exceptions. |
| Plan or hand off | Write a self-contained plan only when requested or execution is genuinely blocked. |

A URL, screenshot, selected element, or example identifies evidence and scope; it does not silently authorize a broader redesign. Keep a focused request focused.

## Start with the entry gate

1. **Read local authority.** Inspect repository instructions, the scoped worktree, package-manager files, and the files that own the requested surface. Preserve unrelated work. Treat descriptive instructions that conflict with executable configuration as potentially stale; treat a conflicting normative specification or ADR as an unresolved decision unless repository evidence establishes the intended behavior.
2. **Discover the actual stack.** Read manifests and lockfiles, framework and styling configuration, `components.json` when present, CSS entry points, aliases, primitive and motion packages, catalog routes, tests, and lint or formatting configuration. Record versions only when they affect a decision.
3. **Decide applicability.**
   - For React/Next.js with shadcn, Base UI, Tailwind, or Motion, use the stack-specific contracts below.
   - For a nearby component-based web stack, keep the composition method and replace framework mechanics with the project’s own contracts.
   - For a substantially different target such as native mobile, email templates, a backend service, or a non-renderable artifact, stop and explain the mismatch. Do not force this workflow onto it.
4. **Recover product intent.** State the user job, primary action, information hierarchy, scoped surfaces, and meaningful loading, empty, error, success, disabled, permission, responsive, and interaction states. Distinguish facts in code from design decisions still requiring judgment.
5. **Render when possible.** Code reveals structure; the browser reveals whether the composition actually works. If a render target is unavailable, say which visual and interaction claims remain unverified.

When a decision depends on a perishable vendor API or framework convention, check current official documentation for the project’s installed version. Encode discovery in the implementation instead of “upgrading” a project to remembered conventions.

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

1. restore missing product information or state;
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

Do not hand-roll behavior already owned by a trusted primitive. Do not add a wrapper that merely renames props or classes. Do not “clean up” a working boundary unless the change reduces a demonstrated composition cost.

Read [`references/component-system.md`](references/component-system.md) for placement, API, state ownership, and catalog rules.

## Reconcile the whole change

Changing a canonical source is not completion. Within the requested scope, follow its effects through imports, aliases, manifests and lockfiles, generated artifacts, consumers, catalog examples, tests, validation, CI, documentation, and durable agent instructions.

- Use the repository’s declared package manager, generator, and CLI rather than reconstructing their output.
- When a destination, alias, registry target, or configuration option changes, perform the corresponding migration. A configuration edit does not move files or repair consumers.
- Inspect generated drift and include only explained in-scope output. Do not hand-edit generated files unless the repository requires it.
- Update `AGENTS.md` or its imported project instructions when the change alters a durable source of truth, ownership boundary, canonical command, required verification, or non-obvious trap. Point to executable authority; do not add task history or copy discoverable values.
- Prefer objective invariants in existing tests, scripts, hooks, or CI over prose. Add enforcement only when it is within scope and materially prevents recurrence.
- Complete routine in-scope follow-through directly. Ask only for a decision, credential, irreversible action, or authority that cannot be established from the repository.

This does not independently authorize commits, pushes, deployments, production migrations, destructive actions, secrets access, or unrelated refactors.

## Respect the discovered stack

For the common React/Next.js + shadcn/Base UI + Tailwind stack:

- Treat generated or copied component source as project-owned code. Inspect and edit the canonical module; do not build a parallel layer beside it.
- Let `components.json`, TypeScript/package aliases, workspace exports, and registry targets decide placement and imports.
- Preserve the behavioral primitive’s semantics, focus management, lifecycle, portals, keyboard behavior, refs, and documented composition API.
- Read the actual Tailwind version and CSS entry points. Reuse project tokens and utilities; promote a value only when it represents a repeated semantic role.
- Keep server-renderable composition on the server in Next.js. Move client boundaries to the smallest interactive owner, pass serializable data across them, and place providers only as high as their consumers require.
- Use the lightest motion owner that satisfies continuity, interruption, and accessibility. Preserve reduced-motion behavior and do not let animation conceal a broken state transition or unstable layout.
- If a formatter, linter, or analyzer is already configured, use its read-only or scoped check in addition to project tests. Do not initialize, migrate, or auto-fix tooling unless that was requested.

Read [`references/stack-contracts.md`](references/stack-contracts.md) before changing stack-specific mechanics.

## Make the catalog executable

When the project has a components page, Storybook, registry preview, or equivalent:

- production modules are the implementation source of truth;
- the catalog is the discovery and state source of truth;
- every example imports the production export directly;
- every canonical reusable ingredient appears with meaningful variants, states, content pressure, themes, and interaction paths;
- shared product compositions are shown as compositions, not flattened into gallery-only clones;
- route-only UI stays colocated unless it has earned a reusable contract;
- grouping follows responsibility and user meaning, not the package or registry an item came from;
- development-only annotation and inspection tooling is structurally excluded from production behavior and bundles.

If the catalog and a production route disagree, determine which behavior is intentional, repair the canonical component, and make both consume it. Never cosmetically synchronize two independent implementations.

## Verify the loop

Verification must prove both the local behavior and system propagation:

1. run focused type, lint, format, test, and build checks already owned by the project;
2. inspect the changed route and its catalog/example at realistic viewport and container sizes;
3. exercise keyboard, pointer, focus, loading, empty, error, disabled, permission, long-content, theme, zoom, and reduced-motion states as relevant;
4. check console, hydration, layout shift, and network or bundle behavior when framework boundaries changed;
5. confirm the same canonical import or export reaches every intended consumer;
6. search for obsolete clones, raw values, old variants, and bypass imports;
7. report anything not exercised live.

Treat scanner output as evidence, not authority. A score can reveal an untested seam; it cannot decide product intent or prove rendered quality.

Read [`references/verification.md`](references/verification.md) for affected-surface reconciliation, the evidence matrix, and tool routing.

## Output contract

Lead with the system verdict and the highest-leverage seam. State the detected stack, execution mode, scope, and any mismatch or unverified coverage.

For findings or implemented changes, use:

| Location | Layer | Before | After | Why | Proof |
| :--- | :--- | :--- | :--- | :--- | :--- |

Group entries by shared foundation/component, product composition, and page/route when useful. Cite `file:line`. Separate observation from inference, and do not invent an **After** when the repair was not made or proven.

For implementation, finish with:

- what changed at the canonical source and which consumers migrated;
- which duplicates or exceptions were removed;
- static and live verification;
- unverified states or human decisions;
- scoped Git state, clearly distinguishing edited, staged, committed, pushed, and deployed.

“The current composition is already coherent” is a valid result. Do not manufacture abstractions or changes to make the report look substantial.

## Pre-ship

- [ ] The product job and reachable states were mapped before visual editing.
- [ ] Stack, versions, aliases, canonical modules, and local instructions came from the project.
- [ ] Every finding names one root cause and its correct owner.
- [ ] The repair lives at the highest valid layer, not automatically the highest layer.
- [ ] Existing primitives and components were adopted before new ones were created.
- [ ] Behavioral semantics and framework boundaries were preserved or intentionally improved.
- [ ] Catalog examples import production exports and cover meaningful states.
- [ ] No route-specific taste leaked into foundations or domain-agnostic UI.
- [ ] Intended consumers receive the change and bypass clones are removed or reported.
- [ ] Configuration, generators, imports, manifests, lockfiles, tests, docs, and durable instructions were reconciled where affected.
- [ ] Static checks and relevant rendered states were exercised.
- [ ] Perishable API claims were verified against current official documentation.

## Sources

> This skill draws inspiration from publicly available content from [Luis Ouriach](https://luisouriach.com/), [Vercel](https://vercel.com/), [Tailwind CSS](https://tailwindcss.com/), [shadcn](https://ui.shadcn.com/), [Base UI](https://base-ui.com/), [Motion](https://motion.dev/), [Jakub Krehel](https://jakub.kr/), [Addy Osmani](https://addyosmani.com/), and [Shadscan](https://shadscan.com/).
