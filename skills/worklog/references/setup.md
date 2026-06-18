# Worklog setup: bootstrap and migration

One-time setup, referenced from `SKILL.md` only when `.worklog/` is absent or a
pre-rebuild layout exists. Kept out of the main body so the common path stays lean.

## Bootstrap (no `.worklog/` yet)

1. Create `.worklog/`.
2. Create `LOG.md` with header:
   ```
   # Worklog

   Append-only project history. Oldest first; newest at the end. Never edit past entries.

   ---
   ```
3. Create `BRIEF.md` with the honest header and no sections yet (sections appear as entries are logged).
4. Create `.worklog/.gitattributes` containing `LOG.md merge=union`.
5. Offer to add the read-path block below to `AGENTS.md` (and append it to `CLAUDE.md` if present):

   ```
   ## Project history
   Before non-trivial work, read .worklog/BRIEF.md (≈100 lines, dated).
   When a topic recurs or feels already-decided, grep .worklog/LOG.md.
   After a real decision, failure, or gotcha, append a dated entry to the END of
   LOG.md matching the format of existing entries. Never edit old entries or BRIEF.md.
   ```

## Legacy migration (pre-rebuild `.worklog/` exists)

- `WORKLOG.md` (newest-first, `#### H:MMam/pm | type | headline` entries) → rewrite to `LOG.md`: reverse to oldest-first, convert each heading to `#### YYYY-MM-DD | \`type\` | headline` (drop time-of-day; take the date from the old `### D MMM YYYY` section header), map `learning`/`correction`/`change` types to the nearest of the four (`learning`→`gotcha`, `correction`→`decision` or `gotcha`, `change`→drop unless it's really a decision), strip `tags:` lines.
- Delete `INDEX.md` (tags and the index are gone — grep replaces them).
- Delete any `LEARNINGS.md` (auto memory replaced it).
- Build `BRIEF.md` from the migrated LOG.
