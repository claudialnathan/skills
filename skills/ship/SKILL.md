---
name: ship
description: 'This skill should be used when the user asks to "commit this", "commit and push", "ship this", "open a PR", "make the PR pass", "resolve review comments", or "get the PR ready". It delivers coherent changes with neutral Conventional Commits, chooses direct push or a PR from repository evidence, and treats automated findings — especially React Doctor — as code review to resolve at the source. It stabilizes the current PR head for a human to merge, but never merges or enables auto-merge without an explicit request.'
allowed-tools: Bash(git add *), Bash(git commit *), Bash(git fetch*), Bash(git push*), Bash(git status*), Bash(git diff*), Bash(git log*), Bash(git branch*), Bash(git rev-parse*), Bash(git check-ignore*), Bash(git ls-files*), Bash(gh pr checks *), Bash(gh pr comment *), Bash(gh pr create *), Bash(gh pr edit *), Bash(gh pr list *), Bash(gh pr ready *), Bash(gh pr view *), Bash(gh repo view *), Bash(gh run view *), Bash(gh api *), Bash(vercel inspect*), Bash(vercel logs*), Bash(scripts/sync-cross-tool*), Bash(codex plugin marketplace upgrade *), Bash(codex plugin add *), Bash(claude plugin marketplace update *), Bash(claude plugin update *), Bash(python3 *fetch-pr-feedback.py *), Read, Edit, Write, Grep
---

# ship

Deliver the repository's complete pending work with durable history, then finish the review path the repository uses.

## Authority

Invocation authorizes committing, pushing, opening or updating a PR, fixing in-scope findings, and answering them on the PR. It does not authorize merging, enabling auto-merge, force-pushing, rebasing, or merging the base branch.

"Ship", "ready", "make it pass", and "good to go" stop at an open PR a human can merge. Merge only when the owner asks for it explicitly in this conversation.

## Procedure

### 1. Set the delivery scope

Read `git status`, staged and unstaged diffs, untracked files, and recent history. Start from all complete pending changes, not only the current task. List that delivery set before publishing it.

Ask only about work that appears unfinished or broken: conflict markers, WIP/TODO/debug residue, a partial feature, a failing build, or an uncertain artifact. Separate unrelated complete work into logical commits. After the first push, the delivery set is fixed; do not absorb unrelated work found during review.

### 2. Verify before publishing

Run the repository's own format, lint, type, test, build, generated-file, and runtime checks that apply to the delivery set. Review the staged diff for secrets, regressions, and unrelated changes.

Every push starts the repository's whole CI round and spends its minutes, so the first push carries a revision you already believe is good. List the checks the PR will run, find the local command each one already has, and run those first. A failure you could have seen locally costs a full round to learn on the PR.

Use only commands the repository already provides. Do not install or reconfigure a PR-only reviewer to turn it into a pre-push gate. Where a repository does provide a local React Doctor command, that command is part of this step; otherwise its generated workflow reports on the PR head in step 5.

### 3. Commit for the next reader

Read the repository's recent commit subjects and reuse its scopes. Write one logical change per commit:

- `<type>(<scope>): <subject>`; imperative, lowercase, no trailing period, at most 72 characters. Use `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, or `revert`.
- Add a short body only for information the diff cannot recover: the constraint, a rejected approach, what remains open, or a `partial`, `workaround`, or `untested` caveat.
- Use neutral language. Do not add quality claims, model/session attribution, `Co-Authored-By`, or generated-by trailers. Footers are only machine-actionable trailers such as `BREAKING CHANGE:`, `Refs:`, or `Closes:`.

### 4. Choose the delivery route

Use repository evidence rather than a fixed default: recent merged work, the current branch, protection and required-check configuration, and the change's reversibility. A feature branch or protected default branch is PR-bound; a large or hard-to-revert change earns a PR even in a direct-push repository. Say which route you chose and why, then push or open/update the PR. Write a PR body by the same neutral, why-only, no-attribution rules as a commit body.

### 5. Resolve review findings

Once PR-bound, review is part of shipping. After the PR opens and after every push, run [the current-head stabilization loop](references/pr-stabilization.md). It owns waiting, complete feedback inventory, one batched fix per round, a hard round cap, provider comments, deployments, and two-snapshot convergence.

Use [the finding-answer contract](references/answer-findings.md) for replies and per-head comments. When this loop changes, rerun [its Given/Then acceptance scenarios](references/loop-acceptance.md).

Treat every React Doctor diagnostic as a code-review/refactor finding. Read the full diagnostic and the source it points at, fix the underlying accessibility, state, component, or React design issue, and verify the affected behavior. A higher score or green conclusion does not close the original finding by itself.

Do not change a reviewer's workflow, command, config, version, scope, baseline, severity, threshold, or exclusions to make the result pass. Do not add an ignore or reshape code only to stop the match while leaving the reported issue in place. A finding closes only through a verified source fix, source-backed false-positive evidence, an owner-approved suppression, or an owner decision when the fix exceeds scope. Only a provider-marked informational item needs no PR answer.

The PR is ready only when the current head is fully inventoried, required checks pass, deployments are ready, non-informational findings are answered on the PR, actionable threads are resolved, local/upstream/PR heads match, two snapshots converge, and the PR remains open and unmerged.

### 6. Propagate skill repositories

When the delivered repository is a skill marketplace and a skill or plugin manifest changed, follow [the repository's propagation contract](references/propagation.md). A push alone does not prove any harness refreshed.

### 7. Report the delivered state

Report the route, commits, PR URL and head where applicable, every automated finding and its disposition/evidence/answer link, local and runtime verification, checks, reviews, deployments, local-to-remote parity, propagation per harness, and anything blocked or unverified. For a PR, state that it is still open and unmerged.

## Sources

> This skill draws inspiration from publicly available content from [Conventional Commits](https://www.conventionalcommits.org/), [GitHub CLI](https://cli.github.com/), [GitHub Docs](https://docs.github.com/), and [React Doctor](https://react.doctor/).
