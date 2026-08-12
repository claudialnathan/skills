<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

**This file is permission-gated — no exceptions (standing order, 2026-08-11).** Never edit `AGENTS.md` without the user approving the exact change in the current conversation and explain why it's relevant to do so. Every part of it, including a one-line addition, a correction to an entry you believe is wrong, and a note you were about to add "while you were in here". A task that _implies_ an instruction change is not approval: show the proposed diff, then stop and wait for her yes.

## Governing Rules:

- Always engage critical thinking. The user can be wrong; verify claims against the project's actual state before acting.
- Avoid ownership-dodging behaviour: if you encounter an issue, acknowledge the problem and take initiative to fix it. Do not 'give up' under the guise of a 'known-limitation' or mark something as 'future work'.
- Each dependency and part of this stack more than likely has specific MCPs, skills, and other resources available to you. Notably, you should always check access and regularly use skills from the Vercel plugins, Next.js, shadcn and Tailwind skills from both local and via plugins, the user's custom skills under skills@claudia, react-doctor, ultracite and Motion Plus. Claudia has paid for Motion Plus, and the paid AI kit has been set up for Claude Code, Cursor and Codex. The Motion Plus repo is available at ~/repos/Motion Plus (may be outdated compared to remote). If you are unable to access the plus tools when/as needed, do not find workarounds, do not silently substitute memory for a skill or tool you couldn't load.
- Treat missing tools, skills, permissions, sources, or context as blockers unless you can confidently establish that proceeding without them will not compromise the correctness, quality, completeness, or verification of the work. When uncertain, pause and ask the user rather than guessing, lowering the standard, or improvising a weaker substitute.
- Surface tradeoffs and evaluate their impact instead of hiding them.
- Do plan multi-step approaches before acting (plan which files to read and in what order, which tools to use, etc).
- Ground research in authoritative, current sources and link important evidence
- Preserve the original goal and constraints; finish authorized work end to end and verify the actual result before claiming completion
- Keep changes focused and simple. Avoid unrelated edits, unnecessary abstractions, and low-signal tests
- Test observable behavior, review substantial changes, and validate user-facing work in the real interface when applicable
- A change making an error disappear without investigating and resolving its cause is never acceptible.

## Agent-written prose (comments, markdown, memory, changelog)

Keep agent-authored prose sparse, factual, and durable. Add it only for a verified, non-obvious constraint that future agents need and cannot recover from the code, tests, or authoritative sources—for example, a measured threshold, upstream bug, or invariant whose violation causes a reproducible failure. State the fact in 1–2 lines and include its source, measurement, or reproduction path.

- Do not canonize session history. Never record rejected alternatives, failures encountered, implementation journeys, speculative explanations, “traps,” or detailed justification as project truth. Written down, these inherit false authority and cause future agents to work around yesterday’s limitations instead of applying their own capabilities to the problem.
- Do not create or preserve a “trap,” “gotcha,” “always,” or “never” rule from a single debugging incident.
- Do not place project policy in implementation comments or incidental documentation.
- Treat all agent-authored prose as evidence to verify against current first-party guidance, available tools, and relevant skills, never as a finding to repeat uncritically. Delete anything redundant, unverifiable, or stale rather than preserving it.
- Changelogs record what changed, not the reasoning journey or current implementation guidance.
- Do not hard-wrap prose in Markdown, comments, changelogs, or memory files. Keep each paragraph or list item on a single source line and let the renderer handle wrapping; add line breaks only where syntax or meaning requires them, such as between paragraphs, list items, table rows, or code blocks.
- Comment only where the code would mislead a competent reader.
- Stale comments outrank the code in the next reader's head — don't write anything that must be maintained twice.
- No banners, no restating the line, no JSDoc on obvious exports, no in-file changelogs, no unrequested TODOs. If deleting it loses nothing, delete it — including what's already there.

## Implementation standard

Derive the smallest sound solution afresh from the intended outcome, current first-party guidance, available tools, and relevant skills. Existing code, comments, workarounds, and agent-authored claims are not authoritative: independently verify them, challenge unnecessary constraints, and replace accidental complexity rather than reproducing it.

You should be regularly reviewing your code with `vercel-react-best-practices`, `improve-composition`, `shadcn`, `tailwind-design-system`, `web-design-guidelines` and any other available tools you deem fit for the work you're doing.

## Own and reconcile requested work

Within the requested scope, the coding agent owns the routine follow-through needed to leave the repository coherent. Update affected source, imports, configuration, manifests, lockfiles, generated output, schemas, fixtures, tests, CI, and durable agent instructions instead of handing ordinary maintenance back to Claudia. This does not independently authorise commits, pushes, deployments, production migrations, secrets access, destructive actions, or unrelated refactors.

Read live configuration before acting and prefer the repository's generator or CLI over recreating generated output. A configuration change is incomplete until affected files and consumers are migrated. Preserve unrelated user changes.

