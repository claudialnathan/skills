---
name: openreview
description: |
  Run an OpenReview-faithful review locally against an entire codebase or an explicit diff, ref, range, or path. Map the repository, run project-owned checks, load matching target skills, inspect callers and trust boundaries, verify and deduplicate findings, and return an actionable Markdown ledger. Review mode is read-only. When the owner says action, resolve every verified actionable finding in the current checkout and re-verify it; decisions and unconfirmed candidates remain explicit. This is manual-only because whole-codebase review and remediation can consume substantial tokens and modify many files.
disable-model-invocation: true
argument-hint: '[action] [target: --all|--diff|ref|range|paths] [report: path]'
---

# OpenReview

Run the review in the current harness against the local target repository. This
ports OpenReview's review behavior; it does not start the Vercel application,
create a pull request, or claim to be its sandboxed GitHub workflow.
It owns code-defect review, not a launch-readiness, visual-preference, SEO,
product, or broad architecture audit unless one of those surfaces produces a
concrete defect in the reviewed code.

## Resolve mode and authority

State the mode, target, source revision, and write boundary before starting.

| Owner intent | Mode | Authority |
| :--- | :--- | :--- |
| Review, inspect, find issues, or no mode | **Review** | Read, run non-writing checks, and report. Do not edit source. |
| `action`, fix everything, or resolve the findings | **Action** | Review, then fix every `Actionable` finding unless the owner excludes IDs, paths, or classes of change. |
| `action` after an earlier report | **Action from ledger** | Reconcile the prior IDs against the current checkout, then fix every one still `Actionable`. Do not repeat settled discovery without a reason. |

`Action` authorizes local source and test changes plus project-owned verification.
It does not authorize installing packages, changing credentials, calling a paid
external review service, committing, pushing, opening or merging a pull request,
or deploying. Preserve unrelated work. A `Decision` or `Unconfirmed` row is not
actionable; continue with the remaining actionable rows instead of silently
choosing for the owner or stopping the whole run.

## Resolve the target

With no narrower target, review the whole codebase. `--all` states that scope
explicitly. `--diff` means the current working tree, including untracked files;
a ref names one commit; a range uses the merge-base diff; paths name complete
files or directories. State any generated, vendored, dependency, fixture, or
build-output exclusions and the repository evidence that justifies each one.

A diff is an entry point, not the full reading boundary. Read the complete
changed function or component, its callers and consumers, the tests that define
its behavior, and any trust, persistence, or cleanup boundary it crosses.

## Keep the OpenReview contract current

When `~/repos/openreview` exists, inspect only the current review-bearing files
needed to confirm the contract: `lib/agent.ts`, `lib/skills.ts`,
`workflow/steps/agent-loop.ts`, and `skills-lock.json`. Absence of that checkout
does not block the run; use the contract below and identify it as the bundled
fallback.

Preserve these OpenReview behaviors:

- investigate correctness, security, performance, error handling, concurrency,
  and code-quality defects without style nitpicks;
- use repository tools to explore and verify, and load specialized target skills
  progressively rather than placing every skill body in context;
- make every reported issue specific, located, consequential, and actionable;
- edit and verify when the owner asked for fixes; and
- finish with one complete Markdown result rather than progress narration.

The GitHub mention, pull-request number, `gh` commands, Vercel Sandbox, selected
provider/model, reactions, comment delivery, and automatic commit/push belong to
the deployed transport. Do not reproduce them locally.

## Orient once, then review

Read repository authority and Git state, then map tracked source, entry points,
package/workspace manifests, scripts, tests, generated boundaries, and shared
owners. Read the name and description of `.agents/skills/*/SKILL.md`; load only
the bodies that match the actual stack or review surface. Apply `AGENTS.md`,
`CLAUDE.md`, `CONTRIBUTING.md`, and equivalent project rules when present.

Select the relevant project-owned format check, linter, typechecker, tests,
build, and generated-file checks. Run each selected command once centrally with
a bounded timeout. Use the pinned package manager and installed tools. Never
download a fallback scanner or run a fixing formatter during Review mode. A
missing, failed-to-start, timed-out, or wrong-scope check is `Unverified`, not a
pass.

For a whole codebase, review by subsystem, entry point, trust boundary, mutation
path, and shared owner rather than by isolated file. Load
[`references/orchestration.md`](references/orchestration.md) only when the map
will not fit one careful context or the owner explicitly asks for workflows or
subagents. A single-agent run remains valid.

## Settle candidates before reporting

A candidate reaches the ledger only when it names a concrete code path and a
credible consequence. Reopen its cited lines, check adjacent control flow, and
use a project test, configuration, maintained upstream documentation, or a
focused reproduction where reading alone cannot settle it. Deduplicate symptoms
that share one root cause.

Assign exactly one state:

- `Actionable` — evidence supports a defect and the required change is inside
  the current authority;
- `Decision` — multiple valid outcomes remain and the owner must choose;
- `Unconfirmed` — the path and consequence are concrete, but named evidence is
  unavailable or the budget ended before verification; or
- `Fixed`, `Blocked`, or `No action` — a terminal result after Action mode.

`Unconfirmed` is not a place for hunches. Say what evidence is missing and the
next command or inspection that could settle it.

## Return one actionable ledger

Return the table in the response unless the owner supplied a report path. A
named report path authorizes writing that Markdown artifact, but not any other
Review-mode mutation. Never overwrite an existing report without preserving or
reconciling it.

```markdown
Scope: {target and revision} · Mode: {Review|Action}
Checks: {passed, failed, timed out, skipped, unverified}

| ID | State | Impact | Finding | Location | Required action | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| OR-001 | Actionable | Material | ... | file:line | ... | command, path, or source |
```

Order actionable rows by consequence, then decisions and unconfirmed coverage.
Make each decision name the options and the exact work each option changes. If
the result is clean, list the reviewed subsystems and checks so `No action` is
distinguishable from incomplete coverage.

## Action every actionable finding

Freeze the current IDs, reconcile them with the checkout, and group duplicates
under the root-cause fix. Implement the smallest coherent changes, add or amend
tests where they prove the trigger, run focused checks after each group, then
rerun every affected broad check. Do not weaken tooling, add suppressions, delete
tests, or relabel a failure to make the ledger green.

New verified defects found while fixing join the same ledger and are actioned
within the same invocation. Allow two repair attempts per finding and one final
rediscovery pass; after that, report the exact `Blocked` or `Unconfirmed` state
instead of starting an unbounded loop. End with every ID terminal and name the
remaining decisions, excluded scope, and checks that never produced evidence.

## Sources

> This skill draws inspiration from publicly available content from [Vercel](https://vercel.com/) and its [OpenReview](https://github.com/vercel-labs/openreview) review agent, [Claude Code](https://code.claude.com/), and [Ultracite](https://www.ultracite.ai/).
