---
name: onboard
description: Set up a repository with the portable agent harness — AGENTS.md, CONTEXT.md, TASKS.md, HANDOVER.md — and report which quality checks it already has wired. Manual-only: it creates and edits files at the root of whatever repository it is run in, so the owner decides when that happens. Run it once per repository, and again to reconcile a repository against the current templates.
disable-model-invocation: true
---

# onboard

Install the portable harness into a target repository, or reconcile one that already has it. Four files, then a report on the quality checks that repository does and doesn't have.

The files are the deliverable. Wiring CI is a separate conversation, and this skill only ever reports on it.

## Before anything

Establish three facts and state them back. Guessing any of them puts files in the wrong place.

1. **The repository root.** `git rev-parse --show-toplevel`. Every file this skill writes goes there and nowhere else — instruction files are read from the filesystem root down to the working directory and **concatenated**, so a file written into a subdirectory adds to its ancestors instead of replacing them. A harness installed one directory down is a harness that fights the one above it.
2. **Which of the four files already exist**, and for each, whether it carries a managed block from a previous run (`onboard:start` … `onboard:end`).
3. **Whether this is install or reconcile.** No existing files is an install. Any existing file is a reconcile, and reconcile touches only managed blocks.

If the working directory is not a git repository, say so and ask where the root is. Do not assume the current directory.

## Then: plan, validate, execute

Never write first and report after. Produce the plan, check it against what is on disk, then act — so a wrong assumption is visible while it is still cheap.

### 1. Plan

List every intended action as one row: the absolute path, whether it is a create / insert-block / update-block / leave-alone, and one clause of why. Nothing else in the plan.

Every action is one of exactly four, and the file's current state picks it:

| On disk | Action | What it does |
| :--- | :--- | :--- |
| Absent | **create** | Write the template from `assets/`, with placeholders filled from what the survey found. No managed block — the file is the project's from the moment it lands. |
| Present, no managed block | **insert-block** | Add only the pointer block, fenced. Change no existing line. |
| Present, managed block from a previous run | **update-block** | Replace the block's contents between its fences. Change nothing outside them. |
| Present, and the project has clearly diverged on purpose | **leave-alone** | Report it and move on. |

### 2. Validate

Check the plan against the filesystem before executing, and drop or correct any row that fails:

- Every target path resolves inside the repository root.
- Every **create** target is genuinely absent — re-check at execution time, not just at plan time.
- Every **update-block** target has exactly one matching pair of fences. Zero pairs means it is an insert; two pairs means a previous run went wrong, so stop and report rather than guessing which to replace.
- No row writes outside the four files, and no row edits CI configuration, dependencies, or a lockfile. If the plan contains one, the plan is wrong.

### 3. Execute

Work the validated rows in order. Create is idempotent by construction: if the target appeared between plan and execution, it becomes an insert-block, not an overwrite. Nothing outside a fence is ever rewritten.

## The four files

Templates are in `assets/`. Fill the bracketed placeholders from the survey — never install a template with its brackets intact, and never install one whose guidance comments still describe a decision the project has already made.

| File | From | Notes |
| :--- | :--- | :--- |
| `AGENTS.md` | `assets/AGENTS.template.md` | The substance, for every agent. Written to the open [agents.md](https://agents.md) format, which requires no fields and no particular headings. |
| `CLAUDE.md` | `assets/CLAUDE.template.md` | A one-line `@AGENTS.md` import, so nothing is duplicated. An import is the documented way to bridge a vendor-specific instruction filename to `AGENTS.md`; a symlink is the documented alternative but needs Administrator privileges or Developer Mode on Windows, so prefer the import. Skip this file entirely where the project's agents all read `AGENTS.md` natively. |
| `CONTEXT.md` | `assets/CONTEXT.template.md` | Install it near-empty. It is filled by incident, one term at a time, and a glossary written upfront fills with general programming vocabulary instead of this project's words. |
| `HANDOVER.md` | `assets/HANDOVER.template.md` | Install at its empty resting state, protocol in a comment. The comment is what makes the file work on its own, with no skill installed. |
| `TASKS.md` | `assets/TASKS.template.md` | Install with empty tables. Seed it only with what the survey actually found. |

Read [references/harness-files.md](references/harness-files.md) before filling `AGENTS.md` or `CONTEXT.md`: it carries what belongs in each file, what belongs in the owner's own global configuration instead, and the sizing constraint.

The managed block, for the insert and update cases:

```md
<!-- onboard:start -->
- Shared language for this project is in `CONTEXT.md`. Use its terms; don't invent synonyms for them.
- Open work and standing follow-ups are in `TASKS.md`. Read it when starting a session, and add to it rather than leaving something for the owner to remember.
- `HANDOVER.md` holds at most one live handoff. Write it when asked to hand off; when asked to pick one up, action it and then clear it.
<!-- onboard:end -->
```

Insert it under the existing file's opening paragraph, never at the top and never at the very bottom. Name only the files that were actually installed.

## Report the checks; wire nothing

Detect and report. Every row is the owner's call, made later, in its own conversation — a skill that adds a workflow file has changed what happens on every future pull request in someone else's repository.

Survey for: a UI evidence check, a framework-specific static analysis or review action, existing workflows under `.github/workflows/`, and whatever pre-commit hook the repository already runs. For each, report one of **wired** (name the file), **available but not wired**, or **not applicable to this stack** with the evidence for that call.

Then stop. Naming a candidate is the deliverable here; installing it is not. `skills:wire-checks` is the other half — it wires named tools and proves they run, in its own conversation. Hand it the survey rather than acting on the survey here. Without that skill, the survey above is the whole of it.

## Done when

- Every file written sits at the repository root, and `git status` shows only the four files plus nothing else.
- No file that already existed has a changed line outside a managed block.
- Every installed template has its placeholders filled and its stale guidance comments removed.
- `CONTEXT.md` and `TASKS.md` went in near-empty rather than pre-populated with invented content.
- The check report names each candidate's state and its evidence, and nothing was wired.
- The plan you showed and the actions you took are the same list, with any row you dropped at validation called out.

## What this skill does not do

- **Write outside the repository root**, or anywhere under a user-level or machine-level configuration directory.
- **Wire CI, add dependencies, or touch a lockfile.** Report only.
- **Overwrite a project's own prose.** Outside a managed block, an existing file's content is the project's.
- **Install the owner's personal preferences.** Reply format, tone and output-shape rules are the same in every repository, so they belong once in the owner's own global configuration — installing them per project is what makes them drift.

For the handoff protocol itself rather than the file, `skills:handover` runs both directions of it. Without that skill the file still works: its comment carries the protocol, and an agent can follow it from the file alone.
