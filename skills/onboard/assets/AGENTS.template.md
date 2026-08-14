<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

**This file and `global.css` are permission-gated.** Never edit without consulting the user, show the proposed diff and stop for approval.

# Project State

- `CONTEXT.md` carries the shared language for this project. Use its terms, and add one the first time a word causes a misunderstanding.
- `TASKS.md` carries open work, decisions waiting on Claudia, and parked items. Read it at the start of a session and raise the rows that bear on what is being asked. Add a row rather than leaving something for Claudia to remember; delete a row when it is done.
- `HANDOVER.md` holds at most one live handoff, and empty is its normal state. Write it when asked to hand off; when asked to pick one up, action it and then clear it.
- Each file carries its own rules in a comment, and every line in it is perishable. Where one contradicts the code, the code is authoritative — say so rather than following the stale rule.

# Workflow Orchestration

## 1. Understand the system

- Test your assumptions and prior agent output against authoritative (current) sources and available tools.
- Map the system around the change, trace the affected elements and interconnected work. Finish the authorised task across that boundary so the system remains coherent.
- Check the observable result and downstream effects. Stop and re-plan when new evidence or failures invalidate the current approach.

## 2. Use stack/specialized tooling

- Load the skills, MCPs, plugins, and repository guidance relevant to the task.
- For UI work, use the relevant Next.js, shadcn, Tailwind, React, Vercel, and project-specific resources.
- For animation work, use Tailwind css (animation) and Motion Plus through its MCP; stop if the required tools are unavailable.
- Treat missing tools, permissions, sources, or context as blockers when proceeding could compromise correctness, quality, completeness, or verification.

## 3. Own and reconcile the work

- Finish authorised work end to end, own the routine follow-through needed to leave the repository coherent.
- Update affected source, imports, configuration, manifests, lockfiles, generated output, schemas, fixtures, tests, CI, and durable agent instructions instead of handing ordinary maintenance back to the user
- Do not commit, push, deploy, migrate production, access secrets, or perform destructive actions unless authorised.
- Clean up after yourself. Remove any temporary artifacts when you’re done.

## 4. Resolve causes, not symptoms

- Investigate the cause of errors, failing tests, checks, warnings and broken behaviour.
- Do not suppress, bypass, hide, or merely make an error disappear.
- Resolve failures introduced by the work before handoff.
- Surface material trade-offs instead of hiding them.

## 5. Verify before done

- Run every check relevant to the change.
- Inspect and dogfood the real result with `agent-browser` and available tools when applicable.
- Confirm the result matches the request and resolve all console, terminal, runtime, lint, and test errors.
- Inspect the final diff + working tree, clean temporary artifacts, and clarify local, git, deployment and prod status.
- If verification cannot run, name the missing check and resolve.
- Do not commit, push, deploy, migrate production, or run destructive Git unless asked.

## 6. Refactor relentlessly

- Find the most elegant, sound implementation that produces the intended outcome in as few LOC as possible.
- Review latest guidance from Next.js React, CSS, HTML, etc., for new, better ways to achieve the intended result.
- Keep changes focused; avoid unrelated edits, speculative abstractions, and low-signal tests.
- Do not over-engineer simple, obvious fixes.

## 7. Avoid verbose prose

- Keep agent-authored prose (comments, markdown, memory, changelogs, docs) sparse, factual, and durable.
- Add comments only where the code would mislead a competent reader, keep it to one sentence where possible.
- Do not canonize session history. Never record as project truth: rejected alternatives, your failures, implementation journeys, speculation or detailed justification.
- Do not create or preserve a “trap”, “gotcha”, “always” or “never” rule from a single debugging incident.
- Do not place project policy in implementation comments or incidental documentation.
- Treat all agent-authored prose as evidence to verify against current first-party guidance, never as a finding to repeat uncritically.
- Delete anything redundant, unverifiable, or stale rather than preserving it.
- No banners, no restating the line, no JSDoc on obvious exports, no in-file changelogs, no unrequested TODOs.

# Verification Commands

- Run `bun run check` after substantial edits.
- Run `bun run typecheck` when types or configuration change.
- Run targeted `bun run test` commands when behaviour changes.
- Run `bun run build` when runtime, routing, or configuration changes.
- Run `bun run doctor:diff` for React or compiler findings; remaining warnings are findings, not a clean result.
- Use `bun run dev` for the development server on port `5050`.
- Install dependencies with `bun add` or `bun add -d`; do not edit the lockfile by hand.

# Communication

## 1. Content

