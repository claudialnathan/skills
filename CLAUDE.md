This repo holds the owner's applied Claude Code skills. Every fact, rule, and opinion here is perishable — nothing holds higher authority than what the code shows today. If a statement here contradicts the code, the code is authoritative; flag the drift before relying on the rule.

## Authoring footgun: skill loader trigger sequences

The skill loader scans file contents for dynamic-context-injection markers regardless of markdown context. Two byte sequences are intercepted as shell commands and break loading: a triple-backtick followed immediately by an exclamation mark, and an exclamation mark followed immediately by a backtick. Code fences, inline-code spans, and block quotes do not protect against the scan. This applies to any file inside a skill directory, not just `SKILL.md`. `bin/preship-check` greps for both; a committed PreToolUse hook runs it on every `git commit` and blocks on failure.

## Authoring rule: Tailwind class strings in Markdown are code

Treat every Tailwind class string in `SKILL.md` and `references/*.md` as executable source, including fenced TSX/HTML examples. Before handing off any skill that adds or changes Tailwind classes, run `bin/tailwind-intellisense-check` against the touched files; before shipping, run the full checker through `bin/preship-check`. Clear every diagnostic from the official Tailwind CSS language server, including `suggestCanonicalClasses` — visual review, documentation review, and reasoning over a class string do not substitute for the language server. Do not silence the rule or hide a non-canonical class in editor settings; use the canonical utility. If prose must show a bad spelling as an anti-pattern, keep it out of a parsed `class`/`className` example.

The repository's `tooling/tailwind-intellisense.css` gives the language server a Tailwind v4 entrypoint for all `skills/**/*.md`; `.vscode/settings.json` applies the same mapping in Cursor/VS Code. `bin/tailwind-intellisense-check` drives the official language server headlessly so agents and the Problems panel use the same diagnostics. CI and clean checkouts install the exact version pinned under `tooling/tailwind-language-server/` with `npm ci --prefix tooling/tailwind-language-server`; contributors may still use the matching Cursor/VS Code extension or set `TAILWIND_LANGUAGE_SERVER_PATH` explicitly.

## Layout footgun: the three harnesses discover skills differently

Skills live flat at `skills/<name>/SKILL.md`, with `skills/wip/<name>/` and `skills/archive/<name>/` as the only grouping folders. Each harness manifest handles discovery on its own terms, so adding a skill takes a different action in each:

- **Claude Code** scans `skills/<name>/` one level deep, and its `"skills"` field *adds* to that scan. `.claude-plugin/plugin.json` therefore lists only `"./skills/wip/"` and `"./skills/archive/"` — the depth the scan misses. A flat skill needs no entry; a skill under a grouping folder stays invisible until its folder is listed.
- **Cursor** replaces default discovery the moment `"skills"` is present at all, so `.cursor-plugin/plugin.json` must list every skill by exact path at whatever depth it sits. **A new skill missing from that array silently never loads in Cursor.**
- **Codex** discovers `SKILL.md` at any depth beneath the single `"skills": "./skills/"` root in `.codex-plugin/plugin.json`; nothing is added per skill.

`bin/preship-check` FAILs on drift in either direction for both the Claude and Cursor manifests (SKILL.md on disk but uncovered; a listed path with no SKILL.md or no directory). The cross-tool mirror is flat — `bin/sync-cross-tool` collapses `wip/` and `archive/` into one link per skill by name, so skill names must stay globally unique across grouping folders.

## Publishing footgun: Claude stays versionless; Codex does not

The Claude `skills` plugin carries **no `version` field** in `.claude-plugin/plugin.json` or in the Claude marketplace entry that points at this repo. That keeps Claude Code in commit-SHA versioning: every commit reachable from the marketplace's configured source ref is a new version, so a marketplace install picks up skill changes on the next `/plugin update` with no manual bump. A version string there pins Claude's install cache, `/plugin update` then reports "already at the latest version," and pushed changes silently never reach other repos. `bin/preship-check` fails if one reappears. Propagation after a change reaches that ref: commit → push → `/plugin marketplace update claudia` → `/plugin update skills@claudia`. A feature-branch push can update working-tree mirrors but does not advance the marketplace cache before merge.

