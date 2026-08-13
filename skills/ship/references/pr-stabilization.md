# PR stabilization loop

Run this after opening a pull request and after every push to its branch. One head SHA is one review cycle, and a new commit throws away everything you'd established about the old one.

Keep running rounds while they make progress: a round made progress if it landed a fix, or if a pending provider returned a result. A failing check, a red preview build or a bot finding is work to do rather than a reason to end the turn, so productive rounds aren't capped. A stall is what ends the loop:

| Budget | Limit | When it runs out |
|---|---|---|
| One round's wait for checks | ~10 minutes | Not a blocker. Inventory, act on what reported, wait again next round. |
| Consecutive rounds with no progress | 2 | Report the pending or unresolved names as the blocker, and stop. |
| Fix attempts per finding | 2 distinct attempts at the cause | Report the finding and both attempts, and ask. |

## Find the PR

```bash
gh repo view --json nameWithOwner
gh pr view <pr> --json number,url,state,isDraft,mergeable,mergeStateStatus,headRefOid,reviewDecision
```

Record `headRefOid`. Every check, comment, annotation, and claim you make has to be about that SHA. Before saying local and remote are in sync, compare all three heads:

```bash
git fetch origin
git rev-parse HEAD '@{upstream}'   # set upstream on the first push with: git push -u origin HEAD
gh pr view <pr> --json headRefOid
git status --short
```

All three hashes have to agree, and `git status --short` has to be empty.

## Wait for checks, with a bound

```bash
gh pr checks <pr> --watch --interval 10
```

Bound it at roughly 10 minutes with whatever timeout your tool gives you, or `timeout 600 gh pr checks …` where the GNU binary exists. Never watch unbounded, and don't restart a watch that spent its budget. Read the exit code:

| Result | Meaning | What to do |
|---|---|---|
| Exit 0 | All checks finished and passing | Inventory. |
| Exit 1 | A check failed, or the PR has no checks at all | Inventory. A no-checks PR is normal in repos without CI. |
| Exit 8 | Still pending when the watch gave up | Inventory, act on whatever finished, and wait again next round. Report it as the blocker only once the no-progress budget runs out. |
| Killed at the budget | Provider stalled | Same: inventory, act, wait again next round. |

A failed or cancelled check is a finding; inventory anyway. `gh pr checks` alone is never the whole picture, since check output, annotations, review threads, late bot comments and deployment feedback live elsewhere.

## Inventory the current head

Point `SHIP_SKILL_DIR` at the directory holding this skill's `SKILL.md`, then run the bundled read-only helper. Read its digest in full: it cuts bodies to snippets and keeps the ids for pulling any of them whole.

```bash
python3 "$SHIP_SKILL_DIR/scripts/fetch-pr-feedback.py" --repo owner/repo --pr <pr>
```

The digest carries PR state, draft state, mergeability, merge state, review decision, and:

- `checks.pending`, `checks.failing`, `checks.skipped`, `checks.passingCount`;
- `checks.withOutput` — **every** check that wrote any output, whatever its conclusion, with a title and summary snippet;
- `checks.annotations` — level, path, line and message per annotating check, deduplicated with an `occurrences` count;
- `nonSuccessStatuses` — commit status contexts, distinct from check runs;
- `deployments` — current-head environments with their latest status;
- `reviews` — submitted reviews and states; `threads.unresolved` — path, line, `isOutdated`, node id and latest-comment snippet, plus resolved and outdated counts;
- `conversationComments` — author, `bodyHash`, snippet, url;
- `actionableFingerprint` and `commentFingerprint`, both timestamp-free.

GitHub keeps every re-run of a check against one SHA, so a stale failure can sit next to its green re-run. The digest keeps the newest run per check name and counts the rest in `counts.supersededRerunsIgnored`; don't treat a superseded run as a finding. If a raw `gh api` call shows a failure the digest doesn't, check whether a later run replaced it.

Pull the full text of anything the digest flags, one item at a time:

```bash
python3 "$SHIP_SKILL_DIR/scripts/fetch-pr-feedback.py" --pr <pr> --show check:<id>
python3 "$SHIP_SKILL_DIR/scripts/fetch-pr-feedback.py" --pr <pr> --show thread:<node-id>
```

`--show` also takes `comment:<id>` and `review:<id>`. `--full` dumps every raw field and costs many times the digest, so use it only when the digest genuinely can't answer the question, never to re-read bodies it already summarized.

If the helper fails, retry once; it already retries transient GitHub errors and times out each call at 60 seconds. If it still fails, or can't cover a provider specific to this repo, query that provider directly and record the gap. Missing access is never a clean result.

