# ui-preship

`ui-preship` gathers deterministic project-command evidence, classifies the UI
risk surfaces touched by a Git scope, and produces human, JSON, GitHub, or
model-ready handoffs. It never calls a model and never fetches Git history.

> [!IMPORTANT]
> This is an unpublished private pilot at version `0.1.0`. Its retained policy
> is advisory-only with `blockingMode: "none"`. Do not publish the npm package,
> create a release, or create an action tag without a separate owner decision.

## Requirements

- Node.js `>=22 <23`
- Git
- a local Git worktree
- an exact `ui-preship` development dependency when using the initializer

The pilot is dependency-free at runtime. A consumer must install a reviewed
packed tarball because the package is not available from the npm registry:

```bash
npm install --save-dev --save-exact \
  "file:/absolute/path/to/ui-preship-0.1.0.tgz"
```

## Quick start

Preview the complete initializer without writing:

```bash
npx ui-preship init --dry-run --agents --hook --claude --ci \
  --action-ref OWNER/REPOSITORY/actions/ui-preship@FULL_40_CHARACTER_COMMIT_SHA
```

Review the proposed file list, then apply the same options explicitly:

```bash
npx ui-preship init --yes --agents --hook --claude --ci \
  --action-ref OWNER/REPOSITORY/actions/ui-preship@FULL_40_CHARACTER_COMMIT_SHA
```

Edit the generated `ui-preship.config.json` to name the repository commands
that belong in the `quick` and `full` profiles. Then run:

```bash
npm run ui-preship
npx ui-preship check --scope changed --base origin/main --head HEAD --profile full
npx ui-preship review --scope staged
```

`review` is the same assessment rendered as a bounded prompt handoff. It does
not send that prompt anywhere.

## What the initializer changes

Core initialization always:

- creates or validates `ui-preship.config.json`;
- adds `npm run ui-preship` for a quiet staged `quick` check;
- ignores `.artifacts/ui-preship/` and `.ui-preship-debug/`.

Optional flags add:

| Flag | Change |
| :--- | :--- |
| `--agents` | Adds a short managed rule to `AGENTS.md`. |
| `--hook` | Adds a native Git, Husky, or `simple-git-hooks` pre-commit adapter. |
| `--claude` | Adds a Claude Code hook for matching commit attempts. |
| `--ci` | Adds an advisory pull-request workflow using `--action-ref`. |

No optional adapter is installed by default. `--dry-run` and `--yes` are
mutually exclusive and exactly one is required. Initialization is idempotent:
managed content can be regenerated, but opaque existing hooks and workflows are
not overwritten.

Lefthook is detected but requires manual integration because the initializer
will not merge an existing YAML hook graph. Multiple detected hook managers are
treated as ambiguous. The CI action reference must contain a reviewed full
40-character commit SHA; branches and tags are rejected.

## Configuration

The complete machine-readable contract is
[`schema/ui-preship.schema.json`](schema/ui-preship.schema.json). A useful
starting point is:

```json
{
  "$schema": "./node_modules/ui-preship/schema/ui-preship.schema.json",
  "version": 1,
  "blockingMode": "none",
  "packageManager": "npm",
  "workspaces": [],
  "commands": {
    "typecheck": {
      "kind": "script",
      "script": "typecheck",
      "cwd": ".",
      "required": true,
      "timeoutMs": 120000
    },
    "lint": {
      "kind": "script",
      "script": "lint",
      "cwd": ".",
      "required": true,
      "timeoutMs": 120000
    }
  },
  "profiles": {
    "quick": ["typecheck"],
    "full": ["typecheck", "lint"]
  },
  "requiredTools": [],
  "rules": {},
  "suppressions": [],
  "baseline": {
    "path": ".ui-preship-baseline.json"
  },
  "artifacts": {
    "directory": ".artifacts/ui-preship"
  }
}
```

### Top-level fields

| Field | Meaning |
| :--- | :--- |
| `$schema` | Optional editor schema path. The initializer points at the installed package. |
| `version` | Required configuration format version. The only current value is `1`. |
| `blockingMode` | How unsuppressed required deterministic failures affect exit status: `none`, `introduced`, or `all`. |
| `packageManager` | Optional explicit `npm`, `pnpm`, `yarn`, or `bun` selection. |
| `workspaces` | Repository-relative workspace paths that commands may target. Use `[]` to state that a monorepo check is root-only. |
| `commands` | Named deterministic commands. IDs use lowercase letters, digits, and hyphens. |
| `profiles` | Named ordered lists of command IDs. `quick` and `full` are conventions created by the initializer, not hard-coded limits. |
| `requiredTools` | Executables that must resolve on `PATH` before assessment starts. |
| `rules` | Reserved object for future rule configuration. It does not currently change the built-in rules. |
| `suppressions` | Exact, reviewed rule/path exceptions with a reason and optional review date. |
| `baseline.path` | Repository-relative baseline used by `blockingMode: "introduced"`. |
| `artifacts.directory` | Repository-relative destination for redacted JSON reports. |

All configured paths must stay inside the repository.

### Commands

A `script` command runs an existing package script through the detected package
manager:

```json
{
  "kind": "script",
  "script": "test",
  "cwd": ".",
  "required": true,
  "timeoutMs": 180000
}
```

An `argv` command executes an argument array directly:

```json
{
  "kind": "argv",
  "argv": ["node", "scripts/check-generated.mjs"],
  "cwd": ".",
  "required": false,
  "timeoutMs": 60000
}
```

Shell command strings, pipes, redirects, interpolation, and implicit downloads
are not supported. This keeps the executed command visible and reproducible.

