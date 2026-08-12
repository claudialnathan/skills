# Tasks

Shared list for Claudia and any agent working in this repository. Work that shouldn't depend on either of us remembering it.

Read this at the start of a session. Delete a row when it's done — this is a queue, not a record; what happened belongs in `git log`. Add a row rather than leaving something for Claudia to remember, and give every row an owner and a next action.

## Doing

| Task | Owner | Next action |
| :--- | :--- | :--- |
| Exercise `onboard` and `wire-checks` against a real repository | Claudia + agent | All three new skills are written and none has been run. Pick a repository that already has an `AGENTS.md` so `onboard`'s insert-block path gets tested rather than only the create path, and one with React plus a GitHub remote so every `wire-checks` row resolves to something other than not-applicable. |

## Waiting on Claudia

| Decision | What's at stake | Recommendation |
| :--- | :--- | :--- |
| **What `working/animated-sign-in-dialog/` is for** | 516K of a complete Next.js app in the ignored scratch directory, referenced from nowhere in the repo. Everything else in `working/` justified itself on inspection: two motion PDFs that are source material, `resources.md` as a live reading list, and `superseded/` holding the in-flight records. | Say keep or delete and an agent will action it. Nothing reads it, so keeping it costs only the attention of a fresh session that goes looking. |

## Queued

| Task | Owner | Why it matters |
| :--- | :--- | :--- |
| Populate `.agents/skills/` from this repository for OpenReview | agent | OpenReview reads review skills from a target repository's `.agents/skills/`, so this repository's skills could drive its pull-request review. `wire-checks` detects and reports the row; deciding *which* skills belong there, and whether they're mirrored or committed, is unresolved. |

## Parked

| Item | Why parked | What would un-park it |
| :--- | :--- | :--- |
| A standalone command-tier dev3000 takeover skill | The correlated server + browser + network timeline is genuinely wanted, but it costs a dev-server takeover with no documented way back. Declining to fold it into `use-browser` is settled — `.out-of-scope/d3k-inside-use-browser.md`. | Reaching for it during real reproduce-and-diagnose work often enough that the takeover is worth it, or an attach mode appearing upstream. |
| Semantic folders under `skills/` (`design/`, `writing/`, …) | Agent Plugins 1.0.0 §7.1 requires skills to be immediate children of `skills/` and forbids clients from searching deeper. Settled by the flat layout the root manifest now depends on, and the gate FAILs on a nested `SKILL.md`. Grouping lives in `README.md` and `CONTEXT.md`. | A spec revision permitting nesting, and a deliberate decision to stop conforming. |
| A genuinely private draft skill | Everything under `skills/` ships. `metadata: status: wip` marks a skill unfinished but does not withhold it, and there is no longer a folder that could. | Wanting a draft nobody else can install, which would mean moving it out of `skills/` entirely. |
