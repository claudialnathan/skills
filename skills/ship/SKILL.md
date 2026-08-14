---
name: ship
description: 'This skill should be used when the user asks to "commit this", "commit and push", "ship this", "open a PR", "make the PR pass", "resolve review comments", or "get the PR ready". It writes neutral Conventional Commits history for the next agent, carrying the decision in the commit body where a later reader will find it, reads repository signals to push directly or open a PR, and, once PR-bound, keeps fixing and rechecking the current head until the open PR is clean and ready for a human to merge. Red checks and deployments are work to finish, and each bot finding gets answered on the PR. Invocation permits in-scope follow-up fixes and pushes, but never permits merging or auto-merge.'
allowed-tools: Bash(git add *), Bash(git commit *), Bash(git fetch*), Bash(git push*), Bash(git status*), Bash(git diff*), Bash(git log*), Bash(git branch*), Bash(git rev-parse*), Bash(git check-ignore*), Bash(git ls-files*), Bash(gh pr checks *), Bash(gh pr comment *), Bash(gh pr create *), Bash(gh pr edit *), Bash(gh pr list *), Bash(gh pr ready *), Bash(gh pr view *), Bash(gh repo view *), Bash(gh run view *), Bash(gh api *), Bash(vercel inspect*), Bash(vercel logs*), Bash(scripts/sync-cross-tool*), Bash(codex plugin marketplace upgrade *), Bash(codex plugin add *), Bash(claude plugin marketplace update *), Bash(claude plugin update *), Bash(python3 *fetch-pr-feedback.py *), Read, Edit, Write, Grep
argument-hint: '[optional scope or intent hint]'
---

# ship

Commit and ship a change. The next reader of the commit is another agent with no memory of this session, running `git blame` or bisecting a regression, and the message is all it gets.

## Write for the next agent

The diff already shows what changed. What it can't show is why: the constraint that forced this shape, the approach you tried and threw away, the fact that this is a workaround or untested.

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
- Wait for checks, deployments, and automated reviewers on the current head. A check or build that outlasts one wait window costs a round; it doesn't end the turn.
- Fix what they find at the root cause, inside what you set out to ship. Verify it, commit it separately, push it.
- Post the answer on the PR, after the fix is pushed and the new result shows it worked: a thread reply where there's a thread, otherwise a conversation comment.
- Repeat until a human could merge it. Stop early only for the reasons under "Stabilize every PR head".

**Never merge a PR, enable auto-merge, or call a merge API unless the user asks you to merge, in this conversation, in so many words.** "Ship", "open a PR", "make it pass", "resolve comments", "ready", and "good to go" all mean get it ready. None of them mean merge.

If the repo pushes straight to `main`, that decision stands. Once you've picked a PR, stop at an open, clean PR a human can merge. Procedure step 1 sets the scope: no unrelated refactors picked up along the way, and none of the suppressions under "Read the bot comments".

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

`scripts/sync-cross-tool` updates Cursor's `~/.cursor/skills`, Codex's `~/.agents/skills` and the repo-local Claude mirror from this checkout, so those follow a pushed feature branch straight away. For Codex, `marketplace upgrade` refreshes the Git marketplace snapshot and `plugin add` rewrites the installed plugin cache from it; both are required. The marketplace commands read the configured source ref, normally the default branch, so run them only once the pushed commit is reachable from it. An unmerged PR head isn't, so on a PR branch report the Codex and Claude plugin-cache refresh as deferred until merge rather than claiming the new revision is installed.

Each harness still needs a new session to rebuild its skill catalog after its source changes. Don't claim the running session reloaded itself.

Run only the propagation commands the repo documents, and only once the commit is reachable. If a marketplace is missing, auth fails, or a harness CLI isn't there, leave the pushed source alone and report that harness as unpropagated with the exact command to recover it. Don't install unrelated plugins, rewrite user config, or turn a refresh failure into a code change.

## Stabilize every PR head

After you open the PR, and after every push, run the loop in [references/pr-stabilization.md](references/pr-stabilization.md): wait for the current head's checks to finish, inventory every feedback surface, classify what's there, fix at the root cause, push, and start again on the new head until two snapshots in a row agree.

The loop runs unattended, so:

- **Keep going while rounds make progress.** A round makes progress if it lands a fix or if a pending provider returns a result. Productive rounds aren't capped; a failing check, a red preview deployment or a bot finding is work to finish. Wait roughly 10 minutes on checks per round, and if that window ends with something still running, inventory, act on what finished, and wait again. A stall is what stops the loop: two consecutive rounds with no progress, or 2 fix attempts on one finding. Then report what's left and ask.
- **A red deployment is a finding.** Read the build log, fix the cause in the branch, push, wait for the new deployment. Don't report a PR ready while a preview or production deployment is `failure` or `error`.
- **Keep it cheap.** The digest snippets bodies and keeps ids; pull one item whole with `--show`, compare snapshots with `--fingerprint`. `--full` costs many times the digest, so use it only when the digest can't answer the question. The per-provider `--show` calls in the next section are the evidence rather than a fallback. Don't use `gh pr view --comments` as the inventory; it misses thread state, annotations and provider state.
- **Be willing to stop.** Ask instead of looking for a way through when a fix would go outside what you're shipping, a finding survives two attempts, the merge state is `DIRTY` or `BEHIND`, a check needs credentials you don't have, reviewers want opposite things, or the feedback is ambiguous. Don't call a pending PR clean.

