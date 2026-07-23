This repo holds the owner's applied Claude Code skills. Every fact, rule, and opinion here is perishable — nothing holds higher authority than what the code shows today. If a statement here contradicts the code, the code is authoritative; flag the drift before relying on the rule.

## Authoring footgun: skill loader trigger sequences

The skill loader scans file contents for dynamic-context-injection markers regardless of markdown context. Two byte sequences are intercepted as shell commands and break loading: a triple-backtick followed immediately by an exclamation mark, and an exclamation mark followed immediately by a backtick. Code fences, inline-code spans, and block quotes do not protect against the scan. This applies to any file inside a skill directory, not just `SKILL.md`. `bin/preship-check` greps for both; a committed PreToolUse hook runs it on every `git commit` and blocks on failure.

## Layout footgun: category folders require an explicit `skills:` array

Skills are grouped into category folders — `skills/<category>/<name>/SKILL.md` (categories: `design`, `engineering`, `writing`, `workflow`). Claude Code auto-discovery scans only one level (`skills/<name>/`), so it finds **nothing** under category folders. `.claude-plugin/plugin.json` therefore carries an explicit `skills:` array listing every nested path (`"./skills/<category>/<name>"`); the manifest paths *supplement* discovery. **A new skill that isn't added to that array silently never loads.** `bin/preship-check` FAILs on any drift in either direction (SKILL.md on disk but unlisted; listed path with no SKILL.md). The cross-tool mirror is still flat — `bin/sync-cross-tool` collapses the category folders into one link per skill by name, so skill names must stay globally unique across categories.

## Publishing footgun: Claude stays versionless; Codex does not

The Claude `skills` plugin carries **no `version` field** in `.claude-plugin/plugin.json` or in the Claude marketplace entry that points at this repo. That keeps Claude Code in commit-SHA versioning: every pushed commit is a new version, so a marketplace install picks up skill changes on the next `/plugin update` with no manual bump. A version string there pins Claude's install cache, `/plugin update` then reports "already at the latest version," and pushed changes silently never reach other repos. `bin/preship-check` fails if one reappears. Propagation after a change: commit → push → `/plugin marketplace update claudia` → `/plugin update skills@claudia`.

Codex is a separate contract: `.codex-plugin/plugin.json` carries the strict-semver version its manifest validator requires, and `.agents/plugins/marketplace.json` publishes this repo as the `claudia-skills` Git marketplace. A pushed commit propagates through `codex plugin marketplace upgrade claudia-skills`, which refreshes the installed plugin cache from the new marketplace revision. Do not copy the Codex version into the Claude manifest, and do not remove it from the Codex manifest.

## Authoring rule: skills stay self-contained — never route to another skill

A shipped skill must not tell the reader to invoke, load, or "use when installed" another skill, and must not condition its behavior on another skill being present. Every skill stands alone — a user who has only this one must get its full value. Naming another skill is allowed **only as reference**: a Sources/credit footnote, or provenance ("distilled from X's original skill"). Not allowed: "invoke `foo`", "load `foo` when installed", "companion capabilities", "sibling disciplines … when installed", "the specialist skill … defer to it", "auto-loads on the same files". Replace any such routing with the capability stated inline — the skill does it itself, or leans on tools, MCP, or current official docs, none of which are skills. This binds `references/*.md` too, not just `SKILL.md`. `bin/preship-check` does not catch this yet; before shipping a new or edited skill, grep it for `installed`, `invoke`, `sibling`, `companion`, `specialist skill`, `auto-load` and confirm every hit is a file, package, or tool — never a skill.

## Dates

Use absolute YYYY-MM-DD in skills and references. Relative phrases ("last month", "recently") rot fast. For artifacts tied to Claude Code behavior, also record the Claude Code version from `code.claude.com/docs/en/changelog`, e.g. `2026-07-14, v2.1.207` — the version scopes which features were live when the artifact was written.

## Other

- When a skill name here collides with one at `~/.claude/skills/<name>`, flag it and ask the owner how to proceed — personal scope shadows the plugin, so pushed changes won't win. `bin/preship-check` warns on the collision.
- Authoring never writes machine-scope config (anything under `~/.claude/`, user or enterprise settings, global plugins); machine-scope findings are reported for the owner to action. `bin/sync-cross-tool` manages the cross-tool skill mirrors (`~/.cursor/skills` for Cursor, `~/.agents/skills` for Codex — the location current Codex scans; `~/.codex/skills` is legacy and no longer read) and the repo-local `.claude/skills/`, and is run deliberately by the owner. Cross-harness skill format: Codex and Cursor both read the shared `SKILL.md` + frontmatter directly, so a skill needs no per-harness copy; a `skills/<category>/<name>/agents/openai.yaml` is optional and only adds Codex picker metadata (`interface.short_description`) or invocation policy (`policy.allow_implicit_invocation`, the Codex analog of `disable-model-invocation`).
