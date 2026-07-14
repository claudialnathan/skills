---
name: changelog
description: 'Project decision log — a skimmable, append-only CHANGELOG.md at the repo root recording what changed and why: the reasoning, the alternative that was rejected, the files touched (read from git), and open follow-ups. Committed and team-shared so any teammate or agent (Claude Code, Cursor, Codex) sees the decisions behind the diff, not just the diff. It complements git history, it does not restate it. NOT a release changelog (no Added/Changed/Removed per version) and NOT a memory/rules store (no tags, no index, no graduation to AGENTS.md). Use when the user runs /changelog, asks to log work or record a change and the decisions behind it, or asks to update the changelog.'
---

<!-- Earned against: Opus 4.8, 2026-07-14, v2.1.207 -->

# Changelog

A skimmable, append-only record of what changed and *why*, in `CHANGELOG.md` at the repo root. It answers the question the diff cannot: "what was decided here, what was rejected, and what is still open?" — for the next teammate or agent who opens the repo cold.

**It complements git; it does not restate it.** Git already records what changed and when, and a good commit message carries some of the why. This file exists for the reasoning a diff structurally cannot hold. The file list in each entry is pulled *from* git, never retyped, so the log cannot drift from the code.

Three things git — even with rich commit messages — cannot give a cold reader, and this file exists only for these:

1. **Rejected approaches that left no commit.** You tried it, it failed, you reverted. Nothing in git remembers the dead end.
2. **What is still open.** An unfinished follow-up or an un-updated call site has no commit to attach to.
3. **A curated skim surface.** One screen, newest-first, versus scattered `git log --grep` hits.

Two things it is deliberately **not**:

- **Not a release changelog.** No Added/Changed/Removed per version. If the repo's `CHANGELOG.md` is already release notes, stop and warn — see Bootstrap.
- **Not a memory or rules store.** No tags, no index file, no graduation into `AGENTS.md` or `.claude/rules/`. An entry is written once and stays as history. Skimmability is the whole point; machinery that makes it un-skimmable is out of scope.

## File

```
CHANGELOG.md     repo root. Newest entry at the top.
```

`CHANGELOG.md` lives at the project root (git root if available, else CWD). Older entries archive to `changelog/archive/YYYY-hN.md` once the file spans about six months — see Archiving.

## Entry source: git + session

Each entry is built from two sources, and neither alone is enough:

- **Files** come from the actual diff — `git diff --staged --stat`, `git diff --stat`, or `git show --stat HEAD` for the change in question. This keeps the file list accurate and grep-able. Do not hand-list files from memory of the conversation; read them from git.
- **Why / Decisions / Open** come from the session context. Git can show what changed but not why, what was rejected, or what is left open. That intent lives in the conversation — pull it from there.

If the working tree is clean and nothing is staged, fall back to the most recent commit(s) for Files, and the session for the rest.

## Entry format

The format is fixed so the file is robust across GitHub, Bitbucket, VS Code preview, and the terminal. Reproduce it exactly.

```markdown
## YYYY-MM-DD

### HH:MM · Short headline naming the area changed

One or two lines of *why* — the problem or trigger, not a restatement of the headline.

- **Chose:** the approach taken
- **Rejected:** the alternative and the one-line reason it lost
- **Files:**
  - `path/to/file.ext`: what changed in it
  - `path/to/other.ext`: what changed in it
- **Open:** anything unfinished, follow-ups, or call sites not yet updated (omit if none)

---
```

Worked example:

```markdown
## 2026-05-27

### 14:32 · Rename TenderStatusBadge variants

Old variant names (`warning`, `info`) collided with shadcn defaults, causing silent override when both were imported.

- **Chose:** namespaced as `tender-active`, `tender-closed`, `tender-pending`
- **Rejected:** suffix pattern (`active-status`), too verbose at call sites
- **Files:**
  - `components/tender-status-badge.tsx`: variant map and types
  - `app/globals.css`: new `--color-tender-*` tokens
- **Open:** grep remaining call sites; `app/(dashboard)/tenders/page.tsx` already updated

---
```

Format rules:

- **Newest first.** New entries go at the top of their date section; date sections go newest-first directly under the header block.
- **`---` between every entry.** It renders as a clean horizontal rule everywhere and gives the eye a stop. Tables and box-drawing do not survive terminals — never use them for structure.
- **Time is 24-hour `HH:MM`**, joined to the headline with a middle dot `·` (U+00B7). The middle dot is lighter than a pipe or dash and does not compete with the `---` rules.
- **Headline names the area, not the verb.** "Rename TenderStatusBadge variants" — the reader scans nouns. Avoid "Updated the badge component."
- **Why is prose, 1–2 lines.** It is the sentence(s) directly under the heading, unlabeled. State the trigger or problem, not a paraphrase of the headline.
- **Decisions are `Chose` / `Rejected` pairs.** This forces decision context without bloating into ADR-length prose. Include `Rejected` only when a real alternative existed; a change with no fork can drop it.
- **File paths in backticks.** Grep-able and clickable in most editors. Each file gets a `path: what changed` sub-bullet.
- **`Open` is optional.** Include only when something is genuinely unfinished or a follow-up matters.
- **No em dashes.** Use periods or commas. (The `1–2` en-dash in ranges is fine.)
- **Translate emotion into a neutral claim.** "this was a nightmare" becomes the actual cause. Keep the reader oriented, not entertained.

