`SKILLS`

Agent skills that add meaningful value beyond what the unaided model does out of the box and to work that matters to me. 

A frontier model is very competent at most things, but its default in any domain is the competent average version of the thing. Each skill here is a commitment that drags the model off that median in a chosen direction (narrow, stack-specific disciplines).

Each is self-contained: install the plugin and it loads on the paths and tasks it names.

--------

#### The Skills

| Category | Skill | What it does |
| :--- | :--- | :--- |
| **design** | improve-layout | Audit or build layouts, routing each role to a shadcn component, a native Tailwind utility, or hand-rolled modern CSS — modern CSS only where it measurably wins. |
| | design-motion | Frequency-aware motion: the frequency × novelty master rule, the framework-native hierarchy of reach, Motion + Base UI integration. |
| | design-polish | The proactive detail layer applied unprompted; owns the pre-ship UI checklist. |
| | design-taste | The judgment layer: state the reason, precise vocabulary, anti-slop. |
| **engineering** | shadcn-tailwind | Stack discipline for shadcn 4 (Base UI) + Tailwind v4: component architecture, token mechanics, and catching dead `data-*` selectors before they ship. |
| | optimistic-ui | Optimistic-UI patterns where perceived speed matters at the component layer. |
| | quality-audit | Stack-aware, read-only quality audit for a JS/TS web repo. |
| **writing** | saltintesta | Prose tone: articulate ideas in as few good words as possible. |
| | flavored-md | GitHub-Flavored Markdown, with the form matched to the content's job. |
| **workflow** | changelog | A skimmable, append-only decision log of what changed and why. |
| | zoom-out | A zoomed-out strategic review of a whole project against its actual purpose. |

--------

#### Install with the Agent Skills CLI

```md
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
