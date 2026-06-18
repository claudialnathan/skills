---
name: worklog
description: "Project history for agents and humans — a committed .worklog/ that any agent (Claude Code, Cursor, Codex, v0) reads and writes. BRIEF.md is a ~100-line dated orientation surface (what's decided, ruled out, unresolved); LOG.md is the append-only record behind it. Use when the user runs /worklog, asks to log or recall project history, or proposes something the log already tried and rejected — push back before agreeing."
---

<!-- Earned against: Opus 4.8, 2026-06-18, v2.1.177 — history: CHANGELOG.md -->

# Worklog

Project history, committed to the repo, read by whoever shows up next — human or agent. The subject is the project, not the user and not Claude. AGENTS.md tells agents how to behave; `.worklog/` tells them what already happened.

Two surfaces, one source of truth:

```
.worklog/
  BRIEF.md         the read path. ~100 lines, every line dated. A projection of LOG.md.
  LOG.md           the evidence. Append-only, newest at the END. Never edited.
  .gitattributes   "LOG.md merge=union" — parallel agents append without conflicts.
```

`.worklog/` lives at the project root (git root if available, else CWD).

**LOG is written; BRIEF is derived.** Every `/worklog` run appends to LOG, then regenerates BRIEF from LOG. BRIEF is never hand-authored and never contains a claim that isn't backed by a LOG entry. This split is the whole design: the log can't lie because it's append-only history; the brief can't go stale because it's mechanically rebuilt from that history every time.

## Why this shape

Personal agent memory (Claude auto memory, Codex/Copilot/Gemini memories) is per-machine and per-tool — it never reaches your teammate or the next agent. Git history records what changed, not what was *rejected*. AGENTS.md is current-state instructions with no history. The gap is a committed, distilled, dated record of how the project got where it is — including the dead ends that never became commits. That's this.

## The read path (how agents without this skill participate)

The point of plain markdown in the repo is that every AGENTS.md-reading agent can use it with zero install. On bootstrap, offer to add this block to the project's `AGENTS.md` (and append it to `CLAUDE.md` if present):

```
## Project history
Before non-trivial work, read .worklog/BRIEF.md (≈100 lines, dated).
When a topic recurs or feels already-decided, grep .worklog/LOG.md.
After a real decision, failure, or gotcha, append a dated entry to the END of
LOG.md matching the format of existing entries. Never edit old entries or BRIEF.md.
```

A skill-less agent reads BRIEF, greps LOG, and appends to LOG. It won't regenerate BRIEF — that's fine. The next `/worklog` run catches BRIEF up, and BRIEF's header states honestly how far behind it is.

## LOG.md — the evidence layer

Append-only. Newest entry at the **end** of the file (so parallel worktree agents never fight over the same lines; `merge=union` does the rest). Entries are never edited or deleted — to reverse a past decision, write a new one that supersedes it.

### Entry types

Four. Each maps 1:1 to a BRIEF section, which is what makes BRIEF derivable mechanically.

| Type        | When to use                                                                          | BRIEF section        |
| ----------- | ------------------------------------------------------------------------------------ | -------------------- |
| `decision`  | A choice between alternatives. Log the choice, the why, the rejected option.         | Recent / Constraints |
| `failure`   | An approach was tried and didn't work. Log the symptom, root cause, what to do instead. | Don't retry       |
| `gotcha`    | A non-obvious system fact a future agent needs (env, build, infra trap).             | Constraints / Recent |
| `question`  | An open question the project hasn't resolved.                                        | Open questions       |

`failure` and `decision` carry the highest future-agent value — they are what git history and AGENTS.md structurally cannot give you. There is no `change` type (git log and the `/changelog` skill own that) and no `correction` type (a correction is a `decision`, a `gotcha`, or a graduation candidate — classify it as one of those).

### Entry format

```
#### YYYY-MM-DD | `type` | one-line headline (specific, file/area named)

- terse bullet, evidence-first
- another bullet, no filler
- if a number matters (test count, file count, time), include it

supersedes: YYYY-MM-DD <headline of the entry this reverses>   ← only when reversing a past entry
→ src/path/one.ts, src/path/two.ts                              ← touched files, when relevant
```

Rules:

- **Date is `YYYY-MM-DD` and starts the heading.** No time-of-day. The date is load-bearing: it lets BRIEF show a claim as old without it being a lie.
- **Append at end of file.** Entries read top-to-bottom oldest-to-newest.
- **Headline names the area or file, not the verb** (`auth → session cookies, JWT dropped`, not `changed auth`).
- **`supersedes:` is written at append time, while context is hot.** A decision that reverses an earlier one must name the date + headline it reverses. This is what lets BRIEF drop the old claim mechanically instead of guessing what's still true. If you can't identify the entry being reversed, grep LOG before writing.
- Bullets only. No paragraphs. Every word adds information.
- No em dashes. Use periods or commas.
- Translate emotional or frustrated user wording into a neutral durable claim. Preserve original phrasing only inside quotes if the phrasing itself is the lesson.

