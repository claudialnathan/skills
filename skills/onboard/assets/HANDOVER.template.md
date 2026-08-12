# Handover

**Empty.** No handoff is waiting. This is the resting state, and it is correct — nothing to read, nothing to action.

<!--
## The protocol

This file holds **at most one live handoff**. It is a baton, not a log.

**Writing one** — the owner asks to hand off. Replace everything below the heading with the sections in the shape below, then say the file is written and what it covers. Don't append to an existing handoff: if one is already here, it was never consumed, so say so and ask whether to replace it.

**Picking one up** — the owner asks to read or action the handover. Read it, do the work it describes, and then **clear this file back to the empty state above**, so the next session starts clean. Clear it only after the work it describes is done or explicitly abandoned — a handoff cleared on read and then abandoned mid-task is lost.

If this file is untracked, clearing it is unrecoverable. Say what you are about to discard before you clear it.

## The shape, when filled

### What you are doing
The task in two or three sentences, in this project's own vocabulary (`CONTEXT.md`). Enough that a session with no memory can start without asking.

### Why
The constraint or goal that decides the shape of the work. What must survive, and what is deliberately out of scope.

### State of play
What exists now. Files, branches, commands already run, decisions already made and by whom. Absolute paths, exact command strings.

### Verified / unverified
Split them. What was actually observed, and how. What was written but never run.

### Next
The next concrete action, then the ones after it. Numbered, so progress is visible.

### Traps
Only what would mislead a competent reader: a command that looks right and isn't, a file whose name lies, a dependency that must be started first.

## What doesn't go here

- Anything the code or `git log` already says.
- Narrative of the session that produced the handoff.
- Standing project rules. Those are `AGENTS.md`.
- Work with no owner or no next action. That is a `TASKS.md` row.
-->
