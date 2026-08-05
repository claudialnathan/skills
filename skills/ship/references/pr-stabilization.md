# PR stabilization loop

Run this after opening a pull request and after every push to its branch. The head SHA is the identity of one review cycle: a new commit invalidates all prior clean evidence and starts the cycle again.

Three budgets keep the loop finite. Exhausting any one of them ends the loop with a report, never with another attempt:

| Budget | Limit | On exhaustion |
|---|---|---|
| Wait for checks to go terminal | ~10 minutes per round | Report the pending check names as the blocker. |
| Stabilization rounds per invocation | 3 | Report state and ask whether to continue. |
| Fix attempts per finding | 2 | Report the finding and both attempts; ask. |

## Resolve the target

```bash
gh repo view --json nameWithOwner
gh pr view <pr> --json number,url,state,isDraft,mergeable,mergeStateStatus,headRefOid,reviewDecision
```

Record `headRefOid` and compare every check, comment, annotation, and verification claim to that SHA. Before claiming synchronization, fetch and compare all three heads:

```bash
git fetch origin
git rev-parse HEAD '@{upstream}'   # set upstream on the first push with: git push -u origin HEAD
gh pr view <pr> --json headRefOid
git status --short
```

All three hashes must agree and `git status --short` must be empty.

## Wait for terminal checks, bounded

```bash
gh pr checks <pr> --watch --interval 10
```

Bound this call at roughly 10 minutes with the timeout control of whichever tool runs it; where the GNU `timeout` binary exists, `timeout 600 gh pr checks …` also works. Never re-issue an unbounded watch, and never restart a watch that already consumed its budget — read the exit condition instead:

| Result | Meaning | Action |
|---|---|---|
| Exit 0 | All checks terminal and passing | Inventory. |
| Exit 1 | A check failed, or the PR reports no checks at all | Inventory; a no-checks PR is normal in repos without CI. |
| Exit 8 | Still pending when the watch gave up | Inventory once, then report the pending names as the blocker. |
| Killed at the budget | Provider stalled | Inventory once, then report the pending names as the blocker. |

A failed or cancelled check is a finding, not a reason to skip the inventory. `gh pr checks` alone is never complete evidence: check output, annotations, review threads, late bot comments, and deployment feedback live on other surfaces.

## Inventory the current head

Resolve `SHIP_SKILL_DIR` to the directory holding this skill's `SKILL.md`, then run the bundled read-only helper. Its default digest is sized to be read in full — it truncates bodies to snippets and keeps the ids needed to fetch any of them whole:

```bash
python3 "$SHIP_SKILL_DIR/scripts/fetch-pr-feedback.py" --repo owner/repo --pr <pr>
```

The digest carries PR state, draft state, mergeability, merge state, review decision, and:

- `checks.pending`, `checks.failing`, `checks.skipped`, `checks.passingCount`;
- `checks.withOutput` — **every** check that wrote any output, whatever its conclusion, with title and summary snippet;
- `checks.annotations` — level, path, line, and message per annotating check, deduplicated with an `occurrences` count;
- `nonSuccessStatuses` — commit status contexts, which are distinct from check runs;
- `deployments` — current-head environments with their latest status;
- `reviews` — submitted reviews and states; `threads.unresolved` — path, line, `isOutdated`, node id, and latest-comment snippet, with resolved and outdated counts;
- `conversationComments` — author, `bodyHash`, snippet, url;
- `actionableFingerprint` and `commentFingerprint`, both timestamp-free.

GitHub keeps every re-run of a check against one SHA, so a stale failure can sit beside its green re-run. The digest keeps only the newest run per check name and reports the rest as `counts.supersededRerunsIgnored`. Never treat a superseded run as a finding; if a raw `gh api` call shows a failure the digest does not, check whether a later run replaced it.

Read the untruncated text of anything the digest flags, one item at a time:

```bash
python3 "$SHIP_SKILL_DIR/scripts/fetch-pr-feedback.py" --pr <pr> --show check:<id>
python3 "$SHIP_SKILL_DIR/scripts/fetch-pr-feedback.py" --pr <pr> --show thread:<node-id>
```

