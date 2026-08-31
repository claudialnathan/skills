# Tasks

Shared list for Claudia and any agent working in this repository. Work that shouldn't depend on either of us remembering it.

Read this at the start of a session. Delete a row when it's done — this is a queue, not a record; what happened belongs in `git log`. Add a row rather than leaving something for Claudia to remember, and give every row an owner and a next action.

## Doing

| Task | Owner | Next action |
| :--- | :--- | :--- |
| Resolve staged skill deletions in `~/repos/templates/default` | Claudia + agent | The retired setup trial coincided with 58 staged deletions under `.agents/skills/` plus a staged `.agents/skills/.gitkeep`. Establish whether they are Claudia's own template cleanup or trial side effects, and restore them only if they are the latter. |

## Waiting on Claudia

| Decision | What's at stake | Recommendation |
| :--- | :--- | :--- |
| **What `working/animated-sign-in-dialog/` is for** | 516K of a complete Next.js app in the ignored scratch directory, referenced from nowhere in the repo. Everything else in `working/` justified itself on inspection: two motion PDFs that are source material, `resources.md` as a live reading list, and `superseded/` holding the in-flight records. | Say keep or delete and an agent will action it. Nothing reads it, so keeping it costs only the attention of a fresh session that goes looking. |

## Queued

| Task | Owner | Why it matters |
| :--- | :--- | :--- |
| Publish a distributable `openreview-next` CLI and document its compatible version range | Claudia + agent | The skill workflow is scanner-backed only when the separately provisioned DiagnosticReport v1 CLI is available; other installations must remain honestly advisor-only and Unverified. |
| Exercise `openreview` against a real codebase in Review, Plan, Reconcile, and execute-plan modes | Claudia + agent | Static checks cannot prove that scanner evidence is triaged well, leverage mapping is proportionate, plans work for a fresh executor, decisions and unconfirmed coverage stay distinct, or execution remains inside the selected plan. |

## Parked

| Item | Why parked | What would un-park it |
| :--- | :--- | :--- |
| A standalone command-tier dev3000 takeover skill | The correlated server + browser + network timeline is genuinely wanted, but it costs a dev-server takeover with no documented way back. Declining to fold it into `use-browser` is settled — `.out-of-scope/d3k-inside-use-browser.md`. | Reaching for it during real reproduce-and-diagnose work often enough that the takeover is worth it, or an attach mode appearing upstream. |
| Semantic folders under `skills/` (`design/`, `writing/`, …) | Agent Plugins 1.0.0 §7.1 requires skills to be immediate children of `skills/` and forbids clients from searching deeper. Settled by the flat layout the root manifest now depends on, and the gate FAILs on a nested `SKILL.md`. Grouping lives in `README.md` and `CONTEXT.md`. | A spec revision permitting nesting, and a deliberate decision to stop conforming. |
| A genuinely private draft skill | Everything under `skills/` ships. `metadata: status: wip` marks a skill unfinished but does not withhold it, and there is no longer a folder that could. | Wanting a draft nobody else can install, which would mean moving it out of `skills/` entirely. |