## BRIEF.md — the orientation surface

The highest-frequency interaction in the system and the one to get right. A fresh agent or human reads BRIEF first. If BRIEF is long, vague, or wrong, nothing underneath it gets trusted.

Five hard rules (resurrected from the pre-collapse brief spec; they are why BRIEF stays honest):

1. **Projection, not summary.** Every BRIEF line is a copy or pure shortening of a LOG entry's headline plus its date. You may shorten and reorder; you may **not** synthesize a claim that exists in no LOG entry, infer "the project's direction," or summarize across entries. If you're tempted to interpret, stop — that's the reading agent's job, not BRIEF's.
2. **Every line is dated.** A dated claim can be old without being a lie. An undated "current state" line cannot.
3. **Regen is mechanical.** Superseded entries and `promoted` entries drop out of the active sections automatically. No model judgment about "what's still true" — the `supersedes:` links and `promoted` tags already encode it.
4. **Hard per-section caps, ~100 lines total.** Overflow drops the lowest-priority items and emits one line teaching the grep. Empty sections are omitted entirely.
5. **Honest header.** State which LOG date the brief was built through, the don't-edit rule, and the merge rule.

### BRIEF layout

```markdown
# Project brief

Built from .worklog/LOG.md through <date of newest LOG entry>. Log it; don't edit this file.
On merge conflict: take either side, then regenerate from LOG.

## Recent (last 14 days)
- YYYY-MM-DD — decision: <short claim, why in one clause>
- YYYY-MM-DD — gotcha: <short claim>

## Don't retry (dead ends)
- YYYY-MM-DD — <approach>: <one-line reason it was rejected>
…N more: grep LOG.md for "| \`failure\` |"

## Constraints in force
- YYYY-MM-DD — <durable fact still governing the work>

## Open questions
- YYYY-MM-DD — <unresolved question>
```

Section sources and caps:

| Section            | Drawn from                                                       | Cap | Overflow                                   |
| ------------------ | ---------------------------------------------------------------- | --- | ------------------------------------------ |
| Recent (last 14d)  | any non-superseded entry dated within 14 days, newest first      | 10  | keep 10 newest; drop the rest (they age out anyway) |
| Don't retry        | `failure` entries, non-superseded, newest first                  | 15  | keep 15 newest + "…N more: grep LOG.md for \"\| \`failure\` \|\"" |
| Constraints        | `decision`/`gotcha` entries phrased as still-governing facts     | 10  | keep 10 newest + "…N more in LOG.md"       |
| Open questions     | `question` entries with no later entry answering them            | 5   | keep 5 newest + "…N more"                  |

Skip a section header entirely if it has no entries. Total stays near 100 lines; if it doesn't, you're putting bodies in BRIEF instead of headlines.

## Execution order — `/worklog`

Both modes run this sequence, silently, no prompts:

1. **Scan and select.** Distill mode (bare `/worklog`): scan the recent session, select entries per the significance gate. Directed mode (`/worklog <topic>`): draft one evidence-backed entry on the named topic.
2. **Append to LOG.md** at end of file, one block per entry, with `supersedes:` lines where a past entry is being reversed.
3. **Regenerate BRIEF.md** from LOG per the five rules. Update the header's "built through" date.
4. **Inline graduation pass** (see below) — promote any just-appended entry that already qualifies.
5. **Show the user**: headlines appended, that BRIEF was regenerated, anything promoted. File paths and headlines, not full bodies.

Bare `/worklog` with zero qualifying candidates is a valid outcome — say so and stop. Don't fabricate signal; the log is append-only and false entries decay it.

**Fast path.** To jot a single entry without the regen + graduation tail, use the `worklog-minor` skill (`/worklog-minor`). It appends to LOG and stops; the next full `/worklog` projects it into BRIEF and graduates it if it qualifies.

## Significance gate

Before logging, ask: **would a future agent (any agent, not just Claude) make a better decision because this exists?**

Log when:

- The user explicitly asked (`/worklog <topic>` is always a write).
- A correction landed that matters cross-agent.
- An approach was tried and rejected (failure with root cause).
- A decision was made between real alternatives.
- A non-obvious gotcha was hit and resolved that all agents should avoid.

Skip when:

- Ordinary chat or planning that produced no decision.
- Generic summaries of what was edited.
- Implementation details obvious from reading the code.
- Every commit, every file edit, every plan step.
- Single-session model corrections or preferences — auto memory handles those (below).

Aim for 2–5 entries on a busy day, not 50.

## Worklog vs auto memory

