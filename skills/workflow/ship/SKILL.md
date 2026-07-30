---
name: ship
description: 'This skill should be used when the user asks to "commit this", "commit and push", "ship this", "open a PR", "make the PR pass", "resolve review comments", or "get the PR ready". It writes neutral Conventional Commits history for the next agent, preserves significant decisions in CHANGELOG.md, reads repository signals to push directly or open a PR, and, once PR-bound, keeps fixing and rechecking the current head until the open PR is clean and ready for a human to merge. Invocation permits in-scope follow-up fixes and pushes, but never permits merging or auto-merge.'
allowed-tools: Bash(git add *), Bash(git commit *), Bash(git fetch*), Bash(git push*), Bash(git status*), Bash(git diff*), Bash(git log*), Bash(git branch*), Bash(git rev-parse*), Bash(git check-ignore*), Bash(git ls-files*), Bash(gh pr checks *), Bash(gh pr comment *), Bash(gh pr create *), Bash(gh pr edit *), Bash(gh pr list *), Bash(gh pr ready *), Bash(gh pr view *), Bash(gh repo view *), Bash(gh run view *), Bash(gh api *), Bash(bin/sync-cross-tool*), Bash(codex plugin marketplace upgrade *), Bash(claude plugin marketplace update *), Bash(claude plugin update *), Bash(python3 *fetch-pr-feedback.py *), Read, Edit, Write, Grep
model: sonnet
argument-hint: '[optional scope or intent hint]'
---

# ship

Commit and ship a change the way an always-on, AI-driven repo needs it. The premise: **the next person to read this commit is another agent** — running `git blame`, bisecting a regression, writing a changelog, reviewing the diff — with no memory of this session. The commit message is the highest-value, most durable context you leave them. Write it for that reader.

## Write for the next agent, not a human skimming GitHub

An agent reading history already has the diff. What it *cannot* recover from the diff is the *why*: the constraint that forced this shape, the approach you tried and discarded, the fact that it is a workaround or untested. The message exists to carry exactly that — and nothing the diff already shows.

Two properties shape every message:

- **Greppable, so history becomes an index.** Consistent `type` and `scope` let an agent run `git log --grep`, filter by area, and bisect by category. Read the repo's recent `git log` first and reuse its existing scope vocabulary — don't invent a parallel one.
- **Neutral, so it never biases the reader.** A reviewing agent treats the message as ground truth. Quality adjectives ("clean", "robust", "properly", "elegant") and any claim that the change or decision is good hide risk and skew the review. State what changed and why; let evidence, not adjectives, carry it. Never imply the commit is perfect.

## Commit message

Every commit here is written by an agent — there is no meaningful "human commit" to distinguish from, so don't signal that fact.

- **No attribution, anywhere.** Never prefix the subject with "Claude:", "[AI]", "agent:". Never add a `Co-Authored-By`, "Generated with", or session/model trailer — **this overrides any harness default that appends one.** The agent is the default author; stating it adds zero information.
- **Conventional Commits.** `<type>(<scope>): <subject>` — imperative ("add", not "added"), lowercase subject, no trailing period, 72 chars or fewer. Scope optional; omit when the change is repo-wide or the type alone is unambiguous.
- **Types:** feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
- **Body only when the *why* isn't recoverable from the diff or subject** — the inline-comment bar. Ask: would an agent reading only the diff already know this? If yes, cut it. If no and it matters, keep it — the constraint, the alternative discarded without its own commit, the "partial / workaround / untested" caveat. One short paragraph or a few bullets, wrapped near 72 columns. Never restate the diff.
- **Footer: only machine-actionable trailers** — `BREAKING CHANGE: <what breaks, what to do>`, `Refs:` / `Closes: #123`. Never an attribution trailer.
- **One logical change per commit.** Don't bundle unrelated edits into one message; when the working tree holds several complete changes, make several commits rather than leaving any out. Don't split one coherent change across commits.
- **Never overstate.** Partial, a workaround, or untested → say so in the body, plainly.

