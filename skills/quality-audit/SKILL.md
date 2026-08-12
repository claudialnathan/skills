---
name: quality-audit
description: |
  This skill should be used for a whole-repository, stack-aware quality audit of a JavaScript or TypeScript web project; pre-ship risk review; launch-readiness checkup; or scheduled read-only scan. It detects applicable framework, UI, server, data, security, accessibility, performance, state-integrity, launch, and project-rule risks; runs project-owned verification; and reports evidence. With explicit remediation, it waits for bounded asynchronous results, fixes within scope, and reruns until every accepted finding is terminal. Unrun and unsupported checks stay unverified; it never fetches a latest scanner implicitly and preserves unrelated work. Use a scoped review for one file or diff.
disable-model-invocation: true
argument-hint: '[mode: audit|plan|apply] [profile: repository|launch]'
---

# Quality audit

Run one integrated repository risk review without turning scanner output or a
generic checklist into authority. Detect the real stack, execute repository
checks, trace the highest-risk flows end to end, reproduce findings where
possible, and keep every unsupported claim honestly unverified.

## Select the mode

| Intent | Mode and authority |
| :--- | :--- |
| Audit, review, pre-ship, scheduled scan, or ambiguous “improve quality” | **Findings:** read-only inspection and verification. Make no product or repository writes. |
| Launch checkup or release-readiness review | **Findings + launch profile:** assess the exact target environment and report; make no writes unless remediation is also explicit. |
| Get launch-ready, fix until ready, or resolve approved launch findings | **Remediation + launch profile:** settle the accepted finding set through bounded fix and verification rounds. |
| Plan | **Plan:** name files, owners, acceptance, and proof. Make no writes. |
| Apply, implement approved findings, or approved IDs | **Remediation:** change only the accepted scope in the current checkout, preserve unrelated work, then re-audit. |
| Explicitly build or implement a named quality requirement | **Direct implementation:** implement that requested scope without a redundant audit pause, then re-audit. |

The read-only default is behavioral, not mechanically enforced. Do not create a
branch, stash, reset, commit, push, install, or mutate scheduled configuration
unless separately authorized. State the active mode and keep an auditable
record of approved finding IDs.

## Select the profile

- Use `repository` by default for the existing source, runtime, and project-rule
  dimensions.
- Use `launch` only when the user explicitly asks for a launch, go-live,
  production-readiness, or larger pre-ship checkup. Read
  [`references/release-readiness.md`](references/release-readiness.md), record
  the exact environment under review, and add only the applicable launch
  domains. A preview, staging deployment, and production are different targets.

## Orient and detect applicability

1. Read tracked repository authority and current Git state. Treat ignored or
   private notes as local context, not published project contracts.
2. Read package manifests, lockfiles, scripts, workspace configuration, router
   layout, build configuration, CSS/component configuration, test setup, and
   server/data/auth dependencies.
3. Resolve decision-bearing package versions and installed contracts. A
   dependency name alone does not prove App Router, RSC, a shadcn primitive
   base, Tailwind mode, or feature applicability.
4. Map entry points, public/runtime outputs, auth and mutation boundaries,
   shared owners, and representative user flows.
5. Mark each dimension applicable, not applicable, or unverified with its
   evidence. Do not force React, Next.js, shadcn, or browser lenses onto an
   unrelated repository.

For large repositories, split discovery only when independent scopes can be
reconciled into one evidence model. Re-open every cited finding in the final
pass; parallel output is not proof.

## Run repository-owned verification

Use the declared package manager. Run relevant existing format, lint, type,
test, build, generated-file, migration, and browser checks within bounded
timeouts. Record command, target, exit status, and the first actionable
diagnostic while preserving the complete safe artifact when one exists.

For React Doctor:

- prefer a repository script such as `doctor` or `doctor:diff`;
- otherwise use an already installed, project-pinned executable whose version
  can be recorded;
- never run `npx -y react-doctor@latest` or another implicit package download;
- if no pinned/installed command exists, report the check `Unverified`;
- run an external or updated scanner only after explicit authorization.

For `ui-preship`, where the repository carries it as a development dependency
alongside a `ui-preship.config.json`:

- run `npm run ui-preship` for the quiet staged `quick` profile, or
  `npx ui-preship check --scope changed --base <base> --head HEAD --profile full`
  when the audit covers a range;
- read its report for which UI risk surfaces the scope touched and which
  repository commands actually ran, rather than inferring either from the diff;
- treat it as advisory. Its retained policy is `blockingMode: "none"`, so grade
  what it raises the same way as anything else here and never let it gate;
- where the dependency or its config is absent, record the check `Unverified`
  and carry on. Do not install it.

Distinguish `passed`, `failed`, `skipped`, `timed out`, `unsupported`, and
`unverified`. A missing tool, wrong workspace, offline scanner, or command that
never assessed the target is not a pass. Scanner scores and linter categories
are evidence; reproduce their user/system consequence before promoting them.

## Review applicable dimensions

Use [`references/dimensions.md`](references/dimensions.md) for one standalone
risk probe per applicable dimension:

- correctness and tooling;
- framework and React behavior;
- web-vitals risk;
- exact UI-stack seams;
- visual hierarchy and state;
- motion;
- accessibility;
- shared components;
- project rules;
- client and server security;
- data exposure;
- async state integrity and failure recovery.

