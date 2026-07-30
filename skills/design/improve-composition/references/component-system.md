# Component and catalog contracts

Use this reference when deciding where code belongs, whether a component should exist, how its API should compose, or how a catalog becomes trustworthy.

## Contents

- Place by responsibility
- Apply the placement decision
- Design APIs from valid composition
- Adopt before creating
- Build a trustworthy catalog
- Reconcile catalog drift

## Place by responsibility

Let repository aliases, workspace exports, and generator targets provide the concrete paths. Apply this ownership model even when folder names differ:

| Responsibility | Belongs with |
| :--- | :--- |
| Theme variables, fonts, global utilities | the project’s foundation/style entry point |
| Domain-agnostic interactive behavior and styling | canonical UI modules |
| Reusable product semantics made from UI ingredients | shared application compositions |
| Feature data, permissions, orchestration, route-specific copy | the feature or route |
| Discovery, examples, and state coverage | the existing catalog or documentation surface |

Do not group code by where it was copied from. Registry, vendor, and AI provenance do not define runtime responsibility.

## Apply the placement decision

Use this first-match order for new or moved code:

1. Does a registry file type or explicit target determine the destination? Respect it.
2. Is it tied to one route, feature, domain type, business workflow, or feature state? Colocate it there using the repository’s convention.
3. Is it a shared application composition with product semantics? Use the configured components alias or equivalent shared application layer.
4. Is it domain-agnostic reusable UI? Use the configured UI alias or equivalent canonical UI layer.
5. Is the answer still ambiguous after inspecting nearby authoritative examples? Ask before inventing a directory or moving existing code.

Do not infer a convention from one stray file. Do not reorganize existing code unless the requested repair requires it.

`blocks` is a registry item type, not a mandatory project folder. Do not invent `components/blocks`, `components/sections`, or provider-named folders unless an explicit target or documented repository convention owns them. For an official block, initially preserve its declared destinations; reorganize only as a deliberate integration change with every import repaired.

Follow the repository’s naming convention. When a React project has no stronger convention, use lowercase kebab-case for component files and directories, PascalCase for exported components and types, camelCase for functions and variables, and `useCamelCase` for hooks. Preserve framework-owned filenames such as `page.tsx`, `layout.tsx`, and `route.ts`.

### Domain-agnostic UI

A canonical UI component may know about:

- visual intent such as destructive, muted, selected, or emphasized;
- size and density;
- supported slots and interaction states;
- accessibility semantics and primitive behavior.

It should not know about a customer role, database record, permission policy, route, API endpoint, analytics event, or business workflow.

### Product compositions

A shared product composition may know about concepts such as account switching, search results, billing status, or an approval summary. It should accept product-shaped data and callbacks without fetching route data or hard-coding one route’s navigation.

### Feature and route code

Keep authorization, fetching, mutations, URL state, route-only copy, and workflow coordination close to the feature. Extract them only when a second consumer shares the contract, not in anticipation.

## Design APIs from valid composition

1. Name the stable concept and supported states.
2. Decide who owns state: component, parent, URL, form, or server.
3. Separate structure, behavior, and style only where consumers vary them independently.
4. Expose the smallest API that makes valid use obvious.
5. Preserve the underlying element’s props, ref, labels, and events.

Use:

- **variants** for a finite visual or semantic mode;
- **independent booleans** for genuinely independent capabilities;
- **slots or compound parts** when consumers must arrange meaningful substructure;
- **children** when the parent should not know content details;
- **controlled state** when an outside owner coordinates it;
- **uncontrolled defaults** when the component can own the full interaction.

Do not replace every boolean with context or compound parts. Boolean proliferation is a warning when flags create mutually exclusive modes, change structure, or multiply invalid combinations. An explicit variant is usually clearer in that case.

Treat layer order the same way. A shared overlay, popover, modal, toast, or
drag-preview role can earn a canonical layer owner when several consumers
share its semantics. A single collision does not earn a global z-index scale:
first inspect the local stacking context, portal destination, transforms,
sticky geometry, and clipping owner. Keep local geometry local.

## Adopt before creating

For a missing ingredient:

1. search canonical project exports and nearby uses;
2. inspect configured registries or trusted upstream primitives when the project uses them;
3. view the proposed source and dependencies before adding it;
4. decide whether to adopt, adapt into the canonical module, harvest one technique, or reject;
5. reconcile required differences into one owned implementation;
6. migrate consumers and remove superseded clones.

Never overwrite customized source blindly. Treat an upstream implementation as evidence and raw material, not authority over product behavior.

## Build a trustworthy catalog

The catalog’s contract is **direct import + meaningful coverage + adoption proof**.

### Direct import

Every preview imports the same public export production consumes. A locally recreated JSX example, copied class list, or gallery-specific wrapper is not proof of the component.

### Meaningful coverage

Show the states a consumer must understand:

- visual variants and sizes;
- interactive, focus, selected, disabled, invalid, and pending states;
- loading, empty, error, success, and permission states where the composition owns them;
- long labels, unbroken values, optional content, and realistic data density;
- supported themes and reduced motion;
- keyboard and pointer paths.

Do not multiply examples for prop combinations that do not change the contract.

### Adoption proof

For each canonical ingredient, find at least one production consumer, or explicitly state that it is a new foundation awaiting adoption. A gallery full of unused components is an inventory, not a design system.

### Grouping

Follow the project’s existing taxonomy when coherent. Otherwise group by user responsibility—foundations, actions, inputs, navigation, feedback, data display, overlays, and product compositions—rather than package name.

## Reconcile catalog drift

When production and the catalog differ:

1. compare behavior, content, styles, state ownership, and imports;
2. decide which differences are intentional product requirements;
3. update the canonical module or composition;
4. make both surfaces consume it;
5. delete the lookalike;
6. verify the same public import and rendered states.

The catalog can be the place people inspect and decide the system without becoming a second implementation.
