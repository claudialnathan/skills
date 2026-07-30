`SKILLS`

Agent skills that add meaningful value beyond what the unaided model does out of the box and to work that matters to me.

A frontier model is very competent at most things, but its default in any domain is the competent average version of the thing. Each skill here is a commitment that drags the model off that median in a chosen direction (narrow, stack-specific disciplines).

Each is self-contained: install the plugin and it loads on the paths and tasks it names.

--------

#### The Skills

| Category | Skill | What it does |
| :--- | :--- | :--- |
| **design** | improve-composition | Audit and repair an interface as one system, from product intent and foundations through canonical components, routes, and its executable catalog. |
| | improve-layout | Audit or build layouts, routing each role to a shadcn component, a native Tailwind utility, or hand-rolled modern CSS — modern CSS only where it measurably wins. |
| | improve-motion | Audit, remove, simplify, fix, or add restrained motion; route implementation to native CSS/Tailwind, WAAPI, free Motion, or installed Motion+. |
| | design-polish | The proactive detail layer applied unprompted; owns the pre-ship UI checklist. |
| | design-taste | The judgment layer: state the reason, precise vocabulary, anti-slop. |
| **engineering** | shadcn-tailwind | Stack discipline for shadcn 4 (Base UI) + Tailwind v4: component architecture, token mechanics, and catching dead `data-*` selectors before they ship. |
| | optimistic-ui | Optimistic-UI patterns where perceived speed matters at the component layer. |
| | quality-audit | Stack-aware, read-only quality audit for a JS/TS web repo. |
| **writing** | saltintesta | Prose tone: articulate ideas in as few good words as possible. |
| | flavored-md | GitHub-Flavored Markdown, with the form matched to the content's job. |
| **workflow** | ship | Commit and deliver a coherent change with durable history, repository-native gates, and current-head PR stabilization. |
| | zoom-out | A zoomed-out strategic review of a whole project against its actual purpose. |

--------

#### Repository tooling

The plugin manifests expose only the skills above. This repository also
contains maintainer tooling:

- `bin/preship-check` validates loader safety, manifests, packaging, references,
  Tailwind examples, and changed-skill context surfaces.
- `bin/token-audit` and `bin/token-eval` provide zero-model structural
  measurement and explicitly approved quality-parity evaluation.
- `packages/ui-preship` is an unpublished, advisory-only pilot for deterministic
  UI evidence. Its reusable action lives at `actions/ui-preship/action.yml`.

Historical plans, approvals, spend ledgers, and machine-local baselines remain
under the ignored `working/` directory rather than the public package.

--------

#### Install with the Agent Skills CLI

```bash
npx skills add claudialnathan/skills
```

#### Install as a Codex plugin

This repository is an independent Git marketplace, so its updates do not depend on a release in the sibling `agent-kitchen` repository:

```bash
codex plugin marketplace add claudialnathan/skills
codex plugin add skills@claudia-skills
```

Pull later revisions and refresh the installed plugin cache with:

```bash
codex plugin marketplace upgrade claudia-skills
```

Start a new Codex thread after installing or upgrading so its skill catalog is rebuilt.

#### Install as a Claude Code plugin

The `claudia` marketplace publishes this repository as a versionless,
commit-SHA plugin:

```bash
claude plugin marketplace add claudialnathan/agent-kitchen
claude plugin install skills@claudia
```

Pull later revisions with:

```bash
claude plugin marketplace update claudia
claude plugin update skills@claudia
```

Restart Claude Code after updating so the new plugin revision is loaded.

#### Refresh a maintainer checkout across tools

After pushing a skill change, update the working-tree mirrors used by Cursor
and Codex:

```bash
bin/sync-cross-tool
```

Once the commit is reachable from each marketplace's configured source ref
(normally after it reaches the default branch), refresh both plugin caches:

```bash
codex plugin marketplace upgrade claudia-skills
claude plugin marketplace update claudia
claude plugin update skills@claudia
```

An unmerged PR branch updates the working-tree mirrors but not the marketplace
caches. Report those plugin refreshes as deferred rather than treating a
successful marketplace command as proof that it installed the PR head.

Start new Cursor, Codex, and Claude Code sessions after refreshing. Existing
sessions keep the skill catalog they started with.