`cwd` is repository-relative. A `script` command can instead name a declared
`workspace`; when it does, `cwd` must be `"."` and ui-preship uses the selected
package manager's workspace syntax. If the root `package.json` declares
workspaces, the top-level `workspaces` field must be present even when the
intended value is `[]`.

For a required command, a missing executable or timeout makes the assessment
unassessed. An optional command that cannot run remains explicitly unverified.
A failed required command is deterministic evidence; whether it blocks depends
on `blockingMode`.

### Blocking modes, baselines, and suppressions

- `none` reports every result but creates no effective blocker. This is the
  required policy for the private pilot and the only mode accepted by `init`.
- `introduced` blocks new required deterministic failures. Existing failures
  need a current reviewed baseline.
- `all` blocks every unsuppressed required deterministic failure.

Create or replace a baseline explicitly:

```bash
npx ui-preship baseline update \
  --reason "accepted migration debt" \
  --expires 2026-10-31 \
  --owner "frontend"
```

A baseline is tied to the exact configuration and ruleset hashes. When it
becomes stale, it cannot prove that a failure is pre-existing.

A suppression must match one rule ID and one exact path. It requires a reason;
`reviewAfter`, when present, must be an ISO date in the future to remain active:

```json
{
  "ruleId": "UP002",
  "path": "src/legacy.tsx",
  "reason": "Removed with the checkout migration",
  "reviewAfter": "2026-09-30"
}
```

Suppressions do not accept wildcards and do not hide unrelated findings.

## Scopes and profiles

| Scope | Assessed target |
| :--- | :--- |
| `staged` | The exact Git index diff. This is the default and is used by the pre-commit adapter. |
| `changed` | The merge-base diff between explicit locally available `--base` and `--head` commits. |
| `all` | Every tracked and non-ignored untracked file in the repository. |

`changed` never fetches. Missing or ambiguous history is unassessed, and dirty
worktree files that overlap the requested commit range are rejected rather than
silently mixed into the report.

Profiles select which configured commands run; they do not change the Git
scope. A typical `quick` profile contains fast type or lint checks, while
`full` adds tests, builds, or generated-output validation.

## Stack and UI-risk detection

ui-preship reads root and configured-workspace manifests to record whether the
target declares React, Next.js, Vue, Svelte, Angular, Tailwind, Base UI, or
Radix. It does not install missing packages.

Tailwind is detected when a manifest declares `tailwindcss`,
`@tailwindcss/postcss`, or `@tailwindcss/vite`. That detection is provenance,
not a Tailwind compiler check. To make linting, compilation, or a
language-server check deterministic, add the target repository's existing
package script or executable to `commands`. ui-preship does not invent one.

This skills repository's `bin/tailwind-intellisense-check` is separate
maintainer tooling for validating Tailwind examples in skill Markdown. It is
not automatically applied to consumer repositories.

For an installed Base UI dependency, ui-preship inspects local type
declarations before warning about an added Radix-style `asChild` assumption or
an unproven `data-state` variant. Radix is detected separately; Radix usage does
not activate Base UI-specific warnings.

Changed UI source can activate evidence lenses for:

- layout and responsive behavior;
- motion and interaction lifecycle;
- shared composition and token ownership;
- mutation, rejection, and recovery;
- visual and accessibility review;
- generated public output.

These are review prompts, not claims that a defect exists. Required runtime
evidence remains `unverified` until a person or another system actually
performs it.

## Reports, artifacts, and exit codes

```bash
npx ui-preship check --scope staged --profile quick
npx ui-preship check --scope all --format json
npx ui-preship check --scope changed --base origin/main --head HEAD \
  --profile full --format github
npx ui-preship review --scope staged
npx ui-preship explain UP110
npx ui-preship doctor
```

Formats:

- `human` gives a bounded terminal summary;
- `json` emits the complete redacted assessment;
- `prompt` produces a bounded review handoff;
- `github` emits workflow annotations and writes a step summary when available.

Once the repository and configuration can be resolved, a check writes a
mode-`0600` JSON artifact under `artifacts.directory`, or at the explicit
repository-relative `--artifact` path. An early usage or configuration error
can occur before an artifact path is available.

Exit codes:

- `0`: no effective blocker;
- `1`: at least one effective deterministic blocker;
- `2`: the requested target could not be assessed.

Exit `0` can still include warnings, deterministic failures in advisory mode,
decisions, or unverified runtime evidence. Read the report rather than treating
zero as proof that every UI behavior passed.

Raw command output is omitted from normal artifacts. Explicit local debugging
requires both a gitignored `--debug-log` path and an absolute
`--debug-retain-until` timestamp no more than seven days away. Raw debug capture
is unavailable in GitHub runner mode.

## GitHub Actions

The initializer can create an advisory pull-request workflow with a reviewed
immutable action reference. The reusable action accepts `config`, `scope`,
`base`, `head`, `profile`, and `artifact`, then exposes the
`artifact-path` output.

The action checks out no code itself; the generated workflow performs a
full-history checkout with persisted credentials disabled. The initializer's
configuration remains at `blockingMode: "none"`, and the action does not upload
the artifact. A caller that needs retention must add its own reviewed
artifact-upload step.

External execution from immutable commit
`9f3088b36b19ab931e09c8c955309ce4c88c7d2a` passed on 2026-07-30. The exact
run and inputs are recorded in
[`pilot/2026-07-30-immutable-action.md`](pilot/2026-07-30-immutable-action.md).

## Reproduce the pilot

From `packages/ui-preship` with Node 22:

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm test
node scripts/run-pilot.mjs
```

The pilot packs the package and installs that tarball into five disposable
repositories covering Next.js/Base UI/Tailwind, React without shadcn,
Radix-based shadcn, an explicit workspace, and a non-React project. Recorded
evidence lives under [`pilot/`](pilot/).
