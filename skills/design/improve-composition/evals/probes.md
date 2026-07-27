# Earning probes

Objective: produce a web interface whose product intent, foundations, primitives, canonical components, product compositions, routes, and catalog form one legible system. Repairs must land at the highest valid owner, propagate to intended consumers, preserve behavior, and avoid premature abstraction.

Attention shift: from styling the named surface in isolation to finding and proving the system seam that owns the decision.

## Contents

- How to run
- Probe 1: catalog lookalike
- Probe 2: highest valid owner
- Probe 3: abstraction pressure
- Probe 4: subtle and total stack mismatch
- Probe 5: client-boundary creep
- Probe 6: audit authority
- Probe 7: configuration is not migration
- Keep or delete

## How to run

Run each prompt twice in the same representative harness and fixture:

1. without this artifact;
2. with this artifact available and normally triggered.

Keep repository instructions, existing code quality, user wording, tools, and model settings identical. Grade the produced work and transcript, not whether the artifact merely appeared to load. Record model, date, harness version, fixture revision, commands, and verdict in the local decision log.

A passing implementation must include proportionate static and rendered evidence. An audit-only prompt must not mutate the fixture.

## Probe 1: catalog lookalike

**Fixture**

- A Next.js app exports `StatusBadge` from a canonical UI module.
- Three routes use it with local class overrides.
- `/admin/components` renders a separate `CatalogStatusBadge` copied from an older version.
- The catalog looks more polished than production.

**Prompt**

> Improve the components page so it is the source of truth for every status badge.

**Pass**

- distinguishes implementation authority from catalog discovery/state authority;
- compares all real uses and states before choosing the intended contract;
- repairs one canonical export;
- migrates route consumers and makes the catalog import it directly;
- removes or reports the clone and proves shared adoption;
- does not simply copy gallery classes into another wrapper.

## Probe 2: highest valid owner

**Fixture**

- Two related billing cards use the same one-off radius and muted background.
- An unrelated destructive warning coincidentally uses the same values.
- Existing theme tokens are close but semantically different.

**Prompt**

> Standardize these cards from the ground up and clean up the arbitrary values.

**Pass**

- tests shared meaning rather than counting repeated numbers;
- chooses a billing composition or component contract for the related cards;
- does not change the unrelated warning or mint a misleading global token;
- verifies computed styling and both billing consumers;
- explains why a local value may be preferable to a false foundation token.

## Probe 3: abstraction pressure

**Fixture**

- `Panel` has `compact`, `showHeader`, `showActions`, and `loading` booleans.
- The booleans are independent and current combinations are valid.
- A proposed `DashboardPanel` wrapper would only rename those props.

**Prompt**

> Refactor the component composition using compound components and eliminate boolean props.

**Pass**

- challenges the requested mechanism against the actual contract;
- keeps independent booleans when they remain the clearest API;
- rejects the no-value wrapper;
- uses slots or compound parts only if consumer-controlled structure genuinely requires them;
- preserves behavior and reports the evidence behind the decision.

## Probe 4: subtle and total stack mismatch

**Fixture A**

- Vue, Tailwind, and Headless UI power a component-based web app.

**Prompt**

> Audit and improve the composition of this settings flow.

**Pass**

- adapts the layer, ownership, catalog, and verification method;
- replaces React/Base UI mechanics with the discovered contracts;
- does not stop merely because the preferred stack differs.

**Fixture B**

- A SwiftUI native application has no web target.

**Pass**

- stops before applying web-specific advice;
- explains the mismatch and identifies the kind of help required;
- does not fabricate Tailwind or DOM work.

## Probe 5: client-boundary creep

**Fixture**

- A route layout is marked as a client module only because one nested menu needs interaction.
- It imports data-heavy static content and wraps the entire route in a provider.
- The same menu appears in the catalog through a copied mock.

**Prompt**

> Refine the route and menu composition without changing behavior.

**Pass**

- traces the client boundary and provider reach;
- moves interactivity to the smallest safe owner and passes serializable data;
- preserves loading, navigation, focus, and hydration behavior;
- makes the catalog import the canonical menu;
- verifies build/runtime evidence rather than claiming a bundle win from code shape alone.

## Probe 6: audit authority

**Fixture**

- Several composition issues are real and easy to fix.

**Prompt**

> Audit this design system and tell me what should change.

**Pass**

- stays read-only;
- maps findings to owners and root causes;
- prioritizes by user impact and system reach;
- separates observed, inferred, and unverified claims;
- supplies proof criteria without making edits.

## Probe 7: configuration is not migration

**Fixture**

- `components.json` is changed so the UI alias points from an app-local directory to a shared workspace.
- Existing files, imports, workspace exports, catalog stories, generated registry output, and tests still reference the old path.
- The repository has a declared package manager, tracked lockfile, and imported `AGENTS.md` ownership table.

**Prompt**

> Move our shared UI into the configured package and improve the component structure.

**Pass**

- reads repository instructions, live aliases, package-manager declaration, and current CLI information;
- previews registry changes before writing and preserves customized source;
- treats the alias edit as the start of a migration, not completion;
- moves the owned files, repairs imports and exports, updates affected package metadata, lockfile, generated output, catalog, tests, and durable ownership instructions;
- runs the relevant generator, typecheck, and scoped runtime verification;
- inspects unexplained drift and preserves unrelated work;
- does not assume authority to commit, push, deploy, or perform unrelated reorganization.

## Keep or delete

Keep while at least one representative probe fails unaided in the deployment context and the artifact materially improves it. Revise when failures move to triggering, missing context, or a misleading contract. Nominate for deletion when live work converges with the guidance; delete only after all seven probes pass unaided across at least two representative runs and no owner-specific attention shift remains.
