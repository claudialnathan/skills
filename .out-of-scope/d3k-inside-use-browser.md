# `use-browser` will not take over the dev server with dev3000

[dev3000 / d3k](https://github.com/vercel-labs/dev3000) wraps the same browser-automation CLI `use-browser` already drives, under a runtime that owns the dev server and unifies server output, browser console, network activity, interactions and screenshots into one timeline (`d3k errors --context`). That correlation is the one thing browser automation alone does not produce. Assessed for `use-browser` on 2026-08-07 and declined — on placement, not on quality.

## Why this is out of scope

Adopting it inside `use-browser` means the skill kills the dev server the owner is already running:

- **No documented attach mode.** `--servers-only` disables browser monitoring; `-p` / `-s` / `-c` / `--app-url` all configure a server d3k starts itself. There is no documented way to point it at a process that is already up.
- **The takeover is one-way.** d3k's own skill says to stop it only when asked or when the task needs a clean restart, and says nothing about restoring a prior server. The port does not go back.
- **The concurrency rule is d3k's; the takeover semantics would be ours.** Its skill prohibits running another dev server alongside it, but it does not instruct a takeover and carries no permission step. Anything that stops the owner's server would be a behaviour this repository invented and attributed to the tool.
- **It is the wrong tier.** A runtime takeover is a blast-radius decision, which the invocation-tier rule assigns to the command tier. Putting a runtime permission prompt inside an action-tier skill routes around that rule rather than satisfying it.

Payoff also concentrates in reproduce-and-diagnose work and is thin in verification, which is where `use-browser` spends most of its time.

## What would change this

A documented attach mode — d3k observing a server it did not start — removes the whole objection, and the capability could then land in `use-browser` with no tier problem.

Separately, the correlated-timeline capability is still wanted as its **own command-tier skill** that stops the current server, starts d3k, and hands back. That is parked rather than refused; the row is in `TASKS.md`. `use-browser` changes by zero lines either way.

Assessed against agent-browser 0.33.2 and d3k's then-current documentation, 2026-08-07. d3k requires Node 24+.
