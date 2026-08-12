# Harness files: what goes where

Read before filling `AGENTS.md` or `CONTEXT.md`. Templates are in [`../assets/`](../assets/).

The `.template.md` suffix on each one is deliberate. A file named exactly `AGENTS.md` sitting in this skill would be read as instructions *for this directory* by an agent working here — both major implementations discover instruction files from the directories they work in. Strip the suffix only at the destination.

| Template | Installs as | Job |
| :--- | :--- | :--- |
| `AGENTS.template.md` | `AGENTS.md` at the target repository root | Intent the code can't show. The substance, for every agent. |
| `CLAUDE.template.md` | `CLAUDE.md` beside it | A one-line import, plus anything true of one vendor only. |
| `CONTEXT.template.md` | `CONTEXT.md` at the root | The project's shared language: one word per concept, and the words not to use. |
| `HANDOVER.template.md` | `HANDOVER.md` at the root | A single live handoff, written on request and cleared once consumed. |
| `TASKS.template.md` | `TASKS.md` at the root | Work neither the owner nor an agent should have to remember. |

## AGENTS.md is the substance

[agents.md](https://agents.md) is an open format: no required fields, no prescribed headings, just Markdown at the repository root. It documents per-package files too — "place another AGENTS.md inside each package".

Where a vendor reads a differently-named file, the documented bridge is an **import directive** in that vendor's file pointing at `AGENTS.md`, so one source serves both. A symlink is documented as the alternative, but it needs Administrator privileges or Developer Mode on Windows, so prefer the import. Note the ceilings on imports: they resolve relative to the importing file, nest to a maximum of four hops, and an import resolving *outside* the working directory triggers a one-time approval dialog — so keep imported files inside the repository.

Only one vendor documents any import or symlink mechanism. Treat the bridge as the vendor-specific part and `AGENTS.md` as the portable part, and never keep the same rule in both files.

**Do not rely on a nested file overriding an ancestor.** The format's own FAQ says the closest `AGENTS.md` wins, but both current implementations **concatenate** from the filesystem root down to the working directory, with closer files merely read last — one documents them as "concatenated into context rather than overriding each other", the other as joined "from the root down". A package-level file therefore adds to the root file rather than replacing it. Write nested files as additions, and put anything that must not be overridden at the root.

One agent strips block-level HTML comments before the file enters context, so a note left for human maintainers costs nothing there. The others don't document doing so, so don't rely on comments being free.

## What does not belong in a project file

**Anything true of the owner rather than the project.** Reply format, table preferences, tone, how questions should be surfaced — identical in every repository they own, so they belong once in the owner's own global configuration. Copied per project, they drift independently and the same rule gets maintained many times over.

**Anything the environment already answers.** Scripts, dependency versions, directory layout, `--help` output. A file that restates them is a copy of a lookup, and it goes stale where the lookup cannot. Point at `package.json` instead of listing its scripts.

**Session history.** What was tried and reverted, what surprised someone, a trap hit once. Those belong in the commit message or a decision log, where they are dated and disposable. In an instruction file they read as standing policy, and later agents work around them.

## Sizing

Every line of a root instruction file is loaded on every turn, whether or not it applies. One agent caps the *combined* size of every discovered instruction file — 32 KiB by default, configurable as `project_doc_max_bytes` — and "stops adding files once the combined size reaches the limit"; its documentation names no warning when that happens. Because files are added from the root down, the file that gets dropped is the nearest and most specific one, pushed out by an oversized ancestor. Another agent loads them in full at any length, and documents only that adherence falls as they grow. Checked 2026-08-12; confirm the current value for the agents a project actually uses.

Three questions per line, in this order — the first one deletes the most:

1. **Would a capable model with this project's tooling get it right without the line?** Library and framework mechanics — which prop a primitive takes, how a build flag behaves, which utility a compiler emits — are answered by the installed package, its types, and its own documentation. A line restating them is a stale copy of a live source, and it *outranks* the correct answer once it drifts, because an instruction file is read as authority.
2. **Does it change behaviour?** An instruction the model already follows by default costs tokens to say nothing. Test by removing it and running the same task.
3. **Can it be found by looking?** If yes, delete it and let the agent look.

Aim for a page. Past that, the usual cause is material that should be a test, a comment at the site, a `CONTEXT.md` term, a `TASKS.md` row, or nothing.

**The first pass on an oversized file is subtraction, not compression.** Rewriting sixty entries shorter keeps sixty entries; the file grew because each one looked individually justified, so the only pass that works is per-line disposition against the questions above. Expect most lines to leave.

## Filling CONTEXT.md

Don't write it upfront in one sitting — that produces general programming vocabulary, which is exactly what doesn't belong. Add a term the first time a word causes a misunderstanding, and record the synonym being retired under `_Avoid_`. It earns its place at about a dozen terms.

The section that pays for itself fastest is **Flagged ambiguities**: one word doing two jobs. Until it is named there, every agent re-disambiguates it on every read.

For several contexts in one repository, keep a `CONTEXT.md` per context beside its code and a root `CONTEXT-MAP.md` listing them and how they relate.
