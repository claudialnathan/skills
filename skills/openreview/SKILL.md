---
name: openreview
description: This skill should be used when the user asks to audit, review, improve, fix, plan, reconcile, or implement Next.js framework work with OpenReview. It runs a separately provisioned OpenReview scanner across a repository or current-HEAD diff, vets deterministic diagnostics and high-leverage framework gaps, writes self-contained plans when requested, and implements only explicitly authorized Actionable or user-settled requested work before re-auditing the affected scope.
---

# OpenReview

Improve a Next.js target using OpenReview's versioned `DiagnosticReport` and framework judgment. Route the request from findings through planning or implementation without weakening evidence boundaries. Keep deterministic scanner evidence, imported React Doctor evidence, framework/runtime evidence, and advisor judgment visibly distinct.

Do not reproduce the deployed GitHub application's publication, credentials, model selection, sandbox, comments, commits, pushes, or deployment behavior.

## Route the task

State the mode, target, revision, report location, and write boundary before starting.

| User intent | Mode | Action |
| :--- | :--- | :--- |
| Audit, review, inspect, or a bare “improve/refine” request | **Review** | Run read-only evidence collection, return the vetted ledger, then stop for selection. |
| `quick` with a review request | **Review** | Run and vet the scanner only; do not hunt advisor gaps. |
| `deep` with a review request | **Review** | Add the extended framework-gap pass from `references/workflow.md`; retain the same read-only boundary. |
| Plan, hand off, or selected IDs without implementation authority | **Plan** | Reconcile evidence and write selected plans under `plans/`; do not edit product source. |
| Reconcile existing OpenReview plans | **Reconcile** | Recheck plan evidence and state against current source and scanner output; update plan artifacts only. |
| Fix, apply, remediate, implement approved IDs, or execute a selected plan | **Remediation** | Reconcile the explicitly selected Actionable or Requested change work, implement it, run focused proof, and re-audit the affected scope. |
| Explicitly build, create, refactor, or implement a named Next.js framework change | **Direct implementation** | Recon only far enough to establish the contract and authorized scope, implement without an artificial audit pause, then re-audit. |
| Fix, action, or implement everything OpenReview finds | **Remediation** | Freeze the complete ledger, resolve every Actionable root cause in leverage order, and keep every other state outside execution. |

Review, Plan, and Reconcile are read-only on product source. Remediation and Direct implementation require explicit implementation language and apply only to the named plan, IDs, surface, or “everything” scope. A bare improve request is not mutation authority. `execute-plan <path or ID>` remains accepted as a Remediation invocation for either executable ledger state, but a plan file is not a prerequisite when the user already supplied a concrete implementation scope. Broad “everything” Remediation selects Actionable defects only; it never sweeps Requested change rows into execution.

Never infer package installation, paid inference, credentials, commits, pushes, pull requests, deployment, or production access. Preserve unrelated work. Keep every Decision, Runtime required, and Unconfirmed row outside execution until its missing decision or evidence is resolved.

Load [`references/implementation.md`](references/implementation.md) for Remediation or Direct implementation. Load [`references/plan-template.md`](references/plan-template.md) only after plan selection. Load [`references/workflow.md`](references/workflow.md) for deep review, a monorepo, changed/lines comparison, runtime evidence, or a scanner-gap audit.

“Full,” “whole,” or “everything inside” selects scanner scope. It does not mean deep advisor review. Only an explicit `deep` request expands the manual gap hunt.

## Establish evidence

Read target-repository authority and inspect Git state before scanning. Resolve the requested target as the whole current checkout, working-tree diff, explicit paths, or a `<base>...HEAD` comparison. Do not claim support for a historical ref or range whose right side is not the current `HEAD`; reviewing that revision requires separate authority to materialize it in an isolated checkout. Treat a diff as the entry point: inspect complete owners, callers, routes, tests, and trust/freshness boundaries reached by the change.

Resolve an already-provisioned scanner command that implements the full `openreview-next` `DiagnosticReport` v1 CLI. Prefer `openreview-next` on `PATH`. An owner-identified trusted OpenReview source checkout may instead supply its absolute CLI entrypoint with its declared runtime, such as `bun /absolute/openreview/packages/cli/src/index.ts`, when that checkout lives outside the target repository and its exact source revision is recorded. Before scanning, probe the command surface with `rules list`; do not accept a single-purpose CI entrypoint that merely emits one report and ignores CLI arguments. This skill repository does not distribute that CLI.

