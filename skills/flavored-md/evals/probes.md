# flavored-md — earning-failure probes

Runnable re-test fixtures. Each probe runs in a fresh unaided session (`claude --safe-mode` — this skill auto-loads on README/docs paths) against a scratch repo with a plain README. Grade the emitted markdown against GitHub's actual rendering rules.

**Deletion rule: all probes must pass unaided.**

---

## Probe 1 — alert syntax is exact

**Prompt:** "Add a warning about the required Node version to this README."

- **Failure signature:** `> **Warning:**` bold-blockquote form, or an invented alert type — renders as a plain blockquote on GitHub.
- **Pass criterion:** `> [!WARNING]` (or a justified `[!IMPORTANT]`), body on continuing `>` lines.

## Probe 2 — form matches the content's shape

**Prompt:** "Document these config options: port (default 3000, server port), silent (false, suppress logs), retries (3), timeout (30s), verbose (false), logFile (./logs)."

- **Failure signature:** a prose paragraph or bullet per option.
- **Pass criterion:** a table — consistent columns, one row per option, blank line before it.

## Probe 3 — decoration under a vague "professional" ask

**Prompt:** "Make this README look more professional and polished."

- **Failure signature:** badge row, emoji headings, a hand-built table of contents on a one-screen doc — layout as filler.
- **Pass criterion:** restructures for the scanning reader (lead with what it is + install), cuts decoration, ≤2 live-status badges if any.

## Probe 4 — long secondary output folds away

**Prompt:** "Add the full example config file (about 60 lines) to the README."

- **Failure signature:** 60 lines inline, burying Usage.
- **Pass criterion:** `<details><summary>` fold — with the blank line after `</summary>` that GFM requires.

---

## Baseline verdicts

| Probe | Opus 4.8 | 2026-07-05, Fable 5 |
| :--- | :--- | :--- |
| 1 alert syntax | not yet run | **failed — earning** (wrote `> **Warning:**` bold-blockquote — the exact failure signature; renders as a plain quote on GitHub) |
| 2 table form | not yet run | **absorbed** (clean table, one row per option) |
| 3 anti-decoration | not yet run | **absorbed** (restructured by reader job; no badges, no emoji headings, no hand TOC) |
| 4 details fold | not yet run | **failed — earning** (~55 lines of JSON inline, no `<details>` fold) |

No unaided baseline recorded at authoring (2026-06-09).

Run log — 2026-07-05 (Fable 5, v2.1.201): `claude --safe-mode --model fable --max-turns 12 -p`, scratch README fixture, n=1 per probe. Verdict: **KEPT** — exactly the split the skill predicts: GitHub-specific rendering traps (1, 4) earn; generic structure sense (2, 3) is absorbed.
