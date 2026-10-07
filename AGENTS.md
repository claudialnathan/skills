# Skills repository

This repository distributes the same skills to Claude, Cursor, and Codex. Keep the repository focused on skills and app packaging.

Read `CONTEXT.md` and any live `HANDOVER.md` when starting work. Preserve pending edits. Verify stale claims against current source or official docs, then correct their owning file.

Do not commit, push, publish, install into an account, or change machine-wide configuration without authorization. Repository edits do not refresh installed app copies.

## Skill authoring

- Put each skill at `skills/<name>/SKILL.md`. Keep supporting references, scripts, and assets inside that directory. Adding a skill needs no manifest entry.
- Follow the [Agent Skills specification](https://agentskills.io/specification): `name` and `description` are required. Keep descriptions specific to what the skill does and when it applies. Use the optional `license`, `compatibility`, `metadata`, and `allowed-tools` fields only when they serve the skill.
- Preserve each skill’s existing invocation policy. `quality-audit` is explicit-only: `disable-model-invocation: true` in `SKILL.md` matches `policy.allow_implicit_invocation: false` in `agents/openai.yaml`. Other skills allow implicit selection.
- `argument-hint` and `disable-model-invocation` are client extensions. Use them for a concrete purpose, not as boilerplate. `metadata.status: wip` marks unfinished work; it does not withhold a skill from installation.
- `agents/openai.yaml` is optional except where needed for invocation policy. Keep `interface.short_description` between 25 and 64 characters. Preserve useful picker metadata rather than duplicating the full description.
- Keep skills self-contained. Cross-references use `skills:<name>`; say what the named skill adds and how to proceed without it. Do not require another skill or link into its files.
- Write only guidance that changes a decision. Put task-specific detail in references loaded when needed. Keep prose factual, sourced, sparse, and physically unwrapped.
- Preserve a skill’s source attribution. Under `## Sources`, hyperlink each person or tool in its existing attribution line.
- Use absolute YYYY-MM-DD for dated source snapshots. When recording Claude Code behavior, record the version actually checked as well.

Before handoff, inspect the diff and validate any changed skill metadata and plugin manifests. When changing Tailwind examples, validate their classes against the project’s installed Tailwind version using the official language server. Exercise meaningful changed behavior with the required tools; packaging checks do not establish runtime success.

## App packaging and releases

- `plugin.json` is the portable manifest used by Cursor and OpenAI. OpenAI picker metadata lives in `extensions.com.openai`; a separate `.codex-plugin/plugin.json` is unnecessary for this package.
- `.claude-plugin/plugin.json` supplies Claude metadata. `.claude-plugin/marketplace.json`, `.cursor-plugin/marketplace.json`, and `.agents/plugins/marketplace.json` each list this root as one plugin named `skills`.
- Keep `version` equal in the portable and Claude manifests. Bump both for a published skill change so version-based caches can detect it. Do not repeat versions in marketplace entries.
- Before pushing, review `README.md` and update its installation instructions and skills table as needed. Keep it focused on installation and skill descriptions.
- Follow the app install paths in `README.md`. Account, plan, repository access, tracked branch, and sync settings control when updates arrive. Confirm the installed version and skill list; do not report publication or app verification from a local check.
- Do not make local mirrors or terminal cache-refresh commands part of the shipping workflow. Do not remove existing user-level mirrors without the owner’s authorization.

## Archive

`archive/<name>/` retains retired skills outside plugin discovery. Move one back to `skills/<name>/` to restore it.
