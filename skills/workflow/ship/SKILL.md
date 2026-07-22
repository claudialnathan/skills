---
name: ship
description: "Commit and ship a change the way an always-on, AI-driven repo needs it: a Conventional Commits message written as context for the next agent — correct type/scope so `git log --grep` works as an index, a body only for the why the diff can't show, neutral with zero attribution or self-praise — then read the repo's own signals to push to `main` or open a PR, and log the decision to CHANGELOG.md so the reasoning, any rejected dead-end, and open items survive. Use for any request to commit, commit and push, ship, or open a PR for the current change. Invocation is consent to push or open the PR."
allowed-tools: Bash(git add *), Bash(git commit *), Bash(git push*), Bash(git status*), Bash(git diff*), Bash(git log*), Bash(git branch*), Bash(git rev-parse*), Bash(gh pr *), Read, Edit, Write, Grep
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

## Log the decision

The commit carries some of the why. Three things a commit structurally *cannot* carry, that a cold reader still needs: an approach you **tried, reverted, and left no commit for**; what is **still open**; and a **curated skim surface**. When a change is significant, append an entry to `CHANGELOG.md` at the repo root so those survive.

This step rides here on purpose: shipping a change is a trigger you can't skip, logging the decision on its own is one you'll forget. Before logging, skim the existing `**Rejected:**` lines near the top of `CHANGELOG.md` — if this change re-does something already rejected, surface that entry before proceeding. Skip the log for pure formatting, typos, or mechanical churn with no decision behind it. Format, significance gate, bootstrap, and archiving: [references/changelog.md](references/changelog.md).

## Procedure

1. **Assume everything; stop only for part-way work.** Default to including *all* pending changes — tracked and untracked — not just the current task's. Review `git status` and `git diff` to confirm the set. **Stop and ask only when a change looks unfinished, broken, or clearly part-way** (WIP/TODO/debug leftovers, half-written code, something that doesn't build, conflict markers, a file still open mid-edit, a separate feature only partly landed) — then ask whether to include or leave out *those specific pieces* and ship the rest; never raise scope otherwise. Group cleanly-separable complete changes into their own logical commits, leaving no complete work behind. Scan the staged diff for secrets (keys, tokens, passwords) before committing — a secret in history is expensive to undo.
2. **Commit** per the doctrine above.
3. **Push or open a PR** per the repo's signals. State the call in one line.
4. **Log the decision** to `CHANGELOG.md` when the change is significant.
