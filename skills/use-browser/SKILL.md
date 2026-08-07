---
name: use-browser
description: "Drive a browser to reproduce a reported bug or check a web UI change against its acceptance criteria, and report what was exercised and what passed. Use after building or changing a component, route, layout, style, or animation; when asked whether a UI change works, holds up, or looks right; or when a reported bug needs reproducing before a fix. Covers preflight checks on the browser tooling, which states to exercise for each kind of change, what evidence each claim needs, and how to report checks that were not run."
---

# use-browser

Drive a browser to check a UI change, then report what was exercised and what was not.

This file holds no command reference. The tooling ships its own, matched to the installed version, and the table below says where to read it.

## Preflight

Before the first browser command of a session:

```bash
agent-browser --version && npm view agent-browser version && agent-browser skills list
```

- **Missing CLI** — `npm i -g agent-browser`, then `agent-browser install` for its browser.
- **Behind the registry** — upgrade first. The CLI serves documentation matching its own version, so a stale binary reports a stale capability set.
- **Capability inventory** — the listing enumerates what the installed version can do. Read it rather than working from a remembered set.

Then read the project's `agent-browser.json` and `~/.agent-browser/config.json` where present. Project values override user values, and a key absent from the project file inherits the user one. Options already set there — React DevTools, screenshot directory, content boundaries, output caps — do not need repeating as flags.

`agent-browser doctor` diagnoses launch failures, stale daemons, and version mismatches; `--fix` attempts repairs.

## Where the mechanics live

| For | Read |
| :-- | :-- |
| Snapshots, refs, interaction, waiting, sessions, auth, network, video | `agent-browser skills get core`; `--full` adds the complete command and flag reference |
| Exact syntax of one command | `--help` on that command |
| Exploratory testing, bug hunts, QA of a whole app with a repro-evidence report | `agent-browser skills get dogfood` |
| React introspection, Suspense classification, Web Vitals, accessibility audits, real mobile Safari, Electron, cloud providers | Whatever `agent-browser skills list` reports, then get that entry |
| Framework APIs, conventions, rendering behaviour | The docs the framework bundles into the project; Next.js 16.2+ ships them under `node_modules/next/dist/docs/` |
| A named error and its fixes | Its page under `nextjs.org/docs/messages/`, which carries the patterns, the trade-offs between fixes, and the gotchas. Any docs URL takes a `.md` suffix for markdown |
| Routes, compilation state, server logs | The running dev server's own interface, rather than a full production build |

Some capabilities are enabled at launch rather than mid-session, so read before the first command.

## Scope

Skip the browser when the change has no rendered consequence — a type-only edit, a comment, a rename with no visual result. Say so and stop.

Use an already-running dev server rather than starting a second one; frameworks commonly record the live port and PID in a lockfile for this. A second server on another port serves a different build.

Intercepting or slowing requests belongs against a local or disposable development runtime, not production.

## Modes

- **Reproduce** — a bug is reported and not yet confirmed. Drive to the reported state before changing code, and capture the failing behaviour as the baseline. When it does not reproduce, report that with the steps tried, the URL, and the browser and viewport used, rather than changing code speculatively.
- **Verify** — a change is in place. Drive the affected paths and check them against the acceptance criteria stated in the issue, spec, or PR. Where none are stated, use the table below.

## What to exercise, by change type

Take the rows that apply.

| Changed | Exercise |
| :-- | :-- |
| Menu, dialog, popover, combobox, sheet | Keyboard-only operation end to end, Escape, focus returning to the trigger on close, click or tap outside, two instances in sequence, scroll behaviour behind the overlay — against the [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) pattern for that widget |
| Layout or responsive behaviour | The narrowest supported width as a named number, the width where layout changes, longest realistic content, 200% zoom, measured overflow |
| Motion or transition | Interruption mid-flight and reversal, repeat firing, `prefers-reduced-motion`, exit timing separately from enter |
| Server data, caching, rendering boundary | Loading, error, and empty states; whether the static shell renders before streamed content |
| Form | Empty required fields, rapid double submit, validation messages programmatically associated with inputs, network failure mid-submit |
| Theme, tokens, colour | Light and dark, contrast at the new values, forced-colors where supported |
| Changing numeric values | Layout shift as digit widths change |

Console output and an accessibility audit over the changed subtree are cheap on any change and surface things a visual pass does not.

## States local development does not produce on its own

- **Loading and streaming fallbacks** — skipped when data resolves in milliseconds locally. Provoke them by intercepting the request or slowing the data source.
- **Error and empty states** — need a failed or emptied request; `network route --abort` blocks a matching pattern.
- **Interrupted interactions** — a scripted sequence completes each step before starting the next.
- **Engine differences** — device emulation changes viewport and user agent, not the rendering engine.
- **Cold load** — hot module reload preserves state a fresh load discards.

## Evidence per claim

| Claim | Evidence |
| :-- | :-- |
| Compiles | The scoped type or compile check, named |
| Renders correctly | The route at the relevant state, read as structure rather than only captured as an image |
| Works on phones | The named narrow width at a realistic height, with target sizes measured under coarse pointer |
| Accessible | Keyboard path walked end to end plus an automated audit, each finding checked against the primitive's rendered semantics |
| Animation is right | The interaction run, interrupted, reversed, and repeated under reduced motion |
| Fast | Measured metrics on a cold load |
| Loading state works | The fallback observed with the request intercepted |
| Nothing regressed | Neighbouring surfaces sharing the changed component or layout, re-rendered |

A screenshot does not carry source order, keyboard order, overflow measurements, or interruption behaviour.

## Reporting

Grade each finding: **P0** blocks a user from completing something; **P1** works but degrades or misleads; **P2** isolated polish. Label how each was reached — **observed** in the rendered result, **inferred** across observations with the confirming check named, a deliberate **decision**, or **unverified**. Distinguish an inferred P0 from a reproduced one. Reproduce a finding before restructuring code around it.

List the checks that were not run, and what would run them.

Where the result will be read by a person — a PR, a handoff, a reported bug — include what they can look at without re-running anything: a screenshot per state, or a recording where sequence, motion, or timing is the point. Write them to the project's configured screenshot or artifact directory.

Where the change is meant to match the product, compare against the product's own equivalent surfaces rather than a general standard, and name the surface compared.

## Real device

Real mobile Safari runs through the iOS Simulator and needs its own toolchain; check availability rather than assuming, and read the CLI's docs for current setup. Use device emulation first.

Escalate when a defect reports on iOS but does not reproduce in emulation, or when the change touches viewport units against dynamic browser chrome, safe-area insets, input zoom, overscroll, sticky positioning, backdrop filters, date or file inputs, or media autoplay. If the toolchain is unavailable, say so rather than substituting emulation.

## Session hygiene

- One diagnosed retry per failure, then continue without that evidence and name the gap.
- Close task-owned sessions and stop task-owned servers.
- Cookies, HAR files, screenshots, videos, and saved browser state can carry credentials and personal data. Keep them out of commits.

Where this file and a tool's current documentation disagree, follow the documentation. Reference snapshot: 2026-08-04.

## Standing pointer

For the check to run on every UI change in a repository, that repository needs the pointer in its own agent instructions. [`templates/AGENTS.snippet.md`](templates/AGENTS.snippet.md) is the text, marker-delimited for in-place updates. Place it outside any block another tool manages.

## Sources

> This skill draws inspiration from publicly available content from [agent-browser](https://agent-browser.dev), [Next.js](https://nextjs.org), [W3C](https://www.w3.org), and [Deque](https://www.deque.com).
