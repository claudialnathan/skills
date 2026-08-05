# Audit the composition system

Use this reference for a broad audit, a “from the ground up” improvement, or a surface whose root cause is unclear.

## Contents

- Establish the internal brief
- Audit top-down and bottom-up
- Find seams with a system graph
- Pressure-test promotion
- Evaluate each layer
- Report root causes

## Establish the internal brief

Before findings, write a compact working brief:

- **Objective:** the user outcome and the visible behavior that would prove it.
- **Mode:** audit, improve, build, reconcile, simplify, or plan.
- **Scope:** routes, shared components, internal surfaces, catalog, themes, and affected non-page outputs included.
- **Authority:** classify conflicts as product intent or vendor/framework mechanics, then apply the ladder in `SKILL.md`; runtime facts do not automatically define desired product behavior.
- **Constraints:** behavior to preserve, backend contracts, accessibility, browser floor, delivery boundary, and unrelated work.
- **Unknowns:** decisions that code and current documentation cannot answer.

Do not turn an internal brief into a new planning artifact unless the user asked for one.

## Audit top-down and bottom-up

### Top-down: intent to implementation

1. What job is the surface doing?
2. What must be noticed first, acted on, compared, or remembered?
3. What states can the user actually reach?
4. Which product compositions express those states?
5. Which canonical ingredients and primitives support them?
6. Which foundation values make the visual language coherent?

This direction catches polished components that solve the wrong product problem.

### Bottom-up: foundations to experience

1. Do theme and styling configuration generate the utilities and variables the code expects?
2. Do primitives preserve platform behavior and expose trustworthy state?
3. Do canonical UI modules own shared styling and variants?
4. Do product compositions combine them without leaking route data downward?
5. Do routes preserve information hierarchy, resilience, and framework boundaries?
6. Do catalog and tests render the same modules and states?

This direction catches good product intent undermined by disconnected implementation.

## Find seams with a system graph

For every visible inconsistency, capture:

- the observed behavior;
- the nearest consumer;
- the current owner;
- the proposed owner;
- all intended consumers;
- uninvolved consumers that constrain promotion;
- evidence that the cause is shared rather than coincidental;
- proof that would close the finding.

A repeated class string is not automatically a design token. A shared semantic role is. A similar card is not automatically one component. A stable shared contract is.

## Pressure-test promotion

Promote a decision upward only when all apply:

1. at least two consumers share the same meaning, not merely the same pixels;
2. the proposed owner can name the concept without route-specific language;
3. consumers need the same behavior or visual rule through their meaningful states;
4. unrelated consumers will not inherit an accidental opinion;
5. one canonical change is cheaper to understand than coordinated local rules.

Keep the rule local when the variation communicates product meaning, is experimental, or would make a shared API less legible.

## Evaluate each layer

### Intent and reachable states

- primary and secondary actions are clear;
- hierarchy follows the user’s task rather than component availability;
- loading preserves labels and layout;
- empty and error states help the user recover;
- disabled and permission states explain what is unavailable when needed;
- user input survives recoverable failures.

### Foundations

- theme variables, utility generation, fonts, resets, and dark/high-contrast themes are actually wired;
- semantic tokens represent usage roles rather than copying a palette name;
- color roles retain legible contrast through interaction, disabled, theme, and forced-color states; a color-space migration happens only when it solves a real gamut or maintenance problem;
- typography roles, font loading, measures, wrapping, line height, numeric alignment, and mobile form sizing survive real content;
- spacing, radius, border, and shadow relationships feel systematic without erasing intentional hierarchy or optical adjustment;
- global rules do not compensate for one component.

### Primitives and canonical UI

- native semantics and trusted behavioral primitives own focus, keyboard, portals, and lifecycle;
- wrappers add a stable project contract rather than indirection;
- variants represent supported states or meanings;
- visual state selectors match real runtime attributes;
- refs, props, labels, and disabled semantics reach the actual element.

### Product compositions and routes

- reusable structure is product-shaped but not route-data-shaped;
- state sits with the owner that coordinates it;
- server, client, data, and interaction boundaries are deliberate;
- responsive behavior follows content pressure and hierarchy;
- repeated markup reflects reuse or meaningful divergence, not copy drift.

### Catalog and feedback

- production imports, not replicas, power examples;
- every shared ingredient and meaningful variant/state is discoverable;
- internal and public surfaces use the same canonical system where meanings overlap;
- examples use realistic content and interactions;
- checks cover semantics and runtime behavior, not only formatting.

Respect pace layers: foundations should change slowly and with cross-system evidence; product compositions may evolve faster; route experiments stay local until their meaning proves reusable. This keeps rapid surface iteration from destabilizing every consumer, while preventing mature shared decisions from being recopied forever.

## Report root causes

Prefer:

> P1 — Three routes bypass the canonical status component, so token and accessible-label fixes do not propagate.

Avoid:

> These three badges have slightly different green values.

The first states the system failure and its reach. The second describes manifestations and invites three patches.
