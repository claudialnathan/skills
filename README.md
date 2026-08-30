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

The skill supplies the discipline; the target repository supplies the facts. A plugin manifest per agent exposes the same skill source to each of them, while hooks, fixtures, CI, and evaluation tools make broken or stale guidance visible.

Each skill is self-contained. Install the repository once, then let the agent select a relevant skill from the task or name the skill directly.

## Use a skill

After installation, start a new agent session so its skill catalog is rebuilt. Then ask normally:

```text
Use improve-layout to repair the mobile overflow without changing the design.
Run openreview across this whole codebase, then plan the selected findings.
Run quality-audit against this repository and report only verified findings.
Run quality-audit with the launch profile and get this deployment ready.
Run web-launch-checklist for this production release and produce a go/no-go record.
Use ship to commit this change and stabilize the pull request, but do not merge it.
```

The catalog below is grouped by who decides when a skill runs. Ambient skills apply whenever the work is in their domain, without being asked for. Actions activate from their descriptions when the task matches, or when you name one. Commands only ever run when you invoke them because their cost, timing, or blast radius needs the owner's decision.

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
      <th colspan="2" align="left">Always-on — ambient</th>
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
      <td>Articulate ideas in as few good words as possible; grill the user when the idea is missing.</td>
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
      <td><code>inspect-web</code></td>
      <td>Read timings, easings, geometry, computed styles, and resource waterfalls out of a live page to explain how it achieves an effect or why it looks wrong.</td>
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
      <td><code>web-launch-checklist</code></td>
      <td>Work through the maintained 192-item checklist and produce an evidence-backed go/no-go launch record for an exact release.</td>
    </tr>
    <tr>
      <td><code>handover</code></td>
      <td>Write or pick up a single live handoff in <code>HANDOVER.md</code>, reconciling it against the repository before acting and clearing it once consumed.</td>
    </tr>
    <tr>
      <td><code>ship</code></td>
      <td>Commit and deliver a coherent change, resolve automated review findings at source, and stabilize the current pull-request head; never merge without separate authority.</td>
    </tr>
    <tr>
      <td><code>zoom-out</code></td>
      <td>Review a whole project against its actual purpose and identify its real center of gravity.</td>
    </tr>
    <tr>
      <th colspan="2" align="left">Manual-only — commands</th>
    </tr>
    <tr>
      <td><code>openreview</code></td>
      <td>Run a scanner-backed Next.js audit, return a provenance-preserving ledger, and write or execute only explicitly selected plans.</td>
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

Pull later revisions in two steps: refresh the Git marketplace snapshot, then
rewrite the installed plugin cache from that snapshot:

