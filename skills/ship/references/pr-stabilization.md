# PR stabilization loop

Run this after opening a pull request and after every push to its branch. One head SHA is one review cycle. A new commit throws away everything you'd established about the old one, and you start again.

Three budgets keep it finite. When one runs out, report and stop. Don't try again:

| Budget | Limit | When it runs out |
|---|---|---|
| Waiting for checks to finish | ~10 minutes per round | Report the pending check names as the blocker. |
| Rounds per invocation | 3 | Report where things stand and ask whether to keep going. |
| Fix attempts per finding | 2 | Report the finding and both attempts, and ask. |

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

Bound this at roughly 10 minutes using whatever timeout your tool gives you; where the GNU `timeout` binary exists, `timeout 600 gh pr checks …` works too. Don't run an unbounded watch, and don't restart one that already spent its budget. Read the exit code instead:

| Result | Meaning | What to do |
|---|---|---|
| Exit 0 | All checks finished and passing | Inventory. |
| Exit 1 | A check failed, or the PR has no checks at all | Inventory. A no-checks PR is normal in repos without CI. |
| Exit 8 | Still pending when the watch gave up | Inventory once, then report the pending names as the blocker. |
| Killed at the budget | Provider stalled | Inventory once, then report the pending names as the blocker. |

A failed or cancelled check is a finding. It isn't a reason to skip the inventory. `gh pr checks` on its own is never the whole picture: check output, annotations, review threads, late bot comments, and deployment feedback all live somewhere else.

## Inventory the current head

Point `SHIP_SKILL_DIR` at the directory holding this skill's `SKILL.md`, then run the bundled read-only helper. Its default digest is meant to be read in full: it cuts bodies down to snippets and keeps the ids you need to pull any of them whole.

```bash
python3 "$SHIP_SKILL_DIR/scripts/fetch-pr-feedback.py" --repo owner/repo --pr <pr>
```

The digest carries PR state, draft state, mergeability, merge state, review decision, and:

- `checks.pending`, `checks.failing`, `checks.skipped`, `checks.passingCount`;
- `checks.withOutput` — **every** check that wrote any output, whatever its conclusion, with a title and summary snippet;
- `checks.annotations` — level, path, line, and message per annotating check, deduplicated with an `occurrences` count;
- `nonSuccessStatuses` — commit status contexts, which are a different thing from check runs;
- `deployments` — current-head environments with their latest status;
- `reviews` — submitted reviews and states; `threads.unresolved` — path, line, `isOutdated`, node id, and latest-comment snippet, with resolved and outdated counts;
- `conversationComments` — author, `bodyHash`, snippet, url;
- `actionableFingerprint` and `commentFingerprint`, both timestamp-free.

GitHub keeps every re-run of a check against one SHA, so a stale failure can sit right next to its green re-run. The digest keeps only the newest run per check name and counts the rest in `counts.supersededRerunsIgnored`. Don't treat a superseded run as a finding. If a raw `gh api` call shows a failure the digest doesn't, check whether a later run replaced it.

Pull the full text of anything the digest flags, one item at a time:

```bash
python3 "$SHIP_SKILL_DIR/scripts/fetch-pr-feedback.py" --pr <pr> --show check:<id>
python3 "$SHIP_SKILL_DIR/scripts/fetch-pr-feedback.py" --pr <pr> --show thread:<node-id>
```

`--show` also takes `comment:<id>` and `review:<id>`. `--full` dumps every raw field and costs many times the digest, so use it only when the digest genuinely can't answer the question. Don't pull `--full` just to re-read bodies the digest already summarized.

If the helper fails, retry once. It already retries transient GitHub errors on its own and times out each call at 60 seconds. If it still fails, or it can't cover a provider specific to this repo, query that provider directly and record the gap. Missing access is never a clean result.

Fallbacks when the helper isn't available:

```bash
gh api --paginate --slurp repos/<owner>/<repo>/commits/<sha>/check-runs
gh api --paginate --slurp repos/<owner>/<repo>/check-runs/<check-run-id>/annotations
gh run view <run-id> --log-failed
```

