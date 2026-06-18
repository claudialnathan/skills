---
name: worklog-minor
description: "Fast append to .worklog/LOG.md — log one or a few typed entries (decision/failure/gotcha/question) the way you'd write a commit message, then stop. No BRIEF regen, no graduation. Use for /worklog-minor, or when the user wants to quickly jot a failure mode, gotcha, or update for the next agent without the full /worklog pass."
---

<!-- Earned against: Opus 4.8, 2026-06-18, v2.1.177 — history: CHANGELOG.md -->

# Worklog (minor)

The fast lane for `.worklog/`. Same log, same format, none of the heavy tail.

Full `/worklog` appends, then regenerates `BRIEF.md` from the whole LOG and runs a
graduation pass. That tail is the slow part. This skill does the first step only:
append a well-formed entry to `.worklog/LOG.md` and stop. The next full `/worklog`
projects it into BRIEF and graduates it if it qualifies.

Reach for it to leave a line for the next agent — a failure mode, a gotcha, a small
decision — without paying for the projection.

## What it does

1. **Append** one or a few entries to the END of `.worklog/LOG.md`, in the standard format.
2. **Stop.** Print the appended headline(s) and the LOG path. Note that BRIEF was not
   regenerated and the next `/worklog` will catch it up.

That is the whole skill. No BRIEF regen, no graduation, no significance gate — invoking
it IS the decision to log. Run inline; never spawn a subagent to read the transcript.

## Entry format (identical to the full skill)

Append at the end of the file:

```
#### YYYY-MM-DD | `type` | one-line headline (specific, names a file or area)

- optional terse bullet, evidence-first; include a number if one matters
→ path/one, path/two   (touched files, when relevant)
```

- Types: `decision`, `failure`, `gotcha`, `question`. The date starts the heading and is
  mandatory; no time-of-day.
- Headline names the area or file, not the verb (`auth → session cookies, JWT dropped`,
  not `changed auth`).
- A headline-only entry is fine — here bullets are optional; the headline carries it.
- Append at end. Never edit a past entry or `BRIEF.md`.
- No em dashes. Neutral, durable phrasing — translate frustrated wording into a fact.
- Reversing a past entry? Add `supersedes: YYYY-MM-DD <headline>` (grep LOG to find it).
- The entry format is inlined here so the fast path stays self-contained.

The rest of the spec — significance gate, BRIEF projection, graduation, pushback — lives
in the `worklog` skill. This skill deliberately omits all of it.

## If `.worklog/` doesn't exist

Create `.worklog/LOG.md` with the header below and `.worklog/.gitattributes` containing
`LOG.md merge=union`, then append. Do not create or touch `BRIEF.md` — the first full
`/worklog` builds it.

```
# Worklog

Append-only project history. Oldest first; newest at the end. Never edit past entries.

---
```

## When to run the full `/worklog` instead

When you want BRIEF caught up (it is the orientation surface a fresh agent reads first),
when entries should be considered for graduation to `AGENTS.md` / `.claude/rules`, or when
distilling a whole session rather than jotting a line.
