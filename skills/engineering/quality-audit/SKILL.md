---
name: quality-audit
description: |
  Stack-aware, read-only quality audit for a JavaScript/TypeScript web repo. Detects the stack (Next.js, React, shadcn, Tailwind v4, Motion) from package.json, runs real verification (lint, typecheck, build, react-doctor), then routes a dimensional review (correctness, Next.js, React performance, web vitals, shadcn/Tailwind, design polish, motion performance, accessibility, security and best practices, server-side security and data exposure, state integrity and failure handling, components, view transitions) into one P0/P1/P2 report with file:line and a concrete fix per finding. Read-only by default; opt into P0-only fixes on a branch with `mode: fix`. Use for a whole-repo quality, design, accessibility, or performance audit, a pre-ship review, or a scheduled quality scan. For a single file or diff, a diff-scoped review fits better than this whole-repo pass.
disable-model-invocation: true
argument-hint: '[mode: fix]'
---

# Quality audit

Default "review my repo" is one ad-hoc pass: it finds the obvious and misses systematically, claims checks passed without running them, and starts editing. This skill redirects the audit to **detect the stack → run the lenses that stack demands → verify with real commands → triage by ship-impact** — and to **stay read-only** until you explicitly ask for fixes. The dimension checklists are the lens contents; the routing, the honest verification, and the severity triage are the work.

## Mode — set before anything

- **`audit` (default):** report only. No file writes, no commits, no PRs. Tools used: Read, Grep, Glob, and read-only Bash.
- **`fix`:** only when the invocation literally says `mode: fix`. **P0 findings only**, on a **new branch off main**, re-running lint + build after. No drive-by refactors, no P1/P2 fixes.

If the invocation doesn't say `mode: fix`, you are in audit mode — do not edit.

## Step 0 — Orient (let detection pick the lenses)

1. Read intent files if present: `CLAUDE.md`, `AGENTS.md`, `README.md`, `CONTRIBUTING.md`. They scope what "quality" means here.
2. Read `package.json` — `scripts`, `packageManager`, dependencies.
3. Detect the stack and **scope the review to what applies**:

| Signal | Apply the dimension |
| :--- | :--- |
| `next` in deps | Next.js (App Router, RSC, metadata, cache) |
| `components.json` | shadcn — check its `base` field for Base UI vs Radix |
| Tailwind v4 (`tailwindcss@4`, `@theme` in CSS) | Tailwind v4 token discipline |
| `cacheComponents` / `experimental.ppr` | Cache Components / PPR review |
| `motion` / `framer-motion` | Motion performance |
| `vitest` / `jest` / `playwright` | run tests if fast |
| route handlers (`app/**/route.*`, `pages/api/`), `"use server"`, or a DB/auth/BaaS SDK (Supabase, Firebase, Prisma, Drizzle, Auth.js, Clerk) | Server-side security & data exposure |
| no React | skip React, RSC, shadcn, component, and VT dimensions |

4. Find the design tokens: `app/globals.css`, `src/index.css`, or `tailwind.config.*`. Read `@theme` **before** judging any className.
5. Map routes / entrypoints (`app/`, `pages/`, `src/routes/`).

## Step 1 — Verify (run real commands, report honestly)

Use the repo's package manager (from `packageManager` or the lockfile — `pnpm` / `npm` / `yarn` / `bun`).