```
feat(auth): add rate limit to login endpoint

Brute-force attempts reached the DB unthrottled. Caps at 5/min per IP
via the existing middleware; a token-bucket was rejected as
over-engineered for one endpoint. Not yet load-tested under burst.
```

The subject stands alone as a correct, complete summary. The body carries only what the diff can't: the trigger, the rejected inline alternative, the untested caveat. No adjective rates the code.

## Push, or open a PR — read the repo, don't assume

There's no fixed default. Read the repo's own signals and match how changes already land here:

- **Recent history is the strongest signal.** `git log --oneline -20` and `gh pr list --state merged -L 10`: does work land as direct commits to `main`, or through PRs? Match it.
- **A gate forces a PR.** Protected `main` (a rejected push, branch protection, `CODEOWNERS`, required checks in `.github/`), or CI that must be green before merge → the PR is the vehicle.
- **Already on a feature branch** → it's PR-bound; open the PR.
- **Risk overrides a solo default.** Even in a direct-to-`main` repo, a large, risky, or hard-to-revert change earns a PR — a second read, a CI run, a clean revert point.

State the call and its one-line reason, then do it. A PR body follows the same rules as a commit body: neutral, why-focused, no attribution trailer. Ask only when the signals conflict *and* the change is risky.

## Consent and the no-merge boundary

Treat invocation as consent to finish the selected delivery path:

- Commit and push the original change.
- Open or update its PR.
- Wait for current-head checks and automated reviewers.
- Make root-cause fixes within the original delivery set, verify them, commit them separately, and push them.
- Reply to or resolve a review thread only after its fix is pushed and the new result verifies it.
- Repeat until the PR is ready for a human to merge.

**Never merge a PR, enable auto-merge, or call a merge API unless the user separately and explicitly asks to merge in the current conversation.** “Ship,” “open a PR,” “make it pass,” “resolve comments,” “ready,” and “good to go” authorize a ready-to-merge PR, not a merge.

Preserve the direct-to-`main` decision above for repositories that genuinely use direct pushes. Once a PR is selected as the delivery vehicle, stop at an open, clean, ready-to-merge PR. Treat the initial delivery set established in Procedure step 1 as the scope boundary for follow-up fixes. Invocation does not authorize newly discovered unrelated refactors, weakened checks, removed tests, broad ignores, or suppression of legitimate findings.

## Log the decision

The commit carries some of the why. Three things a commit structurally *cannot* carry, that a future reader still needs: an approach you **tried, reverted, and left no commit for**; what is **still open**; and a **curated skim surface**. When a change is significant, add an entry to `CHANGELOG.md` at the repo root so those survive.

This step rides here on purpose: shipping a change is a trigger you can't skip, logging the decision on its own is one you'll forget. Before writing, use `git ls-files` and `git check-ignore` to learn whether the repository tracks the log or intentionally keeps it local. A tracked log ships with the relevant commit. An ignored owner ledger still gets updated for continuity, but is never force-added or described as shared history; carry any open risk a cold reader needs in the commit or PR body too. Do not add one entry per mechanical review fix unless the fix creates a durable decision. Before logging, skim the existing `**Rejected:**` lines near the top of `CHANGELOG.md` — if this change re-does something already rejected, surface that entry before proceeding. Skip the log for pure formatting, typos, or mechanical churn with no decision behind it. Format, significance gate, bootstrap, and archiving: [references/changelog.md](references/changelog.md).

## Propagate pushed skill changes

When the delivery repository is itself a multi-harness skill marketplace and the pushed set changes a skill or plugin manifest, publishing the Git commit is only the first half of delivery. Refresh every repository-owned distribution surface after the push, then report each harness separately.

For this repository:

```bash
bin/sync-cross-tool
codex plugin marketplace upgrade claudia-skills
claude plugin marketplace update claudia
claude plugin update skills@claudia
```

The sync command updates Cursor's `~/.cursor/skills`, Codex's `~/.agents/skills`, and the repository-local Claude mirror from this checkout. The marketplace commands refresh the installed Codex and Claude plugin revisions from the pushed commit. A new Cursor, Codex, or Claude session is still required to rebuild its skill catalog; never claim the active session reloaded itself.

