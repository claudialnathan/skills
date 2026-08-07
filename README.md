# Skills

Agent skills that add meaningful value beyond what an unaided model does out of the box, for work that matters to me.

A frontier model is very competent at most things, but its default in any domain is the competent average version of the thing. Each skill here is an effort to drag the model off that median in a chosen direction: narrow, stack-specific disciplines with explicit boundaries and proof obligations.

They carry my taste and intent, stack-specific decisions, failures observed in real work, and the evidence I require before calling work done. The agent gets more specific instructions for the work I care about without putting all of that back into every prompt.

## How it fits together

```text
+---------------------------------------------+
| Self-contained skills                       |
| judgment / boundaries / proof obligations   |
+----------------------+----------------------+
                       |
       +---------------+---------------+
       v               v               v
  Claude Code        Cursor          Codex
       +---------------+---------------+
                       |
                       v
            Work in target repository
                       |
                       v
               Project evidence
     source / packages / commands / rendered behavior
```

The skill supplies the discipline; the target repository supplies the facts. Manifests expose the same skill source to each agent, while hooks, fixtures, CI, and evaluation tools make broken or stale guidance visible.

Each skill is self-contained. Install the repository once, then let the agent select a relevant skill from the task or name the skill directly.

## Use a skill

After installation, start a new agent session so its skill catalog is rebuilt. Then ask normally:

```text
Use improve-layout to repair the mobile overflow without changing the design.
Run quality-audit against this repository and report only verified findings.
Run quality-audit with the launch profile and get this deployment ready.
Use ship to commit this change and stabilize the pull request, but do not merge it.
```

The catalog below is grouped by who decides when a skill runs. Manifests are ambient: they apply whenever the work is in their domain, without being asked for. Actions activate from their descriptions when the task matches, or when you name one. Commands only ever run when you invoke them — `quality-audit` is the one command, because a whole-repository audit is too broad to start implicitly.

The skills inspect and follow the target project's own source, installed packages, components, tokens, and verification commands. Installing this repository does not add a UI runtime, Tailwind configuration, or application dependency to the projects where the skills are used.

## Skills

<table>
  <thead>
    <tr>
      <th>Skill</th>
      <th>What it does</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th colspan="2" align="left">Always-on — manifests</th>
    </tr>
    <tr>
      <td><code>designer</code></td>
      <td>State the reason for every taste decision, add the finish details unprompted, refuse generic AI styling, and audit the diff for token drift before calling it done.</td>
    </tr>
    <tr>
      <td><code>shadcn-tailwind</code></td>
      <td>Apply exact shadcn 4, Base UI, Radix, and Tailwind v4 mechanics from the installed project evidence.</td>
    </tr>
    <tr>
      <td><code>optimistic-ui</code></td>
      <td>Use component-level optimistic UI where perceived speed matters.</td>
    </tr>
    <tr>
      <td><code>saltintesta</code></td>
      <td>Articulate ideas in as few good words as possible.</td>
    </tr>
    <tr>
      <td><code>flavored-md</code></td>
      <td>Write GitHub-Flavored Markdown with the form matched to the content's job.</td>
    </tr>
    <tr>
      <th colspan="2" align="left">Invoked — actions</th>
    </tr>
    <tr>
      <td><code>improve-composition</code></td>
      <td>Audit and repair an interface as one system, from product intent and foundations through canonical components, routes, and its executable catalog.</td>
    </tr>
    <tr>
      <td><code>improve-layout</code></td>
      <td>Audit or build layouts, routing each role to a shadcn component, a native Tailwind utility, or hand-rolled modern CSS where it measurably wins.</td>
    </tr>
    <tr>
      <td><code>improve-motion</code></td>
      <td>Audit, remove, simplify, fix, or add restrained motion; route implementation to native CSS/Tailwind, WAAPI, free Motion, or installed Motion+.</td>
    </tr>
    <tr>
      <td><code>use-browser</code></td>
      <td>Drive a browser to reproduce a reported bug or verify a UI change, and report which states were exercised and which were not.</td>
    </tr>
    <tr>
      <td><code>video-to-ascii</code></td>
      <td>Turn a video or gif into a seamless, transparent-background ASCII animation shipped as frame data plus a React component.</td>
    </tr>
    <tr>
      <td><code>ship</code></td>
      <td>Commit and deliver a coherent change with durable history and current-head pull-request stabilization; never merge without separate authority.</td>
    </tr>
    <tr>
      <td><code>zoom-out</code></td>
      <td>Review a whole project against its actual purpose and identify its real center of gravity.</td>
    </tr>
    <tr>
      <th colspan="2" align="left">Manual-only — commands</th>
    </tr>
    <tr>
      <td><code>quality-audit</code></td>
      <td>Run a stack-aware repository audit or explicit launch-readiness checkup, with bounded remediation when authorized.</td>
    </tr>
  </tbody>
</table>

## Install

This repository ships compatible skill metadata for Claude Code, Cursor, and Codex.

### Agent Skills CLI

Use the portable installer for Cursor or another supported agent-skills harness:

