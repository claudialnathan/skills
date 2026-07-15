This repo holds the owner's applied Claude Code skills. Every fact, rule, and opinion here is perishable — nothing holds higher authority than what the code shows today. If a statement here contradicts the code, the code is authoritative; flag the drift before relying on the rule.

## Authoring footgun: skill loader trigger sequences

The skill loader scans file contents for dynamic-context-injection markers regardless of markdown context. Two byte sequences are intercepted as shell commands and break loading: a triple-backtick followed immediately by an exclamation mark, and an exclamation mark followed immediately by a backtick. Code fences, inline-code spans, and block quotes do not protect against the scan. This applies to any file inside a skill directory, not just `SKILL.md`. `bin/preship-check` greps for both; a committed PreToolUse hook runs it on every `git commit` and blocks on failure.

## Publishing footgun: keep the plugin versionless (commit-SHA versioning)

The `skills` plugin carries **no `version` field** — not in `.claude-plugin/plugin.json`, and not in the marketplace entry that points at this repo. That keeps Claude Code in commit-SHA versioning: every pushed commit is a new version, so a marketplace install picks up skill changes on the next `/plugin update` with no manual bump. **Do not add a `version` field.** A `version` string pins the install cache, `/plugin update` then reports "already at the latest version," and pushed changes silently never reach other repos. `bin/preship-check` fails if a `version` field reappears. Propagation after a change: commit → push → `/plugin marketplace update claudia` → `/plugin update skills@claudia`.

## Dates

Use absolute YYYY-MM-DD in skills and references. Relative phrases ("last month", "recently") rot fast. For artifacts tied to Claude Code behavior, also record the Claude Code version from `code.claude.com/docs/en/changelog`, e.g. `2026-07-14, v2.1.207` — the version scopes which features were live when the artifact was written.

## Other

- When a skill name here collides with one at `~/.claude/skills/<name>`, flag it and ask the owner how to proceed — personal scope shadows the plugin, so pushed changes won't win. `bin/preship-check` warns on the collision.
- Authoring never writes machine-scope config (anything under `~/.claude/`, user or enterprise settings, global plugins); machine-scope findings are reported for the owner to action. `bin/sync-cross-tool` manages the cross-tool skill mirrors (`~/.cursor/skills` for Cursor, `~/.agents/skills` for Codex — the location current Codex scans; `~/.codex/skills` is legacy and no longer read) and the repo-local `.claude/skills/`, and is run deliberately by the owner. Cross-harness skill format: Codex and Cursor both read the shared `SKILL.md` + frontmatter directly, so a skill needs no per-harness copy; a `skills/<name>/agents/openai.yaml` is optional and only adds Codex picker metadata (`interface.short_description`) or invocation policy (`policy.allow_implicit_invocation`, the Codex analog of `disable-model-invocation`).