Don't use `gh pr view --comments` as the inventory: it misses thread resolution, annotations, and provider state.

### Open the bot output, don't judge it by the conclusion

Warning text in `output.title`, `output.summary`, `output.text`, an annotation, or an edited PR comment is feedback even when the conclusion is `success`. Look for these providers: React Doctor, Vercel Agent Review, Bugbot, CodeRabbit, Socket, dependency and security scanners, accessibility checks, deployment previews, and bots specific to this repo. A successful deployment notice or a dependency report with no alerts is informational, no code work.

Spend one `--show check:<id>` per `checks.withOutput` entry, once per head, before you judge it. The digest cuts `summary` at 240 characters and reports `output.text` only as a `textChars` length, so any entry with a non-zero `textChars` or `annotationsCount` has text in it you haven't seen. A snippet tells you a provider said something. It can't tell you nothing in there needs work.

## Classify before editing

Put every item in exactly one class, and record what that class owes the final report. None of this evidence can come from silencing the provider:

| Class | What to do | What to show for it |
|---|---|---|
| Actionable finding on this head | Fix it, inside the scope of what you're shipping. | The fix commit, and the provider's re-run on the new head. |
| Duplicate | Fix it once, and note which finding owns it. | Whatever that finding shows. |
| Informational | Record it for the report. Don't edit code. | The provider line saying no work is needed. |
| Already resolved, or outdated | Confirm the new head made it obsolete. Don't reopen it without new evidence. | The head SHA where the provider stopped reporting it. |
| False positive | Keep the evidence and the reasoning. Only add an ignore if inspection proves the report wrong **and** that's how this repo records them. Never to clear a gate. | The source you read, quoted, showing the report is wrong. |
| Ambiguous, or two reviewers disagree | Ask, before changing product behavior or going outside scope. | The question you asked. |
| Real finding vs. deliberate product behavior | Ask. Don't invent a suppressions-table row so you can say it's clean. | The question you asked. |

## Adding an ignore is not fixing it

Adding or widening any of these in answer to a finding leaves the finding there, whatever it does to the check:

- an ignore or disable comment: `eslint-disable`, `biome-ignore`, `@ts-ignore`, `@ts-expect-error`, `noqa`, or a provider's own pragma;
- an entry in an ignore file, allowlist, exclude glob, or baseline, or a rule severity dropped to `warn` or `off`, or a threshold loosened until the finding slips under it;
- `continue-on-error: true`, a step or job removed, a check dropped from the required set, `--no-verify` on the push, or a test, assertion, or type deleted, skipped, or weakened so it stops reporting;
- an error caught and thrown away, a value cast to satisfy a checker instead of corrected, or a rewrite that stops the analyzer matching while the behavior it flagged is still there.

Two cases where an ignore is allowed. A **false positive** can take this repo's conventional ignore, once you've read the source, it proves the reported condition doesn't hold, and an ignore is how this repo already records those. A **suppression the owner approved** needs them to say so in this conversation, for a load-bearing pattern that can't be fixed. A comment you write yourself calling the pattern intentional is not approval.

## Stop and ask instead of improvising

Report where things stand and ask, rather than looking for a way through, when:

- the same finding survives two fix attempts;
- the fix would touch files outside what you listed at Procedure step 1;
- `mergeStateStatus` is `DIRTY` (conflicts) or `BEHIND` (base moved), since rebasing, merging the base, or force-pushing is the user's call;
- a check needs credentials, a secret, or an approval you don't have;
- the feedback is ambiguous, conflicts with the repo's own rules, or needs a bigger product decision;
- two reviewers want incompatible things;
- a round, wait, or fix-attempt budget has run out.

## Follow-up fix cycle

For each actionable cluster:

