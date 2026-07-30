# Stack-specific contracts

Use only the sections matched by runtime discovery. Vendor names and APIs are perishable; verify decision-bearing details against installed source or types and version-matched primary documentation. Prefer local evidence; after one diagnosed retry of a stalled network-backed lookup, continue with checked-in source and label the external claim unverified.

## Tailwind and theme foundations

1. Read the package version, CSS entry point, theme declarations, plugins, content/source detection, and build integration.
2. Confirm a class or variable is generated before blaming component code.
3. Reuse semantic project tokens before adding raw values.
4. Distinguish:
   - foundation tokens for brand or cross-system semantics;
   - component tokens for a stable component contract;
   - local values for a deliberate one-off composition.
5. Promote repeated semantic roles, not repeated numbers.
6. Keep arbitrary values when they are truly local and clearer than a false token; remove them when they duplicate the scale or hide a shared decision.
7. Verify theme switching, gamut, contrast, typography loading, and computed styles in the browser.

For Tailwind v4, inspect the CSS-first surface—`@import "tailwindcss"`, `@theme`, theme namespaces, custom variants, utilities, and source detection. Theme namespaces create both variables and matching utilities, so put values there only when that public utility contract is intended. Use `@theme inline` only when alias resolution requires the referenced variable’s value to be inlined. Preserve JavaScript configuration or compatibility directives when the project still relies on them.

Do not migrate configuration merely because current documentation prefers a newer form. Match the project’s installed major and migration intent. In a ground-up audit of a project already on the latest major, also report where the configuration lags the installed version’s canonical form — for example, compatibility directives or JavaScript configuration retained without need — with its cost; migrate only when the task requests it.

## shadcn and registries

- Read `components.json` when present: style, aliases, registry namespaces, RSC setting, and target directories shape the source that will be generated.
- Use the repository’s package-manager runner and inspect the current `shadcn info` output before adding, moving, or updating shadcn source. If registry resolution stalls after one diagnosed retry, pivot to checked-in `components.json`, installed CLI help, and local source rather than blocking the task.
- Use `view`, `add --dry-run`, and `add --diff` to inspect registry payloads and proposed changes before writing when reachable. Verify the current CLI flags first.
- Respect registry file types and explicit targets; UI components, composed components, blocks, pages, hooks, libraries, fonts, and configuration do not share one destination.
- Treat added component files as owned source. Improve the canonical file rather than wrapping every import.
- Inspect registry payloads and dependencies before writing them into the project.
- Preserve local modifications when reconciling with upstream.
- Use configured aliases and workspace exports; do not assume `@/components/ui`.
- Search the existing project and configured registries before hand-rolling a primitive or block.
- If aliases, destinations, packages, or generated files change, migrate affected files, repair imports and exports, update the manifest and lockfile through the declared package manager, and run the relevant generator plus typecheck.

If no `components.json` exists, determine whether the project copies source manually or uses another component system. Its absence does not prove shadcn is absent.

## Base UI and behavioral primitives

- Use the documented composition mechanism for the installed primitive library. In current Base UI, that is `render`, not a transplanted `asChild` convention.
- A custom rendered element must preserve the primitive’s props and ref on the underlying DOM element.
- Confirm lifecycle and state selectors against the installed package’s types or source.
- Preserve focus management, dismiss behavior, portals, keyboard navigation, accessible naming, and disabled semantics.
- Let the primitive own mounting unless the documented presence pattern requires otherwise.
- Avoid a custom state machine for behavior the primitive already guarantees.

When another primitive library is present, replace these mechanics with its official contract rather than translating syntax mechanically.

## React composition

- Keep state with the narrowest owner that coordinates every consumer.
- Avoid effects for values derivable during render and for state transitions better expressed by events.
- Keep component identity stable; do not define stateful component types inside render.
- Prefer explicit modes over mutually exclusive boolean combinations.
- Use context for genuinely shared state/actions across a composition, not as a default prop transport.
- Memoization and callbacks must answer an observed render or identity problem; they are not composition decorations.
- Preserve semantic HTML and native interaction before adding ARIA or key handlers.

## Next.js boundaries

- Read the installed Next.js documentation when present in the project, plus the actual router and configuration.
- Keep pages and layouts server-renderable by default. Add a client boundary only for state, events, effects, or browser APIs.
- Place the client boundary around the smallest interactive subtree; everything imported beneath it joins the client graph.
- Pass serializable props across server/client boundaries.
- Render providers as deep as their consumers allow.
- Compose independent fetches to avoid waterfalls; preserve Suspense, loading, error, and not-found behavior.
- Check hydration and navigation after moving ownership or providers.
- Do not force one folder strategy: Next.js permits several. Follow the repository’s consistent ownership model.

## Motion

- Name motion’s job: feedback, continuity, hierarchy, progress, causality, or rare character.
- Use existing primitive behavior or CSS for predetermined state changes when sufficient.
- Use a motion runtime for springs, gestures, layout/shared-element work, or presence orchestration that CSS cannot express cleanly.
- Preserve interruption, rapid reversal, focus, mount/unmount, reduced motion, and stable layout.
- Avoid broad transitions, persistent layer promotion, and decorative choreography in frequent workflows.
- Profile a plausible performance problem; do not infer smoothness or acceleration from the library name.

## Optional checks

### Existing formatter or linter

If the project already configures one, use the project script or a scoped read-only check. Do not initialize a new tool, replace configuration, or run an auto-fix unless requested.

When `ultracite` is present, discover its current local command surface and run the project’s scoped check. Do not run initialization, migration, or fix modes as an incidental part of composition work.

### Shadscan

For a React project using shadcn, and when package execution and network policy permit:

1. inspect the current CLI help;
2. run a read-only scan from the app root, preferring structured output;
3. use category or path scoping when the requested surface is narrow;
4. compare high-impact findings with code and rendered evidence;
5. rerun after implementation when it provides meaningful regression evidence.

Do not add it as a dependency, auto-apply fixes, optimize for its score, or treat an unassessed rule as a pass.

This stack snapshot was checked against current primary documentation on 2026-07-27. Recheck it when the project version or official contract differs.
