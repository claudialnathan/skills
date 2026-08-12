# Skills

The owner's portable agent primitives, and the source of truth for them. Skills are the bulk of it; the repository also holds the harness files a real project gets set up with, the checks that keep guidance from going stale, and the tooling that measures it. When something fails in a real project, the fix belongs here, not only there.

Shared language for this repository. Terms are the ones specific to working *on* this repository — general agent and programming vocabulary is deliberately absent.

## Language

### The artifacts

**Skill**:
A directory at `skills/<name>/` containing a `SKILL.md`, plus optional `references/`, `scripts/`, `assets/`, and `agents/openai.yaml`. Always an immediate child of `skills/` — never nested. The unit this repository ships.
_Avoid_: command, plugin, prompt, ruleset

**Reference**:
A file under a skill's `references/` that the `SKILL.md` points at, loaded only when its pointer fires.
_Avoid_: doc, sub-skill, appendix

**Template**:
A portable file under a skill's `assets/` that gets installed into a target repository, carrying a `.template.md` suffix so no agent reads it as instructions in place. `assets/` is the specification's documented home for templates, and keeping them inside the skill is what makes them travel when it is installed on its own.
_Avoid_: boilerplate, scaffold, starter

### Who decides when a skill runs

**Ambient skill**:
A skill that applies whenever work is in its domain, with no one asking for it. `designer`, `optimistic-ui`, `saltintesta`. Named for a talent rather than a task.
_Avoid_: manifest, always-on, passive, auto-loaded

**Action skill**:
A skill the agent selects when the task matches its description, or that the owner names directly. `improve-layout`, `ship`, `zoom-out`.
_Avoid_: model-invoked, task skill

**Command skill**:
A skill only the owner can start, because its cost, timing, or blast radius is the owner's call. `disable-model-invocation: true` in `SKILL.md` and `policy.allow_implicit_invocation: false` in `agents/openai.yaml`. `quality-audit` is the only one.
_Avoid_: user-invoked, manual skill, slash command

### Distribution

**Harness**:
An agent that reads skills — Claude Code, Cursor, or Codex. Each discovers and installs them differently, and none of them is the default.
_Avoid_: client, provider, model, IDE, tool

**Plugin manifest**:
A `plugin.json` that tells a harness what this repository contains. Three of them: the portable one at the root per Agent Plugins 1.0.0, plus `.claude-plugin/` and `.codex-plugin/` for the two harnesses that read their own path. None enumerates the skills — discovery is structural.
_Avoid_: manifest on its own (see Flagged ambiguities), config, plugin file

**Marketplace**:
The publishing surface a harness installs from. Codex reads `.agents/plugins/marketplace.json` here; Claude Code reads one in another repository.
_Avoid_: registry, store, catalog

**Mirror**:
A symlink into this checkout that `scripts/sync-cross-tool` maintains, so a `git pull` updates an installed skill with no reinstall. Flat by name, which is why skill names must stay globally unique.

**Wip skill**:
An unfinished skill, marked by `metadata: status: wip` in its own frontmatter. It still ships and still carries a tier; the marker is a reminder that it isn't as good as it could be yet.
_Avoid_: draft, experimental, `wip/` (there is no such folder — see the layout rule in `AGENTS.md`)
_Avoid_: install, copy, link farm

**Propagation**:
The sequence after a push that makes a change reachable by an installed harness: refresh the marketplace snapshot, then rewrite the plugin cache. A push alone does none of it.
_Avoid_: deploy, release, publish, sync

### Working in a real project

**Target repository**:
The project a skill is used in. It supplies the facts; the skill supplies the discipline.
_Avoid_: consumer, downstream, client repo, host

**Evidence**:
What the target repository actually shows — its source, installed packages, config, computed styles, rendered behavior, command output. What a skill is required to read instead of recalling.
_Avoid_: context, ground truth, source of truth (which names this repository)

**Onboarding**:
Setting up a target repository with the portable harness: `AGENTS.md`, `CONTEXT.md`, `TASKS.md`, `HANDOVER.md`, and whichever checks that project should run.
_Avoid_: init, bootstrap, scaffolding, setup

**Handover**:
The single live handoff in a repository's `HANDOVER.md`, written on request and cleared once acted on. One at a time — it is a baton, not a log.
_Avoid_: handoff doc, briefing, context dump

**Managed block**:
A fenced region (`onboard:start` … `onboard:end`) inside a file the project owns, marking the lines installed from here. Everything outside the fences is the project's, and is never rewritten.
_Avoid_: snippet, injected block, generated section

### Checks

**Gate**:
`scripts/preship-check`, run by the committed pre-commit hook and by CI. It fails on drift rather than reporting it.
_Avoid_: CI, lint, validation, guard

**ui-preship**:
The deterministic UI evidence checker in `packages/ui-preship`. Advisory in a target repository, and the thing a design or review skill leans on for observed rather than asserted UI state.
_Avoid_: the pilot, the package, preship on its own (which names the gate)

**Token audit**:
Zero-model structural measurement of what a skill costs in context. Never a claim about quality or runtime usage.
_Avoid_: eval, benchmark

**Token eval**:
Model-run quality-parity comparison. Approval-gated, never started by a hook or by default CI.
_Avoid_: audit, test

## Relationships

- A **skill** carries exactly one of **ambient** / **action** / **command**, and that choice sets its frontmatter in both `SKILL.md` and `agents/openai.yaml`.
- A **skill** is exposed to a **harness** by a **plugin manifest**, and reaches an installed harness through **propagation** or a **mirror**.
- A **skill** reads **evidence** from the **target repository** and writes changes back to it.
- **Onboarding** installs **templates** into a **target repository**; each one becomes that project's `AGENTS.md`, `CONTEXT.md`, `TASKS.md`, or `HANDOVER.md`.
- The **gate** checks every **plugin manifest** against what is on disk, in both directions.

## Flagged ambiguities

- **"manifest" meant both an always-on skill and a harness `plugin.json`** — resolved on 2026-08-12: the tier is **ambient skill**, and *manifest* is only ever a **plugin manifest**. The old sense is gone from `AGENTS.md` and `README.md`; a skill is never called a manifest.
- **"skill" spans this repository's own and everything else installed.** A session can have hundreds of skills available from other plugins. Say **local skill** for one authored here and **installed skill** for anything else when the distinction carries weight.
- **"reference" means a file and an act.** A `references/*.md` file, versus one skill mentioning another. The file is a **reference**; the mention is a **cross-reference**.
- **`ship` is two skills.** `skills/ship/` is the shipped, general-purpose one. `.claude/skills/ship-skills/` is repo-local and knows this repository's propagation. Name the second one in full whenever both are in play.
- **"check" means this repository's and a target repository's.** The terms above name this repository's own — the **gate**, **ui-preship**, **token audit**, **token eval**. A check a project has running in its CI or its hooks is a **wired check**, and `wire-checks` is about those.
- **"preship" is overloaded** across `scripts/preship-check` (the gate), `packages/ui-preship` (the UI checker), and `.claude/hooks/preship-gate.sh` (the hook that runs the gate). Use **gate**, **ui-preship**, and **hook** rather than the bare prefix.
