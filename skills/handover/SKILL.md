---
name: handover
description: Write or pick up a handoff in a repository's HANDOVER.md. Use when the user asks to hand this off, write a handover, pick up or action the handover, or continue where a previous session left off. Writing replaces the file with one live handoff; picking one up actions it and then clears the file back to empty.
---

# handover

One live handoff at a time, in `HANDOVER.md` at the repository root. A baton, not a log — the file's normal state is empty, and a file that accumulates handoffs has stopped being useful to either direction.

Two directions. The user's words pick which.

| They say | Direction |
| :--- | :--- |
| "hand this off", "write a handover", "I'm stopping here" | **Write** |
| "pick up the handover", "action the handover", "continue where we left off" | **Pick up** |
| Something that could be either | Ask. Writing over an unconsumed handoff and clearing an unread one both lose work. |

If `HANDOVER.md` does not exist, create it at the repository root (`git rev-parse --show-toplevel`) when writing, and say plainly that there is nothing to pick up when reading.

## Write

Replace the file's contents. Do not append: a second handoff below the first means neither is the live one.

**If the file already holds a handoff**, it was never consumed. Say what it covers in one line and ask whether to replace it before writing anything.

Write these sections, and cut any that would be empty rather than filling them with restatement:

- **What you are doing** — the task in two or three sentences, in the project's own vocabulary. Read `CONTEXT.md` first if the repository has one, so the handoff uses the project's words rather than inventing parallel ones.
- **Why** — the constraint or goal that decides the shape of the work. What must survive, and what is deliberately out of scope.
- **State of play** — what exists now. Absolute paths, exact command strings, branches, decisions already made and by whom.
- **Verified / unverified** — split them. What was observed, and how. What was written but never run.
- **Next** — the next concrete action, then the ones after it, numbered.
- **Traps** — only what would mislead a competent reader: a command that looks right and isn't, a name that lies, a service that must be started first.

Leave out what the code and `git log` already say, the narrative of the session that produced it, and standing project rules — those live in `AGENTS.md`. Work with no owner and no next action is a `TASKS.md` row, not a handoff.

Then say the file is written and what it covers, in one line.

## Pick up

1. **Read the whole file** before acting on any part of it.
2. **Restate it in two or three lines** — what you understand the task to be, and the first action you'll take. This is where a handoff written against a repository that has since moved shows itself.
3. **Reconcile it against the repository as it is now.** A handoff is a point-in-time record: a branch may be gone, a file moved, a decision superseded. Where the repository disagrees with the handoff, the repository is what's true — say which lines no longer hold rather than working from them.
4. **Do the work.**
5. **Clear the file** — replace its contents with the empty resting state, keeping the protocol comment.

Clear it only once the work is done or the user has explicitly abandoned it. A file cleared on read and then interrupted has lost the handoff and the work.

**Before clearing, say what is being discarded** — one line naming what the handoff covered. Where `HANDOVER.md` is untracked, clearing is unrecoverable, so check `git ls-files HANDOVER.md` and `git check-ignore HANDOVER.md` and say which case applies in that same line.

The empty state:

```md
# Handover

**Empty.** No handoff is waiting. This is the resting state.
```

Keep whatever protocol comment the file already carried below it.

## Done when

- The file holds exactly one handoff, or is at its empty resting state — never both, never two.
- On write: every section either carries something a cold session needs, or is absent.
- On pick up: the restatement happened before any work, and anything the handoff got wrong about the current repository was named.
- On pick up: the file was cleared only after the work, and what it covered was stated before clearing, along with whether the file was tracked.