```bash
npx skills add claudialnathan/skills
```

### Codex plugin

Add this repository as an independent Git marketplace, then install the plugin:

```bash
codex plugin marketplace add claudialnathan/skills
codex plugin add skills@claudia-skills
```

Pull later revisions and refresh the installed cache with:

```bash
codex plugin marketplace upgrade claudia-skills
```

### Claude Code plugin

The `claudia` marketplace in [`claudialnathan/agent-kitchen`](https://github.com/claudialnathan/agent-kitchen) publishes this repository as a versionless, commit-SHA plugin:

```bash
claude plugin marketplace add claudialnathan/agent-kitchen
claude plugin install skills@claudia
```

Pull later revisions with:

```bash
claude plugin marketplace update claudia
claude plugin update skills@claudia
```

Restart the relevant agent after installing or updating. Existing sessions keep the catalog they started with.

## Authoring the repository

The skill files are plain Markdown under `skills/<name>/`, with `skills/wip/<name>/` for in-progress skills and `skills/archive/<name>/` for retired ones. Claude Code auto-discovers top-level skills and only needs `wip`/`archive` listed explicitly in its plugin manifest; Cursor requires every skill listed explicitly; Codex reads the shared `SKILL.md` files through its own plugin manifest. The repository gate checks that all three views stay in sync.

Use Node 22 for the repository tooling. Install the pinned Tailwind language server once in a checkout:

```bash
npm ci --prefix tooling/tailwind-language-server --ignore-scripts --no-audit --no-fund
```

Run the complete authoring gate before handing off a change:

```bash
bin/preship-check
```

When changing the gate, token tooling, or the private pilot, run the corresponding focused suite as well:

```bash
bin/test-preship-check
bin/test-token-audit
npm test --prefix packages/ui-preship
```

Pull requests run the repository gate on GitHub. This checkout also has a Claude Code commit hook that runs it before a matching `git commit` attempt.

### Why the Tailwind configuration exists

Tailwind class strings in shipped Markdown examples are executable guidance. A class that is misspelled, obsolete, or non-canonical can be copied into every project that uses the skill even though this repository is not itself a web application.

[`tooling/tailwind-intellisense.css`](tooling/tailwind-intellisense.css) is a small Tailwind v4 entrypoint that scopes the language server to `skills/`. The checked-in [VS Code/Cursor settings](.vscode/settings.json) map that entrypoint to `skills/**/*.md` and surface canonical-class suggestions as errors. The headless checker drives the same official language server, so the editor and the pre-ship gate validate the same Markdown examples:

```bash
bin/tailwind-intellisense-check \
  skills/improve-layout/SKILL.md \
  skills/improve-layout/references/patterns.md
```

With no paths, the command checks every skill Markdown file. It looks first for the pinned repository installation, then for an installed official Tailwind CSS IntelliSense extension. An explicit compatible server can be provided with `TAILWIND_LANGUAGE_SERVER_PATH`.

This authoring setup is separate from `ui-preship`: the pilot records whether a consumer repository declares Tailwind, but it does not silently install or run a Tailwind compiler or language server.

### What the pre-ship gate checks

`bin/preship-check` validates:

- skill frontmatter and context-size limits;
- loader-hostile byte sequences;
- missing and orphaned references;
- Claude, Cursor, and Codex manifest consistency;
- matching manual-only invocation policy across Claude and Codex;
- Tailwind diagnostics in skill Markdown examples;
- changed-skill token surfaces, as an advisory zero-model report.

The static token report does not claim runtime token usage or quality parity. Dynamic evaluation is separately approval-gated and is never started by the commit hook or default CI.

## Maintainer propagation

After pushing a skill change, update the working-tree mirrors used by Cursor and Codex:

```bash
bin/sync-cross-tool
```

The script creates or refreshes links in `~/.cursor/skills`, `~/.agents/skills`, and the checkout's `.claude/skills`. It refuses to overwrite unrelated non-symlink entries. Preview the result with `bin/sync-cross-tool --dry-run`.

Once the commit is reachable from each marketplace's configured source ref, normally after it reaches the default branch, refresh both plugin caches:

```bash
codex plugin marketplace upgrade claudia-skills
claude plugin marketplace update claudia
claude plugin update skills@claudia
```

An unmerged pull-request branch can update working-tree mirrors, but it does not advance either marketplace cache.

## Maintainer tooling

The plugin manifests expose only the skills listed above. This repository also contains:

- [`bin/preship-check`](bin/preship-check), the repository authoring gate;
- [`bin/token-audit`](bin/token-audit) and [`bin/token-eval`](bin/token-eval), for zero-model structural measurement and explicitly approved quality-parity evaluation;
- [`packages/ui-preship`](packages/ui-preship/README.md), an unpublished, advisory-only pilot for deterministic UI evidence;
- [`actions/ui-preship`](actions/ui-preship/action.yml), the pilot's reusable composite action.

Historical plans, approvals, spend ledgers, and machine-local baselines belong under the ignored `working/` directory rather than the public package.

## License

[MIT](LICENSE)