Never run a target repository's `openreview` package script or wrapper: repository-owned scripts are untrusted execution, not scanner availability. Do not download a fallback, build the scanner during the target review, or install dependencies. Run one JSON scan with the narrowest truthful scope. Save the full report outside product source, then run `node <openreview-skill-directory>/scripts/compact-report.mjs <report.json>` and use its compact output for initial triage. Open the full report only for fields needed to vet a candidate or prove affected-file coverage. Remove temporary evidence when the work ends unless the owner named a report path.

The initial scan is single-pass. An incomplete report is a result to explain, not permission to clone or edit the target, rewrite configuration in a disposable copy, or run diagnostic scan variants. Run the scanner again only after authorized target source changed, scanner source changed in a separately authorized scanner task, or the first invocation was invalid. Do not invent a six-figure token allowance. Bound a standard review by one scanner pass, one grouped source search, and only the owner paths needed to prove reported rows.

Typical commands are:

```sh
openreview-next scan --scope full --format json
openreview-next scan --scope files --file <path> --untracked --format json
openreview-next scan --scope changed --base <revision> --format json
openreview-next rules explain <rule-key>
```

Treat the output contract literally:

- Always pass an explicit `--scope`; a repository configuration must not silently choose the review boundary. For full, files, or staged scans, parse a strict `openreview.diagnostic-report` v1 result before assigning Deterministic evidence. For changed or lines scans, parse a strict `openreview.scan-comparison` v1 envelope and its embedded strict `openreview.diagnostic-report` v1 `report`; do not mistake the comparison envelope for a report. Require the expected fields and reject unknown schema versions.
- Reconcile the parsed report's `invocation.mode`, applicable `baseRevision`, and exact file `scope` against the requested scan, using the embedded report for a comparison envelope. For a plain report, `report.complete` is the acceptance boundary. For changed or lines output, the top-level envelope `complete` is the acceptance boundary; retain the embedded `report.complete`, `comparison.complete` and reason, and `visibility.complete` as separate supporting provenance. A mismatched invocation or incomplete applicable boundary makes scanner coverage Unverified even when `rules list` succeeded.
- A plain `report.complete: true` plus zero active diagnostics supports only “no deterministic findings in completed coverage.” A complete changed/lines envelope plus zero active `added` diagnostics supports only “no newly introduced deterministic findings in this comparison”; it does not make the head repository clean.
- `complete: false`, required skipped checks, unavailable adapters, unresolved config, or a failed imported report forbids a clean conclusion.
- Preserve each diagnostic's rule key, ID, fingerprint, analyzer, provenance, version evidence, location, related locations, trigger evidence, suppression, and runtime-confirmation flag.
- Respect reasoned suppressions as deliberate evidence. Use audit-suppression mode only when the owner asks to review policy or suppression drift.
- Use `rules explain` for the canonical trigger, non-trigger boundary, ambiguity, source, fix recipe, and verification recipe. Do not approximate the fix from memory.
- Accept React Doctor JSON only through OpenReview's imported-report contract. Do not invoke its hosted API or executable target config from this skill.

When the CLI is unavailable, report scanner coverage as Unverified and continue only with clearly labelled advisor evidence. Never recreate deterministic rule results by eye. An explicitly authorized Direct implementation may still repair an independently proven Advisor finding, but it cannot claim deterministic scanner acceptance.

## Map framework leverage

After scanner triage, map only owners reached by active diagnostics. A standard Review may add one focused advisor pass over the highest-leverage owners exposed by the requested scope. `quick` stops after scanner triage; `deep` uses the complete partition in [`references/workflow.md`](references/workflow.md).

Do not turn generic React, accessibility, security, performance, composition taste, or component preferences into OpenReview findings when React Doctor or another owner already supplies them. Do not infer runtime performance, hydration, authorization absence, navigation behavior, or rendered primitive state from source alone.

## Audit and vet

For changed or lines scans, follow the comparison-ledger contract in [`references/workflow.md`](references/workflow.md). Comparison classes define the delta; visibility supplies locality without filtering project-level diagnostics.

Use two passes only for `deep`: first triage every in-scope active deterministic diagnostic against current source and its canonical explanation, then inspect high-leverage gaps the current catalogue does not claim to cover. Standard Review triages every active deterministic diagnostic and performs one focused advisor pass. Reopen each cited location, trace only the owner and consumers needed to prove the row, and deduplicate symptoms under one root cause.