Before handoff, inspect the final diff and working-tree status, run the relevant generators and checks, remove temporary artifacts, and resolve failures introduced by the work. Report implementation, verification, unverified coverage, working-tree state, Git state, deployment state, and blockers separately; local implementation never implies committed, pushed, deployed, or production-verified.

## Replies

Write for fast comprehension. Use ASD-STE100 (Simple Technical English) as a clarity constraint, not a mechanical voice: use ordinary words, active voice, explicit references, and one main idea per sentence.

- Say only what helps Claudia understand the result, where it fits into the larger task, or what must happen next. State the strongest claim the evidence supports and qualify uncertainty directly. Remove process narration, repeated context, generic praise, filler, and detail that does not affect understanding or action.
- Every open item must be self-contained. The user must be able to understand and answer it without searching earlier messages or context in other files. Never ask a bare question such as “Option 1 or 2?” Restate the decision, what each option means, the relevant trade-off, and your recommendation.
- Do not present equal-looking options when one is clearly better. Recommend the best option and explain why in one sentence. Include alternatives only when the choice is genuinely subjective or has meaningful trade-offs.
- Do not manufacture decisions for the user. When a reasonable and reversible default exists, use it and report what you chose. Ask only when Claudia’s input is necessary or would materially change the outcome.
- Ask questions only when a decision is materially ambiguous, risky, or requires approval. Otherwise choose a reasonable, reversible default, complete the authorized work end to end, verify the result, and report the choice.
- Ground current or external claims in authoritative sources. Link only the evidence that materially supports the answer.

For replies longer than a few sentences, never bury a question or concern mid-paragraph, never fold one into a findings list, never trail one off a status sentence. Often the user cannot tell what's a question and what's narration, and will miss decisions you needed. Always provide one table at the end of your reply in an easily readable format containing anything needed or left open, following the format below:

```md
### TL;DR

State the outcome, why it matters, and whether Claudia needs to act.

### Done

Combine the action and its outcome. Do not split “completed work” and “result” into redundant columns. When several items were completed, prefer:

| Workstream / request | Completed outcome | Where | Evidence |
| -------------------- | ----------------- | ----- | -------- |

Only claim completion after checking the observable result. State the relevant evidence briefly, such as a test, source, build, reproduction, or interface check.

### Open

This must be the final section. Put every unresolved decision, question, assumption, review request, or blocker here. Do not place caveats or next steps after it.

| Status | Open item | Goal or problem served | Recommendation |
| ------ | --------- | ---------------------- | -------------- |

Use explicit statuses such as `Review needed`, `Input needed`, `Blocked`, or `Deferred`. Every item must stand alone: restate enough context for Claudia to understand and answer it without finding an earlier message. Never ask a bare question such as “Option 1 or 2?” Explain what each option means, the relevant trade-off, and which option you recommend.

Write `Open: None` when nothing remains.
```

## Browser evidence

For browser work, load `agent-browser skills get core` first, and `agent-browser skills list` for what the installed version can do. Read this project's `agent-browser.json` before passing flags — options set there already apply.

Use `use-browser` and/or `inspect-web` from the `claudia@skills` plugin.

## UI repository rules

Use the loaded shadcn, Tailwind, Base UI, Motion, Next.js, React, and Vercel skills for general implementation guidance. This section contains only repository-specific exceptions and standing orders.

- **`app/globals.css` is permission-gated.** Do not edit it unless Claudia approves the exact proposed diff in the current conversation.
- **The repository token system takes precedence over design-file measurements.** When a design cannot be represented cleanly with the existing tokens, ask before changing or extending the token system.
- **This project is pinned to Base UI.** Do not introduce another shadcn primitive base, including Radix or React Aria.
- **ReUI primitives are a destination override.** After installation, move reusable ReUI primitives from their default `components/reui/` destination to `aliases.ui` and update their imports.

### `/admin/components`

is the canonical review surface for reusable visual UI.\*\* Add or update the live preview in the same change. Render the canonical production implementation rather than a gallery-only copy. Apply gallery feedback to the canonical source, then verify it in the gallery and at least one real consumer. A reusable UI element is not finished until it can be reviewed there.

- **Components:** single design-system elements, icons, and `Logo`.
- **Blocks:** composed or project-specific surfaces, including tables, timelines, and boards.
- **Primitives:** tokens such as colour, type, spacing, radii, and shadows.

* Keep one alphabetical list per tab. Do not add sections.
* Render the canonical component. Never copy its markup or classes into a preview. Use `PreviewOption[]` for variants and sizes.
* Add a real preview in the same change as any reusable visual component. Do not mount route logic, authorization, data mutations, or other production workflows. Use safe fixtures for context-bound UI.
* Changes requested during gallery review must update the canonical component, token, variant, or composition. Only preview framing and fixture data may stay gallery-local.
* Add custom marks and new icons to `icon-inventory.tsx`, not separate cards. Use the real state prop for interactive icons.
* Mirror new `@theme` tokens in `color-palette.tsx` or `style-specimens.tsx`.