### When a change touches many files

Past roughly **6 files**, listing each one buries the *why*. Group by directory instead:

```markdown
- **Files:**
  - `components/ui/* (4 files)`: semantic token rename
  - `app/globals.css`: token definitions
```

List individual files only when each carries a distinct, load-bearing change worth calling out.

## Before you log: check Rejected

Before appending, skim the existing `**Rejected:**` lines near the top of the file — they are sparse and newest-first, so this costs almost nothing. If the change you are about to log re-does something a past entry rejected, do not just log it. Surface the earlier entry to the user first:

```
This repeats an approach the log already rejected.

On <date>, <entry headline>: rejected because <reason>.

Confirm you want to proceed, or reconsider.
```

This is the one read worth paying for: the file is open to append anyway, and it stops the repo from silently re-walking a dead end. For the same protection *before* work starts (not only at log time), Bootstrap offers a one-line read-path for `AGENTS.md`.

## Significance gate

Capture **every meaningful unit of work** — roughly one entry per commit or per logical change. But "meaningful" has a floor.

Log when:

- A feature, fix, refactor, or schema/config change landed that a teammate would want context on.
- A decision was made between real alternatives (capture the rejected one).
- A correction or clarified intent landed that a future agent would otherwise repeat.
- A change leaves something open — follow-ups, partial migrations, un-updated call sites.
- The user explicitly asked to log it.

Skip (or fold into a neighbouring entry):

- Pure formatting, lint, or whitespace passes with no behaviour change.
- Typo fixes and comment-only edits.
- Mechanical churn already obvious from the diff with no decision behind it (e.g. a dependency bump with no notes — unless it broke or changed something).

When unsure, prefer one tight entry over several thin ones. The reader should be able to skim a day in under a minute.

### Corrections and miscommunications

A landed correction is worth logging when the next agent would otherwise repeat it. It fits the same format: the misread goes in `Rejected`, the corrected understanding in `Chose`, and the miscommunication itself is the *why*. Keep it neutral — record the corrected intent as a durable fact, not the frustration that surfaced it.

The log is the waystation, not the rules store. When the **same** correction lands a second time, it has outgrown the log: promote it to a standing rule in `CLAUDE.md` / `AGENTS.md` (or a `.claude/rules/` file) so every future session loads it, and stop re-logging it. This skill does not automate that promotion — it is a one-line judgment call, kept manual on purpose.

## Voice

- No filler, no rhetorical openers. Every line adds information.
- Evidence over opinion. "138 tests pass after clearing `.next/types/`" beats "tests pass now."
- Name files, versions, counts. Specific over abstract.
- Same tone for human and agent readers. One artefact, not two.

## Bootstrap

When `/changelog` runs and `CHANGELOG.md` does not exist at the repo root:

1. Create it with this header block:

   ```markdown
   # Changelog

   Newest at top. Per entry: **Why** (1–2 lines) · **Decisions** (chose / rejected) · **Files** · **Open** (optional).
   This is a work/decision log, not release notes. Before redoing prior work, grep for **Rejected:**.

   ---
   ```

2. Then append the first entry under a `## YYYY-MM-DD` section.

**Collision guard.** If `CHANGELOG.md` already exists, read its first ~30 lines before writing. Append only if it is already this work/decision-log format. If it is anything else, **stop and warn the user** instead of appending — a decision entry inside another file's format corrupts both, and that file's tooling may overwrite it. Stop for:

- A **release changelog** — version headings like `## [1.2.0]`, a "Keep a Changelog" / "Semantic Versioning" preamble, or Added/Changed/Removed sections. Release tooling (`changesets`, `semantic-release`, `conventional-changelog`) owns this file.
- **Any other structured log** — a provenance or model-pin ledger, an auto-generated file, or release notes maintained by hand.

When stopping, offer to write to `DEVLOG.md` instead, or ask the user to confirm the file really is meant as a decision log.

**Read-path (optional).** On first setup, offer to add one line to `AGENTS.md` (and `CLAUDE.md` if present) so agents without this skill get the pushback too:

```
Before redoing or reversing prior work, grep CHANGELOG.md for **Rejected:** — if the approach is there, surface that entry before proceeding.
```

It uses grep, not a full read, so it costs nothing until it is relevant.

## Archiving

Keep the live file recent. When `CHANGELOG.md` spans more than about **six months** of date sections:

1. Create `changelog/archive/YYYY-hN.md` (e.g. `changelog/archive/2026-h1.md`).
2. Move the older date sections into it, preserving order (newest-first within the archive too).
3. Leave a one-line pointer at the bottom of `CHANGELOG.md`: `Older entries: changelog/archive/`.

Do not paginate more often than this. The friction of hunting across many small files is what kills the format. Archive on a half-year boundary and no finer.

## Command

- `/changelog` (no args) — distill mode. Inspect the staged/working diff (or recent commit) plus the session, write an entry (or a few, one per logical change) for the work that just happened.
- `/changelog <description>` — directed mode. The user names the change; draft one entry on it, still pulling the Files list from git.

Both modes write directly. Invoking the command is the approval — do not ask "keep / edit / discard." Show what was appended after the write so the user can revise. The file is plain Markdown and git-tracked; nothing is unrecoverable.
