---
name: wire-checks
description: Make sure a repository has react-doctor, OpenReview and gitleaks wired, and a ship skill reachable — wiring whatever is missing from each project's own current documentation, then proving it runs. Use when the user asks to set these up, to check a repository has them, to add secret scanning or automated review, or to bring a repository's checks up to standard. Invocation authorizes writing config, workflow and hook files into this repository.
---

# wire-checks

Four rows. Survey what is already there, wire what is missing, prove each one runs. The deliverable is a repository where they run — not a list of the ones that don't.

| Row | Upstream | Wired means |
| :--- | :--- | :--- |
| **react-doctor** | [millionco/react-doctor](https://github.com/millionco/react-doctor) | Its agent skill reachable, at project or machine level, **and** its generated pull-request workflow present and unmodified. |
| **OpenReview** | [vercel-labs/openreview](https://github.com/vercel-labs/openreview) | The review app reaching this repository, and the skills it reads present in it. |
| **gitleaks** | [gitleaks/gitleaks](https://github.com/gitleaks/gitleaks) | Secret scanning running on pull requests **and** before a commit lands. |
| **ship** | — | A `ship` skill reachable in this repository's sessions. |

Invoking this skill authorizes wiring the missing rows into **this repository**: config files, workflow files, hook entries, and the dependencies they need. It does not reach outside the repository — a machine-level install, a credential, a deploy, a GitHub App — because those need the owner's own accounts. Where a row's remaining work is outside the repository, finish everything inside it and hand back the exact step, named and copy-pasteable.

## Read upstream before wiring anything

**Do not set any of these up from this file, or from memory.** Each project owns its own setup and all of them change it. Open the linked repository first, and for a CLI read `--help` for the exact subcommand you are about to run rather than assuming a flag still exists.

The survey signals below were read from those repositories on 2026-08-12. Where one no longer matches what upstream documents, upstream is correct, and wire the row the way upstream says.

## 1. Survey

Find the gaps, and establish which rows apply at all.

| Row | Look for |
| :--- | :--- |
| react-doctor | A `react-doctor` skill directory in the repository's own skill paths or in the machine-level ones; a `doctor.config.*` at the root; a workflow under `.github/workflows/` that runs the react-doctor CLI. No React dependency in `package.json` makes the row not applicable — say so and move on. |
| OpenReview | Review activity from its GitHub App on recent pull requests, via `gh pr view` or `gh api`; a `.agents/skills/` directory. Nothing else of it lands in a repository, so absence of a local trace is not evidence it isn't running. |
| gitleaks | `.gitleaks.toml`, `.gitleaksignore`, a workflow referencing `gitleaks/gitleaks-action`, a `gitleaks` entry in `.pre-commit-config.yaml`, or a hook under `.husky/` or `.git/hooks/` that calls it. |
| ship | Whether a `ship` skill is available to the current session. |

A row is a gap unless every half of its **wired means** holds. Half of a row counts as missing, not as done.

## 2. Wire the gaps

Work the gaps in order, and for each one:

- **Use the project's own CLI or documented action rather than hand-writing its config or workflow.** A generated file goes in exactly as generated. Where the project genuinely needs it different, wire it as generated first, then say what would have to change and why.
- **Non-interactive only.** A prompt waiting on a keypress hangs an agent shell. Read `--help` for a non-interactive form; where a step only works interactively, hand the owner that exact command and carry on with the rest of the row.
- **Install project-scoped where there is a choice.** A machine-level install is the owner's to run, and a check that only exists on one machine isn't wired for the repository.
- **Never overwrite a generated file that has been hand-edited.** Wiring past someone's deliberate edit destroys it. Show the diff, say what upstream would replace it with, and leave the file alone until the owner decides.
- **Add nothing the row didn't need.** No adjacent tooling, no unrelated workflow, no reformatting of a config file you opened to read.

Leave the changes uncommitted. Committing and opening a pull request is a separate step with its own judgment — `skills:ship` does that, and without it the tree is simply left for the owner to commit.

## 3. Prove each one runs

A file on disk is not a wired check. Before calling a row done:

- **A CLI**: run it once and show its exit and output.
- **A workflow**: confirm it parses and that its triggers match what upstream documents for that action. Where the repository has a GitHub remote and a branch to push, the run itself is the proof; where it doesn't, say the run is unverified rather than implying it passed.
- **A hook**: fire it, and show that it ran. Reporting a hook as wired because its file exists is the most common way this row is wrong.
- **A row that needs a secret or an app** the repository doesn't have: it is not running yet. Say which credential or install is outstanding.

## Per-row wrinkles

### react-doctor: both halves, and the workflow unmodified

The skill and the workflow are separate halves and both are required. Unmodified matters because the workflow is generated: a hand-edited one has drifted from what the CLI maintains and can no longer be upgraded in place. Compare the repo's copy against what the current CLI generates — into the scratch directory, not over the repository's file — and treat any difference beyond a version bump as the hand-edited case above.

### OpenReview: the repository holds only its skills

Its setup is a deploy plus a GitHub App with several environment variables, all needing the owner's own accounts, so the deploy half is always handed back. Do the half that lives here: the skills it reads from `.agents/skills/`. If the app is not yet running, still wire those, and name the deploy as the outstanding step.

### gitleaks: both places, or the row isn't done

A pull-request workflow catches what reached the branch; a pre-commit hook catches it before it exists in history. Wire both. Read the action's own README for the secrets and account conditions it requires before wiring the workflow half.

### ship: report, never install

Installing or updating a skill is machine-level configuration, and this skill does not write there. Report whether `skills:ship` is reachable and hand over the propagation to run. Nothing here needs it present.

## Done when

- Every applicable row runs, with the proof from step 3 stated — or has exactly one named blocker and the copy-pasteable owner step that clears it.
- react-doctor is accounted for as two halves, and gitleaks as two places.
- The upstream page was read in this session for every row that was wired.
- No generated file was overwritten past a hand edit, and nothing outside the repository root was written.
- Nothing was added that no row needed, and the tree is left uncommitted.

## What this skill does not do

- **Write machine-level configuration**, including installing a skill or a credential.
- **Overwrite a hand-edited generated file**, or reformat a config file it only opened to read.
- **Commit, push, or open a pull request.**
- **Judge what these tools find.** It gets the checks running; their findings are their own conversation.
- **Carry a setup procedure.** The upstream repositories are the current source for each; this file says which rows must hold and what counts as proof.
