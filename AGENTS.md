This repo holds the owner's applied agent skills. Every fact, rule, and opinion here is perishable — nothing holds higher authority than what the code shows today. If a statement here contradicts the code, the code is authoritative; flag the drift before relying on the rule.

Three files carry state this one doesn't:

- **`CONTEXT.md`** — the shared language for this repository. Use its terms, and add one the first time a word causes a misunderstanding.
- **`TASKS.md`** — open work, decisions waiting on the owner, and parked items. Read it when starting a session, and raise the rows that bear on what's being asked. Add a row rather than leaving something for the owner to remember; delete a row when it's done.

  Every row is perishable, so reading it is not the whole duty. Check each one against the repository as it is now and say, unprompted, when a row has gone stale, when the work turns out to be already done, when a "Waiting on Claudia" decision has sat long enough to be blocking something, or when a row has been carried across sessions without progress. The owner asked to be reminded of what they forget, so raising a forgotten row is the job rather than an interruption — but raise it once, with the current state and a recommendation, not as a standing preamble on every reply.
- **`HANDOVER.md`** — at most one live handoff. Empty is its normal state.

Standing refusals live in `.out-of-scope/`. Check it before proposing something structural, so a settled "no" isn't re-litigated from scratch.

## Authoring footgun: skill loader trigger sequences

The skill loader scans file contents for dynamic-context-injection markers regardless of markdown context. Two byte sequences are intercepted as shell commands and break loading: a triple-backtick followed immediately by an exclamation mark, and an exclamation mark followed immediately by a backtick. Code fences, inline-code spans, and block quotes do not protect against the scan. This applies to any file inside a skill directory, not just `SKILL.md`. `scripts/preship-check` greps for both; a committed PreToolUse hook runs it on every `git commit` and blocks on failure.

## Authoring rule: Tailwind class strings in Markdown are code

Treat every Tailwind class string in `SKILL.md` and `references/*.md` as executable source, including fenced TSX/HTML examples. Before handing off any skill that adds or changes Tailwind classes, run `scripts/tailwind-intellisense-check` against the touched files; before shipping, run the full checker through `scripts/preship-check`. Clear every diagnostic from the official Tailwind CSS language server, including `suggestCanonicalClasses` — visual review, documentation review, and reasoning over a class string do not substitute for the language server. Do not silence the rule or hide a non-canonical class in editor settings; use the canonical utility. If prose must show a bad spelling as an anti-pattern, keep it out of a parsed `class`/`className` example.

The repository's `tooling/tailwind-intellisense.css` gives the language server a Tailwind v4 entrypoint for all `skills/**/*.md`; `.vscode/settings.json` applies the same mapping in Cursor/VS Code. `scripts/tailwind-intellisense-check` drives the official language server headlessly so agents and the Problems panel use the same diagnostics. CI and clean checkouts install the exact version pinned under `tooling/tailwind-language-server/` with `npm ci --prefix tooling/tailwind-language-server`; contributors may still use the matching Cursor/VS Code extension or set `TAILWIND_LANGUAGE_SERVER_PATH` explicitly.

## Layout rule: skills are flat, and no manifest enumerates them

