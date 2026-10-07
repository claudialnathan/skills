# Context

This repository is a skill library for Claude, Cursor, and Codex. The same skill files travel to each app through its plugin packaging.

| Term | Meaning here |
| --- | --- |
| Skill | `skills/<name>/SKILL.md` and the files it uses. |
| Reference | Supporting material inside a skill, read when its instructions call for it. |
| Ambient / action / command | Existing invocation tiers: matching-domain guidance, task-selected workflow, or explicit-only workflow. A tier is not a manifest. |
| Plugin manifest | Metadata that identifies the library to an app. |
| Marketplace | A catalog that exposes this library as one plugin named `skills`. |
| Sync | The app’s process for fetching a published revision. It is separate from editing the checkout. |
| Archived skill | A retained skill outside `skills/`, withheld from plugin discovery. |

`AGENTS.md` carries authoring rules. `README.md` carries installation instructions and the skills table. `TASKS.md` carries open work. `HANDOVER.md` is the optional single live handoff.
