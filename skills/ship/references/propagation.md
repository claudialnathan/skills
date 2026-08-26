# Propagating skill repositories

Use this only when the repository being shipped documents distribution surfaces for skills or plugin manifests. Run only its documented commands, and only once the pushed commit is reachable from the source ref each marketplace reads.

For this repository:

```bash
scripts/sync-cross-tool
codex plugin marketplace upgrade claudia-skills
codex plugin add skills@claudia-skills
claude plugin marketplace update claudia
claude plugin update skills@claudia
```

`scripts/sync-cross-tool` updates Cursor's `~/.cursor/skills`, Codex's `~/.agents/skills`, and the repo-local Claude mirror from the checkout. Those mirrors can follow a pushed feature branch immediately.

The Codex and Claude marketplace commands read their configured source ref, normally the default branch. An unmerged PR head is not reachable there: report both plugin-cache refreshes as deferred until merge. For Codex, both `marketplace upgrade` and `plugin add` are required once the commit is reachable.

Each harness needs a new session to rebuild its skill catalog. Do not claim the running session reloaded itself.

If a marketplace is missing, authentication fails, or a harness CLI is unavailable, leave the pushed source unchanged. Report that harness as unpropagated and give the exact recovery command; do not install unrelated plugins or rewrite user configuration.