Codex is a separate contract: `.codex-plugin/plugin.json` carries the strict-semver version its manifest validator requires, and `.agents/plugins/marketplace.json` publishes this repo as the `claudia-skills` Git marketplace. A commit on the marketplace's configured source ref propagates through `codex plugin marketplace upgrade claudia-skills`, which refreshes the installed plugin cache from that revision. A PR branch does not advance the marketplace cache; its working-tree mirror under `~/.agents/skills` is the pre-merge proof surface. Do not copy the Codex version into the Claude manifest, and do not remove it from the Codex manifest.

## Authoring rule: invocation tiers

The first question when authoring any skill is who decides when it runs — the situation, the task, or the owner. The answer sets the frontmatter, the name register, and how the description opens. The fields below are Claude Code's; see [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills).

| Tier | Who triggers it | Frontmatter | Name | Description opens with |
|---|---|---|---|---|
| **Manifest** — ambient talent | The situation: work is in the domain, no ask needed | Default invocation. `paths:` globs only where a file type is the real trigger; `user-invocable: false` only where a slash call would be meaningless | Noun; new domain talents take the `<domain>-manifest` suffix | The standing stance — "Apply whenever working with X" |
| **Action** — task | The task: the agent matches intent, or the user asks | None (default) | Verb — `improve-*`, `use-*`, `ship`, `zoom-out` | "This skill should be used when the user asks to <verb>" |
| **Command** — user-only | The owner's judgment about cost, timing, or blast radius | `disable-model-invocation: true`, plus `argument-hint` where it takes arguments | Verb | Its scope, and why it is manual-only |

Current assignment: manifests are `design-polish`, `design-taste`, `optimistic-ui`, `saltintesta`, and wip `shadcn-tailwind`, `flavored-md`; actions are `improve-composition`, `improve-layout`, `improve-motion`, `use-browser`, `ship`, `zoom-out`, and wip `video-to-ascii`; `quality-audit` is the only command. Existing manifest-tier skills keep their names — `-manifest` is the register for new ones.

Parity across harnesses is required and gated: `disable-model-invocation: true` in `SKILL.md` must be matched by `policy.allow_implicit_invocation: false` in that skill's `agents/openai.yaml`, and the reverse. `bin/preship-check` FAILs on either direction. A skill whose triggers are user phrases — `ship` on "commit this", "ship this" — stays an action, because `disable-model-invocation` keeps its description out of the model's context and there is then nothing for those phrases to match.

## Authoring rule: skills stay self-contained — never route to another skill

A shipped skill must not tell the reader to invoke, load, or "use when installed" another skill, and must not condition its behavior on another skill being present. Every skill stands alone — a user who has only this one must get its full value. Naming another skill is not a way around this either. 

Not allowed: "invoke `foo`", "load `foo` when installed", "companion capabilities", "sibling disciplines … when installed", "the specialist skill … defer to it", "auto-loads on the same files". Replace any such routing with the capability stated inline — the skill does it itself, or leans on tools, MCP, or current official docs, none of which are skills. This binds `references/*.md` too, not just `SKILL.md`. `bin/preship-check` does not catch this yet; before shipping a new or edited skill, grep it for `installed`, `invoke`, `sibling`, `companion`, `specialist skill`, `auto-load` and confirm every hit is a file, package, or tool — never a skill.

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

- When a skill name here collides with one at `~/.claude/skills/<name>`, flag it and ask the owner how to proceed — personal scope shadows the plugin, so pushed changes won't win. `bin/preship-check` warns on the collision.
- Authoring never writes machine-scope config (anything under `~/.claude/`, user or enterprise settings, global plugins); machine-scope findings are reported for the owner to action. `bin/sync-cross-tool` manages the cross-tool skill mirrors (`~/.cursor/skills` for Cursor, `~/.agents/skills` for Codex — the location current Codex scans; `~/.codex/skills` is legacy and no longer read) and the repo-local `.claude/skills/`; it is idempotent, runs as part of the owner's ship workflow after every push that touches skills (alongside `codex plugin marketplace upgrade claudia-skills`), and is safe to run standalone. Cross-harness skill format: Codex and Cursor both read the shared `SKILL.md` + frontmatter directly, so a skill needs no per-harness copy; a `skills/<name>/agents/openai.yaml` is optional and only adds Codex picker metadata (`interface.short_description`) or invocation policy (`policy.allow_implicit_invocation`, the Codex analog of `disable-model-invocation`).
