# PR stabilization loop

Use this loop after opening a pull request and after every push to its branch. Treat the head SHA as the identity of one review cycle: any new commit invalidates prior clean evidence and starts the loop again.

## Resolve the target

Resolve the repository and PR explicitly before polling:

```bash
gh repo view --json nameWithOwner
gh pr view <pr> --json number,url,state,isDraft,mergeable,mergeStateStatus,headRefName,headRefOid,baseRefName,reviewDecision
```

Record the current `headRefOid`. Compare every check, comment, annotation, and local verification claim to that SHA. Fetch the branch before declaring synchronization, then compare local, upstream, and PR heads:

```bash
git fetch origin
git rev-parse HEAD
git rev-parse '@{upstream}'
gh pr view <pr> --json headRefOid
git status --short
```

Require all three hashes to agree and `git status --short` to be empty.

## Wait, then inventory

Wait for the visible PR checks:

```bash
gh pr checks <pr> --watch --interval 10
gh pr checks <pr> --required --json bucket,completedAt,description,link,name,state,workflow
```

Continue to inventory after a non-zero exit; the failed or cancelled check is itself a finding. Use the `bucket` field to distinguish pass, fail, pending, skipping, and cancelled results, and explain any expected skip. Do not treat `gh pr checks` as complete evidence because check output, annotations, review threads, late bot comments, and deployment feedback live on other surfaces.

Resolve `SHIP_SKILL_DIR` to the directory containing this skill's `SKILL.md`, then run the bundled read-only helper:

```bash
python3 "$SHIP_SKILL_DIR/scripts/fetch-pr-feedback.py" --repo owner/repo --pr <pr> > /tmp/pr-feedback-1.json
```

The helper is read-only. It resolves the current PR head and returns:

- PR state, draft state, mergeability, merge state, and review decision;
- check runs for the current head, including output title, summary, text, annotation count, and fetched annotations;
- commit status contexts, which are distinct from check runs;
- deployments for the current head and every deployment's status history and latest status;
- paginated conversation comments and submitted reviews;
- fully paginated inline review threads with resolution, outdated state, paths, lines, and comments, plus a separately paginated list of every inline review comment;
- an `inventoryFingerprint` that excludes the observation timestamp.

If the helper cannot cover a repository-specific provider, query that provider or its PR comment directly and record the gap. Never convert missing access into a clean result.

## Inspect GitHub surfaces directly when needed

For the current head SHA, inspect all check-run output rather than only the conclusion:

```bash
gh api --paginate --slurp \
  -H 'Accept: application/vnd.github+json' \
  repos/<owner>/<repo>/commits/<sha>/check-runs
```

For every run whose `output.annotations_count` is non-zero:

```bash
gh api --paginate --slurp \
  -H 'Accept: application/vnd.github+json' \
  repos/<owner>/<repo>/check-runs/<check-run-id>/annotations
```

Use `gh run view <run-id> --log-failed` for failed GitHub Actions jobs and `gh run view <run-id> --log` when a successful job's output needs context. Treat warning text in `output.title`, `output.summary`, `output.text`, annotations, or an edited PR comment as feedback even when the conclusion is `success`.

Inspect these providers when present: React Doctor, Vercel Agent Review, Bugbot, CodeRabbit, Socket, dependency and security scanners, accessibility checks, deployment previews, and repository-specific bots. Classify a successful deployment notice or a dependency report with no alerts as informational, not as code work.

## Classify before editing

Assign every item to exactly one class:

| Class | Action |
|---|---|
| Actionable current-head finding | Fix within the shipped change's scope. |
| Duplicate | Link mentally to the owning finding; fix once. |
| Informational status | Record for the final report; do not edit code. |
| Resolved or outdated finding | Verify that the new head made it obsolete; do not reopen without new evidence. |
| Confirmed false positive | Preserve the evidence and rationale; suppress only when repository convention requires it. |
| Ambiguous or conflicting request | Stop and ask before changing product behavior or crossing scope. |

Do not make the PR green by disabling or weakening a check, removing a test, adding a broad ignore, suppressing a legitimate diagnostic, resolving a thread before fixing it, or rewriting code solely to evade static analysis while preserving the defect. Permit a narrow suppression only after source inspection proves a false positive or repository documentation marks the pattern intentional.

## Follow-up fix cycle

For each actionable cluster:

1. Inspect the implicated source, repository rules, tests, and installed-library guidance.
2. Implement the smallest fix at the root cause.
3. Run the relevant local checks.
4. Add targeted runtime or browser validation for visual, interactive, accessibility-sensitive, or deployment-dependent behavior.
5. Review the diff for regressions, secrets, and unrelated changes.
6. Commit the fix as its own logical Conventional Commit. Avoid a new changelog entry unless the fix creates a durable decision.
7. Push normally without force.
8. Resolve or reply to the corresponding thread only after the pushed head verifies the fix.
9. Resolve the new head SHA and restart the entire wait-and-inventory loop.

Never carry a prior head's green checks or clean comments forward as proof for the new head.

## Require two clean inventories

After all current-head checks are terminal, fetch the full inventory. Wait at least 15 seconds, then fetch it again:

```bash
python3 "$SHIP_SKILL_DIR/scripts/fetch-pr-feedback.py" --repo owner/repo --pr <pr> > /tmp/pr-feedback-2.json
```

Require both snapshots to be independently clean and their `inventoryFingerprint` values to match. A matching fingerprint establishes only that GitHub-visible feedback was stable during the interval; still honor any provider-specific pending state or delayed-review contract. Restart the interval when a comment, review, thread, check, annotation, status context, or head SHA changes.

## Completion audit

Before reporting ready:

- Confirm every current-head check is terminal.
- Confirm required checks pass and explain expected skips.
- Read every successful advisory check's output for actionable warnings.
- Confirm no actionable unresolved review thread and no changes-requested review remains.
- Confirm every current-head deployment's latest status is terminal and ready when present.
- Confirm the PR is `OPEN`, not draft, mergeable, and clean.
- Confirm local HEAD, upstream HEAD, and PR head match.
- Confirm the working tree is clean.
- Confirm two consecutive complete inventories are clean.
- Confirm the PR is not merged and auto-merge was not enabled.

When a provider is pending, stalled, inaccessible, rate-limited, or awaiting external input, keep waiting when useful or report the exact surface and state as a blocker. Never substitute “all visible checks passed” for an incomplete completion audit.

## Acceptance scenarios

Exercise these as Given/Then acceptance tests when changing this workflow:

- **Given a required CI failure,** then inspect logs, fix, verify locally, push, and restart.
- **Given a successful React Doctor or other advisory check with warnings,** then treat the warnings as findings despite the green conclusion.
- **Given a late inline Bugbot or other bot comment,** then include it in the second inventory and restart if actionable.
- **Given a successful Vercel review with zero suggestions,** then classify it as clean informational evidence.
- **Given a finding made outdated by a follow-up fix,** then verify obsolescence on the new head and do not count it as unresolved.
- **Given a new head commit,** then discard the prior cycle's clean claim and rerun everything.
- **Given terminal checks and no actionable feedback,** then pass the completion audit before reporting the PR ready.
- **Given no explicit merge request in the current conversation,** then leave the PR open and unmerged in every scenario.