`--show` also takes `comment:<id>` and `review:<id>`. `--full` dumps every raw field; it costs many times the digest, so reach for it only when the digest genuinely cannot answer a question. Never pull `--full` merely to re-read bodies the digest already summarized.

If the helper fails, retry it once; it already retries transient GitHub errors internally and times out each call at 60 seconds. If it still fails, or cannot cover a repository-specific provider, query that provider directly and record the gap. Never convert missing access into a clean result.

Fallback surfaces, when the helper is unavailable:

```bash
gh api --paginate --slurp repos/<owner>/<repo>/commits/<sha>/check-runs
gh api --paginate --slurp repos/<owner>/<repo>/check-runs/<check-run-id>/annotations
gh run view <run-id> --log-failed
```

Never use `gh pr view --comments` as the inventory: it omits thread resolution, annotations, and provider state.

Read output as content, not conclusions. Treat warning text in `output.title`, `output.summary`, `output.text`, an annotation, or an edited PR comment as feedback even when the conclusion is `success`. Inspect these providers when present: React Doctor, Vercel Agent Review, Bugbot, CodeRabbit, Socket, dependency and security scanners, accessibility checks, deployment previews, and repository-specific bots. A successful deployment notice or a dependency report with no alerts is informational, not code work.

## Classify before editing

Assign every item to exactly one class:

| Class | Action |
|---|---|
| Actionable current-head finding | Fix within the shipped change's scope. |
| Duplicate | Fix once; note the owning finding. |
| Informational status | Record for the final report; do not edit code. |
| Resolved or outdated finding | Confirm the new head made it obsolete; do not reopen without new evidence. |
| Confirmed false positive | Keep the evidence and rationale; suppress only after inspection proves it false **and** repository convention requires an ignore — never to clear a ship gate. |
| Ambiguous or conflicting request | Stop and ask before changing product behavior or crossing scope. |
| Legitimate finding vs intentional product behaviour | Stop and ask. Do not invent a suppressions-table row to claim Clean. |

Do not make the PR green by disabling or weakening a check, removing a test, adding a broad ignore, suppressing a legitimate diagnostic, resolving a thread before fixing it, or rewriting code solely to evade static analysis while preserving the defect. Owner-approved narrow suppressions for load-bearing patterns are the only non-false-positive exception — and they require explicit approval in the current conversation, not agent self-authorization.

## Stop and ask instead of improvising

Report state and ask — do not explore for a way through — when any of these holds:

- The same finding survives two fix attempts.
- The fix would touch files outside the delivery set fixed at Procedure step 1.
- `mergeStateStatus` is `DIRTY` (conflicts) or `BEHIND` (base moved): rebasing, merging the base, or force-pushing is the user's call.
- A check needs credentials, a secret, or an approval the agent does not have.
- Feedback is ambiguous, conflicts with repository rules, or needs a materially broader product decision.
- Two reviewers demand incompatible changes.
- A round, wait, or fix-attempt budget is exhausted.

## Follow-up fix cycle

For each actionable cluster:

1. Inspect the implicated source, repository rules, tests, and installed-library guidance.
2. Implement the smallest fix at the root cause.
3. Run the relevant local checks.
4. Add targeted runtime or browser validation for visual, interactive, accessibility-sensitive, or deployment-dependent behavior.
5. Review the diff for regressions, secrets, and unrelated changes.
6. Commit the fix as its own logical Conventional Commit. Add no changelog entry unless the fix creates a durable decision.
7. Push normally, never with force.
8. Reply to or resolve the thread only after the pushed head verifies the fix. The digest carries each thread's node `id`:

   ```bash
   gh api graphql -f threadId=<thread-node-id> -f body='<reply>' -f query='
     mutation($threadId:ID!,$body:String!) {
       addPullRequestReviewThreadReply(input:{pullRequestReviewThreadId:$threadId,body:$body}) { comment { url } }
     }'
   gh api graphql -f threadId=<thread-node-id> -f query='
     mutation($threadId:ID!) {
       resolveReviewThread(input:{threadId:$threadId}) { thread { isResolved } }
     }'
   ```

