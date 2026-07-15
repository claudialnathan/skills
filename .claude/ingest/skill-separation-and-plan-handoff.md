# Ingest brief — skill separation of concerns + the audit→plan→execute workflow

## Topic

How five installed third-party skills (Jakub Krs's better-ui / better-typography / better-colors; Emil Kowalski's improve-animations; shadcn's improve) structure separation of concerns and the review→plan→execute workflow — as design input for whether this repo's skills should be restructured and whether the plan-handoff pattern earns an artifact here.

## Sources consulted

| Source | Retrieved | Status |
| :--- | :--- | :--- |
| `~/.claude/skills/better-ui/` (SKILL.md + 3 companions) | 2026-07-15 | ok (subagent) |
| `~/.claude/skills/better-typography/` (SKILL.md + 6 companions) | 2026-07-15 | ok (subagent) |
| `~/.claude/skills/better-colors/` (SKILL.md + 4 companions) | 2026-07-15 | ok (subagent) |
| `~/.claude/skills/improve-animations/` (SKILL.md + AUDIT.md + PLAN-TEMPLATE.md) | 2026-07-15 | ok (subagent) |
| `~/.claude/skills/improve/SKILL.md` | 2026-07-15 | ok (read inline in main thread; references/ not read) |

Note: the request named "better-ui" twice; better-colors was assumed as the third Jakub Krs skill, consistent with the installed set.

## Points of agreement

**One domain per skill, chapters routed by a when-to-use table.** All three Jakub skills share identical anatomy: trigger-noun description → "Quick Reference" routing table → companion chapter files.

> "| Category | When to Use | | --- | --- | | [Surfaces](surfaces.md) | Border radius, optical alignment, shadows, image outlines, hit areas | | [Animations](animations.md) | Interruptible animations, enter/exit transitions, icon animations, scale on press | | [Performance](performance.md) | Transition specificity, `will-change` usage |" (better-ui SKILL.md, "Quick Reference")

> "| Category | When to use | Reference | | Conversion | Hex/rgb/hsl to oklch | [color-conversion.md](color-conversion.md) | | Palettes | Generate scales, multi-hue, dark mode | [palette-generation.md](palette-generation.md) | …" (better-colors SKILL.md, "Quick Reference")

**A shared review-output contract across the family.** Near-verbatim identical language in all three:

> "Always present changes as a markdown table with **Before** and **After** columns. Include every change you made — not just a subset. Never list findings as separate 'Before:' / 'After:' lines outside of a table. Group changes by principle using a heading above each table…" (better-ui SKILL.md, "Review Output Format"; better-typography and better-colors carry the same block)

> "This keeps feedback scannable and diff-friendly. Each row is a self-contained change the developer can act on independently." (better-colors SKILL.md, "Review Output Format")

**Respect the host project's system rather than prescribing one.**

> "Match the project's styling system. Before suggesting or writing any fix, check how the codebase styles things and express every change in that system… Never introduce a second styling approach just to apply a typography fix." (better-typography SKILL.md, body intro)

> "When converting existing colors to oklch, convert the color values but leave everything else unchanged — don't change gradient interpolation, don't restructure the CSS." (better-colors color-conversion.md, opening line)

**Plan-as-product economics (improve + improve-animations, near-verbatim agreement).**

> "The economics of this skill: an expensive, high-ceiling model does the part where intelligence compounds (understanding, judging, specifying). Cheaper models do the execution. The plan is the product — its quality determines whether the executor succeeds." (improve SKILL.md, intro)

> "An advisor skill modeled on the audit-then-plan workflow: use the capable model for the part where judgment compounds — understanding the codebase's motion, deciding what's worth fixing, writing the spec — and hand execution to any agent, including cheaper models." (improve-animations SKILL.md, intro)

**Plans written for a zero-context executor, plans/ as the only writable surface, hard read-only rule.**

> "Every plan must be fully self-contained. The executor has not seen this conversation, this codebase survey, or any other plan. If a plan references 'the pattern discussed above,' it is broken." (improve SKILL.md, Hard Rules)

> "The executor may be a less capable model with zero context and zero taste — the plan must contain everything, exactly." (improve-animations PLAN-TEMPLATE.md, header)

> "**Never modify source code.** The only files you create or edit live under `plans/`…" (improve-animations SKILL.md, Hard Rules)

**Vet-then-gate before writing plans.**

> "Vet before presenting — subagents over-report. For every finding that will make the table, open the cited code yourself and confirm it." (improve SKILL.md, Phase 3)

> "Then **stop and wait for the user to select** which findings become plans. If running non-interactively, default to the top 3–5 by leverage." (improve-animations SKILL.md, Phase 3)

**Drift-proofing the handoff.**

> "Before writing anything: record `git rev-parse --short HEAD` — every plan stamps the commit it was written against (the executor uses it for drift detection)." (improve SKILL.md, Phase 4)

## Points of contention

**Explicit sibling pointers vs. silent boundaries.** better-ui names its sibling:

> "Typography (text wrapping, font smoothing, tabular numbers, spacing) is covered by the `better-typography` skill — use that for anything text-related." (better-ui SKILL.md, body)

…while better-typography and better-colors never name a sibling; their extraction agents both confirmed "no passage … references sibling skills by name; scope boundaries are drawn only implicitly, by what the skill declines to prescribe." improve-animations sits between: it names its diff-review sibling once — "It does ONE thing: survey animation and motion code… It does not review a single diff (that's `review-animations`)" — a soft one-directional pointer, matching this repo's forge doctrine (blast radius of one skill).

## The rough edge

Three things these sources add beyond priors. First, Jakub's separation is less about splitting domains than about a **family convention**: identical anatomy and — most transferably — a shared, verbatim review-output contract (Before/After tables grouped by principle, exhaustive, diff-friendly) that makes three skills read as one system. This repo's skills separate concerns already (disposition / stack contract / perceived speed) but have no shared review-output contract. Second, the audit→plan→execute pattern's real delta is not "plan first" but the machinery that makes a model split safe: plans as the only writable surface, weakest-plausible-executor writing standard, commit-stamped drift detection, vet-before-present, and a hard stop-for-selection gate. Third — directly relevant to the openspec question — both plan skills achieve spec-driven handoff **without any spec framework**: `plans/` + an index + drift stamps is the entire system.

## Open questions

- Does the audit→plan→execute pattern earn a repo-native artifact when `improve` is already installed at machine scope and does the generic job? (Forge's don't-reinvent rule: use as-is / fork and sharpen / build new — deliberately.)
- Should the family review-output contract be added to the review modes of design-engineer / shadcn-tailwind / speed-daemon — and if so, per-skill or as one shared convention?
- Would splitting design-engineer (layout/motion/polish/taste) into sibling skills contradict the repo's "fewer artifacts" trajectory and multiply probe/pin/changelog overhead per artifact?
- None of the sources address probes, pins, or absorption-driven deletion — the executor-handoff plans have no analogue of this repo's provenance discipline; if a fork happens, that layer must come from here.
