# design-engineer — earning-failure probes

Runnable re-test fixtures. Each probe is a task for a **fresh unaided session** — use `claude --safe-mode` in a scratch Next.js + Tailwind v4 + shadcn project, since this skill auto-loads on UI paths and would otherwise contaminate the baseline. Grade the code and the stated reasoning, then run once more with the skill invoked to confirm it still steers.

**Deletion rule: all probes must pass unaided.** Models absorb the mechanical probes (2–3) first; the taste probes (1, 5) are the skill's reason to exist and the last to fall.

---

## Probe 1 — frequency × novelty (the master rule)

**Prompt:** "Add a nice animated open/close transition to our command palette component."

- **Failure signature:** complies silently — adds a 200–400ms scale/fade to a surface users hit 100+ times a day.
- **Pass criterion:** pushes back with the frequency argument — a 100+/day surface gets zero animation, opens instantly; at most a microscopic confirmation. The prompt *asks for* the animation; the pass is the argued no.

## Probe 2 — fluid type at the token layer

**Prompt:** "Our hero heading should scale smoothly from mobile to desktop."

- **Failure signature:** inline `text-[clamp(...)]` on the element.
- **Pass criterion:** ramp configured at `@theme` (e.g. `--text-hero`) and consumed as a named utility.

## Probe 3 — mobile viewport units

**Prompt:** "Make the login screen fill the phone screen, form centered."

- **Failure signature:** `min-h-screen` / `h-screen` / `100vh`; input font-size below 16px.
- **Pass criterion:** `min-h-dvh`; inputs at `font-size: max(16px, 1rem)` or equivalent (iOS zoom).

## Probe 4 — unprompted polish

**Prompt:** "Build a pricing card with a price that updates when toggling annual/monthly."

- **Failure signature:** the changing number gets no `tabular-nums`; no polish beyond the literal ask.
- **Pass criterion:** `tabular-nums` on the price unprompted, plus at least one more proactive item (`:active` scale, focus-visible, `text-balance`) proposed with its reason.

## Probe 5 — anti-slop under a vague premium ask

**Prompt:** "Make this dashboard feel more premium."

- **Failure signature:** decorative purple/multicolor gradients, glow as affordance, several accent colors — the visual tells of AI-generated UI.
- **Pass criterion:** restraint — spacing, type hierarchy, radius/shadow refinement, ≤1 accent color, each change with a stated reason.

---

## Weighting

Probes 1 and 5 carry the skill's taste claim and decide its life. Probes 2–4 are mechanics the model may absorb earlier; their individual passes don't count against the skill while 1 or 5 still fail.

## Baseline verdicts

| Probe | Opus 4.8 | 2026-07-05, Fable 5 |
| :--- | :--- | :--- |
| 1 frequency | not yet run | **failed — earning** (complied with high craft: 200ms, `starting:`, `motion-reduce`, exit handling — but zero frequency pushback on a 100+/day surface) |
| 2 fluid tokens | not yet run | **absorbed** (`--text-hero` at `@theme`, explicit anti-inline-clamp reasoning) |
| 3 dvh | not yet run | partial (`min-h-dvh` with reasoning ✓; iOS input `font-size` floor missed) |
| 4 unprompted polish | not yet run | failed — earning (price without `tabular-nums`; run truncated at max-turns) |
| 5 anti-slop | not yet run | **passed** (restraint: no gradients/glow, theme tokens, `tabular-nums`, skeletons; run truncated at max-turns) |

No unaided baseline was recorded when the skill was authored (2026-06-12).

Run log — 2026-07-05 (Fable 5, v2.1.201): `claude --safe-mode --model fable --max-turns 12 -p`, scratch fixture, n=1 per probe; probes 4–5 hit max-turns (graded on partial diffs). Verdict: **KEPT, shrink candidate** — the mechanics legs (2, 3-first-clause) are absorbed; the frequency taste claim (probe 1) is the skill's living core. Re-run 1 and 4 at n≥2 before cutting anything.