Fallbacks when the helper isn't available:

```bash
gh api --paginate --slurp repos/<owner>/<repo>/commits/<sha>/check-runs
gh api --paginate --slurp repos/<owner>/<repo>/check-runs/<check-run-id>/annotations
gh run view <run-id> --log-failed
```

### Open the bot output, don't judge it by the conclusion

Warning text in `output.title`, `output.summary`, `output.text`, an annotation or an edited PR comment is feedback even when the conclusion is `success`. Look for React Doctor, Vercel Agent Review, Bugbot, CodeRabbit, Socket, dependency and security scanners, accessibility checks, deployment previews, and bots specific to this repo. A successful deployment notice or a dependency report with no alerts is informational.

Spend one `--show check:<id>` per `checks.withOutput` entry, once per head, before you judge it. The digest cuts `summary` at 240 characters and reports `output.text` only as a `textChars` length, so any entry with a non-zero `textChars` or `annotationsCount` has text in it you haven't seen. A snippet tells you a provider said something; only the full text tells you whether it needs work.

## Classify before editing

Put every item in exactly one class, and record what that class owes the final report. None of this evidence can come from silencing the provider:

| Class | What to do | What to show for it |
|---|---|---|
| Actionable finding on this head | Fix it, inside the scope of what you're shipping. | The fix commit, and the provider's re-run on the new head. |
| Duplicate | Fix it once, and note which finding owns it. | Whatever that finding shows. |
| Informational | Record it for the report. Don't edit code. | The provider line saying no work is needed. A suggestion you'd rather not do isn't this class. |
| Already resolved, or outdated | Confirm the new head made it obsolete. Don't reopen it without new evidence. | The head SHA where the provider stopped reporting it. |
| False positive | Keep the evidence and the reasoning. Only add an ignore if inspection proves the report wrong **and** that's how this repo records them. Never to clear a gate. | The source you read, quoted, showing the report is wrong. |
| Ambiguous, or two reviewers disagree | Ask, before changing product behavior or going outside scope. | The question you asked. |
| Real finding vs. deliberate product behavior | Ask. Don't invent a suppressions-table row so you can say it's clean. | The question you asked. |

Every class except informational owes an answer posted on the PR. [answer-findings.md](answer-findings.md) has the per-surface commands and what each comment states.

Accessibility, state-management and component-structure findings (a missing label, `prefer-useReducer`, `no-giant-component`) are actionable, and none need a browser to fix. Where the fix is bigger than the change you're shipping, ask rather than reclassifying it as informational.

## Adding an ignore is not fixing it

Adding or widening any of these in answer to a finding leaves the finding there, whatever it does to the check:

- an ignore or disable comment: `eslint-disable`, `biome-ignore`, `@ts-ignore`, `@ts-expect-error`, `noqa`, or a provider's own pragma;
- an entry in an ignore file, allowlist, exclude glob, or baseline, or a rule severity dropped to `warn` or `off`, or a threshold loosened until the finding slips under it;
- `continue-on-error: true`, a step or job removed, a check dropped from the required set, `--no-verify` on the push, or a test, assertion, or type deleted, skipped, or weakened so it stops reporting;
- an error caught and thrown away, a value cast to satisfy a checker instead of corrected, or a rewrite that stops the analyzer matching while the behavior it flagged is still there.

Two cases where an ignore is allowed. A **false positive** can take this repo's conventional ignore, once you've read the source, it proves the reported condition doesn't hold, and an ignore is how this repo already records those. A **suppression the owner approved** needs them to say so in this conversation, for a load-bearing pattern that can't be fixed. A comment you write calling the pattern intentional is not approval.

## A failed deployment is a finding

A red preview or production deployment is the same work as a failed required check: read the build log, fix the cause, push, wait again. A failed state doesn't change until a new deployment runs, so waiting won't clear it. It sits in the digest's `deployments` even when every check run is green.

- Any `state` other than `success` or `inactive` is blocking and sits in `actionableFingerprint`: `failure`, `error`, `pending`, `queued`, `in_progress`, and no status yet.
- Read the build's own log rather than inferring the cause from a summary line. The failing check's `details_url` points at it; `vercel inspect <deployment-url> --logs` prints the build output where that CLI is available, and `gh run view <run-id> --log-failed` covers a workflow-driven deployment.
- A build failing on a type error, a missing environment variable, a lint gate or an import that only resolves locally is a code or config finding, fixed in the branch. Don't disable the failing step, drop the check from the required set, or switch to a build command that skips the gate.
- A deployment needing a secret or an account permission you don't have is a stop-and-ask.
- `inactive` means a later deployment superseded it: not a failure, and not proof of ready either. Find the current deployment for this head.

