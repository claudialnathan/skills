# Verification and evidence

Use this reference after an implementation or when an audit verdict depends on rendered behavior.

## Contents

- Route checks by claim
- Static pass
- Reconcile affected surfaces
- Rendered pass
- Propagation proof
- Evidence quality
- Handoff

## Route checks by claim

| Claim | Minimum evidence |
| :--- | :--- |
| “One canonical component” | import/export trace plus duplicate search |
| “Change propagated” | canonical diff plus every intended consumer rendered or otherwise exercised |
| “Token is wired” | configuration/CSS source plus generated or computed value |
| “Variant works” | type/API trace plus rendered state |
| “Accessible” | semantic inspection, keyboard/focus path, and assistive-tech coverage proportionate to risk |
| “Responsive” | narrow, intermediate, wide, zoomed, and content-pressure states |
| “Motion is appropriate” | normal, interrupted/reversed, and reduced-motion interaction |
| “Server/client boundary improved” | module boundary trace, hydration/console check, and relevant build evidence |
| “Catalog is source of truth” | direct production import plus meaningful state coverage and a production adopter |
| “Tooling passes” | exact scoped command and result |

Static evidence cannot prove rendered quality. A screenshot cannot prove keyboard behavior, source ownership, or state propagation.

## Static pass

Use the project’s own commands and package manager:

- focused type checking;
- scoped lint and format checks;
- relevant unit, integration, and component tests;
- build or route compilation when boundaries or configuration changed;
- searches for superseded imports, parallel modules, raw values, stale variants, and old selectors;
- diff review for unrelated churn and generated-file drift.

When a command is repo-wide and known to have unrelated failures, run the narrowest supported command and report both its scope and the broader gap.

## Reconcile affected surfaces

Before calling an implementation complete:

1. inspect the final diff and scoped working-tree status;
2. enumerate every repository surface affected by the change;
3. update in-scope imports, exports, aliases, manifests, lockfiles, generated artifacts, mocks, fixtures, tests, CI, documentation, and catalog examples;
4. run relevant generators and migrations with the repository’s declared tooling;
5. inspect unexpected generated drift rather than accepting it blindly;
6. resolve failures introduced by the change;
7. remove temporary artifacts, obsolete paths, old instructions, and proven duplicates;
8. update durable agent instructions only when future decisions changed;
9. rerun focused verification after reconciliation.

A configuration change is not self-executing. Moving an alias or target requires moving the owned files, repairing every consumer, and validating resolution. Changing a dependency requires the declared package manager to update both manifest and lockfile.

If an objective composition invariant is important and recurrent, prefer enforcing it through an existing test, validation script, hook, or CI check. Add a new mechanism only when the task authorizes that surface and the recurrence justifies its maintenance cost.

Do not hand routine maintenance back to the user when the available tools and scope permit completing it. When genuinely blocked, finish independent work first, then state the exact missing decision, credential, external action, or authority.

## Rendered pass

Exercise only relevant states, but do not omit an inconvenient reachable state:

- default, hover, active, focus-visible, selected, disabled, invalid, pending;
- loading, empty, partial, error, success, permission denied;
- short, long, missing, localized, numeric, and unbroken content;
- smallest realistic container, intermediate pressure point, wide layout, and 200% zoom;
- light, dark, forced/high-contrast modes when supported;
- keyboard, pointer, and touch where the interaction differs;
- reduced motion and rapid reversal;
- refresh, navigation, back/forward, first render, and hydration when framework state changed.

Inspect console errors, warnings, layout shift, clipped focus, overflow, stale state, and accidental scroll boundaries.

## Propagation proof

After changing a shared owner:

1. list intended consumers before the edit;
2. list consumers excluded by design;
3. render or exercise the highest-risk consumer in each distinct context;
4. verify the catalog uses the same public export;
5. search for bypass imports and copied implementations;
6. confirm local exceptions still communicate an intentional difference.

For a token or primitive with many consumers, representative runtime checks plus a complete static import/usage trace are proportionate. Do not claim every surface was rendered when it was not.

## Evidence quality

Label conclusions:

- **Observed:** directly visible in code, runtime, or command output.
- **Inferred:** best explanation from multiple observations; name what would prove it.
- **Decision:** a chosen product or architecture direction.
- **Unverified:** plausible but not exercised.

External scanners, linters, performance tools, and accessibility automation are evidence multipliers. Their false positives and blind spots remain. Reproduce a finding before restructuring the system around it.

## Handoff

Report:

- exact commands and targeted runtime checks;
- expected versus observed behavior;
- states and consumers covered;
- states not covered and why;
- pre-existing failures kept separate;
- edited, staged, committed, pushed, deployed, and production-verified status as distinct facts.