- Write for fast comprehension. Use ASD-STE100 (Simple Technical English), ordinary words, active voice, and explicit references.
- Lead with what is done. Then state what is left and why it is not done.
- Keep only what aids understanding or action. Remove process narration, repetition, praise, filler, and irrelevant detail.
- State only what the evidence supports. Qualify uncertainty. Link only material, authoritative sources.
- Use judgement, not a fixed template. Take reasonable, reversible defaults.
- Ask only when a choice is materially ambiguous, risky, irreversible, approval-gated, or outcome-changing.
- Do not manufacture choices. Recommend the best option and say why.
- Use the simplest scannable structure. Do not repeat content or add empty sections.
- Put open items last. State the issue, why it matters, the trade-offs, and your recommendation. Omit the section when nothing is open.

## 2. Tables

- Use a table when several items share comparable fields.
- Use only useful columns, usually two or three.
- Keep one item per row. Keep cells short.
- Put long explanations, file paths, and secondary evidence outside the table.
- Use GitHub-flavoured pipe syntax.
- Do not replace a suitable table with repeated labels or card blocks.
- If the client reflows tables, use a narrow fenced monospace table.

## 3. Visual Explanations

- Use the `show-me` skill when available.
- Add a visual only when it is clearer than brief prose.
- Lead with the smallest useful view. Do not announce or repeat it.
- Show logic as concise pseudocode.
- Show runtime flow as a shallow call tree.
- Show UI structure as a component tree. Include only relevant state and module boundaries.
- Show file responsibility or broad refactors as a shallow file tree.
- Show interaction, data flow, or state changes with Mermaid. Use fenced text when Mermaid is unsupported.
- Use a `diff` when the main point is what changed.
- Use one temporary HTML file when Markdown cannot show the concept clearly. Do not add it to the repository unless required.

# Tooling

## 1. Project Skills

- Load stack-specific/relevant available MCPs, skills, plugins, and guidance before acting.
- Always review UI work with relevant skills, such as `improve-composition`, `shadcn`, `tailwind-design-system`, `web-design-guidelines`, `better-ui`, and the like.
- Use Motion Plus through its MCP for animation. Stop if it is unavailable. Do not fake the feature.
- Stop when a missing tool could affect correctness, quality, or verification. Do not substitute a weaker workaround.

## 2. Browser Evidence

- Before browser work, load `agent-browser skills get core`.
- Use `agent-browser skills list` to inspect available capabilities.
- Read `agent-browser.json` before passing flags. Its options already apply.
- Use `use-browser` or `inspect-web` from `claudia@skills`.
- Validate user-facing work in the real interface when possible.

# UI and Design

## 1. Repository Constraints

- Apply these rules only to UI or design-system work.
- `app/globals.css` is permission-gated. Show the exact diff and wait for Claudia’s approval.
- The repository token system overrides isolated design measurements.
- Reuse an existing token first. Then use standard Tailwind utilities.
- If no clean match exists, stop and ask. Do not add arbitrary `[…]` classes or one-off variables.
- This repository uses Base UI. Do not add Radix or React Aria primitives.
- Move reusable shadcn registry primitives to `aliases.ui` (`components/ui`). Update their imports.

## 2. Design Interpretation

- Inspect Paper or Figma through its MCP. Details matter, do not build from a screenshot or quick scan.
- Designs may not map to exact `global.css` tokens tailwind utilities, find the closest available match, stop to clarify if none.
- Treat each supplied frame as one state, not the whole component.
- Keep layout stable across states. Change only the visual treatment.
- Ensure every design and interaction is responsive across devices.
- Derive hover, focus-visible, active, disabled, selected, and current states from system precedent.
- Ask when you cannot separate authored intent from a mock artefact.

## 3. `/admin/components`

- Use `/admin/components` as the canonical review surface for reusable visual UI.
- Add or update a live preview with each reusable component, public variant, tracked icon, or design token.
- Render the production implementation. Do not copy its markup or styling.
- Apply gallery feedback to the source component, token, variant, or composition.
- Keep only preview framing, fixtures, and controls local to the gallery.
- Keep previews free of routing, authorisation, mutations, and other production workflows. Use safe fixtures.
- Verify changes in the gallery and one real consumer when available.
- Keep each tab alphabetical.
- Use **Components** for system UI, icons, and `Logo`.
- Use **Blocks** for composed or project-specific UI.
- Use **Primitives** for colour, type, spacing, radii, shadows, and other tokens.
- Add new icons to `icon-inventory.tsx`, not separate cards. Use the real state prop for interactive icons.
- Mirror new `@theme` tokens in `color-palette.tsx` or `style-specimens.tsx`.
