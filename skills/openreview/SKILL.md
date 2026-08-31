---
name: openreview
description: Run a separately provisioned OpenReview Next.js scanner across a whole repository or current-HEAD diff, audit its deterministic diagnostics, find high-leverage framework gaps, and write self-contained implementation plans. Use only when the owner explicitly asks to "run openreview", "audit the Next.js codebase", "plan the OpenReview fixes", "reconcile OpenReview plans", or "execute an OpenReview plan". Discovery and planning are read-only; source mutation requires the explicit execute-plan mode. This command can inspect a broad codebase and consume substantial context.
disable-model-invocation: true
argument-hint: '[quick|deep|plan|reconcile|execute-plan] [target]'
---

# OpenReview

Survey a Next.js target repository using OpenReview's versioned `DiagnosticReport`, apply framework judgment to the reported evidence and the scanner's known gaps, then produce a vetted ledger and self-contained plans. Keep deterministic scanner evidence, imported React Doctor evidence, framework/runtime evidence, and advisor judgment visibly distinct.

Run as a command skill only. Do not reproduce the deployed GitHub application's publication, credentials, model selection, sandbox, comments, commits, pushes, or deployment behavior.

## Resolve mode and authority

State the mode, target, revision, report location, and write boundary before starting.

| Owner intent | Mode | Authority |
| :--- | :--- | :--- |
| Review, audit, inspect, bare invocation | **Review** | Read source, run read-only scanners/checks, return the ledger, then stop for plan selection. |
| `quick` or `deep` | **Review** | Adjust coverage only; retain the same read-only boundary. |
| `plan <description or IDs>` | **Plan** | Reconcile evidence and write selected plans under `plans/`; do not edit product source. |
| `reconcile` | **Reconcile** | Recheck existing plans against current source and scanner output; update plan state only. |
| `execute-plan <path or ID>` | **Execute plan** | Dispatch or perform exactly the selected plan, then verify it against the scanner and project checks. |
| Legacy `action` | **Deprecated** | Preserve the request to resolve every verified Actionable row by producing the ledger and one plan per Actionable root cause, but do not silently treat it as source-mutation authority. Explain the migration to `execute-plan`. |

Never infer package installation, paid inference, credentials, commits, pushes, pull requests, deployment, or production access. Preserve unrelated work. Keep every Decision and Unconfirmed row outside execution until separately resolved.

Load [`references/migration.md`](references/migration.md) for a legacy `action` invocation. Load [`references/plan-template.md`](references/plan-template.md) only after plan selection. Load [`references/workflow.md`](references/workflow.md) for deep review, a monorepo, runtime evidence, or a scanner-gap audit.

## Establish evidence

Read target-repository authority and inspect Git state before scanning. Resolve the requested target as the whole current checkout, working-tree diff, explicit paths, or a `<base>...HEAD` comparison. Do not claim support for a historical ref or range whose right side is not the current `HEAD`; reviewing that revision requires separate authority to materialize it in an isolated checkout. Treat a diff as the entry point: inspect complete owners, callers, routes, tests, and trust/freshness boundaries reached by the change.

Locate an already-installed `openreview-next` CLI that implements `DiagnosticReport` v1 and the commands below. This skill repository does not distribute that CLI. Never run a target repository's `openreview` package script or wrapper: repository-owned scripts are untrusted execution, not scanner availability. Do not download a fallback or install dependencies. Run one JSON scan with the narrowest truthful scope. Preserve the report outside product source and remove temporary evidence when the review ends unless the owner named a report path.

Typical commands are:

```sh
openreview-next scan --format json
openreview-next scan --scope changed --base <revision> --format json
openreview-next rules explain <rule-key>
```

Treat the report contract literally:

- `complete: true` plus zero active diagnostics supports only “no deterministic findings in completed coverage.”
- `complete: false`, required skipped checks, unavailable adapters, unresolved config, or a failed imported report forbids a clean conclusion.
- Preserve each diagnostic's rule key, ID, fingerprint, analyzer, provenance, version evidence, location, related locations, trigger evidence, suppression, and runtime-confirmation flag.
- Respect reasoned suppressions as deliberate evidence. Use audit-suppression mode only when the owner asks to review policy or suppression drift.
- Use `rules explain` for the canonical trigger, non-trigger boundary, ambiguity, source, fix recipe, and verification recipe. Do not approximate the fix from memory.
- Accept React Doctor JSON only through OpenReview's imported-report contract. Do not invoke its hosted API or executable target config from this skill.

When the CLI is unavailable, report scanner coverage as Unverified and continue only with clearly labelled advisor reconnaissance. Never recreate deterministic rule results by eye.

## Map framework leverage

Build a compact map before prioritizing findings:

