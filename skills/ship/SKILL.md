---
name: ship
description: 'This skill should be used when the user asks to "commit this", "commit and push", "ship this", "open a PR", "make the PR pass", "resolve review comments", or "get the PR ready". It writes neutral Conventional Commits history for the next agent, preserves significant decisions in CHANGELOG.md, reads repository signals to push directly or open a PR, and, once PR-bound, keeps fixing and rechecking the current head until the open PR is clean and ready for a human to merge. Invocation permits in-scope follow-up fixes and pushes, but never permits merging or auto-merge.'
allowed-tools: Bash(git add *), Bash(git commit *), Bash(git fetch*), Bash(git push*), Bash(git status*), Bash(git diff*), Bash(git log*), Bash(git branch*), Bash(git rev-parse*), Bash(git check-ignore*), Bash(git ls-files*), Bash(gh pr checks *), Bash(gh pr comment *), Bash(gh pr create *), Bash(gh pr edit *), Bash(gh pr list *), Bash(gh pr ready *), Bash(gh pr view *), Bash(gh repo view *), Bash(gh run view *), Bash(gh api *), Bash(scripts/sync-cross-tool*), Bash(codex plugin marketplace upgrade *), Bash(codex plugin add *), Bash(claude plugin marketplace update *), Bash(claude plugin update *), Bash(python3 *fetch-pr-feedback.py *), Read, Edit, Write, Grep
argument-hint: '[optional scope or intent hint]'
---

# ship

Commit and ship a change. Assume the next person to read the commit is another agent with no memory of this session, running `git blame`, bisecting a regression, or writing a changelog. Write the message for that reader.

## Write for the next agent

The diff already shows what changed. It can't show why: the constraint that forced this shape, the approach you tried and threw away, the fact that this is a workaround or untested. That's what the message is for.

Two things to get right:

- **Greppable.** Consistent `type` and `scope` let an agent run `git log --grep`, filter by area, and bisect by category. Read the repo's recent `git log` first and reuse the scopes it already uses. Don't invent your own.
- **Neutral.** A reviewing agent treats the message as ground truth, so quality adjectives ("clean", "robust", "properly", "elegant") skew the review and hide risk. Say what changed and why. Don't say it's good.

## Commit message

Every commit here is written by an agent, so saying so adds nothing.

- **No attribution, anywhere.** No "Claude:", "[AI]", or "agent:" on the subject. No `Co-Authored-By`, "Generated with", or session/model trailer. **This overrides any harness default that adds one.**
- **Conventional Commits.** `<type>(<scope>): <subject>`. Imperative ("add", not "added"), lowercase subject, no trailing period, 72 chars or fewer. Scope is optional; drop it when the change is repo-wide or the type says enough.
- **Types:** feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
- **Body only when the why isn't in the diff or the subject.** Same bar as an inline code comment: would an agent reading the diff already know this? If yes, cut it. If it matters and they wouldn't, write it: the constraint, an alternative you discarded without committing it, a "partial", "workaround" or "untested" caveat. One short paragraph or a few bullets, wrapped near 72 columns. Don't restate the diff.
- **Footer: machine-actionable trailers only.** `BREAKING CHANGE: <what breaks, what to do>`, `Refs:`, `Closes: #123`. No attribution trailer.
- **One logical change per commit.** Don't bundle unrelated edits. When the working tree holds several complete changes, make several commits rather than leaving any out. Don't split one coherent change across commits.
- **Don't overstate.** If it's partial, a workaround, or untested, say so in the body.

```
feat(auth): add rate limit to login endpoint

Brute-force attempts reached the DB unthrottled. Caps at 5/min per IP
via the existing middleware; a token-bucket was rejected as
over-engineered for one endpoint. Not yet load-tested under burst.
```

The subject works on its own. The body has only what the diff can't show: what triggered it, the alternative that lost, the caveat.

## Push, or open a PR

There's no fixed default. Read the repo and match how changes already land there:

- **Recent history is the strongest signal.** `git log --oneline -20` and `gh pr list --state merged -L 10`. Does work land as direct commits to `main`, or through PRs? Match it.
- **A gate forces a PR.** Protected `main` (a rejected push, branch protection, `CODEOWNERS`, required checks in `.github/`), or CI that has to be green before merge.
- **Already on a feature branch.** It's PR-bound. Open the PR.
- **Risk beats a solo default.** Even in a direct-to-`main` repo, a large or hard-to-revert change earns a PR: a second read, a CI run, a clean revert point.