Every skill is at `skills/<name>/SKILL.md`, with nothing deeper. [Agent Plugins 1.0.0](https://github.com/agentplugins/agent-plugins-spec) §7.1 fixes discovery at the immediate children of `skills/` and states clients MUST NOT search deeper descendants, so a grouping folder would make its contents invisible to any conforming client. Adding a skill is therefore a directory and a `SKILL.md`, and no manifest edit at all. An unfinished skill carries `metadata: status: wip` in its own frontmatter — `metadata` is one of the six keys the Agent Skills specification permits, so the signal travels with the skill instead of living in a path.

Three manifests coexist because the harnesses read different paths:

- **`plugin.json` at the root** is the portable one, per Agent Plugins 1.0.0 §5.1. Its schema is closed — `additionalProperties: false`, required `["$schema", "name"]` — so it is metadata only and **cannot** declare `"skills"`. Cursor documents that a conforming plugin loads with no changes; it is also what any future conforming client reads. Deliberately carries no `version`.
- **`.claude-plugin/plugin.json`** is what Claude Code reads. Its `"skills"` field *adds* to an always-on scan of `skills/<name>/`, so a flat repository needs no entries — and it stays versionless (see below).
- **`.codex-plugin/plugin.json`** is what Codex reads, with `"skills": "./skills/"` and the strict semver its validator requires.

`scripts/preship-check` FAILs on a nested `SKILL.md`, on a root manifest that is missing, mis-schemaed, or carries any key outside the ten, and on a Claude entry pointing at a path with no `SKILL.md`. The cross-tool mirror is flat by name, so skill names must stay globally unique.

## Publishing footgun: Claude stays versionless; Codex does not

The Claude `skills` plugin carries **no `version` field** in `.claude-plugin/plugin.json` or in the Claude marketplace entry that points at this repo. That keeps Claude Code in commit-SHA versioning: every commit reachable from the marketplace's configured source ref is a new version, so a marketplace install picks up skill changes on the next `/plugin update` with no manual bump. A version string there pins Claude's install cache, `/plugin update` then reports "already at the latest version," and pushed changes silently never reach other repos. `scripts/preship-check` fails if one reappears. The root `plugin.json` is versionless for the same reason, kept as a warning rather than a failure because no client that reads it pins on version today. Propagation after a change reaches that ref: commit → push → `/plugin marketplace update claudia` → `/plugin update skills@claudia`. A feature-branch push can update working-tree mirrors but does not advance the marketplace cache before merge.

Codex is a separate contract: `.codex-plugin/plugin.json` carries the strict-semver version its manifest validator requires, and `.agents/plugins/marketplace.json` publishes this repo as the `claudia-skills` Git marketplace. Once a commit is reachable from the marketplace's configured source ref, run `codex plugin marketplace upgrade claudia-skills` to refresh the Git marketplace snapshot, then `codex plugin add skills@claudia-skills` to rewrite the installed plugin cache from that snapshot. A PR branch does not advance the marketplace cache; its working-tree mirror under `~/.agents/skills` is the pre-merge proof surface. Do not copy the Codex version into the Claude manifest, and do not remove it from the Codex manifest.

## Authoring rule: invocation tiers

The first question when authoring any skill is who decides when it runs — the situation, the task, or the owner. The answer sets the frontmatter, the name register, and how the description opens.

**Write frontmatter to the open specification first** ([agentskills.io/specification](https://agentskills.io/specification)), because it is the only field set every agent reads. It permits exactly six keys — `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools` — of which the first two are required:

- `name` — max 64 characters, lowercase letters, digits and hyphens only, no leading or trailing hyphen, no `--`, and it **must match the parent directory name**.
- `description` — max 1024 characters, and it must say both what the skill does *and* when to use it, carrying the keywords that identify a matching task.

One vendor's documentation says every field is optional and that `name` defaults to the directory name. Author to the specification, which is stricter: always write `name`, and always match the directory.

| Tier | Who triggers it | Invocation control | Name | Description opens with |
|---|---|---|---|---|
| **Ambient** — a talent, not a task | The situation: work is in the domain, no ask needed | None. Default invocation is implicit-capable everywhere | An agent-name noun — the talent, not the task (`designer`) | The standing stance — "Apply whenever working with X" |
| **Action** — task | The task: the agent matches intent, or the user asks | None (default) | Verb — `improve-*`, `use-*`, `ship`, `zoom-out` | "This skill should be used when the user asks to <verb>" |
| **Command** — user-only | The owner's judgment about cost, timing, or blast radius | Both vendor keys, below | Verb | Its scope, and why it is manual-only |

**The specification defines no field for invocation control**, so the command tier can only be expressed with per-vendor keys, and it takes two of them to hold across the agents this repo ships to. That is why parity is gated rather than merely recommended.

Any key outside the specification's six is a vendor extension, and is documented to fail packaging on the vendor that does not define it — so each one is a portability cost paid deliberately. Two are in use here: `disable-model-invocation` (unavoidable; nothing in the specification expresses the command tier) and `argument-hint` (cosmetic; drop it from a new skill unless the argument is genuinely unguessable). Anything else — a `when_to_use` key, a `paths:` glob, a `model:` or `effort:` pin — stays out.

Current assignment: ambient skills are `designer`, `optimistic-ui`, `saltintesta`, `shadcn-tailwind`, `flavored-md`; actions are `handover`, `improve-composition`, `improve-layout`, `improve-motion`, `inspect-web`, `use-browser`, `ship`, `wire-checks`, `zoom-out`, `video-to-ascii`; commands are `onboard` and `quality-audit`. `optimistic-ui` and `saltintesta` keep their names — the agent-name register applies to new ambient skills. `shadcn-tailwind`, `flavored-md` and `video-to-ascii` carry `metadata: status: wip`, which marks them unfinished without changing their tier.

**Tier is never called a manifest.** A *manifest* in this repository is only ever a harness's `plugin.json`. The tier is *ambient*, *action*, or *command* — see `CONTEXT.md`.

Parity across harnesses is required and gated: `disable-model-invocation: true` in `SKILL.md` must be matched by `policy.allow_implicit_invocation: false` in that skill's `agents/openai.yaml`, and the reverse. `scripts/preship-check` FAILs on either direction. A skill whose triggers are user phrases — `ship` on "commit this", "ship this" — stays an action, because `disable-model-invocation` keeps its description out of the model's context and there is then nothing for those phrases to match.

## Authoring rule: a skill may name another, in one form only

The installers let a user take a single skill rather than the set, so no skill may *depend* on another being present. Naming one is allowed; requiring one is not.

A cross-reference uses the `skills:<name>` form and nothing else:

- **Never a path** into another skill's folder (`../other-skill/references/x.md`). Shared reference material lives inside the skill that owns it, and another skill reaches it by naming the skill, not by linking through the filesystem. A path also breaks the moment the set is installed à la carte.
- **Never a bare `/name`.** It collides with commands bundled by the harness (`/code-review`, `/init`), so it cannot be validated and may resolve to something else entirely.
- **Accelerant, never dependency.** State what the named skill adds, then state what this skill does without it, in the same breath. A skill whose instructions stall when the named one is absent is broken, not composed.
- **Never name a command-tier skill.** Its description is withheld from the model, so nothing but the owner can reach it and the reference would be dead on arrival.

`scripts/preship-check` validates every `skills:<name>` reference against what is on disk and FAILs on a dangling one. Before shipping, also confirm no wording has crept back in that makes a named skill load-bearing — "requires", "when installed", "defer to it", "auto-loads on the same files".

## Authoring rule: steer with sourced guidance, never with stance

A skill supplies structure, process, and steering toward a gold-standard output. It does not take positions. Do not assert as true anything the supplied docs, sources, tool output, or the owner did not state, and do not write in a register that reads as conviction rather than instruction.

Not allowed:

- **Belief and principle declarations.** "Runtime truth comes from a browser, not from source." "X is the discipline of earning Y." "That word is the point of the whole skill."
- **Unsourced claims about how agents or people behave.** "Most reported-as-done work is only checked at compile time." "This is where an agent differs from a careful engineer."
- **Rhetoric standing in for instruction.** "That is theatre." "Worse than no claim." Copywriting cadence, escalating triads, and a closing flourish all belong outside a skill.
- **One session's debugging promoted to doctrine.** A trap hit while authoring is not documented tool behavior. If the tool's docs do not say it, it does not go in.

Allowed: operational instruction ("load X first", "attach to a running dev server"); facts read from the tool, its docs, or project config at authoring time; established external practice with a link; and this repository's own stated conventions.

The reason is asymmetry of exposure. Authoring happens rarely and from one session; the skill is then read by agents across many sessions and a moving tool surface. A position encoded here outlives the evidence for it, and steers work that was never a matter of principle. Default to pointing at the maintained source. Where a stance is genuinely wanted, the owner asks for it.

Before shipping, reread each paragraph and ask what its source is. If the answer is "it seemed right while writing," cut it or replace it with the pointer.

## Authoring rule: hyperlink Sources in footnotes

A skill's attribution is one line at the bottom of `SKILL.md` under `## Sources`, in this exact shape:

> This skill draws inspiration from publicly available content from [Person](main-domain), [Person](main-domain), and [Tool](main-domain).

Hyperlink the person, or the tool if it is not a person.

## Dates

Use absolute YYYY-MM-DD in skills and references. Relative phrases ("last month", "recently") rot fast. For artifacts tied to Claude Code behavior, also record the Claude Code version from `code.claude.com/docs/en/changelog`, e.g. `2026-07-14, v2.1.207` — the version scopes which features were live when the artifact was written.

## Other

- Authoring never writes machine-scope config (anything under `~/.claude/`, user or enterprise settings, global plugins); machine-scope findings are reported for the owner to action. `scripts/sync-cross-tool` manages the cross-tool skill mirrors (`~/.cursor/skills` for Cursor, `~/.agents/skills` for Codex — the location current Codex scans; `~/.codex/skills` is legacy and no longer read) and the repo-local `.claude/skills/`; it is idempotent, runs as part of the owner's ship workflow after every push that touches skills (alongside `codex plugin marketplace upgrade claudia-skills` followed by `codex plugin add skills@claudia-skills`), and is safe to run standalone. Cross-harness skill format: Codex and Cursor both read the shared `SKILL.md` + frontmatter directly, so a skill needs no per-harness copy; a `skills/<name>/agents/openai.yaml` is optional and only adds Codex picker metadata (`interface.short_description`) or invocation policy (`policy.allow_implicit_invocation`, the Codex analog of `disable-model-invocation`).