- route and layout traffic: shared layouts, route groups, parallel/intercepting routes, App/Pages ownership, and entry points reached by many navigations;
- client blast radius: Client Component boundaries, providers, bundles, and shared imports that move work across many routes;
- cache freshness: cache scopes, tags, producers, invalidators, mutation read-your-writes needs, and routes where stale data is consequential;
- public mutations: Route Handlers, Server Actions, upload/webhook boundaries, and the actual authorization owner;
- navigation hot paths: links, redirects, prefetch behavior, loading/app-shell boundaries, and frequently repeated route transitions;
- precise primitive ownership: components.json aliases and proven shadcn, Base UI, or Radix imports/types when mechanics matter.

Do not turn generic React, accessibility, security, performance, composition taste, or component preferences into OpenReview findings when React Doctor or another owner already supplies them. Do not infer runtime performance, hydration, authorization absence, navigation behavior, or rendered primitive state from source alone.

## Audit and vet

Use two passes. First, triage every active deterministic diagnostic against current source and its canonical explanation. Second, inspect high-leverage gaps the current catalogue does not claim to cover. Reopen each cited location, trace the relevant owner and consumers, and deduplicate symptoms under one root cause.

Assign exactly one evidence class:

- **Deterministic** — an unchanged OpenReview/React Doctor/framework diagnostic with canonical provenance.
- **Advisor** — a repository-grounded issue outside deterministic ownership.
- **Runtime** — separately captured and imported build, dev, MCP, browser, Request Insights, or deployed evidence with its environment and provenance intact.

Then assign exactly one ledger state:

- **Actionable** — evidence supports a defect and a scoped plan can resolve it.
- **Decision** — several product-valid freshness, route, ownership, or behavior outcomes remain.
- **Runtime required** — a concrete candidate cannot become Actionable until a named build, dev, MCP, browser, Request Insights, or deployed check supplies the missing consequence evidence.
- **Unconfirmed** — a concrete path and consequence exist, but named evidence is unavailable.
- **No action** — suppressed, by design, duplicate, outside scope, or disproven.

Never relabel advisor judgment as deterministic. Never use Unconfirmed for a hunch; name the missing evidence and the exact check that would settle it. For runtime evidence, record URL/environment, route, Next version, bundler, tool/browser version, invoked capability, and unverified areas.

## Return the ledger and stop

Return one ledger before writing plans:

```markdown
Scope: {target and revision} · Mode: Review
Coverage: {complete/incomplete plus required skips}
Evidence: {scanner version/schema, imported adapters, project checks}

| ID | Evidence class | State | Leverage | Finding | Location | Rule/provenance | Required action | Proof |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| OR-001 | Deterministic | Actionable | High | ... | file:line | rule key + fingerprint | ... | report/check/runtime state |
```

Order Actionable rows by user consequence and blast radius, followed by Decision, Runtime required, Unconfirmed, and No action. List assessed and unassessed framework surfaces. A short, complete ledger is better than padded findings.

Stop for the owner to select plan IDs. For a non-interactive invocation, select no plans unless the invocation explicitly supplied IDs or a plan description. The deprecated legacy `action` mode is the sole exception: it selects every Actionable row for plan creation while still withholding product-source mutation until `execute-plan`.

## Write selected plans

Create one self-contained plan per selected Actionable root cause using [`references/plan-template.md`](references/plan-template.md). Stamp the exact commit, applicable diagnostic or advisor/runtime identity, current paths/lines, canonical rule recipe when one exists, repository exemplar, scope boundary, ordered changes, and evidence-appropriate verification. Write for an executor with no conversation context and no license to make product decisions.

Maintain `plans/README.md` with execution order, dependencies, status, and stale/reconciled state. Do not put Decision or Unconfirmed work into executable steps.

## Execute only a selected plan

Require `execute-plan <path or ID>`. Reopen the plan and reconcile its diagnostic fingerprint, cited source, assumptions, and current commit before mutation. Stop if it is stale or contains an unresolved Decision. Implement the smallest coherent change, preserve unrelated work, and run focused verification followed by affected broad checks.

Rerun OpenReview in changed scope. A resolved diagnostic must disappear without lowering coverage, disabling the rule, adding a suppression, or weakening configuration. Exercise every runtime check named by the plan in the environment that can prove it. If the required runtime/auth surface is unavailable, leave that acceptance criterion Unverified rather than claiming completion.

Allow two repair attempts, then report the exact Blocked state. Finish with every selected ID terminal and leave unselected ledger rows unchanged.

## Sources

> This skill draws inspiration from publicly available content from [Vercel OpenReview](https://github.com/vercel-labs/openreview), [React Doctor](https://www.react.doctor), and [Next.js](https://nextjs.org).