| Surface             | Captures                                                          | Scope                          |
| ------------------- | ----------------------------------------------------------------- | ------------------------------ |
| `.worklog/`         | Project decisions, failures, gotchas, open questions. Cross-agent.| Committed, every agent + human |
| Auto memory         | Per-session, per-machine Claude corrections and build insights    | Machine-local, Claude Code only|
| `.claude/rules/*.md`| Path-scoped durable rules (graduated from the log)                | Committed, Claude Code         |
| `AGENTS.md`         | Always-on durable rules (graduated from the log)                  | Committed, all agents          |

If something Claude learned would only matter to Claude on this machine, it belongs in auto memory — Claude writes it itself, no skill needed. `.worklog/` is for facts that outlast the machine and reach Cursor, Codex, and v0 too. Don't duplicate auto memory here.

## Graduation: the loop must close

Log entries are history, not a permanent rules archive. As an entry hardens into a standing project fact, it graduates to a durable surface.

**Candidate when** any of these hold:

- Stable 30+ days with no contradiction or refinement.
- Restated or refined by a later entry (merge both, graduate the result).
- Phrased as a permanent project fact rather than a recent correction.

**Graduation runs inline, inside every `/worklog` regen pass** (step 4). There is no separate command to remember. At append time, while context is hot, check each just-written entry; during any regen, a stable older entry that now qualifies graduates too.

**What graduation does.** A graduated entry:

1. Is rewritten as a positive declarative rule and added to the narrowest surface that reaches every agent that needs it:
   - `AGENTS.md` § Hard nos — universal rules every agent loads every session.
   - `.claude/rules/<topic>.md` — path-scoped rules (Claude Code only) that load when matching files are touched. Pick the file whose `paths:` frontmatter matches; create one if none fits.
   - A skill — when the rule is a multi-step procedure, not a fact.
2. Stays in LOG.md (append-only, never deleted) but gets a `promoted` tag on its heading line: `#### YYYY-MM-DD | \`decision\` | headline [promoted]`. Promoted entries drop out of BRIEF's active sections.

Prefer `.claude/rules/` if only Claude Code needs it and it's path-scoped; use `AGENTS.md` if Cursor, Codex, or v0 also need it.

**Phrasing flip** — graduated rules invert from corrective to declarative:

| LOG phrasing (what happened)                                  | Rule phrasing (what to do)                                                        |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| "Agent built X from scratch instead of the registry block."   | "Treat user-named registry blocks as spec. Install or stop and flag — don't substitute." |
| "shadcn output uses `asChild`; this project is base-ui."      | "This project uses base-ui. Translate `asChild` to `render={<child />}`."          |
| "Burned tokens debugging CSS the code already had right."     | "When a UI bug report contradicts verification, ask for intent before more verification." |

LOG framing logs that something happened. Rule framing tells future agents what to do. The latter is load-bearing; promote it. Apply promotions directly — the user reverts via git if one lands wrong. Don't ask the user to rank or pick.

## Pushback rule

If the user (or another agent's request) proposes an approach that matches a `failure` in the log or contradicts a `decision`, push back before agreeing. BRIEF's **Don't retry** section is the primary trigger — it's in context even for agents reading only the brief; LOG supplies the dated citation.

```
This was tried before and rejected.

On <date>, <attempt>, which led to <outcome>.

Relevant entry:
- <date> — <headline>

I recommend <alternative> instead.
```

Saying "you're right" when the log says otherwise is a failure mode, not politeness.

## Voice

- No filler. No rhetorical openers ("Great question…"). No em dashes.
- Evidence over opinion. State the fact, then cite the file or test count.
- Neutral language. "Bitbucket repo at 2.9 GB / 4 GB cap; commits rejected beyond." Not "we're in big trouble."
- Specific over abstract. Name files, versions, numbers. "138 tests pass after clearing stale `.next/types/`" beats "tests pass."
- Same tone for human and agent readers. The log is one artifact, not two.

## Discipline (both modes)

- **Running `/worklog` is the approval.** Write directly. Don't ask "keep / edit / discard" — that re-gates intent the user already expressed. Show what was written after, so they can revise.
- **Never ask "which moment to capture"** when bare-invoked. Commit to a reading. The significance gate is the filter; be conservative on borderline cases.
- **Never spawn a subagent to scan the transcript.** The main thread has the session loaded; passing the transcript into a subagent prompt overflows its window and reads worse. Run inline.
- **No confirmation prompts** for append, regen, or promotion. The user reverts via git if anything lands wrong.

## Bootstrap and migration

First run in a repo (no `.worklog/` yet), or migrating a pre-rebuild `.worklog/` (a
`WORKLOG.md`, `INDEX.md`, or `LEARNINGS.md`)? Read `references/setup.md` and follow it
first. It is one-time setup, kept out of the main body so the common path stays lean.
