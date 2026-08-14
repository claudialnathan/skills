---
name: wire-checks
description: Make sure a repository has react-doctor, OpenReview and gitleaks wired, a ship skill reachable, and its own project skills reachable by every harness that works in it — wiring whatever is missing from each project's own current documentation, then proving it runs. Use when the user asks to set these up, to check a repository has them, to add secret scanning or automated review, to make project skills discoverable across Claude Code, Codex and Cursor, or to bring a repository's checks up to standard. Invocation authorizes writing config, workflow, hook and symlink files into this repository.
---

# wire-checks

Five rows. Survey what is already there, wire what is missing, prove each one runs. The deliverable is a repository where they run — not a list of the ones that don't.

| Row | Upstream | Wired means |
| :--- | :--- | :--- |
| **react-doctor** | [millionco/react-doctor](https://github.com/millionco/react-doctor) | Its agent skill reachable from this repository, its config at the root, its generated pull-request workflow present and unmodified, and its local gate running before code leaves the machine. |
| **OpenReview** | [vercel-labs/openreview](https://github.com/vercel-labs/openreview) | The review app reaching this repository, and the skills it reads present in it. |
| **gitleaks** | [gitleaks/gitleaks](https://github.com/gitleaks/gitleaks) | Secret scanning running on pull requests **and** before a commit lands. |
| **ship** | — | A `ship` skill reachable in this repository's sessions. |
| **project skills** | [Cursor](https://cursor.com/docs/skills), [Codex](https://learn.chatgpt.com/docs/build-skills), [Claude Code](https://code.claude.com/docs/en/skills) | Every skill in `.agents/skills/` reachable by each harness that works in this repository. |

Invoking this skill authorizes wiring the missing rows into **this repository**: config files, workflow files, hook entries, symlinks, and the dependencies they need. It does not reach outside the repository — a machine-level install, a credential, a deploy, a GitHub App — because those need the owner's own accounts. Where a row's remaining work is outside the repository, finish everything inside it and hand back the exact step, named and copy-pasteable.

## Read upstream before wiring anything

**Do not set any of these up from this file, or from memory.** Each project owns its own setup and all of them change it. Open the linked repository first, and for a CLI read `--help` for the exact subcommand you are about to run rather than assuming a flag still exists.

The survey signals below were read from those repositories on 2026-08-12. Where one no longer matches what upstream documents, upstream is correct, and wire the row the way upstream says.

## 1. Survey

Find the gaps, and establish which rows apply at all.

| Row | Look for |
| :--- | :--- |
| react-doctor | A `react-doctor` skill directory in the repository's own skill paths or in the machine-level ones; a `doctor.config.*` at the root; a workflow under `.github/workflows/` that runs the react-doctor CLI. No React dependency in `package.json` makes the row not applicable — say so and move on. |
| OpenReview | Review activity from its GitHub App on recent pull requests, via `gh pr view` or `gh api`; a `.agents/skills/` directory. Nothing else of it lands in a repository, so absence of a local trace is not evidence it isn't running. |
| gitleaks | `.gitleaks.toml`, `.gitleaksignore`, a workflow referencing `gitleaks/gitleaks-action`, a `gitleaks` entry in `.pre-commit-config.yaml`, or a hook that calls it. Read `git config core.hooksPath` first: it names where this repository's hooks are read from, and a hook written anywhere else is inert. |
| ship | Whether a `ship` skill is available to the current session. |
| project skills | `.agents/skills/<name>/` directories; a `.claude/skills/<name>` symlink for each; and any `.cursor/skills` or `.codex/skills` directory, which duplicates a path its own harness already reads. No `.agents/skills/` makes the row not applicable — say so and move on. |

A row is a gap unless every part of its **wired means** holds. Part of a row counts as missing, not as done.

## 2. Ask once, and only what the survey could not settle

The survey answers most of it. Put whatever it could not settle into **one message, asked once, before any file is written** — not a question per row as the work reaches it, and not a question the repository already answers.

Three things belong in that message, and nothing else:

- **Which optional rows to wire.** A row whose value depends on an account, a spend, or a service the owner may not want is opt-in: name what it would add and what it would cost them, and wire it only on a yes. Declining is an answer, not a gap — record it as declined and move on.
- **A choice the repository genuinely leaves open**, where two shapes are both defensible and the wrong guess is work to undo.
- **Nothing else.** A flag with a documented default, a path the repository already demonstrates, a row that is plainly applicable — decide those and say what was decided.

State a recommended answer for every question, so a reply of "go ahead" is a safe answer to all of them. Where the owner does not answer, take the recommendation and say which ones were taken that way.

## 3. Wire the gaps

Work the gaps in order, and for each one:

- **Use the project's own CLI or documented action rather than hand-writing its config or workflow.** A generated file goes in exactly as generated. Where the project genuinely needs it different, wire it as generated first, then say what would have to change and why.
- **Name the paths a generator will write before running it, and stop if the set is wider than the row.** An installer that asks which targets to write to answers that question itself when it is skipped, and its default set can be every tool it supports rather than the ones this repository uses. A generated file goes in as generated; *which* files get generated is still this row's call. A directory for a harness nobody here runs is a failed wiring to remove, not a generated file to preserve.
- **Non-interactive only, except where the prompt is the scope.** A prompt waiting on a keypress hangs an agent shell, so read `--help` for a non-interactive form. Where the prompt is choosing *where* to write, a blanket yes is not that form: pass the targets with the flag the CLI documents, or hand the owner the interactive command and carry on with the rest of the row.
- **Install project-scoped where there is a choice.** A machine-level install is the owner's to run, and a check that only exists on one machine isn't wired for the repository.
- **Never overwrite a generated file that has been hand-edited.** Wiring past someone's deliberate edit destroys it. Show the diff, say what upstream would replace it with, and leave the file alone until the owner decides.
- **Add nothing the row didn't need.** No adjacent tooling, no unrelated workflow, no reformatting of a config file you opened to read.

Leave the changes uncommitted. Committing and opening a pull request is a separate step with its own judgment — `skills:ship` does that, and without it the tree is simply left for the owner to commit.

## 4. Prove each one runs

A file on disk is not a wired check. Before calling a row done:

- **The tree, first.** `git status` after wiring a row must show only the paths that row named. Whatever else a generator wrote is this row's result too, so account for every path or remove it — a wider tree than the row is a failure to report, not a side effect to leave behind.
- **A CLI**: run it once and show its exit and output.
- **A workflow**: confirm it parses and that its triggers match what upstream documents for that action. Where the repository has a GitHub remote and a branch to push, the run itself is the proof; where it doesn't, say the run is unverified rather than implying it passed.
- **A hook**: fire it, and show that it ran. Reporting a hook as wired because its file exists is the most common way this row is wrong.
- **A symlink**: resolve it, and show the target exists.
- **A row that needs a secret or an app** the repository doesn't have: it is not running yet. Say which credential or install is outstanding.

## Per-row wrinkles

### react-doctor: every part, and the workflow unmodified

The skill, the config, the pull-request workflow and the local gate are separate parts, and all of them are required. Unmodified matters because the workflow is generated: a hand-edited one has drifted from what the CLI maintains and can no longer be upgraded in place. Compare the repo's copy against what the current CLI generates — into the scratch directory, not over the repository's file — and treat any difference beyond a version bump as the hand-edited case above.

The skill half chooses its target harnesses, and the choice is the whole risk. `react-doctor install` picks them through an interactive selection backed by the `agent-install` package, and remembers the picks in a preference stored at user scope — so this row writes outside the repository whether or not it is asked to, and that must be said rather than assumed away. Skipping the selection does not decline it: the CLI falls back to its own defaults, which cover every harness `agent-install` supports and land a directory per harness at the repository root. Read `react-doctor install --help` in this session for the flag that names targets.

The wired shape is the one the project-skills row already prescribes: one source at `.agents/skills/react-doctor`, and a pointer for each harness the repository already keeps a directory for. Read those directories first and match them — if `.claude/`, `.codex/` and `.cursor/` are the ones present, they are the ones this row may add to, and no others. Anything beyond that set is the failed-wiring case above, so remove it and say what was removed.

The local gate is the part most often skipped, and the CLI installs it too: the source carries an installer for the package script and one for the git hook that calls it. Wire it through those rather than hand-writing a command, then confirm the hook landed where `core.hooksPath` points and that the script it calls is the diff-scoped one, so a run gates the change rather than re-reporting the whole codebase. A pull-request workflow reports after the push; this is what reports before it. Its findings are the row's proof, not a clean result — a warning left standing is a finding.

### OpenReview: optional, and the repository holds only its skills

This is the opt-in row, so it belongs in the one question above rather than in the wiring. Its setup is a deploy plus a GitHub App with several environment variables, all on the owner's own accounts and all billed to them, and nothing of it lands in a repository except the skills it reads from `.agents/skills/`. Name that when asking: what it would add, that the deploy and its running costs are theirs, and that a no costs this repository nothing.

On a yes, do the half that lives here — those skills — and name the deploy as the outstanding step. On a no, record the row as declined and leave `.agents/skills/` to the project-skills row, which wires the same entries for its own reasons.

### gitleaks: both places, or the row isn't done

A pull-request workflow catches what reached the branch; a pre-commit hook catches it before it exists in history. Wire both.

The hook half belongs wherever `core.hooksPath` points, and it has to be a committed file rather than one under `.git/hooks/`, which no clone but this one gets. Where `core.hooksPath` is unset, setting it is per-clone configuration that no commit carries, so wire the file and hand the owner the one command that points git at it.

The workflow half has a condition outside the repository: `gitleaks-action` documents `GITLEAKS_LICENSE` as "required for organizations, not required for user accounts", and the key is free to obtain. So an organization-owned repository needs that secret before the workflow can pass, and a personal one needs nothing. Establish which the remote is, then read the action's own README for the current secrets and permissions before wiring.

### ship: report, never install

Installing or updating a skill is machine-level configuration, and this skill does not write there. Report whether `skills:ship` is reachable and hand over the propagation to run. Nothing here needs it present.

### project skills: one symlink covers the gap

Discovery paths move, so read the three linked pages before wiring. Read on 2026-08-13: Cursor loads `.agents/skills/` and `.cursor/skills/` at project scope, Codex scans `.agents/skills/` from the working directory up to the repository root, and Claude Code reads `.claude/skills/` only. `.codex/skills` is not a Codex discovery location. So `.agents/skills/` is the single source of truth and Claude Code is the only harness that needs anything else:

```sh
ln -s ../../.agents/skills/<name> .claude/skills/<name>
```

A symlink rather than a copy, so a skill cannot drift from its source.

Only Claude Code's pointer is required by discovery. A `.codex/skills` or `.cursor/skills` directory is redundant against the paths above — but where the repository already keeps one, every skill gets a link in it, because a harness directory holding some of the set and not the rest is worse than either shape. So: `.agents/skills/` is the source, `.claude/skills/` is required, and each other harness directory the repository already has is matched. Never create one that isn't there, and never delete one that is.

The `.agents/skills/` entries are what the react-doctor and OpenReview rows point at too, so survey all of them together and link each skill once.

## Hand back one list, not a scatter of asides

Every step left for the owner — a secret, an account-level install, a per-clone git setting, a licence key, a deploy — collects into a single ordered block at the end. A step mentioned in passing beside the row it belongs to is a step that gets missed.

- **Order it by what unblocks what**, so working down the list turns things on in sequence.
- **Each step is one command that can be pasted**, with the placeholder named and no prose in the middle of it. `gh secret set GITLEAKS_LICENSE`, `git config core.hooksPath .githooks` — a step described rather than written out is not handed back, it is deferred.
- **Say what each one turns on**, and what stays red until it is done, so the owner can judge which ones they care about.
- **Offer the ones this session can finish.** An authenticated CLI can set a repository secret or a git config the same way the owner would. Where that is true, say so and do it on a yes rather than handing back what the session could have completed — but never mint, read, or paste the credential itself.
- **Leave out anything already done.** The list is what is outstanding, not a summary of the run.

## Done when

- Every applicable row runs, with the proof from step 4 stated — or has exactly one named blocker and the copy-pasteable owner step that clears it.
- Whatever the survey could not settle was asked once, before anything was written, and a row declined there is reported as declined rather than as a gap.
- react-doctor is accounted for as four parts, gitleaks as two places, and every `.agents/skills/` entry has its resolving Claude Code symlink.
- Every outstanding owner step is in the one ordered block, each as a command rather than a description.
- The upstream page was read in this session for every row that was wired.
- No generated file was overwritten past a hand edit, and anything a tool wrote outside the repository root was named rather than left unmentioned.
- Nothing was added that no row needed — in particular, no harness directory the repository did not already have — and the tree is left uncommitted.

## What this skill does not do

- **Write machine-level configuration**, including installing a skill or a credential.
- **Overwrite a hand-edited generated file**, or reformat a config file it only opened to read.
- **Commit, push, or open a pull request.**
- **Judge what these tools find.** It gets the checks running; their findings are their own conversation.
- **Carry a setup procedure.** The upstream repositories are the current source for each; this file says which rows must hold and what counts as proof.