## Stop and ask instead of improvising

Report where things stand and ask, rather than looking for a way through, when:

- the same finding survives two fix attempts;
- the fix would touch files outside what you listed at Procedure step 1;
- `mergeStateStatus` is `DIRTY` (conflicts) or `BEHIND` (base moved), since rebasing, merging the base, or force-pushing is the user's call;
- a check needs credentials, a secret, or an approval you don't have;
- the feedback is ambiguous, conflicts with the repo's own rules, or needs a bigger product decision;
- two reviewers want incompatible things;
- two consecutive rounds made no progress, or a fix-attempt budget has run out.

A check or deployment that's still running is none of these. Wait for it and keep going.

## Follow-up fix cycle

For each actionable cluster:

1. Read the source it points at, the repo's rules, the tests, and the guidance for whatever library is involved.
2. Make the smallest fix that addresses the cause.
3. Run the relevant local checks.
4. Add runtime or browser checks for anything visual, interactive, accessibility-sensitive or deployment-dependent. A structural fix like splitting a component or moving state into a reducer can remount children, drop their local state, move focus or break memoization, so verify the behavior after it rather than skipping the finding for lack of a check first.
5. Read the diff for regressions, secrets, and unrelated changes.
6. Grep `git diff --cached` for the forms above — `eslint-disable`, `biome-ignore`, `ts-ignore`, `ts-expect-error`, `noqa`, `continue-on-error`, `skip`, `only`, ignore-file paths — before you commit. If the hit *is* your answer to the finding, it's a suppression: revert it, then fix the cause or ask. A hit unrelated to the finding is fine.
7. Commit the fix as its own Conventional Commit.
8. Push normally, never with force.
9. Post the answer where the finding was raised, once the pushed head shows the fix worked. Reply in the thread and resolve it where there is one; otherwise use the per-head conversation comment. The digest carries each thread's node `id`:

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

10. Get the new head SHA, spend a round of the budget, and start the wait-and-inventory loop again.

## Converge on two clean snapshots

Once every check on the current head has finished and the digest shows nothing actionable, take a second cheap snapshot at least 15 seconds later. Fill the gap with the diff review or local checks rather than a blocking sleep:

```bash
python3 "$SHIP_SKILL_DIR/scripts/fetch-pr-feedback.py" --pr <pr> --fingerprint
```

What keeps this from spinning:

- `headSha` has to be unchanged and `actionableFingerprint` has to match the first snapshot. A changed `actionableFingerprint` means real new feedback: inventory again and restart.
- A changed `commentFingerprint` on its own does **not** restart the loop, since bots edit their own status comments constantly. Re-read only the comments whose `bodyHash` moved, classify them, and carry on.
- A matching fingerprint only proves GitHub-visible feedback held still for the interval. Still honor any pending state a provider documents.
- Two matching snapshots settle it. Don't keep sampling for reassurance.

## Before reporting ready

- Every check on this head has finished, the required ones pass, and you can explain any skips.
- You opened every `checks.withOutput` entry with `--show` and read every annotation, and every finding in them has a class and that class's evidence. An unread entry or an unclassified finding is a blocker.
- No finding was answered with a suppression, apart from the two allowed cases with their evidence recorded.
- Every finding that wasn't purely informational has its answer posted on the PR, with the fix commit and the provider's result on this head.
- No actionable review thread is unresolved, and no review is requesting changes.
- Every deployment on this head is `success` or superseded. A `failure` or `error` state blocks.
- The PR is `OPEN`, not draft, and `mergeable` is `MERGEABLE`.
- Local HEAD, upstream HEAD, and PR head match, and the working tree is clean.
- Two snapshots in a row meet the convergence rules.
- The PR isn't merged and auto-merge isn't on.

Read `mergeStateStatus` against this table instead of holding out for `CLEAN`:

| Value | What it means |
|---|---|
| `CLEAN` | Ready. |
| `BLOCKED` with `reviewDecision: REVIEW_REQUIRED` and every check passing | **Ready.** The only thing missing is the human approval this skill must not supply. Report it as awaiting review, not as a blocker to fix. |
| `BLOCKED` with a failing or missing required check | Not ready. That check is the finding. |
| `UNSTABLE` | A non-required check is failing. Treat it as a finding, and explain it if the repo accepts it. |
| `BEHIND`, `DIRTY` | Stop and ask. Don't rebase, merge the base, or force-push unprompted. |
| `UNKNOWN` | GitHub is still working it out. Re-read at most three times, then report it. |

"All visible checks passed" is not this audit, and a pending PR is never clean.
