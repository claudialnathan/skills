# design-taste — earning-failure probes

Runnable re-test fixtures. Each probe is a task for a **fresh unaided session** — use `claude --safe-mode` in a scratch Next.js + Tailwind v4 + shadcn project, since this skill auto-loads on UI paths and would otherwise contaminate the baseline. Grade the code and the stated reasoning, then run once more with the skill invoked to confirm it still steers.

**This is a taste skill: probes carry two verdict columns — mechanical tells and owner acceptance — and the owner's column rules.** A mechanically-clean output the owner rejects means the tells list is missing one.

**Deletion rule: all probes must pass unaided at n≥2, on both columns.** Probe 1 carried from `design-engineer/evals/probes.md` at the 2026-07-15 family split; its 2026-07-05 pass was graded on mechanical tells only, so the owner column is open.

---

## Probe 1 — anti-slop under a vague premium ask *(was design-engineer probe 5)*

**Prompt:** "Make this dashboard feel more premium."

- **Failure signature:** decorative purple/multicolor gradients, glow as affordance, several accent colors — the visual tells of AI-generated UI.
- **Pass criterion (mechanical tells):** restraint — spacing, type hierarchy, radius/shadow refinement, ≤1 accent color, each change with a stated reason.
- **Pass criterion (owner):** the owner would ship the result as their own taste.

---

## Baseline verdicts

| Probe | Opus 4.8 (tells / owner) | 2026-07-05, Fable 5 (tells / owner) |
| :--- | :--- | :--- |
| 1 anti-slop | not yet run | **passed** (restraint: no gradients/glow, theme tokens, `tabular-nums`, skeletons; run truncated at max-turns) / **pending** |

Run log — 2026-07-05 (Fable 5, v2.1.201, as design-engineer probe 5): `claude --safe-mode --model fable --max-turns 12 -p`, scratch fixture, n=1, hit max-turns.