```bash
codex plugin marketplace upgrade claudia-skills
codex plugin add skills@claudia-skills
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

## Repository systems

This is the source map for the skill library and the machinery around it. Only the `skills/` row ships as skill content; nothing else installs itself into a target repository. Use Node 22 for the executable tooling.

| System | What it is | Canonical location | Set up or run |
| :--- | :--- | :--- | :--- |
| Repository instructions and state | The rules, shared vocabulary, live work queue, one handoff, and settled refusals for this checkout. | [`AGENTS.md`](AGENTS.md), [`CLAUDE.md`](CLAUDE.md), [`CONTEXT.md`](CONTEXT.md), [`TASKS.md`](TASKS.md), `HANDOVER.md`, [`.out-of-scope/`](.out-of-scope/) | No generator. `AGENTS.md` owns shared rules and `CLAUDE.md` imports it; edit the file that owns the fact. |
| Skill source | The portable units shipped by the plugin. Discovery is the flat filesystem, not a manifest list. | [`skills/`](skills/) | Add or remove `skills/<name>/SKILL.md`; no manifest entry is needed. Mark unfinished work with `metadata: status: wip`. |
| Plugin packaging | Metadata for the portable, Claude Code, and Codex plugin formats, plus the Codex marketplace. | [`plugin.json`](plugin.json), [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json), [`.codex-plugin/plugin.json`](.codex-plugin/plugin.json), [`.agents/plugins/marketplace.json`](.agents/plugins/marketplace.json) | Keep Claude manifests versionless and Codex semver-valid. Run `scripts/validate-codex-plugin`; use the install and update commands above for each harness. |
| Repository gate | The blocking authoring contract, its fixtures, the Claude commit hook, and CI. | [`scripts/preship-check`](scripts/preship-check), [`tests/preship/`](tests/preship/), [`.claude/hooks/preship-gate.sh`](.claude/hooks/preship-gate.sh), [`.github/workflows/preship.yml`](.github/workflows/preship.yml) | Run `scripts/test-preship-check`, `scripts/test-token-audit`, then `scripts/preship-check`. Pull requests, `main` pushes, and matching Claude commit attempts run the same set. |
| Tailwind Markdown diagnostics | The official Tailwind language server checking class strings embedded in skill Markdown. | [`scripts/tailwind-intellisense-check`](scripts/tailwind-intellisense-check), [`tooling/tailwind-intellisense.css`](tooling/tailwind-intellisense.css), [`tooling/tailwind-language-server/`](tooling/tailwind-language-server/), [`.vscode/settings.json`](.vscode/settings.json) | Install once with `npm ci --prefix tooling/tailwind-language-server --ignore-scripts --no-audit --no-fund`; pass touched Markdown paths to the checker, or no paths for all skills. |
| Token measurement | Static, zero-model context measurement plus separately approval-gated model evaluation. | [`scripts/token-audit`](scripts/token-audit), [`scripts/token-eval`](scripts/token-eval), [`tooling/token-audit/`](tooling/token-audit/), [`evals/token-efficiency/`](evals/token-efficiency/) | Run `scripts/token-audit --scope changed`. Read [`tooling/token-audit/README.md`](tooling/token-audit/README.md) before any evaluation; `token-eval --run` requires fresh owner approval and is never part of the default gate. |
| `ui-preship` pilot | A private, advisory UI-evidence package and its reusable GitHub action. | [`packages/ui-preship/`](packages/ui-preship/), [`actions/ui-preship/action.yml`](actions/ui-preship/action.yml), [`.github/ui-preship-smoke.json`](.github/ui-preship-smoke.json) | Follow [`packages/ui-preship/README.md`](packages/ui-preship/README.md) for target-repository setup. Run `npm test --prefix packages/ui-preship` after changing the pilot. Its publication status and boundaries live in [`ARCHITECTURE.md`](packages/ui-preship/ARCHITECTURE.md). |
| Cross-harness mirrors | Symlinks from this checkout into Cursor, Codex, and repo-local Claude discovery paths. | [`scripts/sync-cross-tool`](scripts/sync-cross-tool), [`skills/ship/references/propagation.md`](skills/ship/references/propagation.md) | Preview with `scripts/sync-cross-tool --dry-run`. Run it only in an authorized ship workflow after a pushed skill change because it writes user-level paths; marketplace caches still need the update commands above after the commit reaches their configured source ref. |
| Optional Claude skill-edit guard | A prompt guard for edits to `.claude/skills/` outside this authoring repository. It is not enabled by the checked-in project settings. | [`.claude/hooks/protect-skills.sh`](.claude/hooks/protect-skills.sh) | Owner-level Claude settings may bind it as a `PreToolUse` hook. Agents report that machine-scope step; they do not write it from this repository. |
| Research and decisions | Durable public design notes, raw machine-local source notes, and ignored scratch evidence. | [`docs/`](docs/), `.claude/ingest/`, `working/`, [`.out-of-scope/`](.out-of-scope/) | No setup. Promote durable decisions to tracked docs; keep source dumps, approvals, spend records, and temporary evidence in the ignored locations. |

## License

[MIT](LICENSE)