- Run, when the script exists: `lint` / `format` / `typecheck`; `build` (apps and libraries with a build step); `test` **only if fast (< 2 min)** — otherwise note it as skipped.
- React or Next present → prefer `bun run doctor` / `bun run doctor:diff` (or the repo's equivalent) when those scripts exist; otherwise `npx -y react-doctor@latest . --verbose` (add `--diff` for changed-files-vs-main scope). If `doctor.config.json` or a **React Doctor** section in `CLAUDE.md` documents intentional suppressions, do not report those as findings. If the tool is unavailable or you're offline, say so and move on.

**Honesty rule (load-bearing):** record each check as pass/fail with the **actual error quoted**. State explicitly anything you did **not** run and why (script absent, too slow, offline). Never report a check as passing that you didn't run — a fabricated green check is worse than an admitted gap.

## Step 2 — Route the dimensional review

For each applicable dimension, apply its checklist in [references/dimensions.md](references/dimensions.md) — that is where the depth lives. Note which dimensions you actually applied and which you skipped, and why.

Every finding gets: **`file:line`**, a one-sentence *why*, a concrete *fix*, and a severity — **P0** (ship blocker / build error / critical a11y), **P1** (should fix), **P2** (polish).

| Dimension | Applies when | The check that matters most |
| :--- | :--- | :--- |
| Correctness & tooling | always | every lint/type error ≥ P1; build failure = P0 |
| Next.js | `next` present | RSC default; await async route APIs; cache discipline |
| React performance | React present | fetch waterfalls, bundle bloat, over-serialization |
| Web vitals (code level) | any web UI | unsized media; LCP image priority; font-display; third-party script strategy |
| shadcn + Tailwind | `components.json` / Tailwind | read `@theme` first; no `px`/`#hex`; `render` not `asChild` |
| Design & polish | any UI | concentric radii, `tabular-nums`, `min-h-dvh`, `focus-visible` |
| Motion performance | animations present | purpose/frequency, interruption, render cost, reduced-motion, runtime evidence |
| Accessibility | any UI | accessible names; keyboard + visible focus; native over `role` |
| Security & best practices | always | vulnerable deps and unsanitized HTML sinks = P0; security headers; SRI on CDN scripts |
| Server-side security & data exposure | server code or DB/auth SDK present | authn + authz re-checked inside every route handler / server action; IDs from session, not request; RLS on; secrets never client-reachable |
| State integrity & failure handling | mutations or async data | non-idempotent mutations guarded client- and server-side; loading/error/empty on every async surface; effects cleaned up; stale responses can't clobber newer state |
| Components | component code | compose over boolean-prop explosion; controlled only when the parent needs it |
| View transitions | VT code only | `default="none"`; nav-level only; reduced-motion CSS |
| Project rules | always | apply only rules that actually exist here (this repo's `CLAUDE.md` / `.cursor/rules/` / `AGENTS.md`) — assume no template |

For a large repo, the dimensions can be fanned out across subagents — but the default is a single read-through pass; reach for parallelism only when one context can't hold the repo.

## Step 3 — Report

```markdown
# Quality audit — {repo} — {YYYY-MM-DD}

**Stack:** Next.js 15 · shadcn (Base UI) · Tailwind v4 · Motion
**Scope:** whole repo | changed-vs-main
**Mode:** audit | fix
**Verification:** lint ✅ · typecheck ✅ · build ❌ · tests skipped (>2 min) · react-doctor 82/100

## Summary
2–4 sentences: overall health, and the one thing to fix first.

## P0 — ship blockers
| Issue | Location | Why | Fix |
| --- | --- | --- | --- |

## P1 — should fix
| Issue | Location | Why | Fix |
| --- | --- | --- | --- |

## P2 — polish
| Issue | Location | Why | Fix |
| --- | --- | --- | --- |

## UI polish (Before | After)
### {Principle — e.g. Concentric radii}
| Before | After |
| --- | --- |

## Project rule gaps
Only if this repo's own rules (CLAUDE.md / CONTRIBUTING / .cursor/rules) were violated.

## Next step
One sentence.
```

Omit any section with no findings. Skip dimensions that don't apply and say so ("N/A — no React").

## Boundaries

- **audit (default):** no writes — Read / Grep / Glob / read-only Bash only.
- **fix:** P0 only; branch from main first; re-run lint + build after; no drive-by refactors.
- For applying fixes to a **diff** rather than the whole repo, a diff-scoped review or cleanup pass fits better; this skill's `fix` mode is the whole-repo P0 complement, not a diff-level fixer.
- Never invent URLs, credentials, product copy, or verification results.
- Don't migrate UI or animation libraries unless the invocation asks for it; apply rules within the existing stack.
- The read-only default is **behavioral**, not enforced. For a hard guarantee, gate `Edit`/`Write` with a PreToolUse hook.

## See also

- [references/dimensions.md](references/dimensions.md) — the full per-dimension checklists.
- [references/automation.md](references/automation.md) — running this on a schedule (Cursor Automation / cron) and the trigger bodies.
