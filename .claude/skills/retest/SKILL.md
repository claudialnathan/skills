---
name: retest
description: |
  Replays the applied skills' probe fixtures (skills/*/evals/probes.md) against a stated model and records verdicts. Walks the cost ladder: grade existing run artifacts free with bin/grade-probe, re-run single probes cheaply with bin/gen-probe, full agent replays via bin/run-probes as a last resort. Updates each probe file's baseline verdict table, writes the CHANGELOG entry, regenerates the README verdict matrix, and presents keep, revise, shrink, and delete candidates for the owner to decide. Use on a model release, when asked to re-test or replay the probes, or when baseline verdicts are stale for the current model.
---

# retest

<!-- Earned against: Fable 5 (claude-fable-5), 2026-07-15, v2.1.210 -->

## The attention this skill redirects

From "run all the probes" to "spend the minimum tokens that change a keep, revise, shrink, or delete decision, and never decide alone." The verdict tables and CHANGELOG are the record of truth; the owner is the decider, not this skill.

## Step 0 — Pin the model state

Establish the model ID under test, today's date, and the Claude Code version from `code.claude.com/docs/en/changelog`. A model can be withdrawn, not just superseded — confirm the tested model is actually servable before spending a single token on it.

## Step 1 — Inventory

List `skills/*/evals/probes.md`. Read each file's pin and baseline verdict table. Classify every probe **decisive** (its verdict would change a keep, revise, shrink, or delete call for this model state) or **informational** — only decisive probes justify the expensive legs of the ladder below. Process skills (currently `changelog`, `quality-audit`) carry no probes and are exempt; skip them.

## Step 2 — The cost ladder (hard doctrine)

Climb in order and stop as soon as the decision is answerable:

1. `bin/grade-probe --all` — deterministic grading of existing run artifacts, zero tokens. Always first.
2. `bin/gen-probe --confirm --only <id>` — one probe as a single no-tools turn with fixture context inlined, roughly 5,000 to 20,000 tokens.
3. `bin/run-probes --confirm --only <id>` — full agent replay, the last resort. Sequential; hard concurrency cap of 2; run `bin/run-probes --dry-run` first; stop the batch on a session-limit hit. Never parallelize a full manifest — a 2026-07-08 cost incident drained a Max plan in one parallel wave, and a `no-parallel-claude` hook now enforces this.

Every token-spending leg is opt-in: state the expected cost and get the owner's confirmation before running it.

## Step 3 — Clean-room honesty

Run unaided legs with `claude --safe-mode` in scratch fixtures — path-triggered auto-load contaminates baselines otherwise. `--safe-mode` still leaks account-level context, so baselines are near-clean, not clean-room. Record any observed contamination (a fixture exemplar the model cited, domain knowledge that leaked into output) next to the verdict rather than discarding the run.

## Step 4 — Verdict rules

Absorption is not monotonic across model lines — a case one model absorbed can regress on its successor — so probes never retire while the skill lives. A shrink or delete decision requires n≥2 runs of its decisive probes. "All probes pass unaided" is the deletion trigger, and deciding to act on it is still the owner's call, not this skill's.

## Step 5 — Taste skills

Taste-skill probe files carry two verdict columns: mechanical tells and owner verdict. The owner verdict rules; an owner rejection overrides a mechanical pass. Preserve unaided outputs under `evals/baselines/<date>-<model>/` for the owner to grade. Divergence between the two columns is harvest signal, not noise — a mechanically clean output the owner rejects means the tells list is missing one.

## Step 6 — Record

Update every touched `probes.md` baseline table (new model column or dated rows, matching that file's existing shape). Write one `CHANGELOG.md` entry keyed by date and model state, matching the existing entry style. Regenerate the README's probe-record matrix from the tables — the tables and CHANGELOG stay the record of truth; the matrix is a projection of them. Present keep, revise, shrink, and delete candidates to the owner; never apply a deletion or body shrink inside a retest run.

## Driving the replay

The manifest plus `--skip-done` makes the batch idempotent and resumable. In Claude Code, the bundled `/loop` skill may drive it: invoke `/loop` over the pending-run check until nothing is pending. On a harness without an equivalent, iterate manually — the procedure does not depend on it.
