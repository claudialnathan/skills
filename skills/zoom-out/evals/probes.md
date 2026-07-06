# zoom-out — earning-failure probes

Runnable re-test fixtures. Unlike prompt-only probes, these need a **constructed fixture**: the failure only shows against a project whose surface story and underlying evidence disagree. Build a scratch repo with, at minimum:

- a self-assured README/CLAUDE.md whose stated goal names a rival tool as the opponent;
- a commit history whose effort concentrates (~80%) on a side layer (docs polish, tooling cosmetics) rather than the stated mission;
- one genuinely strong idea buried where incremental review never reads (a tail section or one-off script);
- at least one claim in the docs that the code contradicts.

Run each probe in a fresh unaided session (`claude --safe-mode`, scratch project — near-clean, not clean-room: account-level context leaks through). Grade the transcript, not just the final message.

**Deletion rule: all probes must pass unaided — and tells alone don't delete.** Frame-challenging and effort-auditing are technique; decide-over-defer is owner preference a model release cannot absorb on the owner's behalf. Dual verdict columns, as for taste skills: mechanical tells and owner acceptance.

---

## Probe 1 — frame-taking

**Prompt:** "review this repo and zoom out. is it actually achieving what it's for? tell me what matters."

- **Failure signature:** grades the work against the README's stated goal without testing the goal; the named rival is accepted as the opponent; findings are improvements within the given frame.
- **Pass criterion:** challenges the stated goal, re-derives the real opponents (a moving baseline, the owner's time, or fixture-equivalents), and grades against those; flags at least one doc claim the code contradicts.

## Probe 2 — deference

**Prompt:** "what should change here? action what you can."

- **Failure signature:** an options menu ("I could A, B, or C — which would you like?"), symmetric strengths-and-weaknesses, no ranking, nothing actioned.
- **Pass criterion:** reversible changes actioned with reasons and revert paths; explicit asymmetric demotion (something the project treats as important called out as hygiene or ceremony); a one-sentence verdict.

## Probe 3 — effort versus story

**Prompt:** "how is this project going?"

- **Failure signature:** reports status from the docs' self-description; never reads the commit history; misses the effort concentration entirely.
- **Pass criterion:** reads the history, names the drift between where effort went and what the mission needs, and surfaces the buried strong idea or explains what was searched.

## Probe 4 — the inventor move

**Prompt:** "give me your unbiased take: what could this project become? think forward."

- **Failure signature:** extrapolates the README's own roadmap; flattering vision statements that cite nothing observed; no thought absent from the project's own docs.
- **Pass criterion:** at least one forward proposal grounded in an observed asset (the buried idea, the effort concentration, a doc–code gap) that appears nowhere in the project's docs, named as direction with what it would take to test.

---

## Baseline verdicts

| Probe | Tells (mechanical) | Owner |
| :--- | :--- | :--- |
| 1 frame-taking | not yet run as fixture | pending |
| 2 deference | not yet run as fixture | pending |
| 3 effort vs story | not yet run as fixture | pending |
| 4 inventor move | not yet run as fixture | pending |

Earned from production observation, 2026-07-04/05 (Opus 4.8 and Fable 5, v2.1.201): review-shaped sessions graded artifact hygiene while a mission-level drift went unnamed until the full stance was supplied by hand; the compliance-pass signature (frame-taking, symmetric grading, option menus) reproduced across both model lines. Fixture construction pending — run before the first shrink or delete decision.
