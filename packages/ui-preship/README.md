# ui-preship

`ui-preship` is a private pilot CLI that gathers deterministic project-command
evidence, classifies changed UI risk surfaces, and produces human, JSON,
GitHub, or model-ready handoffs. It never calls a model and never fetches Git
history.

The package is intentionally unpublished at version `0.1.0`. Its default
`blockingMode` is `none`: failures remain visible while the package is private
without becoming blockers.

## Commands

```sh
ui-preship init --dry-run
ui-preship init --yes --agents --hook --claude
ui-preship init --yes --ci \
  --action-ref OWNER/REPOSITORY/actions/ui-preship@FULL_COMMIT_SHA
ui-preship check --scope staged --profile quick
ui-preship check --scope changed --base origin/main --head HEAD --profile full
ui-preship check --scope all --format json
ui-preship review --scope staged --format prompt
ui-preship explain UP110
ui-preship baseline update --reason "accepted debt" --expires 2026-10-31
ui-preship doctor
```

The CLI exits `0` when no finding is an effective blocker, `1` for an effective
deterministic blocker, and `2` when the requested target could not be assessed.
Exit `0` can still contain warnings, deterministic failures in advisory mode,
or unverified runtime evidence.

The configuration schema is in `schema/ui-preship.schema.json`. Every configured
command is either a package script or an argv array; shell command strings and
value interpolation are not supported.

## Private initializer

The initializer requires the packed private package to be installed as an
exact development dependency before it runs. It adds an advisory
`blockingMode: none` configuration and the repository script, and can
optionally add:

- the short `AGENTS.md` project rule;
- a native, Husky, or simple-git-hooks pre-commit adapter;
- a Claude Code command hook for commit attempts;
- an advisory pull-request workflow using a reviewed full-SHA action reference.

No project rule or adapter installs by default. Each one requires its explicit
initializer flag.

`--dry-run` reports the exact create/update set without writing. `--yes`
applies it non-interactively. Existing opaque hooks and workflows are never
overwritten; Lefthook is recognized but remains a manual integration during
the private pilot because the initializer will not merge an existing YAML hook
graph.

## Private pilot

Run tests and reproduce the five-shape consumer pilot with Node 22:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
node scripts/run-pilot.mjs
```

The 2026-07-29 packed-package pilot is recorded under `pilot/`. On 2026-07-30,
pull request #4 also executed the action externally from immutable commit
`9f3088b36b19ab931e09c8c955309ce4c88c7d2a`; the dated evidence report records
the GitHub Actions run, exact base/head inputs, artifact output, and zero
effective blockers.

The Checkpoint 5 owner disposition retains the package as private and
advisory-only. Do not publish the npm package or create a release/action tag
without a separate future owner decision after external immutable-action
evidence.