Editing this loop means re-running its Given/Then scenarios in [references/loop-acceptance.md](references/loop-acceptance.md).

## Read the bot comments

React Doctor, Vercel Agent Review, Bugbot, CodeRabbit, Socket, and dependency, security and accessibility scanners put their findings in check output, annotations, and inline comments. The GitHub conclusion is often still `success` when they do.

**Open them.** One `--show check:<id>` per provider per head, plus every annotation and inline bot comment. The digest's snippet tells you a provider said something, not what it said.

**For each thing they flagged, write down what you did about it, show it, and say so on the PR.** There are five answers:

| What you did                      | What to show for it                                       | Where the answer goes                                       |
| --------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| Fixed the cause                   | The fix commit, and the provider's re-run on the new head | The review thread, or a per-head conversation comment       |
| Decided it's a false positive     | The source you read, quoted, showing the report is wrong  | Same                                                        |
| Suppressed it with the owner's OK | The owner's approval, quoted, from this conversation      | Same, naming what you suppressed                            |
| Nothing, it was informational     | The line where the provider says so                       | Nowhere. The report at the end covers it                    |
| Asked the owner                   | The question you asked                                    | This conversation, and the per-head comment as an open item |

Nothing else counts. A finding that doesn't fit the first four goes to the owner, including one whose only available answer is a suppression.

**"It's cosmetic" is not one of the five.** Treat an accessibility, state-management or component-structure finding as a defect: a missing label, a `prefer-useReducer`, a `no-giant-component`. None of them need a browser to fix, and not having opened the page is a reason to add the runtime check the fix cycle asks for rather than grounds to leave the finding. Size is the real limit. Where the fix is bigger than the change you're shipping, that's answer five: ask, with your recommendation. Deciding for the owner that it's a suggestion and reporting the PR ready is not an answer.

`gh` comments as the authenticated account, so the answer lands under the owner's name on the PR instead of in this transcript. Post it once the fix is pushed and the provider's re-run confirms it, and say in it that nothing was suppressed. A fix that's pushed but unanswered on the PR isn't finished. [references/answer-findings.md](references/answer-findings.md) has the per-surface commands and what each comment states.

**Adding an ignore is not fixing it,** even when it turns the check green: an ignore comment, an allowlist entry, a severity downgrade, a skipped test, a swallowed error, or a rewrite that stops the analyzer matching while the behavior it flagged is still there. Read the fix diff back and look for those before you commit it. [references/pr-stabilization.md](references/pr-stabilization.md) lists them all, and the two cases where an ignore is allowed.

## Ready to merge

Report success only when all of this holds on the current head:

- Every check has finished, the required ones pass, and you can explain any skips.
- You've read every bot's output, annotation, and inline comment in full, and every finding has an answer from the table above with its evidence.
- Every finding that wasn't purely informational has that answer posted on the PR.
- No actionable review thread is unresolved, and no review is requesting changes.
- Every deployment and preview on this head finished and is ready. A `failure` or `error` state is a blocker.
- The PR is open, not a draft, and mergeable. If the merge state is `BLOCKED` and the only thing missing is human approval, that's the ready state. Report it as waiting for review, don't try to clear it.
- The branch tip is pushed, the working tree is clean, and local matches remote.
- Two snapshots in a row show the same head and the same actionable fingerprint.
- The PR is still unmerged.

## Procedure

1. **Work out what you're shipping. Stop only for half-done work.** Start from all complete pending changes, tracked and untracked, not just this task's. Read `git status` and `git diff`, list them, and treat that list as the scope once you've published. **Ask only about changes that look unfinished or broken:** WIP/TODO/debug leftovers, half-written code, something that doesn't build, conflict markers, a file still open mid-edit, a feature only partly landed. Ask whether to include or drop those specific pieces, and ship the rest. Put cleanly separable changes in their own commits and leave no complete work behind. Don't absorb unrelated work you find later during stabilization. Check the staged diff for secrets (keys, tokens, passwords) before committing; a secret in history is expensive to undo.
2. **Verify** with the repo's local gates before publishing: the format, lint, type, test and build commands its config and hooks already run. A provider that reports on the pull request — react-doctor, and the others under "Read the bot comments" — is not one of those, even where the repo carries a script that invokes its CLI. Its findings come from the run against the PR head and are answered there.
3. **Commit** per the rules above. Three things a diff can't carry belong in the body when they apply: an approach tried, reverted, and never committed; what's still open; and why this over that.
4. **Push, or open/update a PR**, per the repo's signals. Say which in one line.
5. **Propagate pushed skill changes** to every harness surface the repo owns, when that applies. Record the revision each one refreshed to, or the exact command to recover it.
6. **Stabilize the PR** after every push until everything under "Ready to merge" holds — including a green deployment and an answer posted for every finding. Keep going while rounds make progress; stop at a stall, not at a count. Leave it open and unmerged.
7. **Report:** PR URL and head commit; every bot finding with what you did about it, the evidence, and the link to where you answered it; local and runtime verification; current checks and reviews; whether local and remote match; propagation state per harness; deployment and preview state; anything still blocked or unverified; and that the PR is still open and unmerged.

## Sources

> This skill draws inspiration from publicly available content from [Conventional Commits](https://www.conventionalcommits.org/), [GitHub CLI](https://cli.github.com/), and [GitHub Docs](https://docs.github.com/).