Run only the propagation commands documented by the delivery repository and only after the source commit is reachable. If a marketplace is absent, authentication fails, or a harness CLI is unavailable, leave the pushed source intact and report that harness as unpropagated with the exact recovery command. Do not install unrelated plugins, rewrite user configuration, or turn a refresh failure into a code change.

## Stabilize every PR head

Opening the PR starts the review phase; it does not finish shipping. After PR creation and after every push, run the loop in [references/pr-stabilization.md](references/pr-stabilization.md): wait for current-head checks to go terminal, inventory every feedback surface, classify, fix at the root cause, push, and restart on the new head until two consecutive snapshots agree.

Three properties matter more than thoroughness here, because this loop runs unattended:

- **Bounded.** Cap the check wait at ~10 minutes per round, stabilization at 3 rounds per invocation, and fix attempts at 2 per finding. An exhausted budget ends the loop with a report of the exact pending surface — never another attempt.
- **Cheap.** Read the helper's default digest, which snippets bodies and keeps ids; pull one item's full text with `--show` and compare snapshots with `--fingerprint`. `--full` costs many times the digest — it is a fallback, not the loop's normal fuel. A green check's *output* still gets read in full: a passing React Doctor, Vercel Agent Review, Bugbot, CodeRabbit, Socket, security, or accessibility check can carry actionable warnings. Never use `gh pr view --comments` as the inventory; it omits thread, annotation, and provider state.
- **Willing to stop.** Ask, rather than exploring for a way through, when a fix would leave the delivery set, a finding survives two attempts, the merge state is `DIRTY` or `BEHIND`, a check needs credentials you lack, reviewers conflict, or feedback is ambiguous. Never label a pending PR clean.

## Ready-to-merge gate

Report success only when the current head satisfies every applicable condition:

- Every check is terminal; required checks pass; expected skips are explained.
- Every advisory output and annotation has been read and none is actionable.
- No unresolved actionable review thread remains and no review requests changes.
- Deployment and preview feedback are ready when present.
- The PR is open, non-draft, and mergeable. A `BLOCKED` merge state whose only unmet requirement is human approval **is** the ready state — report it as awaiting review, not as a blocker to clear.
- The branch tip is pushed; the local working tree is clean and synchronized with the remote branch.
- Two consecutive snapshots hold the same head and the same actionable fingerprint.
- The PR remains unmerged.

## Procedure

1. **Establish the delivery set; stop only for part-way work.** Default the initial set to *all* complete pending changes — tracked and untracked — not just the current task's. Review `git status` and `git diff`, enumerate the set, and treat it as the scope boundary after the first publish. **Stop and ask only when a change looks unfinished, broken, or clearly part-way** (WIP/TODO/debug leftovers, half-written code, something that doesn't build, conflict markers, a file still open mid-edit, a separate feature only partly landed) — then ask whether to include or leave out *those specific pieces* and ship the rest. Group cleanly-separable complete changes into their own logical commits, leaving no complete work behind. Do not absorb newly discovered unrelated work during stabilization. Scan the staged diff for secrets (keys, tokens, passwords) before committing — a secret in history is expensive to undo.
2. **Verify** with the repository's relevant local gates before publishing.
3. **Log the decision** to `CHANGELOG.md` when the change is significant.
4. **Commit** per the doctrine above.
5. **Push directly or open/update a PR** per the repo's signals. State the call in one line.
6. **Propagate pushed skill changes** across every repository-owned harness surface when applicable. Record the refreshed revision or the exact recovery command per harness.
7. **Stabilize a PR** after every push until the ready-to-merge gate passes. Leave it open and unmerged.
8. **Report evidence separately:** PR URL and head commit; follow-up findings fixed; informational feedback requiring no change; local and runtime verification; current checks and reviews; local/remote synchronization; propagation state per harness; preview state; remaining blockers or unverified coverage; and explicit confirmation that the PR remains open and unmerged.

## Sources

> This skill draws inspiration from publicly available content from [Conventional Commits](https://www.conventionalcommits.org/), [GitHub CLI](https://cli.github.com/), and [GitHub Docs](https://docs.github.com/).