Trace cross-boundary risks end to end. A missing authorization check matters at
the callable endpoint, not merely in the page that links to it. A stale-response
race matters at the visible/persisted state, not merely at one effect. A shared
component issue matters through its consumers. Keep exact installed
shadcn/Tailwind mechanics compact here; keep visual preference differences as
decisions unless rendered evidence shows harm.

## Grade from impact and proof

Every finding records:

- **evidence status:** `Observed`, `Inferred`, `Decision`, or `Unverified`;
- location and affected flow/surface;
- user or system impact;
- reach and recurrence;
- exploitability when relevant;
- confidence and proof;
- introduced versus pre-existing state when the evidence can establish it;
- proposed action and verification criterion.

Use:

- **P0:** reproduced or highly credible loss of data/security, severe
  accessibility barrier, unusable core workflow, or release-blocking system
  failure with meaningful reach;
- **P1:** material correctness, performance, accessibility, security, or
  recovery risk that should be fixed but does not meet P0 impact;
- **P2:** bounded maintainability or proportionate polish with low immediate
  impact;
- **Decision:** product or ownership choice that evidence cannot label a
  defect.

Do not grade every lint/build failure, vulnerable dependency, or UI preference
by category alone. Consider target correctness, exploitability, affected reach,
pre-existing state, and whether the problem was reproduced. Keep an inferred
P0 separate from an observed P0.

## Report

Lead with the verdict and edit boundary:

```markdown
Verdict: {highest-impact risk}; {read-only or implementation status}.

Scope: {repository/surface} · Proof: {observed/static/unverified}

| ID | Grade | Status | Finding | Location | Proposed action | Proof |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| QA-001 | P1 | Observed | … | file:line | … | command/state/artifact |
```

Keep the primary queue to five decision groups while preserving the total P0
count and a path to the complete result. Include:

- detected stack and applicable/skipped dimensions;
- verification command statuses with unrun reasons;
- introduced versus pre-existing classification when proven;
- approved, applied, pending, and blocked state;
- exact reruns and remaining unverified evidence.

Do not invent a Before/After patch in a read-only audit. Preference-only visual
differences are decisions, not defects. End a no-change result with
`No action needed`.

After authorized implementation, re-run the focused evidence and report fixed,
remaining, regressed, and unverified states. The current checkout—not an
automatically created branch—is the implementation boundary.

## Settle the accepted finding set

Do not stop at a scanner score, green conclusion, or first clean-looking
inventory when remediation is authorized. Freeze the accepted finding set and
drive every item to one explicit state: `passed`, `fixed`, `not-applicable`,
`accepted-decision`, `confirmed-false-positive`, `blocked`, or `unverified`.
`Blocked` and `unverified` are honest terminal report states, never passes.

For each round:

1. Identify the current source revision, deployment, configuration revision,
   and ruleset that own the evidence.
2. Wait for relevant asynchronous checks and external assessments to become
   terminal, bounded to about 10 minutes for the round. Read their output even
   when the provider reports success.
3. Classify every current result before editing. Fix actionable findings only
   inside the accepted scope; keep decisions, duplicates, false positives, and
   unavailable evidence distinct.
4. Implement the smallest root-cause fix, run focused local and rendered proof,
   then rerun every affected check. A code, config, or deployment change
   invalidates prior evidence for that surface.
5. Restart the inventory on the new revision. Allow at most 3 rounds per
   invocation and 2 fix attempts per finding; report the exact remaining state
   when a budget is exhausted.
6. When asynchronous providers are involved, require two inventories with the
   same revision and actionable fingerprint at least 15 seconds apart before
   calling the result settled. Derive the fingerprint from stable finding IDs,
   statuses, evidence hashes, and target identities; exclude timestamps and
   provider progress chatter. Use the interval for diff or evidence review, not
   an idle blocking wait.

Never obtain a clean result by weakening a check, deleting a test, suppressing
a legitimate finding, or converting missing access into a pass. Stop and ask
when remediation would cross scope, needs credentials or external mutation,
survives 2 attempts, or requires a product, legal, security, or commercial
decision.

Call a launch target ready only when all required checks for the current target
are terminal, every actionable accepted finding is settled, no required P0/P1
evidence remains unverified without explicit risk acceptance, and the final
report names every remaining decision, blocker, and unsupported surface.

## Recurrence and automation

Offer a rule, hook, CI, or scheduled follow-up only when recurrence or one
high-impact deterministic invariant earns it. State the invariant, narrowest
surface, valid exceptions, fixture, false-positive boundary, and removal/review
condition. Do not auto-edit those surfaces from an audit.

Use [`references/automation.md`](references/automation.md) only for a
separately authorized read-only scheduled report. Scheduled fix mutation is not
a default.

## Sources

> This skill draws inspiration from publicly available content from [React](https://react.dev/), [Next.js](https://nextjs.org/), [OWASP](https://owasp.org/), [WebAIM](https://webaim.org/), [React Doctor](https://react.doctor/), [Vercel](https://vercel.com/), and [Ishikawa](https://catnose.me/notes/web-checklist).