9. Resolve the new head SHA, spend a round of the budget, and restart the wait-and-inventory loop.

Never carry a prior head's green checks or clean comments forward as proof for the new head.

## Converge on two clean snapshots

Once all current-head checks are terminal and the digest shows nothing actionable, take a second, cheap snapshot at least 15 seconds later — fill the gap with the diff review or local checks rather than a blocking sleep:

```bash
python3 "$SHIP_SKILL_DIR/scripts/fetch-pr-feedback.py" --pr <pr> --fingerprint
```

Convergence rules, which are what keep this from spinning:

- `headSha` must be unchanged, and `actionableFingerprint` must match the first snapshot. A changed `actionableFingerprint` means real new feedback: inventory again and restart.
- A changed `commentFingerprint` alone does **not** restart the loop. Bots routinely edit their own status comments. Re-read only the comments whose `bodyHash` moved, classify them, and continue; edited informational chatter never blocks convergence.
- A matching fingerprint proves only that GitHub-visible feedback held still for the interval. Still honor any provider's documented pending state.
- Two matching snapshots settle the PR. Do not keep sampling for further reassurance.

## Completion audit

Confirm before reporting ready:

- Every current-head check is terminal; required checks pass; expected skips are explained.
- Every `checks.withOutput` entry and annotation has been read, and none carries an actionable error or warning.
- No actionable unresolved review thread and no changes-requested review remains.
- Every current-head deployment's latest status is terminal, and ready where present.
- The PR is `OPEN`, not draft, and `mergeable` is `MERGEABLE`.
- Local HEAD, upstream HEAD, and PR head match; the working tree is clean.
- Two consecutive snapshots satisfy the convergence rules.
- The PR is not merged, and auto-merge is not enabled.

Read `mergeStateStatus` against this table rather than demanding `CLEAN`:

| Value | Reading |
|---|---|
| `CLEAN` | Ready. |
| `BLOCKED` with `reviewDecision: REVIEW_REQUIRED` and every check passing | **Ready.** The only unmet requirement is the human approval this skill must not supply. Report it as awaiting review, not as a blocker to fix. |
| `BLOCKED` with a failing or missing required check | Not ready: that check is the finding. |
| `UNSTABLE` | A non-required check is failing. Treat it as a finding; explain it if the repository accepts it. |
| `BEHIND`, `DIRTY` | Stop and ask; do not rebase, merge the base, or force-push unprompted. |
| `UNKNOWN` | GitHub is still computing. Re-read at most three times, then report it. |

Never substitute "all visible checks passed" for this audit, and never call a pending PR clean.

## Acceptance scenarios

Exercise these as Given/Then tests when changing this workflow:

- **Given a required CI failure,** then inspect logs, fix at the root cause, verify locally, push, and restart the loop on the new head.
- **Given a green React Doctor or other advisory check carrying warnings,** then treat the warnings as findings despite the conclusion.
- **Given a late inline Bugbot or other bot comment,** then catch it via a changed `actionableFingerprint` and restart if actionable.
- **Given a green Vercel review with zero suggestions,** then classify it as clean informational evidence.
- **Given a finding made outdated by a follow-up fix,** then verify obsolescence on the new head and do not count it as unresolved.
- **Given a new head commit,** then discard the prior cycle's clean claim and rerun everything.
- **Given a bot that edits its deployment comment every minute,** then re-read that comment, keep `actionableFingerprint` stable, and converge.
- **Given a check still queued after the wait budget,** then report the pending check as the blocker instead of watching again.
- **Given `BLOCKED` plus `REVIEW_REQUIRED` with all checks green,** then report ready-and-awaiting-human-review rather than trying to clear the block.
- **Given `DIRTY` or `BEHIND`,** then stop and ask before touching the branch.
- **Given a third stabilization round,** then stop, report what changed and what remains, and ask before continuing.
- **Given no explicit merge request in the current conversation,** then leave the PR open and unmerged in every scenario.
