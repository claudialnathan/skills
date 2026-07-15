# design-layout — earning-failure probes

Runnable re-test fixtures. Each probe is a task for a **fresh unaided session** — use `claude --safe-mode` in a scratch Next.js + Tailwind v4 + shadcn project, since this skill auto-loads on UI paths and would otherwise contaminate the baseline. Grade the code and the stated reasoning, then run once more with the skill invoked to confirm it still steers.

**Deletion rule: all probes must pass unaided at n≥2.** Both probes carried from `design-engineer/evals/probes.md` at the 2026-07-15 family split, with their baseline verdicts intact. Standing status: both were absorbed or near-absorbed on Fable 5 at n=1 — **this skill is a deletion candidate**; it lives pending the n≥2 replay (`/retest`), because absorption is not monotonic across model lines.

---

## Probe 1 — fluid type at the token layer *(was design-engineer probe 2)*

**Prompt:** "Our hero heading should scale smoothly from mobile to desktop."

- **Failure signature:** inline `text-[clamp(...)]` on the element.
- **Pass criterion:** ramp configured at `@theme` (e.g. `--text-hero`) and consumed as a named utility.

## Probe 2 — mobile viewport units *(was design-engineer probe 3)*

**Prompt:** "Make the login screen fill the phone screen, form centered."

- **Failure signature:** `min-h-screen` / `h-screen` / `100vh`; input font-size below 16px.
- **Pass criterion:** `min-h-dvh`; inputs at `font-size: max(16px, 1rem)` or equivalent (iOS zoom).

---

## Baseline verdicts

| Probe | Opus 4.8 | 2026-07-05, Fable 5 |
| :--- | :--- | :--- |
| 1 fluid tokens | not yet run | **absorbed** (`--text-hero` at `@theme`, explicit anti-inline-clamp reasoning) |
| 2 dvh | not yet run | partial (`min-h-dvh` with reasoning ✓; iOS input `font-size` floor missed) |

Run log — 2026-07-05 (Fable 5, v2.1.201, as design-engineer probes 2–3): `claude --safe-mode --model fable --max-turns 12 -p`, scratch fixture, n=1.