1. Read the source it points at, the repo's rules, the tests, and the guidance for whatever library is involved.
2. Make the smallest fix that addresses the cause.
3. Run the relevant local checks.
4. Add runtime or browser checks for anything visual, interactive, accessibility-sensitive, or deployment-dependent.
5. Read the diff for regressions, secrets, and unrelated changes.
6. Grep `git diff --cached` for the forms above — `eslint-disable`, `biome-ignore`, `ts-ignore`, `ts-expect-error`, `noqa`, `continue-on-error`, `skip`, `only`, ignore-file paths — before you commit. If the hit *is* your answer to the finding, it's a suppression: revert it, then fix the cause or ask. A hit unrelated to the finding is fine.
7. Commit the fix as its own Conventional Commit. No changelog entry unless the fix settles something durable.
8. Push normally, never with force.
9. Reply to or resolve the thread only once the pushed head shows the fix worked. The digest carries each thread's node `id`:

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

Green checks and clean comments from a previous head prove nothing about this one.

## Converge on two clean snapshots

Once every check on the current head has finished and the digest shows nothing actionable, take a second cheap snapshot at least 15 seconds later. Fill the gap with the diff review or local checks rather than a blocking sleep:

```bash
python3 "$SHIP_SKILL_DIR/scripts/fetch-pr-feedback.py" --pr <pr> --fingerprint
```

What keeps this from spinning:

- `headSha` has to be unchanged and `actionableFingerprint` has to match the first snapshot. A changed `actionableFingerprint` means real new feedback: inventory again and restart.
- A changed `commentFingerprint` on its own does **not** restart the loop. Bots edit their own status comments all the time. Re-read only the comments whose `bodyHash` moved, classify them, and carry on. Edited informational chatter never blocks convergence.
- A matching fingerprint only proves GitHub-visible feedback held still for the interval. Still honor any pending state a provider documents.
- Two matching snapshots settle it. Don't keep sampling for reassurance.

## Before reporting ready

- Every check on this head has finished, the required ones pass, and you can explain any skips.
- You opened every `checks.withOutput` entry with `--show` and read every annotation, and every finding in them has a class and that class's evidence. An unread entry or an unclassified finding is a blocker.
- No finding was answered with a suppression, apart from the two allowed cases with their evidence recorded.
- No actionable review thread is unresolved, and no review is requesting changes.
- Every deployment on this head has a finished status, and is ready where there is one.
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

## Acceptance scenarios

Run these as Given/Then tests when you change this workflow:

- **Given a required CI failure,** then read the logs, fix the cause, verify locally, push, and restart the loop on the new head.
- **Given a green React Doctor or other bot check,** then open it with `--show check:<id>` whenever its entry shows a non-zero `textChars`, treat warnings in the full output as findings despite the conclusion, and never call it clean off the snippet alone.
- **Given a fix diff whose only change against a finding is an ignore comment, an allowlist entry, or a severity downgrade,** then revert it and either fix the cause or ask. Don't commit it, and don't report the finding fixed.
- **Given a finding whose only available answer is a suppression,** then ask the owner rather than approving one yourself.
- **Given a late inline Bugbot or other bot comment,** then catch it through a changed `actionableFingerprint` and restart if it's actionable.
- **Given a green Vercel review with zero suggestions,** then record it as clean informational evidence.
- **Given a finding a follow-up fix made outdated,** then confirm it's obsolete on the new head and don't count it as unresolved.
- **Given a new head commit,** then throw away the previous cycle's clean claim and run everything again.
- **Given a bot that edits its deployment comment every minute,** then re-read that comment, keep `actionableFingerprint` stable, and converge.
- **Given a check still queued after the wait budget,** then report it as the blocker instead of watching again.
- **Given `BLOCKED` plus `REVIEW_REQUIRED` with all checks green,** then report it ready and awaiting human review rather than trying to clear the block.
- **Given `DIRTY` or `BEHIND`,** then stop and ask before touching the branch.
- **Given a third stabilization round,** then stop, report what changed and what's left, and ask before continuing.
- **Given no explicit merge request in this conversation,** then leave the PR open and unmerged, in every scenario.
