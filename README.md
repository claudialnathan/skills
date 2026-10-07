# Skills

Agent skills for interface design, frontend development, repository review, writing, and delivery. Works with Claude, Cursor, and Codex.

## Install

Repository: [claudialnathan/skills](https://github.com/claudialnathan/skills)

| App | Installation |
| --- | --- |
| [Claude](https://support.claude.com/en/articles/13837440-use-plugins-in-claude) | **Customize → Plugins → Add → Add marketplace → Add from a repository**. Paste the repository URL, then add **Claudia’s Skills**. Requires a paid plan. |
| [Cursor](https://cursor.com/docs/plugins) | **Customize → From GitHub Repository**. Paste the repository URL, then install **skills**. |
| [Codex / ChatGPT](https://help.openai.com/en/articles/20001504-importing-and-syncing-plugin-marketplaces-from-github) | A workspace admin imports the URL through **Admin Console → Plugins → Add → Import marketplace**, leaving Path empty. Install **Claudia’s Skills** from the workspace directory. |

For a [personal Codex app install](https://developers.openai.com/plugins/build/plugins), clone this repository, open it as a project, restart the app, and install **Claudia’s Skills** from the Plugins Directory. To update this local install, pull the latest changes and reinstall the plugin.

Or install from the terminal:

```bash
npx skills add claudialnathan/skills
```

## Skills

| Skill | Purpose |
| --- | --- |
| [designer](skills/designer/SKILL.md) | UI judgment and visual finish. |
| [explain-system-flows](skills/explain-system-flows/SKILL.md) | Explain code and data flows in plain English with Mermaid diagrams. |
| [improve-composition](skills/improve-composition/SKILL.md) | Repair an interface as one coherent system. |
| [improve-layout](skills/improve-layout/SKILL.md) | Fluid, responsive page and app layouts. |
| [improve-motion](skills/improve-motion/SKILL.md) | UI animation, transitions, and gestures. |
| [inspect-web](skills/inspect-web/SKILL.md) | Measure a live page’s appearance and behavior. |
| [openreview](skills/openreview/SKILL.md) | Scanner-backed Next.js review and implementation. |
| [optimistic-ui](skills/optimistic-ui/SKILL.md) | Immediate UI updates with rollback. |
| [quality-audit](skills/quality-audit/SKILL.md) | Repository and launch-readiness audit; explicit invocation only. |
| [saltintesta](skills/saltintesta/SKILL.md) | Clear, concise prose. |
| [ship](skills/ship/SKILL.md) | Commit, push, and prepare a PR for human merge. |
| [use-browser](skills/use-browser/SKILL.md) | Reproduce bugs and verify web UI changes. |
| [video-to-ascii](skills/video-to-ascii/SKILL.md) | Convert video or GIF to ASCII animation; work in progress. |
| [web-launch-checklist](skills/web-launch-checklist/SKILL.md) | Evidence-backed release checklist. |
| [zoom-out](skills/zoom-out/SKILL.md) | Review a project against its purpose. |

[MIT](LICENSE).
