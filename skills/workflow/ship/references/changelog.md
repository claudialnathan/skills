# CHANGELOG.md — decision-log format

Referenced by `land`'s "Log the decision" step. `CHANGELOG.md` is a skimmable, append-only record of what changed and *why*, at the repo root. It complements git; it does not restate it. Each entry's file list is read *from* git, never retyped, so the log can't drift from the code.

It exists only for what a diff — even with a rich commit message — structurally cannot give a cold reader:

1. **A rejected approach that left no commit.** You tried it, it failed, you reverted. Nothing in git remembers the dead end.
2. **What is still open.** An unfinished follow-up or an un-updated call site has no commit to attach to.
3. **A curated skim surface.** One screen, newest-first, versus scattered `git log --grep` hits.

It is deliberately **not** a release changelog (no Added/Changed/Removed per version) and **not** a memory or rules store (no tags, no index, no graduation into `AGENTS.md`).

## Entry source

- **Files** come from the diff — `git diff --staged --stat`, `git diff --stat`, or `git show --stat HEAD`. Never hand-list from memory.
- **Why / Chose / Rejected / Open** come from the session — git can't show them.

## Format (reproduce exactly)

```markdown
## YYYY-MM-DD

### HH:MM · Short headline naming the area changed

One or two lines of *why* — the problem or trigger, not a restatement of the headline.

- **Chose:** the approach taken
- **Rejected:** the alternative and the one-line reason it lost
- **Files:**
  - `path/to/file.ext`: what changed in it
- **Open:** anything unfinished or follow-ups (omit if none)

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
- **Open:** grep remaining call sites; dashboard page already updated

---
```

Rules:

- **Newest first.** New entries at the top of their date section; date sections newest-first, directly under the header block.
- **`---` between every entry** — renders as a clean horizontal rule everywhere. Tables and box-drawing don't survive terminals; never use them for structure.
- **Time is 24-hour `HH:MM`**, joined to the headline with a middle dot `·` (U+00B7).
- **Headline names the area, not the verb** — the reader scans nouns. "Rename TenderStatusBadge variants", not "Updated the badge".
- **Why is 1–2 lines of prose**, unlabeled, under the heading — the trigger or problem, not a paraphrase of the headline.
- **`Chose` / `Rejected` pairs** force decision context without ADR-length bloat. Include `Rejected` only when a real alternative existed.
- **File paths in backticks**, each with a `path: what changed` sub-bullet. Past roughly 6 files, group by directory (`components/ui/* (4 files): semantic token rename`) and list individual files only when each carries a distinct, load-bearing change.
- **`Open` is optional** — include only when something is genuinely unfinished.
- **Neutral voice.** Evidence over opinion ("138 tests pass after clearing `.next/types/`" beats "tests pass now"). Name files, versions, counts. No em dashes; translate emotion into the actual cause. Same tone for human and agent readers.

## Significance gate

Log when a feature, fix, refactor, or schema/config change landed that a teammate would want context on; a decision was made between real alternatives (capture the rejected one); a correction landed a future agent would otherwise repeat (the misread goes in `Rejected`, the corrected intent in `Chose`); or something is left open. Skip pure formatting or lint passes, typos, comment-only edits, and mechanical churn already obvious from the diff. When unsure, prefer one tight entry over several thin ones — a reader should skim a day in under a minute.

## Before you log: check Rejected

Skim the existing `**Rejected:**` lines near the top of the file — they're sparse and newest-first, so it costs almost nothing. If the change re-does something already rejected, surface that entry to the user before proceeding, then let them confirm or reconsider. This is the one read worth paying for: it stops the repo from silently re-walking a dead end.

## Bootstrap

If `CHANGELOG.md` doesn't exist at the repo root (git root if available, else CWD), create it with this header block, then append the first entry under a `## YYYY-MM-DD` section:

```markdown
# Changelog

Newest at top. Per entry: **Why** (1–2 lines) · **Chose / Rejected** · **Files** · **Open** (optional).
This is a work/decision log, not release notes. Before redoing prior work, grep for **Rejected:**.

---
```

**Collision guard.** If `CHANGELOG.md` already exists, read its first ~30 lines before writing. Append only if it's already this work/decision-log format. If it's a **release changelog** (version headings like `## [1.2.0]`, a "Keep a Changelog" / SemVer preamble, or Added/Changed/Removed sections) or any other structured, auto-generated, or hand-maintained release log, **stop and warn the user** instead of appending — a decision entry inside another file's format corrupts both, and that file's tooling may overwrite it. Offer `DEVLOG.md` instead, or ask the user to confirm the file is meant as a decision log.

## Archiving

When `CHANGELOG.md` spans more than about **six months** of date sections, create `changelog/archive/YYYY-hN.md` (e.g. `changelog/archive/2026-h1.md`), move the older date sections into it (newest-first there too), and leave a one-line pointer at the bottom of `CHANGELOG.md`: `Older entries: changelog/archive/`. Don't paginate finer than a half-year boundary — hunting across many small files is what kills the format.
