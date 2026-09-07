# OpenReview deep workflow

Load this reference for a deep review, a monorepo, runtime evidence, or a scanner-gap audit. Keep Review and Plan modes read-only on product source. In a monorepo, use the relevant partitioning guidance without silently upgrading a standard review to `deep`.

## Partition without losing ownership

Partition by project and framework owner rather than arbitrary file counts:

1. project discovery, supported Next version, config completeness, and router roots;
2. route/layout ownership, shared layouts, groups, slots, intercepts, and App/Pages overlap;
3. Server/Client boundaries and client blast radius;
4. cache scopes, tags, invalidation, and mutation freshness;
5. Route Handlers, Server Actions, and public mutation boundaries;
6. navigation/build/dev/browser evidence;
7. precise shadcn, Base UI, and Radix mechanics where ownership is proven.

In `deep`, track each surface as assessed, skipped with reason, or Unverified. In standard Review, record only the surfaces actually reached. A project with unresolved dynamic config or unknown installed Next resolution stays incomplete for version/config-gated rules.

When the owner explicitly requests parallel agents, use an isolated read-only worker only when it replaces equivalent exploration in the primary context. Give it the compact report, immutable revision, one bounded surface, the evidence/state vocabulary from `SKILL.md`, and an instruction to return concise candidates without fixes. Do not fan out empty checklist surfaces or repeat the worker's exploration in the primary context; reopen only the evidence needed to vet returned candidates.

## Keep scanner diagnosis separate

An incomplete target report does not turn a product review into a scanner debugging session. Record the required skips and continue only with clearly labelled advisor evidence allowed by the selected depth. Do not create target clones or mutate target configuration to see what would make the scanner pass.

A scanner-gap audit is a separate task against the trusted scanner checkout. Reproduce the gap with the smallest scanner-owned fixture, change scanner source only with explicit authority, and rerun the target once after the scanner fix. The target repository remains read-only.

## Separate evidence classes

Keep these records separate even when they describe one root cause:

| Evidence | What it proves | Minimum retained context |
| :--- | :--- | :--- |
| Static scanner | A versioned source/project rule triggered | rule key, ID, fingerprint, locations, version/capability evidence, suppression, completeness |
| `next build` import | Production compilation for one exact command | command, exit, Next version, bundler, environment, exact message/location |
| Next dev/MCP import | Development capability/tool result | tools/list surface, invoked tool, server URL, visited route when required, Next version, bundler |
| Request Insights import | Development request/span/fetch observation | exact endpoint, request route/status, fetch/cache status, Next version, bundler |
| Browser import | Rendered/navigation behavior for concrete URLs | environment, URLs, browser version, named assertions, auth authority, errors/unverified areas |
| Advisor | Repository-grounded judgment outside deterministic ownership | path/line, evidence, consequence, missing/runtime proof, state |

Do not use a successful build as proof of hydration, interaction, shell quality, prefetch behavior, deployed runtime behavior, or visual correctness. Do not use an empty MCP error result as clean proof before the relevant route has been visited. Do not parse development output as production evidence.

## Build a changed or lines ledger

Build the diff ledger from comparison classes, not from every diagnostic in the embedded full-head report. Retain visibility separately as locality evidence: `visibility.fileDiagnosticIds` says which head diagnostics land in changed files and `visibility.lineDiagnosticIds` says which land on changed lines, but neither set limits project-level rule execution or diagnostic inclusion.

- `added` diagnostics are new active candidates; record whether each is file-visible, line-visible, or a project-level consequence outside the edited locations.
- `persistent`, `moved`, and `renamed` head diagnostics are pre-existing context, not newly introduced defects; report them separately only when they affect the requested work and retain their locality evidence.
- `resolved` base diagnostics are evidence of removal, not active findings; they do not require a head visibility ID.
- `unclassified` head diagnostics remain Unverified because an incomplete comparison cannot establish whether they are new; retain any available locality evidence without dropping diagnostics that fall outside it.

## Vet deterministic diagnostics

For every diagnostic:

1. Reopen the primary and related locations.
2. Run `openreview-next rules explain <rule-key>`.
3. Confirm the installed Next version and required capability are proven in the report.
4. Confirm the trigger matches and every documented non-trigger is absent.
5. Check whether a reasoned suppression or explicit project decision owns the behavior.
6. Trace the route/cache/module owner far enough to state user impact and leverage.
7. Preserve the original diagnostic unchanged; record contextual conclusions beside it.

If source no longer matches the fingerprint, mark the row stale and rescan. If the rule appears wrong, classify a scanner false-positive candidate separately; do not “fix” product code to satisfy it.

## Hunt scanner gaps conservatively

Inspect the leverage map for framework consequences the current catalogue does not cover. Promote a candidate only with a concrete code path and credible consequence. Common investigation prompts include:

- Does a shared layout or provider expand a small issue across most routes?
- Does a cache tag have a producer and an invalidator, and does the selected freshness model match the mutation context?
- Does a Client boundary pull a proven server-only or large shared owner into many routes?
- Does a public mutation boundary rely on an actual authorization owner, or is the evidence only a wrapper/name?
- Does navigation behavior require production evidence rather than source inference?
- Does a primitive's imported owner actually expose the state/slot/as-child mechanic used by the code?

Leave subjective caching duration, component choice, generic composition taste, aesthetic preference, and unmeasured performance as Decision or outside scope.

## Runtime import contract

Use `openreview-next evidence import next-build|next-mcp|request-insights|browser <file>` only with an explicitly captured evidence file. The adapter imports evidence; it does not authorize starting a server, taking over a browser, installing target dependencies, or using credentials.

Require owner authority before credentialed browser work and carry its authorization reference in the evidence. Bind each browser assertion to a visited route and retain capture-tool name/version/capabilities; a React render-count claim additionally requires recorded React DevTools capability. If the capture surface is absent, mark runtime acceptance Unverified.

For Next MCP:

- require Next 16 or later and capability discovery through `tools/list`;
- require Next 16.1 or later for `get_routes`;
- require Next 16.3 or later plus Turbopack for `get_compilation_issues`;
- require browser navigation before treating `get_errors` or `get_page_metadata` as route evidence;
- record unavailable requested tools as incomplete rather than substituting memorized tool names.

Treat Request Insights as request/span/fetch/cache evidence only. It is not interchangeable with the overlay/MCP and browser evidence required to prove Partial or Instant Prefetching behavior.

## Reconciliation

For each existing plan, rerun the matching scan at the current revision and compare the stored fingerprint:

- unchanged fingerprint and trigger: current;
- same rule/evidence with a moved location: refresh location and mark reconciled;
- absent diagnostic with complete coverage: candidate DONE, then verify behavior/checks;
- absent diagnostic with incomplete coverage: Unverified, not DONE;
- changed rule metadata or source contract: stale; reopen `rules explain` before keeping the plan;
- source already changed but verification missing: pending verification.

Update only plan artifacts during Reconcile mode.