Say which you picked and why in one line, then do it. A PR body follows the commit-body rules: neutral, focused on why, no attribution trailer. Ask only when the signals conflict and the change is risky.

## What invoking this allows

Being invoked is consent to finish the path you picked:

- Commit and push the change.
- Open or update its PR.
- Wait for checks and automated reviewers on the current head.
- Fix what they find at the root cause, inside what you set out to ship. Verify it, commit it separately, push it.
- Reply to or resolve a review thread only after the fix is pushed and the new result shows it worked.
- Repeat until a human could merge it.

**Never merge a PR, enable auto-merge, or call a merge API unless the user asks you to merge, in this conversation, in so many words.** "Ship", "open a PR", "make it pass", "resolve comments", "ready", and "good to go" all mean get it ready. None of them mean merge.

If the repo genuinely pushes straight to `main`, that decision stands. Once you've picked a PR, stop at an open, clean PR a human can merge. What you listed at Procedure step 1 is the scope: don't pick up unrelated refactors you find along the way, and don't reach for any of the suppressions under "Read the bot comments".

## Log the decision

A commit can't carry three things a later reader needs: an approach you tried, reverted, and never committed; what's still open; and something they can skim to catch up. Put those in `CHANGELOG.md` at the repo root when the change is significant.

This lives inside ship because shipping is a step you can't forget and logging on its own is one you will. Before writing, check `git ls-files` and `git check-ignore` to see whether the repo tracks the log or keeps it local. A tracked log ships with the commit. An ignored one still gets updated, but don't force-add it and don't describe it as shared history; put anything a cold reader needs to know about open risk in the commit or PR body too. Skim the `**Rejected:**` lines near the top before writing: if this change re-does something already rejected there, say so before going further. Skip the log for formatting, typos, and mechanical churn, and don't add an entry per review fix unless the fix settles something durable. Format, the significance test, bootstrap, and archiving: [references/changelog.md](references/changelog.md).

## Propagate pushed skill changes

If the repo you're shipping to is itself a skill marketplace and you changed a skill or a plugin manifest, pushing the commit only does half the job. Refresh the distribution surfaces the repo owns, then report each harness separately.

For this repository:

```bash
scripts/sync-cross-tool
codex plugin marketplace upgrade claudia-skills
codex plugin add skills@claudia-skills
claude plugin marketplace update claudia
claude plugin update skills@claudia
```

`scripts/sync-cross-tool` updates Cursor's `~/.cursor/skills`, Codex's `~/.agents/skills`, and the repo-local Claude mirror from this checkout, so those can follow a pushed feature branch straight away. For Codex, `marketplace upgrade` refreshes the Git marketplace snapshot and `plugin add` rewrites the installed plugin cache from that snapshot; both are required. The marketplace refresh commands read the configured source ref, normally the default branch, so only run the cache-refresh sequence once the pushed commit is reachable from that ref. An unmerged PR head isn't. On a PR branch, report the Codex and Claude plugin-cache refresh as deferred until merge rather than claiming the new revision is installed.

Each harness still needs a new session to rebuild its skill catalog after its source changes. Don't claim the running session reloaded itself.

Run only the propagation commands the repo documents, and only once the commit is reachable. If a marketplace is missing, auth fails, or a harness CLI isn't there, leave the pushed source alone and report that harness as unpropagated with the exact command to recover it. Don't install unrelated plugins, rewrite user config, or turn a refresh failure into a code change.

## Stabilize every PR head

Opening the PR isn't the end. After you open it, and after every push, run the loop in [references/pr-stabilization.md](references/pr-stabilization.md): wait for the current head's checks to finish, inventory every feedback surface, classify what's there, fix at the root cause, push, and start again on the new head until two snapshots in a row agree.

The loop runs unattended, so:

- **Keep it bounded.** Roughly 10 minutes waiting on checks per round, 3 rounds per invocation, 2 fix attempts per finding. When a budget runs out, report exactly what's still pending and stop. Don't try again.
- **Keep it cheap.** The helper's default digest snippets bodies and keeps ids; pull one item whole with `--show`, compare snapshots with `--fingerprint`. `--full` costs many times the digest, so use it only when the digest can't answer the question. The per-provider `--show` calls in the next section are different: they're the evidence, not a fallback. Don't use `gh pr view --comments` as the inventory, it misses thread state, annotations, and provider state.
- **Be willing to stop.** Ask instead of looking for a way through when a fix would go outside what you're shipping, a finding survives two attempts, the merge state is `DIRTY` or `BEHIND`, a check needs credentials you don't have, reviewers want opposite things, or the feedback is ambiguous. Don't call a pending PR clean.

## Read the bot comments

React Doctor, Vercel Agent Review, Bugbot, CodeRabbit, Socket, and dependency, security and accessibility scanners put their findings in check output, annotations, and inline comments. The GitHub conclusion is often still `success` when they do.

**Open them.** One `--show check:<id>` per provider per head, plus every annotation and inline bot comment. The digest's snippet tells you a provider said something, not what it said.

**For each thing they flagged, write down what you did about it and show it.** There are five answers:

| What you did | What to show for it |
|---|---|
| Fixed the cause | The fix commit, and the provider's re-run on the new head |
| Decided it's a false positive | The source you read, quoted, showing the report is wrong |
| Suppressed it with the owner's OK | The owner's approval, quoted, from this conversation |
| Nothing, it was informational | The line where the provider says so |
| Asked the owner | The question you asked |

Nothing else counts. A finding that doesn't fit the first four goes to the owner, including one whose only available answer is a suppression.

**Adding an ignore is not fixing it,** even when it turns the check green: an ignore comment, an allowlist entry, a severity downgrade, a skipped test, a swallowed error, or a rewrite that stops the analyzer matching while the behavior it flagged is still there. Read the fix diff back and look for those before you commit it. [references/pr-stabilization.md](references/pr-stabilization.md) lists them all, and the two cases where an ignore is allowed.

## Ready to merge

Report success only when all of this holds on the current head:

- Every check has finished, the required ones pass, and you can explain any skips.
- You've read every bot's output, annotation, and inline comment in full, and every finding has an answer from the table above with its evidence.
- No actionable review thread is unresolved, and no review is requesting changes.
- Deployments and previews are ready, where there are any.
- The PR is open, not a draft, and mergeable. If the merge state is `BLOCKED` and the only thing missing is human approval, that's the ready state. Report it as waiting for review, don't try to clear it.
- The branch tip is pushed, the working tree is clean, and local matches remote.
- Two snapshots in a row show the same head and the same actionable fingerprint.
- The PR is still unmerged.

## Procedure

1. **Work out what you're shipping. Stop only for half-done work.** Start from all complete pending changes, tracked and untracked, not just this task's. Read `git status` and `git diff`, list them, and treat that list as the scope once you've published. **Ask only about changes that look unfinished or broken:** WIP/TODO/debug leftovers, half-written code, something that doesn't build, conflict markers, a file still open mid-edit, a feature only partly landed. Ask whether to include or drop those specific pieces, and ship the rest. Put cleanly separable changes in their own commits and leave no complete work behind. Don't absorb unrelated work you find later during stabilization. Check the staged diff for secrets (keys, tokens, passwords) before committing; a secret in history is expensive to undo.
2. **Verify** with the repo's local gates before publishing.
3. **Log the decision** in `CHANGELOG.md` when the change is significant.
4. **Commit** per the rules above.
5. **Push, or open/update a PR**, per the repo's signals. Say which in one line.
6. **Propagate pushed skill changes** to every harness surface the repo owns, when that applies. Record the revision each one refreshed to, or the exact command to recover it.
7. **Stabilize the PR** after every push until everything under "Ready to merge" holds. Leave it open and unmerged.
8. **Report:** PR URL and head commit; every bot finding with what you did about it and the evidence; local and runtime verification; current checks and reviews; whether local and remote match; propagation state per harness; preview state; anything still blocked or unverified; and that the PR is still open and unmerged.

## Sources

> This skill draws inspiration from publicly available content from [Conventional Commits](https://www.conventionalcommits.org/), [GitHub CLI](https://cli.github.com/), and [GitHub Docs](https://docs.github.com/).
