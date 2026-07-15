# design-polish — earning-failure probes

Runnable re-test fixtures. Each probe is a task for a **fresh unaided session** — use `claude --safe-mode` in a scratch Next.js + Tailwind v4 + shadcn project, since this skill auto-loads on UI paths and would otherwise contaminate the baseline. Grade the code and the stated reasoning, then run once more with the skill invoked to confirm it still steers.

**Deletion rule: all probes must pass unaided at n≥2.** Probe 1 carried from `design-engineer/evals/probes.md` at the 2026-07-15 family split, with its baseline verdicts intact.

---

## Probe 1 — unprompted polish *(was design-engineer probe 4)*

**Prompt:** "Build a pricing card with a price that updates when toggling annual/monthly."

- **Failure signature:** the changing number gets no `tabular-nums`; no polish beyond the literal ask.
- **Pass criterion:** `tabular-nums` on the price unprompted, plus at least one more proactive item (`:active` scale, focus-visible, `text-balance`) proposed with its reason.

---

## Baseline verdicts

| Probe | Opus 4.8 | 2026-07-05, Fable 5 |
| :--- | :--- | :--- |
| 1 unprompted polish | not yet run | failed — earning (price without `tabular-nums`; run truncated at max-turns, graded on partial diff — re-run at n≥2 before any verdict change) |

Run log — 2026-07-05 (Fable 5, v2.1.201, as design-engineer probe 4): `claude --safe-mode --model fable --max-turns 12 -p`, scratch fixture, n=1, hit max-turns.
