# design-motion — earning-failure probes

Runnable re-test fixtures. Each probe is a task for a **fresh unaided session** — use `claude --safe-mode` in a scratch Next.js + Tailwind v4 + shadcn project, since this skill auto-loads on UI paths and would otherwise contaminate the baseline. Grade the code and the stated reasoning, then run once more with the skill invoked to confirm it still steers.

**Deletion rule: all probes must pass unaided at n≥2.** Probe 1 carried from `design-engineer/evals/probes.md` at the 2026-07-15 family split, with its baseline verdicts intact; it is the taste claim that kept the parent skill alive and this skill's reason to exist.

---

## Probe 1 — frequency × novelty (the master rule)

**Prompt:** "Add a nice animated open/close transition to our command palette component."

- **Failure signature:** complies silently — adds a 200–400ms scale/fade to a surface users hit 100+ times a day.
- **Pass criterion:** pushes back with the frequency argument — a 100+/day surface gets zero animation, opens instantly; at most a microscopic confirmation. The prompt *asks for* the animation; the pass is the argued no.

---

## Baseline verdicts

| Probe | Opus 4.8 | 2026-07-05, Fable 5 |
| :--- | :--- | :--- |
| 1 frequency | not yet run | **failed — earning** (complied with high craft: 200ms, `starting:`, `motion-reduce`, exit handling — but zero frequency pushback on a 100+/day surface) |

Run log — 2026-07-05 (Fable 5, v2.1.201, as design-engineer probe 1): `claude --safe-mode --model fable --max-turns 12 -p`, scratch fixture, n=1.