Assign exactly one evidence class:

- **Deterministic** — an unchanged OpenReview/React Doctor/framework diagnostic with canonical provenance.
- **Advisor** — a repository-grounded issue outside deterministic ownership.
- **Runtime** — separately captured and imported build, dev, MCP, browser, Request Insights, or deployed evidence with its environment and provenance intact.

Then assign exactly one ledger state:

- **Actionable** — evidence supports a defect and a scoped implementation can resolve it.
- **Requested change** — the user explicitly settled a named additive, behavioral, or behavior-preserving refactor outcome and the framework/repository contract supports implementing it without pretending it is a defect.
- **Decision** — several product-valid freshness, route, ownership, or behavior outcomes remain.
- **Runtime required** — a concrete candidate cannot become Actionable until a named build, dev, MCP, browser, Request Insights, or deployed check supplies the missing consequence evidence.
- **Unconfirmed** — a concrete path and consequence exist, but named evidence is unavailable.
- **No action** — suppressed, by design, duplicate, outside scope, or disproven.

Never relabel advisor judgment or a user request as deterministic. Never use Unconfirmed for a hunch; name the missing evidence and the exact check that would settle it. For runtime evidence, record URL/environment, route, Next version, bundler, tool/browser version, invoked capability, and unverified areas.

## Freeze the ledger before planning or mutation

Return one ledger in Review mode. In Plan, Remediation, or a broad Direct implementation, freeze the applicable ledger before writing plans or changing source; this is an evidence checkpoint, not an approval pause when implementation is already explicit. State scope, mode, coverage, and evidence, then use columns for ID, evidence class, state, leverage, finding, location, rule/provenance, required action, and proof.

Order Actionable and Requested change rows by user consequence and blast radius, followed by Decision, Runtime required, Unconfirmed, and No action. List assessed and unassessed framework surfaces. A short, complete ledger is better than padded findings.

In Review mode, stop for the user to select plan IDs or authorize implementation. For a non-interactive Review invocation, select nothing. In Remediation, the invocation's named plans, IDs, approved findings, or explicit “everything” scope define the selection; never widen it from repository context. A named plan or ID may retain Requested change state, while “everything” selects only Actionable rows.

## Write selected plans

Create one self-contained plan per selected Actionable root cause or Requested change using [`references/plan-template.md`](references/plan-template.md). Stamp the exact commit, applicable diagnostic or advisor/runtime identity, current paths/lines, canonical rule recipe when one exists, repository exemplar, scope boundary, ordered changes, and evidence-appropriate verification. Write for an executor with no conversation context and no license to make product decisions.

Maintain `plans/README.md` with execution order, dependencies, status, and stale/reconciled state. Do not put Decision, Runtime required, or Unconfirmed work into executable steps.

## Implement and re-audit

In Remediation, reopen each selected plan or ledger row and reconcile its evidence identity according to its Deterministic, Advisor, or Runtime evidence class, along with its cited source, assumptions, ledger state, and current revision. In Direct implementation, create the equivalent evidence checkpoint in the working ledger without requiring a plan artifact. Require broad “everything” Remediation work to remain Actionable; an explicitly selected plan or ID and Direct implementation may remain Actionable or Requested change. Stop if work becomes stale, changes to a non-executable state, or contains an unresolved Decision.

Implement the smallest coherent change, preserve unrelated work, and follow [`references/implementation.md`](references/implementation.md). Re-audit the exact authorized worktree paths with explicit files scope and `--untracked`, then confirm every remaining touched and newly created source path appears in `analyzedFiles`; a committed comparison may additionally use changed or lines scope. A resolved diagnostic must disappear without lowering coverage, disabling the rule, adding a suppression, or weakening configuration. Exercise every runtime check named by the evidence in the environment that can prove it. If scanner visibility, the required runtime/auth surface, or an affected path is unavailable, leave that acceptance criterion Unverified rather than claiming completion.

Allow two repair attempts per root cause, then report its exact Blocked state. Re-audit only the affected framework surface and finish with each selected ID classified as Fixed, Implemented, Remaining, Regressed, Blocked, or Unverified. Leave unselected ledger rows unchanged.

## Sources

> This skill draws inspiration from publicly available content from [Vercel OpenReview](https://github.com/vercel-labs/openreview), [React Doctor](https://www.react.doctor), and [Next.js](https://nextjs.org).
